# Ace Stream HLS Streaming System

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

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

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Clone and Setup

```bash
git clone <repository>
cd ace-stream-hls
npm install

# Create data directory for SQLite
mkdir -p data
```

### 2. Start Ace Stream Engine

```bash
# Start the Docker container
docker-compose up -d acestream-engine

# Verify it's running
curl http://127.0.0.1:6878/webui/api/service?method=get_version
```

### 3. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run serve:frontend  # http://localhost:3000
npm run serve:backend   # http://localhost:3001
```

### 4. Test the Setup

1. **Frontend**: Open http://localhost:3000
2. **Backend API**: Open http://localhost:3001/api/health
3. **Ace Stream**: Check http://localhost:6878/webui/api/service?method=get_version

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

- **NX** - Monorepo tooling and build system
- **Docker Compose** - Multi-container orchestration
- **magnetikonline/docker-acestream-server** - Ace Stream engine

## 📁 Project Structure

```
ace-stream-hls/
├── apps/
│   ├── frontend/                # React 19 + Vite + Tailwind v4
│   │   ├── src/
│   │   │   ├── app/app.tsx     # Main streaming interface
│   │   │   ├── styles.css      # Tailwind v4 configuration
│   │   │   └── main.tsx        # Entry point
│   │   └── vite.config.ts      # Vite + Tailwind config
│   └── backend/                 # Express API server
│       ├── src/
│       │   ├── main.ts         # Express server setup
│       │   ├── services/       # Business logic
│       │   │   ├── ace-stream.service.ts
│       │   │   └── database.service.ts
│       │   └── routes/         # API endpoints
│       │       ├── streams.routes.ts
│       │       ├── channels.routes.ts
│       │       └── health.routes.ts
├── docker-compose.yml          # Ace Stream engine container
├── .cursorrules               # Development guidelines
└── data/                      # SQLite database files
```

## 🔧 Development Commands

### NX Commands

```bash
# Start development servers
npm run dev                     # Both frontend and backend
npm run serve:frontend         # Frontend only
npm run serve:backend          # Backend only

# Build for production
npm run build                  # Both apps
npm run build:frontend         # Frontend only
npm run build:backend          # Backend only

# Development tools
npm run lint                   # Lint all projects
npm run test                   # Run tests
npm run graph                  # Visualize project graph
```

### NX Specific Commands

```bash
# Show available targets for a project
npx nx show project frontend
npx nx show project backend

# Run specific targets
npx nx serve frontend
npx nx build backend
npx nx lint frontend

# Run commands for multiple projects
npx nx run-many --target=build --projects=frontend,backend
npx nx run-many --target=lint --all
```

### Docker Commands

```bash
# Ace Stream engine management
docker-compose up -d acestream-engine
docker-compose down
docker-compose logs acestream-engine
docker-compose restart acestream-engine
```

## 🎯 API Endpoints

### Stream Management

- `GET /api/streams/start/:aceId` - Start streaming session
- `POST /api/streams/stop/:sessionId` - Stop streaming session
- `GET /api/streams/status/:sessionId` - Get stream statistics
- `GET /api/streams/hls/:sessionId/manifest.m3u8` - HLS manifest

### Channel Management

- `GET /api/channels` - List all channels
- `POST /api/channels` - Add new channel
- `PUT /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Remove channel

### Health & Monitoring

- `GET /api/health` - Overall system health
- `GET /api/health/acestream` - Ace Stream engine status
- `GET /api/health/database` - Database connectivity

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

## 📱 Device Compatibility

### Supported Players

- **VLC** (iOS, tvOS, Android, Desktop)
- **Web Browsers** (Chrome, Safari, Firefox, Edge)
- **Smart TVs** (Samsung, LG, Android TV)
- **Media Centers** (Kodi, Plex)

### Testing on Different Devices

#### VLC Players

- **Desktop**: VLC → Media → Open Network Stream → Enter HLS URL
- **iOS**: VLC app → Network Stream → Enter HLS URL
- **tvOS**: VLC for Apple TV → Network Stream → Enter HLS URL
- **Android**: VLC app → Stream → Network Stream → Enter HLS URL

#### Example URLs

- HLS Stream: `http://localhost:3001/api/streams/hls/{sessionId}/manifest.m3u8`
- Start Stream: `http://localhost:3001/api/streams/start/{aceStreamId}`

## 📋 Project Status

### ✅ Phase 1: Infrastructure Setup (COMPLETED)

- [x] 🏗️ NX Monorepo initialization
- [x] ⚛️ React 19 + Vite configuration
- [x] 🎨 Tailwind CSS v4 setup
- [x] 📝 TypeScript configuration with path aliases
- [x] 🐳 Docker Ace Stream engine setup
- [x] 🗄️ SQLite database schema design
- [x] 📁 Project structure organization

### 🔧 Phase 2: Core Backend (IN PROGRESS)

- [x] 🔌 Ace Stream HTTP API integration
- [x] 🎥 HLS stream endpoint creation
- [x] 📊 Stream statistics monitoring
- [x] 🗃️ Channel catalog CRUD operations
- [x] 🔄 Stream health checking
- [ ] 📡 Network discovery for local devices

### 🎨 Phase 3: Frontend Development (BASIC COMPLETE)

- [x] 🎛️ Channel management interface (basic)
- [x] 📺 Stream player component (basic)
- [x] 📱 Responsive design implementation
- [x] 🎮 VLC launch integration (basic)
- [x] 📊 Real-time statistics display (mock)
- [ ] 🔍 Search and filtering
- [ ] 🔄 Real API integration

### 🧪 Phase 4: Integration & Testing (PENDING)

- [ ] 🧪 End-to-end testing setup
- [ ] 📱 iOS/tvOS VLC testing
- [ ] 🔗 Local network stream testing
- [ ] 📈 Performance optimization
- [ ] 📚 Documentation completion
- [ ] 🚀 Deployment configuration

## 🔒 Security Considerations

- Stream URLs expire after inactivity
- Local network only (no external access by default)
- Content ID validation
- Rate limiting on API endpoints
- CORS configuration for local development
- Production deployment needs proper HTTPS and access controls

## 📈 Performance Targets

- **Stream startup time**: < 10 seconds
- **Web UI responsiveness**: < 100ms
- **Memory usage**: < 512MB (excluding Ace Stream)
- **CPU usage**: < 20% during active streaming
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s

## 🐛 Known Issues & Next Steps

### Current Issues

1. **TypeScript Router Types**: Async route handlers have type conflicts
2. **HLS Proxy**: Stream proxying needs testing with real content
3. **Database Path**: Ensure `./data/` directory exists for SQLite

### Next Steps

1. Fix async route handler TypeScript issues
2. Test with actual Ace Stream content
3. Implement real-time statistics updates
4. Add channel search and filtering
5. Improve error handling and user feedback
6. Add VLC network discovery
7. Implement stream session persistence

## 💡 Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload
2. **API Testing**: Use Postman or curl for API testing
3. **Debugging**: Check browser console and terminal logs
4. **Docker Logs**: `docker-compose logs acestream-engine` for engine issues
5. **Database**: SQLite browser extension for database inspection
6. **NX Graph**: Use `npm run graph` to visualize project dependencies

## 🔗 Useful Links

- [NX Documentation](https://nx.dev)
- [React 19 Documentation](https://react.dev)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com)
- [Ace Stream Documentation](http://acestream.org)
- [VLC Player Downloads](https://www.videolan.org/vlc/)

## 📝 License

MIT License - see LICENSE file for details

---

**Ready for development!** The foundation includes a modern React frontend with Tailwind v4, a complete Express backend with SQLite, and Docker integration for the Ace Stream engine. Perfect for testing and further development.
