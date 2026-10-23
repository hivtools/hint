from __future__ import annotations

import shutil
from pathlib import Path


def clean_dir(d: Path):
    d = Path(d)
    d.mkdir(parents=True, exist_ok=True)
    for p in d.iterdir():
        if p.is_dir():
            shutil.rmtree(p, ignore_errors=True)
        else:
            try:
                p.unlink()
            except FileNotFoundError:
                pass
