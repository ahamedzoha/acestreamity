# API Documentation

## 📋 Table of Contents

- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Stream Management API](#stream-management-api)
- [Channel Management API](#channel-management-api)
- [Health & Monitoring API](#health--monitoring-api)
- [Error Handling](#error-handling)
- [Examples](#examples)

## 🎯 API Overview

The Ace Stream HLS API provides RESTful endpoints for managing P2P streaming sessions, channel catalogs, and system health monitoring. All endpoints return JSON responses and follow standard HTTP status codes.

**API Version**: v1  
**Base URL**: `http://localhost:3001/api`  
**Content-Type**: `application/json`

## 🔐 Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible for development purposes.

**Future Enhancement**: JWT-based authentication with role-based access control will be implemented for production deployments.

## 🎥 Stream Management API

### Start Stream Session

**Endpoint**: `POST /streams/start/:aceId`  
**Description**: Initializes a new streaming session for the specified Ace Stream content ID.

**Parameters**:

- `aceId` (path, required): 40-character hexadecimal Ace Stream content ID

**Query Parameters**:

- `events` (optional): Set to `true` to enable API events from engine

**Request Example**:

```http
POST /api/streams/start/eab7aeef0218ce8b0752e596e4792b69eda4df5e
Content-Type: application/json
```

**Success Response** (201 Created):

```json
{
  "success": true,
  "session": {
    "id": "zy2ra38acmbhx80g0",
    "aceId": "eab7aeef0218ce8b0752e596e4792b69eda4df5e",
    "status": "starting",
    "hlsUrl": "http://localhost:3001/api/streams/hls/zy2ra38acmbhx80g0/manifest.m3u8",
    "startedAt": "2025-06-04T12:25:41.956Z"
  }
}
```

**Error Response** (400 Bad Request):

```json
{
  "success": false,
  "error": "Invalid Ace Stream ID format"
}
```

**Possible Errors**:

- `400`: Invalid Ace Stream ID format (must be 40 hex characters)
- `500`: Engine unavailable or internal server error
- `503`: Service temporarily unavailable

---

### Get HLS Manifest

**Endpoint**: `GET /streams/hls/:sessionId/manifest.m3u8`  
**Description**: Retrieves the HLS manifest for a streaming session with rewritten URLs for CORS compatibility.

**Parameters**:

- `sessionId` (path, required): Unique session identifier

**Request Example**:

```http
GET /api/streams/hls/zy2ra38acmbhx80g0/manifest.m3u8
Accept: application/vnd.apple.mpegurl
```

**Success Response** (200 OK):

```http
Content-Type: application/vnd.apple.mpegurl
Cache-Control: no-cache, no-store, must-revalidate
Access-Control-Allow-Origin: *

#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:5.840000,
http://localhost:3001/api/streams/proxy/c/78266c15035d0ad8cbc58f821733931e1de434ab/0.ts
#EXTINF:6.000000,
http://localhost:3001/api/streams/proxy/c/78266c15035d0ad8cbc58f821733931e1de434ab/1.ts
...
```

**Error Response** (404 Not Found):

```json
{
  "success": false,
  "error": "Stream session not found"
}
```

---

### Get Video Segment

**Endpoint**: `GET /streams/proxy/c/:hash/:segment`  
**Description**: Proxies video segment requests to the Ace Stream engine with proper CORS headers.

**Parameters**:

- `hash` (path, required): Session hash from engine
- `segment` (path, required): Segment filename (e.g., `0.ts`, `1.ts`)

**Request Example**:

```http
GET /api/streams/proxy/c/78266c15035d0ad8cbc58f821733931e1de434ab/0.ts
Accept: video/mp2t
```

**Success Response** (200 OK):

```http
Content-Type: video/mp2t
Cache-Control: no-cache, no-store, must-revalidate
Access-Control-Allow-Origin: *

[Binary TS segment data]
```

**Error Response** (500 Internal Server Error):

```json
{
  "success": false,
  "error": "Engine returned 500: Segment not ready"
}
```

---

### Get Stream Statistics

**Endpoint**: `GET /streams/status/:sessionId`  
**Description**: Retrieves real-time statistics for an active streaming session.

**Parameters**:

- `sessionId` (path, required): Unique session identifier

**Request Example**:

```http
GET /api/streams/status/zy2ra38acmbhx80g0
Accept: application/json
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "stats": {
    "status": "dl",
    "peers": 12,
    "speed_down": 1024,
    "speed_up": 256,
    "downloaded": 104857600,
    "uploaded": 26214400,
    "total_progress": 15
  }
}
```

**Statistics Fields**:

- `status`: Stream status (`prebuf` = buffering, `dl` = downloading)
- `peers`: Number of connected P2P peers
- `speed_down`: Download speed in KB/s
- `speed_up`: Upload speed in KB/s
- `downloaded`: Total bytes downloaded
- `uploaded`: Total bytes uploaded
- `total_progress`: Download progress percentage (VOD only)

---

### Stop Stream Session

**Endpoint**: `POST /streams/stop/:sessionId`  
**Description**: Terminates an active streaming session and cleans up resources.

**Parameters**:

- `sessionId` (path, required): Unique session identifier

**Request Example**:

```http
POST /api/streams/stop/zy2ra38acmbhx80g0
Content-Type: application/json
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "message": "Stream stopped successfully"
}
```

**Error Response** (404 Not Found):

```json
{
  "success": false,
  "error": "Stream session not found"
}
```

---

### List Active Sessions

Retrieves all currently active streaming sessions.

**Endpoint**: `GET /streams/active`

**Request Example**:

```http
GET /api/streams/active
Accept: application/json
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "sessions": [
    {
      "id": "zy2ra38acmbhx80g0",
      "aceId": "eab7aeef0218ce8b0752e596e4792b69eda4df5e",
      "status": "streaming",
      "hlsUrl": "http://localhost:3001/api/streams/hls/zy2ra38acmbhx80g0/manifest.m3u8",
      "startedAt": "2025-06-04T12:25:41.956Z"
    }
  ],
  "count": 1
}
```

## 📁 Channel Management API

### List All Channels

**Endpoint**: `GET /channels`  
**Description**: Retrieves the complete channel catalog with metadata.

**Query Parameters**:

- `category` (optional): Filter by category
- `language` (optional): Filter by language
- `active` (optional): Filter by active status (`true`/`false`)
- `limit` (optional): Maximum number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Request Example**:

```http
GET /api/channels?category=sports&limit=10
Accept: application/json
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "channels": [
    {
      "id": 1,
      "name": "Sports Channel HD",
      "ace_stream_id": "eab7aeef0218ce8b0752e596e4792b69eda4df5e",
      "description": "Live sports broadcasting",
      "category": "sports",
      "language": "en",
      "quality": "HD",
      "is_active": true,
      "created_at": "2025-06-04T10:00:00.000Z",
      "updated_at": "2025-06-04T10:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

---

### Get Channel by ID

Retrieves detailed information for a specific channel.

**Endpoint**: `GET /channels/:id`  
**Parameters**:

- `id` (path, required): Channel ID

**Request Example**:

```http
GET /api/channels/1
Accept: application/json
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "channel": {
    "id": 1,
    "name": "Sports Channel HD",
    "ace_stream_id": "eab7aeef0218ce8b0752e596e4792b69eda4df5e",
    "description": "Live sports broadcasting",
    "category": "sports",
    "language": "en",
    "quality": "HD",
    "is_active": true,
    "created_at": "2025-06-04T10:00:00.000Z",
    "updated_at": "2025-06-04T10:00:00.000Z"
  }
}
```

---

### Create New Channel

**Endpoint**: `POST /channels`  
**Description**: Adds a new channel to the catalog.

**Request Body**:

```json
{
  "name": "New Sports Channel",
  "ace_stream_id": "dd1e67078381739d14beca697356ab76d49d1a2d",
  "description": "Premium sports content",
  "category": "sports",
  "language": "en",
  "quality": "FHD"
}
```

**Success Response** (201 Created):

```json
{
  "success": true,
  "channel": {
    "id": 2,
    "name": "New Sports Channel",
    "ace_stream_id": "dd1e67078381739d14beca697356ab76d49d1a2d",
    "description": "Premium sports content",
    "category": "sports",
    "language": "en",
    "quality": "FHD",
    "is_active": true,
    "created_at": "2025-06-04T12:30:00.000Z",
    "updated_at": "2025-06-04T12:30:00.000Z"
  }
}
```

**Validation Errors** (400 Bad Request):

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "name": "Name is required",
    "ace_stream_id": "Invalid Ace Stream ID format"
  }
}
```

---

### Update Channel

Updates an existing channel's information.

**Endpoint**: `PUT /channels/:id`  
**Parameters**:

- `id` (path, required): Channel ID

**Request Body**:

```json
{
  "name": "Updated Channel Name",
  "description": "Updated description",
  "is_active": false
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "channel": {
    "id": 1,
    "name": "Updated Channel Name",
    "ace_stream_id": "eab7aeef0218ce8b0752e596e4792b69eda4df5e",
    "description": "Updated description",
    "category": "sports",
    "language": "en",
    "quality": "HD",
    "is_active": false,
    "created_at": "2025-06-04T10:00:00.000Z",
    "updated_at": "2025-06-04T12:35:00.000Z"
  }
}
```

---

### Delete Channel

Removes a channel from the catalog.

**Endpoint**: `DELETE /channels/:id`  
**Parameters**:

- `id` (path, required): Channel ID

**Request Example**:

```http
DELETE /api/channels/1
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "message": "Channel deleted successfully"
}
```

---

### Search Channels

Search channels by name, description, or Ace Stream ID.

**Endpoint**: `GET /channels/search`

**Query Parameters**:

- `q` (required): Search query
- `fields` (optional): Comma-separated fields to search (`name,description,ace_stream_id`)
- `limit` (optional): Maximum results (default: 20)

**Request Example**:

```http
GET /api/channels/search?q=sports&fields=name,description&limit=5
Accept: application/json
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "channels": [
    {
      "id": 1,
      "name": "Sports Channel HD",
      "ace_stream_id": "eab7aeef0218ce8b0752e596e4792b69eda4df5e",
      "description": "Live sports broadcasting",
      "category": "sports",
      "language": "en",
      "quality": "HD",
      "is_active": true
    }
  ],
  "query": "sports",
  "total": 1
}
```

## 🏥 Health & Monitoring API

### System Health Check

**Endpoint**: `GET /health`  
**Description**: Returns overall system health including all service statuses.

**Request Example**:

```http
GET /api/health
Accept: application/json
```

**Success Response** (200 OK):

```json
{
  "status": "healthy",
  "timestamp": "2025-06-04T12:40:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "healthy",
      "response_time": 2
    },
    "aceStream": {
      "status": "healthy",
      "version": "3.2.3",
      "response_time": 15
    }
  }
}
```

**Degraded Response** (503 Service Unavailable):

```json
{
  "status": "degraded",
  "timestamp": "2025-06-04T12:40:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "healthy",
      "response_time": 2
    },
    "aceStream": {
      "status": "unhealthy",
      "error": "Connection refused",
      "response_time": null
    }
  }
}
```

---

### Database Health Check

Checks database connectivity and performance.

**Endpoint**: `GET /health/database`

**Request Example**:

```http
GET /api/health/database
Accept: application/json
```

**Success Response** (200 OK):

```json
{
  "status": "healthy",
  "response_time": 2,
  "connection_count": 1,
  "last_query": "2025-06-04T12:39:58.000Z"
}
```

---

### Ace Stream Engine Health Check

Checks Ace Stream engine availability and version.

**Endpoint**: `GET /health/acestream`

**Request Example**:

```http
GET /api/health/acestream
Accept: application/json
```

**Success Response** (200 OK):

```json
{
  "status": "healthy",
  "version": "3.2.3",
  "version_code": 3002300,
  "response_time": 15,
  "last_check": "2025-06-04T12:39:55.000Z"
}
```

**Error Response** (503 Service Unavailable):

```json
{
  "status": "unhealthy",
  "error": "Connection refused",
  "response_time": null,
  "last_check": "2025-06-04T12:39:55.000Z"
}
```

## ⚠️ Error Handling

### Standard Error Response Format

All API errors follow a consistent JSON format:

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  },
  "timestamp": "2025-06-04T12:40:00.000Z"
}
```

### HTTP Status Codes

| Code  | Description           | Usage                                |
| ----- | --------------------- | ------------------------------------ |
| `200` | OK                    | Successful GET, PUT, DELETE requests |
| `201` | Created               | Successful POST requests             |
| `400` | Bad Request           | Invalid request data or parameters   |
| `404` | Not Found             | Resource not found                   |
| `409` | Conflict              | Resource already exists              |
| `422` | Unprocessable Entity  | Validation errors                    |
| `500` | Internal Server Error | Server-side errors                   |
| `503` | Service Unavailable   | Engine or database unavailable       |

### Common Error Codes

| Error Code           | Description                      |
| -------------------- | -------------------------------- |
| `INVALID_ACE_ID`     | Ace Stream ID format invalid     |
| `SESSION_NOT_FOUND`  | Stream session not found         |
| `ENGINE_UNAVAILABLE` | Ace Stream engine not responding |
| `VALIDATION_FAILED`  | Request data validation failed   |
| `DATABASE_ERROR`     | Database operation failed        |
| `NETWORK_ERROR`      | Network communication error      |

### Error Examples

**Validation Error**:

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_FAILED",
  "details": {
    "name": "Name is required",
    "ace_stream_id": "Must be 40 hexadecimal characters"
  },
  "timestamp": "2025-06-04T12:40:00.000Z"
}
```

**Engine Error**:

```json
{
  "success": false,
  "error": "Ace Stream engine is not responding",
  "code": "ENGINE_UNAVAILABLE",
  "details": {
    "engine_url": "http://127.0.0.1:6878",
    "timeout": 5000
  },
  "timestamp": "2025-06-04T12:40:00.000Z"
}
```

## 🚦 Rate Limiting

**Current Status**: No rate limiting implemented  
**Future Enhancement**: Rate limiting will be added for production with the following limits:

- **Stream Operations**: 10 requests per minute per IP
- **Statistics**: 60 requests per minute per IP
- **General API**: 100 requests per minute per IP

Rate limit headers will be included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

## 📝 Examples

### Complete Stream Workflow

```javascript
// 1. Start a stream
const startResponse = await fetch('/api/streams/start/eab7aeef0218ce8b0752e596e4792b69eda4df5e', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
});
const { session } = await startResponse.json();

// 2. Initialize HLS player
const video = document.querySelector('video');
if (Hls.isSupported()) {
  const hls = new Hls();
  hls.loadSource(session.hlsUrl);
  hls.attachMedia(video);
}

// 3. Poll statistics
const pollStats = async () => {
  const statsResponse = await fetch(`/api/streams/status/${session.id}`);
  const { stats } = await statsResponse.json();
  console.log(`Peers: ${stats.peers}, Speed: ${stats.speed_down} KB/s`);
};
setInterval(pollStats, 5000);

// 4. Stop stream
await fetch(`/api/streams/stop/${session.id}`, { method: 'POST' });
```

### Channel Management

```javascript
// Create a new channel
const newChannel = {
  name: 'Premium Sports',
  ace_stream_id: 'dd1e67078381739d14beca697356ab76d49d1a2d',
  description: 'High-quality sports content',
  category: 'sports',
  language: 'en',
  quality: 'FHD',
};

const createResponse = await fetch('/api/channels', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newChannel),
});

// Search channels
const searchResponse = await fetch('/api/channels/search?q=sports&limit=10');
const { channels } = await searchResponse.json();

// Update channel
const updateData = { is_active: false };
await fetch(`/api/channels/${channelId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updateData),
});
```

### Health Monitoring

```javascript
// Check overall system health
const healthResponse = await fetch('/api/health');
const health = await healthResponse.json();

if (health.status === 'healthy') {
  console.log('All systems operational');
} else {
  console.log('System degraded:', health.services);
}

// Monitor specific services
const engineHealth = await fetch('/api/health/acestream');
const dbHealth = await fetch('/api/health/database');
```

This API documentation provides comprehensive coverage of all available endpoints, request/response formats, error handling, and practical examples for integration.
