"""
Authentication.

GitHub OAuth uses the authorization-code flow with the exchange performed here
on the server — the client secret must never reach the browser, so the frontend
only ever forwards the short-lived `code`.

When no OAuth app is configured the API advertises that via /api/auth/config and
offers /api/auth/local instead, so the dashboard is demoable before anyone sets
up credentials. That fallback is refused once GitHub is configured, and refused
outright outside debug mode, so it cannot become a production backdoor.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Union

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, status
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas import ErrorResponse, SuccessResponse

router = APIRouter(prefix="/api/auth", tags=["authentication"])

GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"

LOCAL_USER_ID = "dev-user"


class GitHubCallbackRequest(BaseModel):
    code: str


def github_configured() -> bool:
    return bool(settings.github_client_id and settings.github_client_secret)


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.access_token_expire_hours)
    payload = {"sub": subject, "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload.get("sub")
    except JWTError:
        return None


async def current_user_id(authorization: Optional[str] = Header(default=None)) -> str:
    """
    Resolve the caller from a bearer token.

    Falls back to the local user when GitHub isn't configured, which keeps the
    extension flow (which sends no token) working during local demos.
    """
    if authorization and authorization.lower().startswith("bearer "):
        subject = decode_token(authorization.split(" ", 1)[1])
        if subject:
            return subject
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        )

    if github_configured():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required"
        )
    return LOCAL_USER_ID


@router.get("/config", response_model=SuccessResponse)
async def auth_config():
    """Tell the frontend which sign-in methods are actually available."""
    return SuccessResponse(
        data={
            "githubEnabled": github_configured(),
            "clientId": settings.github_client_id or None,
            "localLoginEnabled": (not github_configured()) and settings.debug,
        }
    )


@router.post("/github/callback", response_model=Union[SuccessResponse, ErrorResponse])
async def github_callback(payload: GitHubCallbackRequest, db: AsyncSession = Depends(get_db)):
    """Exchange an authorization code for a session."""
    if not github_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth is not configured on this server",
        )

    async with httpx.AsyncClient(timeout=15) as client:
        token_res = await client.post(
            GITHUB_TOKEN_URL,
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": payload.code,
            },
        )
        token_json = token_res.json()

        # GitHub returns 200 with an `error` field rather than an error status.
        if "error" in token_json:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=token_json.get("error_description", token_json["error"]),
            )

        access_token = token_json.get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub did not return an access token",
            )

        gh_headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
        }
        user_res = await client.get(GITHUB_USER_URL, headers=gh_headers)
        user_res.raise_for_status()
        gh_user = user_res.json()

        email = gh_user.get("email")
        if not email:
            # The primary address is private unless requested separately.
            emails_res = await client.get(GITHUB_EMAILS_URL, headers=gh_headers)
            if emails_res.status_code == 200:
                primary = next(
                    (e for e in emails_res.json() if e.get("primary") and e.get("verified")),
                    None,
                )
                email = primary.get("email") if primary else None

    github_id = str(gh_user["id"])
    existing = await db.execute(select(User).where(User.github_id == github_id))
    user = existing.scalar_one_or_none()
    is_new = user is None

    if user is None:
        user = User(
            github_id=github_id,
            username=gh_user.get("login") or "unknown",
            email=email,
            avatar_url=gh_user.get("avatar_url"),
            access_token=access_token,
        )
        db.add(user)
    else:
        user.username = gh_user.get("login") or user.username
        user.email = email or user.email
        user.avatar_url = gh_user.get("avatar_url") or user.avatar_url
        user.access_token = access_token

    await db.commit()
    await db.refresh(user)

    return SuccessResponse(
        data={
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "avatar_url": user.avatar_url,
                "github_id": user.github_id,
            },
            "access_token": create_access_token(str(user.id)),
            "is_new_user": is_new,
        }
    )


@router.post("/local", response_model=Union[SuccessResponse, ErrorResponse])
async def local_login():
    """
    Sign in as the local user.

    Available only while GitHub OAuth is unconfigured *and* the server is in
    debug mode — this exists so the dashboard can be demoed without credentials,
    not as a way around authentication.
    """
    if github_configured():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Local login is disabled because GitHub OAuth is configured",
        )
    if not settings.debug:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Local login is only available in debug mode",
        )

    return SuccessResponse(
        data={
            "user": {
                "id": LOCAL_USER_ID,
                "username": "Local developer",
                "email": None,
                "avatar_url": None,
            },
            "access_token": create_access_token(LOCAL_USER_ID),
            "is_new_user": False,
        }
    )


@router.get("/me", response_model=Union[SuccessResponse, ErrorResponse])
async def get_current_user_info(
    user_id: str = Depends(current_user_id), db: AsyncSession = Depends(get_db)
):
    """Return the signed-in user."""
    if user_id == LOCAL_USER_ID:
        return SuccessResponse(
            data={
                "id": LOCAL_USER_ID,
                "username": "Local developer",
                "email": None,
                "avatar_url": None,
                "extension_token": "local",
            }
        )

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return SuccessResponse(
        data={
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "avatar_url": user.avatar_url,
            "github_id": user.github_id,
        }
    )
