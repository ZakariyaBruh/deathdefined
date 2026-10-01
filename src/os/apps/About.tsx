import { Play } from 'lucide-react';
import type { WinState } from '../types';
import { CATALOG } from '../catalog';
import { useOS } from '../store';

export default function About(_: { win: WinState }) {
  const bootedAt = useOS((s) => s.bootedAt);
  const rows: [string, string][] = [
    ['Version', '1.0.0 “Premiere”'],
    ['Archive', `${CATALOG.length} featured titles + global catalog search`],
    ['Display', `${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio}×`],
    ['Browser', navigator.userAgent.replace(/\(.*?\)/, '').trim().slice(0, 48)],
    ['Uptime', `${Math.floor((Date.now() - bootedAt) / 60000)} minutes`],
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="grid h-24 w-24 place-items-center rounded-[26px] bg-white text-black shadow-2xl"><Play size={44} fill="currentColor" className="ml-1" /></div>
      <div>
        <div className="font-[var(--font-display)] text-3xl font-extrabold tracking-[0.2em]">CINESTREAM</div>
        <div className="text-[13px] text-[var(--fg-2)]">The operating system for cinema and television</div>
      </div>
      <dl className="w-full max-w-xs space-y-1.5 text-left text-[13px]">
        {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b border-[var(--border)] pb-1.5"><dt className="text-[var(--fg-3)]">{k}</dt><dd className="text-right">{v}</dd></div>)}
      </dl>
      <div className="text-[11px] text-[var(--fg-3)]">Streams are provided by third-party embeds. Metadata via Cinemeta.</div>
    </div>
  );
}
