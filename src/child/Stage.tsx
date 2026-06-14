import { useCallback, useEffect, useRef, useState } from 'react'
import type { ResolvedItem } from '../content/types'
import { audioManager } from '../engine/audioManager'
import { motion as motionTokens } from '../design/tokens'
import { useReducedMotion } from '../lib/useReducedMotion'

/**
 * The child surface. One huge subject on a warm stage. Tap → immediate
 * contingent feedback (animation + object sound + spoken label + soft glow).
 * No buttons, no numbers, no timers, no fail states — ever (CLAUDE.md rules 1-2).
 *
 * The whole subject (plus generous padding) is the tap target, sized for an
 * imprecise poke from a one-year-old.
 */
export function Stage({
  item,
  packId,
  onTapped,
  onAdvance,
  onInteractionSettled,
  onSwipe,
}: {
  item: ResolvedItem
  packId: string
  onTapped: () => void
  onAdvance: () => void
  onInteractionSettled: () => void
  onSwipe: (dir: 1 | -1) => void
}) {
  const reduced = useReducedMotion()
  const [glowing, setGlowing] = useState(false)
  const tapCount = useRef(0)
  const dwellTimer = useRef<number | undefined>(undefined)
  const glowTimer = useRef<number | undefined>(undefined)
  const touchStartX = useRef<number | null>(null)
  const subjectRef = useRef<HTMLImageElement | null>(null)

  // Preload the parent's recorded voice (if any) so the label is instant on tap.
  useEffect(() => {
    void audioManager.preloadLabel(packId, item.id)
  }, [packId, item.id])

  // Reset per-item counters whenever the subject changes.
  useEffect(() => {
    tapCount.current = 0
    return () => {
      window.clearTimeout(dwellTimer.current)
      window.clearTimeout(glowTimer.current)
    }
  }, [item.id])

  // A gentle dwell: if the child just looks without tapping for a while, drift
  // on. Reset on every tap. This is the only "advance" besides tap count.
  const armDwell = useCallback(() => {
    window.clearTimeout(dwellTimer.current)
    dwellTimer.current = window.setTimeout(() => {
      onAdvance()
    }, motionTokens.dwellBeforeAdvanceMs)
  }, [onAdvance])

  useEffect(() => {
    armDwell()
    return () => window.clearTimeout(dwellTimer.current)
  }, [armDwell, item.id])

  const handleTap = useCallback(() => {
    // Unlock audio on the very first gesture (mobile autoplay policy).
    audioManager.unlock()

    // Fire feedback immediately — this is the <120ms "calm contingency".
    // One gentle tap animation via the Web Animations API, composed over the
    // CSS idle breathe. Skipped entirely under reduced motion.
    if (!reduced && subjectRef.current) {
      const frames = TAP_KEYFRAMES[item.animation] ?? TAP_KEYFRAMES.bounce
      subjectRef.current.animate(frames, {
        duration: 600,
        easing: 'ease-out',
        composite: 'add',
      })
    }
    audioManager.playObjectSound(item.sound)
    void audioManager.speakLabel(item.label, packId, item.id)
    audioManager.playReward()

    // Soft glow bloom.
    setGlowing(true)
    window.clearTimeout(glowTimer.current)
    glowTimer.current = window.setTimeout(
      () => setGlowing(false),
      reduced ? 320 : motionTokens.rewardMs,
    )

    if (tapCount.current === 0) onTapped() // record the word once
    tapCount.current += 1

    armDwell()

    // After a few warm taps, gently move on. Settle first so the bound can apply.
    onInteractionSettled()
    if (tapCount.current >= motionTokens.tapsBeforeAdvance) {
      window.setTimeout(() => onAdvance(), reduced ? 200 : 520)
    }
  }, [
    item.sound,
    item.label,
    item.id,
    item.animation,
    packId,
    reduced,
    onTapped,
    armDwell,
    onInteractionSettled,
    onAdvance,
  ])

  // Parent swipe to change items (no child-facing "next" button).
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current
    if (Math.abs(dx) > 70) onSwipe(dx < 0 ? 1 : -1)
    touchStartX.current = null
  }

  return (
    <div
      className="relative flex h-full w-full select-none items-center justify-center overflow-hidden bg-warm"
      style={{
        background: `radial-gradient(circle at 50% 42%, #FBF6EE 0%, #F1E7D6 100%)`,
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* The big, forgiving tap target: the subject and its breathing room. */}
      <button
        type="button"
        onPointerDown={handleTap}
        aria-label={item.label}
        className="relative flex h-full w-full max-w-[640px] cursor-pointer items-center justify-center focus:outline-none"
      >
        {/* Soft amber reward glow, behind the subject. */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[62vmin] w-[62vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(252,227,168,0.95) 0%, rgba(252,227,168,0) 70%)',
            opacity: glowing ? (reduced ? 0.7 : undefined) : 0,
            transition: reduced ? 'opacity 320ms ease-out' : undefined,
            animation:
              glowing && !reduced
                ? `glow ${motionTokens.rewardMs}ms ease-out forwards`
                : undefined,
          }}
        />

        {/* The subject. Idle "breath" makes it feel touchable; a tap plays one
            gentle animation over the top via the Web Animations API. */}
        <img
          ref={subjectRef}
          key={item.id}
          src={item.imageUrl}
          alt=""
          draggable={false}
          className={`relative z-10 h-[58vmin] max-h-[78vh] w-auto max-w-[86vw] drop-shadow-[0_8px_24px_rgba(43,42,38,0.12)] ${
            reduced ? 'animate-fadein' : 'animate-breathe'
          }`}
        />
      </button>

      {/* Optional large word under the subject. The SPOKEN label is what
          matters; we never rely on the child reading. */}
      <span className="pointer-events-none absolute bottom-[7vh] left-0 right-0 text-center font-display text-4xl text-ink/80">
        {item.label}
      </span>
    </div>
  )
}

/**
 * The small, safe set of gentle tap animations. composite:'add' layers these
 * on top of the idle breathe so the subject feels alive, never frantic.
 */
const TAP_KEYFRAMES: Record<string, Keyframe[]> = {
  wag: [
    { transform: 'rotate(0deg)' },
    { transform: 'rotate(-4deg)' },
    { transform: 'rotate(4deg)' },
    { transform: 'rotate(-2deg)' },
    { transform: 'rotate(0deg)' },
  ],
  bounce: [
    { transform: 'translateY(0) scale(1)' },
    { transform: 'translateY(-7%) scale(1.04)' },
    { transform: 'translateY(0) scale(0.99)' },
    { transform: 'translateY(0) scale(1)' },
  ],
  peek: [
    { transform: 'rotate(0deg) scale(1)' },
    { transform: 'rotate(-6deg) scale(1.05)' },
    { transform: 'rotate(4deg) scale(1.03)' },
    { transform: 'rotate(0deg) scale(1)' },
  ],
}
