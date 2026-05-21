import { useEffect, useState, type FC } from 'react'
import {
  Modal as DSModal,
  Input as DSInput,
  DropdownSingle as DSDropdownSingle,
  FormField as DSFormField,
} from '@jf/design-system'
import type { ProductOptionDimension } from '@jf/app-elements'
import { ChoiceList, emptyChoice, makeChoiceId, type ChoiceItem } from './ChoiceList'

interface ProductOptionModalProps {
  open: boolean
  /** When set, the modal edits this option; otherwise it adds a new one. */
  option?: ProductOptionDimension | null
  onClose: () => void
  onSubmit: (name: string, fieldType: 'text' | 'color', values: string[]) => void
}

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text choices' },
  { value: 'color', label: 'Color swatches' },
]

/** Builder modal for adding a product option (variant dimension). */
export const ProductOptionModal: FC<ProductOptionModalProps> = ({ open, option, onClose, onSubmit }) => {
  const [name, setName] = useState('')
  const [fieldType, setFieldType] = useState('text')
  const [choices, setChoices] = useState<ChoiceItem[]>(() => [emptyChoice()])

  // Prefill once when the modal opens — blank for add, existing values for edit.
  useEffect(() => {
    if (!open) return
    setName(option?.label ?? '')
    setFieldType(option?.type ?? 'text')
    setChoices(
      option && option.values.length > 0
        ? option.values.map((v) => ({ id: makeChoiceId(), value: v }))
        : [emptyChoice()],
    )
  }, [open])

  const values = choices.map((c) => c.value.trim()).filter(Boolean)
  const canSubmit = name.trim() !== '' && values.length > 0

  return (
    <DSModal
      open={open}
      onClose={onClose}
      size="md"
      title={option ? 'Edit Product Option' : 'Add Product Option'}
      description="Create variants like size or color for this product."
      cancelLabel="Cancel"
      confirmLabel={option ? 'Save' : 'Add'}
      confirmDisabled={!canSubmit}
      onConfirm={() => {
        if (!canSubmit) return
        onSubmit(name.trim(), fieldType as 'text' | 'color', values)
        onClose()
      }}
    >
      <div className="product-option-modal">
        <div className="product-option-modal__row">
          <DSFormField title="Option name" required size="md" showDescription={false} showHelpText={false}>
            <DSInput
              value={name}
              placeholder="e.g., Size or Weight"
              maxLength={50}
              onChange={(e) => setName(e.target.value)}
            />
          </DSFormField>
          <DSFormField title="Field type" size="md" showDescription={false} showHelpText={false}>
            <DSDropdownSingle
              value={fieldType}
              showLeadingIcon={false}
              onChange={setFieldType}
              options={FIELD_TYPE_OPTIONS}
            />
          </DSFormField>
        </div>
        <ChoiceList choices={choices} onChange={setChoices} placeholder="e.g., Small, Medium, Large" />
      </div>
    </DSModal>
  )
}
