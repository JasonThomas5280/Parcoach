import { useEffect } from 'react'
import type { ResolvedPack } from '../content/types'
import { useSession } from '../engine/useSession'
import { Stage } from './Stage'
import { Bridge } from './Bridge'
import { ParentPrompt } from './ParentPrompt'

/**
 * Drives one bounded co-play session: the child Stage while playing, then the
 * real-world Bridge card when the session's time bound is reached. Owns nothing
 * the child can see beyond the subject and the (dismissible) parent prompt.
 */
export function PlaySession({
  pack,
  sessionMinutes,
  onExit,
}: {
  pack: ResolvedPack
  sessionMinutes: number
  onExit: () => void
}) {
  const session = useSession(pack, sessionMinutes)

  // Keep the screen awake during play if the browser allows it (best-effort,
  // no network, silently ignored where unsupported).
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinel> }
    }
    nav.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => {})
    return () => {
      lock?.release().catch(() => {})
    }
  }, [])

  if (session.phase === 'bridge') {
    return <Bridge item={session.bridgeItem} onClose={onExit} />
  }

  return (
    <div className="relative h-full w-full">
      <ParentPrompt prompt={session.item.coPlayPrompt} itemId={session.item.id} />
      <Stage
        item={session.item}
        packId={pack.id}
        onTapped={session.onItemTapped}
        onAdvance={session.advance}
        onInteractionSettled={session.onInteractionSettled}
        onSwipe={session.go}
      />
      {/* A tiny, low-contrast way for the PARENT to leave early. Out of the
          child's tap zone, no scary "X" — just a gentle exit. */}
      <button
        type="button"
        onClick={onExit}
        aria-label="End session"
        className="absolute right-3 top-3 z-20 rounded-full bg-white/50 px-3 py-2 text-sm text-ink-soft backdrop-blur-sm transition active:scale-95 safe-top"
      >
        Done
      </button>
    </div>
  )
}
