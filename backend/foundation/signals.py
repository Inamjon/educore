from django.db.models.signals import post_save
from django.dispatch import receiver

from foundation.models import Organization
from foundation.services import provision_default_roles


@receiver(post_save, sender=Organization)
def provision_roles_for_new_organization(sender, instance, created, **kwargs):
    if created:
        provision_default_roles(instance)
