import { Icon, useDropdown, DropdownMenuShell } from '@jf/design-system'
import jotformLogo from '@jf/design-system/src/assets/jotform-logo.svg'
import jotformLogomark from '@jf/design-system/src/assets/jotform-logomark.svg'

type Page = 'build' | 'settings' | 'publish'

interface PresetOption {
  id: string
  name: string
}

interface TopBarProps {
  activePage: Page
  onPageChange: (page: Page) => void
  appName?: string
  onAppNameChange?: (name: string) => void
  previewMode: boolean
  onPreviewToggle: () => void
  presets: PresetOption[]
  activePresetId: string
  onPresetChange: (id: string) => void
}

const PAGES: { id: Page; label: string }[] = [
  { id: 'build', label: 'BUILD' },
  { id: 'settings', label: 'SETTINGS' },
  { id: 'publish', label: 'PUBLISH' },
]

export function TopBar({
  activePage,
  onPageChange,
  appName = 'App',
  onAppNameChange,
  previewMode,
  onPreviewToggle,
  presets,
  activePresetId,
  onPresetChange,
}: TopBarProps) {
  const {
    open,
    setOpen,
    activeIndex,
    rootRef,
    triggerRef,
    menuRef,
    toggle,
    handleTriggerKey,
    handleMenuKey,
    placement,
    isMobileSheet,
  } = useDropdown({
    optionCount: presets.length,
    onSelect: (i) => onPresetChange(presets[i].id),
    menuPlacement: 'bottom',
  })

  return (
    <header className="topbar">
      <div className="topbar__main">
        <div className="topbar__left">
          <img src={jotformLogo} alt="Jotform" className="topbar__logo topbar__logo--full" />
          <img src={jotformLogomark} alt="Jotform" className="topbar__logo topbar__logo--mark" />
          <div className="topbar__divider" />
          <div className="topbar__product-label">
            <span className="topbar__product-label-text">App Builder</span>
            <button className="topbar__chevron-btn">
              <Icon name="chevron-down" category="arrows" size={12} />
            </button>
          </div>
        </div>

        <div className="topbar__middle">
          <div className="topbar__app-title">
            <span
              className="topbar__app-title-text"
              contentEditable={onAppNameChange ? true : undefined}
              suppressContentEditableWarning
              spellCheck={false}
              onBlur={onAppNameChange ? (e) => {
                const next = (e.currentTarget.textContent || '').trim()
                if (next && next !== appName) onAppNameChange(next)
                else e.currentTarget.textContent = appName
              } : undefined}
              onKeyDown={onAppNameChange ? (e) => {
                if (e.key === 'Enter') { e.preventDefault(); (e.currentTarget as HTMLElement).blur() }
              } : undefined}
            >{appName}</span>
            <div className="topbar__preset-dropdown" ref={rootRef}>
              <button
                ref={triggerRef}
                type="button"
                className="topbar__chevron-btn"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={toggle}
                onKeyDown={handleTriggerKey}
              >
                <Icon name="chevron-down" category="arrows" size={12} />
              </button>
              {open && (
                <DropdownMenuShell
                  placement={placement}
                  isSheet={isMobileSheet}
                  title="Switch app"
                  menuRef={menuRef}
                  triggerRef={triggerRef}
                  onClose={() => setOpen(false)}
                  onKeyDown={handleMenuKey}
                  className="topbar__preset-menu"
                  usePortal
                  portalAlign="center"
                >
                  {presets.map((p, i) => {
                    const isSelected = p.id === activePresetId
                    const isActive = i === activeIndex
                    const itemClass = [
                      'jf-dropdown__item',
                      isSelected && 'jf-dropdown__item--selected',
                      isActive && 'jf-dropdown__item--active',
                    ]
                      .filter(Boolean)
                      .join(' ')
                    return (
                      <div
                        key={p.id}
                        className={itemClass}
                        role="option"
                        aria-selected={isSelected}
                        data-dd-index={i}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          onPresetChange(p.id)
                          setOpen(false)
                        }}
                      >
                        <span className="jf-dropdown__item-label">{p.name}</span>
                      </div>
                    )
                  })}
                </DropdownMenuShell>
              )}
            </div>
          </div>
          <span className="topbar__timestamp">Last edited at 12:21 pm.</span>
        </div>

        <div className="topbar__right">
          <button className="topbar__help-btn">
            <Icon name="question-circle-filled" size={16} />
            <span className="topbar__help-text">Help</span>
          </button>
          <div className="topbar__avatar-wrapper">
            <div className="topbar__avatar">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=88&h=88&fit=crop&crop=face" alt="User avatar" width="44" height="44" />
            </div>
          </div>
        </div>
      </div>

      <nav className="topbar__nav">
        <div className="topbar__nav-tabs">
          {PAGES.map((page) => (
            <button
              key={page.id}
              className={`topbar__nav-item ${activePage === page.id ? 'topbar__nav-item--active' : ''}`}
              onClick={() => onPageChange(page.id)}
            >
              {page.label}
            </button>
          ))}
        </div>
        <div className="topbar__nav-right">
          <span className="topbar__preview-label">Preview App</span>
          <button
            className={`topbar__toggle ${previewMode ? 'topbar__toggle--active' : ''}`}
            onClick={onPreviewToggle}
          >
            <span className="topbar__toggle-track" />
            <span className="topbar__toggle-thumb" />
          </button>
        </div>
      </nav>
    </header>
  )
}
