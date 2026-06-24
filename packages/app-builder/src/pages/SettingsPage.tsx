import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEventHandler, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import {
  Button,
  DropdownLanguage,
  DropdownSingle,
  FormField,
  Icon,
  Input,
  Link as TextLink,
  Modal,
  Segmented,
  TextArea,
  Toggle,
} from '@jf/design-system'
import { compressImageFile } from '@jf/app-elements'
import historyEmptyIcon from '../assets/push-notifications/history-empty.svg'
import lockscreenTime from '../assets/push-notifications/lockscreen-time.svg'
import notificationWallpaper from '../assets/push-notifications/preview-wallpaper.png'
import { BasicPhonePreview } from '../components/BasicPhonePreview'
import { ColorInputWithPicker } from '../components/ColorInputWithPicker'
import {
  HomeScreenMockup,
  type AppIconVariant,
  type IconStyle,
} from '../components/HomeScreenMockup'
import { LucideIcon } from '../components/IconPicker'
import { PanelHeader } from '../components/PanelHeader'
import { QuickPreview } from '../components/QuickPreview'
import { SideNav, type SideNavItem } from '../components/SideNav'
import { SplashScreenMockup, type SplashAnimation, type SplashStyle } from '../components/SplashScreenMockup'
import { useCssVar } from '../hooks/useCssVar'
import { IconPropertyField } from '../components/IconPropertyField'
import type { DeepLinkTarget } from '../state/deepLinkTargets'
import { getRoleColorStyle, type AppRoleOption } from '../state/appUserRoles'
import { ALL_USERS_AUDIENCE_ID } from '../state/pushNotifications'

const NAV_ITEMS: SideNavItem[] = [
  {
    id: 'app-settings',
    icon: 'mobile-gear',
    iconCategory: 'technology',
    title: 'APP SETTINGS',
    description: 'App status and properties.',
    iconBg: 'var(--product-apps-default)',
  },
  {
    id: 'app-name-icon',
    icon: 'mobile-title',
    iconCategory: 'technology',
    title: 'APP NAME & ICON',
    description: 'Customize app name and icon.',
    headerDescription: 'The app icon will appear when users add your app to their home screen.',
    iconBg: 'var(--product-tables-light)',
  },
  {
    id: 'splash-screen',
    icon: 'mobile-pencil',
    iconCategory: 'technology',
    title: 'SPLASH SCREEN',
    description: 'Customize splash screen.',
    headerDescription: 'The splash screen appears when users open your app on their mobile devices.',
    iconBg: 'var(--accent-default)',
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
  {
    id: 'ai-chatbot',
    icon: 'ai-message-filled',
    iconCategory: 'ai',
    title: 'AI CHATBOT',
    description: 'Support your users with AI.',
    headerDescription: 'Use AI to provide real-time support for your customers.',
    iconBg: 'var(--product-ai-default)',
  },
]

const APP_STATUS_OPTIONS = [
  { value: 'enabled', label: 'Enable' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'scheduled', label: 'Disable on a specific date' },
]

const LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English (US)', countryCode: 'us' },
  { value: 'tr', label: 'Türkçe', countryCode: 'tr' },
  { value: 'de', label: 'Deutsch', countryCode: 'de' },
  { value: 'fr', label: 'Français', countryCode: 'fr' },
  { value: 'es', label: 'Español', countryCode: 'es' },
]

const PERMISSION_REQUEST_TITLE = 'Stay updated!'
const PERMISSION_REQUEST_CONTENT =
  'Allow app notifications to get the latest news, updates, and exclusive offers delivered directly to your device.'
const PERMISSION_REQUEST_FIGMA_COUNT = 50
const NOTIFICATION_TITLE_PLACEHOLDER = 'Notification Title'
const NOTIFICATION_CONTENT_PLACEHOLDER = 'Notification content'
const NOTIFICATION_CONTENT_MAX_LENGTH = 150
const EDIT_NOTIFICATION_CONTENT_MAX_LENGTH = 400
const NOTIFICATION_DEEP_LINK_PLACEHOLDER = 'Choose a page or form'
const NOTIFICATION_AUDIENCE_PLACEHOLDER = 'Choose audience'
const SENT_NOTIFICATION_METRICS = [
  { label: 'SUBSCRIBES', value: '600' },
  { label: 'SENT', value: '500' },
  { label: 'DELIVERED', value: '300' },
  { label: 'CLICKED', value: '0' },
]

const SCHEDULE_TIMEZONE_OPTIONS = [
  { value: 'america-new-york', label: 'America / New York (EDT)' },
  { value: 'europe-istanbul', label: 'Europe / Istanbul (TRT)' },
  { value: 'america-los-angeles', label: 'America / Los Angeles (PDT)' },
  { value: 'europe-london', label: 'Europe / London (BST)' },
]

type ScheduleQuickPickValue = 'in-1-hour' | 'tomorrow-9-am' | 'monday-9-am' | 'custom'

const SCHEDULE_QUICK_PICK_OPTIONS: Array<{ value: ScheduleQuickPickValue; label: string }> = [
  { value: 'in-1-hour', label: 'In 1 hour' },
  { value: 'tomorrow-9-am', label: 'Tomorrow 9 am' },
  { value: 'monday-9-am', label: 'Monday 9 am' },
  { value: 'custom', label: 'Custom' },
]

const formatScheduleDate = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()

  return `${month} / ${day} / ${year}`
}

const parseScheduleDate = (value: string) => {
  const match = value.trim().match(/^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/)

  if (!match) return null

  const month = Number(match[1])
  const day = Number(match[2])
  const year = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

const getScheduleDateKey = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

const formatScheduleMonthTitle = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
}

const buildScheduleCalendarDays = (monthDate: Date) => {
  const firstDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const firstVisibleDay = new Date(firstDayOfMonth)
  firstVisibleDay.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDay)
    date.setDate(firstVisibleDay.getDate() + index)

    return {
      date,
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
      key: getScheduleDateKey(date),
    }
  })
}

const SCHEDULE_WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const formatScheduleTimeParts = (hours: number, minutes: number) => {
  const paddedMinutes = String(minutes).padStart(2, '0')
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12

  return `${displayHours}:${paddedMinutes} ${period}`
}

const formatScheduleTime = (date: Date) => {
  return formatScheduleTimeParts(date.getHours(), date.getMinutes())
}

const SCHEDULE_TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * 30
  const label = formatScheduleTimeParts(Math.floor(totalMinutes / 60), totalMinutes % 60)

  return {
    value: label,
    label,
    leading: <Icon name="clock" category="time-date" size={20} />,
  }
})

const roundUpToNextHalfHour = (date: Date) => {
  const roundedDate = new Date(date)
  const minutes = roundedDate.getMinutes()
  const remainder = minutes % 30

  roundedDate.setSeconds(0, 0)

  if (remainder !== 0) {
    roundedDate.setMinutes(minutes + (30 - remainder))
  }

  return roundedDate
}

const getNextMondayAtNine = (now: Date) => {
  const nextMonday = new Date(now)
  nextMonday.setHours(9, 0, 0, 0)

  const currentDay = now.getDay()
  let daysUntilMonday = (1 - currentDay + 7) % 7

  if (daysUntilMonday === 0 && now >= nextMonday) {
    daysUntilMonday = 7
  }

  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday)

  return nextMonday
}

const getScheduleQuickPickDate = (quickPick: ScheduleQuickPickValue) => {
  const now = new Date()

  if (quickPick === 'in-1-hour') {
    const inOneHour = new Date(now)
    inOneHour.setHours(inOneHour.getHours() + 1)

    return roundUpToNextHalfHour(inOneHour)
  }

  if (quickPick === 'tomorrow-9-am') {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)

    return tomorrow
  }

  if (quickPick === 'monday-9-am') {
    return getNextMondayAtNine(now)
  }

  return null
}

interface PushComposerFieldOption {
  value: string
  label: string
}

type PushComposerFieldValues = Record<string, string>

const PUSH_COMPOSER_FIELD_OPTIONS: PushComposerFieldOption[] = [{ value: 'user-name', label: 'User Name' }]

interface ToggleRowProps {
  title: string
  description: string
  className?: string
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  extra?: ReactNode
  onChange?: ChangeEventHandler<HTMLInputElement>
}

function ToggleRow({
  title,
  description,
  className,
  checked,
  defaultChecked,
  disabled,
  extra,
  onChange,
}: ToggleRowProps) {
  return (
    <div className={['settings-panel__row', className].filter(Boolean).join(' ')}>
      <div className="settings-panel__row-main">
        <div className="settings-panel__row-text">
          <p className="settings-panel__row-title">{title}</p>
          <p className="settings-panel__row-desc">{description}</p>
        </div>
        <Toggle
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          onChange={onChange}
        />
      </div>
      {extra && <div className="settings-panel__row-extra">{extra}</div>}
    </div>
  )
}

interface ScheduleDatePickerProps {
  value: string
  onChange: (value: string) => void
}

function ScheduleDatePicker({ value, onChange }: ScheduleDatePickerProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = useMemo(() => parseScheduleDate(value), [value])
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initialDate = selectedDate ?? new Date()

    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  })
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({ visibility: 'hidden' })
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const days = useMemo(() => buildScheduleCalendarDays(visibleMonth), [visibleMonth])
  const selectedDateKey = selectedDate ? getScheduleDateKey(selectedDate) : null
  const todayKey = getScheduleDateKey(new Date())

  useEffect(() => {
    if (!open || !selectedDate) return

    setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  }, [open, selectedDate])

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const gutter = 16
      const preferredWidth = 320
      const width = Math.min(Math.max(rect.width, preferredWidth), window.innerWidth - gutter * 2)
      const left = Math.min(Math.max(rect.left, gutter), window.innerWidth - width - gutter)
      const estimatedHeight = 336
      const spaceBelow = window.innerHeight - rect.bottom
      const nextStyle: CSSProperties = {
        position: 'fixed',
        left,
        width,
        zIndex: 1100,
      }

      if (spaceBelow < estimatedHeight + gutter && rect.top > spaceBelow) {
        nextStyle.bottom = window.innerHeight - rect.top + 4
      } else {
        nextStyle.top = rect.bottom + 4
      }

      setPopoverStyle(nextStyle)
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node

      if (triggerRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return

      setOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      event.stopPropagation()
      setOpen(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [open])

  const moveVisibleMonth = (offset: number) => {
    setVisibleMonth((currentMonth) => (
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1)
    ))
  }

  const selectDate = (date: Date) => {
    onChange(formatScheduleDate(date))
    setOpen(false)
  }

  return (
    <label className="push-schedule-field push-schedule-date-picker">
      <span className="push-schedule-field__label">Date</span>
      <div
        ref={triggerRef}
        className="push-schedule-date-picker__trigger"
        onMouseDownCapture={() => setOpen(true)}
      >
        <Input
          size="md"
          className="push-schedule-field__control"
          aria-label="Schedule date"
          aria-haspopup="dialog"
          aria-expanded={open}
          placeholder="mm / dd / yyyy"
          value={value}
          onClick={() => setOpen(true)}
          onFocus={() => setOpen(true)}
          onChange={(event) => onChange(event.currentTarget.value)}
          rightContent={<Icon name="calendar-event-filled" category="time-date" size={20} />}
        />
      </div>
      {open && createPortal(
        <div
          ref={popoverRef}
          className="push-schedule-date-picker__popover"
          role="dialog"
          aria-label="Choose schedule date"
          style={popoverStyle}
        >
          <div className="push-schedule-date-picker__header">
            <button
              type="button"
              className="push-schedule-date-picker__nav"
              aria-label="Previous month"
              onClick={() => moveVisibleMonth(-1)}
            >
              <Icon name="chevron-left" category="arrows" size={16} />
            </button>
            <p className="push-schedule-date-picker__month">
              {formatScheduleMonthTitle(visibleMonth)}
            </p>
            <button
              type="button"
              className="push-schedule-date-picker__nav"
              aria-label="Next month"
              onClick={() => moveVisibleMonth(1)}
            >
              <Icon name="chevron-right" category="arrows" size={16} />
            </button>
          </div>
          <div className="push-schedule-date-picker__weekdays" aria-hidden="true">
            {SCHEDULE_WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="push-schedule-date-picker__grid">
            {days.map(({ date, isCurrentMonth, key }) => {
              const isSelected = key === selectedDateKey
              const isToday = key === todayKey

              return (
                <button
                  type="button"
                  key={key}
                  className={[
                    'push-schedule-date-picker__day',
                    !isCurrentMonth && 'push-schedule-date-picker__day--outside',
                    isToday && 'push-schedule-date-picker__day--today',
                    isSelected && 'push-schedule-date-picker__day--selected',
                  ].filter(Boolean).join(' ')}
                  aria-pressed={isSelected}
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>,
        document.body
      )}
    </label>
  )
}

interface AppSettingsPanelProps {
  searchBarEnabled: boolean
  setSearchBarEnabled: (enabled: boolean) => void
}

function AppSettingsPanel({ searchBarEnabled, setSearchBarEnabled }: AppSettingsPanelProps) {
  const [appStatus, setAppStatus] = useState('enabled')
  const [language, setLanguage] = useState('en-US')

  return (
    <section className="settings-panel__card settings-panel__card--app-settings">
      <div className="settings-panel__row settings-panel__row--app-settings-dropdown">
        <DropdownSingle
          title="App Status"
          description="Disable your app now or on a specific date."
          showTitle
          showDescription
          showHelpText={false}
          showLeadingIcon={false}
          options={APP_STATUS_OPTIONS}
          value={appStatus}
          onChange={setAppStatus}
        />
      </div>
      <div className="settings-panel__row settings-panel__row--app-settings-dropdown">
        <DropdownLanguage
          title="App Language"
          description="Set the default language for your app."
          showTitle
          showDescription
          showHelpText={false}
          options={LANGUAGE_OPTIONS}
          value={language}
          onChange={setLanguage}
        />
      </div>
      <ToggleRow
        title="Search Bar"
        description="Show a search bar in the app heading to quickly find pages and forms."
        className="settings-panel__row--app-settings-toggle"
        checked={searchBarEnabled}
        onChange={(event) => setSearchBarEnabled(event.currentTarget.checked)}
      />
      <ToggleRow
        title="Add to Home Screen Modal"
        description="Show add to home screen modal when user opens the app."
        className="settings-panel__row--app-settings-toggle"
        defaultChecked
      />
      <ToggleRow
        title="Show QR Code on Desktop"
        description="Let users scan QR code to open the app on their phone."
        className="settings-panel__row--app-settings-qr"
        defaultChecked
        extra={
          <Button
            variant="ghost"
            colorScheme="secondary"
            size="sm"
            leftIcon={<Icon name="pencil-to-square" category="general" size={16} />}
          >
            Customize
          </Button>
        }
      />
      <ToggleRow
        title="Continue Forms Later"
        description="Allow users to save their submission and complete the form through the app later."
        className="settings-panel__row--app-settings-toggle"
        defaultChecked
      />
      <ToggleRow
        title="Progress Bar"
        description="Let users see their progress for forms or documents marked as required."
        className="settings-panel__row--app-settings-toggle"
        disabled
      />
      <ToggleRow
        title="Prevent Cloning"
        description="Prevent other users from cloning this app."
        className="settings-panel__row--app-settings-toggle"
      />
    </section>
  )
}

const ICON_STYLE_OPTIONS = [
  { value: 'flat', label: 'Flat' },
  { value: 'linear', label: 'Linear' },
  { value: 'inverse', label: 'Inverse' },
  { value: 'mesh', label: 'Mesh' },
]

interface AppNameIconPanelProps {
  appName: string
  setAppName: (value: string) => void
  variant: AppIconVariant
  setVariant: (value: AppIconVariant) => void
  iconGlyph: string
  setIconGlyph: (value: string) => void
  imageUrl: string | null
  imageName: string | null
  setImage: (url: string | null, name: string | null) => void
  iconColor: string
  setIconColor: (value: string) => void
  iconBg: string
  setIconBg: (value: string) => void
  iconStyle: IconStyle
  setIconStyle: (value: IconStyle) => void
  onIconStyleHover?: (value: IconStyle | null) => void
}

function AppNameIconPanel({
  appName,
  setAppName,
  variant,
  setVariant,
  iconGlyph,
  setIconGlyph,
  imageUrl,
  imageName,
  setImage,
  iconColor,
  setIconColor,
  iconBg,
  setIconBg,
  iconStyle,
  setIconStyle,
  onIconStyleHover,
}: AppNameIconPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <section className="settings-panel__card">
      <div className="settings-panel__row">
        <FormField title="App Name" description="The name shown on your app." showHelpText={false}>
          <Input
            placeholder="My App"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
          />
        </FormField>
      </div>
      <div className="settings-panel__row">
        <FormField title="Variant" description="Design your own icon or upload an image." showHelpText={false}>
          <Segmented
            accent="apps"
            variant="text"
            value={variant}
            onChange={(value) => setVariant(value as AppIconVariant)}
            items={[
              { value: 'Icon', label: 'Icon' },
              { value: 'Image', label: 'Image' },
            ]}
          />
        </FormField>
      </div>
      {variant === 'Icon' && (
        <>
          <div className="settings-panel__row">
            <FormField
              title="Icon"
              description="The glyph shown inside your app icon."
              showHelpText={false}
            >
              <IconPropertyField value={iconGlyph} onChange={setIconGlyph} />
            </FormField>
          </div>
          <div className="settings-panel__row">
            <FormField
              title="Icon Color"
              description="Color of the glyph shown inside your app icon."
              showHelpText={false}
            >
              <ColorInputWithPicker color={iconColor} onColorChange={setIconColor} />
            </FormField>
          </div>
          <div className="settings-panel__row">
            <FormField
              title="Icon Background"
              description="Background color of your app icon."
              showHelpText={false}
            >
              <ColorInputWithPicker color={iconBg} onColorChange={setIconBg} />
            </FormField>
          </div>
          <div className="settings-panel__row">
            <FormField
              title="Style"
              description="Choose an icon background style."
              showHelpText={false}
            >
              <DropdownSingle
                showLeadingIcon={false}
                showHelpText={false}
                options={ICON_STYLE_OPTIONS}
                value={iconStyle}
                onChange={(value) => setIconStyle(value as IconStyle)}
                onItemHover={(value) => onIconStyleHover?.(value as IconStyle)}
                onItemHoverEnd={() => onIconStyleHover?.(null)}
              />
            </FormField>
          </div>
        </>
      )}
      {variant === 'Image' && (
        <div className="settings-panel__row">
          <FormField
            title="App Image"
            description="Upload an image to use as your app icon."
            showHelpText={false}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                compressImageFile(file).then((url) => {
                  setImage(url, file.name)
                })
                e.target.value = ''
              }}
            />
            {imageUrl ? (
              <div className="image-preview image-preview--light">
                <div
                  className="image-preview__thumb"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                />
                <span className="image-preview__name" title={imageName ?? ''}>
                  {imageName ?? 'image'}
                </span>
                <button
                  type="button"
                  className="image-preview__remove"
                  aria-label="Remove image"
                  onClick={() => setImage(null, null)}
                >
                  <Icon name="trash-filled" category="general" size={16} />
                </button>
              </div>
            ) : (
              <div className="upload-area upload-area--light">
                <Button
                  variant="filled"
                  colorScheme="secondary"
                  shape="rectangle"
                  size="md"
                  leftIcon={<Icon name="image-plus-filled" category="media" size={16} />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
                <span className="upload-area__hint">OR DRAG AND DROP HERE</span>
              </div>
            )}
          </FormField>
        </div>
      )}
    </section>
  )
}

interface SplashState {
  fontColor: string
}

const SPLASH_STYLE_OPTIONS = [
  { value: 'flat', label: 'Flat' },
  { value: 'linear', label: 'Linear' },
  { value: 'inverse', label: 'Inverse' },
  { value: 'mesh', label: 'Mesh' },
]

const SPLASH_ANIMATION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade' },
  { value: 'scale', label: 'Scale' },
  { value: 'slide', label: 'Slide Up' },
]

interface SplashScreenPanelProps {
  state: SplashState
  onChange: (patch: Partial<SplashState>) => void
  bgColor: string
  setBgColor: (value: string) => void
  bgStyle: SplashStyle
  setBgStyle: (value: SplashStyle) => void
  animation: SplashAnimation
  setAnimation: (value: SplashAnimation) => void
  onBgStyleHover?: (value: SplashStyle | null) => void
  onAnimationHover?: (value: SplashAnimation | null) => void
}

function SplashScreenPanel({
  state,
  onChange,
  bgColor,
  setBgColor,
  bgStyle,
  setBgStyle,
  animation,
  setAnimation,
  onBgStyleHover,
  onAnimationHover,
}: SplashScreenPanelProps) {
  return (
    <section className="settings-panel__card">
      <div className="settings-panel__row">
        <FormField
          title="Background Color"
          description="Background color of the splash screen."
          showHelpText={false}
        >
          <ColorInputWithPicker color={bgColor} onColorChange={setBgColor} />
        </FormField>
      </div>
      <div className="settings-panel__row">
        <FormField
          title="Font Color"
          description="Text color shown on the splash screen."
          showHelpText={false}
        >
          <ColorInputWithPicker
            color={state.fontColor}
            onColorChange={(fontColor) => onChange({ fontColor })}
          />
        </FormField>
      </div>
      <div className="settings-panel__row">
        <FormField
          title="Style"
          description="Choose a splash background style."
          showHelpText={false}
        >
          <DropdownSingle
            showLeadingIcon={false}
            showHelpText={false}
            options={SPLASH_STYLE_OPTIONS}
            value={bgStyle}
            onChange={(value) => setBgStyle(value as SplashStyle)}
            onItemHover={(value) => onBgStyleHover?.(value as SplashStyle)}
            onItemHoverEnd={() => onBgStyleHover?.(null)}
          />
        </FormField>
      </div>
      <div className="settings-panel__row">
        <FormField
          title="Animation"
          description="Choose an opening animation for the splash."
          showHelpText={false}
        >
          <DropdownSingle
            showLeadingIcon={false}
            showHelpText={false}
            options={SPLASH_ANIMATION_OPTIONS}
            value={animation}
            onChange={(value) => setAnimation(value as SplashAnimation)}
            onItemHover={(value) => onAnimationHover?.(value as SplashAnimation)}
            onItemHoverEnd={() => onAnimationHover?.(null)}
          />
        </FormField>
      </div>
    </section>
  )
}

interface PushNotificationsPanelProps {
  enabled: boolean
  setEnabled: (enabled: boolean) => void
  appUserRoles: AppRoleOption[]
  deepLinkTargets: DeepLinkTarget[]
  appIconVariant: AppIconVariant
  appIconImageUrl: string | null
  appIconName: string
  appIconColor: string
  appIconBg: string
  appIconStyle: IconStyle
  historyItems: PushNotificationHistoryItem[]
  onHistoryItemCreate: (item: PushNotificationHistoryItem) => void
  onHistoryItemUpdate: (item: PushNotificationHistoryItem) => void
  onHistoryItemDelete: (itemId: string) => void
  fieldValues: PushComposerFieldValues
  notificationTitle: string
  setNotificationTitle: (title: string) => void
  notificationTitleFields: PushComposerFieldOption[]
  setNotificationTitleFields: (fields: PushComposerFieldOption[]) => void
  notificationTitleSuffix: string
  setNotificationTitleSuffix: (title: string) => void
  notificationContent: string
  setNotificationContent: (content: string) => void
  notificationContentFields: PushComposerFieldOption[]
  setNotificationContentFields: (fields: PushComposerFieldOption[]) => void
  notificationContentSuffix: string
  setNotificationContentSuffix: (content: string) => void
  audience: string[]
  setAudience: (audience: string[]) => void
  deepLink: string
  setDeepLink: (deepLink: string) => void
  notificationImage: PushComposerSelectedImage | null
  setNotificationImage: (image: PushComposerSelectedImage | null) => void
}

export type PushNotificationHistoryStatus = 'scheduled' | 'sent'

export interface PushComposerSelectedImage {
  url: string
  name: string
}

export interface PushNotificationHistoryItem {
  id: string
  status: PushNotificationHistoryStatus
  statusLabel: string
  title: string
  content: string
  image?: PushComposerSelectedImage | null
  audience?: string[]
  audienceLabel: string
  deepLink?: string
  deepLinkLabel: string
  scheduleDate?: string
  scheduleTime?: string
  scheduleTimezone?: string
  scheduledAtLabel: string
  liveInLabel: string
}

function PushNotificationsPanel({
  enabled,
  setEnabled,
  appUserRoles,
  deepLinkTargets,
  appIconVariant,
  appIconImageUrl,
  appIconName,
  appIconColor,
  appIconBg,
  appIconStyle,
  historyItems,
  onHistoryItemCreate,
  onHistoryItemUpdate,
  onHistoryItemDelete,
  fieldValues,
  notificationTitle,
  setNotificationTitle,
  notificationTitleFields,
  setNotificationTitleFields,
  notificationTitleSuffix,
  setNotificationTitleSuffix,
  notificationContent,
  setNotificationContent,
  notificationContentFields,
  setNotificationContentFields,
  notificationContentSuffix,
  setNotificationContentSuffix,
  audience,
  setAudience,
  deepLink,
  setDeepLink,
  notificationImage,
  setNotificationImage,
}: PushNotificationsPanelProps) {
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [permissionTitle, setPermissionTitle] = useState(PERMISSION_REQUEST_TITLE)
  const [permissionContent, setPermissionContent] = useState(PERMISSION_REQUEST_CONTENT)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [scheduleTimezone, setScheduleTimezone] = useState(SCHEDULE_TIMEZONE_OPTIONS[0].value)
  const [scheduleQuickPick, setScheduleQuickPick] = useState<ScheduleQuickPickValue>('custom')
  const [editingNotification, setEditingNotification] = useState<PushNotificationHistoryItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editAudience, setEditAudience] = useState<string[]>([ALL_USERS_AUDIENCE_ID])
  const [editDeepLink, setEditDeepLink] = useState('')
  const [editScheduleDate, setEditScheduleDate] = useState('')
  const [editScheduleTime, setEditScheduleTime] = useState('')
  const [editScheduleTimezone, setEditScheduleTimezone] = useState(SCHEDULE_TIMEZONE_OPTIONS[0].value)
  const [cancelingNotification, setCancelingNotification] = useState<PushNotificationHistoryItem | null>(null)
  const notificationTitleEditorRef = useRef<PushComposerTokenEditorHandle>(null)
  const permissionContentCount =
    permissionContent === PERMISSION_REQUEST_CONTENT
      ? PERMISSION_REQUEST_FIGMA_COUNT
      : permissionContent.length
  const areNotificationActionsDisabled =
    (
      notificationTitle.trim().length === 0 &&
      notificationTitleFields.length === 0 &&
      notificationTitleSuffix.trim().length === 0
    ) ||
    (
      notificationContent.trim().length === 0 &&
      notificationContentFields.length === 0 &&
      notificationContentSuffix.trim().length === 0
    )
  const addNotificationTitleField = (field: PushComposerFieldOption) => {
    if (notificationTitleEditorRef.current?.insertField(field)) return

    setNotificationTitleFields([...notificationTitleFields, field])
  }
  const addNotificationContentField = (field: PushComposerFieldOption) => {
    setNotificationContentFields([...notificationContentFields, field])
  }
  const removeNotificationContentField = (fieldIndex: number) => {
    const nextFields = notificationContentFields.filter((_, index) => index !== fieldIndex)

    if (nextFields.length === 0 && notificationContentFields.length > 0) {
      setNotificationContent(mergePushComposerText(notificationContent, notificationContentSuffix))
      setNotificationContentSuffix('')
    }

    setNotificationContentFields(nextFields)
  }
  const applyScheduleQuickPick = (quickPick: ScheduleQuickPickValue) => {
    setScheduleQuickPick(quickPick)

    if (quickPick === 'custom') {
      setScheduleDate('')
      setScheduleTime('')
      return
    }

    const nextScheduleDate = getScheduleQuickPickDate(quickPick)

    if (!nextScheduleDate) return

    setScheduleDate(formatScheduleDate(nextScheduleDate))
    setScheduleTime(formatScheduleTime(nextScheduleDate))
  }
  const resetNotificationComposer = () => {
    setNotificationTitle('')
    setNotificationTitleFields([])
    setNotificationTitleSuffix('')
    setNotificationContent('')
    setNotificationContentFields([])
    setNotificationContentSuffix('')
    setAudience([])
    setDeepLink('')
    setNotificationImage(null)
    setScheduleDate('')
    setScheduleTime('')
    setScheduleQuickPick('custom')
  }
  const createBaseHistoryItem = (status: PushNotificationHistoryStatus) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    status,
    statusLabel: status === 'scheduled' ? 'Scheduled' : 'Sent',
    title: getComposerHistoryText(
      notificationTitle,
      notificationTitleFields,
      notificationTitleSuffix,
      NOTIFICATION_TITLE_PLACEHOLDER,
      fieldValues,
    ),
    content: getComposerHistoryText(
      notificationContent,
      notificationContentFields,
      notificationContentSuffix,
      NOTIFICATION_CONTENT_PLACEHOLDER,
      fieldValues,
    ),
    image: notificationImage,
    audience,
    audienceLabel: getAudienceHistoryLabel(audience, appUserRoles),
    deepLink,
    deepLinkLabel: getDeepLinkHistoryLabel(deepLink, deepLinkTargets),
  })
  const saveScheduledNotification = () => {
    onHistoryItemCreate({
      ...createBaseHistoryItem('scheduled'),
      scheduleDate,
      scheduleTime,
      scheduleTimezone,
      scheduledAtLabel: getScheduleHistoryDateTimeLabel(scheduleDate, scheduleTime),
      liveInLabel: getScheduleLiveInLabel(scheduleDate, scheduleTime),
    })
    setIsScheduleModalOpen(false)
    resetNotificationComposer()
  }
  const sendPushNotificationNow = () => {
    onHistoryItemCreate({
      ...createBaseHistoryItem('sent'),
      scheduledAtLabel: getNowHistoryDateTimeLabel(),
      liveInLabel: 'Sent just now',
    })
    resetNotificationComposer()
  }
  const openScheduledNotificationEdit = (notification: PushNotificationHistoryItem) => {
    setEditingNotification(notification)
    setEditTitle(notification.title)
    setEditContent(notification.content)
    setEditAudience(getHistoryAudienceValue(notification, appUserRoles))
    setEditDeepLink(getHistoryDeepLinkValue(notification, deepLinkTargets))
    setEditScheduleDate(getHistoryScheduleDateValue(notification))
    setEditScheduleTime(getHistoryScheduleTimeValue(notification))
    setEditScheduleTimezone(notification.scheduleTimezone ?? SCHEDULE_TIMEZONE_OPTIONS[0].value)
  }
  const closeScheduledNotificationEdit = () => {
    setEditingNotification(null)
  }
  const openScheduledNotificationCancel = (notification: PushNotificationHistoryItem) => {
    setCancelingNotification(notification)
  }
  const closeScheduledNotificationCancel = () => {
    setCancelingNotification(null)
  }
  const confirmScheduledNotificationCancel = () => {
    if (!cancelingNotification) return

    onHistoryItemDelete(cancelingNotification.id)
    closeScheduledNotificationCancel()
  }
  const saveScheduledNotificationEdit = () => {
    if (!editingNotification) return

    const nextTitle = editTitle.trim() || NOTIFICATION_TITLE_PLACEHOLDER
    const nextContent = editContent.trim() || NOTIFICATION_CONTENT_PLACEHOLDER

    onHistoryItemUpdate({
      ...editingNotification,
      title: nextTitle,
      content: nextContent,
      audience: editAudience,
      audienceLabel: getAudienceHistoryLabel(editAudience, appUserRoles),
      deepLink: editDeepLink,
      deepLinkLabel: getDeepLinkHistoryLabel(editDeepLink, deepLinkTargets),
      scheduleDate: editScheduleDate,
      scheduleTime: editScheduleTime,
      scheduleTimezone: editScheduleTimezone,
      scheduledAtLabel: getScheduleHistoryDateTimeLabel(editScheduleDate, editScheduleTime),
      liveInLabel: getScheduleLiveInLabel(editScheduleDate, editScheduleTime),
    })
    closeScheduledNotificationEdit()
  }

  return (
    <>
      <section className="push-notifications-panel" aria-labelledby="push-notifications-title">
        <div className="push-notifications-panel__copy">
          <h2 id="push-notifications-title" className="push-notifications-panel__title">
            Enable Push Notifications
          </h2>
          <p className="push-notifications-panel__description">
            When enabled, users will receive a message asking them to allow notifications from your
            app.
            <TextLink
              className="push-notifications-panel__link"
              size="lg"
              onClick={() => setIsPermissionModalOpen(true)}
            >
              Edit Permission Request
            </TextLink>
          </p>
        </div>
        <Toggle
          size="lg"
          className="push-notifications-toggle"
          aria-label="Enable Push Notifications"
          checked={enabled}
          onClick={(event) => setEnabled(event.currentTarget.checked)}
          onChange={(event) => setEnabled(event.currentTarget.checked)}
          onInput={(event) => setEnabled(event.currentTarget.checked)}
        />
      </section>

      {enabled && (
        <>
          <PushNotificationComposer
            titleEditorRef={notificationTitleEditorRef}
            title={notificationTitle}
            setTitle={setNotificationTitle}
            titleFields={notificationTitleFields}
            setTitleFields={setNotificationTitleFields}
            onTitleFieldAdd={addNotificationTitleField}
            titleSuffix={notificationTitleSuffix}
            setTitleSuffix={setNotificationTitleSuffix}
            content={notificationContent}
            setContent={setNotificationContent}
            contentFields={notificationContentFields}
            onContentFieldAdd={addNotificationContentField}
            onContentFieldRemove={removeNotificationContentField}
            contentSuffix={notificationContentSuffix}
            setContentSuffix={setNotificationContentSuffix}
            fieldValues={fieldValues}
            audience={audience}
            setAudience={setAudience}
            appUserRoles={appUserRoles}
            deepLinkTargets={deepLinkTargets}
            deepLink={deepLink}
            setDeepLink={setDeepLink}
            image={notificationImage}
            setImage={setNotificationImage}
          />
          <div className="push-notification-actions">
            <Button
              variant="filled"
              colorScheme="secondary"
              disabled={areNotificationActionsDisabled}
              leftIcon={<Icon name="paper-plane-diagonal-filled" category="communication" size={20} />}
            >
              SEND TEST
            </Button>
            <div className="push-notification-actions__right">
              <Button
                colorScheme="primary"
                disabled={areNotificationActionsDisabled}
                onClick={() => setIsScheduleModalOpen(true)}
              >
                SCHEDULE
              </Button>
              <Button
                colorScheme="constructive"
                disabled={areNotificationActionsDisabled}
                onClick={sendPushNotificationNow}
              >
                SEND NOW
              </Button>
            </div>
          </div>
          <PushNotificationHistory
            notifications={historyItems}
            onScheduledNotificationEdit={openScheduledNotificationEdit}
            onScheduledNotificationCancel={openScheduledNotificationCancel}
          />
        </>
      )}

      <Modal
        open={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        size="lg"
        icon={<Icon name="message-ellipsis-pencil-filled" category="communication" size={24} />}
        iconTone="apps"
        title="Edit Permission Request"
        description="This message will invite users to opt into receiving notifications from your app."
        confirmLabel="Save"
        showCancel={false}
        onConfirm={() => setIsPermissionModalOpen(false)}
      >
        <div className="push-permission-form">
          <FormField
            title="Title"
            description="Enter a short, descriptive title for your message."
            required
            showHelpText={false}
          >
            <Input
              size="lg"
              aria-label="Permission request title"
              value={permissionTitle}
              onChange={(event) => setPermissionTitle(event.currentTarget.value)}
            />
          </FormField>
          <FormField
            title="Content"
            description="Invite users to opt into receiving notifications from your app."
            required
            showHelpText={false}
          >
            <TextArea
              size="lg"
              height="tall"
              aria-label="Permission request content"
              value={permissionContent}
              maxLength={400}
              countValue={permissionContentCount}
              showDrag={false}
              onChange={(event) => setPermissionContent(event.currentTarget.value)}
            />
          </FormField>
        </div>
      </Modal>

      <Modal
        open={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        size="md"
        className="push-schedule-modal"
        icon={<Icon name="calendar-event" category="time-date" size={24} />}
        iconTone="apps"
        title="Schedule Notification"
        description="Pick when you want this to send. You can cancel or edit it anytime before then."
        cancelLabel="CANCEL"
        confirmLabel="SAVE"
        intent="constructive"
        onConfirm={saveScheduledNotification}
      >
        <div className="push-schedule-form">
          <div className="push-schedule-quick-picks">
            <p className="push-schedule-quick-picks__title">Quick Picks</p>
            <div className="push-schedule-quick-picks__list">
              {SCHEDULE_QUICK_PICK_OPTIONS.map((option) => {
                const isSelected = scheduleQuickPick === option.value

                return (
                  <button
                    type="button"
                    className={`push-schedule-quick-picks__chip${isSelected ? ' push-schedule-quick-picks__chip--selected' : ''}`}
                    key={option.value}
                    onClick={() => applyScheduleQuickPick(option.value)}
                  >
                    {isSelected && <Icon name="check" category="general" size={16} />}
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="push-schedule-form__row">
            <ScheduleDatePicker
              value={scheduleDate}
              onChange={(nextScheduleDate) => {
                setScheduleDate(nextScheduleDate)
                setScheduleQuickPick('custom')
              }}
            />
            <DropdownSingle
              className="push-schedule-field push-schedule-time-dropdown"
              size="md"
              title="Time"
              showTitle
              showDescription={false}
              showHelpText={false}
              showLeadingIcon={false}
              usePortal
              portalAlign="start"
              placeholder="Select Time"
              options={SCHEDULE_TIME_OPTIONS}
              value={scheduleTime}
              onChange={(value) => {
                setScheduleTime(value)
                setScheduleQuickPick('custom')
              }}
            />
          </div>
          <DropdownSingle
            className="push-schedule-timezone"
            title="Timezone"
            showTitle
            showDescription={false}
            showHelpText={false}
            showLeadingIcon={false}
            usePortal
            portalAlign="start"
            options={SCHEDULE_TIMEZONE_OPTIONS}
            value={scheduleTimezone}
            onChange={setScheduleTimezone}
          />
        </div>
      </Modal>
      <EditScheduledNotificationModal
        open={editingNotification !== null}
        title={editTitle}
        setTitle={setEditTitle}
        content={editContent}
        setContent={setEditContent}
        appIconVariant={appIconVariant}
        appIconImageUrl={appIconImageUrl}
        appIconName={appIconName}
        appIconColor={appIconColor}
        appIconBg={appIconBg}
        appIconStyle={appIconStyle}
        audience={editAudience}
        setAudience={setEditAudience}
        appUserRoles={appUserRoles}
        deepLink={editDeepLink}
        setDeepLink={setEditDeepLink}
        deepLinkTargets={deepLinkTargets}
        scheduleDate={editScheduleDate}
        setScheduleDate={setEditScheduleDate}
        scheduleTime={editScheduleTime}
        setScheduleTime={setEditScheduleTime}
        onClose={closeScheduledNotificationEdit}
        onSave={saveScheduledNotificationEdit}
      />
      <PushCancelNotificationDialog
        open={cancelingNotification !== null}
        onClose={closeScheduledNotificationCancel}
        onConfirm={confirmScheduledNotificationCancel}
      />
    </>
  )
}

interface PushCancelNotificationDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

function PushCancelNotificationDialog({ open, onClose, onConfirm }: PushCancelNotificationDialogProps) {
  useEffect(() => {
    if (!open) return undefined

    const previousBodyOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape, true)

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.removeEventListener('keydown', closeOnEscape, true)
    }
  }, [onClose, open])

  if (!open) return null

  return createPortal(
    <div
      className="push-cancel-notification-dialog__backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className="push-cancel-notification-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-cancel-notification-dialog-title"
        aria-describedby="push-cancel-notification-dialog-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="push-cancel-notification-dialog__close"
          type="button"
          aria-label="Close cancel notification confirmation"
          onClick={onClose}
        >
          <Icon name="xmark" category="general" size={16} />
        </button>

        <div className="push-cancel-notification-dialog__layout">
          <span className="push-cancel-notification-dialog__thumbnail" aria-hidden="true">
            <Icon name="trash-exclamation-filled" category="general" size={40} />
          </span>
          <div className="push-cancel-notification-dialog__content">
            <div className="push-cancel-notification-dialog__copy">
              <h2 id="push-cancel-notification-dialog-title">Cancel this notificaiton?</h2>
              <p id="push-cancel-notification-dialog-description">
                <span>This notification will be canceled and can't be restored.</span>
                <span>Do you want to continue?</span>
              </p>
            </div>
          </div>
          <footer className="push-cancel-notification-dialog__footer">
            <Button variant="ghost" colorScheme="secondary" onClick={onClose}>
              No, Keep
            </Button>
            <Button colorScheme="destructive" onClick={onConfirm}>
              Yes, Delete
            </Button>
          </footer>
        </div>
      </section>
    </div>,
    document.body
  )
}

interface EditScheduledNotificationModalProps {
  open: boolean
  title: string
  setTitle: (title: string) => void
  content: string
  setContent: (content: string) => void
  appIconVariant: AppIconVariant
  appIconImageUrl: string | null
  appIconName: string
  appIconColor: string
  appIconBg: string
  appIconStyle: IconStyle
  audience: string[]
  setAudience: (audience: string[]) => void
  appUserRoles: AppRoleOption[]
  deepLink: string
  setDeepLink: (deepLink: string) => void
  deepLinkTargets: DeepLinkTarget[]
  scheduleDate: string
  setScheduleDate: (date: string) => void
  scheduleTime: string
  setScheduleTime: (time: string) => void
  onClose: () => void
  onSave: () => void
}

function EditScheduledNotificationModal({
  open,
  title,
  setTitle,
  content,
  setContent,
  appIconVariant,
  appIconImageUrl,
  appIconName,
  appIconColor,
  appIconBg,
  appIconStyle,
  audience,
  setAudience,
  appUserRoles,
  deepLink,
  setDeepLink,
  deepLinkTargets,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
  onClose,
  onSave,
}: EditScheduledNotificationModalProps) {
  const isSaveDisabled = title.trim().length === 0 || content.trim().length === 0

  useEffect(() => {
    if (!open) return undefined

    const previousBodyOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape, true)

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.removeEventListener('keydown', closeOnEscape, true)
    }
  }, [onClose, open])

  if (!open) return null

  return createPortal(
    <div
      className="push-edit-notification-modal__backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className="push-edit-notification-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-edit-notification-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="push-edit-notification-modal__header">
          <span className="push-edit-notification-modal__icon" aria-hidden="true">
            <Icon name="pencil-line-filled" category="editor" size={24} />
          </span>
          <div className="push-edit-notification-modal__header-copy">
            <h2 id="push-edit-notification-modal-title">Edit Scheduled Notification</h2>
            <p>Make changes to your notification before it goes live.</p>
          </div>
          <button
            className="push-edit-notification-modal__close"
            type="button"
            aria-label="Close edit scheduled notification"
            onClick={onClose}
          >
            <Icon name="xmark" category="general" size={20} />
          </button>
        </header>

        <div className="push-edit-notification-modal__body">
          <div className="push-edit-notification-modal__form">
            <label className="push-edit-notification-modal__field" htmlFor="edit-push-notification-title">
              <span className="push-edit-notification-modal__label">
                <span>Notification Title</span>
                <span className="push-edit-notification-modal__required">*</span>
              </span>
              <input
                id="edit-push-notification-title"
                className="push-edit-notification-modal__input"
                value={title}
                placeholder={NOTIFICATION_TITLE_PLACEHOLDER}
                onChange={(event) => setTitle(event.currentTarget.value)}
              />
            </label>

            <label className="push-edit-notification-modal__field" htmlFor="edit-push-notification-content">
              <span className="push-edit-notification-modal__label">
                <span>Notification Content</span>
                <span className="push-edit-notification-modal__required">*</span>
              </span>
              <span className="push-edit-notification-modal__textarea-control">
                <textarea
                  id="edit-push-notification-content"
                  className="push-edit-notification-modal__textarea"
                  value={content}
                  placeholder={NOTIFICATION_CONTENT_PLACEHOLDER}
                  maxLength={EDIT_NOTIFICATION_CONTENT_MAX_LENGTH}
                  onChange={(event) => setContent(event.currentTarget.value)}
                />
                <span className="push-edit-notification-modal__count">
                  <span>{content.length}</span>
                  <span>/</span>
                  <span>{EDIT_NOTIFICATION_CONTENT_MAX_LENGTH}</span>
                </span>
              </span>
            </label>

            <AudienceDropdown value={audience} onChange={setAudience} roles={appUserRoles} />
            <DeepLinkDropdown value={deepLink} onChange={setDeepLink} targets={deepLinkTargets} />

            <div className="push-edit-notification-modal__schedule-row">
              <ScheduleDatePicker value={scheduleDate} onChange={setScheduleDate} />
              <DropdownSingle
                className="push-schedule-field push-edit-notification-modal__time-dropdown"
                size="md"
                title="Time"
                showTitle
                showDescription={false}
                showHelpText={false}
                showLeadingIcon={false}
                usePortal
                portalAlign="start"
                placeholder="Select Time"
                options={SCHEDULE_TIME_OPTIONS}
                value={scheduleTime}
                onChange={setScheduleTime}
              />
            </div>
          </div>

          <div className="push-edit-notification-modal__preview">
            <div className="push-edit-notification-modal__preview-header">Quick Preview</div>
            <div className="push-edit-notification-modal__preview-body">
              <div className="push-edit-notification-modal__phone">
                <PushNotificationPreview
                  title={title}
                  content={content}
                  appIconVariant={appIconVariant}
                  appIconImageUrl={appIconImageUrl}
                  appIconName={appIconName}
                  appIconColor={appIconColor}
                  appIconBg={appIconBg}
                  appIconStyle={appIconStyle}
                />
              </div>
            </div>
          </div>
        </div>

        <footer className="push-edit-notification-modal__footer">
          <Button variant="filled" colorScheme="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="constructive" disabled={isSaveDisabled} onClick={onSave}>
            Save Changes
          </Button>
        </footer>
      </section>
    </div>,
    document.body
  )
}

interface PushNotificationHistoryProps {
  notifications: PushNotificationHistoryItem[]
  onScheduledNotificationEdit: (notification: PushNotificationHistoryItem) => void
  onScheduledNotificationCancel: (notification: PushNotificationHistoryItem) => void
}

function PushNotificationHistory({
  notifications,
  onScheduledNotificationEdit,
  onScheduledNotificationCancel,
}: PushNotificationHistoryProps) {
  const [visibleCount, setVisibleCount] = useState(5)
  const visibleNotifications = notifications.slice(0, visibleCount)
  const hasMoreNotifications = visibleCount < notifications.length

  return (
    <section className="push-notification-history" aria-labelledby="push-notification-history-title">
      <h2 id="push-notification-history-title" className="push-notification-history__title">
        PUSH NOTIFICATION HISTORY
      </h2>
      {notifications.length > 0 ? (
        <>
          <div className="push-notification-history__list">
            {visibleNotifications.map((notification) => (
              <PushNotificationHistoryCard
                key={notification.id}
                notification={notification}
                onEdit={onScheduledNotificationEdit}
                onCancel={onScheduledNotificationCancel}
              />
            ))}
          </div>
          {hasMoreNotifications && (
            <Button
              className="push-notification-history__show-more"
              variant="filled"
              colorScheme="secondary"
              onClick={() => setVisibleCount((count) => count + 5)}
            >
              SHOW MORE
            </Button>
          )}
        </>
      ) : (
        <PushNotificationHistoryEmptyCard />
      )}
    </section>
  )
}

interface PushNotificationHistoryCardProps {
  notification: PushNotificationHistoryItem
  onEdit: (notification: PushNotificationHistoryItem) => void
  onCancel: (notification: PushNotificationHistoryItem) => void
}

function PushNotificationHistoryCard({ notification, onEdit, onCancel }: PushNotificationHistoryCardProps) {
  const isScheduled = notification.status === 'scheduled'
  const statusBadgeLabel = isScheduled ? notification.statusLabel : 'Send'
  const destinationLabel = getDisplayDeepLinkLabel(notification.deepLinkLabel)
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false)
  const [actionsMenuStyle, setActionsMenuStyle] = useState<CSSProperties>({ visibility: 'hidden' })
  const actionsMenuButtonRef = useRef<HTMLButtonElement>(null)
  const actionsMenuRef = useRef<HTMLDivElement>(null)
  const actionsMenuItems = useMemo(
    () => (
      isScheduled
        ? [
            { label: 'Edit', icon: 'pencil-line-filled', category: 'editor' },
            { label: 'Preview', icon: 'eye-filled', category: 'general' },
            { label: 'Duplicate', icon: 'copy-filled', category: 'general' },
            { label: 'Cancel Notification', icon: 'xmark-circle-filled', category: 'general', danger: true },
          ]
        : [
            { label: 'Preview', icon: 'eye-filled', category: 'general' },
            { label: 'Duplicate', icon: 'copy-filled', category: 'general' },
            { label: 'Delete Notification', icon: 'trash-filled', category: 'general', danger: true },
          ]
    ),
    [isScheduled]
  )

  useLayoutEffect(() => {
    if (!isActionsMenuOpen || !actionsMenuButtonRef.current) return

    const updateMenuPosition = () => {
      const triggerRect = actionsMenuButtonRef.current?.getBoundingClientRect()
      if (!triggerRect) return

      const menuWidth = 200
      const menuHeight = actionsMenuItems.length * 40 + 2
      const viewportGap = 8
      const menuGap = 4
      const nextLeft = Math.min(
        window.innerWidth - menuWidth - viewportGap,
        Math.max(viewportGap, triggerRect.right - menuWidth)
      )
      const hasRoomBelow = triggerRect.bottom + menuGap + menuHeight <= window.innerHeight - viewportGap
      const nextTop = hasRoomBelow
        ? triggerRect.bottom + menuGap
        : Math.max(viewportGap, triggerRect.top - menuHeight - menuGap)

      setActionsMenuStyle({
        top: nextTop,
        left: nextLeft,
        visibility: 'visible',
      })
    }

    updateMenuPosition()
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)

    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [actionsMenuItems.length, isActionsMenuOpen])

  useEffect(() => {
    if (!isActionsMenuOpen) return

    const closeMenuOnOutsideInteraction = (event: MouseEvent) => {
      const target = event.target as Node
      if (actionsMenuButtonRef.current?.contains(target)) return
      if (actionsMenuRef.current?.contains(target)) return
      setIsActionsMenuOpen(false)
    }

    const closeMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsActionsMenuOpen(false)
        actionsMenuButtonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', closeMenuOnOutsideInteraction)
    document.addEventListener('keydown', closeMenuOnEscape)

    return () => {
      document.removeEventListener('mousedown', closeMenuOnOutsideInteraction)
      document.removeEventListener('keydown', closeMenuOnEscape)
    }
  }, [isActionsMenuOpen])

  const closeActionsMenu = () => setIsActionsMenuOpen(false)

  return (
    <article
      className={`push-notification-history-card push-notification-history-card--${notification.status}`}
      aria-label={`${notification.statusLabel} push notification`}
    >
      <div className="push-notification-history-card__rail" aria-hidden="true">
        <Icon
          name={isScheduled ? 'clock-filled' : 'check-circle-filled'}
          category={isScheduled ? 'time-date' : 'general'}
          size={18}
        />
      </div>
      <div className="push-notification-history-card__content">
        <div className="push-notification-history-card__message">
          <div className="push-notification-history-card__header">
            <h3 className="push-notification-history-card__title">{notification.title}</h3>
            <span className="push-notification-history-card__badge">{statusBadgeLabel}</span>
          </div>
          <p className="push-notification-history-card__description">{notification.content}</p>
        </div>
        <div className="push-notification-history-card__metadata" aria-label="Notification details">
          <span className="push-notification-history-card__metadata-item">
            <Icon name="users-filled" category="users" size={12} />
            <span>{notification.audienceLabel}</span>
          </span>
          <span className="push-notification-history-card__metadata-separator" aria-hidden="true" />
          <span className="push-notification-history-card__metadata-item">
            <Icon name="arrow-up-right-from-square" category="arrows" size={12} />
            <span>{destinationLabel}</span>
          </span>
          <span className="push-notification-history-card__metadata-separator" aria-hidden="true" />
          <span className="push-notification-history-card__metadata-item">
            <Icon name="calendar" category="time-date" size={12} />
            <span>{notification.scheduledAtLabel}</span>
          </span>
        </div>
        {isScheduled ? (
          <span className="push-notification-history-card__live-pill">
            <Icon name="clock-filled" category="time-date" size={12} />
            <span>{notification.liveInLabel}</span>
          </span>
        ) : (
          <>
            <span className="push-notification-history-card__divider" aria-hidden="true" />
            <div className="push-notification-history-card__metrics" aria-label="Notification delivery metrics">
              {SENT_NOTIFICATION_METRICS.map((metric) => (
                <span key={metric.label} className="push-notification-history-card__metric">
                  <span className="push-notification-history-card__metric-label">{metric.label}</span>
                  <span className="push-notification-history-card__metric-value">{metric.value}</span>
                </span>
              ))}
            </div>
          </>
        )}
      </div>
      <button
        ref={actionsMenuButtonRef}
        className="push-notification-history-card__menu"
        type="button"
        aria-label="Notification actions"
        aria-haspopup="menu"
        aria-expanded={isActionsMenuOpen}
        onClick={() => setIsActionsMenuOpen((currentOpen) => !currentOpen)}
      >
        <Icon name="ellipsis-horizontal" category="general" size={10} />
      </button>
      {isActionsMenuOpen && createPortal(
        <div
          ref={actionsMenuRef}
          className="push-notification-history-card__actions-menu"
          role="menu"
          aria-label={`${notification.statusLabel} notification actions`}
          style={actionsMenuStyle}
        >
          {actionsMenuItems.map((item) => (
            <button
              key={item.label}
              className={`push-notification-history-card__actions-menu-item${item.danger ? ' push-notification-history-card__actions-menu-item--danger' : ''}`}
              type="button"
              role="menuitem"
              onClick={() => {
                closeActionsMenu()
                if (item.label === 'Edit') {
                  onEdit(notification)
                }
                if (item.label === 'Cancel Notification') {
                  onCancel(notification)
                }
              }}
            >
              <Icon name={item.icon} category={item.category} size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </article>
  )
}

function PushNotificationHistoryEmptyCard() {
  return (
    <div className="push-notification-history__empty">
      <div className="push-notification-history__empty-content">
        <span className="push-notification-history__empty-icon" aria-hidden="true">
          <img src={historyEmptyIcon} alt="" />
        </span>
        <div className="push-notification-history__empty-copy">
          <h3>No notifications yet</h3>
          <p>
            <span>Sent notifications will appear here so you can track delivery and engagement.</span>
          </p>
        </div>
      </div>
    </div>
  )
}

interface PushComposerFieldLabelProps {
  htmlFor: string
  children: ReactNode
  required?: boolean
  showAddField?: boolean
  onAddField?: (field: PushComposerFieldOption) => void
}

function PushComposerFieldLabel({
  htmlFor,
  children,
  required = false,
  showAddField = false,
  onAddField,
}: PushComposerFieldLabelProps) {
  const [isAddFieldMenuOpen, setIsAddFieldMenuOpen] = useState(false)
  const addFieldRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isAddFieldMenuOpen) return undefined

    const handlePointerDown = (event: MouseEvent) => {
      if (addFieldRef.current?.contains(event.target as Node)) return

      setIsAddFieldMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [isAddFieldMenuOpen])

  return (
    <div className="push-composer-field__label">
      <span className="push-composer-field__label-main">
        <label className="push-composer-field__title" htmlFor={htmlFor}>
          {children}
        </label>
        {required && <span className="push-composer-field__required">*</span>}
      </span>
      {showAddField && (
        <div className="push-composer-field__add-wrapper" ref={addFieldRef}>
          <TextLink
            className="push-composer-field__add"
            size="sm"
            leftIcon={<Icon name="plus-circle-filled" category="general" size={16} />}
            aria-haspopup="menu"
            aria-expanded={isAddFieldMenuOpen}
            onClick={() => setIsAddFieldMenuOpen((currentOpen) => !currentOpen)}
          >
            Add Field
          </TextLink>
          {isAddFieldMenuOpen && (
            <div className="push-composer-field__add-menu" role="menu" aria-label="Add field menu">
              {PUSH_COMPOSER_FIELD_OPTIONS.map((option) => (
                <button
                  type="button"
                  className="push-composer-field__add-menu-item"
                  role="menuitem"
                  key={option.value}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onAddField?.(option)
                    setIsAddFieldMenuOpen(false)
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface PushComposerTokenInputProps {
  id: string
  value: string
  suffixValue: string
  fields: PushComposerFieldOption[]
  placeholder: string
  'aria-label': string
  onChange: (value: string) => void
  onFieldsChange: (fields: PushComposerFieldOption[]) => void
  onSuffixChange: (value: string) => void
}

interface PushComposerTokenEditorHandle {
  insertField: (field: PushComposerFieldOption) => boolean
}

interface PushComposerSegment {
  type: 'text' | 'field'
  text?: string
  field?: PushComposerFieldOption
}

const PUSH_COMPOSER_FIELD_TOKEN_PREFIX = '{{'
const PUSH_COMPOSER_FIELD_TOKEN_SUFFIX = '}}'

function getPushComposerFieldMarker(field: PushComposerFieldOption) {
  return `${PUSH_COMPOSER_FIELD_TOKEN_PREFIX}${field.value}${PUSH_COMPOSER_FIELD_TOKEN_SUFFIX}`
}

function getPushComposerFieldOption(value: string) {
  return PUSH_COMPOSER_FIELD_OPTIONS.find((option) => option.value === value) ?? { value, label: value }
}

function parsePushComposerSerializedSegments(serializedValue: string): PushComposerSegment[] {
  if (!serializedValue) return []

  const markerPattern = /\{\{([^{}]+)\}\}/g
  const segments: PushComposerSegment[] = []
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = markerPattern.exec(serializedValue)) !== null) {
    if (match.index > cursor) {
      segments.push({ type: 'text', text: serializedValue.slice(cursor, match.index) })
    }

    segments.push({ type: 'field', field: getPushComposerFieldOption(match[1]) })
    cursor = markerPattern.lastIndex
  }

  if (cursor < serializedValue.length) {
    segments.push({ type: 'text', text: serializedValue.slice(cursor) })
  }

  return segments
}

function serializePushComposerSegments(segments: PushComposerSegment[]) {
  return segments.map((segment) => (
    segment.type === 'field' && segment.field
      ? getPushComposerFieldMarker(segment.field)
      : segment.text ?? ''
  )).join('')
}

function getPushComposerSerializedValue(
  value: string,
  fields: PushComposerFieldOption[],
  suffixValue: string,
) {
  if (fields.length === 0 && suffixValue.length === 0) return value

  return serializePushComposerSegments([
    { type: 'text', text: value },
    ...fields.map((field) => ({ type: 'field' as const, field })),
    { type: 'text', text: suffixValue },
  ])
}

function useMeasuredInputWidth(value: string, inputRef: RefObject<HTMLInputElement | null>) {
  const [width, setWidth] = useState<string | undefined>()

  useLayoutEffect(() => {
    const input = inputRef.current

    if (!input || value.length === 0) {
      setWidth(undefined)
      return undefined
    }

    const measure = () => {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      if (!context) {
        setWidth(`${Math.max(value.length, 1)}ch`)
        return
      }

      const style = window.getComputedStyle(input)
      context.font = [
        style.fontStyle,
        style.fontVariant,
        style.fontWeight,
        style.fontSize,
        style.fontFamily,
      ].join(' ')
      setWidth(`${Math.ceil(context.measureText(value).width)}px`)
    }

    measure()

    if (!document.fonts) return undefined

    let isActive = true
    void document.fonts.ready.then(() => {
      if (isActive) measure()
    })

    return () => {
      isActive = false
    }
  }, [inputRef, value])

  return width
}

const PushComposerTokenInput = forwardRef<PushComposerTokenEditorHandle, PushComposerTokenInputProps>(function PushComposerTokenInput({
  id,
  value,
  suffixValue,
  fields,
  placeholder,
  'aria-label': ariaLabel,
  onChange,
  onFieldsChange,
  onSuffixChange,
}: PushComposerTokenInputProps, ref) {
  const editorRef = useRef<HTMLDivElement>(null)
  const textInputRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const activeOffsetRef = useRef<number | null>(null)
  const pendingSelectionOffsetRef = useRef<number | null>(null)
  const serializedValue = getPushComposerSerializedValue(value, fields, suffixValue)
  const segments = useMemo<PushComposerSegment[]>(() => {
    const parsedSegments = parsePushComposerSerializedSegments(serializedValue)
    const nextSegments: PushComposerSegment[] = []

    if (parsedSegments.length === 0) return [{ type: 'text' as const, text: '' }]

    parsedSegments.forEach((segment) => {
      if (segment.type === 'field' && nextSegments.at(-1)?.type !== 'text') {
        nextSegments.push({ type: 'text', text: '' })
      }

      nextSegments.push(segment)
    })

    if (nextSegments.at(-1)?.type !== 'text') {
      nextSegments.push({ type: 'text', text: '' })
    }

    return nextSegments
  }, [serializedValue])
  const isEmpty = serializedValue.length === 0

  const getSegmentStart = (segmentIndex: number, sourceSegments = segments) => {
    return sourceSegments.slice(0, segmentIndex).reduce((offset, segment) => (
      offset + (
        segment.type === 'field' && segment.field
          ? getPushComposerFieldMarker(segment.field).length
          : segment.text?.length ?? 0
      )
    ), 0)
  }

  const commitSerializedValue = (nextValue: string) => {
    onChange(nextValue)

    if (fields.length > 0) {
      onFieldsChange([])
    }

    if (suffixValue.length > 0) {
      onSuffixChange('')
    }
  }

  const getInputSelectionOffset = (segmentIndex: number, input: HTMLInputElement) => {
    return getSegmentStart(segmentIndex) + (input.selectionStart ?? input.value.length)
  }

  const updateActiveOffset = (segmentIndex: number, input: HTMLInputElement) => {
    activeOffsetRef.current = getInputSelectionOffset(segmentIndex, input)
  }

  const getTextFocusTarget = (offset: number) => {
    let runningOffset = 0
    let lastTextSegmentIndex = 0

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index]

      if (segment.type === 'text') {
        const textLength = segment.text?.length ?? 0
        lastTextSegmentIndex = index

        if (offset <= runningOffset + textLength) {
          return { index, offset: Math.max(0, offset - runningOffset) }
        }

        runningOffset += textLength
        continue
      }

      const markerLength = segment.field ? getPushComposerFieldMarker(segment.field).length : 0

      if (offset <= runningOffset + markerLength) {
        const nextTextIndex = segments.findIndex((nextSegment, nextIndex) => (
          nextIndex > index && nextSegment.type === 'text'
        ))

        return { index: nextTextIndex === -1 ? lastTextSegmentIndex : nextTextIndex, offset: 0 }
      }

      runningOffset += markerLength
    }

    const lastText = segments[lastTextSegmentIndex]
    return { index: lastTextSegmentIndex, offset: lastText.type === 'text' ? lastText.text?.length ?? 0 : 0 }
  }

  const getLastTextSegmentIndex = () => {
    for (let index = segments.length - 1; index >= 0; index -= 1) {
      if (segments[index].type === 'text') return index
    }

    return 0
  }

  useLayoutEffect(() => {
    const nextOffset = pendingSelectionOffsetRef.current

    if (nextOffset === null) return

    const target = getTextFocusTarget(nextOffset)
    const input = textInputRefs.current[target.index]

    input?.focus()
    input?.setSelectionRange(target.offset, target.offset)
    pendingSelectionOffsetRef.current = null
  }, [serializedValue])

  useImperativeHandle(ref, () => ({
    insertField(field) {
      const insertOffset = activeOffsetRef.current ?? serializedValue.length
      const marker = getPushComposerFieldMarker(field)
      const nextValue = `${serializedValue.slice(0, insertOffset)}${marker}${serializedValue.slice(insertOffset)}`

      pendingSelectionOffsetRef.current = insertOffset + marker.length
      activeOffsetRef.current = insertOffset + marker.length
      commitSerializedValue(nextValue)

      return true
    },
  }), [fields.length, onChange, onFieldsChange, onSuffixChange, serializedValue, suffixValue.length])

  const updateTextSegment = (segmentIndex: number, nextText: string, selectionOffset: number) => {
    const nextSegments: PushComposerSegment[] = segments.map((segment, index) => (
      index === segmentIndex ? { type: 'text' as const, text: nextText } : segment
    ))
    const nextOffset = getSegmentStart(segmentIndex, nextSegments) + selectionOffset

    pendingSelectionOffsetRef.current = nextOffset
    activeOffsetRef.current = nextOffset
    commitSerializedValue(serializePushComposerSegments(nextSegments))
  }

  const removeFieldAt = (fieldSegmentIndex: number, focusOffset: number) => {
    const nextSegments = segments.filter((_, index) => index !== fieldSegmentIndex)

    pendingSelectionOffsetRef.current = focusOffset
    activeOffsetRef.current = focusOffset
    commitSerializedValue(serializePushComposerSegments(nextSegments))
  }

  const handleTextKeyDown = (segmentIndex: number, event: ReactKeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const selectionStart = input.selectionStart ?? 0
    const selectionEnd = input.selectionEnd ?? selectionStart

    if (selectionStart !== selectionEnd) return

    if (event.key === 'Backspace' && selectionStart === 0) {
      const previousSegmentIndex = segmentIndex - 1
      const previousSegment = segments[previousSegmentIndex]

      if (previousSegment?.type === 'field') {
        event.preventDefault()
        removeFieldAt(previousSegmentIndex, getSegmentStart(previousSegmentIndex))
      }
    }

    if (event.key === 'Delete' && selectionStart === input.value.length) {
      const nextSegmentIndex = segmentIndex + 1
      const nextSegment = segments[nextSegmentIndex]

      if (nextSegment?.type === 'field') {
        event.preventDefault()
        removeFieldAt(nextSegmentIndex, getSegmentStart(nextSegmentIndex))
      }
    }
  }

  return (
    <div className="jf-input jf-input--md jf-input--default push-composer-token-input">
      <div
        ref={editorRef}
        id={id}
        className="jf-input__field push-composer-token-editor"
        role="textbox"
        aria-label={ariaLabel}
        tabIndex={0}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            event.preventDefault()
            const targetIndex = getLastTextSegmentIndex()
            const targetInput = textInputRefs.current[targetIndex]
            targetInput?.focus()
          }
        }}
        onFocus={(event) => {
          if (event.target !== event.currentTarget) return

          const targetIndex = getLastTextSegmentIndex()
          const targetInput = textInputRefs.current[targetIndex]
          targetInput?.focus()
        }}
      >
        {segments.map((segment, index) => (
          segment.type === 'field' && segment.field ? (
            <span
              className="push-composer-field-token"
              data-push-composer-field={segment.field.value}
              key={`field-${segment.field.value}-${index}`}
              onMouseDown={() => {
                activeOffsetRef.current = getSegmentStart(index) + getPushComposerFieldMarker(segment.field as PushComposerFieldOption).length
              }}
            >
              {segment.field.label}
            </span>
          ) : (
            <input
              ref={(node) => { textInputRefs.current[index] = node }}
              className={`push-composer-token-editor__text${index === segments.length - 1 ? ' push-composer-token-editor__text--tail' : ''}`}
              aria-label={ariaLabel}
              value={segment.text ?? ''}
              placeholder={isEmpty ? placeholder : undefined}
              style={index === segments.length - 1 ? undefined : { width: `${Math.max((segment.text ?? '').length, 1)}ch` }}
              key={`text-${index}`}
              onChange={(event) => {
                updateTextSegment(index, event.currentTarget.value, event.currentTarget.selectionStart ?? event.currentTarget.value.length)
              }}
              onFocus={(event) => updateActiveOffset(index, event.currentTarget)}
              onClick={(event) => updateActiveOffset(index, event.currentTarget)}
              onKeyUp={(event) => updateActiveOffset(index, event.currentTarget)}
              onKeyDown={(event) => handleTextKeyDown(index, event)}
            />
          )
        ))}
      </div>
    </div>
  )
})

interface PushComposerTokenTextAreaProps {
  id: string
  value: string
  suffixValue: string
  fields: PushComposerFieldOption[]
  fieldValues: PushComposerFieldValues
  placeholder: string
  'aria-label': string
  maxLength: number
  onChange: (value: string) => void
  onSuffixChange: (value: string) => void
  onRemoveField: (index: number) => void
}

function PushComposerTokenTextArea({
  id,
  value,
  suffixValue,
  fields,
  fieldValues,
  placeholder,
  'aria-label': ariaLabel,
  maxLength,
  onChange,
  onSuffixChange,
  onRemoveField,
}: PushComposerTokenTextAreaProps) {
  const prefixInputRef = useRef<HTMLInputElement | null>(null)
  const suffixInputRef = useRef<HTMLInputElement | null>(null)
  const firstTokenRef = useRef<HTMLSpanElement | null>(null)
  const [isPrefixActive, setIsPrefixActive] = useState(false)
  const hasFields = fields.length > 0
  const hasText = value.length > 0
  const prefixInputWidth = useMeasuredInputWidth(value, prefixInputRef)
  const showPrefixInput = !hasFields || hasText || isPrefixActive
  const countValue = formatPushComposerText(value, fields, suffixValue, fieldValues).length

  const updatePrefixValue = (nextValue: string) => {
    if (formatPushComposerText(nextValue, fields, suffixValue, fieldValues).length > maxLength) return

    onChange(nextValue)
  }

  const updateSuffixValue = (nextValue: string) => {
    if (formatPushComposerText(value, fields, nextValue, fieldValues).length > maxLength) return

    onSuffixChange(nextValue)
  }

  const handlePrefixKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Delete' || fields.length === 0) return

    const input = event.currentTarget
    const selectionStart = input.selectionStart ?? input.value.length
    const selectionEnd = input.selectionEnd ?? selectionStart
    const hasSelection = selectionStart !== selectionEnd
    const isAtEnd = selectionStart >= input.value.length

    if (hasSelection || !isAtEnd) return

    event.preventDefault()
    onRemoveField(0)
    window.requestAnimationFrame(() => prefixInputRef.current?.focus())
  }

  const handleSuffixKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if ((event.key !== 'Delete' && event.key !== 'Backspace') || fields.length === 0) return

    const input = event.currentTarget
    const selectionStart = input.selectionStart ?? 0
    const selectionEnd = input.selectionEnd ?? selectionStart
    const hasSelection = selectionStart !== selectionEnd
    const shouldRemovePreviousField =
      event.key === 'Backspace' ? selectionStart === 0 : suffixValue.length === 0

    if (hasSelection || !shouldRemovePreviousField) return

    event.preventDefault()
    onRemoveField(fields.length - 1)
    window.requestAnimationFrame(() => suffixInputRef.current?.focus())
  }

  if (!hasFields) {
    return (
      <TextArea
        id={id}
        size="md"
        height="compact"
        aria-label={ariaLabel}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        countValue={value.length}
        showDrag={false}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    )
  }

  const focusInputAroundToken = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (target instanceof HTMLInputElement) return

    event.preventDefault()

    const firstTokenBounds = firstTokenRef.current?.getBoundingClientRect()
    const shouldFocusPrefix = firstTokenBounds ? event.clientX <= firstTokenBounds.left : false
    const nextInput = shouldFocusPrefix ? prefixInputRef.current : suffixInputRef.current

    if (shouldFocusPrefix) {
      setIsPrefixActive(true)
    }

    window.requestAnimationFrame(() => {
      const input = shouldFocusPrefix ? prefixInputRef.current : nextInput
      input?.focus()
    })
  }

  return (
    <div
      className="jf-textarea jf-textarea--md jf-textarea--height-compact jf-textarea--default push-composer-token-textarea"
      onMouseDown={focusInputAroundToken}
    >
      <div className="jf-textarea__wrapper">
        <div className="push-composer-token-textarea__field">
          {showPrefixInput && (
            <input
              ref={prefixInputRef}
              id={id}
              className="push-composer-token-textarea__input push-composer-token-textarea__input--prefix"
              aria-label={`${ariaLabel} before field`}
              value={value}
              style={prefixInputWidth ? { width: prefixInputWidth } : undefined}
              onFocus={() => setIsPrefixActive(true)}
              onBlur={() => {
                if (value.length === 0) {
                  setIsPrefixActive(false)
                }
              }}
              onChange={(event) => updatePrefixValue(event.currentTarget.value)}
              onKeyDown={handlePrefixKeyDown}
            />
          )}
          {fields.map((field, index) => (
            <span
              className="push-composer-field-token"
              key={`${field.value}-${index}`}
              ref={index === 0 ? firstTokenRef : undefined}
            >
              {field.label}
            </span>
          ))}
          <input
            ref={suffixInputRef}
            className="push-composer-token-textarea__input push-composer-token-textarea__input--suffix"
            aria-label={`${ariaLabel} after field`}
            value={suffixValue}
            onChange={(event) => updateSuffixValue(event.currentTarget.value)}
            onKeyDown={handleSuffixKeyDown}
          />
        </div>
        <div className="jf-textarea__count">
          <span className="jf-textarea__count-current">{countValue}</span>
          <span className="jf-textarea__count-separator">/</span>
          <span className="jf-textarea__count-limit">{maxLength}</span>
        </div>
      </div>
    </div>
  )
}

interface PushNotificationComposerProps {
  titleEditorRef: RefObject<PushComposerTokenEditorHandle | null>
  title: string
  setTitle: (title: string) => void
  titleFields: PushComposerFieldOption[]
  setTitleFields: (fields: PushComposerFieldOption[]) => void
  onTitleFieldAdd: (field: PushComposerFieldOption) => void
  titleSuffix: string
  setTitleSuffix: (title: string) => void
  content: string
  setContent: (content: string) => void
  contentFields: PushComposerFieldOption[]
  onContentFieldAdd: (field: PushComposerFieldOption) => void
  onContentFieldRemove: (index: number) => void
  contentSuffix: string
  setContentSuffix: (content: string) => void
  fieldValues: PushComposerFieldValues
  audience: string[]
  setAudience: (audience: string[]) => void
  appUserRoles: AppRoleOption[]
  deepLinkTargets: DeepLinkTarget[]
  deepLink: string
  setDeepLink: (deepLink: string) => void
  image: PushComposerSelectedImage | null
  setImage: (image: PushComposerSelectedImage | null) => void
}

interface AudienceDropdownOption {
  id: string
  label: string
  role?: AppRoleOption
}

interface AudienceDropdownProps {
  value: string[]
  onChange: (value: string[]) => void
  roles: AppRoleOption[]
}

function AudienceDropdown({ value, onChange, roles }: AudienceDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const options = useMemo<AudienceDropdownOption[]>(() => [
    { id: ALL_USERS_AUDIENCE_ID, label: 'All Users' },
    ...roles.map((role) => ({ id: role.id, label: role.label, role })),
  ], [roles])
  const selectedOptions = options.filter((option) => value.includes(option.id))
  const selectedRoleOptions = selectedOptions.filter((option) => option.role)
  const selectedLabel = selectedOptions.length > 0
    ? selectedOptions.map((option) => option.label).join(', ')
    : NOTIFICATION_AUDIENCE_PLACEHOLDER

  useEffect(() => {
    const optionIds = new Set(options.map((option) => option.id))
    const nextValue = value.filter((selectedId) => optionIds.has(selectedId))

    if (nextValue.length === value.length && nextValue.every((selectedId, index) => selectedId === value[index])) {
      return
    }

    onChange(nextValue)
  }, [onChange, options, value])

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return

      setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [open])

  const toggleOption = (optionId: string) => {
    if (optionId === ALL_USERS_AUDIENCE_ID) {
      onChange([ALL_USERS_AUDIENCE_ID])
      return
    }

    const roleIds = value.filter((selectedId) => selectedId !== ALL_USERS_AUDIENCE_ID)
    const isSelected = roleIds.includes(optionId)
    const nextRoleIds = isSelected
      ? roleIds.filter((selectedId) => selectedId !== optionId)
      : [...roleIds, optionId]

    onChange(nextRoleIds.length > 0 ? nextRoleIds : [ALL_USERS_AUDIENCE_ID])
  }

  return (
    <div className="jf-dropdown-wrapper push-composer-dropdown push-audience-dropdown">
      <div className="jf-dropdown-wrapper__label">
        <div className="jf-dropdown-wrapper__title">
          <span className="jf-dropdown-wrapper__title-text">Audience</span>
        </div>
      </div>

      <div className="jf-dropdown__root" ref={rootRef}>
        <button
          type="button"
          className={`jf-dropdown jf-dropdown--md${open ? ' jf-dropdown--open' : ''}`}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((currentOpen) => !currentOpen)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false)
            }

            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setOpen(true)
            }
          }}
        >
          <span className={`jf-dropdown__value push-audience-dropdown__value${selectedRoleOptions.length > 0 ? ' push-audience-dropdown__value--chips' : ''}${selectedOptions.length === 0 ? ' jf-dropdown__value--placeholder' : ''}`}>
            {selectedRoleOptions.length > 0 ? (
              <span className="push-audience-dropdown__chips">
                {selectedRoleOptions.map((option) => (
                  <span
                    className="push-audience-dropdown__chip"
                    style={option.role ? getRoleColorStyle(option.role.color) : undefined}
                    key={option.id}
                  >
                    {option.label}
                  </span>
                ))}
              </span>
            ) : (
              selectedLabel
            )}
          </span>
          <span className="jf-dropdown__trailing">
            <Icon name={open ? 'angle-up' : 'angle-down'} category="arrows" size={24} />
          </span>
        </button>

        {open && (
          <div className="push-audience-dropdown__menu" role="menu" aria-label="Audience">
            {options.map((option) => {
              const isSelected = value.includes(option.id)

              return (
                <button
                  type="button"
                  className={`push-audience-dropdown__item${isSelected ? ' push-audience-dropdown__item--selected' : ''}`}
                  role="menuitemcheckbox"
                  aria-checked={isSelected}
                  key={option.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => toggleOption(option.id)}
                >
                  <span className={`push-audience-dropdown__checkbox${isSelected ? ' push-audience-dropdown__checkbox--checked' : ''}`} aria-hidden="true">
                    {isSelected && <Icon name="check" category="general" size={16} />}
                  </span>
                  <span className="push-audience-dropdown__item-label">{option.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

interface DeepLinkDropdownProps {
  value: string
  onChange: (value: string) => void
  targets: DeepLinkTarget[]
}

function DeepLinkDropdown({ value, onChange, targets }: DeepLinkDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const pageTargets = targets.filter((target) => target.type === 'page')
  const formTargets = targets.filter((target) => target.type === 'form')
  const selectedTarget = targets.find((target) => target.id === value)

  useEffect(() => {
    if (!value || selectedTarget) return

    onChange('')
  }, [onChange, selectedTarget, value])

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return

      setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [open])

  const selectTarget = (targetId: string) => {
    onChange(targetId)
    setOpen(false)
  }

  const renderGroup = (label: string, groupTargets: DeepLinkTarget[]) => {
    if (groupTargets.length === 0) return null

    return (
      <div className="push-deep-link-dropdown__section" role="group" aria-label={label}>
        <div className="push-deep-link-dropdown__heading">{label}</div>
        {groupTargets.map((target) => (
          <button
            type="button"
            className={`push-deep-link-dropdown__item${target.id === value ? ' push-deep-link-dropdown__item--selected' : ''}`}
            role="menuitemradio"
            aria-checked={target.id === value}
            key={target.id}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => selectTarget(target.id)}
          >
            {target.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="jf-dropdown-wrapper push-composer-dropdown push-deep-link-dropdown">
      <div className="jf-dropdown-wrapper__label">
        <div className="jf-dropdown-wrapper__title">
          <span className="jf-dropdown-wrapper__title-text">Page to open</span>
        </div>
      </div>

      <div className="jf-dropdown__root" ref={rootRef}>
        <button
          type="button"
          className={`jf-dropdown jf-dropdown--md${open ? ' jf-dropdown--open' : ''}`}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((currentOpen) => !currentOpen)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false)
            }

            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setOpen(true)
            }
          }}
        >
          <span className={`jf-dropdown__value${selectedTarget ? '' : ' jf-dropdown__value--placeholder'}`}>
            {selectedTarget?.label ?? NOTIFICATION_DEEP_LINK_PLACEHOLDER}
          </span>
          <span className="jf-dropdown__trailing">
            <Icon name={open ? 'angle-up' : 'angle-down'} category="arrows" size={24} />
          </span>
        </button>

        {open && (
          <div className="push-deep-link-dropdown__menu" role="menu" aria-label="Page to open">
            {renderGroup('PAGES', pageTargets)}
            {renderGroup('FORMS', formTargets)}
          </div>
        )}
      </div>
    </div>
  )
}

function PushNotificationComposer({
  titleEditorRef,
  title,
  setTitle,
  titleFields,
  setTitleFields,
  onTitleFieldAdd,
  titleSuffix,
  setTitleSuffix,
  content,
  setContent,
  contentFields,
  onContentFieldAdd,
  onContentFieldRemove,
  contentSuffix,
  setContentSuffix,
  fieldValues,
  audience,
  setAudience,
  appUserRoles,
  deepLinkTargets,
  deepLink,
  setDeepLink,
  image,
  setImage,
}: PushNotificationComposerProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)

  return (
    <section className="push-composer-panel" aria-label="Push notification composer">
      <div className="push-composer-panel__fields">
        <div className="push-composer-field">
          <PushComposerFieldLabel
            htmlFor="push-notification-title"
            required
            showAddField
            onAddField={onTitleFieldAdd}
          >
            Notification Title
          </PushComposerFieldLabel>
          <PushComposerTokenInput
            ref={titleEditorRef}
            id="push-notification-title"
            aria-label="Notification Title"
            value={title}
            suffixValue={titleSuffix}
            fields={titleFields}
            placeholder={NOTIFICATION_TITLE_PLACEHOLDER}
            onChange={setTitle}
            onFieldsChange={setTitleFields}
            onSuffixChange={setTitleSuffix}
          />
        </div>
        <div className="push-composer-field push-composer-field--content">
          <PushComposerFieldLabel
            htmlFor="push-notification-content"
            required
            showAddField
            onAddField={onContentFieldAdd}
          >
            Notification Content
          </PushComposerFieldLabel>
          <PushComposerTokenTextArea
            id="push-notification-content"
            aria-label="Notification Content"
            value={content}
            suffixValue={contentSuffix}
            fields={contentFields}
            fieldValues={fieldValues}
            placeholder={NOTIFICATION_CONTENT_PLACEHOLDER}
            maxLength={NOTIFICATION_CONTENT_MAX_LENGTH}
            onChange={setContent}
            onSuffixChange={setContentSuffix}
            onRemoveField={onContentFieldRemove}
          />
        </div>
        <div className="push-composer-image-field">
          <span className="push-composer-image-field__label">Image</span>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.currentTarget.value = ''

              if (!file) return

              compressImageFile(file).then((url) => {
                setImage({ url, name: file.name })
              })
            }}
          />
          {image ? (
            <div className="push-composer-image-field__preview">
              <img
                className="push-composer-image-field__thumbnail"
                src={image.url}
                alt=""
              />
              <div className="push-composer-image-field__details">
                <span className="push-composer-image-field__name" title={image.name}>
                  {image.name}
                </span>
                <Button
                  className="push-composer-image-field__remove"
                  variant="filled"
                  colorScheme="secondary"
                  size="sm"
                  leftIcon={<Icon name="trash-filled" category="general" size={16} />}
                  onClick={() => setImage(null)}
                >
                  Remove Image
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="push-composer-image-field__button"
              variant="filled"
              colorScheme="secondary"
              leftIcon={<Icon name="image-plus-filled" category="media" size={20} />}
              onClick={() => imageInputRef.current?.click()}
            >
              Upload Image
            </Button>
          )}
        </div>
      </div>
      <div className="push-composer-panel__divider" />
      <div className="push-composer-panel__dropdown-row">
        <AudienceDropdown value={audience} onChange={setAudience} roles={appUserRoles} />
        <DeepLinkDropdown value={deepLink} onChange={setDeepLink} targets={deepLinkTargets} />
      </div>
    </section>
  )
}

interface PushNotificationPreviewProps {
  title: string
  content: string
  image?: PushComposerSelectedImage | null
  appIconVariant?: AppIconVariant
  appIconImageUrl?: string | null
  appIconName?: string
  appIconColor?: string
  appIconBg?: string
  appIconStyle?: IconStyle
}

function mergePushComposerText(prefix: string, suffix: string) {
  if (!prefix) return suffix
  if (!suffix) return prefix

  return `${prefix}${/\s$/.test(prefix) || /^\s/.test(suffix) ? '' : ' '}${suffix}`
}

function getPushComposerFieldText(field: PushComposerFieldOption, fieldValues: PushComposerFieldValues = {}) {
  return fieldValues[field.value] ?? field.label
}

function appendPushComposerPlainText(currentText: string, nextText: string) {
  const normalizedNextText = nextText.replace(/\s+/g, ' ').trim()

  if (!normalizedNextText) return currentText
  if (!currentText) return normalizedNextText

  const shouldJoinDirectly =
    /\s$/.test(currentText) ||
    /^\s/.test(normalizedNextText) ||
    /^[,.;:!?)]/.test(normalizedNextText) ||
    /[(]$/.test(currentText)

  return `${currentText}${shouldJoinDirectly ? '' : ' '}${normalizedNextText}`
}

function formatPushComposerText(
  value: string,
  fields: PushComposerFieldOption[],
  suffix: string,
  fieldValues: PushComposerFieldValues = {},
) {
  return parsePushComposerSerializedSegments(getPushComposerSerializedValue(value, fields, suffix)).reduce((text, segment) => {
    if (segment.type === 'field' && segment.field) {
      return appendPushComposerPlainText(text, getPushComposerFieldText(segment.field, fieldValues))
    }

    return appendPushComposerPlainText(text, segment.text ?? '')
  }, '')
}

function formatPushNotificationTitle(
  title: string,
  fields: PushComposerFieldOption[],
  suffix: string,
  fieldValues: PushComposerFieldValues = {},
) {
  return formatPushComposerText(title, fields, suffix, fieldValues)
}

function getComposerHistoryText(
  value: string,
  fields: PushComposerFieldOption[],
  suffix: string,
  fallback: string,
  fieldValues: PushComposerFieldValues = {},
) {
  return formatPushComposerText(value, fields, suffix, fieldValues) || fallback
}

function getAudienceHistoryLabel(audience: string[], roles: AppRoleOption[]) {
  if (audience.includes(ALL_USERS_AUDIENCE_ID)) return 'All Users'

  const selectedRoles = roles.filter((role) => audience.includes(role.id))

  if (selectedRoles.length === 0) return 'All Users'
  if (selectedRoles.length === 1) return selectedRoles[0].label

  return `${selectedRoles.length} roles (${selectedRoles.map((role) => role.label).join(', ')})`
}

function getDeepLinkHistoryLabel(deepLink: string, targets: DeepLinkTarget[]) {
  const target = targets.find((currentTarget) => currentTarget.id === deepLink)

  if (!target) return 'No page to open'

  return `${target.type === 'form' ? 'Form' : 'Page'}: ${target.label}`
}

function getDisplayDeepLinkLabel(deepLinkLabel: string) {
  if (
    deepLinkLabel === 'No deep link' ||
    deepLinkLabel === 'No destination' ||
    deepLinkLabel === 'No page to open'
  ) {
    return 'No page to open'
  }

  return deepLinkLabel
}

function getHistoryAudienceValue(notification: PushNotificationHistoryItem, roles: AppRoleOption[]) {
  if (notification.audience && notification.audience.length > 0) {
    return notification.audience
  }

  const matchingRole = roles.find((role) => role.label === notification.audienceLabel)

  return matchingRole ? [matchingRole.id] : [ALL_USERS_AUDIENCE_ID]
}

function getHistoryDeepLinkValue(notification: PushNotificationHistoryItem, targets: DeepLinkTarget[]) {
  if (notification.deepLink) return notification.deepLink

  const displayLabel = getDisplayDeepLinkLabel(notification.deepLinkLabel)
  const matchingTarget = targets.find((target) => (
    `${target.type === 'form' ? 'Form' : 'Page'}: ${target.label}` === displayLabel ||
    target.label === displayLabel
  ))

  return matchingTarget?.id ?? ''
}

function parseScheduleTime(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)

  if (!match) return null

  const displayHours = Number(match[1])
  const minutes = Number(match[2])
  const period = match[3].toUpperCase()

  if (displayHours < 1 || displayHours > 12 || minutes < 0 || minutes > 59) return null

  const hours = (displayHours % 12) + (period === 'PM' ? 12 : 0)

  return { hours, minutes }
}

function getScheduleDateTime(scheduleDate: string, scheduleTime: string) {
  const date = parseScheduleDate(scheduleDate)
  const time = parseScheduleTime(scheduleTime)

  if (!date) return null

  const scheduledDate = new Date(date)
  if (time) {
    scheduledDate.setHours(time.hours, time.minutes, 0, 0)
  }

  return scheduledDate
}

function getScheduleHistoryDateTimeLabel(scheduleDate: string, scheduleTime: string) {
  const date = getScheduleDateTime(scheduleDate, scheduleTime)
  const time = parseScheduleTime(scheduleTime)

  if (!date) return scheduleTime || 'Not scheduled'

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)

  if (!time) return dateLabel

  return `${dateLabel}, ${formatScheduleTimeParts(time.hours, time.minutes)}`
}

function getNowHistoryDateTimeLabel() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date())
}

function pluralizeScheduleUnit(value: number, unit: string) {
  return `${value} ${unit}${value === 1 ? '' : 's'}`
}

function getScheduleLiveInLabel(scheduleDate: string, scheduleTime: string) {
  const date = getScheduleDateTime(scheduleDate, scheduleTime)

  if (!date) return 'Goes live once scheduled'

  const diff = date.getTime() - Date.now()
  if (diff <= 0) return 'Goes live soon'

  const minuteMs = 60 * 1000
  const hourMs = 60 * minuteMs
  const dayMs = 24 * hourMs
  const days = Math.floor(diff / dayMs)
  const hours = Math.floor((diff % dayMs) / hourMs)
  const minutes = Math.max(1, Math.ceil((diff % hourMs) / minuteMs))
  const parts: string[] = []

  if (days > 0) parts.push(pluralizeScheduleUnit(days, 'day'))
  if (hours > 0) parts.push(pluralizeScheduleUnit(hours, 'hour'))
  if (parts.length === 0) parts.push(pluralizeScheduleUnit(minutes, 'minute'))

  return `Goes live in ${parts.slice(0, 2).join(', ')}`
}

function getHistoryScheduleParts(scheduledAtLabel: string) {
  const monthIndexes: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  }
  const match = scheduledAtLabel.match(
    /^(?:[A-Za-z]{3},\s*)?([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})(?:,\s+(\d{1,2}:\d{2}\s+[AP]M))?/i,
  )

  if (!match) return { date: '', time: '' }

  const month = monthIndexes[match[1]]
  const day = Number(match[2])
  const year = Number(match[3])

  if (month === undefined || !Number.isFinite(day) || !Number.isFinite(year)) {
    return { date: '', time: match[4] ?? '' }
  }

  return {
    date: formatScheduleDate(new Date(year, month, day)),
    time: match[4] ?? '',
  }
}

function getHistoryScheduleDateValue(notification: PushNotificationHistoryItem) {
  return notification.scheduleDate ?? getHistoryScheduleParts(notification.scheduledAtLabel).date
}

function getHistoryScheduleTimeValue(notification: PushNotificationHistoryItem) {
  return notification.scheduleTime ?? getHistoryScheduleParts(notification.scheduledAtLabel).time
}

function PushPreviewStatusIndicators() {
  return (
    <span className="push-preview-phone__indicators" aria-hidden="true">
      <svg
        className="push-preview-phone__status-icon push-preview-phone__status-icon--signal"
        viewBox="0 0 14.1423 9.42819"
        fill="none"
      >
        <path d="M7.85683 2.35705C7.85683 1.92313 8.20859 1.57137 8.64251 1.57137H9.42819C9.86211 1.57137 10.2139 1.92313 10.2139 2.35705V8.64251C10.2139 9.07643 9.86211 9.42819 9.42819 9.42819H8.64251C8.20859 9.42819 7.85683 9.07643 7.85683 8.64251V2.35705Z" fill="currentColor" />
        <path d="M11.7852 0.785682C11.7852 0.351762 12.137 0 12.5709 0H13.3566C13.7905 0 14.1423 0.351762 14.1423 0.785683V8.64251C14.1423 9.07643 13.7905 9.42819 13.3566 9.42819H12.5709C12.137 9.42819 11.7852 9.07643 11.7852 8.64251V0.785682Z" fill="currentColor" />
        <path d="M3.92841 5.10694C3.92841 4.67302 4.28018 4.32125 4.7141 4.32125H5.49978C5.9337 4.32125 6.28546 4.67302 6.28546 5.10694V8.64251C6.28546 9.07643 5.9337 9.42819 5.49978 9.42819H4.7141C4.28018 9.42819 3.92841 9.07643 3.92841 8.64251V5.10694Z" fill="currentColor" />
        <path d="M0 7.07114C0 6.63722 0.351762 6.28546 0.785683 6.28546H1.57137C2.00529 6.28546 2.35705 6.63722 2.35705 7.07114V8.64251C2.35705 9.07643 2.00529 9.42819 1.57137 9.42819H0.785683C0.351762 9.42819 0 9.07643 0 8.64251V7.07114Z" fill="currentColor" />
      </svg>
      <svg
        className="push-preview-phone__status-icon push-preview-phone__status-icon--wifi"
        viewBox="0 0 13.3565 9.29736"
        fill="none"
      >
        <path d="M4.80469 7.00732C5.92026 6.04422 7.55437 6.0442 8.66993 7.00732C8.72597 7.0591 8.7582 7.13233 8.75977 7.20947C8.76132 7.28669 8.73175 7.36142 8.67774 7.41552L6.93067 9.21435C6.87949 9.26721 6.81011 9.29733 6.73731 9.29736C6.66447 9.29736 6.59418 9.26723 6.54297 9.21435L4.7959 7.41552C4.742 7.36139 4.71227 7.28665 4.71387 7.20947C4.71548 7.13226 4.74854 7.05908 4.80469 7.00732ZM2.44337 4.854C4.84678 2.57205 8.56825 2.57209 10.9717 4.854C11.0259 4.90751 11.0569 4.98109 11.0576 5.0581C11.0583 5.13483 11.0294 5.20864 10.9766 5.26318L9.9668 6.30517C9.86274 6.41152 9.69367 6.41359 9.58692 6.31005C8.79781 5.58081 7.7715 5.17632 6.70704 5.17626C5.64308 5.17671 4.61684 5.58115 3.82813 6.31005C3.72145 6.41352 3.5533 6.4113 3.44922 6.30517L2.43946 5.26318C2.3863 5.20868 2.35675 5.13501 2.35743 5.0581C2.35814 4.98107 2.38907 4.90751 2.44337 4.854ZM0.0839904 2.70459C3.77035 -0.901528 9.58611 -0.901528 13.2725 2.70459C13.3256 2.75803 13.3559 2.83058 13.3565 2.90673C13.3569 2.98292 13.3279 3.05667 13.2754 3.11084L12.2637 4.15283C12.1595 4.25952 11.9905 4.26092 11.8848 4.15576C10.4803 2.79283 8.61661 2.0328 6.67872 2.03271C4.7406 2.03271 2.87636 2.79269 1.47169 4.15576C1.36598 4.26103 1.19684 4.25982 1.09278 4.15283L0.0820373 3.11084C0.0293344 3.05659 -0.000486391 2.98313 6.00264e-06 2.90673C0.000605625 2.83065 0.0308943 2.75799 0.0839904 2.70459Z" fill="currentColor" />
      </svg>
      <svg
        className="push-preview-phone__status-icon push-preview-phone__status-icon--battery"
        viewBox="0 0 21.529 10.214"
        fill="none"
      >
        <path opacity="0.35" d="M3.14258 0.414062H17.2861C18.7927 0.414184 20.0136 1.63595 20.0137 3.14258V7.07129C20.0136 8.57792 18.7927 9.79968 17.2861 9.7998H3.14258C1.63593 9.79972 0.414141 8.57794 0.414062 7.07129V3.14258C0.414146 1.63593 1.63593 0.414145 3.14258 0.414062Z" stroke="currentColor" strokeWidth="0.828963" />
        <path opacity="0.4" d="M20.4281 3.9291V7.24495C21.0952 6.96412 21.529 6.31082 21.529 5.58703C21.529 4.86323 21.0952 4.20993 20.4281 3.9291" fill="currentColor" />
        <path d="M0 1.57136C0 0.703523 0.703524 0 1.57137 0H15.7145C16.5824 0 17.2859 0.703524 17.2859 1.57137V5.49978C17.2859 6.36762 16.5824 7.07114 15.7145 7.07114H1.57137C0.703525 7.07114 0 6.36762 0 5.49978V1.57136Z" transform="translate(1.571 1.571)" fill="currentColor" />
      </svg>
    </span>
  )
}

function PushPreviewNotificationIcon({
  appIconVariant = 'Icon',
  appIconImageUrl = null,
  appIconName = 'Leaf',
  appIconColor = 'var(--fg-inverse)',
  appIconBg = 'var(--fg-brand)',
  appIconStyle = 'flat',
}: Pick<
  PushNotificationPreviewProps,
  'appIconVariant' | 'appIconImageUrl' | 'appIconName' | 'appIconColor' | 'appIconBg' | 'appIconStyle'
>) {
  const showImage = appIconVariant === 'Image' && Boolean(appIconImageUrl)
  const iconStyle: CSSProperties | undefined = showImage
    ? undefined
    : appIconStyle === 'flat'
      ? { background: appIconBg, color: appIconColor }
      : { color: appIconColor }
  const className = [
    'push-preview-phone__notification-icon',
    showImage && 'push-preview-phone__notification-icon--image',
    !showImage && `push-preview-phone__notification-icon--${appIconStyle}`,
  ].filter(Boolean).join(' ')

  return (
    <span className={className} style={iconStyle} aria-hidden="true">
      {showImage ? (
        <img src={appIconImageUrl ?? undefined} alt="" />
      ) : (
        <LucideIcon name={appIconName} size={24} />
      )}
    </span>
  )
}

function PushNotificationPreview({
  title,
  content,
  image = null,
  appIconVariant = 'Icon',
  appIconImageUrl = null,
  appIconName = 'Leaf',
  appIconColor = 'var(--fg-inverse)',
  appIconBg = 'var(--fg-brand)',
  appIconStyle = 'flat',
}: PushNotificationPreviewProps) {
  const previewTitle = title.trim() || NOTIFICATION_TITLE_PLACEHOLDER
  const previewContent = content.trim() || NOTIFICATION_CONTENT_PLACEHOLDER

  return (
    <div className="push-preview-phone">
      <img className="push-preview-phone__wallpaper" src={notificationWallpaper} alt="" />
      <div className="push-preview-phone__overlay" />
      <div className="push-preview-phone__status" aria-hidden="true">
        <span className="push-preview-phone__status-time">9:41</span>
        <span className="push-preview-phone__island" />
        <PushPreviewStatusIndicators />
      </div>
      <div className="push-preview-phone__clock" aria-hidden="true">
        <p>Monday, June 6</p>
        <img className="push-preview-phone__clock-time" src={lockscreenTime} alt="" />
      </div>
      <div className={`push-preview-phone__notification${image ? ' push-preview-phone__notification--with-image' : ''}`}>
        <PushPreviewNotificationIcon
          appIconVariant={appIconVariant}
          appIconImageUrl={appIconImageUrl}
          appIconName={appIconName}
          appIconColor={appIconColor}
          appIconBg={appIconBg}
          appIconStyle={appIconStyle}
        />
        <div className="push-preview-phone__notification-copy">
          <div className="push-preview-phone__notification-head">
            <p>{previewTitle}</p>
            <span>09:41 AM</span>
          </div>
          <div className="push-preview-phone__notification-body">
            <span className="push-preview-phone__notification-text">{previewContent}</span>
            {image && <img className="push-preview-phone__notification-image" src={image.url} alt="" />}
          </div>
        </div>
      </div>
    </div>
  )
}

const TABS_WITH_PREVIEW = new Set(['app-name-icon', 'splash-screen'])

interface AppIconState {
  variant: AppIconVariant
  icon: string
  imageUrl: string | null
  imageName: string | null
}

interface SettingsPageProps {
  appTitle: string
  onAppTitleChange?: (name: string) => void
  appIcon: AppIconState
  onAppIconChange: (next: AppIconState) => void
  appUserRoles: AppRoleOption[]
  deepLinkTargets: DeepLinkTarget[]
  pushNotificationsEnabled: boolean
  setPushNotificationsEnabled: (enabled: boolean) => void
  searchBarEnabled: boolean
  setSearchBarEnabled: (enabled: boolean) => void
  pushNotificationHistoryItems: PushNotificationHistoryItem[]
  onPushNotificationHistoryItemCreate: (item: PushNotificationHistoryItem) => void
  onPushNotificationHistoryItemUpdate: (item: PushNotificationHistoryItem) => void
  onPushNotificationHistoryItemDelete: (itemId: string) => void
  pushComposerFieldValues?: PushComposerFieldValues
}

export function SettingsPage({
  appTitle,
  onAppTitleChange,
  appIcon,
  onAppIconChange,
  appUserRoles,
  deepLinkTargets,
  pushNotificationsEnabled,
  setPushNotificationsEnabled,
  searchBarEnabled,
  setSearchBarEnabled,
  pushNotificationHistoryItems,
  onPushNotificationHistoryItemCreate,
  onPushNotificationHistoryItemUpdate,
  onPushNotificationHistoryItemDelete,
  pushComposerFieldValues = {},
}: SettingsPageProps) {
  const [activeId, setActiveId] = useState('app-settings')

  const appName = appTitle
  const setAppName = (value: string) => onAppTitleChange?.(value)
  const [iconStyle, setIconStyle] = useState<IconStyle>('flat')
  const iconVariant = appIcon.variant
  const setIconVariant = (value: AppIconVariant) => onAppIconChange({ ...appIcon, variant: value })
  const appImage = { url: appIcon.imageUrl, name: appIcon.imageName }
  const setImage = (url: string | null, name: string | null) =>
    onAppIconChange({ ...appIcon, imageUrl: url, imageName: name })
  const appHeaderIcon = appIcon.icon

  const [splashBgStyle, setSplashBgStyle] = useState<SplashStyle>('flat')
  const [splashAnimation, setSplashAnimation] = useState<SplashAnimation>('none')

  // Live-preview-on-hover for the style/animation dropdowns. When a user
  // hovers a menu option we render it in the preview without committing;
  // moving the pointer out (or closing the menu) clears the preview.
  const [hoveredIconStyle, setHoveredIconStyle] = useState<IconStyle | null>(null)
  const [hoveredSplashBgStyle, setHoveredSplashBgStyle] = useState<SplashStyle | null>(null)
  const [hoveredSplashAnimation, setHoveredSplashAnimation] = useState<SplashAnimation | null>(null)
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationTitleFields, setNotificationTitleFields] = useState<PushComposerFieldOption[]>([])
  const [notificationTitleSuffix, setNotificationTitleSuffix] = useState('')
  const [notificationContent, setNotificationContent] = useState('')
  const [notificationContentFields, setNotificationContentFields] = useState<PushComposerFieldOption[]>([])
  const [notificationContentSuffix, setNotificationContentSuffix] = useState('')
  const [notificationAudience, setNotificationAudience] = useState<string[]>([ALL_USERS_AUDIENCE_ID])
  const [notificationDeepLink, setNotificationDeepLink] = useState('')
  const [notificationImage, setNotificationImage] = useState<PushComposerSelectedImage | null>(null)
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
  const previewIconStyle = hoveredIconStyle ?? iconStyle
  const previewSplashBgStyle = hoveredSplashBgStyle ?? splashBgStyle
  const previewSplashAnimation = hoveredSplashAnimation ?? splashAnimation

  const [splashState, setSplashState] = useState<SplashState>({
    fontColor: '#FFFFFF',
  })
  const updateSplash = (patch: Partial<SplashState>) =>
    setSplashState((prev) => ({ ...prev, ...patch }))

  // Sync with the live AppHeader theme tokens.
  // AppHeader bg = --bg-fill-brand. Inside it, the icon container uses --fg-inverse
  // and the glyph uses --fg-brand. The Splash mockup mirrors that pattern.
  // The standalone "App Icon" preview inverts these — its bg uses --fg-brand
  // (the AppHeader glyph color) and its glyph uses --fg-inverse.
  const [headerBg, setHeaderBg] = useCssVar('--bg-fill-brand', '#7D38EF')
  const [brandColor, setBrandColor] = useCssVar('--fg-brand', '#7D38EF')
  const [inverseColor, setInverseColor] = useCssVar('--fg-inverse', '#FFFFFF')

  const active = NAV_ITEMS.find((item) => item.id === activeId) ?? NAV_ITEMS[0]
  const isPushPreviewOpen = activeId === 'push-notifications' && pushNotificationsEnabled
  const showPreview = TABS_WITH_PREVIEW.has(activeId) || isPushPreviewOpen

  return (
    <div className={`settings-page${showPreview ? ' settings-page--with-preview' : ''}`}>
      <SideNav items={NAV_ITEMS} activeId={activeId} onChange={setActiveId} />
      <main className="settings-page__content">
        <div className="settings-page__main">
          <PanelHeader
            icon={active.icon}
            iconCategory={active.iconCategory}
            title={active.headerTitle ?? active.title}
            description={active.headerDescription ?? active.description}
            iconBg={active.iconBg}
          />
          {activeId === 'app-settings' && (
            <AppSettingsPanel
              searchBarEnabled={searchBarEnabled}
              setSearchBarEnabled={setSearchBarEnabled}
            />
          )}
          {activeId === 'app-name-icon' && (
            <AppNameIconPanel
              appName={appName}
              setAppName={setAppName}
              variant={iconVariant}
              setVariant={setIconVariant}
              iconGlyph={appIcon.icon}
              setIconGlyph={(value) => onAppIconChange({ ...appIcon, icon: value })}
              imageUrl={appImage.url}
              imageName={appImage.name}
              setImage={setImage}
              iconColor={inverseColor}
              setIconColor={setInverseColor}
              iconBg={brandColor}
              setIconBg={setBrandColor}
              iconStyle={iconStyle}
              setIconStyle={setIconStyle}
              onIconStyleHover={setHoveredIconStyle}
            />
          )}
          {activeId === 'splash-screen' && (
            <SplashScreenPanel
              state={splashState}
              onChange={updateSplash}
              bgColor={headerBg}
              setBgColor={setHeaderBg}
              bgStyle={splashBgStyle}
              setBgStyle={setSplashBgStyle}
              animation={splashAnimation}
              setAnimation={setSplashAnimation}
              onBgStyleHover={setHoveredSplashBgStyle}
              onAnimationHover={setHoveredSplashAnimation}
            />
          )}
          {activeId === 'push-notifications' && (
            <PushNotificationsPanel
              enabled={pushNotificationsEnabled}
              setEnabled={setPushNotificationsEnabled}
              appUserRoles={appUserRoles}
              deepLinkTargets={deepLinkTargets}
              appIconVariant={iconVariant}
              appIconImageUrl={appImage.url}
              appIconName={appHeaderIcon}
              appIconColor={inverseColor}
              appIconBg={brandColor}
              appIconStyle={previewIconStyle}
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
            />
          )}
        </div>
        {showPreview && (
          <div className="settings-page__preview">
            <QuickPreview>
              <BasicPhonePreview>
                {activeId === 'app-name-icon' && (
                  <HomeScreenMockup
                    variant={iconVariant}
                    imageUrl={appImage.url}
                    iconName={appHeaderIcon}
                    iconColor={inverseColor}
                    iconBg={brandColor}
                    iconStyle={previewIconStyle}
                    appName={appName}
                  />
                )}
                {activeId === 'splash-screen' && (
                  <SplashScreenMockup
                    bgColor={headerBg}
                    bgStyle={previewSplashBgStyle}
                    fontColor={splashState.fontColor}
                    variant={iconVariant}
                    imageUrl={appImage.url}
                    iconName={appHeaderIcon}
                    iconColor={brandColor}
                    iconBg={inverseColor}
                    appName={appName}
                    animation={previewSplashAnimation}
                  />
                )}
                {activeId === 'push-notifications' && (
                  <PushNotificationPreview
                    title={previewNotificationTitle}
                    content={previewNotificationContent}
                    image={notificationImage}
                    appIconVariant={iconVariant}
                    appIconImageUrl={appImage.url}
                    appIconName={appHeaderIcon}
                    appIconColor={inverseColor}
                    appIconBg={brandColor}
                    appIconStyle={previewIconStyle}
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
