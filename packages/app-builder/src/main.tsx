import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import './styles/app.scss'

// Design System styles (builder UI fonts, tokens)
import '@jf/design-system/src/styles/app.scss'

// App Elements tokens & component styles (for canvas area)
import '@jf/app-elements/styles'

import { APP_PRESETS } from './presets/appPresets.ts'
import { initStorage, clearSnapshot } from './presets/storage.ts'

const presetIds = APP_PRESETS.map((p) => p.id)

// `?fresh=1` discards the stored snapshot so a preset re-loads from its code
// definition (useful after editing appPresets.ts). With `?preset=<id>` it clears
// just that preset; otherwise it clears every preset. Opt-in — no effect otherwise.
const params = new URLSearchParams(window.location.search)
const forceFresh = params.get('fresh') === '1'
const freshPresetId = params.get('preset')

initStorage(presetIds).finally(() => {
  if (forceFresh) {
    if (freshPresetId) clearSnapshot(freshPresetId)
    else presetIds.forEach((id) => clearSnapshot(id))
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
