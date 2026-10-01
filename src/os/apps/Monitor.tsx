import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { WinState } from '../types';
import { appMeta } from '../appMeta';
import { closeWindow, focusWindow, useOS } from '../store';
import { Btn, Segmented } from '../ui/bits';
import { AppIcon } from '../ui/icons';
import { STREAMING_SERVERS } from '../../utils/servers';

function Spark({ data, max, color = 'var(--accent)' }: { data: number[]; max: number; color?: string }) {
  const pts = data.map((v, i) => `${(i / Math.max(1, data.length - 1)) * 200},${50 - Math.min(1, v / max) * 46}`).join(' ');
  return <svg viewBox="0 0 200 50" className="h-16 w-full" preserveAspectRatio="none"><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" /><polyline points={`0,50 ${pts} 200,50`} fill={color} opacity=".12" /></svg>;
}

const storageBytes = () => { try { let n = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i)!; n += k.length + (localStorage.getItem(k)?.length ?? 0); } return n * 2; } catch { return 0; } };

export default function Monitor(_: { win: WinState }) {
  const [tab, setTab] = useState<'proc' | 'perf' | 'net'>('proc');
  const windows = useOS((s) => s.windows);
  const bootedAt = useOS((s) => s.bootedAt);
  const [fps, setFps] = useState<number[]>(Array(60).fill(60));
  const [heap, setHeap] = useState<number[]>([]);
  const [tick, setTick] = useState(0);
  const [pings, setPings] = useState<Record<string, number | 'fail' | 'testing'>>({});
  const frames = useRef(0);

  useEffect(() => {
    let raf = 0, last = performance.now();
    const loop = (t: number) => { frames.current++; if (t - last >= 1000) { const f = Math.round((frames.current * 1000) / (t - last)); setFps((a) => [...a.slice(1), f]); frames.current = 0; last = t; const m = (performance as any).memory; if (m) setHeap((h) => [...h.slice(-59), m.usedJSHeapSize / 1048576]); setTick((x) => x + 1); } raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const testServers = async () => {
    setPings(Object.fromEntries(STREAMING_SERVERS.map((s) => [s.id, 'testing' as const])));
    await Promise.all(STREAMING_SERVERS.map(async (s) => {
      const t0 = performance.now();
      try { await fetch(`https://${s.host}/favicon.ico`, { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(6000) }); setPings((p) => ({ ...p, [s.id]: Math.round(performance.now() - t0) })); }
      catch { setPings((p) => ({ ...p, [s.id]: 'fail' })); }
    }));
  };

  const conn = (navigator as any).connection;
  const mem = (performance as any).memory;
  const upMin = Math.floor((Date.now() - bootedAt) / 60000);
  void tick;

  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-center border-b border-[var(--border)] p-3"><Segmented<'proc' | 'perf' | 'net'> value={tab} onChange={setTab} options={[{ id: 'proc', label: 'Processes' }, { id: 'perf', label: 'Performance' }, { id: 'net', label: 'Network' }]} /></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === 'proc' && (
          <table className="w-full text-left text-[13px]">
            <thead className="text-[11px] uppercase tracking-wider text-[var(--fg-3)]"><tr><th className="pb-2">Name</th><th className="pb-2">PID</th><th className="pb-2">State</th><th className="pb-2">Age</th><th /></tr></thead>
            <tbody>
              {windows.map((w) => (
                <tr key={w.id} className="border-t border-[var(--border)] hover:bg-[var(--fill)]">
                  <td className="py-1.5"><button onClick={() => focusWindow(w.id)} className="flex items-center gap-2 text-left"><AppIcon id={w.appId} size={20} />{appMeta(w.appId)?.name}<span className="max-w-[160px] truncate text-[var(--fg-3)]">{w.title !== appMeta(w.appId)?.name ? `— ${w.title}` : ''}</span></button></td>
                  <td className="font-mono text-[11px] text-[var(--fg-3)]">{w.id}</td>
                  <td>{w.minimized ? 'Minimised' : w.floating ? 'Floating' : 'Running'}</td>
                  <td className="text-[var(--fg-2)]">{Math.max(0, Math.round((Date.now() - w.openedAt) / 60000))}m</td>
                  <td className="text-right"><Btn variant="danger" onClick={() => closeWindow(w.id)} aria-label="Force quit"><X size={12} />Quit</Btn></td>
                </tr>
              ))}
              {windows.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-[var(--fg-3)]">No running apps</td></tr>}
            </tbody>
          </table>
        )}
        {tab === 'perf' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[var(--fill)] p-4"><div className="flex justify-between text-[12px]"><span className="font-semibold">Frame rate</span><span className="tabular-nums">{fps[fps.length - 1]} fps</span></div><Spark data={fps} max={75} /></div>
            <div className="rounded-2xl bg-[var(--fill)] p-4"><div className="flex justify-between text-[12px]"><span className="font-semibold">JS memory</span><span className="tabular-nums">{mem ? `${(mem.usedJSHeapSize / 1048576).toFixed(1)} MB` : 'Not exposed by this browser'}</span></div>{heap.length > 1 && <Spark data={heap} max={Math.max(...heap) * 1.2} color="#34d399" />}</div>
            <div className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
              {[['Uptime', `${upMin} min`], ['Windows', String(windows.length)], ['DOM nodes', String(document.getElementsByTagName('*').length)], ['Storage', `${(storageBytes() / 1024).toFixed(1)} KB`], ['CPU threads', String(navigator.hardwareConcurrency ?? '—')], ['Device memory', (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : '—'], ['Screen', `${screen.width}×${screen.height}`], ['Pixel ratio', `${window.devicePixelRatio}×`]].map(([k, v]) => <div key={k} className="rounded-xl bg-[var(--fill)] p-3"><div className="text-[11px] text-[var(--fg-3)]">{k}</div><div className="font-semibold tabular-nums">{v}</div></div>)}
            </div>
          </div>
        )}
        {tab === 'net' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-[13px]">
              {[['Status', navigator.onLine ? 'Online' : 'Offline'], ['Type', conn?.effectiveType ?? '—'], ['Downlink', conn?.downlink ? `${conn.downlink} Mbps` : '—']].map(([k, v]) => <div key={k} className="rounded-xl bg-[var(--fill)] p-3"><div className="text-[11px] text-[var(--fg-3)]">{k}</div><div className="font-semibold">{v}</div></div>)}
            </div>
            <div className="flex items-center justify-between"><h3 className="text-[13px] font-bold">Streaming servers</h3><Btn variant="primary" onClick={testServers}>Test latency</Btn></div>
            <div className="space-y-1.5">
              {STREAMING_SERVERS.map((s) => {
                const p = pings[s.id];
                return <div key={s.id} className="flex items-center justify-between rounded-xl bg-[var(--fill)] px-3 py-2 text-[13px]"><div><div className="font-semibold">{s.name}</div><div className="font-mono text-[11px] text-[var(--fg-3)]">{s.host}</div></div><div className={`tabular-nums ${p === 'fail' ? 'text-red-400' : typeof p === 'number' ? (p < 300 ? 'text-emerald-400' : 'text-amber-400') : 'text-[var(--fg-3)]'}`}>{p === undefined ? '—' : p === 'testing' ? '…' : p === 'fail' ? 'unreachable' : `${p} ms`}</div></div>;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
