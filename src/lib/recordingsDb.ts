/**
 * IndexedDB wrapper for on-device voice recordings (and, later, parent photos).
 *
 * This is the privacy heart of the app: recordings live here, on the device,
 * and never leave it. There is no network code anywhere near this file by design.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export interface Recording {
  blob: Blob
  mime: string
  createdAt: number
}

export interface FamilyPhoto {
  blob: Blob
  mime: string
  createdAt: number
}

interface TandemDB extends DBSchema {
  recordings: {
    key: string // "<packId>:<itemId>"
    value: Recording
  }
  photos: {
    key: string // "<packId>:<itemId>"
    value: FamilyPhoto
  }
}

const DB_NAME = 'tandem'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<TandemDB>> | null = null

function db(): Promise<IDBPDatabase<TandemDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TandemDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('recordings')) {
          database.createObjectStore('recordings')
        }
        if (!database.objectStoreNames.contains('photos')) {
          database.createObjectStore('photos')
        }
      },
    })
  }
  return dbPromise
}

export function recordingKey(packId: string, itemId: string): string {
  return `${packId}:${itemId}`
}

export async function saveRecording(
  packId: string,
  itemId: string,
  blob: Blob,
): Promise<void> {
  const d = await db()
  await d.put(
    'recordings',
    { blob, mime: blob.type || 'audio/webm', createdAt: Date.now() },
    recordingKey(packId, itemId),
  )
}

export async function getRecording(
  packId: string,
  itemId: string,
): Promise<Recording | undefined> {
  const d = await db()
  return d.get('recordings', recordingKey(packId, itemId))
}

export async function deleteRecording(
  packId: string,
  itemId: string,
): Promise<void> {
  const d = await db()
  await d.delete('recordings', recordingKey(packId, itemId))
}

/** Keys ("<packId>:<itemId>") of every recording the family has made. */
export async function listRecordingKeys(): Promise<string[]> {
  const d = await db()
  return (await d.getAllKeys('recordings')) as string[]
}

/** One-tap "delete all our data": wipes every recording and photo from the device. */
export async function clearAllRecordings(): Promise<void> {
  const d = await db()
  await d.clear('recordings')
  await d.clear('photos')
}
