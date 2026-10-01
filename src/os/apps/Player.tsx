import { ChevronLeft, ChevronRight, ExternalLink, Lightbulb, LightbulbOff, Lock, Maximize, PictureInPicture2, RefreshCw, Theater } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { WinState } from '../types';
import type { MediaItem } from '../../types';
import { useLiveMeta } from '../catalog';
import { notify, openApp, patchWindow, recordHistory, setWindowTitle, toggleFloating, useOS } from '../store';
import { Btn } from '../ui/bits';
import { STREAMING_SERVERS } from '../../utils/servers';
import { matchesAgeFilter } from '../../utils/ageFilter';

export default function Player({ win }: { win: WinState }) {
  const { media: base, season = 1, episode = 1, serverId, nonce } = win.props as { media: MediaItem; season: number; episode: number; serverId: string; nonce: number };
  const { media } = useLiveMeta(base);
  const parental = useOS((s) => s.settings.parental);
  const pin = useOS((s) => s.settings.parentalPin);
  const [unlocked, setUnlocked] = useState(false);
  const [pinTry, setPinTry] = useState('');
  const [theater, setTheater] = useState(parental.autoTheaterMode);
  const [dim, setDim] = useState(parental.autoDimMode);
  const [reload, setReload] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  const server = STREAMING_SERVERS.find((s) => s.id === serverId) ?? STREAMING_SERVERS[0];
  const tv = media.type === 'tv';
  const allowed = matchesAgeFilter(media, 'ALL', parental) || unlocked;
  const url = tv ? server.getTvUrl(media.imdbId, season, episode) : server.getMovieUrl(media.imdbId);

  const seasonEpisodes = useMemo(() => (media.episodesList ?? []).filter((e) => e.season === season).sort((a, b) => a.episode - b.episode), [media, season]);
  const maxEp = seasonEpisodes.length ? seasonEpisodes[seasonEpisodes.length - 1].episode : media.episodesPerSeason ?? 24;
  const seasonCount = Math.max(media.seasons ?? 1, 1);
  const epTitle = seasonEpisodes.find((e) => e.episode === episode)?.title;

  useEffect(() => setWindowTitle(win.id, tv ? `${media.title} — S${season}·E${episode}` : media.title), [win.id, media.title, tv, season, episode]);

  const set = (patch: Record<string, unknown>) => patchWindow(win.id, { props: { ...win.props, ...patch } });
  const go = (s: number, e: number) => { set({ season: s, episode: e, nonce: Date.now() }); recordHistory(media, s, e); };
  const next = () => (episode < maxEp ? go(season, episode + 1) : season < seasonCount ? go(season + 1, 1) : notify('End of series', media.title));
  const prev = () => (episode > 1 ? go(season, episode - 1) : season > 1 ? go(season - 1, 1) : undefined);

  if (!allowed) {
    return (
      <div className="grid h-full place-items-center bg-black p-6 text-center text-white">
        <div className="max-w-sm">
          <Lock className="mx-auto mb-3" size={34} />
          <div className="text-lg font-bold">Restricted by parental controls</div>
          <p className="mt-1 text-sm text-white/60">“{media.title}” is rated {media.ageRating ?? 'above the allowed level'}. Change this in Settings → Parental Controls.</p>
          <div className="mt-4 flex justify-center gap-2">
            {pin && (
              <>
                <input value={pinTry} onChange={(e) => setPinTry(e.target.value.replace(/\D/g, '').slice(0, 8))} type="password" inputMode="numeric" placeholder="PIN" className="w-24 rounded-lg bg-white/10 px-3 py-1.5 text-center text-sm outline-none" onKeyDown={(e) => e.key === 'Enter' && pinTry === pin && setUnlocked(true)} />
                <Btn variant="primary" onClick={() => pinTry === pin ? setUnlocked(true) : notify('Incorrect PIN')}>Unlock</Btn>
              </>
            )}
            <Btn onClick={() => openApp('settings', { tab: 'parental' })} className="!bg-white/15 !text-white">Open Settings</Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={box} className={`flex h-full flex-col ${dim ? 'bg-black' : 'bg-neutral-950'}`}>
      {!theater && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 bg-black/60 px-2.5 py-1.5 text-white">
          {tv && (
            <>
              <button aria-label="Previous episode" onClick={prev} className="rounded-md p-1 hover:bg-white/15"><ChevronLeft size={16} /></button>
              <select aria-label="Season" value={season} onChange={(e) => go(+e.target.value, 1)} className="rounded-md bg-white/10 px-1.5 py-1 text-[12px] outline-none">{Array.from({ length: seasonCount }, (_, i) => <option className="text-black" key={i} value={i + 1}>S{i + 1}</option>)}</select>
              <select aria-label="Episode" value={episode} onChange={(e) => go(season, +e.target.value)} className="max-w-[200px] rounded-md bg-white/10 px-1.5 py-1 text-[12px] outline-none">
                {Array.from({ length: maxEp }, (_, i) => <option className="text-black" key={i} value={i + 1}>E{i + 1}{seasonEpisodes.find((e) => e.episode === i + 1)?.title ? ` · ${seasonEpisodes.find((e) => e.episode === i + 1)!.title}` : ''}</option>)}
              </select>
              <button aria-label="Next episode" onClick={next} className="rounded-md p-1 hover:bg-white/15"><ChevronRight size={16} /></button>
              <div className="mx-1 h-4 w-px bg-white/15" />
            </>
          )}
          <select aria-label="Server" value={server.id} onChange={(e) => set({ serverId: e.target.value, nonce: Date.now() })} className="rounded-md bg-white/10 px-1.5 py-1 text-[12px] outline-none">{STREAMING_SERVERS.map((s) => <option className="text-black" key={s.id} value={s.id}>{s.name}</option>)}</select>
          <button title="Reload" aria-label="Reload" onClick={() => setReload((r) => r + 1)} className="rounded-md p-1.5 hover:bg-white/15"><RefreshCw size={14} /></button>
          <div className="flex-1" />
          {epTitle && <span className="hidden max-w-[180px] truncate text-[12px] text-white/50 md:block">{epTitle}</span>}
          <button title="Lights" aria-label="Lights" onClick={() => setDim(!dim)} className={`rounded-md p-1.5 hover:bg-white/15 ${dim ? 'text-amber-300' : ''}`}>{dim ? <LightbulbOff size={14} /> : <Lightbulb size={14} />}</button>
          <button title="Theater mode" aria-label="Theater mode" onClick={() => setTheater(true)} className="rounded-md p-1.5 hover:bg-white/15"><Theater size={14} /></button>
          <button title="Float on top" aria-label="Float on top" onClick={() => toggleFloating(win.id)} className="rounded-md p-1.5 hover:bg-white/15"><PictureInPicture2 size={14} /></button>
          <button title="Full screen" aria-label="Full screen" onClick={() => box.current?.requestFullscreen?.()} className="rounded-md p-1.5 hover:bg-white/15"><Maximize size={14} /></button>
          <a title="Open in new tab" aria-label="Open in new tab" href={url} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 hover:bg-white/15"><ExternalLink size={14} /></a>
        </div>
      )}
      <div className="relative min-h-0 flex-1 bg-black">
        <iframe key={`${nonce}-${reload}-${server.id}-${season}-${episode}`} src={url} title={media.title} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="origin" className="absolute inset-0 h-full w-full border-0" />
        {theater && (
          <button onClick={() => setTheater(false)} className="absolute left-2 top-2 rounded-lg bg-black/70 px-2.5 py-1 text-[11px] text-white/80 opacity-0 transition hover:opacity-100 focus:opacity-100">Exit theater mode</button>
        )}
      </div>
    </div>
  );
}
