"""Sequential platform-invoice numbering (`PINV-<year>-<seq>`) — platform-
wide, not per-organization (unlike `finance.numbering.generate_invoice_number`,
which is per-org: this is Mentorio's own invoice to a center, not a center's
invoice to its own student).

Because it's platform-wide, `select_for_update()` alone isn't enough the way
it is for finance's per-org version: the very first invoice of the year (or
of the whole table) has no existing row to lock, so two concurrent creates
for two *different* organizations could both read "no last invoice", both
compute the same next_seq, and collide on the unique invoice_number
constraint. A transaction-scoped Postgres advisory lock keyed by the year
prefix closes that gap — it serializes every caller for this prefix even
when there's nothing to `select_for_update()` yet, and releases automatically
at commit/rollback.
"""

from django.db import connection, transaction
from django.utils import timezone


def generate_platform_invoice_number(model_cls) -> str:
    year = timezone.now().year
    prefix = f"PINV-{year}-"
    manager = model_cls.all_objects if hasattr(model_cls, "all_objects") else model_cls.objects

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_xact_lock(hashtext(%s)::bigint)", [prefix])

        last = (
            manager.select_for_update()
            .filter(invoice_number__startswith=prefix)
            .order_by("-invoice_number")
            .first()
        )
        next_seq = 1
        if last is not None:
            try:
                next_seq = int(last.invoice_number.rsplit("-", 1)[-1]) + 1
            except ValueError:
                next_seq = manager.filter(invoice_number__startswith=prefix).count() + 1
        return f"{prefix}{next_seq:04d}"
