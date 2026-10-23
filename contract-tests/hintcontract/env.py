"""Settings describing the system under test (SUT) and its side-channels.  Filled from pytest options."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class Env:
    base_url: str
    # optional side channels -------------------------------------------------------------------------
    db_url: str | None = None
    uploads_dir: Path | None = None
    results_dir: Path | None = None
    hintr_uploads_prefix: str | None = None   # uploads path as written into hintr requests (default uploads_dir)
    emails_dir: Path = Path("/tmp/hint_emails")
    proxy_control_url: str | None = None   # recording / faulting proxy that sits on `hintr_url`
    stub_control_url: str | None = None    # stub ADR (CKAN) + issue report ("flow") server
    # urls as the SUT knows them (only used for normalisation / building test inputs) ----------------
    app_public_url: str = "http://127.0.0.1:8080"      # `application_url` in the SUT config
    adr_url: str = "http://127.0.0.1:8883/adr/"
    adr_sso_url: str = "http://127.0.0.1:8883/adr-sso/"
    idp_host: str = "localhost:8884"                     # `oauth2_client_url` in the SUT config
    sso_base_url: str | None = None                       # second SUT instance with oauth2_login_method=true
    fixtures_dir: Path = Path(__file__).resolve().parent.parent / "fixtures"
    goldens_dir: Path = Path(__file__).resolve().parent.parent / "goldens"
    artifacts_dir: Path = Path(__file__).resolve().parent.parent / ".artifacts"
    users_seed_file: Path = Path(__file__).resolve().parent.parent / ".run" / "users_seed.json"
    support_email: str = "naomi-support@imperial.ac.uk"
    record: bool = False
    run_slow: bool = False
    extra: dict = field(default_factory=dict)

    @property
    def has_db(self) -> bool:
        return bool(self.db_url)

    @property
    def has_uploads(self) -> bool:
        return self.uploads_dir is not None

    @property
    def has_proxy(self) -> bool:
        return bool(self.proxy_control_url)

    @property
    def has_stub(self) -> bool:
        return bool(self.stub_control_url)
