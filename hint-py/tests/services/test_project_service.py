import pytest

from app.db.project_repository import ProjectRepository
from app.db.user_repository import UserRepository
from app.db.version_repository import VersionRepository
from app.errors import VersionDoesNotExistError
from app.services.project_service import ProjectService
from tests.support import OTHER_USER, USER


@pytest.fixture
def service(session) -> ProjectService:
    return ProjectService(ProjectRepository(session), VersionRepository(session), UserRepository(session))


async def test_create_project_has_a_first_version_and_no_note(service, session):
    project = await service.create_project(USER, "p", "a note", True)

    assert (project.name, project.note, project.shared_by, project.is_uploaded) == ("p", None, "", True)
    [version] = project.versions
    assert version.version_number == 1
    [listed] = await ProjectRepository(session).get_projects(USER)
    assert (listed.id, listed.note) == (project.id, "a note")


async def test_promote_version_copies_it_into_a_new_project(service, session):
    original = await service.create_project(USER, "original", None, None)
    original_version = original.versions[0].id
    await VersionRepository(session).save_version_state(original_version, original.id, USER, '{"a": 1}')

    promoted = await service.promote_version(USER, original_version, "promoted", "from original")

    assert promoted.id != original.id
    assert (promoted.name, promoted.is_uploaded) == ("promoted", False)
    [version] = promoted.versions
    assert (version.version_number, version.note) == (1, "from original")
    details = await VersionRepository(session).get_version_details(version.id, promoted.id, USER)
    assert details.state == '{"a": 1}'


async def test_promote_version_does_not_check_who_owns_the_version(service):
    # A quirk of the Kotlin app that is kept (contract test test_promote_does_not_check_version_or_ownership)
    original = await service.create_project(USER, "original", None, None)

    promoted = await service.promote_version(OTHER_USER, original.versions[0].id, "copy", None)

    assert promoted.name == "copy"


async def test_get_version_of_a_missing_version(session):
    with pytest.raises(VersionDoesNotExistError):
        await VersionRepository(session).get_version("nonexistent")
