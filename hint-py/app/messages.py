"""Translated messages, from the gettext catalogs in app/locale (en, fr, pt).

The message ids are keys (the ones the Kotlin app uses), not English text, so there is an English catalog too. The
catalogs are read from the .po files when first used, there is no compile step.

To add or change a message, edit the .pot template and run
`uv run pybabel update -i app/locale/messages.pot -d app/locale` to add it to every language, then translate it in each
`app/locale/<language>/LC_MESSAGES/messages.po`.
"""

import logging
from functools import lru_cache
from pathlib import Path

from babel.messages import Catalog
from babel.messages.pofile import read_po

logger = logging.getLogger(__name__)

LOCALE_DIR = Path(__file__).parent / "locale"
DEFAULT_LANGUAGE = "en"
LANGUAGES = ["en", "fr", "pt"]


def negotiate_language(accept_language: str | None) -> str:
    """The language to use for the Accept-Language header, English if it is not one we have.

    The Vue app sends the language it is showing ("en", "fr" or "pt"). Only the first language in the header is
    looked at, without its region ("fr-CH" is "fr"), so a browser's header works too.
    """
    language = (accept_language or "").split(",")[0].split(";")[0].split("-")[0].strip().lower()
    return language if language in LANGUAGES else DEFAULT_LANGUAGE


@lru_cache
def _catalog(language: str) -> Catalog:
    with (LOCALE_DIR / language / "LC_MESSAGES" / "messages.po").open("rb") as f:
        return read_po(f, locale=language)


def _translation(key: str, language: str) -> str | None:
    found = _catalog(language).get(key)
    return str(found.string) if found and found.string else None


def t(key: str, language: str, **arguments: str) -> str:
    """The message with this key in the language, filling in its {placeholders}.

    A message that is not translated is shown in English, and one that is not in the English catalog either is shown as
    its key. Both are logged, and so is a message whose placeholders do not match the arguments (it is shown as it is).
    """
    text = _translation(key, language)
    if text is None and language != DEFAULT_LANGUAGE:
        logger.warning("Message %r is not translated to %s, using English", key, language)
        text = _translation(key, DEFAULT_LANGUAGE)
    if text is None:
        logger.error("Message %r has no English text, showing the key", key)
        return key
    try:
        return text.format(**arguments)
    except KeyError, IndexError, ValueError:
        logger.exception("Message %r (%s) cannot be filled in with %s", key, language, sorted(arguments))
        return text
