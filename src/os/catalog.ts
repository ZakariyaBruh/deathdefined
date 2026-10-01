import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { MOVIES_DATABASE } from '../data/movies';
import type { MediaItem } from '../types';
import { matchesAgeFilter } from '../utils/ageFilter';
import { fetchCinemetaMeta, searchAllMedia } from '../utils/imdbApi';
import { cleanMediaId, isValidMediaId } from '../utils/servers';
import { useOS } from './store';

export const CATALOG = MOVIES_DATABASE;

/** Catalog items allowed by the active parental controls. */
export function useAllowed(items: MediaItem[] = CATALOG): MediaItem[] {
  const parental = useOS((s) => s.settings.parental);
  return useMemo(() => items.filter((m) => matchesAgeFilter(m, 'ALL', parental)), [items, parental]);
}

export const allGenres = (items: MediaItem[]) => {
  const c = new Map<string, number>();
  items.forEach((m) => m.genres.forEach((g) => c.set(g, (c.get(g) ?? 0) + 1)));
  return [...c.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
};

export const findLocal = (id: string): MediaItem | undefined => CATALOG.find((m) => m.id === id || m.imdbId === id);

/* live metadata cache */
const metaCache = new Map<string, MediaItem | null>();
const metaPending = new Map<string, Promise<MediaItem | null>>();

export function loadMeta(id: string): Promise<MediaItem | null> {
  const clean = cleanMediaId(id);
  if (metaCache.has(clean)) return Promise.resolve(metaCache.get(clean)!);
  if (!metaPending.has(clean)) {
    metaPending.set(clean, fetchCinemetaMeta(clean).then((m) => { metaCache.set(clean, m); metaPending.delete(clean); return m; }));
  }
  return metaPending.get(clean)!;
}

/** Merge local curated data with live metadata (episodes, fresh poster, etc.). */
export function useLiveMeta(media: MediaItem): { media: MediaItem; loading: boolean } {
  const [live, setLive] = useState<MediaItem | null>(() => metaCache.get(media.imdbId) ?? null);
  const [loading, setLoading] = useState(!metaCache.has(media.imdbId) && isValidMediaId(media.imdbId));
  useEffect(() => {
    let off = false;
    if (!isValidMediaId(media.imdbId)) { setLoading(false); return; }
    loadMeta(media.imdbId).then((m) => { if (!off) { setLive(m); setLoading(false); } });
    return () => { off = true; };
  }, [media.imdbId]);
  const merged = useMemo<MediaItem>(() => {
    if (!live) return media;
    return {
      ...live, ...media,
      synopsis: media.synopsis.length > live.synopsis.length ? media.synopsis : live.synopsis,
      cast: media.cast.length ? media.cast : live.cast,
      director: media.director ?? live.director,
      episodesList: live.episodesList,
      seasons: live.seasons ?? media.seasons,
      posterUrl: media.posterUrl || live.posterUrl,
      backdropUrl: media.backdropUrl || live.backdropUrl,
    };
  }, [media, live]);
  return { media: merged, loading };
}

/* debounced online search hook */
export function useSearch(query: string, delay = 280) {
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); setLoading(false); return; }
    let off = false;
    setLoading(true);
    const t = window.setTimeout(() => {
      searchAllMedia(q).then((r) => { if (!off) { setResults(r); setLoading(false); } }).catch(() => { if (!off) setLoading(false); });
    }, delay);
    return () => { off = true; window.clearTimeout(t); };
  }, [query, delay]);
  return { results, loading };
}

export function localSearch(q: string, items: MediaItem[] = CATALOG): MediaItem[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return items
    .map((m) => {
      const t = m.title.toLowerCase();
      let score = 0;
      if (t === s) score = 100; else if (t.startsWith(s)) score = 80; else if (t.includes(s)) score = 60;
      else if (m.cast.some((c) => c.toLowerCase().includes(s)) || m.director?.toLowerCase().includes(s)) score = 40;
      else if (m.genres.some((g) => g.toLowerCase().includes(s))) score = 20;
      return { m, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.m);
}

/* clock */
const clockSub = (cb: () => void) => { const t = window.setInterval(cb, 1000); return () => window.clearInterval(t); };
export function useNow(): number {
  return useSyncExternalStore(clockSub, () => Math.floor(Date.now() / 1000) * 1000, () => 0);
}

export const fmtTime = (d: Date, h24: boolean, secs = false) =>
  d.toLocaleTimeString([], { hour: h24 ? '2-digit' : 'numeric', minute: '2-digit', second: secs ? '2-digit' : undefined, hour12: !h24 });

export const timeAgo = (t: number) => {
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const runtimeMinutes = (d: string): number => {
  const m = /(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?/i.exec(d ?? '');
  const mins = (parseInt(m?.[1] ?? '0') || 0) * 60 + (parseInt(m?.[2] ?? '0') || 0);
  return mins || 0;
};
