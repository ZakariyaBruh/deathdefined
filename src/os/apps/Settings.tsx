import { Download, Eye, Keyboard, Lock, Palette, Play, Settings2, ShieldCheck, Trash2, Upload, Database, LayoutGrid } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import type { WinState } from '../types';
import { ACCENTS, APP_META } from '../appMeta';
import { CATALOG } from '../catalog';
import { clearHistory, exportData, factoryReset, importData, notify, setSettings, useOS } from '../store';
import { WALLPAPERS, wallpaperCss } from '../wallpapers';
import { Btn, Segmented, Toggle } from '../ui/bits';
import { AppIcon } from '../ui/icons';
import { useWidth } from '../ui/hooks';
import { STREAMING_SERVERS } from '../../utils/servers';
import { getRatingBucketDescription } from '../../utils/ageFilter';

type Tab = 'general' | 'appearance' | 'dock' | 'parental' | 'playback' | 'data' | 'shortcuts';
const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Settings2 size={15} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={15} /> },
  { id: 'dock', label: 'Dock', icon: <LayoutGrid size={15} /> },
  { id: 'parental', label: 'Parental Controls', icon: <ShieldCheck size={15} /> },
  { id: 'playback', label: 'Playback', icon: <Play size={15} /> },
  { id: 'data', label: 'Data & Backup', icon: <Database size={15} /> },
  { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={15} /> },
];

const Row = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-3">
    <div className="min-w-0"><div className="text-[13px] font-semibold">{label}</div>{hint && <div className="text-[12px] text-[var(--fg-2)]">{hint}</div>}</div>
    <div className="shrink-0">{children}</div>
  </div>
);

const SHORTCUTS: [string, string][] = [['Ctrl / ⌘ + K', 'Spotlight search'], ['Alt + Space', 'Spotlight search'], ['F3', 'Mission Control'], ['Alt + D', 'Launchpad'], ['Alt + T', 'New Terminal'], ['Alt + W', 'Close window'], ['Alt + M', 'Minimise window'], ['Alt + Enter', 'Zoom window'], ['Alt + .', 'Cycle windows'], ['Alt + L', 'Lock screen'], ['Esc', 'Dismiss panels'], ['Drag to screen edge', 'Snap window left / right / maximise']];

export default function Settings({ win }: { win: WinState }) {
  const s = useOS((st) => st.settings);
  const [tab, setTab] = useState<Tab>((win.props?.tab as Tab) ?? 'general');
  const [pinOk, setPinOk] = useState(false);
  const [pinTry, setPinTry] = useState('');
  const [newPin, setNewPin] = useState('');
  const [url, setUrl] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const [ref, width] = useWidth<HTMLDivElement>();
  const narrow = width < 600;
  const set = setSettings;
  const par = s.parental;
  const setPar = (p: Partial<typeof par>) => set({ parental: { ...par, ...p } });
  const guarded = tab === 'parental' && s.parentalPin && !pinOk;

  const backdrops = CATALOG.filter((m) => m.backdropUrl).slice(0, 8);

  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([exportData()], { type: 'application/json' }));
    a.download = `cineos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div ref={ref} className={`flex h-full ${narrow ? 'flex-col' : ''}`}>
      <aside className={`shrink-0 border-[var(--border)] p-2 ${narrow ? 'no-scrollbar flex gap-1 overflow-x-auto border-b' : 'w-[200px] space-y-0.5 border-r'}`} style={{ background: 'var(--sidebar)' }}>
        {TABS.map((t) => <button key={t.id} onClick={() => setTab(t.id)} className={`flex shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] ${narrow ? '' : 'w-full'} ${tab === t.id ? 'bg-[var(--fill-3)] font-semibold' : 'text-[var(--fg-2)] hover:bg-[var(--fill)]'}`}>{t.icon}{t.label}</button>)}
      </aside>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {guarded ? (
          <div className="mx-auto mt-16 max-w-xs text-center">
            <Lock className="mx-auto mb-3" size={30} />
            <div className="font-semibold">Parental Controls are locked</div>
            <input type="password" inputMode="numeric" autoFocus value={pinTry} onChange={(e) => setPinTry(e.target.value.replace(/\D/g, '').slice(0, 8))} onKeyDown={(e) => { if (e.key === 'Enter') pinTry === s.parentalPin ? setPinOk(true) : notify('Incorrect PIN'); }} placeholder="Enter PIN" className="mt-4 w-full rounded-xl bg-[var(--fill)] px-4 py-2.5 text-center text-lg tracking-[0.4em] outline-none" />
            <Btn variant="primary" className="mt-3 w-full !py-2" onClick={() => (pinTry === s.parentalPin ? setPinOk(true) : notify('Incorrect PIN'))}>Unlock</Btn>
          </div>
        ) : (
          <>
            {tab === 'general' && (<>
              <Row label="Your name" hint="Shown on the lock screen"><input value={s.userName} onChange={(e) => set({ userName: e.target.value.slice(0, 24) || 'Guest' })} className="w-40 rounded-lg bg-[var(--fill)] px-3 py-1.5 text-[13px] outline-none" /></Row>
              <Row label="24-hour clock"><Toggle on={s.clock24} onChange={(v) => set({ clock24: v })} label="24-hour clock" /></Row>
              <Row label="System sounds" hint="Boot chime and interface sounds"><Toggle on={s.sounds} onChange={(v) => set({ sounds: v })} label="Sounds" /></Row>
              <Row label="Reduce motion"><Toggle on={s.reduceMotion} onChange={(v) => set({ reduceMotion: v })} label="Reduce motion" /></Row>
              <Row label="Desktop widgets"><Toggle on={s.showWidgets} onChange={(v) => set({ showWidgets: v })} label="Widgets" /></Row>
              <Row label="Desktop icons"><Toggle on={s.showDesktopIcons} onChange={(v) => set({ showDesktopIcons: v })} label="Desktop icons" /></Row>
              <Row label="Skip boot animation"><Toggle on={s.skipBoot} onChange={(v) => set({ skipBoot: v })} label="Skip boot" /></Row>
              <Row label="Do Not Disturb" hint="Silence toast notifications"><Toggle on={s.dnd} onChange={(v) => set({ dnd: v })} label="Do not disturb" /></Row>
            </>)}

            {tab === 'appearance' && (<>
              <Row label="Theme"><Segmented value={s.theme} onChange={(v) => set({ theme: v })} options={[{ id: 'dark', label: 'Dark' }, { id: 'light', label: 'Light' }]} /></Row>
              <Row label="Accent colour"><div className="flex gap-2">{Object.entries(ACCENTS).map(([k, a]) => <button key={k} aria-label={a.name} title={a.name} onClick={() => set({ accent: k })} className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-[var(--win-solid)] ${s.accent === k ? 'ring-2 ring-[var(--fg)]' : ''}`} style={{ background: a.c }} />)}</div></Row>
              <Row label="Brightness"><input type="range" min={40} max={100} value={s.brightness} onChange={(e) => set({ brightness: +e.target.value })} className="w-40 accent-[var(--accent)]" aria-label="Brightness" /></Row>
              <div className="py-3 text-[13px] font-semibold">Wallpaper</div>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {WALLPAPERS.map((w) => <button key={w.id} onClick={() => set({ wallpaper: w.id })} className={`aspect-video overflow-hidden rounded-xl border-2 text-left ${s.wallpaper === w.id ? 'border-[var(--accent)]' : 'border-transparent'}`} style={{ background: wallpaperCss(w.id) }}><span className="m-1.5 inline-block rounded bg-black/50 px-1.5 text-[10px] text-white">{w.name}</span></button>)}
                {backdrops.map((m) => <button key={m.id} aria-label={m.title} onClick={() => set({ wallpaper: `img:${m.backdropUrl}` })} className={`aspect-video overflow-hidden rounded-xl border-2 ${s.wallpaper === `img:${m.backdropUrl}` ? 'border-[var(--accent)]' : 'border-transparent'}`}><img src={m.backdropUrl} alt="" loading="lazy" className="h-full w-full object-cover" /></button>)}
              </div>
              <div className="mt-3 flex gap-2"><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Custom image URL (https://…)" className="min-w-0 flex-1 rounded-lg bg-[var(--fill)] px-3 py-1.5 text-[13px] outline-none" /><Btn variant="soft" onClick={() => /^https?:\/\//.test(url) && set({ wallpaper: `img:${url.replace(/"/g, '%22')}` })}>Apply</Btn></div>
            </>)}

            {tab === 'dock' && (<>
              <Row label="Magnification"><Toggle on={s.dockMagnify} onChange={(v) => set({ dockMagnify: v })} label="Dock magnification" /></Row>
              <Row label="Icon size"><input type="range" min={36} max={72} value={s.dockSize} onChange={(e) => set({ dockSize: +e.target.value })} className="w-40 accent-[var(--accent)]" aria-label="Dock size" /></Row>
              <div className="py-3 text-[13px] font-semibold">Pinned apps</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {APP_META.filter((a) => !a.hidden).map((a) => { const on = s.dockPinned.includes(a.id); return (
                  <button key={a.id} onClick={() => set({ dockPinned: on ? s.dockPinned.filter((x) => x !== a.id) : [...s.dockPinned, a.id] })} className={`flex items-center gap-2 rounded-xl p-2 text-left text-[13px] ${on ? 'bg-[var(--fill-3)]' : 'bg-[var(--fill)] opacity-60'}`}><AppIcon id={a.id} size={26} />{a.name}</button>); })}
              </div>
            </>)}

            {tab === 'parental' && (<>
              <div className="mb-2 flex items-center gap-2 rounded-xl bg-[var(--fill)] p-3 text-[12px] text-[var(--fg-2)]"><Eye size={14} />Hidden titles are removed from browsing, search, widgets and playback.</div>
              <Row label="Maximum rating" hint="Quick preset"><Segmented value={par.maxRatingTier} onChange={(v) => setPar({ maxRatingTier: v })} options={[{ id: 'ALL', label: 'All' }, { id: 'TEEN', label: 'Teen' }, { id: 'FAMILY', label: 'Family' }]} /></Row>
              <div className="py-3 text-[13px] font-semibold">Allowed ratings</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {(['G', 'PG', 'PG-13', 'R'] as const).map((r) => { const on = par.allowedRatings.includes(r); const d = getRatingBucketDescription(r); return (
                  <button key={r} onClick={() => setPar({ allowedRatings: on ? par.allowedRatings.filter((x) => x !== r) : [...par.allowedRatings, r] })} className={`rounded-xl p-3 text-left ${on ? 'bg-[var(--fill-3)]' : 'bg-[var(--fill)] opacity-60'}`}><div className="text-[13px] font-bold">{d.label}</div><div className="text-[11px] text-[var(--fg-2)]">{d.desc}</div></button>); })}
              </div>
              <div className="py-3 text-[13px] font-semibold">PIN protection</div>
              <div className="flex gap-2">
                <input value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" placeholder={s.parentalPin ? 'New PIN' : 'Set a PIN (4–8 digits)'} className="w-52 rounded-lg bg-[var(--fill)] px-3 py-1.5 text-[13px] outline-none" />
                <Btn variant="primary" disabled={newPin.length < 4} onClick={() => { set({ parentalPin: newPin }); setNewPin(''); notify('PIN saved', 'Parental Controls are now protected.'); }}>Save</Btn>
                {s.parentalPin && <Btn variant="danger" onClick={() => { set({ parentalPin: '' }); notify('PIN removed'); }}>Remove</Btn>}
              </div>
              <p className="mt-2 text-[12px] text-[var(--fg-3)]">With a PIN set, the Parental Controls pane is locked and restricted titles can be unlocked one at a time.</p>
            </>)}

            {tab === 'playback' && (<>
              <Row label="Default server" hint="Used when you press play"><select value={par.defaultServerId} onChange={(e) => setPar({ defaultServerId: e.target.value })} className="rounded-lg bg-[var(--fill)] px-2.5 py-1.5 text-[13px] outline-none">{STREAMING_SERVERS.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.host}</option>)}</select></Row>
              <Row label="Theater mode by default" hint="Hide the player toolbar"><Toggle on={par.autoTheaterMode} onChange={(v) => setPar({ autoTheaterMode: v })} label="Theater" /></Row>
              <Row label="Lights off by default" hint="Black surround while watching"><Toggle on={par.autoDimMode} onChange={(v) => setPar({ autoDimMode: v })} label="Lights off" /></Row>
            </>)}

            {tab === 'data' && (<>
              <p className="pb-2 text-[12px] text-[var(--fg-2)]">Everything is stored locally in this browser. Export a backup to move between devices.</p>
              <Row label="Export backup" hint="Settings, watchlist, history, notes, ratings"><Btn variant="soft" onClick={download}><Download size={13} />Export</Btn></Row>
              <Row label="Import backup"><><input ref={file} type="file" accept="application/json" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; notify(importData(await f.text()) ? 'Backup restored' : 'Not a CineOS backup'); e.target.value = ''; }} /><Btn variant="soft" onClick={() => file.current?.click()}><Upload size={13} />Import</Btn></></Row>
              <Row label="Clear watch history"><Btn variant="danger" onClick={() => { clearHistory(); notify('History cleared'); }}><Trash2 size={13} />Clear</Btn></Row>
              <Row label="Reset CineOS" hint="Erase all data and restart"><Btn variant="danger" onClick={() => { if (confirm('Erase all CineOS data on this device?')) factoryReset(); }}>Factory reset</Btn></Row>
            </>)}

            {tab === 'shortcuts' && (
              <div className="space-y-1">{SHORTCUTS.map(([k, d]) => <div key={k} className="flex items-center justify-between rounded-xl bg-[var(--fill)] px-3 py-2 text-[13px]"><span>{d}</span><kbd className="rounded-md bg-[var(--fill-3)] px-2 py-0.5 font-mono text-[11px]">{k}</kbd></div>)}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
