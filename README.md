# Acestreamity - Universal P2P Streaming Platform

A modern React-based streaming platform that bridges Ace Stream P2P technology with HTTP Live Streaming (HLS), enabling cross-platform streaming to devices that don't natively support Ace Stream (iOS, tvOS, etc.).

## ✨ Features

### 🎬 **Modern Streaming Interface**

- **Large Player View**: 2/3 screen real estate for an immersive viewing experience
- **Channel Sidebar**: Easy navigation with organized channel categories
- **Dark Theme**: Sleek gradient design with purple/pink accents
- **Real-time Stats**: Live peer count, download speeds, and connection status

### ⌨️ **Full Accessibility & Remote Control**

- **Keyboard Navigation**: Complete TV remote and keyboard support
  - `Enter/Space` - Play/Stop streams
  - `↑/↓ Arrow Keys` - Navigate channels
  - `Escape` - Stop current stream
- **Search Functionality**: Quick channel search and filtering
- **Visual Feedback**: Active selection indicators and status chips

### 🌐 **Cross-Platform Compatibility**

- **Web Player**: Built-in HLS video player
- **iOS/tvOS Support**: Stream to any device via standard HLS URLs
- **VLC Integration**: Direct VLC launcher for desktop
- **URL Sharing**: Copy stream URLs for external players

### 🚀 **Technical Stack**

- **Frontend**: React 19, Vite, TypeScript, HeroUI (Tailwind v4)
- **Backend**: Node.js, Express, SQLite
- **Infrastructure**: Docker, Ace Stream Engine
- **Monorepo**: NX workspace for scalable development

## 🎮 **How to Use**

### **TV Remote / Keyboard Controls**

```
▶️  Enter/Space  →  Play/Stop Stream
⬆️  ↑/↓ Arrows  →  Navigate Channels
⏹️  Escape      →  Stop Current Stream
🔍  Type        →  Search Channels
```

### **Quick Start**

1. **Select a Channel**: Browse the sidebar or search for specific content
2. **Custom Streams**: Enter any 40-character Ace Stream ID manually
3. **Watch Anywhere**: Use the built-in player or copy URLs for external apps
4. **Monitor Performance**: View real-time peer connections and download speeds

## 📱 **Channel Management**

### **Built-in Categories**

- **Sports**: Live sporting events and matches
- **Movies**: On-demand movie content
- **News**: Live news channels and broadcasts
- **Custom**: User-provided Ace Stream IDs

### **Live Status Indicators**

- 🔴 **Live** - Active stream with peer connections
- ⚪ **Offline** - Stream currently unavailable
- 🟡 **Loading** - Stream initializing

## 🛠️ **Development**

### **Prerequisites**

- Node.js 18+
- Docker (for Ace Stream engine)
- Modern browser with HLS support

### **Quick Setup**

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Build for production
npm run build
```

### **Project Structure**

```
apps/
  frontend/          # React app (Acestreamity UI)
  backend/           # Express API server
libs/
  shared/           # Shared types and utilities
```

## 🎨 **UI Components**

### **HeroUI Integration**

- Modern component library with Tailwind v4
- Accessible form controls and navigation
- Responsive design for all screen sizes
- Dark theme with purple/pink gradients

### **Key Components**

- **Channel Sidebar**: Searchable channel browser
- **Video Player**: Full-screen HLS player with overlays
- **Status Dashboard**: Real-time streaming metrics
- **Control Panel**: Play/stop/copy URL controls

## 🔧 **Configuration**

### **Environment Variables**

```env
PORT=3001
ACESTREAM_ENGINE_URL=http://localhost:6878
HLS_OUTPUT_DIR=/tmp/acestream-hls
```

### **Ace Stream Engine**

The platform requires a running Ace Stream engine. Use the provided Docker setup:

```bash
docker run -p 6878:6878 magnetikonline/docker-acestream-server
```

## 📊 **Performance**

### **Optimizations**

- **Bundle Size**: < 500KB gzipped
- **First Load**: < 1.5s Time to Interactive
- **Stream Startup**: < 10s average
- **HLS Segments**: 2-6s adaptive quality

### **Browser Support**

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+ (iOS/macOS)
- Smart TV browsers with HLS support

## 🎯 **Use Cases**

### **Home Entertainment**

- Stream live sports to Apple TV via AirPlay
- Watch movies on tablets and phones
- Integrate with home automation systems

### **Content Distribution**

- Corporate live streaming
- Educational content delivery
- Community broadcasting

## 🤝 **Contributing**

### **Development Guidelines**

- Follow TypeScript strict mode
- Use HeroUI components for consistency
- Implement keyboard navigation for all features
- Test across multiple devices and browsers

### **Code Style**

- ESLint + Prettier configuration
- Conventional commit messages
- Component-driven development
- Accessibility-first design

## 📄 **License**

MIT License - see [LICENSE](LICENSE) for details.

---

**Acestreamity** - Bringing P2P streaming to every device, everywhere. 🌍✨
