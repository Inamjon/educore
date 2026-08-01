from rest_framework import serializers

from foundation.models import Branch, Organization, Permission, Role, User


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = [
            "id", "name", "slug", "legal_name", "tax_id", "logo_url", "website",
            "email", "phone", "address_line1", "address_line2", "city", "state",
            "country", "postal_code", "timezone", "locale", "currency", "status",
            "subscription_plan", "max_students", "max_teachers", "max_branches",
            "trial_ends_at", "subscription_ends_at", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class BranchSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)

    class Meta:
        model = Branch
        fields = [
            "id", "organization", "organization_name", "name", "code", "phone", "email",
            "address_line1", "address_line2", "city", "state", "country", "postal_code",
            "latitude", "longitude", "timezone", "is_main", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ["id", "module", "action", "description"]
        read_only_fields = ["id"]


class RoleSerializer(serializers.ModelSerializer):
    permission_ids = serializers.PrimaryKeyRelatedField(
        source="role_permissions",
        many=True,
        read_only=True,
        default=[],
    )

    class Meta:
        model = Role
        fields = [
            "id", "organization", "name", "slug", "description",
            "is_system", "is_active", "permission_ids", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "is_system", "created_at", "updated_at"]


class UserSerializer(serializers.ModelSerializer):
    """Covers the "Administrators" surface on the Super-Admin frontend:
    name/phone/center/branch/role/status. Password is write-only and
    optional on update (blank means "keep current", matching the frontend
    form's "leave blank to keep current" pattern already built).
    """

    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role_ids = serializers.PrimaryKeyRelatedField(
        source="user_roles", queryset=Role.objects.all(), many=True, required=False, write_only=True
    )
    roles = serializers.SerializerMethodField(read_only=True)
    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "organization", "branch", "login_id", "member_code",
            "first_name", "last_name", "middle_name", "full_name", "phone",
            "password", "avatar_url", "gender", "date_of_birth", "status", "language",
            "role_ids", "roles", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "login_id", "member_code", "created_at", "updated_at"]

    def get_roles(self, obj):
        return [
            {"id": str(ur.role_id), "name": ur.role.name, "slug": ur.role.slug}
            for ur in obj.user_roles.select_related("role").all()
        ]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        role_ids = validated_data.pop("user_roles", [])
        if not password:
            raise serializers.ValidationError({"password": "Password is required to create a user."})
        user = User.objects.create_user(password=password, **validated_data)
        self._sync_roles(user, role_ids)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        role_ids = validated_data.pop("user_roles", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        if role_ids is not None:
            self._sync_roles(instance, role_ids)
        return instance

    def _sync_roles(self, user, roles):
        from foundation.models import UserRole

        if not roles:
            return
        UserRole.objects.filter(user=user).exclude(role__in=roles).delete()
        for role in roles:
            UserRole.objects.get_or_create(user=user, role=role, organization=user.organization)
