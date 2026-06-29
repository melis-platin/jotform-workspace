import { useState, useMemo, useEffect, useSyncExternalStore, useCallback, useRef } from 'react'
import { IconLibraryProvider } from '@jf/app-elements'
import { TopBar } from './shell/TopBar.tsx'
import { BuildPage } from './pages/BuildPage.tsx'
import { SettingsPage, type PushNotificationHistoryItem } from './pages/SettingsPage.tsx'
import { APP_USER_NAME_FIELD_VALUE, APP_USER_TABLE_ROLE_IDS, PublishPage } from './pages/PublishPage.tsx'
import { APP_PRESETS, EMPTY_PRESET_ID, getPresetById, type AppPreset } from './presets/appPresets.ts'
import { loadStoredAppTitle, loadStoredAppHeaderIcon, saveSnapshot, type PresetSnapshot } from './presets/storage.ts'
import { loadRemoteApp, applyRemoteTheme } from './presets/remoteStore.ts'
import { DEFAULT_ROLE_OPTIONS, type AppRoleOption } from './state/appUserRoles.ts'
import { createDeepLinkTargetsFromPreset, type DeepLinkTarget } from './state/deepLinkTargets.ts'
import { ALL_USERS_AUDIENCE_ID } from './state/pushNotifications.ts'
import { SEARCH_BAR_AUTO_ENABLE_THRESHOLD } from './state/searchableElements.ts'

type Page = 'build' | 'settings' | 'publish'

interface FigmaCaptureOptions {
  selector?: string
  delayMs?: number
  verbose?: boolean
  captureId?: string
  endpoint?: string
}

declare global {
  interface Window {
    figma?: {
      captureForDesign?: (options: FigmaCaptureOptions) => Promise<unknown>
    }
  }
}

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

function presetUsesListElement(preset: AppPreset): boolean {
  return preset.pages.some((page) => (
    page.elements.some((element) => element.componentId === 'list')
  ))
}

async function waitForFigmaCaptureTarget(selector: string, signal: AbortSignal): Promise<void> {
  const timeoutAt = Date.now() + 10000
  while (!signal.aborted && Date.now() < timeoutAt) {
    if (window.figma?.captureForDesign && document.querySelector(selector)) return
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

export function App() {
  const search = useUrlSearch()
  const { urlPreset, urlPage, urlFullscreen, urlOpenAttributionSheet, isFigmaCapture } = useMemo(() => {
    const p = new URLSearchParams(search)
    return {
      urlPreset: p.get('preset'),
      urlPage: p.get('page'),
      urlFullscreen: p.get('fullscreen') === 'phone',
      urlOpenAttributionSheet: p.get('attributionSheet') === 'ai',
      isFigmaCapture: p.has('figmaCapture'),
    }
  }, [search])

  const [activePage, setActivePage] = useState<Page>('build')
  const [publishResetKey, setPublishResetKey] = useState(0)
  const [previewMode, setPreviewMode] = useState(false)
  const [activePresetId, setActivePresetId] = useState<string>(urlPreset ?? EMPTY_PRESET_ID)
  const [appUserRoleOptions, setAppUserRoleOptions] = useState<AppRoleOption[]>(DEFAULT_ROLE_OPTIONS)
  const [appUserTableRoleIds, setAppUserTableRoleIds] = useState<string[]>(APP_USER_TABLE_ROLE_IDS)
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false)
  const [searchBarEnabled, setSearchBarEnabledState] = useState(false)
  const [searchableElementCount, setSearchableElementCount] = useState(0)
  const [searchBarAutoEnablePaused, setSearchBarAutoEnablePaused] = useState(false)
  const previousSearchableElementCountRef = useRef(0)
  const previousUrlPresetRef = useRef(urlPreset)
  const [pushNotificationHistoryItems, setPushNotificationHistoryItems] = useState<PushNotificationHistoryItem[]>([])
  const [readPushNotificationDeliveryIds, setReadPushNotificationDeliveryIds] = useState<Set<string>>(() => new Set())
  const preset = useMemo(() => getPresetById(activePresetId), [activePresetId])
  const showDataTab = useMemo(() => presetUsesListElement(preset), [preset])
  const [deepLinkTargets, setDeepLinkTargets] = useState<DeepLinkTarget[]>(() =>
    createDeepLinkTargetsFromPreset(getPresetById(urlPreset ?? EMPTY_PRESET_ID)),
  )
  // Empty App is a sandbox — never restore from storage.
  const titleForPreset = (id: string) =>
    id === EMPTY_PRESET_ID ? getPresetById(id).appTitle : (loadStoredAppTitle(id) ?? getPresetById(id).appTitle)
  const [appTitle, setAppTitle] = useState(() => titleForPreset(urlPreset ?? EMPTY_PRESET_ID))
  const [appIcon, setAppIcon] = useState<AppIconState>(() => defaultAppIcon(urlPreset ?? EMPTY_PRESET_ID))

  const resetSearchBarAutomation = useCallback(() => {
    previousSearchableElementCountRef.current = 0
    setSearchableElementCount(0)
    setSearchBarAutoEnablePaused(false)
    setSearchBarEnabledState(false)
  }, [])

  const handleSearchBarEnabledChange = useCallback((enabled: boolean) => {
    setSearchBarEnabledState(enabled)
    setSearchBarAutoEnablePaused(!enabled && searchableElementCount >= SEARCH_BAR_AUTO_ENABLE_THRESHOLD)
  }, [searchableElementCount])

  const handleSearchableElementCountChange = useCallback((count: number) => {
    const previousCount = previousSearchableElementCountRef.current
    previousSearchableElementCountRef.current = count
    setSearchableElementCount(count)

    if (count < SEARCH_BAR_AUTO_ENABLE_THRESHOLD) {
      setSearchBarAutoEnablePaused(false)
      return
    }

    if (!searchBarAutoEnablePaused && previousCount < SEARCH_BAR_AUTO_ENABLE_THRESHOLD) {
      setSearchBarEnabledState(true)
    }
  }, [searchBarAutoEnablePaused])

  // Sync activePresetId/appTitle whenever the URL preset changes (capture flow
  // opens different presets in the same tab without a full reload).
  useEffect(() => {
    if (!urlPreset) {
      previousUrlPresetRef.current = urlPreset
      return
    }
    const presetChanged = previousUrlPresetRef.current !== urlPreset
    previousUrlPresetRef.current = urlPreset
    setActivePresetId((prev) => (prev === urlPreset ? prev : urlPreset))
    setAppTitle(titleForPreset(urlPreset))
    setAppIcon(defaultAppIcon(urlPreset))
    setDeepLinkTargets(createDeepLinkTargetsFromPreset(getPresetById(urlPreset)))
    if (presetChanged) resetSearchBarAutomation()
    // titleForPreset is stable enough here; intentionally omitted from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSearchBarAutomation, urlPreset])

  useEffect(() => {
    if (urlFullscreen) {
      document.body.classList.add('builder--phone-only')
      return () => { document.body.classList.remove('builder--phone-only') }
    }
  }, [urlFullscreen])

  useEffect(() => {
    const params = new URLSearchParams(search)
    const captureMode = params.get('figmaCapture')
    if (!captureMode) return

    const selector = params.get('figmaSelector') ?? '.live-preview__phone'
    const delayMs = Number.parseInt(params.get('figmaDelay') ?? '1000', 10)
    const controller = new AbortController()

    const runCapture = async () => {
      await waitForFigmaCaptureTarget(selector, controller.signal)
      if (controller.signal.aborted || !window.figma?.captureForDesign) return

      const options: FigmaCaptureOptions = {
        selector,
        delayMs: Number.isFinite(delayMs) ? delayMs : 1000,
        verbose: params.get('figmaVerbose') === '1',
      }

      if (captureMode === 'file') {
        const captureId = params.get('figmaCaptureId')
        const endpoint = params.get('figmaEndpoint')
        if (!captureId || !endpoint) {
          console.warn('[Figma Capture] file mode requires figmaCaptureId and figmaEndpoint params.')
          return
        }
        options.captureId = captureId
        options.endpoint = endpoint
      }

      await window.figma.captureForDesign(options)
    }

    void runCapture().catch((error) => {
      console.error('[Figma Capture] Auto capture failed:', error)
    })

    return () => { controller.abort() }
  }, [search])

  const handlePresetChange = async (id: string) => {
    // Pull the shared remote state for this preset and seed the cache before mounting,
    // so the picker shows whatever anyone last saved (not just local edits).
    if (id !== EMPTY_PRESET_ID) {
      const doc = await loadRemoteApp(id)
      if (doc) {
        saveSnapshot(id, doc.snapshot as PresetSnapshot)
        applyRemoteTheme(doc)
      }
    }
    setActivePresetId(id)
    setAppTitle(titleForPreset(id))
    setAppIcon(defaultAppIcon(id))
    setDeepLinkTargets(createDeepLinkTargetsFromPreset(getPresetById(id)))
    resetSearchBarAutomation()
  }

  const handlePageChange = (page: Page) => {
    if (page === 'publish') {
      setPublishResetKey((prev) => prev + 1)
    }
    setActivePage(page)
  }

  const addPushNotificationHistoryItem = (item: PushNotificationHistoryItem) => {
    setPushNotificationHistoryItems((currentItems) => [item, ...currentItems])
  }

  const getPushNotificationDeliveryId = (notificationId: string, roleId: string) => `${notificationId}:${roleId}`

  const livePreviewPushNotifications = useMemo(() => (
    pushNotificationHistoryItems
      .filter((item) => item.status === 'sent')
      .map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        image: item.image ?? null,
        audience: item.audience && item.audience.length > 0 ? item.audience : [ALL_USERS_AUDIENCE_ID],
        deepLink: item.deepLink,
        sentAtLabel: item.scheduledAtLabel,
        readByRoleIds: appUserRoleOptions
          .filter((role) => readPushNotificationDeliveryIds.has(getPushNotificationDeliveryId(item.id, role.id)))
          .map((role) => role.id),
      }))
  ), [appUserRoleOptions, pushNotificationHistoryItems, readPushNotificationDeliveryIds])

  const markPushNotificationRead = (itemId: string, roleId: string) => {
    const deliveryId = getPushNotificationDeliveryId(itemId, roleId)
    setReadPushNotificationDeliveryIds((currentIds) => {
      if (currentIds.has(deliveryId)) return currentIds
      const nextIds = new Set(currentIds)
      nextIds.add(deliveryId)
      return nextIds
    })
  }

  const updatePushNotificationHistoryItem = (updatedItem: PushNotificationHistoryItem) => {
    setPushNotificationHistoryItems((currentItems) => (
      currentItems.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    ))
  }

  const deletePushNotificationHistoryItem = (itemId: string) => {
    setPushNotificationHistoryItems((currentItems) => (
      currentItems.filter((item) => item.id !== itemId)
    ))
    setReadPushNotificationDeliveryIds((currentIds) => {
      const nextIds = new Set(Array.from(currentIds).filter((deliveryId) => !deliveryId.startsWith(`${itemId}:`)))
      return nextIds.size === currentIds.size ? currentIds : nextIds
    })
  }

  const appUserTableRoleOptions = useMemo(() => {
    const roleById = new Map(appUserRoleOptions.map((role) => [role.id, role]))
    const roles = appUserTableRoleIds
      .map((roleId) => roleById.get(roleId))
      .filter((role): role is AppRoleOption => Boolean(role))

    return roles.length > 0 ? roles : appUserRoleOptions
  }, [appUserTableRoleIds, appUserRoleOptions])

  const buildInitialPageId = urlFullscreen || isFigmaCapture ? (urlPage ?? undefined) : undefined

  return (
    <IconLibraryProvider>
    <div className="builder">
      <TopBar
        activePage={activePage}
        onPageChange={handlePageChange}
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
        showDataTab={showDataTab}
      />
      <div className="builder__content">
        {activePage === 'build' && (
          <BuildPage
            // Bumping the key on URL preset/page changes forces a remount so
            // BuildPage re-derives its initial state from the new URL params.
            key={`${activePresetId}:${buildInitialPageId ?? 'home'}`}
            preset={preset}
            appTitle={appTitle}
            onAppTitleChange={setAppTitle}
            appIcon={appIcon}
            initialPageId={buildInitialPageId}
            chromeless={urlFullscreen || isFigmaCapture}
            openAttributionSheet={urlOpenAttributionSheet}
            previewMode={previewMode}
            onPreviewClose={() => setPreviewMode(false)}
            onDeepLinkTargetsChange={setDeepLinkTargets}
            onSearchableElementCountChange={handleSearchableElementCountChange}
            pushNotificationsEnabled={pushNotificationsEnabled}
            searchBarEnabled={searchBarEnabled}
            pushNotifications={livePreviewPushNotifications}
            onPushNotificationRead={markPushNotificationRead}
            appUserRoles={appUserTableRoleOptions}
          />
        )}
        {activePage === 'settings' && (
          <SettingsPage
            appTitle={appTitle}
            onAppTitleChange={setAppTitle}
            appIcon={appIcon}
            onAppIconChange={setAppIcon}
            appUserRoles={appUserTableRoleOptions}
            deepLinkTargets={deepLinkTargets}
            pushNotificationsEnabled={pushNotificationsEnabled}
            setPushNotificationsEnabled={setPushNotificationsEnabled}
            searchBarEnabled={searchBarEnabled}
            setSearchBarEnabled={handleSearchBarEnabledChange}
            pushNotificationHistoryItems={pushNotificationHistoryItems}
            onPushNotificationHistoryItemCreate={addPushNotificationHistoryItem}
            onPushNotificationHistoryItemUpdate={updatePushNotificationHistoryItem}
            onPushNotificationHistoryItemDelete={deletePushNotificationHistoryItem}
            pushComposerFieldValues={{ 'user-name': APP_USER_NAME_FIELD_VALUE }}
          />
        )}
        {activePage === 'publish' && (
          <PublishPage
            key={publishResetKey}
            roleOptions={appUserRoleOptions}
            setRoleOptions={setAppUserRoleOptions}
            onAppUserTableRoleIdsChange={setAppUserTableRoleIds}
          />
        )}
      </div>
    </div>
    </IconLibraryProvider>
  )
}
