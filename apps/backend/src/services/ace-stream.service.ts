type AceStreamConfig = {
  host: string;
  port: number;
};

type StreamSession = {
  id: string;
  aceId: string;
  playbackUrl: string;
  statUrl: string;
  commandUrl: string;
  eventUrl?: string;
  status: 'starting' | 'streaming' | 'error' | 'stopped';
  startedAt: Date;
};

type StreamStats = {
  status: 'prebuf' | 'dl';
  peers: number;
  speed_down: number;
  speed_up: number;
  downloaded: number;
  uploaded: number;
  total_progress: number;
};

export type AceStreamService = {
  checkEngine: () => Promise<{ version: string; code: number }>;
  startStream: (
    aceId: string,
    options?: { useApiEvents?: boolean }
  ) => Promise<StreamSession>;
  stopStream: (sessionId: string) => Promise<void>;
  getStreamStats: (sessionId: string) => Promise<StreamStats>;
  getActiveSessions: () => Map<string, StreamSession>;
};

const activeSessions = new Map<string, StreamSession>();

export function createAceStreamService(
  config: AceStreamConfig
): AceStreamService {
  const baseUrl = `http://${config.host}:${config.port}`;

  const makeRequest = async (path: string): Promise<any> => {
    try {
      const response = await fetch(`${baseUrl}${path}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(
        `Ace Stream engine request failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  };

  const checkEngine = async (): Promise<{ version: string; code: number }> => {
    const response = await makeRequest('/webui/api/service?method=get_version');
    if (response.error) {
      throw new Error(`Engine error: ${response.error}`);
    }
    return response.result;
  };

  const startStream = async (
    aceId: string,
    options: { useApiEvents?: boolean } = {}
  ): Promise<StreamSession> => {
    // Validate Ace Stream ID (should be 40 characters)
    if (!aceId || aceId.length !== 40 || !/^[a-f0-9]+$/i.test(aceId)) {
      throw new Error('Invalid Ace Stream ID format');
    }

    const sessionId = generateSessionId();
    const params = new URLSearchParams({
      id: aceId,
      format: 'json',
      ...(options.useApiEvents && { use_api_events: '1' }),
    });

    try {
      const response = await makeRequest(`/ace/manifest.m3u8?${params}`);

      if (response.error) {
        throw new Error(`Stream start failed: ${response.error}`);
      }

      const session: StreamSession = {
        id: sessionId,
        aceId,
        playbackUrl:
          response.response.playback_url ||
          `${baseUrl}/ace/manifest.m3u8?${params}`,
        statUrl: response.response.stat_url,
        commandUrl: response.response.command_url,
        eventUrl: response.response.event_url,
        status: 'starting',
        startedAt: new Date(),
      };

      activeSessions.set(sessionId, session);

      // Update session status after a delay (simulate startup)
      setTimeout(async () => {
        try {
          const stats = await getStreamStats(sessionId);
          if (stats && session.status === 'starting') {
            session.status = stats.status === 'dl' ? 'streaming' : 'starting';
            activeSessions.set(sessionId, session);
          }
        } catch (error) {
          session.status = 'error';
          activeSessions.set(sessionId, session);
        }
      }, 3000);

      return session;
    } catch (error) {
      throw new Error(
        `Failed to start stream: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  };

  const stopStream = async (sessionId: string): Promise<void> => {
    const session = activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Stream session not found');
    }

    try {
      if (session.commandUrl) {
        await makeRequest(
          `${session.commandUrl.replace(baseUrl, '')}?method=stop`
        );
      }
    } catch (error) {
      console.warn(`Failed to stop stream gracefully: ${error}`);
    }

    session.status = 'stopped';
    activeSessions.delete(sessionId);
  };

  const getStreamStats = async (sessionId: string): Promise<StreamStats> => {
    const session = activeSessions.get(sessionId);
    if (!session || !session.statUrl) {
      throw new Error('Stream session not found or no stats available');
    }

    try {
      const response = await makeRequest(session.statUrl.replace(baseUrl, ''));
      if (response.error) {
        throw new Error(`Stats error: ${response.error}`);
      }
      return response.response;
    } catch (error) {
      throw new Error(
        `Failed to get stream stats: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  };

  const getActiveSessions = (): Map<string, StreamSession> => {
    return new Map(activeSessions);
  };

  return {
    checkEngine,
    startStream,
    stopStream,
    getStreamStats,
    getActiveSessions,
  };
}

function generateSessionId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
