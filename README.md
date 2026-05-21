# Slickshot

Capture, keep, and share photos in a flash. Slickshot is an installable, mobile-first progressive web app that turns the browser into a fast camera with on-device storage and one-tap sharing.

## Features

- **Camera capture** — full-bleed live viewfinder with front/back switching and a JPEG shutter. Falls back to the system camera (`<input capture>`) when `getUserMedia` is unavailable.
- **Offline gallery** — photos are stored locally in IndexedDB (via [`idb`](https://github.com/jakearchibald/idb)); nothing leaves the device unless you share it.
- **Photo viewer** — preview, share, download, or delete individual shots.
- **Share presets (bookmarks)** — save reusable title/text combos in `localStorage` and apply them to the Web Share sheet for quick posting to specific apps or contacts.
- **Installable PWA** — autoUpdate service worker, app manifest, maskable icons, and offline navigation fallback via `vite-plugin-pwa`.

## Tech stack

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 5](https://vitejs.dev/) with [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/)
- [`idb`](https://github.com/jakearchibald/idb) for IndexedDB
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) for unit tests
- [Playwright](https://playwright.dev/) for end-to-end tests
- [`fake-indexeddb`](https://github.com/dumbmatter/fakeIndexedDB) and `jsdom` for the test environment

## Getting started

```bash
npm install
npm run dev
```

Vite serves on `0.0.0.0` so you can open the dev URL on your phone over the same network. Camera APIs require a secure context — `localhost` works; on a LAN IP you'll need HTTPS (e.g. via a tunnel) for `getUserMedia` to be granted.

## Scripts

| Script                     | What it does                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| `npm run dev`              | Start the Vite dev server.                                                                 |
| `npm run build`            | Type-check then build the production bundle (including the PWA manifest + service worker). |
| `npm run preview`          | Serve the production build locally.                                                        |
| `npm run typecheck`        | Run `tsc -b --noEmit` across the project references.                                       |
| `npm run lint`             | Run ESLint over the repo.                                                                  |
| `npm run format`           | Format files with Prettier.                                                                |
| `npm run format:check`     | Verify formatting without writing changes.                                                 |
| `npm run icons`            | Regenerate the PWA PNG icon set from `public/favicon.svg`.                                 |
| `npm test`                 | Run the Vitest unit suite once.                                                            |
| `npm run test:watch`       | Vitest in watch mode.                                                                      |
| `npm run test:e2e`         | Run the Playwright suite (`e2e/`).                                                         |
| `npm run test:e2e:install` | Install Playwright's Chromium + system deps.                                               |
| `npm run test:all`         | Typecheck, lint, format check, unit tests, and e2e tests in sequence.                      |

## Project layout

```
src/
  App.tsx              Screen router (camera / gallery / viewer / bookmarks)
  components/          UI: CameraView, Gallery, PhotoViewer, BookmarksScreen, ShareSheet, Toast, useToast, ...
  lib/
    db.ts              IndexedDB photo store (idb)
    bookmarks.ts       localStorage-backed share presets
    share.ts           Web Share API wrapper + filename/Blob helpers
    download.ts        Anchor-based fallback download
  styles.css           App-wide styles
  types.ts             Shared Photo / Bookmark types
e2e/                   Playwright specs (bookmarks, camera + share, PWA install)
public/                Icons + favicon shipped to the PWA manifest
scripts/gen-icons.mjs  Regenerate the PNG icon set
```

## Linting & formatting

The repo uses [ESLint](https://eslint.org/) (flat config in `eslint.config.js`) with `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`, plus [Prettier](https://prettier.io/) for formatting (`.prettierrc.json`). `eslint-config-prettier` keeps the two from fighting.

```bash
npm run lint          # ESLint check
npm run format        # write Prettier formatting
npm run format:check  # verify formatting (used by CI)
```

Editor defaults (indent, line endings, final newline) are pinned in `.editorconfig`; Node version is pinned in `.nvmrc`.

## Icons

PNG icons under `public/` are generated from `public/favicon.svg`:

```bash
npm run icons
```

## Privacy

Photos and bookmarks live entirely in the browser (IndexedDB and `localStorage`). Slickshot has no backend — sharing goes through the OS share sheet via the Web Share API.
