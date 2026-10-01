import type { MediaItem, UserSettings } from '../types';

export interface Rect { x: number; y: number; w: number; h: number }

export interface WinState extends Rect {
  id: string;
  appId: string;
  key: string;
  title: string;
  props: any;
  minimized: boolean;
  maximized: boolean;
  floating: boolean;
  restore?: Rect;
  openedAt: number;
}

export interface Note { id: string; title: string; body: string; color: string; updated: number; pinned?: boolean }

export interface Notif {
  id: string; title: string; body: string; time: number; appId?: string; read: boolean;
  action?: { label: string; appId: string; props?: any };
}

export interface OSSettings {
  userName: string;
  theme: 'dark' | 'light';
  accent: string;
  wallpaper: string;
  installed: string[];
  windowed: boolean;
  dockMagnify: boolean;
  dockSize: number;
  clock24: boolean;
  sounds: boolean;
  reduceMotion: boolean;
  brightness: number;
  dnd: boolean;
  showWidgets: boolean;
  showDesktopIcons: boolean;
  skipBoot: boolean;
  parental: UserSettings;
  parentalPin: string;
}

export interface Persisted {
  settings: OSSettings;
  watchlist: MediaItem[];
  history: { media: MediaItem; timestamp: number; season?: number; episode?: number }[];
  notes: Note[];
  ratings: Record<string, number>;
  notifications: Notif[];
  terminalHistory: string[];
}

export type Phase = 'boot' | 'lock' | 'desktop' | 'off';
export type Panel = 'spotlight' | 'launchpad' | 'control' | 'notifs' | 'mission' | 'switcher' | null;

export interface OSState extends Persisted {
  phase: Phase;
  panel: Panel;
  windows: WinState[];
  focusId: string | null;
  snapPreview: Rect | null;
  toasts: Notif[];
  bootedAt: number;
  online: boolean;
  menuOpen: string | null;
}
