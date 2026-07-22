import { useEffect, useRef } from 'react'

interface LivePreviewAvatarPopoverProps {
  open: boolean
  onClose: () => void
  onLogout?: () => void
  onProfile?: () => void
  onNotification?: () => void
  showNavigation?: boolean
  notificationCountLabel?: string | null
  userName?: string
}

export function LivePreviewAvatarPopover({
  open,
  onClose,
  onLogout,
  onProfile,
  onNotification,
  showNavigation = false,
  notificationCountLabel = null,
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

  const items = [
    { id: 'profile', label: 'Profile' },
    ...(showNavigation ? [{ id: 'navigation', label: 'Notification' }] : []),
    { id: 'logout', label: 'Log out' },
  ]

  return (
    <div ref={ref} className="live-preview__avatar-popover app-scope" role="menu">
      <div className="live-preview__avatar-popover-greeting">
        Hello, <strong>{userName}</strong>
      </div>
      <ul className="live-preview__avatar-popover-list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`live-preview__avatar-popover-item${item.id === 'navigation' ? ' live-preview__avatar-popover-item--navigation' : ''}`}
              onPointerDown={(event) => {
                // The desktop side-nav popover closes on outside pointer events.
                // Open the notification system page at pointer-down so this action
                // cannot be swallowed while the popover is being dismissed.
                if (item.id !== 'navigation') return
                event.preventDefault()
                onNotification?.()
                onClose()
              }}
              onClick={() => {
                if (item.id === 'navigation') return
                if (item.id === 'logout') {
                  onLogout?.()
                  onClose()
                  return
                }
                if (item.id === 'profile') onProfile?.()
                onClose()
              }}
            >
              <span className="live-preview__avatar-popover-item-label">{item.label}</span>
              {item.id === 'navigation' && notificationCountLabel && (
                <span className="live-preview__notification-count-badge live-preview__avatar-popover-notification-badge">
                  {notificationCountLabel}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
