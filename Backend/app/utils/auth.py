import secrets
import random
import string
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from app.config import settings


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=settings.access_token_expire_hours)
    
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def create_refresh_token() -> str:
    """Create a secure refresh token."""
    return secrets.token_urlsafe(32)


def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode an access token."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None


def generate_auth_code() -> str:
    """Generate a 6-digit authentication code."""
    return ''.join(random.choices(string.digits, k=6))


def generate_code_id() -> str:
    """Generate a unique code identifier."""
    return str(uuid.uuid4())


def generate_token_id() -> str:
    """Generate a unique token identifier."""
    return str(uuid.uuid4())


def is_token_expired(expires_at: datetime) -> bool:
    """Check if a token has expired."""
    return datetime.now(timezone.utc) >= expires_at


def get_token_expiry(hours: int = 24) -> datetime:
    """Get token expiry time."""
    return datetime.now(timezone.utc) + timedelta(hours=hours)


def get_code_expiry(minutes: int = 10) -> datetime:
    """Get authentication code expiry time."""
    return datetime.now(timezone.utc) + timedelta(minutes=minutes) 