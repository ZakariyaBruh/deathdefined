import { getState } from './store';

let ctx: AudioContext | null = null;

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.05, delay = 0) {
  if (!getState().settings.sounds) return;
  try {
    ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  } catch { /* audio unavailable */ }
}

export const sfx = {
  boot: () => [261.6, 329.6, 392, 523.3].forEach((f, i) => tone(f, 1.4, 'sine', 0.06, i * 0.18)),
  open: () => tone(660, 0.12, 'triangle', 0.04),
  close: () => tone(440, 0.12, 'triangle', 0.035),
  notify: () => { tone(880, 0.15, 'sine', 0.05); tone(1174, 0.25, 'sine', 0.04, 0.12); },
  click: () => tone(1000, 0.04, 'square', 0.015),
  error: () => tone(160, 0.25, 'sawtooth', 0.04),
};
