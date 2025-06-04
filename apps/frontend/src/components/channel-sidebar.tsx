import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Input,
  Button,
  Chip,
  ScrollShadow,
} from '@heroui/react';
import { useChannelStore } from '../hooks';
import { Channel } from '../interfaces';

type ChannelSidebarProps = {
  onChannelSelect: (channel: Channel) => void;
  onCustomId: (id: string) => void;
};

export const ChannelSidebar = ({
  onChannelSelect,
  onCustomId,
}: ChannelSidebarProps) => {
  const {
    filteredChannels,
    selectedChannel,
    searchQuery,
    selectedCategory,
    categories,
    setSearchQuery,
    setSelectedCategory,
    setSelectedChannel,
  } = useChannelStore();

  const [activeIndex, setActiveIndex] = useState(-1);
  const [customId, setCustomId] = useState('');

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;

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
            const channel = filteredChannels[activeIndex];
            setSelectedChannel(channel);
            onChannelSelect(channel);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, filteredChannels, onChannelSelect, setSelectedChannel]);

  // Reset active index when filtered channels change
  useEffect(() => {
    setActiveIndex(-1);
  }, [searchQuery, selectedCategory]);

  const handleCustomIdSubmit = () => {
    if (customId.trim()) {
      onCustomId(customId.trim());
      setCustomId('');
    }
  };

  const handleChannelClick = (channel: Channel) => {
    setSelectedChannel(channel);
    onChannelSelect(channel);
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

        {/* Category Filter */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            <Chip
              variant={selectedCategory === 'All' ? 'solid' : 'bordered'}
              color={selectedCategory === 'All' ? 'primary' : 'default'}
              size="sm"
              className="cursor-pointer"
              onClick={() => setSelectedCategory('All')}
            >
              All
            </Chip>
            {categories.map((category) => (
              <Chip
                key={category}
                variant={selectedCategory === category ? 'solid' : 'bordered'}
                color={selectedCategory === category ? 'primary' : 'default'}
                size="sm"
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Chip>
            ))}
          </div>
        </div>

        {/* Search */}
        <Input
          placeholder="Search channels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
          {filteredChannels.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">No channels found</div>
              <div className="text-sm text-gray-500">
                Try adjusting your search or category filter
              </div>
            </div>
          ) : (
            Object.entries(groupedChannels).map(
              ([category, categoryChannels]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {categoryChannels.map((channel) => {
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
                          onPress={() => handleChannelClick(channel)}
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
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                                    <span className="text-xs text-red-400">
                                      LIVE
                                    </span>
                                  </div>
                                )}
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color={channel.isLive ? 'success' : 'default'}
                                  className="text-xs"
                                >
                                  {channel.category}
                                </Chip>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )
            )
          )}
        </div>
      </ScrollShadow>
    </div>
  );
};
