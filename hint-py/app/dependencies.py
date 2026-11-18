"""Who is making the request, and which projects and versions they may use.

Authentication still lives in the Kotlin app. The nginx proxy in front of both apps asks Kotlin who the user is and
passes the answer on in headers (see proxy/snippets/python.conf), so this API only ever reads headers. When login and
sessions move to Python, only `current_user` needs to change.

The project version a request works on is a separate matter: the browser tab sends it, and `current_version_id` checks
that the user may use it. The Auth0 access token of a single sign-on user comes the same way, in
`current_adr_access_token`.

The project endpoints name a project or version in their path. `owned_project` and `owned_version` check that it is the
user's before the endpoint runs, and give the endpoint an `OwnedProject` or `OwnedVersion`. The repositories do not check
who owns what, so only pass them ids that have been checked. Whether a version is the user's is decided in one place,
`find_owned_version`, which `current_version_id` and `GET /project/current` use too.
"""

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, HTTPException

from app import schemas
from app.db.project_repository import ProjectRepository, get_project_repository
from app.db.version_repository import VersionRepository, get_version_repository
from app.errors import InvalidVersionError, ProjectDoesNotExistError, VersionDoesNotExistError

GUEST_USER = "guest"


@dataclass(frozen=True)
class User:
    id: str
    # For a guest: the versions that the server has given to them. A guest has no projects, so this is the only record
    # of which versions are theirs. It is empty for everyone else.
    guest_version_ids: frozenset[str] = frozenset()

    @property
    def is_guest(self) -> bool:
        return self.id == GUEST_USER


def current_user(
    x_hint_user: Annotated[str | None, Header()] = None,
    x_hint_guest_versions: Annotated[str | None, Header()] = None,
) -> User:
    if not x_hint_user:
        # Only happens if the API is reached without going through the proxy
        raise HTTPException(status_code=401, detail="Missing identity header")
    user = User(id=x_hint_user)
    if not user.is_guest:
        return user
    # A comma separated list, kept in the Kotlin session (see `Session.addGuestVersionId`)
    ids = frozenset(v.strip() for v in (x_hint_guest_versions or "").split(",") if v.strip())
    return User(id=x_hint_user, guest_version_ids=ids)


def current_adr_access_token(x_hint_access_token: Annotated[str | None, Header()] = None) -> str | None:
    """The user's Auth0 access token, which the proxy passes on for single sign-on users so that ADR can be called as
    them. It is None for everyone else (a guest, a password login, anyone whose token the session does not hold).

    The token is a credential. Use it only to call ADR, never put it in a response, a log line or an error message.
    """
    return x_hint_access_token or None


def requested_version_id(x_version_id: Annotated[str | None, Header()] = None) -> str | None:
    """The version id in the X-Version-Id header, exactly as the browser sent it. It is not checked, so it may be missing,
    or be a version that does not exist or belongs to someone else.

    Only use this where such a version is not an error. `GET /project/current` does: it checks the version with
    `find_owned_version` and answers with no project if it is not usable. An endpoint that works on a version should use `current_version_id`,
    which checks that the user may use it.
    """
    return x_version_id or None


async def current_version_id(
    user: Annotated[User, Depends(current_user)],
    version_id: Annotated[str | None, Depends(requested_version_id)],
    versions: Annotated[VersionRepository, Depends(get_version_repository)],
) -> str:
    """The project version this request works on, after checking that the user may use it.

    A logged in user may use a version of one of their projects. A guest has no projects, so they may use the versions
    the server gave to them (`POST /guest/version`). Anything else, including no header at all, is a 403 with the error
    code INVALID_VERSION, and the Vue app then clears the tab's state and starts again from the Projects page. This is
    checked on every request: a version id is hard to guess, but that is not what keeps users out of each other's files.
    """
    if not version_id:
        raise InvalidVersionError()
    if user.is_guest:
        allowed = version_id in user.guest_version_ids
    else:
        allowed = await find_owned_version(version_id, user, versions) is not None
    if not allowed:
        raise InvalidVersionError()
    return version_id


def logged_in_user(user: Annotated[User, Depends(current_user)]) -> User:
    """For endpoints that guests may not use (Kotlin: SecurePaths)."""
    if user.is_guest:
        raise HTTPException(status_code=401, detail="Login required")
    return user


LoggedInUser = Annotated[User, Depends(logged_in_user)]
Projects = Annotated[ProjectRepository, Depends(get_project_repository)]
Versions = Annotated[VersionRepository, Depends(get_version_repository)]


@dataclass(frozen=True)
class OwnedProject:
    """A project of the user who made the request."""

    id: int


@dataclass(frozen=True)
class OwnedVersion:
    """A version of a project of the user who made the request."""

    id: str
    project_id: int


async def find_owned_version(version_id: str, user: User, versions: VersionRepository) -> OwnedVersion | None:
    """The version, if it is in one of the user's projects, otherwise None. Deleted versions count, as in Kotlin."""
    owner = await versions.get_owner(version_id)
    if owner is None or owner.user_id != user.id:
        return None
    return OwnedVersion(id=version_id, project_id=owner.project_id)


async def owned_project(project_id: int, user: LoggedInUser, projects: Projects) -> OwnedProject:
    """The project in the path, after checking that it is the user's. Anything else is projectDoesNotExist, so a user
    cannot tell someone else's project from one that does not exist.

    This runs before FastAPI checks the request body, so a project that is not the user's is an error even when the
    body is wrong too (Kotlin read the body first, see D14 in the porting checklist)."""
    if await projects.get_owner(project_id) != user.id:
        raise ProjectDoesNotExistError
    return OwnedProject(id=project_id)


async def owned_version(project_id: int, version_id: str, user: LoggedInUser, versions: Versions) -> OwnedVersion:
    """The version in the path, after checking that it is in the project in the path and that the project is the
    user's. Anything else is versionDoesNotExist. As for `owned_project`, this comes before the body is checked."""
    version = await find_owned_version(version_id, user, versions)
    if version is None or version.project_id != project_id:
        raise VersionDoesNotExistError
    return version


async def owned_parent_version(
    project_id: int, body: schemas.NewVersionRequest, user: LoggedInUser, versions: Versions
) -> OwnedVersion:
    """The parent of a new version, which is in the request body, checked as `owned_version` checks a version.

    It takes the body, so FastAPI checks the body first, as Kotlin did. The endpoint takes the same `body` too (FastAPI
    parses the request once and gives it to both)."""
    return await owned_version(project_id, body.parent, user, versions)


ProjectOfUser = Annotated[OwnedProject, Depends(owned_project)]
VersionOfUser = Annotated[OwnedVersion, Depends(owned_version)]
ParentVersionOfUser = Annotated[OwnedVersion, Depends(owned_parent_version)]
