"""Model-level tests plus API-level tests for homework's ownership/grading
rules — same "real login, not just ORM objects" reasoning as
attendance/tests/test_attendance_authorization.py: HasModulePermission and
the ownership checks both read from request.user.

Fixture setup goes through the auth_bypass_rls alias throughout — see
finance/tests/test_finance.py's module docstring for why, under
`transaction=True`, this is what's needed.
"""

import uuid

import pytest
from django.db import IntegrityError
from django.db import transaction as db_transaction
from rest_framework.test import APIClient

from common.context import apply_org_context
from course.models import Course
from foundation.models import Organization, Role, User, UserRole
from groups.models import Group, GroupMember
from homework.models import Assignment, Submission
from student.models import StudentProfile
from teacher.models import TeacherProfile

pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)

BYPASS_ALIAS = "auth_bypass_rls"


def _make_org():
    org_id = uuid.uuid4()
    with db_transaction.atomic():
        apply_org_context(str(org_id))
        return Organization.objects.using(BYPASS_ALIAS).create(
            id=org_id, name="Org", slug=f"org-hw-test-{uuid.uuid4().hex[:8]}", email="a@example.com"
        )


def _make_login(org, phone, role_slug):
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="U", last_name=phone[-4:], password="pw123456", phone=phone, status="active",
    )
    role = Role.objects.using(BYPASS_ALIAS).get(organization=org, slug=role_slug)
    UserRole.objects.using(BYPASS_ALIAS).create(user=user, role=role, organization=org)
    return user


def _login(client, user):
    response = client.post("/api/v1/auth/login/", {"login_id": user.login_id, "password": "pw123456"}, format="json")
    assert response.status_code == 200
    return response


def _make_group(org, teacher, code):
    course = Course.objects.using(BYPASS_ALIAS).create(organization=org, name="Course", code=f"CRS-{code}", category="General")
    return Group.objects.using(BYPASS_ALIAS).create(
        organization=org, course=course, teacher=teacher, code=code, name=code, start_date="2026-09-01"
    )


def test_teacher_cannot_create_assignment_for_another_teachers_group():
    org = _make_org()
    teacher_a_user = _make_login(org, "+998900300001", "teacher")
    teacher_a = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_a_user, teacher_code="TCH-A")
    teacher_b_user = _make_login(org, "+998900300002", "teacher")
    TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_b_user, teacher_code="TCH-B")
    group_a = _make_group(org, teacher_a, "GRP-A")

    client = APIClient()
    _login(client, teacher_b_user)
    response = client.post(
        "/api/v1/homework/assignments/",
        {"organization": str(org.id), "group": str(group_a.id), "title": "HW1", "due_date": "2026-09-10"},
        format="json",
    )
    assert response.status_code == 403


def test_student_cannot_submit_on_behalf_of_another_student():
    """A crafted payload with someone else's student_profile is ignored, not
    validated-and-rejected — SubmissionViewSet.perform_create overwrites it
    with the caller's own profile outright, see the matching comment there.
    """
    org = _make_org()
    teacher_user = _make_login(org, "+998900300003", "teacher")
    teacher = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_user, teacher_code="TCH-C")
    group = _make_group(org, teacher, "GRP-C")

    student_a_user = _make_login(org, "+998900300004", "student")
    student_a = StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=student_a_user, student_code="STU-A")
    student_b_user = _make_login(org, "+998900300005", "student")
    student_b = StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=student_b_user, student_code="STU-B")
    GroupMember.objects.using(BYPASS_ALIAS).create(organization=org, group=group, student_profile=student_a)
    GroupMember.objects.using(BYPASS_ALIAS).create(organization=org, group=group, student_profile=student_b)

    assignment = Assignment.objects.using(BYPASS_ALIAS).create(organization=org, group=group, title="HW1", due_date="2026-09-10")

    client = APIClient()
    _login(client, student_a_user)
    response = client.post(
        "/api/v1/homework/submissions/",
        {"organization": str(org.id), "assignment": str(assignment.id), "student_profile": str(student_b.id), "content": "cheating"},
        format="json",
    )
    assert response.status_code == 201
    assert response.json()["data"]["student_profile"] == str(student_a.id)


def test_student_cannot_see_classmates_submissions():
    org = _make_org()
    teacher_user = _make_login(org, "+998900300006", "teacher")
    teacher = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_user, teacher_code="TCH-D")
    group = _make_group(org, teacher, "GRP-D")

    student_a_user = _make_login(org, "+998900300007", "student")
    student_a = StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=student_a_user, student_code="STU-C")
    student_b_user = _make_login(org, "+998900300008", "student")
    student_b = StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=student_b_user, student_code="STU-D")

    assignment = Assignment.objects.using(BYPASS_ALIAS).create(organization=org, group=group, title="HW1", due_date="2026-09-10")
    Submission.objects.using(BYPASS_ALIAS).create(organization=org, assignment=assignment, student_profile=student_a, content="A's answer")
    submission_b = Submission.objects.using(BYPASS_ALIAS).create(organization=org, assignment=assignment, student_profile=student_b, content="B's answer")

    client = APIClient()
    _login(client, student_a_user)

    list_response = client.get(f"/api/v1/homework/submissions/?assignment={assignment.id}")
    assert list_response.status_code == 200
    ids = [s["id"] for s in list_response.json()["data"]["results"]]
    assert str(submission_b.id) not in ids

    detail_response = client.get(f"/api/v1/homework/submissions/{submission_b.id}/")
    assert detail_response.status_code == 404


def test_student_cannot_edit_after_grading():
    org = _make_org()
    teacher_user = _make_login(org, "+998900300009", "teacher")
    teacher = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_user, teacher_code="TCH-E")
    group = _make_group(org, teacher, "GRP-E")

    student_user = _make_login(org, "+998900300010", "student")
    student = StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=student_user, student_code="STU-E")
    assignment = Assignment.objects.using(BYPASS_ALIAS).create(organization=org, group=group, title="HW1", due_date="2026-09-10")
    submission = Submission.objects.using(BYPASS_ALIAS).create(
        organization=org, assignment=assignment, student_profile=student, content="first answer", score=90,
    )

    client = APIClient()
    _login(client, student_user)
    response = client.patch(
        f"/api/v1/homework/submissions/{submission.id}/", {"content": "trying to edit after grading"}, format="json"
    )
    assert response.status_code == 403


def test_teacher_grading_stamps_graded_by_and_graded_at():
    org = _make_org()
    teacher_user = _make_login(org, "+998900300011", "teacher")
    teacher = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_user, teacher_code="TCH-F")
    group = _make_group(org, teacher, "GRP-F")

    student_user = _make_login(org, "+998900300012", "student")
    student = StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=student_user, student_code="STU-F")
    assignment = Assignment.objects.using(BYPASS_ALIAS).create(organization=org, group=group, title="HW1", due_date="2026-09-10", max_score=100)
    submission = Submission.objects.using(BYPASS_ALIAS).create(organization=org, assignment=assignment, student_profile=student, content="answer")

    client = APIClient()
    _login(client, teacher_user)
    response = client.patch(
        f"/api/v1/homework/submissions/{submission.id}/", {"score": 85, "feedback": "Good work"}, format="json"
    )
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["score"] == 85
    assert body["graded_by"] == str(teacher_user.id)
    assert body["graded_at"] is not None


def test_score_cannot_exceed_max_score():
    org = _make_org()
    teacher_user = _make_login(org, "+998900300013", "teacher")
    teacher = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_user, teacher_code="TCH-G")
    group = _make_group(org, teacher, "GRP-G")
    student_user = _make_login(org, "+998900300014", "student")
    student = StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=student_user, student_code="STU-G")
    assignment = Assignment.objects.using(BYPASS_ALIAS).create(organization=org, group=group, title="HW1", due_date="2026-09-10", max_score=50)
    submission = Submission.objects.using(BYPASS_ALIAS).create(organization=org, assignment=assignment, student_profile=student, content="answer")

    client = APIClient()
    _login(client, teacher_user)
    response = client.patch(f"/api/v1/homework/submissions/{submission.id}/", {"score": 99}, format="json")
    assert response.status_code == 400


def test_duplicate_submission_is_rejected():
    org = _make_org()
    teacher_user = _make_login(org, "+998900300015", "teacher")
    teacher = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_user, teacher_code="TCH-H")
    group = _make_group(org, teacher, "GRP-H")
    student_user = _make_login(org, "+998900300016", "student")
    student = StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=student_user, student_code="STU-H")
    assignment = Assignment.objects.using(BYPASS_ALIAS).create(organization=org, group=group, title="HW1", due_date="2026-09-10")
    Submission.objects.using(BYPASS_ALIAS).create(organization=org, assignment=assignment, student_profile=student, content="first")

    with pytest.raises(IntegrityError):
        Submission.objects.using(BYPASS_ALIAS).create(organization=org, assignment=assignment, student_profile=student, content="second")


def test_soft_delete_never_hard_deletes():
    org = _make_org()
    teacher_user = _make_login(org, "+998900300017", "teacher")
    teacher = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_user, teacher_code="TCH-I")
    group = _make_group(org, teacher, "GRP-I")
    assignment = Assignment.objects.using(BYPASS_ALIAS).create(organization=org, group=group, title="HW1", due_date="2026-09-10")
    assignment_id = assignment.id

    assignment.delete(using=BYPASS_ALIAS)

    assert not Assignment.objects.using(BYPASS_ALIAS).filter(id=assignment_id).exists()
    assert Assignment.all_objects.using(BYPASS_ALIAS).filter(id=assignment_id).exists()
    assert Assignment.all_objects.using(BYPASS_ALIAS).get(id=assignment_id).deleted_at is not None
