import { useState } from 'react'
import { AppIcon, Button, useCart, useFavorites, type CartItem, type FavoriteItem } from '@jf/app-elements'
import { Icon } from '@jf/design-system'

type CartTab = 'order' | 'favorites'

interface LivePreviewCartPageProps {
  open: boolean
  onClose: () => void
  onContinue?: () => void
  avatarUrl: string
  currency?: string
}

function totalPrice(items: CartItem[]): string {
  const sum = items.reduce((acc, item) => {
    const num = parseFloat(String(item.price).replace(/[^0-9.]/g, ''))
    return acc + (isNaN(num) ? 0 : num * item.quantity)
  }, 0)
  return sum.toFixed(2)
}

function ItemRow({
  item,
  currency,
  controls,
  trailing,
}: {
  item: CartItem | FavoriteItem
  currency: string
  controls?: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <div className="live-preview__cart-row">
      <div className="live-preview__cart-row-img">
        {item.image ? <img src={item.image} alt="" /> : <AppIcon name="Image" size={32} />}
      </div>
      <div className="live-preview__cart-row-info">
        <p className="live-preview__cart-row-name">{item.name}</p>
        {'variantLabel' in item && item.variantLabel && (
          <p className="live-preview__cart-row-variant">{item.variantLabel}</p>
        )}
        <p className="live-preview__cart-row-price">{currency}{item.price}</p>
        {controls}
      </div>
      {trailing}
    </div>
  )
}

function QuantityStepper({
  value,
  onDecrement,
  onIncrement,
}: {
  value: number
  onDecrement: () => void
  onIncrement: () => void
}) {
  return (
    <div className="live-preview__cart-stepper" role="group" aria-label="Quantity">
      <button
        type="button"
        className="live-preview__cart-stepper-btn"
        aria-label="Decrease quantity"
        onClick={onDecrement}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <span className="live-preview__cart-stepper-count">{value}</span>
      <button
        type="button"
        className="live-preview__cart-stepper-btn"
        aria-label="Increase quantity"
        onClick={onIncrement}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

export function LivePreviewCartPage({
  open,
  onClose,
  onContinue,
  avatarUrl,
  currency = '$',
}: LivePreviewCartPageProps) {
  const cart = useCart()
  const favorites = useFavorites()
  const [tab, setTab] = useState<CartTab>('order')

  if (!open) return null

  const items = cart?.items ?? []
  const favItems = favorites?.items ?? []
  const total = totalPrice(items)

  return (
    <aside className="live-preview__cart-page app-scope" role="dialog" aria-label="Cart">
      <header className="live-preview__cart-header">
        <button
          type="button"
          className="live-preview__cart-back"
          aria-label="Back"
          onClick={onClose}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="live-preview__cart-title">Cart ({items.length})</h1>
        <img className="live-preview__cart-avatar" src={avatarUrl} alt="" aria-hidden="true" />
      </header>

      <div className="live-preview__cart-tabs">
        <button
          type="button"
          className={`live-preview__cart-tab${tab === 'order' ? ' live-preview__cart-tab--active' : ''}`}
          onClick={() => setTab('order')}
        >
          Order Summary
        </button>
        <button
          type="button"
          className={`live-preview__cart-tab${tab === 'favorites' ? ' live-preview__cart-tab--active' : ''}`}
          onClick={() => setTab('favorites')}
        >
          Favorites
        </button>
      </div>

      <div className="live-preview__cart-body">
        {tab === 'order' && (
          items.length > 0 ? (
            <div className="live-preview__cart-list">
              {items.map((item) => (
                <ItemRow
                  key={item.key}
                  item={item}
                  currency={currency}
                  controls={
                    <QuantityStepper
                      value={item.quantity}
                      onDecrement={() => cart?.decrement(item.key)}
                      onIncrement={() => cart?.increment(item.key)}
                    />
                  }
                  trailing={
                    <button
                      type="button"
                      className="live-preview__cart-trash"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => cart?.remove(item.key)}
                    >
                      <AppIcon name="Trash" size={16} />
                    </button>
                  }
                />
              ))}
            </div>
          ) : (
            <div className="live-preview__cart-empty">
              <div className="live-preview__cart-empty-icon">
                <span className="live-preview__cart-empty-badge">0</span>
                <Icon name="cart-shopping-filled" category="finance" size={36} />
              </div>
              <p className="live-preview__cart-empty-text">Your cart is empty</p>
            </div>
          )
        )}

        {tab === 'favorites' && (
          favItems.length > 0 ? (
            <div className="live-preview__cart-list">
              {favItems.map((item) => (
                <ItemRow key={item.name} item={item} currency={currency} />
              ))}
            </div>
          ) : (
            <div className="live-preview__cart-empty">
              <div className="live-preview__cart-empty-icon">
                <span className="live-preview__cart-empty-badge">0</span>
                <Icon name="heart-filled" category="general" size={36} />
              </div>
              <p className="live-preview__cart-empty-text">You haven&apos;t favorited any product yet</p>
            </div>
          )
        )}
      </div>

      <div className="live-preview__cart-cta">
        <Button
          variant="Default"
          corner="Default"
          size="Small"
          fullWidth
          leftIcon="none"
          rightIcon="none"
          label={tab === 'order' && items.length > 0 ? `Continue ${currency}${total}` : 'Start Shopping'}
          onClick={tab === 'order' && items.length > 0 ? onContinue : undefined}
        />
      </div>
    </aside>
  )
}
