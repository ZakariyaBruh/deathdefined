import * as L from 'lucide-react';
import { appMeta } from '../appMeta';

const map: Record<string, L.LucideIcon> = {
  Clapperboard: L.Clapperboard, Bookmark: L.Bookmark, Play: L.Play, Link2: L.Link2, BarChart3: L.BarChart3, HelpCircle: L.HelpCircle,
  Gamepad2: L.Gamepad2, Terminal: L.Terminal, StickyNote: L.StickyNote, FolderOpen: L.FolderOpen, Calculator: L.Calculator,
  Clock: L.Clock, ShoppingBag: L.ShoppingBag, Activity: L.Activity, Settings: L.Settings, Info: L.Info,
};

export function AppIcon({ id, size = 48, className = '' }: { id: string; size?: number; className?: string }) {
  const m = appMeta(id);
  const Icon = map[m?.icon ?? 'Info'] ?? L.Info;
  const mono = m?.from === '#fafafa';
  return (
    <div
      className={`relative shrink-0 grid place-items-center ${className}`}
      style={{
        width: size, height: size, borderRadius: size * 0.235,
        background: `linear-gradient(160deg, ${m?.from ?? '#888'}, ${m?.to ?? '#444'})`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35), inset 0 -1px 0 rgba(0,0,0,.25), 0 2px 8px rgba(0,0,0,.45)',
      }}
    >
      <Icon size={size * 0.52} strokeWidth={2} color={mono ? '#0a0a0a' : '#fff'} fill={id === 'player' ? '#fff' : 'none'} />
    </div>
  );
}
