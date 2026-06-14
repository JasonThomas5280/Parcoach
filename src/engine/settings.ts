/**
 * Parent settings, persisted in localStorage. No sensitive data here — just
 * session length and accessibility preferences.
 */

export type MotionPref = 'system' | 'reduced'
export type ContentStyle = 'illustration' | 'photo' // photo is a P1 toggle

export interface Settings {
  sessionMinutes: number // 2-10, default 5
  motion: MotionPref
  style: ContentStyle
}

const KEY = 'tandem.settings.v1'

export const DEFAULT_SETTINGS: Settings = {
  sessionMinutes: 5,
  motion: 'system',
  style: 'illustration',
}

export const SESSION_MIN = 2
export const SESSION_MAX = 10

export function loadSettings(): Settings {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      sessionMinutes: clampMinutes(
        parsed.sessionMinutes ?? DEFAULT_SETTINGS.sessionMinutes,
      ),
      motion: parsed.motion === 'reduced' ? 'reduced' : 'system',
      style: parsed.style === 'photo' ? 'photo' : 'illustration',
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(next: Settings): void {
  const safe: Settings = { ...next, sessionMinutes: clampMinutes(next.sessionMinutes) }
  localStorage.setItem(KEY, JSON.stringify(safe))
  // Let reduced-motion subscribers and anything else react immediately.
  window.dispatchEvent(new Event('tandem:settings-changed'))
}

export function clampMinutes(m: number): number {
  if (Number.isNaN(m)) return DEFAULT_SETTINGS.sessionMinutes
  return Math.min(SESSION_MAX, Math.max(SESSION_MIN, Math.round(m)))
}
