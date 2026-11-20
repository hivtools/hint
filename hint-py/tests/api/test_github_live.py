"""The GitHub check against the real GitHub API, with the token in HINT_GITHUB_TEST_TOKEN.

The fake GitHub (tests/github.py) cannot show that the real GitHub still answers in the way that the client expects.
These tests show it. `make test` does not run them. Run them with `make test-github`. They are skipped if
HINT_GITHUB_TEST_TOKEN is not set. Use a token that can read the organisation's teams (a classic token needs the
read:org scope). The tests only read from GitHub, and they make three calls.
"""

import os
from collections.abc import AsyncIterator

import pytest
import pytest_asyncio
from pydantic import SecretStr

from app.clients.github_client import GitHubClient, create_github_http_client
from app.config import Settings
from app.errors import GitHubTokenInvalidError

pytestmark = [
    pytest.mark.github_live,
    pytest.mark.skipif(not os.environ.get("HINT_GITHUB_TEST_TOKEN"), reason="HINT_GITHUB_TEST_TOKEN is not set"),
]

ORG = "hivtools"
TEAM = "naomi-debug"


@pytest_asyncio.fixture
async def live() -> AsyncIterator[GitHubClient]:
    http = create_github_http_client(Settings())
    yield GitHubClient(http)
    await http.aclose()


def token() -> SecretStr:
    return SecretStr(os.environ["HINT_GITHUB_TEST_TOKEN"])


async def test_the_token_has_a_login_and_github_says_whether_it_is_in_the_team(live: GitHubClient):
    login = await live.login(token())
    assert login
    # Either answer is fine: this shows that GitHub answers the question in a way the client understands
    assert await live.is_team_member(token(), ORG, TEAM, login) in (True, False)


async def test_github_does_not_accept_a_made_up_token(live: GitHubClient):
    with pytest.raises(GitHubTokenInvalidError):
        await live.login(SecretStr("ghp_" + "0" * 36))
