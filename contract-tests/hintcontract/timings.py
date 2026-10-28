"""How long each request took, to compare two implementations of the API.

Run the suite with `--timings-file FILE` (e.g. `scripts/dev.sh test --timings-file kotlin.json`) and every request the
tests send is timed, including through nginx. Run it again against the other implementation, then:

    python -m hintcontract.timings kotlin.json python.json

prints, for each endpoint, how many requests were made and the median and 95th percentile time of each run.

These are single requests on a development machine, with the mock model, so treat small differences as noise. The first
requests after a start are slow (warm up), so run the suite twice and use the second.
"""
from __future__ import annotations

import json
import re
import statistics
import sys
from pathlib import Path

_records: list[dict] = []


def record(scenario: str, method: str, path: str, status: int, seconds: float) -> None:
    _records.append({"scenario": scenario, "method": method, "path": path, "status": status, "ms": seconds * 1000})


def write(file: Path, label: str) -> None:
    file.write_text(json.dumps({"label": label, "requests": _records}, indent=1) + "\n")


def endpoint(request: dict) -> str:
    """The endpoint a request was for: the method and path with ids (<PROJECT:1>, <UUID:2>, numbers) removed."""
    path = re.sub(r"<([A-Z_]+):\d+>", r"<\1>", request["path"])
    path = re.sub(r"/\d+(?=/|$)", "/<N>", path)
    return f"{request['method']} {path}"


def _percentile(values: list[float], pct: float) -> float:
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, round(pct / 100 * (len(ordered) - 1)))]


def _by_endpoint(doc: dict) -> dict[str, list[float]]:
    groups: dict[str, list[float]] = {}
    for r in doc["requests"]:
        groups.setdefault(endpoint(r), []).append(r["ms"])
    return groups


def compare(files: list[Path]) -> str:
    docs = [json.loads(f.read_text()) for f in files]
    groups = [_by_endpoint(d) for d in docs]
    names = [f.stem for f in files]
    rows = sorted(set().union(*groups))
    width = max(len(r) for r in rows)
    head = f"{'endpoint':<{width}}  " + "  ".join(f"{n[:11]:>11}: n  p50  p95" for n in names)
    if len(docs) == 2:
        head += "   p50 ratio"
    lines = [head]
    for row in rows:
        cells, p50s = [], []
        for g in groups:
            v = g.get(row)
            if v:
                p50s.append(statistics.median(v))
                cells.append(f"{len(v):>14d} {p50s[-1]:4.0f} {_percentile(v, 95):4.0f}")
            else:
                p50s.append(None)
                cells.append(" " * 14 + "   -    -")
        line = f"{row:<{width}}  " + "  ".join(cells)
        if len(docs) == 2 and p50s[0] and p50s[1]:
            line += f"   {p50s[1] / p50s[0]:9.2f}x"
        lines.append(line)
    totals = [sum(sum(v) for v in g.values()) for g in groups]
    lines.append("")
    lines.append("total time of all requests (ms): " + ", ".join(f"{n}: {t:.0f}" for n, t in zip(names, totals, strict=True)))
    lines.append("times in ms. p50 ratio is the second run divided by the first, below 1 means the second is faster")
    return "\n".join(lines)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    print(compare([Path(a) for a in sys.argv[1:]]))
