import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import Hls from 'hls.js';

type HlsPlayerProps = {
  src: string;
  className?: string;
  poster?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onVolumeChange?: (volume: number, muted: boolean) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
};

export type HlsPlayerRef = {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  requestFullscreen: () => void;
  exitFullscreen: () => void;
  isPlaying: () => boolean;
  isMuted: () => boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  getVolume: () => number;
};

export const HlsPlayer = forwardRef<HlsPlayerRef, HlsPlayerProps>(
  (
    { src, className, poster, onTimeUpdate, onVolumeChange, onPlayStateChange },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useImperativeHandle(ref, () => ({
      play: () => {
        if (videoRef.current) {
          videoRef.current.play();
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

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      // Cleanup previous HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        // Use hls.js for browsers that support MSE with balanced fast-start config
        const hls = new Hls({
          // Core settings
          enableWorker: true,
          lowLatencyMode: false, // Disable for stability

          // Balanced buffering for fast start but stable playback
          maxBufferLength: 10, // 10 seconds buffer (was 30, compromise)
          maxMaxBufferLength: 60, // Reasonable max buffer
          backBufferLength: 30, // Keep some back buffer

          // Fast start optimizations
          maxBufferHole: 0.5, // Fill gaps reasonably fast

          // Quality selection
          startLevel: -1, // Auto quality selection
          capLevelToPlayerSize: true,

          // Live stream optimizations (more conservative)
          liveSyncDurationCount: 3, // Stay reasonably close to live
          liveMaxLatencyDurationCount: 10, // Allow more buffer for stability

          // Network settings
          manifestLoadingTimeOut: 10000,
          manifestLoadingMaxRetry: 4,
          levelLoadingTimeOut: 10000,
          fragLoadingTimeOut: 20000,

          debug: false,
        });

        hlsRef.current = hls;

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest parsed, ready for playback');
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', event, data);

          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log(
                  'Fatal network error encountered, trying to recover'
                );
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Fatal media error encountered, trying to recover');
                hls.recoverMediaError();
                break;
              default:
                console.log('Fatal error, cannot recover');
                hls.destroy();
                break;
            }
          }
        });

        return () => {
          if (hls) {
            hls.destroy();
          }
        };
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = src;
      } else {
        console.error('HLS is not supported in this browser');
      }
    }, [src]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handlePlay = () => {
        setIsPlaying(true);
        onPlayStateChange?.(true);
      };

      const handlePause = () => {
        setIsPlaying(false);
        onPlayStateChange?.(false);
      };

      const handleTimeUpdate = () => {
        onTimeUpdate?.(video.currentTime, video.duration);
      };

      const handleVolumeChange = () => {
        onVolumeChange?.(video.volume, video.muted);
      };

      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('volumechange', handleVolumeChange);

      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('volumechange', handleVolumeChange);
      };
    }, [onTimeUpdate, onVolumeChange, onPlayStateChange]);

    useEffect(() => {
      return () => {
        // Cleanup on unmount
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }, []);

    return (
      <video
        ref={videoRef}
        className={className}
        controls={false} // Disable native controls
        playsInline
        muted={false}
        autoPlay={true}
        preload="auto" // Aggressively preload data
        crossOrigin="anonymous" // For CORS streams
      >
        Your browser does not support the video tag or HLS streaming.
      </video>
    );
  }
);

HlsPlayer.displayName = 'HlsPlayer';
