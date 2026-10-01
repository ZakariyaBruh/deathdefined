import { useEffect } from 'react';
import {
  closeWindow, cycleWindows, getState, lock, minimizeWindow, openApp, closePanel, toggleMaximize, togglePanel,
} from '../store';

export function Shortcuts() {
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const s = getState();
      if (s.phase !== 'desktop') return;
      const mod = e.ctrlKey || e.metaKey;
      const t = e.target as HTMLElement;
      const typing = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); togglePanel('spotlight'); return; }
      if (e.altKey && e.code === 'Space') { e.preventDefault(); togglePanel('spotlight'); return; }
      if (e.key === 'F3') { e.preventDefault(); togglePanel('mission'); return; }
      if (e.key === 'Escape' && s.panel) { closePanel(); return; }
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const code = e.code;
      if (code === 'KeyW' && s.focusId) { e.preventDefault(); closeWindow(s.focusId); }
      else if (code === 'KeyM' && s.focusId) { e.preventDefault(); minimizeWindow(s.focusId); }
      else if (code === 'Enter' && s.focusId) { e.preventDefault(); toggleMaximize(s.focusId); }
      else if (code === 'KeyT') { e.preventDefault(); openApp('terminal'); }
      else if (code === 'KeyL' && !typing) { e.preventDefault(); lock(); }
      else if (code === 'Period') { e.preventDefault(); cycleWindows(); }
      else if (code === 'KeyD') { e.preventDefault(); togglePanel('launchpad'); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  return null;
}
