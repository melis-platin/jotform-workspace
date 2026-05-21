import { useEffect, useRef, useState, type FC } from 'react'
import { createPortal } from 'react-dom'
import {
  Modal as DSModal,
  Input as DSInput,
  NumberInput as DSNumberInput,
  DropdownSingle as DSDropdownSingle,
  FormField as DSFormField,
  Checkbox as DSCheckbox,
  Link as DSLink,
  Icon,
} from '@jf/design-system'
import { HsvColorPicker } from '@jf/app-elements'
import type { ProductModifier, ProductModifierFieldType, ProductModifierChoice } from '@jf/app-elements'

interface ProductModifierModalProps {
  open: boolean
  /** When set, the modal edits this modifier; otherwise it adds a new one. */
  modifier?: ProductModifier | null
  onClose: () => void
  onSubmit: (data: Omit<ProductModifier, 'id'>) => void
}

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text choices' },
  { value: 'color', label: 'Color swatches' },
  { value: 'textbox', label: 'Text box' },
]

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

let choiceIdCounter = 0
const makeChoiceId = () => `mc_${Date.now().toString(36)}_${(choiceIdCounter++).toString(36)}`
const emptyChoice = (): ProductModifierChoice => ({ id: makeChoiceId(), value: '' })
const seedChoices = (): ProductModifierChoice[] => [emptyChoice(), emptyChoice(), emptyChoice()]

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
    <div ref={wrapRef} className="product-modifier-modal__swatch-wrap">
      <button
        type="button"
        className={`product-modifier-modal__swatch${hasColor ? '' : ' product-modifier-modal__swatch--empty'}`}
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

/** Builder modal for adding or editing a product modifier. */
export const ProductModifierModal: FC<ProductModifierModalProps> = ({ open, modifier, onClose, onSubmit }) => {
  const [name, setName] = useState('')
  const [fieldType, setFieldType] = useState('text')
  const [required, setRequired] = useState(false)
  const [choices, setChoices] = useState<ProductModifierChoice[]>(seedChoices)
  const [textBoxTitle, setTextBoxTitle] = useState('')
  const [characterLimit, setCharacterLimit] = useState<number | undefined>(500)
  const dragIndex = useRef<number | null>(null)

  // Prefill once when the modal opens — blank for add, existing values for edit.
  useEffect(() => {
    if (!open) return
    setName(modifier?.name ?? '')
    setFieldType(modifier?.fieldType ?? 'text')
    setRequired(modifier?.required ?? false)
    setChoices(modifier?.choices && modifier.choices.length > 0 ? modifier.choices : seedChoices())
    setTextBoxTitle(modifier?.textBoxTitle ?? '')
    setCharacterLimit(modifier?.characterLimit ?? 500)
  }, [open])

  const handleFieldTypeChange = (next: string) => {
    setFieldType(next)
    if (next !== 'textbox' && choices.length === 0) setChoices(seedChoices())
  }

  const updateChoice = (id: string, updates: Partial<ProductModifierChoice>) =>
    setChoices((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  const removeChoice = (id: string) => setChoices((prev) => prev.filter((c) => c.id !== id))
  const addChoice = () => setChoices((prev) => [...prev, emptyChoice()])
  const removeAllChoices = () => setChoices([])
  const moveChoice = (from: number, to: number) =>
    setChoices((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })

  const isTextbox = fieldType === 'textbox'
  const nonEmptyChoices = choices.filter((c) => c.value.trim() !== '')
  const canSubmit =
    name.trim() !== '' &&
    (isTextbox
      ? textBoxTitle.trim() !== '' &&
        characterLimit !== undefined &&
        characterLimit >= 1 &&
        characterLimit <= 500
      : nonEmptyChoices.length > 0)

  return (
    <DSModal
      open={open}
      onClose={onClose}
      size="md"
      title={modifier ? 'Edit Modifier' : 'Add Modifier'}
      description="Add a customization field that won't affect price or stock."
      cancelLabel="Cancel"
      confirmLabel={modifier ? 'Save' : 'Add'}
      confirmDisabled={!canSubmit}
      onConfirm={() => {
        if (!canSubmit) return
        onSubmit({
          name: name.trim(),
          fieldType: fieldType as ProductModifierFieldType,
          required,
          choices: isTextbox
            ? undefined
            : nonEmptyChoices.map((c) => ({
                id: c.id,
                value: c.value.trim(),
                ...(fieldType === 'color' && c.color ? { color: c.color } : {}),
              })),
          textBoxTitle: isTextbox ? textBoxTitle.trim() : undefined,
          characterLimit: isTextbox ? characterLimit : undefined,
        })
        onClose()
      }}
    >
      <div className="product-modifier-modal">
        <DSFormField
          title="Modifier name"
          required
          size="md"
          showDescription={false}
          showHelpText
          helpText="The name will be used as the field title."
        >
          <DSInput
            value={name}
            placeholder="e.g., Embroidery pattern"
            maxLength={50}
            onChange={(e) => setName(e.target.value)}
          />
        </DSFormField>
        <DSFormField title="Field type" size="md" showDescription={false} showHelpText={false}>
          <DSDropdownSingle
            value={fieldType}
            showLeadingIcon={false}
            onChange={handleFieldTypeChange}
            options={FIELD_TYPE_OPTIONS}
            usePortal
          />
        </DSFormField>
        <DSCheckbox
          className="product-modifier-modal__required"
          label="This is a required field"
          size="sm"
          checked={required}
          onChange={(e) => setRequired(e.target.checked)}
        />

        {!isTextbox && (
          <div className="product-modifier-modal__choices">
            <div className="product-modifier-modal__choices-header">
              <span className="product-modifier-modal__choices-label">
                Choices <span className="product-modifier-modal__required-star">*</span>
              </span>
              {choices.length > 0 && (
                <DSLink colorScheme="primary" size="sm" onClick={removeAllChoices}>
                  Remove all
                </DSLink>
              )}
            </div>
            {choices.map((choice, i) => (
              <div
                key={choice.id}
                className="product-modifier-modal__choice-row"
                onDragOver={(e) => {
                  if (dragIndex.current !== null) e.preventDefault()
                }}
                onDrop={() => {
                  if (dragIndex.current !== null && dragIndex.current !== i) moveChoice(dragIndex.current, i)
                  dragIndex.current = null
                }}
              >
                <span
                  className="product-modifier-modal__choice-handle"
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
                <div className="product-modifier-modal__choice-input">
                  <DSInput
                    value={choice.value}
                    placeholder={fieldType === 'color' ? 'e.g., Yellow or Red' : 'e.g., Stars, Dots or Hearts'}
                    onChange={(e) => updateChoice(choice.id, { value: e.target.value })}
                  />
                </div>
                {fieldType === 'color' && (
                  <ChoiceColorSwatch
                    color={choice.color}
                    onChange={(hex) => updateChoice(choice.id, { color: hex })}
                  />
                )}
                <button
                  type="button"
                  className="product-modifier-modal__choice-delete"
                  aria-label="Remove choice"
                  onClick={() => removeChoice(choice.id)}
                >
                  <Icon name="trash-filled" category="general" size={16} />
                </button>
              </div>
            ))}
            <div className="product-modifier-modal__choices-add">
              <DSLink
                colorScheme="primary"
                size="sm"
                leftIcon={<Icon name="plus" category="general" size={16} />}
                onClick={addChoice}
              >
                Another Choice
              </DSLink>
            </div>
          </div>
        )}

        {isTextbox && (
          <>
            <DSFormField title="Text box title" required size="md" showDescription={false} showHelpText={false}>
              <DSInput
                value={textBoxTitle}
                placeholder={'e.g., "What would you like engraved on your watch?"'}
                maxLength={100}
                onChange={(e) => setTextBoxTitle(e.target.value)}
              />
            </DSFormField>
            <DSFormField title="Character limit" required size="md" showDescription={false} showHelpText={false}>
              <DSNumberInput
                value={characterLimit}
                min={1}
                max={500}
                showUnit={false}
                description="Enter amount between 1-500."
                onChange={setCharacterLimit}
              />
            </DSFormField>
          </>
        )}
      </div>
    </DSModal>
  )
}
