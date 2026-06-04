import { useState, useMemo, useEffect, useSyncExternalStore } from 'react'
import { IconLibraryProvider } from '@jf/app-elements'
import { TopBar } from './shell/TopBar.tsx'
import { BuildPage } from './pages/BuildPage.tsx'
import { SettingsPage } from './pages/SettingsPage.tsx'
import { PublishPage } from './pages/PublishPage.tsx'
import { APP_PRESETS, EMPTY_PRESET_ID, getPresetById } from './presets/appPresets.ts'
import { loadStoredAppTitle, loadStoredAppHeaderIcon } from './presets/storage.ts'

type Page = 'build' | 'settings' | 'publish'

// The app icon (home-screen / navigation logo) is app identity — managed in
// Settings → "App Name & Icon", independent of the App Header hero. Lifted here
// so both SettingsPage (edits it) and BuildPage (nav logo) share one source.
export interface AppIconState {
  variant: 'Icon' | 'Image'
  icon: string
  imageUrl: string | null
  imageName: string | null
}
// Glyph defaults to the preset's app-header icon (or stored override) so the nav
// logo looks right out of the box; the user then sets it explicitly in Settings.
function iconForPreset(id: string): string {
  if (id === EMPTY_PRESET_ID) return getPresetById(id).appHeader?.icon ?? 'Leaf'
  return loadStoredAppHeaderIcon(id) ?? getPresetById(id).appHeader?.icon ?? 'Leaf'
}
function defaultAppIcon(id: string): AppIconState {
  return { variant: 'Icon', icon: iconForPreset(id), imageUrl: null, imageName: null }
}

// Subscribe to URL changes — covers history navigation (popstate), fragment
// updates (hashchange), and tab refocus after a `window.open`/`open` from
// outside the app (focus). The capture flow opens new URLs in an existing
// browser tab; without these listeners React keeps reading the URL params
// captured at module load and ignores the new ?preset/?page values.
function subscribeUrl(callback: () => void): () => void {
  window.addEventListener('popstate', callback)
  window.addEventListener('hashchange', callback)
  window.addEventListener('focus', callback)
  return () => {
    window.removeEventListener('popstate', callback)
    window.removeEventListener('hashchange', callback)
    window.removeEventListener('focus', callback)
  }
}

function getUrlSearch(): string {
  return window.location.search
}

function useUrlSearch(): string {
  return useSyncExternalStore(subscribeUrl, getUrlSearch, getUrlSearch)
}

export function App() {
  const search = useUrlSearch()
  const { urlPreset, urlPage, urlFullscreen, urlOpenAttributionSheet } = useMemo(() => {
    const p = new URLSearchParams(search)
    return {
      urlPreset: p.get('preset'),
      urlPage: p.get('page'),
      urlFullscreen: p.get('fullscreen') === 'phone',
      urlOpenAttributionSheet: p.get('attributionSheet') === 'ai',
    }
  }, [search])

  const [activePage, setActivePage] = useState<Page>('build')
  const [previewMode, setPreviewMode] = useState(false)
  const [activePresetId, setActivePresetId] = useState<string>(urlPreset ?? EMPTY_PRESET_ID)
  const preset = useMemo(() => getPresetById(activePresetId), [activePresetId])
  // Empty App is a sandbox — never restore from storage.
  const titleForPreset = (id: string) =>
    id === EMPTY_PRESET_ID ? getPresetById(id).appTitle : (loadStoredAppTitle(id) ?? getPresetById(id).appTitle)
  const [appTitle, setAppTitle] = useState(() => titleForPreset(urlPreset ?? EMPTY_PRESET_ID))
  const [appIcon, setAppIcon] = useState<AppIconState>(() => defaultAppIcon(urlPreset ?? EMPTY_PRESET_ID))

  // Sync activePresetId/appTitle whenever the URL preset changes (capture flow
  // opens different presets in the same tab without a full reload).
  useEffect(() => {
    if (!urlPreset) return
    setActivePresetId((prev) => (prev === urlPreset ? prev : urlPreset))
    setAppTitle(titleForPreset(urlPreset))
    setAppIcon(defaultAppIcon(urlPreset))
    // titleForPreset is stable enough here; intentionally omitted from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlPreset])

  useEffect(() => {
    if (urlFullscreen) {
      document.body.classList.add('builder--phone-only')
      return () => { document.body.classList.remove('builder--phone-only') }
    }
  }, [urlFullscreen])

  const handlePresetChange = (id: string) => {
    setActivePresetId(id)
    setAppTitle(titleForPreset(id))
    setAppIcon(defaultAppIcon(id))
  }

  return (
    <IconLibraryProvider>
    <div className="builder">
      <TopBar
        activePage={activePage}
        onPageChange={setActivePage}
        previewMode={previewMode}
        onPreviewToggle={() => setPreviewMode((prev) => !prev)}
        appName={appTitle}
        onAppNameChange={setAppTitle}
        presets={APP_PRESETS.map((p) => {
          if (p.id === activePresetId) {
            return { id: p.id, name: appTitle === p.appTitle ? p.name : appTitle }
          }
          // Empty App never reads from storage — always show its preset name.
          if (p.id === EMPTY_PRESET_ID) return { id: p.id, name: p.name }
          const storedTitle = loadStoredAppTitle(p.id)
          return { id: p.id, name: storedTitle && storedTitle !== p.appTitle ? storedTitle : p.name }
        })}
        activePresetId={activePresetId}
        onPresetChange={handlePresetChange}
      />
      <div className="builder__content">
        {activePage === 'build' && (
          <BuildPage
            // Bumping the key on URL preset/page changes forces a remount so
            // BuildPage re-derives its initial state from the new URL params.
            key={`${activePresetId}:${urlPage ?? ''}`}
            preset={preset}
            appTitle={appTitle}
            onAppTitleChange={setAppTitle}
            appIcon={appIcon}
            initialPageId={urlPage ?? undefined}
            chromeless={urlFullscreen}
            openAttributionSheet={urlOpenAttributionSheet}
            previewMode={previewMode}
            onPreviewClose={() => setPreviewMode(false)}
          />
        )}
        {activePage === 'settings' && <SettingsPage appTitle={appTitle} onAppTitleChange={setAppTitle} appIcon={appIcon} onAppIconChange={setAppIcon} />}
        {activePage === 'publish' && <PublishPage />}
      </div>
    </div>
    </IconLibraryProvider>
  )
}
