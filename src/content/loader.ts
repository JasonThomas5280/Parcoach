import type { ResolvedItem, ResolvedPack } from './types'
import { validatePack } from './validate'

/**
 * Loads a content pack from /public/content/<packId>/pack.json and resolves
 * each item's image to a base-aware URL (so it works from the GitHub Pages
 * subpath). The only fetch the app makes is for its OWN static content.
 */
export async function loadPack(packId: string): Promise<ResolvedPack> {
  const base = import.meta.env.BASE_URL // "/" locally, "/Parcoach/" on Pages
  const packUrl = `${base}content/${packId}/pack.json`
  const res = await fetch(packUrl)
  if (!res.ok) {
    throw new Error(`Could not load content pack "${packId}" (${res.status})`)
  }
  const json = (await res.json()) as unknown
  const pack = validatePack(json)
  if (!pack) {
    throw new Error(`Content pack "${packId}" failed validation`)
  }
  const items: ResolvedItem[] = pack.items.map((item) => ({
    ...item,
    imageUrl: `${base}content/${packId}/${item.image}`,
  }))
  return { ...pack, items }
}

export const DEFAULT_PACK_ID = 'everyday'
