import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ChannelState, Channel, ChannelCategory } from '../interfaces';

type ChannelActions = {
  setChannels: (channels: Channel[]) => void;
  setSelectedChannel: (channel: Channel | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: ChannelCategory | 'All') => void;
  filterChannels: () => void;
  addChannel: (channel: Channel) => void;
  updateChannel: (id: string, updates: Partial<Channel>) => void;
  removeChannel: (id: string) => void;
  clearSelection: () => void;
};

type ChannelStore = ChannelState & ChannelActions;

// Sample channels data
const defaultChannels: Channel[] = [
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
    id: '3',
    name: 'Movie Channel',
    aceId: 'acestream://b04372b9543d763bd2dbd2a1842d9723fd080076',
    category: 'Movies',
    isLive: true,
  },
  {
    id: '4',
    name: 'News Network',
    aceId: 'acestream://a7b9c8d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0',
    category: 'News',
    isLive: false,
  },
];

const initialState: ChannelState = {
  channels: defaultChannels,
  selectedChannel: null,
  categories: [
    'Sports',
    'Movies',
    'News',
    'Entertainment',
    'Documentary',
    'Other',
  ],
  filteredChannels: defaultChannels,
  searchQuery: '',
  selectedCategory: 'All',
};

export const useChannelStore = create<ChannelStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setChannels: (channels: Channel[]) => {
        set({ channels });
        // Use setTimeout to batch the filtering to prevent double updates
        setTimeout(() => get().filterChannels(), 0);
      },

      setSelectedChannel: (channel: Channel | null) =>
        set({ selectedChannel: channel }),

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
        // Use setTimeout to batch the filtering to prevent double updates
        setTimeout(() => get().filterChannels(), 0);
      },

      setSelectedCategory: (category: ChannelCategory | 'All') => {
        set({ selectedCategory: category });
        // Use setTimeout to batch the filtering to prevent double updates
        setTimeout(() => get().filterChannels(), 0);
      },

      filterChannels: () => {
        const { channels, searchQuery, selectedCategory } = get();

        let filtered = channels;

        // Filter by category
        if (selectedCategory !== 'All') {
          filtered = filtered.filter(
            (channel) => channel.category === selectedCategory
          );
        }

        // Filter by search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (channel) =>
              channel.name.toLowerCase().includes(query) ||
              channel.category.toLowerCase().includes(query) ||
              channel.aceId.toLowerCase().includes(query)
          );
        }

        set({ filteredChannels: filtered });
      },

      addChannel: (channel: Channel) => {
        const { channels } = get();
        set({ channels: [...channels, channel] });
        setTimeout(() => get().filterChannels(), 0);
      },

      updateChannel: (id: string, updates: Partial<Channel>) => {
        const { channels } = get();
        const updated = channels.map((channel) =>
          channel.id === id ? { ...channel, ...updates } : channel
        );
        set({ channels: updated });
        setTimeout(() => get().filterChannels(), 0);
      },

      removeChannel: (id: string) => {
        const { channels, selectedChannel } = get();
        const filtered = channels.filter((channel) => channel.id !== id);

        // Clear selection if the removed channel was selected
        const newSelectedChannel =
          selectedChannel?.id === id ? null : selectedChannel;

        set({
          channels: filtered,
          selectedChannel: newSelectedChannel,
        });
        setTimeout(() => get().filterChannels(), 0);
      },

      clearSelection: () => set({ selectedChannel: null }),
    }),
    { name: 'channel-store' }
  )
);
