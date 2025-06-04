export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
};

export type LoadingState = {
  isLoading: boolean;
  loadingText?: string;
  progress?: number;
};

export type UIState = {
  notifications: Notification[];
  loadingStates: Record<string, LoadingState>;
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  showDevtools: boolean;
};

export type KeyboardShortcut = {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
};

export type ComponentVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger';
export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';
