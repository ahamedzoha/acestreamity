import { useCallback, useRef, useEffect } from 'react';
import { useVideoPlayerStore } from './use-video-player-store.hook';
import { HlsPlayerRef } from '../interfaces';

export const useVideoControls = (
  videoRef: React.RefObject<HlsPlayerRef | null>
) => {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    setIsMuted,
  } = useVideoPlayerStore();

  // Listen for fullscreen changes to update state
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      // Update fullscreen state in store if it changed
      if (isCurrentlyFullscreen !== isFullscreen) {
        // The state should be managed by the store, but we can't call setters here
        // This will be handled by the video controls UI
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange
      );
      document.removeEventListener(
        'msfullscreenchange',
        handleFullscreenChange
      );
    };
  }, [isFullscreen]);

  const handlePlay = useCallback(() => {
    videoRef.current?.play();
    setIsPlaying(true);
  }, [videoRef]); // Remove Zustand actions from dependencies

  const handlePause = useCallback(() => {
    videoRef.current?.pause();
    setIsPlaying(false);
  }, [videoRef]); // Remove Zustand actions from dependencies

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  }, [isPlaying, handlePlay, handlePause]);

  const handleSeek = useCallback(
    (time: number) => {
      videoRef.current?.seek(time);
      setCurrentTime(time);
    },
    [] // Remove all dependencies to prevent infinite loops
  );

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      videoRef.current?.setVolume(clampedVolume);
      setVolume(clampedVolume);
    },
    [] // Remove all dependencies to prevent infinite loops
  );

  const handleToggleMute = useCallback(() => {
    videoRef.current?.toggleMute();
    setIsMuted(!isMuted);
  }, [isMuted]); // Only keep essential state dependency

  const handleToggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      videoRef.current?.exitFullscreen();
    } else {
      videoRef.current?.requestFullscreen();
    }
  }, [videoRef, isFullscreen]); // Use video-level fullscreen like the original

  const handleVideoTimeUpdate = useCallback(
    (time: number, dur: number) => {
      setCurrentTime(time);
      if (dur !== duration) {
        setDuration(dur);
      }
    },
    [] // Remove duration dependency to prevent infinite loops from timeupdate events
  );

  const handleVideoVolumeChange = useCallback(
    (vol: number, muted: boolean) => {
      setVolume(vol);
      setIsMuted(muted);
    },
    [] // Remove Zustand actions from dependencies
  );

  const handleVideoPlayStateChange = useCallback(
    (playing: boolean) => {
      setIsPlaying(playing);
    },
    [] // Remove Zustand actions from dependencies
  );

  // Format time for display
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return {
    // State
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    progressPercentage,

    // Actions
    handlePlay,
    handlePause,
    handleTogglePlay,
    handleSeek,
    handleVolumeChange,
    handleToggleMute,
    handleToggleFullscreen,
    handleVideoTimeUpdate,
    handleVideoVolumeChange,
    handleVideoPlayStateChange,

    // Utilities
    formatTime,
  };
};
