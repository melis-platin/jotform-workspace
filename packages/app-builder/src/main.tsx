import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import './styles/app.scss'

// Design System styles (builder UI fonts, tokens)
import '@jf/design-system/src/styles/app.scss'

// App Elements tokens & component styles (for canvas area)
import '@jf/app-elements/styles'

import { APP_PRESETS } from './presets/appPresets.ts'
import { initStorage, clearSnapshot, saveSnapshot, type PresetSnapshot } from './presets/storage.ts'
import { getAppSlug, loadRemoteApp, applyRemoteTheme } from './presets/remoteStore.ts'

const presetIds = APP_PRESETS.map((p) => p.id)

// `?fresh=1` discards the stored snapshot so a preset re-loads from its code
// definition (useful after editing appPresets.ts). With `?preset=<id>` it clears
// just that preset; otherwise it clears every preset. Opt-in — no effect otherwise.
const params = new URLSearchParams(window.location.search)
const forceFresh = params.get('fresh') === '1'
const freshPresetId = params.get('preset')

// `?app=<slug>` restores an account-less, server-saved app (Vercel KV via /api/app).
const appSlug = getAppSlug()

async function boot() {
  await initStorage(presetIds)

  if (forceFresh) {
    if (freshPresetId) clearSnapshot(freshPresetId)
    else presetIds.forEach((id) => clearSnapshot(id))
  }

  // Restore a remote saved app (after any fresh-clear, so the saved copy wins).
  if (appSlug) {
    const doc = await loadRemoteApp(appSlug)
    if (doc) {
      saveSnapshot(doc.presetId, doc.snapshot as PresetSnapshot) // seed cache for the preset-load path
      applyRemoteTheme(doc)
      if (params.get('preset') !== doc.presetId) {
        const u = new URL(window.location.href)
        u.searchParams.set('preset', doc.presetId)
        window.history.replaceState(null, '', u.toString())
      }
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void boot()
