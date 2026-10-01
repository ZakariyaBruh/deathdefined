import { motion } from 'motion/react';
import { Play, Power } from 'lucide-react';
import { useEffect, useState } from 'react';
import { wallpaperCss } from '../wallpapers';
import { fmtTime, useNow } from '../catalog';
import { restart, setPhase, setSettings, useOS } from '../store';
import { sfx } from '../sound';

const LINES = ['Mounting film archive', 'Calibrating projector', 'Loading subtitles', 'Dimming the lights', 'Ready'];

export function Boot() {
  const [p, setP] = useState(0);
  useEffect(() => {
    sfx.boot();
    const t = window.setInterval(() => setP((v) => v + 1), 520);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => { if (p > LINES.length) setPhase('lock'); }, [p]);
  useEffect(() => {
    const skip = () => setPhase('lock');
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, []);
  return (
    <div className="fixed inset-0 grid cursor-pointer place-items-center bg-black text-white" onClick={() => setPhase('lock')}>
      <div className="flex flex-col items-center">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} className="mb-8 grid h-24 w-24 place-items-center rounded-[26px] bg-white text-black shadow-[0_0_80px_rgba(255,255,255,.25)]">
          <Play size={44} fill="currentColor" className="ml-1" />
        </motion.div>
        <div className="font-[var(--font-display)] text-3xl font-semibold tracking-[0.3em]">CINESTREAM</div>
        <div className="mt-8 h-1 w-56 overflow-hidden rounded-full bg-white/15"><motion.div className="h-full rounded-full bg-white" animate={{ width: `${Math.min(100, (p / LINES.length) * 100)}%` }} transition={{ ease: 'easeOut' }} /></div>
        <div className="mt-3 h-4 font-mono text-[11px] text-white/50">{LINES[Math.min(p, LINES.length - 1)]}</div>
      </div>
      <div className="absolute bottom-6 text-[11px] text-white/30">Click or press any key to skip</div>
    </div>
  );
}

export function Lock() {
  const now = useNow();
  const s = useOS((st) => st.settings);
  const [leaving, setLeaving] = useState(false);
  const d = new Date(now || Date.now());
  const enter = () => { if (leaving) return; setLeaving(true); window.setTimeout(() => setPhase('desktop'), 260); };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Meta') enter(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  return (
    <motion.div animate={{ opacity: leaving ? 0 : 1, y: leaving ? -40 : 0 }} className="fixed inset-0 cursor-pointer text-white" style={{ background: wallpaperCss(s.wallpaper) }} onClick={enter}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative flex h-full flex-col items-center pt-[14vh]">
        <div className="text-[18px] font-medium opacity-80">{d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <div className="text-[clamp(72px,16vw,150px)] font-semibold leading-none tracking-tight tabular-nums">{fmtTime(d, s.clock24).replace(/\s?[AP]M/i, '')}</div>
        <div className="mt-auto mb-[12vh] flex flex-col items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-white/20 text-2xl font-semibold backdrop-blur">{(s.userName[0] ?? 'G').toUpperCase()}</div>
          <div className="text-lg font-medium">{s.userName}</div>
          <div className="animate-pulse text-[13px] opacity-70">Click or press any key to unlock</div>
        </div>
      </div>
    </motion.div>
  );
}

export function PoweredOff() {
  return (
    <div className="fixed inset-0 grid place-items-center bg-black">
      <button aria-label="Power on" onClick={() => { setSettings({}); restart(); }} className="grid h-20 w-20 place-items-center rounded-full border border-white/20 text-white/50 transition hover:border-white/60 hover:text-white"><Power size={32} /></button>
    </div>
  );
}
