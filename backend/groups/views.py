from rest_framework import viewsets

from common.audit import audited
from common.permissions import HasModulePermission
from foundation.views import SoftDeleteDestroyMixin
from groups.filters import GroupFilter, GroupMemberFilter
from groups.models import Group, GroupMember
from groups.serializers import GroupMemberSerializer, GroupSerializer

GROUP_PERMISSION_MAP = {
    "list": ("groups", "view"),
    "retrieve": ("groups", "view"),
    "create": ("groups", "create"),
    "update": ("groups", "update"),
    "partial_update": ("groups", "update"),
    "destroy": ("groups", "delete"),
}


class GroupViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    queryset = Group.objects.all().select_related("branch", "course", "teacher__user").order_by("-created_at")
    serializer_class = GroupSerializer
    permission_classes = [HasModulePermission]
    filterset_class = GroupFilter
    search_fields = ["name", "code", "room"]
    entity_type = "group"
    permission_map = GROUP_PERMISSION_MAP

    @audited(action="create", entity_type="group")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @audited(action="delete", entity_type="group")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class GroupMemberViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    queryset = GroupMember.objects.all().select_related("student_profile__user", "group__course").order_by("-created_at")
    serializer_class = GroupMemberSerializer
    permission_classes = [HasModulePermission]
    filterset_class = GroupMemberFilter
    entity_type = "group_member"
    permission_map = GROUP_PERMISSION_MAP
