import { useEffect, useRef, useState } from 'react';
import type { WinState } from '../types';
import type { MediaItem } from '../../types';
import { APP_META, ACCENTS, appMeta, isInstalled } from '../appMeta';
import { CATALOG, loadMeta, localSearch } from '../catalog';
import { evaluate, fmtNum } from '../math';
import {
  closeApp, closeWindow, exportData, getState, lock, notify, openApp, openDetails, playMedia, rate, restart, setSettings, setState,
  shutdown, toggleWatchlist,
} from '../store';
import { WALLPAPERS } from '../wallpapers';
import { children, fmtSize, normalize, stat } from '../vfs';
import { searchAllMedia } from '../../utils/imdbApi';
import { STREAMING_SERVERS, cleanMediaId, isValidMediaId } from '../../utils/servers';
import { createCustomMediaItem } from '../../utils/imdbLookup';

interface Line { k: 'in' | 'out' | 'err' | 'dim'; t: string }
const VERSION = '1.0.0';

const FORTUNES = [
  'A film is never really good unless the camera is an eye in the head of a poet. — Orson Welles',
  'Cinema is a matter of what’s in the frame and what’s out. — Martin Scorsese',
  'Movies are a mirror of ourselves. Watch more of them.',
  'Every great film should seem new every time you see it. — Roger Ebert',
  'Don’t forget the popcorn.',
];

const LOGO = [
  '   ______ _             ____  _____ ',
  '  / ____/(_)___  ___   / __ \\/ ___/ ',
  ' / /    / / __ \\/ _ \\ / / / /\\__ \\  ',
  '/ /___ / / / / /  __// /_/ /___/ /  ',
  '\\____//_/_/ /_/\\___/ \\____//____/   ',
];

async function findMedia(q: string): Promise<MediaItem | null> {
  const s = q.trim();
  if (!s) return null;
  if (/tt\d{5,}/i.test(s)) { const id = cleanMediaId(s); return (await loadMeta(id)) ?? createCustomMediaItem(id); }
  const local = localSearch(s, getState().watchlist.concat(CATALOG));
  if (local[0]) return local[0];
  const online = await searchAllMedia(s).catch(() => []);
  return online[0] ?? null;
}

const COMMANDS = ['help', 'clear', 'echo', 'date', 'whoami', 'hostname', 'uname', 'uptime', 'neofetch', 'pwd', 'cd', 'ls', 'cat', 'open', 'apps', 'ps', 'kill', 'play', 'search', 'info', 'trending', 'random', 'watchlist', 'history', 'rate', 'theme', 'accent', 'wallpaper', 'notify', 'lock', 'reboot', 'shutdown', 'matrix', 'cowsay', 'fortune', 'calc', 'servers', 'version', 'sound', 'parental', 'export', 'exit', 'sudo', 'rm', 'man', 'figlet'];

export default function Terminal({ win }: { win: WinState }) {
  const [lines, setLines] = useState<Line[]>([
    ...LOGO.map((t) => ({ k: 'dim' as const, t })),
    { k: 'out', t: `CineOS ${VERSION} — type "help" for commands.` },
  ]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('/home');
  const [busy, setBusy] = useState(false);
  const [matrix, setMatrix] = useState(false);
  const hist = useRef<string[]>(getState().terminalHistory.slice());
  const hi = useRef(-1);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cwdRef = useRef(cwd);
  cwdRef.current = cwd;

  useEffect(() => { scroller.current?.scrollTo({ top: 1e9 }); }, [lines, busy]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!matrix) return;
    const c = canvas.current!; const ctx = c.getContext('2d')!;
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight; };
    resize();
    const cols = Math.floor(c.width / 14);
    const drops = Array(cols).fill(0).map(() => Math.random() * -40);
    const t = window.setInterval(() => {
      ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#22c55e'; ctx.font = '14px monospace';
      drops.forEach((y, i) => { ctx.fillText(String.fromCharCode(0x30a0 + Math.random() * 96), i * 14, y * 14); drops[i] = y * 14 > c.height && Math.random() > 0.975 ? 0 : y + 1; });
    }, 50);
    const stop = window.setTimeout(() => setMatrix(false), 12000);
    return () => { window.clearInterval(t); window.clearTimeout(stop); };
  }, [matrix]);

  const print = (t: string, k: Line['k'] = 'out') => setLines((l) => [...l, ...t.split('\n').map((x) => ({ k, t: x }))].slice(-600));

  const run = async (raw: string) => {
    const line = raw.trim();
    print(`${cwdRef.current === '/home' ? '~' : cwdRef.current} ❯ ${raw}`, 'in');
    if (!line) return;
    hist.current = [...hist.current.filter((h) => h !== line), line].slice(-80);
    setState({ terminalHistory: hist.current });
    const [cmd, ...args] = line.split(/\s+/);
    const rest = args.join(' ');
    const s = getState();
    const ok = (t: string) => print(t);
    const err = (t: string) => print(t, 'err');

    switch (cmd) {
      case 'help':
        ok(`CineOS shell ${VERSION}\n
  Cinema     play <title|ttID>   info <title>   search <q>   trending   random
             watchlist [add|rm <title>]   history   rate <title> <1-5>   servers
  Files      ls [path]   cd <path>   pwd   cat <file>   open <app|file>
  System     apps   ps   kill <app>   neofetch   uname   uptime   date   whoami
             theme [dark|light]   accent <name>   wallpaper [id]   sound on|off
             parental all|teen|family   notify <msg>   lock   reboot   shutdown
  Misc       calc <expr>   echo   cowsay   fortune   matrix   figlet   export   clear   exit

  Tab completes commands and paths · ↑/↓ browses history · Ctrl+L clears`);
        break;
      case 'clear': setLines([]); break;
      case 'echo': ok(rest); break;
      case 'date': ok(new Date().toString()); break;
      case 'whoami': ok(s.settings.userName.toLowerCase()); break;
      case 'hostname': ok('cineos.local'); break;
      case 'version': ok(`CineOS ${VERSION}`); break;
      case 'uname': ok(args[0] === '-a' ? `CineOS cineos.local ${VERSION} #1 SMP ${navigator.platform} browser` : 'CineOS'); break;
      case 'uptime': { const m = Math.floor((Date.now() - s.bootedAt) / 60000); ok(`up ${m} min, ${s.windows.length} windows, ${s.watchlist.length} saved titles`); break; }
      case 'pwd': ok(cwdRef.current); break;
      case 'neofetch': {
        const info = [`${s.settings.userName.toLowerCase()}@cineos`, '───────────────', `OS: CineOS ${VERSION}`, `Host: ${navigator.platform || 'browser'}`, `Shell: cinesh`, `Theme: ${s.settings.theme} / ${ACCENTS[s.settings.accent]?.name}`, `Windows: ${s.windows.length}`, `Archive: ${CATALOG.length} featured titles`, `Watchlist: ${s.watchlist.length}`, `Resolution: ${window.innerWidth}x${window.innerHeight}`];
        const rows = Math.max(info.length, LOGO.length);
        ok(Array.from({ length: rows }, (_, i) => (LOGO[i] ?? ' '.repeat(36)).padEnd(38) + (info[i] ?? '')).join('\n'));
        break;
      }
      case 'ls': {
        const flags = args.filter((a) => a.startsWith('-')); const target = normalize(cwdRef.current, args.find((a) => !a.startsWith('-')) ?? '.');
        const kids = children(target);
        if (!kids) { err(`ls: ${target}: Not a directory`); break; }
        if (!kids.length) { ok('(empty)'); break; }
        ok(flags.some((f) => f.includes('l')) ? kids.map((k) => `${k.kind === 'dir' ? 'd' : '-'}rw-  ${fmtSize(k.size).padStart(8)}  ${k.name}${k.kind === 'dir' ? '/' : ''}`).join('\n') : kids.map((k) => (k.kind === 'dir' ? k.name + '/' : k.name)).join('   '));
        break;
      }
      case 'cd': {
        const t = normalize(cwdRef.current, args[0] ?? '~');
        if (t === '/' || children(t)) setCwd(t); else err(`cd: ${args[0]}: No such directory`);
        break;
      }
      case 'cat': {
        const n = args[0] && stat(normalize(cwdRef.current, args.join(' ')));
        if (!n || n.kind === 'dir') err(`cat: ${args.join(' ') || '(missing)'}: No such file`); else ok(n.read?.() ?? '(binary)');
        break;
      }
      case 'open': {
        const a = APP_META.find((m) => m.id === args[0]?.toLowerCase() || m.name.toLowerCase() === rest.toLowerCase());
        if (a) { openApp(a.id); ok(`Opening ${a.name}…`); break; }
        const n = rest && stat(normalize(cwdRef.current, rest));
        if (n && n.open) { n.open(); ok(`Opening ${n.name}…`); } else err(`open: nothing named "${rest}"`);
        break;
      }
      case 'apps': ok(APP_META.filter((a) => !a.hidden && isInstalled(s.settings.installed, a.id)).map((a) => `${a.id.padEnd(12)}${a.name.padEnd(14)}${a.blurb}`).join('\n')); break;
      case 'ps': ok('PID       APP            TITLE\n' + (s.windows.length ? s.windows.map((w) => `${w.id.padEnd(9)} ${w.appId.padEnd(14)} ${w.title}${w.minimized ? ' (min)' : ''}`).join('\n') : '(no processes)')); break;
      case 'kill': {
        const w = s.windows.find((x) => x.id === args[0]);
        if (w) { closeWindow(w.id); ok(`killed ${w.id}`); break; }
        const a = appMeta(args[0]?.toLowerCase() ?? '');
        if (a && s.windows.some((x) => x.appId === a.id)) { closeApp(a.id); ok(`killed ${a.name}`); } else err(`kill: no such process "${args[0] ?? ''}"`);
        break;
      }
      case 'play': case 'info': {
        if (!rest) { err(`usage: ${cmd} <title | ttID>`); break; }
        setBusy(true);
        const m = await findMedia(rest);
        setBusy(false);
        if (!m) { err(`No title found for "${rest}"`); break; }
        if (cmd === 'play') { playMedia(m); ok(`▶ ${m.title} (${m.year})`); } else { openDetails(m); ok(`${m.title} (${m.year}) · ★ ${m.rating.toFixed(1)}\n${m.synopsis}`); }
        break;
      }
      case 'search': {
        if (!rest) { err('usage: search <query>'); break; }
        setBusy(true);
        const r = await searchAllMedia(rest).catch(() => []);
        setBusy(false);
        ok(r.length ? r.slice(0, 12).map((m, i) => `${String(i + 1).padStart(2)}. ${m.title} (${m.year}) ${m.type === 'tv' ? '[series]' : ''}  ${m.imdbId}`).join('\n') + '\n\nUse: play <ttID>' : 'No results (are you online?)');
        break;
      }
      case 'trending': ok(CATALOG.filter((m) => m.trendingRank).sort((a, b) => a.trendingRank! - b.trendingRank!).map((m) => `#${m.trendingRank} ${m.title} (${m.year})`).join('\n') || 'Nothing trending'); break;
      case 'random': { const m = CATALOG[Math.floor(Math.random() * CATALOG.length)]; ok(`🎲 ${m.title} (${m.year}) — ${m.tagline ?? m.genres.join(', ')}`); openDetails(m); break; }
      case 'watchlist': {
        const sub = args[0];
        if (sub === 'add' || sub === 'rm') {
          const m = await findMedia(args.slice(1).join(' '));
          if (!m) { err('title not found'); break; }
          const has = s.watchlist.some((x) => x.id === m.id);
          if ((sub === 'add') === has) { ok(has ? `${m.title} is already saved` : `${m.title} is not in the watchlist`); break; }
          toggleWatchlist(m); ok(`${sub === 'add' ? 'Added' : 'Removed'} ${m.title}`);
        } else ok(s.watchlist.length ? s.watchlist.map((m, i) => `${String(i + 1).padStart(2)}. ${m.title} (${m.year})`).join('\n') : 'Watchlist is empty');
        break;
      }
      case 'history': ok(s.history.length ? s.history.slice(0, 20).map((h) => `${new Date(h.timestamp).toLocaleString()}  ${h.media.title}${h.season ? ` S${h.season}E${h.episode}` : ''}`).join('\n') : 'No history'); break;
      case 'rate': {
        const n = parseInt(args[args.length - 1]);
        if (!(n >= 1 && n <= 5)) { err('usage: rate <title> <1-5>'); break; }
        const m = await findMedia(args.slice(0, -1).join(' '));
        if (!m) { err('title not found'); break; }
        rate(m.id, n); ok(`${m.title}: ${'★'.repeat(n)}${'☆'.repeat(5 - n)}`);
        break;
      }
      case 'servers': ok(STREAMING_SERVERS.map((v) => `${v.id === s.settings.parental.defaultServerId ? '*' : ' '} ${v.id.padEnd(15)} ${v.host.padEnd(14)} ${v.description}`).join('\n')); break;
      case 'theme': {
        const t = args[0] === 'toggle' || !args[0] ? (s.settings.theme === 'dark' ? 'light' : 'dark') : args[0];
        if (t !== 'dark' && t !== 'light') { err('usage: theme [dark|light]'); break; }
        setSettings({ theme: t }); ok(`Theme: ${t}`);
        break;
      }
      case 'accent': {
        if (!args[0]) { ok(Object.keys(ACCENTS).join(', ')); break; }
        if (!ACCENTS[args[0]]) { err(`Unknown accent. Try: ${Object.keys(ACCENTS).join(', ')}`); break; }
        setSettings({ accent: args[0] }); ok(`Accent: ${ACCENTS[args[0]].name}`);
        break;
      }
      case 'wallpaper': {
        if (!args[0]) { ok(WALLPAPERS.map((w) => w.id).join(', ')); break; }
        if (!WALLPAPERS.some((w) => w.id === args[0])) { err('Unknown wallpaper'); break; }
        setSettings({ wallpaper: args[0] }); ok(`Wallpaper: ${args[0]}`);
        break;
      }
      case 'sound': setSettings({ sounds: args[0] !== 'off' }); ok(`Sounds ${args[0] !== 'off' ? 'on' : 'off'}`); break;
      case 'parental': {
        const m = { all: 'ALL', teen: 'TEEN', family: 'FAMILY' }[args[0] as 'all'];
        if (!m) { ok(`Current: ${s.settings.parental.maxRatingTier}. Usage: parental all|teen|family`); break; }
        if (s.settings.parentalPin) { err('A parental PIN is set — change this in Settings.'); break; }
        setSettings({ parental: { ...s.settings.parental, maxRatingTier: m as any } }); ok(`Parental tier: ${m}`);
        break;
      }
      case 'notify': notify('Terminal', rest || 'Hello from the shell', { appId: 'terminal' }); break;
      case 'lock': lock(); break;
      case 'reboot': case 'restart': restart(); break;
      case 'shutdown': shutdown(); break;
      case 'matrix': setMatrix(true); break;
      case 'calc': { const v = evaluate(rest); v === null ? err('syntax error') : ok(fmtNum(v)); break; }
      case 'fortune': ok(FORTUNES[Math.floor(Math.random() * FORTUNES.length)]); break;
      case 'cowsay': { const t = rest || 'Moo-vie night?'; ok(` ${'_'.repeat(t.length + 2)}\n< ${t} >\n ${'-'.repeat(t.length + 2)}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`); break; }
      case 'figlet': ok(rest.toUpperCase().split('').join(' ')); break;
      case 'export': { const d = exportData(); navigator.clipboard?.writeText(d).catch(() => {}); ok(`Backup copied to clipboard (${fmtSize(d.length)}).`); break; }
      case 'man': ok(`No manual entry. Try "help".`); break;
      case 'sudo': err(`${s.settings.userName.toLowerCase()} is not in the sudoers file. This incident will be reported to the projectionist.`); break;
      case 'rm': ok(/-rf?\s+\//.test(line) ? 'Nice try. The archive is safe.' : 'Use Files to delete items.'); break;
      case 'exit': closeWindow(win.id); break;
      default: {
        if (isValidMediaId(cmd)) { const m = (await loadMeta(cleanMediaId(cmd))) ?? createCustomMediaItem(cmd); playMedia(m); ok(`▶ ${m.title}`); break; }
        const v = evaluate(line);
        if (v !== null) ok(fmtNum(v)); else err(`cinesh: command not found: ${cmd}`);
      }
    }
  };

  const complete = () => {
    const parts = input.split(/\s+/);
    if (parts.length === 1) {
      const m = COMMANDS.filter((c) => c.startsWith(parts[0]));
      if (m.length === 1) setInput(m[0] + ' '); else if (m.length > 1) print(m.join('  '), 'dim');
      return;
    }
    const last = parts[parts.length - 1];
    const slash = last.lastIndexOf('/');
    const dirPart = slash >= 0 ? last.slice(0, slash + 1) : '';
    const kids = children(normalize(cwdRef.current, dirPart || '.')) ?? [];
    const m = kids.filter((k) => k.name.toLowerCase().startsWith(last.slice(slash + 1).toLowerCase()));
    if (m.length === 1) setInput([...parts.slice(0, -1), dirPart + m[0].name + (m[0].kind === 'dir' ? '/' : '')].join(' '));
    else if (m.length > 1) print(m.map((k) => k.name).join('  '), 'dim');
  };

  const onKey = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { const v = input; setInput(''); hi.current = -1; await run(v); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); const h = hist.current; if (!h.length) return; hi.current = Math.min(h.length - 1, hi.current + 1); setInput(h[h.length - 1 - hi.current]); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); const h = hist.current; hi.current = Math.max(-1, hi.current - 1); setInput(hi.current < 0 ? '' : h[h.length - 1 - hi.current]); }
    else if (e.key === 'Tab') { e.preventDefault(); complete(); }
    else if (e.ctrlKey && e.key === 'l') { e.preventDefault(); setLines([]); }
    else if (e.ctrlKey && e.key === 'c') { setInput(''); print('^C', 'dim'); setBusy(false); }
  };

  return (
    <div className="crt relative flex h-full flex-col bg-[#0a0a0b] font-mono text-[13px] leading-[1.45] text-neutral-200" onClick={() => { if (!window.getSelection()?.toString()) inputRef.current?.focus(); }}>
      <div ref={scroller} className="selectable min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words p-3">
        {lines.map((l, i) => <div key={i} className={l.k === 'in' ? 'text-emerald-400' : l.k === 'err' ? 'text-red-400' : l.k === 'dim' ? 'text-neutral-500' : ''}>{l.t || '\u00a0'}</div>)}
        {busy && <div className="text-neutral-500">working<span className="caret">…</span></div>}
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-emerald-400">{cwd === '/home' ? '~' : cwd} ❯</span>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-label="Terminal input" className="min-w-0 flex-1 bg-transparent text-neutral-100 caret-emerald-400 outline-none" />
        </div>
      </div>
      {matrix && <canvas ref={canvas} onClick={() => setMatrix(false)} className="absolute inset-0 h-full w-full bg-black" />}
    </div>
  );
}
