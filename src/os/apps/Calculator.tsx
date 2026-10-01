import { useState } from 'react';
import type { WinState } from '../types';
import { evaluate, fmtNum } from '../math';

const KEYS = ['AC', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '⌫', '='];

export default function Calculator(_: { win: WinState }) {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const press = (k: string) => {
    if (k === 'AC') { setExpr(''); setResult(null); return; }
    if (k === '⌫') { setExpr((e) => e.slice(0, -1)); return; }
    if (k === '=') { const v = evaluate(expr); if (v !== null) { setResult(fmtNum(v)); setExpr(fmtNum(v)); } else setResult('Error'); return; }
    if (k === '±') { setExpr((e) => (e.startsWith('-') ? e.slice(1) : e ? '-' + e : e)); return; }
    setResult(null);
    setExpr((e) => (result && !/[÷×+\-%]/.test(k) && !/[+\-×÷%]$/.test(e) && /^[\d.]$/.test(k) && result !== 'Error' ? k : e + k));
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const map: Record<string, string> = { '*': '×', '/': '÷', Enter: '=', Backspace: '⌫', Escape: 'AC' };
    const k = map[e.key] ?? e.key;
    if (KEYS.includes(k)) { e.preventDefault(); press(k); }
  };

  const live = evaluate(expr);
  return (
    <div tabIndex={0} onKeyDown={onKey} className="flex h-full flex-col p-3 outline-none">
      <div className="flex min-h-[84px] flex-col items-end justify-end px-2 pb-2">
        <div className="max-w-full truncate text-[13px] text-[var(--fg-3)]">{result === null && live !== null && /[-+×÷%]/.test(expr.slice(1)) ? `= ${fmtNum(live)}` : ' '}</div>
        <div className="max-w-full truncate text-[40px] font-light tabular-nums">{expr || '0'}</div>
      </div>
      <div className="grid flex-1 grid-cols-4 gap-1.5">
        {KEYS.map((k) => {
          const op = /[÷×\-+=]/.test(k);
          return <button key={k} onClick={() => press(k)} className={`rounded-xl text-[18px] transition active:scale-95 ${op ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-semibold' : /AC|±|%|⌫/.test(k) ? 'bg-[var(--fill-3)]' : 'bg-[var(--fill-2)]'} ${k === '0' ? '' : ''}`}>{k}</button>;
        })}
      </div>
    </div>
  );
}
