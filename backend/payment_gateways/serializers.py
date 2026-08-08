from rest_framework import serializers

from payment_gateways.models import PaymentGatewayAccount


class PaymentGatewayAccountSerializer(serializers.ModelSerializer):
    """`secret_key` is write-only and never echoed back — the API only ever
    reports whether one is configured (`has_secret_key`). Sending a blank/
    omitted `secret_key` on update leaves the stored value untouched, so the
    Admin UI can resubmit merchant_id/is_active without forcing the admin to
    re-paste the secret every time.
    """

    secret_key = serializers.CharField(write_only=True, required=False, allow_blank=True)
    has_secret_key = serializers.SerializerMethodField()

    class Meta:
        model = PaymentGatewayAccount
        fields = [
            "id", "organization", "provider", "merchant_id", "service_id", "secret_key", "has_secret_key",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_has_secret_key(self, obj) -> bool:
        return bool(obj.secret_key)

    def validate(self, attrs):
        provider = attrs.get("provider") or getattr(self.instance, "provider", None)
        if provider == "click":
            # "service_id" in attrs, not attrs.get(...) — a PATCH explicitly
            # clearing the field (service_id: null) must be judged on that
            # explicit None, not silently fall back to the pre-update
            # instance value (which would let the clear through unnoticed).
            effective_service_id = attrs["service_id"] if "service_id" in attrs else getattr(self.instance, "service_id", None)
            if not effective_service_id:
                raise serializers.ValidationError({"service_id": "service_id is required for Click."})
        if not self.instance and not attrs.get("secret_key"):
            raise serializers.ValidationError({"secret_key": "This field is required."})
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            validated_data["created_by"] = request.user.id
            validated_data["updated_by"] = request.user.id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if not validated_data.get("secret_key"):
            validated_data.pop("secret_key", None)
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            validated_data["updated_by"] = request.user.id
        return super().update(instance, validated_data)
