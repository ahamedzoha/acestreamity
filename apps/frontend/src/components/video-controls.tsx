import {
  Button,
  Slider,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@heroui/react';

type VideoControlsProps = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
};

export const VideoControls = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
}: VideoControlsProps) => {
  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!duration || duration === 0) return 0;
    return (currentTime / duration) * 100;
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Play/Pause Button */}
      <Button
        isIconOnly
        variant="flat"
        className="bg-white/10 hover:bg-white/20 text-white"
        onPress={isPlaying ? onPause : onPlay}
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </Button>

      {/* Time Display */}
      <div className="text-white text-sm font-mono min-w-0">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

      {/* Progress Bar */}
      <div className="flex-1">
        <Slider
          size="sm"
          step={1}
          maxValue={duration || 100}
          value={currentTime}
          onChange={(value) => onSeek(Array.isArray(value) ? value[0] : value)}
          className="w-full"
          classNames={{
            base: 'max-w-none',
            track: 'bg-white/20',
            filler: 'bg-gradient-to-r from-purple-500 to-pink-500',
            thumb: 'bg-white border-2 border-purple-500 shadow-lg',
          }}
          aria-label="Video progress"
        />
      </div>

      {/* Volume Controls */}
      <Popover
        placement="top"
        showArrow
        offset={10}
        classNames={{
          content:
            'bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-3',
        }}
      >
        <PopoverTrigger>
          <Button
            isIconOnly
            variant="flat"
            className="bg-white/10 hover:bg-white/20 text-white"
            onPress={onToggleMute}
          >
            {isMuted || volume === 0 ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.76L4.99 13H3a1 1 0 01-1-1V8a1 1 0 011-1h1.99l3.393-3.76a1 1 0 011.617.76zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            ) : volume > 0.5 ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.76L4.99 13H3a1 1 0 01-1-1V8a1 1 0 011-1h1.99l3.393-3.76a1 1 0 011.617.76zM12 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm4-1a1 1 0 011 1v4a1 1 0 11-2 0V8a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.76L4.99 13H3a1 1 0 01-1-1V8a1 1 0 011-1h1.99l3.393-3.76a1 1 0 011.617.76zM12 8a1 1 0 012 0v4a1 1 0 11-2 0V8z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex flex-col items-center min-w-[120px]">
            <Slider
              size="sm"
              step={0.01}
              maxValue={1}
              value={isMuted ? 0 : volume}
              onChange={(value) =>
                onVolumeChange(Array.isArray(value) ? value[0] : value)
              }
              orientation="vertical"
              className="h-20"
              classNames={{
                track: 'bg-white/20',
                filler: 'bg-gradient-to-t from-purple-500 to-pink-500',
                thumb: 'bg-white border-2 border-purple-500 shadow-lg',
              }}
              aria-label="Volume"
            />
            <div className="text-white text-xs text-center mt-2">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Fullscreen Button */}
      <Button
        isIconOnly
        variant="flat"
        className="bg-white/10 hover:bg-white/20 text-white"
        onPress={onToggleFullscreen}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
      </Button>
    </div>
  );
};
