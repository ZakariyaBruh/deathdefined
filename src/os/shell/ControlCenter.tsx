import { Bell, BellOff, Expand, Lock, Moon, Power, Sun, Volume2, VolumeX } from 'lucide-react';
import { ACCENTS } from '../appMeta';
import { WALLPAPERS, wallpaperCss } from '../wallpapers';
import { closePanel, lock, restart, setSettings, useOS } from '../store';
import { Segmented } from '../ui/bits';

function Tile({ on, onClick, icon, label }: { on: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-start gap-2 rounded-2xl p-3 text-left transition ${on ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'bg-[var(--fill)] hover:bg-[var(--fill-2)]'}`}>
      {icon}
      <span className="text-[12px] font-semibold">{label}</span>
    </button>
  );
}

export function ControlCenter() {
  const s = useOS((st) => st.settings);
  return (
    <>
      <div className="fixed inset-0 z-[5900]" onPointerDown={closePanel} />
      <div className="panel fixed right-2 top-[36px] z-[6100] w-[340px] max-w-[calc(100vw-16px)] space-y-3 rounded-2xl p-3.5">
        <div className="grid grid-cols-2 gap-2">
          <Tile on={s.theme === 'light'} onClick={() => setSettings({ theme: s.theme === 'dark' ? 'light' : 'dark' })} icon={s.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} label={s.theme === 'dark' ? 'Dark Mode' : 'Light Mode'} />
          <Tile on={s.dnd} onClick={() => setSettings({ dnd: !s.dnd })} icon={s.dnd ? <BellOff size={18} /> : <Bell size={18} />} label={s.dnd ? 'Do Not Disturb' : 'Notifications'} />
          <Tile on={s.sounds} onClick={() => setSettings({ sounds: !s.sounds })} icon={s.sounds ? <Volume2 size={18} /> : <VolumeX size={18} />} label="System Sounds" />
          <Tile on={false} onClick={() => { closePanel(); document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); }} icon={<Expand size={18} />} label="Full Screen" />
        </div>

        <div className="rounded-2xl bg-[var(--fill)] p-3">
          <div className="mb-2 text-[12px] font-semibold text-[var(--fg-2)]">Display</div>
          <input type="range" min={40} max={100} value={s.brightness} onChange={(e) => setSettings({ brightness: +e.target.value })} className="w-full accent-[var(--accent)]" aria-label="Brightness" />
        </div>

        <div className="rounded-2xl bg-[var(--fill)] p-3">
          <div className="mb-2 text-[12px] font-semibold text-[var(--fg-2)]">Content rating</div>
          <Segmented value={s.parental.maxRatingTier} onChange={(v) => setSettings({ parental: { ...s.parental, maxRatingTier: v } })} options={[{ id: 'ALL', label: 'All' }, { id: 'TEEN', label: 'Teen' }, { id: 'FAMILY', label: 'Family' }]} />
        </div>

        <div className="rounded-2xl bg-[var(--fill)] p-3">
          <div className="mb-2 text-[12px] font-semibold text-[var(--fg-2)]">Accent</div>
          <div className="flex gap-2">
            {Object.entries(ACCENTS).map(([k, a]) => (
              <button key={k} aria-label={a.name} title={a.name} onClick={() => setSettings({ accent: k })} className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-[var(--panel)] ${s.accent === k ? 'ring-2 ring-[var(--fg)]' : ''}`} style={{ background: a.c }} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--fill)] p-3">
          <div className="mb-2 text-[12px] font-semibold text-[var(--fg-2)]">Wallpaper</div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {WALLPAPERS.map((w) => (
              <button key={w.id} aria-label={w.name} title={w.name} onClick={() => setSettings({ wallpaper: w.id })} className={`h-10 w-16 shrink-0 rounded-lg border ${s.wallpaper === w.id ? 'border-[var(--fg)]' : 'border-[var(--border)]'}`} style={{ background: wallpaperCss(w.id) }} />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => { closePanel(); lock(); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--fill)] py-2 text-[13px] hover:bg-[var(--fill-2)]"><Lock size={14} />Lock</button>
          <button onClick={() => { closePanel(); restart(); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--fill)] py-2 text-[13px] hover:bg-[var(--fill-2)]"><Power size={14} />Restart</button>
        </div>
      </div>
    </>
  );
}
