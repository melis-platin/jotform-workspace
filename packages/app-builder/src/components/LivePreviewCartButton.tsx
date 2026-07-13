import { useCart } from '@jf/app-elements'
import { Icon } from '@jf/design-system'

interface LivePreviewCartButtonProps {
  onClick?: () => void
}

export function LivePreviewCartButton({ onClick }: LivePreviewCartButtonProps) {
  const cart = useCart()
  const count = cart?.count ?? 0
  return (
    <button
      type="button"
      className="live-preview__cart-btn"
      aria-label={count > 0 ? `Cart, ${count} items` : 'Cart'}
      onClick={onClick}
    >
      <Icon name="cart-shopping-filled" category="finance" size={20} />
      {count > 0 && (
        <span className="live-preview__cart-badge" aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
