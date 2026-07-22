import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Badge, Button, Icon, SearchInput } from '@jf/design-system'
import { BasicPhonePreview } from '../components/BasicPhonePreview'
import { PanelHeader } from '../components/PanelHeader'
import { QuickPreview } from '../components/QuickPreview'
import { QuickSharePanel } from '../components/QuickSharePanel'
import { SideNav, type SideNavItem } from '../components/SideNav'
import { useCssVar } from '../hooks/useCssVar'
import { EMPTY_PRESET_ID } from '../presets/appPresets'
import ownerAvatar from '../assets/app-users/melis-platin.png'
import {
  DEFAULT_ROLE_OPTIONS,
  getRandomRoleColor,
  getRoleColorStyle,
  ROLE_COLOR_PALETTE,
  type AppRoleOption,
} from '../state/appUserRoles'
import type { DeepLinkTarget } from '../state/deepLinkTargets'
import { ALL_USERS_AUDIENCE_ID } from '../state/pushNotifications'
import {
  formatPushComposerText,
  formatPushNotificationTitle,
  PushNotificationPreview,
  PushPermissionRequestPreview,
  PushNotificationsPanel,
  type PushComposerFieldOption,
  type PushComposerFieldValues,
  type PushComposerSelectedImage,
  type PushNotificationHistoryItem,
} from './SettingsPage'

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
  {
    id: 'push-notifications',
    icon: 'mobile-bell',
    iconCategory: 'technology',
    title: 'PUSH NOTIFICATIONS',
    description: 'Send push notifications.',
    headerTitle: 'PUSH NOTIFICATION',
    headerDescription: 'Send messages to mobile, tablet, or desktop devices.',
    iconBg: 'var(--brand-yellow)',
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

interface AppUserRoleProfile {
  emailDomain: string
  roles: AppRoleOption[]
}

interface PublishAppIconState {
  variant: 'Icon' | 'Image'
  icon: string
  imageUrl: string | null
  imageName: string | null
}

type PresetUserGender = 'female' | 'male'

interface PresetUserProfile {
  name: string
  gender: PresetUserGender
}

const TABLE_DATE = 'May 22, 2026'
const PRESET_APP_USER_COUNT = 60
const PUSH_PERMISSION_REQUEST_DEFAULT_TITLE = 'Stay updated!'
const PUSH_PERMISSION_REQUEST_DEFAULT_CONTENT = 'Allow app notifications to get the latest news, updates, and exclusive offers delivered directly to your device.'
const PUSH_PERMISSION_REQUEST_CONTENT_MAX_LENGTH = 400

const OWNER_USER: AppUser = {
  id: 'app-owner',
  name: 'Melis Platin',
  email: 'melisplatin@jotform.com',
  roleId: 'admin',
  registrationDate: TABLE_DATE,
  lastSeenDate: TABLE_DATE,
  avatarUrl: ownerAvatar,
}

function getPresetUserAvatarUrl(gender: PresetUserGender, genderIndex: number) {
  const avatarId = (genderIndex * 37 + (gender === 'female' ? 11 : 7)) % 100
  const directory = gender === 'female' ? 'women' : 'men'

  return `https://randomuser.me/api/portraits/${directory}/${avatarId}.jpg`
}

const PRESET_USER_PROFILES: PresetUserProfile[] = [
  { name: 'Allison Passaquindici Arcand', gender: 'female' },
  { name: 'Kaylynn Levin', gender: 'female' },
  { name: 'Terry Workman', gender: 'male' },
  { name: 'Anika Geidt', gender: 'female' },
  { name: 'Rayna Saris', gender: 'female' },
  { name: 'Cristofer Siphron', gender: 'male' },
  { name: 'Giana Geidt', gender: 'female' },
  { name: 'Martin Westervelt', gender: 'male' },
  { name: 'Haylie Saris', gender: 'female' },
  { name: 'Emery Vetrovs', gender: 'female' },
  { name: 'Alfonso Rosser', gender: 'male' },
  { name: 'Jakob Septimus', gender: 'male' },
  { name: 'Rayna Botosh', gender: 'female' },
  { name: 'Paityn Ekstrom Bothman', gender: 'female' },
  { name: 'Busra Yildirim', gender: 'female' },
  { name: 'Cihat Salik', gender: 'male' },
  { name: 'Erdem Erol', gender: 'male' },
  { name: 'Fatih Salgir', gender: 'male' },
  { name: 'Mithat Turan', gender: 'male' },
  { name: 'Mustafa Oger', gender: 'male' },
  { name: 'Ava Thompson', gender: 'female' },
  { name: 'Noah Bennett', gender: 'male' },
  { name: 'Mia Carter', gender: 'female' },
  { name: 'Liam Brooks', gender: 'male' },
  { name: 'Sofia Martinez', gender: 'female' },
  { name: 'Ethan Walker', gender: 'male' },
  { name: 'Isabella Reed', gender: 'female' },
  { name: 'Lucas Morgan', gender: 'male' },
  { name: 'Amelia Parker', gender: 'female' },
  { name: 'Mason Hughes', gender: 'male' },
  { name: 'Harper Collins', gender: 'female' },
  { name: 'Logan Rivera', gender: 'male' },
  { name: 'Evelyn Foster', gender: 'female' },
  { name: 'Jackson Hayes', gender: 'male' },
  { name: 'Charlotte Price', gender: 'female' },
  { name: 'Aiden Cooper', gender: 'male' },
  { name: 'Abigail Turner', gender: 'female' },
  { name: 'Sebastian Ward', gender: 'male' },
  { name: 'Ella Simmons', gender: 'female' },
  { name: 'Henry Russell', gender: 'male' },
  { name: 'Grace Peterson', gender: 'female' },
  { name: 'Daniel Bryant', gender: 'male' },
  { name: 'Scarlett Bell', gender: 'female' },
  { name: 'Matthew Griffin', gender: 'male' },
  { name: 'Victoria Brooks', gender: 'female' },
  { name: 'Owen Murphy', gender: 'male' },
  { name: 'Lily Sanders', gender: 'female' },
  { name: 'Wyatt Coleman', gender: 'male' },
  { name: 'Chloe Jenkins', gender: 'female' },
  { name: 'Leo Ramirez', gender: 'male' },
  { name: 'Nora Watson', gender: 'female' },
  { name: 'Julian Fisher', gender: 'male' },
  { name: 'Zoey Patterson', gender: 'female' },
  { name: 'Caleb Henderson', gender: 'male' },
  { name: 'Hannah Kim', gender: 'female' },
  { name: 'Miles Bailey', gender: 'male' },
  { name: 'Leah Bennett', gender: 'female' },
  { name: 'Nathan Ross', gender: 'male' },
  { name: 'Aurora Hughes', gender: 'female' },
]

const PRESET_TABLE_DATES = [
  'May 22, 2026',
  'May 21, 2026',
  'May 20, 2026',
  'May 18, 2026',
  'May 16, 2026',
  'May 14, 2026',
  'May 12, 2026',
  'May 10, 2026',
  'May 8, 2026',
  'May 6, 2026',
  'May 4, 2026',
  'May 2, 2026',
]

const role = (id: string, label: string, colorIndex: number, tone: AppRoleOption['tone'] = 'custom'): AppRoleOption => ({
  id,
  label,
  tone,
  color: ROLE_COLOR_PALETTE[colorIndex] ?? ROLE_COLOR_PALETTE[0],
})

const EMPTY_APP_ROLE_OPTIONS = [
  { ...DEFAULT_ROLE_OPTIONS[0] },
  { ...DEFAULT_ROLE_OPTIONS.find((roleOption) => roleOption.id === 'user')! },
]

const APP_USERS_INVITE_LINK = 'https://app.jotform.com/252042991035958'

const DEFAULT_PRESET_ROLE_PROFILE: AppUserRoleProfile = {
  emailDomain: 'appusers.test',
  roles: [
    role('admin', 'Admin', 0, 'admin'),
    role('manager', 'Manager', 17),
    role('staff', 'Staff', 2),
    role('member', 'Member', 19, 'user'),
    role('customer', 'Customer', 18),
    role('guest', 'Guest', 3),
  ],
}

const APP_USER_ROLE_PROFILES: Record<string, AppUserRoleProfile> = {
  'gym-club': {
    emailDomain: 'ironpulse.app',
    roles: [
      role('admin', 'Admin', 0, 'admin'),
      role('trainer', 'Trainer', 17),
      role('member', 'Member', 19, 'user'),
      role('class-instructor', 'Class Instructor', 2),
      role('front-desk', 'Front Desk', 3),
      role('nutrition-coach', 'Nutrition Coach', 18),
    ],
  },
  'camp-registration': {
    emailDomain: 'camppinecrest.app',
    roles: [
      role('admin', 'Admin', 0, 'admin'),
      role('program-director', 'Program Director', 17),
      role('counselor', 'Counselor', 2),
      role('parent', 'Parent', 19, 'user'),
      role('camper', 'Camper', 18),
      role('health-staff', 'Health Staff', 3),
    ],
  },
  education: {
    emailDomain: 'academy.app',
    roles: [
      role('admin', 'Admin', 0, 'admin'),
      role('teacher', 'Teacher', 2),
      role('student', 'Student', 17, 'user'),
      role('parent', 'Parent', 19),
      role('coordinator', 'Coordinator', 3),
      role('counselor', 'Counselor', 18),
    ],
  },
  healthcare: {
    emailDomain: 'care.app',
    roles: [
      role('admin', 'Admin', 0, 'admin'),
      role('doctor', 'Doctor', 17),
      role('nurse', 'Nurse', 2),
      role('patient', 'Patient', 19, 'user'),
      role('care-coordinator', 'Care Coordinator', 18),
      role('billing', 'Billing', 3),
    ],
  },
  'online-store': {
    emailDomain: 'store.app',
    roles: [
      role('admin', 'Admin', 0, 'admin'),
      role('store-manager', 'Store Manager', 17),
      role('staff', 'Staff', 2),
      role('customer', 'Customer', 19, 'user'),
      role('supplier', 'Supplier', 18),
      role('support', 'Support', 3),
    ],
  },
  'student-management': {
    emailDomain: 'school.app',
    roles: [
      role('admin', 'Admin', 0, 'admin'),
      role('teacher', 'Teacher', 2),
      role('student', 'Student', 17, 'user'),
      role('parent', 'Parent', 19),
      role('registrar', 'Registrar', 3),
      role('advisor', 'Advisor', 18),
    ],
  },
  'coffee-shop': {
    emailDomain: 'coffee.app',
    roles: [
      role('admin', 'Admin', 0, 'admin'),
      role('store-manager', 'Store Manager', 17),
      role('barista', 'Barista', 2),
      role('customer', 'Customer', 19, 'user'),
      role('supplier', 'Supplier', 18),
      role('delivery', 'Delivery', 3),
    ],
  },
  'beverage-shop': {
    emailDomain: 'beverage.app',
    roles: [
      role('admin', 'Admin', 0, 'admin'),
      role('store-manager', 'Store Manager', 17),
      role('staff', 'Staff', 2),
      role('customer', 'Customer', 19, 'user'),
      role('vendor', 'Vendor', 18),
      role('support', 'Support', 3),
    ],
  },
  'landing-hero': {
    emailDomain: 'launch.app',
    roles: [
      role('admin', 'Admin', 0, 'admin'),
      role('editor', 'Editor', 17),
      role('contributor', 'Contributor', 2),
      role('subscriber', 'Subscriber', 19, 'user'),
      role('reviewer', 'Reviewer', 18),
      role('guest', 'Guest', 3),
    ],
  },
  'landing-storefront': {
    emailDomain: 'storefront.app',
    roles: [
      role('admin', 'Admin', 0, 'admin'),
      role('store-manager', 'Store Manager', 17),
      role('staff', 'Staff', 2),
      role('customer', 'Customer', 19, 'user'),
      role('supplier', 'Supplier', 18),
      role('support', 'Support', 3),
    ],
  },
  'landing-registration': {
    emailDomain: 'event.app',
    roles: [
      role('admin', 'Admin', 0, 'admin'),
      role('organizer', 'Organizer', 17),
      role('attendee', 'Attendee', 19, 'user'),
      role('volunteer', 'Volunteer', 2),
      role('speaker', 'Speaker', 18),
      role('sponsor', 'Sponsor', 3),
    ],
  },
  'landing-editorial': {
    emailDomain: 'editorial.app',
    roles: [
      role('admin', 'Admin', 0, 'admin'),
      role('editor', 'Editor', 17),
      role('writer', 'Writer', 2),
      role('subscriber', 'Subscriber', 19, 'user'),
      role('reviewer', 'Reviewer', 18),
      role('guest', 'Guest', 3),
    ],
  },
  'landing-saas': {
    emailDomain: 'saas.app',
    roles: [
      role('admin', 'Admin', 0, 'admin'),
      role('sales', 'Sales', 17),
      role('customer-success', 'Customer Success', 2),
      role('viewer', 'Viewer', 19, 'user'),
      role('partner', 'Partner', 18),
      role('support', 'Support', 3),
    ],
  },
  'landing-b2b': {
    emailDomain: 'b2b.app',
    roles: [
      role('admin', 'Admin', 0, 'admin'),
      role('sales', 'Sales', 17),
      role('customer-success', 'Customer Success', 2),
      role('viewer', 'Viewer', 19, 'user'),
      role('partner', 'Partner', 18),
      role('support', 'Support', 3),
    ],
  },
  'landing-club': {
    emailDomain: 'club.app',
    roles: [
      role('admin', 'Admin', 0, 'admin'),
      role('club-manager', 'Club Manager', 17),
      role('member', 'Member', 19, 'user'),
      role('coach', 'Coach', 2),
      role('event-staff', 'Event Staff', 18),
      role('guest', 'Guest', 3),
    ],
  },
}

function getRoleProfileForPreset(presetId: string): AppUserRoleProfile {
  return APP_USER_ROLE_PROFILES[presetId] ?? DEFAULT_PRESET_ROLE_PROFILE
}

function cloneRoleOptions(roles: AppRoleOption[]): AppRoleOption[] {
  return roles.map((roleOption) => ({ ...roleOption }))
}

function slugifyUserName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/(^\.|\.$)/g, '')
}

function buildPresetAppUsers(presetId: string): AppUser[] {
  const profile = getRoleProfileForPreset(presetId)
  const assignableRoles = profile.roles.slice(1)
  const users: AppUser[] = [{ ...OWNER_USER }]
  const avatarIndexesByGender: Record<PresetUserGender, number> = { female: 0, male: 0 }

  for (let index = 0; users.length < PRESET_APP_USER_COUNT; index += 1) {
    const userProfile = PRESET_USER_PROFILES[index % PRESET_USER_PROFILES.length] ?? {
      name: `App User ${index + 1}`,
      gender: index % 2 === 0 ? 'female' : 'male',
    }
    const { gender, name } = userProfile
    const genderAvatarIndex = avatarIndexesByGender[gender]
    const slug = slugifyUserName(name)
    const assignedRole = assignableRoles.length > 0
      ? assignableRoles[index % assignableRoles.length]
      : profile.roles[0]
    const registrationDate = PRESET_TABLE_DATES[index % PRESET_TABLE_DATES.length] ?? TABLE_DATE
    const lastSeenDate = PRESET_TABLE_DATES[(index + 3) % PRESET_TABLE_DATES.length] ?? TABLE_DATE

    avatarIndexesByGender[gender] += 1

    users.push({
      id: `${slug}-${index + 1}`,
      name,
      email: `${slug}@${profile.emailDomain}`,
      roleId: assignedRole?.id ?? 'admin',
      registrationDate,
      lastSeenDate,
      avatarUrl: getPresetUserAvatarUrl(gender, genderAvatarIndex),
    })
  }

  return users
}

export function getAppUsersForPreset(presetId: string): AppUser[] {
  if (presetId === EMPTY_PRESET_ID) return [{ ...OWNER_USER }]
  return buildPresetAppUsers(presetId)
}

export function getAppUserRoleUserCountsForPreset(presetId: string): Record<string, number> {
  return getAppUsersForPreset(presetId).reduce<Record<string, number>>((counts, user) => {
    counts[user.roleId] = (counts[user.roleId] ?? 0) + 1
    return counts
  }, {})
}

export function getAppUserRoleOptionsForPreset(presetId: string): AppRoleOption[] {
  if (presetId === EMPTY_PRESET_ID) return cloneRoleOptions(EMPTY_APP_ROLE_OPTIONS)
  return cloneRoleOptions(getRoleProfileForPreset(presetId).roles)
}

export function getAppUserTableRoleIdsForPreset(presetId: string): string[] {
  return Array.from(new Set(getAppUsersForPreset(presetId).map((user) => user.roleId)))
}

export function getAppUserNameFieldValueForPreset(presetId: string): string {
  return getAppUsersForPreset(presetId)[0]?.name.trim().split(/\s+/)[0] ?? 'User'
}

function getAssignedRole(user: AppUser, assignedRoleId: string, roleById: Map<string, AppRoleOption>) {
  const assignedRole = roleById.get(assignedRoleId) ?? DEFAULT_ROLE_OPTIONS[0]

  if (assignedRoleId === user.roleId && user.roleColor) {
    return { ...assignedRole, color: user.roleColor }
  }

  return assignedRole
}

interface PublishPageProps {
  presetId: string
  roleOptions: AppRoleOption[]
  appUserRoles: AppRoleOption[]
  setRoleOptions: Dispatch<SetStateAction<AppRoleOption[]>>
  onAppUserTableRoleIdsChange?: (roleIds: string[]) => void
  onAppUserRoleUserCountsChange?: (counts: Record<string, number>) => void
  appIcon: PublishAppIconState
  deepLinkTargets: DeepLinkTarget[]
  pushNotificationHistoryItems: PushNotificationHistoryItem[]
  onPushNotificationHistoryItemCreate: (item: PushNotificationHistoryItem) => void
  onPushNotificationHistoryItemUpdate: (item: PushNotificationHistoryItem) => void
  onPushNotificationHistoryItemDelete: (itemId: string) => void
  pushComposerFieldValues?: PushComposerFieldValues
}

export function PublishPage({
  presetId,
  roleOptions,
  appUserRoles,
  setRoleOptions,
  onAppUserTableRoleIdsChange,
  onAppUserRoleUserCountsChange,
  appIcon,
  deepLinkTargets,
  pushNotificationHistoryItems,
  onPushNotificationHistoryItemCreate,
  onPushNotificationHistoryItemUpdate,
  onPushNotificationHistoryItemDelete,
  pushComposerFieldValues = {},
}: PublishPageProps) {
  const [activeId, setActiveId] = useState('quick-share')
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationTitleFields, setNotificationTitleFields] = useState<PushComposerFieldOption[]>([])
  const [notificationTitleSuffix, setNotificationTitleSuffix] = useState('')
  const [notificationContent, setNotificationContent] = useState('')
  const [notificationContentFields, setNotificationContentFields] = useState<PushComposerFieldOption[]>([])
  const [notificationContentSuffix, setNotificationContentSuffix] = useState('')
  const [notificationAudience, setNotificationAudience] = useState<string[]>([ALL_USERS_AUDIENCE_ID])
  const [notificationDeepLink, setNotificationDeepLink] = useState('')
  const [notificationImage, setNotificationImage] = useState<PushComposerSelectedImage | null>(null)
  const [arePushNotificationsDisabled, setArePushNotificationsDisabled] = useState(false)
  const [isPushInitialOverview, setIsPushInitialOverview] = useState(false)
  const [canReturnToPushHistory, setCanReturnToPushHistory] = useState(false)
  const [isPushScheduleComposer, setIsPushScheduleComposer] = useState(false)
  const [pushHistoryReturnRequestId, setPushHistoryReturnRequestId] = useState(0)
  const [isPermissionRequestModalOpen, setIsPermissionRequestModalOpen] = useState(false)
  const [permissionRequestTitle, setPermissionRequestTitle] = useState(PUSH_PERMISSION_REQUEST_DEFAULT_TITLE)
  const [permissionRequestContent, setPermissionRequestContent] = useState(PUSH_PERMISSION_REQUEST_DEFAULT_CONTENT)
  const [permissionRequestPreviewTitle, setPermissionRequestPreviewTitle] = useState(PUSH_PERMISSION_REQUEST_DEFAULT_TITLE)
  const [permissionRequestPreviewContent, setPermissionRequestPreviewContent] = useState(PUSH_PERMISSION_REQUEST_DEFAULT_CONTENT)
  const [brandColor] = useCssVar('--fg-brand', '#7D38EF')
  const [inverseColor] = useCssVar('--fg-inverse', '#FFFFFF')
  const active = NAV_ITEMS.find((item) => item.id === activeId) ?? NAV_ITEMS[0]
  const isPushNotificationsOpen = activeId === 'push-notifications'
  const isFigmaPushInitial = isPushNotificationsOpen && isPushInitialOverview
  const isPushComposerOpen = isPushNotificationsOpen && canReturnToPushHistory
  const isPushScheduleOpen = isPushNotificationsOpen && isPushScheduleComposer
  const canReturnFromPushOverview = isFigmaPushInitial && pushNotificationHistoryItems.length > 0
  const usesFigmaPushComposerLayout = isPushComposerOpen
  const usesFigmaPushLayout = isPushNotificationsOpen
  const shouldShowPushPreview = isPushNotificationsOpen && !arePushNotificationsDisabled && !isFigmaPushInitial
  const pushNotificationIconStyle = 'flat'
  const previewNotificationTitle = formatPushNotificationTitle(
    notificationTitle,
    notificationTitleFields,
    notificationTitleSuffix,
    pushComposerFieldValues,
  )
  const previewNotificationContent = formatPushComposerText(
    notificationContent,
    notificationContentFields,
    notificationContentSuffix,
    pushComposerFieldValues,
  )
  const shouldShowPreview = shouldShowPushPreview || isPermissionRequestModalOpen

  const handleNavigationChange = (nextId: string) => {
    setIsPushInitialOverview(nextId === 'push-notifications' && pushNotificationHistoryItems.length === 0)
    setIsPushScheduleComposer(false)
    setActiveId(nextId)
  }

  return (
    <div className={`publish-page${shouldShowPreview ? ' publish-page--with-preview' : ''}${usesFigmaPushLayout ? ' publish-page--figma-push' : ''}${isFigmaPushInitial ? ' publish-page--figma-push-initial' : ''}${usesFigmaPushComposerLayout ? ' publish-page--figma-push-composer' : ''}`}>
      <SideNav
        items={NAV_ITEMS}
        activeId={activeId}
        onChange={handleNavigationChange}
        className="side-nav--publish-figma"
      />
      <main className="publish-page__content">
        <div className="publish-page__main">
          {isPermissionRequestModalOpen ? (
            <PushPermissionMessageEditor
              title={permissionRequestTitle}
              content={permissionRequestContent}
              onPreviewChange={(nextTitle, nextContent) => {
                setPermissionRequestPreviewTitle(nextTitle)
                setPermissionRequestPreviewContent(nextContent)
              }}
              onBack={() => setIsPermissionRequestModalOpen(false)}
              onSave={(nextTitle, nextContent) => {
                setPermissionRequestTitle(nextTitle)
                setPermissionRequestContent(nextContent)
                setIsPermissionRequestModalOpen(false)
              }}
            />
          ) : (
            <>
              <PanelHeader
                icon={isPushScheduleOpen ? 'calendar-event' : isPushComposerOpen ? 'paper-plane-diagonal-filled' : active.icon}
                iconCategory={isPushScheduleOpen ? 'time-date' : isPushComposerOpen ? 'communication' : active.iconCategory}
                title={isPushScheduleOpen ? 'SCHEDULE NOTIFICATION' : isPushComposerOpen ? 'SEND NOTIFICATION' : active.headerTitle ?? active.title}
                description={isPushScheduleOpen ? 'Choose when to send your notification.' : isPushComposerOpen ? 'Create and send a notification now.' : active.headerDescription ?? active.description}
                iconBg={isPushScheduleOpen ? 'var(--purple-400)' : isPushComposerOpen ? 'var(--success-default)' : active.iconBg}
                iconSize={isFigmaPushInitial || isPushComposerOpen ? 24 : undefined}
                leading={isPushComposerOpen || canReturnFromPushOverview ? (
                  <button
                    type="button"
                    className="panel-header__back-button"
                    aria-label="Back to push notifications"
                    onClick={() => setPushHistoryReturnRequestId((requestId) => requestId + 1)}
                  >
                    <Icon name="chevron-left" category="arrows" size={24} />
                  </button>
                ) : undefined}
              />
              {activeId === 'quick-share' && <QuickSharePanel />}
              {activeId === 'app-users' && (
                <AppUsersPanel
                  presetId={presetId}
                  roleOptions={roleOptions}
                  setRoleOptions={setRoleOptions}
                  onAppUserTableRoleIdsChange={onAppUserTableRoleIdsChange}
                  onAppUserRoleUserCountsChange={onAppUserRoleUserCountsChange}
                />
              )}
              {isPushNotificationsOpen && (
                <PushNotificationsPanel
                  appUserRoles={appUserRoles}
                  deepLinkTargets={deepLinkTargets}
                  appIconVariant={appIcon.variant}
                  appIconImageUrl={appIcon.imageUrl}
                  appIconName={appIcon.icon}
                  appIconColor={inverseColor}
                  appIconBg={brandColor}
                  appIconStyle={pushNotificationIconStyle}
                  historyItems={pushNotificationHistoryItems}
                  onHistoryItemCreate={onPushNotificationHistoryItemCreate}
                  onHistoryItemUpdate={onPushNotificationHistoryItemUpdate}
                  onHistoryItemDelete={onPushNotificationHistoryItemDelete}
                  fieldValues={pushComposerFieldValues}
                  notificationTitle={notificationTitle}
                  setNotificationTitle={setNotificationTitle}
                  notificationTitleFields={notificationTitleFields}
                  setNotificationTitleFields={setNotificationTitleFields}
                  notificationTitleSuffix={notificationTitleSuffix}
                  setNotificationTitleSuffix={setNotificationTitleSuffix}
                  notificationContent={notificationContent}
                  setNotificationContent={setNotificationContent}
                  notificationContentFields={notificationContentFields}
                  setNotificationContentFields={setNotificationContentFields}
                  notificationContentSuffix={notificationContentSuffix}
                  setNotificationContentSuffix={setNotificationContentSuffix}
                  audience={notificationAudience}
                  setAudience={setNotificationAudience}
                  deepLink={notificationDeepLink}
                  setDeepLink={setNotificationDeepLink}
                  notificationImage={notificationImage}
                  setNotificationImage={setNotificationImage}
                  isDisabled={arePushNotificationsDisabled}
                  onDisable={() => setArePushNotificationsDisabled(true)}
                  onEnable={() => setArePushNotificationsDisabled(false)}
                  onPermissionMessageEdit={() => {
                    setPermissionRequestPreviewTitle(permissionRequestTitle)
                    setPermissionRequestPreviewContent(permissionRequestContent)
                    setIsPermissionRequestModalOpen(true)
                  }}
                  onCanReturnToHistoryChange={setCanReturnToPushHistory}
                  onInitialOverviewChange={setIsPushInitialOverview}
                  onScheduleComposerChange={setIsPushScheduleComposer}
                  returnToHistoryRequestId={pushHistoryReturnRequestId}
                  isPublishComposer
                />
              )}
            </>
          )}
        </div>
        {shouldShowPreview && (
          <div className="publish-page__preview">
            <QuickPreview>
              <BasicPhonePreview>
                {isPermissionRequestModalOpen ? (
                  <PushPermissionRequestPreview
                    title={permissionRequestPreviewTitle}
                    content={permissionRequestPreviewContent}
                  />
                ) : (
                  <PushNotificationPreview
                    title={previewNotificationTitle}
                    content={previewNotificationContent}
                    image={notificationImage}
                    appIconVariant={appIcon.variant}
                    appIconImageUrl={appIcon.imageUrl}
                    appIconName={appIcon.icon}
                    appIconColor={inverseColor}
                    appIconBg={brandColor}
                    appIconStyle={pushNotificationIconStyle}
                  />
                )}
              </BasicPhonePreview>
            </QuickPreview>
          </div>
        )}
      </main>
    </div>
  )
}

interface PushPermissionMessageEditorProps {
  title: string
  content: string
  onPreviewChange: (title: string, content: string) => void
  onBack: () => void
  onSave: (title: string, content: string) => void
}

function PushPermissionMessageEditor({ title, content, onPreviewChange, onBack, onSave }: PushPermissionMessageEditorProps) {
  const [draftTitle, setDraftTitle] = useState(title)
  const [draftContent, setDraftContent] = useState(content)
  const isSaveDisabled = draftTitle.trim().length === 0 || draftContent.trim().length === 0

  return (
    <>
      <PanelHeader
        icon="message-ellipsis-pencil-filled"
        iconCategory="communication"
        title="EDIT PERMISSION MESSAGE"
        description="This message will invite users to opt into receiving notifications from your app."
        iconBg="var(--purple-400)"
        leading={(
          <button
            type="button"
            className="panel-header__back-button"
            aria-label="Back to push notification composer"
            onClick={onBack}
          >
            <Icon name="chevron-left" category="arrows" size={24} />
          </button>
        )}
      />
      <section className="push-permission-editor" aria-label="Edit permission message">
        <label className="push-permission-editor__field" htmlFor="push-permission-request-title">
          <span className="push-permission-editor__label-block">
            <span className="push-permission-editor__label">
              <span>Title</span>
              <span className="push-permission-editor__required">*</span>
            </span>
            <span className="push-permission-editor__description">Enter a short, descriptive title for your message.</span>
          </span>
          <input
            id="push-permission-request-title"
            className="push-permission-editor__input"
            value={draftTitle}
            onChange={(event) => {
              const nextTitle = event.currentTarget.value
              setDraftTitle(nextTitle)
              onPreviewChange(nextTitle, draftContent)
            }}
          />
        </label>

        <label className="push-permission-editor__field" htmlFor="push-permission-request-content">
          <span className="push-permission-editor__label-block">
            <span className="push-permission-editor__label">
              <span>Content</span>
              <span className="push-permission-editor__required">*</span>
            </span>
            <span className="push-permission-editor__description">Invite users to opt into receiving notifications from your app.</span>
          </span>
          <span className="push-permission-editor__textarea-control">
            <textarea
              id="push-permission-request-content"
              className="push-permission-editor__textarea"
              value={draftContent}
              maxLength={PUSH_PERMISSION_REQUEST_CONTENT_MAX_LENGTH}
              onChange={(event) => {
                const nextContent = event.currentTarget.value
                setDraftContent(nextContent)
                onPreviewChange(draftTitle, nextContent)
              }}
            />
            <span className="push-permission-editor__count" aria-live="polite">
              <span>{draftContent.length}</span>
              <span>/</span>
              <span>{PUSH_PERMISSION_REQUEST_CONTENT_MAX_LENGTH}</span>
            </span>
          </span>
        </label>
      </section>
      <div className="push-permission-editor__actions">
        <Button
          colorScheme="constructive"
          disabled={isSaveDisabled}
          onClick={() => {
            if (!isSaveDisabled) onSave(draftTitle, draftContent)
          }}
        >
          SAVE
        </Button>
      </div>
    </>
  )
}

interface AppUsersPanelProps {
  presetId: string
  roleOptions: AppRoleOption[]
  setRoleOptions: Dispatch<SetStateAction<AppRoleOption[]>>
  onAppUserTableRoleIdsChange?: (roleIds: string[]) => void
  onAppUserRoleUserCountsChange?: (counts: Record<string, number>) => void
}

interface AddUserModalProps {
  onClose: () => void
  roleOptions: AppRoleOption[]
}

function AddUserModal({ onClose, roleOptions }: AddUserModalProps) {
  const modalRef = useRef<HTMLElement | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const invitationRoleOptions = roleOptions.length > 0 ? roleOptions : [DEFAULT_ROLE_OPTIONS[0]]
  const defaultInvitationRoleId = invitationRoleOptions.find((roleOption) => roleOption.tone === 'user')?.id
    ?? invitationRoleOptions[0].id
  const [activeInvitationTab, setActiveInvitationTab] = useState<'email' | 'link'>('email')
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false)
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false)
  const [invitationEmailValue, setInvitationEmailValue] = useState('')
  const [selectedInvitationRoleId, setSelectedInvitationRoleId] = useState(defaultInvitationRoleId)
  const selectedInvitationRole = invitationRoleOptions.find((roleOption) => roleOption.id === selectedInvitationRoleId)
    ?? invitationRoleOptions[0]
  const hasInvitationEmail = invitationEmailValue.trim().length > 0
  const isInviteByLinkActive = activeInvitationTab === 'link'
  const roleMenuId = 'app-users-add-modal-role-menu'
  const emailTabId = 'app-users-add-modal-email-tab'
  const linkTabId = 'app-users-add-modal-link-tab'
  const emailPanelId = 'app-users-add-modal-email-panel'
  const linkPanelId = 'app-users-add-modal-link-panel'

  useEffect(() => {
    modalRef.current?.focus({ preventScroll: true })

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isRoleMenuOpen) {
          setIsRoleMenuOpen(false)
          return
        }

        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isRoleMenuOpen, onClose])

  useEffect(() => {
    if (!invitationRoleOptions.some((roleOption) => roleOption.id === selectedInvitationRoleId)) {
      setSelectedInvitationRoleId(defaultInvitationRoleId)
    }
  }, [defaultInvitationRoleId, invitationRoleOptions, selectedInvitationRoleId])

  return createPortal(
    <div
      className="app-users-add-modal__backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        ref={modalRef}
        className={[
          'app-users-add-modal',
          isInviteByLinkActive && 'app-users-add-modal--link-active',
          !isInviteByLinkActive && isEmailComposerOpen && 'app-users-add-modal--email-composer-open',
        ].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-users-add-modal-title"
        tabIndex={-1}
      >
        <header className="app-users-add-modal__header">
          <div className="app-users-add-modal__header-main">
            <span className="app-users-add-modal__icon" aria-hidden="true">
              <Icon name="user-plus-filled" category="users" size={24} />
            </span>
            <div className="app-users-add-modal__heading">
              <h2 id="app-users-add-modal-title">Add New User</h2>
              <p>User will have access to this app.</p>
            </div>
          </div>
          <button type="button" className="app-users-add-modal__close" aria-label="Close add user modal" onClick={onClose}>
            <Icon name="xmark" category="general" size={20} />
          </button>
        </header>

        <div className="app-users-add-modal__tabs" role="tablist" aria-label="Invitation method">
          <button
            id={emailTabId}
            type="button"
            className={`app-users-add-modal__tab${!isInviteByLinkActive ? ' app-users-add-modal__tab--active' : ''}`}
            role="tab"
            aria-selected={!isInviteByLinkActive}
            aria-controls={emailPanelId}
            onClick={() => {
              setActiveInvitationTab('email')
              setIsRoleMenuOpen(false)
            }}
          >
            INVITE BY EMAIL
          </button>
          <button
            id={linkTabId}
            type="button"
            className={`app-users-add-modal__tab${isInviteByLinkActive ? ' app-users-add-modal__tab--active' : ''}`}
            role="tab"
            aria-selected={isInviteByLinkActive}
            aria-controls={linkPanelId}
            onClick={() => {
              setActiveInvitationTab('link')
              setIsRoleMenuOpen(false)
            }}
          >
            INVITE BY LINK
          </button>
        </div>

        {isInviteByLinkActive ? (
          <div
            id={linkPanelId}
            className="app-users-add-modal__body app-users-add-modal__body--link"
            role="tabpanel"
            aria-labelledby={linkTabId}
          >
            <div className="app-users-add-modal__link-share">
              <label className="app-users-add-modal__label" htmlFor="app-users-add-link">
                LINK TO SHARE
              </label>
              <div className="app-users-add-modal__link-row">
                <div className="app-users-add-modal__link-field">
                  <Icon name="link-diagonal" category="general" size={24} />
                  <input
                    id="app-users-add-link"
                    className="app-users-add-modal__link-input"
                    type="text"
                    readOnly
                    value={APP_USERS_INVITE_LINK}
                    aria-label="Link to share"
                  />
                </div>
                <button
                  type="button"
                  className="app-users-add-modal__copy-link"
                  onClick={() => {
                    void navigator.clipboard?.writeText(APP_USERS_INVITE_LINK)
                  }}
                >
                  COPY LINK
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            id={emailPanelId}
            className="app-users-add-modal__body"
            role="tabpanel"
            aria-labelledby={emailTabId}
          >
            <div className="app-users-add-modal__field-head">
              <label className="app-users-add-modal__label" htmlFor="app-users-add-email">
                EMAIL ADDRESSES
              </label>
              <button type="button" className="app-users-add-modal__upload" aria-label="Upload email addresses">
                <Icon name="arrow-up-from-bracket" category="arrows" size={16} />
              </button>
            </div>

            <div
              className={`app-users-add-modal__input-shell${isEmailComposerOpen ? ' app-users-add-modal__input-shell--composer' : ''}`}
              onClick={() => {
                setIsEmailComposerOpen(true)
                setIsRoleMenuOpen(false)
                emailInputRef.current?.focus()
              }}
            >
              <Icon name="envelope-closed-filled" category="communication" size={24} />
              <span className="app-users-add-modal__input-prefix">To:</span>
              <input
                ref={emailInputRef}
                id="app-users-add-email"
                className="app-users-add-modal__input"
                type="text"
                aria-label="Email addresses"
                value={invitationEmailValue}
                placeholder="Enter email addresses to send invitation."
                onChange={(event) => setInvitationEmailValue(event.target.value)}
                onFocus={() => setIsEmailComposerOpen(true)}
              />
              {isEmailComposerOpen && (
                <div className="app-users-add-modal__role-control">
                  <button
                    type="button"
                    className="app-users-add-modal__role-select"
                    aria-controls={isRoleMenuOpen ? roleMenuId : undefined}
                    aria-expanded={isRoleMenuOpen}
                    aria-haspopup="menu"
                    aria-label="Select invitation role"
                    onClick={(event) => {
                      event.stopPropagation()
                      setIsRoleMenuOpen((isOpen) => !isOpen)
                    }}
                  >
                    <span>{`Role: ${selectedInvitationRole.label}`}</span>
                    <Icon name="chevron-down" category="arrows" size={16} />
                  </button>

                  {isRoleMenuOpen && (
                    <div id={roleMenuId} className="app-users-add-modal__role-menu" role="menu" aria-label="Roles">
                      {invitationRoleOptions.map((roleOption) => {
                        const isSelectedRole = roleOption.id === selectedInvitationRole.id

                        return (
                          <button
                            type="button"
                            key={roleOption.id}
                            className="app-users-add-modal__role-menu-item"
                            style={getRoleColorStyle(roleOption.color)}
                            role="menuitemradio"
                            aria-checked={isSelectedRole}
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelectedInvitationRoleId(roleOption.id)
                              setIsRoleMenuOpen(false)
                            }}
                          >
                            <span>{roleOption.label}</span>
                            {isSelectedRole && <Icon name="check" category="general" size={16} />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {isEmailComposerOpen && (
              <textarea
                className="app-users-add-modal__message"
                aria-label="Invitation message"
                placeholder="Add an invitation message (optional)"
              />
            )}
          </div>
        )}

        {!isInviteByLinkActive && isEmailComposerOpen && (
          <footer className="app-users-add-modal__footer">
            <button type="button" className="app-users-add-modal__cancel" onClick={onClose}>
              CANCEL
            </button>
            <button type="button" className="app-users-add-modal__send" disabled={!hasInvitationEmail}>
              SEND INVITATION
            </button>
          </footer>
        )}
      </section>
    </div>,
    document.body,
  )
}

function AppUsersPanel({
  presetId,
  roleOptions,
  setRoleOptions,
  onAppUserTableRoleIdsChange,
  onAppUserRoleUserCountsChange,
}: AppUsersPanelProps) {
  const appUsers = useMemo(() => getAppUsersForPreset(presetId), [presetId])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoleUserId, setSelectedRoleUserId] = useState<string | null>(null)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [assignedRoleIds, setAssignedRoleIds] = useState<Record<string, string>>(() => (
    Object.fromEntries(appUsers.map((user) => [user.id, user.roleId]))
  ))
  const [draftRoleUserId, setDraftRoleUserId] = useState<string | null>(null)
  const [draftRoleInputs, setDraftRoleInputs] = useState<DraftRoleInput[]>([])
  const [activeDraftRoleInputId, setActiveDraftRoleInputId] = useState<string | null>(null)
  const draftRoleInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const draftRoleIdRef = useRef(0)
  const customRoleIdRef = useRef(0)
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const roleById = useMemo(() => new Map(roleOptions.map((role) => [role.id, role])), [roleOptions])
  const assignedRoleUserCounts = useMemo(() => appUsers.reduce<Record<string, number>>((counts, user) => {
    const assignedRoleId = assignedRoleIds[user.id] ?? user.roleId

    counts[assignedRoleId] = (counts[assignedRoleId] ?? 0) + 1

    return counts
  }, {}), [appUsers, assignedRoleIds])
  const assignedTableRoleIds = useMemo(() => Object.keys(assignedRoleUserCounts), [assignedRoleUserCounts])
  const visibleUsers = useMemo(() => {
    if (!normalizedSearch) return appUsers
    return appUsers.filter((user) => {
      const assignedRoleId = assignedRoleIds[user.id] ?? user.roleId
      const assignedRole = getAssignedRole(user, assignedRoleId, roleById)

      return (
        user.name.toLowerCase().includes(normalizedSearch)
        || user.email.toLowerCase().includes(normalizedSearch)
        || assignedRole.label.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [appUsers, assignedRoleIds, normalizedSearch, roleById])
  const userCountLabel = `${appUsers.length} ${appUsers.length === 1 ? 'User' : 'Users'}`

  useEffect(() => {
    if (draftRoleUserId && activeDraftRoleInputId) {
      draftRoleInputRefs.current[activeDraftRoleInputId]?.focus()
    }
  }, [activeDraftRoleInputId, draftRoleInputs.length, draftRoleUserId])

  useEffect(() => {
    setAssignedRoleIds(Object.fromEntries(appUsers.map((user) => [user.id, user.roleId])))
    setSelectedRoleUserId(null)
    setDraftRoleUserId(null)
    setDraftRoleInputs([])
    setActiveDraftRoleInputId(null)
  }, [appUsers])

  useEffect(() => {
    onAppUserTableRoleIdsChange?.(assignedTableRoleIds)
  }, [assignedTableRoleIds, onAppUserTableRoleIdsChange])

  useEffect(() => {
    onAppUserRoleUserCountsChange?.(assignedRoleUserCounts)
  }, [assignedRoleUserCounts, onAppUserRoleUserCountsChange])

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
          onClick={() => {
            setSelectedRoleUserId(null)
            setDraftRoleUserId(null)
            setDraftRoleInputs([])
            setActiveDraftRoleInputId(null)
            setIsAddUserModalOpen(true)
          }}
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
      {isAddUserModalOpen && (
        <AddUserModal
          roleOptions={roleOptions}
          onClose={() => setIsAddUserModalOpen(false)}
        />
      )}
    </section>
  )
}
