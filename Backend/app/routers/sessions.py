from fastapi import APIRouter, HTTPException, status, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc, distinct
from datetime import datetime, timezone, timedelta
from typing import Union, Optional, List
from enum import Enum
import logging

from app.database import get_db
from app.models import FileSession
from app.schemas import (
    SessionRequest, SuccessResponse, ErrorResponse
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])
logger = logging.getLogger(__name__)

# Default user for all sessions (no authentication)
DEFAULT_USER_ID = "dev-user"


class TimeFilter(str, Enum):
    TODAY = "today"
    YESTERDAY = "yesterday"
    THIS_WEEK = "this_week"
    LAST_WEEK = "last_week"
    THIS_MONTH = "this_month"
    LAST_MONTH = "last_month"
    LAST_7_DAYS = "last_7_days"
    LAST_30_DAYS = "last_30_days"
    CUSTOM = "custom"


def get_time_range(time_filter: TimeFilter, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """Get start and end datetime for time filter."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    if time_filter == TimeFilter.TODAY:
        return today_start, now
    elif time_filter == TimeFilter.YESTERDAY:
        yesterday_start = today_start - timedelta(days=1)
        return yesterday_start, today_start
    elif time_filter == TimeFilter.THIS_WEEK:
        week_start = today_start - timedelta(days=now.weekday())
        return week_start, now
    elif time_filter == TimeFilter.LAST_WEEK:
        week_start = today_start - timedelta(days=now.weekday() + 7)
        week_end = week_start + timedelta(days=7)
        return week_start, week_end
    elif time_filter == TimeFilter.THIS_MONTH:
        month_start = today_start.replace(day=1)
        return month_start, now
    elif time_filter == TimeFilter.LAST_MONTH:
        if now.month == 1:
            last_month_start = now.replace(year=now.year-1, month=12, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            last_month_start = now.replace(month=now.month-1, day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Get last day of last month
        if now.month == 1:
            last_month_end = now.replace(year=now.year-1, month=12, day=31, hour=23, minute=59, second=59)
        else:
            import calendar
            last_day = calendar.monthrange(now.year, now.month-1)[1]
            last_month_end = now.replace(month=now.month-1, day=last_day, hour=23, minute=59, second=59)
        
        return last_month_start, last_month_end
    elif time_filter == TimeFilter.LAST_7_DAYS:
        return now - timedelta(days=7), now
    elif time_filter == TimeFilter.LAST_30_DAYS:
        return now - timedelta(days=30), now
    elif time_filter == TimeFilter.CUSTOM:
        return start_date, end_date
    else:
        return None, None


@router.post("", response_model=Union[SuccessResponse, ErrorResponse])
async def create_session(
    session_request: SessionRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit file session data from the extension.
    No authentication required for simplicity.
    """
    try:
        session_data = session_request.session
        system_info = session_request.systemInfo
        
        # Check if session already exists (update vs create)
        existing_session_query = select(FileSession).where(
            and_(
                FileSession.id == session_data.get("id"),
                FileSession.user_id == DEFAULT_USER_ID
            )
        )
        existing_session_result = await db.execute(existing_session_query)
        existing_session = existing_session_result.scalar_one_or_none()
        
        if existing_session:
            # Update existing session
            existing_session.file_path = session_data.get("filePath")
            existing_session.file_name = session_data.get("fileName")
            existing_session.file_extension = session_data.get("fileExtension")
            existing_session.language = session_data.get("language")
            existing_session.project_name = session_data.get("projectName")
            existing_session.project_path = session_data.get("projectPath")
            existing_session.session_start_time = datetime.fromisoformat(session_data.get("sessionStartTime").replace('Z', '+00:00'))
            existing_session.session_end_time = datetime.fromisoformat(session_data.get("sessionEndTime").replace('Z', '+00:00')) if session_data.get("sessionEndTime") else None
            existing_session.total_duration = session_data.get("totalDuration")
            existing_session.lines_added = session_data.get("linesAdded")
            existing_session.lines_deleted = session_data.get("linesDeleted")
            existing_session.lines_modified = session_data.get("linesModified")
            existing_session.characters_added = session_data.get("charactersAdded")
            existing_session.characters_deleted = session_data.get("charactersDeleted")
            existing_session.characters_modified = session_data.get("charactersModified")
            existing_session.total_edits = session_data.get("totalEdits")
            existing_session.editor = system_info.get("editor")
            existing_session.platform = system_info.get("platform")
            existing_session.is_active = session_data.get("isActive")
            existing_session.updated_at = datetime.now(timezone.utc)
        else:
            # Create new session
            new_session = FileSession(
                id=session_data.get("id"),
                user_id=DEFAULT_USER_ID,
                file_path=session_data.get("filePath"),
                file_name=session_data.get("fileName"),
                file_extension=session_data.get("fileExtension"),
                language=session_data.get("language"),
                project_name=session_data.get("projectName"),
                project_path=session_data.get("projectPath"),
                session_start_time=datetime.fromisoformat(session_data.get("sessionStartTime").replace('Z', '+00:00')),
                session_end_time=datetime.fromisoformat(session_data.get("sessionEndTime").replace('Z', '+00:00')) if session_data.get("sessionEndTime") else None,
                total_duration=session_data.get("totalDuration"),
                lines_added=session_data.get("linesAdded"),
                lines_deleted=session_data.get("linesDeleted"),
                lines_modified=session_data.get("linesModified"),
                characters_added=session_data.get("charactersAdded"),
                characters_deleted=session_data.get("charactersDeleted"),
                characters_modified=session_data.get("charactersModified"),
                total_edits=session_data.get("totalEdits"),
                editor=system_info.get("editor"),
                platform=system_info.get("platform"),
                is_active=session_data.get("isActive")
            )
            db.add(new_session)
        
        await db.commit()
        
        response_data = {
            "sessionId": session_data.get("id"),
            "processed": True,
            "timestamp": datetime.now(timezone.utc)
        }
        
        return SuccessResponse(data=response_data)
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to process session data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(error="Failed to process session data").dict()
        )


@router.get("", response_model=Union[SuccessResponse, ErrorResponse])
async def get_sessions(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    projectName: Optional[str] = Query(None, alias="projectName"),
    language: Optional[str] = Query(None),
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to")
):
    """
    Get file sessions with optional filtering.
    No authentication required.
    """
    try:
        # Build query for user's sessions
        query = select(FileSession).where(FileSession.user_id == DEFAULT_USER_ID)
        
        # Apply filters
        if projectName:
            query = query.where(FileSession.project_name == projectName)
        if language:
            query = query.where(FileSession.language == language)
        if from_date:
            query = query.where(FileSession.session_start_time >= from_date)
        if to_date:
            query = query.where(FileSession.session_start_time <= to_date)
        
        # Get total count for pagination
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()
        
        # Get sessions with pagination
        sessions_query = query.order_by(desc(FileSession.session_start_time)).offset(offset).limit(limit)
        sessions_result = await db.execute(sessions_query)
        sessions = sessions_result.scalars().all()
        
        # Convert to response format
        session_list = []
        for session in sessions:
            session_dict = {
                "id": session.id,
                "filePath": session.file_path,
                "fileName": session.file_name,
                "fileExtension": session.file_extension,
                "language": session.language,
                "projectName": session.project_name,
                "sessionStartTime": session.session_start_time.isoformat(),
                "sessionEndTime": session.session_end_time.isoformat() if session.session_end_time else None,
                "totalDuration": session.total_duration,
                "linesAdded": session.lines_added,
                "linesDeleted": session.lines_deleted,
                "linesModified": session.lines_modified,
                "charactersAdded": session.characters_added,
                "charactersDeleted": session.characters_deleted,
                "charactersModified": session.characters_modified,
                "totalEdits": session.total_edits,
                "editor": session.editor,
                "platform": session.platform,
                "isActive": session.is_active
            }
            session_list.append(session_dict)
        
        response_data = {
            "sessions": session_list,
            "total": total_count,
            "totalDuration": sum(s.total_duration for s in sessions),
            "offset": offset,
            "limit": limit
        }
        
        return SuccessResponse(data=response_data)
        
    except Exception as e:
        logger.error(f"Failed to get sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(error="Failed to retrieve sessions").dict()
        )


@router.get("/projects", response_model=Union[SuccessResponse, ErrorResponse])
async def get_unique_projects(db: AsyncSession = Depends(get_db)):
    """
    Get list of unique project names from sessions.
    No authentication required.
    """
    try:
        query = select(distinct(FileSession.project_name)).where(FileSession.project_name.isnot(None))
        result = await db.execute(query)
        projects = result.scalars().all()
        
        logger.info(f"Found {len(projects)} projects: {projects}")
        
        # Return simple array of project names
        project_list = [project for project in projects if project]
        
        return SuccessResponse(data=project_list)
        
    except Exception as e:
        logger.error(f"Failed to get projects: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(error=f"Failed to retrieve projects: {str(e)}").dict()
        )


@router.get("/languages", response_model=Union[SuccessResponse, ErrorResponse])
async def get_unique_languages(db: AsyncSession = Depends(get_db)):
    """
    Get list of unique programming languages from sessions.
    No authentication required.
    """
    try:
        query = select(distinct(FileSession.language)).where(FileSession.language.isnot(None))
        result = await db.execute(query)
        languages = result.scalars().all()
        
        logger.info(f"Found {len(languages)} languages: {languages}")
        
        # Return simple array of language names
        language_list = [language for language in languages if language]
        
        return SuccessResponse(data=language_list)
        
    except Exception as e:
        logger.error(f"Failed to get languages: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(error=f"Failed to retrieve languages: {str(e)}").dict()
        )


@router.get("/stats", response_model=Union[SuccessResponse, ErrorResponse])
async def get_session_statistics(
    db: AsyncSession = Depends(get_db),
    time_filter: Optional[TimeFilter] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    project_name: Optional[str] = Query(None),
    language: Optional[str] = Query(None)
):
    """
    Get session statistics with optional filtering.
    No authentication required.
    """
    try:
        # Build base query
        query = select(FileSession).where(FileSession.user_id == DEFAULT_USER_ID)
        
        # Apply time filtering
        if time_filter:
            filter_start, filter_end = get_time_range(time_filter, start_date, end_date)
            if filter_start and filter_end:
                query = query.where(
                    and_(
                        FileSession.session_start_time >= filter_start,
                        FileSession.session_start_time <= filter_end
                    )
                )
        
        # Apply other filters
        if project_name:
            query = query.where(FileSession.project_name == project_name)
        if language:
            query = query.where(FileSession.language == language)
        
        # Execute query
        result = await db.execute(query)
        sessions = result.scalars().all()
        
        # Calculate statistics
        total_sessions = len(sessions)
        total_duration = sum(s.total_duration for s in sessions)
        total_lines_added = sum(s.lines_added for s in sessions)
        total_lines_deleted = sum(s.lines_deleted for s in sessions)
        total_lines_modified = sum(s.lines_modified for s in sessions)
        total_edits = sum(s.total_edits for s in sessions)
        
        response_data = {
            "totalSessions": total_sessions,
            "totalDuration": total_duration,
            "totalLinesAdded": total_lines_added,
            "totalLinesDeleted": total_lines_deleted,
            "totalLinesModified": total_lines_modified,
            "totalEdits": total_edits,
            "averageSessionDuration": total_duration / total_sessions if total_sessions > 0 else 0
        }
        
        return SuccessResponse(data=response_data)
        
    except Exception as e:
        logger.error(f"Failed to get statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(error="Failed to retrieve statistics").dict()
        )


@router.get("/stats/daily", response_model=Union[SuccessResponse, ErrorResponse])
async def get_daily_statistics(
    db: AsyncSession = Depends(get_db),
    time_filter: Optional[TimeFilter] = Query(TimeFilter.LAST_7_DAYS),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    project_name: Optional[str] = Query(None),
    language: Optional[str] = Query(None)
):
    """
    Get daily activity statistics.
    No authentication required.
    """
    try:
        # Build base query
        query = select(FileSession).where(FileSession.user_id == DEFAULT_USER_ID)
        
        # Apply time filtering
        if time_filter:
            filter_start, filter_end = get_time_range(time_filter, start_date, end_date)
            if filter_start and filter_end:
                query = query.where(
                    and_(
                        FileSession.session_start_time >= filter_start,
                        FileSession.session_start_time <= filter_end
                    )
                )
        
        # Apply other filters
        if project_name:
            query = query.where(FileSession.project_name == project_name)
        if language:
            query = query.where(FileSession.language == language)
        
        # Execute query
        result = await db.execute(query)
        sessions = result.scalars().all()
        
        # Group by date
        daily_stats = {}
        for session in sessions:
            date_key = session.session_start_time.date().isoformat()
            if date_key not in daily_stats:
                daily_stats[date_key] = {
                    "date": date_key,
                    "duration": 0,
                    "sessions": 0
                }
            daily_stats[date_key]["duration"] += session.total_duration
            daily_stats[date_key]["sessions"] += 1
        
        # Convert to list and sort by date
        daily_data = sorted(daily_stats.values(), key=lambda x: x["date"])
        
        return SuccessResponse(data=daily_data)
        
    except Exception as e:
        logger.error(f"Failed to get daily statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(error="Failed to retrieve daily statistics").dict()
        )


@router.get("/stats/languages", response_model=Union[SuccessResponse, ErrorResponse])
async def get_language_statistics(
    db: AsyncSession = Depends(get_db),
    time_filter: Optional[TimeFilter] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    project_name: Optional[str] = Query(None)
):
    """
    Get programming language usage statistics.
    No authentication required.
    """
    try:
        # Build base query
        query = select(FileSession).where(FileSession.user_id == DEFAULT_USER_ID)
        
        # Apply time filtering
        if time_filter:
            filter_start, filter_end = get_time_range(time_filter, start_date, end_date)
            if filter_start and filter_end:
                query = query.where(
                    and_(
                        FileSession.session_start_time >= filter_start,
                        FileSession.session_start_time <= filter_end
                    )
                )
        
        # Apply project filter
        if project_name:
            query = query.where(FileSession.project_name == project_name)
        
        # Execute query
        result = await db.execute(query)
        sessions = result.scalars().all()
        
        # Group by language
        language_stats = {}
        total_duration = 0
        
        for session in sessions:
            language = session.language or "Unknown"
            if language not in language_stats:
                language_stats[language] = {
                    "name": language,
                    "duration": 0,
                    "sessions": 0,
                    "value": 0  # percentage, calculated later
                }
            language_stats[language]["duration"] += session.total_duration
            language_stats[language]["sessions"] += 1
            total_duration += session.total_duration
        
        # Calculate percentages and add colors
        language_colors = {
            "TypeScript": "#3178c6",
            "JavaScript": "#f7df1e", 
            "Python": "#3776ab",
            "Rust": "#ce422b",
            "Go": "#00add8",
            "Java": "#ed8b00",
            "C++": "#00599c",
            "C": "#a8b9cc",
            "HTML": "#e34f26",
            "CSS": "#1572b6",
            "Vue": "#4fc08d",
            "React": "#61dafb"
        }
        
        language_data = []
        for language, stats in language_stats.items():
            if total_duration > 0:
                stats["value"] = round((stats["duration"] / total_duration) * 100, 1)
            stats["color"] = language_colors.get(language, "#6b7280")  # default gray color
            language_data.append(stats)
        
        # Sort by duration descending
        language_data.sort(key=lambda x: x["duration"], reverse=True)
        
        return SuccessResponse(data=language_data)
        
    except Exception as e:
        logger.error(f"Failed to get language statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(error="Failed to retrieve language statistics").dict()
        )


@router.get("/stats/projects", response_model=Union[SuccessResponse, ErrorResponse])
async def get_project_statistics(
    db: AsyncSession = Depends(get_db),
    time_filter: Optional[TimeFilter] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    language: Optional[str] = Query(None)
):
    """
    Get project usage statistics.
    No authentication required.
    """
    try:
        # Build base query
        query = select(FileSession).where(FileSession.user_id == DEFAULT_USER_ID)
        
        # Apply time filtering
        if time_filter:
            filter_start, filter_end = get_time_range(time_filter, start_date, end_date)
            if filter_start and filter_end:
                query = query.where(
                    and_(
                        FileSession.session_start_time >= filter_start,
                        FileSession.session_start_time <= filter_end
                    )
                )
        
        # Apply language filter
        if language:
            query = query.where(FileSession.language == language)
        
        # Execute query
        result = await db.execute(query)
        sessions = result.scalars().all()
        
        # Group by project
        project_stats = {}
        for session in sessions:
            project = session.project_name or "Unknown"
            if project not in project_stats:
                project_stats[project] = {
                    "name": project,
                    "duration": 0,
                    "sessions": 0
                }
            project_stats[project]["duration"] += session.total_duration
            project_stats[project]["sessions"] += 1
        
        # Convert to list and sort by duration descending
        project_data = sorted(project_stats.values(), key=lambda x: x["duration"], reverse=True)
        
        return SuccessResponse(data=project_data)
        
    except Exception as e:
        logger.error(f"Failed to get project statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(error="Failed to retrieve project statistics").dict()
        )


@router.get("/stats/hourly", response_model=Union[SuccessResponse, ErrorResponse])
async def get_hourly_statistics(
    db: AsyncSession = Depends(get_db),
    time_filter: Optional[TimeFilter] = Query(TimeFilter.LAST_7_DAYS),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    project_name: Optional[str] = Query(None),
    language: Optional[str] = Query(None)
):
    """
    Get hourly activity statistics.
    No authentication required.
    """
    try:
        # Build base query
        query = select(FileSession).where(FileSession.user_id == DEFAULT_USER_ID)
        
        # Apply time filtering
        if time_filter:
            filter_start, filter_end = get_time_range(time_filter, start_date, end_date)
            if filter_start and filter_end:
                query = query.where(
                    and_(
                        FileSession.session_start_time >= filter_start,
                        FileSession.session_start_time <= filter_end
                    )
                )
        
        # Apply other filters
        if project_name:
            query = query.where(FileSession.project_name == project_name)
        if language:
            query = query.where(FileSession.language == language)
        
        # Execute query
        result = await db.execute(query)
        sessions = result.scalars().all()
        
        # Group by hour (0-23)
        hourly_stats = {}
        for hour in range(24):
            hourly_stats[f"{hour:02d}"] = {
                "hour": f"{hour:02d}",
                "duration": 0
            }
        
        for session in sessions:
            hour_key = f"{session.session_start_time.hour:02d}"
            hourly_stats[hour_key]["duration"] += session.total_duration
        
        # Convert to list
        hourly_data = [hourly_stats[f"{hour:02d}"] for hour in range(24)]
        
        return SuccessResponse(data=hourly_data)
        
    except Exception as e:
        logger.error(f"Failed to get hourly statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(error="Failed to retrieve hourly statistics").dict()
        ) 