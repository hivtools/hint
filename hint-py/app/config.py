"""All configuration, read from environment variables prefixed HINT_ (e.g. HINT_DB_HOST).

The defaults match the development database (docker-compose.yml).
"""

from functools import lru_cache
from typing import Literal

from pydantic import SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
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

    # The lowest level that is logged, in any case. It applies to what this API logs and to what the libraries it uses
    # log (uvicorn, httpx, SQLAlchemy...).
    log_level: LogLevel = "INFO"
    # What the logs look like on stderr: "console" (one line for each message, for people), "json" (one object for each
    # message, for machines), or "auto": "console" in a terminal and "json" if not (a container, a pipe, a file).
    log_format: LogFormat = "auto"

    # Shown in the message for unexpected errors (application_title and support_email in the Kotlin config.properties)
    application_title: str = "Naomi"
    support_email: str = "naomi-support@imperial.ac.uk"

    @model_validator(mode="after")
    def _only_in_development(self) -> Settings:
        if self.environment != "development" and self.adr_api_key:
            message = "HINT_ADR_API_KEY is only for development. Set HINT_ENVIRONMENT=development to use it."
            raise ValueError(message)
        return self

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
