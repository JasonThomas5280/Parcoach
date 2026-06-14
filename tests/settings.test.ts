import { describe, it, expect, beforeEach } from 'vitest'
import {
  clampMinutes,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from '../src/engine/settings'

describe('settings', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to a 5-minute session following the device for motion', () => {
    expect(DEFAULT_SETTINGS.sessionMinutes).toBe(5)
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('clamps session length to the allowed 2–10 range', () => {
    expect(clampMinutes(1)).toBe(2)
    expect(clampMinutes(11)).toBe(10)
    expect(clampMinutes(7)).toBe(7)
    expect(clampMinutes(NaN)).toBe(5)
  })

  it('persists and reloads settings, clamping on the way in', () => {
    saveSettings({ sessionMinutes: 99, motion: 'reduced', style: 'illustration' })
    const loaded = loadSettings()
    expect(loaded.sessionMinutes).toBe(10)
    expect(loaded.motion).toBe('reduced')
  })

  it('falls back safely on corrupt data', () => {
    localStorage.setItem('tandem.settings.v1', '{not json')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })
})
