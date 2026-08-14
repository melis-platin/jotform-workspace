import { useEffect, useState } from 'react'
import {
  Icon,
  Input as DSInput,
  Toggle as DSToggle,
  FormField as DSFormField,
  Tabs as DSTabs,
  Link as DSLink,
  RadioButton,
  DropdownMulti as DSDropdownMulti,
} from '@jf/design-system'
import { IconPropertyField } from './IconPropertyField'
import { DEFAULT_PAGE_ICON } from './PageNavigationBar'
import { getRoleColorStyle, type AppRoleOption } from '../state/appUserRoles'

const MAX_VISIBLE_ROLE_BADGES = 2
const LONG_ROLE_BADGE_LABEL_LENGTH = 12

export interface PagePropertiesPage {
  id: string
  name: string
  icon?: string
  hidden?: boolean
  requireLogin?: boolean
  showIcon?: boolean
  landing?: boolean
  conditions?: Array<{ id: string }>
}

interface PagePropertiesPanelProps {
  page: PagePropertiesPage
  isFirstPage: boolean
  initialTab?: 'general' | 'condition'
  onRename: (name: string) => void
  onChangeIcon: (icon: string) => void
  onToggleHidden: (hidden: boolean) => void
  onToggleRequireLogin: (require: boolean) => void
  onToggleShowIcon: (show: boolean) => void
  onToggleLanding: (landing: boolean) => void
  onChangeConditions: (conditions: Array<{ id: string }>) => void
  onManageRoles: () => void
  roleOptions: AppRoleOption[]
  onClose: () => void
}

export function PagePropertiesPanel({
  page,
  isFirstPage,
  initialTab = 'general',
  onRename,
  onChangeIcon,
  onToggleHidden,
  onToggleRequireLogin,
  onToggleShowIcon,
  onToggleLanding,
  onChangeConditions,
  onManageRoles,
  roleOptions,
  onClose,
}: PagePropertiesPanelProps) {
  const [tab, setTab] = useState(initialTab)
  const showIcon = page.showIcon !== false
  const selectedRolesOnly = page.conditions?.some((condition) => condition.id === 'role-based-access') ?? false
  const selectedRoleIds = page.conditions
    ?.filter((condition) => condition.id.startsWith('role:'))
    .map((condition) => condition.id.slice('role:'.length)) ?? []
  const defaultRoleId = roleOptions[0]?.id ?? 'admin'
  const effectiveSelectedRoleIds = selectedRolesOnly && selectedRoleIds.length === 0
    ? [defaultRoleId]
    : selectedRoleIds
  const selectedRoleOptions = effectiveSelectedRoleIds
    .map((roleId) => roleOptions.find((role) => role.id === roleId))
    .filter((role): role is AppRoleOption => Boolean(role))
  const hasLongRoleBadge = selectedRoleOptions
    .slice(0, MAX_VISIBLE_ROLE_BADGES)
    .some((role) => role.label.length > LONG_ROLE_BADGE_LABEL_LENGTH)
  const visibleRoleOptions = selectedRoleOptions.slice(0, hasLongRoleBadge ? 1 : MAX_VISIBLE_ROLE_BADGES)
  const hiddenRoleCount = selectedRoleOptions.length - visibleRoleOptions.length

  const updateSelectedRoles = (roleIds: string[]) => {
    onChangeConditions([
      { id: 'role-based-access' },
      ...roleIds.map((roleId) => ({ id: `role:${roleId}` })),
    ])
  }

  useEffect(() => setTab(initialTab), [initialTab])

  return (
    <div className="build-page__properties" data-theme="dark">
      <div className="property-panel__header">
        <span className="property-panel__title">Page Properties</span>
        <div className="property-panel__header-actions">
          <button className="property-panel__close" onClick={onClose} aria-label="Close">
            <Icon name="xmark" size={20} />
          </button>
        </div>
      </div>

      <div className="property-panel__tabs">
        <DSTabs
          accent="apps"
          value={tab}
          onChange={(value) => setTab(value as 'general' | 'condition')}
          items={[
            { value: 'general', label: 'GENERAL' },
            { value: 'condition', label: 'CONDITION' },
          ]}
        />
      </div>

      {tab === 'general' && (
        <div className="property-panel__body">
          <div className="property-panel__field">
            <DSFormField title="Page Name" size="md" showDescription={false} showHelpText={false}>
              <DSInput
                value={page.name}
                placeholder="Page name"
                onChange={(e) => onRename(e.target.value)}
              />
            </DSFormField>
          </div>

          {isFirstPage && (
            <div className="property-panel__field property-panel__field--inline">
              <DSFormField
                title="Use as Landing Page"
                description="Show a public landing screen to logged-out visitors; login-required pages stay hidden until sign-in."
                size="md"
                showDescription
                showHelpText={false}
              >
                <DSToggle
                  size="md"
                  checked={Boolean(page.landing)}
                  onChange={(e) => onToggleLanding(e.target.checked)}
                />
              </DSFormField>
            </div>
          )}

          <div className="property-panel__field property-panel__field--inline">
            <DSFormField
              title="Require Login"
              description="Users need to log in to access this page."
              size="md"
              showDescription
              showHelpText={false}
            >
              <DSToggle
                size="md"
                checked={Boolean(page.requireLogin)}
                onChange={(e) => onToggleRequireLogin(e.target.checked)}
              />
            </DSFormField>
          </div>

          <div className="property-panel__field property-panel__field--inline">
            <DSFormField
              title="Show Page on Navigation"
              description="Set visibility of the page in the navigation."
              size="md"
              showDescription
              showHelpText={false}
            >
              <DSToggle
                size="md"
                checked={!page.hidden}
                onChange={(e) => onToggleHidden(!e.target.checked)}
              />
            </DSFormField>
          </div>

          <div className="property-panel__field">
            <div className="property-panel__field--inline">
              <DSFormField title="Show Icon" size="md" showDescription={false} showHelpText={false}>
                <DSToggle
                  size="md"
                  checked={showIcon}
                  onChange={(e) => onToggleShowIcon(e.target.checked)}
                />
              </DSFormField>
            </div>
            {showIcon && (
              <IconPropertyField
                value={page.icon || DEFAULT_PAGE_ICON}
                onChange={onChangeIcon}
              />
            )}
          </div>
        </div>
      )}

      {tab === 'condition' && (
        <div className="property-panel__body page-properties__conditions">
          <section className="page-properties__access" aria-labelledby="page-access-title">
            <h3 id="page-access-title">Role-Based Access</h3>
            <RadioButton
              className="page-properties__access-option"
              name={`page-access-${page.id}`}
              label="Visible to Everyone"
              checked={!selectedRolesOnly}
              onChange={() => onChangeConditions([])}
            />
            <div className={`page-properties__access-selection${selectedRolesOnly ? ' page-properties__access-selection--selected' : ''}`}>
              <RadioButton
                className="page-properties__access-option"
                name={`page-access-${page.id}`}
                label="Visible to Selected Roles Only"
                checked={selectedRolesOnly}
                onChange={() => updateSelectedRoles(effectiveSelectedRoleIds)}
              />
              {selectedRolesOnly && (
                <DSDropdownMulti
                  className="page-properties__role-select"
                  value={effectiveSelectedRoleIds}
                  onChange={updateSelectedRoles}
                  options={roleOptions.map((role) => ({ value: role.id, label: role.label }))}
                  placeholder="Select roles"
                  menuPlacement="bottom"
                  summary={(
                    <span className="page-properties__role-summary" aria-label={selectedRoleOptions.map((role) => role.label).join(', ')}>
                      {visibleRoleOptions.map((role) => (
                        <span
                          className="page-properties__role-badge"
                          key={role.id}
                          style={getRoleColorStyle(role.color)}
                        >
                          <span className="page-properties__role-badge-label">{role.label}</span>
                          <span
                            className="page-properties__role-badge-remove"
                            role="button"
                            aria-label={`Remove ${role.label}`}
                            tabIndex={-1}
                            onMouseDown={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              updateSelectedRoles(effectiveSelectedRoleIds.filter((roleId) => roleId !== role.id))
                            }}
                          >
                            <Icon name="xmark" size={12} />
                          </span>
                        </span>
                      ))}
                      {hiddenRoleCount > 0 && (
                        <span className="page-properties__role-badge-more">+{hiddenRoleCount} more</span>
                      )}
                    </span>
                  )}
                />
              )}
            </div>
            <DSLink
              className="page-properties__manage-roles"
              size="lg"
              rightIcon={<Icon name="arrow-right" category="arrows" size={16} />}
              onClick={onManageRoles}
            >
              Manage Roles
            </DSLink>
          </section>
        </div>
      )}

    </div>
  )
}
