import { Play, Shuffle } from 'lucide-react';
import { useMemo } from 'react';
import { CATALOG, fmtTime, useAllowed, useNow } from '../catalog';
import { openApp, openDetails, playMedia, useOS } from '../store';
import { Poster } from '../ui/bits';

const QUOTES: [string, string][] = [
  ["Here's looking at you, kid.", 'Casablanca'],
  ["I'm gonna make him an offer he can't refuse.", 'The Godfather'],
  ['Why so serious?', 'The Dark Knight'],
  ['Get busy living, or get busy dying.', 'The Shawshank Redemption'],
  ['Life is like a box of chocolates.', 'Forrest Gump'],
  ['I am your father.', 'The Empire Strikes Back'],
  ['To infinity and beyond!', 'Toy Story'],
  ["You can't handle the truth!", 'A Few Good Men'],
  ['May the Force be with you.', 'Star Wars'],
  ["After all, tomorrow is another day!", 'Gone with the Wind'],
  ['Just keep swimming.', 'Finding Nemo'],
  ['The greatest trick the devil ever pulled…', 'The Usual Suspects'],
];

export function Widgets() {
  const now = useNow();
  const h24 = useOS((s) => s.settings.clock24);
  const history = useOS((s) => s.history);
  const allowed = useAllowed(CATALOG);
  const d = new Date(now || Date.now());
  const day = Math.floor(d.getTime() / 864e5);
  const pick = useMemo(() => (allowed.length ? allowed[day % allowed.length] : null), [allowed, day]);
  const quote = QUOTES[day % QUOTES.length];

  return (
    <div className="pointer-events-none absolute right-4 top-[42px] hidden w-[260px] flex-col gap-3 lg:flex">
      <div className="glass pointer-events-auto rounded-3xl p-4">
        <div className="text-[44px] font-light leading-none tabular-nums">{fmtTime(d, h24)}</div>
        <div className="mt-1 text-[13px] text-[var(--fg-2)]">{d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      </div>

      {pick && (
        <div className="glass pointer-events-auto overflow-hidden rounded-3xl">
          <div className="relative h-32">
            <img src={pick.backdropUrl} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
            <div className="absolute bottom-2 left-3 right-3 text-white">
              <div className="text-[10px] font-semibold uppercase tracking-widest opacity-70">Tonight’s pick</div>
              <div className="truncate text-[15px] font-bold">{pick.title}</div>
            </div>
          </div>
          <div className="flex gap-2 p-2.5">
            <button onClick={() => playMedia(pick)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] py-1.5 text-[12px] font-semibold text-[var(--accent-fg)]"><Play size={12} fill="currentColor" />Play</button>
            <button onClick={() => openDetails(pick)} className="flex-1 rounded-xl bg-[var(--fill-2)] py-1.5 text-[12px]">Details</button>
          </div>
        </div>
      )}

      <div className="glass pointer-events-auto rounded-3xl p-4">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--fg-3)]">Continue watching</div>
        {history.length === 0 ? (
          <div className="mt-2 text-[12px] text-[var(--fg-2)]">Nothing yet. Open <button className="underline" onClick={() => openApp('store')}>CineStore</button> to begin.</div>
        ) : (
          <div className="mt-2 flex gap-2">
            {history.slice(0, 4).map((h) => (
              <Poster key={h.media.id} media={h.media} onClick={() => playMedia(h.media, h.season ?? 1, h.episode ?? 1)} className="aspect-[2/3] flex-1 rounded-lg" />
            ))}
          </div>
        )}
      </div>

      <div className="glass pointer-events-auto rounded-3xl p-4">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--fg-3)]">Quote of the day</div>
        <div className="mt-1.5 text-[14px] font-medium leading-snug">“{quote[0]}”</div>
        <div className="mt-1 flex items-center justify-between text-[12px] text-[var(--fg-2)]"><span>— {quote[1]}</span><Shuffle size={11} className="opacity-0" /></div>
      </div>
    </div>
  );
}
