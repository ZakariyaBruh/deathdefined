import { Star } from 'lucide-react';
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { MediaItem } from '../../types';
import { rate, useOS } from '../store';

export function Poster({ media, className = '', onClick, children }: { media: MediaItem; className?: string; onClick?: () => void; children?: ReactNode }) {
  const [bad, setBad] = useState(false);
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-neutral-900 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {!bad ? (
        <img src={media.posterUrl} alt={media.title} loading="lazy" draggable={false} onError={() => setBad(true)} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center p-3 text-center text-xs font-semibold text-neutral-400 bg-gradient-to-br from-neutral-800 to-neutral-950">{media.title}</div>
      )}
      {children}
    </div>
  );
}

export function Btn({ variant = 'ghost', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'soft' }) {
  const v = {
    primary: 'bg-[var(--accent)] text-[var(--accent-fg)] hover:brightness-110 font-semibold',
    ghost: 'bg-[var(--fill)] hover:bg-[var(--fill-2)] text-[var(--fg)]',
    soft: 'bg-[var(--fill-2)] hover:bg-[var(--fill-3)] text-[var(--fg)]',
    danger: 'bg-red-500/15 hover:bg-red-500/25 text-red-400',
  }[variant];
  return <button {...p} className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] transition active:scale-[.97] disabled:opacity-40 disabled:pointer-events-none ${v} ${className}`} />;
}

export function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide bg-[var(--fill-2)] text-[var(--fg-2)] ${className}`}>{children}</span>;
}

export function Stars({ id, size = 16 }: { id: string; size?: number }) {
  const mine = useOS((s) => s.ratings[id] ?? 0);
  const [hover, setHover] = useState(0);
  const val = hover || mine;
  return (
    <div className="inline-flex gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onMouseEnter={() => setHover(n)} onClick={() => rate(id, n)} aria-label={`Rate ${n}`} className="p-0.5">
          <Star size={size} className={n <= val ? 'text-amber-400' : 'text-[var(--fg-3)]'} fill={n <= val ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-6 w-10 shrink-0 rounded-full transition ${on ? 'bg-[var(--accent)]' : 'bg-[var(--fill-3)]'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full shadow transition-all ${on ? 'left-[18px] bg-[var(--accent-fg)]' : 'left-0.5 bg-white'}`} />
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-[var(--fill)] p-0.5">
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)} className={`rounded-md px-3 py-1 text-[12px] transition ${value === o.id ? 'bg-[var(--fill-3)] text-[var(--fg)] font-semibold shadow-sm' : 'text-[var(--fg-2)] hover:text-[var(--fg)]'}`}>{o.label}</button>
      ))}
    </div>
  );
}

export function Empty({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="h-full min-h-[200px] grid place-items-center text-center p-8">
      <div className="text-[var(--fg-3)]">
        <div className="mx-auto mb-3 grid place-items-center">{icon}</div>
        <div className="text-sm font-semibold text-[var(--fg-2)]">{title}</div>
        {hint && <div className="text-xs mt-1 max-w-xs mx-auto">{hint}</div>}
      </div>
    </div>
  );
}
