export type Channel = {
  id: string;
  name: string;
  aceId: string;
  category: string;
  isLive?: boolean;
  description?: string;
  thumbnail?: string;
};

export type ChannelCategory =
  | 'Sports'
  | 'Movies'
  | 'News'
  | 'Entertainment'
  | 'Documentary'
  | 'Other';

export type ChannelState = {
  channels: Channel[];
  selectedChannel: Channel | null;
  categories: ChannelCategory[];
  filteredChannels: Channel[];
  searchQuery: string;
  selectedCategory: ChannelCategory | 'All';
};
