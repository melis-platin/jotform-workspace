import type { ReactNode } from 'react'
import { DropdownSingle, Icon } from '@jf/design-system'
import { QrPlaceholder } from './QrPlaceholder'
import { TabletStatusBar } from './TabletStatusBar'
import { DEFAULT_ROLE_OPTIONS, type AppRoleOption } from '../state/appUserRoles'

export type PreviewDevice = 'phone' | 'tablet' | 'desktop'
export type PreviewRole = string

interface AppPreviewScreenProps {
  device: PreviewDevice
  onDeviceChange: (device: PreviewDevice) => void
  onBack: () => void
  appScreen?: ReactNode
  role?: PreviewRole
  onRoleChange?: (role: PreviewRole) => void
  roleOptions?: AppRoleOption[]
}

const DEVICE_TABS: { id: PreviewDevice; label: string; icon: string }[] = [
  { id: 'phone', label: 'Phone', icon: 'mobile' },
  { id: 'tablet', label: 'Tablet', icon: 'tablet' },
  { id: 'desktop', label: 'Desktop', icon: 'desktop' },
]

export function AppPreviewScreen({
  device,
  onDeviceChange,
  onBack,
  appScreen,
  role = 'anyone',
  onRoleChange,
  roleOptions = DEFAULT_ROLE_OPTIONS,
}: AppPreviewScreenProps) {
  const adminRole = roleOptions.find((roleOption) => roleOption.id === 'admin') ?? roleOptions.find((roleOption) => roleOption.tone === 'admin')
  const userRole = roleOptions.find((roleOption) => roleOption.id === 'user') ?? roleOptions.find((roleOption) => roleOption.tone === 'user')
  const roleSegments = [
    { value: adminRole?.id ?? 'admin', label: 'Admin', icon: 'user-shield' },
    { value: userRole?.id ?? 'user', label: 'User', icon: 'user-filled' },
    { value: 'anyone', label: 'Public', icon: 'users-filled' },
  ]

  return (
    <div className="app-preview-screen" role="dialog" aria-label="App preview">
      <header className="app-preview-screen__bar">
        <button
          type="button"
          className="app-preview-screen__mobile-back"
          onClick={onBack}
        >
          <Icon name="chevron-left" category="arrows" size={20} />
          <span>Back to builder</span>
        </button>
        <div className="app-preview-screen__role-segment" role="tablist" aria-label="Preview role">
          {roleSegments.map((roleSegment) => {
            const isActive = roleSegment.value === role
            return (
              <button
                key={roleSegment.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`app-preview-screen__role-option${isActive ? ' app-preview-screen__role-option--active' : ''}`}
                onClick={() => onRoleChange?.(roleSegment.value)}
              >
                <Icon name={roleSegment.icon} category="users" size={20} />
                <span>{roleSegment.label}</span>
              </button>
            )
          })}
        </div>
        <div className="app-preview-screen__tabs" role="tablist">
          {DEVICE_TABS.map((tab) => {
            const isActive = tab.id === device
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`app-preview-screen__tab${isActive ? ' app-preview-screen__tab--active' : ''}`}
                onClick={() => onDeviceChange(tab.id)}
              >
                <Icon name={tab.icon} category="technology" size={24} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
        <div className="app-preview-screen__toggle">
          <span className="topbar__preview-label">App Preview</span>
          <button
            type="button"
            className="topbar__toggle topbar__toggle--active"
            onClick={onBack}
            aria-label="Close preview"
            aria-pressed="true"
          >
            <span className="topbar__toggle-track" />
            <span className="topbar__toggle-thumb" />
          </button>
        </div>
        <div className="app-preview-screen__mobile-role" data-theme="dark">
          <DropdownSingle
            size="md"
            aria-label="Preview role"
            options={roleSegments.map((roleSegment) => ({
              value: roleSegment.value,
              label: roleSegment.label,
              leading: <Icon name={roleSegment.icon} category="users" size={20} />,
            }))}
            value={role}
            onChange={(nextRole) => onRoleChange?.(nextRole)}
            trailingIcon={<Icon name="angle-down" category="arrows" size={16} />}
            menuPlacement="bottom"
            mobileBehavior="inline"
          />
        </div>
      </header>
      <div className={`app-preview-screen__canvas app-preview-screen__canvas--${device}`}>
        {device !== 'phone' && (
          <div className="app-preview-screen__qr-badge" aria-label="Scan QR to view on mobile">
            <span className="app-preview-screen__qr-badge-label">View on mobile</span>
            <QrPlaceholder size={104} className="app-preview-screen__qr-badge-qr" />
          </div>
        )}
        {device === 'phone' && (
          <div className="live-preview__phone app-preview-screen__phone">
            <div className="live-preview__phone-shell app-scope" />
            <div className="live-preview__phone-bezel" />
            <div className="live-preview__phone-screen">{appScreen}</div>
          </div>
        )}
        {device === 'tablet' && (
          <div className="live-preview__tablet app-preview-screen__tablet">
            <div className="live-preview__tablet-shell app-scope" />
            <div className="live-preview__tablet-bezel" />
            <div className="live-preview__tablet-screen">
              <div className="live-preview__tablet-status-bar-bg app-scope" />
              <TabletStatusBar className="live-preview__tablet-status-bar app-scope" />
              {appScreen}
            </div>
          </div>
        )}
        {device === 'desktop' && (
          <div className="app-preview-screen__desktop">{appScreen}</div>
        )}
      </div>
    </div>
  )
}
