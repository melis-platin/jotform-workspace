import { useState, type FC } from 'react'
import { Button as DSButton, Input as DSInput, Icon } from '@jf/design-system'
import {
  generateVariants,
  makeDimensionId,
  MAX_DIMENSIONS,
  MAX_VALUES_PER_DIMENSION,
  type ProductOptionDimension,
} from '@jf/app-elements'

interface ProductVariantEditorProps {
  dimensions: ProductOptionDimension[]
  onChange: (dimensions: ProductOptionDimension[]) => void
  onBack: () => void
}

// ── Tag input for a dimension's values ──
const ValueTagInput: FC<{
  values: string[]
  onChange: (values: string[]) => void
}> = ({ values, onChange }) => {
  const [draft, setDraft] = useState('')

  const commit = () => {
    const value = draft.trim()
    setDraft('')
    if (!value) return
    if (values.some((v) => v.toLowerCase() === value.toLowerCase())) return
    onChange([...values, value])
  }

  return (
    <div className="variant-editor__tags">
      {values.map((value) => (
        <span key={value} className="variant-editor__tag">
          {value}
          <button
            type="button"
            className="variant-editor__tag-remove"
            aria-label={`Remove ${value}`}
            onClick={() => onChange(values.filter((v) => v !== value))}
          >
            <Icon name="xmark" size={12} />
          </button>
        </span>
      ))}
      <input
        className="variant-editor__tag-input"
        value={draft}
        placeholder={values.length === 0 ? 'Add a value, press Enter' : 'Add value'}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Backspace' && draft === '' && values.length > 0) {
            onChange(values.slice(0, -1))
          }
        }}
        onBlur={commit}
      />
    </div>
  )
}

export const ProductVariantEditor: FC<ProductVariantEditorProps> = ({ dimensions, onChange, onBack }) => {
  const variants = generateVariants(dimensions)

  const updateDimension = (index: number, updates: Partial<ProductOptionDimension>) => {
    onChange(dimensions.map((d, i) => (i === index ? { ...d, ...updates } : d)))
  }

  const addDimension = () => {
    if (dimensions.length >= MAX_DIMENSIONS) return
    onChange([...dimensions, { id: makeDimensionId(), label: '', values: [] }])
  }

  const removeDimension = (index: number) => {
    onChange(dimensions.filter((_, i) => i !== index))
  }

  return (
    <div className="variant-editor">
      <div className="variant-editor__header">
        <button type="button" className="variant-editor__back" aria-label="Back" onClick={onBack}>
          <Icon name="caret-left" category="arrows" size={20} />
        </button>
        <span className="variant-editor__title">Variants</span>
      </div>

      <div className="variant-editor__body">
        {dimensions.length === 0 && (
          <p className="variant-editor__empty">
            Add a dimension like Size or Color. Variants are generated automatically from every combination.
          </p>
        )}

        {dimensions.map((dimension, index) => (
          <div key={dimension.id} className="variant-editor__dimension">
            <div className="variant-editor__dimension-head">
              <DSInput
                value={dimension.label}
                placeholder="Dimension name (e.g. Size)"
                onChange={(e) => updateDimension(index, { label: e.target.value })}
              />
              <button
                type="button"
                className="variant-editor__dimension-remove"
                aria-label="Remove dimension"
                onClick={() => removeDimension(index)}
              >
                <Icon name="trash-filled" category="general" size={16} />
              </button>
            </div>
            <ValueTagInput
              values={dimension.values}
              onChange={(values) => updateDimension(index, { values })}
            />
            {dimension.values.length > MAX_VALUES_PER_DIMENSION && (
              <p className="variant-editor__warning">
                {dimension.values.length} values is a lot — consider splitting this dimension.
              </p>
            )}
          </div>
        ))}

        <DSButton
          variant="ghost"
          colorScheme="secondary"
          size="md"
          leftIcon={<Icon name="plus" category="general" size={16} />}
          onClick={addDimension}
          disabled={dimensions.length >= MAX_DIMENSIONS}
          className="variant-editor__add"
        >
          {dimensions.length >= MAX_DIMENSIONS ? `Max ${MAX_DIMENSIONS} dimensions` : 'Add Dimension'}
        </DSButton>

        {variants.length > 0 && (
          <div className="variant-editor__variants">
            <span className="variant-editor__variants-title">
              {variants.length} {variants.length === 1 ? 'variant' : 'variants'}
            </span>
            <div className="variant-editor__variants-list">
              {variants.map((variant) => (
                <div key={variant.id} className="variant-editor__variant-row">
                  {Object.entries(variant.optionValues).map(([dim, value]) => (
                    <span key={dim} className="variant-editor__variant-chip">
                      <span className="variant-editor__variant-dim">{dim}:</span> {value}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
