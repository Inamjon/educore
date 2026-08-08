from decimal import Decimal

from django.db import migrations

# Slugs deliberately match the 6 literal string values
# `foundation.Organization.subscription_plan` used before it became a FK
# (see foundation's own migration that follows this one) — every existing
# organization's plan string is matched to one of these rows by slug, so
# nothing about an org's plan silently changes meaning during that
# migration. `price == 0` renders as "Custom" in the frontend (pre-existing
# convention in app/super-admin/subscriptions/page.tsx); a limit of 999
# renders as "unlimited" there too (`isUnlimited = (n) => n >= 999`).
SEED_PLANS = [
    {
        "slug": "free", "name": "Free", "price": Decimal("0"), "billing_cycle": "monthly",
        "max_branches": 1, "max_students": 50, "max_teachers": 10,
        "features": ["Core LMS features"], "display_order": 0,
    },
    {
        "slug": "starter", "name": "Starter", "price": Decimal("49"), "billing_cycle": "monthly",
        "max_branches": 2, "max_students": 200, "max_teachers": 20,
        "features": ["Core LMS features", "Email notifications"], "display_order": 1,
    },
    {
        "slug": "basic", "name": "Basic", "price": Decimal("99"), "billing_cycle": "monthly",
        "max_branches": 3, "max_students": 500, "max_teachers": 30,
        "features": ["Core LMS features", "Email notifications", "Basic reports"], "display_order": 2,
    },
    {
        "slug": "pro", "name": "Pro", "price": Decimal("199"), "billing_cycle": "monthly",
        "max_branches": 10, "max_students": 2000, "max_teachers": 100,
        "features": ["Everything in Basic", "Advanced analytics", "Priority support"], "display_order": 3,
    },
    {
        "slug": "enterprise", "name": "Enterprise", "price": Decimal("499"), "billing_cycle": "monthly",
        "max_branches": 999, "max_students": 999999, "max_teachers": 999999,
        "features": ["Everything in Pro", "Unlimited branches", "Dedicated support", "API access"],
        "display_order": 4,
    },
    {
        "slug": "custom", "name": "Custom", "price": Decimal("0"), "billing_cycle": "monthly",
        "max_branches": 999, "max_students": 999999, "max_teachers": 999999,
        "features": ["Negotiated separately — contact sales"], "display_order": 5,
    },
]


def seed_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model("billing", "SubscriptionPlan")
    for plan in SEED_PLANS:
        SubscriptionPlan.objects.get_or_create(slug=plan["slug"], defaults=plan)


def unseed_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model("billing", "SubscriptionPlan")
    SubscriptionPlan.objects.filter(slug__in=[p["slug"] for p in SEED_PLANS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0003_seed_permissions"),
    ]

    operations = [
        migrations.RunPython(seed_plans, reverse_code=unseed_plans),
    ]
