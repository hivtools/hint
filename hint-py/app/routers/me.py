"""GET /me: who is using the app, and the title of this deployment.

Kotlin used to write both into the page. The page is now a static file (see app/routers/pages.py), so the Vue app asks
for them here before it starts. A visitor who has not logged in is the guest user.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Response

from app import schemas
from app.config import Settings, get_settings
from app.dependencies import User, current_user

router = APIRouter(tags=["me"])


@router.get("/me")
async def me(
    user: Annotated[User, Depends(current_user)],
    settings: Annotated[Settings, Depends(get_settings)],
    response: Response,
) -> schemas.SuccessResponse[schemas.Me]:
    # The answer depends on the cookie, so no cache (the browser's, a proxy's or a CDN's) may keep it
    response.headers["Cache-Control"] = "no-store"
    return schemas.success(schemas.Me(user=user.id, title=settings.application_title))
