#!/usr/bin/env python3
"""
AFK Coding Monitor Backend Server Startup Script

This script provides an easy way to start the backend server with proper configuration.
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path


def check_dependencies():
    """Check if required dependencies are installed."""
    try:
        import uvicorn
        import fastapi
        import sqlalchemy
        print("✅ All dependencies are available")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please install dependencies with: uv sync")
        return False


def setup_environment():
    """Set up environment variables with defaults."""
    env_file = Path(".env")
    
    if not env_file.exists():
        print("⚠️  No .env file found, using default configuration")
        print("   Create a .env file for custom configuration")
    
    # Set default environment variables if not already set
    defaults = {
        "HOST": "0.0.0.0",
        "PORT": "8000",
        "DEBUG": "true",
        "SECRET_KEY": "development-secret-key-change-in-production",
        "DATABASE_URL": "sqlite+aiosqlite:///./afk_monitor.db",
        "ACCESS_TOKEN_EXPIRE_MINUTES": "1440",
        "AUTH_CODE_EXPIRE_MINUTES": "10"
    }
    
    for key, value in defaults.items():
        if key not in os.environ:
            os.environ[key] = value


def start_server(host="0.0.0.0", port=8000, reload=True, log_level="info"):
    """Start the FastAPI server using uvicorn."""
    
    print(f"🚀 Starting AFK Coding Monitor Backend Server")
    print(f"   Host: {host}")
    print(f"   Port: {port}")
    print(f"   Reload: {reload}")
    print(f"   Log Level: {log_level}")
    print()
    print(f"📖 API Documentation: http://{host}:{port}/docs")
    print(f"🔍 Health Check: http://{host}:{port}/api/health")
    print()
    print("Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        import uvicorn
        uvicorn.run(
            "app.main:app",
            host=host,
            port=port,
            reload=reload,
            log_level=log_level
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Start the AFK Coding Monitor Backend Server"
    )
    
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Host to bind to (default: 0.0.0.0)"
    )
    
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to bind to (default: 8000)"
    )
    
    parser.add_argument(
        "--no-reload",
        action="store_true",
        help="Disable auto-reload"
    )
    
    parser.add_argument(
        "--log-level",
        choices=["critical", "error", "warning", "info", "debug"],
        default="info",
        help="Log level (default: info)"
    )
    
    parser.add_argument(
        "--production",
        action="store_true",
        help="Run in production mode (no reload, info log level)"
    )
    
    parser.add_argument(
        "--check-deps",
        action="store_true",
        help="Check dependencies and exit"
    )
    
    args = parser.parse_args()
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    if args.check_deps:
        print("✅ Dependencies check passed")
        sys.exit(0)
    
    # Set up environment
    setup_environment()
    
    # Configure for production if requested
    if args.production:
        reload = False
        log_level = "info"
        os.environ["DEBUG"] = "false"
        print("🏭 Running in production mode")
    else:
        reload = not args.no_reload
        log_level = args.log_level
        print("🔧 Running in development mode")
    
    # Start the server
    start_server(
        host=args.host,
        port=args.port,
        reload=reload,
        log_level=log_level
    )


if __name__ == "__main__":
    main() 