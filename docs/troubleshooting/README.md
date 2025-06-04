# Troubleshooting Guide

## 📋 Table of Contents

- [Common Issues](#common-issues)
- [Diagnostic Tools](#diagnostic-tools)
- [Error Messages](#error-messages)
- [Performance Issues](#performance-issues)
- [Network Problems](#network-problems)
- [Browser Compatibility](#browser-compatibility)

## 🔧 Common Issues

### Ace Stream Engine Not Starting

**Symptoms**:

- Backend returns "Engine unavailable" errors
- Health check fails for Ace Stream service
- Docker container exits immediately

**Diagnosis**:

```bash
# Check container status
docker ps -a | grep ace-stream

# View container logs
docker logs ace-stream-engine

# Check port availability
netstat -an | grep :6878
```

**Solutions**:

1. **Port Conflict**:

```bash
# Kill process using port 6878
sudo lsof -ti:6878 | xargs sudo kill -9

# Start engine with different port
docker run -p 6879:6878 ace-stream-engine
```

2. **Rebuild Container**:

```bash
# Clean rebuild
docker rmi ace-stream-engine
docker build --no-cache -f Dockerfile.acestream -t ace-stream-engine .
```

### HLS Playback Errors

**Symptoms**:

- Video player shows "Cannot play media" error
- Network errors in browser console
- 500 errors for segment requests

**Diagnosis**:

```bash
# Test manifest accessibility
curl -I http://localhost:3001/api/streams/hls/SESSION_ID/manifest.m3u8

# Test segment proxy
curl -I http://localhost:3001/api/streams/proxy/c/HASH/0.ts

# Check engine direct access
curl -I http://127.0.0.1:6878/ace/manifest.m3u8?id=CONTENT_ID
```

**Solutions**:

1. **CORS Issues**:

```typescript
// Verify CORS headers in backend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
```

2. **Invalid Content ID**:

```typescript
// Validate Ace Stream ID format
const aceIdRegex = /^[a-f0-9]{40}$/i;
if (!aceIdRegex.test(aceId)) {
  throw new Error('Invalid Ace Stream ID format');
}
```

### Frontend Build Issues

**Symptoms**:

- "Module not found" errors during build
- TypeScript compilation errors
- Vite build failures

**Solutions**:

1. **Dependency Issues**:

```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Update dependencies
npm update
```

2. **TypeScript Errors**:

```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update TypeScript
npm install -D typescript@latest
```

## 🔍 Diagnostic Tools

### System Health Check Script

```bash
#!/bin/bash
# health-check.sh

echo "=== Ace Stream HLS System Diagnostic ==="
echo "Timestamp: $(date)"
echo

echo "=== System Information ==="
echo "OS: $(uname -a)"
echo "Node.js: $(node --version)"
echo "Docker: $(docker --version)"
echo

echo "=== Process Status ==="
echo "Frontend (expected on :3000):"
lsof -i :3000 2>/dev/null || echo "Not running"

echo "Backend (expected on :3001):"
lsof -i :3001 2>/dev/null || echo "Not running"

echo "Ace Stream Engine (expected on :6878):"
lsof -i :6878 2>/dev/null || echo "Not running"
echo

echo "=== Docker Containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo

echo "=== Network Connectivity ==="
echo "Backend health:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null || echo "Failed"

echo "Engine health:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:6878/webui/api/service?method=get_version 2>/dev/null || echo "Failed"
```

### Performance Monitoring

```bash
# Monitor system resources
watch -n 5 'free -h && docker stats --no-stream'

# Check process memory usage
ps aux --sort=-%mem | head -10

# Monitor network connections
netstat -tlnp | grep -E ':(3000|3001|6878)'
```

## ⚠️ Error Messages

### Backend Error Messages

**"Engine unavailable"**

- **Cause**: Ace Stream engine not responding
- **Solution**: Check engine container, restart if needed
- **Command**: `docker restart ace-stream-engine`

**"Invalid Ace Stream ID format"**

- **Cause**: Content ID is not 40 hexadecimal characters
- **Solution**: Verify content ID format
- **Pattern**: `/^[a-f0-9]{40}$/i`

**"Stream session not found"**

- **Cause**: Session expired or never created
- **Solution**: Start new stream session

### Frontend Error Messages

**"Network Error"**

- **Cause**: Backend not accessible
- **Solution**: Check backend status and CORS configuration
- **Check**: `curl http://localhost:3001/api/health`

**"Failed to load manifest"**

- **Cause**: HLS manifest not accessible
- **Solution**: Check stream session and engine status

## 📈 Performance Issues

### Slow Stream Startup

**Solutions**:

1. **Optimize Engine Settings**:

```bash
# Increase engine timeout
export ACESTREAM_TIMEOUT=30000
```

2. **Frontend Buffer Configuration**:

```typescript
const hlsConfig = {
  maxBufferLength: 30,
  maxBufferSize: 60 * 1000 * 1000,
};
```

### High Memory Usage

**Diagnosis**:

```bash
# Monitor memory usage
watch -n 5 'free -h'

# Check Docker memory usage
docker stats --no-stream
```

**Solutions**:

1. **Limit Node.js Memory**:

```bash
node --max-old-space-size=2048 dist/apps/backend/main.js
```

2. **Container Memory Limits**:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1GB
```

## 🌐 Network Problems

### Firewall Configuration

**Required Ports**:

```bash
# Allow required ports
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 3001/tcp  # Backend
sudo ufw allow 6878/tcp  # Ace Stream Engine
```

### DNS Resolution

**Test DNS**:

```bash
# Test domain resolution
nslookup tracker.example.com
```

## 🌍 Browser Compatibility

### Chrome Issues

**CORS Errors**:

```bash
# Development only - disable security
google-chrome --disable-web-security --user-data-dir=/tmp/chrome_dev
```

### Safari Issues

**HLS Native Support**:

```javascript
// Use native HLS for Safari
if (video.canPlayType('application/vnd.apple.mpegurl')) {
  video.src = hlsUrl;
} else if (Hls.isSupported()) {
  const hls = new Hls();
  hls.loadSource(hlsUrl);
  hls.attachMedia(video);
}
```

This troubleshooting guide covers the most common issues and provides systematic approaches to diagnose and resolve problems in the Ace Stream HLS system.
