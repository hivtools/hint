import uuid


def new_version_id() -> str:
    """The id of a new project version (Kotlin: Session.generateVersionId)."""
    return str(uuid.uuid4())
