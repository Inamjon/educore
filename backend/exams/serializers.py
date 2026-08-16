from django.utils import timezone
from rest_framework import serializers

from exams.models import Exam, ExamResult
from groups.models import GroupMember


class ExamSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source="group.name", read_only=True)

    class Meta:
        model = Exam
        fields = [
            "id", "organization", "group", "group_name", "title", "date", "start_time", "duration_minutes",
            "room", "max_score", "question_count", "status", "created_by", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            validated_data["created_by"] = request.user.id
        return super().create(validated_data)


class ExamResultSerializer(serializers.ModelSerializer):
    exam_title = serializers.CharField(source="exam.title", read_only=True)
    student_name = serializers.CharField(source="student_profile.user.get_full_name", read_only=True)

    class Meta:
        model = ExamResult
        fields = [
            "id", "organization", "exam", "exam_title", "student_profile", "student_name", "score",
            "graded_by", "graded_at", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "graded_by", "graded_at", "created_at", "updated_at"]

    def validate(self, attrs):
        exam = attrs.get("exam") or getattr(self.instance, "exam", None)
        score = attrs.get("score")
        if exam is not None and score is not None and score > exam.max_score:
            raise serializers.ValidationError({"score": f"Score cannot exceed the exam's max score ({exam.max_score})."})

        if self.instance is None:
            student_profile = attrs.get("student_profile")
            if exam is not None and student_profile is not None:
                if ExamResult.objects.filter(exam=exam, student_profile=student_profile).exists():
                    raise serializers.ValidationError("A result already exists for this student on this exam.")
                # _check_owns_group (ExamResultViewSet) only verifies the
                # teacher teaches the exam's group — it says nothing about
                # whether this particular student is actually enrolled in
                # it. Without this, any student_profile in the org could be
                # attached to the exam's roster by id.
                if not GroupMember.objects.filter(
                    group=exam.group, student_profile=student_profile, status="active"
                ).exists():
                    raise serializers.ValidationError(
                        {"student_profile": "This student is not an active member of the exam's group."}
                    )

        return attrs

    @staticmethod
    def _stamp_grading(validated_data, request):
        """Grading (`score` newly set) stamps `graded_by`/`graded_at`
        server-side — never trust a client-sent timestamp for a server-owned
        fact. Same pattern as SubmissionSerializer.update(). Shared by
        create() and update() below so the two can't drift on when exactly
        a score counts as "graded".
        """
        if request is not None and request.user.is_authenticated:
            validated_data["graded_by"] = request.user.id
            validated_data["graded_at"] = timezone.now()

    def create(self, validated_data):
        """Stamping a score at creation time counts as grading too — same
        rule as update() below.
        """
        request = self.context.get("request")
        if validated_data.get("score") is not None:
            self._stamp_grading(validated_data, request)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if "score" in validated_data and validated_data["score"] != instance.score:
            self._stamp_grading(validated_data, request)
        return super().update(instance, validated_data)
