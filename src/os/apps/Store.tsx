import { ChevronLeft, ChevronRight, Compass, Film, Flame, Info, Loader2, Play, Search, Trophy, Tv } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { WinState } from '../types';
import type { MediaItem } from '../../types';
import { CATALOG, allGenres, localSearch, useAllowed, useSearch } from '../catalog';
import { openDetails, playMedia, useOS } from '../store';
import { MediaCard } from '../ui/MediaCard';
import { Btn, Empty, Pill } from '../ui/bits';
import { useWidth } from '../ui/hooks';
import { matchesAgeFilter } from '../../utils/ageFilter';

type View = { k: 'discover' | 'movies' | 'tv' | 'top' | 'trending' } | { k: 'genre'; v: string } | { k: 'decade'; v: number };

function Row({ title, items, ranked }: { title: string; items: MediaItem[]; ranked?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!items.length) return null;
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * 640, behavior: 'smooth' });
  return (
    <section className="group/row">
      <div className="mb-2 flex items-center justify-between px-6">
        <h3 className="text-[15px] font-bold">{title}</h3>
        <div className="flex gap-1 opacity-0 transition group-hover/row:opacity-100">
          <button aria-label="Scroll left" onClick={() => scroll(-1)} className="rounded-full bg-[var(--fill-2)] p-1 hover:bg-[var(--fill-3)]"><ChevronLeft size={16} /></button>
          <button aria-label="Scroll right" onClick={() => scroll(1)} className="rounded-full bg-[var(--fill-2)] p-1 hover:bg-[var(--fill-3)]"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar flex gap-3.5 overflow-x-auto px-6 pb-2">
        {items.map((m, i) => <MediaCard key={m.id} media={m} width={142} rank={ranked ? i + 1 : undefined} />)}
      </div>
    </section>
  );
}

function Hero({ items }: { items: MediaItem[] }) {
  const [i, setI] = useState(0);
  useEffect(() => { const t = window.setInterval(() => setI((v) => v + 1), 9000); return () => window.clearInterval(t); }, []);
  if (!items.length) return null;
  const m = items[i % items.length];
  return (
    <div className="relative mx-6 mb-6 mt-4 h-[300px] overflow-hidden rounded-2xl ring-1 ring-[var(--border)]">
      {items.map((x, n) => (
        <img key={x.id} src={x.backdropUrl} alt="" draggable={false} onError={(e) => { e.currentTarget.style.display = "none"; }} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${x.id === m.id ? 'opacity-100' : 'opacity-0'}`} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute inset-y-0 left-0 flex max-w-[560px] flex-col justify-end gap-2 p-6 text-white">
        <div className="flex items-center gap-2"><Pill className="!bg-white/20 !text-white">{m.type === 'tv' ? 'SERIES' : 'FILM'}</Pill><span className="text-[12px] text-white/70">{m.year} · {m.duration} · ★ {m.rating.toFixed(1)}</span></div>
        <h2 className="font-[var(--font-display)] text-4xl font-extrabold leading-tight tracking-tight">{m.title}</h2>
        {m.tagline && <div className="text-[13px] italic text-white/70">{m.tagline}</div>}
        <p className="line-clamp-2 text-[13px] text-white/80">{m.synopsis}</p>
        <div className="mt-1 flex gap-2">
          <Btn variant="primary" onClick={() => playMedia(m)} className="!px-4 !py-2"><Play size={14} fill="currentColor" />Play</Btn>
          <Btn onClick={() => openDetails(m)} className="!bg-white/20 !px-4 !py-2 !text-white hover:!bg-white/30"><Info size={14} />More info</Btn>
        </div>
      </div>
      <div className="absolute bottom-3 right-4 flex gap-1.5">
        {items.map((x, n) => <button key={x.id} aria-label={`Show ${x.title}`} onClick={() => setI(n)} className={`h-1.5 rounded-full transition-all ${x.id === m.id ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`} />)}
      </div>
    </div>
  );
}

export default function Store({ win }: { win: WinState }) {
  const items = useAllowed(CATALOG);
  const parental = useOS((s) => s.settings.parental);
  const [view, setView] = useState<View>({ k: 'discover' });
  const [q, setQ] = useState((win.props?.query as string) ?? '');
  const [ref, width] = useWidth<HTMLDivElement>();
  const compact = width < 640;
  const { results: online, loading } = useSearch(q);

  const genres = useMemo(() => allGenres(items).slice(0, 12), [items]);
  const decades = useMemo(() => [...new Set(items.map((m) => Math.floor(m.year / 10) * 10))].sort((a, b) => b - a), [items]);
  const movies = items.filter((m) => m.type === 'movie');
  const shows = items.filter((m) => m.type === 'tv');
  const byRating = [...items].sort((a, b) => b.rating - a.rating);
  const trending = [...items].filter((m) => m.trendingRank).sort((a, b) => a.trendingRank! - b.trendingRank!);
  const featured = items.filter((m) => m.featured).slice(0, 5);

  const searching = q.trim().length > 0;
  const searchItems = useMemo(() => {
    if (!searching) return [];
    const seen = new Set<string>();
    const local = localSearch(q, items);
    local.forEach((m) => seen.add(m.id));
    return [...local, ...online.filter((m) => !seen.has(m.id) && matchesAgeFilter(m, 'ALL', parental))];
  }, [q, items, online, parental, searching]);

  let list: MediaItem[] = [];
  let heading = '';
  if (searching) { list = searchItems; heading = `Results for “${q}”`; }
  else if (view.k === 'movies') { list = movies; heading = 'Films'; }
  else if (view.k === 'tv') { list = shows; heading = 'Series'; }
  else if (view.k === 'top') { list = byRating; heading = 'Top Rated'; }
  else if (view.k === 'trending') { list = trending.length ? trending : byRating; heading = 'Trending'; }
  else if (view.k === 'genre') { list = items.filter((m) => m.genres.includes(view.v)); heading = view.v; }
  else if (view.k === 'decade') { list = items.filter((m) => Math.floor(m.year / 10) * 10 === view.v); heading = `${view.v}s`; }

  const nav = [
    { v: { k: 'discover' } as View, label: 'Discover', icon: <Compass size={15} /> },
    { v: { k: 'trending' } as View, label: 'Trending', icon: <Flame size={15} /> },
    { v: { k: 'movies' } as View, label: 'Films', icon: <Film size={15} /> },
    { v: { k: 'tv' } as View, label: 'Series', icon: <Tv size={15} /> },
    { v: { k: 'top' } as View, label: 'Top Rated', icon: <Trophy size={15} /> },
  ];
  const isActive = (v: View) => !searching && v.k === view.k && (v as any).v === (view as any).v;
  const itemCls = (a: boolean) => `flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] ${a ? 'bg-[var(--fill-3)] font-semibold' : 'text-[var(--fg-2)] hover:bg-[var(--fill)]'}`;

  return (
    <div ref={ref} className="flex h-full">
      {!compact && (
        <aside className="w-[190px] shrink-0 overflow-y-auto border-r border-[var(--border)] p-2.5" style={{ background: 'var(--sidebar)' }}>
          <div className="space-y-0.5">{nav.map((n) => <button key={n.label} onClick={() => { setQ(''); setView(n.v); }} className={itemCls(isActive(n.v))}>{n.icon}{n.label}</button>)}</div>
          <div className="mb-1 mt-4 px-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--fg-3)]">Genres</div>
          <div className="space-y-0.5">{genres.map((g) => <button key={g} onClick={() => { setQ(''); setView({ k: 'genre', v: g }); }} className={itemCls(isActive({ k: 'genre', v: g }))}>{g}</button>)}</div>
          <div className="mb-1 mt-4 px-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--fg-3)]">Decades</div>
          <div className="space-y-0.5">{decades.map((d) => <button key={d} onClick={() => { setQ(''); setView({ k: 'decade', v: d }); }} className={itemCls(isActive({ k: 'decade', v: d }))}>{d}s</button>)}</div>
        </aside>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-[var(--border)] p-2.5">
          {compact && (
            <select aria-label="Section" value={view.k === 'genre' || view.k === 'decade' ? `${view.k}:${view.v}` : view.k} onChange={(e) => { const [k, v] = e.target.value.split(':'); setQ(''); setView(k === 'genre' ? { k, v } : k === 'decade' ? { k, v: +v } : ({ k } as View)); }} className="rounded-lg bg-[var(--fill)] px-2 py-1.5 text-[13px] outline-none">
              {nav.map((n) => <option key={n.label} value={n.v.k}>{n.label}</option>)}
              {genres.map((g) => <option key={g} value={`genre:${g}`}>{g}</option>)}
            </select>
          )}
          <div className="flex flex-1 items-center gap-2 rounded-lg bg-[var(--fill)] px-3 py-1.5">
            <Search size={14} className="text-[var(--fg-3)]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search every film and series ever made" className="w-full bg-transparent text-[13px] outline-none placeholder:text-[var(--fg-3)]" />
            {loading && <Loader2 size={14} className="animate-spin text-[var(--fg-3)]" />}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-8">
          {!searching && view.k === 'discover' ? (
            <div className="space-y-7">
              <Hero items={featured.length ? featured : byRating.slice(0, 4)} />
              <Row title="Trending now" items={trending} ranked />
              <Row title="Critically acclaimed" items={byRating.slice(0, 14)} />
              <Row title="Series to binge" items={shows} />
              {genres.slice(0, 4).map((g) => <Row key={g} title={g} items={items.filter((m) => m.genres.includes(g))} />)}
              <Row title="Films" items={movies} />
            </div>
          ) : (
            <div className="p-6">
              <h2 className="mb-4 text-xl font-bold">{heading}<span className="ml-2 text-sm font-normal text-[var(--fg-3)]">{list.length}</span></h2>
              {list.length === 0 ? (
                loading ? <Empty icon={<Loader2 className="animate-spin" />} title="Searching the archive…" /> : <Empty icon={<Search size={28} />} title="Nothing found" hint={parental.maxRatingTier !== 'ALL' ? 'Parental controls are hiding some titles.' : 'Try a different title, actor or director.'} />
              ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))' }}>
                  {list.map((m) => <MediaCard key={m.id} media={m} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

