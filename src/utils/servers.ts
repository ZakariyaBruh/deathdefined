import { StreamingServer } from '../types';

export const STREAMING_SERVERS: StreamingServer[] = [
  {
    id: 'server-primary',
    name: 'Primary Player',
    host: 'vidsrc.sh',
    isDefault: true,
    description: 'High-definition direct streaming node with multi-language subtitles',
    getMovieUrl: (mediaId: string) => `https://vidsrc.sh/embed/movie/${cleanMediaId(mediaId)}`,
    getTvUrl: (mediaId: string, season: number, episode: number) =>
      `https://vidsrc.sh/embed/tv/${cleanMediaId(mediaId)}/${season}/${episode}`,
  },
  {
    id: 'server-alpha',
    name: 'Mirror Alpha',
    host: 'vidsrc.to',
    description: 'High-speed buffer-free streaming mirror',
    getMovieUrl: (mediaId: string) => `https://vidsrc.to/embed/movie/${cleanMediaId(mediaId)}`,
    getTvUrl: (mediaId: string, season: number, episode: number) =>
      `https://vidsrc.to/embed/tv/${cleanMediaId(mediaId)}/${season}/${episode}`,
  },
  {
    id: 'server-beta',
    name: 'Mirror Beta',
    host: 'vidsrc.mov',
    description: 'Low-latency direct playback cluster',
    getMovieUrl: (mediaId: string) => `https://vidsrc.mov/embed/movie/${cleanMediaId(mediaId)}`,
    getTvUrl: (mediaId: string, season: number, episode: number) =>
      `https://vidsrc.mov/embed/tv/${cleanMediaId(mediaId)}/${season}/${episode}`,
  },
  {
    id: 'server-gamma',
    name: 'Mirror Gamma',
    host: 'vidsrc.net',
    description: 'Alternative global CDN edge',
    getMovieUrl: (mediaId: string) => `https://vidsrc.net/embed/movie/${cleanMediaId(mediaId)}`,
    getTvUrl: (mediaId: string, season: number, episode: number) =>
      `https://vidsrc.net/embed/tv/${cleanMediaId(mediaId)}/${season}/${episode}`,
  },
  {
    id: 'server-backup',
    name: 'Backup Cluster',
    host: 'embed.su',
    description: 'Multi-host redundancy failover stream',
    getMovieUrl: (mediaId: string) => `https://embed.su/embed/movie/${cleanMediaId(mediaId)}`,
    getTvUrl: (mediaId: string, season: number, episode: number) =>
      `https://embed.su/embed/tv/${cleanMediaId(mediaId)}/${season}/${episode}`,
  }
];

export function cleanMediaId(rawId: string): string {
  if (!rawId) return '';
  const trimmed = rawId.trim();
  const match = trimmed.match(/tt\d+/i);
  if (match) {
    return match[0].toLowerCase();
  }
  if (/^\d+$/.test(trimmed)) {
    return `tt${trimmed}`;
  }
  return trimmed;
}

export function isValidMediaId(id: string): boolean {
  const clean = cleanMediaId(id);
  return /^tt\d{5,}$/i.test(clean);
}

// Aliases for compatibility
export const cleanImdbId = cleanMediaId;
export const isValidImdbId = isValidMediaId;
