import { motion } from 'motion/react';
import { Maximize2, Minimize2, Minus, X } from 'lucide-react';
import { Suspense, memo, useRef } from 'react';
import { appMeta } from '../appMeta';
import { APP_COMPONENTS, AppBoundary } from '../registry';
import {
  MENUBAR_H, closeWindow, focusWindow, minimizeWindow, patchWindow, setState, snapRect, snapWindow, toggleMaximize, viewport,
} from '../store';
import type { Rect, WinState } from '../types';
import { sfx } from '../sound';

type Zone = 'left' | 'right' | 'max' | null;
const zoneAt = (x: number, y: number): Zone => {
  const { w } = viewport();
  if (y <= MENUBAR_H + 2) return 'max';
  if (x <= 6) return 'left';
  if (x >= w - 7) return 'right';
  return null;
};

const HANDLES: { k: string; cls: string; cursor: string }[] = [
  { k: 'n', cls: 'top-0 left-3 right-3 h-1.5', cursor: 'ns-resize' },
  { k: 's', cls: 'bottom-0 left-3 right-3 h-1.5', cursor: 'ns-resize' },
  { k: 'w', cls: 'left-0 top-3 bottom-3 w-1.5', cursor: 'ew-resize' },
  { k: 'e', cls: 'right-0 top-3 bottom-3 w-1.5', cursor: 'ew-resize' },
  { k: 'nw', cls: 'top-0 left-0 h-3 w-3', cursor: 'nwse-resize' },
  { k: 'ne', cls: 'top-0 right-0 h-3 w-3', cursor: 'nesw-resize' },
  { k: 'sw', cls: 'bottom-0 left-0 h-3 w-3', cursor: 'nesw-resize' },
  { k: 'se', cls: 'bottom-0 right-0 h-3 w-3', cursor: 'nwse-resize' },
];

interface Props { win: WinState; index: number; focused: boolean; mobile: boolean; reserve: number; dim: boolean }

export const WindowFrame = memo(function WindowFrame({ win, index, focused, mobile, reserve }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const meta = appMeta(win.appId)!;
  const App = APP_COMPONENTS[win.appId];
  const full = mobile || win.maximized;
  const minW = meta.minW ?? 320;
  const minH = meta.minH ?? 220;

  const style: React.CSSProperties = full
    ? { left: 0, top: MENUBAR_H, width: '100%', height: `calc(100% - ${MENUBAR_H + (mobile ? 76 : reserve)}px)` }
    : { left: win.x, top: win.y, width: win.w, height: win.h };

  const begin = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    focusWindow(win.id);
    if (mobile) return;
    const el = ref.current;
    if (!el) return;
    const bar = e.currentTarget as HTMLElement;
    bar.setPointerCapture(e.pointerId);
    const startX = e.clientX, startY = e.clientY;
    let rect: Rect = { x: win.x, y: win.y, w: win.w, h: win.h };
    let wasMax = win.maximized;
    let moved = false;
    let zone: Zone = null;
    let base = { sx: startX, sy: startY, rx: win.x, ry: win.y };

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      moved = true;
      if (wasMax) {
        const r = win.restore ?? { x: 100, y: 80, w: meta.w, h: meta.h };
        const frac = (startX) / viewport().w;
        rect = { w: r.w, h: r.h, x: Math.round(ev.clientX - r.w * frac), y: ev.clientY - 16 };
        wasMax = false;
        patchWindow(win.id, { maximized: false, ...rect, restore: undefined });
        base = { sx: ev.clientX, sy: ev.clientY, rx: rect.x, ry: rect.y };
      }
      rect = { ...rect, x: base.rx + (ev.clientX - base.sx), y: Math.max(MENUBAR_H, base.ry + (ev.clientY - base.sy)) };
      el.style.left = `${rect.x}px`;
      el.style.top = `${rect.y}px`;
      el.style.width = `${rect.w}px`;
      el.style.height = `${rect.h}px`;
      const z = zoneAt(ev.clientX, ev.clientY);
      if (z !== zone) {
        zone = z;
        const { w: vw, h: vh } = viewport();
        setState({ snapPreview: z === 'max' ? { x: 0, y: MENUBAR_H, w: vw, h: vh - MENUBAR_H } : z ? snapRect(z, vw, vh) : null });
      }
    };
    const up = () => {
      bar.removeEventListener('pointermove', move);
      bar.removeEventListener('pointerup', up);
      bar.removeEventListener('pointercancel', up);
      setState({ snapPreview: null });
      if (!moved) return;
      if (zone) snapWindow(win.id, zone);
      else patchWindow(win.id, { x: rect.x, y: rect.y, w: rect.w, h: rect.h });
    };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', up);
    bar.addEventListener('pointercancel', up);
  };

  const resize = (k: string) => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    focusWindow(win.id);
    const el = ref.current!;
    const h = e.currentTarget as HTMLElement;
    h.setPointerCapture(e.pointerId);
    const sx = e.clientX, sy = e.clientY;
    const o = { x: win.x, y: win.y, w: win.w, h: win.h };
    let r = { ...o };
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      r = { ...o };
      if (k.includes('e')) r.w = Math.max(minW, o.w + dx);
      if (k.includes('s')) r.h = Math.max(minH, o.h + dy);
      if (k.includes('w')) { r.w = Math.max(minW, o.w - dx); r.x = o.x + (o.w - r.w); }
      if (k.includes('n')) { r.h = Math.max(minH, o.h - dy); r.y = Math.max(MENUBAR_H, o.y + (o.h - r.h)); r.h = o.h + (o.y - r.y); }
      el.style.left = `${r.x}px`; el.style.top = `${r.y}px`; el.style.width = `${r.w}px`; el.style.height = `${r.h}px`;
    };
    const up = () => {
      h.removeEventListener('pointermove', move);
      h.removeEventListener('pointerup', up);
      h.removeEventListener('pointercancel', up);
      patchWindow(win.id, { ...r, restore: undefined });
    };
    h.addEventListener('pointermove', move);
    h.addEventListener('pointerup', up);
    h.addEventListener('pointercancel', up);
  };

  const close = () => { sfx.close(); closeWindow(win.id); };

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-label={win.title}
      initial={{ opacity: 0, scale: 0.92, y: 14 }}
      animate={win.minimized ? { opacity: 0, scale: 0.6, y: 220, pointerEvents: 'none' } : { opacity: 1, scale: 1, y: 0, pointerEvents: 'auto' }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.14 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
      onPointerDownCapture={() => { if (!focused) focusWindow(win.id); }}
      className={`absolute flex flex-col overflow-hidden ${full ? '' : 'rounded-xl'} ${focused ? 'win-shadow-focus' : 'win-shadow'}`}
      style={{ ...style, zIndex: 100 + index + (win.floating ? 3000 : 0), background: 'var(--win)', backdropFilter: 'blur(40px) saturate(160%)', transformOrigin: '50% 100%', visibility: win.minimized ? 'hidden' : undefined } as any}
    >
      <div
        onPointerDown={begin}
        onDoubleClick={(e) => { if (!mobile && !(e.target as HTMLElement).closest('button')) toggleMaximize(win.id); }}
        className={`group relative flex h-9 shrink-0 items-center gap-2 px-3 border-b border-[var(--border)] ${focused ? '' : 'opacity-70'}`}
        style={{ touchAction: 'none', cursor: 'default', background: 'var(--fill)' }}
      >
        <div className="flex items-center gap-2">
          <button aria-label="Close" onClick={close} className="grid h-3 w-3 place-items-center rounded-full bg-[#ff5f57] text-black/60 transition hover:brightness-110">
            <X size={8} strokeWidth={3.5} className="opacity-0 group-hover:opacity-100" />
          </button>
          {!mobile && (
            <>
              <button aria-label="Minimize" onClick={() => minimizeWindow(win.id)} className="grid h-3 w-3 place-items-center rounded-full bg-[#febc2e] text-black/60 hover:brightness-110">
                <Minus size={8} strokeWidth={3.5} className="opacity-0 group-hover:opacity-100" />
              </button>
              <button aria-label="Zoom" onClick={() => toggleMaximize(win.id)} className="grid h-3 w-3 place-items-center rounded-full bg-[#28c840] text-black/60 hover:brightness-110">
                {win.maximized ? <Minimize2 size={7} strokeWidth={3.5} className="opacity-0 group-hover:opacity-100" /> : <Maximize2 size={7} strokeWidth={3.5} className="opacity-0 group-hover:opacity-100" />}
              </button>
            </>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-20 text-center text-[12px] font-semibold truncate text-[var(--fg-2)]">{win.title}</div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AppBoundary name={meta.name} onClose={close}>
          <Suspense fallback={<div className="h-full grid place-items-center text-xs text-[var(--fg-3)]">Opening {meta.name}…</div>}>
            {App && <App win={win} />}
          </Suspense>
        </AppBoundary>
        {!focused && <div className="absolute inset-0 z-50" onPointerDown={() => focusWindow(win.id)} />}
      </div>

      {!full && HANDLES.map((h) => (
        <div key={h.k} onPointerDown={resize(h.k)} className={`absolute z-[60] ${h.cls}`} style={{ cursor: h.cursor, touchAction: 'none' }} />
      ))}
    </motion.div>
  );
});
