from rest_framework import serializers

from schedule.models import Lesson


class LessonSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source="group.name", read_only=True)
    course_name = serializers.CharField(source="group.course.name", read_only=True, default=None)
    course_color = serializers.CharField(source="group.course.color", read_only=True, default=None)
    teacher_id = serializers.UUIDField(source="group.teacher_id", read_only=True)
    teacher_name = serializers.CharField(source="group.teacher.user.get_full_name", read_only=True)

    class Meta:
        model = Lesson
        fields = [
            "id", "organization", "group", "group_name", "course_name", "course_color", "teacher_id", "teacher_name",
            "date", "start_time", "end_time", "room", "topic", "status", "notes", "created_by", "updated_by",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "updated_by", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            validated_data["created_by"] = request.user.id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            validated_data["updated_by"] = request.user.id
        return super().update(instance, validated_data)
