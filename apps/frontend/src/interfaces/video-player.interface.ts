export type VideoPlayerState = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isBuffering: boolean;
  playbackRate: number;
  quality: string;
};

export type VideoPlayerActions = {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  setPlaybackRate: (rate: number) => void;
  setQuality: (quality: string) => void;
};

export type HlsPlayerRef = {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  requestFullscreen: () => void;
  exitFullscreen: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getVolume: () => number;
  isMuted: () => boolean;
  isPlaying: () => boolean;
};

export type VideoControlsProps = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
};
