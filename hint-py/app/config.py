"""All configuration, read from environment variables prefixed HINT_ (e.g. HINT_DB_HOST).

The defaults match the development database (docker-compose.yml) and the Kotlin app's config.properties.
"""

from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="HINT_")

    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "hint"
    db_user: str = "hintuser"
    db_password: SecretStr = SecretStr("changeme")

    # Shown in the message for unexpected errors (application_title and support_email in the Kotlin config.properties)
    application_title: str = "Naomi"
    support_email: str = "naomi-support@imperial.ac.uk"

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
