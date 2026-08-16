"""Model-level tests plus API-level tests for exams' ownership/read-scoping
rules — same "real login, not just ORM objects" reasoning as
homework/tests/test_homework.py: HasModulePermission and the ownership
checks both read from request.user.

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
from exams.models import Exam, ExamResult
from foundation.models import Organization, Role, User, UserRole
from groups.models import Group
from student.models import StudentProfile
from teacher.models import TeacherProfile

pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)

BYPASS_ALIAS = "auth_bypass_rls"


def _make_org():
    org_id = uuid.uuid4()
    with db_transaction.atomic():
        apply_org_context(str(org_id))
        return Organization.objects.using(BYPASS_ALIAS).create(
            id=org_id, name="Org", slug=f"org-exam-test-{uuid.uuid4().hex[:8]}", email="a@example.com"
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


def test_teacher_cannot_create_exam_for_another_teachers_group():
    org = _make_org()
    teacher_a_user = _make_login(org, "+998900400001", "teacher")
    teacher_a = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_a_user, teacher_code="TCH-A")
    teacher_b_user = _make_login(org, "+998900400002", "teacher")
    TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_b_user, teacher_code="TCH-B")
    group_a = _make_group(org, teacher_a, "GRP-A")

    client = APIClient()
    _login(client, teacher_b_user)
    response = client.post(
        "/api/v1/exams/",
        {"organization": str(org.id), "group": str(group_a.id), "title": "Mid-term", "date": "2026-09-10", "start_time": "10:00:00"},
        format="json",
    )
    assert response.status_code == 403


def test_student_cannot_create_exam():
    org = _make_org()
    teacher_user = _make_login(org, "+998900400003", "teacher")
    teacher = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_user, teacher_code="TCH-C")
    group = _make_group(org, teacher, "GRP-C")
    student_user = _make_login(org, "+998900400004", "student")
    StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=student_user, student_code="STU-A")

    client = APIClient()
    _login(client, student_user)
    response = client.post(
        "/api/v1/exams/",
        {"organization": str(org.id), "group": str(group.id), "title": "Mid-term", "date": "2026-09-10", "start_time": "10:00:00"},
        format="json",
    )
    assert response.status_code == 403


def test_exam_reads_are_not_row_scoped():
    """Deliberate design: an Exam is schedule metadata, not personal data —
    any authenticated user with exams:view sees every exam in the org, same
    as schedule.Lesson/homework.Assignment. Only ExamResult (the grade) is
    row-scoped — see test_student_cannot_see_classmates_exam_results below.
    """
    org = _make_org()
    teacher_a_user = _make_login(org, "+998900400005", "teacher")
    teacher_a = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_a_user, teacher_code="TCH-D")
    teacher_b_user = _make_login(org, "+998900400006", "teacher")
    group_a = _make_group(org, teacher_a, "GRP-D")
    exam = Exam.objects.using(BYPASS_ALIAS).create(organization=org, group=group_a, title="Mid-term", date="2026-09-10", start_time="10:00:00")

    client = APIClient()
    _login(client, teacher_b_user)
    response = client.get(f"/api/v1/exams/{exam.id}/")
    assert response.status_code == 200


def test_teacher_cannot_enter_results_for_another_teachers_exam():
    org = _make_org()
    teacher_a_user = _make_login(org, "+998900400007", "teacher")
    teacher_a = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_a_user, teacher_code="TCH-E")
    teacher_b_user = _make_login(org, "+998900400008", "teacher")
    TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_b_user, teacher_code="TCH-F")
    group_a = _make_group(org, teacher_a, "GRP-E")
    exam = Exam.objects.using(BYPASS_ALIAS).create(organization=org, group=group_a, title="Mid-term", date="2026-09-10", start_time="10:00:00")
    student_user = _make_login(org, "+998900400009", "student")
    student = StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=student_user, student_code="STU-B")

    client = APIClient()
    _login(client, teacher_b_user)
    response = client.post(
        "/api/v1/exams/results/",
        {"organization": str(org.id), "exam": str(exam.id), "student_profile": str(student.id), "score": 80},
        format="json",
    )
    assert response.status_code == 403


def test_student_cannot_see_classmates_exam_results():
    org = _make_org()
    teacher_user = _make_login(org, "+998900400010", "teacher")
    teacher = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_user, teacher_code="TCH-G")
    group = _make_group(org, teacher, "GRP-F")
    exam = Exam.objects.using(BYPASS_ALIAS).create(organization=org, group=group, title="Mid-term", date="2026-09-10", start_time="10:00:00")

    student_a_user = _make_login(org, "+998900400011", "student")
    student_a = StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=student_a_user, student_code="STU-C")
    student_b_user = _make_login(org, "+998900400012", "student")
    student_b = StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=student_b_user, student_code="STU-D")

    ExamResult.objects.using(BYPASS_ALIAS).create(organization=org, exam=exam, student_profile=student_a, score=90)
    result_b = ExamResult.objects.using(BYPASS_ALIAS).create(organization=org, exam=exam, student_profile=student_b, score=70)

    client = APIClient()
    _login(client, student_a_user)

    list_response = client.get(f"/api/v1/exams/results/?exam={exam.id}")
    assert list_response.status_code == 200
    ids = [r["id"] for r in list_response.json()["data"]["results"]]
    assert str(result_b.id) not in ids

    detail_response = client.get(f"/api/v1/exams/results/{result_b.id}/")
    assert detail_response.status_code == 404


def test_teacher_grading_stamps_graded_by_and_graded_at():
    org = _make_org()
    teacher_user = _make_login(org, "+998900400013", "teacher")
    teacher = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_user, teacher_code="TCH-H")
    group = _make_group(org, teacher, "GRP-G")
    student_user = _make_login(org, "+998900400014", "student")
    student = StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=student_user, student_code="STU-E")
    exam = Exam.objects.using(BYPASS_ALIAS).create(organization=org, group=group, title="Mid-term", date="2026-09-10", start_time="10:00:00", max_score=100)

    client = APIClient()
    _login(client, teacher_user)
    response = client.post(
        "/api/v1/exams/results/",
        {"organization": str(org.id), "exam": str(exam.id), "student_profile": str(student.id), "score": 85},
        format="json",
    )
    assert response.status_code == 201
    body = response.json()["data"]
    assert body["score"] == 85
    assert body["graded_by"] == str(teacher_user.id)
    assert body["graded_at"] is not None


def test_score_cannot_exceed_max_score():
    org = _make_org()
    teacher_user = _make_login(org, "+998900400015", "teacher")
    teacher = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_user, teacher_code="TCH-I")
    group = _make_group(org, teacher, "GRP-H")
    student_user = _make_login(org, "+998900400016", "student")
    student = StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=student_user, student_code="STU-F")
    exam = Exam.objects.using(BYPASS_ALIAS).create(organization=org, group=group, title="Mid-term", date="2026-09-10", start_time="10:00:00", max_score=50)

    client = APIClient()
    _login(client, teacher_user)
    response = client.post(
        "/api/v1/exams/results/",
        {"organization": str(org.id), "exam": str(exam.id), "student_profile": str(student.id), "score": 99},
        format="json",
    )
    assert response.status_code == 400


def test_duplicate_exam_result_is_rejected():
    org = _make_org()
    teacher_user = _make_login(org, "+998900400017", "teacher")
    teacher = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_user, teacher_code="TCH-J")
    group = _make_group(org, teacher, "GRP-I")
    student_user = _make_login(org, "+998900400018", "student")
    student = StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=student_user, student_code="STU-G")
    exam = Exam.objects.using(BYPASS_ALIAS).create(organization=org, group=group, title="Mid-term", date="2026-09-10", start_time="10:00:00")
    ExamResult.objects.using(BYPASS_ALIAS).create(organization=org, exam=exam, student_profile=student, score=70)

    with pytest.raises(IntegrityError):
        ExamResult.objects.using(BYPASS_ALIAS).create(organization=org, exam=exam, student_profile=student, score=80)


def test_teacher_can_mark_exam_completed_and_cancelled():
    org = _make_org()
    teacher_user = _make_login(org, "+998900400019", "teacher")
    teacher = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_user, teacher_code="TCH-K")
    group = _make_group(org, teacher, "GRP-J")
    exam = Exam.objects.using(BYPASS_ALIAS).create(organization=org, group=group, title="Mid-term", date="2026-09-10", start_time="10:00:00")

    client = APIClient()
    _login(client, teacher_user)

    response = client.patch(f"/api/v1/exams/{exam.id}/", {"status": "completed"}, format="json")
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "completed"

    response = client.patch(f"/api/v1/exams/{exam.id}/", {"status": "cancelled"}, format="json")
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "cancelled"


def test_teacher_cannot_delete_exam():
    """No exams:delete grant for teacher — matches attendance/schedule's
    convention of admin-only delete, cancel-via-status-update for teachers.
    """
    org = _make_org()
    teacher_user = _make_login(org, "+998900400020", "teacher")
    teacher = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_user, teacher_code="TCH-L")
    group = _make_group(org, teacher, "GRP-K")
    exam = Exam.objects.using(BYPASS_ALIAS).create(organization=org, group=group, title="Mid-term", date="2026-09-10", start_time="10:00:00")

    client = APIClient()
    _login(client, teacher_user)
    response = client.delete(f"/api/v1/exams/{exam.id}/")
    assert response.status_code == 403


def test_soft_delete_never_hard_deletes():
    org = _make_org()
    teacher_user = _make_login(org, "+998900400021", "teacher")
    teacher = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=teacher_user, teacher_code="TCH-M")
    group = _make_group(org, teacher, "GRP-L")
    exam = Exam.objects.using(BYPASS_ALIAS).create(organization=org, group=group, title="Mid-term", date="2026-09-10", start_time="10:00:00")
    exam_id = exam.id

    exam.delete(using=BYPASS_ALIAS)

    assert not Exam.objects.using(BYPASS_ALIAS).filter(id=exam_id).exists()
    assert Exam.all_objects.using(BYPASS_ALIAS).filter(id=exam_id).exists()
    assert Exam.all_objects.using(BYPASS_ALIAS).get(id=exam_id).deleted_at is not None
