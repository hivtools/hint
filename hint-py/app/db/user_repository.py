from sqlalchemy import func, insert, select

from app.db.database import DbSession
from app.db.models import User
from app.errors import InvalidEmailError

GUEST_USER = "guest"


class UserRepository:
    def __init__(self, db_session: DbSession):
        self.db_session = db_session

    async def find_user_id(self, email: str) -> str | None:
        """The id of the user with this email (ignoring case), or None if there is no such user."""
        if email == GUEST_USER:
            return await self.db_session.scalar(select(User.id).where(User.id == GUEST_USER))
        if "@" not in email:
            raise InvalidEmailError
        return await self.db_session.scalar(
            select(User.id).where(func.lower(User.username) == email.lower()).order_by(User.id).limit(1)
        )

    async def find_or_add_user(self, email: str) -> str:
        """The id of the user with this email (ignoring case), after adding them if there is none (a first login).
        A new user's id and username are the email, and they have no password."""
        user_id = await self.find_user_id(email)
        if user_id is not None:
            return user_id
        await self.db_session.execute(insert(User).values(id=email, username=email))
        return email


def get_user_repository(db_session: DbSession) -> UserRepository:
    return UserRepository(db_session)
