# Decisions

A one-line rationale per judgement call made while building, per CLAUDE.md
("when in doubt, default to the more restrained option and note it here").

- **No router.** Parent/child are view state, not routes — keeps GitHub Pages
  subpath hosting trivial (no 404.html fallback needed), per TECH_SPEC.
- **Object sounds are synthesized (Web Audio), not shipped as MP3s.** Keeps the
  app tiny and fully offline with zero media fetches, and avoids 24 audio files
  of uncertain provenance. All synthesized sounds are short, soft, band-limited —
  never harsh (rule 2). A designer can later add real `labelAudio`/`sound` files;
  the schema already supports per-item `labelAudio`.
- **Bundled label fallback uses the device speech synthesis (Web Speech API).**
  The *preferred* voice is always the parent's own recording (IndexedDB). The
  fallback only speaks the single word and is an on-device browser capability.
  Caveat worth flagging: on some platforms `speechSynthesis` may use an OS-level
  service. It is used only as a fallback and only to say a single common noun; no
  personal data is ever passed to it. If a fully-offline guarantee on every
  platform is required, ship recorded `labelAudio` files and disable the synth
  fallback. This does not change rule 4 (we collect/transmit nothing ourselves).
- **Illustrations are generated SVGs, not photographs.** The PRD's open question
  (illustration vs. photo) is unresolved; SVGs are a calm, lightweight, warm
  placeholder a designer/photographer can swap without touching code (content is
  data). The `style` setting + P1 photo toggle leave room for real photography.
- **Reduced-motion CSS neutralizes keyframe movement but keeps transitions** so
  the reduced-motion design ("swap transforms for soft cross-fades, keep audio +
  reward") is actually achievable. Components also gate motion via
  `useReducedMotion`, which honors BOTH the OS preference and the parent toggle.
- **Session advance is by tap-count OR a gentle dwell timer**, never an autoplay
  loop — and the dwell only ever moves within the bounded session (rule 1, 3).
- **Streaks are computed on the local calendar day**, so they match the family's
  day rather than UTC. Same-day repeat sessions never inflate the streak.
- **"Done" / "End session" affordances are parent-facing and low-contrast**, out
  of the child's tap zone, with no scary "X" — an early exit is gentle, not a
  fail state.
