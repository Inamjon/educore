import django_filters

from groups.models import Group, GroupMember


class GroupFilter(django_filters.FilterSet):
    class Meta:
        model = Group
        fields = ["organization", "branch", "course", "teacher", "status"]


class GroupMemberFilter(django_filters.FilterSet):
    class Meta:
        model = GroupMember
        fields = ["group", "student_profile", "status"]
