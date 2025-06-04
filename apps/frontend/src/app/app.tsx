import { useState, useEffect, useRef } from 'react';
import { Button, Card, CardBody, Input, Chip, Progress } from '@heroui/react';
import { HlsPlayer, HlsPlayerRef } from '../components/hls-player';
import { ChannelSidebar } from '../components/channel-sidebar';
import { VideoControls } from '../components/video-controls';

type StreamStats = {
  peers: number;
  downloadSpeed: string;
  status: string;
};

type Channel = {
  id: string;
  name: string;
  aceId: string;
  category: string;
  isLive?: boolean;
};

export function App() {
  const [aceStreamId, setAceStreamId] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState<StreamStats>({
    peers: 0,
    downloadSpeed: '0 KB/s',
    status: 'stopped',
  });
  const [engineStatus, setEngineStatus] = useState('checking');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  // Video player state
  const videoRef = useRef<HlsPlayerRef>(null);
  const [videoIsPlaying, setVideoIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  // Sample channels data - you can replace with your actual channel list
  const channels: Channel[] = [
    {
      id: '1',
      name: 'Premier Sports 1',
      aceId: 'acestream://75a56863b6fe0407ad4305b4d7ee5643c3923565',
      category: 'Sports',
      isLive: true,
    },
    {
      id: '2',
      name: 'Sky Sports Main Event',
      aceId: 'acestream://eab7aeef0218ce8b0752e596e4792b69eda4df5e',
      category: 'Sports',
      isLive: true,
    },
    {
      id: '2',
      name: 'Movie Channel',
      aceId: 'acestream://f3b48b16e4d8a4e3bb3f8b7d5c9a8b6e4d8a4e3b',
      category: 'Movies',
      isLive: true,
    },
    {
      id: '3',
      name: 'News Network',
      aceId: 'acestream://a7b9c8d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0',
      category: 'News',
      isLive: false,
    },
  ];

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    setAceStreamId(channel.aceId.replace('acestream://', ''));
  };

  const handleStartStream = async () => {
    if (!aceStreamId.trim()) {
      setError('Please select a channel or enter a valid Ace Stream ID');
      return;
    }

    // Clean aceStreamId (remove acestream:// prefix if present)
    const cleanId = aceStreamId.replace('acestream://', '');

    // Validate Ace Stream ID format (40 hex characters)
    if (cleanId.length !== 40 || !/^[a-f0-9]+$/i.test(cleanId)) {
      setError(
        'Invalid Ace Stream ID format. Must be 40 hexadecimal characters.'
      );
      return;
    }

    setIsStreaming(true);
    setError('');

    try {
      const response = await fetch(
        `http://localhost:3001/api/streams/start/${cleanId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start stream');
      }

      if (data.success) {
        setSessionId(data.session.id);
        setStreamUrl(data.session.hlsUrl);
        setIsVideoLoading(true);
        pollStreamStats(data.session.id);
      } else {
        throw new Error('Failed to create stream session');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to start stream. Please try again.'
      );
      setIsStreaming(false);
    }
  };

  const handleStopStream = async () => {
    if (sessionId) {
      try {
        await fetch(`http://localhost:3001/api/streams/stop/${sessionId}`, {
          method: 'POST',
        });
      } catch (err) {
        console.error('Failed to stop stream:', err);
      }
    }

    setIsStreaming(false);
    setStreamUrl('');
    setSessionId('');
    setError('');
    setStats({ peers: 0, downloadSpeed: '0 KB/s', status: 'stopped' });
    setSelectedChannel(null);
    setIsVideoLoading(false);
  };

  const pollStreamStats = async (currentSessionId: string) => {
    if (!currentSessionId || !isStreaming) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/streams/status/${currentSessionId}`
      );
      const data = await response.json();

      if (data.success && data.stats) {
        const speedMBps = (data.stats.speed_down / 1024).toFixed(1);
        setStats({
          peers: data.stats.peers || 0,
          downloadSpeed: `${speedMBps} MB/s`,
          status: data.stats.status || 'unknown',
        });
      }
    } catch (err) {
      console.error('Failed to fetch stream stats:', err);
    }

    setTimeout(() => {
      if (isStreaming && sessionId === currentSessionId) {
        pollStreamStats(currentSessionId);
      }
    }, 5000);
  };

  // Check backend health on component mount
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        const data = await response.json();

        if (!response.ok) {
          setError(
            'Backend API is not responding. Please ensure the server is running.'
          );
          setEngineStatus('offline');
        } else {
          if (data.services?.aceStream?.status === 'healthy') {
            setEngineStatus('online');
          } else {
            setEngineStatus('error');
            setError(
              `Ace Stream engine error: ${
                data.services?.aceStream?.error || 'Unknown error'
              }`
            );
          }
        }
      } catch (err) {
        setError(
          'Cannot connect to backend API. Please ensure the server is running on port 3001.'
        );
        setEngineStatus('offline');
      }
    };

    checkBackendHealth();
  }, []);

  // Video control handlers
  const handleVideoTimeUpdate = (time: number, dur: number) => {
    setCurrentTime(time);
    setDuration(dur);
    // Hide loading overlay once we have duration (video has loaded)
    if (dur > 0 && isVideoLoading) {
      setIsVideoLoading(false);
    }
  };

  const handleVideoVolumeChange = (vol: number, muted: boolean) => {
    setVolume(vol);
    setIsMuted(muted);
  };

  const handleVideoPlayStateChange = (playing: boolean) => {
    setVideoIsPlaying(playing);
  };

  const handlePlay = () => videoRef.current?.play();
  const handlePause = () => videoRef.current?.pause();
  const handleSeek = (time: number) => videoRef.current?.seek(time);
  const handleVolumeChange = (newVolume: number) => {
    videoRef.current?.setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      videoRef.current?.toggleMute();
    }
  };
  const handleToggleMute = () => videoRef.current?.toggleMute();
  const handleToggleFullscreen = () => {
    if (isFullscreen) {
      videoRef.current?.exitFullscreen();
      setIsFullscreen(false);
    } else {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // TV Remote / Keyboard shortcuts
      switch (event.key) {
        case 'Enter':
        case ' ': // Space bar
          event.preventDefault();
          if (streamUrl) {
            // If video is playing, toggle play/pause
            if (videoIsPlaying) {
              handlePause();
            } else {
              handlePlay();
            }
          } else if (!isStreaming && aceStreamId) {
            handleStartStream();
          } else if (isStreaming) {
            handleStopStream();
          }
          break;
        case 'Escape':
          if (isFullscreen) {
            handleToggleFullscreen();
          } else if (isStreaming) {
            handleStopStream();
          }
          break;
        case 'f':
        case 'F':
          if (streamUrl) {
            handleToggleFullscreen();
          }
          break;
        case 'm':
        case 'M':
          if (streamUrl) {
            handleToggleMute();
          }
          break;
        case 'ArrowLeft':
          if (streamUrl && event.shiftKey) {
            event.preventDefault();
            handleSeek(Math.max(0, currentTime - 10));
          }
          break;
        case 'ArrowRight':
          if (streamUrl && event.shiftKey) {
            event.preventDefault();
            handleSeek(Math.min(duration, currentTime + 10));
          }
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          // Channel navigation will be handled in ChannelSidebar
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isStreaming,
    aceStreamId,
    streamUrl,
    videoIsPlaying,
    currentTime,
    duration,
    isFullscreen,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Acestreamity
                </h1>
                <p className="text-sm text-gray-400">
                  Universal P2P Streaming Platform
                </p>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center space-x-4">
              <Chip
                color={
                  engineStatus === 'online'
                    ? 'success'
                    : engineStatus === 'error'
                    ? 'danger'
                    : 'warning'
                }
                variant="flat"
                size="sm"
              >
                Engine{' '}
                {engineStatus === 'online'
                  ? 'Online'
                  : engineStatus === 'error'
                  ? 'Error'
                  : 'Checking'}
              </Chip>
              {isStreaming && (
                <Chip color="primary" variant="flat" size="sm">
                  🔴 Live • {stats.peers} peers
                </Chip>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Channel Sidebar - 1/4 width */}
        <div className="w-1/4 bg-black/20 backdrop-blur-sm border-r border-white/10">
          <ChannelSidebar
            channels={channels}
            selectedChannel={selectedChannel}
            onChannelSelect={handleChannelSelect}
            onCustomId={(id: string) => setAceStreamId(id)}
          />
        </div>

        {/* Main Player Area - 3/4 width */}
        <div className="w-3/4 flex flex-col">
          {/* Player Container */}
          <div className="flex-1 p-6">
            <Card className="h-full bg-black/40 backdrop-blur-sm border-white/10">
              <CardBody className="p-0 h-full">
                {!streamUrl ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center space-y-6">
                      <div className="w-24 h-24 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto">
                        <svg
                          className="w-12 h-12 text-white/60"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold text-white mb-2">
                          Welcome to Acestreamity
                        </h3>
                        <p className="text-gray-400 mb-6">
                          Select a channel from the sidebar or enter a custom
                          Ace Stream ID to begin streaming
                        </p>

                        {/* Quick Start Controls */}
                        <div className="space-y-4 max-w-md mx-auto">
                          <Input
                            label="Custom Ace Stream ID"
                            placeholder="Enter 40-character ID"
                            value={aceStreamId}
                            onChange={(e) => setAceStreamId(e.target.value)}
                            variant="bordered"
                            className="text-white"
                            classNames={{
                              input: 'text-white placeholder:text-gray-400',
                              inputWrapper:
                                'bg-white/10 border-white/20 hover:border-white/30 focus-within:border-purple-500',
                            }}
                          />

                          <Button
                            color="primary"
                            size="lg"
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 font-semibold"
                            onPress={handleStartStream}
                            isLoading={isStreaming}
                            isDisabled={!aceStreamId.trim()}
                          >
                            {isStreaming
                              ? 'Starting Stream...'
                              : 'Start Stream'}
                          </Button>
                        </div>

                        {error && (
                          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                            <p className="text-red-300 text-sm">{error}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full relative">
                    {/* Video Player */}
                    <div className="relative w-full h-full rounded-lg overflow-hidden">
                      <HlsPlayer
                        ref={videoRef}
                        src={streamUrl}
                        className="w-full h-full object-cover"
                        onTimeUpdate={handleVideoTimeUpdate}
                        onVolumeChange={handleVideoVolumeChange}
                        onPlayStateChange={handleVideoPlayStateChange}
                      />

                      {/* Loading Overlay */}
                      {isVideoLoading && (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                          <div className="text-center space-y-6">
                            {/* Animated Loading Icon */}
                            <div className="relative">
                              <div className="w-16 h-16 border-4 border-purple-500/20 rounded-full"></div>
                              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
                            </div>

                            {/* Loading Text */}
                            <div className="space-y-2">
                              <h3 className="text-white text-lg font-semibold">
                                Connecting to Stream
                              </h3>
                              <p className="text-gray-300 text-sm">
                                Waiting for m3u8 response...
                              </p>
                              <div className="flex items-center justify-center space-x-1">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                <div
                                  className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                                  style={{ animationDelay: '0.2s' }}
                                ></div>
                                <div
                                  className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                                  style={{ animationDelay: '0.4s' }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Video Overlay Controls */}
                    <div className="absolute top-4 right-4 space-y-2">
                      <Button
                        color="danger"
                        variant="flat"
                        size="sm"
                        onPress={handleStopStream}
                        className="bg-black/60 backdrop-blur-sm"
                      >
                        Stop Stream
                      </Button>
                    </div>

                    {/* Stream Info Overlay */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <Card className="bg-black/60 backdrop-blur-sm border-white/10">
                        <CardBody className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-white font-semibold">
                                {selectedChannel?.name || 'Custom Stream'}
                              </h4>
                              <p className="text-gray-300 text-sm">
                                {selectedChannel?.category || 'Ace Stream'} •{' '}
                                {stats.downloadSpeed}
                              </p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-center">
                                <p className="text-white font-bold">
                                  {stats.peers}
                                </p>
                                <p className="text-gray-400 text-xs">Peers</p>
                              </div>
                              <Progress
                                value={Math.min(stats.peers * 10, 100)}
                                className="w-20"
                                color="success"
                                size="sm"
                              />
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Bottom Controls */}
          <div className="p-6 pt-0">
            <Card className="bg-black/20 backdrop-blur-sm border-white/10">
              <CardBody className="p-4">
                {streamUrl ? (
                  /* Custom Video Controls */
                  <div className="flex items-center justify-between">
                    <VideoControls
                      isPlaying={videoIsPlaying}
                      currentTime={currentTime}
                      duration={duration}
                      volume={volume}
                      isMuted={isMuted}
                      onPlay={handlePlay}
                      onPause={handlePause}
                      onSeek={handleSeek}
                      onVolumeChange={handleVolumeChange}
                      onToggleMute={handleToggleMute}
                      onToggleFullscreen={handleToggleFullscreen}
                    />

                    <div className="flex items-center space-x-4 ml-4">
                      <Button
                        variant="flat"
                        color="danger"
                        size="sm"
                        onPress={handleStopStream}
                        className="bg-red-500/20 hover:bg-red-500/30"
                      >
                        ⏹ Stop Stream
                      </Button>

                      <Button
                        variant="bordered"
                        size="sm"
                        onPress={() => navigator.clipboard.writeText(streamUrl)}
                        className="border-white/20 text-white hover:border-white/40"
                      >
                        📋 Copy URL
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Stream Start Controls */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="solid"
                        color="primary"
                        onPress={handleStartStream}
                        isDisabled={!aceStreamId.trim()}
                        isLoading={isStreaming}
                        className="bg-gradient-to-r from-purple-500 to-pink-500"
                      >
                        {isStreaming ? 'Starting...' : '▶ Start Stream'}
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="text-white text-sm font-medium">
                        Press{' '}
                        <kbd className="px-2 py-1 bg-white/10 rounded text-xs">
                          ENTER
                        </kbd>{' '}
                        to start
                      </p>
                      <p className="text-gray-400 text-xs">
                        <kbd className="px-1 bg-white/10 rounded">F</kbd>{' '}
                        fullscreen •
                        <kbd className="px-1 bg-white/10 rounded ml-1">M</kbd>{' '}
                        mute •
                        <kbd className="px-1 bg-white/10 rounded ml-1">
                          Shift+←→
                        </kbd>{' '}
                        seek •
                        <kbd className="px-1 bg-white/10 rounded ml-1">↑↓</kbd>{' '}
                        channels
                      </p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
