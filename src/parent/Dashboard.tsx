import { useEffect, useState } from 'react'
import { loadProgress, type Progress } from '../engine/progress'
import { Card, Stat } from '../design/primitives'

/**
 * The parent dashboard — the honest "points," framed as YOUR SHARED MOMENTS,
 * never the child's performance, and NEVER shown on the child surface
 * (CLAUDE.md rule 2 / DESIGN_SYSTEM).
 */
export function Dashboard() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress())

  useEffect(() => {
    const update = () => setProgress(loadProgress())
    window.addEventListener('tandem:progress-changed', update)
    return () => window.removeEventListener('tandem:progress-changed', update)
  }, [])

  const empty = progress.sessions === 0

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-24">
      <h2 className="font-display text-3xl text-ink">Your shared moments</h2>
      <p className="mt-2 text-ink-soft">
        A quiet record for you — not a score for your child.
      </p>

      {empty ? (
        <Card className="mt-6">
          <p className="text-ink">
            Nothing here yet. Play your first few minutes together and this fills
            in — words you explored, sessions you shared, real-world finds.
          </p>
        </Card>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Card>
              <Stat value={progress.wordsExplored.length} label="words explored" />
            </Card>
            <Card>
              <Stat value={progress.sessions} label="sessions together" />
            </Card>
            <Card>
              <Stat value={progress.bridgesDone} label="real-world finds" />
            </Card>
            <Card>
              <Stat
                value={`${progress.streak} ${progress.streak === 1 ? 'day' : 'days'}`}
                label="gentle streak"
              />
            </Card>
          </div>

          <p className="mt-6 text-sm text-ink-soft">
            The number that matters most is the last one off-screen — the real
            dog you found, the soft thing you squeezed together.
          </p>
        </>
      )}
    </div>
  )
}
