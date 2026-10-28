from datetime import datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ProjectVersion
from app.db.project_repository import ProjectRepository
from app.errors import ProjectDoesNotExistError

USER = "test.user@example.com"
OTHER_USER = "other@example.com"
NOW = datetime(2026, 1, 1, 12, 0, 0)


@pytest.fixture
def repo(session: AsyncSession) -> ProjectRepository:
    return ProjectRepository(session)


async def add_version(
    session: AsyncSession,
    project_id: int,
    version_id: str,
    number: int = 1,
    updated: datetime = NOW,
    deleted: bool = False,
    note: str | None = None,
):
    session.add(
        ProjectVersion(
            id=version_id,
            project_id=project_id,
            created=updated,
            updated=updated,
            deleted=deleted,
            version_number=number,
            note=note,
        )
    )
    await session.flush()


async def test_save_new_project_returns_its_id_and_stores_everything(repo, session):
    project_id = await repo.save_new_project(USER, "p1", shared_by="sharer", note="a note", is_uploaded=True)
    await add_version(session, project_id, "v1")

    project = await repo.get_project(project_id, USER)
    assert project.name == "p1"
    assert project.shared_by == "sharer"
    assert project.note == "a note"
    assert project.is_uploaded is True


async def test_save_new_project_defaults(repo, session):
    project_id = await repo.save_new_project(USER, "p1")
    await add_version(session, project_id, "v1")

    project = await repo.get_project(project_id, USER)
    assert project.shared_by is None
    assert project.note is None
    assert project.is_uploaded is False


async def test_get_project_returns_its_versions_with_their_fields(repo, session):
    project_id = await repo.save_new_project(USER, "p1")
    await add_version(session, project_id, "v1", number=1, updated=NOW, note="first")
    await add_version(session, project_id, "v2", number=2, updated=NOW + timedelta(hours=1))

    project = await repo.get_project(project_id, USER)
    assert [v.id for v in project.versions] == ["v1", "v2"]
    v1 = project.versions[0]
    assert (v1.version_number, v1.note, v1.created, v1.updated) == (1, "first", NOW, NOW)


async def test_get_project_includes_deleted_versions(repo, session):
    project_id = await repo.save_new_project(USER, "p1")
    await add_version(session, project_id, "v1", deleted=True)

    assert [v.id for v in (await repo.get_project(project_id, USER)).versions] == ["v1"]


async def test_get_project_is_not_visible_to_other_users(repo, session):
    project_id = await repo.save_new_project(USER, "p1")
    await add_version(session, project_id, "v1")

    with pytest.raises(ProjectDoesNotExistError):
        await repo.get_project(project_id, OTHER_USER)


async def test_get_project_that_does_not_exist(repo):
    with pytest.raises(ProjectDoesNotExistError):
        await repo.get_project(123, USER)


async def test_get_projects_only_returns_the_users_projects_with_undeleted_versions(repo, session):
    mine = await repo.save_new_project(USER, "mine")
    await add_version(session, mine, "v1")
    await add_version(session, mine, "v2", number=2, deleted=True)
    theirs = await repo.save_new_project(OTHER_USER, "theirs")
    await add_version(session, theirs, "v3")
    no_versions = await repo.save_new_project(USER, "no versions")
    all_deleted = await repo.save_new_project(USER, "all deleted")
    await add_version(session, all_deleted, "v4", deleted=True)

    projects = await repo.get_projects(USER)
    assert [p.id for p in projects] == [mine]
    assert [v.id for v in projects[0].versions] == ["v1"]
    assert no_versions not in [p.id for p in projects]


async def test_get_projects_orders_by_latest_version_update(repo, session):
    old = await repo.save_new_project(USER, "old")
    await add_version(session, old, "v1", updated=NOW)
    recent = await repo.save_new_project(USER, "recent")
    await add_version(session, recent, "v2", updated=NOW + timedelta(days=1))
    # "old" was created first but has the newest version
    await add_version(session, old, "v3", number=2, updated=NOW + timedelta(days=2))

    projects = await repo.get_projects(USER)
    assert [p.name for p in projects] == ["old", "recent"]
    assert [v.id for v in projects[0].versions] == ["v3", "v1"]


async def test_get_project_from_version_id(repo, session):
    project_id = await repo.save_new_project(USER, "p1")
    await add_version(session, project_id, "v1")

    assert (await repo.get_project_from_version_id("v1", USER)).id == project_id


async def test_get_project_from_version_id_for_another_users_version(repo, session):
    project_id = await repo.save_new_project(USER, "p1")
    await add_version(session, project_id, "v1")

    with pytest.raises(ProjectDoesNotExistError):
        await repo.get_project_from_version_id("v1", OTHER_USER)
    with pytest.raises(ProjectDoesNotExistError):
        await repo.get_project_from_version_id("unknown", USER)


async def test_delete_project_marks_all_its_versions_deleted(repo, session):
    project_id = await repo.save_new_project(USER, "p1")
    await add_version(session, project_id, "v1")
    await add_version(session, project_id, "v2", number=2)
    other = await repo.save_new_project(USER, "p2")
    await add_version(session, other, "v3")

    await repo.delete_project(project_id, USER)

    assert [p.id for p in await repo.get_projects(USER)] == [other]


async def test_delete_project_of_another_user(repo, session):
    project_id = await repo.save_new_project(USER, "p1")
    await add_version(session, project_id, "v1")

    with pytest.raises(ProjectDoesNotExistError):
        await repo.delete_project(project_id, OTHER_USER)
    assert len(await repo.get_projects(USER)) == 1


async def test_rename_project_sets_name_and_note(repo, session):
    project_id = await repo.save_new_project(USER, "p1", note="old note")
    await add_version(session, project_id, "v1")

    await repo.rename_project(project_id, USER, "renamed", "new note")

    project = await repo.get_project(project_id, USER)
    assert (project.name, project.note) == ("renamed", "new note")


async def test_rename_project_without_a_note_clears_the_note(repo, session):
    project_id = await repo.save_new_project(USER, "p1", note="old note")
    await add_version(session, project_id, "v1")

    await repo.rename_project(project_id, USER, "renamed")

    assert (await repo.get_project(project_id, USER)).note is None


async def test_rename_project_of_another_user(repo):
    project_id = await repo.save_new_project(USER, "p1")

    with pytest.raises(ProjectDoesNotExistError):
        await repo.rename_project(project_id, OTHER_USER, "renamed")


async def test_update_project_note(repo, session):
    project_id = await repo.save_new_project(USER, "p1")
    await add_version(session, project_id, "v1")

    await repo.update_project_note(project_id, USER, "a note")

    project = await repo.get_project(project_id, USER)
    assert (project.name, project.note) == ("p1", "a note")


async def test_update_project_note_of_another_user(repo):
    project_id = await repo.save_new_project(USER, "p1")

    with pytest.raises(ProjectDoesNotExistError):
        await repo.update_project_note(project_id, OTHER_USER, "a note")
