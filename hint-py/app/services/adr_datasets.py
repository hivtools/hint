"""The datasets on ADR that a user can choose from.

This module has the rules: which datasets a user can choose from (the releases are in
`app/services/adr_release_service.py`). It asks ADR through the client in `app/clients/adr_client.py`, which knows how ADR
is asked. This module does not.
"""

from typing import Any

from app.clients.adr_client import AdrClient
from app.config import Settings
from app.errors import AdrFetchingDatasetsError
from app.schemas import AdrDatasetType
from app.services.file_types import OUTPUT_ZIP

# The most datasets that one search returns. A search is one call, and one year has fewer datasets than this.
MAX_DATASETS = 1000

# ADR says this to a user who has an account with the single sign-on service, but has never been to ADR itself.
NO_ADR_ACCOUNT = "has not yet logged into ADR"


def has_output_zip(dataset: dict[str, Any]) -> bool:
    """Whether the dataset (or a release of it) has an output zip."""
    return any(resource.get("resource_type") == OUTPUT_ZIP.adr_resource_type for resource in dataset["resources"])


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
    return [dataset for dataset in found if has_output_zip(dataset)]
