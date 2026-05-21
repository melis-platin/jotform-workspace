import { useEffect, useRef, useState, type FC } from 'react'
import { createPortal } from 'react-dom'
import {
  Input as DSInput,
  Link as DSLink,
  Button as DSButton,
  DropdownSingle as DSDropdownSingle,
  Icon,
} from '@jf/design-system'
import { HsvColorPicker } from '@jf/app-elements'

/** One reorderable choice row — shared by the option and modifier modals. */
export interface ChoiceItem {
  id: string
  value: string
  /** Hex color — only used when the list shows color swatches. */
  color?: string
  /** The choice's own price — only used when the list shows price/stock. */
  price?: string
  /** Stock status — only used when the list shows price/stock. Defaults to in stock. */
  inStock?: boolean
}

const STOCK_OPTIONS = [
  { value: 'in', label: 'In stock' },
  { value: 'out', label: 'Out of stock' },
]

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

let choiceIdCounter = 0
export const makeChoiceId = () => `c_${Date.now().toString(36)}_${(choiceIdCounter++).toString(36)}`
export const emptyChoice = (): ChoiceItem => ({ id: makeChoiceId(), value: '' })

/** Per-choice color swatch that opens an HSV picker in a portal popup. */
const ChoiceColorSwatch: FC<{ color?: string; onChange: (hex: string) => void }> = ({ color, onChange }) => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const openPicker = () => {
    const r = wrapRef.current?.getBoundingClientRect()
    if (r) setPos({ top: r.bottom + 8, left: Math.max(8, r.right - 272) })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (popRef.current?.contains(t) || wrapRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const hasColor = !!color && HEX_RE.test(color)

  return (
    <div ref={wrapRef} className="choice-list__swatch-wrap">
      <button
        type="button"
        className={`choice-list__swatch${hasColor ? '' : ' choice-list__swatch--empty'}`}
        style={hasColor ? { background: color } : undefined}
        onClick={openPicker}
        aria-label="Pick a color"
      />
      {open &&
        createPortal(
          <div
            ref={popRef}
            className="color-theme-grid__picker-popup"
            data-theme="dark"
            style={{ top: pos.top, left: pos.left }}
          >
            <HsvColorPicker
              color={hasColor ? color! : '#000000'}
              onChange={onChange}
              tint={0}
              onTintChange={() => {}}
              hideTint
            />
          </div>,
          document.body,
        )}
    </div>
  )
}

interface ChoiceListProps {
  choices: ChoiceItem[]
  onChange: (next: ChoiceItem[]) => void
  /** Drives the asterisk next to the "Choices" label. */
  required?: boolean
  placeholder: string
  /** Show a per-row color swatch picker. */
  showColorSwatch?: boolean
  /** Show a per-row price input and stock-status dropdown. */
  showPriceStock?: boolean
}

/** Reorderable list of choice inputs with add / delete / drag-to-reorder. */
export const ChoiceList: FC<ChoiceListProps> = ({
  choices,
  onChange,
  required = true,
  placeholder,
  showColorSwatch = false,
  showPriceStock = false,
}) => {
  const dragIndex = useRef<number | null>(null)

  const updateChoice = (id: string, updates: Partial<ChoiceItem>) =>
    onChange(choices.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  const removeChoice = (id: string) => onChange(choices.filter((c) => c.id !== id))
  const addChoice = () => onChange([...choices, emptyChoice()])
  const moveChoice = (from: number, to: number) => {
    const next = [...choices]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  return (
    <div className="choice-list">
      <span className="choice-list__label">
        Choices
        {required && <span className="choice-list__required-star"> *</span>}
      </span>
      {choices.map((choice, i) => (
        <div
          key={choice.id}
          className="choice-list__row"
          onDragOver={(e) => {
            if (dragIndex.current !== null) e.preventDefault()
          }}
          onDrop={() => {
            if (dragIndex.current !== null && dragIndex.current !== i) moveChoice(dragIndex.current, i)
            dragIndex.current = null
          }}
        >
          <span
            className="choice-list__handle"
            draggable
            onDragStart={(e) => {
              dragIndex.current = i
              e.dataTransfer.effectAllowed = 'move'
            }}
            onDragEnd={() => {
              dragIndex.current = null
            }}
            aria-label="Reorder choice"
          >
            <Icon name="grid-dots-vertical" category="general" size={16} />
          </span>
          <div className="choice-list__input">
            <DSInput
              value={choice.value}
              placeholder={placeholder}
              onChange={(e) => updateChoice(choice.id, { value: e.target.value })}
            />
          </div>
          {showColorSwatch && (
            <ChoiceColorSwatch
              color={choice.color}
              onChange={(hex) => updateChoice(choice.id, { color: hex })}
            />
          )}
          {showPriceStock && (
            <>
              <div className="choice-list__price">
                <DSInput
                  value={choice.price ?? ''}
                  placeholder="0.00"
                  onChange={(e) => updateChoice(choice.id, { price: e.target.value })}
                />
              </div>
              <div className="choice-list__stock">
                <DSDropdownSingle
                  value={choice.inStock === false ? 'out' : 'in'}
                  showLeadingIcon={false}
                  usePortal
                  onChange={(v) => updateChoice(choice.id, { inStock: v === 'in' })}
                  options={STOCK_OPTIONS}
                />
              </div>
            </>
          )}
          <DSButton
            type="button"
            className="choice-list__delete"
            variant="transparent"
            colorScheme="secondary"
            shape="rounded"
            size="md"
            iconOnly
            disabled={choices.length <= 1}
            aria-label="Remove choice"
            leftIcon={<Icon name="trash-filled" category="general" size={16} />}
            onClick={() => removeChoice(choice.id)}
          />
        </div>
      ))}
      <div className="choice-list__add">
        <DSLink
          colorScheme="primary"
          size="lg"
          leftIcon={<Icon name="plus" category="general" size={16} />}
          onClick={addChoice}
        >
          Another Choice
        </DSLink>
      </div>
    </div>
  )
}
