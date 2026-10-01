import { MediaItem, UserSettings } from '../types';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  maxRatingTier: 'ALL',
  allowedRatings: ['G', 'PG', 'PG-13', 'R'],
  defaultServerId: 'server-primary',
  autoTheaterMode: false,
  autoDimMode: false,
};

export type AgeRatingBucket = 'G' | 'PG' | 'PG-13' | 'R';

/**
 * Verified ratings for widely searched prestige and classic titles
 */
export const KNOWN_AGE_RATINGS: Record<string, string> = {
  // TV-MA / R (Mature 17+ / 18+)
  'tt0903747': 'TV-MA', // Breaking Bad
  'tt0944947': 'TV-MA', // Game of Thrones
  'tt11198330': 'TV-MA', // House of the Dragon
  'tt0141842': 'TV-MA', // The Sopranos
  'tt0306414': 'TV-MA', // The Wire
  'tt7660850': 'TV-MA', // Succession
  'tt3581920': 'TV-MA', // The Last of Us
  'tt8772296': 'TV-MA', // Euphoria
  'tt0773262': 'TV-MA', // Dexter
  'tt1190634': 'TV-MA', // The Boys
  'tt2802850': 'TV-MA', // Fargo
  'tt2356777': 'TV-MA', // True Detective
  'tt2442560': 'TV-MA', // Peaky Blinders
  'tt2707408': 'TV-MA', // Narcos
  'tt2085059': 'TV-MA', // Black Mirror
  'tt2788316': 'TV-MA', // Shōgun
  'tt11280740': 'TV-MA', // Severance
  'tt14452776': 'TV-MA', // The Bear
  'tt8594324': 'TV-MA', // Chernobyl
  'tt12637874': 'TV-MA', // Fallout
  'tt3032476': 'TV-MA', // Better Call Saul
  'tt10795658': 'TV-MA', // Squid Game
  'tt10986410': 'TV-MA', // Ted Lasso
  'tt4236770': 'TV-MA', // Yellowstone
  'tt2560140': 'TV-MA', // Attack on Titan
  'tt5180504': 'TV-MA', // The Witcher
  'tt15398776': 'R', // Oppenheimer
  'tt0068646': 'R', // The Godfather
  'tt0071562': 'R', // The Godfather Part II
  'tt0110912': 'R', // Pulp Fiction
  'tt0137523': 'R', // Fight Club
  'tt0133093': 'R', // The Matrix
  'tt0172495': 'R', // Gladiator
  'tt2582802': 'R', // Whiplash
  'tt6751668': 'R', // Parasite
  'tt7286456': 'R', // Joker
  'tt1431045': 'R', // Deadpool
  'tt6263850': 'R', // Deadpool & Wolverine
  'tt0993846': 'R', // The Wolf of Wall Street
  'tt0099685': 'R', // Goodfellas
  'tt0111161': 'R', // The Shawshank Redemption
  'tt0108052': 'R', // Schindler's List
  'tt0120815': 'R', // Saving Private Ryan
  'tt0114369': 'R', // Se7en
  'tt0102926': 'R', // The Silence of the Lambs
  'tt0407887': 'R', // The Departed
  'tt0361748': 'R', // Inglourious Basterds
  'tt1853728': 'R', // Django Unchained

  // PG-13 / TV-14 (Teens 13+)
  'tt4574334': 'TV-14', // Stranger Things
  'tt11126994': 'TV-14', // Arcane
  'tt0108778': 'TV-14', // Friends
  'tt0386676': 'TV-14', // The Office
  'tt15239678': 'PG-13', // Dune: Part Two
  'tt1160419': 'PG-13', // Dune
  'tt0816692': 'PG-13', // Interstellar
  'tt1375666': 'PG-13', // Inception
  'tt0468569': 'PG-13', // The Dark Knight
  'tt1345836': 'PG-13', // The Dark Knight Rises
  'tt0372784': 'PG-13', // Batman Begins
  'tt1745960': 'PG-13', // Top Gun: Maverick
  'tt4154796': 'PG-13', // Avengers: Endgame
  'tt4154756': 'PG-13', // Avengers: Infinity War
  'tt0120338': 'PG-13', // Titanic

  // PG / TV-PG (Parental Guidance)
  'tt0417299': 'TV-PG', // Avatar: The Last Airbender
  'tt1442437': 'TV-PG', // Modern Family
  'tt9362722': 'PG', // Spider-Man: Across the Spider-Verse
  'tt4633694': 'PG', // Spider-Man: Into the Spider-Verse
  'tt0245429': 'PG', // Spirited Away
  'tt0088763': 'PG', // Back to the Future
  'tt1049413': 'PG', // Up
  'tt2380307': 'PG', // Coco
  'tt0317705': 'PG', // The Incredibles

  // G / TV-G / TV-Y (Family / Kids)
  'tt7678620': 'TV-Y', // Bluey
  'tt0206512': 'TV-Y7', // SpongeBob SquarePants
  'tt0910970': 'G', // WALL·E
  'tt0110357': 'G', // The Lion King
  'tt0114709': 'G', // Toy Story
  'tt0120363': 'G', // Toy Story 2
  'tt0435761': 'G', // Toy Story 3
  'tt0266543': 'G', // Finding Nemo
  'tt0382932': 'G', // Ratatouille
  'tt0198781': 'G', // Monsters, Inc.
};

const KNOWN_TITLE_KEYWORDS_MATURE = [
  'breaking bad',
  'game of thrones',
  'house of the dragon',
  'the sopranos',
  'sopranos',
  'the wire',
  'succession',
  'the last of us',
  'euphoria',
  'dexter',
  'the boys',
  'fargo',
  'true detective',
  'peaky blinders',
  'narcos',
  'black mirror',
  'shogun',
  'shōgun',
  'severance',
  'the bear',
  'chernobyl',
  'fallout',
  'better call saul',
  'squid game',
  'yellowstone',
  'ozark',
  'boardwalk empire',
  'oppenheimer',
  'godfather',
  'pulp fiction',
  'fight club',
  'matrix',
  'gladiator',
  'whiplash',
  'parasite',
  'joker',
  'deadpool',
  'wolf of wall street',
  'goodfellas',
  'shawshank redemption',
  'schindler',
  'saving private ryan',
  'se7en',
  'silence of the lambs',
  'the departed',
  'inglourious basterds',
  'django unchained',
  'scarface',
  'alien',
  'terminator',
  'the shining',
  'kill bill',
  'john wick',
];

/**
 * Resolves or detects an item's true age rating based on verified database,
 * ID lookup, title heuristics, and genre metadata.
 */
export function resolveItemAgeRating(item: Partial<MediaItem>): string {
  if (item.ageRating && item.ageRating.trim()) {
    return item.ageRating.trim();
  }

  if (item.imdbId && KNOWN_AGE_RATINGS[item.imdbId]) {
    return KNOWN_AGE_RATINGS[item.imdbId];
  }

  if (item.id && KNOWN_AGE_RATINGS[item.id]) {
    return KNOWN_AGE_RATINGS[item.id];
  }

  const t = (item.title || '').toLowerCase().trim();
  for (const kw of KNOWN_TITLE_KEYWORDS_MATURE) {
    if (t.includes(kw)) {
      return item.type === 'tv' ? 'TV-MA' : 'R';
    }
  }

  // Genre cues
  const genres = (item.genres || []).map((g) => g.toLowerCase());
  if (genres.some((g) => g.includes('animation') || g.includes('family') || g.includes('children'))) {
    return 'PG';
  }

  if (genres.some((g) => g.includes('horror') || g.includes('crime') || g.includes('erotica') || g.includes('thriller'))) {
    return item.type === 'tv' ? 'TV-MA' : 'R';
  }

  return 'PG-13';
}

/**
 * Normalizes any movie or TV rating string into one of four standard rating buckets:
 * - 'G': G, TV-G, TV-Y, TV-Y7, U
 * - 'PG': PG, TV-PG
 * - 'PG-13': PG-13, TV-14, 12+, 13+, 14+
 * - 'R': R, TV-MA, MA, MA15+, MA-15+, NC-17, 18+, 18, M (Mature)
 */
export function getRatingBucket(rawRating?: string): AgeRatingBucket {
  if (!rawRating) return 'PG-13';
  const r = rawRating.toUpperCase().trim();

  // 1. Mature (R, TV-MA, MA, MA15+, NC-17, 18+, M, etc.)
  if (
    r === 'R' ||
    r === 'TV-MA' ||
    r === 'MA' ||
    r === 'MA15+' ||
    r === 'MA 15+' ||
    r === 'MA-15+' ||
    r === 'M15+' ||
    r === 'M' ||
    r === 'R18+' ||
    r === 'R-18+' ||
    r === 'NC-17' ||
    r === 'NC' ||
    r === '18+' ||
    r === '18' ||
    r.includes('TV-MA') ||
    r.includes('18+') ||
    r.startsWith('TV-MA') ||
    r.startsWith('NC') ||
    r.startsWith('MA') ||
    r.includes('MATURE') ||
    r.includes('RESTRICTED') ||
    r.includes('ADULT') ||
    r === 'X' ||
    r === 'XXX'
  ) {
    return 'R';
  }

  // 2. Teens (PG-13, TV-14, 13+, 14+, 12+)
  if (
    r === 'PG-13' ||
    r === 'TV-14' ||
    r.includes('13+') ||
    r.includes('14') ||
    r.startsWith('PG-13') ||
    r.startsWith('TV-14') ||
    r.includes('TEEN') ||
    r === '12' ||
    r === '12+'
  ) {
    return 'PG-13';
  }

  // 3. Parental Guidance (PG, TV-PG)
  if (r === 'PG' || r === 'TV-PG' || r.startsWith('TV-PG') || r.includes('PG')) {
    return 'PG';
  }

  // 4. General / Family (G, TV-G, TV-Y, TV-Y7, ALL, FAMILY, U)
  if (r === 'G' || r === 'TV-G' || r.startsWith('TV-Y') || r === 'ALL' || r.includes('FAMILY') || r === 'U') {
    return 'G';
  }

  return 'PG-13';
}

/**
 * Checks if age restrictions are active globally or locally.
 */
export function hasActiveAgeRestriction(userSettings?: UserSettings, localFilter: string = 'ALL'): boolean {
  if (localFilter === 'FAMILY' || localFilter === 'TEEN' || localFilter === 'MATURE') return true;
  if (!userSettings) return false;
  if (userSettings.maxRatingTier === 'FAMILY' || userSettings.maxRatingTier === 'TEEN') return true;
  if (userSettings.allowedRatings && userSettings.allowedRatings.length > 0) {
    const allowed = userSettings.allowedRatings.map(getRatingBucket);
    if (!allowed.includes('R')) return true;
  }
  return false;
}

/**
 * Checks if a media item is permitted by both global user settings (parental controls)
 * and an optional active page filter.
 *
 * When age restrictions are active, restricted titles return false and MUST NOT show up.
 */
export function matchesAgeFilter(
  item: MediaItem,
  filterId: string = 'ALL',
  userSettings?: UserSettings
): boolean {
  const resolvedRating = resolveItemAgeRating(item);
  const bucket = getRatingBucket(resolvedRating);

  // 1. Strict Parental Controls (UserSettings)
  if (userSettings) {
    // Check max tier preset
    if (userSettings.maxRatingTier === 'FAMILY') {
      // Family mode strictly permits only G and PG
      if (bucket === 'PG-13' || bucket === 'R') {
        return false;
      }
    } else if (userSettings.maxRatingTier === 'TEEN') {
      // Teen mode strictly permits G, PG, and PG-13 (R / TV-MA / MA is blocked)
      if (bucket === 'R') {
        return false;
      }
    }

    // Check individual allowed ratings
    if (userSettings.allowedRatings && userSettings.allowedRatings.length > 0) {
      const allowedBuckets = userSettings.allowedRatings.map(getRatingBucket);
      if (!allowedBuckets.includes(bucket)) {
        return false;
      }
    }
  }

  // 2. Active Tab / Grid Filter
  if (!filterId || filterId === 'ALL') {
    return true;
  }

  if (filterId === 'FAMILY') {
    return bucket === 'G' || bucket === 'PG';
  }

  if (filterId === 'TEEN') {
    return bucket === 'PG-13';
  }

  if (filterId === 'MATURE') {
    // If global parental settings forbid mature, user cannot bypass via local filter
    if (userSettings && (userSettings.maxRatingTier === 'FAMILY' || userSettings.maxRatingTier === 'TEEN')) {
      return false;
    }
    if (userSettings?.allowedRatings && !userSettings.allowedRatings.map(getRatingBucket).includes('R')) {
      return false;
    }
    return bucket === 'R';
  }

  return bucket === getRatingBucket(filterId);
}

/**
 * Human-readable description of rating bucket
 */
export function getRatingBucketDescription(bucket: AgeRatingBucket): { label: string; desc: string } {
  switch (bucket) {
    case 'G':
      return { label: 'G / TV-G', desc: 'General Audiences · All ages admitted' };
    case 'PG':
      return { label: 'PG / TV-PG', desc: 'Parental Guidance Suggested · Mild thematic elements' };
    case 'PG-13':
      return { label: 'PG-13 / TV-14', desc: 'Parents Strongly Cautioned · Teens 13+' };
    case 'R':
      return { label: 'R / TV-MA / MA', desc: 'Mature Audiences Only · Restricted 17+ / MA15+' };
  }
}
