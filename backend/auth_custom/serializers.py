from rest_framework import serializers

from auth_custom.models import Session


class LoginSerializer(serializers.Serializer):
    login_id = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False)


class SessionSerializer(serializers.ModelSerializer):
    current = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = [
            "id", "device_type", "device_name", "ip_address", "location",
            "last_activity_at", "created_at", "current",
        ]

    def get_current(self, obj) -> bool:
        current_session_id = self.context.get("current_session_id")
        return str(obj.id) == str(current_session_id)
