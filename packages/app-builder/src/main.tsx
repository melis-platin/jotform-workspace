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
import { loadRemoteApp, applyRemoteTheme } from './presets/remoteStore.ts'

const presetIds = APP_PRESETS.map((p) => p.id)

// `?fresh=1` discards the stored snapshot so a preset re-loads from its code
// definition (useful after editing appPresets.ts). With `?preset=<id>` it clears
// just that preset; otherwise it clears every preset. Opt-in — no effect otherwise.
const params = new URLSearchParams(window.location.search)
const forceFresh = params.get('fresh') === '1'
const bootPresetId = params.get('preset')

async function boot() {
  await initStorage(presetIds)

  if (forceFresh) {
    if (bootPresetId) clearSnapshot(bootPresetId)
    else presetIds.forEach((id) => clearSnapshot(id))
  }

  // Load the shared remote state for the initial preset (after any fresh-clear, so the
  // shared copy wins). Picker switches load their preset via App.handlePresetChange.
  if (bootPresetId && bootPresetId !== 'empty' && !forceFresh) {
    const doc = await loadRemoteApp(bootPresetId)
    if (doc) {
      saveSnapshot(bootPresetId, doc.snapshot as PresetSnapshot) // seed cache for the preset-load path
      applyRemoteTheme(doc)
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void boot()
