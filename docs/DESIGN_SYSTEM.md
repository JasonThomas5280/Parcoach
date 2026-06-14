# Design System

Two surfaces, two registers, one product. The **child surface** is huge, calm, sensory, and
forgiving. The **parent surface** is quiet, trustworthy, and evidence-forward. Resist the default
"bright primary-color plastic toy" look — for the child it should feel *calm and warm*, not
hyper-stimulating (the research warns against engineering for stimulation), and for the parent it
should feel like something made by people who respect them.

## Design thesis

> The screen is a shared object two people lean over together. So it's designed like a good picture
> book, not like a game: one clear subject per page, warm and tactile, generous space, gentle
> motion, and a voice you trust. Nothing flashes for attention. The signature is **calm contingency**
> — the feeling that the world reliably answers a small hand.

## Tokens

Define in `src/design/tokens.ts` and map into Tailwind theme. Values below are a starting palette —
warm, low-glare, high-subject-contrast — not the neon default. Tune against real screens and a real
toddler.

**Color**
```
--bg-warm:      #FBF6EE   /* soft paper, low blue light, easy at night */
--bg-warm-deep: #F1E7D6   /* stage vignette */
--ink:          #2B2A26   /* near-black warm text (parent UI) */
--subject-pop:  #E8743B   /* one warm accent for reward glow / parent CTAs */
--calm-1:       #6FA8A0   /* muted teal — secondary, parent UI */
--reward-glow:  #FCE3A8   /* soft amber sparkle, never harsh */
```
The child stage is mostly **warm paper + the subject itself**. Saturated color comes from the
*content imagery*, not the chrome. Avoid pure white backgrounds (glare) and avoid the rainbow.

**Type**
- **Display / parent headings:** a humanist, friendly-but-grown-up face (e.g., Fraunces or a warm
  grotesque) — signals "for the parent," not "for the baby."
- **Body / UI:** a clean, highly legible sans (e.g., Inter / system stack) at comfortable sizes for
  a tired adult reading one-handed.
- **The child surface has almost no text.** The one word label can appear large under the subject,
  but the *spoken* label is what matters; never rely on the child reading.

**Space & shape**
- Generous. One subject, lots of breathing room. Rounded, soft corners (tactile, safe).
- **Tap targets on the child surface fill a large share of the screen.** Whole-subject hit areas
  with forgiving padding. Assume an imprecise poke from a 1-year-old.

**Motion**
- Gentle, organic easing (ease-out, slight overshoot for "aliveness," never frantic).
- One animation per tap. Short. Then rest. The stage returns to calm.
- `prefers-reduced-motion`: replace transforms with soft cross-fades; keep audio + reward.

## Child surface — the Stage

Layout: a single centered subject on the warm stage. Optional small, dismissible **parent prompt**
pinned to the very top (out of the child's tap zone). No buttons, no chrome, no counters in the
child's view.

```
┌─────────────────────────────────┐
│  ‹ parent prompt, small, top ›   │   ← for the adult; tappable to hide
│                                   │
│            (  D O G  )            │   ← huge subject = the whole tap target
│              ~wag~                │
│                                   │
│              Dog                  │   ← optional large word, spoken aloud
└─────────────────────────────────┘
```

Interaction feel (the whole point — get this *right* before anything else):
1. Subject rests, very subtly alive (a slow breath/idle so it invites touch).
2. Tap → immediate (<120ms): the subject animates once (wag/bounce/peek), plays its sound, speaks
   its label in the parent's voice if recorded, and a soft amber glow blooms and fades.
3. Repeat taps always work and always feel good. Never "used up," never punished, never rushed.
4. After a few taps / a short dwell, the subject gently cross-fades to the next. No "next" button;
   the parent can also swipe.

Forbidden on the child surface: numbers, scores, stars-as-points, timers, X marks, error states,
red alarm colors, ads, popups, "are you still there?" nags, anything that flashes to pull attention.

## Parent surface

Calm, legible, honest. This is where trust is won and where the "points" live.

- **Home / start:** one big, warm **"Play together"** button. A one-line reminder of the spirit
  ("A few minutes, then go play in the real world"). Last session's bridge, if not yet marked done.
- **Dashboard:** words explored, sessions co-played, bridges completed, gentle streak — framed as
  *your shared moments*, never as the child's performance.
- **Voice Studio:** per-item record/play/re-record; clear states for not-yet-recorded, recording,
  saved, and mic-denied. Re-recording is one tap (parents will want to redo these).
- **Settings:** session length, motion, content style; a plain-language **"Everything stays on this
  phone"** statement with a one-tap "delete our data."

## Copy voice (parent-facing)

Plain, warm, never salesy or cutesy. Active voice. Say what a control does. Examples:
- Button: **"Play together"** (not "Start" or "Launch").
- Empty voice studio: **"No recordings yet. When you're ready, record a word in your own voice —
  your child learns best hearing you."** (invitation, not nag).
- Mic denied: **"We can't reach your microphone. Tandem works fully without it — the bundled voices
  will play. To record your own, allow mic access in your browser settings."** (explain + path).
- Session end / bridge: **"All done for now. Go find a real dog together — point to it and say
  'dog.'"** (direction, not mood).
- Privacy line: **"Everything stays on this phone. Nothing is sent anywhere. Ever."**

## Accessibility (the floor, not optional)

- Reduced motion honored throughout.
- Parent UI: visible keyboard focus, 4.5:1 text contrast, real labels on controls, 44px+ targets.
- Audio never the *only* signal for the parent (pair with visible state).
- One-handed phone use; thumb-reachable parent controls.

## What "great UI/UX" means *here* (so it isn't generic)

Not motion-heavy, not gamified, not maximalist. Great here is: a subject that feels *touchable*, a
response that lands in under a tenth of a second every single time, a voice that sounds like home,
and an ending that gently lets go. The craft is in timing, audio, easing, and restraint — the kind
of polish you feel and can't quite point to. Spend the boldness on **calm contingency**; keep
everything else quiet.
