from django.utils import timezone
from rest_framework import serializers

from notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.get_full_name", read_only=True, default=None)

    class Meta:
        model = Notification
        fields = [
            "id", "organization", "recipient", "sender", "sender_name", "title", "message", "type", "category",
            "read", "read_at", "created_at",
        ]
        read_only_fields = ["id", "organization", "sender", "read_at", "created_at"]

    def validate_recipient(self, value):
        request = self.context.get("request")
        if request is not None and value.organization_id != request.user.organization_id:
            raise serializers.ValidationError("Recipient must belong to your organization.")
        return value

    def update(self, instance, validated_data):
        """Flip `read_at` alongside `read` server-side rather than trusting a
        client-sent timestamp — mirrors how `issued_date`/`payment_date` etc.
        are always server-derived elsewhere in this codebase, never client
        input.
        """
        if "read" in validated_data and validated_data["read"] != instance.read:
            validated_data["read_at"] = timezone.now() if validated_data["read"] else None
        return super().update(instance, validated_data)
