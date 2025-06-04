import { Router, Request, Response, NextFunction } from 'express';
import { AceStreamService } from '../services/ace-stream.service';

export function createStreamRoutes(aceStreamService: AceStreamService): Router {
  const router = Router();

  // Start a new stream
  router.post(
    '/start/:aceId',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { aceId } = req.params;

        // Validate Ace Stream ID format
        if (aceId.length !== 40 || !/^[a-f0-9]+$/i.test(aceId)) {
          res.status(400).json({
            success: false,
            error: 'Invalid Ace Stream ID format',
          });
          return;
        }

        const useApiEvents = req.query.events === 'true';

        const session = await aceStreamService.startStream(aceId, {
          useApiEvents,
        });

        res.json({
          success: true,
          session: {
            id: session.id,
            aceId: session.aceId,
            status: session.status,
            hlsUrl: `${req.protocol}://${req.get('host')}/api/streams/hls/${
              session.id
            }/manifest.m3u8`,
            startedAt: session.startedAt,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Stop a stream
  router.post(
    '/stop/:sessionId',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { sessionId } = req.params;
        await aceStreamService.stopStream(sessionId);

        res.json({
          success: true,
          message: 'Stream stopped successfully',
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get stream statistics
  router.get(
    '/status/:sessionId',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { sessionId } = req.params;
        const stats = await aceStreamService.getStreamStats(sessionId);

        res.json({
          success: true,
          stats,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get all active sessions
  router.get(
    '/active',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const sessions = aceStreamService.getActiveSessions();
        const sessionList = Array.from(sessions.values()).map((session) => ({
          id: session.id,
          aceId: session.aceId,
          status: session.status,
          hlsUrl: `${req.protocol}://${req.get('host')}/api/streams/hls/${
            session.id
          }/manifest.m3u8`,
          startedAt: session.startedAt,
        }));

        res.json({
          success: true,
          sessions: sessionList,
          count: sessionList.length,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // HLS manifest proxy to Ace Stream engine
  router.get(
    '/hls/:sessionId/manifest.m3u8',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { sessionId } = req.params;
        const sessions = aceStreamService.getActiveSessions();
        const session = sessions.get(sessionId);

        if (!session) {
          res.status(404).json({
            success: false,
            error: 'Stream session not found',
          });
          return;
        }

        // Proxy the HLS manifest directly from the Ace Stream engine
        const engineHlsUrl = `http://127.0.0.1:6878/ace/manifest.m3u8?id=${session.aceId}`;

        try {
          const engineResponse = await fetch(engineHlsUrl);

          if (!engineResponse.ok) {
            res.status(engineResponse.status).json({
              success: false,
              error: `Engine returned ${engineResponse.status}: ${engineResponse.statusText}`,
            });
            return;
          }

          const manifestContent = await engineResponse.text();

          // Rewrite segment URLs to go through our backend proxy to avoid CORS issues
          const baseUrl = `${req.protocol}://${req.get('host')}/api/streams`;
          const rewrittenManifest = manifestContent.replace(
            /http:\/\/127\.0\.0\.1:6878\/ace\//g,
            `${baseUrl}/proxy/`
          );

          // Set proper HLS headers
          res.set({
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
          });

          res.send(rewrittenManifest);
        } catch (fetchError) {
          res.status(500).json({
            success: false,
            error: `Failed to fetch manifest from engine: ${
              fetchError instanceof Error ? fetchError.message : 'Unknown error'
            }`,
          });
        }
      } catch (error) {
        next(error);
      }
    }
  );

  // Direct stream proxy (for VLC and other players)
  router.get(
    '/direct/:sessionId',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { sessionId } = req.params;
        const sessions = aceStreamService.getActiveSessions();
        const session = sessions.get(sessionId);

        if (!session) {
          res.status(404).json({
            success: false,
            error: 'Stream session not found',
          });
          return;
        }

        // Direct stream from Ace Stream engine
        const engineStreamUrl = `http://127.0.0.1:6878/ace/getstream?id=${session.aceId}`;

        // Simply redirect to the engine's stream URL - this works better for VLC and other players
        res.redirect(engineStreamUrl);
      } catch (error) {
        next(error);
      }
    }
  );

  // Proxy route for HLS segments (avoids CORS issues)
  router.get(
    '/proxy/c/:sessionHash/:segment',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { sessionHash, segment } = req.params;
        const path = `c/${sessionHash}/${segment}`;

        // Construct the original engine URL
        const engineUrl = `http://127.0.0.1:6878/ace/${path}`;

        try {
          const engineResponse = await fetch(engineUrl);

          if (!engineResponse.ok) {
            res.status(engineResponse.status).json({
              success: false,
              error: `Engine returned ${engineResponse.status}: ${engineResponse.statusText}`,
            });
            return;
          }

          // Copy content type from engine response
          const contentType =
            engineResponse.headers.get('content-type') || 'video/mp2t';

          res.set({
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
          });

          // Stream the content
          const buffer = await engineResponse.arrayBuffer();
          res.send(Buffer.from(buffer));
        } catch (fetchError) {
          res.status(500).json({
            success: false,
            error: `Failed to fetch from engine: ${
              fetchError instanceof Error ? fetchError.message : 'Unknown error'
            }`,
          });
        }
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
