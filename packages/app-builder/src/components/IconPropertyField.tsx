import { useState, useRef } from 'react'
import { Icon } from '@jf/design-system'
import { IconPickerPopover, LucideIcon } from './IconPicker'
import './IconPropertyField.scss'

interface IconPropertyFieldProps {
  value: string
  onChange: (value: string) => void
  /** Show a clear (×) button that resets the field to 'none'. */
  clearable?: boolean
}

export function IconPropertyField({ value, onChange, clearable = false }: IconPropertyFieldProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [width, setWidth] = useState<number | undefined>()
  const triggerRef = useRef<HTMLButtonElement>(null)

  // 'none' (and empty) mean "no icon" — show the placeholder, not a broken glyph.
  const hasIcon = Boolean(value) && value !== 'none'

  const handleOpen = () => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: rect.left })
    setWidth(rect.width)
    setOpen(true)
  }

  const triggerClass = ['jf-dropdown', 'jf-dropdown--md', 'jf-dropdown--default', open && 'jf-dropdown--open']
    .filter(Boolean)
    .join(' ')

  return (
    <div className="jf-dropdown__root">
      <button
        ref={triggerRef}
        type="button"
        className={triggerClass}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={handleOpen}
      >
        <span className="jf-dropdown__leading">
          {hasIcon ? <LucideIcon name={value} size={20} /> : <Icon name="image-line-filled" category="general" size={20} />}
        </span>
        <span className={`jf-dropdown__value${hasIcon ? '' : ' jf-dropdown__value--placeholder'}`}>
          {hasIcon ? value : 'Select icon'}
        </span>
        <span className="jf-dropdown__trailing">
          {clearable && hasIcon && (
            <span
              className="icon-field__clear"
              role="button"
              aria-label="Remove icon"
              onClick={(e) => {
                e.stopPropagation()
                onChange('none')
              }}
            >
              <Icon name="xmark-sm" category="general" size={16} />
            </span>
          )}
          <Icon name={open ? 'angle-up' : 'angle-down'} category="arrows" size={24} />
        </span>
      </button>
      {open && (
        <IconPickerPopover
          value={value}
          anchorPos={pos}
          placement="bottom-left"
          width={width}
          hideHeader
          onSelect={(name) => {
            onChange(name)
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
