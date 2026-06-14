import { ANIMATIONS, type AnimationKind } from '../design/tokens'
import type { ContentItem, ContentPack } from './types'

/**
 * Hand-rolled runtime guard (no extra dependency). Verifies packs on load:
 * loud in dev, but in production a bad item is silently skipped rather than
 * ever crashing the child's screen (TECH_SPEC: "never crash the child's screen").
 */

const isDev = import.meta.env?.DEV ?? false

function warnDev(message: string): void {
  if (isDev) console.error(`[content] ${message}`)
}

function isAnimation(v: unknown): v is AnimationKind {
  return typeof v === 'string' && (ANIMATIONS as readonly string[]).includes(v)
}

export function validateItem(raw: unknown): ContentItem | null {
  if (typeof raw !== 'object' || raw === null) {
    warnDev('item is not an object')
    return null
  }
  const o = raw as Record<string, unknown>
  const required: (keyof ContentItem)[] = [
    'id',
    'label',
    'image',
    'sound',
    'coPlayPrompt',
    'realWorldBridge',
  ]
  for (const field of required) {
    if (typeof o[field] !== 'string' || (o[field] as string).length === 0) {
      warnDev(`item ${String(o.id)} missing/invalid "${field}"`)
      return null
    }
  }
  const animation = isAnimation(o.animation) ? o.animation : 'bounce'
  if (!isAnimation(o.animation)) {
    warnDev(`item ${String(o.id)} has unknown animation; defaulting to "bounce"`)
  }
  return {
    id: o.id as string,
    label: o.label as string,
    image: o.image as string,
    sound: o.sound as string,
    labelAudio: typeof o.labelAudio === 'string' ? o.labelAudio : undefined,
    animation,
    coPlayPrompt: o.coPlayPrompt as string,
    realWorldBridge: o.realWorldBridge as string,
    tags: Array.isArray(o.tags) ? (o.tags.filter((t) => typeof t === 'string') as string[]) : undefined,
  }
}

export function validatePack(raw: unknown): ContentPack | null {
  if (typeof raw !== 'object' || raw === null) {
    warnDev('pack is not an object')
    return null
  }
  const o = raw as Record<string, unknown>
  if (typeof o.id !== 'string' || !Array.isArray(o.items)) {
    warnDev('pack missing id or items[]')
    return null
  }
  const items = o.items
    .map(validateItem)
    .filter((it): it is ContentItem => it !== null)
  if (items.length === 0) {
    warnDev(`pack ${o.id} has no valid items`)
    return null
  }
  return {
    id: o.id,
    version: typeof o.version === 'number' ? o.version : 1,
    title: typeof o.title === 'string' ? o.title : o.id,
    ageBand: typeof o.ageBand === 'string' ? o.ageBand : '18-36m',
    items,
  }
}
