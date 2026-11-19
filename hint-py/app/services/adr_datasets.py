"""The datasets on ADR that a user can choose from.

This module has the rules: which datasets and releases a user can choose from. It asks ADR through the client in
`app/clients/adr_client.py`, which knows how ADR is asked. This module does not.
"""

from typing import Any

from app.clients.adr_client import AdrClient
from app.config import Settings
from app.errors import AdrFetchingDatasetsError
from app.schemas import AdrDatasetType

# The most datasets that one search returns. A search is one call, and one year has fewer datasets than this.
MAX_DATASETS = 1000

# ADR says this to a user who has an account with the single sign-on service, but has never been to ADR itself.
NO_ADR_ACCOUNT = "has not yet logged into ADR"


def _has_resource_of_type(dataset: dict[str, Any], resource_type: str) -> bool:
    return any(resource.get("resource_type") == resource_type for resource in dataset["resources"])


async def find_datasets(
    adr: AdrClient, settings: Settings, dataset_type: AdrDatasetType, show_inaccessible: bool
) -> list[dict[str, Any]]:
    """The datasets that the user can use.

    - `input`: the datasets of this year that have a resource.
    - `output`: the datasets of this year and of last year that have an output zip.

    A dataset has the type of the year it belongs to (for example `country-estimates-27`).
    """
    if dataset_type == AdrDatasetType.INPUT:
        years = [settings.adr_schema_this_year]
    else:
        years = [settings.adr_schema_this_year, settings.adr_schema_last_year]

    # The Vue app never asks to see the datasets that the user has no permission to use. Only tests do.
    answer = await adr.search_datasets(years, MAX_DATASETS, show_inaccessible)
    if not answer.ok:
        raise AdrFetchingDatasetsError(answer.status_code, NO_ADR_ACCOUNT in str(answer.envelope))

    found = answer.data
    if dataset_type == AdrDatasetType.INPUT:
        return [dataset for dataset in found if dataset["resources"]]
    return [dataset for dataset in found if _has_resource_of_type(dataset, settings.adr_output_zip_schema)]


async def find_releases_with_output_zip(adr: AdrClient, settings: Settings, dataset_id: str) -> list[dict[str, Any]]:
    """The releases of a dataset that have an output zip.

    If ADR cannot give the releases, there are none: the answer is an empty list, not an error.
    """
    answer = await adr.releases(dataset_id)
    releases = answer.data if isinstance(answer.data, list) else []
    kept = []
    for release in releases:
        # The list of releases does not have their files. Each release has its own copy of the dataset, so ask for it.
        release_answer = await adr.dataset(dataset_id, release=str(release["id"]))
        if _has_resource_of_type(release_answer.data, settings.adr_output_zip_schema):
            kept.append(release)
    return kept
