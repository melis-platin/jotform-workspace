// Snapshot storage backed by IndexedDB. We keep a synchronous in-memory cache
// so existing call sites (`useState` initializers, render-time reads) continue
// to work, and fire-and-forget async writes to IndexedDB on every save. Call
// `initStorage(presetIds)` once at app boot to hydrate the cache before
// rendering.
//
// Migration note: snapshots previously lived in localStorage under the
// `jf-app-builder:preset:v5:` prefix. On first init we copy any matching
// entries into IndexedDB and free up the localStorage slot. localStorage's
// 5MB quota was overflowing once users uploaded multiple base64 images;
// IndexedDB has a much larger quota (typically hundreds of MB) so image-heavy
// presets persist correctly.

const DB_NAME = 'jf-app-builder'
const DB_VERSION = 1
const STORE = 'preset-snapshots'
const LEGACY_LS_PREFIX = 'jf-app-builder:preset:v5:'

export interface PresetSnapshot {
  appTitle: string
  appSubtitle: string
  pages: unknown
  headerActions: unknown
  appHeader?: {
    layout: string
    icon: string
    skeleton: boolean
    show?: boolean
    headerStyleLayout?: 'Default' | 'Cover' | 'Profile'
    headerSize?: 'Compact' | 'Default' | 'Maximum'
    contentDirection?: 'Vertical' | 'Horizontal'
    titleFont?: string
    titleSize?: number
    backgroundColor?: string
    imageStyle?: 'Image' | 'Icon' | 'None'
    imageUrl?: string | null
    imageName?: string | null
    imageWidth?: number | null
    imageHeight?: number | null
    imageAspectLocked?: boolean
    textColor?: string
    backgroundImageUrl?: string | null
    backgroundImageName?: string | null
    title?: string
    subtitle?: string
    // Hero-only prop-based CTA button.
    ctaEnabled?: boolean
    ctaLabel?: string
    ctaAction?: string
    ctaPageId?: string
    ctaUrl?: string
    ctaEmail?: string
    ctaPhone?: string
    ctaFormTitle?: string
    ctaFormDescription?: string
    ctaFormSubmitLabel?: string
    ctaFormFields?: string
    ctaSubmitsTo?: string
  }
}

const cache = new Map<string, PresetSnapshot>()
let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE)
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

function isValidSnapshot(value: unknown): value is PresetSnapshot {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<PresetSnapshot>
  return (
    typeof v.appTitle === 'string' &&
    typeof v.appSubtitle === 'string' &&
    Array.isArray(v.pages) &&
    Array.isArray(v.headerActions)
  )
}

async function getFromDB(db: IDBDatabase, presetId: string): Promise<PresetSnapshot | null> {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(presetId)
    req.onsuccess = () => {
      const result = req.result
      resolve(isValidSnapshot(result) ? result : null)
    }
    req.onerror = () => resolve(null)
  })
}

async function putInDB(db: IDBDatabase, presetId: string, snapshot: PresetSnapshot): Promise<void> {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(snapshot, presetId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
  })
}

async function deleteFromDB(db: IDBDatabase, presetId: string): Promise<void> {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(presetId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
  })
}

async function migrateFromLocalStorage(presetIds: readonly string[], db: IDBDatabase): Promise<void> {
  for (const id of presetIds) {
    const key = LEGACY_LS_PREFIX + id
    const raw = localStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw)
      if (isValidSnapshot(parsed)) {
        await putInDB(db, id, parsed)
      }
    } catch {
      // ignore malformed legacy entries
    }
    localStorage.removeItem(key)
  }
}

export async function initStorage(presetIds: readonly string[]): Promise<void> {
  try {
    const db = await openDB()
    await migrateFromLocalStorage(presetIds, db)
    for (const id of presetIds) {
      const snap = await getFromDB(db, id)
      if (snap) cache.set(id, snap)
    }
  } catch {
    // IndexedDB unavailable (private mode, etc.) — operate in memory only.
  }
}

export function loadSnapshot(presetId: string): PresetSnapshot | null {
  return cache.get(presetId) ?? null
}

export function saveSnapshot(presetId: string, snapshot: PresetSnapshot): void {
  cache.set(presetId, snapshot)
  openDB()
    .then((db) => putInDB(db, presetId, snapshot))
    .catch(() => {})
}

export function clearSnapshot(presetId: string): void {
  cache.delete(presetId)
  openDB()
    .then((db) => deleteFromDB(db, presetId))
    .catch(() => {})
}

export function loadStoredAppTitle(presetId: string): string | null {
  return cache.get(presetId)?.appTitle ?? null
}

export function loadStoredAppHeaderIcon(presetId: string): string | null {
  return cache.get(presetId)?.appHeader?.icon ?? null
}
