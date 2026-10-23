from typing import Annotated

from fastapi import Depends, FastAPI

from identity import User, current_user

app = FastAPI()


@app.get("/items/whoami")
async def whoami(user: Annotated[User, Depends(current_user)]):
    return {"user": user.id, "version_id": user.version_id, "is_guest": user.is_guest}


@app.get("/items/{item_id}")
async def read_item(item_id: int, user: Annotated[User, Depends(current_user)]):
    return {"item_id": item_id}
