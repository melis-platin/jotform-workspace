import { useEffect, useRef, useState, type FC, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { RadioButton } from '@jf/design-system'

const INVENTORY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'inStock', label: 'In stock' },
  { value: 'outOfStock', label: 'Out of stock' },
  { value: 'partial', label: 'Partially out of stock' },
]

const VISIBILITY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'shown', label: 'Shown in online store' },
  { value: 'hidden', label: 'Hidden from online store' },
]

interface ProductFilterPopoverProps {
  anchorRef: RefObject<HTMLElement | null>
  inventory: string
  visibility: string
  onInventoryChange: (value: string) => void
  onVisibilityChange: (value: string) => void
  onClose: () => void
}

/** Filter dropdown for the product search — Inventory + Visibility radio groups. */
export const ProductFilterPopover: FC<ProductFilterPopoverProps> = ({
  anchorRef,
  inventory,
  visibility,
  onInventoryChange,
  onVisibilityChange,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)

  useEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    // Anchor to the search input box, not the full-width field wrapper.
    const box = anchor.querySelector('.jf-search') ?? anchor
    const rect = box.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
  }, [anchorRef])

  useEffect(() => {
    const handlePointer = (e: MouseEvent) => {
      const target = e.target as Node
      if (popoverRef.current?.contains(target)) return
      if (anchorRef.current?.contains(target)) return
      onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [anchorRef, onClose])

  if (!pos) return null

  return createPortal(
    <div
      ref={popoverRef}
      className="product-filter-popover"
      data-theme="dark"
      style={{ top: pos.top, left: pos.left, width: pos.width }}
    >
      <div className="product-filter-popover__section">
        <span className="product-filter-popover__title">Inventory</span>
        {INVENTORY_OPTIONS.map((opt) => (
          <RadioButton
            key={opt.value}
            name="product-filter-inventory"
            value={opt.value}
            label={opt.label}
            checked={inventory === opt.value}
            onChange={() => onInventoryChange(opt.value)}
          />
        ))}
      </div>
      <div className="product-filter-popover__section">
        <span className="product-filter-popover__title">Visibility</span>
        {VISIBILITY_OPTIONS.map((opt) => (
          <RadioButton
            key={opt.value}
            name="product-filter-visibility"
            value={opt.value}
            label={opt.label}
            checked={visibility === opt.value}
            onChange={() => onVisibilityChange(opt.value)}
          />
        ))}
      </div>
    </div>,
    document.body,
  )
}
