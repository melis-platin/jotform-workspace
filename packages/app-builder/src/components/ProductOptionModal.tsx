import { useEffect, useState, type FC } from 'react'
import {
  Modal as DSModal,
  Input as DSInput,
  DropdownSingle as DSDropdownSingle,
  FormField as DSFormField,
} from '@jf/design-system'

interface ProductOptionModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (name: string, fieldType: 'text' | 'color', values: string[]) => void
}

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text choices' },
  { value: 'color', label: 'Color swatches' },
]

/** Builder modal for adding a product option (variant dimension). */
export const ProductOptionModal: FC<ProductOptionModalProps> = ({ open, onClose, onSubmit }) => {
  const [name, setName] = useState('')
  const [fieldType, setFieldType] = useState('text')
  const [choices, setChoices] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setFieldType('text')
      setChoices('')
    }
  }, [open])

  const values = choices.split(',').map((c) => c.trim()).filter(Boolean)
  const canSubmit = name.trim() !== '' && values.length > 0

  return (
    <DSModal
      open={open}
      onClose={onClose}
      size="md"
      title="Add product option"
      description="You'll be able to manage pricing and inventory for this product option later on."
      cancelLabel="Cancel"
      confirmLabel="Add"
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
        <DSFormField
          title="Choices"
          required
          size="md"
          showDescription={false}
          showHelpText
          helpText="Separate each choice with a comma."
        >
          <DSInput
            value={choices}
            placeholder="e.g., Small, Medium, Large"
            onChange={(e) => setChoices(e.target.value)}
          />
        </DSFormField>
      </div>
    </DSModal>
  )
}
