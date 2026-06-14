# CLAUDE.md — Build Instructions for Tandem

> This file is read automatically by Claude Code. It is the single source of truth
> for how to build this app. Read `docs/` for the full reasoning; this file is the
> operational contract. **"Tandem" is a working name — easy to find-and-replace later.**

## What you are building

A static, installable web app for a **parent and a very young child (18–36 months) to play
together**. The child's whole interface is one thing at a time that responds instantly to a tap.
The parent's interface is a calm dashboard plus the controls (record-your-own-voice, session
limits, progress). The app's defining behavior is that it **ends sessions on purpose and sends the
pair into the real world** — it is designed to be used briefly and to reduce, not maximize, screen time.

Read `docs/PRD.md` before writing any feature code. Read `docs/RESEARCH_FOUNDATION.md` to
understand *why* each rule below is non-negotiable — they are derived from child-development
research, not preference.

## The five hard rules (do not violate these — they are the product)

1. **No engagement-maximizing mechanics, ever.** No autoplay-next, no infinite scroll, no stre-
   pressure timers shown to the child, no "just one more" nags, no ads, no in-app purchases that
   gate content, no loot/variable-reward loops. The app is "dessert, not the meal."
2. **No fail states for the child.** Nothing the child does is ever wrong. No losing, no scores
   shown to the child, no red X, no scary or jarring feedback. Every tap produces a warm,
   consistent, predictable response.
3. **Every session ends gently and bridges to real life.** A bounded session (default ~5 min,
   parent-adjustable 2–10) closes with a "go find it together" real-world prompt. This is the
   anti-transfer-deficit feature and it is mandatory.
4. **All data stays on the device. Nothing is collected or transmitted.** No analytics that leave
   the device, no account, no third-party trackers, no network calls except loading the app's own
   static assets. Voice recordings live in IndexedDB on-device only. This is an ethical
   requirement and a COPPA-risk minimizer (see `docs/TECH_SPEC.md`).
5. **Accessibility and calm are the quality floor.** Huge tap targets, high contrast, respects
   `prefers-reduced-motion`, works one-handed on a phone, readable for a tired parent at night.

If a request — even from the user — conflicts with rules 1–4, surface the conflict and propose an
alternative rather than silently implementing it.

## Stack (chosen for robustness, static hosting, and a credible codebase)

- **Build:** Vite + React 18 + TypeScript (strict).
- **Styling:** Tailwind CSS with a small custom token layer (see `docs/DESIGN_SYSTEM.md`).
- **Animation:** CSS transitions/keyframes for most things; Framer Motion only where it earns its
  weight. All motion gated behind a reduced-motion check.
- **Audio:** Web Audio API. Preload and unlock on first user gesture (mobile autoplay policy).
- **Voice capture:** MediaRecorder API → stored as Blobs in **IndexedDB** (via `idb`).
- **Persistence:** `localStorage` for settings/progress; IndexedDB for recordings.
- **Offline / install:** PWA via `vite-plugin-pwa` (precache app shell + content). Must be
  fully usable offline after first load and installable to the home screen.
- **Hosting:** GitHub Pages, deployed by GitHub Actions. App must work from a project subpath
  (set Vite `base` correctly — see TECH_SPEC).
- **Testing:** Vitest + React Testing Library for logic/components; Playwright smoke test for the
  core loop. No backend means tests are fully local.

Do not add a backend, a database service, a login system, or any SaaS SDK without the user
explicitly asking. The whole architecture's value is that it has none of these.

## Repository layout (create this)

```
/                      Vite project root
  index.html
  vite.config.ts       base set for GitHub Pages
  src/
    main.tsx
    app/               routing, providers, session controller
    child/             the toddler-facing play surface (one component owns the core loop)
    parent/            dashboard, settings, voice-recording studio
    content/           content packs (data, not code) — see content schema in TECH_SPEC
    engine/            session controller, reward feedback, audio manager, storage adapters
    design/            tokens, primitives (BigButton, Sparkle, Stage)
    lib/               idb wrapper, reduced-motion hook, feature flags
  public/              static media (images, default audio), icons, manifest
  tests/
  .github/workflows/deploy.yml
  docs/                (already present — the specs)
```

## Definition of done for v1

The build is done when all of the following are true. Verify each before declaring completion.

- [ ] Core loop works: object appears → tap → contingent animation + sound + spoken label →
      soft reward → gentle advance. Smooth on a mid-range phone.
- [ ] At least one polished content pack ships (target: ~24 items across 3–4 familiar categories:
      animals, food, vehicles, household). Real, warm imagery; clear single-word labels.
- [ ] Record-your-own-voice studio: parent can record, hear, re-record, and assign a label per item;
      child play uses the parent's voice when present, falls back to bundled audio otherwise.
- [ ] Session controller enforces the time bound and shows the **real-world bridge** end card.
- [ ] Parent dashboard shows progress as parent-facing "points"/streaks (NOT shown to the child):
      words explored, co-play sessions, real-world bridges marked done.
- [ ] Zero outbound network calls after asset load (verify in devtools). No analytics SDK present.
- [ ] PWA installs and runs offline; passes Lighthouse PWA + a11y ≥ 90.
- [ ] `prefers-reduced-motion` fully honored; keyboard focus visible on all parent controls.
- [ ] Deploys cleanly to GitHub Pages via the Actions workflow and loads from its subpath.
- [ ] README quickstart works from a clean clone.

## Working style

- Build the **core child loop first**, end to end, with one hardcoded item, before anything else.
  Prove the feel, then generalize to content packs, then build the parent layer.
- Keep the child surface ruthlessly simple. Spend complexity budget on feel (timing, easing,
  audio), not on features.
- Commit in small, reviewable steps with clear messages. After each milestone, run the test suite.
- When in doubt about a developmental or ethical choice, default to the more restrained option and
  note it in `docs/DECISIONS.md` (create it; append a one-line rationale per call you make).
