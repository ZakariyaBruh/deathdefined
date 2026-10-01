import { Component, lazy, type ComponentType, type ReactNode } from 'react';
import type { WinState } from './types';

export type AppComponent = ComponentType<{ win: WinState }>;

export const APP_COMPONENTS: Record<string, AppComponent> = {
  appstore: lazy(() => import('./apps/AppStore')),
  store: lazy(() => import('./apps/Store')),
  library: lazy(() => import('./apps/Library')),
  player: lazy(() => import('./apps/Player')),
  directplay: lazy(() => import('./apps/DirectPlay')),
  insights: lazy(() => import('./apps/Insights')),
  trivia: lazy(() => import('./apps/Trivia')),
  snake: lazy(() => import('./apps/Snake')),
  terminal: lazy(() => import('./apps/Terminal')),
  notes: lazy(() => import('./apps/Notes')),
  files: lazy(() => import('./apps/Files')),
  calculator: lazy(() => import('./apps/Calculator')),
  clock: lazy(() => import('./apps/Clock')),
  monitor: lazy(() => import('./apps/Monitor')),
  settings: lazy(() => import('./apps/Settings')),
  details: lazy(() => import('./apps/Details')),
  about: lazy(() => import('./apps/About')),
};

export class AppBoundary extends Component<{ children: ReactNode; name: string; onClose: () => void }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="h-full grid place-items-center p-8 text-center">
        <div>
          <div className="text-lg font-semibold">{this.props.name} quit unexpectedly</div>
          <div className="mt-1 text-xs text-[var(--fg-2)] selectable max-w-sm">{this.state.err.message}</div>
          <div className="mt-4 flex justify-center gap-2">
            <button className="rounded-lg bg-[var(--fill-2)] px-3 py-1.5 text-sm" onClick={() => this.setState({ err: null })}>Reopen</button>
            <button className="rounded-lg bg-[var(--fill-2)] px-3 py-1.5 text-sm" onClick={this.props.onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }
}
