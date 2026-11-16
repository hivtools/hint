"""All configuration, read from environment variables prefixed HINT_ (e.g. HINT_DB_HOST).

The defaults match the development database (docker-compose.yml) and the Kotlin app's config.properties.
"""

from functools import lru_cache
from typing import Literal

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL

LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
LogFormat = Literal["auto", "console", "json"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="HINT_")

    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "hint"
    db_user: str = "hintuser"
    db_password: SecretStr = SecretStr("changeme")

    # The hintr API URL
    hintr_url: str = "http://localhost:8888"

    # The folder of the uploaded files: this API writes them here, and tells hintr that they are at "<upload_dir>/<hash>".
    # So the share has to be mounted at the same place in both containers, which is "/uploads".
    upload_dir: str = "/uploads"

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
