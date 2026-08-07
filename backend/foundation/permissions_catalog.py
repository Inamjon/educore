"""Canonical (module, action) catalog — kept in sync with every
`permission_map`/`required_permission` actually referenced in the codebase
(grep for `permission_map = {` across every app). Not the aspirational list
in `database/15-seed-and-recommendations.sql`, which predates several
implementation decisions (e.g. that file uses action "read" and a "users"
module; the real code uses "view" and "administrators" — see
`foundation/views.py::UserViewSet`) and includes modules for apps that don't
exist yet (homework, exams, ...). Extend this list — and the data
migration that loads it — as new apps/ViewSets are added.
"""

PERMISSIONS_CATALOG: list[tuple[str, str, str]] = [
    # (module, action, description)
    ("organizations", "view", "View organizations"),
    ("organizations", "create", "Create organizations"),
    ("organizations", "update", "Update organizations"),
    ("organizations", "delete", "Delete organizations"),
    ("branches", "view", "View branches"),
    ("branches", "create", "Create branches"),
    ("branches", "update", "Update branches"),
    ("branches", "delete", "Delete branches"),
    ("administrators", "view", "View administrator accounts"),
    ("administrators", "create", "Create administrator accounts"),
    ("administrators", "update", "Update administrator accounts"),
    ("administrators", "delete", "Delete administrator accounts"),
    ("roles", "view", "View roles and permissions"),
    ("students", "view", "View student profiles"),
    ("students", "create", "Create student profiles"),
    ("students", "update", "Update student profiles"),
    ("students", "delete", "Delete student profiles"),
    ("teachers", "view", "View teacher profiles"),
    ("teachers", "create", "Create teacher profiles"),
    ("teachers", "update", "Update teacher profiles"),
    ("teachers", "delete", "Delete teacher profiles"),
    ("courses", "view", "View courses"),
    ("courses", "create", "Create courses"),
    ("courses", "update", "Update courses"),
    ("courses", "delete", "Delete courses"),
    ("groups", "view", "View groups"),
    ("groups", "create", "Create groups"),
    ("groups", "update", "Update groups"),
    ("groups", "delete", "Delete groups"),
    ("attendance", "view", "View attendance records"),
    ("attendance", "create", "Mark attendance"),
    ("attendance", "update", "Update attendance records"),
    ("attendance", "delete", "Delete attendance records"),
    ("finance", "view", "View invoices and payments"),
    ("finance", "create", "Create invoices and record payments"),
    ("finance", "update", "Update invoices"),
    ("finance", "delete", "Delete invoices"),
]

# Default permission grants for the three org-scoped roles every
# organization gets on creation (see foundation/services.py::
# provision_default_roles). Deliberately narrower than a literal reading of
# database/15-seed-and-recommendations.sql's global role templates — those
# use organization_id IS NULL for teacher/student/administrator roles too,
# which would make foundation.is_platform_user() (checks ONLY
# organization_id IS NULL, not slug) grant every teacher and student
# cross-organization visibility. Real per-org roles avoid that.
DEFAULT_ROLE_PERMISSIONS: dict[str, list[tuple[str, str]]] = {
    "center_admin": [
        ("organizations", "view"),
        ("organizations", "update"),
        ("branches", "view"),
        ("branches", "create"),
        ("branches", "update"),
        ("branches", "delete"),
        ("administrators", "view"),
        ("administrators", "create"),
        ("administrators", "update"),
        ("administrators", "delete"),
        ("students", "view"),
        ("students", "create"),
        ("students", "update"),
        ("students", "delete"),
        ("teachers", "view"),
        ("teachers", "create"),
        ("teachers", "update"),
        ("teachers", "delete"),
        ("courses", "view"),
        ("courses", "create"),
        ("courses", "update"),
        ("courses", "delete"),
        ("groups", "view"),
        ("groups", "create"),
        ("groups", "update"),
        ("groups", "delete"),
        ("attendance", "view"),
        ("attendance", "create"),
        ("attendance", "update"),
        ("attendance", "delete"),
        # finance is deliberately center_admin-only — unlike every other
        # module, no other role gets even :view. Permission grants here are
        # module-wide, not object-scoped, so a "teacher" grant would mean
        # every teacher can see every student's balance, not just their own.
        # No portal but Admin has a Finance UI to wire anyway.
        ("finance", "view"),
        ("finance", "create"),
        ("finance", "update"),
        ("finance", "delete"),
        ("roles", "view"),
    ],
    "teacher": [
        ("students", "view"),
        ("teachers", "view"),
        # "update" here is deliberately still safe org-wide at the module
        # level — TeacherProfileViewSet.perform_update further restricts a
        # teacher (not center_admin) to their OWN profile only, mirroring
        # AttendanceViewSet's teacher-owns-group check. Needed for the
        # Teacher Portal's Profile page to save bio/education/etc.
        ("teachers", "update"),
        ("courses", "view"),
        ("groups", "view"),
        ("attendance", "view"),
        ("attendance", "create"),
        ("attendance", "update"),
        ("roles", "view"),
    ],
    "student": [
        ("students", "view"),
        ("courses", "view"),
        ("groups", "view"),
        ("attendance", "view"),
        ("roles", "view"),
    ],
}

DEFAULT_ROLE_NAMES: dict[str, str] = {
    "center_admin": "Center Admin",
    "teacher": "Teacher",
    "student": "Student",
}
