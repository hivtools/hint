"""The kinds of file that can be uploaded, and the size limit of each: the one place that lists them.

There are two tables, in the same format: `INPUT_FILE_TYPES` (a row for each input file) and `OUTPUT_ZIP` (the output zip
that loads a project, see app/services/rehydrate_service.py). Each row says its URL and the most that one upload of it
(the whole request) may be, in bytes. `upload_file_types()` gives all of them. The size limit middleware
(app/middleware/upload_limit.py) reads it at each request, so a test can change a row. The routers, the services and the
tests read the rows too.

The limits are not settings: a change to one is a change to the code. Each is about twice the largest file of its kind
that a saved version used in November 2026. A user on a slow connection hits Azure's limit first: a request that takes
more than 240 seconds is cancelled by the ingress. Each upload in flight also takes its size of ephemeral disk (see
app/middleware/upload_limit.py: about 10 of the largest input files, or 8 output zips, fit at 1 vCPU).
"""

from dataclasses import dataclass
from typing import Protocol

from app.clients.hintr_client import BASELINE_TYPES
from app.schemas import FileType
from app.utils.byte_limit import MB


class UploadFileType(Protocol):
    """A kind of file that can be uploaded."""

    @property
    def url(self) -> str:
        """The path that uploads it."""
        ...

    @property
    def max_upload_bytes(self) -> int:
        """The most that one upload of it (the whole request) may be, in bytes. It is also the most that a download of it
        from ADR may be."""
        ...


@dataclass(frozen=True)
class InputFileType:
    file_type: FileType
    # What hintr accepts as the extension (it says "File must be of type ..." for any other). The check is made here as
    # well, so that a file of another kind is not written to the share.
    extensions: tuple[str, ...]
    max_upload_bytes: int

    @property
    def is_baseline(self) -> bool:
        """hintr validates a baseline file alone, and any other file against the shape file."""
        return self.file_type in BASELINE_TYPES

    @property
    def url(self) -> str:
        """The URL of its upload, get and delete calls."""
        return f"/{'baseline' if self.is_baseline else 'disease'}/{self.file_type.value}"


@dataclass(frozen=True)
class OutputZipType:
    url: str
    max_upload_bytes: int


# The largest input files: the files of 1,000 to 1,800 versions for PJNZ, programme and ANC, and 200 to 300 for the others.
INPUT_FILE_TYPES: dict[FileType, InputFileType] = {
    spec.file_type: spec
    for spec in (
        # A subnational PJNZ is large, and may be a zip: the largest was 187 MB
        InputFileType(FileType.PJNZ, ("PJNZ", "zip"), 400 * MB),
        # The largest was 44 MB
        InputFileType(FileType.SHAPE, ("geojson",), 100 * MB),
        # The largest was 67 MB
        InputFileType(FileType.POPULATION, ("csv",), 150 * MB),
        # The largest was 25 MB
        InputFileType(FileType.SURVEY, ("csv",), 50 * MB),
        # The largest was 8 MB
        InputFileType(FileType.PROGRAMME, ("csv",), 20 * MB),
        # The largest was under 1 MB
        InputFileType(FileType.ANC, ("csv",), 10 * MB),
    )
}

# An output zip has the model results as well as the inputs, so it is bigger. The largest that a saved version used was
# 234 MB (38 of them were used), and the largest `.zip` in the uploads share was 481 MB (no version used it). At 500 MB,
# Azure's limit of 240 seconds is 17 Mbit/s for the whole time, so the limit does not make this worse for anyone. It is a
# rare action. Its extension is not checked: Kotlin did not, and what decides is whether the content is a zip.
OUTPUT_ZIP = OutputZipType("/rehydrate/zip", 500 * MB)


def upload_file_types() -> list[UploadFileType]:
    """Every kind of file that can be uploaded, as the tables are now."""
    return [*INPUT_FILE_TYPES.values(), OUTPUT_ZIP]
