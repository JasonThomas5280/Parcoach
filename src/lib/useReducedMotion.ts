import { useEffect, useState } from 'react'
import { loadSettings } from '../engine/settings'

/**
 * True when motion should be reduced — either because the OS asks for it
 * (prefers-reduced-motion) or because the parent forced it on in Settings.
 * The parent override can only ever ADD calm, never remove the OS preference.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => computeReduced())

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(computeReduced())
    update()
    mq.addEventListener('change', update)
    window.addEventListener('tandem:settings-changed', update)
    return () => {
      mq.removeEventListener('change', update)
      window.removeEventListener('tandem:settings-changed', update)
    }
  }, [])

  return reduced
}

function computeReduced(): boolean {
  const osPrefers =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const parentForced = loadSettings().motion === 'reduced'
  return Boolean(osPrefers) || parentForced
}
