# AFK Backend Pull-Based Architecture Guide

This document describes the new pull-based architecture implemented in the AFK Coding Monitor system, where the backend fetches session data from extensions on-demand instead of relying on extensions to push data.

## Architecture Overview

### Previous Architecture (Push-Based)
```
Extension --[HTTP POST]--> Backend --[Save]--> Database
                             ^                    |
                             |                    |
Frontend  <--[HTTP GET]------+                    |
```

### New Architecture (Pull-Based)
```
Frontend --[HTTP GET]--> Backend --[HTTP GET]--> Extension
    ^                        |                       |
    |                        v                       |
    +<--[HTTP Response]-- Database <--[Save]----------+
```

## How It Works

1. **Frontend Request**: Frontend makes a request to get session data
2. **Backend Fetches**: Backend automatically fetches latest data from extension(s)
3. **Backend Saves**: Fetched data is saved to the database
4. **Backend Responds**: Backend returns the combined data to frontend

## Key Components

### 1. Extension Client Service (`app/services/extension_client.py`)

The `ExtensionClient` class handles all communication with extensions:

- **Discovery**: Automatically discovers extension endpoints
- **Authentication**: Uses device tokens for secure communication  
- **Retry Logic**: Implements exponential backoff for failed requests
- **Caching**: Maintains a registry of discovered extensions

#### Key Methods:
- `discover_extension(device)`: Find extension endpoint for a device
- `fetch_sessions_from_extension(device, since)`: Get sessions from extension
- `sync_device_sessions(device, db, since)`: Fetch and save to database
- `sync_all_devices(db, since)`: Sync all active devices

### 2. Enhanced Session Endpoints

#### Modified GET `/api/sessions`
- **New Parameter**: `sync_from_extension=true` (default)
- **Behavior**: Fetches from extension first, then returns database data
- **Fallback**: Continues with database query if extension sync fails

#### New POST `/api/sessions/sync`
- **Purpose**: Manual synchronization trigger
- **Parameters**: `since` timestamp for incremental sync
- **Response**: Number of sessions synced and sync metadata

#### New GET `/api/sessions/extension-status`
- **Purpose**: Check extension connectivity status
- **Response**: Connection status, last seen, endpoint info

### 3. Extension Requirements

Extensions must implement these endpoints for the pull architecture:

#### GET `/api/health`
```json
{
  "status": "healthy",
  "deviceId": "device-123", 
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### POST `/api/sessions/export`
**Request:**
```json
{
  "since": "2024-01-01T00:00:00Z",  // Optional
  "limit": 100                      // Optional
}
```

**Response:**
```json
{
  "sessions": [/* FileSession objects */],
  "hasMore": false,
  "lastSyncTime": "2024-01-01T12:00:00Z"
}
```

## Configuration

Add these settings to your environment:

```env
# Extension Communication
EXTENSION_TIMEOUT=30
EXTENSION_RETRY_ATTEMPTS=3
EXTENSION_DISCOVERY_ENABLED=true
```

## Discovery Mechanism

The backend discovers extensions using:

1. **Port Scanning**: Checks common ports (8001-8005) on localhost
2. **Health Check**: Verifies `/api/health` endpoint
3. **Device Matching**: Confirms `deviceId` matches
4. **Caching**: Stores discovered endpoints for reuse

### Default Discovery Ports
- 8001, 8002, 8003, 8004, 8005

### Discovery Hosts  
- localhost, 127.0.0.1

## Error Handling

### Extension Unavailable
- Backend logs warning but continues with database data
- Extension marked as inactive in registry
- Automatic retry on next request

### Network Timeouts
- Configurable timeout (default: 30 seconds)
- Exponential backoff retry (default: 3 attempts)
- Graceful degradation to database-only mode

### Authentication Failures
- Invalid tokens logged and reported
- Device marked as requiring re-authentication
- Sync skipped for affected device

## Testing

### 1. Run Mock Extension Server
```bash
cd Backend
python test_pull_architecture.py server test-device-123 8001
```

### 2. Test Backend Integration
```bash
cd Backend
python test_pull_architecture.py
```

### 3. Manual Testing
1. Start backend: `uv run uvicorn app.main:app --reload`
2. Start mock extension: `python test_pull_architecture.py server`
3. Make API request: `GET /api/sessions?sync_from_extension=true`

## API Usage Examples

### Get Sessions (with sync)
```bash
curl -H "Authorization: Bearer <token>" \
     "http://localhost:8000/api/sessions?sync_from_extension=true"
```

### Manual Sync
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     "http://localhost:8000/api/sessions/sync?since=2024-01-01T00:00:00Z"
```

### Check Extension Status
```bash
curl -H "Authorization: Bearer <token>" \
     "http://localhost:8000/api/sessions/extension-status"
```

## Benefits

1. **Real-time Data**: Always gets latest data from extensions
2. **Centralized Control**: Backend controls when to sync
3. **Better Error Handling**: Graceful fallback to database
4. **Scalability**: Can sync multiple devices efficiently
5. **Debugging**: Better visibility into extension connectivity

## Migration from Push Architecture

### For Extensions
1. Add health check endpoint (`/api/health`)
2. Add export endpoint (`/api/sessions/export`)  
3. Keep existing push endpoints for backward compatibility

### For Frontend
1. No changes required - endpoints remain the same
2. Optionally use new `sync_from_extension` parameter
3. Use new status endpoint for extension monitoring

### For Backend
1. Extension client automatically enabled
2. Existing push endpoints still work
3. New pull endpoints available immediately

## Performance Considerations

### Caching
- Extension endpoints cached after discovery
- Reduces discovery overhead on subsequent requests
- Cache invalidation on connection failures

### Timeouts
- Configurable timeouts prevent hanging requests
- Default 30-second timeout balances reliability and speed
- Async implementation prevents blocking other requests

### Batching
- Multiple devices can be synced concurrently
- Efficient database operations with bulk inserts/updates
- Incremental sync using `since` timestamps

## Security

### Authentication
- Extensions authenticate using device tokens
- Same JWT tokens used for extension API calls
- Token validation on every request

### Network Security
- Local network communication only (localhost)
- HTTPS support for production deployments
- Configurable host allowlists

### Data Validation
- All extension responses validated against schemas
- Malformed data rejected gracefully
- SQL injection protection through ORM

## Monitoring and Logging

### Logs Include
- Extension discovery attempts and results
- Sync operations with session counts
- Connection failures and retries
- Authentication issues

### Metrics to Monitor
- Extension connectivity rates
- Sync operation success/failure rates
- Average sync duration
- Session data freshness

## Troubleshooting

### Extension Not Discovered
1. Check extension is running on expected port
2. Verify health endpoint returns correct `deviceId`
3. Check backend logs for discovery attempts
4. Ensure no firewall blocking localhost connections

### Sync Failures
1. Check extension `/api/sessions/export` endpoint
2. Verify device token validity
3. Check extension logs for errors
4. Use manual sync endpoint for testing

### Performance Issues
1. Adjust timeout settings
2. Check extension response times
3. Monitor database performance during syncs
4. Consider incremental sync frequency

---

This pull-based architecture provides better control, reliability, and real-time data access while maintaining backward compatibility with existing push-based systems. 