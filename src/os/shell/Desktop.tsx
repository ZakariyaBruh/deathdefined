import { AnimatePresence, motion } from 'motion/react';
import { Lock, Maximize, NotebookPen, Palette, Settings as Cog, Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { appMeta } from '../appMeta';
import { MENUBAR_H, lock, openApp, setSettings, togglePanel, useOS } from '../store';
import { WALLPAPERS, wallpaperCss } from '../wallpapers';
import { AppIcon } from '../ui/icons';
import { ContextMenu, showContextMenu } from './ctx';
import { ControlCenter } from './ControlCenter';
import { Dock } from './Dock';
import { MenuBar } from './MenuBar';
import { NotificationCenter, Toasts } from './Notifications';
import { Launchpad, MissionControl } from './Overlays';
import { Spotlight } from './Spotlight';
import { WindowFrame } from './WindowFrame';
import { Widgets } from './Widgets';

export function useMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const f = () => setM(window.innerWidth < 768);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return m;
}

const DESKTOP_ICONS = ['store', 'library', 'files', 'terminal'];

export function Desktop() {
  const mobile = useMobile();
  const s = useOS((st) => st.settings);
  const windows = useOS((st) => st.windows);
  const focusId = useOS((st) => st.focusId);
  const panel = useOS((st) => st.panel);
  const snap = useOS((st) => st.snapPreview);
  const [sel, setSel] = useState<string | null>(null);
  const reserve = s.dockSize + 34;

  const onContext = (e: React.MouseEvent) => {
    const i = WALLPAPERS.findIndex((w) => w.id === s.wallpaper);
    showContextMenu(e, [
      { label: 'New Note', icon: <NotebookPen size={14} />, onClick: () => openApp('notes', { create: true }) },
      { label: 'New Terminal', icon: <Terminal size={14} />, onClick: () => openApp('terminal') },
      { sep: true },
      { label: 'Next Wallpaper', icon: <Palette size={14} />, onClick: () => setSettings({ wallpaper: WALLPAPERS[(i + 1) % WALLPAPERS.length].id }) },
      { label: 'Mission Control', icon: <Maximize size={14} />, onClick: () => togglePanel('mission') },
      { label: 'Settings…', icon: <Cog size={14} />, onClick: () => openApp('settings') },
      { sep: true },
      { label: 'Lock Screen', icon: <Lock size={14} />, onClick: lock },
    ]);
  };

  return (
    <div className="fixed inset-0 overflow-hidden" onContextMenu={onContext} onPointerDown={() => setSel(null)} style={{ background: wallpaperCss(s.wallpaper) }}>
      {/* desktop surface */}
      <div className="absolute inset-0" style={{ top: MENUBAR_H }}>
        {s.showDesktopIcons && (
          <div className={`absolute left-3 top-3 grid gap-3 ${mobile ? 'grid-cols-4 left-4 right-4' : 'w-[88px]'}`}>
            {DESKTOP_ICONS.map((id) => (
              <button key={id} onPointerDown={(e) => { e.stopPropagation(); setSel(id); }} onDoubleClick={() => openApp(id)} onClick={() => mobile && openApp(id)}
                className={`flex flex-col items-center gap-1 rounded-lg p-1.5 ${sel === id ? 'bg-white/20' : ''}`}>
                <AppIcon id={id} size={52} />
                <span className="text-[12px] font-medium text-white [text-shadow:0_1px_3px_rgba(0,0,0,.9)]">{appMeta(id)!.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {s.showWidgets && !mobile && <Widgets />}

      {/* windows */}
      <AnimatePresence>
        {windows.map((w, i) => (
          <WindowFrame key={w.id} win={w} index={i} focused={w.id === focusId} mobile={mobile} reserve={reserve} dim={false} />
        ))}
      </AnimatePresence>

      {snap && <div className="pointer-events-none absolute z-[90] rounded-xl border border-white/40 bg-white/15 backdrop-blur-sm transition-all duration-150" style={{ left: snap.x + 6, top: snap.y + 6, width: snap.w - 12, height: snap.h - 12 }} />}

      <MenuBar mobile={mobile} />
      <Dock mobile={mobile} />
      <Toasts />
      <ContextMenu />

      {panel === 'control' && <ControlCenter />}
      {panel === 'notifs' && <NotificationCenter />}
      {panel === 'spotlight' && <Spotlight />}
      {panel === 'launchpad' && <Launchpad />}
      {panel === 'mission' && <MissionControl />}
    </div>
  );
}

export const MotionDiv = motion.div;
