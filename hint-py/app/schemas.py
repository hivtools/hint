"""What the API accepts and returns. Field names are camelCase in JSON because that is what the Vue app already uses."""

from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field
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
