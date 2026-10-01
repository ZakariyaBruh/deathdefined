import { Pause, Play, RotateCcw, Timer as TimerIcon, Flag } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { WinState } from '../types';
import { fmtTime, useNow } from '../catalog';
import { notify, useOS } from '../store';
import { Btn, Segmented } from '../ui/bits';

const ZONES = ['Local', 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'];
const pad = (n: number) => String(n).padStart(2, '0');

function World() {
  const now = useNow();
  const h24 = useOS((s) => s.settings.clock24);
  const d = new Date(now || Date.now());
  const deg = { h: ((d.getHours() % 12) + d.getMinutes() / 60) * 30, m: (d.getMinutes() + d.getSeconds() / 60) * 6, s: d.getSeconds() * 6 };
  return (
    <div className="space-y-4">
      <svg viewBox="-60 -60 120 120" className="mx-auto h-44 w-44" role="img" aria-label="Analogue clock">
        <circle r="56" fill="var(--fill)" stroke="var(--border)" />
        {Array.from({ length: 12 }, (_, i) => <line key={i} y1="-50" y2={i % 3 ? '-46' : '-42'} stroke="var(--fg-3)" strokeWidth={i % 3 ? 1 : 2} transform={`rotate(${i * 30})`} />)}
        <line y2="-28" stroke="var(--fg)" strokeWidth="3" strokeLinecap="round" transform={`rotate(${deg.h})`} />
        <line y2="-42" stroke="var(--fg)" strokeWidth="2" strokeLinecap="round" transform={`rotate(${deg.m})`} />
        <line y2="-46" y1="8" stroke="#ef4444" strokeWidth="1" transform={`rotate(${deg.s})`} />
        <circle r="2.5" fill="#ef4444" />
      </svg>
      <div className="space-y-1">
        {ZONES.map((z) => {
          let t = '', day = '';
          try { const o = z === 'Local' ? undefined : z; t = d.toLocaleTimeString([], { timeZone: o, hour: h24 ? '2-digit' : 'numeric', minute: '2-digit', hour12: !h24 }); day = d.toLocaleDateString([], { timeZone: o, weekday: 'short' }); } catch { return null; }
          return <div key={z} className="flex items-center justify-between rounded-xl bg-[var(--fill)] px-3 py-2 text-[13px]"><div><div className="font-semibold">{z === 'Local' ? 'Local' : z.split('/')[1].replace('_', ' ')}</div><div className="text-[11px] text-[var(--fg-3)]">{day}</div></div><div className="text-[18px] font-light tabular-nums">{t}</div></div>;
        })}
      </div>
      <div className="hidden">{fmtTime(d, h24)}</div>
    </div>
  );
}

function Stopwatch() {
  const [ms, setMs] = useState(0);
  const [on, setOn] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const t0 = useRef(0), base = useRef(0);
  useEffect(() => {
    if (!on) return;
    t0.current = performance.now();
    const t = window.setInterval(() => setMs(base.current + performance.now() - t0.current), 33);
    return () => { window.clearInterval(t); base.current = base.current + performance.now() - t0.current; };
  }, [on]);
  const fmt = (v: number) => `${pad(Math.floor(v / 60000))}:${pad(Math.floor(v / 1000) % 60)}.${pad(Math.floor((v % 1000) / 10))}`;
  return (
    <div className="space-y-4 text-center">
      <div className="py-6 font-mono text-5xl font-light tabular-nums">{fmt(ms)}</div>
      <div className="flex justify-center gap-2">
        <Btn variant="primary" onClick={() => setOn(!on)} className="!px-5 !py-2">{on ? <Pause size={14} /> : <Play size={14} />}{on ? 'Stop' : 'Start'}</Btn>
        <Btn variant="soft" disabled={!on} onClick={() => setLaps((l) => [ms, ...l])} className="!px-4 !py-2"><Flag size={14} />Lap</Btn>
        <Btn variant="soft" onClick={() => { setOn(false); setMs(0); base.current = 0; setLaps([]); }} className="!px-4 !py-2"><RotateCcw size={14} />Reset</Btn>
      </div>
      <div className="space-y-1 text-left">{laps.map((l, i) => <div key={i} className="flex justify-between rounded-lg bg-[var(--fill)] px-3 py-1.5 font-mono text-[13px]"><span className="text-[var(--fg-3)]">Lap {laps.length - i}</span><span>{fmt(l)}</span></div>)}</div>
    </div>
  );
}

function Timer() {
  const [min, setMin] = useState(90);
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (left === null) return;
    if (left <= 0) { notify('Timer finished', 'Time’s up — the film should be over.', { appId: 'clock' }); setLeft(null); return; }
    const t = window.setTimeout(() => setLeft((l) => (l === null ? null : l - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [left]);
  const show = left ?? min * 60;
  return (
    <div className="space-y-5 text-center">
      <div className="pt-6 font-mono text-5xl font-light tabular-nums">{pad(Math.floor(show / 3600))}:{pad(Math.floor(show / 60) % 60)}:{pad(show % 60)}</div>
      {left === null && (
        <>
          <input type="range" min={1} max={240} value={min} onChange={(e) => setMin(+e.target.value)} className="w-full accent-[var(--accent)]" aria-label="Minutes" />
          <div className="flex flex-wrap justify-center gap-2">{[30, 90, 120, 150, 180].map((m) => <Btn key={m} variant={m === min ? 'primary' : 'soft'} onClick={() => setMin(m)}>{m} min</Btn>)}</div>
        </>
      )}
      <div className="flex justify-center gap-2">
        {left === null ? <Btn variant="primary" onClick={() => setLeft(min * 60)} className="!px-5 !py-2"><TimerIcon size={14} />Start sleep timer</Btn> : <Btn variant="danger" onClick={() => setLeft(null)} className="!px-5 !py-2">Cancel</Btn>}
      </div>
    </div>
  );
}

export default function Clock(_: { win: WinState }) {
  const [tab, setTab] = useState<'world' | 'stopwatch' | 'timer'>('world');
  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-center border-b border-[var(--border)] p-3"><Segmented<'world' | 'stopwatch' | 'timer'> value={tab} onChange={setTab} options={[{ id: 'world', label: 'World' }, { id: 'stopwatch', label: 'Stopwatch' }, { id: 'timer', label: 'Timer' }]} /></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{tab === 'world' ? <World /> : tab === 'stopwatch' ? <Stopwatch /> : <Timer />}</div>
    </div>
  );
}
