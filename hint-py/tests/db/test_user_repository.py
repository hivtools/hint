import pytest

from app.db.user_repository import UserRepository
from app.errors import InvalidEmailError
from tests.support import OTHER_USER, USER


@pytest.fixture
def users(session) -> UserRepository:
    return UserRepository(session)


async def test_find_user_id(users):
    assert await users.find_user_id(USER) == USER


async def test_find_user_id_ignores_case_and_returns_the_stored_spelling(users):
    assert await users.find_user_id(OTHER_USER.upper()) == OTHER_USER


async def test_find_user_id_of_an_unknown_user(users):
    assert await users.find_user_id("nobody@example.com") is None


async def test_the_guest_user_is_found_by_name(users):
    assert await users.find_user_id("guest") == "guest"


async def test_an_email_has_to_have_an_at_sign(users):
    with pytest.raises(InvalidEmailError):
        await users.find_user_id("not-an-email")
