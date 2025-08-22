from fastapi import APIRouter
from datetime import datetime, timezone
from typing import Union

from app.schemas import SuccessResponse, ErrorResponse

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.get("/me", response_model=Union[SuccessResponse, ErrorResponse])
async def get_current_user_info():
    """
    Simple endpoint that returns a default user for development.
    No authentication required.
    """
    default_user = {
        "id": "dev-user",
        "username": "Developer",
        "email": "dev@example.com",
        "avatar_url": None,
        "extension_token": "dev-token-123",
    }
    
    return SuccessResponse(data=default_user) 