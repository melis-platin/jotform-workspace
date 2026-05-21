import { useEffect, useState, type FC } from 'react'
import {
  Modal as DSModal,
  Input as DSInput,
  NumberInput as DSNumberInput,
  DropdownSingle as DSDropdownSingle,
  FormField as DSFormField,
  Segmented as DSSegmented,
} from '@jf/design-system'
import type { ProductSubscription, ProductSubscriptionRepeatUnit } from '@jf/app-elements'

interface ProductSubscriptionModalProps {
  open: boolean
  /** When set, the modal edits this subscription; otherwise it adds a new one. */
  subscription?: ProductSubscription | null
  /** Product base price — drives the live subscription-price preview. */
  price: string
  /** Currency symbol shown in the discount toggle and price preview. */
  currency: string
  onClose: () => void
  onSubmit: (subscription: ProductSubscription) => void
}

const REPEAT_UNIT_OPTIONS = [
  { value: 'day', label: 'Day(s)' },
  { value: 'week', label: 'Week(s)' },
  { value: 'month', label: 'Month(s)' },
  { value: 'year', label: 'Year(s)' },
]

const EXPIRES_OPTIONS = [
  { value: 'never', label: 'Never expires' },
  { value: '2', label: '2 billing cycles' },
  { value: '3', label: '3 billing cycles' },
  { value: '4', label: '4 billing cycles' },
  { value: 'custom', label: 'Custom' },
]

/** Builder modal for adding or editing a product subscription plan. */
export const ProductSubscriptionModal: FC<ProductSubscriptionModalProps> = ({
  open,
  subscription,
  price,
  currency,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [repeatEvery, setRepeatEvery] = useState<number | undefined>(1)
  const [repeatUnit, setRepeatUnit] = useState('')
  const [expiresChoice, setExpiresChoice] = useState('')
  const [customCycles, setCustomCycles] = useState<number | undefined>(undefined)
  const [discount, setDiscount] = useState<number | undefined>(0)
  const [discountType, setDiscountType] = useState('amount')

  // Prefill once when the modal opens — blank for add, existing values for edit.
  useEffect(() => {
    if (!open) return
    setName(subscription?.name ?? '')
    setTagline(subscription?.tagline ?? '')
    setRepeatEvery(subscription?.repeatEvery ?? 1)
    setRepeatUnit(subscription?.repeatUnit ?? '')
    setDiscount(subscription?.discount ?? 0)
    setDiscountType(subscription?.discountType ?? 'amount')
    const cycles = subscription?.expiresAfterCycles
    if (cycles == null) {
      setExpiresChoice('')
      setCustomCycles(undefined)
    } else if (cycles === 0) {
      setExpiresChoice('never')
      setCustomCycles(undefined)
    } else if (cycles >= 2 && cycles <= 4) {
      setExpiresChoice(String(cycles))
      setCustomCycles(undefined)
    } else {
      setExpiresChoice('custom')
      setCustomCycles(cycles)
    }
  }, [open])

  const basePrice = Number(price) || 0
  const discountValue = discount ?? 0
  const effectiveDiscount =
    discountType === 'percent'
      ? basePrice * (Math.min(Math.max(discountValue, 0), 100) / 100)
      : Math.max(discountValue, 0)
  const subscriptionPrice = Math.max(basePrice - effectiveDiscount, 0)

  const cyclesValid =
    expiresChoice !== '' &&
    (expiresChoice !== 'custom' || (customCycles !== undefined && customCycles >= 2))
  const canSubmit =
    name.trim() !== '' &&
    repeatEvery !== undefined &&
    repeatEvery >= 1 &&
    repeatUnit !== '' &&
    cyclesValid

  return (
    <DSModal
      open={open}
      onClose={onClose}
      size="md"
      title={subscription ? 'Edit Subscription' : 'Add Subscription'}
      description="Charge customers on a recurring schedule."
      cancelLabel="Cancel"
      confirmLabel={subscription ? 'Save' : 'Add'}
      confirmDisabled={!canSubmit}
      onConfirm={() => {
        if (!canSubmit) return
        onSubmit({
          name: name.trim(),
          tagline: tagline.trim() || undefined,
          repeatEvery: repeatEvery ?? 1,
          repeatUnit: repeatUnit as ProductSubscriptionRepeatUnit,
          expiresAfterCycles:
            expiresChoice === 'never'
              ? 0
              : expiresChoice === 'custom'
                ? customCycles ?? 0
                : Number(expiresChoice),
          discount: Math.max(discountValue, 0),
          discountType: discountType as 'amount' | 'percent',
        })
        onClose()
      }}
    >
      <div className="product-subscription-modal">
        <div className="product-subscription-modal__row">
          <DSFormField title="Name" required size="md" showDescription={false} showHelpText={false}>
            <DSInput
              value={name}
              placeholder="e.g., Coffee of the Month"
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
            />
          </DSFormField>
          <DSFormField title="Tagline (optional)" size="md" showDescription={false} showHelpText={false}>
            <DSInput
              value={tagline}
              placeholder="e.g., Subscribe & save 15%"
              maxLength={50}
              onChange={(e) => setTagline(e.target.value)}
            />
          </DSFormField>
        </div>

        <div className="product-subscription-modal__divider" />

        <div className="product-subscription-modal__row">
          <DSFormField title="Repeats every" required size="md" showDescription={false} showHelpText={false}>
            <div className="product-subscription-modal__repeat">
              <div className="product-subscription-modal__repeat-count">
                <DSNumberInput
                  value={repeatEvery}
                  min={1}
                  showUnit={false}
                  onChange={setRepeatEvery}
                />
              </div>
              <div className="product-subscription-modal__repeat-unit">
                <DSDropdownSingle
                  value={repeatUnit}
                  placeholder="Select"
                  showLeadingIcon={false}
                  usePortal
                  onChange={setRepeatUnit}
                  options={REPEAT_UNIT_OPTIONS}
                />
              </div>
            </div>
          </DSFormField>
        </div>

        <div className="product-subscription-modal__row">
          <DSFormField title="Expires after" required size="md" showDescription={false} showHelpText={false}>
            <DSDropdownSingle
              value={expiresChoice}
              placeholder="Select"
              showLeadingIcon={false}
              usePortal
              onChange={setExpiresChoice}
              options={EXPIRES_OPTIONS}
            />
          </DSFormField>
          {expiresChoice === 'custom' && (
            <DSFormField title="Billing cycles" required size="md" showDescription={false} showHelpText={false}>
              <DSNumberInput
                value={customCycles}
                min={2}
                placeholder=""
                showUnit={false}
                onChange={setCustomCycles}
              />
            </DSFormField>
          )}
        </div>
        {expiresChoice === 'custom' && (
          <p className="product-subscription-modal__hint">
            Set at least 2 billing cycles to create a recurring subscription.
          </p>
        )}

        <div className="product-subscription-modal__divider" />

        <div className="product-subscription-modal__row">
          <DSFormField title="Discount" size="md" showDescription={false} showHelpText={false}>
            <div className="product-subscription-modal__discount">
              <div className="product-subscription-modal__discount-input">
                <DSNumberInput value={discount} min={0} showUnit={false} onChange={setDiscount} />
              </div>
              <DSSegmented
                className="product-subscription-modal__discount-type"
                items={[
                  { value: 'amount', label: currency },
                  { value: 'percent', label: '%' },
                ]}
                value={discountType}
                onChange={setDiscountType}
                variant="text"
                size="md"
                fullWidth={false}
              />
            </div>
          </DSFormField>
          <div className="product-subscription-modal__price">
            <span className="product-subscription-modal__price-label">Subscription price</span>
            <span className="product-subscription-modal__price-value">
              {currency}
              {subscriptionPrice.toFixed(2)}
            </span>
            <span className="product-subscription-modal__price-note">
              Price without subscription: {currency}
              {basePrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </DSModal>
  )
}
