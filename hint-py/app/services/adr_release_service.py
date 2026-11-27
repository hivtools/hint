"""The releases of a dataset on ADR: the ones a user can choose from, and a new one that the user makes.

ADR keeps releases of a dataset, and every release has a name that is not used by another release of the dataset. A user
who makes a release with the name of an old one means to replace it. So `AdrReleaseService.create` first deletes the old
release with that name, then makes the new one.

This module has the rules. It asks ADR through the client in `app/clients/adr_client.py`, which knows how ADR is asked.
"""

from typing import Annotated

from fastapi import Depends

from app.clients.adr_client import Adr, AdrClient
from app.clients.responses import HintResponse
from app.schemas import AdrDatasetType
from app.services.adr_datasets import has_output_zip


class AdrReleaseService:
    """The releases of a dataset on ADR, as the user. Each method answers with ADR's answer, or with its failure."""

    def __init__(self, adr: AdrClient):
        self._adr = adr

    async def list(self, dataset_id: str, release_type: str | None) -> HintResponse:
        """The releases of a dataset. With the type `output`, only the releases that have an output zip.

        For `output`, if ADR cannot give the releases, there are none: the answer is an empty list, not an error.
        """
        if release_type != AdrDatasetType.OUTPUT:
            return await self._adr.releases(dataset_id)
        answer = await self._adr.releases(dataset_id)
        releases = answer.data if isinstance(answer.data, list) else []
        kept = []
        for release in releases:
            # The list of releases does not have their files. Each release has its own copy of the dataset, so ask for it.
            release_answer = await self._adr.dataset(dataset_id, release=str(release["id"]))
            if has_output_zip(release_answer.data):
                kept.append(release)
        return HintResponse.success(kept)

    async def create(self, dataset_id: str, name: str) -> HintResponse:
        """Makes a release of the dataset with this name. The answer is ADR's answer to the last call, or the failure of
        the first call that fails.

        **If the dataset has a release with this name, that release is deleted first, and the delete cannot be undone.**
        ADR does not allow two releases with the same name. If the delete works and the new release then fails, the
        dataset has lost the old release and has no new one. The user hears that the release failed, and can try again.
        """
        existing = await self._adr.releases(dataset_id)
        if not existing.ok:
            return existing
        # The first one, if there are more than one. ADR does not allow it, so there are not.
        same_name = next((release for release in existing.data if release.get("name") == name), None)
        if same_name is not None:
            deleted = await self._adr.delete_release(str(same_name["id"]))
            if not deleted.ok:
                return deleted
        return await self._adr.create_release(dataset_id, name)


def get_adr_release_service(adr: Adr) -> AdrReleaseService:
    return AdrReleaseService(adr)


AdrReleases = Annotated[AdrReleaseService, Depends(get_adr_release_service)]
