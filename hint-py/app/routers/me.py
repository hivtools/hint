"""GET /me: who is using the app, and the title of this deployment.

The page of the app is a static file, the same for everybody (see app/routers/pages.py), so the Vue app asks for both
here before it starts: it needs the user to make its store, and shows the title in the browser tab. A visitor who has
not logged in is the guest user.
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
    # no-store: no cache may keep a copy at all, not the browser's, a proxy's or a CDN's (Front Door). The answer is
    # different for each session cookie, so a shared cache that kept it could give one user's name to another, and the
    # browser could show the user from before a login or logout (for example on the back button). (`no-cache`, as on
    # the page, would still let a cache keep a copy, as long as it asks the server before it uses it.)
    response.headers["Cache-Control"] = "no-store"
    return schemas.success(schemas.Me(user=user.id, title=settings.application_title))
