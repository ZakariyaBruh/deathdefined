export type MediaType = 'movie' | 'tv';

export interface Episode {
  id: string;
  season: number;
  episode: number;
  title: string;
  overview?: string;
  thumbnail?: string;
  rating?: string | number;
  released?: string;
}

export type AgeRating = 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17' | 'TV-G' | 'TV-PG' | 'TV-14' | 'TV-MA';

export interface MediaItem {
  id: string;
  imdbId: string;
  tmdbId?: number;
  title: string;
  type: MediaType;
  year: number;
  duration: string;
  rating: number; // e.g. 8.9
  ageRating?: string; // e.g. 'PG-13', 'R', 'TV-MA'
  genres: string[];
  synopsis: string;
  director?: string;
  cast: string[];
  backdropUrl: string;
  posterUrl: string;
  tagline?: string;
  seasons?: number;
  episodesPerSeason?: number;
  trendingRank?: number;
  featured?: boolean;
  curatorNote?: string;
  awards?: string;
  country?: string;
  episodesList?: Episode[];
}

export interface StreamingServer {
  id: string;
  name: string;
  host: string;
  getMovieUrl: (imdbId: string) => string;
  getTvUrl: (imdbId: string, season: number, episode: number) => string;
  description: string;
  isDefault?: boolean;
}

export interface PlaybackState {
  media: MediaItem | null;
  season: number;
  episode: number;
  server: StreamingServer;
  theaterMode: boolean;
  lightsOff: boolean;
  isOpen: boolean;
}

export interface WatchHistoryItem {
  media: MediaItem;
  timestamp: number;
  season?: number;
  episode?: number;
}

export interface UserSettings {
  maxRatingTier: 'ALL' | 'TEEN' | 'FAMILY';
  allowedRatings: string[]; // ['G', 'PG', 'PG-13', 'R']
  defaultServerId: string;
  autoTheaterMode: boolean;
  autoDimMode: boolean;
  showRestrictedInSearch?: boolean;
}
