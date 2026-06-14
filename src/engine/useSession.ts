import { useCallback, useEffect, useRef, useState } from 'react'
import type { ResolvedItem, ResolvedPack } from '../content/types'
import { recordWordExplored } from './progress'

/**
 * The core session state machine (TECH_SPEC):
 *   playing(item) → (advance) → playing(next) → … → ending → bridge
 *
 * Hard guarantees enforced here:
 *  - The timer is NEVER shown to the child and never cuts a tap short: when the
 *    bound elapses we set `timeUp`, but we only move to the bridge once the
 *    current micro-interaction reports it has settled.
 *  - There is no autoplay loop without the bound; advance only reshuffles items
 *    within the bounded session.
 */

export type SessionPhase = 'playing' | 'bridge'

export interface SessionState {
  phase: SessionPhase
  item: ResolvedItem
  bridgeItem: ResolvedItem
  /** Notify the controller that the child tapped this item (records the word). */
  onItemTapped: () => void
  /** Stage asks to move on (after N taps / dwell). May trigger the bridge. */
  advance: () => void
  /** Stage reports a tap's feedback finished — safe to end if time is up. */
  onInteractionSettled: () => void
  /** Parent swiped to a specific direction. */
  go: (dir: 1 | -1) => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function useSession(
  pack: ResolvedPack,
  sessionMinutes: number,
): SessionState {
  // A shuffled running order so repeat sessions feel fresh; stable per session.
  const order = useRef<ResolvedItem[]>(shuffle(pack.items))
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<SessionPhase>('playing')
  const timeUp = useRef(false)
  const lastItem = useRef<ResolvedItem>(order.current[0])

  const item = order.current[index % order.current.length]
  lastItem.current = item

  // The bound. When it elapses we flag timeUp; the actual transition waits for a
  // settled interaction so the child is never cut off mid-tap.
  useEffect(() => {
    if (phase !== 'playing') return
    const ms = Math.max(1, sessionMinutes) * 60_000
    const id = window.setTimeout(() => {
      timeUp.current = true
    }, ms)
    return () => window.clearTimeout(id)
  }, [phase, sessionMinutes])

  const onItemTapped = useCallback(() => {
    recordWordExplored(pack.id, item.id)
  }, [pack.id, item.id])

  const maybeEnd = useCallback((): boolean => {
    if (timeUp.current) {
      setPhase('bridge')
      return true
    }
    return false
  }, [])

  const advance = useCallback(() => {
    if (maybeEnd()) return
    setIndex((i) => (i + 1) % order.current.length)
  }, [maybeEnd])

  const go = useCallback((dir: 1 | -1) => {
    setIndex((i) => {
      const n = order.current.length
      return (i + dir + n) % n
    })
  }, [])

  const onInteractionSettled = useCallback(() => {
    // The gentle place to honor the bound: a tap just finished.
    maybeEnd()
  }, [maybeEnd])

  return {
    phase,
    item,
    bridgeItem: lastItem.current,
    onItemTapped,
    advance,
    onInteractionSettled,
    go,
  }
}
