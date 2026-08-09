"""Sequential platform-invoice numbering (`PINV-<year>-<seq>`) — platform-
wide, not per-organization (unlike `finance.numbering.generate_invoice_number`,
which is per-org: this is EduCore's own invoice to a center, not a center's
invoice to its own student). Same `select_for_update`-locked pattern as
`finance/numbering.py`, just without the organization filter.
"""

from django.db import transaction
from django.utils import timezone


def generate_platform_invoice_number(model_cls) -> str:
    year = timezone.now().year
    prefix = f"PINV-{year}-"
    manager = model_cls.all_objects if hasattr(model_cls, "all_objects") else model_cls.objects

    with transaction.atomic():
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
