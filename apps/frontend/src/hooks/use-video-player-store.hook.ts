import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { VideoPlayerState } from '../interfaces';

type VideoPlayerActions = {
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  setIsBuffering: (buffering: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setQuality: (quality: string) => void;
  togglePlay: () => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  resetPlayer: () => void;
};

type VideoPlayerStore = VideoPlayerState & VideoPlayerActions;

const initialState: VideoPlayerState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  isFullscreen: false,
  isBuffering: false,
  playbackRate: 1,
  quality: 'auto',
};

export const useVideoPlayerStore = create<VideoPlayerStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

      setCurrentTime: (time: number) => set({ currentTime: time }),

      setDuration: (duration: number) => set({ duration }),

      setVolume: (volume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ volume: clampedVolume });
        // Don't auto-mute to prevent double state updates
      },

      setIsMuted: (muted: boolean) => set({ isMuted: muted }),

      setIsFullscreen: (fullscreen: boolean) =>
        set({ isFullscreen: fullscreen }),

      setIsBuffering: (buffering: boolean) => set({ isBuffering: buffering }),

      setPlaybackRate: (rate: number) => {
        const validRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
        const clampedRate = validRates.includes(rate) ? rate : 1;
        set({ playbackRate: clampedRate });
      },

      setQuality: (quality: string) => set({ quality }),

      togglePlay: () => {
        const { isPlaying } = get();
        set({ isPlaying: !isPlaying });
      },

      toggleMute: () => {
        const { isMuted } = get();
        set({ isMuted: !isMuted });
      },

      toggleFullscreen: () => {
        const { isFullscreen } = get();
        set({ isFullscreen: !isFullscreen });
      },

      resetPlayer: () => set(initialState),
    }),
    { name: 'video-player-store' }
  )
);
