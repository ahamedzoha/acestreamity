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
        // Use hls.js with VLC-like aggressive playback strategy
        const hls = new Hls({
          // Core settings
          enableWorker: true,
          lowLatencyMode: true, // Enable for faster start

          // VLC-like aggressive buffering - start ASAP
          maxBufferLength: 3, // Only 3 seconds buffer - like VLC
          maxMaxBufferLength: 15, // Small max buffer
          backBufferLength: 10, // Minimal back buffer

          // Immediate playback settings
          maxBufferHole: 0.2, // Fill tiny gaps quickly

          // Quality selection - start low, improve later
          startLevel: 0, // Start with lowest quality for speed
          capLevelToPlayerSize: true,

          // Live stream optimizations - very aggressive
          liveSyncDurationCount: 1, // Stay at live edge
          liveMaxLatencyDurationCount: 3, // Minimal latency

          // Aggressive network settings - like VLC
          manifestLoadingTimeOut: 5000, // Quick timeout
          manifestLoadingMaxRetry: 1, // Don't retry manifest much
          levelLoadingTimeOut: 3000, // Quick level loading
          fragLoadingTimeOut: 5000, // Quick fragment timeout

          // Fragment loading optimizations
          fragLoadingMaxRetry: 1, // Don't retry fragments much
          levelLoadingMaxRetry: 1, // Don't retry levels much

          // Immediate start settings
          startFragPrefetch: true, // Prefetch immediately
          testBandwidth: false, // Skip bandwidth test

          debug: false,
        });

        hlsRef.current = hls;

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          // VLC-like immediate playback attempt
          video.play().catch(console.error);
        });

        hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
          // Start playing as soon as first fragment loads (VLC behavior)
          if (data.frag.sn === 0 || data.frag.sn === 1) {
            if (video.paused) {
              video.play().catch(console.error);
            }
          }
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
