"""The files that hintr has written to the results folder."""

import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def find_result_file(results_dir: str, relative_path: str, task_id: str) -> Path | None:
    """The file at a path that hintr gave, which is relative to the results folder. None if there is no such file there.

    A path that leads out of the results folder (one with `..` in it, or an absolute one) is refused, as if the file
    were missing, so that a bad path cannot make us read or send some other file. hintr's own paths never do this.

    A missing file is logged: it should not happen, and means the folder here is not the one hintr writes to (or that
    results were deleted).
    """
    root = Path(results_dir).resolve()
    path = (root / relative_path).resolve()
    if path.is_relative_to(root) and path.is_file():
        return path
    logger.error("Result file missing where it should exist: %s (task %s, results folder %s)", path, task_id, root)
    return None
