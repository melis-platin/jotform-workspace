import { useState, useRef, useEffect, Fragment } from 'react'
import { createPortal } from 'react-dom'
import {
  Icon,
  Toggle as DSToggle,
  FormField as DSFormField,
  Tabs as DSTabs,
  Segmented as DSSegmented,
} from '@jf/design-system'
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
// 'top' = full-browser-width bar; 'compact' = app-page-width (760px) floating
// bar with centre-aligned menu; 'left' = sidebar.
// 'top' = full-bleed bar, full-width content; 'contained' = full-bleed bar but
// content capped to the page width (760px); 'compact' = app-page-width floating
// bar with a centred menu; 'left' = sidebar.
export type DesktopNavVariant = 'top' | 'contained' | 'compact' | 'left'

// Bottom nav shows this many tabs before the rest collapse into the "More" menu —
// must match the live bottom-nav overflow in BuildPage (slice(0, 4) / length >= 5).
const BOTTOM_NAV_MAX_TABS = 4

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
  enabled: boolean
  displayStyle: NavDisplayStyle
  topNavEnabled: boolean
  /** Mobile only: the top nav bar has no background and overlays the first-page hero. */
  topNavTransparent: boolean
  desktopVariant: DesktopNavVariant
  desktopEnabled: boolean
  desktopDisplayStyle: DesktopDisplayStyle
  desktopAlignment: NavAlignment
  /** Top-variant only: whether the desktop top nav bar stays pinned on scroll. */
  desktopSticky: boolean
  onChangeDesktopVariant: (variant: DesktopNavVariant) => void
  onToggleEnabled: (enabled: boolean) => void
  onChangeDisplayStyle: (style: NavDisplayStyle) => void
  onToggleTopNavEnabled: (enabled: boolean) => void
  onToggleTopNavTransparent: (transparent: boolean) => void
  onToggleDesktopEnabled: (enabled: boolean) => void
  onChangeDesktopDisplayStyle: (style: DesktopDisplayStyle) => void
  onChangeDesktopAlignment: (align: NavAlignment) => void
  onToggleDesktopSticky: (sticky: boolean) => void
  /** Receives the full pages array reordered (hidden pages keep their positions). */
  onReorder: (pages: NavMenuPage[]) => void
  onChangeIcon: (pageId: string, icon: string) => void
  /** Remove a page from the nav (hides it — the page stays editable in the canvas). */
  onRemoveFromNav: (pageId: string) => void
  /** Add a hidden page back into the nav (un-hides it). */
  onAddToNav: (pageId: string) => void
  onClose: () => void
  /** Active tab — Desktop / Mobile. Controlled so the builder canvas preview can
   *  mirror the platform. */
  tab: 'mobile' | 'desktop'
  onTabChange: (tab: 'mobile' | 'desktop') => void
}

// A single draggable nav item: drag handle + a FieldMapper-style card (FieldChip
// page token + divider + remove), matching the list-properties field rows.
function NavMenuItem({
  page,
  onChangeIcon,
  onRemove,
  canRemove,
}: {
  page: NavMenuPage
  onChangeIcon: (icon: string) => void
  onRemove: () => void
  /** False when removing would drop the nav below its 2-item minimum. */
  canRemove: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
  })
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const [iconPickerPos, setIconPickerPos] = useState({ top: 0, left: 0 })
  const [iconPickerWidth, setIconPickerWidth] = useState<number | undefined>(undefined)
  const cardRef = useRef<HTMLDivElement>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  const iconName = page.icon || DEFAULT_PAGE_ICON

  return (
    <div ref={setNodeRef} style={style} className="nav-menu-item">
      <div className="nav-menu-item__card" ref={cardRef}>
        <span className="nav-menu-item__drag" {...attributes} {...listeners}>
          <Icon name="grid-dots-vertical" category="general" size={18} />
        </span>
        <div className="nav-menu-item__chip-slot">
          <button
            type="button"
            className="nav-menu-item__icon"
            aria-label="Change icon"
            onClick={() => {
              if (cardRef.current) {
                const rect = cardRef.current.getBoundingClientRect()
                setIconPickerPos({ top: rect.bottom + 4, left: rect.left })
                setIconPickerWidth(rect.width)
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
          disabled={!canRemove}
          aria-label={`Remove ${page.name} from navigation`}
          title={canRemove ? undefined : 'Navigation needs at least 2 items'}
        >
          <Icon name="xmark" size={16} />
        </button>
      </div>
      {iconPickerOpen && (
        <IconPickerPopover
          value={iconName}
          anchorPos={iconPickerPos}
          width={iconPickerWidth}
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
  enabled,
  displayStyle,
  topNavEnabled,
  topNavTransparent,
  desktopVariant,
  desktopEnabled,
  desktopDisplayStyle,
  desktopAlignment,
  desktopSticky,
  onChangeDesktopVariant,
  onToggleEnabled,
  onChangeDisplayStyle,
  onToggleTopNavEnabled,
  onToggleTopNavTransparent,
  onToggleDesktopEnabled,
  onChangeDesktopDisplayStyle,
  onChangeDesktopAlignment,
  onToggleDesktopSticky,
  onReorder,
  onChangeIcon,
  onRemoveFromNav,
  onAddToNav,
  onClose,
  tab,
  onTabChange,
}: NavigationMenuPanelProps) {
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
          onChange={(v) => onTabChange(v as 'mobile' | 'desktop')}
          items={[
            { value: 'desktop', label: 'Desktop' },
            { value: 'mobile', label: 'Mobile' },
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
                        {navPages.map((page, i) => (
                          <Fragment key={page.id}>
                            {/* "More" threshold — pages past the bottom-bar limit fall
                                into the overflow "More" menu (matches the live bottom nav). */}
                            {navPages.length > BOTTOM_NAV_MAX_TABS && i === BOTTOM_NAV_MAX_TABS && (
                              <div className="nav-menu-divider" aria-hidden="true">
                                <span>More menu</span>
                              </div>
                            )}
                            <NavMenuItem
                              page={page}
                              onChangeIcon={(icon) => onChangeIcon(page.id, icon)}
                              onRemove={() => onRemoveFromNav(page.id)}
                              canRemove={navPages.length > 2}
                            />
                          </Fragment>
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
            <div className="property-panel__field property-panel__field--inline">
              <DSFormField
                title="Transparent"
                size="md"
                showDescription={false}
                showHelpText={false}
              >
                <DSToggle
                  size="md"
                  checked={topNavTransparent}
                  onChange={(e) => onToggleTopNavTransparent(e.target.checked)}
                />
              </DSFormField>
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
                <DSFormField title="Layout" size="md" showDescription={false} showHelpText={false}>
                  <DSSegmented
                    accent="apps"
                    variant="text"
                    value={desktopVariant}
                    onChange={(value) => onChangeDesktopVariant(value as DesktopNavVariant)}
                    items={[
                      { value: 'top', label: 'Fullwidth' },
                      { value: 'contained', label: 'Contained' },
                      { value: 'compact', label: 'Compact' },
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

              {desktopVariant !== 'left' && (
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

              {desktopVariant !== 'left' && (
                <div className="property-panel__field property-panel__field--inline">
                  <DSFormField title="Sticky Navigation" size="md" showDescription={false} showHelpText={false}>
                    <DSToggle
                      size="md"
                      checked={desktopSticky}
                      onChange={(e) => onToggleDesktopSticky(e.target.checked)}
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
