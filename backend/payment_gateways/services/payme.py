"""Payme Merchant API — the JSON-RPC methods Payme's servers call on our
webhook endpoint once a user has confirmed payment on the redirect link
built by services/checkout.py. Error codes -31050..-31099 are the range
Payme's spec reserves for the merchant to define itself; everything outside
that range (-32601, -32700, -32504) is Payme's own fixed protocol code.

Not attempting byte-exact parity with Payme's official certification test
suite (that requires their real sandbox — see the plan's Verification
section) — this implements the well-documented happy path, auth failure,
amount/state mismatches, and idempotent replay, which is what the test
suite in tests/test_payme_webhook.py exercises.
"""

from __future__ import annotations

import time as time_module
from datetime import datetime, timezone as dt_timezone

from django.db import transaction as db_transaction
from django.utils import timezone

from finance.models import Invoice, Payment
from finance.services import invoice_balance, recompute_invoice_status
from payment_gateways.models import GatewayTransaction

ERR_INVALID_AMOUNT = -31001
ERR_TRANSACTION_NOT_FOUND = -31003
ERR_UNABLE_TO_CANCEL = -31007
ERR_ALREADY_PAID = -31008
ERR_ACCOUNT_NOT_FOUND = -31050
ERR_AUTH = -32504
ERR_METHOD_NOT_FOUND = -32601
ERR_INVALID_REQUEST = -32600

STATE_CREATED = 1
STATE_PERFORMED = 2
STATE_CANCELLED_BEFORE_PERFORM = -1
STATE_CANCELLED_AFTER_PERFORM = -2


class PaymeError(Exception):
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


def _now_ms() -> int:
    return int(time_module.time() * 1000)


def _require(params: dict, key: str):
    """Payme authenticates via HTTP Basic, independent of body content — a
    request with valid credentials but a missing/malformed field (a
    certification probe, a truncated retry) must not crash with a raw
    KeyError/TypeError; it should get back Payme's own JSON-RPC error shape.
    """
    value = params.get(key)
    if value is None:
        raise PaymeError(ERR_INVALID_REQUEST, f"Missing required field: {key}.")
    return value


def to_multilang_message(text: str) -> dict:
    """Payme's spec wants error `message` as a {ru,uz,en} object — we don't
    maintain real translations, so all three keys carry the same English
    text (still spec-shaped, just not localized)."""
    return {"ru": text, "uz": text, "en": text}


def _find_by_merchant_trans_id(gateway_account, account: dict) -> GatewayTransaction:
    merchant_trans_id = (account or {}).get("merchant_trans_id")
    txn = GatewayTransaction.objects.filter(
        organization_id=gateway_account.organization_id, provider="payme", merchant_trans_id=merchant_trans_id
    ).first()
    if txn is None:
        raise PaymeError(ERR_ACCOUNT_NOT_FOUND, "Order not found.")
    return txn


def _find_by_provider_id(gateway_account, transaction_id: str) -> GatewayTransaction:
    txn = GatewayTransaction.objects.filter(
        organization_id=gateway_account.organization_id, provider="payme", provider_transaction_id=transaction_id
    ).first()
    if txn is None:
        raise PaymeError(ERR_TRANSACTION_NOT_FOUND, "Transaction not found.")
    return txn


def _check_amount(txn: GatewayTransaction, amount_tiyin: int) -> None:
    expected = int(txn.amount * 100)
    if amount_tiyin != expected:
        raise PaymeError(ERR_INVALID_AMOUNT, "Amount does not match the invoice balance.")


def check_perform_transaction(gateway_account, params: dict) -> dict:
    txn = _find_by_merchant_trans_id(gateway_account, params.get("account"))
    if txn.status not in ("initiated", "pending"):
        raise PaymeError(ERR_ACCOUNT_NOT_FOUND, "Order has already been paid or cancelled.")
    _check_amount(txn, params.get("amount"))
    return {"allow": True}


def create_transaction(gateway_account, params: dict) -> dict:
    provider_id = _require(params, "id")
    existing = GatewayTransaction.objects.filter(
        organization_id=gateway_account.organization_id, provider="payme", provider_transaction_id=provider_id
    ).first()
    if existing is not None:
        # Idempotent replay: Payme retried CreateTransaction with the same id
        # (network retry) — return the same state, don't create a second row.
        return {
            "create_time": _now_ms() if existing.created_at is None else int(existing.created_at.timestamp() * 1000),
            "transaction": str(existing.id),
            "state": existing.provider_state or STATE_CREATED,
        }

    txn = _find_by_merchant_trans_id(gateway_account, params.get("account"))
    if txn.status not in ("initiated",):
        raise PaymeError(ERR_ACCOUNT_NOT_FOUND, "Order has already been paid or cancelled.")
    _check_amount(txn, params.get("amount"))

    txn.provider_transaction_id = provider_id
    txn.status = "pending"
    txn.provider_state = STATE_CREATED
    txn.raw_payload = params
    txn.save(update_fields=["provider_transaction_id", "status", "provider_state", "raw_payload", "updated_at"])

    return {"create_time": _now_ms(), "transaction": str(txn.id), "state": STATE_CREATED}


def perform_transaction(gateway_account, params: dict) -> dict:
    txn = _find_by_provider_id(gateway_account, _require(params, "id"))

    if txn.status == "success":
        # Idempotent replay: already performed, echo the same result.
        return {
            "transaction": str(txn.id),
            "perform_time": int(txn.performed_at.timestamp() * 1000) if txn.performed_at else _now_ms(),
            "state": STATE_PERFORMED,
        }
    if txn.status != "pending":
        raise PaymeError(ERR_UNABLE_TO_CANCEL, "Transaction is not in a performable state.")

    with db_transaction.atomic():
        # A student can open two checkout links for the same invoice (e.g.
        # Payme then Click, both left pending) — lock the invoice row and
        # re-check its balance right before crediting, so whichever gateway
        # settles second is rejected instead of double-crediting the invoice.
        invoice = Invoice.objects.select_for_update().get(pk=txn.invoice_id)
        if invoice_balance(invoice) < txn.amount:
            raise PaymeError(ERR_ALREADY_PAID, "This invoice has already been paid in full.")

        payment = Payment.objects.create(
            organization=txn.organization,
            invoice=invoice,
            student_profile=txn.student_profile,
            amount=txn.amount,
            currency=txn.currency,
            payment_method="payme",
        )
        recompute_invoice_status(invoice)

        now = timezone.now()
        txn.status = "success"
        txn.provider_state = STATE_PERFORMED
        txn.payment = payment
        txn.performed_at = now
        txn.save(update_fields=["status", "provider_state", "payment", "performed_at", "updated_at"])

    return {"transaction": str(txn.id), "perform_time": int(txn.performed_at.timestamp() * 1000), "state": STATE_PERFORMED}


def cancel_transaction(gateway_account, params: dict) -> dict:
    txn = _find_by_provider_id(gateway_account, _require(params, "id"))
    reason = params.get("reason")

    if txn.status == "cancelled":
        return {
            "transaction": str(txn.id),
            "cancel_time": int(txn.cancelled_at.timestamp() * 1000) if txn.cancelled_at else _now_ms(),
            "state": txn.provider_state,
        }

    with db_transaction.atomic():
        now = timezone.now()
        if txn.status == "success":
            # Money was already credited to our ledger — we never held the
            # funds ourselves (see plan Context), so there's nothing to
            # "refund" through Mentorio; this just corrects our own record to
            # match what Payme is telling us actually happened.
            if txn.payment_id:
                txn.payment.delete()  # soft-delete, SoftDeleteMixin
                recompute_invoice_status(txn.invoice)
                txn.payment = None  # don't leave a live FK pointing at a now soft-deleted Payment
            txn.provider_state = STATE_CANCELLED_AFTER_PERFORM
        else:
            txn.provider_state = STATE_CANCELLED_BEFORE_PERFORM

        txn.status = "cancelled"
        txn.cancelled_at = now
        txn.error_note = reason
        txn.save(update_fields=["status", "provider_state", "payment", "cancelled_at", "error_note", "updated_at"])

    return {"transaction": str(txn.id), "cancel_time": int(txn.cancelled_at.timestamp() * 1000), "state": txn.provider_state}


def check_transaction(gateway_account, params: dict) -> dict:
    txn = _find_by_provider_id(gateway_account, _require(params, "id"))
    return {
        "create_time": int(txn.created_at.timestamp() * 1000),
        "perform_time": int(txn.performed_at.timestamp() * 1000) if txn.performed_at else 0,
        "cancel_time": int(txn.cancelled_at.timestamp() * 1000) if txn.cancelled_at else 0,
        "transaction": str(txn.id),
        "state": txn.provider_state or STATE_CREATED,
        "reason": None,
    }


def get_statement(gateway_account, params: dict) -> dict:
    start = datetime.fromtimestamp(_require(params, "from") / 1000, tz=dt_timezone.utc)
    end = datetime.fromtimestamp(_require(params, "to") / 1000, tz=dt_timezone.utc)
    qs = GatewayTransaction.objects.filter(
        organization_id=gateway_account.organization_id,
        provider="payme",
        provider_transaction_id__isnull=False,
        created_at__gte=start,
        created_at__lte=end,
    ).order_by("created_at")

    transactions = [
        {
            "id": txn.provider_transaction_id,
            "time": int(txn.created_at.timestamp() * 1000),
            "amount": int(txn.amount * 100),
            "account": {"merchant_trans_id": txn.merchant_trans_id},
            "create_time": int(txn.created_at.timestamp() * 1000),
            "perform_time": int(txn.performed_at.timestamp() * 1000) if txn.performed_at else 0,
            "cancel_time": int(txn.cancelled_at.timestamp() * 1000) if txn.cancelled_at else 0,
            "transaction": str(txn.id),
            "state": txn.provider_state or STATE_CREATED,
            "reason": None,
        }
        for txn in qs
    ]
    return {"transactions": transactions}


METHODS = {
    "CheckPerformTransaction": check_perform_transaction,
    "CreateTransaction": create_transaction,
    "PerformTransaction": perform_transaction,
    "CancelTransaction": cancel_transaction,
    "CheckTransaction": check_transaction,
    "GetStatement": get_statement,
}
