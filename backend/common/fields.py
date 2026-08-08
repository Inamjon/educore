"""Field-level encryption at rest, for the handful of columns where a raw DB
read (backup, replica, compromised credential) must not hand over a secret
directly usable against a third party — currently only
payment_gateways.PaymentGatewayAccount.secret_key (a center's Payme/Click
merchant secret). Not a general-purpose "encrypt everything" utility:
everything else in the schema is either not a secret or is already hashed
one-way (passwords, refresh tokens — see auth_custom).
"""

from __future__ import annotations

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.db import models


def _fernet() -> Fernet:
    return Fernet(settings.PAYMENT_GATEWAY_ENCRYPTION_KEY.encode())


class EncryptedTextField(models.TextField):
    """Transparent encrypt-on-write / decrypt-on-read TextField. Ciphertext
    is what's actually stored in the column; application code only ever
    sees plaintext. Not queryable/filterable by value (Fernet ciphertext is
    non-deterministic — same plaintext encrypts differently each time) —
    nothing needs to filter by secret_key, so that's not a loss here.
    """

    def get_prep_value(self, value):
        if value is None or value == "":
            return value
        return _fernet().encrypt(value.encode()).decode()

    def from_db_value(self, value, expression, connection):
        if value is None or value == "":
            return value
        try:
            return _fernet().decrypt(value.encode()).decode()
        except InvalidToken:
            # Wrong/rotated key, or the column already held plaintext from
            # before this field type existed — fail loudly rather than
            # silently handing back ciphertext as if it were a usable secret.
            raise ValueError("Unable to decrypt stored value — check PAYMENT_GATEWAY_ENCRYPTION_KEY.")
