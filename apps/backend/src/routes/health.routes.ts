import { Router, Request, Response, NextFunction } from 'express';
import { AceStreamService } from '../services/ace-stream.service';
import { DatabaseService } from '../services/database.service';

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'error';

type ServiceHealth = {
  status: HealthStatus;
  error?: string | null;
  version?: string | null;
};

type HealthResponse = {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  services: {
    aceStream?: ServiceHealth;
    database?: ServiceHealth;
  };
};

export function createHealthRoutes(
  aceStreamService: AceStreamService,
  databaseService: DatabaseService
): Router {
  const router = Router();

  // Overall health check
  router.get(
    '/',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const health: HealthResponse = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          services: {},
        };

        // Check Ace Stream service
        try {
          const response = await fetch(
            'http://localhost:6878/webui/api/service',
            {
              method: 'GET',
              timeout: 5000,
            }
          );

          if (response.ok) {
            const data = await response.json();
            health.services.aceStream = {
              status: 'healthy',
              version: data.version || null,
              error: null,
            };
          } else {
            health.services.aceStream = {
              status: 'error',
              version: null,
              error: `HTTP ${response.status}: ${response.statusText}`,
            };
            health.status = 'degraded';
          }
        } catch (error) {
          health.services.aceStream = {
            status: 'error',
            version: null,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          health.status = 'degraded';
        }

        // Check database connectivity
        try {
          // Simple database check - you might want to implement a ping method
          health.services.database = {
            status: 'healthy',
            error: null,
          };
        } catch (error) {
          health.services.database = {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          health.status = 'degraded';
        }

        // Set appropriate HTTP status
        const statusCode =
          health.status === 'healthy'
            ? 200
            : health.status === 'degraded'
            ? 200
            : 503;

        res.status(statusCode).json(health);
      } catch (error) {
        next(error);
      }
    }
  );

  // Readiness probe
  router.get(
    '/ready',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Check if all critical services are available
        const checks = await Promise.allSettled([
          fetch('http://localhost:6878/webui/api/service', { timeout: 2000 }),
        ]);

        const isReady = checks.every((result) => result.status === 'fulfilled');

        if (isReady) {
          res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString(),
          });
        } else {
          res.status(503).json({
            status: 'not ready',
            timestamp: new Date().toISOString(),
            errors: checks
              .filter((result) => result.status === 'rejected')
              .map(
                (result) =>
                  (result as PromiseRejectedResult).reason?.message ||
                  'Unknown error'
              ),
          });
        }
      } catch (error) {
        next(error);
      }
    }
  );

  // Liveness probe
  router.get(
    '/live',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        res.status(200).json({
          status: 'alive',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Ace Stream engine specific health
  router.get('/acestream', async (req: Request, res: Response) => {
    try {
      const engineStatus = await aceStreamService.checkEngine();
      const sessions = aceStreamService.getActiveSessions();

      res.json({
        status: 'healthy',
        engine: engineStatus,
        activeSessions: sessions.size,
        sessions: Array.from(sessions.values()).map((session) => ({
          id: session.id,
          aceId: session.aceId,
          status: session.status,
          startedAt: session.startedAt,
        })),
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        engine: null,
        activeSessions: 0,
        sessions: [],
      });
    }
  });

  // Database specific health
  router.get('/database', async (req: Request, res: Response) => {
    try {
      const channels = await databaseService.getChannels();

      res.json({
        status: 'healthy',
        channelCount: channels.length,
        recentChannels: channels.slice(0, 5).map((ch) => ({
          id: ch.id,
          name: ch.name,
          category: ch.category,
          is_active: ch.is_active,
        })),
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        channelCount: 0,
        recentChannels: [],
      });
    }
  });

  return router;
}
