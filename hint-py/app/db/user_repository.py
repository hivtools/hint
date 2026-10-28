from sqlalchemy import func, select

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


def get_user_repository(db_session: DbSession) -> UserRepository:
    return UserRepository(db_session)
