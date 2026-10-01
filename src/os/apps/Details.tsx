import { Bookmark, BookmarkCheck, ExternalLink, Play, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { WinState } from '../types';
import type { MediaItem } from '../../types';
import { CATALOG, useAllowed, useLiveMeta } from '../catalog';
import { inWatchlist, playMedia, setWindowTitle, toggleWatchlist, useOS } from '../store';
import { MediaCard } from '../ui/MediaCard';
import { Btn, Pill, Poster, Stars } from '../ui/bits';
import { useWidth } from '../ui/hooks';
import { resolveItemAgeRating } from '../../utils/ageFilter';

export default function Details({ win }: { win: WinState }) {
  const base: MediaItem = win.props.media;
  const { media, loading } = useLiveMeta(base);
  const saved = useOS((s) => inWatchlist(s, media.id));
  const allowed = useAllowed(CATALOG);
  const [season, setSeason] = useState(1);
  const [ref, width] = useWidth<HTMLDivElement>();
  const narrow = width < 640;

  useEffect(() => setWindowTitle(win.id, media.title), [media.title, win.id]);

  const seasons = useMemo(() => {
    if (media.type !== 'tv') return [];
    const fromList = [...new Set((media.episodesList ?? []).map((e) => e.season))].filter((s) => s > 0).sort((a, b) => a - b);
    if (fromList.length) return fromList;
    return Array.from({ length: media.seasons ?? 1 }, (_, i) => i + 1);
  }, [media]);
  useEffect(() => { if (seasons.length && !seasons.includes(season)) setSeason(seasons[0]); }, [seasons, season]);

  const episodes = useMemo(() => {
    const real = (media.episodesList ?? []).filter((e) => e.season === season).sort((a, b) => a.episode - b.episode);
    if (real.length) return real;
    return Array.from({ length: media.episodesPerSeason ?? 10 }, (_, i) => ({ id: `${season}:${i + 1}`, season, episode: i + 1, title: `Episode ${i + 1}`, overview: '', thumbnail: '', released: '', rating: '' }));
  }, [media, season]);

  const similar = useMemo(
    () => allowed.filter((m) => m.id !== media.id).map((m) => ({ m, s: m.genres.filter((g) => media.genres.includes(g)).length + (m.type === media.type ? 0.5 : 0) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 12).map((x) => x.m),
    [allowed, media],
  );

  return (
    <div ref={ref} className="h-full overflow-y-auto">
      <div className="relative h-[250px]">
        <img src={media.backdropUrl} alt="" draggable={false} onError={(e) => { e.currentTarget.style.display = "none"; }} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--win-solid)] via-[var(--win-solid)]/40 to-black/30" />
      </div>
      <div className={`relative -mt-28 flex gap-6 px-7 ${narrow ? 'flex-col items-start' : ''}`}>
        <Poster media={media} className="aspect-[2/3] w-[160px] shrink-0 rounded-xl shadow-2xl ring-1 ring-white/20" />
        <div className="min-w-0 flex-1 pt-2">
          <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--fg-2)]">
            <Pill>{media.type === 'tv' ? 'SERIES' : 'FILM'}</Pill>
            <span>{media.year}</span><span>·</span><span>{media.duration}</span><span>·</span>
            <span className="flex items-center gap-1"><Star size={11} className="text-amber-400" fill="currentColor" />{media.rating.toFixed(1)}</span>
            <Pill className="!border !border-[var(--border)] !bg-transparent">{resolveItemAgeRating(media)}</Pill>
          </div>
          <h1 className="mt-1.5 font-[var(--font-display)] text-[32px] font-extrabold leading-tight tracking-tight">{media.title}</h1>
          {media.tagline && <div className="text-[13px] italic text-[var(--fg-2)]">{media.tagline}</div>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Btn variant="primary" onClick={() => playMedia(media, media.type === 'tv' ? season : 1, 1)} className="!px-4 !py-2"><Play size={14} fill="currentColor" />{media.type === 'tv' ? 'Play S1·E1' : 'Play'}</Btn>
            <Btn variant="soft" onClick={() => toggleWatchlist(media)} className="!px-3.5 !py-2">{saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}{saved ? 'In Watchlist' : 'Watchlist'}</Btn>
            <Btn variant="ghost" onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(media.title + ' ' + media.year + ' trailer')}`, '_blank', 'noopener')} className="!py-2"><ExternalLink size={13} />Trailer</Btn>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[12px] text-[var(--fg-2)]">Your rating <Stars id={media.id} /></div>
        </div>
      </div>

      <div className="space-y-6 px-7 py-6">
        <p className="selectable max-w-3xl text-[14px] leading-relaxed text-[var(--fg)]/90">{media.synopsis}</p>
        {media.curatorNote && <blockquote className="max-w-3xl rounded-xl border-l-2 border-[var(--accent)] bg-[var(--fill)] p-3 text-[13px] italic text-[var(--fg-2)]"><div className="mb-1 text-[10px] font-bold not-italic uppercase tracking-widest text-[var(--fg-3)]">Curator’s note</div>{media.curatorNote}</blockquote>}
        <dl className="grid gap-x-8 gap-y-3 text-[13px]" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
          {media.director && <div><dt className="text-[11px] uppercase tracking-wider text-[var(--fg-3)]">Director</dt><dd className="selectable">{media.director}</dd></div>}
          {media.cast.length > 0 && <div><dt className="text-[11px] uppercase tracking-wider text-[var(--fg-3)]">Cast</dt><dd className="selectable">{media.cast.slice(0, 6).join(', ')}</dd></div>}
          <div><dt className="text-[11px] uppercase tracking-wider text-[var(--fg-3)]">Genres</dt><dd>{media.genres.join(', ')}</dd></div>
          {media.country && <div><dt className="text-[11px] uppercase tracking-wider text-[var(--fg-3)]">Country</dt><dd>{media.country}</dd></div>}
          {media.awards && <div><dt className="text-[11px] uppercase tracking-wider text-[var(--fg-3)]">Awards</dt><dd>{media.awards}</dd></div>}
        </dl>

        {media.type === 'tv' && (
          <section>
            <div className="mb-3 flex items-center gap-3">
              <h3 className="text-[15px] font-bold">Episodes</h3>
              <select aria-label="Season" value={season} onChange={(e) => setSeason(+e.target.value)} className="rounded-lg bg-[var(--fill-2)] px-2.5 py-1 text-[13px] outline-none">
                {seasons.map((s) => <option key={s} value={s}>Season {s}</option>)}
              </select>
              {loading && <span className="text-[12px] text-[var(--fg-3)]">Loading guide…</span>}
            </div>
            <div className="space-y-1.5">
              {episodes.map((e) => (
                <button key={e.id} onClick={() => playMedia(media, e.season, e.episode)} className="group flex w-full items-center gap-3 rounded-xl bg-[var(--fill)] p-2 text-left hover:bg-[var(--fill-2)]">
                  <div className="relative h-[54px] w-24 shrink-0 overflow-hidden rounded-lg bg-[var(--fill-2)]">
                    {e.thumbnail && <img src={e.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />}
                    <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100"><Play size={18} className="text-white" fill="currentColor" /></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold">{e.episode}. {e.title}</div>
                    {e.overview && <div className="line-clamp-2 text-[12px] text-[var(--fg-2)]">{e.overview}</div>}
                  </div>
                  {e.released && <div className="shrink-0 pr-2 text-[11px] text-[var(--fg-3)]">{new Date(e.released).getFullYear() || ''}</div>}
                </button>
              ))}
            </div>
          </section>
        )}

        {similar.length > 0 && (
          <section>
            <h3 className="mb-3 text-[15px] font-bold">More like this</h3>
            <div className="no-scrollbar -mx-1 flex gap-3.5 overflow-x-auto px-1 pb-2">{similar.map((m) => <MediaCard key={m.id} media={m} width={130} />)}</div>
          </section>
        )}
      </div>
    </div>
  );
}

