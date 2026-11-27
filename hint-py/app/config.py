"""All configuration, read from environment variables prefixed HINT_ (e.g. HINT_DB_HOST).

The defaults match the development database (docker-compose.yml).
"""

from functools import lru_cache
from typing import Annotated, Literal

from pydantic import SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict
from sqlalchemy import URL

LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
LogFormat = Literal["auto", "console", "json"]
Environment = Literal["development", "production"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="HINT_")

    # Where this API runs. Some settings are only for development, and a production API refuses to start with them (see
    # `_only_in_development`). Production is the default, so that a real deployment is safe if nobody sets this.
    environment: Environment = "production"

    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "hint"
    db_user: str = "hintuser"
    db_password: SecretStr = SecretStr("changeme")

    # The hintr API URL
    hintr_url: str = "http://localhost:8888"

    # The folder of the uploaded files. This API writes the files here. It tells hintr that each file is at
    # "<upload_dir>/<hash>". So the share must be at the same path in both containers. The path is "/uploads".
    upload_dir: str = "/uploads"

    # The address of ADR. This API calls ADR here. The browser also gets it (GET /adr/schemas), and builds the links to
    # the datasets from it.
    adr_url: str = "https://dev.adr.fjelltopp.org/"
    # The resource type that ADR gives to each kind of file is not a setting: it is in app/services/file_types.py.

    # The type of the datasets of this year, and of last year. Each year the datasets have a new type.
    # Datasets for this_year can be imported as model inputs, last_year can be imported to rehydrate an
    # old model fit.
    adr_schema_this_year: str = "country-estimates-27"
    adr_schema_last_year: str = "country-estimates-26"

    # How this API calls ADR for a user:
    # - A user who logged in with single sign-on has an Auth0 access token. The proxy passes it to this API. ADR is
    #   called as that user. This is what happens in a real deployment.
    # - In development, by default, SSO is turned off and so the users have no token.
    #   `adr_api_key` is then the key of one user on ADR, and every user is called as that user.
    # If a request has neither, it cannot call ADR.
    # Only for development (`environment`). In production, every user would act as the same user on ADR.
    adr_api_key: SecretStr | None = None
    # Only set in CI. The dev ADR only accepts some IP addresses, and GitHub's runners are not among them. Its firewall
    # lets a call in if it has this value in the header `X-Naomi-CI`. The value is a secret, and it goes only to ADR.
    adr_waf_bypass_secret: SecretStr | None = None

    # Who may download the debug zip of a model run (GET /model/debug/{id}). The caller sends a GitHub token, and only a
    # member of this GitHub team gets in. The team is the slug in the team's URL: github.com/orgs/<org>/teams/<slug>.
    # If either is empty, nobody gets in.
    github_auth_org: str = ""
    github_auth_team_slug: str = ""
    # The address of the GitHub API. Only tests change it.
    github_api_url: str = "https://api.github.com"

    # The folder hintr writes the results of tasks to. This API does open
    # these: it reads the results database of a calibration and sends the files made by a download. hintr answers with
    # paths relative to its own results folder, which this is the same share as, so the two are mounted differently
    # only if the path here is set to where this API sees it.
    results_dir: str = "results"

    # The folder of the built front end (src/app/static/public after `npm run build && npm run copy`): the page of the
    # app (index.html) and the files at /public/ (see app/routers/pages.py). The default is that folder in this
    # repository, for `make run`. A container sets it to where the files are in it.
    static_dir: str = "../src/app/static/public"

    # The address of the app, as the browser sees it, without a "/" at the end. Auth0 sends the
    # browser back to <application_url>/callback/oauth2Client after a login, and to <application_url>/login after a
    # logout, so both must be in the Auth0 application's allowed URLs. The session cookie is `Secure` when it is https.
    application_url: str = "http://localhost:8080"

    # Login with Auth0 (single sign-on), as in every deployment: the domain (without https://), and the id and secret of
    # the Auth0 application. If the domain is empty, the login page has no single sign-on button.
    auth0_domain: str = ""
    auth0_client_id: str = ""
    auth0_client_secret: SecretStr = SecretStr("")
    auth0_audience: str = "naomi"
    # The ADR scope gives an access token that ADR accepts, so that this API can call ADR as the user
    auth0_scope: str = "openid profile email access:adr"

    # Only for development (`environment`): the users who can log in without Auth0, with one button each on the login
    # page (POST /dev-login), so that sharing a project between two users can be tried locally. Comma separated, e.g.
    # HINT_DEV_USERS=test.user@example.com,test.user2@example.com. Not allowed with Auth0 or an https address.
    dev_users: Annotated[list[str], NoDecode] = []

    # The lowest level that is logged, in any case. It applies to what this API logs and to what the libraries it uses
    # log (uvicorn, httpx, SQLAlchemy...).
    log_level: LogLevel = "INFO"
    # What the logs look like on stderr: "console" (one line for each message, for people), "json" (one object for each
    # message, for machines), or "auto": "console" in a terminal and "json" if not (a container, a pipe, a file).
    log_format: LogFormat = "auto"

    # Shown in the message for unexpected errors (application_title and support_email in the Kotlin config.properties)
    application_title: str = "Naomi"
    # Also the user that gets a copy of the project of an error report (POST /error-report)
    support_email: str = "naomi-support@imperial.ac.uk"

    # Where an error report is sent: the address of the Teams flow.
    # It is a secret, because the key of the flow is in it (`sig`). If it is not set, no report can be sent.
    issue_report_url: SecretStr = SecretStr("")

    @model_validator(mode="after")
    def _only_in_development(self) -> Settings:
        if self.environment != "development" and self.adr_api_key:
            message = "HINT_ADR_API_KEY is only for development. Set HINT_ENVIRONMENT=development to use it."
            raise ValueError(message)
        if self.dev_users:
            # A login with no password must never be possible on a real deployment
            if self.environment != "development":
                message = "HINT_DEV_USERS is only for development. Set HINT_ENVIRONMENT=development to use it."
                raise ValueError(message)
            if self.auth0_domain or self.application_url.startswith("https://"):
                message = (
                    "HINT_DEV_USERS cannot be used with Auth0 (HINT_AUTH0_DOMAIN) or an https HINT_APPLICATION_URL."
                )
                raise ValueError(message)
        return self

    @field_validator("dev_users", mode="before")
    @classmethod
    def _split_dev_users(cls, value: object) -> object:
        if isinstance(value, str):
            return [user.strip() for user in value.split(",") if user.strip()]
        return value

    @field_validator("application_url")
    @classmethod
    def _no_trailing_slash(cls, value: str) -> str:
        return value.rstrip("/")

    @property
    def auth0_configured(self) -> bool:
        return bool(self.auth0_domain and self.auth0_client_id)

    @field_validator("log_level", mode="before")
    @classmethod
    def _upper_case_log_level(cls, value: object) -> object:
        return value.upper() if isinstance(value, str) else value

    @property
    def database_url(self) -> URL:
        return URL.create(
            "postgresql+asyncpg",
            username=self.db_user,
            password=self.db_password.get_secret_value(),
            host=self.db_host,
            port=self.db_port,
            database=self.db_name,
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
