import { Film, Pin, PinOff, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { WinState } from '../types';
import { timeAgo } from '../catalog';
import { deleteNote, newNote, saveNote, useOS } from '../store';
import { Btn, Empty } from '../ui/bits';
import { useWidth } from '../ui/hooks';

export default function Notes({ win }: { win: WinState }) {
  const notes = useOS((s) => s.notes);
  const watchlist = useOS((s) => s.watchlist);
  const [sel, setSel] = useState<string | null>(win.props?.noteId ?? notes[0]?.id ?? null);
  const [q, setQ] = useState('');
  const [ref, width] = useWidth<HTMLDivElement>();
  const [listOpen, setListOpen] = useState(true);
  const narrow = width < 560;

  useEffect(() => { if (win.props?.noteId) setSel(win.props.noteId); }, [win.props?.noteId]);
  useEffect(() => { if (win.props?.create) { const n = newNote(); setSel(n.id); } }, [win.props?.create]);

  const sorted = useMemo(() => [...notes].filter((n) => (n.title + n.body).toLowerCase().includes(q.toLowerCase())).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updated - a.updated), [notes, q]);
  const cur = notes.find((n) => n.id === sel) ?? null;
  const edit = (patch: Partial<NonNullable<typeof cur>>) => cur && saveNote({ ...cur, ...patch, updated: Date.now() });
  const words = cur ? (cur.body.trim() ? cur.body.trim().split(/\s+/).length : 0) : 0;

  const add = () => { const n = newNote(); setSel(n.id); setListOpen(false); };
  const remove = () => { if (!cur) return; const i = sorted.findIndex((n) => n.id === cur.id); deleteNote(cur.id); setSel(sorted[i + 1]?.id ?? sorted[i - 1]?.id ?? null); setListOpen(true); };

  return (
    <div ref={ref} className="flex h-full">
      {(!narrow || listOpen) && (
        <aside className={`flex shrink-0 flex-col border-r border-[var(--border)] ${narrow ? 'w-full' : 'w-[230px]'}`} style={{ background: 'var(--sidebar)' }}>
          <div className="flex items-center gap-2 p-2.5">
            <div className="flex flex-1 items-center gap-1.5 rounded-lg bg-[var(--fill)] px-2.5 py-1.5"><Search size={13} className="text-[var(--fg-3)]" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-full bg-transparent text-[13px] outline-none" /></div>
            <button aria-label="New note" onClick={add} className="rounded-lg bg-[var(--fill-2)] p-1.5 hover:bg-[var(--fill-3)]"><Plus size={15} /></button>
          </div>
          <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-1.5 pb-2">
            {sorted.map((n) => (
              <button key={n.id} onClick={() => { setSel(n.id); setListOpen(false); }} className={`w-full rounded-lg px-2.5 py-2 text-left ${n.id === sel ? 'bg-[var(--fill-3)]' : 'hover:bg-[var(--fill)]'}`}>
                <div className="flex items-center gap-1.5 truncate text-[13px] font-semibold">{n.pinned && <Pin size={10} className="shrink-0" />}<span className="truncate">{n.title || 'Untitled'}</span></div>
                <div className="truncate text-[11.5px] text-[var(--fg-2)]"><span className="text-[var(--fg-3)]">{timeAgo(n.updated)}</span> {n.body.replace(/\n/g, ' ').slice(0, 40) || 'No additional text'}</div>
              </button>
            ))}
          </div>
        </aside>
      )}
      {(!narrow || !listOpen) && (
        <div className="flex min-w-0 flex-1 flex-col">
          {cur ? (
            <>
              <div className="flex items-center gap-1.5 border-b border-[var(--border)] px-3 py-1.5">
                {narrow && <Btn variant="ghost" onClick={() => setListOpen(true)}>Notes</Btn>}
                <div className="flex-1 text-[11px] text-[var(--fg-3)]">{words} words · edited {timeAgo(cur.updated)}</div>
                {watchlist.length > 0 && (
                  <select aria-label="Insert title" value="" onChange={(e) => { if (e.target.value) edit({ body: cur.body + (cur.body && !cur.body.endsWith('\n') ? '\n' : '') + `🎬 ${e.target.value}\n` }); }} className="max-w-[130px] rounded-lg bg-[var(--fill)] px-2 py-1 text-[12px] outline-none"><option value="">Insert film…</option>{watchlist.map((m) => <option key={m.id} value={m.title}>{m.title}</option>)}</select>
                )}
                <button aria-label={cur.pinned ? 'Unpin' : 'Pin'} onClick={() => edit({ pinned: !cur.pinned })} className="rounded-lg p-1.5 hover:bg-[var(--fill-2)]">{cur.pinned ? <PinOff size={14} /> : <Pin size={14} />}</button>
                <button aria-label="Delete note" onClick={remove} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/15"><Trash2 size={14} /></button>
              </div>
              <input value={cur.title} onChange={(e) => edit({ title: e.target.value })} placeholder="Title" className="bg-transparent px-5 pb-1 pt-4 font-[var(--font-display)] text-2xl font-bold outline-none placeholder:text-[var(--fg-3)]" />
              <textarea value={cur.body} onChange={(e) => edit({ body: e.target.value })} placeholder="Start writing…" className="selectable min-h-0 flex-1 resize-none bg-transparent px-5 py-2 text-[14px] leading-relaxed outline-none placeholder:text-[var(--fg-3)]" />
            </>
          ) : (
            <Empty icon={<Film size={32} />} title="No note selected" hint="Create a note for reviews, quotes and lists." />
          )}
        </div>
      )}
    </div>
  );
}
