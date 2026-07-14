import { Icon } from '@jf/design-system'
import type { ReactNode } from 'react'

interface PanelHeaderProps {
  icon: string
  iconCategory: string
  title: string
  description: string
  iconBg?: string
  action?: ReactNode
}

export function PanelHeader({ icon, iconCategory, title, description, iconBg, action }: PanelHeaderProps) {
  return (
    <header className="panel-header">
      <div className="panel-header__main">
        <span
          className="panel-header__icon"
          style={iconBg ? { background: iconBg } : undefined}
        >
          <Icon name={icon} category={iconCategory} size={28} />
        </span>
        <div className="panel-header__text">
          <p className="panel-header__title">{title}</p>
          <p className="panel-header__desc">{description}</p>
        </div>
      </div>
      {action && <div className="panel-header__action">{action}</div>}
    </header>
  )
}
