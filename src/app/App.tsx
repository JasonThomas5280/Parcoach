import { useEffect, useState } from 'react'
import { DEFAULT_PACK_ID, loadPack } from '../content/loader'
import type { ResolvedPack } from '../content/types'
import { loadSettings } from '../engine/settings'
import { recordSessionStart } from '../engine/progress'
import { Home } from '../parent/Home'
import { Dashboard } from '../parent/Dashboard'
import { VoiceStudio } from '../parent/VoiceStudio'
import { Settings } from '../parent/Settings'
import { PlaySession } from '../child/PlaySession'

/**
 * Top-level view state. No router by design (TECH_SPEC): parent and child are
 * view state, not routes, so the app works cleanly from a GitHub Pages subpath
 * with no server rewrites.
 */
type View = 'home' | 'play' | 'dashboard' | 'voice' | 'settings'

export function App() {
  const [view, setView] = useState<View>('home')
  const [pack, setPack] = useState<ResolvedPack | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPack(DEFAULT_PACK_ID)
      .then(setPack)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Could not load content.'),
      )
  }, [])

  const startPlay = () => {
    recordSessionStart() // counts the session + updates the gentle streak
    setView('play')
  }

  if (error) {
    return (
      <Centered>
        <p className="font-display text-2xl text-ink">Hmm.</p>
        <p className="mt-2 max-w-sm text-ink-soft">{error}</p>
      </Centered>
    )
  }

  if (!pack) {
    return (
      <Centered>
        <div className="animate-breathe text-5xl" aria-hidden>
          🤝
        </div>
        <p className="mt-4 text-ink-soft">Getting ready…</p>
      </Centered>
    )
  }

  // The child surface takes the whole screen with no parent chrome.
  if (view === 'play') {
    return (
      <PlaySession
        pack={pack}
        sessionMinutes={loadSettings().sessionMinutes}
        onExit={() => setView('home')}
      />
    )
  }

  // Parent surfaces share a calm shell with bottom navigation.
  return (
    <div className="flex min-h-full flex-col bg-warm">
      <main className="flex-1 overflow-y-auto pt-6">
        {view === 'home' && <Home onPlay={startPlay} />}
        {view === 'dashboard' && <Dashboard />}
        {view === 'voice' && <VoiceStudio pack={pack} />}
        {view === 'settings' && <Settings />}
      </main>
      <ParentNav view={view} setView={setView} />
    </div>
  )
}

function ParentNav({
  view,
  setView,
}: {
  view: View
  setView: (v: View) => void
}) {
  const tabs: { id: View; label: string; icon: string }[] = [
    { id: 'home', label: 'Play', icon: '🤝' },
    { id: 'dashboard', label: 'Moments', icon: '🌿' },
    { id: 'voice', label: 'Voice', icon: '🎙️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]
  return (
    <nav
      aria-label="Parent navigation"
      className="sticky bottom-0 z-10 flex justify-around border-t border-black/[0.06] bg-warm/95 px-2 py-2 backdrop-blur-sm safe-bottom"
    >
      {tabs.map((t) => {
        const active = view === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setView(t.id)}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-[56px] min-w-[64px] flex-col items-center justify-center gap-1 rounded-soft px-3 py-1 text-xs transition-colors ${
              active ? 'text-subject-pop' : 'text-ink-soft hover:text-ink'
            }`}
          >
            <span className="text-2xl" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-7 text-center">
      {children}
    </div>
  )
}
