import { MediaItem } from '../types';
import { cleanMediaId } from './servers';

/**
 * Creates a playable MediaItem from an identifier if not found in catalog
 */
export function createCustomMediaItem(idInput: string, title?: string, type: 'movie' | 'tv' = 'movie'): MediaItem {
  const id = cleanMediaId(idInput);
  const displayTitle = title?.trim() || `Cinema Presentation (${id.toUpperCase()})`;

  return {
    id: id,
    imdbId: id,
    title: displayTitle,
    type: type,
    year: new Date().getFullYear(),
    duration: type === 'movie' ? 'Feature' : 'Series',
    rating: 8.5,
    genres: ['Direct Stream', type === 'movie' ? 'Feature Film' : 'Series'],
    synopsis: `High-definition stream presentation (${id}) with cinema master audio and multi-language subtitles.`,
    cast: ['Ensemble Cast'],
    backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
    seasons: type === 'tv' ? 10 : undefined,
    episodesPerSeason: type === 'tv' ? 24 : undefined,
  };
}
