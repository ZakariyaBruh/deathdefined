import { Check, Download, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { WinState } from '../types';
import { installable, type AppMeta } from '../appMeta';
import { installApp, openApp, uninstallApp, useOS } from '../store';
import { Btn, Segmented } from '../ui/bits';
import { AppIcon } from '../ui/icons';
import { useWidth } from '../ui/hooks';

const DETAILS: Record<string, { long: string; bullets: string[] }> = {
  directplay: { long: 'Paste any IMDb ID or link and watch it instantly — even titles outside the catalog.', bullets: ['Understands full imdb.com links', 'Film or series', 'Opens in the Cinema player'] },
  insights: { long: 'See how you watch: hours viewed, favourite genres and a 14-day activity chart.', bullets: ['Genre breakdown', 'Daily activity', 'Average rating you give'] },
  trivia: { long: 'Ten-question cinema quizzes generated from the archive: years, directors, taglines and casts.', bullets: ['New quiz every round', 'Best score saved', 'Built from the catalog'] },
  snake: { long: 'The classic. A fine way to fill the intermission.', bullets: ['Arrow keys or WASD', 'On-screen pad on touch', 'High score saved'] },
  terminal: { long: 'A shell for CineStream. Play titles, manage your watchlist and change settings by typing.', bullets: ['About 45 commands', 'Tab completion & history', 'Virtual filesystem'] },
  notes: { long: 'Keep reviews, quotes and watch-lists. Insert titles from your watchlist in one tap.', bullets: ['Pinned notes & search', 'Autosaves', 'Stored privately on this device'] },
  files: { long: 'Browse your watchlist, history, notes and the archive as folders and files.', bullets: ['Grid and list views', 'Quick delete', 'Opens items in their apps'] },
  calculator: { long: 'Arithmetic with a proper keypad and keyboard support.', bullets: ['Live result preview', 'Keyboard input'] },
  clock: { long: 'World clock, stopwatch and a sleep timer that nudges you when the film should be over.', bullets: ['9 time zones', 'Lap timer', 'Movie-length presets'] },
  monitor: { long: 'See running apps, frame rate and memory, and test which streaming server is fastest for you.', bullets: ['Server latency test', 'FPS and memory graphs', 'Force-quit apps'] },
};

export default function AppStore({ win }: { win: WinState }) {
  const installed = useOS((s) => s.settings.installed);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'discover' | 'installed'>('discover');
  const [ref, width] = useWidth<HTMLDivElement>();
  const focus = win.props?.focus as string | undefined;
  const [open, setOpen] = useState<string | null>(focus ?? null);
  useEffect(() => { if (focus) setOpen(focus); }, [focus]);

  const all = useMemo(() => installable(), []);
  const list = all.filter((a) => (tab === 'installed' ? installed.includes(a.id) : true) && (a.name + a.blurb + a.category).toLowerCase().includes(q.toLowerCase()));
  const cats = [...new Set(list.map((a) => a.category))];
  const sel = all.find((a) => a.id === open) ?? null;
  const cols = width < 560 ? 1 : width < 860 ? 2 : 3;

  const Action = ({ a, big }: { a: AppMeta; big?: boolean }) => {
    const has = installed.includes(a.id);
    return has
      ? <div className="flex gap-1.5"><Btn variant="primary" onClick={() => openApp(a.id)} className={big ? '!px-5 !py-2' : '!px-3.5'}>Open</Btn>{big && <Btn variant="danger" onClick={() => uninstallApp(a.id)}><Trash2 size={13} />Remove</Btn>}</div>
      : <Btn variant="soft" onClick={() => installApp(a.id)} className={`!rounded-full !font-bold !text-[var(--accent)] ${big ? '!px-6 !py-2' : '!px-4'}`}><Download size={13} />Get</Btn>;
  };

  if (sel) {
    const d = DETAILS[sel.id];
    return (
      <div className="h-full overflow-y-auto p-6">
        <button onClick={() => setOpen(null)} className="mb-5 text-[13px] text-[var(--fg-2)] hover:text-[var(--fg)]">‹ App Store</button>
        <div className="flex flex-wrap items-center gap-5">
          <AppIcon id={sel.id} size={96} />
          <div className="min-w-0 flex-1">
            <h2 className="font-[var(--font-display)] text-3xl font-extrabold">{sel.name}</h2>
            <div className="text-[13px] text-[var(--fg-2)]">{sel.category} · {sel.blurb}</div>
            <div className="mt-3"><Action a={sel} big /></div>
          </div>
        </div>
        {d && (<>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed">{d.long}</p>
          <h3 className="mb-2 mt-6 text-[13px] font-bold uppercase tracking-wider text-[var(--fg-3)]">What’s inside</h3>
          <ul className="space-y-1.5">{d.bullets.map((b) => <li key={b} className="flex items-center gap-2 text-[14px]"><Check size={14} className="text-emerald-400" />{b}</li>)}</ul>
        </>)}
      </div>
    );
  }

  const card = (a: AppMeta) => (
    <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-[var(--fill)] p-3 hover:bg-[var(--fill-2)]">
      <button onClick={() => setOpen(a.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left"><AppIcon id={a.id} size={56} /><span className="min-w-0"><span className="block truncate text-[14px] font-semibold">{a.name}</span><span className="line-clamp-2 text-[12px] text-[var(--fg-2)]">{a.blurb}</span></span></button>
      <Action a={a} />
    </div>
  );

  const feat = all.find((a) => a.id === 'trivia')!;
  return (
    <div ref={ref} className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] p-3">
        <Segmented<'discover' | 'installed'> value={tab} onChange={setTab} options={[{ id: 'discover', label: 'Discover' }, { id: 'installed', label: `Installed (${installed.length})` }]} />
        <div className="flex min-w-[160px] flex-1 items-center gap-2 rounded-lg bg-[var(--fill)] px-3 py-1.5"><Search size={14} className="text-[var(--fg-3)]" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search apps" className="w-full bg-transparent text-[13px] outline-none" /></div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {tab === 'discover' && !q && (
          <button onClick={() => setOpen(feat.id)} className="relative mb-6 flex h-40 w-full items-end overflow-hidden rounded-2xl p-5 text-left text-white" style={{ background: `linear-gradient(120deg, ${feat.from}, ${feat.to})` }}>
            <div className="absolute -right-6 -top-6 opacity-30"><AppIcon id={feat.id} size={190} /></div>
            <div><div className="text-[11px] font-bold uppercase tracking-widest opacity-80">App of the day</div><div className="font-[var(--font-display)] text-3xl font-extrabold">{feat.name}</div><div className="text-[13px] opacity-90">{feat.blurb}</div></div>
          </button>
        )}
        {list.length === 0 && <div className="py-16 text-center text-[13px] text-[var(--fg-3)]">{tab === 'installed' ? 'No extra apps installed yet. Browse Discover to add some.' : 'No apps match your search.'}</div>}
        {cats.map((c) => (
          <section key={c} className="mb-6">
            <h3 className="mb-2 text-[15px] font-bold">{c}</h3>
            <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>{list.filter((a) => a.category === c).map(card)}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
