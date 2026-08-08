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
from urllib.parse import quote, urlencode, urlparse

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


def _clean_return_url(return_url: str | None) -> str | None:
    """Only an absolute http(s) URL is accepted — this value comes straight
    from the request body (see CheckoutInitiateView) and is spliced into a
    delimited param string below, so anything else is rejected outright
    rather than merely escaped.
    """
    if not return_url:
        return None
    parsed = urlparse(return_url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValidationError({"return_url": "Must be an absolute http(s) URL."})
    return return_url


# Everything URL-legal except ";" — Payme's params are ";"-delimited, so a
# raw ";" in return_url would otherwise smuggle in an extra "key=value" pair
# (e.g. a bogus "a=" overriding the amount). Percent-encoding just that
# character neutralizes the injection while leaving the rest of the URL
# readable. (Kept out of the f-string below — a literal "'" inside an
# f-string expression isn't valid on Python < 3.12.)
_PAYME_RETURN_URL_SAFE_CHARS = ":/?#[]@!$&'()*+,~%"


def _build_payme_url(account: PaymentGatewayAccount, merchant_trans_id: str, amount: Decimal, return_url: str | None) -> str:
    amount_tiyin = int(amount * 100)
    params = [f"m={account.merchant_id}", f"ac.merchant_trans_id={merchant_trans_id}", f"a={amount_tiyin}"]
    if return_url:
        encoded_return_url = quote(return_url, safe=_PAYME_RETURN_URL_SAFE_CHARS)
        params.append(f"c={encoded_return_url}")
    encoded = base64.b64encode(";".join(params).encode()).decode()
    return f"{PAYME_CHECKOUT_BASE}/{encoded}"


def _build_click_url(account: PaymentGatewayAccount, merchant_trans_id: str, amount: Decimal, return_url: str | None) -> str:
    params = {
        "service_id": account.service_id,
        "merchant_id": account.merchant_id,
        "amount": str(amount),
        "transaction_param": merchant_trans_id,
    }
    if return_url:
        params["return_url"] = return_url
    # urlencode(), not manual "&".join() — properly percent-encodes any "&"/
    # "=" a return_url could otherwise use to inject extra query params.
    return f"{CLICK_CHECKOUT_BASE}?{urlencode(params)}"


def build_checkout_url(
    invoice: Invoice, provider: str, *, return_url: str | None = None, created_by: str | None = None
) -> tuple[GatewayTransaction, str]:
    balance = invoice_balance(invoice)
    if balance <= 0:
        raise ValidationError("This invoice has no remaining balance to pay.")

    return_url = _clean_return_url(return_url)
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
