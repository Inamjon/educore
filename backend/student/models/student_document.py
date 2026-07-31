from django.db import models

from common.db import schema_table
from common.models import OrganizationScopedMixin, SoftDeleteMixin, TimestampedMixin, UUIDPrimaryKeyMixin

DOCUMENT_TYPE_CHOICES = [
    ("passport", "Passport"),
    ("birth_certificate", "Birth Certificate"),
    ("id_card", "ID Card"),
    ("transcript", "Transcript"),
    ("medical_record", "Medical Record"),
    ("photo", "Photo"),
    ("contract", "Contract"),
    ("other", "Other"),
]


class StudentDocument(UUIDPrimaryKeyMixin, TimestampedMixin, SoftDeleteMixin, OrganizationScopedMixin):
    student_profile = models.ForeignKey(
        "student.StudentProfile", on_delete=models.CASCADE, db_column="student_profile_id", related_name="documents"
    )
    file = models.ForeignKey(
        "foundation.File", null=True, blank=True, on_delete=models.SET_NULL, db_column="file_id", related_name="+"
    )
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    document_number = models.CharField(max_length=100, blank=True, null=True)
    issued_by = models.CharField(max_length=255, blank=True, null=True)
    issued_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        "foundation.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = schema_table("student", "student_documents")
        constraints = [
            models.CheckConstraint(
                condition=models.Q(expiry_date__isnull=True) | models.Q(expiry_date__gt=models.F("issued_date")),
                name="chk_student_docs_expiry",
            ),
        ]
        indexes = [
            models.Index(
                fields=["student_profile"], name="idx_student_documents_student", condition=models.Q(deleted_at__isnull=True)
            ),
            models.Index(
                fields=["organization", "document_type"],
                name="idx_student_documents_type",
                condition=models.Q(deleted_at__isnull=True),
            ),
        ]

    def __str__(self) -> str:
        return self.title
