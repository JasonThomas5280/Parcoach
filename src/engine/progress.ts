/**
 * Parent-facing progress — the honest "points." These belong to the ADULT and
 * are NEVER rendered on the child surface (see CLAUDE.md rule 2 and the PRD).
 *
 * Framed as "your shared moments," not the child's performance:
 *   - wordsExplored: distinct items the pair has tapped at least once
 *   - sessions:      co-play sessions started
 *   - bridgesDone:   real-world bridges the parent marked done
 *   - streak:        consecutive days with at least one session
 */

export interface Progress {
  wordsExplored: string[] // "<packId>:<itemId>"
  sessions: number
  bridgesDone: number
  streak: number
  lastSessionDay: string | null // YYYY-MM-DD, local
}

const KEY = 'tandem.progress.v1'

export const EMPTY_PROGRESS: Progress = {
  wordsExplored: [],
  sessions: 0,
  bridgesDone: 0,
  streak: 0,
  lastSessionDay: null,
}

export function loadProgress(): Progress {
  if (typeof localStorage === 'undefined') return clone(EMPTY_PROGRESS)
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return clone(EMPTY_PROGRESS)
    const p = JSON.parse(raw) as Partial<Progress>
    return {
      wordsExplored: Array.isArray(p.wordsExplored) ? p.wordsExplored : [],
      sessions: p.sessions ?? 0,
      bridgesDone: p.bridgesDone ?? 0,
      streak: p.streak ?? 0,
      lastSessionDay: p.lastSessionDay ?? null,
    }
  } catch {
    return clone(EMPTY_PROGRESS)
  }
}

function save(p: Progress): void {
  localStorage.setItem(KEY, JSON.stringify(p))
  window.dispatchEvent(new Event('tandem:progress-changed'))
}

function localDay(d = new Date()): string {
  // Local calendar day, not UTC — streaks should match the family's day.
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dayDiff(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00')
  const db = new Date(b + 'T00:00:00')
  return Math.round((db.getTime() - da.getTime()) / 86_400_000)
}

/** Call once when a session starts. Updates session count and the daily streak. */
export function recordSessionStart(): Progress {
  const p = loadProgress()
  const today = localDay()
  p.sessions += 1
  if (p.lastSessionDay === null) {
    p.streak = 1
  } else {
    const diff = dayDiff(p.lastSessionDay, today)
    if (diff === 0) {
      // same day, streak unchanged
    } else if (diff === 1) {
      p.streak += 1
    } else {
      p.streak = 1
    }
  }
  p.lastSessionDay = today
  save(p)
  return p
}

/** Mark that the pair explored a word (idempotent per item). */
export function recordWordExplored(packId: string, itemId: string): void {
  const p = loadProgress()
  const key = `${packId}:${itemId}`
  if (!p.wordsExplored.includes(key)) {
    p.wordsExplored.push(key)
    save(p)
  }
}

/** Parent tapped "we did it" on the real-world bridge card. */
export function recordBridgeDone(): Progress {
  const p = loadProgress()
  p.bridgesDone += 1
  save(p)
  return p
}

export function resetProgress(): void {
  save(clone(EMPTY_PROGRESS))
}

function clone(p: Progress): Progress {
  return { ...p, wordsExplored: [...p.wordsExplored] }
}
