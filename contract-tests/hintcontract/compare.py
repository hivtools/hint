"""Deep comparison of normalised golden structures with float tolerance and optional order-insensitivity."""
from __future__ import annotations

import math
from typing import Any

from .bodies import canonical

REL_TOL = 1e-6
ABS_TOL = 1e-9


def _is_num(x: Any) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def diff(expected: Any, actual: Any, path: str = "$", out: list[str] | None = None, limit: int = 25) -> list[str]:
    out = [] if out is None else out
    if len(out) >= limit:
        return out
    if isinstance(expected, dict) and isinstance(actual, dict):
        for k in sorted(set(expected) | set(actual)):
            if k not in actual:
                out.append(f"{path}.{k}: missing in actual (expected {_short(expected[k])})")
            elif k not in expected:
                out.append(f"{path}.{k}: unexpected in actual ({_short(actual[k])})")
            else:
                diff(expected[k], actual[k], f"{path}.{k}", out, limit)
        return out
    if isinstance(expected, list) and isinstance(actual, list):
        if len(expected) != len(actual):
            out.append(f"{path}: list length expected {len(expected)} got {len(actual)}")
        for i, (e, a) in enumerate(zip(expected, actual)):
            diff(e, a, f"{path}[{i}]", out, limit)
        return out
    if _is_num(expected) and _is_num(actual):
        if not math.isclose(expected, actual, rel_tol=REL_TOL, abs_tol=ABS_TOL):
            out.append(f"{path}: expected {expected!r} got {actual!r}")
        return out
    if type(expected) is not type(actual) or expected != actual:
        out.append(f"{path}: expected {_short(expected)} got {_short(actual)}")
    return out


def _short(v: Any, n: int = 160) -> str:
    s = canonical(v) if not isinstance(v, str) else repr(v)
    return s if len(s) <= n else s[:n] + f"...(+{len(s) - n})"


def sort_lists_at(value: Any, patterns: list[str] | None, path: str = "") -> Any:
    """Sort lists whose dotted path (no indexes, e.g. `data.versions`) is in `patterns`."""
    if not patterns:
        return value
    if isinstance(value, dict):
        return {k: sort_lists_at(v, patterns, f"{path}.{k}" if path else k) for k, v in value.items()}
    if isinstance(value, list):
        items = [sort_lists_at(v, patterns, path) for v in value]
        if path in patterns:
            items.sort(key=canonical)
        return items
    return value
