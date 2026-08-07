"""Builds the redirect link a student is sent to in order to pay an Invoice.
Deliberately makes zero outbound HTTP calls to Payme or Click — both
providers' standard integration is: the merchant builds this link itself
(from public, non-secret parameters) and redirects the browser to it; the
provider then contacts *us* via webhook once the user has paid. See
payment_gateways/views.py's PaymeWebhookView/ClickWebhookView for that side.
"""

from __future__ import annotations

import base64
import uuid
from decimal import Decimal

from rest_framework.exceptions import ValidationError

from finance.models import Invoice
from finance.services import invoice_balance
from payment_gateways.models import GatewayTransaction, PaymentGatewayAccount

PAYME_CHECKOUT_BASE = "https://checkout.paycom.uz"
CLICK_CHECKOUT_BASE = "https://my.click.uz/services/pay"


def _active_gateway_account(organization_id: str, provider: str) -> PaymentGatewayAccount:
    account = PaymentGatewayAccount.objects.filter(
        organization_id=organization_id, provider=provider, is_active=True
    ).first()
    if account is None:
        raise ValidationError(
            f"This center hasn't configured {provider.title()} for online payments yet."
        )
    return account


def _build_payme_url(account: PaymentGatewayAccount, merchant_trans_id: str, amount: Decimal, return_url: str | None) -> str:
    amount_tiyin = int(amount * 100)
    params = [f"m={account.merchant_id}", f"ac.merchant_trans_id={merchant_trans_id}", f"a={amount_tiyin}"]
    if return_url:
        params.append(f"c={return_url}")
    encoded = base64.b64encode(";".join(params).encode()).decode()
    return f"{PAYME_CHECKOUT_BASE}/{encoded}"


def _build_click_url(account: PaymentGatewayAccount, merchant_trans_id: str, amount: Decimal, return_url: str | None) -> str:
    params = [
        f"service_id={account.service_id}",
        f"merchant_id={account.merchant_id}",
        f"amount={amount}",
        f"transaction_param={merchant_trans_id}",
    ]
    if return_url:
        params.append(f"return_url={return_url}")
    return f"{CLICK_CHECKOUT_BASE}?{'&'.join(params)}"


def build_checkout_url(
    invoice: Invoice, provider: str, *, return_url: str | None = None, created_by: str | None = None
) -> tuple[GatewayTransaction, str]:
    balance = invoice_balance(invoice)
    if balance <= 0:
        raise ValidationError("This invoice has no remaining balance to pay.")

    account = _active_gateway_account(invoice.organization_id, provider)

    transaction = GatewayTransaction.objects.create(
        organization=invoice.organization,
        invoice=invoice,
        student_profile=invoice.student_profile,
        provider=provider,
        merchant_trans_id=str(uuid.uuid4()),
        amount=balance,
        currency=invoice.currency,
        created_by=created_by,
    )

    if provider == "payme":
        url = _build_payme_url(account, transaction.merchant_trans_id, balance, return_url)
    else:
        url = _build_click_url(account, transaction.merchant_trans_id, balance, return_url)

    return transaction, url
