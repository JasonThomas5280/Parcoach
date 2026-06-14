# Technical Specification

Static, offline-capable, zero-backend web app. The architecture *is* part of the product promise:
nothing to collect means nothing to leak.

## Architecture at a glance

- **Client-only.** No server, no database service, no auth. All logic runs in the browser.
- **Persistence:** `localStorage` (settings, progress) + **IndexedDB** (voice recordings as Blobs,
  via the `idb` library) + optional cached parent-supplied photos in IndexedDB.
- **No network at runtime** except fetching the app's own precached static assets. There must be
  **no analytics SDK, no telemetry, no third-party scripts.** This is verifiable in devtools and is
  a core claim — protect it in code review.
- **Distribution:** GitHub Pages (static) + PWA so it installs to a phone home screen and runs offline.

```
┌──────────────────────── Browser (only runtime) ────────────────────────┐
│  Child surface  ◄── Session Controller ──►  Parent surface              │
│       │                   │                      │                      │
│   Audio Manager      Reward/Feedback        Voice Studio                │
│       │                   │                      │                      │
│  ┌────────────── Storage adapters ──────────────────┐                   │
│  │ localStorage (settings, progress)                │                   │
│  │ IndexedDB    (voice recordings, photos)          │                   │
│  └──────────────────────────────────────────────────┘                   │
│  Content packs = static JSON + media in /public/content                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Stack & key libraries

| Concern | Choice | Note |
|---|---|---|
| Build/dev | Vite + React 18 + TypeScript (strict) | Fast, static output, credible codebase |
| Styling | Tailwind + custom token layer | Tokens in `src/design/tokens.ts`; see DESIGN_SYSTEM |
| Animation | CSS first; Framer Motion sparingly | All gated by `prefers-reduced-motion` |
| Audio | Web Audio API | Unlock on first gesture; preload pack audio |
| Voice capture | MediaRecorder API | Store Blobs in IndexedDB |
| IndexedDB | `idb` | Thin promise wrapper |
| PWA/offline | `vite-plugin-pwa` (Workbox) | Precache shell + active pack |
| Tests | Vitest + RTL; Playwright smoke | All local, no backend to mock |

Keep the dependency list short. Every added dependency is a maintenance and trust cost on a
product whose pitch is "nothing runs but us."

## Content pack schema (content is data, not code)

A pack is a JSON file plus media in `/public/content/<packId>/`. Adding content must never require
touching component code.

```jsonc
// /public/content/everyday/pack.json
{
  "id": "everyday",
  "version": 1,
  "title": "Everyday Things",
  "ageBand": "18-36m",
  "items": [
    {
      "id": "dog",
      "label": "Dog",                       // the single word spoken/shown to the parent
      "image": "dog.png",                   // large, warm, high-contrast, centered subject
      "sound": "dog-bark.mp3",              // the object's own sound (not the label)
      "labelAudio": "dog-label.mp3",        // bundled fallback voice for the word
      "animation": "wag",                   // key into a small set of safe, gentle animations
      "coPlayPrompt": "Say it together: 'Dog!' Does Jeremiah know a real dog?",
      "realWorldBridge": "Go find a pet — a real one, a photo, or a toy — and say 'dog' together."
    }
    // ...~24 items, grouped loosely by category via `tags` if needed
  ]
}
```

Validation: a tiny runtime guard (zod or hand-rolled) verifies packs on load and fails loud in dev,
silent-skips a bad item in prod (never crash the child's screen).

## The core loop (engine/sessionController)

State machine, intentionally tiny:

```
idle → playing(item) → reward(item) → (advance) → playing(nextItem) → … → ending → bridge → idle
```

- **playing:** render one item on the Stage. Listen for tap anywhere on the item's generous hit area.
- On tap: fire feedback **immediately** (target < 120ms): start animation, play object sound, then
  speak label (parent voice if present in IndexedDB, else bundled `labelAudio`), show soft reward.
- **advance:** after N taps or a short dwell, gentle cross-fade to next item. No "next" button is
  needed on the child surface; the parent can swipe to change items.
- **ending:** when the session timer (parent-set) elapses *and* the current micro-interaction
  finishes (never cut a child off mid-tap), transition to the **bridge** card.
- **bridge:** calm "all done" screen with the current/last item's `realWorldBridge`. Parent can
  mark it done (parent-facing progress) and close.

Hard guarantees in code:
- No code path shows the child a number, score, X, or error.
- No autoplay loop that continues without the bound.
- Timer is never shown to the child; only the parent sees session length in settings.

## Parent layer

- **Dashboard:** words explored, sessions co-played, bridges completed, gentle streak. These are
  the honest "points" — for the adult. Never rendered on the child surface.
- **Voice Studio:** list of items → record / play / re-record per label → save to IndexedDB keyed
  by `packId:itemId`. Clear mic-permission-denied explanation; app fully works without it.
- **Settings:** session length (2–10 min, default 5), reduced-motion override, content style
  toggle (P1), "delete all our recordings/data" (one tap, local).

## Storage keys (keep stable)

- `localStorage["tandem.settings.v1"]` → `{ sessionMinutes, motion, style }`
- `localStorage["tandem.progress.v1"]` → `{ wordsExplored[], sessions, bridgesDone, streak }`
- IndexedDB db `tandem`, store `recordings` keyed `"<packId>:<itemId>"` → `{ blob, mime, createdAt }`
- IndexedDB store `photos` (P1) keyed `"<packId>:<itemId>"` → `{ blob, mime }`

## Privacy / compliance posture (flag for your attorney — not legal advice)

The product is **directed at young children**, so COPPA is in scope conceptually. The mitigation is
architectural: **collect and transmit nothing.** No personal info leaves the device, no account, no
third-party SDKs, no behavioral data sent anywhere. That dramatically narrows COPPA exposure but
does not auto-exempt you — confirm with counsel, especially before any native app-store "made for
kids" listing, any future cloud sync, or any analytics you might be tempted to add later. If you
ever add a single analytics call, this whole posture changes. Document any such change in
`docs/DECISIONS.md` and re-check with counsel first.

## GitHub Pages deployment

GitHub Pages serves from a subpath like `https://<user>.github.io/<repo>/`. Two things must be right:

1. **Vite base path.** In `vite.config.ts`:
   ```ts
   export default defineConfig({
     base: process.env.GITHUB_ACTIONS ? '/<repo>/' : '/',
     plugins: [react(), VitePWA({ registerType: 'autoUpdate', /* precache shell + content */ })],
   })
   ```
2. **SPA routing fallback.** GitHub Pages has no server rewrites. Either keep routing trivial
   (single page; parent/child are view state, not routes) — **preferred here** — or add a
   `404.html` copy of `index.html`. Prefer no router for v1.

GitHub Actions workflow (`.github/workflows/deploy.yml`):

```yaml
name: Deploy
on:
  push: { branches: [main] }
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build           # outputs dist/
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: '${{ steps.deployment.outputs.page_url }}' }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Then in repo Settings → Pages, set Source = "GitHub Actions". First green run publishes the site.

## Performance & quality gates

- First interaction-ready < 2s on a mid phone over decent wifi; fully offline after first load.
- Tap-to-feedback < 120ms (preload audio; decode ahead).
- Lighthouse: PWA installable, Accessibility ≥ 90, Best Practices ≥ 90.
- Images: large but compressed (WebP/AVIF with PNG fallback); lazy-load non-active packs.
- Respect `prefers-reduced-motion`: swap transforms for cross-fades; never disable feedback itself.
