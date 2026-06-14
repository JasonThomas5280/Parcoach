import { useEffect, useState } from 'react'
import type { ResolvedPack } from '../content/types'
import { BigButton, Card } from '../design/primitives'
import { useRecorder } from './useRecorder'
import {
  deleteRecording,
  getRecording,
  listRecordingKeys,
  recordingKey,
  saveRecording,
} from '../lib/recordingsDb'
import { audioManager } from '../engine/audioManager'

/**
 * Record-your-own-voice studio. The parent records a single word per item in
 * their own voice; child play prefers it. Recordings are saved ONLY to
 * IndexedDB on this device (CLAUDE.md rule 4). The app works fully without it.
 */
export function VoiceStudio({ pack }: { pack: ResolvedPack }) {
  const { status, start, stop } = useRecorder()
  const [recorded, setRecorded] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Which items already have a recording (so we show "saved" vs "record").
  useEffect(() => {
    let alive = true
    listRecordingKeys().then((keys) => {
      if (alive) setRecorded(new Set(keys))
    })
    return () => {
      alive = false
    }
  }, [])

  const isSaved = (itemId: string) =>
    recorded.has(recordingKey(pack.id, itemId))

  const beginRecording = async (itemId: string) => {
    setActiveId(itemId)
    const ok = await start()
    if (!ok) setActiveId(null)
  }

  const finishRecording = async (itemId: string) => {
    const blob = await stop()
    setActiveId(null)
    if (blob) {
      setBusyId(itemId)
      await saveRecording(pack.id, itemId, blob)
      audioManager.invalidateLabel(pack.id, itemId) // refresh the cached voice
      setRecorded((prev) => new Set(prev).add(recordingKey(pack.id, itemId)))
      setBusyId(null)
    }
  }

  const playSaved = async (itemId: string) => {
    const rec = await getRecording(pack.id, itemId)
    if (rec) new Audio(URL.createObjectURL(rec.blob)).play().catch(() => {})
  }

  const removeSaved = async (itemId: string) => {
    await deleteRecording(pack.id, itemId)
    audioManager.invalidateLabel(pack.id, itemId)
    setRecorded((prev) => {
      const next = new Set(prev)
      next.delete(recordingKey(pack.id, itemId))
      return next
    })
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-24">
      <h2 className="font-display text-3xl text-ink">Record in your voice</h2>
      <p className="mt-2 text-ink-soft">
        Your child learns best hearing <em>you</em>. Record a word, hear it back,
        re-record any time. Everything stays on this phone.
      </p>

      {status === 'denied' && (
        <Card className="mt-5 bg-reward-glow/40">
          <p className="text-ink">
            We can&apos;t reach your microphone. Tandem works fully without it —
            the bundled voices will play. To record your own, allow mic access in
            your browser settings.
          </p>
        </Card>
      )}
      {status === 'unsupported' && (
        <Card className="mt-5 bg-reward-glow/40">
          <p className="text-ink">
            This browser can&apos;t record audio. Tandem still works — the bundled
            voices will play.
          </p>
        </Card>
      )}

      <ul className="mt-6 space-y-3">
        {pack.items.map((item) => {
          const saved = isSaved(item.id)
          const recording = activeId === item.id
          const busy = busyId === item.id
          return (
            <li key={item.id}>
              <Card className="flex items-center gap-4">
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-14 w-14 flex-none object-contain"
                  draggable={false}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl text-ink">{item.label}</p>
                  <p className="text-sm text-ink-soft">
                    {recording
                      ? 'Recording… say the word, then stop.'
                      : busy
                        ? 'Saving…'
                        : saved
                          ? 'Saved in your voice'
                          : 'Not recorded yet'}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  {saved && !recording && (
                    <>
                      <IconButton
                        label={`Play your recording of ${item.label}`}
                        onClick={() => void playSaved(item.id)}
                      >
                        ▶
                      </IconButton>
                      <IconButton
                        label={`Delete your recording of ${item.label}`}
                        onClick={() => void removeSaved(item.id)}
                      >
                        ✕
                      </IconButton>
                    </>
                  )}
                  {recording ? (
                    <BigButton
                      variant="primary"
                      className="px-5 py-3 text-base"
                      onClick={() => void finishRecording(item.id)}
                    >
                      Stop
                    </BigButton>
                  ) : (
                    <BigButton
                      variant="secondary"
                      className="px-5 py-3 text-base"
                      disabled={
                        busy ||
                        status === 'denied' ||
                        status === 'unsupported' ||
                        (activeId !== null && activeId !== item.id)
                      }
                      onClick={() => void beginRecording(item.id)}
                    >
                      {saved ? 'Re-record' : 'Record'}
                    </BigButton>
                  )}
                </div>
              </Card>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-warm-deep text-ink transition-transform active:scale-95"
    >
      {children}
    </button>
  )
}
