import { Check, RotateCcw, Trophy, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { WinState } from '../types';
import type { MediaItem } from '../../types';
import { CATALOG } from '../catalog';
import { notify } from '../store';
import { Btn } from '../ui/bits';

interface Q { prompt: string; hint?: string; options: string[]; answer: string }
const shuffle = <T,>(a: T[]) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const pick = <T,>(a: T[], n: number, not: T[] = []) => shuffle(a.filter((x) => !not.includes(x))).slice(0, n);

function build(): Q[] {
  const pool = CATALOG;
  const qs: Q[] = [];
  const titles = pool.map((m) => m.title);
  shuffle(pool).forEach((m: MediaItem, i) => {
    const kind = i % 4;
    if (kind === 0) {
      const years = [...new Set(pool.map((p) => String(p.year)))];
      qs.push({ prompt: `In what year was “${m.title}” released?`, options: shuffle([String(m.year), ...pick(years, 3, [String(m.year)])]), answer: String(m.year) });
    } else if (kind === 1 && m.director) {
      const dirs = [...new Set(pool.map((p) => p.director).filter(Boolean) as string[])];
      qs.push({ prompt: `Who directed “${m.title}”?`, options: shuffle([m.director, ...pick(dirs, 3, [m.director])]), answer: m.director });
    } else if (kind === 2 && m.tagline) {
      qs.push({ prompt: `Which title carries the tagline “${m.tagline}”?`, options: shuffle([m.title, ...pick(titles, 3, [m.title])]), answer: m.title });
    } else if (m.cast.length) {
      const stars = [...new Set(pool.flatMap((p) => p.cast))];
      const notIn = stars.filter((s) => !m.cast.includes(s));
      qs.push({ prompt: `Which of these actors appears in “${m.title}”?`, options: shuffle([m.cast[0], ...pick(notIn, 3)]), answer: m.cast[0] });
    }
  });
  return qs.slice(0, 10);
}

export default function Trivia(_: { win: WinState }) {
  const [round, setRound] = useState(0);
  const qs = useMemo(() => build(), [round]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [best, setBest] = useState(() => { try { return +(localStorage.getItem('cineos.trivia') ?? 0); } catch { return 0; } });
  const done = i >= qs.length;

  const choose = (o: string) => {
    if (picked) return;
    setPicked(o);
    if (o === qs[i].answer) setScore((s) => s + 1);
    window.setTimeout(() => {
      setPicked(null);
      setI((v) => {
        if (v + 1 >= qs.length) {
          const final = score + (o === qs[v].answer ? 1 : 0);
          if (final > best) { setBest(final); try { localStorage.setItem('cineos.trivia', String(final)); } catch { /* noop */ } notify('New trivia record', `${final}/${qs.length}`, { appId: 'trivia' }); }
        }
        return v + 1;
      });
    }, 900);
  };
  const reset = () => { setRound((r) => r + 1); setI(0); setScore(0); setPicked(null); };

  if (done) {
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div>
          <Trophy size={44} className="mx-auto mb-3 text-amber-400" />
          <div className="font-[var(--font-display)] text-4xl font-extrabold">{score} / {qs.length}</div>
          <div className="mt-1 text-[var(--fg-2)]">{score >= 9 ? 'Auteur-level knowledge.' : score >= 6 ? 'A proper cinephile.' : score >= 3 ? 'Keep watching.' : 'Time for a marathon.'}</div>
          <div className="mt-1 text-[12px] text-[var(--fg-3)]">Best: {best}</div>
          <Btn variant="primary" onClick={reset} className="mt-5 !px-5 !py-2"><RotateCcw size={14} />Play again</Btn>
        </div>
      </div>
    );
  }
  const q = qs[i];
  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between text-[12px] text-[var(--fg-2)]"><span>Question {i + 1} of {qs.length}</span><span>Score {score} · Best {best}</span></div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-[var(--fill-2)]"><div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${(i / qs.length) * 100}%` }} /></div>
      <h2 className="font-[var(--font-display)] text-xl font-bold leading-snug">{q.prompt}</h2>
      <div className="mt-6 space-y-2.5">
        {q.options.map((o) => {
          const right = picked && o === q.answer, wrong = picked === o && o !== q.answer;
          return (
            <button key={o} onClick={() => choose(o)} className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-[14px] transition ${right ? 'bg-emerald-500/25 ring-1 ring-emerald-400' : wrong ? 'bg-red-500/25 ring-1 ring-red-400' : 'bg-[var(--fill)] hover:bg-[var(--fill-2)]'}`}>
              {o}{right && <Check size={16} />}{wrong && <X size={16} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
