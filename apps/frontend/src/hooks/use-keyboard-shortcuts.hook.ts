import { useEffect, useCallback } from 'react';
import { KeyboardShortcut } from '../interfaces';

type UseKeyboardShortcutsOptions = {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
};

export const useKeyboardShortcuts = ({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when user is typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatches =
          event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
        const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
        const altMatches = !!shortcut.altKey === event.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts,
    enabled,
  };
};

// Common keyboard shortcuts for the streaming app
export const useStreamingKeyboardShortcuts = (
  isStreaming: boolean,
  streamUrl: string,
  onPlayPause: () => void,
  onSeek: (delta: number) => void,
  onVolumeChange: (delta: number) => void,
  onToggleMute: () => void,
  onToggleFullscreen: () => void,
  getCurrentTime: () => number,
  getDuration: () => number
) => {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: ' ',
      description: 'Play/Pause',
      action: () => {
        if (streamUrl) onPlayPause();
      },
    },
    {
      key: 'k',
      description: 'Play/Pause',
      action: () => {
        if (streamUrl) onPlayPause();
      },
    },
    {
      key: 'f',
      description: 'Toggle Fullscreen',
      action: () => {
        if (streamUrl) onToggleFullscreen();
      },
    },
    {
      key: 'm',
      description: 'Toggle Mute',
      action: () => {
        if (streamUrl) onToggleMute();
      },
    },
    {
      key: 'ArrowLeft',
      description: 'Seek Backward 10s',
      action: () => {
        if (streamUrl) {
          const newTime = Math.max(0, getCurrentTime() - 10);
          onSeek(newTime);
        }
      },
    },
    {
      key: 'ArrowRight',
      description: 'Seek Forward 10s',
      action: () => {
        if (streamUrl) {
          const newTime = Math.min(getDuration(), getCurrentTime() + 10);
          onSeek(newTime);
        }
      },
    },
    {
      key: 'ArrowLeft',
      shiftKey: true,
      description: 'Seek Backward 10s',
      action: () => {
        if (streamUrl) {
          const newTime = Math.max(0, getCurrentTime() - 10);
          onSeek(newTime);
        }
      },
    },
    {
      key: 'ArrowRight',
      shiftKey: true,
      description: 'Seek Forward 10s',
      action: () => {
        if (streamUrl) {
          const newTime = Math.min(getDuration(), getCurrentTime() + 10);
          onSeek(newTime);
        }
      },
    },
    {
      key: 'ArrowUp',
      description: 'Volume Up',
      action: () => {
        if (streamUrl) onVolumeChange(0.1);
      },
    },
    {
      key: 'ArrowDown',
      description: 'Volume Down',
      action: () => {
        if (streamUrl) onVolumeChange(-0.1);
      },
    },
  ];

  useKeyboardShortcuts({
    shortcuts,
    enabled: isStreaming,
  });

  return shortcuts;
};
