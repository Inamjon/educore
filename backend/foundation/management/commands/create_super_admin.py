import getpass

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from billing.models import SubscriptionPlan
from foundation.models import Organization, Role, User, UserRole

PLATFORM_ORG_SLUG = "educore-platform"


class Command(BaseCommand):
    """Bootstraps a super-admin account. Not `createsuperuser` — this schema
    has no is_staff/is_superuser; "super admin" is a system-level Role
    (organization IS NULL) assignment instead (see plan decision 9).
    """

    help = "Create a super-admin user and assign the system-level super_admin role."

    def add_arguments(self, parser):
        parser.add_argument("--first-name", required=True)
        parser.add_argument("--last-name", required=True)
        parser.add_argument("--phone", required=True, help="foundation.User has no email field — phone is required.")
        parser.add_argument(
            "--password", required=False, help="If omitted, you'll be prompted (recommended: don't pass via CLI)."
        )

    @transaction.atomic
    def handle(self, *args, **options):
        password = options.get("password") or getpass.getpass("Password: ")
        if not password:
            raise CommandError("A password is required.")

        # subscription_plan is a FK into the dynamic billing.SubscriptionPlan
        # catalog now, not a literal string — the "enterprise" tier is
        # seeded by billing/migrations/0004_seed_plans.py, which always
        # runs before this command in a normal `migrate` then `create_super_admin`
        # flow. Falls back to None (no plan assigned) rather than erroring
        # if it's somehow missing — a super-admin bootstrap shouldn't hard
        # fail over billing metadata.
        enterprise_plan = SubscriptionPlan.objects.filter(slug="enterprise").first()

        platform_org, _ = Organization.objects.get_or_create(
            slug=PLATFORM_ORG_SLUG,
            defaults={
                "name": "Mentorio Platform",
                "email": "platform@educore.internal",
                "status": "active",
                "subscription_plan": enterprise_plan,
            },
        )

        super_admin_role, _ = Role.objects.get_or_create(
            organization=None,
            slug="super_admin",
            defaults={"name": "Super Administrator", "is_system": True, "is_active": True},
        )

        user = User.objects.create_user(
            organization=platform_org,
            first_name=options["first_name"],
            last_name=options["last_name"],
            phone=options["phone"],
            status="active",
            password=password,
        )

        UserRole.objects.create(user=user, role=super_admin_role, organization=platform_org)

        self.stdout.write(self.style.SUCCESS(f"Super admin created. login_id={user.login_id}"))
