import { useEffect, useRef, useState } from 'react'
import { Icon } from '@jf/design-system'
import { LucideIcon } from './IconPicker'
import { DEFAULT_PAGE_ICON } from './PageNavigationBar'
import { getRoleColorStyle, type AppRoleOption } from '../state/appUserRoles'

export interface CanvasPageLabelPage {
  id: string
  name: string
  icon?: string
  hidden?: boolean
  requireLogin?: boolean
  showIcon?: boolean
  conditions?: Array<{ id: string }>
}

interface CanvasPageLabelProps {
  page: CanvasPageLabelPage
  active: boolean
  /** Overlay the label on top of the page (used for the first page so its card keeps tucking under the header). */
  floating?: boolean
  /** When floating over the app header, sync the label color with the header's text color. */
  overlayColor?: string
  /** Available app-user roles, used to describe the page's access condition. */
  roleOptions: AppRoleOption[]
  onRename: (name: string) => void
  onOpenSettings: () => void
}

export function PageConditionSummary({
  conditions,
  roleOptions,
}: {
  conditions?: Array<{ id: string }>
  roleOptions: AppRoleOption[]
}) {
  const [showConditionsPopover, setShowConditionsPopover] = useState(false)
  const selectedRoleIds = conditions
    ?.filter((condition) => condition.id.startsWith('role:'))
    .map((condition) => condition.id.slice('role:'.length)) ?? []
  const selectedRoles = selectedRoleIds
    .map((roleId) => roleOptions.find((role) => role.id === roleId))
    .filter((role): role is AppRoleOption => Boolean(role))
  // Keep saved pages from before role ids were persisted understandable: their
  // role-based access condition used the first available role by default.
  const conditionRoles = selectedRoles.length > 0 ? selectedRoles : roleOptions.slice(0, 1)
  const conditionRoleRows = Array.from(
    { length: Math.ceil(conditionRoles.length / 3) },
    (_, rowIndex) => conditionRoles.slice(rowIndex * 3, rowIndex * 3 + 3),
  )
  const singleRoleCondition = conditionRoles.length === 1 ? conditionRoles[0] : undefined

  if (!conditions?.length) return null

  return (
    <span
      className={`canvas-page-label__condition-wrapper${singleRoleCondition ? ' canvas-page-label__condition-wrapper--single' : ''}`}
      onMouseLeave={singleRoleCondition ? undefined : () => setShowConditionsPopover(false)}
    >
      <button
        type="button"
        className={`canvas-page-label__condition${singleRoleCondition ? ' canvas-page-label__condition--single' : ''}`}
        aria-label={singleRoleCondition ? `Only ${singleRoleCondition.label}` : 'Page conditions'}
        aria-expanded={singleRoleCondition ? undefined : showConditionsPopover}
        style={singleRoleCondition ? getRoleColorStyle(singleRoleCondition.color) : undefined}
        onClick={(e) => {
          e.stopPropagation()
          if (!singleRoleCondition) setShowConditionsPopover((open) => !open)
        }}
      >
        {singleRoleCondition ? (
          <>
            <Icon name="lock-filled" category="security" size={12} />
            <span>Only {singleRoleCondition.label}</span>
          </>
        ) : (
          <Icon name="conditional-branch-filled" category="general" size={12} />
        )}
      </button>
      {!singleRoleCondition && showConditionsPopover && (
        <div className="canvas-page-label__condition-popover" role="tooltip">
          <div className="canvas-page-label__condition-popover-content">
            <p className="canvas-page-label__condition-popover-title">SHOW PAGE WHEN</p>
            <div className="canvas-page-label__condition-popover-detail">
              <p className="canvas-page-label__condition-popover-description">User Role is:</p>
              {conditionRoleRows.map((roleRow, rowIndex) => (
                <div className="canvas-page-label__condition-role-row" key={rowIndex}>
                  {roleRow.map((role) => (
                    <span
                      className="canvas-page-label__condition-role"
                      key={role.id}
                      style={getRoleColorStyle(role.color)}
                    >
                      {role.label}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </span>
  )
}

export function CanvasPageLabel({ page, active, floating, overlayColor, roleOptions, onRename, onOpenSettings }: CanvasPageLabelProps) {
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
      <PageConditionSummary conditions={page.conditions} roleOptions={roleOptions} />
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
