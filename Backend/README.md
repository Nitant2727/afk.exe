# AFK Coding Monitor Backend

A simplified FastAPI backend server for tracking coding activity from VSCode and Cursor extensions with GitHub OAuth authentication and comprehensive filtering capabilities.

## Features

- **GitHub OAuth Authentication**: Frontend handles OAuth, backend manages users
- **Session Tracking**: Store and manage coding session data
- **Cross-Platform Support**: One account works across VSCode and Cursor
- **Comprehensive Filtering**: Project-wise, time-based, language-wise statistics
- **SQLite Database**: Lightweight local database storage
- **Simple API**: Clean, minimal endpoints

## Quick Start

### Prerequisites

- Python 3.10 or higher
- uv (recommended) or pip for dependency management

### Installation

1. **Navigate to the Backend directory**

2. **Install dependencies:**
   ```bash
   uv sync
   ```

3. **Set up environment variables (optional):**
   Create a `.env` file:
   ```env
   # Optional customization
   SECRET_KEY=your-secret-key-here
   PORT=8000
   DEBUG=true
   ```

4. **Run the server:**
   ```bash
   # Using the startup script
   python run_server.py
   
   # Or directly with uvicorn
   uvicorn app.main:app --reload
   ```

5. **Verify the server:**
   - Open http://localhost:8000 in your browser
   - Check API docs at http://localhost:8000/docs
   - Test health endpoint: http://localhost:8000/api/health

## API Endpoints

### Authentication
- `POST /api/auth/github` - Authenticate with GitHub user data
- `GET /api/auth/me` - Get current user info

### Sessions
- `POST /api/sessions` - Submit session data from extension
- `GET /api/sessions` - Retrieve session history (with filtering)

### Filtering & Statistics
- `GET /api/sessions/projects` - Get unique project names
- `GET /api/sessions/languages` - Get unique programming languages
- `GET /api/sessions/stats` - Get basic statistics (with filtering)
- `GET /api/sessions/stats/projects` - Get project-wise statistics
- `GET /api/sessions/stats/languages` - Get language-wise statistics
- `GET /api/sessions/stats/daily` - Get daily coding statistics

### Health
- `GET /api/health` - Server health check

## Authentication Flow

1. **Frontend handles GitHub OAuth**: User signs in with GitHub on frontend
2. **Frontend sends user data**: POST to `/api/auth/github` with GitHub user info
3. **Backend creates/updates user**: Returns JWT token for API access
4. **Token works everywhere**: Same token for VSCode, Cursor, and frontend

### GitHub User Data Format
```json
{
  "github_id": "12345678",
  "username": "your_username", 
  "email": "your@email.com",
  "avatar_url": "https://github.com/avatar.jpg"
}
```

## Comprehensive Filtering

### Time Filters
- `today` - Today's sessions
- `yesterday` - Yesterday's sessions  
- `this_week` - Current week
- `last_week` - Previous week
- `this_month` - Current month
- `last_month` - Previous month
- `last_7_days` - Last 7 days
- `last_30_days` - Last 30 days
- `custom` - Custom date range (requires start_date/end_date)

### Filter Combinations

**Session History with Filters:**
```
GET /api/sessions?time_filter=last_7_days&project_name=MyProject&language=python
```

**Project Statistics with Time Filter:**
```
GET /api/sessions/stats/projects?time_filter=this_month&language=javascript
```

**Language Statistics with Project Filter:**
```
GET /api/sessions/stats/languages?project_name=MyProject&time_filter=last_week
```

**Daily Statistics with Multiple Filters:**
```
GET /api/sessions/stats/daily?time_filter=last_30_days&project_name=MyProject&language=python
```

### Available Statistics

**Basic Stats (`/api/sessions/stats`):**
- Total sessions, focus time, coding time
- Average focus time, coding time
- Filterable by project, language, time

**Project Stats (`/api/sessions/stats/projects`):**
- Per-project session counts and time
- Language count per project
- Percentage breakdown
- Filterable by language and time

**Language Stats (`/api/sessions/stats/languages`):**
- Per-language session counts and time
- Project count per language
- Percentage breakdown
- Filterable by project and time

**Daily Stats (`/api/sessions/stats/daily`):**
- Day-by-day coding activity
- Session counts, time totals
- Project and language diversity per day
- Filterable by project, language, time range

## Session Data Flow

1. **Extension monitors file activity** in VSCode/Cursor
2. **Session starts** when file gains focus
3. **Session data sent** to `POST /api/sessions`
4. **Session ends** when file loses focus
5. **Data stored** in SQLite database with full filtering support

## Development

### Running in Development Mode

```bash
# With auto-reload
python run_server.py

# With specific options
python run_server.py --port 8001 --log-level debug
```

### Database

The SQLite database (`afk_monitor.db`) is created automatically. Tables:
- `users` - GitHub user information
- `coding_sessions` - Session tracking data with indexes for fast filtering

### Environment Variables

```env
# Optional
SECRET_KEY=your-secret-key
HOST=0.0.0.0
PORT=8000
DEBUG=true
ACCESS_TOKEN_EXPIRE_HOURS=168  # 1 week
DATABASE_URL=sqlite+aiosqlite:///./afk_monitor.db
```

## Testing

Run the comprehensive API test suite:

```bash
# Basic test with mock GitHub authentication
python test_api.py

# Test with specific JWT token
python test_api.py --token your_jwt_token_here
```

The test script includes:
- Health check
- GitHub authentication with mock data
- Session creation and filtering
- All statistics endpoints

## Production Deployment

1. **Set production environment variables**
2. **Use a strong SECRET_KEY**
3. **Set DEBUG=false**
4. **Configure proper CORS origins**
5. **Set up HTTPS with reverse proxy**

## API Documentation

Interactive API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Frontend Integration

### Authentication
```javascript
// Frontend handles GitHub OAuth, then:
const response = await fetch('/api/auth/github', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    github_id: user.id,
    username: user.login,
    email: user.email,
    avatar_url: user.avatar_url
  })
});

const { access_token } = await response.json();
// Use access_token for all subsequent API calls
```

### Getting Filter Options
```javascript
// Get available projects
const projects = await fetch('/api/sessions/projects', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Get available languages  
const languages = await fetch('/api/sessions/languages', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Filtered Statistics
```javascript
// Get project stats for last month
const projectStats = await fetch('/api/sessions/stats/projects?time_filter=last_month', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Get daily stats for specific project
const dailyStats = await fetch('/api/sessions/stats/daily?project_name=MyProject&time_filter=last_7_days', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## Troubleshooting

### Common Issues

1. **Authentication errors**: Check GitHub user data format
2. **Port in use**: Change PORT in .env file
3. **Database errors**: Delete `afk_monitor.db` to reset
4. **CORS issues**: Add your frontend URL to CORS_ORIGINS

### Getting Help

Check the FastAPI logs in the console for detailed error information.

## What's New

This version includes:
- **Simplified GitHub authentication** (frontend handles OAuth)
- **Comprehensive filtering system** with 9 time filter options
- **Advanced statistics endpoints** for projects, languages, and daily data
- **Filter combinations** for complex queries
- **Optimized database queries** with proper indexing
- **Clean API design** with consistent response formats

Perfect for building rich frontend dashboards with detailed coding analytics! 