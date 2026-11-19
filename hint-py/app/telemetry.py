"""OpenTelemetry for the calls that this API makes to other services (hintr, ADR and GitHub).

When the API is started with `opentelemetry-instrument`, each call made with httpx2 is a span in the trace of the
request that made it. The span has the method, the address, the status and the time that the call took. The code that
makes a call does not need to time it or log it.

The address in the span keeps its query string, except for the value of a parameter that is a secret (`SECRET_PARAMS`).
ADR sends a download to its storage with a token in the `jwt` parameter. The token lets anyone read the file for 5
minutes.
"""

import re
from typing import Any

from opentelemetry.instrumentation.httpx import HTTPX2ClientInstrumentor
from opentelemetry.trace import Span, TracerProvider

# The attribute that has the address. Its name depends on the version of the semantic conventions in use.
URL_ATTRIBUTES = ("url.full", "http.url")

# The query parameters whose value is a secret
SECRET_PARAMS = ("jwt",)
_SECRET_VALUE = re.compile(rf"([?&](?:{'|'.join(map(re.escape, SECRET_PARAMS))})=)[^&#]*")


def redact_url(url: str) -> str:
    """The address with the value of each secret query parameter replaced by REDACTED. The rest is kept as it is."""
    return _SECRET_VALUE.sub(r"\1REDACTED", url)


def redact_span_url(span: Span, request: Any) -> None:
    """Redact the secrets in the address in the span of a call. It runs as each call starts."""
    if not span.is_recording():
        return
    attributes = getattr(span, "attributes", None) or {}
    for name in URL_ATTRIBUTES:
        value = attributes.get(name)
        if isinstance(value, str):
            span.set_attribute(name, redact_url(value))


async def _redact_span_url_async(span: Span, request: Any) -> None:
    redact_span_url(span, request)


def trace_outgoing_calls(tracer_provider: TracerProvider | None = None) -> None:
    """Make each call that httpx2 makes a span that has no secrets in its address.

    `opentelemetry-instrument` turns on every instrumentation that is installed before the app starts, but it cannot
    give one a hook. So this turns the httpx2 instrumentation off and on again, with the hook. If OpenTelemetry is not
    on, this does nothing.
    """
    instrumentor = HTTPX2ClientInstrumentor()
    if not instrumentor.is_instrumented_by_opentelemetry:
        return
    instrumentor.uninstrument()
    instrumentor.instrument(
        tracer_provider=tracer_provider,
        request_hook=redact_span_url,
        async_request_hook=_redact_span_url_async,
    )
