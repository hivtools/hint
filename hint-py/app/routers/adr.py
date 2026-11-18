"""Endpoints that give the browser what it needs to talk about ADR, the UNAIDS data repository."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.config import Settings, get_settings
from app.schemas import SuccessResponse, success

router = APIRouter(prefix="/adr", tags=["adr"])


@router.get("/schemas")
async def file_type_mappings(settings: Annotated[Settings, Depends(get_settings)]) -> SuccessResponse[dict[str, str]]:
    """The resource type that ADR gives to each kind of file, and the address of ADR. Config only: no login, no ADR call."""
    return success(
        {
            "baseUrl": settings.adr_url,
            "anc": settings.adr_anc_schema,
            "programme": settings.adr_art_schema,
            "pjnz": settings.adr_pjnz_schema,
            "population": settings.adr_pop_schema,
            "shape": settings.adr_shape_schema,
            "survey": settings.adr_survey_schema,
            "outputZip": settings.adr_output_zip_schema,
            "outputSummary": settings.adr_output_summary_schema,
            "outputComparison": settings.adr_output_comparison_schema,
        }
    )
