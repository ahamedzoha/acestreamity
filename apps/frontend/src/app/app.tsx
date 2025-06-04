import { useState } from 'react';

export function App() {
  const [aceStreamId, setAceStreamId] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [error, setError] = useState('');

  const handleStartStream = async () => {
    if (!aceStreamId.trim()) {
      setError('Please enter a valid Ace Stream ID');
      return;
    }

    setIsStreaming(true);
    setError('');

    try {
      // TODO: Implement actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call
      setStreamUrl(
        `http://localhost:3001/api/streams/hls/${aceStreamId}/manifest.m3u8`
      );
    } catch (err) {
      setError('Failed to start stream. Please try again.');
      setIsStreaming(false);
    }
  };

  const handleStopStream = () => {
    setIsStreaming(false);
    setStreamUrl('');
    setError('');
  };

  const handleVlcLaunch = () => {
    if (streamUrl) {
      // Open VLC with the stream URL
      window.open(`vlc://${streamUrl}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Ace Stream HLS</h1>
            <span className="text-sm text-gray-500">
              Cross-platform streaming
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
          {/* Control Panel */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Stream Control
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="label">Ace Stream Content ID</label>
                  <input
                    type="text"
                    value={aceStreamId}
                    onChange={(e) => setAceStreamId(e.target.value)}
                    placeholder="Enter 40-character Ace Stream ID..."
                    className="input"
                    disabled={isStreaming}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: dd1e67078381739d14beca697356ab76d49d1a2d
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                    <p className="text-sm text-error-700">{error}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  {!isStreaming ? (
                    <button
                      onClick={handleStartStream}
                      className="btn-primary flex-1"
                      disabled={!aceStreamId.trim()}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Start Stream
                    </button>
                  ) : (
                    <button
                      onClick={handleStopStream}
                      className="btn-error flex-1"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Stop Stream
                    </button>
                  )}
                </div>

                {streamUrl && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Quick Actions
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={handleVlcLaunch}
                        className="btn-secondary w-full justify-start"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                        Open in VLC
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(streamUrl)}
                        className="btn-secondary w-full justify-start"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                        Copy Stream URL
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Card */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Stream Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Engine Status</span>
                  <span className="status-streaming">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Stream Status</span>
                  {isStreaming ? (
                    <span className="status-loading">
                      <svg
                        className="w-3 h-3 mr-1 animate-spin"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {streamUrl ? 'Streaming' : 'Starting...'}
                    </span>
                  ) : (
                    <span className="status-stopped">Stopped</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Peers</span>
                  <span className="text-sm font-medium text-gray-900">
                    {isStreaming ? '12' : '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Download Speed</span>
                  <span className="text-sm font-medium text-gray-900">
                    {isStreaming ? '2.4 MB/s' : '0 KB/s'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Video Player Area */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Stream Player
            </h2>

            {!streamUrl ? (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-gray-500">
                    Enter an Ace Stream ID to start streaming
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                  <video
                    controls
                    className="w-full h-full rounded-lg"
                    src={streamUrl}
                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'%3E%3Cpath fill='%236B7280' d='M4 6h16v12H4z'/%3E%3C/svg%3E"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Stream Information
                  </h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Content ID: {aceStreamId}</div>
                    <div>Format: HLS (HTTP Live Streaming)</div>
                    <div>Quality: Auto (adapts to bandwidth)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How to Use
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mb-3">
                <span className="text-sm font-bold">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">
                Enter Content ID
              </h4>
              <p className="text-sm text-gray-600">
                Paste a 40-character Ace Stream content ID in the input field
                above.
              </p>
            </div>
            <div>
              <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mb-3">
                <span className="text-sm font-bold">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">
                Start Streaming
              </h4>
              <p className="text-sm text-gray-600">
                Click "Start Stream" to begin converting the P2P stream to HLS
                format.
              </p>
            </div>
            <div>
              <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mb-3">
                <span className="text-sm font-bold">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Watch Anywhere</h4>
              <p className="text-sm text-gray-600">
                Use the web player or copy the stream URL to watch on VLC, iOS,
                tvOS, and more.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
