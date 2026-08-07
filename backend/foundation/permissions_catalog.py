"""Canonical (module, action) catalog — kept in sync with every
`permission_map`/`required_permission` actually referenced in the codebase
(grep for `permission_map = {` across every app). Not the aspirational list
in `database/15-seed-and-recommendations.sql`, which predates several
implementation decisions (e.g. that file uses action "read" and a "users"
module; the real code uses "view" and "administrators" — see
`foundation/views.py::UserViewSet`) and includes modules for apps that don't
exist yet (homework, exams, ...). Extend this list — and the data
migration that loads it — as new apps/ViewSets are added.

`notifications`, `schedule`, `assignments`, and `submissions` were added
2026-08-07. `audit_logs` was added the same day, for the read-only
Super-Admin/Admin Audit Logs surface — see `foundation/views.py::AuditLogViewSet`.
`exams` is deliberately still not here — out of scope for that pass,
possibly getting dropped from the product entirely; don't add it without
checking first.
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
    ("notifications", "view", "View own notifications"),
    ("notifications", "create", "Send notifications"),
    ("notifications", "update", "Mark own notifications read/unread"),
    ("notifications", "delete", "Delete own notifications"),
    ("schedule", "view", "View lessons"),
    ("schedule", "create", "Schedule lessons"),
    ("schedule", "update", "Update/cancel lessons"),
    ("schedule", "delete", "Delete lessons"),
    ("assignments", "view", "View homework assignments"),
    ("assignments", "create", "Create homework assignments"),
    ("assignments", "update", "Update homework assignments"),
    ("assignments", "delete", "Delete homework assignments"),
    ("submissions", "view", "View homework submissions"),
    ("submissions", "create", "Submit homework"),
    ("submissions", "update", "Update/grade homework submissions"),
    ("submissions", "delete", "Delete homework submissions"),
    ("audit_logs", "view", "View audit logs"),
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
        ("notifications", "view"),
        ("notifications", "create"),
        ("notifications", "update"),
        ("notifications", "delete"),
        ("schedule", "view"),
        ("schedule", "create"),
        ("schedule", "update"),
        ("schedule", "delete"),
        ("assignments", "view"),
        ("assignments", "create"),
        ("assignments", "update"),
        ("assignments", "delete"),
        ("submissions", "view"),
        ("submissions", "create"),
        ("submissions", "update"),
        ("submissions", "delete"),
        # audit_logs is deliberately center_admin-only, same reasoning as
        # finance — it's org-wide security/change history, not something a
        # teacher or student grant should ever cover.
        ("audit_logs", "view"),
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
        ("notifications", "view"),
        ("notifications", "create"),
        ("notifications", "update"),
        ("notifications", "delete"),
        ("schedule", "view"),
        # No "schedule:delete" — same convention as attendance: a teacher
        # cancels a lesson via a status update, not a hard/soft delete.
        ("schedule", "create"),
        ("schedule", "update"),
        # No "assignments:delete" either, same reasoning — matches
        # attendance's precedent of admin-only delete.
        ("assignments", "view"),
        ("assignments", "create"),
        ("assignments", "update"),
        # Teachers grade (update) submissions but never create/delete one —
        # only the student who owns a submission does that.
        ("submissions", "view"),
        ("submissions", "update"),
        ("roles", "view"),
    ],
    "student": [
        ("students", "view"),
        ("courses", "view"),
        ("groups", "view"),
        ("attendance", "view"),
        ("notifications", "view"),
        ("notifications", "update"),
        ("notifications", "delete"),
        ("schedule", "view"),
        ("assignments", "view"),
        # A student creates/updates only their OWN submission —
        # SubmissionViewSet enforces that at the object level, same pattern
        # as AttendanceViewSet's teacher-owns-group check.
        ("submissions", "view"),
        ("submissions", "create"),
        ("submissions", "update"),
        ("roles", "view"),
    ],
}

DEFAULT_ROLE_NAMES: dict[str, str] = {
    "center_admin": "Center Admin",
    "teacher": "Teacher",
    "student": "Student",
}
