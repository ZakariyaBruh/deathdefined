import { Bookmark, Clock, History, Play, Star, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { WinState } from '../types';
import { CATALOG, findLocal, timeAgo, useAllowed } from '../catalog';
import { clearHistory, openApp, openDetails, playMedia, toggleWatchlist, useOS } from '../store';
import { MediaCard } from '../ui/MediaCard';
import { Btn, Empty, Poster, Segmented, Stars } from '../ui/bits';
import { matchesAgeFilter } from '../../utils/ageFilter';

type Tab = 'watchlist' | 'history' | 'rated';

export default function Library({ win }: { win: WinState }) {
  const [tab, setTab] = useState<Tab>((win.props?.tab as Tab) ?? 'watchlist');
  const [sort, setSort] = useState<'added' | 'title' | 'rating'>('added');
  const watchlist = useOS((s) => s.watchlist);
  const history = useOS((s) => s.history);
  const ratings = useOS((s) => s.ratings);
  const parental = useOS((s) => s.settings.parental);
  useAllowed(CATALOG);

  const wl = useMemo(() => {
    const l = watchlist.filter((m) => matchesAgeFilter(m, 'ALL', parental));
    return sort === 'title' ? [...l].sort((a, b) => a.title.localeCompare(b.title)) : sort === 'rating' ? [...l].sort((a, b) => b.rating - a.rating) : l;
  }, [watchlist, parental, sort]);
  const hist = history.filter((h) => matchesAgeFilter(h.media, 'ALL', parental));
  const rated = useMemo(() => {
    const pool = new Map<string, any>();
    [...watchlist, ...history.map((h) => h.media), ...CATALOG].forEach((m) => pool.set(m.id, m));
    return Object.entries(ratings).map(([id, stars]) => ({ m: pool.get(id) ?? findLocal(id), stars })).filter((x) => x.m && matchesAgeFilter(x.m, 'ALL', parental)).sort((a, b) => b.stars - a.stars);
  }, [ratings, watchlist, history, parental]);

  const groups = useMemo(() => {
    const g = new Map<string, typeof hist>();
    hist.forEach((h) => {
      const d = new Date(h.timestamp);
      const t = new Date();
      const label = d.toDateString() === t.toDateString() ? 'Today' : d.toDateString() === new Date(t.getTime() - 864e5).toDateString() ? 'Yesterday' : d.toLocaleDateString([], { month: 'long', day: 'numeric' });
      g.set(label, [...(g.get(label) ?? []), h]);
    });
    return [...g.entries()];
  }, [hist]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] p-3">
        <Segmented<Tab> value={tab} onChange={setTab} options={[{ id: 'watchlist', label: `Watchlist (${wl.length})` }, { id: 'history', label: `History (${hist.length})` }, { id: 'rated', label: `Rated (${rated.length})` }]} />
        <div className="flex-1" />
        {tab === 'watchlist' && <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as any)} className="rounded-lg bg-[var(--fill)] px-2 py-1 text-[12px] outline-none"><option value="added">Recently added</option><option value="title">Title</option><option value="rating">Rating</option></select>}
        {tab === 'history' && hist.length > 0 && <Btn variant="danger" onClick={clearHistory}><Trash2 size={13} />Clear</Btn>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {tab === 'watchlist' && (wl.length === 0
          ? <Empty icon={<Bookmark size={32} />} title="Your watchlist is empty" hint="Add titles from CineStore with the bookmark button." />
          : <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))' }}>{wl.map((m) => <MediaCard key={m.id} media={m} />)}</div>)}

        {tab === 'history' && (groups.length === 0
          ? <Empty icon={<History size={32} />} title="Nothing watched yet" hint="Everything you play appears here so you can pick up where you left off." />
          : <div className="space-y-5">{groups.map(([label, items]) => (
              <section key={label}>
                <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[var(--fg-3)]"><Clock size={12} />{label}</h3>
                <div className="space-y-1.5">{items.map((h) => (
                  <div key={h.media.id + h.timestamp} className="group flex items-center gap-3 rounded-xl bg-[var(--fill)] p-2 hover:bg-[var(--fill-2)]">
                    <Poster media={h.media} className="h-[60px] w-10 shrink-0 rounded-md" onClick={() => openDetails(h.media)} />
                    <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold">{h.media.title}</div><div className="text-[12px] text-[var(--fg-2)]">{h.season ? `Season ${h.season} · Episode ${h.episode} · ` : ''}{timeAgo(h.timestamp)}</div></div>
                    <Btn variant="primary" onClick={() => playMedia(h.media, h.season ?? 1, h.episode ?? 1)}><Play size={12} fill="currentColor" />Resume</Btn>
                    <Btn variant="ghost" onClick={() => toggleWatchlist(h.media)} aria-label="Toggle watchlist"><Bookmark size={13} /></Btn>
                  </div>))}</div>
              </section>))}</div>)}

        {tab === 'rated' && (rated.length === 0
          ? <Empty icon={<Star size={32} />} title="No ratings yet" hint="Open any title and give it up to five stars." />
          : <div className="space-y-1.5">{rated.map(({ m, stars }) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl bg-[var(--fill)] p-2">
                <Poster media={m} className="h-[60px] w-10 shrink-0 rounded-md" onClick={() => openDetails(m)} />
                <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold">{m.title}</div><div className="text-[12px] text-[var(--fg-2)]">{m.year} · {stars}/5</div></div>
                <Stars id={m.id} />
              </div>))}</div>)}
      </div>
      <div className="border-t border-[var(--border)] px-4 py-2 text-[11px] text-[var(--fg-3)]">Tip: <button className="underline" onClick={() => openApp('insights')}>Insights</button> charts your habits.</div>
    </div>
  );
}
