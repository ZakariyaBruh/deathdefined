import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react';
import { LayoutGrid, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { appMeta, dockApps } from '../appMeta';
import { closeApp, closeWindow, focusWindow, minimizeWindow, openApp, togglePanel, uninstallApp, useOS } from '../store';
import { AppIcon } from '../ui/icons';
import { showContextMenu } from './ctx';
import { sfx } from '../sound';

const BASE_GAP = 6;

function DockIcon({ id, mouseX, size, magnify, running, focused, onClick, onContext, label, children }: {
  id?: string; mouseX: MotionValue<number>; size: number; magnify: boolean; running?: boolean; focused?: boolean;
  onClick: () => void; onContext: (e: React.MouseEvent) => void; label: string; children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [bounce, setBounce] = useState(false);
  const [hover, setHover] = useState(false);
  const dist = useTransform(mouseX, (v) => {
    const b = ref.current?.getBoundingClientRect();
    return b ? v - (b.x + b.width / 2) : 9999;
  });
  const scale = useTransform(dist, [-130, 0, 130], [1, magnify ? 1.7 : 1, 1]);
  const s = useSpring(scale, { mass: 0.1, stiffness: 170, damping: 14 });
  const h = useTransform(s, (v) => size * v);

  return (
    <div ref={ref} className="relative flex flex-col items-center justify-end" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {hover && (
        <div className="pointer-events-none absolute -top-9 z-10 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1 text-[12px] font-medium shadow-lg">{label}</div>
      )}
      <motion.button
        aria-label={label}
        style={{ width: h, height: h }}
        className={`block ${bounce ? 'launching' : ''}`}
        onClick={() => { sfx.click(); if (!running) { setBounce(true); window.setTimeout(() => setBounce(false), 1400); } onClick(); }}
        onContextMenu={onContext}
        whileTap={{ scale: 0.88 }}
      >
        {id ? <AppIcon id={id} size={size} className="!h-full !w-full" /> : children}
      </motion.button>
      <div className={`mt-1 h-1 w-1 rounded-full ${running ? (focused ? 'bg-[var(--fg)]' : 'bg-[var(--fg-3)]') : 'bg-transparent'}`} />
    </div>
  );
}

export function Dock({ mobile }: { mobile: boolean }) {
  const installed = useOS((s) => s.settings.installed);
  const size = useOS((s) => s.settings.dockSize);
  const magnify = useOS((s) => s.settings.dockMagnify) && !mobile;
  const windows = useOS((s) => s.windows);
  const focusId = useOS((s) => s.focusId);
  const mouseX = useMotionValue(Infinity);
  
  const items = dockApps(installed);
  const runningIds = [...new Set(windows.map((w) => w.appId))].filter((id) => !items.includes(id) && !appMeta(id)?.hidden);
  items.push(...runningIds);
  const minimized = windows.filter((w) => w.minimized);
  const focusedApp = windows.find((w) => w.id === focusId)?.appId;
  const slots = items.length + minimized.length + 1;
  const fit = Math.floor((window.innerWidth - 56) / slots) - BASE_GAP;
  const iconSize = mobile ? 44 : Math.max(30, Math.min(size, fit));

  const activate = (id: string) => {
    const mine = windows.filter((w) => w.appId === id);
    if (!mine.length) return void openApp(id);
    const target = [...mine].reverse().find((w) => w.id !== focusId && !w.minimized) ?? [...mine].reverse()[0];
    if (mine.length === 1 && focusId === target.id && !target.minimized) return minimizeWindow(target.id);
    focusWindow(target.id);
  };

  const ctx = (id: string) => (e: React.MouseEvent) => {
    const meta = appMeta(id)!;
    const mine = windows.filter((w) => w.appId === id);
    showContextMenu(e, [
      { label: mine.length ? 'Show' : 'Open', onClick: () => activate(id) },
      ...(!meta.single && mine.length ? [{ label: 'New Window', onClick: () => openApp(id) }] : []),
      ...(!meta.core ? [{ sep: true }, { label: 'Remove App', icon: <Trash2 size={14} />, danger: true, onClick: () => uninstallApp(id) }] : []),
      ...(mine.length ? [{ label: 'Quit', icon: <X size={14} />, danger: true, onClick: () => closeApp(id) }] : []),
    ]);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-2 z-[5000] flex justify-center px-2">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={`glass pointer-events-auto flex max-w-full items-end rounded-[22px] px-2.5 pb-1.5 pt-2 ${mobile ? "overflow-x-auto no-scrollbar" : ""}`}
        style={{ gap: BASE_GAP, boxShadow: '0 20px 50px -10px rgba(0,0,0,.6)', height: iconSize + 24 }}
      >
        <DockIcon mouseX={mouseX} size={iconSize} magnify={magnify} label="Launchpad" onClick={() => togglePanel('launchpad')} onContext={(e) => e.preventDefault()}>
          <div className="grid h-full w-full place-items-center rounded-[23%] bg-gradient-to-b from-neutral-600 to-neutral-800 shadow-inner"><LayoutGrid className="text-white" size={iconSize * 0.5} /></div>
        </DockIcon>
        <div className="mx-1 mb-1 h-8 w-px self-center bg-[var(--border)]" />
        {items.map((id) => {
          const mine = windows.filter((w) => w.appId === id);
          return (
            <DockIcon key={id} id={id} mouseX={mouseX} size={iconSize} magnify={magnify} label={appMeta(id)!.name} running={mine.length > 0} focused={focusedApp === id} onClick={() => activate(id)} onContext={ctx(id)} />
          );
        })}
        {minimized.length > 0 && <div className="mx-1 mb-1 h-8 w-px self-center bg-[var(--border)]" />}
        {minimized.map((w) => (
          <DockIcon key={w.id} id={w.appId} mouseX={mouseX} size={iconSize * 0.8} magnify={magnify} label={w.title} onClick={() => focusWindow(w.id)} running={false} onContext={(e) => showContextMenu(e, [{ label: 'Restore', onClick: () => focusWindow(w.id) }, { label: 'Close', danger: true, onClick: () => closeWindow(w.id) }])} />
        ))}
      </motion.div>
    </div>
  );
}

