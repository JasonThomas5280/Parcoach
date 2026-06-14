import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom doesn't implement these; provide calm no-op stand-ins.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}
if (!Element.prototype.animate) {
  // Minimal Web Animations API stub.
  Element.prototype.animate = vi.fn().mockReturnValue({
    cancel: vi.fn(),
    finished: Promise.resolve(),
  }) as unknown as Element['animate']
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})
