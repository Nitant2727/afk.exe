import asyncio
import aiohttp
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.config import settings
from app.models import User, FileSession
from app.schemas import (
    ExtensionSessionsRequest, 
    ExtensionSessionsResponse, 
    FileSession as FileSessionSchema,
    SystemInfo
)

logger = logging.getLogger(__name__)


class ExtensionClient:
    """Client for communicating with AFK extensions."""
    
    def __init__(self):
        self.session_timeout = aiohttp.ClientTimeout(total=settings.extension_timeout)
        self.retry_attempts = settings.extension_retry_attempts
        self._extension_registry: Dict[str, Dict[str, Any]] = {}
    
    async def discover_extension(self, user: User) -> Optional[Dict[str, Any]]:
        """
        Discover extension endpoint for a user.
        This could be enhanced with service discovery mechanisms.
        """
        # For now, we'll use common ports and localhost
        # This should be enhanced with proper service discovery
        common_ports = [8001, 8002, 8003, 8004, 8005]
        hosts = ["localhost", "127.0.0.1"]
        
        for host in hosts:
            for port in common_ports:
                try:
                    endpoint = f"http://{host}:{port}"
                    async with aiohttp.ClientSession(timeout=self.session_timeout) as session:
                        async with session.get(f"{endpoint}/api/health") as response:
                            if response.status == 200:
                                data = await response.json()
                                # Verify this is the correct user's extension
                                if data.get("userId") == str(user.id) or data.get("githubId") == user.github_id:
                                    extension_info = {
                                        "user_id": user.id,
                                        "github_id": user.github_id,
                                        "host": host,
                                        "port": port,
                                        "endpoint": endpoint,
                                        "last_seen": datetime.now(timezone.utc),
                                        "is_active": True
                                    }
                                    self._extension_registry[str(user.id)] = extension_info
                                    logger.info(f"Discovered extension for user {user.username} at {endpoint}")
                                    return extension_info
                except Exception as e:
                    logger.debug(f"Failed to discover extension at {host}:{port} - {e}")
                    continue
        
        logger.warning(f"Could not discover extension for user {user.username}")
        return None
    
    async def fetch_sessions_from_extension(
        self, 
        user: User, 
        user_token: str,
        since: Optional[datetime] = None,
        limit: int = 100
    ) -> List[FileSessionSchema]:
        """
        Fetch session data from an extension.
        """
        # Get or discover extension endpoint
        extension_info = self._extension_registry.get(str(user.id))
        if not extension_info or not extension_info.get("is_active"):
            extension_info = await self.discover_extension(user)
            if not extension_info:
                raise ConnectionError(f"Cannot connect to extension for user {user.username}")
        
        endpoint = extension_info["endpoint"]
        
        # Prepare request payload
        request_data = ExtensionSessionsRequest(
            since=since,
            limit=limit
        ).dict()
        
        # Attempt to fetch sessions with retry logic
        for attempt in range(self.retry_attempts):
            try:
                async with aiohttp.ClientSession(timeout=self.session_timeout) as session:
                    async with session.post(
                        f"{endpoint}/api/sessions/export",
                        json=request_data,
                        headers={"Authorization": f"Bearer {user_token}"}
                    ) as response:
                        if response.status == 200:
                            data = await response.json()
                            
                            # Parse response
                            sessions_response = ExtensionSessionsResponse(**data)
                            
                            # Update extension registry
                            extension_info["last_seen"] = datetime.now(timezone.utc)
                            extension_info["is_active"] = True
                            
                            logger.info(f"Fetched {len(sessions_response.sessions)} sessions from extension for user {user.username}")
                            return sessions_response.sessions
                        
                        elif response.status == 404:
                            logger.warning(f"Extension endpoint not found for user {user.username}")
                            break
                        
                        elif response.status == 401:
                            logger.warning(f"Authentication failed for user {user.username}")
                            break
                        
                        else:
                            logger.warning(f"Extension returned status {response.status} for user {user.username}")
                            
            except asyncio.TimeoutError:
                logger.warning(f"Timeout connecting to extension for user {user.username} (attempt {attempt + 1})")
            except Exception as e:
                logger.error(f"Error fetching sessions from extension for user {user.username}: {e}")
            
            if attempt < self.retry_attempts - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        # Mark extension as inactive if all attempts failed
        if extension_info:
            extension_info["is_active"] = False
        
        raise ConnectionError(f"Failed to fetch sessions from extension for user {user.username} after {self.retry_attempts} attempts")
    
    async def sync_user_sessions(
        self, 
        user: User, 
        user_token: str,
        db: AsyncSession,
        since: Optional[datetime] = None
    ) -> int:
        """
        Sync sessions from extension to database for a specific user.
        Returns the number of sessions synced.
        """
        try:
            # Fetch sessions from extension
            sessions = await self.fetch_sessions_from_extension(user, user_token, since)
            
            if not sessions:
                logger.info(f"No new sessions found for user {user.username}")
                return 0
            
            synced_count = 0
            
            for session_data in sessions:
                # Check if session already exists
                existing_session_query = select(FileSession).where(
                    FileSession.id == session_data.id,
                    FileSession.user_id == user.id
                )
                existing_session_result = await db.execute(existing_session_query)
                existing_session = existing_session_result.scalar_one_or_none()
                
                if existing_session:
                    # Update existing session
                    await db.execute(
                        update(FileSession)
                        .where(FileSession.id == session_data.id, FileSession.user_id == user.id)
                        .values(
                            file_path=session_data.filePath,
                            file_name=session_data.fileName,
                            file_extension=session_data.fileExtension,
                            language=session_data.language,
                            project_name=session_data.projectName,
                            project_path=session_data.projectPath,
                            session_start_time=session_data.sessionStartTime,
                            session_end_time=session_data.sessionEndTime,
                            total_duration=session_data.totalDuration,
                            lines_added=session_data.linesAdded,
                            lines_deleted=session_data.linesDeleted,
                            lines_modified=session_data.linesModified,
                            characters_added=session_data.charactersAdded,
                            characters_deleted=session_data.charactersDeleted,
                            characters_modified=session_data.charactersModified,
                            total_edits=session_data.totalEdits,
                            is_active=session_data.isActive,
                            updated_at=datetime.now(timezone.utc)
                        )
                    )
                    logger.debug(f"Updated session {session_data.id} for user {user.username}")
                else:
                    # Create new session
                    new_session = FileSession(
                        id=session_data.id,
                        user_id=user.id,  # Use user_id instead of device_id
                        file_path=session_data.filePath,
                        file_name=session_data.fileName,
                        file_extension=session_data.fileExtension,
                        language=session_data.language,
                        project_name=session_data.projectName,
                        project_path=session_data.projectPath,
                        session_start_time=session_data.sessionStartTime,
                        session_end_time=session_data.sessionEndTime,
                        total_duration=session_data.totalDuration,
                        lines_added=session_data.linesAdded,
                        lines_deleted=session_data.linesDeleted,
                        lines_modified=session_data.linesModified,
                        characters_added=session_data.charactersAdded,
                        characters_deleted=session_data.charactersDeleted,
                        characters_modified=session_data.charactersModified,
                        total_edits=session_data.totalEdits,
                        editor="unknown",  # Can be populated from extension data
                        platform="unknown",  # Can be populated from extension data
                        is_active=session_data.isActive
                    )
                    db.add(new_session)
                    logger.debug(f"Created new session {session_data.id} for user {user.username}")
                
                synced_count += 1
            
            await db.commit()
            logger.info(f"Synced {synced_count} sessions for user {user.username}")
            return synced_count
            
        except ConnectionError as e:
            logger.warning(f"Failed to sync sessions for user {user.username}: {e}")
            return 0
        except Exception as e:
            await db.rollback()
            logger.error(f"Error syncing sessions for user {user.username}: {e}")
            raise
    
    def get_extension_status(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get the current status of an extension for a user."""
        return self._extension_registry.get(user_id)
    
    def mark_extension_inactive(self, user_id: str):
        """Mark an extension as inactive for a user."""
        if user_id in self._extension_registry:
            self._extension_registry[user_id]["is_active"] = False


# Global instance
extension_client = ExtensionClient() 