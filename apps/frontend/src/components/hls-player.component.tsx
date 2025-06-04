import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import Hls from 'hls.js';
import { HlsPlayerRef } from '../interfaces';

type HlsPlayerProps = {
  src: string;
  className?: string;
  poster?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onVolumeChange?: (volume: number, muted: boolean) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onError?: (error: string) => void;
};

export const HlsPlayer = forwardRef<HlsPlayerRef, HlsPlayerProps>(
  (
    {
      src,
      className,
      poster,
      onTimeUpdate,
      onVolumeChange,
      onPlayStateChange,
      onLoadStart,
      onCanPlay,
      onError,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useImperativeHandle(ref, () => ({
      play: () => {
        if (videoRef.current) {
          videoRef.current.play().catch(console.error);
        }
      },
      pause: () => {
        if (videoRef.current) {
          videoRef.current.pause();
        }
      },
      seek: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      },
      setVolume: (volume: number) => {
        if (videoRef.current) {
          videoRef.current.volume = Math.max(0, Math.min(1, volume));
          onVolumeChange?.(videoRef.current.volume, videoRef.current.muted);
        }
      },
      toggleMute: () => {
        if (videoRef.current) {
          videoRef.current.muted = !videoRef.current.muted;
          onVolumeChange?.(videoRef.current.volume, videoRef.current.muted);
        }
      },
      requestFullscreen: () => {
        if (videoRef.current && videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        }
      },
      exitFullscreen: () => {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      },
      isPlaying: () => isPlaying,
      isMuted: () => videoRef.current?.muted || false,
      getCurrentTime: () => videoRef.current?.currentTime || 0,
      getDuration: () => videoRef.current?.duration || 0,
      getVolume: () => videoRef.current?.volume || 1,
    }));

    // HLS configuration for optimal streaming
    const hlsConfig = {
      enableWorker: true,
      lowLatencyMode: true,
      maxBufferLength: 3,
      maxMaxBufferLength: 15,
      backBufferLength: 10,
      maxBufferHole: 0.2,
      startLevel: 0,
      capLevelToPlayerSize: true,
      liveSyncDurationCount: 1,
      liveMaxLatencyDurationCount: 3,
      manifestLoadingTimeOut: 5000,
      manifestLoadingMaxRetry: 1,
      levelLoadingTimeOut: 3000,
      fragLoadingTimeOut: 5000,
      fragLoadingMaxRetry: 1,
      levelLoadingMaxRetry: 1,
      startFragPrefetch: true,
      testBandwidth: false,
      debug: false,
    };

    // Setup HLS
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !src) return;

      onLoadStartRef.current?.();

      // Cleanup previous instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        const hls = new Hls(hlsConfig);
        hlsRef.current = hls;

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(console.error);
        });

        hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
          if ((data.frag.sn === 0 || data.frag.sn === 1) && video.paused) {
            video.play().catch(console.error);
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', event, data);

          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Fatal network error, trying to recover');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Fatal media error, trying to recover');
                hls.recoverMediaError();
                break;
              default:
                console.log('Fatal error, cannot recover');
                onErrorRef.current?.('Playback failed. Please try again.');
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = src;
      } else {
        onErrorRef.current?.('HLS is not supported in this browser');
      }

      // Cleanup function for useEffect
      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }, [src]); // Remove onLoadStart and onError from dependencies to prevent infinite loops

    // Store all callbacks in refs to avoid dependency issues
    const onTimeUpdateRef = useRef(onTimeUpdate);
    const onVolumeChangeRef = useRef(onVolumeChange);
    const onPlayStateChangeRef = useRef(onPlayStateChange);
    const onCanPlayRef = useRef(onCanPlay);
    const onErrorRef = useRef(onError);
    const onLoadStartRef = useRef(onLoadStart);

    // Update refs when callbacks change
    useEffect(() => {
      onTimeUpdateRef.current = onTimeUpdate;
      onVolumeChangeRef.current = onVolumeChange;
      onPlayStateChangeRef.current = onPlayStateChange;
      onCanPlayRef.current = onCanPlay;
      onErrorRef.current = onError;
      onLoadStartRef.current = onLoadStart;
    }, [
      onTimeUpdate,
      onVolumeChange,
      onPlayStateChange,
      onCanPlay,
      onError,
      onLoadStart,
    ]);

    // Event listeners - only setup once to prevent infinite loops
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handlePlay = () => {
        setIsPlaying(true);
        onPlayStateChangeRef.current?.(true);
      };

      const handlePause = () => {
        setIsPlaying(false);
        onPlayStateChangeRef.current?.(false);
      };

      const handleTimeUpdate = () => {
        onTimeUpdateRef.current?.(video.currentTime, video.duration);
      };

      const handleVolumeChange = () => {
        onVolumeChangeRef.current?.(video.volume, video.muted);
      };

      const handleCanPlay = () => {
        onCanPlayRef.current?.();
      };

      const handleError = () => {
        onErrorRef.current?.('Video playback error occurred');
      };

      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('volumechange', handleVolumeChange);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('volumechange', handleVolumeChange);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
      };
    }, []); // No dependencies - setup once only

    return (
      <video
        ref={videoRef}
        className={className}
        poster={poster}
        controls={false}
        playsInline
        muted={false}
        style={{ width: '100%', height: '100%' }}
      />
    );
  }
);
