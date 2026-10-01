import { APP_META, isInstalled } from './appMeta';
import { CATALOG } from './catalog';
import { exportData, getState, openApp, openDetails, playMedia, deleteNote, toggleWatchlist } from './store';
import { matchesAgeFilter } from '../utils/ageFilter';

export interface VNode {
  name: string;
  path: string;
  kind: 'dir' | 'file';
  ext?: string;
  size: number;
  modified?: number;
  open?: () => void;
  read?: () => string;
  remove?: () => void;
  poster?: string;
  appId?: string;
}

const safe = (s: string) => s.replace(/[\\/]/g, '-').trim() || 'untitled';
const dir = (path: string, name: string): VNode => ({ name, path, kind: 'dir', size: 0 });

const DIRS: Record<string, string[]> = {
  '/': ['home', 'Applications', 'Archive'],
  '/home': ['Watchlist', 'History', 'Notes'],
};

export function normalize(cwd: string, p: string): string {
  const start = p.startsWith('/') ? [] : cwd.split('/').filter(Boolean);
  if (p === '~' || p.startsWith('~/')) { start.length = 0; start.push('home'); p = p.slice(1); }
  for (const part of p.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') start.pop(); else start.push(part);
  }
  return '/' + start.join('/');
}

const mediaDesc = (m: { title: string; year: number; type: string; rating: number; genres: string[]; synopsis: string; director?: string; cast: string[]; imdbId: string }) =>
  `${m.title} (${m.year})\n${m.type === 'tv' ? 'Series' : 'Film'} · ★ ${m.rating.toFixed(1)} · ${m.genres.join(', ')}\nIMDb: ${m.imdbId}\n${m.director ? `Director: ${m.director}\n` : ''}${m.cast.length ? `Cast: ${m.cast.join(', ')}\n` : ''}\n${m.synopsis}\n`;

export function list(path: string): VNode[] | null {
  const s = getState();
  const p = path.replace(/\/+$/, '') || '/';
  if (DIRS[p]) return DIRS[p].map((n) => dir(`${p === '/' ? '' : p}/${n}`, n));
  if (p === '/home') return null;
  if (p === '/home/Watchlist') {
    return s.watchlist.map((m) => ({ name: `${safe(m.title)}.${m.type === 'tv' ? 'series' : 'film'}`, path: `${p}/${safe(m.title)}`, kind: 'file', ext: m.type === 'tv' ? 'series' : 'film', size: m.synopsis.length, poster: m.posterUrl, open: () => openDetails(m), read: () => mediaDesc(m), remove: () => toggleWatchlist(m) }));
  }
  if (p === '/home/History') {
    return s.history.map((h) => ({ name: `${safe(h.media.title)}${h.season ? ` S${h.season}E${h.episode}` : ''}.log`, path: `${p}/${safe(h.media.title)}-${h.timestamp}`, kind: 'file', ext: 'log', size: 64, modified: h.timestamp, poster: h.media.posterUrl, open: () => playMedia(h.media, h.season ?? 1, h.episode ?? 1), read: () => `Played ${h.media.title}${h.season ? ` S${h.season}E${h.episode}` : ''} on ${new Date(h.timestamp).toLocaleString()}\n` }));
  }
  if (p === '/home/Notes') {
    return s.notes.map((n) => ({ name: `${safe(n.title)}.txt`, path: `${p}/${safe(n.title)}`, kind: 'file', ext: 'txt', size: n.body.length, modified: n.updated, open: () => openApp('notes', { noteId: n.id }), read: () => n.body + '\n', remove: () => deleteNote(n.id) }));
  }
  if (p === '/Applications') {
    return APP_META.filter((a) => !a.hidden && isInstalled(s.settings.installed, a.id)).map((a) => ({ name: `${a.name}.app`, path: `${p}/${a.name}`, kind: 'file', ext: 'app', appId: a.id, size: 1, open: () => openApp(a.id), read: () => `${a.name}\n${a.blurb}\n` }));
  }
  if (p === '/Archive') {
    return CATALOG.filter((m) => matchesAgeFilter(m, 'ALL', s.settings.parental)).map((m) => ({ name: `${safe(m.title)}.${m.type === 'tv' ? 'series' : 'film'}`, path: `${p}/${safe(m.title)}`, kind: 'file', ext: m.type === 'tv' ? 'series' : 'film', size: m.synopsis.length, poster: m.posterUrl, open: () => openDetails(m), read: () => mediaDesc(m) }));
  }
  return null;
}

/** Files that live directly in /home (not folders). */
export function homeFiles(): VNode[] {
  const s = getState();
  return [
    { name: 'settings.json', path: '/home/settings.json', kind: 'file', ext: 'json', size: JSON.stringify(s.settings).length, open: () => openApp('settings'), read: () => JSON.stringify(s.settings, null, 2) + '\n' },
    { name: 'ratings.json', path: '/home/ratings.json', kind: 'file', ext: 'json', size: JSON.stringify(s.ratings).length, read: () => JSON.stringify(s.ratings, null, 2) + '\n' },
    { name: 'backup.cineos.json', path: '/home/backup.cineos.json', kind: 'file', ext: 'json', size: exportData().length, read: () => exportData() + '\n' },
  ];
}

export function children(path: string): VNode[] | null {
  const p = path.replace(/\/+$/, '') || '/';
  if (p === '/home') return [...(DIRS['/home'].map((n) => dir(`/home/${n}`, n))), ...homeFiles()];
  return list(p);
}

export function stat(path: string): VNode | null {
  const p = path.replace(/\/+$/, '') || '/';
  if (p === '/') return dir('/', '/');
  const i = p.lastIndexOf('/');
  const parent = i <= 0 ? '/' : p.slice(0, i);
  const name = p.slice(i + 1);
  const kids = children(parent);
  if (!kids) return null;
  return kids.find((k) => k.path === p || k.name === name || k.name.replace(/\.[^.]+$/, '') === name) ?? null;
}

export const fmtSize = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`);
