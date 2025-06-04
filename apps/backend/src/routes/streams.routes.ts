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

  // Proxy HLS manifest requests
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

        // Proxy the request to the actual Ace Stream HLS endpoint
        const response = await fetch(session.playbackUrl);

        if (!response.ok) {
          res.status(response.status).json({
            success: false,
            error: `Upstream error: ${response.statusText}`,
          });
          return;
        }

        // Set appropriate headers for HLS
        res.set({
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        });

        // Get the text content and send it
        const content = await response.text();
        res.send(content);
      } catch (error) {
        next(error);
      }
    }
  );

  // Proxy HLS segment requests
  router.get(
    '/hls/:sessionId/:segment',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { sessionId, segment } = req.params;
        const sessions = aceStreamService.getActiveSessions();
        const session = sessions.get(sessionId);

        if (!session) {
          res.status(404).json({
            success: false,
            error: 'Stream session not found',
          });
          return;
        }

        // Construct the segment URL
        const baseUrl = session.playbackUrl.replace('/manifest.m3u8', '');
        const segmentUrl = `${baseUrl}/${segment}`;

        // Proxy the request to the actual Ace Stream segment
        const response = await fetch(segmentUrl);

        if (!response.ok) {
          res.status(response.status).json({
            success: false,
            error: `Upstream error: ${response.statusText}`,
          });
          return;
        }

        // Set appropriate headers for video segments
        res.set({
          'Content-Type': 'video/mp2t',
          'Cache-Control': 'public, max-age=31536000',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        });

        // Get the buffer content and send it
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
