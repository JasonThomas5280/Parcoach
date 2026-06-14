/**
 * Audio manager — the "voice that sounds like home" and the gentle object sounds.
 *
 * Two sources of audio, in priority order for the spoken label:
 *   1. The PARENT's own recording (Blob in IndexedDB) — always preferred.
 *   2. A bundled fallback: the device's speech synthesis says the single word.
 *
 * Object sounds (a dog's "woof", a bell's chime) are SYNTHESIZED with the Web
 * Audio API rather than shipped as files — see docs/DECISIONS.md. This keeps the
 * app tiny, fully offline, and means zero media fetches. Everything here is warm
 * and short; nothing is ever harsh (CLAUDE.md rule 2 / DESIGN_SYSTEM "never harsh").
 *
 * Web Audio is unlocked on the first user gesture to satisfy mobile autoplay
 * policy, and label/sound are preloaded so tap-to-feedback stays under ~120ms.
 */
import { getRecording } from '../lib/recordingsDb'

type SoundPreset = 'soft' | 'bright' | 'low' | 'airy' | 'watery' | 'bell'

// Maps a content item's `sound` keyword to a synthesis character. Unknown
// keywords fall back to a warm, neutral chime — never silence, never a crash.
const SOUND_PRESETS: Record<string, SoundPreset> = {
  bark: 'low',
  woof: 'low',
  meow: 'bright',
  moo: 'low',
  baa: 'airy',
  quack: 'bright',
  cluck: 'bright',
  tweet: 'airy',
  buzz: 'bright',
  ribbit: 'watery',
  engine: 'low',
  horn: 'bright',
  ring: 'bell',
  chug: 'low',
  splash: 'watery',
  chime: 'bell',
  pop: 'soft',
  crunch: 'soft',
  clink: 'bell',
  tick: 'soft',
  whoosh: 'airy',
  drip: 'watery',
}

class AudioManager {
  private ctx: AudioContext | null = null
  private unlocked = false
  private recordingUrls = new Map<string, string>() // cacheKey -> objectURL
  private prewarmedVoices = false

  /** Lazily create / resume the AudioContext. Safe to call repeatedly. */
  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Ctor) return null
      this.ctx = new Ctor()
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  /** Call from the first user gesture (a tap) to satisfy autoplay policies. */
  unlock(): void {
    if (this.unlocked) return
    const ctx = this.ensureCtx()
    if (ctx) {
      // A silent blip to fully wake the context on iOS.
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      gain.gain.value = 0
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.02)
      this.unlocked = true
    }
    // Warm up speech synthesis voice list (some browsers load it async).
    if (!this.prewarmedVoices && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      this.prewarmedVoices = true
    }
  }

  /** Preload a parent recording (if any) so playback is instant on tap. */
  async preloadLabel(packId: string, itemId: string): Promise<void> {
    const key = `${packId}:${itemId}`
    if (this.recordingUrls.has(key)) return
    const rec = await getRecording(packId, itemId)
    if (rec) {
      const url = URL.createObjectURL(rec.blob)
      this.recordingUrls.set(key, url)
    }
  }

  /** Forget a cached recording URL (e.g. after a re-record or delete). */
  invalidateLabel(packId: string, itemId: string): void {
    const key = `${packId}:${itemId}`
    const url = this.recordingUrls.get(key)
    if (url) {
      URL.revokeObjectURL(url)
      this.recordingUrls.delete(key)
    }
  }

  /**
   * Speak the item's label: parent recording if we have one, else the device
   * voice saying the single word. Returns which source actually played.
   */
  async speakLabel(
    label: string,
    packId: string,
    itemId: string,
  ): Promise<'recording' | 'synth' | 'none'> {
    const key = `${packId}:${itemId}`
    let url = this.recordingUrls.get(key)
    if (!url) {
      await this.preloadLabel(packId, itemId)
      url = this.recordingUrls.get(key)
    }
    if (url) {
      const audio = new Audio(url)
      audio.play().catch(() => {})
      return 'recording'
    }
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(label)
      u.rate = 0.85 // unhurried, clear for a toddler
      u.pitch = 1.05
      u.volume = 1
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(u)
      return 'synth'
    }
    return 'none'
  }

  /** Play the object's own gentle sound (synthesized). */
  playObjectSound(soundKey: string): void {
    const ctx = this.ensureCtx()
    if (!ctx) return
    const preset = SOUND_PRESETS[soundKey] ?? 'soft'
    this.synth(ctx, preset)
  }

  /** The soft reward bloom — a warm two-note chime, gentle and consistent. */
  playReward(): void {
    const ctx = this.ensureCtx()
    if (!ctx) return
    const now = ctx.currentTime
    this.chime(ctx, 660, now, 0.12)
    this.chime(ctx, 880, now + 0.09, 0.14)
  }

  // --- synthesis helpers (all short, soft, band-limited) ---

  private synth(ctx: AudioContext, preset: SoundPreset): void {
    const now = ctx.currentTime
    switch (preset) {
      case 'low':
        this.tone(ctx, 180, now, 0.22, 'sawtooth', 600)
        break
      case 'bright':
        this.tone(ctx, 520, now, 0.18, 'triangle', 2600)
        break
      case 'airy':
        this.noiseBurst(ctx, now, 0.2, 1800, 0.5)
        break
      case 'watery':
        this.tone(ctx, 300, now, 0.16, 'sine', 1200)
        this.tone(ctx, 240, now + 0.08, 0.16, 'sine', 900)
        break
      case 'bell':
        this.chime(ctx, 740, now, 0.5)
        break
      case 'soft':
      default:
        this.tone(ctx, 360, now, 0.16, 'sine', 1400)
        break
    }
  }

  private tone(
    ctx: AudioContext,
    freq: number,
    start: number,
    dur: number,
    type: OscillatorType,
    cutoff: number,
  ): void {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = cutoff
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.92, start + dur)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(filter).connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + dur + 0.02)
  }

  private chime(
    ctx: AudioContext,
    freq: number,
    start: number,
    dur: number,
  ): void {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.2, start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + dur + 0.02)
  }

  private noiseBurst(
    ctx: AudioContext,
    start: number,
    dur: number,
    cutoff: number,
    amp: number,
  ): void {
    const frames = Math.floor(ctx.sampleRate * dur)
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i++) {
      // Fade the noise so it's a soft "shh", never a harsh hiss.
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = cutoff
    const gain = ctx.createGain()
    gain.gain.value = amp * 0.25
    src.connect(filter).connect(gain).connect(ctx.destination)
    src.start(start)
  }
}

export const audioManager = new AudioManager()
