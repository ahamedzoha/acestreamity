import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Chip,
  Divider,
  ScrollShadow,
} from '@heroui/react';

type Channel = {
  id: string;
  name: string;
  aceId: string;
  category: string;
  isLive?: boolean;
};

type ChannelSidebarProps = {
  channels: Channel[];
  selectedChannel: Channel | null;
  onChannelSelect: (channel: Channel) => void;
  onCustomId: (id: string) => void;
};

export const ChannelSidebar = ({
  channels,
  selectedChannel,
  onChannelSelect,
  onCustomId,
}: ChannelSidebarProps) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [customId, setCustomId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter channels based on search term
  const filteredChannels = channels.filter(
    (channel) =>
      channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      channel.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return; // Don't handle if typing in input

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          setActiveIndex((prev) =>
            prev <= 0 ? filteredChannels.length - 1 : prev - 1
          );
          break;
        case 'ArrowDown':
          event.preventDefault();
          setActiveIndex((prev) =>
            prev >= filteredChannels.length - 1 ? 0 : prev + 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (activeIndex >= 0 && activeIndex < filteredChannels.length) {
            onChannelSelect(filteredChannels[activeIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, filteredChannels, onChannelSelect]);

  // Reset active index when filtered channels change
  useEffect(() => {
    setActiveIndex(-1);
  }, [searchTerm]);

  const handleCustomIdSubmit = () => {
    if (customId.trim()) {
      onCustomId(customId.trim());
    }
  };

  const groupedChannels = filteredChannels.reduce((acc, channel) => {
    if (!acc[channel.category]) {
      acc[channel.category] = [];
    }
    acc[channel.category].push(channel);
    return acc;
  }, {} as Record<string, Channel[]>);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">Channels</h2>

        {/* Search */}
        <Input
          placeholder="Search channels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="bordered"
          className="mb-4"
          classNames={{
            input: 'text-white placeholder:text-gray-400',
            inputWrapper:
              'bg-white/5 border-white/20 hover:border-white/30 focus-within:border-purple-500',
          }}
          startContent={
            <svg
              className="w-4 h-4 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          }
        />

        {/* Custom ID Input */}
        <Card className="bg-white/5 border-white/10">
          <CardBody className="p-4">
            <h3 className="text-sm font-medium text-white mb-2">
              Custom Stream
            </h3>
            <div className="space-y-2">
              <Input
                placeholder="Enter Ace Stream ID"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                variant="bordered"
                size="sm"
                classNames={{
                  input: 'text-white placeholder:text-gray-400',
                  inputWrapper:
                    'bg-white/5 border-white/20 hover:border-white/30 focus-within:border-purple-500',
                }}
              />
              <Button
                size="sm"
                color="primary"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                onPress={handleCustomIdSubmit}
                isDisabled={!customId.trim()}
              >
                Load Custom Stream
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Channel List */}
      <ScrollShadow className="flex-1">
        <div className="p-6 space-y-6">
          {Object.entries(groupedChannels).map(
            ([category, categoryChannels]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryChannels.map((channel, categoryIndex) => {
                    const globalIndex = filteredChannels.indexOf(channel);
                    const isSelected = selectedChannel?.id === channel.id;
                    const isActive = activeIndex === globalIndex;

                    return (
                      <Card
                        key={channel.id}
                        isPressable
                        className={`
                        transition-all duration-200 cursor-pointer
                        ${
                          isSelected
                            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50'
                            : isActive
                            ? 'bg-white/10 border-white/30'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }
                      `}
                        onPress={() => onChannelSelect(channel)}
                      >
                        <CardBody className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium text-sm truncate">
                                {channel.name}
                              </h4>
                              <p className="text-gray-400 text-xs mt-1">
                                {channel.aceId.slice(0, 12)}...
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 ml-2">
                              {channel.isLive && (
                                <Chip
                                  size="sm"
                                  color="success"
                                  variant="flat"
                                  className="text-xs"
                                >
                                  Live
                                </Chip>
                              )}
                              {isSelected && (
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                              )}
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
                {Object.keys(groupedChannels).indexOf(category) <
                  Object.keys(groupedChannels).length - 1 && (
                  <Divider className="mt-4 bg-white/10" />
                )}
              </div>
            )
          )}

          {filteredChannels.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">No channels found</p>
              <p className="text-gray-500 text-xs mt-1">
                Try a different search term
              </p>
            </div>
          )}
        </div>
      </ScrollShadow>

      {/* Navigation Hints */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="text-xs text-gray-400 space-y-1">
          <p>
            <kbd className="px-1 bg-white/10 rounded">↑↓</kbd> Navigate •
            <kbd className="px-1 bg-white/10 rounded ml-1">Enter</kbd> Select
          </p>
          <p>
            <kbd className="px-1 bg-white/10 rounded">Space</kbd> Play/Stop •
            <kbd className="px-1 bg-white/10 rounded ml-1">Esc</kbd> Stop
          </p>
        </div>
      </div>
    </div>
  );
};
