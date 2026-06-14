import { useCallback, useRef, useState } from 'react'

/**
 * Thin MediaRecorder wrapper for the Voice Studio. Captures a short clip to a
 * Blob entirely in memory; the caller persists it to IndexedDB. Nothing here
 * touches the network. Handles the mic-permission-denied case plainly.
 */
export type RecorderStatus = 'idle' | 'recording' | 'denied' | 'unsupported'

export function useRecorder() {
  const [status, setStatus] = useState<RecorderStatus>(() =>
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof MediaRecorder !== 'undefined'
      ? 'idle'
      : 'unsupported',
  )
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const start = useCallback(async (): Promise<boolean> => {
    if (status === 'unsupported') return false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : ''
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      chunksRef.current = []
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mediaRef.current = rec
      rec.start()
      setStatus('recording')
      return true
    } catch {
      setStatus('denied')
      return false
    }
  }, [status])

  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const rec = mediaRef.current
      if (!rec || rec.state === 'inactive') {
        resolve(null)
        return
      }
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || 'audio/webm',
        })
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        setStatus((s) => (s === 'recording' ? 'idle' : s))
        resolve(blob.size > 0 ? blob : null)
      }
      rec.stop()
    })
  }, [])

  return { status, start, stop }
}
