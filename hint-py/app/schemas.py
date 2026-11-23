"""What the API accepts and returns. Field names are camelCase in JSON because that is what the Vue app already uses."""

from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class SuccessResponse[T](BaseModel):
    """Every successful response is wrapped like this."""

    data: T
    errors: list[Any] = []
    status: str = "success"


def success[T](data: T) -> SuccessResponse[T]:
    return SuccessResponse(data=data)


def empty_success() -> SuccessResponse[bool]:
    return SuccessResponse(data=True)


class Version(CamelModel):
    id: str
    created: datetime
    updated: datetime
    version_number: int
    note: str | None = None


class Project(CamelModel):
    id: int
    name: str
    versions: list[Version]
    shared_by: str | None = ""
    note: str | None = None
    # Called `uploaded` in the JSON (Jackson's name for Kotlin's isUploaded), which the Vue app reads
    is_uploaded: bool | None = Field(default=False, alias="uploaded")


class CurrentProject(CamelModel):
    project: Project | None
    version: Version | None


class AdrDatasetType(StrEnum):
    """The kind of datasets to look for on ADR: the ones that an input file can come from, or an output zip."""

    INPUT = "input"
    OUTPUT = "output"


class AdrResource(CamelModel):
    """A file on ADR that the user imports (Kotlin: AdrResource). The Vue app sends the link of the file, and the ids of
    its dataset and its resource. The ids can be empty, null or left out, which are all the same: no id."""

    url: str
    dataset_id: str = ""
    resource_id: str = ""

    @field_validator("dataset_id", "resource_id", mode="before")
    @classmethod
    def _null_is_no_id(cls, value: object) -> object:
        return "" if value is None else value


class FileType(StrEnum):
    """The kinds of file a version has. The values are the names hint and hintr use."""

    ANC = "anc"
    PJNZ = "pjnz"
    POPULATION = "population"
    PROGRAMME = "programme"
    SHAPE = "shape"
    SURVEY = "survey"
    VMMC = "vmmc"


class VersionFile(CamelModel):
    hash: str
    filename: str
    from_adr: bool
    resource_url: str | None = Field(default=None, alias="resource_url")


class VersionDetails(CamelModel):
    state: str
    files: dict[FileType, VersionFile]


class NewProjectRequest(CamelModel):
    name: str
    note: str | None = None
    is_uploaded: bool | None = None


class CloneProjectRequest(CamelModel):
    emails: list[str]


class NewVersionRequest(CamelModel):
    parent: str
    note: str | None = None


class PromoteVersionRequest(CamelModel):
    name: str
    note: str | None = None


class NoteRequest(CamelModel):
    note: str


class RenameProjectRequest(CamelModel):
    name: str
    note: str | None = None


class HintrFile(BaseModel):
    """A file as hintr is told about it (Kotlin: VersionFileWithPath). The names are the ones hintr reads, so a dump of
    this model is what goes to hintr."""

    path: str
    hash: str
    filename: str
    from_adr: bool = Field(serialization_alias="fromADR")
    resource_url: str | None


class FilterQuery(BaseModel):
    """Which rows of the results of a calibration to send (Kotlin: FilterQuery). A field that is null, or missing, does
    not filter. A field that is an empty list matches nothing."""

    indicator: list[str] | None = None
    calendar_quarter: list[str] | None = None
    age_group: list[str] | None = None
    sex: list[str] | None = None
    area_id: list[str] | None = None
    # Sent as text by the Vue app (a number is accepted too)
    area_level: list[int] | None = None


class DownloadMetadata(BaseModel):
    """What hintr says about a download, of which only what names the file is used."""

    areas: str
    file_label: str
    file_extension: str


class DownloadResult(BaseModel):
    """Where hintr has the file of a download."""

    path: str  # relative to the results folder
    metadata: DownloadMetadata


class ModelOptions(BaseModel):
    """The body of a request to run, validate or calibrate a model. What is in `options` is up to hintr."""

    # A number where there should be text is text, as Jackson does (`"iso3": 5` is "5")
    model_config = ConfigDict(coerce_numbers_to_str=True)

    options: dict[str, Any]
    version: dict[str, str]
    iso3: str | None = None


class ErrorReportError(BaseModel):
    """One of the errors that the user saw, in an error report. Each field may be missing or null, as in Kotlin, where a
    missing field is empty text."""

    detail: str | None = ""
    error: str | None = ""
    key: str | None = ""


class ErrorReport(CamelModel):
    """What the user fills in (and what the Vue app adds about the project) when they report an error.

    The fields are Kotlin's `ErrorReport`. It is sent on as it is, written with the same names, and fields that are not
    here are dropped, as in Kotlin.
    """

    # A number where there should be text is text, as Jackson does
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, coerce_numbers_to_str=True)

    # The email that the user typed, not who is logged in. It is "guest" for a guest
    email: str
    country: str
    project_id: int | None = None
    project_name: str
    section: str
    model_run_id: str
    calibrate_id: str
    download_ids: dict[str, str]
    errors: list[ErrorReportError]
    description: str
    steps_to_reproduce: str
    browser_agent: str
    versions: dict[str, str]
    time_stamp: str
