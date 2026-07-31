import getpass

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

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
        parser.add_argument("--email", required=False, help="Optional contact email (not used for login).")
        parser.add_argument("--phone", required=False)
        parser.add_argument(
            "--password", required=False, help="If omitted, you'll be prompted (recommended: don't pass via CLI)."
        )

    @transaction.atomic
    def handle(self, *args, **options):
        password = options.get("password") or getpass.getpass("Password: ")
        if not password:
            raise CommandError("A password is required.")

        platform_org, _ = Organization.objects.get_or_create(
            slug=PLATFORM_ORG_SLUG,
            defaults={
                "name": "EduCore Platform",
                "email": "platform@educore.internal",
                "status": "active",
                "subscription_plan": "enterprise",
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
            email=options.get("email") or None,
            phone=options.get("phone") or None,
            status="active",
            password=password,
        )

        UserRole.objects.create(user=user, role=super_admin_role, organization=platform_org)

        self.stdout.write(self.style.SUCCESS(f"Super admin created. login_id={user.login_id}"))
