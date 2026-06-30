import { useEffect, useRef } from 'react'

interface LivePreviewAvatarPopoverProps {
  open: boolean
  onClose: () => void
  onLogout?: () => void
  onProfile?: () => void
  userName?: string
}

const ITEMS = [
  { id: 'profile', label: 'Profile' },
  { id: 'logout', label: 'Log out' },
]

export function LivePreviewAvatarPopover({
  open,
  onClose,
  onLogout,
  onProfile,
  userName = 'Melis Platin',
}: LivePreviewAvatarPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const id = window.setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div ref={ref} className="live-preview__avatar-popover app-scope" role="menu">
      <div className="live-preview__avatar-popover-greeting">
        Hello, <strong>{userName}</strong>
      </div>
      <ul className="live-preview__avatar-popover-list">
        {ITEMS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="live-preview__avatar-popover-item"
              onClick={() => {
                if (item.id === 'logout') {
                  onLogout?.()
                  onClose()
                  return
                }
                if (item.id === 'profile') onProfile?.()
                onClose()
              }}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
