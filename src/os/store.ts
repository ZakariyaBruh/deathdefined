import { useSyncExternalStore } from 'react';
import type { MediaItem } from '../types';
import { DEFAULT_USER_SETTINGS } from '../utils/ageFilter';
import { STREAMING_SERVERS } from '../utils/servers';
import { APP_META, appMeta, isInstalled } from './appMeta';
import type { Notif, Note, OSSettings, OSState, Panel, Persisted, Rect, WinState } from './types';

const STORAGE_KEY = 'cineos.v1';
export const MENUBAR_H = 30;

const DEFAULT_SETTINGS: OSSettings = {
  userName: 'Guest',
  theme: 'dark',
  accent: 'mono',
  wallpaper: 'noir',
  installed: ['notes', 'trivia'],
  windowed: false,
  dockMagnify: true,
  dockSize: 52,
  clock24: false,
  sounds: false,
  reduceMotion: false,
  brightness: 100,
  dnd: false,
  showWidgets: false,
  showDesktopIcons: false,
  skipBoot: true,
  parental: { ...DEFAULT_USER_SETTINGS },
  parentalPin: '',
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export { uid };

const readJSON = <T,>(key: string): T | null => {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
};

function load(): Persisted {
  const saved = readJSON<Partial<Persisted>>(STORAGE_KEY);
  // migrate from the original CineStream keys
  const oldWatch = readJSON<MediaItem[]>('cinestream_watchlist_v5');
  const oldHist = readJSON<any[]>('cinestream_history_v5');
  const oldSettings = readJSON<any>('cinestream_settings_v5');
  const settings: OSSettings = {
    ...DEFAULT_SETTINGS,
    ...(saved?.settings ?? {}),
    parental: { ...DEFAULT_USER_SETTINGS, ...(saved?.settings?.parental ?? (saved ? {} : oldSettings ?? {})) },
  };
  const welcome: Note = {
    id: uid(), title: 'Welcome to CineStream', color: '#fde047', updated: Date.now(), pinned: true,
    body: 'Welcome to CineStream.\n\n• Press Ctrl/⌘ + K to search every film and series.\n• The App Store in the dock adds extras: Terminal, Insights, Direct Play and more.\n• Settings → Parental Controls keeps the archive family-safe.\n• Prefer floating windows? Settings → General → Floating windows.\n\nEnjoy the show.',
  };
  return {
    settings,
    watchlist: saved?.watchlist ?? oldWatch ?? [],
    history: saved?.history ?? (oldHist ?? []).filter((h) => h?.media),
    notes: saved?.notes ?? [welcome],
    ratings: saved?.ratings ?? {},
    notifications: saved?.notifications ?? [],
    terminalHistory: saved?.terminalHistory ?? [],
  };
}

let state: OSState = {
  ...load(),
  phase: 'boot',
  panel: null,
  windows: [],
  focusId: null,
  snapPreview: null,
  toasts: [],
  bootedAt: Date.now(),
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  menuOpen: null,
};
if (state.settings.skipBoot) state.phase = 'desktop';

const listeners = new Set<() => void>();
let persistTimer: number | undefined;

function persist() {
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    const { settings, watchlist, history, notes, ratings, notifications, terminalHistory } = state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, watchlist, history, notes, ratings, notifications, terminalHistory }));
    } catch { /* quota or blocked */ }
  }, 250);
}

const PERSISTED_KEYS = ['settings', 'watchlist', 'history', 'notes', 'ratings', 'notifications', 'terminalHistory'];

export const getState = () => state;
export function setState(patch: Partial<OSState> | ((s: OSState) => Partial<OSState>)) {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  if (Object.keys(p).some((k) => PERSISTED_KEYS.includes(k))) persist();
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export function useOS<T>(sel: (s: OSState) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state), () => sel(state));
}

/* ───────── viewport ───────── */
export const viewport = () => ({ w: window.innerWidth, h: window.innerHeight });
export const isMobileViewport = () => window.innerWidth < 768;

/* ───────── system phase ───────── */
export const setPhase = (phase: OSState['phase']) => setState({ phase, panel: null, menuOpen: null });
export const lock = () => setState({ phase: 'lock', panel: null, menuOpen: null });
export function restart() { setState({ phase: 'boot', windows: [], focusId: null, panel: null, bootedAt: Date.now() }); }
export const shutdown = () => setState({ phase: 'off', windows: [], focusId: null, panel: null });

export const togglePanel = (p: Exclude<Panel, null>) => setState((s) => ({ panel: s.panel === p ? null : p, menuOpen: null }));
export const closePanel = () => setState({ panel: null });
export const setMenuOpen = (m: string | null) => setState({ menuOpen: m });

/* ───────── settings ───────── */
export const setSettings = (patch: Partial<OSSettings>) => setState((s) => ({ settings: { ...s.settings, ...patch } }));

/* ───────── windows ───────── */
function cascade(w: number, h: number, n: number): Rect {
  const { w: vw, h: vh } = viewport();
  const ww = Math.min(w, vw - 24);
  const hh = Math.min(h, vh - MENUBAR_H - 90);
  const off = (n % 7) * 28;
  const x = Math.max(8, Math.round((vw - ww) / 2) - 60 + off);
  const y = Math.max(MENUBAR_H + 6, Math.round((vh - hh) / 2) - 50 + off);
  return { x, y, w: ww, h: hh };
}

export function openApp(appId: string, props: any = {}, opts: { key?: string; title?: string; w?: number; h?: number } = {}): string | null {
  const meta = appMeta(appId);
  if (!meta) return null;
  if (!isInstalled(state.settings.installed, appId)) {
    notify(`${meta.name} isn't installed`, 'Get it from the App Store.', { appId: 'appstore' });
    return openApp('appstore', { focus: appId });
  }
  const key = opts.key ?? (meta.single ? appId : `${appId}:${uid()}`);
  const s = state;
  const existing = s.windows.find((w) => w.key === key);
  if (existing) {
    setState((st) => ({
      windows: st.windows.map((w) => (w.id === existing.id ? { ...w, minimized: false, props: { ...w.props, ...props }, title: opts.title ?? w.title } : w)),
      panel: null, menuOpen: null,
    }));
    focusWindow(existing.id);
    return existing.id;
  }
  const r = cascade(opts.w ?? meta.w, opts.h ?? meta.h, s.windows.length);
  const win: WinState = {
    id: uid(), appId, key, title: opts.title ?? meta.name, props, ...r,
    minimized: false, maximized: false, floating: false, openedAt: Date.now(),
  };
  if (!s.settings.windowed && !isMobileViewport()) { win.restore = { x: win.x, y: win.y, w: win.w, h: win.h }; win.maximized = true; }
  setState((st) => ({ windows: [...st.windows, win], focusId: win.id, panel: null, menuOpen: null }));
  return win.id;
}

export function closeWindow(id: string) {
  setState((s) => {
    const windows = s.windows.filter((w) => w.id !== id);
    let focusId = s.focusId;
    if (focusId === id) {
      const next = [...windows].reverse().find((w) => !w.minimized);
      focusId = next?.id ?? null;
    }
    return { windows, focusId };
  });
}

export function closeApp(appId: string) {
  setState((s) => {
    const windows = s.windows.filter((w) => w.appId !== appId);
    const focusId = windows.some((w) => w.id === s.focusId) ? s.focusId : [...windows].reverse().find((w) => !w.minimized)?.id ?? null;
    return { windows, focusId };
  });
}

export function focusWindow(id: string) {
  setState((s) => {
    const w = s.windows.find((x) => x.id === id);
    if (!w) return {};
    if (s.focusId === id && s.windows[s.windows.length - 1].id === id && !w.minimized) return {};
    return { windows: [...s.windows.filter((x) => x.id !== id), { ...w, minimized: false }], focusId: id, menuOpen: null };
  });
}

export function minimizeWindow(id: string) {
  setState((s) => {
    const windows = s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w));
    const focusId = s.focusId === id ? [...windows].reverse().find((w) => !w.minimized)?.id ?? null : s.focusId;
    return { windows, focusId };
  });
}

export function patchWindow(id: string, patch: Partial<WinState>) {
  setState((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
}

export const setWindowTitle = (id: string, title: string) => {
  const w = state.windows.find((x) => x.id === id);
  if (w && w.title !== title) patchWindow(id, { title });
};

export function toggleMaximize(id: string) {
  setState((s) => ({
    windows: s.windows.map((w) => {
      if (w.id !== id) return w;
      if (w.maximized) return { ...w, ...(w.restore ?? {}), maximized: false, restore: undefined };
      return { ...w, maximized: true, restore: { x: w.x, y: w.y, w: w.w, h: w.h } };
    }),
  }));
  focusWindow(id);
}

export function snapWindow(id: string, zone: 'left' | 'right' | 'max') {
  if (zone === 'max') { const w = state.windows.find((x) => x.id === id); if (w && !w.maximized) toggleMaximize(id); return; }
  const { w: vw, h: vh } = viewport();
  const rect = snapRect(zone, vw, vh);
  setState((s) => ({
    windows: s.windows.map((w) => (w.id === id ? { ...w, ...rect, maximized: false, restore: w.restore ?? { x: w.x, y: w.y, w: w.w, h: w.h } } : w)),
  }));
}
export const snapRect = (zone: 'left' | 'right', vw: number, vh: number): Rect => {
  const top = MENUBAR_H;
  const h = vh - top;
  return zone === 'left' ? { x: 0, y: top, w: Math.floor(vw / 2), h } : { x: Math.floor(vw / 2), y: top, w: Math.ceil(vw / 2), h };
};

export function toggleFloating(id: string) {
  setState((s) => ({
    windows: s.windows.map((w) => {
      if (w.id !== id) return w;
      if (w.floating) return { ...w, ...(w.restore ?? {}), floating: false, restore: undefined };
      const { w: vw, h: vh } = viewport();
      const fw = 420, fh = 260;
      return { ...w, floating: true, maximized: false, restore: { x: w.x, y: w.y, w: w.w, h: w.h }, x: vw - fw - 20, y: vh - fh - 100, w: fw, h: fh };
    }),
  }));
}

export function minimizeAll() { setState((s) => ({ windows: s.windows.map((w) => ({ ...w, minimized: true })), focusId: null, panel: null })); }
export function cycleWindows() {
  const s = state;
  const vis = s.windows.filter((w) => !w.minimized);
  if (vis.length < 2) return;
  focusWindow(vis[0].id);
}

/* ───────── notifications ───────── */
export function notify(title: string, body = '', extra: Partial<Pick<Notif, 'appId' | 'action'>> = {}) {
  const n: Notif = { id: uid(), title, body, time: Date.now(), read: false, ...extra };
  const dnd = state.settings.dnd;
  setState((s) => ({
    notifications: [n, ...s.notifications].slice(0, 60),
    toasts: dnd ? s.toasts : [...s.toasts, n].slice(-4),
  }));
  if (!dnd) window.setTimeout(() => dismissToast(n.id), 5200);
}
export const dismissToast = (id: string) => setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
export const clearNotifications = () => setState({ notifications: [] });
export const markNotifsRead = () => setState((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
export const removeNotification = (id: string) => setState((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));

/* ───────── library ───────── */
export const inWatchlist = (s: OSState, id: string) => s.watchlist.some((m) => m.id === id);

export function toggleWatchlist(m: MediaItem) {
  const has = inWatchlist(state, m.id);
  setState((s) => ({ watchlist: has ? s.watchlist.filter((x) => x.id !== m.id) : [slim(m), ...s.watchlist] }));
  notify(has ? 'Removed from Watchlist' : 'Added to Watchlist', m.title, { appId: 'library' });
}

/** Drop heavy episode lists before persisting. */
const slim = (m: MediaItem): MediaItem => ({ ...m, episodesList: undefined });

export function rate(id: string, stars: number) {
  setState((s) => {
    const ratings = { ...s.ratings };
    if (stars <= 0 || ratings[id] === stars) delete ratings[id]; else ratings[id] = stars;
    return { ratings };
  });
}

export function recordHistory(media: MediaItem, season = 1, episode = 1) {
  const tv = media.type === 'tv';
  const se = tv ? season : undefined, ep = tv ? episode : undefined;
  setState((s) => ({
    history: [{ media: slim(media), timestamp: Date.now(), season: se, episode: ep },
      ...s.history.filter((h) => !(h.media.id === media.id && h.season === se && h.episode === ep))].slice(0, 120),
  }));
}

export function playMedia(media: MediaItem, season = 1, episode = 1) {
  openApp('player', { media, season, episode, serverId: state.settings.parental.defaultServerId, nonce: Date.now() });
  recordHistory(media, season, episode);
}

export const openDetails = (media: MediaItem) => openApp('details', { media }, { key: `details:${media.id}`, title: media.title });

export const clearHistory = () => setState({ history: [] });

/* ───────── notes ───────── */
export function saveNote(n: Note) {
  setState((s) => ({ notes: s.notes.some((x) => x.id === n.id) ? s.notes.map((x) => (x.id === n.id ? n : x)) : [n, ...s.notes] }));
}
export const deleteNote = (id: string) => setState((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
export function newNote(body = '', title = 'Untitled'): Note {
  const n: Note = { id: uid(), title, body, color: '#fde047', updated: Date.now() };
  saveNote(n);
  return n;
}

/* ───────── data ───────── */
export function exportData(): string {
  const { settings, watchlist, history, notes, ratings } = state;
  return JSON.stringify({ cineos: 1, exportedAt: new Date().toISOString(), settings, watchlist, history, notes, ratings }, null, 2);
}
export function importData(text: string): boolean {
  try {
    const d = JSON.parse(text);
    if (!d || d.cineos !== 1) return false;
    setState({
      settings: { ...DEFAULT_SETTINGS, ...d.settings, parental: { ...DEFAULT_USER_SETTINGS, ...(d.settings?.parental ?? {}) } },
      watchlist: d.watchlist ?? [], history: d.history ?? [], notes: d.notes ?? [], ratings: d.ratings ?? {},
    });
    return true;
  } catch { return false; }
}
export function factoryReset() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  const fresh = load();
  setState({ ...fresh, settings: { ...DEFAULT_SETTINGS }, windows: [], focusId: null, phase: 'boot', bootedAt: Date.now() });
}

export const defaultServer = () => STREAMING_SERVERS.find((s) => s.id === state.settings.parental.defaultServerId) ?? STREAMING_SERVERS[0];
export const allApps = () => APP_META;

/* ───────── app store ───────── */
export function installApp(id: string) {
  const meta = appMeta(id);
  if (!meta || meta.core || state.settings.installed.includes(id)) return;
  setSettings({ installed: [...state.settings.installed, id] });
  notify(`${meta.name} installed`, 'Find it in the Dock.', { appId: id });
}
export function uninstallApp(id: string) {
  const meta = appMeta(id);
  if (!meta || meta.core) return;
  closeApp(id);
  setSettings({ installed: state.settings.installed.filter((x) => x !== id) });
  notify(`${meta.name} removed`);
}
