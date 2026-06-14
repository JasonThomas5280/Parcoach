import { useState } from 'react'
import type { ResolvedItem } from '../content/types'
import { BigButton } from '../design/primitives'
import { recordBridgeDone } from '../engine/progress'

/**
 * The real-world bridge — the mandatory, anti-transfer-deficit end card
 * (CLAUDE.md rule 3). Every session ends here: calm "all done," then a concrete
 * off-screen thing to do together. The parent can mark it done (their progress)
 * or just close. There is no "play more" trap — closing returns to the calm home.
 */
export function Bridge({
  item,
  onClose,
}: {
  item: ResolvedItem
  onClose: () => void
}) {
  const [done, setDone] = useState(false)

  const markDone = () => {
    if (!done) {
      recordBridgeDone()
      setDone(true)
    }
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-warm px-7 text-center safe-top safe-bottom">
      <div className="animate-fadein max-w-md">
        <p className="font-display text-2xl text-ink-soft">All done for now.</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink">
          Go do this together
        </h1>

        <div className="mt-8 rounded-soft bg-white/70 p-6 ring-1 ring-black/[0.04]">
          <img
            src={item.imageUrl}
            alt=""
            className="mx-auto h-28 w-auto drop-shadow-[0_6px_16px_rgba(43,42,38,0.12)]"
            draggable={false}
          />
          <p className="mt-4 text-lg leading-relaxed text-ink">
            {item.realWorldBridge}
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          {done ? (
            <p className="font-display text-xl text-calm-1" role="status">
              Lovely. See you next time. 🌿
            </p>
          ) : (
            <BigButton variant="primary" onClick={markDone} className="w-full">
              We did it together
            </BigButton>
          )}
          <BigButton variant="ghost" onClick={onClose}>
            {done ? 'Close' : 'Not now'}
          </BigButton>
        </div>
      </div>
    </div>
  )
}
