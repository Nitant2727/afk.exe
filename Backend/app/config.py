import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Server Configuration
    app_name: str = "AFK Coding Monitor API"
    app_version: str = "1.0.0"
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # Database Configuration
    database_url: str = "sqlite+aiosqlite:///./afk_monitor.db"
    
    # JWT Configuration
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_hours: int = 24 * 7  # 1 week
    
    # CORS Configuration
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",  # Vite dev server
    ]
    
    # GitHub OAuth Configuration
    github_client_id: str = ""
    github_client_secret: str = ""
    
    # Extension Communication Configuration
    extension_timeout: int = 30  # seconds
    extension_retry_attempts: int = 3
    extension_discovery_enabled: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings() 