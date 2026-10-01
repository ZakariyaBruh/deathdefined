import { Bookmark, BookmarkCheck, Play, Star } from 'lucide-react';
import type { MediaItem } from '../../types';
import { inWatchlist, openDetails, playMedia, toggleWatchlist, useOS } from '../store';
import { resolveItemAgeRating } from '../../utils/ageFilter';
import { showContextMenu } from '../shell/ctx';
import { Poster } from './bits';

export function MediaCard({ media, width, rank }: { media: MediaItem; width?: number; rank?: number }) {
  const saved = useOS((s) => inWatchlist(s, media.id));
  return (
    <div
      className="group shrink-0"
      style={width ? { width } : undefined}
      onContextMenu={(e) => showContextMenu(e, [
        { label: 'Play', icon: <Play size={14} />, onClick: () => playMedia(media) },
        { label: 'Details', onClick: () => openDetails(media) },
        { label: saved ? 'Remove from Watchlist' : 'Add to Watchlist', icon: <Bookmark size={14} />, onClick: () => toggleWatchlist(media) },
      ])}
    >
      <Poster media={media} onClick={() => openDetails(media)} className="aspect-[2/3] rounded-xl ring-1 ring-[var(--border)] transition duration-200 group-hover:scale-[1.03] group-hover:ring-[var(--fg-3)]">
        {rank && <div className="absolute left-0 top-0 rounded-br-lg bg-black/75 px-2 py-0.5 text-[11px] font-bold text-white">#{rank}</div>}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 pt-10 opacity-0 transition group-hover:opacity-100">
          <button aria-label={`Play ${media.title}`} onClick={(e) => { e.stopPropagation(); playMedia(media); }} className="grid h-8 w-8 place-items-center rounded-full bg-white text-black hover:scale-110"><Play size={14} fill="currentColor" className="ml-0.5" /></button>
          <button aria-label="Toggle watchlist" onClick={(e) => { e.stopPropagation(); toggleWatchlist(media); }} className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/35">{saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}</button>
        </div>
      </Poster>
      <div className="mt-1.5 cursor-pointer px-0.5" onClick={() => openDetails(media)}>
        <div className="truncate text-[13px] font-semibold">{media.title}</div>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--fg-2)]">
          <span>{media.year}</span>
          <span className="flex items-center gap-0.5"><Star size={10} className="text-amber-400" fill="currentColor" />{media.rating.toFixed(1)}</span>
          <span className="rounded border border-[var(--border)] px-1 text-[9px]">{resolveItemAgeRating(media)}</span>
        </div>
      </div>
    </div>
  );
}
