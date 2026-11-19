"""Turning bodies into their golden representation (and back into comparable form)."""
from __future__ import annotations

import hashlib
import io
import json
import math
import re
import zipfile
from typing import Any

LARGE_JSON_BYTES = 60_000


def canonical(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def round_floats(value: Any, sig: int = 6) -> Any:
    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value) or value == 0:
            return value
        return float(f"{value:.{sig}g}")
    if isinstance(value, list):
        return [round_floats(v, sig) for v in value]
    if isinstance(value, dict):
        return {k: round_floats(v, sig) for k, v in value.items()}
    return value


def shape(value: Any, depth: int = 0, max_depth: int = 4) -> Any:
    """Compact structural summary: keys, array lengths, element shape of the first element."""
    if isinstance(value, dict):
        if depth >= max_depth:
            return {"$keys": len(value)}
        return {k: shape(v, depth + 1, max_depth) for k, v in sorted(value.items())}
    if isinstance(value, list):
        out: dict[str, Any] = {"$len": len(value)}
        if value and depth < max_depth:
            out["$first"] = shape(value[0], depth + 1, max_depth)
        return out
    if isinstance(value, bool):
        return "bool"
    if isinstance(value, (int, float)):
        return "number"
    if value is None:
        return "null"
    return "string"


def _skeleton(value: Any, nums: list[float]) -> Any:
    """value with every number replaced by '<n>' (numbers are summarised separately, with tolerance)."""
    if isinstance(value, bool) or value is None or isinstance(value, str):
        return value
    if isinstance(value, (int, float)):
        nums.append(float(value))
        return "<n>"
    if isinstance(value, list):
        return [_skeleton(v, nums) for v in value]
    if isinstance(value, dict):
        return {k: _skeleton(v, nums) for k, v in value.items()}
    return value


def large_summary(value: Any) -> dict:
    """Golden representation of a JSON value too big to review: digest of everything but the numbers, plus
    tolerance-comparable statistics of the numbers, plus a structural summary."""
    nums: list[float] = []
    text = canonical(_skeleton(value, nums))
    stats = {"count": len(nums)}
    if nums:
        stats.update(sum=math.fsum(nums), sum_abs=math.fsum(abs(x) for x in nums), min=min(nums), max=max(nums))
    return {"$large_json": {
        "skeleton_sha256": hashlib.sha256(text.encode()).hexdigest(),
        "numbers": stats,
        "shape": shape(value),
    }}


def maybe_large(value: Any) -> Any:
    text = canonical(value)
    if len(text) > LARGE_JSON_BYTES:
        return large_summary(value)
    return value


def zip_summary(content: bytes) -> dict | None:
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as z:
            return {"zip_members": sorted(z.namelist())}
    except zipfile.BadZipFile:
        return None


def binary_summary(content: bytes, kind: str | None) -> dict:
    out: dict[str, Any] = {"non_empty": len(content) > 0}
    if kind == "zip" or (kind is None and content[:2] == b"PK"):
        z = zip_summary(content)
        if z:
            out.update(z)
            out["magic"] = "zip"
            return out
    if kind == "hash":
        out["sha256"] = hashlib.sha256(content).hexdigest()
    if kind == "html" or content[:15].lower().startswith((b"<!doctype html", b"<html")):
        out["magic"] = "html"
    return out


_SCRUB = re.compile(r"\s+")


def scrub_media_type(ct: str) -> str:
    """media type only (parameters such as charset are not part of the contract)."""
    return ct.split(";")[0].strip().lower()
