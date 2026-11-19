"""ADR API key CRUD and read-only ADR endpoints (datasets, dataset, releases, orgs) against a stub CKAN."""
from __future__ import annotations

import pytest

from hintcontract.adr import API_KEY, LAST_YEAR, SCHEMAS, THIS_YEAR, dataset, resource
from hintcontract.controls import fault
from hintcontract.flows import login_and_open



def with_key(scn, key=API_KEY):
    a = login_and_open(scn)
    with scn.quiet():
        a.post("/adr/key", form={"key": key})
    return a


def world(scn):
    scn.set_stub(
        datasets=[
            dataset("d-input-1", THIS_YEAR, [resource("r1", SCHEMAS["pjnz"]), resource("r2", SCHEMAS["shape"])]),
            dataset("d-input-empty", THIS_YEAR, []),
            dataset("d-output-1", THIS_YEAR, [resource("r3", SCHEMAS["outputZip"]), resource("r4", SCHEMAS["outputSummary"])]),
            dataset("d-output-old", LAST_YEAR, [resource("r5", SCHEMAS["outputZip"])]),
            dataset("d-no-zip", THIS_YEAR, [resource("r6", SCHEMAS["outputSummary"])]),
        ],
        releases={"d-output-1": [{"id": "rel-1", "name": "v1"}, {"id": "rel-2", "name": "v2"}]},
        release_datasets={"d-output-1@rel-1": dataset("d-output-1", THIS_YEAR, [resource("r3", SCHEMAS["outputZip"])]),
                          "d-output-1@rel-2": dataset("d-output-1", THIS_YEAR, [resource("r4", SCHEMAS["outputSummary"])])},
        orgs=[{"id": "org-1", "name": "unaids"}, {"id": "org-2", "name": "ministry"}],
    )


# ----------------------------------------------------------------------------------------------- key
def test_adr_key_lifecycle(scn):
    a = login_and_open(scn)
    a.get("/adr/key", name="no key yet")
    a.post("/adr/key", form={"key": API_KEY}, name="save key")
    a.get("/adr/key", name="key returned decrypted")
    scn.db_rows("adr_key")
    a.post("/adr/key", form={"key": "another-key"}, name="overwrite")
    a.get("/adr/key", name="new key")
    scn.db_rows("adr_key")
    a.delete("/adr/key", name="delete")
    a.get("/adr/key", name="gone")
    a.delete("/adr/key", name="delete again")
    scn.db_rows("adr_key")


def test_adr_key_is_per_user(scn):
    a = login_and_open(scn, "A")
    b = login_and_open(scn, "B", user="naomi-support@imperial.ac.uk")
    a.post("/adr/key", form={"key": "key-of-a"})
    b.get("/adr/key", name="B has no key")
    b.post("/adr/key", form={"key": "key-of-b"})
    a.get("/adr/key", name="A still has own key")
    b.delete("/adr/key", name="B deletes its key")
    a.get("/adr/key", name="A's key untouched")
    scn.db_rows("adr_key")


def test_adr_key_edge_values(scn):
    a = login_and_open(scn)
    a.post("/adr/key", form={"key": ""}, name="empty key")
    a.get("/adr/key", name="empty key read back")
    a.post("/adr/key", form={"key": "café-key"}, name="latin-1 key")
    a.get("/adr/key", name="latin-1 key read back")
    a.post("/adr/key", name="missing key parameter")
    a.post("/adr/key", params={"key": "from-query"}, name="key in query string")
    a.get("/adr/key", name="read back")
    a.post("/adr/key/", form={"key": "slash"}, name="trailing slash")
    a.delete("/adr/key/", name="delete with trailing slash")


@pytest.mark.quirk
def test_adr_key_longer_than_rsa_block_is_a_500(scn):
    """quirk: keys are RSA-encrypted directly, so keys longer than ~446 bytes fail."""
    a = login_and_open(scn)
    a.post("/adr/key", form={"key": "k" * 600}, name="600 char key")
    a.get("/adr/key", name="nothing stored")


def test_adr_key_guest_401(scn):
    a = scn.client("A")
    a.open_app()
    a.get("/adr/key", name="get")
    a.post("/adr/key", form={"key": "x"}, name="post")
    a.delete("/adr/key", name="delete")


# ----------------------------------------------------------------------------------------------- datasets
def test_datasets_input_filter_and_query(scn):
    world(scn)
    a = with_key(scn)
    r = a.get("/adr/datasets", params={"type": "input"}, name="input datasets")
    assert r.status == 200


def test_datasets_output_filter_and_query(scn):
    world(scn)
    a = with_key(scn)
    a.get("/adr/datasets", params={"type": "output"}, name="output datasets (this year and last year)")


def test_datasets_show_inaccessible_flag(scn):
    world(scn)
    a = with_key(scn)
    a.get("/adr/datasets", params={"type": "input", "showInaccessible": "true"}, name="showInaccessible=true")
    a.get("/adr/datasets", params={"type": "input", "showInaccessible": "false"}, name="showInaccessible=false")
    a.get("/adr/datasets", params={"type": "input", "showInaccessible": "maybe"}, name="showInaccessible=maybe")


def test_datasets_bad_requests(scn):
    world(scn)
    a = with_key(scn)
    a.get("/adr/datasets", name="no type")
    a.get("/adr/datasets", params={"type": "bogus"}, name="invalid type")
    a.get("/adr/datasets", params={"type": ""}, name="empty type")


@pytest.mark.quirk
def test_datasets_without_stored_key(scn):
    """quirk: the 'no ADR key' error is the untranslated key `noADRKey` in every language."""
    world(scn)
    a = login_and_open(scn)
    a.get("/adr/datasets", params={"type": "input"}, name="no key stored")
    a.get("/adr/datasets", params={"type": "input"}, headers={"Accept-Language": "fr"}, name="no key stored (fr)")
    a.get("/adr/orgs", params={"permission": "read"}, name="orgs without key")
    a.get("/adr/datasets/d-input-1", name="dataset without key")
    a.get("/adr/datasets/d-input-1/releases", name="releases without key")


def test_datasets_empty_world(scn):
    scn.set_stub(datasets=[])
    a = with_key(scn)
    a.get("/adr/datasets", params={"type": "input"})
    a.get("/adr/datasets", params={"type": "output"}, name="output")


def test_datasets_adr_failures(scn):
    world(scn)
    a = with_key(scn)
    cases = {
        "adr 401 ckan error": {"type": "status", "status": 401,
                                "json": {"success": False, "error": {"message": "Access denied", "__type": "Authorization Error"}}},
        "adr 403 not logged in": {"type": "status", "status": 403,
                                   "json": {"success": False, "error": {"message": "User has not yet logged into ADR", "__type": "x"}}},
        "adr 404": {"type": "status", "status": 404, "json": {"success": False, "error": {"message": "Not found"}}},
        "adr 500 ckan error": {"type": "status", "status": 500, "json": {"success": False, "error": {"message": "Internal"}}},
        "adr 200 but success false": {"type": "status", "status": 200, "json": {"success": False, "error": {"message": "weird"}}},
        "adr 500 html": {"type": "status", "status": 500, "body": "<html>Internal Server Error</html>", "content_type": "text/html"},
        "adr 502 html": {"type": "status", "status": 502, "body": "<html>502 Bad Gateway</html>", "content_type": "text/html"},
        "adr 504 html": {"type": "status", "status": 504, "body": "<html>504 Gateway Time-out</html>", "content_type": "text/html"},
        "adr malformed body": {"type": "raw", "status": 200, "body": "not json at all"},
        "adr connection dropped": {"type": "close"},
    }
    for label, action in cases.items():
        scn.set_faults("stub", [fault(action, r"package_search$")])
        a.get("/adr/datasets", params={"type": "input"}, name=label)
    scn.set_faults("stub", [fault(cases["adr 403 not logged in"], r"package_search$")])
    a.get("/adr/datasets", params={"type": "input"}, headers={"Accept-Language": "pt"}, name="no account, portuguese")


# ----------------------------------------------------------------------------------------------- single dataset
def test_dataset_show(scn):
    world(scn)
    a = with_key(scn)
    a.get("/adr/datasets/d-input-1", name="by id")
    a.get("/adr/datasets/d-output-1", params={"release": "rel-1"}, name="with release")
    a.get("/adr/datasets/unknown-dataset", name="unknown dataset (ckan not found)")
    a.get("/adr/datasets/d-input-1/", name="trailing slash")


def test_dataset_show_adr_failures(scn):
    world(scn)
    a = with_key(scn)
    scn.set_faults("stub", [fault({"type": "status", "status": 500, "json": {"success": False, "error": {"message": "boom"}}}, "package_show")])
    a.get("/adr/datasets/d-input-1", name="adr 500")
    scn.set_faults("stub", [fault({"type": "status", "status": 401, "json": {"success": False, "error": {"message": "Authorization"}}}, "package_show")])
    a.get("/adr/datasets/d-input-1", name="adr 401")
    scn.set_faults("stub", [fault({"type": "raw", "status": 200, "body": "garbage"}, "package_show")])
    a.get("/adr/datasets/d-input-1", name="adr garbage")
    scn.set_faults("stub", [fault({"type": "close"}, "package_show")])
    a.get("/adr/datasets/d-input-1", name="adr dropped connection")


# ----------------------------------------------------------------------------------------------- releases
def test_releases_list(scn):
    world(scn)
    a = with_key(scn)
    a.get("/adr/datasets/d-output-1/releases", name="all releases")
    a.get("/adr/datasets/d-input-1/releases", name="dataset without releases")
    a.get("/adr/datasets/d-output-1/releases", params={"type": "output"}, name="output type keeps releases with a zip")
    a.get("/adr/datasets/d-output-1/releases", params={"type": "input"}, name="other type value is not filtered")


def test_releases_adr_failures(scn):
    world(scn)
    a = with_key(scn)
    scn.set_faults("stub", [fault({"type": "status", "status": 500, "json": {"success": False, "error": {"message": "boom"}}},
                                  "dataset_version_list")])
    a.get("/adr/datasets/d-output-1/releases", name="list fails")
    a.get("/adr/datasets/d-output-1/releases", params={"type": "output"}, name="list fails, type=output")
    scn.set_faults("stub", [fault({"type": "status", "status": 500, "json": {"success": False, "error": {"message": "boom"}}},
                                  "package_show")])
    a.get("/adr/datasets/d-output-1/releases", params={"type": "output"}, name="package_show of a release fails")


# ----------------------------------------------------------------------------------------------- orgs
def test_orgs(scn):
    world(scn)
    a = with_key(scn)
    a.get("/adr/orgs", params={"permission": "create_dataset"}, name="orgs")
    a.get("/adr/orgs", name="permission missing")
    scn.set_faults("stub", [fault({"type": "status", "status": 500, "json": {"success": False, "error": {"message": "boom"}}},
                                  "organization_list_for_user")])
    a.get("/adr/orgs", params={"permission": "read"}, name="adr failure")


def test_adr_endpoints_guest_401(scn):
    a = scn.client("A")
    a.open_app()
    for path in ("/adr/datasets?type=input", "/adr/datasets/x", "/adr/datasets/x/releases", "/adr/orgs?permission=read"):
        a.get(path, name=f"guest {path}")
    a.post("/adr/datasets/x/releases", params={"name": "r"}, name="guest create release")
    a.post("/adr/pjnz", json={"url": "http://x"}, name="guest import pjnz")
    a.post("/adr/output", json={"url": "http://x"}, name="guest import output")
    a.post("/adr/datasets/x/resource/y/z", params={"resourceFileName": "f", "resourceName": "n"}, name="guest push")
