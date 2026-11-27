"""The kinds of file that this API knows, and all that it knows of each: the one place that lists them.

There are two tables. `INPUT_FILE_TYPES` has a row for each input file: its file type, the resource type that ADR gives it,
its extensions, the URL of its upload and its size limit. `OUTPUT_FILE_TYPES` has a row for each output that is pushed to
ADR: its name in `GET /adr/schemas` and its resource type on ADR. One of them, `OUTPUT_ZIP`, can be uploaded too, to load
a project (see app/services/rehydrate_service.py), so it has a URL and a size limit as well.

`upload_file_types()` gives every kind of file that can be uploaded. The size limit middleware
(app/middleware/upload_limit.py) reads it at each request, so a test can change a row. The routers, the services and the
tests read the rows too.

The limits are not settings: a change to one is a change to the code. Each is about twice the largest file of its kind
that a saved version used in November 2026. A user on a slow connection hits Azure's limit first: a request that takes
more than 240 seconds is cancelled by the ingress. Each upload in flight also takes its size of ephemeral disk (see
app/middleware/upload_limit.py: about 10 of the largest input files, or 8 output zips, fit at 1 vCPU).

The resource types on ADR are not settings either. Kotlin read them from the `config.properties` that is built into it, no
deployment changes them, and they have been the same since August 2020, on the dev ADR and on the real one.
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
    # The type that ADR gives to a resource of this kind
    adr_resource_type: str
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
class OutputFileType:
    """An output of the model that a user can push to ADR."""

    # Its name in `GET /adr/schemas`
    key: str
    # The type that ADR gives to a resource of this kind
    adr_resource_type: str


@dataclass(frozen=True)
class OutputZipType(OutputFileType):
    """The output zip, which can also be uploaded to load a project."""

    url: str
    max_upload_bytes: int


# The largest input files: the files of 1,000 to 1,800 versions for PJNZ, programme and ANC, and 200 to 300 for the others.
INPUT_FILE_TYPES: dict[FileType, InputFileType] = {
    spec.file_type: spec
    for spec in (
        # A subnational PJNZ is large, and may be a zip: the largest was 187 MB
        InputFileType(FileType.PJNZ, "inputs-unaids-spectrum-file", ("PJNZ", "zip"), 400 * MB),
        # The largest was 44 MB
        InputFileType(FileType.SHAPE, "inputs-unaids-geographic", ("geojson",), 100 * MB),
        # The largest was 67 MB
        InputFileType(FileType.POPULATION, "inputs-unaids-population", ("csv",), 150 * MB),
        # The largest was 25 MB
        InputFileType(FileType.SURVEY, "inputs-unaids-survey", ("csv",), 50 * MB),
        # The largest was 8 MB
        InputFileType(FileType.PROGRAMME, "inputs-unaids-art", ("csv",), 20 * MB),
        # The largest was under 1 MB
        InputFileType(FileType.ANC, "inputs-unaids-anc", ("csv",), 10 * MB),
    )
}

# An output zip has the model results as well as the inputs, so it is bigger. The largest that a saved version used was
# 234 MB (38 of them were used), and the largest `.zip` in the uploads share was 481 MB (no version used it). At 500 MB,
# Azure's limit of 240 seconds is 17 Mbit/s for the whole time, so the limit does not make this worse for anyone. It is a
# rare action. Its extension is not checked: Kotlin did not, and what decides is whether the content is a zip.
OUTPUT_ZIP = OutputZipType("outputZip", "inputs-unaids-naomi-output-zip", "/rehydrate/zip", 500 * MB)

# The reports that the model makes. They are pushed to ADR, and are not uploaded.
OUTPUT_SUMMARY = OutputFileType("outputSummary", "inputs-unaids-naomi-report")
OUTPUT_COMPARISON = OutputFileType("outputComparison", "inputs-unaids-naomi-comparison-report")

# The outputs that a user can push to ADR
OUTPUT_FILE_TYPES: tuple[OutputFileType, ...] = (OUTPUT_ZIP, OUTPUT_SUMMARY, OUTPUT_COMPARISON)


def upload_file_types() -> list[UploadFileType]:
    """Every kind of file that can be uploaded, as the tables are now."""
    return [*INPUT_FILE_TYPES.values(), OUTPUT_ZIP]


def input_file_type_on_adr(resource_type: str) -> InputFileType | None:
    """The kind of input file that ADR gives this resource type to, or None if it is not one."""
    return next((spec for spec in INPUT_FILE_TYPES.values() if spec.adr_resource_type == resource_type), None)


def is_output_on_adr(resource_type: str) -> bool:
    """Whether ADR gives this resource type to an output of the model."""
    return any(spec.adr_resource_type == resource_type for spec in OUTPUT_FILE_TYPES)
