# Deployment Guide

## 📋 Table of Contents

- [Development Environment](#development-environment)
- [Production Deployment](#production-deployment)
- [Docker Configuration](#docker-configuration)
- [Environment Variables](#environment-variables)
- [Monitoring & Logging](#monitoring--logging)
- [Security Considerations](#security-considerations)

## 🛠️ Development Environment

### Prerequisites

**Required Software**:

- **Node.js**: v18.0.0 or higher (v22+ recommended)
- **npm**: v8.0.0 or higher
- **Docker**: v20.10.0 or higher
- **Git**: v2.30.0 or higher

**System Requirements**:

- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: 10GB free space for development
- **Network**: Stable internet connection for P2P functionality

### Quick Start

1. **Clone Repository**:

```bash
git clone <repository-url>
cd acestremio
```

2. **Install Dependencies**:

```bash
npm install
```

3. **Build Ace Stream Engine**:

```bash
docker build -f Dockerfile.acestream -t ace-stream-engine .
```

4. **Start Development Environment**:

```bash
# Terminal 1: Start Ace Stream Engine
docker run -p 6878:6878 ace-stream-engine

# Terminal 2: Start Application
npm run dev
```

5. **Access Application**:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Ace Stream Engine**: http://localhost:6878

### Development Scripts

```bash
# Start all services in development mode
npm run dev

# Build all applications
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## 🚀 Production Deployment

### Single Server Deployment

**Server Requirements**:

- **CPU**: 2+ cores
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50GB+ SSD
- **Network**: High-speed internet with P2P ports open
- **OS**: Ubuntu 20.04+ or CentOS 8+

**Deployment Steps**:

1. **Server Preparation**:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install PM2 for process management
sudo npm install -g pm2
```

2. **Application Deployment**:

```bash
# Clone and build
git clone <repository-url> /opt/acestreamio
cd /opt/acestreamio
npm ci --production
npm run build

# Build Ace Stream Engine
docker build -f Dockerfile.acestream -t ace-stream-engine .
```

3. **Process Management**:

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'acestreamio-backend',
      script: 'dist/apps/backend/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 2,
      exec_mode: 'cluster'
    }
  ]
};
EOF

# Start applications
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### Docker Compose Deployment

**docker-compose.prod.yml**:

```yaml
version: '3.8'

services:
  ace-stream-engine:
    build:
      context: .
      dockerfile: Dockerfile.acestream
    ports:
      - '6878:6878'
    restart: unless-stopped
    volumes:
      - ace-data:/opt/acestream/.ACEStream

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - '3001:3001'
    depends_on:
      - ace-stream-engine
    restart: unless-stopped
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - ACESTREAM_URL=http://ace-stream-engine:6878

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - '80:80'
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  ace-data:
```

## 🐳 Docker Configuration

### Dockerfile.backend

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build:backend

FROM node:22-alpine AS production

WORKDIR /app
COPY --from=builder /app/dist/apps/backend ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001
USER node
CMD ["node", "main.js"]
```

### Dockerfile.frontend

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:frontend

FROM nginx:alpine AS production

COPY --from=builder /app/dist/apps/frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔧 Environment Variables

### Development (.env.development)

```bash
# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Ace Stream Engine
ACESTREAM_URL=http://127.0.0.1:6878
ACESTREAM_TIMEOUT=30000

# Database
DATABASE_PATH=./data/channels.db

# Logging
LOG_LEVEL=debug
```

### Production (.env.production)

```bash
# Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com

# Ace Stream Engine
ACESTREAM_URL=http://ace-stream-engine:6878
ACESTREAM_TIMEOUT=10000

# Database
DATABASE_PATH=/app/data/channels.db

# Logging
LOG_LEVEL=info

# Security
CORS_ORIGIN=https://your-domain.com
```

## 📊 Monitoring & Logging

### Application Monitoring

**PM2 Monitoring**:

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs

# Restart applications
pm2 restart all
```

**Health Checks**:

```bash
# Application health
curl http://localhost:3001/api/health

# Engine health
curl http://localhost:6878/webui/api/service?method=get_version
```

### Logging Configuration

**Structured Logging**:

```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.Console(),
  ],
});
```

## 🔒 Security Considerations

### Network Security

**Firewall Configuration**:

```bash
# UFW setup
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 6878/tcp  # Ace Stream engine
sudo ufw enable
```

### Application Security

**Input Validation**:

```typescript
export const validateAceStreamId = (id: string): boolean => {
  return /^[a-f0-9]{40}$/i.test(id);
};
```

**Rate Limiting**:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});

app.use('/api', limiter);
```

This deployment guide provides comprehensive coverage of development setup, production deployment options, Docker configuration, and security considerations for the Ace Stream HLS system.
