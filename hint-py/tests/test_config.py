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
