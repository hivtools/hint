"""The spans of the calls that this API makes. The calls go to a small server on this machine: OpenTelemetry traces the
real transports of httpx2, not the fake ones that the other tests use."""

import threading
from collections.abc import Iterator
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import httpx2
import pytest
from opentelemetry.instrumentation.httpx import HTTPX2ClientInstrumentor
from opentelemetry.sdk.trace import ReadableSpan, TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

from app.telemetry import URL_ATTRIBUTES, redact_span_url, redact_url, trace_outgoing_calls


class _Ok(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def log_message(self, format: str, *args: object) -> None:  # noqa: A002 (the name of the parameter of the base class)
        pass


@pytest.fixture
def server() -> Iterator[str]:
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), _Ok)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{httpd.server_address[1]}"
    httpd.shutdown()
    httpd.server_close()


@pytest.fixture
def spans() -> Iterator[InMemorySpanExporter]:
    exporter = InMemorySpanExporter()
    provider = TracerProvider()
    provider.add_span_processor(SimpleSpanProcessor(exporter))
    # As `opentelemetry-instrument` does before the app starts
    HTTPX2ClientInstrumentor().instrument(tracer_provider=provider)
    trace_outgoing_calls(provider)
    yield exporter
    HTTPX2ClientInstrumentor().uninstrument()


async def test_a_call_is_a_span_with_the_secret_in_its_address_redacted(server, spans):
    async with httpx2.AsyncClient(base_url=server) as client:
        r = await client.get("/storage/file.csv", params={"filename": "file.csv", "jwt": "a-secret-token"})

    assert r.status_code == 200
    [span] = spans.get_finished_spans()
    assert span.attributes is not None
    urls = [span.attributes[name] for name in URL_ATTRIBUTES if name in span.attributes]
    assert urls == [f"{server}/storage/file.csv?filename=file.csv&jwt=REDACTED"]
    assert "a-secret-token" not in str(dict(span.attributes))


def test_a_call_made_without_async_has_the_secret_redacted_too(server, spans):
    with httpx2.Client(base_url=server) as client:
        client.get("/storage/file.csv", params={"jwt": "a-secret-token"})

    [span] = spans.get_finished_spans()
    assert "a-secret-token" not in str(dict(span.attributes or {}))


def test_without_opentelemetry_the_calls_are_not_traced():
    trace_outgoing_calls()

    assert not HTTPX2ClientInstrumentor().is_instrumented_by_opentelemetry


def test_a_span_that_is_not_recorded_is_left_alone():
    span = TracerProvider().get_tracer("test").start_span("GET", attributes={"url.full": "http://a/b?c=d"})
    span.end()

    redact_span_url(span, None)

    assert isinstance(span, ReadableSpan)
    assert span.attributes == {"url.full": "http://a/b?c=d"}


@pytest.mark.parametrize(
    ("url", "redacted"),
    [
        ("https://s/a.csv?jwt=t", "https://s/a.csv?jwt=REDACTED"),
        ("https://s/a.csv?filename=a.csv&jwt=t.u.v&x=1", "https://s/a.csv?filename=a.csv&jwt=REDACTED&x=1"),
        ("https://s/a.csv?jwt=&x=1", "https://s/a.csv?jwt=REDACTED&x=1"),
        ("https://s/a.csv?jwt=t#part", "https://s/a.csv?jwt=REDACTED#part"),
        (
            "https://flow.example/workflows/abc/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers&sig=key",
            "https://flow.example/workflows/abc/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers&sig=REDACTED",
        ),
        # Only a parameter of that name, and only in the query
        ("https://s/a.csv?xjwt=t&jwtx=u", "https://s/a.csv?xjwt=t&jwtx=u"),
        ("https://s/jwt=t/a.csv?id=d", "https://s/jwt=t/a.csv?id=d"),
        (
            "https://adr/api/3/action/package_show?id=d&release=r",
            "https://adr/api/3/action/package_show?id=d&release=r",
        ),
    ],
)
def test_only_the_value_of_a_secret_parameter_is_redacted(url, redacted):
    assert redact_url(url) == redacted
