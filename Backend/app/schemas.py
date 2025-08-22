from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any, Literal


# Base Response Models
class BaseResponse(BaseModel):
    success: bool


class SuccessResponse(BaseResponse):
    success: bool = True
    data: Optional[Any] = None


class ErrorResponse(BaseResponse):
    success: bool = False
    error: str
    code: Optional[str] = None
    details: Optional[dict] = None


# Extension Communication Schemas
class ExtensionEndpoint(BaseModel):
    device_id: str = Field(..., description="Device ID associated with extension")
    host: str = Field(..., description="Extension host address")
    port: int = Field(..., description="Extension port number")
    last_seen: datetime = Field(..., description="Last seen timestamp")
    is_active: bool = Field(True, description="Whether extension is currently active")


class ExtensionSessionsRequest(BaseModel):
    since: Optional[datetime] = Field(None, description="Fetch sessions since this timestamp")
    limit: Optional[int] = Field(100, description="Maximum number of sessions to fetch")


class ExtensionSessionsResponse(BaseModel):
    sessions: List['FileSession'] = Field(..., description="List of file sessions")
    hasMore: bool = Field(False, description="Whether more sessions are available")
    lastSyncTime: datetime = Field(..., description="Last synchronization timestamp")


# Device Authentication Schemas
class AuthCodeRequest(BaseModel):
    deviceId: str = Field(..., min_length=1, description="Unique device identifier")
    deviceName: str = Field(..., min_length=1, description="Human-readable device name")
    editor: Literal["vscode", "cursor"] = Field(..., description="Editor type")


class AuthCodeResponse(BaseModel):
    codeId: str = Field(..., description="Unique code identifier")
    expiresAt: datetime = Field(..., description="Code expiration time")


class VerifyCodeRequest(BaseModel):
    codeId: str = Field(..., description="Code identifier from request-code")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit code entered by user")
    deviceId: str = Field(..., description="Device identifier")


class AuthTokenResponse(BaseModel):
    token: str = Field(..., description="JWT authentication token")
    expiresAt: datetime = Field(..., description="Token expiration time")
    refreshToken: str = Field(..., description="Token for refreshing authentication")


class RefreshTokenRequest(BaseModel):
    refreshToken: str = Field(..., description="Refresh token")


class RevokeRequest(BaseModel):
    deviceId: str = Field(..., description="Device identifier")


# Authentication Schemas
class GitHubAuthURL(BaseModel):
    auth_url: str


class GitHubCallback(BaseModel):
    code: str


class AuthToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserInfo(BaseModel):
    id: int
    github_id: str
    username: str
    email: Optional[str]
    avatar_url: Optional[str]


# Session Schemas
class FileSession(BaseModel):
    id: str = Field(..., min_length=1, description="Unique session identifier")
    filePath: str = Field(..., min_length=1, description="Full file path")
    fileName: str = Field(..., min_length=1, description="File name only")
    fileExtension: str = Field(..., description="File extension (e.g., '.ts', '.py')")
    language: str = Field(..., description="Programming language")
    projectName: str = Field(..., description="Project/workspace name")
    projectPath: str = Field(..., description="Project root path")
    sessionStartTime: datetime = Field(..., description="Session start time")
    sessionEndTime: Optional[datetime] = Field(None, description="Session end time")
    totalDuration: int = Field(..., ge=0, description="Total session time in seconds")
    linesAdded: int = Field(..., ge=0, description="Number of lines added")
    linesDeleted: int = Field(..., ge=0, description="Number of lines deleted")
    linesModified: int = Field(..., ge=0, description="Number of lines modified")
    charactersAdded: int = Field(..., ge=0, description="Number of characters added")
    charactersDeleted: int = Field(..., ge=0, description="Number of characters deleted")
    charactersModified: int = Field(..., ge=0, description="Number of characters modified")
    totalEdits: int = Field(..., ge=0, description="Total number of edit operations")
    isActive: bool = Field(..., description="Whether session is currently active")


class SystemInfo(BaseModel):
    editor: Literal["vscode", "cursor"] = Field(..., description="Editor type")
    platform: str = Field(..., description="OS platform (win32, darwin, linux)")


class SessionRequest(BaseModel):
    session: dict = Field(..., description="Session data from extension")
    systemInfo: dict = Field(..., description="System information (editor, platform)")


class SessionResponseData(BaseModel):
    message: str = Field(..., description="Response message")
    sessionId: str = Field(..., description="Created session ID")


class SessionsResponseData(BaseModel):
    sessions: List[dict] = Field(..., description="List of session summaries")
    totalSessions: int = Field(..., description="Total number of sessions")
    totalDuration: int = Field(..., description="Total duration in seconds")


class SessionSummary(BaseModel):
    date: str = Field(..., description="Session date (YYYY-MM-DD)")
    totalDuration: int = Field(..., description="Total duration in seconds")
    sessionCount: int = Field(..., description="Number of sessions")
    topLanguages: List[Dict[str, Any]] = Field(..., description="Top programming languages")
    topProjects: List[Dict[str, Any]] = Field(..., description="Top projects")
    editStats: Dict[str, int] = Field(..., description="Edit statistics summary")


# Health Check Schema
class HealthResponseData(BaseModel):
    status: str = "healthy"
    timestamp: datetime
    version: str = "1.0.0"


# Legacy schemas for backward compatibility (can be removed later)
class CodingSessionRequest(BaseModel):
    filePath: str = Field(..., min_length=1, description="File path")
    fileName: str = Field(..., min_length=1, description="File name")
    fileExtension: Optional[str] = Field(None, description="File extension")
    language: Optional[str] = Field(None, description="Programming language")
    projectName: Optional[str] = Field(None, description="Project name")
    projectPath: Optional[str] = Field(None, description="Project path")
    focusStartTime: datetime = Field(..., description="Focus start time")
    focusEndTime: Optional[datetime] = Field(None, description="Focus end time")
    focusDuration: int = Field(..., ge=0, description="Focus duration in seconds")
    codingDuration: int = Field(..., ge=0, description="Coding duration in seconds")
    editor: Optional[str] = Field(None, description="Editor type")
    platform: Optional[str] = Field(None, description="Platform type")


class CodingSessionResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None


class UserProfile(BaseModel):
    id: str
    username: str
    email: Optional[str] = None


class AuthResponse(BaseModel):
    success: bool
    data: Optional[UserProfile] = None
    error: Optional[str] = None 