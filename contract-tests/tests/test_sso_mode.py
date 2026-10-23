"""Behaviour when the SUT runs with oauth2_login_method=true (second instance started by scripts/dev.sh test and given
with --sso-base-url): login page, SSO flag, and the ADR with the user's SSO access token instead of an API key."""
from __future__ import annotations

import base64
import urllib.parse

import pytest

from hintcontract.adr import SCHEMAS, THIS_YEAR, dataset, resource
from hintcontract.controls import fault
from hintcontract.flows import make_zip

pytestmark = pytest.mark.sso

SSO_USER = "sso.user@example.com"
TOKEN = "stub-access-token"


def sso_client(scn, name="S"):
    return scn.client(name, base_url=scn.env.sso_base_url)


def sso_login(scn, c, email=SSO_USER, token=TOKEN):
    scn.set_stub(idp={"userinfo": {"email": email}, "token": {"access_token": token, "token_type": "Bearer"}},
                 **getattr(scn, "_adr_state", {}))
    r = c.get("/oauth2", name="start sso login")
    state = urllib.parse.parse_qs(urllib.parse.urlsplit(r.headers["location"]).query)["state"][0]
    return c.get("/callback/oauth2Client", params={"code": "c", "state": state}, name="sso callback")


def adr_world(scn):
    scn._adr_state = dict(
        datasets=[dataset("d1", THIS_YEAR, [resource("r1", SCHEMAS["pjnz"]), resource("r3", SCHEMAS["outputZip"])])],
        releases={"d1": [{"id": "rel-1", "name": "v1"}]},
        orgs=[{"id": "o1", "name": "org"}],
        files={"/dataset/d1/resource/r1/download/Malawi2024.PJNZ": {"fixture": "Malawi2024.PJNZ"}},
        activity={"d1": [{"id": "act-1"}]},
    )


def test_sso_flag_and_login_page_in_sso_mode(scn):
    c = sso_client(scn)
    c.get("/sso", name="sso flag is true")
    c.get("/login", name="login page offers the sso button", html_checks=["Log in with HIV Tools Single Sign-On account"])
    c.get("/login", params={"redirectTo": "/projects"}, name="continue as guest link keeps redirectTo",
          html_checks=['href="/projects">Continue as guest'])


def test_password_login_still_works_in_sso_mode(scn):
    c = sso_client(scn)
    c.login(name="password login")
    c.get("/projects/", name="authenticated")


def test_user_exists_in_sso_mode(scn):
    c = sso_client(scn)
    sso_login(scn, c, email="test.user@example.com")
    c.get("/user/test.user@example.com/exists", name="known")
    c.get("/user/nobody@example.com/exists", name="unknown")
    c.get("/user/not-an-email/exists", name="invalid")


def test_adr_uses_the_sso_access_token(scn):
    adr_world(scn)
    c = sso_client(scn)
    sso_login(scn, c)
    c.get("/adr/datasets", params={"type": "input"}, name="datasets with bearer token")
    c.get("/adr/datasets/d1", name="one dataset")
    c.get("/adr/datasets/d1/releases", name="releases")
    c.get("/adr/orgs", params={"permission": "read"}, name="orgs")
    c.post("/adr/datasets/d1/releases", params={"name": "v2"}, name="create release")


def test_adr_import_with_sso_token(scn):
    adr_world(scn)
    c = sso_client(scn)
    sso_login(scn, c)
    c.open_app()
    url = scn.env.adr_sso_url.rstrip("/") + "/dataset/d1/resource/r1/download/Malawi2024.PJNZ"
    c.post("/adr/pjnz", json={"url": url, "datasetId": "d1", "resourceId": "r1"}, name="import pjnz")


def test_adr_without_token_or_with_adr_rejection_in_sso_mode(scn):
    adr_world(scn)
    c = sso_client(scn)
    c.get("/adr/datasets", params={"type": "input"}, name="guest is 401")
    sso_login(scn, c, token="")
    c.get("/adr/datasets", params={"type": "input"}, name="empty token is sent as 'Bearer '")
    scn.set_faults("stub", [fault({"type": "status", "status": 401, "json": {"success": False, "error": {"message": "token expired"}}},
                                  "package_search")])
    c.get("/adr/datasets", params={"type": "input"}, name="adr rejects the token")
    scn.set_faults("stub", [fault({"type": "status", "status": 403, "json": {"success": False, "error": {"message": "User has not yet logged into ADR"}}},
                                  "package_search")])
    c.get("/adr/datasets", params={"type": "input"}, name="no adr account")


def test_adr_key_endpoints_still_work_in_sso_mode(scn):
    c = sso_client(scn)
    sso_login(scn, c)
    c.get("/adr/key", name="no key")
    c.post("/adr/key", form={"key": "k"}, name="save key")
    c.get("/adr/key", name="key read back")


def test_rehydrate_from_adr_with_sso_token(scn, pipeline):
    pipeline.bind(scn)
    import json
    state = {"datasets": {}, "model_fit": {"id": pipeline.fit_id, "options": {}},
             "calibrate": {"id": pipeline.calibrate_id, "options": {}}, "version": pipeline.version}
    z = make_zip({"info/project_state.json": json.dumps(state), "notes.txt": "n"})
    adr_world(scn)
    scn._adr_state["files"]["/dataset/d1/resource/r9/download/out.zip"] = {"b64": base64.b64encode(z).decode()}
    c = sso_client(scn)
    sso_login(scn, c)
    url = scn.env.adr_sso_url.rstrip("/") + "/dataset/d1/resource/r9/download/out.zip"
    c.post("/rehydrate/adr", json={"url": url, "datasetId": "d1", "resourceId": "r9"}, name="rehydrate with sso token")
