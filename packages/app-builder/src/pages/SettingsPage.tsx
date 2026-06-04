import { useRef, useState, type ReactNode } from 'react'
import {
  Button,
  DropdownLanguage,
  DropdownSingle,
  FormField,
  Icon,
  Input,
  Segmented,
  Toggle,
} from '@jf/design-system'
import { compressImageFile } from '@jf/app-elements'
import { BasicPhonePreview } from '../components/BasicPhonePreview'
import { ColorInputWithPicker } from '../components/ColorInputWithPicker'
import {
  HomeScreenMockup,
  type AppIconVariant,
  type IconStyle,
} from '../components/HomeScreenMockup'
import { PanelHeader } from '../components/PanelHeader'
import { QuickPreview } from '../components/QuickPreview'
import { SideNav, type SideNavItem } from '../components/SideNav'
import { SplashScreenMockup, type SplashAnimation, type SplashStyle } from '../components/SplashScreenMockup'
import { useCssVar } from '../hooks/useCssVar'
import { IconPropertyField } from '../components/IconPropertyField'

const NAV_ITEMS: SideNavItem[] = [
  {
    id: 'app-settings',
    icon: 'mobile-gear',
    iconCategory: 'technology',
    title: 'APP SETTINGS',
    description: 'App status and properties',
    iconBg: 'var(--product-apps-default)',
  },
  {
    id: 'app-name-icon',
    icon: 'mobile-title',
    iconCategory: 'technology',
    title: 'APP NAME & ICON',
    description: 'Customize app name and icon',
    headerDescription: 'The app icon will appear when users add your app to their home screen.',
    iconBg: 'var(--product-tables-light)',
  },
  {
    id: 'splash-screen',
    icon: 'mobile-pencil',
    iconCategory: 'technology',
    title: 'SPLASH SCREEN',
    description: 'Customize splash screen',
    headerDescription: 'The splash screen appears when users open your app on their mobile devices.',
    iconBg: 'var(--accent-default)',
  },
  {
    id: 'push-notifications',
    icon: 'mobile-bell',
    iconCategory: 'technology',
    title: 'PUSH NOTIFICATIONS',
    description: 'Send push notifications',
    headerDescription: 'Send messages to mobile, tablet, or desktop devices',
    iconBg: 'var(--brand-yellow)',
  },
  {
    id: 'ai-chatbot',
    icon: 'ai-message-filled',
    iconCategory: 'ai',
    title: 'AI CHATBOT',
    description: 'Support your users with AI',
    headerDescription: 'Use AI to provide real-time support for your customers',
    iconBg: 'var(--product-ai-default)',
  },
]

const APP_STATUS_OPTIONS = [
  { value: 'enabled', label: 'Enabled' },
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

interface ToggleRowProps {
  title: string
  description: string
  defaultChecked?: boolean
  disabled?: boolean
  extra?: ReactNode
}

function ToggleRow({ title, description, defaultChecked, disabled, extra }: ToggleRowProps) {
  return (
    <div className="settings-panel__row">
      <div className="settings-panel__row-main">
        <div className="settings-panel__row-text">
          <p className="settings-panel__row-title">{title}</p>
          <p className="settings-panel__row-desc">{description}</p>
        </div>
        <Toggle defaultChecked={defaultChecked} disabled={disabled} />
      </div>
      {extra && <div className="settings-panel__row-extra">{extra}</div>}
    </div>
  )
}

function AppSettingsPanel() {
  const [appStatus, setAppStatus] = useState('enabled')
  const [language, setLanguage] = useState('en-US')

  return (
    <section className="settings-panel__card">
      <div className="settings-panel__row">
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
      <div className="settings-panel__row">
        <DropdownLanguage
          title="Default Language"
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
        title="Add to Home Screen Modal"
        description="Show add to home screen modal when user opens the app."
        defaultChecked
      />
      <ToggleRow
        title="Show QR Code on Desktop"
        description="Let users scan QR code to open the app on their phone."
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
        defaultChecked
      />
      <ToggleRow
        title="Progress Bar"
        description="Let users see their progress for forms or documents marked as required."
        disabled
      />
      <ToggleRow
        title="Prevent Cloning"
        description="Prevent other users from cloning this app."
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
}

export function SettingsPage({ appTitle, onAppTitleChange, appIcon, onAppIconChange }: SettingsPageProps) {
  const [activeId, setActiveId] = useState('app-settings')

  // App name is the live app identity (managed at App level) — edits here flow
  // straight up to appTitle, the same value the chrome inline-edit writes.
  const appName = appTitle
  const setAppName = (value: string) => onAppTitleChange?.(value)
  const [iconStyle, setIconStyle] = useState<IconStyle>('flat')
  // Variant + image are the shared app icon (lifted to App, consumed by the nav
  // logo). Settings is the single editor; the App Header hero no longer feeds it.
  const iconVariant = appIcon.variant
  const setIconVariant = (value: AppIconVariant) => onAppIconChange({ ...appIcon, variant: value })
  const appImage = { url: appIcon.imageUrl, name: appIcon.imageName }
  const setImage = (url: string | null, name: string | null) =>
    onAppIconChange({ ...appIcon, imageUrl: url, imageName: name })

  const [splashBgStyle, setSplashBgStyle] = useState<SplashStyle>('flat')
  const [splashAnimation, setSplashAnimation] = useState<SplashAnimation>('none')

  // Live-preview-on-hover for the style/animation dropdowns. When a user
  // hovers a menu option we render it in the preview without committing;
  // moving the pointer out (or closing the menu) clears the preview.
  const [hoveredIconStyle, setHoveredIconStyle] = useState<IconStyle | null>(null)
  const [hoveredSplashBgStyle, setHoveredSplashBgStyle] = useState<SplashStyle | null>(null)
  const [hoveredSplashAnimation, setHoveredSplashAnimation] = useState<SplashAnimation | null>(null)
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
  const showPreview = TABS_WITH_PREVIEW.has(activeId)

  return (
    <div className="settings-page">
      <SideNav items={NAV_ITEMS} activeId={activeId} onChange={setActiveId} />
      <main className="settings-page__content">
        <div className="settings-page__main">
          <PanelHeader
            icon={active.icon}
            iconCategory={active.iconCategory}
            title={active.title}
            description={active.headerDescription ?? active.description}
            iconBg={active.iconBg}
          />
          {activeId === 'app-settings' && <AppSettingsPanel />}
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
        </div>
        {showPreview && (
          <div className="settings-page__preview">
            <QuickPreview>
              <BasicPhonePreview>
                {activeId === 'app-name-icon' && (
                  <HomeScreenMockup
                    variant={iconVariant}
                    imageUrl={appImage.url}
                    iconName={appIcon.icon}
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
                    iconName={appIcon.icon}
                    iconColor={brandColor}
                    iconBg={inverseColor}
                    appName={appName}
                    animation={previewSplashAnimation}
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
