import { BarChart3, Clock, Film, Star, Tv } from 'lucide-react';
import { useMemo } from 'react';
import type { WinState } from '../types';
import { runtimeMinutes } from '../catalog';
import { useOS } from '../store';
import { Empty } from '../ui/bits';

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--fill)] p-4">
      <div className="mb-2 text-[var(--fg-3)]">{icon}</div>
      <div className="font-[var(--font-display)] text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-[12px] text-[var(--fg-2)]">{label}</div>
    </div>
  );
}

export default function Insights(_: { win: WinState }) {
  const history = useOS((s) => s.history);
  const watchlist = useOS((s) => s.watchlist);
  const ratings = useOS((s) => s.ratings);

  const d = useMemo(() => {
    const genres = new Map<string, number>();
    let minutes = 0, films = 0, shows = 0;
    history.forEach((h) => {
      h.media.genres.forEach((g) => genres.set(g, (genres.get(g) ?? 0) + 1));
      h.media.type === 'tv' ? shows++ : films++;
      minutes += h.media.type === 'tv' ? 45 : runtimeMinutes(h.media.duration) || 110;
    });
    const days = Array.from({ length: 14 }, (_, i) => {
      const day = new Date(Date.now() - (13 - i) * 864e5);
      const key = day.toDateString();
      return { label: day.toLocaleDateString([], { weekday: 'narrow' }), n: history.filter((h) => new Date(h.timestamp).toDateString() === key).length };
    });
    const vals = Object.values(ratings);
    return { genres: [...genres.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8), minutes, films, shows, days, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
  }, [history, ratings]);

  if (!history.length && !watchlist.length) return <Empty icon={<BarChart3 size={34} />} title="No data yet" hint="Watch something and your habits will be charted here." />;
  const maxG = Math.max(1, ...d.genres.map((g) => g[1]));
  const maxD = Math.max(1, ...d.days.map((x) => x.n));

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <Stat icon={<Clock size={18} />} label="Estimated watch time" value={`${Math.floor(d.minutes / 60)}h ${d.minutes % 60}m`} />
        <Stat icon={<Film size={18} />} label="Films played" value={String(d.films)} />
        <Stat icon={<Tv size={18} />} label="Episodes played" value={String(d.shows)} />
        <Stat icon={<Star size={18} />} label="Average rating given" value={d.avg ? d.avg.toFixed(1) : '—'} />
      </div>

      <div className="mt-5 rounded-2xl bg-[var(--fill)] p-4">
        <h3 className="mb-3 text-[13px] font-bold">Last 14 days</h3>
        <svg viewBox="0 0 280 90" className="h-28 w-full" role="img" aria-label="Plays per day">
          {d.days.map((x, i) => {
            const h = (x.n / maxD) * 60;
            return (
              <g key={i}>
                <rect x={i * 20 + 3} y={70 - h} width={14} height={Math.max(h, 2)} rx={3} fill="var(--accent)" opacity={x.n ? 1 : 0.2} />
                <text x={i * 20 + 10} y={84} textAnchor="middle" fontSize={7} fill="var(--fg-3)">{x.label}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-5 rounded-2xl bg-[var(--fill)] p-4">
        <h3 className="mb-3 text-[13px] font-bold">Favourite genres</h3>
        {d.genres.length === 0 ? <div className="text-[12px] text-[var(--fg-3)]">Play something to see your taste.</div> : (
          <div className="space-y-2">
            {d.genres.map(([g, n]) => (
              <div key={g} className="flex items-center gap-3 text-[12px]">
                <div className="w-24 shrink-0 truncate text-[var(--fg-2)]">{g}</div>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--fill-2)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${(n / maxG) * 100}%` }} /></div>
                <div className="w-5 text-right tabular-nums">{n}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
