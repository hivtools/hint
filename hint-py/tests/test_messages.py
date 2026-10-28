import re

import pytest
from babel.messages.pofile import read_po

from app.messages import LANGUAGES, LOCALE_DIR, negotiate_language, t


@pytest.mark.parametrize(
    ("header", "language"),
    [
        (None, "en"),
        ("", "en"),
        ("en", "en"),
        ("fr", "fr"),
        ("pt", "pt"),
        ("FR", "fr"),
        ("fr-FR", "fr"),
        ("pt-BR,pt;q=0.9,en;q=0.8", "pt"),
        ("fr;q=0.9", "fr"),
        ("de", "en"),
        ("de, fr", "en"),
        ("garbage", "en"),
        ("*", "en"),
    ],
)
def test_negotiate_language(header, language):
    assert negotiate_language(header) == language


def test_message_in_each_language():
    assert t("projectDoesNotExist", "en") == "Project does not exist."
    assert t("projectDoesNotExist", "fr") == "Le projet n'existe pas."
    assert t("projectDoesNotExist", "pt") == "O projeto não existe."


def test_message_fills_in_placeholders():
    text = t("unexpectedError", "en", app_title="Naomi", code="uab-cde-fgh", support_email="help@example.com")
    assert text.startswith(
        "An unexpected error occurred. If you see this message while you are using Naomi at a workshop"
    )
    assert text.count("uab-cde-fgh") == 2
    assert "help@example.com" in text
    assert "{" not in text


def test_message_that_is_not_in_the_catalogs_is_its_key_and_is_logged(caplog):
    assert t("noSuchMessage", "fr") == "noSuchMessage"

    assert [(r.levelname, r.getMessage()) for r in caplog.records] == [
        ("WARNING", "Message 'noSuchMessage' is not translated to fr, using English"),
        ("ERROR", "Message 'noSuchMessage' has no English text, showing the key"),
    ]


def test_message_that_is_not_translated_is_shown_in_english_and_logged(caplog, monkeypatch):
    monkeypatch.setattr("app.messages._translation", lambda key, language: None if language == "pt" else f"{language}!")

    assert t("anyKey", "pt") == "en!"

    assert [(r.levelname, r.getMessage()) for r in caplog.records] == [
        ("WARNING", "Message 'anyKey' is not translated to pt, using English")
    ]


def test_message_that_is_translated_is_not_logged(caplog):
    t("projectDoesNotExist", "fr")
    t("projectDoesNotExist", "en")

    assert caplog.records == []


def test_message_that_cannot_be_filled_in_is_shown_as_it_is_and_logged(caplog):
    text = t("unexpectedError", "en", app_title="Naomi")

    assert "{code}" in text
    [record] = caplog.records
    assert record.levelname == "ERROR"
    assert "cannot be filled in" in record.getMessage()


def read(language: str | None):
    path = LOCALE_DIR / "messages.pot" if language is None else LOCALE_DIR / language / "LC_MESSAGES" / "messages.po"
    with path.open("rb") as f:
        return read_po(f)


def placeholders(text: str) -> set[str]:
    return set(re.findall(r"{(\w*)}", text))


@pytest.mark.parametrize("language", LANGUAGES)
def test_every_message_is_translated_with_the_same_placeholders(language):
    template = {m.id: m for m in read(None) if m.id}
    catalog = {m.id: m for m in read(language) if m.id}

    assert catalog.keys() == template.keys()
    for key in template:
        translation = str(catalog[key].string)
        assert translation, f"{key} is not translated to {language}"
        assert placeholders(translation) == placeholders(str(catalog["unexpectedError"].string)) or key != (
            "unexpectedError"
        )
        assert placeholders(translation) == placeholders(str(read("en")[key].string)), key
