import { useEffect, useRef, useState } from 'react'
import { Icon } from '@jf/design-system'
import { LucideIcon } from './IconPicker'
import { DEFAULT_PAGE_ICON } from './PageNavigationBar'

export interface CanvasPageLabelPage {
  id: string
  name: string
  icon?: string
  hidden?: boolean
  requireLogin?: boolean
  showIcon?: boolean
}

interface CanvasPageLabelProps {
  page: CanvasPageLabelPage
  active: boolean
  /** Overlay the label on top of the page (used for the first page so its card keeps tucking under the header). */
  floating?: boolean
  /** When floating over the app header, sync the label color with the header's text color. */
  overlayColor?: string
  onRename: (name: string) => void
  onOpenSettings: () => void
}

export function CanvasPageLabel({ page, active, floating, overlayColor, onRename, onOpenSettings }: CanvasPageLabelProps) {
  const [editing, setEditing] = useState(false)
  const nameRef = useRef<HTMLSpanElement>(null)
  const iconName = page.icon || DEFAULT_PAGE_ICON

  // Keep the DOM text in sync when the name changes externally (e.g. from the panel).
  useEffect(() => {
    if (!editing && nameRef.current && nameRef.current.textContent !== page.name) {
      nameRef.current.textContent = page.name
    }
  }, [page.name, editing])

  const startEditing = () => {
    setEditing(true)
    requestAnimationFrame(() => {
      if (!nameRef.current) return
      nameRef.current.focus()
      const range = document.createRange()
      range.selectNodeContents(nameRef.current)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    })
  }

  const finishEditing = () => {
    setEditing(false)
    const text = nameRef.current?.textContent?.trim()
    if (text && text !== page.name) {
      onRename(text)
    } else if (nameRef.current) {
      nameRef.current.textContent = page.name
    }
  }

  return (
    <div
      className={`canvas-page-label${active ? ' canvas-page-label--active' : ''}${floating ? ' canvas-page-label--floating' : ''}`}
      style={floating ? { color: overlayColor || 'var(--fg-inverse)' } : undefined}
    >
      {page.showIcon !== false && (
        <span className="canvas-page-label__icon">
          <LucideIcon name={iconName} size={18} />
        </span>
      )}
      <span
        ref={nameRef}
        className="canvas-page-label__name"
        contentEditable={editing}
        suppressContentEditableWarning
        onDoubleClick={startEditing}
        onBlur={finishEditing}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            finishEditing()
          }
          if (e.key === 'Escape') {
            setEditing(false)
            if (nameRef.current) nameRef.current.textContent = page.name
            nameRef.current?.blur()
          }
        }}
      >
        {page.name}
      </span>
      {page.hidden && (
        <span className="canvas-page-label__badge" title="Hidden from navigation">
          <Icon name="eye-slash-filled" category="general" size={14} />
        </span>
      )}
      {page.requireLogin && (
        <span className="canvas-page-label__badge" title="Requires login">
          <Icon name="lock-filled" category="security" size={14} />
        </span>
      )}
      <button
        type="button"
        className="canvas-page-label__gear"
        aria-label="Page settings"
        onClick={(e) => {
          // Stop the click from bubbling to the canvas (which would reset the panel).
          e.stopPropagation()
          onOpenSettings()
        }}
      >
        <Icon name="gear-filled" category="general" size={16} />
      </button>
    </div>
  )
}
