# System Architecture Documentation

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [System Components](#system-components)
- [Data Flow Diagrams](#data-flow-diagrams)
- [Sequence Diagrams](#sequence-diagrams)
- [Component Interactions](#component-interactions)
- [Technology Stack](#technology-stack)
- [Design Patterns](#design-patterns)

## 🏗️ Architecture Overview

The Ace Stream HLS system follows a **layered architecture** pattern with clear separation of concerns between presentation, business logic, data access, and external service integration.

### High-Level System Architecture

The system architecture consists of multiple layers working together to provide seamless P2P to HLS streaming conversion:

**Client Layer**: Web browsers, VLC players, and smart TV applications that consume HLS streams
**API Gateway Layer**: Express.js backend serving as a proxy and API gateway
**Business Logic Layer**: Core services handling stream management, database operations, and engine integration
**Data Layer**: SQLite database for persistence
**External Services**: Ace Stream engine and P2P network integration

### Deployment Architecture

In development, all components run on the host machine with the Ace Stream engine containerized. The frontend development server proxies API requests to the backend, which communicates with the containerized engine via HTTP API.

## 🧩 System Components

### 1. Frontend Architecture (React 19 + TypeScript)

**Location**: `apps/frontend/`
**Technology**: React 19, TypeScript, Tailwind CSS v4, hls.js, Vite

**Key Components**:

- **App Component**: Main application container managing global state
- **HLS Player**: Video player component using hls.js for cross-browser HLS support
- **Stream Controls**: User interface for starting, stopping, and managing streams
- **Statistics Display**: Real-time metrics and performance indicators

**Services**:

- **API Service**: HTTP client for backend communication
- **HLS Service**: Stream management and player integration

**State Management**: Local React state with effect hooks for side effects and API integration

### 2. Backend Architecture (Express.js v5 + TypeScript)

**Location**: `apps/backend/`
**Technology**: Express.js v5, TypeScript, SQLite, Node.js 22

**Route Handlers**:

- **Stream Routes** (`/api/streams/*`): Stream lifecycle management

  - `POST /start/:aceId` - Initialize new stream session
  - `GET /hls/:sessionId/manifest.m3u8` - HLS manifest proxy
  - `GET /proxy/c/:hash/:segment` - Segment proxy for CORS handling
  - `GET /status/:sessionId` - Real-time statistics
  - `POST /stop/:sessionId` - Stream termination

- **Channel Routes** (`/api/channels/*`): Channel catalog management
- **Health Routes** (`/api/health/*`): System health monitoring

**Middleware**:

- **CORS Handler**: Cross-origin request management
- **Error Handler**: Global error handling and logging
- **Request Logger**: Development request tracking

**Services**:

- **Ace Stream Service**: Engine integration and HTTP API wrapper
- **Database Service**: SQLite operations and data persistence
- **Statistics Service**: Metrics collection and aggregation

### 3. Ace Stream Engine Integration

**Location**: `Dockerfile.acestream`
**Technology**: Ace Stream 3.2.3, Python 3.10, BitTorrent Protocol

**Components**:

- **HTTP API Layer** (Port 6878): RESTful interface for engine control
- **Core Engine**: Python-based P2P streaming engine
- **Torrent Session**: BitTorrent client for content discovery and download
- **HLS Generator**: Real-time TS segmentation and manifest generation
- **Content Cache**: Downloaded chunk storage and management
- **P2P Protocol**: BitTorrent/DHT networking for peer communication

## 🌊 Data Flow Diagrams

### 1. Stream Initialization Flow

```
User Input → Frontend Validation → Backend Session Creation → Engine Request → P2P Discovery → Stream Ready
```

**Detailed Steps**:

1. User enters 40-character Ace Stream content ID
2. Frontend validates format and sends POST to `/api/streams/start/:aceId`
3. Backend creates unique session and stores in memory
4. Backend requests stream initialization from engine with `format=json`
5. Engine starts torrent session and begins P2P peer discovery
6. Engine returns session URLs (playback_url, stat_url, command_url)
7. Backend responds with session info and HLS URL
8. Frontend initializes player and begins statistics polling

### 2. HLS Playback Flow

```
Player Request → Manifest Proxy → URL Rewriting → Segment Requests → P2P Download → Stream Playback
```

**Detailed Steps**:

1. HLS player requests manifest from `/api/streams/hls/:sessionId/manifest.m3u8`
2. Backend proxies request to engine `/ace/manifest.m3u8?id=:aceId`
3. Engine generates HLS manifest with direct engine URLs
4. Backend rewrites segment URLs to use proxy endpoints (`/api/streams/proxy/c/:hash/:segment`)
5. Player receives modified manifest and begins segment requests
6. Each segment request is proxied through backend with proper CORS headers
7. Engine serves TS segments from P2P downloaded content
8. Player receives segments and plays video continuously

### 3. Statistics Collection Flow

```
Frontend Timer → Backend Request → Engine Query → Metrics Processing → UI Update
```

**Detailed Steps**:

1. Frontend polls `/api/streams/status/:sessionId` every 5 seconds
2. Backend queries engine statistics via session stat_url
3. Engine returns real-time metrics (peers, speeds, status, progress)
4. Backend formats and processes statistics
5. Frontend updates UI with current metrics
6. Process repeats while stream is active

## 🔄 Sequence Diagrams

### Complete Stream Lifecycle Sequence

The complete lifecycle involves four main phases:

**Phase 1: Initialization**

- User input validation and session creation
- Engine communication and P2P setup
- Session URL generation and storage

**Phase 2: Playback Setup**

- HLS manifest generation and URL rewriting
- Player initialization and segment discovery
- First segment requests and playback start

**Phase 3: Active Streaming**

- Continuous segment requests and delivery
- Statistics collection and UI updates
- P2P network optimization and buffering

**Phase 4: Cleanup**

- Stream termination and resource cleanup
- Session removal and engine notification
- UI state reset and memory cleanup

### Error Handling Sequence

**Segment Load Errors**:

- Engine returns HTTP 500 for unavailable segments
- HLS player implements retry logic with exponential backoff
- Multiple retry attempts before fatal error declaration

**Network Errors**:

- Connection timeouts trigger service unavailable responses
- Frontend displays appropriate error messages
- Health checks determine engine availability for recovery

**Engine Unavailability**:

- Backend detects engine connection failures
- Frontend disables stream controls and shows status
- Automatic recovery attempts when engine becomes available

## 🔧 Component Interactions

### Service Layer Interactions

The backend implements a service-oriented architecture with clear separation of concerns:

**Stream Service**: Manages stream sessions, coordinates with Ace Stream service, handles session lifecycle
**Database Service**: Provides data persistence, manages SQLite connections, handles query operations
**Ace Stream Service**: Abstracts engine HTTP API, handles error management, provides retry logic

### Error Propagation

Errors flow through multiple layers with appropriate handling at each level:

**Service Layer**: Catches and logs errors, implements retry logic, formats error responses
**API Layer**: Global error middleware, response formatting, error monitoring
**Client Layer**: HLS error handling, UI error display, recovery action presentation

## 🛠️ Technology Stack

### Frontend Technologies

**Core Framework**: React 19 with TypeScript for type safety and modern features
**Build Tool**: Vite for fast development and optimized production builds
**Styling**: Tailwind CSS v4 with utility-first approach and modern CSS features
**Video Streaming**: hls.js library for universal HLS support across browsers
**Development**: ESLint, Prettier, Hot Module Reload for efficient development

### Backend Technologies

**Runtime**: Node.js 22 with Express.js v5 for modern JavaScript features
**Type Safety**: TypeScript for compile-time error detection
**Database**: SQLite with sqlite3 driver for embedded data storage
**HTTP**: CORS middleware, Fetch API for engine communication
**Development**: Nodemon for auto-restart, Node debugger for development

### Infrastructure Technologies

**Containerization**: Docker for Ace Stream engine isolation
**Monorepo**: NX for build system and dependency management
**Engine**: Python 3.10 runtime with Ace Stream 3.2.3 and BitTorrent protocol
**Development**: Git version control, VS Code integration, remote debugging

## 🎨 Design Patterns

### Architecture Patterns

**Layered Architecture**: Clear separation between presentation, business logic, and data layers
**API Gateway Pattern**: Backend serves as gateway and proxy to Ace Stream engine
**Proxy Pattern**: Backend proxies requests to avoid CORS issues and provide unified interface
**Repository Pattern**: Database service abstracts data access operations
**Service Layer Pattern**: Business logic encapsulated in dedicated service classes

### Integration Patterns

**Adapter Pattern**: Ace Stream service adapts engine HTTP API to application needs
**Facade Pattern**: Simple API interface hiding complex engine interactions
**Observer Pattern**: Statistics polling and real-time UI updates
**Strategy Pattern**: Different error handling strategies for various failure scenarios

### Error Handling Patterns

**Circuit Breaker**: Future enhancement for engine failure handling and recovery
**Retry Pattern**: Exponential backoff for segment loading and network failures
**Bulkhead Pattern**: Isolation of different service components to prevent cascading failures
**Timeout Pattern**: Request timeouts and graceful degradation for improved reliability

### Performance Patterns

**Lazy Loading**: Components and routes loaded on demand
**Caching**: Engine content caching and browser-level caching strategies
**Streaming**: Real-time data streaming for video segments and statistics
**Connection Pooling**: Efficient database connection management

This architecture provides a robust, scalable foundation for P2P to HLS streaming conversion while maintaining clear separation of concerns and enabling future enhancements.
