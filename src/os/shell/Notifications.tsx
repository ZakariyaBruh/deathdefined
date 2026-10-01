import { AnimatePresence, motion } from 'motion/react';
import { BellOff, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { appMeta } from '../appMeta';
import { timeAgo } from '../catalog';
import { clearNotifications, closePanel, dismissToast, markNotifsRead, openApp, removeNotification, useOS } from '../store';
import { AppIcon } from '../ui/icons';
import type { Notif } from '../types';
import { sfx } from '../sound';

const open = (n: Notif) => { const a = n.action ?? (n.appId ? { appId: n.appId } : null); if (a) openApp(a.appId, (a as any).props); };

export function Toasts() {
  const toasts = useOS((s) => s.toasts);
  const last = toasts[toasts.length - 1]?.id;
  useEffect(() => { if (last) sfx.notify(); }, [last]);
  return (
    <div className="pointer-events-none fixed right-3 top-[38px] z-[8000] flex w-[340px] max-w-[calc(100vw-24px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button key={t.id} layout initial={{ opacity: 0, x: 60, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 60 }}
            onClick={() => { dismissToast(t.id); open(t); }}
            className="panel pointer-events-auto flex items-start gap-3 rounded-2xl p-3 text-left">
            <AppIcon id={t.appId && appMeta(t.appId) ? t.appId : 'about'} size={34} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{t.title}</div>
              {t.body && <div className="line-clamp-2 text-[12px] text-[var(--fg-2)]">{t.body}</div>}
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Calendar() {
  const [cur, setCur] = useState(() => new Date());
  const y = cur.getFullYear(), m = cur.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const today = new Date();
  const cells = [...Array(first).fill(0), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <div className="rounded-2xl bg-[var(--fill)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[13px] font-semibold">{cur.toLocaleDateString([], { month: 'long', year: 'numeric' })}</div>
        <div className="flex gap-1">
          <button aria-label="Previous month" onClick={() => setCur(new Date(y, m - 1, 1))} className="rounded p-1 hover:bg-[var(--fill-2)]"><ChevronLeft size={14} /></button>
          <button aria-label="Next month" onClick={() => setCur(new Date(y, m + 1, 1))} className="rounded p-1 hover:bg-[var(--fill-2)]"><ChevronRight size={14} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px]">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="text-[var(--fg-3)]">{d}</div>)}
        {cells.map((d, i) => (
          <div key={i} className={`mx-auto grid h-6 w-6 place-items-center rounded-full ${d && d === today.getDate() && m === today.getMonth() && y === today.getFullYear() ? 'bg-[var(--accent)] font-bold text-[var(--accent-fg)]' : ''}`}>{d || ''}</div>
        ))}
      </div>
    </div>
  );
}

export function NotificationCenter() {
  const list = useOS((s) => s.notifications);
  useEffect(() => { markNotifsRead(); }, []);
  return (
    <>
      <div className="fixed inset-0 z-[5900]" onPointerDown={closePanel} />
      <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="panel fixed bottom-2 right-2 top-[36px] z-[6100] flex w-[360px] max-w-[calc(100vw-16px)] flex-col gap-3 overflow-hidden rounded-2xl p-3.5">
        <Calendar />
        <div className="flex items-center justify-between px-1">
          <div className="text-[13px] font-semibold">Notifications</div>
          {list.length > 0 && <button onClick={clearNotifications} className="rounded-md px-2 py-1 text-[12px] text-[var(--fg-2)] hover:bg-[var(--fill-2)]">Clear all</button>}
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {list.length === 0 && <div className="grid place-items-center gap-2 py-12 text-center text-[13px] text-[var(--fg-3)]"><BellOff size={26} />No new notifications</div>}
          {list.map((n) => (
            <div key={n.id} className="group relative flex items-start gap-3 rounded-2xl bg-[var(--fill)] p-3">
              <button className="flex min-w-0 flex-1 items-start gap-3 text-left" onClick={() => { closePanel(); open(n); }}>
                <AppIcon id={n.appId && appMeta(n.appId) ? n.appId : 'about'} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2"><span className="truncate text-[13px] font-semibold">{n.title}</span><span className="shrink-0 text-[11px] text-[var(--fg-3)]">{timeAgo(n.time)}</span></div>
                  {n.body && <div className="line-clamp-3 text-[12px] text-[var(--fg-2)]">{n.body}</div>}
                </div>
              </button>
              <button aria-label="Dismiss" onClick={() => removeNotification(n.id)} className="absolute right-1.5 top-1.5 hidden rounded-full bg-[var(--fill-3)] p-0.5 group-hover:block"><X size={11} /></button>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
