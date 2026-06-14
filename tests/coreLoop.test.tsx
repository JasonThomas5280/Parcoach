import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import type { ResolvedPack } from '../src/content/types'

// The child surface must never touch real audio hardware in tests.
vi.mock('../src/engine/audioManager', () => ({
  audioManager: {
    unlock: vi.fn(),
    preloadLabel: vi.fn().mockResolvedValue(undefined),
    invalidateLabel: vi.fn(),
    speakLabel: vi.fn().mockResolvedValue('synth'),
    playObjectSound: vi.fn(),
    playReward: vi.fn(),
  },
}))

import { audioManager } from '../src/engine/audioManager'
import { Stage } from '../src/child/Stage'
import { PlaySession } from '../src/child/PlaySession'

const pack: ResolvedPack = {
  id: 'everyday',
  version: 1,
  title: 'Everyday Things',
  ageBand: '18-36m',
  items: [
    {
      id: 'dog',
      label: 'Dog',
      image: 'dog.svg',
      imageUrl: '/content/everyday/dog.svg',
      sound: 'bark',
      animation: 'wag',
      coPlayPrompt: "Say 'Dog!'",
      realWorldBridge: 'Go find a dog together.',
    },
    {
      id: 'cat',
      label: 'Cat',
      image: 'cat.svg',
      imageUrl: '/content/everyday/cat.svg',
      sound: 'meow',
      animation: 'peek',
      coPlayPrompt: "Say 'Cat!'",
      realWorldBridge: 'Go find a cat together.',
    },
  ],
}

describe('core child loop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('fires contingent feedback on a tap: sound + spoken label + reward', () => {
    const onTapped = vi.fn()
    render(
      <Stage
        item={pack.items[0]}
        packId="everyday"
        onTapped={onTapped}
        onAdvance={vi.fn()}
        onInteractionSettled={vi.fn()}
        onSwipe={vi.fn()}
      />,
    )
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Dog' }))
    expect(audioManager.playObjectSound).toHaveBeenCalledWith('bark')
    expect(audioManager.speakLabel).toHaveBeenCalledWith('Dog', 'everyday', 'dog')
    expect(audioManager.playReward).toHaveBeenCalled()
    expect(onTapped).toHaveBeenCalledTimes(1)
  })

  it('records the word only once no matter how many taps', () => {
    const onTapped = vi.fn()
    render(
      <Stage
        item={pack.items[0]}
        packId="everyday"
        onTapped={onTapped}
        onAdvance={vi.fn()}
        onInteractionSettled={vi.fn()}
        onSwipe={vi.fn()}
      />,
    )
    const subject = screen.getByRole('button', { name: 'Dog' })
    fireEvent.pointerDown(subject)
    fireEvent.pointerDown(subject)
    expect(onTapped).toHaveBeenCalledTimes(1)
  })

  it('never shows a number, score, or X to the child', () => {
    const { container } = render(
      <Stage
        item={pack.items[0]}
        packId="everyday"
        onTapped={vi.fn()}
        onAdvance={vi.fn()}
        onInteractionSettled={vi.fn()}
        onSwipe={vi.fn()}
      />,
    )
    expect(container.textContent).not.toMatch(/[0-9]/)
    expect(container.textContent).not.toMatch(/[x✕✗]/i)
  })

  it('ends a timed-out session on the real-world bridge, never mid-tap', () => {
    vi.useFakeTimers()
    render(<PlaySession pack={pack} sessionMinutes={2} onExit={vi.fn()} />)

    // The subject button is the one labelled with the current item (order is
    // shuffled per session, so don't assume which item shows first).
    const labels = pack.items.map((i) => i.label)
    const subject = () =>
      screen
        .getAllByRole('button')
        .find((b) => labels.includes(b.getAttribute('aria-label') ?? ''))!

    // Before time is up, a tap keeps playing (no bridge).
    fireEvent.pointerDown(subject())
    expect(screen.queryByText(/All done for now/i)).toBeNull()

    // Let the bound elapse, then a settling tap transitions to the bridge.
    act(() => {
      vi.advanceTimersByTime(2 * 60_000 + 10)
    })
    fireEvent.pointerDown(subject())
    act(() => {
      vi.runOnlyPendingTimers()
    })
    expect(screen.getByText(/All done for now/i)).toBeInTheDocument()
    expect(screen.getByText(/Go find a (dog|cat) together\./)).toBeInTheDocument()
    vi.useRealTimers()
  })
})
