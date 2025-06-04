import { useCallback, useEffect, useRef } from 'react';
import { useStreamStore } from './use-stream-store.hook';
import { useChannelStore } from './use-channel-store.hook';
import { streamApi } from '../api';

export const useStreamManagement = () => {
  const {
    aceStreamId,
    isStreaming,
    streamUrl,
    sessionId,
    error,
    stats,
    engineStatus,
    isVideoLoading,
    setAceStreamId,
    setIsStreaming,
    setStreamUrl,
    setSessionId,
    setError,
    clearError,
    setStats,
    setEngineStatus,
    setIsVideoLoading,
    resetStream,
  } = useStreamStore();

  const { setSelectedChannel } = useChannelStore();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startStream = useCallback(
    async (aceId?: string) => {
      const streamId = aceId || aceStreamId;

      if (!streamId.trim()) {
        setError('Please select a channel or enter a valid Ace Stream ID');
        return;
      }

      setIsStreaming(true);
      clearError();

      try {
        const response = await streamApi.startStream(streamId);

        if (response.success && response.session) {
          setSessionId(response.session.id);
          setStreamUrl(response.session.hlsUrl);
          // Don't set isVideoLoading here - let HLS player handle it via onLoadStart
          startStatsPolling(response.session.id);
        } else {
          throw new Error('Failed to create stream session');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to start stream. Please try again.';
        setError(errorMessage);
        setIsStreaming(false);
      }
    },
    [aceStreamId] // Keep minimal dependencies
  );

  const stopStatsPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const stopStream = useCallback(async () => {
    if (sessionId) {
      try {
        await streamApi.stopStream(sessionId);
      } catch (err) {
        console.error('Failed to stop stream:', err);
      }
    }

    stopStatsPolling();
    resetStream();
    setSelectedChannel(null);
  }, [sessionId, stopStatsPolling]); // Keep essential dependencies only

  const startStatsPolling = useCallback(
    (currentSessionId: string) => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      const poll = async () => {
        // Remove isStreaming check - the polling should continue regardless
        if (!currentSessionId) return;

        try {
          const response = await streamApi.getStreamStatus(currentSessionId);

          if (response.success && response.stats) {
            // Handle different speed format possibilities
            let speedDisplay = '0 KB/s';
            if (response.stats.downloadSpeed) {
              const speed = Number(response.stats.downloadSpeed);
              if (speed > 1024) {
                speedDisplay = `${(speed / 1024).toFixed(1)} MB/s`;
              } else {
                speedDisplay = `${speed.toFixed(0)} KB/s`;
              }
            }

            setStats({
              peers: response.stats.peers || 0,
              downloadSpeed: speedDisplay,
              status: response.stats.status || 'downloading',
            });
          }
        } catch (err) {
          console.error('Failed to fetch stream stats:', err);
        }
      };

      pollIntervalRef.current = setInterval(poll, 5000);
      poll(); // Initial call
    },
    [] // Remove all dependencies to prevent stale closures
  );

  const checkBackendHealth = useCallback(async () => {
    try {
      const response = await streamApi.checkHealth();

      if (response.status !== 'healthy') {
        setError(
          'Backend API is not responding. Please ensure the server is running.'
        );
        setEngineStatus('offline');
      } else {
        if (response.services?.aceStream?.status === 'healthy') {
          setEngineStatus('online');
          clearError(); // Clear any previous errors
        } else {
          setEngineStatus('error');
          setError(
            'Ace Stream engine is not available. Please check the configuration.'
          );
        }
      }
    } catch (err) {
      setEngineStatus('offline');
      setError(
        'Unable to connect to backend. Please ensure the server is running.'
      );
    }
  }, []); // Remove Zustand actions from dependencies to prevent infinite loops

  // Check backend health on mount only - remove dependency to prevent infinite loop
  useEffect(() => {
    checkBackendHealth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStatsPolling();
    };
  }, [stopStatsPolling]);

  return {
    // State
    aceStreamId,
    isStreaming,
    streamUrl,
    sessionId,
    error,
    stats,
    engineStatus,
    isVideoLoading,

    // Actions
    setAceStreamId,
    setIsVideoLoading,
    startStream,
    stopStream,
    checkBackendHealth,
    clearError,
  };
};
