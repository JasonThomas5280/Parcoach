import { useEffect, useState } from 'react'
import { BigButton } from '../design/primitives'
import { loadProgress } from '../engine/progress'

/**
 * The parent landing. One big, warm "Play together" button and a one-line
 * reminder of the spirit. Calm and trustworthy — no dashboards shouting numbers.
 */
export function Home({ onPlay }: { onPlay: () => void }) {
  const [sessions, setSessions] = useState(0)
  useEffect(() => {
    setSessions(loadProgress().sessions)
  }, [])

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-7 text-center safe-top safe-bottom">
      <div className="animate-fadein flex flex-col items-center">
        <div
          aria-hidden
          className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-warm-deep text-5xl"
        >
          🤝
        </div>
        <h1 className="font-display text-5xl text-ink">Tandem</h1>
        <p className="mt-3 max-w-xs text-lg text-ink-soft">
          A few minutes together, then go play in the real world.
        </p>

        <BigButton
          variant="primary"
          onClick={onPlay}
          className="mt-10 w-64 text-xl"
        >
          Play together
        </BigButton>

        {sessions === 0 && (
          <p className="mt-6 max-w-xs text-sm text-ink-soft">
            Sit with your child. Tap the picture together and name it out loud —
            the app does the rest, then gently ends.
          </p>
        )}
      </div>
    </div>
  )
}
