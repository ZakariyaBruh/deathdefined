import { Battery, BatteryCharging, Bell, Search, SlidersHorizontal, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { appMeta } from '../appMeta';
import { fmtTime, useNow } from '../catalog';
import {
  MENUBAR_H, closeApp, closeWindow, focusWindow, lock, minimizeAll, minimizeWindow, openApp, restart, setMenuOpen, setSettings, shutdown,
  snapWindow, toggleFloating, toggleMaximize, togglePanel, useOS,
} from '../store';

interface Item { label?: string; hint?: string; onClick?: () => void; sep?: boolean; disabled?: boolean; check?: boolean }
interface Menu { id: string; label: string; bold?: boolean; items: Item[] }

function useBattery() {
  const [b, setB] = useState<{ level: number; charging: boolean } | null>(null);
  useEffect(() => {
    let bat: any;
    const upd = () => bat && setB({ level: bat.level, charging: bat.charging });
    (navigator as any).getBattery?.().then((x: any) => { bat = x; upd(); x.addEventListener('levelchange', upd); x.addEventListener('chargingchange', upd); }).catch(() => {});
    return () => { bat?.removeEventListener('levelchange', upd); bat?.removeEventListener('chargingchange', upd); };
  }, []);
  return b;
}

export function MenuBar({ mobile }: { mobile: boolean }) {
  const now = useNow();
  const open = useOS((s) => s.menuOpen);
  const windows = useOS((s) => s.windows);
  const focusId = useOS((s) => s.focusId);
  const h24 = useOS((s) => s.settings.clock24);
  const sounds = useOS((s) => s.settings.sounds);
  const online = useOS((s) => s.online);
  const unread = useOS((s) => s.notifications.filter((n) => !n.read).length);
  const dnd = useOS((s) => s.settings.dnd);
  const battery = useBattery();
  const fw = windows.find((w) => w.id === focusId);
  const meta = fw ? appMeta(fw.appId) : null;
  const d = new Date(now || Date.now());

  const menus: Menu[] = [
    {
      id: 'os', label: '▶', bold: true,
      items: [
        { label: 'About CineOS', onClick: () => openApp('about') },
        { sep: true },
        { label: 'Settings…', onClick: () => openApp('settings') },
        { label: 'Activity Monitor', onClick: () => openApp('monitor') },
        { sep: true },
        { label: 'Lock Screen', hint: 'Alt L', onClick: lock },
        { label: 'Restart…', onClick: restart },
        { label: 'Shut Down…', onClick: shutdown },
      ],
    },
    {
      id: 'app', label: meta?.name ?? 'Desktop', bold: true,
      items: meta
        ? [
            { label: `About ${meta.name}`, onClick: () => openApp('about') },
            { sep: true },
            ...(!meta.single ? [{ label: 'New Window', onClick: () => openApp(meta.id) }] : []),
            { label: `Quit ${meta.name}`, onClick: () => closeApp(meta.id) },
          ]
        : [{ label: 'Open Spotlight', hint: '⌘K', onClick: () => togglePanel('spotlight') }, { label: 'Open Launchpad', onClick: () => togglePanel('launchpad') }],
    },
    {
      id: 'file', label: 'File',
      items: [
        { label: 'New Terminal', hint: 'Alt T', onClick: () => openApp('terminal') },
        { label: 'New Note', onClick: () => openApp('notes', { create: true }) },
        { label: 'Direct Play…', onClick: () => openApp('directplay') },
        { sep: true },
        { label: 'Close Window', hint: 'Alt W', disabled: !fw, onClick: () => fw && closeWindow(fw.id) },
      ],
    },
    {
      id: 'view', label: 'View',
      items: [
        { label: 'Mission Control', hint: 'F3', onClick: () => togglePanel('mission') },
        { label: 'Launchpad', onClick: () => togglePanel('launchpad') },
        { label: 'Spotlight', hint: '⌘K', onClick: () => togglePanel('spotlight') },
        { sep: true },
        { label: 'Enter Full Screen', onClick: () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.()) },
      ],
    },
    {
      id: 'window', label: 'Window',
      items: [
        { label: 'Minimize', hint: 'Alt M', disabled: !fw, onClick: () => fw && minimizeWindow(fw.id) },
        { label: 'Zoom', hint: 'Alt Enter', disabled: !fw, onClick: () => fw && toggleMaximize(fw.id) },
        { label: 'Tile Left', disabled: !fw, onClick: () => fw && snapWindow(fw.id, 'left') },
        { label: 'Tile Right', disabled: !fw, onClick: () => fw && snapWindow(fw.id, 'right') },
        { label: 'Float on Top', disabled: !fw, onClick: () => fw && toggleFloating(fw.id) },
        { label: 'Minimize All', onClick: minimizeAll },
        ...(windows.length ? [{ sep: true } as Item, ...windows.map((w) => ({ label: w.title, check: w.id === focusId, onClick: () => focusWindow(w.id) }))] : []),
      ],
    },
  ];
  const shown = mobile ? menus.slice(0, 2) : menus;
  const Bat = battery?.charging ? BatteryCharging : Battery;

  return (
    <>
      {open && <div className="fixed inset-0 z-[5990]" onPointerDown={() => setMenuOpen(null)} />}
      <div className="glass fixed inset-x-0 top-0 z-[6000] flex items-center justify-between px-2 text-[13px]" style={{ height: MENUBAR_H, borderWidth: '0 0 1px 0' }}>
        <div className="flex h-full items-center">
          {shown.map((m) => (
            <div key={m.id} className="relative h-full" onMouseEnter={() => open && setMenuOpen(m.id)}>
              <button onClick={() => setMenuOpen(open === m.id ? null : m.id)} className={`h-full rounded-md px-2.5 ${m.bold ? 'font-bold' : ''} ${open === m.id ? 'bg-[var(--fill-3)]' : 'hover:bg-[var(--fill-2)]'}`}>{m.label}</button>
              {open === m.id && (
                <div className="panel absolute left-0 top-[calc(100%+2px)] z-[6001] min-w-[230px] rounded-xl p-1">
                  {m.items.map((it, i) =>
                    it.sep ? <div key={i} className="my-1 h-px bg-[var(--border)]" /> : (
                      <button key={i} disabled={it.disabled} onClick={() => { setMenuOpen(null); it.onClick?.(); }} className="flex w-full items-center justify-between gap-6 rounded-md px-2.5 py-1.5 text-left hover:bg-[var(--accent)] hover:text-[var(--accent-fg)] disabled:pointer-events-none disabled:opacity-40">
                        <span>{it.check ? '✓ ' : ''}{it.label}</span>
                        {it.hint && <span className="text-[11px] opacity-60">{it.hint}</span>}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex h-full items-center gap-0.5 text-[var(--fg)]">
          {battery && !mobile && (
            <span className="flex items-center gap-1 px-1.5 text-[12px] text-[var(--fg-2)]"><Bat size={16} />{Math.round(battery.level * 100)}%</span>
          )}
          <button aria-label="Toggle sound" onClick={() => setSettings({ sounds: !sounds })} className="rounded-md p-1.5 hover:bg-[var(--fill-2)]">{sounds ? <Volume2 size={15} /> : <VolumeX size={15} className="text-[var(--fg-3)]" />}</button>
          <span className="p-1.5" title={online ? 'Online' : 'Offline'}>{online ? <Wifi size={15} /> : <WifiOff size={15} className="text-red-400" />}</span>
          <button aria-label="Spotlight" onClick={() => togglePanel('spotlight')} className="rounded-md p-1.5 hover:bg-[var(--fill-2)]"><Search size={15} /></button>
          <button aria-label="Control Center" onClick={() => togglePanel('control')} className="rounded-md p-1.5 hover:bg-[var(--fill-2)]"><SlidersHorizontal size={15} /></button>
          <button onClick={() => togglePanel('notifs')} className="relative flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-[var(--fill-2)]">
            {dnd ? <Bell size={14} className="text-[var(--fg-3)]" /> : unread > 0 && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
            <span className="font-medium tabular-nums">{!mobile && `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}  `}{fmtTime(d, h24)}</span>
          </button>
        </div>
      </div>
    </>
  );
}
