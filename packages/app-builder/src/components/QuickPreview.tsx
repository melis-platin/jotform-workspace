import { type ReactNode } from 'react'
import { Icon } from '@jf/design-system'

interface QuickPreviewProps {
  children?: ReactNode
  onClose?: () => void
  closeLabel?: string
}

export function QuickPreview({ children, onClose, closeLabel = 'Close quick preview' }: QuickPreviewProps) {
  return (
    <aside className="quick-preview">
      <div className="quick-preview__header">
        <p className="quick-preview__title">Quick Preview</p>
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
