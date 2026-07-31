import django_filters

from foundation.models import Branch, Organization, User


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
