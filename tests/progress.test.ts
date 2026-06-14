import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  loadProgress,
  recordBridgeDone,
  recordSessionStart,
  recordWordExplored,
  resetProgress,
} from '../src/engine/progress'

describe('progress — the parent-facing "points"', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useRealTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('starts empty', () => {
    const p = loadProgress()
    expect(p.sessions).toBe(0)
    expect(p.wordsExplored).toEqual([])
    expect(p.streak).toBe(0)
  })

  it('records distinct words once (idempotent)', () => {
    recordWordExplored('everyday', 'dog')
    recordWordExplored('everyday', 'dog')
    recordWordExplored('everyday', 'cat')
    expect(loadProgress().wordsExplored).toEqual(['everyday:dog', 'everyday:cat'])
  })

  it('counts sessions and bridges', () => {
    recordSessionStart()
    recordSessionStart()
    recordBridgeDone()
    const p = loadProgress()
    expect(p.sessions).toBe(2)
    expect(p.bridgesDone).toBe(1)
  })

  it('starts a streak at 1 and does not double-count same-day sessions', () => {
    recordSessionStart()
    recordSessionStart()
    expect(loadProgress().streak).toBe(1)
  })

  it('increments streak on a consecutive day and resets after a gap', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-10T09:00:00'))
    recordSessionStart()
    expect(loadProgress().streak).toBe(1)

    vi.setSystemTime(new Date('2026-06-11T09:00:00'))
    recordSessionStart()
    expect(loadProgress().streak).toBe(2)

    // skip a day -> streak resets
    vi.setSystemTime(new Date('2026-06-13T09:00:00'))
    recordSessionStart()
    expect(loadProgress().streak).toBe(1)
  })

  it('reset wipes everything', () => {
    recordSessionStart()
    recordWordExplored('everyday', 'dog')
    resetProgress()
    const p = loadProgress()
    expect(p.sessions).toBe(0)
    expect(p.wordsExplored).toEqual([])
  })
})
