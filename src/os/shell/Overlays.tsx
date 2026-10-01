import { motion } from 'motion/react';
import { Search, X } from 'lucide-react';
import { useState } from 'react';
import { APP_META, appMeta, isInstalled } from '../appMeta';
import { closePanel, closeWindow, focusWindow, openApp, useOS } from '../store';
import { AppIcon } from '../ui/icons';

export function MissionControl() {
  const windows = useOS((s) => s.windows);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[6500] overflow-y-auto bg-black/55 p-6 pt-14 backdrop-blur-xl" onPointerDown={closePanel}>
      {windows.length === 0 ? (
        <div className="grid h-full place-items-center text-[var(--fg-2)]">No open windows</div>
      ) : (
        <div className="mx-auto grid max-w-6xl grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
          {windows.map((w, i) => (
            <motion.div key={w.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.03 }} className="group cursor-pointer" onPointerDown={(e) => e.stopPropagation()} onClick={() => focusWindow(w.id)}>
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/20 bg-[var(--win-solid)] shadow-2xl transition group-hover:scale-[1.03] group-hover:border-white/50">
                <div className="flex h-5 items-center gap-1 bg-[var(--fill)] px-2"><i className="h-1.5 w-1.5 rounded-full bg-[#ff5f57]" /><i className="h-1.5 w-1.5 rounded-full bg-[#febc2e]" /><i className="h-1.5 w-1.5 rounded-full bg-[#28c840]" /></div>
                <div className="grid h-[calc(100%-20px)] place-items-center">
                  {w.props?.media?.posterUrl ? <img src={w.props.media.posterUrl} alt="" className="h-full w-full object-cover opacity-70" /> : <AppIcon id={w.appId} size={64} />}
                </div>
                <button aria-label="Close window" onClick={(e) => { e.stopPropagation(); closeWindow(w.id); }} className="absolute right-1.5 top-6 hidden rounded-full bg-black/70 p-1 text-white group-hover:block"><X size={12} /></button>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2 text-[13px] text-white"><AppIcon id={w.appId} size={18} /><span className="truncate">{w.title}</span>{w.minimized && <span className="text-white/50">(minimized)</span>}</div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function Launchpad() {
  const [q, setQ] = useState('');
  const installed = useOS((s) => s.settings.installed);
  const apps = APP_META.filter((a) => !a.hidden && isInstalled(installed, a.id) && a.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <motion.div initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-[6500] overflow-y-auto bg-black/60 px-6 pb-28 pt-16 backdrop-blur-2xl" onPointerDown={closePanel}>
      <div className="mx-auto mb-10 flex w-72 items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5" onPointerDown={(e) => e.stopPropagation()}>
        <Search size={14} className="text-white/60" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') closePanel(); if (e.key === 'Enter' && apps[0]) openApp(apps[0].id); }} placeholder="Search" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40" />
      </div>
      <div className="mx-auto grid max-w-4xl grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-y-8">
        {apps.map((a, i) => (
          <motion.button key={a.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} onPointerDown={(e) => e.stopPropagation()} onClick={() => openApp(a.id)} className="group flex flex-col items-center gap-2">
            <div className="transition group-hover:scale-110 group-active:scale-95"><AppIcon id={a.id} size={76} /></div>
            <span className="text-[13px] font-medium text-white drop-shadow">{a.name}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export const appName = (id: string) => appMeta(id)?.name ?? id;
