from rest_framework import serializers

from billing.models import SubscriptionPlan


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
