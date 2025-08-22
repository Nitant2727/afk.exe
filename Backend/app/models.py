from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, Float, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class FileSession(Base):
    __tablename__ = "file_sessions"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False, default="dev-user")  # Simplified user ID
    
    # File Information
    file_path = Column(Text, nullable=False)
    file_name = Column(String, nullable=False)
    file_extension = Column(String, nullable=False)
    language = Column(String, nullable=False)
    
    # Project Information
    project_name = Column(String, nullable=False)
    project_path = Column(Text, nullable=False)
    
    # Time Information
    session_start_time = Column(DateTime, nullable=False)
    session_end_time = Column(DateTime, nullable=True)
    total_duration = Column(Integer, default=0)  # seconds
    
    # Edit Statistics
    lines_added = Column(Integer, default=0)
    lines_deleted = Column(Integer, default=0)
    lines_modified = Column(Integer, default=0)
    characters_added = Column(Integer, default=0)
    characters_deleted = Column(Integer, default=0)
    characters_modified = Column(Integer, default=0)
    total_edits = Column(Integer, default=0)
    
    # System Information
    editor = Column(String, nullable=False)  # vscode, cursor
    platform = Column(String, nullable=False)  # win32, darwin, linux
    
    # Session State
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Indexes
    __table_args__ = (
        Index('idx_session_user', 'user_id'),
        Index('idx_session_project', 'project_name'),
        Index('idx_session_language', 'language'),
        Index('idx_session_start_time', 'session_start_time'),
    )


# Legacy models for backward compatibility (can be removed later)
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    github_id = Column(String, unique=True, nullable=False)
    username = Column(String, nullable=False)
    email = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    access_token = Column(String, nullable=False)  # GitHub access token
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    coding_sessions = relationship("CodingSession", back_populates="user", cascade="all, delete-orphan")


class CodingSession(Base):
    __tablename__ = "coding_sessions"
    
    id = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # File Information
    file_path = Column(Text, nullable=False)
    file_name = Column(String, nullable=False)
    file_extension = Column(String, nullable=True)
    language = Column(String, nullable=True)
    
    # Project Information
    project_name = Column(String, nullable=True)
    project_path = Column(Text, nullable=True)
    
    # Time Information
    focus_start_time = Column(DateTime, nullable=False)
    focus_end_time = Column(DateTime, nullable=True)
    focus_duration = Column(Integer, default=0)  # seconds
    coding_duration = Column(Integer, default=0)  # seconds
    
    # Editor Information
    editor = Column(String, nullable=True)  # vscode, cursor
    platform = Column(String, nullable=True)  # win32, darwin, linux
    
    # Session State
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="coding_sessions")
    
    # Indexes
    __table_args__ = (
        Index('idx_legacy_session_user', 'user_id'),
        Index('idx_legacy_session_project', 'project_name'),
        Index('idx_legacy_session_language', 'language'),
        Index('idx_legacy_session_start_time', 'focus_start_time'),
    ) 