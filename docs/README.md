# Ace Stream HLS Documentation

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Architecture Documentation](./architecture/README.md)
- [API Documentation](./api/README.md)
- [Deployment Guide](./deployment/README.md)
- [Troubleshooting](./troubleshooting/README.md)

## 🎯 System Overview

The **Ace Stream HLS System** is a modern streaming platform that bridges Ace Stream P2P technology with HTTP Live Streaming (HLS), enabling cross-platform streaming to devices that don't natively support Ace Stream protocols (iOS, tvOS, Smart TVs, etc.).

### 🏗️ High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   VLC Player    │    │  Smart TV/iOS   │
│   (React App)   │    │                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │            HLS Stream URLs                   │
          │                      │                      │
          └──────────────┬───────┴──────────────────────┘
                         │
                         │ HTTP/HLS Requests
                         │
         ┌───────────────┴────────────────┐
         │     Express.js Backend         │
         │   ┌─────────────────────────┐  │
         │   │    Stream Routes        │  │
         │   │  • /start/:aceId        │  │
         │   │  • /hls/:id/manifest    │  │
         │   │  • /proxy/c/:hash/:seg  │  │
         │   └─────────────────────────┘  │
         └────────────┬───────────────────┘
                      │
                      │ Engine HTTP API
                      │
         ┌────────────┴───────────────────┐
         │    Ace Stream Engine           │
         │    (Docker Container)          │
         │  ┌─────────────────────────┐   │
         │  │  HTTP API (Port 6878)   │   │
         │  │  • /ace/manifest.m3u8   │   │
         │  │  • /ace/getstream       │   │
         │  │  • /ace/c/:hash/:seg.ts │   │
         │  └─────────────────────────┘   │
         │                               │
         │  ┌─────────────────────────┐   │
         │  │     P2P Network         │   │
         │  │   ┌─────┐ ┌─────┐       │   │
         │  │   │Peer1│ │Peer2│ ...   │   │
         │  │   └─────┘ └─────┘       │   │
         │  └─────────────────────────┘   │
         └───────────────────────────────┘
```

## 🔑 Key Components

### 1. **Frontend (React 19 + Vite)**

- **Location**: `apps/frontend/`
- **Purpose**: User interface for stream management and playback
- **Technology**: React 19, TypeScript, Tailwind CSS v4, hls.js
- **Features**:
  - Stream control interface
  - HLS video player with error handling
  - Real-time statistics display
  - VLC integration

### 2. **Backend (Express.js + TypeScript)**

- **Location**: `apps/backend/`
- **Purpose**: API gateway and proxy for Ace Stream engine
- **Technology**: Express.js v5, TypeScript, SQLite
- **Features**:
  - Stream session management
  - HLS manifest proxy and URL rewriting
  - Segment proxy for CORS handling
  - Statistics monitoring
  - Channel catalog management

### 3. **Ace Stream Engine (Docker)**

- **Location**: `Dockerfile.acestream`
- **Purpose**: P2P streaming engine and HLS converter
- **Technology**: Ace Stream 3.2.3, Python 3.10
- **Features**:
  - P2P content streaming
  - Native HLS output
  - HTTP API for control
  - Real-time statistics

### 4. **Database (SQLite)**

- **Location**: `data/channels.db`
- **Purpose**: Channel catalog and session storage
- **Features**:
  - Channel metadata storage
  - Stream session tracking
  - Statistics persistence

## 🌊 Data Flow Overview

```
1. User Input → 2. Session Creation → 3. Engine Request → 4. P2P Download → 5. HLS Output → 6. Stream Playback
       │                │                   │                 │                │               │
   [Ace Stream ID] → [Backend API] → [Engine HTTP API] → [P2P Network] → [HLS Segments] → [Player]
```

## 🔄 Stream Lifecycle

### Phase 1: Stream Initialization

1. User enters 40-character Ace Stream content ID
2. Frontend validates format and sends POST to `/api/streams/start/:aceId`
3. Backend creates session and calls Ace Stream engine
4. Engine begins P2P discovery and content download
5. Backend returns session info with HLS URL

### Phase 2: HLS Manifest Generation

1. Player requests HLS manifest from `/api/streams/hls/:sessionId/manifest.m3u8`
2. Backend proxies request to engine `/ace/manifest.m3u8?id=:aceId`
3. Backend rewrites segment URLs to use proxy endpoints
4. Player receives modified manifest with proxied URLs

### Phase 3: Segment Streaming

1. Player requests video segments from `/api/streams/proxy/c/:hash/:segment`
2. Backend proxies segment requests to engine with proper CORS headers
3. Engine serves TS segments from P2P downloaded content
4. Player receives segments and plays video continuously

### Phase 4: Statistics & Monitoring

1. Frontend polls `/api/streams/status/:sessionId` every 5 seconds
2. Backend queries engine statistics via HTTP API
3. Real-time metrics displayed: peers, download speed, status

## 🎯 Key Design Decisions

### 1. **Express v5 Compatibility**

- **Challenge**: `path-to-regexp` breaking changes
- **Solution**: Avoided wildcard routes (`*`), used named parameters (`:param`)
- **Impact**: Stable routing without runtime errors

### 2. **CORS Handling**

- **Challenge**: Browser blocks cross-origin requests to `127.0.0.1:6878`
- **Solution**: Backend proxy with URL rewriting and proper CORS headers
- **Impact**: Seamless browser playback without security restrictions

### 3. **HLS.js Integration**

- **Challenge**: Browsers don't natively support HLS on all platforms
- **Solution**: Added hls.js library for universal HLS support
- **Impact**: Consistent playback across Chrome, Firefox, Safari, Edge

### 4. **Monorepo Architecture**

- **Challenge**: Managing multiple related applications
- **Solution**: NX workspace with shared libraries and build optimization
- **Impact**: Efficient development, shared types, coordinated builds

## 📊 Performance Characteristics

### Typical Metrics

- **Stream Startup Time**: 10-30 seconds (depends on P2P availability)
- **First Frame**: 15-45 seconds after stream start
- **Bandwidth Usage**: Variable (P2P efficiency)
- **Peer Connections**: 5-20 peers typical
- **Download Speed**: 1-10 MB/s depending on content popularity

### Resource Usage

- **Backend Memory**: ~50MB base + streaming overhead
- **Frontend Bundle**: ~700KB (including hls.js)
- **Engine Memory**: ~200-500MB (depends on cache size)
- **CPU Usage**: Low (mainly I/O bound)

## 🔐 Security Considerations

### 1. **Content Validation**

- Ace Stream ID format validation (40 hex characters)
- Input sanitization for all API endpoints
- No direct file system access from frontend

### 2. **Network Security**

- CORS properly configured for frontend domain
- Engine API isolated to localhost
- No sensitive data in client-side code

### 3. **Resource Protection**

- Session-based access control
- Automatic cleanup of inactive streams
- Rate limiting considerations (future enhancement)

## 🚀 Quick Start

1. **Prerequisites**: Docker, Node.js 18+, npm
2. **Setup**: `npm install && docker build -f Dockerfile.acestream -t ace-stream-engine .`
3. **Start Engine**: `docker run -p 6878:6878 ace-stream-engine`
4. **Start Application**: `npm run dev`
5. **Access**: Open `http://localhost:3000`

## 📚 Documentation Structure

- **[Architecture](./architecture/README.md)**: Detailed system design and component interactions
- **[API Reference](./api/README.md)**: Complete REST API documentation
- **[Deployment](./deployment/README.md)**: Production deployment guides
- **[Troubleshooting](./troubleshooting/README.md)**: Common issues and solutions
- **[System Diagrams](./diagrams.md)**: Comprehensive Mermaid diagrams of all system components

## 🤝 Contributing

See project root `README.md` for development setup and contribution guidelines.

## 📄 License

See project root for license information.
