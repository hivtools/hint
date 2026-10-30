from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies import User, current_user, requested_version_id

router = APIRouter(prefix="/items", tags=["items"])


# FastAPI matches routes in the order they are declared. "/items/whoami" would also match "/items/{item_id}" (with
# item_id = "whoami", which then fails validation as it is not an int), so this has to come first.
@router.get("/whoami")
async def whoami(
    user: Annotated[User, Depends(current_user)],
    version_id: Annotated[str | None, Depends(requested_version_id)],
):
    return {"user": user.id, "version_id": version_id, "is_guest": user.is_guest}


@router.get("/{item_id}")
async def read_item(item_id: int, user: Annotated[User, Depends(current_user)]):
    return {"item_id": item_id}
