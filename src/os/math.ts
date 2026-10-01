/** Safe arithmetic evaluator (no eval). Supports + - * / % ^ ( ) , constants and common functions. */
const FUNCS: Record<string, (...a: number[]) => number> = {
  sqrt: Math.sqrt, abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log10, ln: Math.log,
  round: Math.round, floor: Math.floor, ceil: Math.ceil, min: Math.min, max: Math.max, exp: Math.exp,
};
const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };

export function evaluate(src: string): number | null {
  const s = src.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '').toLowerCase();
  if (!s) return null;
  let i = 0;
  const fail = () => { throw new Error('parse'); };
  const peek = () => s[i];

  function expr(): number {
    let v = term();
    while (peek() === '+' || peek() === '-') { const op = s[i++]; const r = term(); v = op === '+' ? v + r : v - r; }
    return v;
  }
  function term(): number {
    let v = power();
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = s[i++]; const r = power();
      v = op === '*' ? v * r : op === '/' ? v / r : v % r;
    }
    return v;
  }
  function power(): number {
    const b = unary();
    if (peek() === '^') { i++; return Math.pow(b, power()); }
    return b;
  }
  function unary(): number {
    if (peek() === '-') { i++; return -unary(); }
    if (peek() === '+') { i++; return unary(); }
    return atom();
  }
  function atom(): number {
    if (peek() === '(') { i++; const v = expr(); if (peek() !== ')') fail(); i++; return v; }
    const num = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(s.slice(i));
    if (num) { i += num[0].length; return parseFloat(num[0]); }
    const id = /^[a-z]+/.exec(s.slice(i));
    if (id) {
      i += id[0].length;
      if (id[0] in CONSTS) return CONSTS[id[0]];
      const fn = FUNCS[id[0]];
      if (!fn || peek() !== '(') fail();
      i++;
      const args: number[] = [expr()];
      while (peek() === ',') { i++; args.push(expr()); }
      if (peek() !== ')') fail();
      i++;
      return fn(...args);
    }
    return fail() as never;
  }
  try {
    const v = expr();
    if (i !== s.length || !Number.isFinite(v)) return null;
    return v;
  } catch { return null; }
}

export const fmtNum = (n: number) => (Math.abs(n) >= 1e12 || (Math.abs(n) < 1e-6 && n !== 0) ? n.toExponential(6) : String(+n.toPrecision(12)));
