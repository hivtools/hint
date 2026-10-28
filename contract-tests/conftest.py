from __future__ import annotations

import os
import re
from pathlib import Path

import pytest

from hintcontract.controls import ControlApi, Db
from hintcontract.env import Env
from hintcontract.scenario import Scenario

ROOT = Path(__file__).resolve().parent


def _default(name: str, fallback=None):
    return os.environ.get(name, fallback)


def pytest_addoption(parser):
    g = parser.getgroup("hint contract tests")
    g.addoption("--base-url", default=_default("HINT_BASE_URL", "http://127.0.0.1:8080"),
                help="base url of the system under test")
    g.addoption("--db-url", default=_default("HINT_DB_URL"),
                help="postgres url (postgresql://user:pw@host:port/db) of the SUT: enables DB side-effect checks")
    g.addoption("--uploads-dir", default=_default("HINT_UPLOADS_DIR"),
                help="uploads directory of the SUT (as seen by this process)")
    g.addoption("--results-dir", default=_default("HINT_RESULTS_DIR"), help="results directory of the SUT")
    g.addoption("--hintr-uploads-prefix", default=_default("HINT_HINTR_UPLOADS_PREFIX"),
                help="uploads dir as hint writes it into hintr requests (default: --uploads-dir)")
    g.addoption("--emails-dir", default=_default("HINT_EMAILS_DIR", "/tmp/hint_emails"),
                help="directory the SUT writes emails to (email_mode=disk)")
    g.addoption("--proxy-control-url", default=_default("HINT_PROXY_CONTROL_URL"),
                help="control url of the recording/faulting proxy placed on hintr_url")
    g.addoption("--stub-control-url", default=_default("HINT_STUB_CONTROL_URL"),
                help="control url of the stub ADR / issue-report server")
    g.addoption("--sso-base-url", default=_default("HINT_SSO_BASE_URL"),
                help="base url of a second SUT instance started with oauth2_login_method=true")
    g.addoption("--app-public-url", default=_default("HINT_APP_PUBLIC_URL", "http://127.0.0.1:8080"),
                help="application_url configured in the SUT (only used to normalise redirect urls)")
    g.addoption("--adr-url", default=_default("HINT_ADR_URL", "http://127.0.0.1:8883/adr/"),
                help="adr_url configured in the SUT")
    g.addoption("--adr-sso-url", default=_default("HINT_ADR_SSO_URL", "http://127.0.0.1:8883/adr-sso/"),
                help="oauth2_client_adr_server_url configured in the SUT")
    g.addoption("--idp-host", default=_default("HINT_IDP_HOST", "localhost:8884"),
                help="oauth2_client_url configured in the SUT")
    g.addoption("--goldens-dir", default=str(ROOT / "goldens"))
    g.addoption("--timings-file", default=_default("HINT_TIMINGS_FILE"),
                help="write how long every request took to this JSON file, see hintcontract/timings.py")
    g.addoption("--record", action="store_true", default=False,
                help="write golden files from the running SUT instead of comparing")
    g.addoption("--run-slow", action="store_true", default=False, help="also run tests marked slow")
    g.addoption("--reset-db", action="store_true", default=bool(_default("HINT_RESET_DB")),
                help="allow the tests to delete projects, uploaded files, ADR keys and extra users that are already "
                     "in the database (otherwise the session stops: the tests empty the database between scenarios)")
    g.addoption("--users-seed-file", default=_default("HINT_USERS_SEED_FILE"),
                help="where the seeded users of the database are saved (default: .run/users_seed.json)")
    g.addoption("--allow-hintr-drift", action="store_true",
                default=bool(_default("HINT_ALLOW_HINTR_DRIFT")),
                help="run even if the running hintr/naomi version differs from the one the goldens were recorded "
                     "with (by default the session stops)")


def pytest_configure(config):
    config._hint_env = Env(  # type: ignore[attr-defined]
        base_url=config.getoption("--base-url"),
        db_url=config.getoption("--db-url"),
        uploads_dir=Path(config.getoption("--uploads-dir")) if config.getoption("--uploads-dir") else None,
        results_dir=Path(config.getoption("--results-dir")) if config.getoption("--results-dir") else None,
        hintr_uploads_prefix=config.getoption("--hintr-uploads-prefix"),
        emails_dir=Path(config.getoption("--emails-dir")),
        proxy_control_url=config.getoption("--proxy-control-url"),
        stub_control_url=config.getoption("--stub-control-url"),
        sso_base_url=config.getoption("--sso-base-url"),
        app_public_url=config.getoption("--app-public-url"),
        adr_url=config.getoption("--adr-url"),
        adr_sso_url=config.getoption("--adr-sso-url"),
        idp_host=config.getoption("--idp-host"),
        goldens_dir=Path(config.getoption("--goldens-dir")),
        record=config.getoption("--record"),
        run_slow=config.getoption("--run-slow"),
        **({"users_seed_file": Path(config.getoption("--users-seed-file"))}
           if config.getoption("--users-seed-file") else {}),
    )


META_FILE = "_meta.json"


def _live_hintr_versions(env: Env) -> dict | None:
    """hintr and naomi versions of the hintr behind the recording proxy (None if there is no proxy)."""
    if not env.proxy_control_url:
        return None
    import httpx
    base = env.proxy_control_url.rstrip("/")
    try:
        httpx.post(f"{base}/__control/reset", timeout=30)    # forget faults left by an earlier session
        r = httpx.get(f"{base}/hintr/version", timeout=30)
        r.raise_for_status()
        data = r.json()["data"]
        httpx.post(f"{base}/__control/reset", timeout=30)
        return {"hintr": data["hintr"], "naomi": data["naomi"]}
    except Exception as e:   # noqa: BLE001
        pytest.exit(f"cannot read the hintr version through {base}/hintr/version: {e!r}.\n"
                    f"Is the system under test up?  (scripts/dev.sh test-up)", returncode=4)


def _is_partial_run(config) -> bool:
    explicit = [a for a in config.args if Path(str(a)).resolve() != ROOT / "tests"]
    return bool(config.getoption("keyword") or config.getoption("markexpr") or explicit)


def _describe(v: dict) -> str:
    return f"hintr {v.get('hintr')}, naomi {v.get('naomi')}"


def pytest_sessionstart(session):
    import json
    import shutil
    config = session.config
    env: Env = config._hint_env
    shutil.rmtree(env.artifacts_dir, ignore_errors=True)   # failure dumps of earlier runs

    # The goldens are recorded against one hintr/naomi version.  hint relays most hintr answers, and those are
    # compared with hintr's own answer rather than stored, but hintr can still change status codes, defaults and
    # request handling, so the session stops if the versions differ.
    live = _live_hintr_versions(env)
    config._hintr_versions = live      # type: ignore[attr-defined]
    meta_path = env.goldens_dir / META_FILE
    recorded = json.loads(meta_path.read_text()) if meta_path.exists() else None
    if live is None:
        return
    if env.record:
        if recorded and recorded != live and _is_partial_run(config):
            pytest.exit("refusing a partial --record: the goldens were recorded with "
                        f"{_describe(recorded)} but hintr now is {_describe(live)}.\n"
                        "Record the whole suite (no -k / test ids) so all goldens come from one version.",
                        returncode=4)
        return
    if recorded is None:
        pytest.exit(f"{meta_path} is missing, so the hintr version of the goldens is unknown.\n"
                    f"Record the goldens against this hintr ({_describe(live)}) with --record.", returncode=4)
    if recorded != live:
        msg = ("hintr version differs from the one the goldens were recorded with.\n"
               f"  goldens: {_describe(recorded)}\n"
               f"  running: {_describe(live)}\n"
               "Re-record and review the diff:  scripts/dev.sh test --record\n"
               "(or pass --allow-hintr-drift to run anyway.)")
        if config.getoption("--allow-hintr-drift"):
            print("\nWARNING: " + msg.replace("\n", "\n  "))
        else:
            pytest.exit(msg, returncode=4)


def pytest_sessionfinish(session, exitstatus):
    import json
    config = session.config
    env: Env = config._hint_env
    timings_file = config.getoption("--timings-file")
    if timings_file:
        from hintcontract import timings
        timings.write(Path(timings_file), config.getoption("--base-url"))
    live = getattr(config, "_hintr_versions", None)
    if env.record and live and not _is_partial_run(config):
        (env.goldens_dir / META_FILE).write_text(json.dumps(live, indent=2, sort_keys=True) + "\n")


def pytest_collection_modifyitems(config, items):
    env: Env = config._hint_env
    skip_slow = pytest.mark.skip(reason="slow test: use --run-slow")
    for item in items:
        if "slow" in item.keywords and not env.run_slow:
            item.add_marker(skip_slow)
        if "needs_db" in item.keywords and not env.has_db:
            item.add_marker(pytest.mark.skip(reason="needs --db-url"))
        if "needs_uploads" in item.keywords and not env.has_uploads:
            item.add_marker(pytest.mark.skip(reason="needs --uploads-dir"))
        if "faulting" in item.keywords and not env.has_proxy:
            item.add_marker(pytest.mark.skip(reason="needs --proxy-control-url"))
        if "sso" in item.keywords and not env.sso_base_url:
            item.add_marker(pytest.mark.skip(reason="needs --sso-base-url (SUT in SSO mode)"))


@pytest.fixture(scope="session")
def env(pytestconfig) -> Env:
    return pytestconfig._hint_env


@pytest.fixture(scope="session")
def db(env, pytestconfig):
    if not env.has_db:
        yield None
        return
    d = Db(env)
    d.seed_users()
    # The tests empty the database between scenarios.  Do not do that to data a person made by using the app.
    existing = d.local_data_summary()
    if existing and not pytestconfig.getoption("--reset-db"):
        found = ", ".join(f"{n} {what}" for what, n in existing.items())
        d.close()
        pytest.exit(f"the database already holds {found}, which the tests would delete.\n"
                    "Run with --reset-db (scripts/dev.sh test --reset-db) if that is fine.", returncode=4)
    yield d
    d.close()


@pytest.fixture(scope="session")
def proxy(env):
    return ControlApi(env.proxy_control_url) if env.proxy_control_url else None


@pytest.fixture(scope="session")
def stub(env):
    return ControlApi(env.stub_control_url) if env.stub_control_url else None


def golden_name(nodeid: str) -> str:
    # tests/test_projects.py::test_x[param] -> projects/test_x[param]
    path, _, rest = nodeid.partition("::")
    module = Path(path).stem
    module = re.sub(r"^test_", "", module)
    test = re.sub(r"[^A-Za-z0-9_.\[\]-]+", "_", rest.replace("::", "."))
    return f"{module}/{test}"


def make_scenario(env, name, db, proxy, stub) -> Scenario:
    path = env.goldens_dir / (name + ".json")
    scn = Scenario(env, name, path, db, proxy, stub)
    scn.prepare()
    return scn


@pytest.fixture
def scn(request, env, db, proxy, stub):
    name = golden_name(request.node.nodeid)
    s = make_scenario(env, name, db, proxy, stub)
    yield s
    failed = request.node.rep_call.failed if hasattr(request.node, "rep_call") else False
    s.close()
    s.finish(passed=not failed)
    # leave the SUT clean for the next scenario
    s.prepare()


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    setattr(item, "rep_" + rep.when, rep)


@pytest.fixture(scope="session")
def pipeline(env, db, proxy, stub):
    """Completed mock model fit + calibration + downloads (see hintcontract/pipeline.py)."""
    from hintcontract.pipeline import run_pipeline
    scn = make_scenario(env, "_pipeline/model_pipeline", db, proxy, stub)
    try:
        p = run_pipeline(scn)
    except BaseException:
        scn.finish(passed=False)
        scn.close()
        raise
    scn.close()
    scn.finish(passed=True)
    scn.prepare()
    return p
