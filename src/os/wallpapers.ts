export interface Wallpaper { id: string; name: string; css: string; dim?: boolean }

const mesh = (a: string, b: string, c: string, base: string) =>
  `radial-gradient(60% 50% at 15% 20%, ${a} 0%, transparent 70%), radial-gradient(55% 55% at 85% 25%, ${b} 0%, transparent 70%), radial-gradient(70% 60% at 50% 100%, ${c} 0%, transparent 70%), ${base}`;

export const WALLPAPERS: Wallpaper[] = [
  { id: 'noir', name: 'Noir', css: 'radial-gradient(90% 70% at 50% -10%, #3a3a3d 0%, #151516 55%, #050505 100%)' },
  { id: 'aurora', name: 'Aurora', css: mesh('#0ea5e9aa', '#8b5cf6aa', '#10b981aa', '#05060f') },
  { id: 'ember', name: 'Ember', css: mesh('#f97316aa', '#e11d48aa', '#7c2d12aa', '#0c0504') },
  { id: 'ocean', name: 'Deep Ocean', css: mesh('#0369a1cc', '#0f766eaa', '#1e3a8acc', '#020617') },
  { id: 'dusk', name: 'Dusk', css: mesh('#db2777aa', '#7c3aedaa', '#f59e0b88', '#0b0614') },
  { id: 'forest', name: 'Forest', css: mesh('#16a34a88', '#0d9488aa', '#365314aa', '#030a05') },
  { id: 'paper', name: 'Paper', css: mesh('#e5e5e5', '#d4d4d8', '#fafafa', '#e7e5e4'), dim: false },
  { id: 'projector', name: 'Projector', css: 'conic-gradient(from 200deg at 50% -10%, #000 0deg, #3f3f46 20deg, #000 45deg, #000 315deg, #3f3f46 340deg, #000 360deg), #000' },
];

export const wallpaperCss = (id: string): string => {
  if (id.startsWith('img:')) return `url("${id.slice(4)}") center / cover no-repeat, #000`;
  return (WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0]).css;
};
