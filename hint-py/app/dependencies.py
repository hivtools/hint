"""Who is making the request, and which projects and versions they may use.

The user comes from the session cookie (app/services/web_sessions.py): a logged in user, or the guest user for anyone
else. The project version a request works on is a separate matter: the browser tab sends it, and `current_version_id`
checks that the user may use it. The Auth0 access token of a single sign-on user is kept in their session, and
`current_adr_access_token` gives it to the endpoints that call ADR.

The project endpoints name a project or version in their path. `owned_project` and `owned_version` check that it is the
user's before the endpoint runs, and give the endpoint an `OwnedProject` or `OwnedVersion`. The repositories do not check
who owns what, so only pass them ids that have been checked. Whether a version is the user's is decided in one place,
`find_owned_version`, which `current_version_id` and `GET /project/current` use too.

A few endpoints are for the developers, not for the users of the app. They do not use the hint login at all. The caller
sends a GitHub token, and `github_team_member` lets them in only if the token's user is in a set GitHub team.
"""

from dataclasses import dataclass
from typing import Annotated

import structlog
from fastapi import Depends, Header, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import SecretStr

from app import schemas
from app.clients.github_client import GitHub
from app.config import Settings, get_settings
from app.db.project_repository import ProjectRepository, get_project_repository
from app.db.version_repository import VersionRepository, get_version_repository
from app.errors import (
    GitHubTokenRequiredError,
    InvalidVersionError,
    NotInGitHubTeamError,
    ProjectDoesNotExistError,
    VersionDoesNotExistError,
)
from app.services.web_sessions import CurrentWebSession

log = structlog.get_logger()

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


def current_user(session: CurrentWebSession) -> User:
    if session is None or session.user_id is None:
        # Nobody has logged in. A guest who was given versions has a session that lists them
        return User(id=GUEST_USER, guest_version_ids=session.guest_version_ids if session else frozenset())
    return User(id=session.user_id)


def current_adr_access_token(session: CurrentWebSession) -> str | None:
    """The user's Auth0 access token, kept in the session of a single sign-on user so that ADR can be called as them. It
    is None for everyone else (a guest, a dev login). The session ends when the token expires
    (app/services/web_sessions.py), so a token here still works.

    The token is a credential. Use it only to call ADR, never put it in a response, a log line or an error message.
    """
    if session is None or session.user_id is None:
        return None
    return session.access_token or None


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


@dataclass(frozen=True)
class GitHubUser:
    """A member of the GitHub team that may use the developer endpoints."""

    login: str


# Reads "Authorization: Bearer <token>". Without auto_error, a missing header or another scheme gives None, so that this
# API answers with its own error. It also puts the scheme in the API docs.
_bearer = HTTPBearer(
    auto_error=False, description="A GitHub token of a member of the team in HINT_GITHUB_AUTH_TEAM_SLUG"
)


async def github_team_member(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    settings: Annotated[Settings, Depends(get_settings)],
    github: GitHub,
) -> GitHubUser:
    """The caller, if their GitHub token is the token of a member of the team in the settings.

    It does not look at the hint login: a logged in user without a token does not get in. The checks, in order:

    - No token: 401 `githubTokenRequired`.
    - No team in the settings: 403 `notInGitHubTeam`. Nobody gets in, and GitHub is not called.
    - GitHub does not accept the token: 401 `githubTokenInvalid`.
    - The user is not an active member of the team: 403 `notInGitHubTeam`.
    - GitHub does not answer as expected: 502 `githubFailed`.

    Each check calls GitHub twice (who the user is, then the team). Nothing is kept between requests.

    The token is a secret. It is only sent to GitHub. The log has the outcome and the GitHub login (a public user name),
    which says who downloaded what.
    """
    if credentials is None:
        raise GitHubTokenRequiredError()
    token = SecretStr(credentials.credentials)
    org, team = settings.github_auth_org, settings.github_auth_team_slug
    if not org or not team:
        log.warning("No GitHub team is set (HINT_GITHUB_AUTH_ORG, HINT_GITHUB_AUTH_TEAM_SLUG), so nobody gets in")
        raise NotInGitHubTeamError()
    login = await github.login(token)
    if not await github.is_team_member(token, org, team, login):
        log.warning("GitHub user is not in the team", github_login=login, org=org, team=team)
        raise NotInGitHubTeamError()
    log.info("GitHub user is in the team", github_login=login, org=org, team=team)
    return GitHubUser(login=login)


GitHubTeamMember = Annotated[GitHubUser, Depends(github_team_member)]
