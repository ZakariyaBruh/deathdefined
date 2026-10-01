import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';

export interface CtxItem { label?: string; icon?: ReactNode; onClick?: () => void; danger?: boolean; sep?: boolean; disabled?: boolean }
interface CtxState { x: number; y: number; items: CtxItem[] }

let cur: CtxState | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((s) => s());

export const showContextMenu = (e: { clientX: number; clientY: number; preventDefault?: () => void; stopPropagation?: () => void }, items: CtxItem[]) => {
  e.preventDefault?.();
  e.stopPropagation?.();
  cur = { x: e.clientX, y: e.clientY, items };
  emit();
};
export const hideContextMenu = () => { if (cur) { cur = null; emit(); } };

export function ContextMenu() {
  const s = useSyncExternalStore((l) => { subs.add(l); return () => { subs.delete(l); }; }, () => cur);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!s) return;
    const el = ref.current;
    const w = el?.offsetWidth ?? 200, h = el?.offsetHeight ?? 200;
    setPos({ x: Math.min(s.x, window.innerWidth - w - 8), y: Math.min(s.y, window.innerHeight - h - 8) });
    const off = (ev: Event) => { if (!(ev.target as HTMLElement)?.closest?.('[data-ctx]')) hideContextMenu(); };
    const key = (ev: KeyboardEvent) => ev.key === 'Escape' && hideContextMenu();
    window.addEventListener('pointerdown', off, true);
    window.addEventListener('blur', hideContextMenu);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('pointerdown', off, true); window.removeEventListener('blur', hideContextMenu); window.removeEventListener('keydown', key); };
  }, [s]);

  if (!s) return null;
  return (
    <div ref={ref} data-ctx className="panel fixed z-[9500] min-w-[200px] rounded-xl p-1 text-[13px]" style={{ left: pos.x || s.x, top: pos.y || s.y }} onContextMenu={(e) => e.preventDefault()}>
      {s.items.map((it, i) =>
        it.sep ? <div key={i} className="my-1 h-px bg-[var(--border)]" /> : (
          <button
            key={i}
            disabled={it.disabled}
            onClick={() => { hideContextMenu(); it.onClick?.(); }}
            className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition hover:bg-[var(--accent)] hover:text-[var(--accent-fg)] disabled:opacity-40 disabled:pointer-events-none ${it.danger ? 'text-red-400' : ''}`}
          >
            <span className="w-4 shrink-0 opacity-80">{it.icon}</span>
            {it.label}
          </button>
        ),
      )}
    </div>
  );
}
