"""Encrypts the Auth0 access tokens kept in the `web_session` table.

A token lets anyone call ADR as its user until it expires, so the table must not give it away: a copy of the database (a
backup, a dump, someone with read access) is not enough to read it. The key is a setting (HINT_SESSION_ENCRYPTION_KEYS,
from the key vault), never in the database.

It is Fernet (AES-128-CBC with an HMAC-SHA256, from `cryptography`), so a token that has been changed in the table is
refused, not decrypted to something else.

Changing the key: put the new key first and keep the old one after it (`new,old`). New tokens are encrypted with the
first key, and any of the keys decrypts. Once every session that the old key encrypted has ended (30 days at most),
remove it. A token that no key can decrypt counts as expired, so its user logs in again.
"""

from cryptography.fernet import Fernet, InvalidToken, MultiFernet
from pydantic import SecretStr


class TokenEncryption:
    def __init__(self, keys: list[SecretStr]):
        """`keys` are Fernet keys (`Fernet.generate_key()`), the one that encrypts first. Raises ValueError if there is
        none, or one is not a Fernet key."""
        if not keys:
            message = "No key to encrypt the access tokens with"
            raise ValueError(message)
        self._fernet = MultiFernet([Fernet(key.get_secret_value()) for key in keys])

    def encrypt(self, token: str) -> str:
        return self._fernet.encrypt(token.encode()).decode()

    def decrypt(self, encrypted: str) -> str | None:
        """The token, or None if no key decrypts it (it was encrypted with a key that has been removed, or changed)."""
        try:
            return self._fernet.decrypt(encrypted.encode()).decode()
        except InvalidToken:
            return None
