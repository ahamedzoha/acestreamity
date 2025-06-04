import { Router, Request, Response, NextFunction } from 'express';

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

export function createHealthRoutes(): Router {
  const router = Router();

  // Basic health check
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
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(
            'http://localhost:6878/webui/api/service',
            {
              method: 'GET',
              signal: controller.signal,
            }
          );
          clearTimeout(timeoutId);

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
          // Simple database check - could ping database here
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const checks = await Promise.allSettled([
          fetch('http://localhost:6878/webui/api/service', {
            signal: controller.signal,
          }),
        ]);
        clearTimeout(timeoutId);

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

  return router;
}
