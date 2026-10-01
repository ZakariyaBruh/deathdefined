import { Calculator, Link2, Loader2, Lock, Moon, Play, Power, Search, Sun } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { APP_META } from '../appMeta';
import { CATALOG, localSearch, useAllowed, useSearch } from '../catalog';
import { evaluate, fmtNum } from '../math';
import { closePanel, lock, openApp, openDetails, playMedia, restart, setSettings, shutdown, toggleWatchlist, useOS } from '../store';
import { AppIcon } from '../ui/icons';
import { cleanMediaId, isValidMediaId } from '../../utils/servers';
import { createCustomMediaItem } from '../../utils/imdbLookup';
import { matchesAgeFilter } from '../../utils/ageFilter';
import type { MediaItem } from '../../types';

interface Row { id: string; section: string; icon: ReactNode; title: string; sub?: string; run: () => void; alt?: () => void; altHint?: string }

export function Spotlight() {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const theme = useOS((s) => s.settings.theme);
  const notes = useOS((s) => s.notes);
  const parental = useOS((s) => s.settings.parental);
  const allowed = useAllowed(CATALOG);
  const { results: online, loading } = useSearch(q);

  useEffect(() => { input.current?.focus(); }, []);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    const s = q.trim();
    const sl = s.toLowerCase();
    if (!s) return out;
    const calc = evaluate(s);
    if (calc !== null && /[\d]/.test(s) && /[-+*/^%×÷(]/.test(s)) {
      out.push({ id: 'calc', section: 'Calculator', icon: <Calculator size={20} />, title: fmtNum(calc), sub: `${s} =`, run: () => { navigator.clipboard?.writeText(String(calc)); closePanel(); } });
    }
    const direct = cleanMediaId(s);
    if (isValidMediaId(direct) && /tt\d+/i.test(s)) {
      const item = createCustomMediaItem(direct);
      out.push({ id: 'direct', section: 'Direct Play', icon: <Link2 size={20} />, title: `Play ${direct}`, sub: 'Stream by IMDb identifier', run: () => playMedia(item) });
    }
    APP_META.filter((a) => !a.hidden && (a.name.toLowerCase().includes(sl) || a.blurb.toLowerCase().includes(sl)))
      .slice(0, 4).forEach((a) => out.push({ id: `app-${a.id}`, section: 'Applications', icon: <AppIcon id={a.id} size={28} />, title: a.name, sub: a.blurb, run: () => openApp(a.id) }));

    const actions: { t: string; kw: string; icon: ReactNode; run: () => void }[] = [
      { t: 'Lock Screen', kw: 'lock', icon: <Lock size={18} />, run: lock },
      { t: 'Restart', kw: 'restart reboot', icon: <Power size={18} />, run: restart },
      { t: 'Shut Down', kw: 'shutdown power off', icon: <Power size={18} />, run: shutdown },
      { t: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode', kw: 'theme dark light mode appearance', icon: theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />, run: () => setSettings({ theme: theme === 'dark' ? 'light' : 'dark' }) },
      { t: 'Family-safe Mode', kw: 'family kids parental safe', icon: <Lock size={18} />, run: () => setSettings({ parental: { ...parental, maxRatingTier: 'FAMILY' } }) },
      { t: 'Show All Ratings', kw: 'parental all ratings mature', icon: <Lock size={18} />, run: () => setSettings({ parental: { ...parental, maxRatingTier: 'ALL' } }) },
    ];
    actions.filter((a) => a.kw.includes(sl) || a.t.toLowerCase().includes(sl)).forEach((a) => out.push({ id: `act-${a.t}`, section: 'System', icon: a.icon, title: a.t, run: a.run }));

    const seen = new Set<string>();
    const media: { m: MediaItem; source: string }[] = [];
    localSearch(s, allowed).slice(0, 6).forEach((m) => { seen.add(m.id); media.push({ m, source: 'Library' }); });
    online.filter((m) => !seen.has(m.id) && matchesAgeFilter(m, 'ALL', parental)).slice(0, 8).forEach((m) => media.push({ m, source: 'Archive' }));
    media.forEach(({ m, source }) =>
      out.push({
        id: `m-${m.id}`, section: source === 'Library' ? 'Featured Titles' : 'Global Archive',
        icon: <img src={m.posterUrl} alt="" className="h-10 w-7 rounded object-cover bg-neutral-800" />,
        title: m.title, sub: `${m.type === 'tv' ? 'Series' : 'Film'} · ${m.year}${m.cast.length ? ' · ' + m.cast.slice(0, 2).join(', ') : ''}`,
        run: () => openDetails(m), alt: () => playMedia(m), altHint: '⇧↵ play',
      }),
    );
    notes.filter((n) => (n.title + n.body).toLowerCase().includes(sl)).slice(0, 3)
      .forEach((n) => out.push({ id: `n-${n.id}`, section: 'Notes', icon: <AppIcon id="notes" size={28} />, title: n.title, sub: n.body.slice(0, 70), run: () => openApp('notes', { noteId: n.id }) }));
    return out;
  }, [q, online, allowed, theme, notes, parental]);

  useEffect(() => setSel(0), [q]);

  const run = (r?: Row, alt = false) => { if (!r) return; closePanel(); (alt && r.alt ? r.alt : r.run)(); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((i) => Math.min(rows.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') run(rows[sel], e.shiftKey);
    else if (e.key === 'Escape') closePanel();
  };
  useEffect(() => { document.getElementById(`sp-row-${sel}`)?.scrollIntoView({ block: 'nearest' }); }, [sel]);

  let lastSection = '';
  return (
    <div className="fixed inset-0 z-[7000] flex items-start justify-center bg-black/30 px-3 pt-[12vh]" onPointerDown={closePanel}>
      <div className="panel w-full max-w-[640px] overflow-hidden rounded-2xl" onPointerDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Search size={20} className="text-[var(--fg-2)]" />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Search apps, films, series, notes — or do maths" className="w-full bg-transparent text-[17px] outline-none placeholder:text-[var(--fg-3)]" spellCheck={false} />
          {loading && <Loader2 size={16} className="animate-spin text-[var(--fg-3)]" />}
        </div>
        {q.trim() && (
          <div className="max-h-[52vh] overflow-y-auto border-t border-[var(--border)] p-1.5">
            {rows.length === 0 && !loading && <div className="p-6 text-center text-sm text-[var(--fg-3)]">No results for “{q}”</div>}
            {rows.map((r, i) => {
              const head = r.section !== lastSection ? r.section : null;
              lastSection = r.section;
              return (
                <div key={r.id}>
                  {head && <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-3)]">{head}</div>}
                  <button id={`sp-row-${i}`} onMouseMove={() => setSel(i)} onClick={() => run(r)} className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left ${i === sel ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : ''}`}>
                    <span className="grid w-8 shrink-0 place-items-center">{r.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium">{r.title}</span>
                      {r.sub && <span className={`block truncate text-[12px] ${i === sel ? 'opacity-70' : 'text-[var(--fg-2)]'}`}>{r.sub}</span>}
                    </span>
                    {i === sel && <span className="text-[11px] opacity-70">{r.alt ? `↵ open  ${r.altHint}` : '↵'}</span>}
                    {r.alt && i === sel && <Play size={0} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {!q.trim() && <div className="border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--fg-3)]">Try “dune”, “2^10 / 4”, “dark mode”, or paste an IMDb ID like tt0111161</div>}
      </div>
    </div>
  );
}
