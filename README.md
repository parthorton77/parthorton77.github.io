# PARTH METRO — A Journey Through My Career

The portfolio of **Parth Patel, Senior UI Developer**, presented as a miniature metro line. Visitors board
at Platform 0 and ride through seven stations: Profile, Design, Engineering, Projects, Career, AI Lab and
Contact. Scrolling drives the train, the camera and the station content together.

- **Desktop:** a full 3D railway world (Three.js) behind accessible HTML panels.
- **Mobile and "lite" mode:** a purpose-built 2.5D SVG journey, with no WebGL downloaded at all.
- **No JavaScript:** a plain contact card (`<noscript>`).

## Commands

```bash
npm install
npm run dev        # local dev server
npm run build      # type-check (vue-tsc) + production build to dist/
npm run preview    # serve the production build
```

Requires Node 20.19+ (Vite 8).

## Deploying

`vite.config.ts` uses `base: './'`, so `dist/` works from any path: a GitHub Pages user site
(`parthorton77.github.io`), a project sub-path or any static host. Upload the contents of `dist/`.
The résumé PDF ships from `public/`.

## Editing content

All professional facts live in **`src/data/portfolio.ts`**: profile, contact links, roles, skills and
projects. Every station, the 3D signage and the AI Lab's answers read from it, so one edit updates
everything.

- **Years of experience** is computed from `CAREER_START_YEAR` (2016), matching the previous site.
- **Projects** have optional `links` and `screenshots` arrays. None were published before, so none are
  shown. Add real ones and the exhibit dossier displays them automatically.
- **Station names, colours and order** live in `src/data/stations.ts`.

## Architecture

```
src/
  data/            portfolio.ts (content), stations.ts (the line), assistant.ts (AI Lab matcher)
  state/           app.ts (mode, motion, UI state), journey.ts (scroll → train), navigation.ts, worldBus.ts
  components/
    stations/      one section per station + ProjectDialog; StationSection is the shared shell
    hud/           header, metro map, map overlay, next-station cue, transfer card, cinema bars
    lite/          LiteScene.vue: the 2.5D SVG station dioramas
    world/         WorldCanvas.vue: lazy-loads and hosts the 3D world
    ui/            icons, split-flap board, station sign, SVG train
  world/           the Three.js world (framework-free TypeScript)
    track/         TrackPath (straights + arcs), route, rails/sleepers/tunnel meshes
    train/         the procedural train and its bogie-on-rail placement
    camera/        CameraDirector: station shots, chase and drone transit, tracking shot
    stations/      one builder per station + shared kit (materials, platforms, signs)
    scene/         sky, stars, planet, ground grid, environment map, procedural city
```

**The journey model.** Each section marks its stop with `data-stop`. `journey.ts` maps scroll position
to a continuous value *J*: an integer means docked at a station, and a fraction means travelling
between two. The train position, camera shot, metro-map marker and Career timeline all read the same
eased *J*, so they can never disagree. Navigation (map, cue, deep links, boarding) only ever moves the
scroll position.

**Why HTML over WebGL.** All content is real DOM: selectable, searchable, screen-reader friendly and
crisp. The 3D world is a storytelling layer with `aria-hidden`, and it frames each station on the
side opposite its content panel.

## Performance

- three.js is code-split and loaded only when the 3D world is used (about 173 kB gzipped). The
  mobile and lite path doesn't download it.
- There are no image or model assets. Every sign, screen, window and glow is drawn procedurally at
  runtime.
- Static parts are merged, the city is two draw calls, and repeated parts are instanced. Each stop
  draws roughly 55–130 draw calls.
- The render loop sleeps when nothing changes. Idle scenes drop to 30 fps, reduced-motion scenes
  render only on change, and stations beyond the fog aren't drawn.
- Resolution adapts: device pixel ratio is capped at 1.75 and steps down if frames are slow. A lost
  WebGL context falls back to 2.5D.

## Accessibility

- Semantic landmarks with one heading per station. A skip link, visible focus states, and focus moves
  to the destination heading after navigation.
- `prefers-reduced-motion` is honoured, and the header's **Motion** toggle overrides it either way.
  With motion off, trips become instant cuts and ambient animation stops.
- A **3D** toggle switches to the lightweight 2.5D view on any wide screen.
- Dialogs trap focus and close on Esc. The Career timeline gives screen readers the full list. Text
  contrast is at least 5:1 on every surface.

## Debugging

Append `?debug` to the URL to expose `window.__metro = { world, journey }`. For example, set
`__metro.journey.current = 4` to jump the train to the Project Terminal.
