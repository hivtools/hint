"""Helpers to describe a CKAN (ADR) world to the stub server."""
from __future__ import annotations

import hashlib

SCHEMAS = {
    "anc": "inputs-unaids-anc", "programme": "inputs-unaids-art", "pjnz": "inputs-unaids-spectrum-file",
    "population": "inputs-unaids-population", "shape": "inputs-unaids-geographic", "survey": "inputs-unaids-survey",
    "vmmc": "inputs-unaids-vmmc-coverage-outputs", "outputZip": "inputs-unaids-naomi-output-zip",
    "outputSummary": "inputs-unaids-naomi-report", "outputComparison": "inputs-unaids-naomi-comparison-report",
}
THIS_YEAR = "country-estimates-26"
LAST_YEAR = "country-estimates-25"
API_KEY = "4c69b103-4532-4b30-8a37-27a15e56c0bb"


def resource(rid: str, rtype: str, name: str | None = None, **kw) -> dict:
    return {"id": rid, "resource_type": rtype, "name": name or rid, "url": f"http://adr.example/{rid}", **kw}


def dataset(did: str, dtype: str = THIS_YEAR, resources: list[dict] | None = None, **kw) -> dict:
    return {"id": did, "name": did, "title": f"Dataset {did}", "type": dtype, "resources": resources or [], **kw}


def download_path(dataset_id: str, resource_id: str, filename: str) -> str:
    return f"/dataset/{dataset_id}/resource/{resource_id}/download/{filename}"


def file_entry(fixture: str | None = None, **kw) -> dict:
    d = {"fixture": fixture} if fixture else {}
    d.update(kw)
    return d


def resource_url(env, dataset_id: str, resource_id: str, filename: str, sso: bool = False) -> str:
    """the url a client would put in an AdrResource: points at the stub's download endpoint"""
    base = (env.adr_sso_url if sso else env.adr_url).rstrip("/")
    return f"{base}{download_path(dataset_id, resource_id, filename)}"


def md5_hex(b: bytes) -> str:
    return hashlib.md5(b).hexdigest()
