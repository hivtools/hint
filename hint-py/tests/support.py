"""What the tests share: constants, and a helper that makes a zip."""

import io
import zipfile
from collections.abc import Mapping

USER = "test.user@example.com"
OTHER_USER = "naomi-support@imperial.ac.uk"

# Credentials for ADR. They are made up, and no test may find them in a log (see `no_personal_data_in_logs`).
ADR_KEY = "an-adr-api-key-for-tests"
ADR_TOKEN = "an-auth0-access-token-for-tests"

# GitHub tokens, made up. No test may find them in a log (see `no_personal_data_in_logs`).
GITHUB_TOKEN = "ghp_a-token-of-a-team-member-for-tests"
GITHUB_OTHER_TOKEN = "ghp_a-token-of-a-user-not-in-the-team"


def make_zip(entries: Mapping[str, str | bytes], method: int = zipfile.ZIP_DEFLATED, comment: bytes = b"") -> bytes:
    """A zip with these entries, as bytes."""
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", method) as archive:
        archive.comment = comment
        for name, content in entries.items():
            archive.writestr(name, content)
    return out.getvalue()
