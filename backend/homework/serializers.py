from django.utils import timezone
from rest_framework import serializers

from groups.models import GroupMember
from homework.models import Assignment, Submission


class AssignmentSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source="group.name", read_only=True)
    total_students = serializers.SerializerMethodField()
    submitted_count = serializers.SerializerMethodField()
    graded_count = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            "id", "organization", "group", "group_name", "title", "description", "due_date", "max_score", "status",
            "created_by", "total_students", "submitted_count", "graded_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def get_total_students(self, obj) -> int:
        return GroupMember.objects.filter(group_id=obj.group_id, status="active").count()

    def get_submitted_count(self, obj) -> int:
        return obj.submissions.count()

    def get_graded_count(self, obj) -> int:
        return obj.submissions.filter(score__isnull=False).count()

    def create(self, validated_data):
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            validated_data["created_by"] = request.user.id
        return super().create(validated_data)


class SubmissionSerializer(serializers.ModelSerializer):
    assignment_title = serializers.CharField(source="assignment.title", read_only=True)
    student_name = serializers.CharField(source="student_profile.user.get_full_name", read_only=True)
    is_late = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = [
            "id", "organization", "assignment", "assignment_title", "student_profile", "student_name", "content",
            "submitted_at", "score", "feedback", "graded_by", "graded_at", "is_late", "created_at",
        ]
        read_only_fields = ["id", "submitted_at", "graded_by", "graded_at", "created_at"]

    def get_is_late(self, obj) -> bool:
        return obj.submitted_at.date() > obj.assignment.due_date

    def validate(self, attrs):
        assignment = attrs.get("assignment") or getattr(self.instance, "assignment", None)
        score = attrs.get("score")
        if assignment is not None and score is not None and score > assignment.max_score:
            raise serializers.ValidationError({"score": f"Score cannot exceed the assignment's max score ({assignment.max_score})."})
        return attrs

    def update(self, instance, validated_data):
        """Grading (`score` newly set/changed) stamps `graded_by`/`graded_at`
        server-side — same reasoning as Notification.read/read_at: never
        trust a client-sent timestamp for a server-owned fact.
        """
        request = self.context.get("request")
        if "score" in validated_data and validated_data["score"] != instance.score:
            if request is not None and request.user.is_authenticated:
                validated_data["graded_by"] = request.user.id
            validated_data["graded_at"] = timezone.now()
        return super().update(instance, validated_data)
