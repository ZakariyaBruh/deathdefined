export interface AppMeta {
  id: string;
  name: string;
  icon: string;
  from: string;
  to: string;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  single?: boolean;
  hidden?: boolean; // not in launchpad / dock picker
  category: 'Cinema' | 'Utilities' | 'Games' | 'System';
  blurb: string;
}

export const APP_META: AppMeta[] = [
  { id: 'store', name: 'CineStore', icon: 'Clapperboard', from: '#fafafa', to: '#a3a3a3', w: 1080, h: 700, minW: 560, minH: 420, single: true, category: 'Cinema', blurb: 'Browse the archive of films and television' },
  { id: 'library', name: 'Library', icon: 'Bookmark', from: '#60a5fa', to: '#2563eb', w: 920, h: 640, minW: 520, minH: 380, single: true, category: 'Cinema', blurb: 'Watchlist, history and your ratings' },
  { id: 'player', name: 'Cinema', icon: 'Play', from: '#f87171', to: '#b91c1c', w: 1000, h: 640, minW: 420, minH: 300, single: true, category: 'Cinema', blurb: 'The screening room' },
  { id: 'directplay', name: 'Direct Play', icon: 'Link2', from: '#34d399', to: '#047857', w: 560, h: 520, minW: 420, minH: 380, single: true, category: 'Cinema', blurb: 'Stream any title by IMDb ID or link' },
  { id: 'insights', name: 'Insights', icon: 'BarChart3', from: '#c084fc', to: '#7e22ce', w: 840, h: 620, minW: 520, minH: 420, single: true, category: 'Cinema', blurb: 'Your watching habits, charted' },
  { id: 'trivia', name: 'Trivia', icon: 'HelpCircle', from: '#fbbf24', to: '#d97706', w: 560, h: 640, minW: 420, minH: 520, single: true, category: 'Games', blurb: 'Cinema quiz built from the archive' },
  { id: 'snake', name: 'Snake', icon: 'Gamepad2', from: '#4ade80', to: '#15803d', w: 520, h: 640, minW: 380, minH: 520, single: true, category: 'Games', blurb: 'A classic, for the interval' },
  { id: 'terminal', name: 'Terminal', icon: 'Terminal', from: '#404040', to: '#0a0a0a', w: 760, h: 480, minW: 360, minH: 240, category: 'Utilities', blurb: 'A shell for the cinema OS' },
  { id: 'notes', name: 'Notes', icon: 'StickyNote', from: '#fde047', to: '#ca8a04', w: 780, h: 540, minW: 480, minH: 320, single: true, category: 'Utilities', blurb: 'Reviews, quotes and lists' },
  { id: 'files', name: 'Files', icon: 'FolderOpen', from: '#38bdf8', to: '#0369a1', w: 800, h: 520, minW: 480, minH: 320, category: 'Utilities', blurb: 'Browse everything on this system' },
  { id: 'calculator', name: 'Calculator', icon: 'Calculator', from: '#fb923c', to: '#c2410c', w: 300, h: 460, minW: 280, minH: 420, single: true, category: 'Utilities', blurb: 'Arithmetic, with keys' },
  { id: 'clock', name: 'Clock', icon: 'Clock', from: '#737373', to: '#171717', w: 440, h: 500, minW: 360, minH: 400, single: true, category: 'Utilities', blurb: 'World clock, stopwatch, timer' },
  { id: 'monitor', name: 'Activity', icon: 'Activity', from: '#2dd4bf', to: '#0f766e', w: 720, h: 520, minW: 480, minH: 360, single: true, category: 'System', blurb: 'Processes, memory and frame rate' },
  { id: 'settings', name: 'Settings', icon: 'Settings', from: '#a3a3a3', to: '#525252', w: 860, h: 600, minW: 560, minH: 420, single: true, category: 'System', blurb: 'Appearance, parental controls, data' },
  { id: 'details', name: 'Details', icon: 'Info', from: '#a3a3a3', to: '#525252', w: 880, h: 640, minW: 480, minH: 400, hidden: true, category: 'Cinema', blurb: 'Title details' },
  { id: 'about', name: 'About CineOS', icon: 'Info', from: '#a3a3a3', to: '#525252', w: 440, h: 520, minW: 440, minH: 520, single: true, hidden: true, category: 'System', blurb: 'About this system' },
];

export const appMeta = (id: string) => APP_META.find((a) => a.id === id);

export const DEFAULT_DOCK = ['store', 'library', 'directplay', 'terminal', 'notes', 'files', 'trivia', 'snake', 'insights', 'settings'];

export const ACCENTS: Record<string, { name: string; c: string; fg: string }> = {
  mono: { name: 'Monochrome', c: '#f5f5f5', fg: '#0a0a0a' },
  blue: { name: 'Blue', c: '#3b82f6', fg: '#ffffff' },
  violet: { name: 'Violet', c: '#8b5cf6', fg: '#ffffff' },
  rose: { name: 'Rose', c: '#f43f5e', fg: '#ffffff' },
  amber: { name: 'Amber', c: '#f59e0b', fg: '#0a0a0a' },
  emerald: { name: 'Emerald', c: '#10b981', fg: '#04130d' },
};
