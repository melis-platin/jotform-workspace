import { useState, useRef, useEffect, useLayoutEffect, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import {
  Icon,
  Toggle as DSToggle,
  FormField as DSFormField,
  Tabs as DSTabs,
  Segmented as DSSegmented,
} from '@jf/design-system'
import { BottomNavigation, AppIcon } from '@jf/app-elements'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { LucideIcon, IconPickerPopover } from './IconPicker'
import { DEFAULT_PAGE_ICON } from './PageNavigationBar'

export type NavDisplayStyle = 'iconText' | 'icon'
export type DesktopDisplayStyle = 'iconText' | 'text'
export type NavAlignment = 'left' | 'center' | 'right'
export type DesktopNavVariant = 'top' | 'left'

// A slice of the live-preview phone mockup, reused inside the (dark) panel. The
// panel's `data-theme="dark"` would bleed chrome tokens into the app-scope, so we
// copy the app's resolved theme tokens from <html> onto the mockup root — the
// same accent + light/dark surfaces the real live preview shows.
const PREVIEW_THEME_TOKENS = [
  '--bg-surface', '--bg-surface-hover', '--bg-page', '--bg-fill-brand', '--bg-fill-brand-hover',
  '--border', '--fg-primary', '--fg-secondary', '--fg-tertiary', '--fg-inverse',
  '--fg-brand', '--fg-brand-hover', '--font-family', '--font-family-heading', '--gray-900',
  // Primitives the semantics derive from — backstop if a semantic resolves to a var().
  '--neutral-0', '--neutral-50', '--neutral-100', '--neutral-200', '--neutral-300',
  '--neutral-400', '--neutral-500', '--neutral-600', '--neutral-700', '--neutral-800',
  '--neutral-900', '--neutral-950',
  '--primary-50', '--primary-100', '--primary-200', '--primary-300', '--primary-400',
  '--primary-500', '--primary-600', '--primary-700', '--primary-800', '--primary-900',
  '--primary-950',
]

// Copy the app's resolved theme tokens from <html> onto an in-panel preview root
// so it reflects the live accent + light/dark surfaces despite the dark chrome.
function useCopiedThemeTokens<T extends HTMLElement>(ref: RefObject<T | null>) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const cs = getComputedStyle(document.documentElement)
    PREVIEW_THEME_TOKENS.forEach((token) => {
      const value = cs.getPropertyValue(token).trim()
      if (value) el.style.setProperty(token, value)
    })
  }, [ref])
}

// Mobile top-nav mockup: the same flat card chrome as the other previews, with
// the app branding (icon + name) on the left and a hamburger menu on the right,
// a divider, then the placeholder content. Shares the fixed-height card so it
// stays consistent with the bottom-nav preview.
function MobileTopPreview({ appName, appIcon }: { appName: string; appIcon: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useCopiedThemeTokens(ref)
  return (
    <div className="nav-menu-desktop nav-menu-mobile" ref={ref}>
      <div className="nav-menu-desktop__screen app-scope">
        <div className="nav-menu-mobile__top-bar">
          <span className="nav-menu-mobile__brand">
            <span className="nav-menu-mobile__app-icon">
              <AppIcon name={appIcon} size={24} />
            </span>
            <span className="nav-menu-mobile__top-title">{appName}</span>
          </span>
          <span className="nav-menu-mobile__top-menu">
            <AppIcon name="Menu" size={20} />
          </span>
        </div>
        <div className="nav-menu-desktop__divider" />
        <div className="nav-menu-desktop__content">
          <span className="nav-menu-desktop__placeholder" />
          <span className="nav-menu-desktop__base" />
        </div>
      </div>
    </div>
  )
}

// Desktop nav mockup: a laptop window with either a top nav bar ('top') or a
// left sidebar ('left'), themed via the copied tokens. The nav items render per
// the chosen display style; alignment applies to the top variant only.
function DesktopPreview({
  pages,
  variant,
  displayStyle,
  alignment,
}: {
  pages: NavMenuPage[]
  variant: DesktopNavVariant
  displayStyle: DesktopDisplayStyle
  alignment: NavAlignment
}) {
  const ref = useRef<HTMLDivElement>(null)
  useCopiedThemeTokens(ref)
  const navPages = pages.filter((p) => !p.hidden)
  const shown = navPages.slice(0, variant === 'left' ? 4 : 2)
  const hasOverflow = navPages.length > shown.length

  const navItems = (
    <>
      {shown.map((p) => (
        <span key={p.id} className="nav-menu-desktop__nav-item">
          {displayStyle === 'iconText' && (
            <span className="nav-menu-desktop__nav-icon">
              <LucideIcon name={p.icon || DEFAULT_PAGE_ICON} size={16} />
            </span>
          )}
          <span className="nav-menu-desktop__nav-label">{p.name}</span>
        </span>
      ))}
      {hasOverflow && (
        <span className="nav-menu-desktop__nav-more">
          <LucideIcon name="Ellipsis" size={16} />
        </span>
      )}
    </>
  )

  return (
    <div className={`nav-menu-desktop nav-menu-desktop--${variant}`} ref={ref}>
      <div className="nav-menu-desktop__screen app-scope">
        {variant === 'top' ? (
          <>
            <div className={`nav-menu-desktop__nav nav-menu-desktop__nav--${alignment}`}>{navItems}</div>
            <div className="nav-menu-desktop__divider" />
            <div className="nav-menu-desktop__content">
              <span className="nav-menu-desktop__placeholder" />
              <span className="nav-menu-desktop__base" />
            </div>
          </>
        ) : (
          <div className="nav-menu-desktop__body">
            <div className="nav-menu-desktop__sidebar">{navItems}</div>
            <div className="nav-menu-desktop__content nav-menu-desktop__content--left">
              <span className="nav-menu-desktop__placeholder" />
              <span className="nav-menu-desktop__base" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Mobile nav mockup: reuses the same flat card chrome as DesktopPreview
// (peach card → white screen → placeholder content) and pins the real themed
// BottomNavigation under it, so the selected/default item styles come straight
// from the app theme. Its own border-top serves as the separator.
function MobilePreview({
  pages,
  displayStyle,
}: {
  pages: NavMenuPage[]
  displayStyle: NavDisplayStyle
}) {
  const ref = useRef<HTMLDivElement>(null)
  useCopiedThemeTokens(ref)
  const navPages = pages.filter((p) => !p.hidden)
  // Mirror the live bottom nav: first 4 items, plus a "More" item at 5+.
  const previewItems =
    navPages.length >= 5
      ? [
          ...navPages.slice(0, 4).map((p) => ({ icon: p.icon || DEFAULT_PAGE_ICON, label: p.name })),
          { icon: 'Ellipsis', label: 'More' },
        ]
      : navPages.map((p) => ({ icon: p.icon || DEFAULT_PAGE_ICON, label: p.name }))

  return (
    <div className="nav-menu-desktop nav-menu-mobile" ref={ref}>
      <div className="nav-menu-desktop__screen app-scope">
        <div className="nav-menu-desktop__content">
          <span className="nav-menu-desktop__placeholder" />
          <span className="nav-menu-desktop__base" />
        </div>
        <BottomNavigation
          items={previewItems}
          activeIndex={0}
          showLabels={displayStyle !== 'icon'}
        />
      </div>
    </div>
  )
}

export interface NavMenuPage {
  id: string
  name: string
  icon?: string
  /** Excluded from the navigation menu when true. */
  hidden?: boolean
}

interface NavigationMenuPanelProps {
  /** Full ordered page list — the panel lists the non-hidden ones as nav items. */
  pages: NavMenuPage[]
  /** App branding shown in the top-nav preview. */
  appName: string
  appIcon: string
  enabled: boolean
  displayStyle: NavDisplayStyle
  topNavEnabled: boolean
  desktopVariant: DesktopNavVariant
  desktopEnabled: boolean
  desktopDisplayStyle: DesktopDisplayStyle
  desktopAlignment: NavAlignment
  onChangeDesktopVariant: (variant: DesktopNavVariant) => void
  onToggleEnabled: (enabled: boolean) => void
  onChangeDisplayStyle: (style: NavDisplayStyle) => void
  onToggleTopNavEnabled: (enabled: boolean) => void
  onToggleDesktopEnabled: (enabled: boolean) => void
  onChangeDesktopDisplayStyle: (style: DesktopDisplayStyle) => void
  onChangeDesktopAlignment: (align: NavAlignment) => void
  /** Receives the full pages array reordered (hidden pages keep their positions). */
  onReorder: (pages: NavMenuPage[]) => void
  onChangeIcon: (pageId: string, icon: string) => void
  /** Remove a page from the nav (hides it — the page stays editable in the canvas). */
  onRemoveFromNav: (pageId: string) => void
  /** Add a hidden page back into the nav (un-hides it). */
  onAddToNav: (pageId: string) => void
  onClose: () => void
}

// A single draggable nav item: drag handle + a FieldMapper-style card (FieldChip
// page token + divider + remove), matching the list-properties field rows.
function NavMenuItem({
  page,
  onChangeIcon,
  onRemove,
}: {
  page: NavMenuPage
  onChangeIcon: (icon: string) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
  })
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const [iconPickerPos, setIconPickerPos] = useState({ top: 0, left: 0 })
  const chipRef = useRef<HTMLDivElement>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  const iconName = page.icon || DEFAULT_PAGE_ICON

  return (
    <div ref={setNodeRef} style={style} className="nav-menu-item">
      <div className="nav-menu-item__card">
        <span className="nav-menu-item__drag" {...attributes} {...listeners}>
          <Icon name="grid-dots-vertical" category="general" size={18} />
        </span>
        <div className="nav-menu-item__chip-slot" ref={chipRef}>
          <button
            type="button"
            className="nav-menu-item__icon"
            aria-label="Change icon"
            onClick={() => {
              if (chipRef.current) {
                const rect = chipRef.current.getBoundingClientRect()
                setIconPickerPos({ top: rect.bottom + 4, left: rect.left })
              }
              setIconPickerOpen(true)
            }}
          >
            <LucideIcon name={iconName} size={16} />
          </button>
          <span className="nav-menu-item__label">{page.name}</span>
        </div>
        <button
          type="button"
          className="nav-menu-item__remove"
          onClick={onRemove}
          aria-label={`Remove ${page.name} from navigation`}
        >
          <Icon name="xmark" size={16} />
        </button>
      </div>
      {iconPickerOpen && (
        <IconPickerPopover
          value={iconName}
          anchorPos={iconPickerPos}
          placement="bottom-left"
          onSelect={(icon) => {
            onChangeIcon(icon)
            setIconPickerOpen(false)
          }}
          onClose={() => setIconPickerOpen(false)}
        />
      )}
    </div>
  )
}

export function NavigationMenuPanel({
  pages,
  appName,
  appIcon,
  enabled,
  displayStyle,
  topNavEnabled,
  desktopVariant,
  desktopEnabled,
  desktopDisplayStyle,
  desktopAlignment,
  onChangeDesktopVariant,
  onToggleEnabled,
  onChangeDisplayStyle,
  onToggleTopNavEnabled,
  onToggleDesktopEnabled,
  onChangeDesktopDisplayStyle,
  onChangeDesktopAlignment,
  onReorder,
  onChangeIcon,
  onRemoveFromNav,
  onAddToNav,
  onClose,
}: NavigationMenuPanelProps) {
  const [tab, setTab] = useState('mobile')
  const [addOpen, setAddOpen] = useState(false)
  const [addAnchor, setAddAnchor] = useState<DOMRect | null>(null)
  const addTriggerRef = useRef<HTMLButtonElement>(null)
  const addMenuRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // Pages currently shown in the navigation menu (in app order).
  const navPages = pages.filter((p) => !p.hidden)
  // Pages removed from the nav — offered in the "Select Page" dropdown.
  const hiddenPages = pages.filter((p) => p.hidden)

  // Close the Select Page dropdown on outside click (trigger + menu excluded).
  useEffect(() => {
    if (!addOpen) return
    const handle = (e: MouseEvent) => {
      const t = e.target as Node
      if (addMenuRef.current?.contains(t) || addTriggerRef.current?.contains(t)) return
      setAddOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [addOpen])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    // Reorder against the full pages array so hidden pages keep their positions.
    const oldIndex = pages.findIndex((p) => p.id === active.id)
    const newIndex = pages.findIndex((p) => p.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(arrayMove(pages, oldIndex, newIndex))
    }
  }

  return (
    <div className="build-page__properties" data-theme="dark">
      <div className="property-panel__header">
        <span className="property-panel__title">Navigation Properties</span>
        <div className="property-panel__header-actions">
          <button className="property-panel__close" onClick={onClose} aria-label="Close">
            <Icon name="xmark" size={20} />
          </button>
        </div>
      </div>

      <div className="property-panel__tabs">
        <DSTabs
          accent="apps"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'mobile', label: 'Mobile' },
            { value: 'desktop', label: 'Desktop' },
          ]}
        />
      </div>

      {tab === 'mobile' && (
        <div className="property-panel__body">
          <div className="property-panel__field property-panel__field--inline">
            <DSFormField
              title="Bottom Navigation"
              size="md"
              showDescription={false}
              showHelpText={false}
            >
              <DSToggle
                size="md"
                checked={enabled}
                onChange={(e) => onToggleEnabled(e.target.checked)}
              />
            </DSFormField>
          </div>

          {enabled && (
            <>
              {navPages.length > 0 && (
                <div className="property-panel__field">
                  <MobilePreview pages={pages} displayStyle={displayStyle} />
                </div>
              )}

              <div className="property-panel__field">
                <DSFormField title="Display Style" size="md" showDescription={false} showHelpText={false}>
                  <DSSegmented
                    accent="apps"
                    variant="text"
                    value={displayStyle}
                    onChange={(value) => onChangeDisplayStyle(value as NavDisplayStyle)}
                    items={[
                      { value: 'iconText', label: 'Icon & Text' },
                      { value: 'icon', label: 'Icon Only' },
                    ]}
                  />
                </DSFormField>
              </div>

              <div className="property-panel__field">
                <DSFormField title="Menu Items" size="md" showDescription={false} showHelpText={false}>
                  <DndContext
                    id="nav-menu-dnd"
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={navPages.map((p) => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="nav-menu-list">
                        {navPages.map((page) => (
                          <NavMenuItem
                            key={page.id}
                            page={page}
                            onChangeIcon={(icon) => onChangeIcon(page.id, icon)}
                            onRemove={() => onRemoveFromNav(page.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {hiddenPages.length > 0 && (
                    <button
                      type="button"
                      ref={addTriggerRef}
                      className="nav-menu-add"
                      onClick={() => {
                        if (!addOpen && addTriggerRef.current) {
                          setAddAnchor(addTriggerRef.current.getBoundingClientRect())
                        }
                        setAddOpen((v) => !v)
                      }}
                    >
                      <span className="nav-menu-add__icon">
                        <Icon name="plus-circle" category="general" size={16} />
                      </span>
                      <span>Select Page</span>
                    </button>
                  )}
                </DSFormField>
              </div>
            </>
          )}

          <div className="property-panel__field property-panel__field--inline">
            <DSFormField
              title="Top Navigation"
              size="md"
              showDescription={false}
              showHelpText={false}
            >
              <DSToggle
                size="md"
                checked={topNavEnabled}
                onChange={(e) => onToggleTopNavEnabled(e.target.checked)}
              />
            </DSFormField>
          </div>

          {topNavEnabled && (
            <div className="property-panel__field">
              <MobileTopPreview appName={appName} appIcon={appIcon} />
            </div>
          )}
        </div>
      )}

      {tab === 'desktop' && (
        <div className="property-panel__body">
          <div className="property-panel__field property-panel__field--inline">
            <DSFormField
              title={desktopVariant === 'left' ? 'Side Navigation' : 'Desktop Navigation'}
              size="md"
              showDescription={false}
              showHelpText={false}
            >
              <DSToggle
                size="md"
                checked={desktopEnabled}
                onChange={(e) => onToggleDesktopEnabled(e.target.checked)}
              />
            </DSFormField>
          </div>

          {desktopEnabled && (
            <>
              <div className="property-panel__field">
                <DesktopPreview
                  pages={pages}
                  variant={desktopVariant}
                  displayStyle={desktopDisplayStyle}
                  alignment={desktopAlignment}
                />
              </div>

              <div className="property-panel__field">
                <DSFormField title="Layout" size="md" showDescription={false} showHelpText={false}>
                  <DSSegmented
                    accent="apps"
                    variant="text"
                    value={desktopVariant}
                    onChange={(value) => onChangeDesktopVariant(value as DesktopNavVariant)}
                    items={[
                      { value: 'top', label: 'Top' },
                      { value: 'left', label: 'Left' },
                    ]}
                  />
                </DSFormField>
              </div>

              <div className="property-panel__field">
                <DSFormField title="Display Style" size="md" showDescription={false} showHelpText={false}>
                  <DSSegmented
                    accent="apps"
                    variant="text"
                    value={desktopDisplayStyle}
                    onChange={(value) => onChangeDesktopDisplayStyle(value as DesktopDisplayStyle)}
                    items={[
                      { value: 'iconText', label: 'Icon & Text' },
                      { value: 'text', label: 'Text Only' },
                    ]}
                  />
                </DSFormField>
              </div>

              {desktopVariant === 'top' && (
                <div className="property-panel__field">
                  <DSFormField title="Alignment" size="md" showDescription={false} showHelpText={false}>
                    <DSSegmented
                      accent="apps"
                      variant="text"
                      value={desktopAlignment}
                      onChange={(value) => onChangeDesktopAlignment(value as NavAlignment)}
                      items={[
                        { value: 'left', label: 'Left' },
                        { value: 'center', label: 'Center' },
                        { value: 'right', label: 'Right' },
                      ]}
                    />
                  </DSFormField>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {addOpen && addAnchor && createPortal(
        <div
          ref={addMenuRef}
          className="nav-menu-add-menu"
          style={{ top: addAnchor.bottom + 4, left: addAnchor.left, width: addAnchor.width }}
        >
          {hiddenPages.map((page) => (
            <button
              key={page.id}
              type="button"
              className="nav-menu-add-menu__item"
              onClick={() => {
                onAddToNav(page.id)
                setAddOpen(false)
              }}
            >
              <span className="nav-menu-add-menu__leading">
                <LucideIcon name={page.icon || DEFAULT_PAGE_ICON} size={20} />
              </span>
              <span className="nav-menu-add-menu__label">{page.name}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
