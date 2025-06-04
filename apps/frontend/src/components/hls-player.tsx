import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

type HlsPlayerProps = {
  src: string;
  className?: string;
  poster?: string;
};

export const HlsPlayer = ({ src, className, poster }: HlsPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      // Use hls.js for browsers that support MSE
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        startLevel: -1, // Auto quality selection
        capLevelToPlayerSize: true,
        debug: false,
      });

      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed, starting playback');
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', event, data);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Fatal network error encountered, trying to recover');
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
      controls
      poster={poster}
      playsInline
      muted={false}
      autoPlay={false}
    >
      Your browser does not support the video tag or HLS streaming.
    </video>
  );
};
