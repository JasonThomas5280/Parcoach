import { useEffect, useState } from 'react'

/**
 * The small, parent-facing co-play cue pinned to the very top — out of the
 * child's tap zone. It tells the tired parent what to say ("Say it together:
 * 'Dog!'"). Dismissible, and it never covers the child's subject.
 */
export function ParentPrompt({
  prompt,
  itemId,
}: {
  prompt: string
  itemId: string
}) {
  const [hidden, setHidden] = useState(false)

  // Re-show the cue for each new subject (it's per-item guidance).
  useEffect(() => {
    setHidden(false)
  }, [itemId])

  if (hidden) return null

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-3 safe-top">
      <button
        type="button"
        onClick={() => setHidden(true)}
        aria-label="Hide co-play tip"
        className="pointer-events-auto mt-1 max-w-md rounded-full bg-white/70 px-4 py-2 text-center text-sm text-ink-soft shadow-sm backdrop-blur-sm transition active:scale-[0.98]"
      >
        {prompt}
      </button>
    </div>
  )
}
