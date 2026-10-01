import { useEffect } from 'react';
import { ACCENTS } from './os/appMeta';
import { Boot, Lock, PoweredOff } from './os/shell/Boot';
import { Desktop } from './os/shell/Desktop';
import { Shortcuts } from './os/shell/Shortcuts';
import { notify, setState, useOS } from './os/store';

export default function App() {
  const phase = useOS((s) => s.phase);
  const theme = useOS((s) => s.settings.theme);
  const accent = useOS((s) => s.settings.accent);
  const brightness = useOS((s) => s.settings.brightness);
  const reduce = useOS((s) => s.settings.reduceMotion);
  const name = useOS((s) => s.settings.userName);

  useEffect(() => {
    const r = document.documentElement;
    const a = ACCENTS[accent] ?? ACCENTS.mono;
    r.dataset.theme = theme;
    r.style.setProperty('--accent', theme === 'light' && accent === 'mono' ? '#171717' : a.c);
    r.style.setProperty('--accent-fg', theme === 'light' && accent === 'mono' ? '#fafafa' : a.fg);
    r.classList.toggle('reduce-motion', reduce);
  }, [theme, accent, reduce]);

  useEffect(() => {
    const on = () => setState({ online: true });
    const off = () => setState({ online: false });
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    if (phase !== 'desktop') return;
    const t = window.setTimeout(() => notify(`Welcome, ${name}`, 'Press Ctrl/⌘ + K to search everything.', { appId: 'store' }), 900);
    return () => window.clearTimeout(t);
  }, [phase, name]);

  return (
    <>
      {phase === 'boot' && <Boot />}
      {phase === 'lock' && <Lock />}
      {phase === 'off' && <PoweredOff />}
      {phase === 'desktop' && <><Desktop /><Shortcuts /></>}
      <div className="pointer-events-none fixed inset-0 z-[9999] bg-black" style={{ opacity: (100 - brightness) / 100 }} />
    </>
  );
}
