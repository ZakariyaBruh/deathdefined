# CineStream

A movie and series app with a glass dock and an App Store. It opens straight into the movie browser; the dock switches between apps, and the App Store adds extras you can install or remove.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production bundle in dist/
npm run lint     # type-check
```

## How it works

- **Movies first:** the app launches full-screen into CineStore. Prefer floating windows? Settings → General → Floating windows.
- **Dock:** Movies, Library, your installed extras, App Store, Settings.
- **App Store:** Direct Play, Insights, Trivia, Snake, Terminal, Notes, Files, Calculator, Clock and Activity are optional; Get adds one to the dock, Remove takes it off.

## The shell underneath

| Layer | What you get |
| --- | --- |
| **Boot & lock** | Boot sequence, lock screen, power off / restart |
| **Window manager** | Drag, resize from any edge, snap to left / right / maximise, minimise to the Dock, float-on-top, focus management, error boundaries per app |
| **Shell** | Menu bar with per-app menus, magnifying Dock with running indicators and context menus, Spotlight, Launchpad, Mission Control, Control Center, Notification Center with calendar, toasts, desktop widgets, right-click menus |
| **Responsive** | Under 768px every window goes full-screen and the Dock becomes a touch bar |
| **Persistence** | Settings, watchlist, history, notes and ratings persist in `localStorage`; the original CineStream data is migrated automatically; export/import backups |

## Apps

**Cinema** – CineStore (browse, genres, decades, global search), Details (episode guide, similar titles, ratings), Cinema player (servers, theater, lights-off, float, full screen), Library (watchlist, history, ratings), Direct Play (IMDb ID or link), Insights (charts of your habits)

**Utilities** – Terminal (about 45 commands, virtual filesystem, tab completion), Notes, Files, Calculator, Clock (world clock, stopwatch, sleep timer)

**Games** – Trivia (generated from the catalog), Snake

**System** – Settings (appearance, dock, parental controls with PIN, playback, data), Activity (processes, FPS, memory, server latency tests), About

## Shortcuts

`Ctrl/⌘ K` Spotlight · `F3` Mission Control · `Alt D` Launchpad · `Alt T` Terminal · `Alt W` close · `Alt M` minimise · `Alt Enter` zoom · `Alt L` lock · `Alt .` cycle windows

## Layout

```
src/os/store.ts        state, window manager actions, persistence
src/os/appMeta.ts      app definitions (name, icon, default size)
src/os/registry.tsx    lazy app components + error boundary
src/os/shell/          menu bar, dock, spotlight, panels, window frame
src/os/apps/           one file per app
src/os/vfs.ts          virtual filesystem shared by Files and Terminal
src/utils, src/data    catalog, age ratings and server logic from CineStream
```

Streams come from third-party embed servers and metadata from Cinemeta; both need network access.
