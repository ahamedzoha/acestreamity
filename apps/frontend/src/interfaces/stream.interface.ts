export type StreamStats = {
  peers: number;
  downloadSpeed: string;
  status: string;
};

export type StreamSession = {
  id: string;
  hlsUrl: string;
  aceId: string;
  createdAt: string;
  status: 'starting' | 'active' | 'stopping' | 'stopped' | 'error';
};

export type StreamApiResponse = {
  success: boolean;
  session?: StreamSession;
  stats?: StreamStats;
  error?: string;
  message?: string;
};

export type EngineStatus = 'checking' | 'online' | 'offline' | 'error';

export type StreamState = {
  aceStreamId: string;
  isStreaming: boolean;
  streamUrl: string;
  sessionId: string;
  error: string;
  stats: StreamStats;
  engineStatus: EngineStatus;
  isVideoLoading: boolean;
};
