import { useEffect, useState, type FC } from 'react'
import {
  Modal as DSModal,
  Input as DSInput,
  TextArea as DSTextArea,
  NumberInput as DSNumberInput,
  DropdownSingle as DSDropdownSingle,
  FormField as DSFormField,
  Checkbox as DSCheckbox,
} from '@jf/design-system'
import type { ProductModifier, ProductModifierFieldType } from '@jf/app-elements'
import { ChoiceList, emptyChoice, type ChoiceItem } from './ChoiceList'

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

const seedChoices = (): ChoiceItem[] => [emptyChoice()]

/** Builder modal for adding or editing a product modifier. */
export const ProductModifierModal: FC<ProductModifierModalProps> = ({ open, modifier, onClose, onSubmit }) => {
  const [name, setName] = useState('')
  const [fieldType, setFieldType] = useState('text')
  const [required, setRequired] = useState(false)
  const [choices, setChoices] = useState<ChoiceItem[]>(seedChoices)
  const [textBoxTitle, setTextBoxTitle] = useState('')
  const [characterLimit, setCharacterLimit] = useState<number | undefined>(500)

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

  const isTextbox = fieldType === 'textbox'
  const nonEmptyChoices = choices.filter((c) => c.value.trim() !== '')
  // The buyer-facing field is only mandatory to configure when "required" is on.
  const requiredFieldFilled = isTextbox ? textBoxTitle.trim() !== '' : nonEmptyChoices.length > 0
  const characterLimitValid =
    characterLimit !== undefined && characterLimit >= 1 && characterLimit <= 500
  const canSubmit =
    name.trim() !== '' &&
    (isTextbox ? characterLimitValid : true) &&
    (!required || requiredFieldFilled)

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
          title={isTextbox ? 'Field name' : 'Modifier name'}
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
          <ChoiceList
            choices={choices}
            onChange={setChoices}
            required={required}
            placeholder={fieldType === 'color' ? 'e.g., Yellow or Red' : 'e.g., Stars, Dots or Hearts'}
            showColorSwatch={fieldType === 'color'}
          />
        )}

        {isTextbox && (
          <>
            <DSFormField
              title={name.trim() || 'Text box title'}
              required={required}
              size="md"
              showDescription={false}
              showHelpText={false}
            >
              <DSTextArea
                value={textBoxTitle}
                placeholder={'e.g., "What would you like engraved on your watch?"'}
                maxLength={characterLimit ?? 500}
                size="md"
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
