import django_filters

from foundation.models import AuditLog, Branch, Organization, User


class OrganizationFilter(django_filters.FilterSet):
    class Meta:
        model = Organization
        fields = ["status", "subscription_plan", "country"]


class BranchFilter(django_filters.FilterSet):
    class Meta:
        model = Branch
        fields = ["organization", "is_active"]


class UserFilter(django_filters.FilterSet):
    role = django_filters.CharFilter(field_name="user_roles__role__slug", distinct=True)

    class Meta:
        model = User
        fields = ["organization", "branch", "status", "role"]


class AuditLogFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    date_to = django_filters.DateFilter(field_name="created_at", lookup_expr="date__lte")

    class Meta:
        model = AuditLog
        fields = ["organization", "user", "action", "entity_type", "date_from", "date_to"]
