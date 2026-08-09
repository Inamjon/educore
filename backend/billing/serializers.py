from rest_framework import serializers

from billing.models import PlatformInvoice, PlatformPayment, SubscriptionPlan
from billing.numbering import generate_platform_invoice_number
from billing.services import platform_invoice_paid_amount


class SubscriptionPlanSummarySerializer(serializers.ModelSerializer):
    """Lightweight nested representation — used wherever a plan is embedded
    inside another resource (e.g. `foundation.OrganizationSerializer`'s
    `subscription_plan_detail`). Deliberately omits `active_count`
    (SubscriptionPlanSerializer's own field below): embedding the full
    serializer there would run one extra Organization-count query per row
    in an organization *list* response — fine for the Subscriptions page's
    own handful of plan rows, wasteful multiplied across every center.
    """

    class Meta:
        model = SubscriptionPlan
        fields = ["id", "name", "slug", "price", "billing_cycle", "max_branches", "max_students", "max_teachers"]
        read_only_fields = fields


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    active_count = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlan
        fields = [
            "id", "name", "slug", "price", "billing_cycle", "max_branches", "max_students", "max_teachers",
            "features", "is_active", "display_order", "active_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "active_count", "created_at", "updated_at"]

    def get_active_count(self, obj) -> int:
        from foundation.models import Organization

        return Organization.objects.filter(subscription_plan=obj).count()


class PlatformInvoiceSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    plan_name = serializers.CharField(source="subscription_plan.name", read_only=True)
    paid_amount = serializers.SerializerMethodField()
    balance = serializers.SerializerMethodField()

    class Meta:
        model = PlatformInvoice
        fields = [
            "id", "organization", "organization_name", "subscription_plan", "plan_name", "invoice_number",
            "status", "period_start", "period_end", "amount", "paid_amount", "balance", "currency", "due_date",
            "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "invoice_number", "status", "created_at", "updated_at"]

    def get_paid_amount(self, obj):
        return platform_invoice_paid_amount(obj)

    def get_balance(self, obj):
        return obj.amount - self.get_paid_amount(obj)

    def create(self, validated_data):
        validated_data["invoice_number"] = generate_platform_invoice_number(PlatformInvoice)
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            validated_data["created_by"] = request.user.id
        return super().create(validated_data)


class PlatformPaymentSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    invoice_number = serializers.CharField(source="platform_invoice.invoice_number", read_only=True)

    class Meta:
        model = PlatformPayment
        fields = [
            "id", "organization", "organization_name", "platform_invoice", "invoice_number", "amount", "currency",
            "method", "reference_note", "payment_date", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "organization", "payment_date", "created_at", "updated_at"]

    def validate(self, attrs):
        invoice = attrs.get("platform_invoice") or getattr(self.instance, "platform_invoice", None)
        if invoice is not None:
            attrs["organization"] = invoice.organization
            if not self.instance:
                remaining = invoice.amount - platform_invoice_paid_amount(invoice)
                if attrs["amount"] > remaining:
                    raise serializers.ValidationError(
                        {"amount": f"Amount exceeds the remaining balance ({remaining} {invoice.currency})."}
                    )
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            validated_data["recorded_by"] = request.user.id
        return super().create(validated_data)
