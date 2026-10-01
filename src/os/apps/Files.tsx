import { ChevronLeft, ChevronRight, Clapperboard, File, FileText, Folder, Grid2x2, Home, List, Trash2, AppWindow, Library, History, StickyNote } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { WinState } from '../types';
import { timeAgo } from '../catalog';
import { useOS } from '../store';
import { AppIcon } from '../ui/icons';
import { useWidth } from '../ui/hooks';
import { children, fmtSize, type VNode } from '../vfs';
import { showContextMenu } from '../shell/ctx';

const PLACES = [
  { p: '/home', label: 'Home', icon: <Home size={14} /> },
  { p: '/home/Watchlist', label: 'Watchlist', icon: <Library size={14} /> },
  { p: '/home/History', label: 'History', icon: <History size={14} /> },
  { p: '/home/Notes', label: 'Notes', icon: <StickyNote size={14} /> },
  { p: '/Applications', label: 'Applications', icon: <AppWindow size={14} /> },
  { p: '/Archive', label: 'Archive', icon: <Clapperboard size={14} /> },
];

function Thumb({ n, size }: { n: VNode; size: number }) {
  if (n.kind === 'dir') return <Folder size={size} className="text-sky-400" fill="currentColor" fillOpacity={0.25} />;
  if (n.appId) return <AppIcon id={n.appId} size={size} />;
  if (n.poster) return <img src={n.poster} alt="" loading="lazy" className="rounded-md object-cover" style={{ width: size * 0.72, height: size }} />;
  return n.ext === 'txt' ? <FileText size={size} className="text-[var(--fg-2)]" /> : <File size={size} className="text-[var(--fg-2)]" />;
}

export default function Files(_: { win: WinState }) {
  const [path, setPath] = useState('/home');
  const [hist, setHist] = useState<string[]>(['/home']);
  const [idx, setIdx] = useState(0);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sel, setSel] = useState<string | null>(null);
  const [ref, width] = useWidth<HTMLDivElement>();
  // re-render on data changes
  useOS((s) => s.watchlist);
  useOS((s) => s.history);
  useOS((s) => s.notes);
  useOS((s) => s.settings.parental);
  const kids = children(path) ?? [];
  const selected = useMemo(() => kids.find((k) => k.path === sel) ?? null, [kids, sel]);

  const go = (p: string) => { const h = [...hist.slice(0, idx + 1), p]; setHist(h); setIdx(h.length - 1); setPath(p); setSel(null); };
  const back = (d: number) => { const i = idx + d; if (i < 0 || i >= hist.length) return; setIdx(i); setPath(hist[i]); setSel(null); };
  const openNode = (n: VNode) => (n.kind === 'dir' ? go(n.path) : n.open?.());
  const crumbs = path === '/' ? [''] : path.split('/');

  const ctx = (e: React.MouseEvent, n: VNode) => { setSel(n.path); showContextMenu(e, [{ label: 'Open', onClick: () => openNode(n) }, ...(n.remove ? [{ sep: true }, { label: 'Delete', icon: <Trash2 size={13} />, danger: true, onClick: () => { n.remove!(); setSel(null); } }] : [])]); };

  return (
    <div ref={ref} className="flex h-full">
      {width > 520 && (
        <aside className="w-[170px] shrink-0 space-y-0.5 overflow-y-auto border-r border-[var(--border)] p-2" style={{ background: 'var(--sidebar)' }}>
          <div className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--fg-3)]">Places</div>
          {PLACES.map((pl) => <button key={pl.p} onClick={() => go(pl.p)} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] ${path === pl.p ? 'bg-[var(--fill-3)] font-semibold' : 'text-[var(--fg-2)] hover:bg-[var(--fill)]'}`}>{pl.icon}{pl.label}</button>)}
        </aside>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1 border-b border-[var(--border)] px-2 py-1.5">
          <button aria-label="Back" disabled={idx === 0} onClick={() => back(-1)} className="rounded-md p-1 hover:bg-[var(--fill-2)] disabled:opacity-30"><ChevronLeft size={16} /></button>
          <button aria-label="Forward" disabled={idx >= hist.length - 1} onClick={() => back(1)} className="rounded-md p-1 hover:bg-[var(--fill-2)] disabled:opacity-30"><ChevronRight size={16} /></button>
          <div className="mx-2 flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden text-[13px]">
            {crumbs.map((c, i) => <button key={i} onClick={() => go(i === 0 ? '/' : crumbs.slice(0, i + 1).join('/'))} className="truncate rounded px-1 hover:bg-[var(--fill-2)]">{i === 0 ? 'CineOS' : c}<span className="ml-1 text-[var(--fg-3)]">{i < crumbs.length - 1 ? '›' : ''}</span></button>)}
          </div>
          <button aria-label="Grid view" onClick={() => setView('grid')} className={`rounded-md p-1.5 ${view === 'grid' ? 'bg-[var(--fill-3)]' : 'hover:bg-[var(--fill-2)]'}`}><Grid2x2 size={14} /></button>
          <button aria-label="List view" onClick={() => setView('list')} className={`rounded-md p-1.5 ${view === 'list' ? 'bg-[var(--fill-3)]' : 'hover:bg-[var(--fill-2)]'}`}><List size={14} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3" onPointerDown={() => setSel(null)}>
          {kids.length === 0 && <div className="grid h-full place-items-center text-[13px] text-[var(--fg-3)]">This folder is empty</div>}
          {view === 'grid' ? (
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(104px,1fr))' }}>
              {kids.map((n) => (
                <button key={n.path} onPointerDown={(e) => { e.stopPropagation(); setSel(n.path); }} onDoubleClick={() => openNode(n)} onContextMenu={(e) => ctx(e, n)} className={`flex flex-col items-center gap-1.5 rounded-xl p-2 ${sel === n.path ? 'bg-[var(--fill-3)]' : 'hover:bg-[var(--fill)]'}`}>
                  <div className="grid h-14 place-items-center"><Thumb n={n} size={52} /></div>
                  <span className="line-clamp-2 break-all text-center text-[12px] leading-tight">{n.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-px text-[13px]">
              {kids.map((n) => (
                <button key={n.path} onPointerDown={(e) => { e.stopPropagation(); setSel(n.path); }} onDoubleClick={() => openNode(n)} onContextMenu={(e) => ctx(e, n)} className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left ${sel === n.path ? 'bg-[var(--fill-3)]' : 'hover:bg-[var(--fill)]'}`}>
                  <div className="grid w-7 place-items-center"><Thumb n={n} size={22} /></div>
                  <span className="min-w-0 flex-1 truncate">{n.name}</span>
                  <span className="w-20 text-right text-[11px] text-[var(--fg-3)]">{n.kind === 'dir' ? '—' : fmtSize(n.size)}</span>
                  <span className="hidden w-20 text-right text-[11px] text-[var(--fg-3)] sm:block">{n.modified ? timeAgo(n.modified) : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] px-3 py-1 text-[11px] text-[var(--fg-3)]">
          <span>{selected ? `${selected.name}${selected.kind === 'file' ? ` · ${fmtSize(selected.size)}` : ''}` : `${kids.length} items`}</span>
          <span className="font-mono">{path}</span>
        </div>
      </div>
    </div>
  );
}

