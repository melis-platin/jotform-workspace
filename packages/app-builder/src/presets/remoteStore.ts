// Shared, account-less persistence keyed by PRESET id. When anyone edits a preset it
// autosaves to a single shared server doc (Vercel KV via /api/app?slug=<presetId>), and
// everyone who opens that preset loads the latest shared state. Last-write-wins.
// Falls back silently to local-only when /api is unreachable (vite dev, or no KV).

const DEBOUNCE_MS = 1000

export interface RemoteAppDoc {
  presetId: string
  snapshot: unknown // PresetSnapshot (appTitle, appSubtitle, pages, headerActions, appHeader)
  theme?: string | null // raw localStorage value of jf-app-designer:<presetId>
}

const keyOk = (presetId: string) => /^[a-z0-9-]{3,60}$/.test(presetId)
const themeKey = (presetId: string) => `jf-app-designer:${presetId}`

export async function loadRemoteApp(presetId: string): Promise<RemoteAppDoc | null> {
  if (!keyOk(presetId)) return null
  try {
    const res = await fetch(`/api/app?slug=${encodeURIComponent(presetId)}`)
    if (!res.ok) return null // 404 (nobody has edited it yet) / 503 (no KV) → use local/default
    const doc = (await res.json()) as RemoteAppDoc
    return doc && typeof doc === 'object' && doc.snapshot ? doc : null
  } catch {
    return null
  }
}

/** Write a loaded remote doc's theme into local storage so the preset-load path applies it. */
export function applyRemoteTheme(doc: RemoteAppDoc): void {
  if (doc.theme) {
    try {
      localStorage.setItem(themeKey(doc.presetId), doc.theme)
    } catch {
      /* ignore */
    }
  }
}

// ── debounced shared autosave (per preset) ───────────────────────────────────
let pending: { presetId: string; snapshot: unknown } | null = null
let timer: ReturnType<typeof setTimeout> | null = null

export function syncAppToRemote(presetId: string, snapshot: unknown): void {
  if (!keyOk(presetId)) return
  pending = { presetId, snapshot }
  if (timer) clearTimeout(timer)
  timer = setTimeout(flush, DEBOUNCE_MS)
}

async function flush(): Promise<void> {
  timer = null
  const p = pending
  pending = null
  if (!p) return
  let theme: string | null = null
  try {
    theme = localStorage.getItem(themeKey(p.presetId))
  } catch {
    /* ignore */
  }
  const doc: RemoteAppDoc = { presetId: p.presetId, snapshot: p.snapshot, theme }
  try {
    await fetch(`/api/app?slug=${encodeURIComponent(p.presetId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    })
  } catch {
    // offline / no backend — local autosave still holds the state on this device
  }
}
