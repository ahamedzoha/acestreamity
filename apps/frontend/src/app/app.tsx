import { useRef } from 'react';
import { Button, Card, CardBody, Input, Chip, Progress } from '@heroui/react';
import {
  useStreamManagement,
  useVideoControls,
  useChannelStore,
  useStreamingKeyboardShortcuts,
} from '../hooks';
import {
  HlsPlayer,
  LoadingOverlay,
  VideoControls,
  ChannelSidebar,
} from '../components';
import { HlsPlayerRef } from '../interfaces';

export const App = () => {
  const videoRef = useRef<HlsPlayerRef>(null);

  // Custom hooks for state management
  const {
    aceStreamId,
    isStreaming,
    streamUrl,
    error,
    stats,
    engineStatus,
    isVideoLoading,
    setAceStreamId,
    setIsVideoLoading,
    startStream,
    stopStream,
    clearError,
  } = useStreamManagement();

  const { selectedChannel, setSelectedChannel } = useChannelStore();

  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
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
  } = useVideoControls(videoRef);

  // Keyboard shortcuts
  useStreamingKeyboardShortcuts(
    isStreaming,
    streamUrl,
    handleTogglePlay,
    (time: number) => handleSeek(time),
    (delta: number) => handleVolumeChange(volume + delta),
    handleToggleMute,
    handleToggleFullscreen,
    () => videoRef.current?.getCurrentTime() || 0,
    () => videoRef.current?.getDuration() || 0
  );

  const handleChannelSelect = (channel: typeof selectedChannel) => {
    if (!channel) return;
    setSelectedChannel(channel);
    setAceStreamId(channel.aceId.replace('acestream://', ''));
  };

  const handleStartStream = async () => {
    await startStream();
  };

  const handleStopStream = async () => {
    await stopStream();
  };

  const handleVideoLoadStart = () => {
    setIsVideoLoading(true);
  };

  const handleVideoCanPlay = () => {
    setIsVideoLoading(false);
  };

  const handleVideoError = (errorMessage: string) => {
    setIsVideoLoading(false);
    // Error is handled by the stream management hook
  };

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
                            <Button
                              variant="light"
                              size="sm"
                              onPress={clearError}
                              className="mt-2 text-red-300"
                            >
                              Dismiss
                            </Button>
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
                        onLoadStart={handleVideoLoadStart}
                        onCanPlay={handleVideoCanPlay}
                        onError={handleVideoError}
                      />

                      {/* Loading Overlay */}
                      <LoadingOverlay
                        isVisible={isVideoLoading}
                        title="Connecting to Stream"
                        message="Waiting for m3u8 response..."
                      />

                      {/* Custom Video Controls */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                        <div className="flex items-center justify-between">
                          <VideoControls
                            isPlaying={isPlaying}
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

                          {/* Additional Controls */}
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
                              onPress={() =>
                                navigator.clipboard.writeText(streamUrl)
                              }
                              className="border-white/20 text-white hover:border-white/40"
                            >
                              📋 Copy URL
                            </Button>
                          </div>
                        </div>
                      </div>
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

                    {/* Stream Info Overlay - moved up to avoid covering video controls */}
                    <div className="absolute bottom-20 left-4 right-4">
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
        </div>
      </div>
    </div>
  );
};
