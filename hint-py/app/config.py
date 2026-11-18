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

    # The folder of the uploaded files. This API writes the files here. It tells hintr that each file is at
    # "<upload_dir>/<hash>". So the share must be at the same path in both containers. The path is "/uploads".
    upload_dir: str = "/uploads"

    # The most that one uploaded file (the whole request that uploads it) may be, in bytes, for each kind of file. Each is
    # about twice the largest file of its kind that a saved version used in November 2026 (the files of 1,000 to 1,800
    # versions for PJNZ, programme and ANC, and 200 to 300 for the others). A user on a slow connection hits Azure's limit
    # first: a request that takes more than 240 seconds is cancelled by the ingress. These are for the input files, and not
    # for output zips (the largest a version used was 234 MB): the endpoint that loads one will need a limit of its own.
    # Each upload in flight also takes its size of ephemeral disk (see app/upload_limit.py: about 10 of the largest fit at
    # 1 vCPU).
    # PJNZ (a subnational PJNZ is large, and may be a zip): the largest was 187 MB.
    max_pjnz_upload_bytes: int = 400 * 1024 * 1024
    # Shape (geojson): the largest was 44 MB.
    max_shape_upload_bytes: int = 100 * 1024 * 1024
    # Population (csv): the largest was 67 MB.
    max_population_upload_bytes: int = 150 * 1024 * 1024
    # Survey (csv): the largest was 25 MB.
    max_survey_upload_bytes: int = 50 * 1024 * 1024
    # Programme (csv): the largest was 8 MB.
    max_programme_upload_bytes: int = 20 * 1024 * 1024
    # ANC (csv): the largest was under 1 MB.
    max_anc_upload_bytes: int = 10 * 1024 * 1024

    # ADR URL. It is sent to the browser (GET /adr/schemas), which builds the links to the datasets from it.
    adr_url: str = "https://dev.adr.fjelltopp.org/"
    # The resource type (schema) that ADR gives to each kind of file. The same as the adr_*_schema of config.properties.
    adr_anc_schema: str = "inputs-unaids-anc"
    adr_art_schema: str = "inputs-unaids-art"
    adr_pjnz_schema: str = "inputs-unaids-spectrum-file"
    adr_pop_schema: str = "inputs-unaids-population"
    adr_shape_schema: str = "inputs-unaids-geographic"
    adr_survey_schema: str = "inputs-unaids-survey"
    adr_output_zip_schema: str = "inputs-unaids-naomi-output-zip"
    adr_output_summary_schema: str = "inputs-unaids-naomi-report"
    adr_output_comparison_schema: str = "inputs-unaids-naomi-comparison-report"

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
