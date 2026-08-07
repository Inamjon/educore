from rest_framework import serializers

from course.models import Course


class CourseSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True, default=None)
    group_count = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id", "organization", "branch", "branch_name", "name", "code", "category", "level",
            "description", "duration_weeks", "total_lessons", "price", "currency", "status", "color",
            "group_count", "student_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "code", "created_at", "updated_at"]

    def get_group_count(self, obj) -> int:
        return obj.groups.count()

    def get_student_count(self, obj) -> int:
        from groups.models import GroupMember

        return GroupMember.objects.filter(group__course=obj, status="active").count()

    def create(self, validated_data):
        from common.codegen import generate_unique_code

        validated_data["code"] = generate_unique_code(Course, validated_data["organization"], validated_data["name"])
        return super().create(validated_data)
