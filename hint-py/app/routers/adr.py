"""Endpoints about ADR, the UNAIDS data repository.

`/adr/schemas` gives the browser the address of ADR and its resource types. The other endpoints read from ADR as the user
(see `app/clients/adr_client.py`), import an input file from ADR into the user's version (see
`app/services/adr_imports.py`), list or make the releases of a dataset (see `app/services/adr_release_service.py`), or
push a file to ADR (see `app/services/adr_resource_service.py`). Only a logged in user can use them.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response

from app.clients.adr_client import Adr
from app.clients.responses import HintResponse
from app.config import Settings, get_settings
from app.dependencies import logged_in_user
from app.request_parameters import Parameters
from app.schemas import AdrDatasetType, AdrResource, FileType, SuccessResponse, success
from app.services.adr_datasets import find_datasets
from app.services.adr_imports import import_input_file
from app.services.adr_release_service import AdrReleases
from app.services.adr_resource_service import AdrResources, FileToPush
from app.services.file_types import INPUT_FILE_TYPES, OUTPUT_FILE_TYPES
from app.services.input_file_service import InputFiles

router = APIRouter(prefix="/adr", tags=["adr"])


@router.get("/schemas")
async def file_type_mappings(settings: Annotated[Settings, Depends(get_settings)]) -> SuccessResponse[dict[str, str]]:
    """The address of ADR, and the resource type that ADR gives to each kind of file. It needs no login and no call to ADR."""
    inputs = {spec.file_type.value: spec.adr_resource_type for spec in INPUT_FILE_TYPES.values()}
    outputs = {spec.key: spec.adr_resource_type for spec in OUTPUT_FILE_TYPES}
    return success({"baseUrl": settings.adr_url, **inputs, **outputs})


@router.get("/datasets", dependencies=[Depends(logged_in_user)])
async def datasets(
    adr: Adr,
    settings: Annotated[Settings, Depends(get_settings)],
    dataset_type: Annotated[AdrDatasetType, Query(alias="type")],
    show_inaccessible: Annotated[bool, Query(alias="showInaccessible")] = False,
) -> Response:
    """The datasets that the user can choose from.

    - `type=input`: the datasets of this year that have a file to import.
    - `type=output`: the datasets of this year and of last year that have an output zip.
    """
    return HintResponse.success(await find_datasets(adr, settings, dataset_type, show_inaccessible)).response()


@router.get("/datasets/{dataset_id}", dependencies=[Depends(logged_in_user)])
async def dataset(dataset_id: str, adr: Adr, release: str | None = None) -> Response:
    """One dataset. If there is a release, the dataset as it was at that release."""
    return (await adr.dataset(dataset_id, release)).response()


@router.get("/datasets/{dataset_id}/releases", dependencies=[Depends(logged_in_user)])
async def releases(
    dataset_id: str,
    adr_releases: AdrReleases,
    release_type: Annotated[str | None, Query(alias="type")] = None,
) -> Response:
    """The releases of a dataset. With `type=output`, only the releases that have an output zip."""
    return (await adr_releases.list(dataset_id, release_type)).response()


@router.post("/datasets/{dataset_id}/releases", dependencies=[Depends(logged_in_user)])
async def new_release(dataset_id: str, adr_releases: AdrReleases, parameters: Parameters) -> Response:
    """Makes a release of the dataset. The parameter `name` is in the query or in a form body (the Vue app sends a form).

    **A release of the dataset with the same name is deleted first, and that cannot be undone.**"""
    return (await adr_releases.create(dataset_id, parameters.required("name"))).response()


@router.post("/datasets/{dataset_id}/resource/{resource_type}/{download_id}", dependencies=[Depends(logged_in_user)])
async def push_resource(
    dataset_id: str,
    resource_type: str,
    download_id: str,
    parameters: Parameters,
    adr_resources: AdrResources,
) -> Response:
    """Pushes a file to ADR as a resource of the dataset: an output of the model (the finished download `download_id`),
    or the version's input file of the type. `resource_type` is the type that ADR gives the resource.

    The parameters are in the query or in a form body (the Vue app sends a form): `resourceFileName` and `resourceName`
    (both always needed), `resourceId` (the resource to replace: needed for an input file), and `description` (needed for
    an output). The version is checked for every type, though only an input file uses it."""
    push = FileToPush(
        dataset_id=dataset_id,
        resource_type=resource_type,
        download_id=download_id,
        file_name=parameters.required("resourceFileName"),
        resource_name=parameters.required("resourceName"),
        resource_id=parameters.get("resourceId"),
        description=parameters.get("description"),
    )
    return (await adr_resources.push(push)).response()


@router.get("/orgs", dependencies=[Depends(logged_in_user)])
async def orgs(adr: Adr, permission: str) -> Response:
    """The organisations on ADR where the user has the permission (for example, the permission to create datasets)."""
    return (await adr.organisations(permission)).response()


def _add_import_route(file_type: FileType) -> None:
    name = file_type.value

    @router.post(
        f"/{name}",
        name=f"import_{name}",
        summary=f"Import the {name} file from ADR and validate it",
        dependencies=[Depends(logged_in_user)],
        response_model=None,
    )
    async def import_file(
        resource: AdrResource,
        adr: Adr,
        input_files: InputFiles,
    ) -> Response:
        return (await import_input_file(file_type, resource, adr, input_files)).response()


for file_type in INPUT_FILE_TYPES:
    _add_import_route(file_type)
