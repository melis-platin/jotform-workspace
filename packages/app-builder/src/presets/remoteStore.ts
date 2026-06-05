// Account-less remote persistence: an edited app is saved server-side (Vercel KV via
// /api/app) under an anonymous slug carried in the URL (`?app=<slug>`). The first edit
// mints a slug and rewrites the URL, so the URL itself is the shareable "save". Loading
// `?app=<slug>` restores that app. Falls back silently to local-only when /api is absent
// (e.g. `vite dev`, or before Upstash/KV is provisioned).

const SLUG_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const DEBOUNCE_MS = 1000

export interface RemoteAppDoc {
  presetId: string
  snapshot: unknown // PresetSnapshot (appTitle, appSubtitle, pages, headerActions, appHeader)
  theme?: string | null // raw localStorage value of jf-app-designer:<presetId>
}

export function getAppSlug(): string | null {
  try {
    return new URLSearchParams(window.location.search).get('app')
  } catch {
    return null
  }
}

export function mintAppSlug(): string {
  let slug = ''
  for (let i = 0; i < 10; i++) slug += SLUG_ALPHABET[Math.floor(Math.random() * SLUG_ALPHABET.length)]
  try {
    const u = new URL(window.location.href)
    u.searchParams.set('app', slug)
    window.history.replaceState(null, '', u.toString())
  } catch {
    // ignore — slug still returned and used for the API call
  }
  return slug
}

export async function loadRemoteApp(slug: string): Promise<RemoteAppDoc | null> {
  try {
    const res = await fetch(`/api/app?slug=${encodeURIComponent(slug)}`)
    if (!res.ok) return null
    const doc = (await res.json()) as RemoteAppDoc
    if (!doc || typeof doc !== 'object' || typeof doc.presetId !== 'string') return null
    return doc
  } catch {
    return null
  }
}

const themeKey = (presetId: string) => `jf-app-designer:${presetId}`

// ── debounced autosave ───────────────────────────────────────────────────────
let pending: { presetId: string; snapshot: unknown } | null = null
let timer: ReturnType<typeof setTimeout> | null = null

export function syncAppToRemote(presetId: string, snapshot: unknown): void {
  pending = { presetId, snapshot }
  if (timer) clearTimeout(timer)
  timer = setTimeout(flush, DEBOUNCE_MS)
}

async function flush(): Promise<void> {
  timer = null
  const p = pending
  pending = null
  if (!p) return
  let slug = getAppSlug()
  if (!slug) slug = mintAppSlug() // first edit → mint + rewrite URL
  let theme: string | null = null
  try {
    theme = localStorage.getItem(themeKey(p.presetId))
  } catch {
    /* ignore */
  }
  const doc: RemoteAppDoc = { presetId: p.presetId, snapshot: p.snapshot, theme }
  try {
    await fetch(`/api/app?slug=${encodeURIComponent(slug)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    })
  } catch {
    // offline / no backend — local autosave still holds the state
  }
}

/** Write a loaded remote doc into local storage so the existing preset-load path uses it. */
export function applyRemoteTheme(doc: RemoteAppDoc): void {
  if (doc.theme) {
    try {
      localStorage.setItem(themeKey(doc.presetId), doc.theme)
    } catch {
      /* ignore */
    }
  }
}
