import { useState } from 'react'
import { BigButton, Card } from '../design/primitives'
import {
  loadSettings,
  saveSettings,
  SESSION_MAX,
  SESSION_MIN,
  type Settings as SettingsT,
} from '../engine/settings'
import { resetProgress } from '../engine/progress'
import { clearAllRecordings } from '../lib/recordingsDb'

/**
 * Parent settings: session length (2-10, default 5), reduced-motion override,
 * and a plain "everything stays on this phone" statement with a one-tap delete.
 */
export function Settings() {
  const [settings, setSettings] = useState<SettingsT>(() => loadSettings())
  const [confirmingWipe, setConfirmingWipe] = useState(false)
  const [wiped, setWiped] = useState(false)

  const update = (patch: Partial<SettingsT>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next)
  }

  const wipeEverything = async () => {
    await clearAllRecordings()
    resetProgress()
    setConfirmingWipe(false)
    setWiped(true)
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-24">
      <h2 className="font-display text-3xl text-ink">Settings</h2>

      <Card className="mt-6">
        <label htmlFor="session-len" className="font-display text-xl text-ink">
          Session length
        </label>
        <p className="mt-1 text-sm text-ink-soft">
          A few minutes, then the app gently ends and sends you off-screen.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <input
            id="session-len"
            type="range"
            min={SESSION_MIN}
            max={SESSION_MAX}
            step={1}
            value={settings.sessionMinutes}
            onChange={(e) => update({ sessionMinutes: Number(e.target.value) })}
            className="h-2 flex-1 cursor-pointer accent-subject-pop"
          />
          <span className="w-20 text-right font-display text-xl text-ink">
            {settings.sessionMinutes} min
          </span>
        </div>
      </Card>

      <Card className="mt-4">
        <p className="font-display text-xl text-ink">Calmer motion</p>
        <p className="mt-1 text-sm text-ink-soft">
          Replaces movement with soft cross-fades. Your device&apos;s own
          reduced-motion setting is always respected too.
        </p>
        <div className="mt-4 flex gap-2">
          <Toggle
            active={settings.motion === 'system'}
            onClick={() => update({ motion: 'system' })}
          >
            Follow device
          </Toggle>
          <Toggle
            active={settings.motion === 'reduced'}
            onClick={() => update({ motion: 'reduced' })}
          >
            Always calm
          </Toggle>
        </div>
      </Card>

      <Card className="mt-4 bg-calm-1/10">
        <p className="font-display text-xl text-ink">
          Everything stays on this phone
        </p>
        <p className="mt-1 text-ink-soft">
          Nothing is sent anywhere. Ever. No account, no analytics, no ads. Your
          recordings live only on this device.
        </p>
        <div className="mt-4">
          {wiped ? (
            <p className="text-calm-1" role="status">
              Done — all recordings and progress on this device were deleted.
            </p>
          ) : confirmingWipe ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <BigButton
                variant="primary"
                className="px-5 py-3 text-base"
                onClick={() => void wipeEverything()}
              >
                Yes, delete everything
              </BigButton>
              <BigButton
                variant="ghost"
                className="px-5 py-3 text-base"
                onClick={() => setConfirmingWipe(false)}
              >
                Keep our data
              </BigButton>
            </div>
          ) : (
            <BigButton
              variant="secondary"
              className="px-5 py-3 text-base"
              onClick={() => setConfirmingWipe(true)}
            >
              Delete our data
            </BigButton>
          )}
        </div>
      </Card>
    </div>
  )
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-soft px-5 py-3 text-base transition-colors ${
        active
          ? 'bg-subject-pop text-white'
          : 'bg-warm-deep text-ink hover:brightness-[0.98]'
      }`}
    >
      {children}
    </button>
  )
}
