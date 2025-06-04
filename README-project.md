# Ace Stream HLS Streaming System

A modern React-based streaming platform that provides HTTP HLS streaming capabilities for Ace Stream content, enabling playback on devices that don't support Ace Stream natively (iOS, tvOS, etc.).

## 🎯 Project Overview

This system bridges Ace Stream's P2P technology with standard HTTP Live Streaming (HLS), making content accessible through any HLS-compatible player like VLC.

### Key Features

- 🐳 Docker-based Ace Stream engine
- 🎥 HTTP HLS stream conversion
- 📱 Cross-platform compatibility (iOS, tvOS, Android, Desktop)
- 🎛️ Web-based stream catalog management
- 📺 VLC player integration
- 🔄 Real-time stream monitoring
- 📊 SQLite-based channel database

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Web UI │    │  Backend API    │    │ Ace Stream      │
│   (Port 3000)   │◄──►│  (Port 3001)    │◄──►│ Engine          │
│                 │    │                 │    │ (Port 6878)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Tailwind v4   │    │   SQLite DB     │    │   Docker        │
│   Vite Build    │    │   Channel Data  │    │   Container     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Project Checklist

### Phase 1: Infrastructure Setup

- [ ] 🏗️ NX Monorepo initialization
- [ ] ⚛️ React 19 + Vite configuration
- [ ] 🎨 Tailwind CSS v4 setup
- [ ] 📝 TypeScript configuration with path aliases
- [ ] 🐳 Docker Ace Stream engine setup
- [ ] 🗄️ SQLite database schema design
- [ ] 📁 Project structure organization

### Phase 2: Core Backend

- [ ] 🔌 Ace Stream HTTP API integration
- [ ] 🎥 HLS stream endpoint creation
- [ ] 📊 Stream statistics monitoring
- [ ] 🗃️ Channel catalog CRUD operations
- [ ] 🔄 Stream health checking
- [ ] 📡 Network discovery for local devices

### Phase 3: Frontend Development

- [ ] 🎛️ Channel management interface
- [ ] 📺 Stream player component
- [ ] 📱 Responsive design implementation
- [ ] 🎮 VLC launch integration
- [ ] 📊 Real-time statistics display
- [ ] 🔍 Search and filtering

### Phase 4: Integration & Testing

- [ ] 🧪 End-to-end testing setup
- [ ] 📱 iOS/tvOS VLC testing
- [ ] 🔗 Local network stream testing
- [ ] 📈 Performance optimization
- [ ] 📚 Documentation completion
- [ ] 🚀 Deployment configuration

## 🛠️ Tech Stack

### Frontend

- **React 19** - Latest React with concurrent features
- **Vite** - Fast build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS framework (latest)
- **TypeScript** - Type safety and developer experience

### Backend

- **Node.js** - Runtime environment
- **Express** - Web framework
- **SQLite** - Lightweight database
- **Docker** - Containerization

### Infrastructure

- **NX** - Monorepo tooling
- **Docker Compose** - Multi-container orchestration
- **magnetikonline/docker-acestream-server** - Ace Stream engine

## 🌐 Stream Flow

1. **Content ID Input** → User provides Ace Stream content ID
2. **Engine Request** → Backend requests stream from Ace Stream engine
3. **HLS Conversion** → Engine converts P2P stream to HLS format
4. **Stream Serving** → Backend proxies HLS stream to frontend
5. **Player Launch** → User can play via web or launch VLC
6. **Network Sharing** → Stream accessible to local network devices

## 📊 Database Schema

```sql
-- Channel catalog
CREATE TABLE channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  ace_stream_id TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  language TEXT,
  quality TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Stream sessions
CREATE TABLE stream_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id INTEGER REFERENCES channels(id),
  session_token TEXT UNIQUE,
  hls_url TEXT,
  status TEXT,
  peers_count INTEGER DEFAULT 0,
  download_speed INTEGER DEFAULT 0,
  upload_speed INTEGER DEFAULT 0,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🎯 API Endpoints

### Stream Management

- `GET /api/streams/start/:aceId` - Start streaming session
- `GET /api/streams/stop/:sessionId` - Stop streaming session
- `GET /api/streams/status/:sessionId` - Get stream statistics
- `GET /api/streams/hls/:sessionId/manifest.m3u8` - HLS manifest

### Channel Management

- `GET /api/channels` - List all channels
- `POST /api/channels` - Add new channel
- `PUT /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Remove channel

### System

- `GET /api/health` - System health check
- `GET /api/engine/status` - Ace Stream engine status

## 🔧 Environment Variables

```env
# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Ace Stream Engine
ACESTREAM_HOST=127.0.0.1
ACESTREAM_PORT=6878

# Database
DATABASE_PATH=./data/channels.db

# Network
LOCAL_NETWORK_INTERFACE=eth0
ENABLE_NETWORK_DISCOVERY=true
```

## 🚀 Quick Start

1. **Clone and Setup**

   ```bash
   git clone <repository>
   cd ace-stream-hls
   npm install
   ```

2. **Start Ace Stream Engine**

   ```bash
   docker run -d --name acestream-engine \
     -p 6878:6878 \
     magnetikonline/acestream-server:3.1.49_debian_8.11
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

## 📱 Device Compatibility

### Supported Players

- **VLC** (iOS, tvOS, Android, Desktop)
- **Web Browsers** (Chrome, Safari, Firefox, Edge)
- **Smart TVs** (Samsung, LG, Android TV)
- **Media Centers** (Kodi, Plex)

### Network Requirements

- Local network access for cross-device streaming
- Minimum 10Mbps bandwidth for HD streams
- UDP traffic support for Ace Stream P2P

## 🔒 Security Considerations

- Stream URLs expire after inactivity
- Local network only (no external access)
- Content ID validation
- Rate limiting on API endpoints
- CORS configuration for local development

## 📈 Performance Targets

- Stream startup time: < 10 seconds
- Web UI responsiveness: < 100ms
- Memory usage: < 512MB (excluding Ace Stream)
- CPU usage: < 20% during active streaming

This project enables seamless streaming across all devices in your local network while maintaining the benefits of Ace Stream's P2P technology.
