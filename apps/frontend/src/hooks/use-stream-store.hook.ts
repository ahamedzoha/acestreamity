import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { StreamState, StreamStats, EngineStatus } from '../interfaces';

type StreamActions = {
  setAceStreamId: (id: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  setStreamUrl: (url: string) => void;
  setSessionId: (id: string) => void;
  setError: (error: string) => void;
  clearError: () => void;
  setStats: (stats: StreamStats) => void;
  setEngineStatus: (status: EngineStatus) => void;
  setIsVideoLoading: (loading: boolean) => void;
  resetStream: () => void;
};

type StreamStore = StreamState & StreamActions;

const initialState: StreamState = {
  aceStreamId: '',
  isStreaming: false,
  streamUrl: '',
  sessionId: '',
  error: '',
  stats: {
    peers: 0,
    downloadSpeed: '0 KB/s',
    status: 'connecting',
  },
  engineStatus: 'checking',
  isVideoLoading: false,
};

export const useStreamStore = create<StreamStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setAceStreamId: (id: string) => set({ aceStreamId: id }),

      setIsStreaming: (streaming: boolean) => set({ isStreaming: streaming }),

      setStreamUrl: (url: string) => set({ streamUrl: url }),

      setSessionId: (id: string) => set({ sessionId: id }),

      setError: (error: string) => set({ error }),

      clearError: () => set({ error: '' }),

      setStats: (stats: StreamStats) => set({ stats }),

      setEngineStatus: (status: EngineStatus) => set({ engineStatus: status }),

      setIsVideoLoading: (loading: boolean) => set({ isVideoLoading: loading }),

      resetStream: () =>
        set((state) => ({
          aceStreamId: '',
          isStreaming: false,
          streamUrl: '',
          sessionId: '',
          error: '',
          isVideoLoading: false,
          // Keep current engineStatus and stats - don't reset them
          engineStatus: state.engineStatus,
          stats: { ...state.stats, status: 'stopped' },
        })),
    }),
    { name: 'stream-store' }
  )
);
