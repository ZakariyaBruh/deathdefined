import { Link2, Play, Search } from 'lucide-react';
import { useState } from 'react';
import type { WinState } from '../types';
import { loadMeta } from '../catalog';
import { notify, openDetails, playMedia } from '../store';
import { Btn } from '../ui/bits';
import { cleanMediaId, isValidMediaId } from '../../utils/servers';
import { createCustomMediaItem } from '../../utils/imdbLookup';

export default function DirectPlay(_: { win: WinState }) {
  const [text, setText] = useState('');
  const [type, setType] = useState<'movie' | 'tv'>('movie');
  const [busy, setBusy] = useState(false);
  const id = cleanMediaId(text);
  const valid = isValidMediaId(id);

  const go = async (mode: 'play' | 'info') => {
    if (!valid) return;
    setBusy(true);
    const meta = await loadMeta(id);
    setBusy(false);
    const media = meta ?? createCustomMediaItem(id, undefined, type);
    if (!meta) notify('Offline metadata', 'Streaming with a generic title card.');
    mode === 'play' ? playMedia(media) : openDetails(media);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--fill-2)]"><Link2 size={28} /></div>
      <div>
        <h2 className="font-[var(--font-display)] text-2xl font-bold">Direct Play</h2>
        <p className="mt-1 text-[13px] text-[var(--fg-2)]">Paste an IMDb ID (<span className="font-mono">tt0111161</span>) or any imdb.com link.</p>
      </div>
      <div className="flex w-full max-w-sm items-center gap-2 rounded-xl bg-[var(--fill)] px-3 py-2.5 ring-1 ring-transparent focus-within:ring-[var(--fg-3)]">
        <Search size={15} className="text-[var(--fg-3)]" />
        <input autoFocus value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go('play')} placeholder="https://www.imdb.com/title/tt…" className="w-full bg-transparent font-mono text-[13px] outline-none placeholder:text-[var(--fg-3)]" />
      </div>
      <div className="h-4 text-[12px]">{text && (valid ? <span className="text-emerald-400">Recognised {id}</span> : <span className="text-[var(--fg-3)]">Not a valid IMDb identifier yet</span>)}</div>
      <div className="flex gap-2">
        <Btn variant="primary" disabled={!valid || busy} onClick={() => go('play')} className="!px-5 !py-2"><Play size={14} fill="currentColor" />{busy ? 'Looking up…' : 'Play'}</Btn>
        <Btn variant="soft" disabled={!valid || busy} onClick={() => go('info')} className="!px-5 !py-2">Details</Btn>
      </div>
      <div className="text-[11px] text-[var(--fg-3)]">If metadata is unavailable the title streams as a {type === 'tv' ? 'series' : 'film'}. <button className="underline" onClick={() => setType(type === 'movie' ? 'tv' : 'movie')}>Switch to {type === 'movie' ? 'series' : 'film'}</button></div>
    </div>
  );
}
