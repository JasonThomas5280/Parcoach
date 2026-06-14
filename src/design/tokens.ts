/**
 * Design tokens — the single source of truth for the palette and timing.
 * Mirrored into tailwind.config.js for utility classes. Values come straight
 * from docs/DESIGN_SYSTEM.md: warm, low-glare, high-subject-contrast.
 */

export const color = {
  bgWarm: '#FBF6EE', // soft paper, low blue light, easy at night
  bgWarmDeep: '#F1E7D6', // stage vignette
  ink: '#2B2A26', // near-black warm text (parent UI)
  inkSoft: '#6B655B', // secondary text
  subjectPop: '#E8743B', // one warm accent for reward glow / parent CTAs
  calm1: '#6FA8A0', // muted teal — secondary, parent UI
  rewardGlow: '#FCE3A8', // soft amber sparkle, never harsh
} as const

/** Motion timing. Kept short and gentle; all transforms are gated by reduced-motion. */
export const motion = {
  // Contingent feedback must land fast — the whole product is "calm contingency".
  feedbackMs: 90,
  rewardMs: 700,
  advanceCrossfadeMs: 450,
  // The child surface advances gently after this many taps OR this dwell.
  tapsBeforeAdvance: 4,
  dwellBeforeAdvanceMs: 9000,
} as const

/** A small, safe set of gentle animations content packs may key into. */
export const ANIMATIONS = ['wag', 'bounce', 'peek'] as const
export type AnimationKind = (typeof ANIMATIONS)[number]
