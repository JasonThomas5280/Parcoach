# Tandem — Product Requirements (v1)

**Status:** Draft for build · **Owner:** Jason · **Working name:** Tandem (placeholder)
**One line:** A play surface for a parent and a 1–3-year-old to use *together*, built to be used
briefly and to push the pair into the real world — the opposite of an attention-trap kids' app.

---

## Problem statement

Parents of 1–3-year-olds are handed a false choice: hand the child an engagement-optimized app
that the child uses alone (which research links to poor learning transfer at this age), or use
nothing. Almost no product is built around the one thing that *does* help very young children
learn from media — a parent co-playing, naming, and connecting the screen to real life. The cost
of getting this wrong is real: passive solo screen use for under-3s shows a documented "transfer
deficit," and the 2026 pediatric guidance explicitly steers families toward quality, co-use, and
conversation over solo screen time. There is room for a product that treats the parent as the
point, not the problem.

## Goals (outcomes, not outputs)

1. **A parent and child can have a genuinely good 5-minute shared moment** that ends with them
   doing something together off-screen. (Measure: % of sessions that reach the real-world bridge
   card; target ≥ 70%.)
2. **The app reduces, not extends, screen time per sitting.** (Measure: median session length
   ≤ 6 min; near-zero sessions that hit a hard cap because the parent wanted to stop and couldn't.)
3. **The child's interaction is purely cause-and-effect and never produces failure.** (Measure:
   QA — zero fail states, zero child-facing scores, every tap yields contingent feedback < 120ms.)
4. **The parent trusts it completely.** (Measure: zero data leaves the device; this is verifiable
   and is the core trust claim.)
5. **It is buildable, shippable, and maintainable by one person** on free static hosting.

## Non-goals (and why)

- **Teaching academic skills (letters, numbers, multiplication).** Developmentally premature for
  the core age band; chasing it produces a worse product. Labeling and cause-and-effect are the
  right targets. *Out of scope for v1; possibly a 3+ mode later.*
- **A child who plays alone.** The entire thesis is co-play. We will not optimize for unattended
  use, and we will not add features that make solo use stickier.
- **Accounts, cloud sync, social features, leaderboards.** They add data risk, complexity, and
  exactly the comparison/engagement dynamics we're rejecting.
- **Maximized session length or daily-active-use metrics.** We deliberately do not optimize these;
  pursuing them would betray the product.
- **A native app store build (v1).** Web + PWA install is enough to prove the thing and to host
  for free. Native is a later distribution decision, not a v1 requirement.

## Target users

- **Primary buyer & co-player:** an involved parent/caregiver of a 12–36-month-old who is
  *uneasy* about screens and wants something they can feel good about doing *with* their kid.
  (This is also the hardest customer to win — see `PITCH_AND_MARKET_REALITY.md`.)
- **End "user":** the child, 18–36 months. Cannot read, has ~10–100 words, short attention,
  imprecise taps, no concept of points/rules/winning. Designed for accordingly.

## User stories

**Parent (co-player)**
- As a parent, I want to start a calm session in one tap so we can play before I lose the moment.
- As a parent, I want to record words in my own voice so my child hears *me* name things.
- As a parent, I want the app to tell me what to say ("Point to the dog — can you find it?") so
  co-play is effortless even when I'm tired.
- As a parent, I want every session to end on its own with something we do off-screen, so the app
  never becomes the babysitter.
- As a parent, I want to set the session length and trust there are no ads, no purchases, and no
  data leaving my phone.
- As a parent, I want a quiet progress view (words we've explored, real-world finds) for *me* —
  not shown to my child.

**Child (end user)**
- As a child, when I tap the thing on the screen, it does something delightful, every time, right away.
- As a child, I am never told I'm wrong and nothing ever scares or rushes me.

**Edge / empty / error states**
- First run, no recordings yet → child play uses warm bundled audio; parent is gently invited
  (not nagged) to record later.
- Microphone permission denied → recording studio explains plainly and the app works fully without it.
- Offline → everything still works (PWA precache).
- Reduced-motion enabled → animations become simple cross-fades; feel is preserved.

## Requirements

### Must-have (P0) — the app does not exist without these

- **Core co-play loop.** One large object on a calm stage. Tap → contingent animation + sound +
  clear spoken single-word label → soft visual reward (glow/sparkle, never a number) → gentle
  advance after a few taps. Feedback latency < 120ms.
  - *Given* an item is on the stage, *when* the child taps it, *then* within 120ms it animates,
    plays its sound, speaks its label, and shows a soft reward — with no score and no fail path.
- **Content as data.** Items live in JSON content packs (image, label, sound, animation, co-play
  prompt, real-world bridge), not hardcoded. Ship ≥ 1 polished pack (~24 items, 3–4 categories).
- **Parent co-play prompts.** A small, parent-facing cue line per item that tells the parent what
  to say/do. Never covers the child's object; dismissible.
- **Bounded sessions + real-world bridge.** Default ~5 min (adjustable 2–10). At the end: a calm
  "all done" card with a concrete off-screen activity ("Go find something soft in your house!"),
  which the parent can mark done.
- **Record-your-own-voice studio.** Parent records/re-records a label per item; child play prefers
  the parent's voice. Recordings stored only in IndexedDB.
- **Parent-facing progress ("points," honestly).** Words explored, co-play sessions, bridges
  completed, gentle streaks. Explicitly *not* surfaced on the child's screen.
- **On-device only.** No network calls post-load, no analytics SDK, no account.
- **PWA + offline + installable.** Works from a GitHub Pages subpath.
- **Accessibility floor.** Reduced motion, high contrast, large targets, visible focus on parent UI.

### Nice-to-have (P1) — fast follows

- Multiple content packs and a simple pack picker.
- "Photo of a real dog" toggle vs. illustrated style (parent preference).
- A parent-recorded *photo* of the real object from their home (max real-world grounding).
- Simple printable "real-world bridge" cards.
- Localization scaffolding (the label/prompt strings are already data).

### Future considerations (P2) — design so we don't block these

- A distinct 3+ mode (early labeling → simple categories) as the child grows.
- Optional encrypted local export/import of a family's recordings between the parent's own devices.
- Pediatrician / early-childhood-program distribution kit (see market doc).

## Success metrics

**Leading (days–weeks):** session reaches bridge card (≥70%); median session ≤6 min; first
voice recording made within first 3 sessions (≥40%); zero outbound calls (binary, must pass).

**Lagging (weeks–months):** parents still co-playing weekly at week 6; qualitative: parents report
it changed *how* they use screens with their kid, not just *that* they do. (For a labor-of-love or
indie product these matter more than DAU; for a venture pitch they are necessary but not sufficient
— see market doc.)

## Open questions

- **Content style** (design): warm illustration vs. real photography vs. parent-supplied photos —
  which best fights the transfer deficit for *this* age? Lean photo/real, validate with Jeremiah.
- **Default session length** (you): 5 min is a starting guess; tune against real use.
- **Legal** (you / counsel): confirm COPPA posture given zero collection; confirm any app-store
  "made for kids" rules if native ever happens. Not legal advice — flag for your attorney.
- **Name** (you): "Tandem" is a placeholder chosen because the thesis *is* doing it together.

## Timeline / phasing

- **Phase 0:** Core loop, one hardcoded item, perfect the feel. (Proof of feel.)
- **Phase 1:** Content packs + one full pack + session bound + bridge card. (Playable end to end.)
- **Phase 2:** Voice studio + parent dashboard + PWA/offline + deploy. (v1 shippable.)
- **Phase 3 (P1):** more packs, photo toggle, polish. Only after v1 is genuinely done.
