from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import MetaData
from app.config import settings


# Database Engine
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    future=True
)

# Session Factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


# Base class for all models
class Base(DeclarativeBase):
    metadata = MetaData()


# Dependency to get database session
async def get_db_session() -> AsyncSession:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


# FastAPI dependency for database session
async def get_db() -> AsyncSession:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


# Initialize database
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# Close database
async def close_db():
    await engine.dispose() 