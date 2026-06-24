import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, Icon, SearchInput } from '@jf/design-system'
import { PanelHeader } from '../components/PanelHeader'
import { QuickSharePanel } from '../components/QuickSharePanel'
import { SideNav, type SideNavItem } from '../components/SideNav'
import ownerAvatar from '../assets/app-users/melis-platin.png'
import alfonsoRosserAvatar from '../assets/app-users/figma/app-user-list-14/alfonso-rosser.jpg'
import allisonPassaquindiciArcandAvatar from '../assets/app-users/figma/app-user-list-14/allison-passaquindici-arcand.jpg'
import anikaGeidtAvatar from '../assets/app-users/figma/app-user-list-14/anika-geidt.jpg'
import cristoferSiphronAvatar from '../assets/app-users/figma/app-user-list-14/cristofer-siphron.jpg'
import emeryVetrovsAvatar from '../assets/app-users/figma/app-user-list-14/emery-vetrovs.jpg'
import gianaGeidtAvatar from '../assets/app-users/figma/app-user-list-14/giana-geidt.jpg'
import haylieSarisAvatar from '../assets/app-users/figma/app-user-list-14/haylie-saris.jpg'
import jakobSeptimusAvatar from '../assets/app-users/figma/app-user-list-14/jakob-septimus.jpg'
import kaylynnLevinAvatar from '../assets/app-users/figma/app-user-list-14/kaylynn-levin.jpg'
import martinWesterveltAvatar from '../assets/app-users/figma/app-user-list-14/martin-westervelt.jpg'
import paitynEkstromBothmanAvatar from '../assets/app-users/figma/app-user-list-14/paityn-ekstrom-bothman.jpg'
import raynaBotoshAvatar from '../assets/app-users/figma/app-user-list-14/rayna-botosh.jpg'
import raynaSarisAvatar from '../assets/app-users/figma/app-user-list-14/rayna-saris.jpg'
import terryWorkmanAvatar from '../assets/app-users/figma/app-user-list-14/terry-workman.jpg'
import {
  DEFAULT_ROLE_OPTIONS,
  getRandomRoleColor,
  getRoleColorStyle,
  type AppRoleOption,
} from '../state/appUserRoles'

const NAV_ITEMS: SideNavItem[] = [
  {
    id: 'quick-share',
    icon: 'link-diagonal',
    iconCategory: 'general',
    title: 'QUICK SHARE',
    description: 'Direct app link.',
    headerTitle: 'PUBLISH',
    headerDescription: 'Share all of your forms in one place.',
    iconBg: 'var(--accent-default)',
  },
  {
    id: 'embed',
    icon: 'angles-selector-slash-horizontal',
    iconCategory: 'arrows',
    title: 'EMBED',
    description: 'Get embed code.',
    headerDescription: 'Embed your app easily with one click.',
    iconBg: 'var(--product-reports-default)',
  },
  {
    id: 'app-users',
    icon: 'users-more-filled',
    iconCategory: 'users',
    title: 'APP USERS',
    description: 'Manage app users.',
    headerDescription: 'Manage users who have access to your app.',
    iconBg: 'var(--app-users-header-icon-bg)',
  },
]

interface DraftRoleInput {
  id: string
  name: string
  color: string
}

interface AppUser {
  id: string
  name: string
  email: string
  roleId: string
  roleColor?: string
  registrationDate: string
  lastSeenDate: string
  avatarUrl: string
}

const TOTAL_APP_USERS_COUNT = 15
const TABLE_DATE = 'May 22, 2026'

const OWNER_USER: AppUser = {
  id: 'app-owner',
  name: 'Melis Platin',
  email: 'melisplatin@jotform.com',
  roleId: 'admin',
  registrationDate: TABLE_DATE,
  lastSeenDate: TABLE_DATE,
  avatarUrl: ownerAvatar,
}

const APP_USERS: AppUser[] = [
  OWNER_USER,
  {
    id: 'allison-passaquindici-arcand',
    name: 'Allison Passaquindici Arcand',
    email: 'allisonpass@gmail.com',
    roleId: 'manager',
    registrationDate: TABLE_DATE,
    lastSeenDate: TABLE_DATE,
    avatarUrl: allisonPassaquindiciArcandAvatar,
  },
  {
    id: 'kaylynn-levin',
    name: 'Kaylynn Levin',
    email: 'kaylynnlevi@gmail.com',
    roleId: 'teacher',
    registrationDate: TABLE_DATE,
    lastSeenDate: TABLE_DATE,
    avatarUrl: kaylynnLevinAvatar,
  },
  {
    id: 'terry-workman',
    name: 'Terry Workman',
    email: 't.workman@gmail.com',
    roleId: 'parent',
    registrationDate: TABLE_DATE,
    lastSeenDate: TABLE_DATE,
    avatarUrl: terryWorkmanAvatar,
  },
  {
    id: 'anika-geidt',
    name: 'Anika Geidt',
    email: 'anika@gmail.com',
    roleId: 'parent',
    registrationDate: TABLE_DATE,
    lastSeenDate: TABLE_DATE,
    avatarUrl: anikaGeidtAvatar,
  },
  {
    id: 'rayna-saris',
    name: 'Rayna Saris',
    email: 'raynasaris@gmail.com',
    roleId: 'parent',
    registrationDate: TABLE_DATE,
    lastSeenDate: TABLE_DATE,
    avatarUrl: raynaSarisAvatar,
  },
  {
    id: 'cristofer-siphron',
    name: 'Cristofer Siphron',
    email: 'c.siphron@gmail.com',
    roleId: 'parent',
    registrationDate: TABLE_DATE,
    lastSeenDate: TABLE_DATE,
    avatarUrl: cristoferSiphronAvatar,
  },
  {
    id: 'giana-geidt',
    name: 'Giana Geidt',
    email: 'gg.geidt@gmail.com',
    roleId: 'parent',
    registrationDate: TABLE_DATE,
    lastSeenDate: TABLE_DATE,
    avatarUrl: gianaGeidtAvatar,
  },
  {
    id: 'martin-westervelt',
    name: 'Martin Westervelt',
    email: 'martin_wester@gmail.com',
    roleId: 'parent',
    registrationDate: TABLE_DATE,
    lastSeenDate: TABLE_DATE,
    avatarUrl: martinWesterveltAvatar,
  },
  {
    id: 'haylie-saris',
    name: 'Haylie Saris',
    email: 'hayliesaris@gmail.com',
    roleId: 'parent',
    registrationDate: TABLE_DATE,
    lastSeenDate: TABLE_DATE,
    avatarUrl: haylieSarisAvatar,
  },
  {
    id: 'emery-vetrovs',
    name: 'Emery Vetrovs',
    email: 'emeryvetrovs@gmail.com',
    roleId: 'parent',
    registrationDate: TABLE_DATE,
    lastSeenDate: TABLE_DATE,
    avatarUrl: emeryVetrovsAvatar,
  },
  {
    id: 'alfonso-rosser',
    name: 'Alfonso Rosser',
    email: 'rosser.alfonso@gmail.com',
    roleId: 'parent',
    registrationDate: TABLE_DATE,
    lastSeenDate: TABLE_DATE,
    avatarUrl: alfonsoRosserAvatar,
  },
  {
    id: 'jakob-septimus',
    name: 'Jakob Septimus',
    email: 'jakob_sptms@gmail.com',
    roleId: 'parent',
    registrationDate: TABLE_DATE,
    lastSeenDate: TABLE_DATE,
    avatarUrl: jakobSeptimusAvatar,
  },
  {
    id: 'rayna-botosh',
    name: 'Rayna Botosh',
    email: 'raynabotosh@gmail.com',
    roleId: 'parent',
    registrationDate: TABLE_DATE,
    lastSeenDate: TABLE_DATE,
    avatarUrl: raynaBotoshAvatar,
  },
  {
    id: 'paityn-ekstrom-bothman',
    name: 'Paityn Ekstrom Bothman',
    email: 'p.e.bothman@gmail.com',
    roleId: 'parent',
    registrationDate: TABLE_DATE,
    lastSeenDate: TABLE_DATE,
    avatarUrl: paitynEkstromBothmanAvatar,
  },
]

export const APP_USER_NAME_FIELD_VALUE = APP_USERS[0]?.name.trim().split(/\s+/)[0] ?? 'User'
export const APP_USER_TABLE_ROLE_IDS = Array.from(new Set(APP_USERS.map((user) => user.roleId)))

function getAssignedRole(user: AppUser, assignedRoleId: string, roleById: Map<string, AppRoleOption>) {
  const assignedRole = roleById.get(assignedRoleId) ?? DEFAULT_ROLE_OPTIONS[0]

  if (assignedRoleId === user.roleId && user.roleColor) {
    return { ...assignedRole, color: user.roleColor }
  }

  return assignedRole
}

interface PublishPageProps {
  roleOptions: AppRoleOption[]
  setRoleOptions: Dispatch<SetStateAction<AppRoleOption[]>>
  onAppUserTableRoleIdsChange?: (roleIds: string[]) => void
}

export function PublishPage({ roleOptions, setRoleOptions, onAppUserTableRoleIdsChange }: PublishPageProps) {
  const [activeId, setActiveId] = useState('quick-share')
  const active = NAV_ITEMS.find((item) => item.id === activeId) ?? NAV_ITEMS[0]

  return (
    <div className="publish-page">
      <SideNav items={NAV_ITEMS} activeId={activeId} onChange={setActiveId} />
      <main className="publish-page__content">
        <div className="publish-page__main">
          <PanelHeader
            icon={active.icon}
            iconCategory={active.iconCategory}
            title={active.headerTitle ?? active.title}
            description={active.headerDescription ?? active.description}
            iconBg={active.iconBg}
          />
          {activeId === 'quick-share' && <QuickSharePanel />}
          {activeId === 'app-users' && (
            <AppUsersPanel
              roleOptions={roleOptions}
              setRoleOptions={setRoleOptions}
              onAppUserTableRoleIdsChange={onAppUserTableRoleIdsChange}
            />
          )}
        </div>
      </main>
    </div>
  )
}

interface AppUsersPanelProps {
  roleOptions: AppRoleOption[]
  setRoleOptions: Dispatch<SetStateAction<AppRoleOption[]>>
  onAppUserTableRoleIdsChange?: (roleIds: string[]) => void
}

function AppUsersPanel({ roleOptions, setRoleOptions, onAppUserTableRoleIdsChange }: AppUsersPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoleUserId, setSelectedRoleUserId] = useState<string | null>(null)
  const [assignedRoleIds, setAssignedRoleIds] = useState<Record<string, string>>(() => (
    Object.fromEntries(APP_USERS.map((user) => [user.id, user.roleId]))
  ))
  const [draftRoleUserId, setDraftRoleUserId] = useState<string | null>(null)
  const [draftRoleInputs, setDraftRoleInputs] = useState<DraftRoleInput[]>([])
  const [activeDraftRoleInputId, setActiveDraftRoleInputId] = useState<string | null>(null)
  const draftRoleInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const draftRoleIdRef = useRef(0)
  const customRoleIdRef = useRef(0)
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const roleById = useMemo(() => new Map(roleOptions.map((role) => [role.id, role])), [roleOptions])
  const assignedTableRoleIds = useMemo(() => (
    Array.from(new Set(APP_USERS.map((user) => assignedRoleIds[user.id] ?? user.roleId)))
  ), [assignedRoleIds])
  const visibleUsers = useMemo(() => {
    if (!normalizedSearch) return APP_USERS
    return APP_USERS.filter((user) => {
      const assignedRoleId = assignedRoleIds[user.id] ?? user.roleId
      const assignedRole = getAssignedRole(user, assignedRoleId, roleById)

      return (
        user.name.toLowerCase().includes(normalizedSearch)
        || user.email.toLowerCase().includes(normalizedSearch)
        || assignedRole.label.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [assignedRoleIds, normalizedSearch, roleById])
  const userCountLabel = `${TOTAL_APP_USERS_COUNT} Users`

  useEffect(() => {
    if (draftRoleUserId && activeDraftRoleInputId) {
      draftRoleInputRefs.current[activeDraftRoleInputId]?.focus()
    }
  }, [activeDraftRoleInputId, draftRoleInputs.length, draftRoleUserId])

  useEffect(() => {
    onAppUserTableRoleIdsChange?.(assignedTableRoleIds)
  }, [assignedTableRoleIds, onAppUserTableRoleIdsChange])

  useEffect(() => {
    const maxCustomRoleId = roleOptions.reduce((maxId, role) => {
      const match = /^custom-(\d+)$/.exec(role.id)

      return match ? Math.max(maxId, Number(match[1])) : maxId
    }, 0)

    customRoleIdRef.current = Math.max(customRoleIdRef.current, maxCustomRoleId)
  }, [roleOptions])

  const createDraftRoleInput = (excludedColor?: string): DraftRoleInput => {
    draftRoleIdRef.current += 1

    return {
      id: `draft-role-${draftRoleIdRef.current}`,
      name: '',
      color: getRandomRoleColor(excludedColor),
    }
  }

  const saveDraftRoles = (
    userId: string,
    { clearDrafts = true, focusWhenEmpty = true }: { clearDrafts?: boolean; focusWhenEmpty?: boolean } = {},
  ) => {
    const filledDrafts = draftRoleInputs
      .map((draftRole) => ({ ...draftRole, name: draftRole.name.trim() }))
      .filter((draftRole) => draftRole.name)
    const emptyDrafts = draftRoleInputs.filter((draftRole) => !draftRole.name.trim())

    if (!filledDrafts.length) {
      if (clearDrafts && !focusWhenEmpty) {
        setDraftRoleInputs([])
        setDraftRoleUserId(null)
        setActiveDraftRoleInputId(null)
      } else if (focusWhenEmpty) {
        const focusTarget = activeDraftRoleInputId ?? draftRoleInputs.at(-1)?.id

        if (focusTarget) {
          draftRoleInputRefs.current[focusTarget]?.focus()
        }
      }

      return { committed: false, emptyDrafts }
    }

    const nextRoleOptions = [...roleOptions]
    let nextAssignedRoleId: string | null = null

    filledDrafts.forEach((draftRole) => {
      const existingRole = nextRoleOptions.find((role) => role.label.toLowerCase() === draftRole.name.toLowerCase())

      if (existingRole) {
        nextAssignedRoleId = existingRole.id
        return
      }

      customRoleIdRef.current += 1

      const nextRole: AppRoleOption = {
        id: `custom-${customRoleIdRef.current}`,
        label: draftRole.name,
        tone: 'custom',
        color: draftRole.color,
      }

      nextRoleOptions.push(nextRole)
      nextAssignedRoleId = nextRole.id
    })

    setRoleOptions(nextRoleOptions)

    if (nextAssignedRoleId) {
      const assignedRoleId = nextAssignedRoleId

      setAssignedRoleIds((currentRoles) => ({ ...currentRoles, [userId]: assignedRoleId }))
    }

    if (clearDrafts) {
      setDraftRoleInputs([])
      setDraftRoleUserId(null)
      setActiveDraftRoleInputId(null)
    } else {
      setDraftRoleInputs(emptyDrafts)
      setActiveDraftRoleInputId(emptyDrafts.at(-1)?.id ?? null)
    }

    return { committed: true, emptyDrafts }
  }

  return (
    <section className="app-users-panel" aria-label="App users">
      <div className="app-users-panel__toolbar">
        <div className="app-users-panel__search-row">
          <SearchInput
            className="app-users-panel__search"
            size="md"
            placeholder="Search Users..."
            aria-label="Search users"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onClear={() => setSearchQuery('')}
          />
          <Badge className="app-users-panel__count" size="lg" shape="rounded" status="neutral">
            {userCountLabel}
          </Badge>
        </div>
        <Button
          type="button"
          className="app-users-panel__add"
          colorScheme="constructive"
          leftIcon={<Icon name="plus" category="general" size={16} />}
        >
          Add User
        </Button>
      </div>

      <div className="app-users-panel__table" role="table" aria-label="App users">
        <div className="app-users-panel__thead" role="rowgroup">
          <div className="app-users-panel__header-row" role="row">
            <div className="app-users-panel__th app-users-panel__th--user" role="columnheader">
              <span className="app-users-panel__checkbox" aria-hidden="true" />
              <span>User</span>
            </div>
            <div className="app-users-panel__th app-users-panel__th--role" role="columnheader">Role</div>
            <div className="app-users-panel__th app-users-panel__th--date" role="columnheader">Registration Date</div>
            <div className="app-users-panel__th app-users-panel__th--date" role="columnheader">Last Seen Date</div>
            <div className="app-users-panel__th app-users-panel__th--action" role="columnheader">Action</div>
          </div>
        </div>

        <div className="app-users-panel__tbody" role="rowgroup">
          {visibleUsers.map((user) => {
            const assignedRoleId = assignedRoleIds[user.id] ?? user.roleId
            const assignedRole = getAssignedRole(user, assignedRoleId, roleById)
            const isRoleSelected = selectedRoleUserId === user.id
            const roleMenuId = `${user.id}-role-menu`
            const roleModifier = assignedRole.tone
            const assignedRoleStyle = getRoleColorStyle(assignedRole.color)

            return (
              <div className={`app-users-panel__row${isRoleSelected ? ' app-users-panel__row--role-open' : ''}`} role="row" key={user.id}>
                <div className="app-users-panel__td app-users-panel__td--user" role="cell">
                  <span className="app-users-panel__checkbox app-users-panel__checkbox--light" aria-hidden="true" />
                  <span className="app-users-panel__avatar" aria-hidden="true">
                    <img src={user.avatarUrl} alt="" width="40" height="40" />
                  </span>
                  <span className="app-users-panel__identity">
                    <span className="app-users-panel__name">{user.name}</span>
                    <span className="app-users-panel__email">{user.email}</span>
                  </span>
                </div>
                <div className="app-users-panel__td app-users-panel__td--role" role="cell">
                  <div className="app-users-panel__role-control">
                    <button
                      type="button"
                      className={`app-users-panel__role-badge app-users-panel__role-badge--${roleModifier}${isRoleSelected ? ' app-users-panel__role-badge--selected' : ''}`}
                      style={assignedRoleStyle}
                      aria-controls={isRoleSelected ? roleMenuId : undefined}
                      aria-expanded={isRoleSelected}
                      aria-haspopup="menu"
                      aria-label={`Change role for ${user.name}`}
                      onClick={() => {
                        const shouldCloseMenu = selectedRoleUserId === user.id

                        if (shouldCloseMenu) {
                          if (draftRoleUserId === user.id) {
                            saveDraftRoles(user.id, { focusWhenEmpty: false })
                          } else {
                            setDraftRoleUserId(null)
                            setDraftRoleInputs([])
                            setActiveDraftRoleInputId(null)
                          }

                          setSelectedRoleUserId(null)
                          return
                        }

                        setSelectedRoleUserId(user.id)
                      }}
                    >
                      <span className="app-users-panel__role-badge-label">{assignedRole.label}</span>
                      <span className="app-users-panel__role-badge-icon" aria-hidden="true">
                        <Icon name={isRoleSelected ? 'chevron-up' : 'chevron-down'} category="arrows" size={16} />
                      </span>
                    </button>

                    {isRoleSelected && (
                      <div id={roleMenuId} className="app-users-panel__role-menu" role="menu" aria-label="Roles">
                        {roleOptions.map((roleOption) => {
                          const isAssignedRole = assignedRole.id === roleOption.id
                          const roleOptionStyle = getRoleColorStyle(roleOption.color)

                          return (
                            <div className="app-users-panel__role-menu-row" role="presentation" key={roleOption.id}>
                              <button
                                type="button"
                                className={`app-users-panel__role-menu-chip app-users-panel__role-menu-chip--${roleOption.tone}${isAssignedRole ? ' app-users-panel__role-menu-chip--selected' : ''}`}
                                style={roleOptionStyle}
                                role="menuitemradio"
                                aria-checked={isAssignedRole}
                                onClick={() => {
                                  if (draftRoleUserId === user.id) {
                                    saveDraftRoles(user.id, { focusWhenEmpty: false })
                                  }

                                  setAssignedRoleIds((currentRoles) => ({ ...currentRoles, [user.id]: roleOption.id }))
                                  setDraftRoleUserId(null)
                                  setDraftRoleInputs([])
                                  setActiveDraftRoleInputId(null)
                                }}
                              >
                                <span>{roleOption.label}</span>
                                {isAssignedRole && (
                                  <>
                                    <span className="app-users-panel__role-menu-chip-spacer" aria-hidden="true" />
                                    <Icon name="check" category="general" size={16} />
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                className={`app-users-panel__role-menu-icon app-users-panel__role-menu-icon--${roleOption.tone}`}
                                style={roleOptionStyle}
                                aria-label={`Change ${roleOption.label} role color`}
                              >
                                <Icon name="droplet-filled" category="editor" size={16} />
                              </button>
                              <button type="button" className="app-users-panel__role-menu-icon" aria-label={`${roleOption.label} role actions`}>
                                <Icon name="ellipsis-vertical" category="general" size={16} />
                              </button>
                            </div>
                          )
                        })}

                        {draftRoleUserId === user.id && (
                          draftRoleInputs.map((draftRole) => (
                            <div className="app-users-panel__role-menu-row" role="presentation" key={draftRole.id}>
                              <input
                                ref={(element) => {
                                  draftRoleInputRefs.current[draftRole.id] = element
                                }}
                                type="text"
                                className="app-users-panel__role-menu-input"
                                style={getRoleColorStyle(draftRole.color)}
                                aria-label="New role name"
                                value={draftRole.name}
                                onChange={(event) => {
                                  const nextName = event.target.value

                                  setDraftRoleInputs((currentDrafts) => currentDrafts.map((currentDraft) => (
                                    currentDraft.id === draftRole.id
                                      ? { ...currentDraft, name: nextName }
                                      : currentDraft
                                  )))
                                }}
                                onFocus={() => setActiveDraftRoleInputId(draftRole.id)}
                                onBlur={() => {
                                  if (draftRole.name.trim()) {
                                    saveDraftRoles(user.id, { clearDrafts: false, focusWhenEmpty: false })
                                  }
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault()
                                    saveDraftRoles(user.id)
                                  }

                                  if (event.key === 'Escape') {
                                    setDraftRoleInputs((currentDrafts) => {
                                      const nextDrafts = currentDrafts.filter((currentDraft) => currentDraft.id !== draftRole.id)

                                      if (!nextDrafts.length) {
                                        setDraftRoleUserId(null)
                                        setActiveDraftRoleInputId(null)
                                      } else {
                                        setActiveDraftRoleInputId(nextDrafts.at(-1)?.id ?? null)
                                      }

                                      return nextDrafts
                                    })
                                  }
                                }}
                              />
                              <button
                                type="button"
                                className="app-users-panel__role-menu-icon app-users-panel__role-menu-icon--custom"
                                style={getRoleColorStyle(draftRole.color)}
                                aria-label="Change new role color"
                              >
                                <Icon name="droplet-filled" category="editor" size={16} />
                              </button>
                              <button type="button" className="app-users-panel__role-menu-icon" aria-label="New role actions">
                                <Icon name="ellipsis-vertical" category="general" size={16} />
                              </button>
                            </div>
                          ))
                        )}

                        <span className="app-users-panel__role-menu-divider" aria-hidden="true" />

                        <Button
                          type="button"
                          className="app-users-panel__role-menu-add"
                          colorScheme="primary"
                          leftIcon={<Icon name="plus" category="general" size={20} />}
                          onMouseDown={(event) => {
                            if (draftRoleUserId === user.id && draftRoleInputs.some((draftRole) => draftRole.name.trim())) {
                              event.preventDefault()
                            }
                          }}
                          onClick={() => {
                            const { emptyDrafts } = draftRoleUserId === user.id
                              ? saveDraftRoles(user.id, { clearDrafts: false, focusWhenEmpty: false })
                              : { emptyDrafts: [] }
                            const lastDraftColor = emptyDrafts.at(-1)?.color ?? draftRoleInputs.at(-1)?.color
                            const nextDraftRole = createDraftRoleInput(lastDraftColor)

                            setSelectedRoleUserId(user.id)
                            setDraftRoleUserId(user.id)
                            setDraftRoleInputs([...emptyDrafts, nextDraftRole])
                            setActiveDraftRoleInputId(nextDraftRole.id)
                          }}
                        >
                          Add Role
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="app-users-panel__td app-users-panel__td--date" role="cell">
                  {user.registrationDate}
                </div>
                <div className="app-users-panel__td app-users-panel__td--date" role="cell">
                  {user.lastSeenDate}
                </div>
                <div className="app-users-panel__td app-users-panel__td--action" role="cell">
                  <button type="button" className="app-users-panel__action" aria-label={`Open actions for ${user.name}`}>
                    <Icon name="ellipsis-vertical" category="general" size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
