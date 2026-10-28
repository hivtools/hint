"""What the API accepts and returns. Field names are camelCase in JSON because that is what the Vue app already uses."""

from datetime import datetime
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


class VersionFile(CamelModel):
    hash: str
    filename: str
    from_adr: bool
    resource_url: str | None = Field(default=None, alias="resource_url")


class VersionDetails(CamelModel):
    state: str
    files: dict[str, VersionFile]


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
