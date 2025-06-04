import { Router, Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../services/database.service';

export function createChannelsRoutes(databaseService: DatabaseService): Router {
  const router = Router();

  // Get all channels
  router.get(
    '/',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const channels = await databaseService.getChannels();
        res.json({
          success: true,
          channels,
          count: channels.length,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Get channel by ID
  router.get(
    '/:id',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          res.status(400).json({
            success: false,
            error: 'Invalid channel ID',
          });
          return;
        }

        const channel = await databaseService.getChannelById(id);
        if (!channel) {
          res.status(404).json({
            success: false,
            error: 'Channel not found',
          });
          return;
        }

        res.json({
          success: true,
          channel,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Create new channel
  router.post(
    '/',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const {
          name,
          ace_stream_id,
          description,
          category,
          language,
          quality,
        } = req.body;

        if (!name || !ace_stream_id) {
          res.status(400).json({
            success: false,
            error: 'Name and Ace Stream ID are required',
          });
          return;
        }

        // Validate Ace Stream ID format
        if (
          ace_stream_id.length !== 40 ||
          !/^[a-f0-9]+$/i.test(ace_stream_id)
        ) {
          res.status(400).json({
            success: false,
            error: 'Invalid Ace Stream ID format',
          });
          return;
        }

        const channel = await databaseService.createChannel({
          name,
          ace_stream_id,
          description,
          category,
          language,
          quality,
        });

        res.status(201).json({
          success: true,
          channel,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Update channel
  router.put(
    '/:id',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          res.status(400).json({
            success: false,
            error: 'Invalid channel ID',
          });
          return;
        }

        const {
          name,
          ace_stream_id,
          description,
          category,
          language,
          quality,
          is_active,
        } = req.body;

        // Validate Ace Stream ID format if provided
        if (
          ace_stream_id &&
          (ace_stream_id.length !== 40 || !/^[a-f0-9]+$/i.test(ace_stream_id))
        ) {
          res.status(400).json({
            success: false,
            error: 'Invalid Ace Stream ID format',
          });
          return;
        }

        const channel = await databaseService.updateChannel(id, {
          name,
          ace_stream_id,
          description,
          category,
          language,
          quality,
          is_active,
        });

        res.json({
          success: true,
          channel,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Delete channel
  router.delete(
    '/:id',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          res.status(400).json({
            success: false,
            error: 'Invalid channel ID',
          });
          return;
        }

        await databaseService.deleteChannel(id);

        res.json({
          success: true,
          message: 'Channel deleted successfully',
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Search channels by Ace Stream ID
  router.get(
    '/search/ace/:aceId',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { aceId } = req.params;

        if (aceId.length !== 40 || !/^[a-f0-9]+$/i.test(aceId)) {
          res.status(400).json({
            success: false,
            error: 'Invalid Ace Stream ID format',
          });
          return;
        }

        const channel = await databaseService.getChannelByAceId(aceId);

        res.json({
          success: true,
          channel,
          found: !!channel,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
