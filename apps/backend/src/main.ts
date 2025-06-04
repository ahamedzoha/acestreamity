import express from 'express';
import cors from 'cors';
import { createAceStreamService } from './services/ace-stream.service';
import { createDatabaseService } from './services/database.service';
import { createStreamRoutes } from './routes/streams.routes';
import { createChannelsRoutes } from './routes/channels.routes';
import { createHealthRoutes } from './routes/health.routes';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Services
const aceStreamService = createAceStreamService({
  host: process.env.ACESTREAM_HOST || '127.0.0.1',
  port: parseInt(process.env.ACESTREAM_PORT || '6878'),
});

const databaseService = createDatabaseService({
  path: process.env.DATABASE_PATH || './data/channels.db',
});

// Initialize database
databaseService.initialize().catch(console.error);

// Routes
app.use('/api/streams', createStreamRoutes(aceStreamService));
app.use('/api/channels', createChannelsRoutes(databaseService));
app.use('/api/health', createHealthRoutes());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Ace Stream HLS API',
    version: '1.0.0',
    endpoints: {
      streams: '/api/streams',
      channels: '/api/channels',
      health: '/api/health',
    },
  });
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'Something went wrong',
    });
  }
);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`,
  });
});

app.listen(port, host, () => {
  console.log(`🚀 Ace Stream HLS API ready at http://${host}:${port}`);
  console.log(`📊 Health check: http://${host}:${port}/api/health`);
  console.log(`🎥 Streams API: http://${host}:${port}/api/streams`);
});
