# Tandem

A play surface for a parent and a 1–3-year-old to use **together** — built to be used briefly and
to push the pair off the screen and into the real world. The opposite of an attention-trap kids' app.

*"Tandem" is a working name — chosen because the whole thesis is doing it together. Easy to rename.*

> **One thing the child does:** taps a big, warm object and it reliably answers — a gentle
> animation, its sound, and its name spoken in a parent's own voice.
> **One thing the app does for the parent:** makes co-play effortless, then ends on purpose with
> something to go do together in real life.

## Why it's built this way

Children under ~3 learn slowly from screens alone and struggle to transfer it to real life (the
"transfer deficit"); what helps is a parent co-playing and bridging to the real world, and a
familiar voice. The 2026 AAP guidance shifted toward quality, co-use, and conversation over solo
screen time. Tandem is built to sit on the right side of all of that. Full reasoning and citations
in [`docs/RESEARCH_FOUNDATION.md`](docs/RESEARCH_FOUNDATION.md).

## Docs (read in this order)

1. [`CLAUDE.md`](CLAUDE.md) — build contract; the five hard rules; definition of done.
2. [`docs/PRD.md`](docs/PRD.md) — what we're building and what we're deliberately not.
3. [`docs/RESEARCH_FOUNDATION.md`](docs/RESEARCH_FOUNDATION.md) — the *why*, with citations.
4. [`docs/TECH_SPEC.md`](docs/TECH_SPEC.md) — architecture, content schema, GitHub Pages deploy.
5. [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — UI/UX for the child and parent surfaces.
6. [`docs/PITCH_AND_MARKET_REALITY.md`](docs/PITCH_AND_MARKET_REALITY.md) — the honest VC read.

## Principles (non-negotiable)

- The parent is the product; the screen is the prop.
- Cause-and-effect + naming, not "education."
- End on purpose; bridge to the real world.
- No fail states, no child-facing scores, no engagement traps, no ads.
- Everything stays on the device. Nothing is collected or sent. Ever.

## Quickstart (from a clean clone)

```bash
npm install            # install dependencies
npm run dev            # local dev server (http://localhost:5173)
npm run build          # static output in dist/
npm run preview        # serve the production build locally
npm test               # Vitest unit + core-loop tests
```

Regenerating assets (only if you change the generator scripts):

```bash
npm run gen:content    # rebuild the "everyday" pack: 24 SVGs + pack.json
npm run gen:icons      # rebuild the PWA icons + favicon
```

### Deploy to GitHub Pages

The build is wired for it already:

- `vite.config.ts` sets `base` to `/Parcoach/` when `GITHUB_ACTIONS` is set
  (and `/` locally). If you rename the repo, update `repoBase` there.
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and
  publishes `dist/` on every push to `main`.
- In the repo: **Settings → Pages → Source = "GitHub Actions"**. The first green
  run publishes the site at `https://<user>.github.io/Parcoach/`.

There is no router by design, so the subpath "just works" with no `404.html`
fallback (see [`docs/TECH_SPEC.md`](docs/TECH_SPEC.md)).

## Build order

Start with the **core child loop** (one hardcoded item, perfect the feel), then content packs, then
the session bound + real-world bridge, then the parent layer (voice studio + dashboard), then
PWA/offline + deploy. Don't generalize until the feel is right.

## A note to the builder

If anything in a request conflicts with the five hard rules in `CLAUDE.md`, raise it rather than
quietly building it. Those rules are the product.
