import pytest
from pydantic import ValidationError

from app.config import Settings


def test_defaults_match_the_development_database():
    url = Settings().database_url
    assert url.render_as_string(hide_password=False) == "postgresql+asyncpg://hintuser:changeme@localhost:5432/hint"


def test_reads_hint_prefixed_environment_variables(monkeypatch):
    monkeypatch.setenv("HINT_DB_HOST", "db")
    monkeypatch.setenv("HINT_DB_PASSWORD", "p@ss/word")
    url = Settings().database_url
    assert url.host == "db"
    assert url.password == "p@ss/word"
    # Special characters are escaped in the rendered URL
    assert "p%40ss%2Fword" in url.render_as_string(hide_password=False)


def test_password_is_not_shown_in_the_settings_repr():
    assert "changeme" not in repr(Settings())


def test_hintr_url_defaults_to_a_local_hintr_and_can_be_set(monkeypatch):
    assert Settings().hintr_url == "http://localhost:8888"
    monkeypatch.setenv("HINT_HINTR_URL", "http://hintr:8888")
    assert Settings().hintr_url == "http://hintr:8888"


def test_results_dir_defaults_to_the_folder_hintr_writes_to_and_can_be_set(monkeypatch):
    assert Settings().results_dir == "results"
    monkeypatch.setenv("HINT_RESULTS_DIR", "/mnt/results")
    assert Settings().results_dir == "/mnt/results"


def test_adr_url_and_resource_types_default_to_those_of_the_kotlin_config_and_can_be_set(monkeypatch):
    assert Settings().adr_url == "https://dev.adr.fjelltopp.org/"
    assert Settings().adr_art_schema == "inputs-unaids-art"
    monkeypatch.setenv("HINT_ADR_URL", "https://adr.example/")
    monkeypatch.setenv("HINT_ADR_ART_SCHEMA", "my-art")
    assert Settings().adr_url == "https://adr.example/"
    assert Settings().adr_art_schema == "my-art"


def test_the_adr_settings_have_defaults_and_can_be_set(monkeypatch):
    assert Settings().adr_url == "https://dev.adr.fjelltopp.org/"
    assert Settings().adr_api_key is None
    assert (Settings().adr_schema_this_year, Settings().adr_schema_last_year) == (
        "country-estimates-27",
        "country-estimates-26",
    )
    monkeypatch.setenv("HINT_ENVIRONMENT", "development")
    monkeypatch.setenv("HINT_ADR_URL", "https://adr.example/")
    monkeypatch.setenv("HINT_ADR_API_KEY", "a-key")
    monkeypatch.setenv("HINT_ADR_SCHEMA_THIS_YEAR", "country-estimates-28")
    key = Settings().adr_api_key
    assert key is not None
    assert key.get_secret_value() == "a-key"
    assert Settings().adr_url == "https://adr.example/"
    assert Settings().adr_schema_this_year == "country-estimates-28"


def test_the_key_for_adr_is_not_shown_in_the_settings_repr():
    assert "a-key-of-adr" not in repr(Settings(environment="development", adr_api_key="a-key-of-adr"))


def test_an_api_is_in_production_unless_it_is_set_to_development(monkeypatch):
    assert Settings().environment == "production"
    monkeypatch.setenv("HINT_ENVIRONMENT", "development")
    assert Settings().environment == "development"


def test_a_production_api_does_not_start_with_a_setting_for_development_only():
    with pytest.raises(ValidationError, match="only for development"):
        Settings(adr_api_key="a-key")
    with pytest.raises(ValidationError, match="only for development"):
        Settings(environment="production", adr_api_key="a-key")


def test_a_development_api_can_have_the_settings_for_development_only():
    assert Settings(environment="development", adr_api_key="a-key")


def test_no_github_team_is_set_by_default_so_nobody_gets_in(monkeypatch):
    assert (Settings().github_auth_org, Settings().github_auth_team_slug) == ("", "")
    assert Settings().github_api_url == "https://api.github.com"
    monkeypatch.setenv("HINT_GITHUB_AUTH_ORG", "hivtools")
    monkeypatch.setenv("HINT_GITHUB_AUTH_TEAM_SLUG", "naomi-debug")
    monkeypatch.setenv("HINT_GITHUB_API_URL", "https://github.example")
    assert (Settings().github_auth_org, Settings().github_auth_team_slug) == ("hivtools", "naomi-debug")
    assert Settings().github_api_url == "https://github.example"
