import { type ReactNode } from 'react'
import { Icon } from '@jf/design-system'

interface QuickPreviewProps {
  children?: ReactNode
  onClose?: () => void
  closeLabel?: string
  mobileCollapsed?: boolean
  onMobileCollapsedChange?: (collapsed: boolean) => void
}

export function QuickPreview({
  children,
  onClose,
  closeLabel = 'Close quick preview',
  mobileCollapsed = false,
  onMobileCollapsedChange,
}: QuickPreviewProps) {
  return (
    <aside className={`quick-preview${mobileCollapsed ? ' quick-preview--mobile-collapsed' : ''}`}>
      <div className="quick-preview__header">
        <p className="quick-preview__title">Quick Preview</p>
        {onMobileCollapsedChange && (
          <button
            type="button"
            className="quick-preview__mobile-toggle"
            aria-expanded={!mobileCollapsed}
            onClick={() => onMobileCollapsedChange(!mobileCollapsed)}
          >
            <span>{mobileCollapsed ? 'Show' : 'Hide'}</span>
            <Icon
              name={mobileCollapsed ? 'chevron-down' : 'chevron-up'}
              category="arrows"
              size={16}
            />
          </button>
        )}
        {onClose && (
          <button
            type="button"
            className="quick-preview__close"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <Icon name="xmark" category="general" size={16} />
          </button>
        )}
      </div>
      <div className="quick-preview__body">{children}</div>
    </aside>
  )
}
