import { useEffect, useRef, useState } from 'react';
import type { WinState } from '../types';
import { Btn } from '../ui/bits';

const N = 20;
type P = [number, number];
const rnd = (snake: P[]): P => { let p: P; do { p = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)]; } while (snake.some((s) => s[0] === p[0] && s[1] === p[1])); return p; };

export default function Snake(_: { win: WinState }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const g = useRef({ snake: [[10, 10], [9, 10], [8, 10]] as P[], dir: [1, 0] as P, next: [1, 0] as P, food: [15, 10] as P, over: false, started: false, score: 0 });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => { try { return +(localStorage.getItem('cineos.snake') ?? 0); } catch { return 0; } });
  const [state, setState] = useState<'ready' | 'play' | 'over'>('ready');
  const wrap = useRef<HTMLDivElement>(null);

  const reset = () => { g.current = { snake: [[10, 10], [9, 10], [8, 10]], dir: [1, 0], next: [1, 0], food: [15, 10], over: false, started: true, score: 0 }; setScore(0); setState('play'); wrap.current?.focus(); };
  const turn = (d: P) => { const c = g.current; if (d[0] + c.dir[0] !== 0 || d[1] + c.dir[1] !== 0) c.next = d; };

  useEffect(() => {
    const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    const draw = () => {
      const c = canvas.current; if (!c) return;
      const ctx = c.getContext('2d')!; const s = c.width / N;
      ctx.fillStyle = css('--win-solid') || '#111'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = 'rgba(128,128,128,.08)';
      for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if ((x + y) % 2) ctx.fillRect(x * s, y * s, s, s);
      const { snake, food } = g.current;
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(food[0] * s + s / 2, food[1] * s + s / 2, s * 0.38, 0, 7); ctx.fill();
      snake.forEach((p, i) => { ctx.fillStyle = i === 0 ? css('--accent') || '#fff' : css('--fg-2') || '#aaa'; ctx.beginPath(); ctx.roundRect(p[0] * s + 1, p[1] * s + 1, s - 2, s - 2, 5); ctx.fill(); });
    };
    const tick = () => {
      const c = g.current;
      if (c.started && !c.over) {
        c.dir = c.next;
        const head: P = [c.snake[0][0] + c.dir[0], c.snake[0][1] + c.dir[1]];
        if (head[0] < 0 || head[1] < 0 || head[0] >= N || head[1] >= N || c.snake.some((p) => p[0] === head[0] && p[1] === head[1])) {
          c.over = true; setState('over');
          if (c.score > best) { setBest(c.score); try { localStorage.setItem('cineos.snake', String(c.score)); } catch { /* noop */ } }
        } else {
          c.snake.unshift(head);
          if (head[0] === c.food[0] && head[1] === c.food[1]) { c.score++; setScore(c.score); c.food = rnd(c.snake); } else c.snake.pop();
        }
      }
      draw();
    };
    draw();
    const t = window.setInterval(tick, 105);
    return () => window.clearInterval(t);
  }, [best]);

  const key = (e: React.KeyboardEvent) => {
    const m: Record<string, P> = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
    const d = m[e.key];
    if (d) { e.preventDefault(); turn(d); }
    else if (e.key === ' ' && state !== 'play') reset();
  };

  return (
    <div ref={wrap} tabIndex={0} onKeyDown={key} className="flex h-full flex-col items-center gap-3 p-4 outline-none">
      <div className="flex w-full max-w-[480px] justify-between text-[13px]"><span className="font-semibold">Score {score}</span><span className="text-[var(--fg-2)]">Best {best}</span></div>
      <div className="relative w-full max-w-[480px]">
        <canvas ref={canvas} width={480} height={480} className="aspect-square w-full rounded-xl ring-1 ring-[var(--border)]" />
        {state !== 'play' && (
          <div className="absolute inset-0 grid place-items-center rounded-xl bg-black/55 text-center text-white">
            <div><div className="text-xl font-bold">{state === 'over' ? 'Game over' : 'Snake'}</div><div className="mb-3 text-[12px] opacity-70">Arrow keys or WASD · Space to start</div><Btn variant="primary" onClick={reset}>{state === 'over' ? 'Try again' : 'Start'}</Btn></div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:hidden">
        <span /><Btn variant="soft" onClick={() => turn([0, -1])} aria-label="Up">▲</Btn><span />
        <Btn variant="soft" onClick={() => turn([-1, 0])} aria-label="Left">◀</Btn><Btn variant="soft" onClick={() => turn([0, 1])} aria-label="Down">▼</Btn><Btn variant="soft" onClick={() => turn([1, 0])} aria-label="Right">▶</Btn>
      </div>
    </div>
  );
}
