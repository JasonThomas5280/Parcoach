import type { AnimationKind } from '../design/tokens'

/**
 * Content pack schema. Content is DATA, not code (TECH_SPEC) — adding items
 * never requires touching components. A pack is a JSON file plus media under
 * /public/content/<packId>/.
 */
export interface ContentItem {
  id: string
  label: string // the single word spoken/shown to the parent
  image: string // filename under the pack folder (warm SVG illustration)
  sound: string // keyword for the object's own sound (synthesized) — see audioManager
  /** Optional bundled fallback voice file. When absent, device speech says the word. */
  labelAudio?: string
  animation: AnimationKind // gentle motion keyed into a safe set
  coPlayPrompt: string // small, parent-facing cue: what to say/do
  realWorldBridge: string // the off-screen "go find it together" prompt
  tags?: string[] // loose category grouping
}

export interface ContentPack {
  id: string
  version: number
  title: string
  ageBand: string
  items: ContentItem[]
}

/** A loaded item, with its image resolved to a fetchable URL. */
export interface ResolvedItem extends ContentItem {
  imageUrl: string
}

export interface ResolvedPack extends Omit<ContentPack, 'items'> {
  items: ResolvedItem[]
}
