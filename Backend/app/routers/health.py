from fastapi import APIRouter
from datetime import datetime, timezone
from typing import Union

from app.schemas import HealthResponseData, SuccessResponse, ErrorResponse
from app.config import settings

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("", response_model=Union[SuccessResponse, ErrorResponse])
async def health_check():
    """Health check endpoint to verify server connectivity."""
    health_data = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc),
        "version": settings.app_version
    }
    
    return SuccessResponse(data=health_data) 