# AFK File Session Monitor - VSCode Extension

A file session tracking extension for VSCode and Cursor that monitors **file sessions** and **edit statistics** when VSCode is in focus.

## 🎯 What it tracks

**Session Time**: How long a file was active/focused while VSCode has focus  
**Edit Statistics**: Lines and characters added, deleted, and modified during the session

## 🚀 Features

- **Automatic Session Tracking**: Starts monitoring when you focus on a file and VSCode is in focus
- **Real-time Status**: Shows current file and session stats in status bar  
- **Edit Analytics**: Tracks lines and characters added, deleted, and modified
- **Window Focus Aware**: Only tracks when VSCode window has focus
- **Server Sync**: Sends session data to your backend server
- **Cross-IDE**: Works with both VSCode and Cursor
- **Privacy**: Only tracks timing and edit statistics, never actual code content

## 📊 Data Tracked

For each file session, tracks:
- File path, name, extension, language
- Project name and path
- Session start/end time and total duration
- Lines added, deleted, and modified
- Characters added, deleted, and modified
- Total number of edit operations
- Editor type (VSCode/Cursor) and platform

## 🛠 Installation

1. Build the extension:
   ```bash
   cd extension
   npm install
   npm run compile
   ```

2. Install in VSCode:
   - Press F5 to run in development mode, or
   - Package with `vsce package` and install the .vsix file

## ⚙️ Configuration

Configure through VSCode settings:

```json
{
  "afk-coding-monitor.enabled": true,
  "afk-coding-monitor.serverUrl": "http://localhost:8000",
  "afk-coding-monitor.syncInterval": 10
}
```

Open settings menu with `Ctrl+Shift+P` → "AFK: Configure Settings" to easily modify:
- **Monitoring**: Enable/disable session tracking
- **Server URL**: Backend server endpoint

## 🎮 Commands

- **AFK: Start Session Monitoring** - Begin tracking file sessions
- **AFK: Stop Session Monitoring** - Stop tracking sessions  
- **AFK: Show Session Status** - View current session status and server connection
- **AFK: Configure Settings** - Open settings menu

## 🌐 Server Integration

The extension sends session data to your backend server:

**Endpoint**: `POST /api/sessions`

**Session Data Format**:
```json
{
  "session": {
    "id": "unique-session-id",
    "filePath": "src/main.py",
    "fileName": "main.py", 
    "fileExtension": "py",
    "language": "python",
    "projectName": "my-project",
    "projectPath": "/path/to/project",
    "sessionStartTime": "2024-01-01T10:00:00.000Z",
    "sessionEndTime": "2024-01-01T10:05:30.000Z", 
    "totalDuration": 330,
    "linesAdded": 15,
    "linesDeleted": 3,
    "linesModified": 8,
    "charactersAdded": 245,
    "charactersDeleted": 67,
    "charactersModified": 189,
    "totalEdits": 12,
    "isActive": false
  },
  "systemInfo": {
    "editor": "vscode",
    "platform": "linux"
  }
}
```

**Health Check**: `GET /api/health`

## 🔧 How it Works

1. **File Focus**: When you switch to a file and VSCode has focus, starts a new session
2. **Edit Detection**: Monitors file changes to track edit statistics (lines/characters added, deleted, modified)
3. **Window Focus**: Automatically ends session when VSCode loses focus, resumes when focus returns
4. **Session End**: When you switch files, close editor, or lose window focus, ends session and sends to server
5. **Minimum Duration**: Only tracks sessions longer than 5 seconds

## 📋 Status Bar

The status bar shows:
- **Ready**: Monitoring enabled, no active file session
- **File name**: Currently tracking this file session
- **Disabled**: Session monitoring is disabled

Click the status bar to view detailed status including:
- Current session info (file, session time, edit statistics)
- Server connection status
- Pending sessions count

## 🔒 Privacy

- Only tracks metadata (file names, timings, languages, edit statistics)
- Never records actual code content
- File paths are relative to project root
- All data sent to your own server

## 🚨 Quick Start

1. Install and activate the extension
2. Set up your backend server at `http://localhost:8000`
3. Open a file and start editing (ensure VSCode has focus)
4. View session status by clicking the status bar icon
5. Check your server to see session data with edit statistics

---

**Note**: This extension requires a backend server to receive and process the session data. The extension focuses purely on session and edit tracking - all analytics and insights should be handled by your server and frontend.
