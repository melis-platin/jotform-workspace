import { useState, useEffect, useLayoutEffect, useCallback, useRef, useContext, createContext, memo, type CSSProperties, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { createRoot } from 'react-dom/client'
import {
  ComponentRegistry,
  AppHeader,
  AppDesigner,
  applyStoredOrDefaultTheme,
  BottomNavigation,
  AttributionBar,
  Button as AppButton,
  EmptyState,
  BottomSheet,
  AppIcon,
  CollectionsProvider,
  useCollections,
  type FormSchema,
  type FormField,
  CartProvider,
  FavoritesProvider,
  ProductDetailProvider,
  FormSheet,
  compressImageFile,
  compressImageFiles,
  ensureProductIds,
  ensureFaqIds,
  ensureTestimonialIds,
  generateVariants,
  makeDimensionId,
  type ProductItem,
  type FaqItem,
  type TestimonialItem,
  type ProductModifier,
  type ProductOptionChoice,
  type ProductSubscription,
  type RegisteredComponent,
  type VariantValues,
  type PropertyValues,
  type StateValues,
  HsvColorPicker,
} from '@jf/app-elements'
import { Icon, Button as DSButton, Tabs as DSTabs, Segmented, Input as DSInput, Toggle as DSToggle, Slider as DSSlider, NumberInput as DSNumberInput, FormField as DSFormField, TextArea as DSTextArea, DropdownSingle as DSDropdownSingle, FieldMapper as DSFieldMapper, FieldComposer as DSFieldComposer, type FieldToken, Link as DSLink, Modal as DSModal, SearchInput as DSSearchInput, ColorInput as DSColorInput } from '@jf/design-system'
import phoneHomeIndicator from '@jf/design-system/src/assets/phone-home-indicator.svg'
import previewUserAvatar from '../assets/preview-user-avatar.jpg'
import { PhoneStatusBar } from '../components/PhoneStatusBar'
import { PageNavigationBar, getPageIconName } from '../components/PageNavigationBar'
import { CanvasPageLabel } from '../components/CanvasPageLabel'
import { PagePropertiesPanel } from '../components/PagePropertiesPanel'
import { NavigationMenuPanel } from '../components/NavigationMenuPanel'
import { LivePreviewMorePagesView } from '../components/LivePreviewMorePagesView'
import { LivePreviewCartButton } from '../components/LivePreviewCartButton'
import { LivePreviewCartPage } from '../components/LivePreviewCartPage'
import { LivePreviewProductDetailPage } from '../components/LivePreviewProductDetailPage'
import { LivePreviewCheckoutPage } from '../components/LivePreviewCheckoutPage'
import { LivePreviewOrderBar } from '../components/LivePreviewOrderBar'
import { LivePreviewAvatarPopover } from '../components/LivePreviewAvatarPopover'
import { LivePreviewProfilePage } from '../components/LivePreviewProfilePage'
import { LivePreviewLoginPopover } from '../components/LivePreviewLoginPopover'
import { QrPopover } from '../components/QrPopover'
import { MobileBottomBar } from '../components/MobileBottomBar'
import { AppPreviewScreen } from '../components/AppPreviewScreen'
import { HeaderLayoutPicker, type AppHeaderLayout } from '../components/HeaderLayoutPicker'
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview'
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import type { AppPreset, PresetElement } from '../presets/appPresets'
import { IconPropertyField } from '../components/IconPropertyField'
import { ProductFilterPopover } from '../components/ProductFilterPopover'
import { ProductOptionModal } from '../components/ProductOptionModal'
import { ProductModifierModal } from '../components/ProductModifierModal'
import { ProductSubscriptionModal } from '../components/ProductSubscriptionModal'
import { loadSnapshot, saveSnapshot } from '../presets/storage'
import { syncAppToRemote } from '../presets/remoteStore'

interface CanvasElement {
  id: string
  componentId: string
  variants: VariantValues
  properties: PropertyValues
  states: StateValues
}

interface AppPage {
  id: string
  name: string
  icon?: string
  /** Excluded from the app's bottom navigation when true (still editable in the canvas). */
  hidden?: boolean
  /** Visitors must sign in to view this page. */
  requireLogin?: boolean
  /** Whether the page's icon is shown (in the nav / page label). Defaults to true. */
  showIcon?: boolean
  /** First page only: act as a public landing screen for logged-out visitors. */
  landing?: boolean
  elements: CanvasElement[]
}

function nextNumericId(prefix: string, existingIds: string[]): string {
  const re = new RegExp(`^${prefix}-(\\d+)$`)
  const max = existingIds.reduce((m, id) => {
    const match = id.match(re)
    const n = match ? parseInt(match[1], 10) : 0
    return n > m ? n : m
  }, 0)
  return `${prefix}-${max + 1}`
}

const ELEMENT_ICON_MAP: Record<string, { icon: string; iconCategory: string }> = {
  'form': { icon: 'form-filled', iconCategory: 'forms-files' },
  'heading': { icon: 'heading-square-filled', iconCategory: 'editor' },
  'list': { icon: 'list-bullet', iconCategory: 'editor' },
  'paragraph': { icon: 'text-image', iconCategory: 'general' },
  'card': { icon: 'grid-2-filled', iconCategory: 'layout' },
  'sign-document': { icon: 'document-jf-sign-filled', iconCategory: 'documents' },
  'document': { icon: 'file-filled', iconCategory: 'forms-files' },
  'button': { icon: 'label-button-filled', iconCategory: 'general' },
  'social-follow': { icon: 'share-nodes-filled', iconCategory: 'general' },
  'product-list': { icon: 'cart-shopping-filled', iconCategory: 'finance' },
  'donation-box': { icon: 'heart-filled', iconCategory: 'general' },
  'faq': { icon: 'question-circle-filled', iconCategory: 'general' },
  'banner': { icon: 'megaphone-filled', iconCategory: 'alerts-feedback' },
  'image': { icon: 'image-line-filled', iconCategory: 'general' },
  'image-gallery': { icon: 'images-filled', iconCategory: 'media' },
  'table': { icon: 'table', iconCategory: 'general' },
  'testimonial': { icon: 'message-star-filled', iconCategory: 'communication' },
  'login-signup': { icon: 'form-filled', iconCategory: 'forms-files' },
  'chart': { icon: 'form-report-filled', iconCategory: 'forms-files' },
  'daily-task-manager': { icon: 'table', iconCategory: 'general' },
  'progress-indicator': { icon: 'list-check-square-filled', iconCategory: 'general' },
  'spacer': { icon: 'spacer-vertical-filled', iconCategory: 'layout' },
}

interface PanelGroup {
  label?: string
  elementIds: string[]
}

const BASIC_GROUPS: PanelGroup[] = [
  { elementIds: ['form', 'heading', 'banner', 'list', 'paragraph', 'card', 'sign-document', 'document', 'image', 'image-gallery', 'button', 'spacer'] },
  { label: 'PAYMENT ELEMENTS', elementIds: ['product-list', 'donation-box'] },
  { label: 'FEATURED WIDGETS', elementIds: ['social-follow', 'testimonial', 'faq'] },
  { label: 'DATA ELEMENTS', elementIds: ['table'] },
]

const WIDGETS_GROUPS: PanelGroup[] = [
  { elementIds: ['chart', 'daily-task-manager', 'login-signup', 'progress-indicator'] },
]

const HIDDEN_ELEMENTS = ['empty-state', 'app-header', 'bottom-navigation', 'color-picker']

function createCanvasElement(comp: RegisteredComponent, id: string): CanvasElement {
  const variants: VariantValues = {}
  for (const [group, config] of Object.entries(comp.variants)) {
    variants[group] = config.default || config.options[0]
  }

  const properties: PropertyValues = {}
  for (const prop of comp.properties) {
    properties[prop.name] = prop.default
  }

  const states: StateValues = {}
  for (const state of comp.states) {
    states[state.name] = state.default || false
  }

  return {
    id,
    componentId: comp.id,
    variants,
    properties,
    states,
  }
}

function buildCanvasElementsFromPreset(presetElements: PresetElement[], startId: number): { elements: CanvasElement[]; nextId: number } {
  const elements: CanvasElement[] = []
  let id = startId
  for (const pe of presetElements) {
    const comp = ComponentRegistry.get(pe.componentId)
    if (!comp) continue
    const el = createCanvasElement(comp, `element-${id++}`)
    if (pe.variants) Object.assign(el.variants, pe.variants)
    if (pe.properties) Object.assign(el.properties, pe.properties)
    elements.push(el)
  }
  return { elements, nextId: id }
}

function buildInitialStateFromPreset(preset: AppPreset | undefined): {
  pages: AppPage[]
  headerActions: CanvasElement[]
  activePageId: string
  appSubtitle: string
  appHeader: AppHeaderState
} {
  if (!preset || preset.pages.length === 0) {
    return {
      pages: [{ id: 'page-1', name: 'Home', icon: 'House', elements: [] }],
      headerActions: [],
      activePageId: 'page-1',
      appSubtitle: preset?.appSubtitle ?? '',
      appHeader: { ...APP_HEADER_DEFAULTS },
    }
  }
  // Empty App always starts from defaults — skip stored snapshot.
  const stored = preset.id === 'empty' ? null : loadSnapshot(preset.id)
  if (stored) {
    const pages = stored.pages as AppPage[]
    const storedHeader = (stored.appHeader ?? {}) as Partial<AppHeaderState>
    return {
      pages,
      headerActions: stored.headerActions as CanvasElement[],
      activePageId: pages[0]?.id ?? 'page-1',
      appSubtitle: stored.appSubtitle,
      appHeader: {
        layout: storedHeader.layout ?? APP_HEADER_DEFAULTS.layout,
        headerLayout: storedHeader.headerLayout ?? APP_HEADER_DEFAULTS.headerLayout,
        contentAlign: storedHeader.contentAlign ?? APP_HEADER_DEFAULTS.contentAlign,
        size: storedHeader.size ?? APP_HEADER_DEFAULTS.size,
        // Normalise any legacy 'auto' (the removed Auto-height toggle) to the default.
        minHeight: typeof storedHeader.minHeight === 'number' ? storedHeader.minHeight : APP_HEADER_DEFAULTS.minHeight,
        icon: storedHeader.icon ?? APP_HEADER_DEFAULTS.icon,
        skeleton: storedHeader.skeleton ?? APP_HEADER_DEFAULTS.skeleton,
        show: typeof storedHeader.show === 'boolean' ? storedHeader.show : APP_HEADER_DEFAULTS.show,
        imageStyle: (storedHeader.imageStyle as AppHeaderImageStyle | undefined) ?? APP_HEADER_DEFAULTS.imageStyle,
        imageUrl: storedHeader.imageUrl ?? APP_HEADER_DEFAULTS.imageUrl,
        imageName: storedHeader.imageName ?? APP_HEADER_DEFAULTS.imageName,
        textColor: storedHeader.textColor ?? APP_HEADER_DEFAULTS.textColor,
        textColorMode: storedHeader.textColorMode ?? APP_HEADER_DEFAULTS.textColorMode,
        backgroundImageUrl: storedHeader.backgroundImageUrl ?? APP_HEADER_DEFAULTS.backgroundImageUrl,
        backgroundImageName: storedHeader.backgroundImageName ?? APP_HEADER_DEFAULTS.backgroundImageName,
        bgSource: storedHeader.bgSource ?? (storedHeader.backgroundImageUrl ? 'image' : 'color'),
        backgroundMode: storedHeader.backgroundMode ?? APP_HEADER_DEFAULTS.backgroundMode,
        backgroundColor: storedHeader.backgroundColor,
        gradientStart: storedHeader.gradientStart,
        gradientEnd: storedHeader.gradientEnd,
        title: storedHeader.title,
        subtitle: storedHeader.subtitle,
        ctaEnabled: typeof storedHeader.ctaEnabled === 'boolean' ? storedHeader.ctaEnabled : APP_HEADER_DEFAULTS.ctaEnabled,
        ctaLabel: storedHeader.ctaLabel ?? APP_HEADER_DEFAULTS.ctaLabel,
        // Normalise legacy CTA action values from earlier iterations.
        ctaAction: ((): AppHeaderCtaAction => {
          const a = storedHeader.ctaAction as string | undefined
          if (a === 'Open Link') return 'Open URL'
          if (!a || a === 'None' || a === 'Sign up' || a === 'Login') return APP_HEADER_DEFAULTS.ctaAction ?? 'Do Nothing'
          return a as AppHeaderCtaAction
        })(),
        ctaPageId: storedHeader.ctaPageId,
        ctaUrl: storedHeader.ctaUrl,
        ctaEmail: storedHeader.ctaEmail,
        ctaPhone: storedHeader.ctaPhone,
        ctaFormTitle: storedHeader.ctaFormTitle,
        ctaFormDescription: storedHeader.ctaFormDescription,
        ctaFormSubmitLabel: storedHeader.ctaFormSubmitLabel,
        ctaFormFields: storedHeader.ctaFormFields,
        ctaSubmitsTo: storedHeader.ctaSubmitsTo,
      },
    }
  }
  let nextId = 1
  const pages: AppPage[] = preset.pages.map((p) => {
    const built = buildCanvasElementsFromPreset(p.elements, nextId)
    nextId = built.nextId
    return { id: p.id, name: p.name, icon: p.icon, landing: p.landing, requireLogin: p.requireLogin, elements: built.elements }
  })
  const headerBuilt = buildCanvasElementsFromPreset(preset.headerActions, nextId)
  return {
    pages,
    headerActions: headerBuilt.elements,
    activePageId: pages[0].id,
    appSubtitle: preset.appSubtitle,
    appHeader: { ...APP_HEADER_DEFAULTS, ...(preset.appHeader ?? {}) },
  }
}

function nextElementId(pages: AppPage[], headerActions: CanvasElement[] = []): string {
  return nextNumericId('element', [
    ...pages.flatMap((p) => p.elements.map((el) => el.id)),
    ...headerActions.map((el) => el.id),
  ])
}

const APP_HEADER_ID = 'app-header'
type AppHeaderImageStyle = 'Image' | 'Icon' | 'None'
type AppHeaderSize = 'XLarge' | 'Large' | 'Medium' | 'Small'
type AppHeaderContentAlign = 'Center' | 'Bottom'
type AppHeaderCtaAction = 'Do Nothing' | 'Navigate to Page' | 'Open Form' | 'Open URL' | 'Send Email' | 'Make Call'
interface AppHeaderState {
  layout: string
  // Selected header layout archetype. 'Hero' carries the existing style controls;
  // Default/Cover/Profile are placeholders whose bespoke content is added later.
  // Optional so older snapshots fall back to 'Hero'.
  headerLayout?: AppHeaderLayout
  // Vertical content alignment: 'Center' (default) or 'Bottom' (pins the content
  // to the bottom edge). Optional so older snapshots fall back to 'Center'.
  contentAlign?: AppHeaderContentAlign
  // Title/description size (Large/Medium/Small). Optional so older snapshots
  // (without it) fall back to the component default (Large).
  size?: AppHeaderSize
  // Banner height in px — drives min-height (content never clips; a tall
  // title/description grows past it). Optional so older snapshots fall back to
  // the default (272px). Edited via the Height slider in the properties panel.
  minHeight?: number
  icon: string
  skeleton: boolean
  show: boolean
  imageStyle: AppHeaderImageStyle
  imageUrl: string | null
  imageName: string | null
  textColor: string
  // Header text color mode. 'auto' contrasts against the (custom) background like
  // the button auto-contrast; 'light'/'dark' force white / dark navy. Optional so
  // older snapshots fall back to 'auto'.
  textColorMode?: 'auto' | 'light' | 'dark'
  backgroundImageUrl: string | null
  backgroundImageName: string | null
  // Which background fills the header — a color/gradient or an uploaded image
  // (mutually exclusive). Optional; inferred from a stored image otherwise.
  bgSource?: 'color' | 'image'
  // Custom background fill. 'solid' uses backgroundColor; 'gradient' blends
  // gradientStart → gradientEnd. All optional — unset falls back to the brand token
  // (--bg-fill-brand). A background image, when set, still wins over both.
  backgroundMode?: 'solid' | 'gradient'
  backgroundColor?: string
  gradientStart?: string
  gradientEnd?: string
  // Optional overrides — when set (including empty string), they take precedence
  // over appTitle/appSubtitle so users can hide the header text without clearing
  // the chrome-level app name.
  title?: string
  subtitle?: string
  // Hero-only CTA button, configured purely by props (replaces the drag-and-drop
  // header actions for the Hero layout). Disabled by default; when enabled, the
  // action drives the click behaviour and each action reads its own sub-fields.
  ctaEnabled?: boolean
  ctaLabel?: string
  ctaAction?: AppHeaderCtaAction
  ctaPageId?: string // 'Navigate to Page'
  ctaUrl?: string // 'Open URL'
  ctaEmail?: string // 'Send Email'
  ctaPhone?: string // 'Make Call'
  ctaFormTitle?: string // 'Open Form' ↓
  ctaFormDescription?: string
  ctaFormSubmitLabel?: string
  ctaFormFields?: string
  ctaSubmitsTo?: string
}
const APP_HEADER_DEFAULTS: AppHeaderState = {
  layout: 'Center',
  headerLayout: 'Hero',
  contentAlign: 'Center',
  size: 'Large',
  icon: 'Leaf',
  skeleton: false,
  show: true,
  imageStyle: 'Icon',
  imageUrl: null,
  imageName: null,
  textColor: '#FFFFFF',
  backgroundImageUrl: null,
  backgroundImageName: null,
  minHeight: 272,
  backgroundMode: 'solid',
  textColorMode: 'auto',
  bgSource: 'color',
  ctaEnabled: false,
  ctaLabel: 'Get Started',
  ctaAction: 'Do Nothing',
}

// App Header property-panel visibility flags. These controls are intentionally
// hidden from the panel, but their state, handlers and render logic are fully
// preserved — flip a flag to `true` to restore the control.
const SHOW_APP_HEADER_SIZE = false
const SHOW_APP_HEADER_HORIZONTAL_ALIGN = false
const SHOW_APP_HEADER_TEXT_COLOR = false
const SHOW_APP_HEADER_VERTICAL_ALIGN = false
const SHOW_APP_HEADER_IMAGE_STYLE = false

// Available actions for the Hero CTA button's "Button Action" dropdown — mirrors
// the List/Card "Card Actions" set (same values + icons) for consistency.
const APP_HEADER_CTA_ACTION_OPTIONS: { value: AppHeaderCtaAction; label: string; icon: string; iconCategory: string }[] = [
  { value: 'Do Nothing', label: 'Do Nothing', icon: 'minus-sm', iconCategory: 'general' },
  { value: 'Navigate to Page', label: 'Navigate to Page', icon: 'form-title-filled', iconCategory: 'general' },
  { value: 'Open Form', label: 'Open Form', icon: 'form-filled', iconCategory: 'forms-files' },
  { value: 'Open URL', label: 'Open URL', icon: 'link-horizontal', iconCategory: 'general' },
  { value: 'Send Email', label: 'Send Email', icon: 'envelope-closed-filled', iconCategory: 'communication' },
  { value: 'Make Call', label: 'Make Call', icon: 'phone-filled', iconCategory: 'communication' },
]

// Parse the Open Form "Form Fields" string into FormField[] — mirrors the Button
// element's own parser so the hero CTA opens an identical form.
function parseCtaFields(raw?: string): FormField[] {
  if (!raw) return []
  const trimmed = raw.trim()
  if (!trimmed) return []
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed as FormField[]
    } catch {
      /* fall through to CSV */
    }
  }
  return trimmed
    .split(',')
    .map((part) => {
      const name = part.trim()
      return { name, label: name, type: 'text' as const }
    })
    .filter((f) => f.name)
}

interface HeroCtaConfig {
  label: string
  action: AppHeaderCtaAction
  pageId?: string
  url?: string
  email?: string
  phone?: string
  formTitle?: string
  formDescription?: string
  formSubmitLabel?: string
  formFields?: string
  submitsTo?: string
}

// The Hero header's prop-based CTA button — replaces the drag-and-drop header
// actions for the Hero layout. In the live preview it dispatches its configured
// action; in the builder canvas it renders non-interactively (interactive=false)
// so clicks fall through to select the header.
function HeroCtaButton({
  cta,
  interactive,
  onNavigate,
}: {
  cta: HeroCtaConfig
  interactive: boolean
  onNavigate?: (pageId: string) => void
}) {
  // null when there's no CollectionsProvider above (e.g. the builder canvas).
  const collections = useCollections()
  const handleClick = () => {
    switch (cta.action) {
      case 'Navigate to Page':
        if (cta.pageId) onNavigate?.(cta.pageId)
        break
      case 'Open URL':
        if (cta.url) window.open(cta.url, '_blank', 'noopener,noreferrer')
        break
      case 'Send Email':
        if (cta.email) window.open(`mailto:${cta.email}`, '_self')
        break
      case 'Make Call':
        if (cta.phone) window.open(`tel:${cta.phone}`, '_self')
        break
      case 'Open Form':
        if (collections) {
          const schema: FormSchema = {
            title: cta.formTitle || 'Add new item',
            description: cta.formDescription || undefined,
            submitButtonLabel: cta.formSubmitLabel || 'Submit',
            submitsTo: cta.submitsTo || '',
            fields: parseCtaFields(cta.formFields),
          }
          collections.openForm(schema)
        }
        break
    }
  }
  const clickable = interactive && cta.action !== 'Do Nothing'
  return (
    <div className="live-preview__header-action">
      <AppButton
        variant="Default"
        size="Default"
        width="Auto"
        leftIcon="none"
        rightIcon="none"
        label={cta.label || 'Button'}
        onClick={clickable ? handleClick : undefined}
      />
    </div>
  )
}

// Resolve the app header's custom background fill to a CSS value (solid color or
// gradient), or undefined when unset so the AppHeader falls back to --bg-fill-brand.
function resolveHeaderBackground(s: AppHeaderState): string | undefined {
  if ((s.bgSource ?? 'color') !== 'color') return undefined
  if (s.backgroundMode === 'gradient' && s.gradientStart && s.gradientEnd) {
    return `linear-gradient(to bottom, ${s.gradientStart}, ${s.gradientEnd})`
  }
  return s.backgroundColor || undefined
}

// The header background image, but only when the Background source is set to Image
// (color and image are mutually exclusive).
function resolveHeaderImage(s: AppHeaderState): string | null {
  return (s.bgSource ?? 'color') === 'image' ? s.backgroundImageUrl : null
}

// Relative luminance → readable text color (same 0.4 threshold as the button
// auto-contrast): dark navy on light backgrounds, white on dark ones.
function headerTextContrast(hex: string): string {
  const clean = hex.replace('#', '')
  if (clean.length < 6) return '#FFFFFF'
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  return lum > 0.4 ? '#091141' : '#FFFFFF'
}

// Resolve the header text color from the chosen mode. 'auto' contrasts against the
// custom background; with no custom background it returns undefined so the header
// keeps --fg-inverse (already auto-contrasted to the brand by the theme).
function resolveHeaderTextColor(s: AppHeaderState): string | undefined {
  const mode = s.textColorMode ?? 'auto'
  if (mode === 'light') return '#FFFFFF'
  if (mode === 'dark') return '#091141'
  // auto: an image background (shown under a dark scrim) reads best with white text.
  if ((s.bgSource ?? 'color') === 'image') return s.backgroundImageUrl ? '#FFFFFF' : undefined
  const bg = s.backgroundMode === 'gradient' ? (s.gradientStart || s.gradientEnd) : s.backgroundColor
  return bg ? headerTextContrast(bg) : undefined
}

// Banner-height slider bounds (px). It drives min-height, so content can still
// grow past the chosen value — a low value just means a more compact banner.
const APP_HEADER_HEIGHT_MIN = 160
const APP_HEADER_HEIGHT_MAX = 600
const APP_HEADER_HEIGHT_DEFAULT = 272

// Mock account shown on the avatar-popover → Profile system page (no backend).
const PROFILE_USER = {
  name: 'Okan Düngel',
  username: 'okandungel',
  email: 'okandungel@jotform.com',
}
// First + last initials for the profile header avatar (e.g. "Okan Düngel" → "OD").
const PROFILE_INITIALS = (() => {
  const words = PROFILE_USER.name.trim().split(/\s+/)
  const first = words[0]?.charAt(0) ?? ''
  const last = words.length > 1 ? (words[words.length - 1]?.charAt(0) ?? '') : ''
  return (first + last).toUpperCase()
})()

// Elements droppable into the app header. Button / Social Follow are the
// interactive actions; Image (e.g. a hero graphic/badge) and Spacer (vertical
// breathing room) stack full-width as their own rows — they aren't shrinkable,
// so the drop logic only offers top/bottom edges for them.
const HEADER_ACTION_ALLOWED = ['button', 'social-follow', 'image', 'spacer']
const HEADER_ACTIONS_MAX = 3
// In header context only Button can be shrinked (Social Follow stays full-width)
const isHeaderShrinkable = (componentId: string): boolean => componentId === 'button'

const INLINE_EDITABLE_MAP: Record<string, { selector: string; property: string }[]> = {
  card: [
    { selector: '.jf-card__title', property: 'Title' },
    { selector: '.jf-card__description', property: 'Description' },
  ],
  button: [
    { selector: '.jf-btn__label', property: 'Label' },
  ],
  heading: [
    { selector: '.jf-heading__title', property: 'Heading' },
    { selector: '.jf-heading__subtitle', property: 'Subheading' },
  ],
  form: [
    { selector: '.jf-form__title', property: 'Label' },
    { selector: '.jf-form__desc', property: 'Description' },
  ],
  table: [
    { selector: '.jf-table__title', property: 'Label' },
    { selector: '.jf-table__desc', property: 'Description' },
  ],
  document: [
    { selector: '.jf-doc__title', property: 'File Name' },
    { selector: '.jf-doc__desc', property: 'Description' },
  ],
  'sign-document': [
    { selector: '.jf-sign-doc__title', property: 'Label' },
    { selector: '.jf-sign-doc__desc', property: 'Description' },
  ],
  list: [
    { selector: '.jf-list__title', property: 'Title' },
    { selector: '.jf-list__subtitle', property: 'Subtitle' },
  ],
  'product-list': [
    { selector: '.jf-product-list__title', property: 'Title' },
    { selector: '.jf-product-list__subtitle', property: 'Subtitle' },
  ],
  'donation-box': [
    { selector: '.jf-donation__title', property: 'Title' },
    { selector: '.jf-donation__description', property: 'Description' },
  ],
  'banner': [
    { selector: '.jf-banner__title', property: 'Title' },
    { selector: '.jf-banner__description', property: 'Description' },
  ],
}

type DragSourceData =
  | { type: 'panel'; componentId: string }
  | { type: 'canvas'; elementId: string; componentId: string }

type DropEdgeChange = (elementId: string, edge: Edge | null) => void
const DropEdgeContext = createContext<DropEdgeChange | null>(null)

type DropTarget = { elementId: string; edge: Edge }

function CanvasDropLine({
  target,
  containerRef,
}: {
  target: DropTarget | null
  containerRef: RefObject<HTMLDivElement | null>
}) {
  const [style, setStyle] = useState<CSSProperties | null>(null)

  useLayoutEffect(() => {
    if (!target) {
      setStyle(null)
      return
    }
    const container = containerRef.current
    if (!container) return
    const el = container.querySelector(
      `[data-element-id="${target.elementId}"]`
    ) as HTMLElement | null
    if (!el) {
      setStyle(null)
      return
    }

    const cRect = container.getBoundingClientRect()
    const eRect = el.getBoundingClientRect()
    const cs = getComputedStyle(container)
    const padLeft = parseFloat(cs.paddingLeft) || 0
    const padRight = parseFloat(cs.paddingRight) || 0
    const gap = parseFloat(cs.rowGap || cs.gap || '0') || 16
    const thickness = 4
    const contentWidth = container.clientWidth - padLeft - padRight
    const top = eRect.top - cRect.top + container.scrollTop
    const left = eRect.left - cRect.left + container.scrollLeft

    if (target.edge === 'top') {
      setStyle({
        top: top - gap / 2 - thickness / 2,
        left: padLeft,
        width: contentWidth,
        height: thickness,
      })
    } else if (target.edge === 'bottom') {
      setStyle({
        top: top + eRect.height + gap / 2 - thickness / 2,
        left: padLeft,
        width: contentWidth,
        height: thickness,
      })
    } else if (target.edge === 'left') {
      setStyle({
        top,
        left: left - gap / 2 - thickness / 2,
        width: thickness,
        height: eRect.height,
      })
    } else if (target.edge === 'right') {
      setStyle({
        top,
        left: left + eRect.width + gap / 2 - thickness / 2,
        width: thickness,
        height: eRect.height,
      })
    }
  }, [target, containerRef])

  if (!style) return null
  return <div className="build-page__drop-line" style={style} />
}

function HeaderActionItem({
  element,
  isSelected,
  hideDuringDrag,
  isPaired,
  pairPartnerId,
  partnerSwapEdge,
  onSelect,
  onPropertyChange,
}: {
  element: CanvasElement
  isSelected: boolean
  hideDuringDrag: boolean
  isPaired: boolean
  pairPartnerId: string | null
  partnerSwapEdge: Edge | null
  onSelect: (id: string) => void
  onPropertyChange: (elementId: string, property: string, value: string | boolean | number) => void
}) {
  const comp = ComponentRegistry.get(element.componentId)
  const isShrinked = element.properties['Shrinked'] === true
  const ref = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  const onDropEdgeChange = useContext(DropEdgeContext)
  const isPairedRef = useRef(isPaired)
  const pairPartnerIdRef = useRef(pairPartnerId)
  const partnerSwapEdgeRef = useRef(partnerSwapEdge)
  useEffect(() => { isPairedRef.current = isPaired }, [isPaired])
  useEffect(() => { pairPartnerIdRef.current = pairPartnerId }, [pairPartnerId])
  useEffect(() => { partnerSwapEdgeRef.current = partnerSwapEdge }, [partnerSwapEdge])
  const selfShrinkable = isHeaderShrinkable(element.componentId)

  useEffect(() => {
    const el = ref.current
    const handle = handleRef.current
    if (!el) return
    const reportEdge = (edge: Edge | null) => onDropEdgeChange?.(element.id, edge)
    return combine(
      draggable({
        element: el,
        dragHandle: handle ?? undefined,
        getInitialData: (): Record<string, unknown> => ({
          type: 'canvas',
          elementId: element.id,
          componentId: element.componentId,
        }),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: pointerOutsideOfPreview({ x: '16px', y: '16px' }),
            render: ({ container }) => {
              const root = createRoot(container)
              root.render(<PanelDragOverlay componentId={element.componentId} />)
              return () => root.unmount()
            },
          })
        },
      }),
      dropTargetForElements({
        element: el,
        canDrop: ({ source }) => {
          const data = source.data as DragSourceData
          if (data.type === 'canvas' && data.elementId === element.id) return false
          return HEADER_ACTION_ALLOWED.includes(data.componentId)
        },
        getData: ({ input, source, element: target }) => {
          const data = source.data as DragSourceData
          const sourceIsMyPartner =
            data.type === 'canvas' && data.elementId === pairPartnerIdRef.current
          let allowedEdges: Edge[]
          if (sourceIsMyPartner) {
            allowedEdges = partnerSwapEdgeRef.current
              ? ['top', 'bottom', partnerSwapEdgeRef.current]
              : ['top', 'bottom']
          } else {
            const sourceShrinkable = isHeaderShrinkable(data.componentId)
            const allowHorizontal =
              sourceShrinkable && selfShrinkable && !isPairedRef.current
            allowedEdges = allowHorizontal
              ? ['top', 'bottom', 'left', 'right']
              : ['top', 'bottom']
          }
          return attachClosestEdge(
            { type: 'header-action', elementId: element.id },
            { input, element: target, allowedEdges }
          )
        },
        onDrag: ({ self, source }) => {
          const data = source.data as DragSourceData
          if (data.type === 'canvas' && data.elementId === element.id) {
            reportEdge(null)
            return
          }
          reportEdge(extractClosestEdge(self.data))
        },
        onDragLeave: () => reportEdge(null),
        onDrop: () => reportEdge(null),
      })
    )
  }, [element.id, element.componentId, selfShrinkable, onDropEdgeChange])

  if (!comp) return null

  return (
    <div
      ref={ref}
      className={`build-page__header-action${isSelected ? ' build-page__header-action--selected' : ''}${isShrinked ? ' build-page__header-action--shrinked' : ''}`}
      data-element-id={element.id}
      data-component-id={element.componentId}
      style={hideDuringDrag ? { display: 'none' } : undefined}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(element.id)
      }}
    >
      <div ref={handleRef} className="build-page__drag-handle">
        <Icon name="grid-dots-vertical" category="general" size={24} />
      </div>
      <div className="build-page__header-action-content">
        {comp.render(element.variants, element.properties, element.states, (name, value) => onPropertyChange(element.id, name, value))}
      </div>
    </div>
  )
}

function isComponentShrinkable(componentId: string): boolean {
  const comp = ComponentRegistry.get(componentId)
  return !!comp?.properties.some((p) => p.name === 'Shrinked')
}

// Elements that auto-flow into a responsive grid on a wide page WITHOUT the
// explicit Shrinked flag: a run of consecutive tiles reads as a 2-up grid on
// desktop and collapses to a single column on a narrow page. A lone tile (or one
// separated by a full-width element) grows back to full width via flex-grow, so
// no run detection is needed — flex-wrap groups them. Driven purely by the
// `app-content` container width, like the type scale.
//
// Scoped to the *vertical* card layout only (icon/image on top — tile-like).
// Horizontal cards are wide, list-style rows and stay full-width; other element
// types use the explicit Shrinked flag.
function isAutoFlowElement(el: CanvasElement): boolean {
  return el.componentId === 'card' && el.variants?.['Layout'] === 'Vertical'
}

function isElementShrinked(el: CanvasElement): boolean {
  return el.properties['Shrinked'] === true
}

// Returns the pair partner's index within page.elements, or -1 if unpaired.
// Pairing: consecutive shrinked elements group into 2-column rows; element at column 0
// pairs with column 1 if present. Column-1 is always paired with column-0.
function pairPartnerIndex(elements: CanvasElement[], index: number): number {
  const el = elements[index]
  if (!el || !isElementShrinked(el)) return -1
  let start = index
  while (start > 0 && isElementShrinked(elements[start - 1])) start--
  const k = index - start
  if (k % 2 === 0) {
    const next = elements[index + 1]
    return next && isElementShrinked(next) ? index + 1 : -1
  }
  return index - 1
}

// Header-only variant: only Button elements can pair (SocialFollow stays full-width).
function headerPairPartnerIndex(elements: CanvasElement[], index: number): number {
  const el = elements[index]
  if (!el || el.componentId !== 'button' || !isElementShrinked(el)) return -1
  const qualifies = (e: CanvasElement | undefined) =>
    !!e && e.componentId === 'button' && isElementShrinked(e)
  let start = index
  while (start > 0 && qualifies(elements[start - 1])) start--
  const k = index - start
  if (k % 2 === 0) {
    return qualifies(elements[index + 1]) ? index + 1 : -1
  }
  return index - 1
}

function PanelDragOverlay({ componentId }: { componentId: string }) {
  const iconInfo = ELEMENT_ICON_MAP[componentId]
  const comp = ComponentRegistry.get(componentId)
  if (!comp) return null

  return (
    <div className="build-page__element-item build-page__panel-overlay">
      <div className="build-page__element-icon">
        {iconInfo ? (
          <Icon name={iconInfo.icon} category={iconInfo.iconCategory} size={24} />
        ) : (
          <Icon name="grid-2-filled" category="layout" size={24} />
        )}
      </div>
      <div className="build-page__element-content">
        <span className="build-page__element-name">{comp.name}</span>
      </div>
    </div>
  )
}

const SortableElement = memo(function SortableElement({
  element,
  pageId,
  isSelected,
  hideDuringDrag,
  isPaired,
  pairPartnerId,
  partnerSwapEdge,
  onSelect,
  onPropertyChange,
}: {
  element: CanvasElement
  pageId: string
  isSelected: boolean
  hideDuringDrag: boolean
  isPaired: boolean
  pairPartnerId: string | null
  partnerSwapEdge: Edge | null
  onSelect: (id: string) => void
  onPropertyChange: (elementId: string, property: string, value: string | boolean | number) => void
}) {
  const comp = ComponentRegistry.get(element.componentId)
  const isShrinked = element.properties['Shrinked'] === true
  const isFlow = isAutoFlowElement(element)
  const sectionRef = useRef<HTMLElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const onDropEdgeChange = useContext(DropEdgeContext)
  const isPairedRef = useRef(isPaired)
  const pairPartnerIdRef = useRef(pairPartnerId)
  const partnerSwapEdgeRef = useRef(partnerSwapEdge)
  useEffect(() => { isPairedRef.current = isPaired }, [isPaired])
  useEffect(() => { pairPartnerIdRef.current = pairPartnerId }, [pairPartnerId])
  useEffect(() => { partnerSwapEdgeRef.current = partnerSwapEdge }, [partnerSwapEdge])
  const selfShrinkable = isComponentShrinkable(element.componentId)

  useEffect(() => {
    const section = sectionRef.current
    const handle = handleRef.current
    if (!section) return
    const reportEdge = (edge: Edge | null) => onDropEdgeChange?.(element.id, edge)
    return combine(
      draggable({
        element: section,
        dragHandle: handle ?? undefined,
        getInitialData: (): Record<string, unknown> => ({
          type: 'canvas',
          elementId: element.id,
          pageId,
          componentId: element.componentId,
        }),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: pointerOutsideOfPreview({ x: '16px', y: '16px' }),
            render: ({ container }) => {
              const root = createRoot(container)
              root.render(<PanelDragOverlay componentId={element.componentId} />)
              return () => root.unmount()
            },
          })
        },
      }),
      dropTargetForElements({
        element: section,
        canDrop: ({ source }) => {
          const data = source.data as DragSourceData
          if (data.type === 'canvas' && data.elementId === element.id) return false
          return true
        },
        getData: ({ input, source, element: target }) => {
          const data = source.data as DragSourceData
          const sourceIsMyPartner =
            data.type === 'canvas' && data.elementId === pairPartnerIdRef.current
          let allowedEdges: Edge[]
          if (sourceIsMyPartner) {
            // In-pair swap: only allow dropping on the opposite side of the partner.
            // Vertical edges still work so the user can break the pair.
            allowedEdges = partnerSwapEdgeRef.current
              ? ['top', 'bottom', partnerSwapEdgeRef.current]
              : ['top', 'bottom']
          } else {
            const sourceShrinkable = isComponentShrinkable(data.componentId)
            const allowHorizontal =
              sourceShrinkable && selfShrinkable && !isPairedRef.current
            allowedEdges = allowHorizontal
              ? ['top', 'bottom', 'left', 'right']
              : ['top', 'bottom']
          }
          return attachClosestEdge(
            { type: 'element', elementId: element.id, pageId },
            { input, element: target, allowedEdges }
          )
        },
        onDrag: ({ self, source }) => {
          const data = source.data as DragSourceData
          if (data.type === 'canvas' && data.elementId === element.id) {
            reportEdge(null)
            return
          }
          reportEdge(extractClosestEdge(self.data))
        },
        onDragLeave: () => reportEdge(null),
        onDrop: () => reportEdge(null),
      })
    )
  }, [element.id, element.componentId, pageId, selfShrinkable, onDropEdgeChange])

  useEffect(() => {
    const container = contentRef.current
    if (!container || !comp) return

    const editableFields = INLINE_EDITABLE_MAP[element.componentId] || []
    const cleanups: (() => void)[] = []

    for (const field of editableFields) {
      const el = container.querySelector(field.selector) as HTMLElement | null
      if (!el) continue

      if (isSelected) {
        el.contentEditable = 'true'
        el.style.outline = 'none'
        el.style.cursor = 'text'
        const propDef = ComponentRegistry.get(element.componentId)?.properties.find((p) => p.name === field.property)
        const defaultValue = String(propDef?.default || '')
        const placeholderText = defaultValue || field.property
        el.dataset.placeholder = placeholderText

        if (!el.textContent) {
          el.classList.add('build-page__inline-placeholder')
        }

        const handleFocus = () => {
          if (defaultValue && el.textContent === defaultValue) {
            el.textContent = ''
            el.classList.add('build-page__inline-placeholder')
          }
          if (!el.textContent) {
            el.classList.add('build-page__inline-placeholder')
          }
        }

        const handleInput = () => {
          if (el.textContent) {
            el.classList.remove('build-page__inline-placeholder')
          } else {
            el.classList.add('build-page__inline-placeholder')
          }
        }

        const handleBlur = () => {
          const newText = el.textContent || ''
          el.classList.remove('build-page__inline-placeholder')
          if (newText) {
            onPropertyChange(element.id, field.property, newText)
          } else {
            onPropertyChange(element.id, field.property, defaultValue)
            el.textContent = defaultValue
          }
        }

        const handleMouseDown = (e: MouseEvent) => {
          if (isSelected) e.stopPropagation()
        }

        el.addEventListener('focus', handleFocus)
        el.addEventListener('input', handleInput)
        el.addEventListener('blur', handleBlur)
        el.addEventListener('mousedown', handleMouseDown)
        cleanups.push(() => {
          el.contentEditable = 'false'
          el.style.cursor = ''
          el.classList.remove('build-page__inline-placeholder')
          delete el.dataset.placeholder
          el.removeEventListener('focus', handleFocus)
          el.removeEventListener('input', handleInput)
          el.removeEventListener('blur', handleBlur)
          el.removeEventListener('mousedown', handleMouseDown)
        })
      } else {
        el.contentEditable = 'false'
        el.style.cursor = ''
      }
    }

    if (isSelected && element.componentId === 'paragraph') {
      const editor = container.querySelector('.jf-paragraph__editor') as HTMLElement | null
      if (editor) {
        requestAnimationFrame(() => editor.click())
      }
    }

    return () => cleanups.forEach((fn) => fn())
  }, [isSelected, element.componentId, element.id, comp, onPropertyChange])

  if (!comp) return null

  return (
    <section
      ref={sectionRef}
      className={`themes-view__section build-page__canvas-element ${isSelected ? 'build-page__canvas-element--selected' : ''} ${isShrinked ? 'themes-view__section--shrinked build-page__canvas-element--shrinked' : ''} ${isFlow ? 'themes-view__section--flow' : ''}`}
      data-element-id={element.id}
      data-component-id={element.componentId}
      style={hideDuringDrag ? { display: 'none' } : undefined}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(element.id)
      }}
    >
      <div ref={handleRef} className="build-page__drag-handle">
        <Icon name="grid-dots-vertical" category="general" size={24} />
      </div>
      <div ref={contentRef} className="build-page__canvas-element-content">
        {comp.render(element.variants, element.properties, element.states, (name, value) => onPropertyChange(element.id, name, value))}
      </div>
    </section>
  )
})

function DraggablePanelItem({
  comp,
  children,
}: {
  comp: RegisteredComponent
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    return draggable({
      element: el,
      getInitialData: (): Record<string, unknown> => ({
        type: 'panel',
        componentId: comp.id,
      }),
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: pointerOutsideOfPreview({ x: '16px', y: '16px' }),
          render: ({ container }) => {
            const root = createRoot(container)
            root.render(<PanelDragOverlay componentId={comp.id} />)
            return () => root.unmount()
          },
        })
      },
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    })
  }, [comp.id])

  return (
    <div
      ref={ref}
      className={isDragging ? 'build-page__element-item--dragging' : ''}
    >
      {children}
    </div>
  )
}

function DroppablePage({
  pageId,
  showEmptyState,
  onEmptyStateClick,
  children,
}: {
  pageId: string
  showEmptyState: boolean
  onEmptyStateClick: (e: React.MouseEvent) => void
  children?: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isOverEmpty, setIsOverEmpty] = useState(false)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)

  const handleDropEdgeChange = useCallback<DropEdgeChange>((elementId, edge) => {
    setDropTarget((prev) => {
      if (edge === null) {
        return prev?.elementId === elementId ? null : prev
      }
      if (prev?.elementId === elementId && prev.edge === edge) return prev
      return { elementId, edge }
    })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    return dropTargetForElements({
      element: el,
      getData: () => ({ type: 'page', pageId }),
      getIsSticky: () => false,
      onDragEnter: () => setIsOverEmpty(true),
      onDragLeave: () => {
        setIsOverEmpty(false)
        setDropTarget(null)
      },
      onDrop: () => {
        setIsOverEmpty(false)
        setDropTarget(null)
      },
    })
  }, [pageId])

  return (
    <DropEdgeContext.Provider value={handleDropEdgeChange}>
      <div
        ref={ref}
        data-page-id={pageId}
        className={`themes-view__app ${showEmptyState && isOverEmpty ? 'build-page__droppable--over' : ''}`}
      >
        {showEmptyState && (
          <section
            className="themes-view__section themes-view__section--center build-page__empty-state"
            onClick={onEmptyStateClick}
          >
            <EmptyState mobile={window.matchMedia('(max-width: 768px)').matches} />
          </section>
        )}
        {children}
        <CanvasDropLine target={dropTarget} containerRef={ref} />
      </div>
    </DropEdgeContext.Provider>
  )
}

function useResolvedCssVar(varName: string, selectors: string[], fallback: string): string {
  const [resolved, setResolved] = useState(fallback)
  useEffect(() => {
    let root: HTMLElement | null = null
    for (const sel of selectors) {
      const el = document.querySelector(sel) as HTMLElement | null
      if (el) { root = el; break }
    }
    const target = root ?? document.documentElement
    const update = () => {
      const value = getComputedStyle(target).getPropertyValue(varName).trim()
      if (value) setResolved(toHex(value) || fallback)
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(target, { attributes: true, attributeFilter: ['style', 'class'] })
    return () => observer.disconnect()
  }, [varName, fallback, selectors.join('|')])
  return resolved
}

function toHex(input: string): string {
  const v = input.trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return v.toUpperCase()
  const m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (!m) return ''
  const r = Number(m[1]).toString(16).padStart(2, '0')
  const g = Number(m[2]).toString(16).padStart(2, '0')
  const b = Number(m[3]).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`.toUpperCase()
}

function ColorPropertyField({
  value,
  onChange,
  placeholder,
  fallback = '#7D38EF',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  fallback?: string
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  const openPicker = useCallback(() => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (rect) setPos({ top: rect.bottom + 8, left: Math.max(8, rect.right - 272) })
    setOpen(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (popupRef.current?.contains(t) || wrapperRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pickerColor = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : fallback
  const displayColor = value || fallback

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <DSColorInput
        color={displayColor}
        onColorChange={onChange}
        onSwatchClick={openPicker}
        placeholder={placeholder}
      />
      {open && createPortal(
        <div
          ref={popupRef}
          className="color-theme-grid__picker-popup"
          data-theme="dark"
          style={{ top: pos.top, left: pos.left }}
        >
          <HsvColorPicker
            color={pickerColor}
            onChange={onChange}
            tint={0}
            onTintChange={() => {}}
            hideTint
          />
        </div>,
        document.body,
      )}
    </div>
  )
}

const SOCIAL_BG_SELECTORS = ['.themes-view__device', '.app-scope']
function SocialIconColorField({
  value,
  onChange,
  tokenVariable = '--bg-fill-brand',
}: {
  value: string
  onChange: (v: string) => void
  tokenVariable?: string
}) {
  const fallback = useResolvedCssVar(tokenVariable, SOCIAL_BG_SELECTORS, '#7D38EF')
  return (
    <ColorPropertyField
      value={value}
      onChange={onChange}
      fallback={fallback}
      placeholder={fallback}
    />
  )
}

// App-header background fill picker: swatch trigger + Solid/Gradient popover
// (the same HsvColorPicker the Edit Theme main color uses). Falls back to the
// resolved brand token so the swatch/picker start from the theme color.
function HeaderBackgroundField({
  mode,
  color,
  gradientStart,
  gradientEnd,
  onModeChange,
  onColorChange,
  onGradientChange,
}: {
  mode: 'solid' | 'gradient'
  color: string
  gradientStart: string
  gradientEnd: string
  onModeChange: (m: 'solid' | 'gradient') => void
  onColorChange: (c: string) => void
  onGradientChange: (start: string, end: string) => void
}) {
  const fallback = useResolvedCssVar('--bg-fill-brand', SOCIAL_BG_SELECTORS, '#7D38EF')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  const openPicker = useCallback(() => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (rect) setPos({ top: rect.bottom + 8, left: Math.max(8, rect.right - 272) })
    setOpen(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (popupRef.current?.contains(t) || wrapperRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const solid = color || fallback
  const gStart = gradientStart || fallback
  const gEnd = gradientEnd || '#FFFFFF'

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <DSColorInput
        size="md"
        color={mode === 'gradient' ? gStart : solid}
        onColorChange={(c) => (mode === 'gradient' ? onGradientChange(c, gEnd) : onColorChange(c))}
        onSwatchClick={openPicker}
      />
      {open && createPortal(
        <div
          ref={popupRef}
          className="color-theme-grid__picker-popup"
          data-theme="dark"
          style={{ top: pos.top, left: pos.left }}
        >
          <HsvColorPicker
            color={solid}
            onChange={onColorChange}
            tint={0}
            onTintChange={() => {}}
            hideTint
            showTabs
            mode={mode}
            onModeChange={onModeChange}
            gradientStart={gStart}
            gradientEnd={gEnd}
            onGradientChange={onGradientChange}
          />
        </div>,
        document.body,
      )}
    </div>
  )
}

function AiCreateWidgetButton({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" className="ai-create-btn" onClick={onClick}>
      <span className="ai-create-btn__visual">
        <img src="/podo-widget-creator.png" alt="" className="ai-create-btn__visual-img" />
      </span>
      <span className="ai-create-btn__copy">
        <span className="ai-create-btn__title">Create widget with</span>
        <span className="ai-create-btn__badge">AI</span>
      </span>
      <Icon name="chevron-right" category="arrows" size={20} className="ai-create-btn__chevron" />
    </button>
  )
}

function TabMenu({ activeTab, onTabChange }: { activeTab: 'basic' | 'widgets'; onTabChange: (tab: 'basic' | 'widgets') => void }) {
  return (
    <div className="build-page__tab-menu" data-theme="dark">
      <DSTabs
        accent="apps"
        value={activeTab}
        onChange={(v) => onTabChange(v as 'basic' | 'widgets')}
        items={[
          { value: 'basic', label: 'Basic' },
          { value: 'widgets', label: 'Widgets' },
        ]}
      />
    </div>
  )
}

function AddPageDivider({
  onClick,
  label = 'Add a Page',
  icon = 'plus-sm',
}: {
  onClick: () => void
  label?: string
  icon?: string
}) {
  return (
    <div className="add-page-divider" onClick={(e) => e.stopPropagation()}>
      <div className="add-page-divider__line" />
      <button className="add-page-divider__btn" onClick={onClick}>
        <Icon name={icon} category="general" size={24} />
        <span>{label}</span>
      </button>
      <div className="add-page-divider__line" />
    </div>
  )
}

type RightPanelMode = 'preview' | 'designer' | 'properties' | 'page' | 'navigation'

interface BuildPageProps {
  appTitle?: string
  onAppTitleChange?: (title: string) => void
  // App icon (nav logo) — managed in Settings, independent of the App Header hero.
  appIcon?: { variant: 'Icon' | 'Image'; icon: string; imageUrl: string | null }
  preset?: AppPreset
  initialPageId?: string
  chromeless?: boolean
  openAttributionSheet?: boolean
  previewMode?: boolean
  onPreviewClose?: () => void
}

export function BuildPage({
  appTitle: appTitleProp = 'App Title',
  onAppTitleChange,
  appIcon = { variant: 'Icon', icon: 'Leaf', imageUrl: null },
  preset,
  initialPageId,
  chromeless = false,
  openAttributionSheet = false,
  previewMode = false,
  onPreviewClose,
}: BuildPageProps) {
  const [rightPanel, setRightPanel] = useState<RightPanelMode>('preview')
  const [pagePropertiesId, setPagePropertiesId] = useState<string | null>(null)
  // Bottom-navigation menu settings (mobile), edited via the Navigation Menu panel.
  const [bottomNavEnabled, setBottomNavEnabled] = useState(true)
  const [bottomNavDisplayStyle, setBottomNavDisplayStyle] = useState<'iconText' | 'icon'>('iconText')
  // Mobile/Desktop tab of the Navigation Properties panel — lifted here so the
  // builder canvas can mirror it as a live preview while the panel is open.
  const [navMenuTab, setNavMenuTab] = useState<'mobile' | 'desktop'>('mobile')
  const [topNavEnabled, setTopNavEnabled] = useState(true)
  // Mobile only: the top nav bar drops its background and overlays the first-page
  // hero (content goes light to match the hero text). See live-preview__top-header--transparent.
  const [topNavTransparent, setTopNavTransparent] = useState(false)
  // Desktop navigation — independent from the mobile settings above.
  const [desktopNavVariant, setDesktopNavVariant] = useState<'top' | 'contained' | 'compact' | 'left'>('top')
  const [desktopNavEnabled, setDesktopNavEnabled] = useState(true)
  const [desktopNavDisplayStyle, setDesktopNavDisplayStyle] = useState<'iconText' | 'text'>('text')
  const [desktopNavAlignment, setDesktopNavAlignment] = useState<'left' | 'center' | 'right'>('right')
  // Sticky defaults OFF for every desktop nav variant that exposes the toggle
  // (top / contained / compact); users opt in.
  const [desktopNavSticky, setDesktopNavSticky] = useState(false)
  const [propertyTab, setPropertyTab] = useState<string>('general')
  const appHeaderImageInputRef = useRef<HTMLInputElement>(null)
  const appHeaderBgImageInputRef = useRef<HTMLInputElement>(null)
  const [editItemsOpen, setEditItemsOpen] = useState(false)
  const [selectedElementId, _setSelectedElementId] = useState<string | null>(null)
  const setSelectedElementId = useCallback((next: React.SetStateAction<string | null>) => {
    _setSelectedElementId(next)
    setPropertyTab('general')
  }, [])
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null)
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null)
  const [productSettingsTab, setProductSettingsTab] = useState<string>('basic')
  const [productSearch, setProductSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [optionModalOpen, setOptionModalOpen] = useState(false)
  const [editingModifierIndex, setEditingModifierIndex] = useState<number | null>(null)
  const [modifierModalOpen, setModifierModalOpen] = useState(false)
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false)
  const [inventoryFilter, setInventoryFilter] = useState('all')
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const productSearchFieldRef = useRef<HTMLDivElement>(null)
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null)
  const [editingTestimonialIndex, setEditingTestimonialIndex] = useState<number | null>(null)
  useEffect(() => { setEditingProductIndex(null); setEditingOptionIndex(null); setProductSettingsTab('basic'); setProductSearch(''); setFilterOpen(false); setOptionModalOpen(false); setEditingModifierIndex(null); setModifierModalOpen(false); setSubscriptionModalOpen(false); setEditingFaqIndex(null); setEditingTestimonialIndex(null) }, [selectedElementId, propertyTab])

  // Seed missing default properties on selection for elements whose schema gained
  // new props after they were already on the canvas (e.g. Testimonial's Items list
  // and display toggles). Idempotent: only fills props that are absent, so a
  // toggle the user deliberately turned off (a real `false`) is preserved.
  useEffect(() => {
    if (!selectedElementId) return
    const all = [...pagesRef.current.flatMap((p) => p.elements), ...headerActionsRef.current]
    const el = all.find((e) => e.id === selectedElementId)
    if (!el || (el.componentId !== 'social-follow' && el.componentId !== 'testimonial')) return
    const comp = ComponentRegistry.get(el.componentId)
    if (!comp) return
    const updates: Record<string, string | boolean | number> = {}
    for (const prop of comp.properties) {
      const current = el.properties[prop.name]
      if ((current === undefined || current === '') && prop.default !== undefined && prop.default !== '') {
        updates[prop.name] = prop.default as string | boolean | number
      }
    }
    // Non-destructive upgrade for an untouched legacy Testimonial demo: its items
    // predate the role/rating fields, so toggling Show Role/Rating shows nothing.
    // Only re-seed when the items are still the exact default (same names, no
    // role/rating) — a customized list is left alone.
    if (el.componentId === 'testimonial') {
      try {
        const items = JSON.parse(String(el.properties['Items'] ?? '[]'))
        const def = comp.properties.find((p) => p.name === 'Items')?.default
        const defItems = typeof def === 'string' ? JSON.parse(def) : []
        // Upgrade an untouched default demo (an unedited prefix of the current
        // default — e.g. the original 3 items) to the full default set, now 4
        // items so the Grid stays balanced. A customized list is left alone.
        const isUntouchedDemo =
          Array.isArray(items) && Array.isArray(defItems) &&
          items.length > 0 && items.length < defItems.length &&
          items.every((it, i) => it && typeof it === 'object' && defItems[i] && it.name === defItems[i].name && it.text === defItems[i].text)
        if (isUntouchedDemo && typeof def === 'string') updates['Items'] = def
      } catch {
        // ignore malformed Items
      }
    }
    // Normalize any variant value that is no longer a valid option (e.g. a
    // removed "Shadow" card style) back to its default, so the segmented
    // control and the rendered output stay in sync.
    const variantUpdates: Record<string, string> = {}
    for (const [group, config] of Object.entries(comp.variants)) {
      const cur = el.variants[group]
      if (cur !== undefined && !config.options.includes(String(cur))) {
        variantUpdates[group] = config.default || config.options[0]
      }
    }
    if (Object.keys(updates).length === 0 && Object.keys(variantUpdates).length === 0) return
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        elements: page.elements.map((e) =>
          e.id === selectedElementId
            ? { ...e, variants: { ...e.variants, ...variantUpdates }, properties: { ...e.properties, ...updates } }
            : e,
        ),
      })),
    )
  }, [selectedElementId])
  const [canvasElementWidth, setCanvasElementWidth] = useState<number | null>(null)
  useEffect(() => {
    if (!selectedElementId) { setCanvasElementWidth(null); return }
    const node = document.querySelector(`[data-element-id="${selectedElementId}"]`) as HTMLElement | null
    if (!node) { setCanvasElementWidth(null); return }
    const measure = () => setCanvasElementWidth(Math.round(node.getBoundingClientRect().width))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(node)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [selectedElementId])
  const [components, setComponents] = useState<RegisteredComponent[]>(ComponentRegistry.getAll())
  const initial = useRef(buildInitialStateFromPreset(preset)).current
  const [pages, setPages] = useState<AppPage[]>(initial.pages)
  const [headerActions, setHeaderActions] = useState<CanvasElement[]>(initial.headerActions)
  const headerActionsRef = useRef<CanvasElement[]>([])
  useEffect(() => { headerActionsRef.current = headerActions }, [headerActions])
  const [activePageId, setActivePageId] = useState(() => {
    // Resolve initialPageId against the user's actual stored pages. Accepts:
    //   1. an exact page ID match (e.g. "page-3")
    //   2. a 1-based index ("3" → pages[2]) — robust when stored page IDs
    //      drift from the preset (custom IDs after add/delete) so capture
    //      URLs stay stable.
    if (initialPageId) {
      if (initial.pages.some((p: AppPage) => p.id === initialPageId)) return initialPageId
      const idx = Number.parseInt(initialPageId, 10) - 1
      if (Number.isFinite(idx) && idx >= 0 && idx < initial.pages.length) {
        return initial.pages[idx].id
      }
    }
    return initial.activePageId
  })
  const [dragSession, setDragSession] = useState<DragSourceData | null>(null)
  const isDragging = dragSession !== null
  const draggedCanvasId = dragSession?.type === 'canvas' ? dragSession.elementId : null
  const headerActionsSlotRef = useRef<HTMLDivElement>(null)
  const [headerSlotDropState, setHeaderSlotDropState] = useState<'idle' | 'accept' | 'reject'>('idle')
  const [headerDropTarget, setHeaderDropTarget] = useState<DropTarget | null>(null)
  const handleHeaderDropEdgeChange = useCallback<DropEdgeChange>((elementId, edge) => {
    setHeaderDropTarget((prev) => {
      if (edge === null) {
        return prev?.elementId === elementId ? null : prev
      }
      if (prev?.elementId === elementId && prev.edge === edge) return prev
      return { elementId, edge }
    })
  }, [])
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [mobileElementsSheet, setMobileElementsSheet] = useState(false)
  const [forceTargetPageId, setForceTargetPageId] = useState<string | null>(null)
  const [isMobileView, setIsMobileView] = useState(() => window.matchMedia('(max-width: 768px)').matches)
  const canvasRef = useRef<HTMLElement>(null)

  const pagesRef = useRef<AppPage[]>([])
  useEffect(() => { pagesRef.current = pages }, [pages])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setIsMobileView(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const appTitle = appTitleProp
  // App name/description are the app identity, edited from the builder chrome /
  // Settings — NOT from the app header (now an independent hero banner). They
  // only seed the header's default title/subtitle when its own are unset.
  const appSubtitle = initial.appSubtitle
  const [appHeaderState, setAppHeaderState] = useState<AppHeaderState>(initial.appHeader)
  const [isMorePageOpen, setIsMorePageOpen] = useState(false)
  const [isPreviewCartOpen, setIsPreviewCartOpen] = useState(false)
  const [isPreviewDetailOpen, setIsPreviewDetailOpen] = useState(false)
  const [isPreviewCheckoutOpen, setIsPreviewCheckoutOpen] = useState(false)
  const [isPreviewProfileOpen, setIsPreviewProfileOpen] = useState(false)
  const [isAvatarPopoverOpen, setIsAvatarPopoverOpen] = useState(false)
  const [isLoginPopoverOpen, setIsLoginPopoverOpen] = useState(false)
  const [loginPopoverView, setLoginPopoverView] = useState<'login' | 'signup'>('login')
  // Full-screen auth view launched from the landing menu (vs the anchored popover).
  const [previewAuthView, setPreviewAuthView] = useState<'login' | 'signup' | null>(null)
  // Page to land on after signing in (set when a logged-out user opens a protected page).
  const pendingAuthRedirectRef = useRef<string | null>(null)
  const [isPreviewLoggedIn, setIsPreviewLoggedIn] = useState(false)
  const [viewingAsRole, setViewingAsRole] = useState<'anyone' | 'admin' | 'user'>('admin')
  const [previewDevice, setPreviewDevice] = useState<'phone' | 'tablet' | 'desktop'>('phone')
  const [isLivePreviewVisible, setIsLivePreviewVisible] = useState(true)
  // Slider position is "sticky": only updated when its target slot is visible.
  // Prevents preview content from flashing when designer closes while preview
  // is hidden (slider stays at designer until aside finishes sliding out).
  const [sliderMode, setSliderMode] = useState<'preview' | 'designer'>('preview')
  // When aside visibility flips, snap the slider to its new slot without
  // animation so the user sees a clean aside slide-in/out without the inner
  // slide also transitioning across.
  const [skipSliderTransition, setSkipSliderTransition] = useState(false)
  const prevAsideVisibleRef = useRef(true)
  useLayoutEffect(() => {
    const isAsideVisible = isLivePreviewVisible || rightPanel !== 'preview'
    if (prevAsideVisibleRef.current !== isAsideVisible) {
      setSkipSliderTransition(true)
      prevAsideVisibleRef.current = isAsideVisible
    }
    if (rightPanel === 'designer') setSliderMode('designer')
    else if (isLivePreviewVisible) setSliderMode('preview')
  }, [rightPanel, isLivePreviewVisible])
  useEffect(() => {
    if (!skipSliderTransition) return
    const t = setTimeout(() => setSkipSliderTransition(false), 350)
    return () => clearTimeout(t)
  }, [skipSliderTransition])
  const [isQrPopoverOpen, setIsQrPopoverOpen] = useState(false)
  const qrPopoverWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isQrPopoverOpen) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (qrPopoverWrapperRef.current && !qrPopoverWrapperRef.current.contains(e.target as Node)) {
        setIsQrPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [isQrPopoverOpen])

  useEffect(() => {
    if (!preset) return
    // Empty App is a sandbox — never persist its state.
    if (preset.id === 'empty') return
    const snap = { appTitle, appSubtitle, pages, headerActions, appHeader: appHeaderState }
    saveSnapshot(preset.id, snap) // local (IndexedDB) — instant
    syncAppToRemote(preset.id, snap) // remote (Vercel KV via /api) — debounced; no-op without a backend
  }, [preset, appTitle, appSubtitle, pages, headerActions, appHeaderState])
  const appHeaderRef = useRef<HTMLDivElement>(null)
  const designBtnRef = useRef<HTMLButtonElement>(null)
  const [designBtnOnHeader, setDesignBtnOnHeader] = useState(true)

  // Live preview: track scroll so the top-header chrome can collapse to show
  // its icon + title (iOS large-title pattern) the moment the first page
  // starts scrolling.
  const [previewContentScalerEl, setPreviewContentScalerEl] = useState<HTMLDivElement | null>(null)
  const [isPreviewContentScrolled, setIsPreviewContentScrolled] = useState(false)
  // Transparent top nav: true while the hero is still behind the bar (→ transparent
  // overlay); false once the bar sits over the page content below it (→ solid bar).
  const [topNavOverHero, setTopNavOverHero] = useState(true)
  // Non-sticky desktop top nav: the bar scrolls away with the content on
  // scroll-down (transform tied to scroll, no animation) and slides back in on
  // scroll-up (CSS transition). Driven imperatively to avoid per-frame renders.
  const previewTopHeaderRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!previewContentScalerEl) {
      setIsPreviewContentScrolled(false)
      setTopNavOverHero(true)
      return
    }
    const autoHide =
      (previewDevice === 'desktop' &&
        desktopNavVariant !== 'left' &&
        !desktopNavSticky) ||
      // Landing on phone behaves like the desktop top nav: the bar scrolls away
      // with the content instead of staying pinned over the hero.
      (previewDevice === 'phone' && !!pages[0]?.landing && !isPreviewLoggedIn)
    // Clear any leftover transform when auto-hide isn't active (e.g. sticky on).
    const resetHeader = previewTopHeaderRef.current
    if (resetHeader && !autoHide) {
      resetHeader.style.transition = ''
      resetHeader.style.transform = ''
    }
    // Distance to fully scroll the bar off the top. The compact bar floats 16px
    // (--space-4) below the top, so it needs that extra travel (16 + 64) to clear
    // — otherwise its bottom edge stays pinned at the float offset.
    // Phone: hide the bar by its full footprint (offset top + height); desktop
    // uses the known bar heights (compact floats 16px below the top).
    const headerEl = previewTopHeaderRef.current
    const HEADER_H = previewDevice === 'phone'
      ? (headerEl ? headerEl.offsetTop + headerEl.offsetHeight : 102)
      : (desktopNavVariant === 'compact' ? 80 : 64)
    let lastScrollTop = previewContentScalerEl.scrollTop
    let offset = 0
    const onScroll = () => {
      const st = previewContentScalerEl.scrollTop
      setIsPreviewContentScrolled(st > 0)
      // Transparent top nav stays transparent only while the hero is still behind the
      // bar; once the hero's bottom rises above the bar's bottom, page content is behind
      // it → switch to a solid bar. Rects are post-transform, so the 0.9 scale is handled.
      const navEl = previewTopHeaderRef.current
      const heroEl = previewContentScalerEl.querySelector('.jf-app-header') as HTMLElement | null
      setTopNavOverHero(
        !!navEl && !!heroEl && heroEl.getBoundingClientRect().bottom > navEl.getBoundingClientRect().bottom
      )
      if (!autoHide) return
      const header = previewTopHeaderRef.current
      if (!header) return
      const delta = st - lastScrollTop
      lastScrollTop = st
      if (st <= 0) {
        offset = 0
        header.style.transition = ''
      } else if (delta > 0) {
        // scrolling down — move up in lockstep with the content (no animation)
        offset = Math.max(-HEADER_H, offset - delta)
        header.style.transition = 'none'
      } else if (delta < 0) {
        // scrolling up — slide the whole bar back in (CSS transition)
        offset = 0
        header.style.transition = ''
      }
      header.style.transform = offset < 0 ? `translateY(${offset}px)` : ''
    }
    onScroll()
    previewContentScalerEl.addEventListener('scroll', onScroll, { passive: true })
    return () => previewContentScalerEl.removeEventListener('scroll', onScroll)
  }, [previewContentScalerEl, previewDevice, desktopNavVariant, desktopNavSticky, pages, isPreviewLoggedIn])

  // While the Navigation Properties panel is open, mirror its Mobile/Desktop tab
  // onto the canvas preview device so the left builder area previews the choice.
  useEffect(() => {
    if (rightPanel === 'navigation') {
      setPreviewDevice(navMenuTab === 'desktop' ? 'desktop' : 'phone')
    }
  }, [rightPanel, navMenuTab])

  // Esc closes the Navigation Properties panel (same as its ✕ button), returning
  // the canvas to the editing view.
  useEffect(() => {
    if (rightPanel !== 'navigation') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRightPanel('preview')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rightPanel])

  // The hamburger / "More" menu reuses the page's scroll container, which also
  // carries a small scale-compensation overflow — so a page scrolled before
  // opening the menu would leave the menu scrolled too. Reset to the top when it
  // opens (layout effect = before paint, no flash) so it always starts at its
  // own header.
  useLayoutEffect(() => {
    if (isMorePageOpen && previewContentScalerEl) {
      previewContentScalerEl.scrollTop = 0
    }
  }, [isMorePageOpen, previewContentScalerEl])

  // Bottom-nav overflow: when 5+ pages exist, show the first 4 and replace the
  // 5th slot with a "More" tab. Tapping More opens a full-screen list of all
  // pages; tapping a page from that list navigates and dismisses More.
  // Landing mode: the first page acts as a public landing screen for logged-out
  // visitors. While the landing screen is showing, the bottom nav is replaced by
  // a hamburger/top-nav; once logged in the landing page itself drops out of the nav.
  const landingPage = pages[0]?.landing ? pages[0] : undefined
  const landingActive = !!landingPage
  const showLandingNav = landingActive && !isPreviewLoggedIn
  // Hidden pages (Show Page on Navigation toggle) stay editable in the canvas but
  // drop out of the app's nav. The landing page never self-links in the nav (the
  // app logo/brand returns home), so it is dropped from the nav whenever it is the
  // landing page — both on the public landing (signed out) and once signed in.
  const navPages = pages.filter((p) => {
    if (p.hidden) return false
    if (landingActive && p.id === landingPage!.id) return false
    // Landing mode + signed out: the public landing nav only lists public pages —
    // login-required pages stay hidden from the nav until the visitor signs in.
    if (showLandingNav && p.requireLogin) return false
    return true
  })
  const hasNavOverflow = navPages.length >= 5
  const visibleNavPages = hasNavOverflow ? navPages.slice(0, 4) : navPages
  const isActiveInOverflow = hasNavOverflow && navPages.slice(4).some((p) => p.id === activePageId)
  const bottomNavItems = hasNavOverflow
    ? [...visibleNavPages.map((p, i) => ({ icon: getPageIconName(p, i), label: p.name })), { icon: 'Ellipsis', label: 'More' }]
    : visibleNavPages.map((p, i) => ({ icon: getPageIconName(p, i), label: p.name }))
  const bottomNavActiveIndex = (() => {
    if (hasNavOverflow && (isMorePageOpen || isActiveInOverflow)) return visibleNavPages.length
    const idx = visibleNavPages.findIndex((p) => p.id === activePageId)
    return idx === -1 ? 0 : idx
  })()
  // Navigating to a login-required page while signed out opens login first, then
  // redirects to the requested page after a successful sign-in.
  const navigateToPage = useCallback((pageId: string) => {
    const page = pagesRef.current.find((p) => p.id === pageId)
    if (page?.requireLogin && !isPreviewLoggedIn) {
      pendingAuthRedirectRef.current = pageId
      setIsMorePageOpen(false)
      setPreviewAuthView('login')
      return
    }
    setIsPreviewProfileOpen(false)
    setIsAvatarPopoverOpen(false)
    setActivePageId(pageId)
  }, [isPreviewLoggedIn])

  const handleBottomNavClick = (index: number) => {
    if (hasNavOverflow && index === visibleNavPages.length) {
      setIsMorePageOpen(true)
      return
    }
    setIsMorePageOpen(false)
    navigateToPage(visibleNavPages[index].id)
  }
  const handleMorePageSelect = (pageId: string) => {
    setIsMorePageOpen(false)
    navigateToPage(pageId)
  }

  // Top-header compact (app icon + title) shown the moment scrolling starts.
  // On mobile/tablet it's first-page only (AppHeader lives there). Desktop
  // preview promotes every page so the chrome reads "app branding" consistently
  // across pages once you scroll.
  // Keep the element in the DOM 250ms after dismissal so the exit animation runs.
  const previewIsFirstPage = activePageId === pages[0]?.id
  const isDesktopFullPreview = previewMode && previewDevice === 'desktop'
  const showCompactTitle = appHeaderState.show && isPreviewContentScrolled && (previewIsFirstPage || isDesktopFullPreview)

  useEffect(() => {
    return ComponentRegistry.subscribe(() => {
      setComponents(ComponentRegistry.getAll())
    })
  }, [])

  const isReorderingInHeader =
    dragSession?.type === 'canvas' &&
    headerActions.some((a) => a.id === dragSession.elementId)

  // Hero layout uses a prop-based CTA (HeroCtaButton) instead of drag-and-drop
  // header actions, so the whole DnD add/drop path is gated off for it. Other
  // layouts (Default/Cover/Profile) keep the header-actions DnD.
  const appHeaderIsHero = (appHeaderState.headerLayout ?? 'Hero') === 'Hero'
  const heroCtaConfig: HeroCtaConfig = {
    label: appHeaderState.ctaLabel ?? 'Get Started',
    action: appHeaderState.ctaAction ?? 'Do Nothing',
    pageId: appHeaderState.ctaPageId,
    url: appHeaderState.ctaUrl,
    email: appHeaderState.ctaEmail,
    phone: appHeaderState.ctaPhone,
    formTitle: appHeaderState.ctaFormTitle,
    formDescription: appHeaderState.ctaFormDescription,
    formSubmitLabel: appHeaderState.ctaFormSubmitLabel,
    formFields: appHeaderState.ctaFormFields,
    submitsTo: appHeaderState.ctaSubmitsTo,
  }
  const heroCtaActive = appHeaderIsHero && (appHeaderState.ctaEnabled ?? false)
  // Transparent (overlay) mobile top nav — only on the first page while the hero is
  // shown, and only on the phone shell (the 54px status-bar offset is phone-specific).
  // Content follows the hero's resolved text color so it stays legible over the scrim.
  const activeIsFirstPage = (pages.find((p) => p.id === activePageId) ?? pages[0])?.id === pages[0]?.id
  // Not while the hamburger menu is open — the menu covers the hero with a solid
  // panel, so the nav reverts to its normal (opaque) bar there (close icon visible,
  // content no longer tucked under the bar).
  const topNavOverlay = topNavEnabled && topNavTransparent && activeIsFirstPage && appHeaderState.show && previewDevice === 'phone' && !isMorePageOpen
  const topNavOverlayFg = resolveHeaderTextColor(appHeaderState)
  // Mobile top header is shown unless Top Navigation is toggled off (desktop has its
  // own nav controls). When hidden, the content/hero starts below the status bar.
  const mobileTopHeaderHidden = previewDevice !== 'desktop' && !topNavEnabled

  const canDropInHeader = (() => {
    if (appHeaderIsHero) return false
    if (!dragSession) return false
    if (!HEADER_ACTION_ALLOWED.includes(dragSession.componentId)) return false
    if (dragSession.type === 'canvas') {
      return isReorderingInHeader || headerActions.length < HEADER_ACTIONS_MAX
    }
    return headerActions.length < HEADER_ACTIONS_MAX
  })()

  const showHeaderDropzone = canDropInHeader && !isReorderingInHeader

  useEffect(() => {
    const el = headerActionsSlotRef.current
    if (!el) return
    if (canDropInHeader) el.classList.add('jf-app-header__actions--drag-active')
    else el.classList.remove('jf-app-header__actions--drag-active')
  }, [canDropInHeader])

  useEffect(() => {
    const el = headerActionsSlotRef.current
    if (!el) return
    // Hero layout has no header-actions DnD — don't register the slot as a drop
    // target (re-runs when the layout toggles).
    if (appHeaderIsHero) return
    return dropTargetForElements({
      element: el,
      canDrop: ({ source }) => {
        const data = source.data as DragSourceData
        if (!HEADER_ACTION_ALLOWED.includes(data.componentId)) return false
        const currentCount = headerActionsRef.current.length
        if (data.type === 'panel') return currentCount < HEADER_ACTIONS_MAX
        if (data.type === 'canvas') {
          const alreadyInSlot = headerActionsRef.current.some((a) => a.id === data.elementId)
          return alreadyInSlot || currentCount < HEADER_ACTIONS_MAX
        }
        return false
      },
      getData: () => ({ type: 'header-actions' }),
      onDragEnter: ({ source }) => {
        const data = source.data as DragSourceData
        const currentCount = headerActionsRef.current.length
        const alreadyInSlot = data.type === 'canvas' && headerActionsRef.current.some((a) => a.id === data.elementId)
        const typeOk = HEADER_ACTION_ALLOWED.includes(data.componentId)
        const countOk = alreadyInSlot || currentCount < HEADER_ACTIONS_MAX
        setHeaderSlotDropState(typeOk && countOk ? 'accept' : 'reject')
      },
      onDragLeave: () => {
        setHeaderSlotDropState('idle')
        setHeaderDropTarget(null)
      },
      onDrop: () => {
        setHeaderSlotDropState('idle')
        setHeaderDropTarget(null)
      },
    })
  }, [appHeaderIsHero])

  const handleCloseDesigner = useCallback(() => {
    setRightPanel('preview')
  }, [])

  useEffect(() => {
    applyStoredOrDefaultTheme(preset?.id === 'empty' ? undefined : preset?.id, '.app-scope', preset?.theme)
  }, [preset?.id, preset?.theme])

  useEffect(() => {
    const builder = document.querySelector('.builder')
    if (!builder) return
    if (rightPanel === 'designer' && isMobileView) {
      builder.classList.add('builder--design-mode')
    } else {
      builder.classList.remove('builder--design-mode')
    }
  }, [rightPanel, isMobileView])

  useEffect(() => {
    const canvas = document.querySelector('.build-page__canvas')
    if (!canvas || !appHeaderRef.current || !designBtnRef.current) return
    const check = () => {
      const headerRect = appHeaderRef.current!.getBoundingClientRect()
      const btnRect = designBtnRef.current!.getBoundingClientRect()
      setDesignBtnOnHeader(btnRect.top + btnRect.height / 2 < headerRect.bottom)
    }
    check()
    canvas.addEventListener('scroll', check, { passive: true })
    return () => canvas.removeEventListener('scroll', check)
  }, [])

  useEffect(() => {
    const builder = document.querySelector('.builder')
    if (!builder) return
    if (mobileElementsSheet && isMobileView) {
      builder.classList.add('builder--elements-sheet')
    } else {
      builder.classList.remove('builder--elements-sheet')
    }
  }, [mobileElementsSheet, isMobileView])

  useEffect(() => {
    const container = appHeaderRef.current
    if (!container) return

    const titleEl = container.querySelector('.jf-app-header__title') as HTMLElement | null
    const subtitleEl = container.querySelector('.jf-app-header__subtitle') as HTMLElement | null

    // The app-header title/subtitle are the HERO BANNER's own text and write to
    // appHeaderState — NOT the app name. The app name (appTitle/appSubtitle) is
    // edited from the builder chrome / Settings only. They default to the app
    // name when unset so a fresh header isn't empty.
    const fields = [
      { el: titleEl, defaultValue: appTitle, setter: (v: string) => setAppHeaderState((s) => ({ ...s, title: v })) },
      { el: subtitleEl, defaultValue: appSubtitle, setter: (v: string) => setAppHeaderState((s) => ({ ...s, subtitle: v })) },
    ]

    const cleanups: (() => void)[] = []

    for (const { el, defaultValue, setter } of fields) {
      if (!el) continue

      el.contentEditable = 'true'
      el.style.outline = 'none'
      el.style.cursor = 'text'
      const placeholderText = defaultValue || (el.className.includes('subtitle') ? 'Subtitle' : 'Title')
      el.dataset.placeholder = placeholderText


      const handleFocus = () => {
        if (!el.className.includes('subtitle')) {
          const sub = container.querySelector('.jf-app-header__subtitle') as HTMLElement | null
          if (sub && sub.classList.contains('jf-app-header__subtitle--empty')) {
            sub.classList.remove('jf-app-header__subtitle--empty')
            sub.classList.add('build-page__inline-placeholder')
          }
        }
        if (el.className.includes('subtitle--empty')) {
          el.classList.remove('jf-app-header__subtitle--empty')
        }
        if (defaultValue && el.textContent === defaultValue) {
          el.textContent = ''
          el.classList.add('build-page__inline-placeholder')
        }
        if (!el.textContent) {
          el.classList.add('build-page__inline-placeholder')
        }
      }

      const handleInput = () => {
        if (el.textContent) {
          el.classList.remove('build-page__inline-placeholder')
        } else {
          el.classList.add('build-page__inline-placeholder')
        }
      }

      const handleBlur = () => {
        // innerText (not textContent) preserves the line breaks the user adds with
        // Enter (contentEditable inserts <div>/<br>, which textContent would flatten
        // into a single line). Strip only trailing blank lines.
        const newText = el.innerText.replace(/\n+$/, '')
        el.classList.remove('build-page__inline-placeholder')
        if (newText) {
          setter(newText)
        } else {
          setter(defaultValue)
          if (defaultValue) {
            el.textContent = defaultValue
          } else if (el.className.includes('subtitle')) {
            el.classList.add('jf-app-header__subtitle--empty')
          }
        }
        if (!el.className.includes('subtitle')) {
          const sub = container.querySelector('.jf-app-header__subtitle') as HTMLElement | null
          if (sub && !sub.textContent) {
            sub.classList.remove('build-page__inline-placeholder')
            sub.classList.add('jf-app-header__subtitle--empty')
          }
        }
      }

      el.addEventListener('focus', handleFocus)
      el.addEventListener('input', handleInput)
      el.addEventListener('blur', handleBlur)
      cleanups.push(() => {
        el.removeEventListener('focus', handleFocus)
        el.removeEventListener('input', handleInput)
        el.removeEventListener('blur', handleBlur)
      })
    }

    return () => cleanups.forEach((fn) => fn())
  }, [appTitle, appSubtitle, appHeaderState.title, appHeaderState.subtitle])

  const [activeTab, setActiveTab] = useState<'basic' | 'widgets'>('basic')
  const [widgetSearch, setWidgetSearch] = useState('')
  useEffect(() => { setWidgetSearch('') }, [activeTab])

  const componentMap = components.reduce<Record<string, RegisteredComponent>>((acc, comp) => {
    if (!HIDDEN_ELEMENTS.includes(comp.id)) acc[comp.id] = comp
    return acc
  }, {})

  const baseGroups = activeTab === 'basic' ? BASIC_GROUPS : WIDGETS_GROUPS
  const widgetSearchTerm = widgetSearch.trim().toLowerCase()
  const activeGroups = activeTab === 'widgets' && widgetSearchTerm
    ? baseGroups
        .map((g) => ({
          ...g,
          elementIds: g.elementIds.filter((id) => componentMap[id]?.name.toLowerCase().includes(widgetSearchTerm)),
        }))
        .filter((g) => g.elementIds.length > 0)
    : baseGroups

  const handleAddElement = useCallback((comp: RegisteredComponent) => {
    const element = createCanvasElement(comp, nextElementId(pagesRef.current, headerActionsRef.current))
    setPages((prev) => {
      let targetPageId = activePageId
      if (forceTargetPageId) {
        targetPageId = forceTargetPageId
      } else if (selectedElementId) {
        const selectedPage = prev.find((p) => p.elements.some((el) => el.id === selectedElementId))
        if (selectedPage) targetPageId = selectedPage.id
      }
      return prev.map((page) => {
        if (page.id !== targetPageId) return page
        const selectedIdx = selectedElementId && !forceTargetPageId
          ? page.elements.findIndex((el) => el.id === selectedElementId)
          : -1
        if (selectedIdx !== -1) {
          const newElements = [...page.elements]
          newElements.splice(selectedIdx + 1, 0, element)
          return { ...page, elements: newElements }
        }
        return { ...page, elements: [...page.elements, element] }
      })
    })
    setForceTargetPageId(null)
    setSelectedElementId(element.id)
    if (!mobileElementsSheet) {
      setRightPanel('properties')
    }
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.querySelector(`[data-element-id="${element.id}"]`)
        if (!el) return
        const rect = el.getBoundingClientRect()
        const scrollContainer = isMobileView
          ? document.querySelector('.builder')
          : document.querySelector('.build-page__canvas')
        if (!scrollContainer) return
        const containerRect = scrollContainer.getBoundingClientRect()
        const targetY = scrollContainer.scrollTop + rect.top - containerRect.top - containerRect.height / 2 + rect.height / 2
        const start = scrollContainer.scrollTop
        const distance = targetY - start
        const duration = 500
        let startTime: number | null = null
        const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        const step = (timestamp: number) => {
          if (!startTime) startTime = timestamp
          const progress = Math.min((timestamp - startTime) / duration, 1)
          scrollContainer.scrollTop = start + distance * ease(progress)
          if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }, 100)
    })
  }, [activePageId, isMobileView, mobileElementsSheet, selectedElementId, forceTargetPageId])

  const handleSelectElement = useCallback((elementId: string) => {
    setSelectedElementId(elementId)
    setRightPanel('properties')
    setMobileElementsSheet(false)
  }, [])

  const handleRemoveElement = useCallback((elementId: string) => {
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        elements: page.elements.filter((el) => el.id !== elementId),
      }))
    )
    setHeaderActions((prev) => prev.filter((el) => el.id !== elementId))
    setSelectedElementId((prev) => (prev === elementId ? null : prev))
    setRightPanel('preview')
  }, [])

  const handleAddPage = useCallback((afterPageId: string) => {
    const pageId = nextNumericId('page', pagesRef.current.map((p) => p.id))
    const pageNum = pageId.replace(/^page-/, '')
    const newPage: AppPage = {
      id: pageId,
      name: `Page ${pageNum}`,
      elements: [],
    }
    setPages((prev) => {
      const idx = prev.findIndex((p) => p.id === afterPageId)
      const next = [...prev]
      next.splice(idx + 1, 0, newPage)
      return next
    })
    setActivePageId(newPage.id)
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.querySelector(`[data-page-id="${newPage.id}"]`)
        if (!el) return
        const rect = el.getBoundingClientRect()
        const scrollContainer = isMobileView
          ? document.querySelector('.builder')
          : document.querySelector('.build-page__canvas')
        if (!scrollContainer) return
        const containerRect = scrollContainer.getBoundingClientRect()
        const targetY = scrollContainer.scrollTop + rect.top - containerRect.top - containerRect.height / 2 + rect.height / 2
        const start = scrollContainer.scrollTop
        const distance = targetY - start
        const duration = 500
        let startTime: number | null = null
        const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        const step = (timestamp: number) => {
          if (!startTime) startTime = timestamp
          const progress = Math.min((timestamp - startTime) / duration, 1)
          scrollContainer.scrollTop = start + distance * ease(progress)
          if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }, 200)
    })
  }, [isMobileView])

  const updatePage = useCallback((pageId: string, patch: Partial<AppPage>) => {
    setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, ...patch } : p)))
  }, [])

  const openPageSettings = useCallback((pageId: string) => {
    setActivePageId(pageId)
    setSelectedElementId(null)
    setPagePropertiesId(pageId)
    setRightPanel('page')
  }, [])

  const openNavSettings = useCallback(() => {
    setSelectedElementId(null)
    setPagePropertiesId(null)
    setIsLivePreviewVisible(true)
    setRightPanel('navigation')
  }, [])

  // Landing-mode auth transitions: login lands on the first non-landing page
  // ("home"); logout returns to the landing page.
  const handlePreviewLogin = useCallback(() => {
    setIsPreviewLoggedIn(true)
    setIsLoginPopoverOpen(false)
    setIsMorePageOpen(false)
    const arr = pagesRef.current
    const redirect = pendingAuthRedirectRef.current
    pendingAuthRedirectRef.current = null
    if (redirect) {
      // Land on the protected page the user was trying to reach.
      setActivePageId(redirect)
    } else if (arr[0]?.landing) {
      const home = arr.find((p) => p.id !== arr[0].id)
      if (home) setActivePageId(home.id)
    }
  }, [])

  const handlePreviewLogout = useCallback(() => {
    setIsPreviewLoggedIn(false)
    setIsAvatarPopoverOpen(false)
    setIsMorePageOpen(false)
    setIsPreviewProfileOpen(false)
    const arr = pagesRef.current
    if (arr[0]?.landing) setActivePageId(arr[0].id)
  }, [])

  // Safety net: if the landing page is the active page while logged in (e.g. the
  // landing toggle was flipped on while signed in), it's now hidden from nav, so
  // move to the first visible page to avoid a content/nav-highlight mismatch.
  useEffect(() => {
    if (!(landingActive && isPreviewLoggedIn)) return
    if (activePageId !== landingPage?.id) return
    const home = pagesRef.current.find((p) => p.id !== pagesRef.current[0].id && !p.hidden)
    if (home) setActivePageId(home.id)
  }, [landingActive, isPreviewLoggedIn, activePageId, landingPage?.id])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        handleRemoveElement(selectedElementId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementId, handleRemoveElement])

  const handlePropertyChange = useCallback((elementId: string, name: string, value: string | boolean | number) => {
    if (elementId === APP_HEADER_ID) {
      if (name === 'Title') setAppHeaderState((s) => ({ ...s, title: String(value) }))
      else if (name === 'Subtitle') setAppHeaderState((s) => ({ ...s, subtitle: String(value) }))
      else if (name === 'Icon') setAppHeaderState((s) => ({ ...s, icon: String(value) }))
      else if (name === 'Skeleton') setAppHeaderState((s) => ({ ...s, skeleton: Boolean(value) }))
      return
    }
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        elements: page.elements.map((el) =>
          el.id === elementId
            ? { ...el, properties: { ...el.properties, [name]: value } }
            : el
        ),
      }))
    )
    setHeaderActions((prev) =>
      prev.map((el) =>
        el.id === elementId
          ? { ...el, properties: { ...el.properties, [name]: value } }
          : el
      )
    )
  }, [onAppTitleChange])

  const handleVariantChange = useCallback((elementId: string, group: string, value: string) => {
    if (elementId === APP_HEADER_ID) {
      if (group === 'Layout') setAppHeaderState((s) => ({ ...s, layout: value }))
      return
    }
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        elements: page.elements.map((el) =>
          el.id === elementId
            ? { ...el, variants: { ...el.variants, [group]: value } }
            : el
        ),
      }))
    )
    setHeaderActions((prev) =>
      prev.map((el) =>
        el.id === elementId
          ? { ...el, variants: { ...el.variants, [group]: value } }
          : el
      )
    )
  }, [])

  useEffect(() => {
    return monitorForElements({
      onDragStart: ({ source }) => {
        const data = source.data as DragSourceData
        setDragSession(data)
        if (data.type === 'panel') {
          setSelectedElementId(null)
          setRightPanel('preview')
        }
      },
      onDrop: ({ source, location }) => {
        setDragSession(null)
        const data = source.data as DragSourceData
        const innerTarget = location.current.dropTargets[0]
        if (!innerTarget) return

        const targetData = innerTarget.data as
          | { type: 'element'; elementId: string; pageId: string }
          | { type: 'page'; pageId: string }
          | { type: 'header-actions' }
          | { type: 'header-action'; elementId: string }

        const edge =
          targetData.type === 'element' || targetData.type === 'header-action'
            ? extractClosestEdge(innerTarget.data)
            : null
        const isHorizontal = edge === 'left' || edge === 'right'

        const withShrinked = (el: CanvasElement, shrinked: boolean): CanvasElement => ({
          ...el,
          properties: { ...el.properties, Shrinked: shrinked },
        })

        // --- Drop onto a specific header action (reorder / insert at position) ---
        if (targetData.type === 'header-action') {
          if (!HEADER_ACTION_ALLOWED.includes(data.componentId)) return
          const targetId = targetData.elementId
          const currentActions = headerActionsRef.current

          // Horizontal drop only valid when source is a Button (SocialFollow is full-width in header)
          const horizontalAllowed = isHorizontal && isHeaderShrinkable(data.componentId)
          const useHorizontal = horizontalAllowed

          if (data.type === 'panel') {
            if (currentActions.length >= HEADER_ACTIONS_MAX) return
            const comp = ComponentRegistry.get(data.componentId)
            if (!comp) return
            const newEl = createCanvasElement(
              comp,
              nextElementId(pagesRef.current, currentActions)
            )
            setHeaderActions((prev) => {
              const idx = prev.findIndex((a) => a.id === targetId)
              if (idx === -1) return [...prev, newEl]
              const next = [...prev]
              if (useHorizontal) {
                next[idx] = withShrinked(next[idx], true)
                const insertAt = edge === 'right' ? idx + 1 : idx
                next.splice(insertAt, 0, withShrinked(newEl, true))
              } else {
                const insertAt = edge === 'bottom' ? idx + 1 : idx
                next.splice(insertAt, 0, newEl)
              }
              return next
            })
            setSelectedElementId(newEl.id)
            setRightPanel('properties')
            return
          }

          if (data.type === 'canvas') {
            const sourceId = data.elementId
            if (sourceId === targetId) return
            const alreadyInSlot = currentActions.some((a) => a.id === sourceId)

            if (alreadyInSlot) {
              // Reorder within header (with optional pairing)
              setHeaderActions((prev) => {
                const srcIdx = prev.findIndex((a) => a.id === sourceId)
                if (srcIdx === -1) return prev
                const partnerIdx = headerPairPartnerIndex(prev, srcIdx)
                // Break existing pair when moving
                let arr = prev.map((el, i) => (i === partnerIdx ? withShrinked(el, false) : el))
                const sourceEl = arr[srcIdx]
                arr = arr.filter((_, i) => i !== srcIdx)
                const tgtIdx = arr.findIndex((a) => a.id === targetId)
                if (tgtIdx === -1) return prev
                if (useHorizontal) {
                  arr[tgtIdx] = withShrinked(arr[tgtIdx], true)
                  const insertAt = edge === 'right' ? tgtIdx + 1 : tgtIdx
                  arr.splice(insertAt, 0, withShrinked(sourceEl, true))
                } else {
                  const insertAt = edge === 'bottom' ? tgtIdx + 1 : tgtIdx
                  arr.splice(insertAt, 0, withShrinked(sourceEl, false))
                }
                return arr
              })
              return
            }

            // Moving from page into header at a specific position
            if (currentActions.length >= HEADER_ACTIONS_MAX) return
            let movingEl: CanvasElement | null = null
            for (const page of pagesRef.current) {
              const found = page.elements.find((el) => el.id === sourceId)
              if (found) { movingEl = found; break }
            }
            if (!movingEl) return
            setPages((prev) =>
              prev.map((page) => ({
                ...page,
                elements: page.elements.filter((el) => el.id !== sourceId),
              }))
            )
            setHeaderActions((prev) => {
              const idx = prev.findIndex((a) => a.id === targetId)
              if (idx === -1) return [...prev, withShrinked(movingEl!, false)]
              const next = [...prev]
              if (useHorizontal) {
                next[idx] = withShrinked(next[idx], true)
                const insertAt = edge === 'right' ? idx + 1 : idx
                next.splice(insertAt, 0, withShrinked(movingEl!, true))
              } else {
                const insertAt = edge === 'bottom' ? idx + 1 : idx
                next.splice(insertAt, 0, withShrinked(movingEl!, false))
              }
              return next
            })
            return
          }
          return
        }

        // --- Header actions slot handling (empty-slot / append) ---
        if (targetData.type === 'header-actions') {
          if (!HEADER_ACTION_ALLOWED.includes(data.componentId)) return
          if (data.type === 'panel') {
            if (headerActionsRef.current.length >= HEADER_ACTIONS_MAX) return
            const comp = ComponentRegistry.get(data.componentId)
            if (!comp) return
            const newEl = createCanvasElement(
              comp,
              nextElementId(pagesRef.current, headerActionsRef.current)
            )
            setHeaderActions((prev) => [...prev, newEl])
            setSelectedElementId(newEl.id)
            setRightPanel('properties')
            return
          }
          if (data.type === 'canvas') {
            const sourceId = data.elementId
            const alreadyInSlot = headerActionsRef.current.some((a) => a.id === sourceId)
            if (!alreadyInSlot && headerActionsRef.current.length >= HEADER_ACTIONS_MAX) return

            if (alreadyInSlot) {
              // Dropping on slot gap (not a specific item) → break any existing
              // pair and move to end of list as non-shrinked.
              setHeaderActions((prev) => {
                const srcIdx = prev.findIndex((a) => a.id === sourceId)
                if (srcIdx === -1) return prev
                const partnerIdx = headerPairPartnerIndex(prev, srcIdx)
                const sourceEl = prev[srcIdx]
                const arr = prev
                  .map((el, i) => (i === partnerIdx ? withShrinked(el, false) : el))
                  .filter((_, i) => i !== srcIdx)
                arr.push(withShrinked(sourceEl, false))
                return arr
              })
              return
            }

            // Pull from pages
            let movingEl: CanvasElement | null = null
            for (const page of pagesRef.current) {
              const found = page.elements.find((el) => el.id === sourceId)
              if (found) { movingEl = found; break }
            }
            if (!movingEl) return
            setPages((prev) =>
              prev.map((page) => ({
                ...page,
                elements: page.elements.filter((el) => el.id !== sourceId),
              }))
            )
            const el = withShrinked(movingEl, false)
            setHeaderActions((prev) => [...prev, el])
            return
          }
          return
        }

        // --- Moving OUT of header slot into page / element ---
        if (data.type === 'canvas' && headerActionsRef.current.some((a) => a.id === data.elementId)) {
          const sourceId = data.elementId
          const movingEl = headerActionsRef.current.find((a) => a.id === sourceId)
          if (!movingEl) return
          setHeaderActions((prev) => prev.filter((a) => a.id !== sourceId))
          const targetPageId = (targetData as { pageId?: string }).pageId
          if (!targetPageId) return
          const sourceEl = withShrinked(movingEl, isHorizontal)
          setPages((prev) =>
            prev.map((page) => {
              if (page.id !== targetPageId) return page
              if (targetData.type === 'page') {
                return { ...page, elements: [...page.elements, sourceEl] }
              }
              const idx = page.elements.findIndex((el) => el.id === (targetData as { elementId: string }).elementId)
              if (idx === -1) return { ...page, elements: [...page.elements, sourceEl] }
              const elements = [...page.elements]
              if (isHorizontal) {
                elements[idx] = withShrinked(elements[idx], true)
                const insertAt = edge === 'right' ? idx + 1 : idx
                elements.splice(insertAt, 0, sourceEl)
              } else {
                const insertAt = edge === 'bottom' ? idx + 1 : idx
                elements.splice(insertAt, 0, sourceEl)
              }
              return { ...page, elements }
            })
          )
          return
        }

        if (data.type === 'panel') {
          const comp = ComponentRegistry.get(data.componentId)
          if (!comp) return
          const newEl = createCanvasElement(comp, nextElementId(pagesRef.current, headerActionsRef.current))
          const targetPageId = (targetData as { pageId: string }).pageId

          setPages((prev) =>
            prev.map((page) => {
              if (page.id !== targetPageId) return page
              if (targetData.type === 'page') {
                return { ...page, elements: [...page.elements, newEl] }
              }
              const idx = page.elements.findIndex((el) => el.id === targetData.elementId)
              if (idx === -1) return { ...page, elements: [...page.elements, newEl] }
              const elements = [...page.elements]
              if (isHorizontal) {
                elements[idx] = withShrinked(elements[idx], true)
                const insertAt = edge === 'right' ? idx + 1 : idx
                elements.splice(insertAt, 0, withShrinked(newEl, true))
              } else {
                const insertAt = edge === 'bottom' ? idx + 1 : idx
                elements.splice(insertAt, 0, newEl)
              }
              return { ...page, elements }
            })
          )
          setSelectedElementId(newEl.id)
          setActivePageId(targetPageId)
          setRightPanel('properties')
          return
        }

        // canvas drag
        if (data.type !== 'canvas') return
        const sourceId = data.elementId
        const currentPages = pagesRef.current
        const sourcePage = currentPages.find((p) =>
          p.elements.some((el) => el.id === sourceId)
        )
        if (!sourcePage) return
        const movingEl = sourcePage.elements.find((el) => el.id === sourceId)
        if (!movingEl) return
        const targetPageId = targetData.pageId

        if (targetData.type === 'element' && targetData.elementId === sourceId) return

        const sourceEl = withShrinked(movingEl, isHorizontal)

        setPages((prev) => {
          let insertIdx: number | null = null
          const withoutSource = prev.map((page) => {
            if (page.id !== sourcePage.id) return page
            const srcIdx = page.elements.findIndex((el) => el.id === sourceId)
            const partnerIdx = pairPartnerIndex(page.elements, srcIdx)
            const elements = page.elements
              .map((el, i) => (i === partnerIdx ? withShrinked(el, false) : el))
              .filter((el) => el.id !== sourceId)
            return { ...page, elements }
          })
          const next = withoutSource.map((page) => {
            if (page.id !== targetPageId) return page
            if (targetData.type === 'page') {
              insertIdx = page.elements.length
              return { ...page, elements: [...page.elements, sourceEl] }
            }
            const idx = page.elements.findIndex((el) => el.id === targetData.elementId)
            if (idx === -1) {
              insertIdx = page.elements.length
              return { ...page, elements: [...page.elements, sourceEl] }
            }
            const elements = [...page.elements]
            if (isHorizontal) {
              elements[idx] = withShrinked(elements[idx], true)
              const insertAt = edge === 'right' ? idx + 1 : idx
              elements.splice(insertAt, 0, sourceEl)
              insertIdx = insertAt
            } else {
              const insertAt = edge === 'bottom' ? idx + 1 : idx
              elements.splice(insertAt, 0, sourceEl)
              insertIdx = insertAt
            }
            return { ...page, elements }
          })
          if (insertIdx === null) return prev
          if (next.length > 1 && next[0].elements.length === 0) {
            const filtered = next.slice(1)
            setActivePageId((cur) => (cur === next[0].id ? filtered[0].id : cur))
            return filtered
          }
          return next
        })
      },
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    return autoScrollForElements({ element: canvas })
  }, [])

  let selectedElement: CanvasElement | null = null
  let selectedComponent: RegisteredComponent | null = null
  if (selectedElementId === APP_HEADER_ID) {
    selectedComponent = ComponentRegistry.get('app-header') || null
    if (selectedComponent) {
      selectedElement = {
        id: APP_HEADER_ID,
        componentId: 'app-header',
        variants: { Layout: appHeaderState.layout },
        properties: {
          Icon: appHeaderState.icon,
          Title: appHeaderState.title ?? appTitle,
          Subtitle: appHeaderState.subtitle ?? appSubtitle,
          Skeleton: appHeaderState.skeleton,
        },
        states: {},
      }
    }
  }
  for (const page of pages) {
    if (selectedElement) break
    const found = page.elements.find((el) => el.id === selectedElementId)
    if (found) {
      selectedElement = found
      selectedComponent = ComponentRegistry.get(found.componentId) || null
      break
    }
  }
  if (!selectedElement) {
    const found = headerActions.find((el) => el.id === selectedElementId)
    if (found) {
      selectedElement = found
      selectedComponent = ComponentRegistry.get(found.componentId) || null
    }
  }

  // Profile system page header: a brand cover banner with the app-identity icon
  // card straddling its bottom edge and the account name beside it. This is the
  // ONLY profile-specific override — it slots into the same app-header-slot the
  // first page uses, so the page body (card + Heading/List/Button) is untouched.
  const profileHeaderEl = (
    <div className="live-preview__profile-header">
      <div className="live-preview__profile-header-cover" />
      <div className="live-preview__profile-header-identity">
        <span className="live-preview__profile-header-avatar">{PROFILE_INITIALS}</span>
        <h1 className="live-preview__profile-header-name">{PROFILE_USER.name}</h1>
      </div>
    </div>
  )

  const phoneScreenContent = (
    <CollectionsProvider>
    <CartProvider>
    <FavoritesProvider>
    <ProductDetailProvider onOpenChange={setIsPreviewDetailOpen}>
    <>
      <div className="live-preview__status-bar-bg app-scope" />
      <PhoneStatusBar className="live-preview__status-bar app-scope" style={{ color: 'var(--fg-primary, #000)' }} />
      {(isLoginPopoverOpen || isAvatarPopoverOpen) && (
        <div
          className="live-preview__popover-scrim"
          onClick={() => {
            setIsLoginPopoverOpen(false)
            setIsAvatarPopoverOpen(false)
          }}
        />
      )}
      <div ref={previewTopHeaderRef} className={`live-preview__top-header app-scope${isPreviewContentScrolled ? ' live-preview__top-header--scrolled' : ''}${desktopNavVariant === 'compact' ? ' live-preview__top-header--compact' : ''}${desktopNavVariant === 'contained' ? ' live-preview__top-header--contained' : ''}${topNavOverlay ? ' live-preview__top-header--transparent' : ''}${topNavOverlay && !topNavOverHero ? ' live-preview__top-header--over-content' : ''}${mobileTopHeaderHidden ? ' live-preview__top-header--hidden' : ''}`} style={topNavOverlay && topNavOverHero ? { color: topNavOverlayFg } : undefined} data-nav-align={desktopNavAlignment}>
        {(() => {
          // Profile system page: a back affordance + "Profile" title (mobile/tablet
          // only — desktop keeps its branded nav). Desktop exits via the nav links.
          if (isPreviewProfileOpen && previewDevice !== 'desktop') {
            return (
              <div className="live-preview__top-header-page">
                <button
                  type="button"
                  className="live-preview__top-header-back"
                  aria-label="Back"
                  onClick={() => setIsPreviewProfileOpen(false)}
                >
                  <AppIcon name="ChevronLeft" size={24} />
                </button>
                <span className="live-preview__top-header-page-name">Profile</span>
              </div>
            )
          }
          const isFirstPage = activePageId === pages[0]?.id
          // Always brand the top header on the landing, and on the first page when
          // the app header is closed — otherwise keep the scroll-driven behavior.
          const brandingAlways = showLandingNav || (isFirstPage && !appHeaderState.show)
          const compactPersistent = previewDevice === 'desktop' || brandingAlways
          const compactDomReady = !isMorePageOpen && (showCompactTitle || compactPersistent)
          if (compactDomReady) {
            return (
              <div className="live-preview__top-header-compact">
                {/* Nav logo is the app identity — always shown, independent of the hero's
                  imageStyle. Falls back to the icon glyph when the hero icon is removed. */ (
                  <div className={`live-preview__top-header-compact-icon${appIcon.variant === 'Image' && appIcon.imageUrl ? ' live-preview__top-header-compact-icon--image' : ''}`}>
                    {appIcon.variant === 'Image' && appIcon.imageUrl ? (
                      <img src={appIcon.imageUrl} alt="" />
                    ) : (
                      <AppIcon name={appIcon.icon} size={24} />
                    )}
                  </div>
                )}
                <span className="live-preview__top-header-compact-title">{appTitle}</span>
              </div>
            )
          }
          const activePage = pages.find((p) => p.id === activePageId)
          return isMorePageOpen ? (
            <div className="live-preview__top-header-compact">
              {/* Nav logo is the app identity — always shown, independent of the hero's
                  imageStyle. Falls back to the icon glyph when the hero icon is removed. */ (
                <div className={`live-preview__top-header-compact-icon${appIcon.variant === 'Image' && appIcon.imageUrl ? ' live-preview__top-header-compact-icon--image' : ''}`}>
                  {appIcon.variant === 'Image' && appIcon.imageUrl ? (
                    <img src={appIcon.imageUrl} alt="" />
                  ) : (
                    <AppIcon name={appIcon.icon} size={24} />
                  )}
                </div>
              )}
              <span className="live-preview__top-header-compact-title">{appTitle}</span>
            </div>
          ) : activePage ? (
            <div className="live-preview__top-header-page">
              <span className="live-preview__top-header-page-name">{activePage.name}</span>
            </div>
          ) : (
            <span className="live-preview__top-header-btn" aria-hidden="true" />
          )
        })()}
        {desktopNavEnabled && desktopNavVariant !== 'left' && (
          <nav className="live-preview__top-header-nav">
            {navPages.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`live-preview__top-header-nav-link${p.id === activePageId ? ' live-preview__top-header-nav-link--active' : ''}`}
                onClick={() => navigateToPage(p.id)}
              >
                {desktopNavDisplayStyle === 'iconText' && (
                  <AppIcon name={getPageIconName(p, 0)} size={18} />
                )}
                <span>{p.name}</span>
              </button>
            ))}
          </nav>
        )}
        <div className="live-preview__top-header-right">
          {pages.some((p) => p.elements.some((el) => el.componentId === 'product-list')) && (
            <LivePreviewCartButton onClick={() => setIsPreviewCartOpen(true)} />
          )}
          {isPreviewLoggedIn ? (
            <>
              {/* The profile page (mobile/tablet) drops the account avatar from the
                  top header — the back affordance handles the exit there. */}
              {!(isPreviewProfileOpen && previewDevice !== 'desktop') && (
                <button
                  type="button"
                  className="live-preview__top-header-avatar-btn"
                  aria-label="Account menu"
                  onClick={() => setIsAvatarPopoverOpen((v) => !v)}
                >
                  <span className="live-preview__top-header-avatar" aria-hidden="true">
                    {PROFILE_INITIALS}
                  </span>
                </button>
              )}
              {/* On desktop + left variant the account menu lives in the sidebar
                  footer instead — avoid a duplicate popover (and its outside-click
                  listener) here. */}
              {!(previewDevice === 'desktop' && desktopNavVariant === 'left') && (
                <LivePreviewAvatarPopover
                  open={isAvatarPopoverOpen}
                  onClose={() => setIsAvatarPopoverOpen(false)}
                  onLogout={handlePreviewLogout}
                  onProfile={() => setIsPreviewProfileOpen(true)}
                />
              )}
            </>
          ) : showLandingNav ? (
            previewDevice === 'desktop' ? (
              <div className="live-preview__top-header-auth">
                <AppButton variant="Outlined" size="Small" leftIcon="none" rightIcon="none" label="Login" onClick={() => { setLoginPopoverView('login'); setIsLoginPopoverOpen(true) }} />
                <AppButton variant="Default" size="Small" leftIcon="none" rightIcon="none" label="Sign up" onClick={() => { setLoginPopoverView('signup'); setIsLoginPopoverOpen(true) }} />
              </div>
            ) : (
              <button
                type="button"
                className="live-preview__top-header-menu-btn"
                aria-label={isMorePageOpen ? 'Close menu' : 'Menu'}
                aria-expanded={isMorePageOpen}
                onClick={() => setIsMorePageOpen((v) => !v)}
              >
                <AppIcon name={isMorePageOpen ? 'X' : 'Menu'} size={20} />
              </button>
            )
          ) : (
            <>
              <button
                type="button"
                className="live-preview__top-header-login-btn"
                aria-label="Login"
                onClick={() => setIsLoginPopoverOpen((v) => !v)}
              >
                <Icon name="circle-user-filled" category="users" size={20} />
              </button>
              <div className="live-preview__top-header-auth">
                <AppButton variant="Outlined" size="Small" leftIcon="none" rightIcon="none" label="Login" onClick={() => { setLoginPopoverView('login'); setIsLoginPopoverOpen(true) }} />
                <AppButton variant="Default" size="Small" leftIcon="none" rightIcon="none" label="Sign up" onClick={() => { setLoginPopoverView('signup'); setIsLoginPopoverOpen(true) }} />
              </div>
            </>
          )}
        </div>
      </div>
      {!isPreviewLoggedIn && (
        <LivePreviewLoginPopover
          variant={previewDevice === 'desktop' ? 'modal' : 'popover'}
          open={isLoginPopoverOpen}
          onClose={() => setIsLoginPopoverOpen(false)}
          onLoggedIn={handlePreviewLogin}
          initialView={loginPopoverView}
        />
      )}
      {desktopNavEnabled && desktopNavVariant === 'left' && previewDevice === 'desktop' && (
        <aside className="live-preview__side-nav app-scope">
          <div className="live-preview__side-nav-brand">
            {/* Nav logo is the app identity — always shown, independent of the hero's
                  imageStyle. Falls back to the icon glyph when the hero icon is removed. */ (
              <span className={`live-preview__side-nav-logo${appIcon.variant === 'Image' && appIcon.imageUrl ? ' live-preview__side-nav-logo--image' : ''}`}>
                {appIcon.variant === 'Image' && appIcon.imageUrl ? (
                  <img src={appIcon.imageUrl} alt="" />
                ) : (
                  <AppIcon name={appIcon.icon} size={24} />
                )}
              </span>
            )}
            <span className="live-preview__side-nav-title">{appTitle}</span>
          </div>
          <nav className="live-preview__side-nav-list">
            {navPages.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`live-preview__side-nav-link${p.id === activePageId ? ' live-preview__side-nav-link--active' : ''}`}
                onClick={() => navigateToPage(p.id)}
              >
                {desktopNavDisplayStyle === 'iconText' && (
                  <AppIcon name={getPageIconName(p, 0)} size={20} />
                )}
                <span className="live-preview__side-nav-label">{p.name}</span>
              </button>
            ))}
          </nav>
          <div className="live-preview__side-nav-footer">
            {isPreviewLoggedIn ? (
              <div className="live-preview__side-nav-account">
                <img
                  className="live-preview__side-nav-avatar"
                  src={previewUserAvatar}
                  alt=""
                  aria-hidden="true"
                />
                <div className="live-preview__side-nav-account-info">
                  <span className="live-preview__side-nav-account-name">Okan Düngel</span>
                  <span className="live-preview__side-nav-account-email">okan@jotform.com</span>
                </div>
                <button
                  type="button"
                  className="live-preview__side-nav-account-more"
                  aria-label="Account menu"
                  aria-expanded={isAvatarPopoverOpen}
                  onClick={() => setIsAvatarPopoverOpen((v) => !v)}
                >
                  <AppIcon name="Ellipsis" size={18} />
                </button>
                <LivePreviewAvatarPopover
                  open={isAvatarPopoverOpen}
                  onClose={() => setIsAvatarPopoverOpen(false)}
                  onLogout={handlePreviewLogout}
                  onProfile={() => setIsPreviewProfileOpen(true)}
                />
              </div>
            ) : (
              <>
                <AppButton
                  variant="Outlined"
                  size="Default"
                  leftIcon="none"
                  rightIcon="none"
                  label="Login"
                  fullWidth
                  onClick={() => { setLoginPopoverView('login'); setIsLoginPopoverOpen(true) }}
                />
                <AppButton
                  variant="Default"
                  size="Default"
                  leftIcon="none"
                  rightIcon="none"
                  label="Sign up"
                  fullWidth
                  onClick={() => { setLoginPopoverView('signup'); setIsLoginPopoverOpen(true) }}
                />
              </>
            )}
          </div>
        </aside>
      )}
      <div ref={setPreviewContentScalerEl} className={`live-preview__content-scaler app-scope${mobileTopHeaderHidden ? ' live-preview__content-scaler--no-top-nav' : ''}`}>
        <div className="live-preview__content app-scope">
          {isPreviewProfileOpen ? (
            <>
              <div className="live-preview__app-header-slot">
                {profileHeaderEl}
              </div>
              <div className="themes-view__canvas themes-view__canvas--first">
                <div className="themes-view__app">
                  <section className="themes-view__section">
                    <LivePreviewProfilePage
                      onLogout={handlePreviewLogout}
                      onClose={() => setIsPreviewProfileOpen(false)}
                      name={PROFILE_USER.name}
                      username={PROFILE_USER.username}
                      email={PROFILE_USER.email}
                    />
                  </section>
                </div>
              </div>
            </>
          ) : isMorePageOpen ? (
            <LivePreviewMorePagesView
              pages={navPages}
              onPageSelect={handleMorePageSelect}
              isLoggedIn={isPreviewLoggedIn}
              large={showLandingNav}
              onLoginClick={() => { setIsMorePageOpen(false); setPreviewAuthView('login') }}
              onSignUpClick={() => { setIsMorePageOpen(false); setPreviewAuthView('signup') }}
            />
          ) : (() => {
            const activePage = pages.find((p) => p.id === activePageId) || pages[0]
            const isFirstPage = activePage?.id === pages[0]?.id
            return activePage ? (
              <>
              {isFirstPage && appHeaderState.show && (
                <div className="live-preview__app-header-slot">
                <AppHeader
                  layout={appHeaderState.layout as 'Center' | 'Left' | 'Right'}
                  contentAlign={appHeaderState.contentAlign}
                  size={appHeaderState.size}
                  minHeight={typeof appHeaderState.minHeight === 'number' ? appHeaderState.minHeight : APP_HEADER_HEIGHT_DEFAULT}
                  icon={appHeaderState.icon}
                  imageStyle={appHeaderState.imageStyle}
                  imageUrl={appHeaderState.imageUrl}
                  textColor={resolveHeaderTextColor(appHeaderState)}
                  backgroundImageUrl={resolveHeaderImage(appHeaderState)}
                  backgroundColor={resolveHeaderBackground(appHeaderState)}
                  skeleton={appHeaderState.skeleton}
                  title={appHeaderState.title ?? appTitle}
                  subtitle={appHeaderState.subtitle ?? appSubtitle}
                  actions={appHeaderIsHero ? (
                    heroCtaActive ? <HeroCtaButton cta={heroCtaConfig} interactive onNavigate={navigateToPage} /> : null
                  ) : headerActions.map((el) => {
                    const comp = ComponentRegistry.get(el.componentId)
                    if (!comp) return null
                    const isShrinked = el.componentId === 'button' && el.properties['Shrinked'] === true
                    return (
                      <div
                        key={el.id}
                        className={`live-preview__header-action${isShrinked ? ' live-preview__header-action--shrinked' : ''}`}
                      >
                        {comp.render(el.variants, el.properties, el.states)}
                      </div>
                    )
                  })}
                />
                </div>
              )}
              <div className={`themes-view__canvas${isFirstPage && appHeaderState.show ? ' themes-view__canvas--first' : ''}`}>
                <div className="themes-view__app">
                  {activePage.elements.map((element) => {
                    const comp = ComponentRegistry.get(element.componentId)
                    if (!comp) return null
                    const previewProps = {
                      ...element.properties,
                      'Add New Card': false,
                    }
                    // Shrinked elements carry --shrinked; columns are resolved by
                    // the @container app-content rule (full-width on a narrow page,
                    // flowing two-up once it is wide enough). No device-specific
                    // stripping needed — the container query handles every shell.
                    const isShrinked = element.properties['Shrinked'] === true
                    const isFlow = isAutoFlowElement(element)
                    return (
                      <section key={element.id} className={`themes-view__section${isShrinked ? ' themes-view__section--shrinked' : ''}${isFlow ? ' themes-view__section--flow' : ''}`}>
                        {comp.render(element.variants, previewProps, element.states)}
                      </section>
                    )
                  })}
                </div>
              </div>
              {isFirstPage && !isPreviewCartOpen && !isPreviewCheckoutOpen && !isPreviewDetailOpen && (
                <div className="themes-view__attribution-footer">
                  <AttributionBar openAiSheetOnMount={openAttributionSheet} />
                </div>
              )}
              </>
            ) : null
          })()}
        </div>
      </div>
      {pages.length > 1 && bottomNavEnabled && !isPreviewCartOpen && !isPreviewCheckoutOpen && !isPreviewDetailOpen && !isPreviewProfileOpen && !showLandingNav && (
        <div className="live-preview__bottom-nav app-scope">
          <BottomNavigation
            items={bottomNavItems}
            activeIndex={bottomNavActiveIndex}
            showLabels={bottomNavDisplayStyle !== 'icon'}
            onItemClick={handleBottomNavClick}
          />
        </div>
      )}
      <img src={phoneHomeIndicator} alt="" className="live-preview__home-indicator" />
      <FormSheet />
      <LivePreviewCartPage
        open={isPreviewCartOpen}
        onClose={() => setIsPreviewCartOpen(false)}
        onContinue={() => setIsPreviewCheckoutOpen(true)}
        avatarUrl={previewUserAvatar}
      />
      <LivePreviewProductDetailPage />
      <LivePreviewCheckoutPage
        open={isPreviewCheckoutOpen}
        onClose={() => setIsPreviewCheckoutOpen(false)}
        avatarUrl={previewUserAvatar}
      />
      <LivePreviewLoginPopover
        variant={previewDevice === 'desktop' ? 'modal' : 'page'}
        open={previewAuthView !== null}
        initialView={previewAuthView ?? 'login'}
        onClose={() => { setPreviewAuthView(null); setIsMorePageOpen(false); pendingAuthRedirectRef.current = null }}
        onLoggedIn={handlePreviewLogin}
      />
      <LivePreviewOrderBar
        hidden={isPreviewCartOpen || isPreviewCheckoutOpen || isPreviewDetailOpen || isPreviewProfileOpen}
        hasBottomNav={pages.length > 1}
        onClick={() => setIsPreviewCheckoutOpen(true)}
      />
    </>
    </ProductDetailProvider>
    </FavoritesProvider>
    </CartProvider>
    </CollectionsProvider>
  )

  return (
    <>
    {previewMode && (
      <AppPreviewScreen
        device={previewDevice}
        onDeviceChange={setPreviewDevice}
        onBack={() => onPreviewClose?.()}
        appScreen={phoneScreenContent}
        role={viewingAsRole}
        onRoleChange={setViewingAsRole}
      />
    )}
    <div className="build-page">
      {/* Left Panel - App Elements */}
      {!chromeless && (
      <aside className={`build-page__left${leftPanelOpen ? '' : ' build-page__left--hidden'}`}>
        <div className="build-page__left-header">
          <h2>App Elements</h2>
          <button className="build-page__left-close" onClick={() => setLeftPanelOpen(false)}>
            <Icon name="xmark" size={24} />
          </button>
        </div>
        <TabMenu activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === 'widgets' && (
          <>
            <div className="build-page__ai-create" data-theme="dark">
              <AiCreateWidgetButton />
            </div>
            <div className="build-page__widget-search" data-theme="dark">
              <DSSearchInput
                size="sm"
                placeholder="Search widgets"
                value={widgetSearch}
                onChange={(e) => setWidgetSearch(e.target.value)}
                onClear={() => setWidgetSearch('')}
              />
            </div>
          </>
        )}
        <div className="build-page__elements">
          {activeTab === 'widgets' && widgetSearchTerm && activeGroups.length === 0 && (
            <div className="build-page__widget-search-empty">No widgets found</div>
          )}
          {activeGroups.map((group, groupIndex) => {
            const validItems = group.elementIds
              .map((id) => componentMap[id])
              .filter(Boolean)
            if (validItems.length === 0) return null

            return (
              <div key={group.label || groupIndex}>
                {group.label && (
                  <div className="build-page__separator">{group.label}</div>
                )}
                {validItems.map((comp, itemIndex) => {
                  const iconInfo = ELEMENT_ICON_MAP[comp.id]
                  return (
                    <div key={comp.id}>
                      <DraggablePanelItem comp={comp}>
                        <div
                          className="build-page__element-item"
                          onClick={() => handleAddElement(comp)}
                        >
                          <div className="build-page__element-icon">
                            {iconInfo ? (
                              <Icon name={iconInfo.icon} category={iconInfo.iconCategory} size={24} />
                            ) : (
                              <Icon name="grid-2-filled" category="layout" size={24} />
                            )}
                          </div>
                          <div className="build-page__element-content">
                            <span className="build-page__element-name">{comp.name}</span>
                          </div>
                        </div>
                      </DraggablePanelItem>
                      {itemIndex < validItems.length - 1 && (
                        <hr className="build-page__element-divider" />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </aside>
      )}

      {/* Canvas - App Preview (skipped in chromeless mode for capture flows) */}
      {!chromeless && (
      <div className={`build-page__canvas-wrapper${isDragging ? ' build-page__canvas--dragging' : ''}`}>
      <main ref={canvasRef} className="build-page__canvas" onClick={() => {
        // While the navigation preview fills the canvas, clicks belong to the
        // interactive preview — don't deselect or close the nav settings panel.
        if (rightPanel === 'navigation') return
        setSelectedElementId(null)
        setRightPanel('preview')
      }}>
          {/* Floating Buttons */}
          <div className="build-page__floating-buttons">
            <button className={`build-page__add-element-btn${leftPanelOpen || rightPanel === 'navigation' || (selectedElementId === APP_HEADER_ID && rightPanel === 'properties') ? ' build-page__add-element-btn--hidden' : ''}`} onClick={(e) => { e.stopPropagation(); if (isMobileView) { setMobileElementsSheet(true); } else { setLeftPanelOpen(true); } }}>
              <Icon name="plus" category="general" size={24} />
              <span className="build-page__add-element-btn-tooltip">Add Element</span>
            </button>
            <button ref={designBtnRef} className={`build-page__design-btn${rightPanel === 'designer' || rightPanel === 'navigation' || (selectedElementId === APP_HEADER_ID && rightPanel === 'properties') ? ' build-page__design-btn--hidden' : ''}${!designBtnOnHeader ? ' build-page__design-btn--brand' : ''}`} onClick={(e) => {
              e.stopPropagation()
              setSelectedElementId(null)
              setRightPanel('designer')
            }}>
              <Icon name="paint-roller-vertical-filled" category="editor" size={32} />
              <span className="build-page__design-btn-tooltip">App Designer</span>
            </button>
            <button
              className={`build-page__preview-btn${isLivePreviewVisible || rightPanel === 'designer' ? ' build-page__preview-btn--hidden' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setIsLivePreviewVisible(true)
              }}
            >
              <Icon name="mobile" category="technology" size={32} />
              <span className="build-page__preview-btn-tooltip">Live Preview</span>
            </button>
          </div>
          {rightPanel === 'navigation' ? (
          /* Navigation preview: the left builder area becomes a live preview of
             the app, mirroring the panel's Mobile/Desktop tab (via previewDevice).
             Reuses phoneScreenContent, which adapts to previewDevice. */
          <div className={`build-page__nav-preview build-page__nav-preview--${previewDevice === 'desktop' ? 'desktop' : 'mobile'}`}>
            {previewDevice === 'desktop' ? (
              <div className="build-page__nav-preview-frame app-preview-screen__desktop">{phoneScreenContent}</div>
            ) : (
              <div className="build-page__nav-preview-frame">
                <div className="live-preview__phone-screen">{phoneScreenContent}</div>
              </div>
            )}
          </div>
          ) : (
          <div className="app-scope">
            <div className="themes-view__device">
              <div ref={appHeaderRef}>
                {appHeaderState.show && <AppHeader
                  layout={appHeaderState.layout as 'Center' | 'Left' | 'Right'}
                  contentAlign={appHeaderState.contentAlign}
                  size={appHeaderState.size}
                  minHeight={typeof appHeaderState.minHeight === 'number' ? appHeaderState.minHeight : APP_HEADER_HEIGHT_DEFAULT}
                  icon={appHeaderState.icon}
                  imageStyle={appHeaderState.imageStyle}
                  imageUrl={appHeaderState.imageUrl}
                  textColor={resolveHeaderTextColor(appHeaderState)}
                  backgroundImageUrl={resolveHeaderImage(appHeaderState)}
                  backgroundColor={resolveHeaderBackground(appHeaderState)}
                  skeleton={appHeaderState.skeleton}
                  title={appHeaderState.title ?? appTitle}
                  subtitle={appHeaderState.subtitle ?? appSubtitle}
                  selected={selectedElementId === APP_HEADER_ID}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedElementId(APP_HEADER_ID)
                    setRightPanel('properties')
                  }}
                  actionsSlotRef={headerActionsSlotRef}
                  actions={
                    appHeaderIsHero ? (
                      heroCtaActive ? <HeroCtaButton cta={heroCtaConfig} interactive={false} /> : null
                    ) : (
                    <DropEdgeContext.Provider value={handleHeaderDropEdgeChange}>
                      {headerActions.map((element, idx) => {
                        const partnerIdx = headerPairPartnerIndex(headerActions, idx)
                        const partnerId = partnerIdx !== -1 ? headerActions[partnerIdx].id : null
                        const swapEdge: Edge | null = partnerIdx === -1
                          ? null
                          : partnerIdx < idx
                            ? 'right'
                            : 'left'
                        return (
                          <HeaderActionItem
                            key={element.id}
                            element={element}
                            isSelected={selectedElementId === element.id}
                            hideDuringDrag={element.id === draggedCanvasId}
                            isPaired={partnerIdx !== -1}
                            pairPartnerId={partnerId}
                            partnerSwapEdge={swapEdge}
                            onSelect={handleSelectElement}
                            onPropertyChange={handlePropertyChange}
                          />
                        )
                      })}
                      {showHeaderDropzone && (() => {
                        const draggedComp = dragSession ? ComponentRegistry.get(dragSession.componentId) : null
                        return (
                          <div
                            className={`build-page__header-slot-dropzone${
                              headerSlotDropState === 'accept' ? ' build-page__header-slot-dropzone--active' : ''
                            }`}
                          >
                            <Icon name="plus" category="general" size={20} />
                            <span>Drop {draggedComp?.name ?? 'element'} here</span>
                          </div>
                        )
                      })()}
                      <CanvasDropLine target={headerDropTarget} containerRef={headerActionsSlotRef} />
                    </DropEdgeContext.Provider>
                    )
                  }
                />}
                {!appHeaderState.show && (
                  <AddPageDivider
                    label="Add App Header"
                    onClick={() => setAppHeaderState((s) => ({ ...s, show: true }))}
                  />
                )}
              </div>

              {pages.map((page, pageIndex) => (
                <div key={page.id} className={`build-page__page-wrapper${pageIndex === 0 && appHeaderState.show ? ' build-page__page-wrapper--first' : ''}`}>
                  <CanvasPageLabel
                    page={page}
                    active={activePageId === page.id}
                    floating={pageIndex === 0 && appHeaderState.show}
                    overlayColor={pageIndex === 0 ? appHeaderState.textColor : undefined}
                    onRename={(name) => updatePage(page.id, { name })}
                    onOpenSettings={() => openPageSettings(page.id)}
                  />
                  <div
                    className={`themes-view__canvas ${pageIndex === 0 ? 'themes-view__canvas--first' : ''}${rightPanel === 'page' && pagePropertiesId === page.id ? ' themes-view__canvas--selected' : ''}`}
                    onClick={(e) => {
                      // Elements stop propagation on click, so any click that reaches
                      // the page background selects the page itself → page properties.
                      e.stopPropagation()
                      openPageSettings(page.id)
                    }}
                  >
                    {(() => {
                      const visibleCount = draggedCanvasId
                        ? page.elements.filter((el) => el.id !== draggedCanvasId).length
                        : page.elements.length
                      const virtuallyEmpty = visibleCount === 0
                      return (
                        <DroppablePage
                          pageId={page.id}
                          showEmptyState={virtuallyEmpty}
                          onEmptyStateClick={(e) => {
                            e.stopPropagation()
                            setActivePageId(page.id)
                            setForceTargetPageId(page.id)
                            setSelectedElementId(null)
                            if (isMobileView) {
                              if (rightPanel === 'designer') setRightPanel('preview')
                              setMobileElementsSheet(true)
                            } else {
                              setLeftPanelOpen(true)
                            }
                          }}
                        >
                          {page.elements.map((element, idx) => {
                            const partnerIdx = pairPartnerIndex(page.elements, idx)
                            const partnerId = partnerIdx !== -1 ? page.elements[partnerIdx].id : null
                            const swapEdge: Edge | null = partnerIdx === -1
                              ? null
                              : partnerIdx < idx
                                ? 'right'
                                : 'left'
                            return (
                              <SortableElement
                                key={element.id}
                                element={element}
                                pageId={page.id}
                                isSelected={selectedElementId === element.id}
                                hideDuringDrag={element.id === draggedCanvasId}
                                isPaired={partnerIdx !== -1}
                                pairPartnerId={partnerId}
                                partnerSwapEdge={swapEdge}
                                onSelect={handleSelectElement}
                                onPropertyChange={handlePropertyChange}
                              />
                            )
                          })}
                        </DroppablePage>
                      )
                    })()}
                  </div>

                  {(pageIndex > 0 || page.elements.length > 0 || isDragging) && (
                    <AddPageDivider onClick={() => handleAddPage(page.id)} />
                  )}
                </div>
              ))}
              <div className="build-page__attribution">
                <AttributionBar />
              </div>
            </div>
          </div>
          )}

      </main>

      {/* Page Navigation Bar — hidden while the navigation settings panel is open
          (it is edited from there); restored when the panel closes. */}
      {!isMobileView && pages.length > 1 && rightPanel !== 'navigation' && (
        <PageNavigationBar
          pages={pages}
          activePageId={activePageId}
          onPageSelect={(pageId) => {
            setActivePageId(pageId)
            requestAnimationFrame(() => {
              const scrollContainer = document.querySelector('.build-page__canvas')
              if (!scrollContainer) return
              // First page: scroll to the very top so the app header + label show.
              if (pageId === pages[0]?.id) {
                scrollContainer.scrollTo({ top: 0, behavior: 'smooth' })
                return
              }
              const el = document.querySelector(`[data-page-id="${pageId}"]`)
              if (!el) return
              // Top-align the page label (wrapper top) so it's always visible,
              // regardless of how long the page is — not centered in the viewport.
              const target = el.closest('.build-page__page-wrapper') ?? el
              const containerRect = scrollContainer.getBoundingClientRect()
              const targetRect = target.getBoundingClientRect()
              const TOP_OFFSET = 24
              const targetY = scrollContainer.scrollTop + targetRect.top - containerRect.top - TOP_OFFSET
              scrollContainer.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' })
            })
          }}
          onPageReorder={(reordered) => setPages(reordered as AppPage[])}
          onPageRename={(pageId, name) => setPages((prev) => prev.map((p) => p.id === pageId ? { ...p, name } : p))}
          onChangeIcon={(pageId, icon) => setPages((prev) => prev.map((p) => p.id === pageId ? { ...p, icon } : p))}
          onDeletePage={(pageId) => {
            setPages((prev) => {
              const filtered = prev.filter((p) => p.id !== pageId)
              if (filtered.length === 0) return prev
              return filtered
            })
            if (activePageId === pageId) {
              const idx = pages.findIndex((p) => p.id === pageId)
              const next = pages[idx - 1] || pages[idx + 1]
              if (next) setActivePageId(next.id)
            }
          }}
          onAddPage={() => handleAddPage(pages[pages.length - 1].id)}
          onOpenSettings={openNavSettings}
        />
      )}
      </div>
      )}

      {/* Right Panel - Designer/Properties or Live Preview */}
      <aside className={`build-page__right ${isLivePreviewVisible || rightPanel !== 'preview' ? '' : 'build-page__right--hidden'}`}>

        {/* Sliding content wrapper */}
        <div className={`build-page__right-slider${sliderMode === 'designer' ? ' build-page__right-slider--designer' : ''}${skipSliderTransition ? ' build-page__right-slider--no-transition' : ''}`}>

          {/* Slide 1: Live Preview / Properties */}
          <div className="build-page__right-slide">
            {/* Properties Panel */}
            {rightPanel === 'navigation' ? (
              <NavigationMenuPanel
                tab={navMenuTab}
                onTabChange={setNavMenuTab}
                pages={pages}
                enabled={bottomNavEnabled}
                displayStyle={bottomNavDisplayStyle}
                topNavEnabled={topNavEnabled}
                topNavTransparent={topNavTransparent}
                desktopVariant={desktopNavVariant}
                desktopEnabled={desktopNavEnabled}
                desktopDisplayStyle={desktopNavDisplayStyle}
                desktopAlignment={desktopNavAlignment}
                desktopSticky={desktopNavSticky}
                onChangeDesktopVariant={setDesktopNavVariant}
                onToggleEnabled={setBottomNavEnabled}
                onChangeDisplayStyle={setBottomNavDisplayStyle}
                onToggleTopNavEnabled={setTopNavEnabled}
                onToggleTopNavTransparent={setTopNavTransparent}
                onToggleDesktopEnabled={setDesktopNavEnabled}
                onChangeDesktopDisplayStyle={setDesktopNavDisplayStyle}
                onChangeDesktopAlignment={setDesktopNavAlignment}
                onToggleDesktopSticky={setDesktopNavSticky}
                onReorder={(reordered) => setPages(reordered as AppPage[])}
                onChangeIcon={(pageId, icon) => updatePage(pageId, { icon })}
                onRemoveFromNav={(pageId) => updatePage(pageId, { hidden: true })}
                onAddToNav={(pageId) => updatePage(pageId, { hidden: false })}
                onClose={() => setRightPanel('preview')}
              />
            ) : rightPanel === 'page' && pages.find((p) => p.id === pagePropertiesId) ? (
              (() => {
                const pp = pages.find((p) => p.id === pagePropertiesId)!
                return (
                  <PagePropertiesPanel
                    page={pp}
                    isFirstPage={pp.id === pages[0]?.id}
                    onRename={(name) => updatePage(pp.id, { name })}
                    onChangeIcon={(icon) => updatePage(pp.id, { icon })}
                    onToggleHidden={(hidden) => updatePage(pp.id, { hidden })}
                    onToggleRequireLogin={(requireLogin) => updatePage(pp.id, { requireLogin })}
                    onToggleShowIcon={(showIcon) => updatePage(pp.id, { showIcon })}
                    onToggleLanding={(landing) => updatePage(pp.id, { landing })}
                    onClose={() => { setRightPanel('preview'); setPagePropertiesId(null) }}
                  />
                )
              })()
            ) : rightPanel === 'properties' && selectedElement && selectedComponent ? (
              <div className="build-page__properties" data-theme="dark">
                <div className="property-panel__header">
                  {selectedComponent.id === 'product-list' && propertyTab === 'products' && editingProductIndex !== null ? (
                    <div className="property-panel__header-nav">
                      <button
                        className="property-panel__back"
                        onClick={() => (editingOptionIndex !== null ? setEditingOptionIndex(null) : setEditingProductIndex(null))}
                        aria-label="Back"
                      >
                        <AppIcon name="ArrowLeft" size={18} />
                      </button>
                      <span className="property-panel__title">
                        {editingOptionIndex !== null ? 'Product Option' : 'Product Settings'}
                      </span>
                    </div>
                  ) : selectedComponent.id === 'faq' && propertyTab === 'general' && editingFaqIndex !== null ? (
                    <div className="property-panel__header-nav">
                      <button
                        className="property-panel__back"
                        onClick={() => setEditingFaqIndex(null)}
                        aria-label="Back"
                      >
                        <AppIcon name="ArrowLeft" size={18} />
                      </button>
                      <span className="property-panel__title">FAQ Item</span>
                    </div>
                  ) : selectedComponent.id === 'testimonial' && propertyTab === 'general' && editingTestimonialIndex !== null ? (
                    <div className="property-panel__header-nav">
                      <button
                        className="property-panel__back"
                        onClick={() => setEditingTestimonialIndex(null)}
                        aria-label="Back"
                      >
                        <AppIcon name="ArrowLeft" size={18} />
                      </button>
                      <span className="property-panel__title">Testimonial</span>
                    </div>
                  ) : (
                    <span className="property-panel__title">{selectedComponent.name}</span>
                  )}
                  <div className="property-panel__header-actions">
                    {!(selectedComponent.id === 'product-list' && propertyTab === 'products' && editingProductIndex !== null) && !(selectedComponent.id === 'faq' && propertyTab === 'general' && editingFaqIndex !== null) && !(selectedComponent.id === 'testimonial' && propertyTab === 'general' && editingTestimonialIndex !== null) && selectedElement.id !== APP_HEADER_ID && (
                      <button
                        className="property-panel__close"
                        onClick={() => handleRemoveElement(selectedElement.id)}
                        aria-label="Delete element"
                        title="Delete element"
                      >
                        <Icon name="trash-filled" category="general" size={18} />
                      </button>
                    )}
                    <button
                      className="property-panel__close"
                      onClick={() => {
                        setRightPanel('preview')
                        setSelectedElementId(null)
                      }}
                      aria-label="Close"
                    >
                      <Icon name="xmark" size={20} />
                    </button>
                  </div>
                </div>

                {!(selectedComponent.id === 'product-list' && propertyTab === 'products' && editingProductIndex !== null) && !(selectedComponent.id === 'faq' && propertyTab === 'general' && editingFaqIndex !== null) && !(selectedComponent.id === 'testimonial' && propertyTab === 'general' && editingTestimonialIndex !== null) && (
                <div className="property-panel__tabs">
                  <DSTabs
                    accent="apps"
                    value={propertyTab}
                    onChange={setPropertyTab}
                    items={
                      selectedComponent.id === 'app-header'
                        ? [
                            { value: 'general', label: 'General' },
                            { value: 'style', label: 'Style' },
                          ]
                        : selectedComponent.id === 'card'
                          ? [
                              { value: 'general', label: 'General' },
                              { value: 'layout', label: 'Layout' },
                              { value: 'action', label: 'Action' },
                              { value: 'condition', label: 'Condition' },
                            ]
                          : selectedComponent.id === 'list'
                            ? [
                                { value: 'general', label: 'General' },
                                { value: 'layout', label: 'Layout' },
                                { value: 'action', label: 'Action' },
                                { value: 'condition', label: 'Condition' },
                              ]
                            : selectedComponent.id === 'button'
                              ? [
                                  { value: 'general', label: 'General' },
                                  { value: 'style', label: 'Style' },
                                  { value: 'action', label: 'Action' },
                                  { value: 'condition', label: 'Condition' },
                                ]
                              : selectedComponent.id === 'image'
                                ? [
                                    { value: 'general', label: 'General' },
                                    { value: 'action', label: 'Action' },
                                    { value: 'condition', label: 'Condition' },
                                  ]
                              : selectedComponent.id === 'product-list'
                                ? [
                                    { value: 'general', label: 'Appearance' },
                                    { value: 'products', label: 'Products' },
                                    { value: 'condition', label: 'Condition' },
                                  ]
                                : selectedComponent.id === 'faq'
                                ? [
                                    { value: 'general', label: 'General' },
                                    { value: 'style', label: 'Style' },
                                    { value: 'condition', label: 'Condition' },
                                  ]
                                : selectedComponent.id === 'testimonial'
                                ? [
                                    { value: 'general', label: 'General' },
                                    { value: 'style', label: 'Style' },
                                    { value: 'condition', label: 'Condition' },
                                  ]
                                : selectedComponent.id === 'banner'
                                ? [
                                    { value: 'general', label: 'Content' },
                                    { value: 'style', label: 'Style' },
                                    { value: 'condition', label: 'Condition' },
                                  ]
                                : selectedComponent.id === 'social-follow'
                                  ? [
                                      { value: 'general', label: 'General' },
                                      { value: 'style', label: 'Style' },
                                      { value: 'condition', label: 'Condition' },
                                    ]
                                  : [
                                      { value: 'general', label: 'General' },
                                      { value: 'condition', label: 'Condition' },
                                    ]
                    }
                  />
                </div>
                )}

                {(() => {
                  const isAppHeader = selectedComponent.id === 'app-header'

                  // AppHeader's General tab is bespoke (Show toggle + App Title + App Description).
                  if (isAppHeader && propertyTab === 'general') {
                    return (
                      <div className="property-panel__body">
                        <div className="property-panel__field property-panel__field--inline">
                          <DSFormField
                            title="Show App Header"
                            description="Display the header banner on the first page."
                            size="md"
                            showDescription
                            showHelpText={false}
                          >
                            <DSToggle
                              size="md"
                              checked={appHeaderState.show}
                              onChange={(e) => setAppHeaderState((s) => ({ ...s, show: e.target.checked }))}
                            />
                          </DSFormField>
                        </div>
                        <div className="property-panel__field">
                          <DSFormField title="Title" size="md" showDescription={false} showHelpText={false}>
                            <DSInput
                              value={appHeaderState.title ?? appTitle}
                              onChange={(e) => setAppHeaderState((s) => ({ ...s, title: e.target.value }))}
                            />
                          </DSFormField>
                        </div>
                        <div className="property-panel__field">
                          <DSFormField title="Description" size="md" showDescription={false} showHelpText={false}>
                            <DSTextArea
                              size="md"
                              maxLength={240}
                              showCount
                              showDrag={false}
                              placeholder="Add description"
                              value={appHeaderState.subtitle ?? appSubtitle}
                              onChange={(e) => setAppHeaderState((s) => ({ ...s, subtitle: e.target.value }))}
                            />
                          </DSFormField>
                        </div>
                      </div>
                    )
                  }

                  const isCard = selectedComponent.id === 'card'
                  const CARD_LAYOUT_VARIANTS = ['Layout', 'Image Style']
                  const CARD_LAYOUT_PROPS = ['Icon']
                  const CARD_ACTION_PROPS = ['Button Label']

                  const isButton = selectedComponent.id === 'button'
                  const isImage = selectedComponent.id === 'image'
                  const isList = selectedComponent.id === 'list'
                  const isImageGallery = selectedComponent.id === 'image-gallery'
                  const isProductList = selectedComponent.id === 'product-list'
                  const isFaq = selectedComponent.id === 'faq'
                  const isTestimonial = selectedComponent.id === 'testimonial'
                  const isBanner = selectedComponent.id === 'banner'
                  const isSocialFollow = selectedComponent.id === 'social-follow'
                  const socialPlatforms = [
                    { key: 'Facebook', icon: <Icon name="facebook-square-filled" category="brands" size={20} />, placeholder: 'Enter your Facebook username' },
                    { key: 'Youtube', icon: <Icon name="youtube-filled" category="brands" size={20} />, placeholder: 'Enter your YouTube channel URL' },
                    { key: 'Instagram', icon: <Icon name="instagram" category="brands" size={20} />, placeholder: 'Enter your Instagram username' },
                    { key: 'TikTok', icon: <Icon name="tiktok" category="brands" size={20} />, placeholder: 'Enter your TikTok username' },
                    { key: 'X (Twitter)', icon: <Icon name="twitter" category="brands" size={20} />, placeholder: 'Enter your X handle' },
                    { key: 'LinkedIn', icon: <Icon name="linkedin-square-filled" category="brands" size={20} />, placeholder: 'Enter your LinkedIn profile URL' },
                    { key: 'Pinterest', icon: <Icon name="pinterest-circle-filled" category="brands" size={20} />, placeholder: 'Enter your Pinterest username' },
                    { key: 'Tumblr', icon: <Icon name="tumblr-circle-filled" category="brands" size={20} />, placeholder: 'Enter your Tumblr blog name' },
                    { key: 'Vimeo', icon: <Icon name="vimeo-circle-filled" category="brands" size={20} />, placeholder: 'Enter your Vimeo username' },
                    { key: 'Flickr', icon: <Icon name="flickr-circle-filled" category="brands" size={20} />, placeholder: 'Enter your Flickr username' },
                  ]
                  const cardActionOptions = [
                    { value: 'Do Nothing', label: 'Do Nothing', icon: 'minus-sm', iconCategory: 'general' },
                    { value: 'Navigate to Page', label: 'Navigate to Page', icon: 'form-title-filled', iconCategory: 'general' },
                    { value: 'Open Form', label: 'Open Form', icon: 'form-filled', iconCategory: 'forms-files' },
                    { value: 'Open URL', label: 'Open URL', icon: 'link-horizontal', iconCategory: 'general' },
                    { value: 'Send Email', label: 'Send Email', icon: 'envelope-closed-filled', iconCategory: 'communication' },
                    { value: 'Make Call', label: 'Make Call', icon: 'phone-filled', iconCategory: 'communication' },
                  ]
                  const renderCardActionsDropdown = (id: string) => (
                    <div className="property-panel__field">
                      <DSFormField title="Card Actions" size="md" showDescription={false} showHelpText={false}>
                        <DSDropdownSingle
                          value={String(selectedElement.properties['Card Action'] ?? 'Do Nothing')}
                          onChange={(val) => handlePropertyChange(id, 'Card Action', val)}
                          options={cardActionOptions.map((o) => ({
                            value: o.value,
                            label: o.label,
                            leading: <Icon name={o.icon} category={o.iconCategory} size={20} />,
                          }))}
                        />
                      </DSFormField>
                    </div>
                  )

                  // Button & Image: just the Card Actions dropdown.
                  if ((isButton || isImage) && propertyTab === 'action') {
                    return (
                      <div className="property-panel__body">
                        {renderCardActionsDropdown(selectedElement.id)}
                      </div>
                    )
                  }

                  // Image Gallery General tab — bespoke 3x3 layout thumbnail grid.
                  if (isImageGallery && propertyTab === 'general') {
                    const currentLayout = String(selectedElement.variants['Layout'] ?? '2')
                    const GALLERY_LAYOUTS: { id: string; cols: number; rows: number; cells: { col: string; row: string }[] }[] = [
                      { id: '1', cols: 1, rows: 2, cells: [{ col: '1', row: '1' }, { col: '1', row: '2' }] },
                      { id: '2', cols: 2, rows: 2, cells: [{ col: '1', row: '1' }, { col: '2', row: '1' }, { col: '1', row: '2' }, { col: '2', row: '2' }] },
                      { id: '3', cols: 3, rows: 2, cells: [{ col: '1', row: '1' }, { col: '2', row: '1' }, { col: '3', row: '1' }, { col: '1', row: '2' }, { col: '2', row: '2' }, { col: '3', row: '2' }] },
                      { id: '4', cols: 2, rows: 2, cells: [{ col: '1', row: '1 / span 2' }, { col: '2', row: '1' }, { col: '2', row: '2' }] },
                      { id: '5', cols: 2, rows: 2, cells: [{ col: '1', row: '1' }, { col: '2', row: '1 / span 2' }, { col: '1', row: '2' }] },
                      { id: '6', cols: 2, rows: 2, cells: [{ col: '1 / span 2', row: '1' }, { col: '1', row: '2' }, { col: '2', row: '2' }] },
                      { id: '7', cols: 2, rows: 2, cells: [{ col: '1', row: '1' }, { col: '2', row: '1' }, { col: '1 / span 2', row: '2' }] },
                      { id: '8', cols: 4, rows: 4, cells: [{ col: '1 / span 2', row: '1' }, { col: '1 / span 2', row: '2 / span 3' }, { col: '3 / span 2', row: '1 / span 3' }, { col: '3 / span 2', row: '4' }] },
                      { id: '9', cols: 4, rows: 4, cells: [{ col: '1 / span 3', row: '1 / span 2' }, { col: '1', row: '3 / span 2' }, { col: '4', row: '1 / span 2' }, { col: '2 / span 3', row: '3 / span 2' }] },
                    ]
                    return (
                      <div className="property-panel__body">
                        <div className="property-panel__field">
                          <DSFormField title="Layout" size="md" showDescription={false} showHelpText={false}>
                            <div className="gallery-layout-grid">
                              {GALLERY_LAYOUTS.map((l) => {
                                const isActive = currentLayout === l.id
                                const maxDim = Math.max(l.cols, l.rows)
                                const cellSize = maxDim >= 4 ? 7 : maxDim === 3 ? 9 : 11
                                const gap = maxDim >= 4 ? 2 : 3
                                return (
                                  <button
                                    key={l.id}
                                    type="button"
                                    aria-pressed={isActive}
                                    className={`gallery-layout-grid__item${isActive ? ' gallery-layout-grid__item--active' : ''}`}
                                    onClick={() => handleVariantChange(selectedElement.id, 'Layout', l.id)}
                                  >
                                    <div
                                      className="gallery-layout-grid__preview"
                                      style={{
                                        gridTemplateColumns: `repeat(${l.cols}, ${cellSize}px)`,
                                        gridTemplateRows: `repeat(${l.rows}, ${cellSize}px)`,
                                        gap: `${gap}px`,
                                      }}
                                    >
                                      {l.cells.map((c, i) => (
                                        <span
                                          key={i}
                                          className="gallery-layout-grid__cell"
                                          style={{ gridColumn: c.col, gridRow: c.row }}
                                        />
                                      ))}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </DSFormField>
                        </div>
                        {(() => {
                          let galleryImages: string[] = []
                          try {
                            const raw = selectedElement.properties['Images']
                            if (typeof raw === 'string' && raw.trim().length > 0) {
                              const parsed = JSON.parse(raw)
                              if (Array.isArray(parsed)) galleryImages = parsed.filter((v) => typeof v === 'string')
                            }
                          } catch (_e) {
                            galleryImages = []
                          }
                          const writeImages = (next: string[]) => handlePropertyChange(selectedElement.id, 'Images', JSON.stringify(next))
                          const inputId = `gallery-input-${selectedElement.id}`
                          const handleFiles = (files: FileList | null) => {
                            if (!files || files.length === 0) return
                            compressImageFiles(files).then((urls) => writeImages([...galleryImages, ...urls]))
                          }
                          return (
                            <div className="property-panel__field">
                              <DSFormField title="Images" size="md" showDescription={false} showHelpText={false}>
                                <input
                                  id={inputId}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  hidden
                                  onChange={(e) => {
                                    handleFiles(e.target.files)
                                    e.target.value = ''
                                  }}
                                />
                                {galleryImages.length > 0 && (
                                  <div className="gallery-images">
                                    {galleryImages.map((url, i) => (
                                      <div className="gallery-images__item" key={i}>
                                        <img src={url} alt="" />
                                        <button
                                          type="button"
                                          className="gallery-images__remove"
                                          aria-label="Remove image"
                                          onClick={() => writeImages(galleryImages.filter((_, idx) => idx !== i))}
                                        >
                                          <Icon name="trash-filled" category="general" size={14} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <label htmlFor={inputId} className="gallery-images__choose">
                                  Choose Images
                                </label>
                              </DSFormField>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  }

                  // Banner Content tab — toggleable text slots + button action.
                  if (isBanner && propertyTab === 'general') {
                    const p = selectedElement.properties
                    const set = (name: string, value: string | boolean | number) => handlePropertyChange(selectedElement.id, name, value)
                    const bool = (name: string) => Boolean(p[name])
                    const str = (name: string) => String(p[name] ?? '')
                    const action = str('Button Action') || 'Do Nothing'
                    const bannerActionOptions = [
                      { value: 'Do Nothing', label: 'Do Nothing', icon: 'minus-sm', iconCategory: 'general' },
                      { value: 'Navigate to Page', label: 'Navigate to Page', icon: 'form-title-filled', iconCategory: 'general' },
                      { value: 'Open Form', label: 'Open Form', icon: 'form-filled', iconCategory: 'forms-files' },
                      { value: 'Open URL', label: 'Open URL', icon: 'link-horizontal', iconCategory: 'general' },
                      { value: 'Send Email', label: 'Send Email', icon: 'envelope-closed-filled', iconCategory: 'communication' },
                      { value: 'Make Call', label: 'Make Call', icon: 'phone-filled', iconCategory: 'communication' },
                    ]
                    return (
                      <div className="property-panel__body">
                        <div className="property-panel__field">
                          <DSFormField title="Title" size="md" showDescription={false} showHelpText={false}>
                            <DSInput value={str('Title')} placeholder="Title" onChange={(e) => set('Title', e.target.value)} />
                          </DSFormField>
                        </div>
                        <div className="property-panel__field">
                          <DSFormField title="Description" size="md" showDescription={false} showHelpText={false}>
                            <DSTextArea size="md" rows={3} value={str('Description')} placeholder="Description" onChange={(e) => set('Description', e.target.value)} />
                          </DSFormField>
                        </div>
                        <div className="property-panel__field property-panel__field--inline">
                          <DSFormField title="Show Button" size="md" showDescription={false} showHelpText={false}>
                            <DSToggle size="md" checked={bool('Show Button')} onChange={(e) => set('Show Button', e.target.checked)} />
                          </DSFormField>
                        </div>
                        {bool('Show Button') && (
                          <>
                            <div className="property-panel__field">
                              <DSFormField title="Button Label" size="md" showDescription={false} showHelpText={false}>
                                <DSInput value={str('Button Label')} placeholder="Button Label" onChange={(e) => set('Button Label', e.target.value)} />
                              </DSFormField>
                            </div>
                            <div className="property-panel__field">
                              <DSFormField title="Button Action" size="md" showDescription={false} showHelpText={false}>
                                <DSDropdownSingle
                                  value={action}
                                  onChange={(val) => set('Button Action', val)}
                                  options={bannerActionOptions.map((o) => ({
                                    value: o.value,
                                    label: o.label,
                                    leading: <Icon name={o.icon} category={o.iconCategory} size={20} />,
                                  }))}
                                />
                              </DSFormField>
                            </div>
                            {action === 'Navigate to Page' && (
                              <div className="property-panel__field">
                                <DSFormField title="Page" size="md" showDescription={false} showHelpText={false}>
                                  <DSDropdownSingle
                                    value={str('Action Page')}
                                    onChange={(val) => set('Action Page', val)}
                                    options={pages.map((pg) => ({ value: pg.id, label: pg.name }))}
                                  />
                                </DSFormField>
                              </div>
                            )}
                            {action === 'Open URL' && (
                              <div className="property-panel__field">
                                <DSFormField title="URL" size="md" showDescription={false} showHelpText={false}>
                                  <DSInput value={str('Action URL')} placeholder="https://example.com" onChange={(e) => set('Action URL', e.target.value)} />
                                </DSFormField>
                              </div>
                            )}
                            {action === 'Open Form' && (
                              <div className="property-panel__field">
                                <DSFormField title="Form" size="md" showDescription={false} showHelpText={false}>
                                  <DSInput value={str('Action Form')} placeholder="Form name or ID" onChange={(e) => set('Action Form', e.target.value)} />
                                </DSFormField>
                              </div>
                            )}
                            {action === 'Send Email' && (
                              <div className="property-panel__field">
                                <DSFormField title="Email" size="md" showDescription={false} showHelpText={false}>
                                  <DSInput value={str('Action Email')} placeholder="hello@example.com" onChange={(e) => set('Action Email', e.target.value)} />
                                </DSFormField>
                              </div>
                            )}
                            {action === 'Make Call' && (
                              <div className="property-panel__field">
                                <DSFormField title="Phone" size="md" showDescription={false} showHelpText={false}>
                                  <DSInput value={str('Action Phone')} placeholder="+1 555 000 0000" onChange={(e) => set('Action Phone', e.target.value)} />
                                </DSFormField>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  }

                  // Banner Style tab — alignment, background (color/gradient/image), text color, height.
                  if (isBanner && propertyTab === 'style') {
                    const p = selectedElement.properties
                    const set = (name: string, value: string | boolean | number) => handlePropertyChange(selectedElement.id, name, value)
                    const str = (name: string) => String(p[name] ?? '')
                    const bgSource = str('Background Source') || 'theme'
                    const bannerBgInputId = `banner-bg-${selectedElement.id}`
                    const alignment = String(selectedElement.variants['Alignment'] ?? 'Center')
                    return (
                      <div className="property-panel__body">
                        <div className="property-panel__field">
                          <DSFormField title="Alignment" size="md" showDescription={false} showHelpText={false}>
                            <Segmented
                              accent="apps"
                              variant="text"
                              value={alignment}
                              onChange={(val) => handleVariantChange(selectedElement.id, 'Alignment', val)}
                              items={[{ value: 'Left', label: 'Left' }, { value: 'Center', label: 'Center' }]}
                            />
                          </DSFormField>
                        </div>
                        <div className="property-panel__field">
                          <DSFormField title="Background" size="md" showDescription={false} showHelpText={false}>
                            <Segmented
                              accent="apps"
                              variant="text"
                              value={bgSource}
                              onChange={(val) => set('Background Source', val)}
                              items={[{ value: 'theme', label: 'Theme' }, { value: 'color', label: 'Color' }, { value: 'image', label: 'Image' }]}
                            />
                          </DSFormField>
                        </div>
                        {bgSource === 'color' && (
                          <div className="property-panel__field">
                            <DSFormField title="Background Color" size="md" showDescription={false} showHelpText={false}>
                              <HeaderBackgroundField
                                mode={(str('Background Mode') as 'solid' | 'gradient') || 'solid'}
                                color={str('Background Color')}
                                gradientStart={str('Gradient Start')}
                                gradientEnd={str('Gradient End')}
                                onModeChange={(m) => set('Background Mode', m)}
                                onColorChange={(c) => set('Background Color', c)}
                                onGradientChange={(s, e) => { set('Gradient Start', s); set('Gradient End', e) }}
                              />
                            </DSFormField>
                          </div>
                        )}
                        {bgSource === 'image' && (
                          <div className="property-panel__field">
                            <DSFormField title="Background Image" size="md" showDescription={false} showHelpText={false}>
                              <input
                                id={bannerBgInputId}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return
                                  compressImageFile(file).then((url) => {
                                    set('Background Image', url)
                                    set('Background Image Name', file.name)
                                  })
                                  e.target.value = ''
                                }}
                              />
                              {str('Background Image') ? (
                                <div className="image-preview">
                                  <div className="image-preview__thumb" style={{ backgroundImage: `url(${str('Background Image')})` }} />
                                  <span className="image-preview__name" title={str('Background Image Name')}>
                                    {str('Background Image Name') || 'image'}
                                  </span>
                                  <button
                                    type="button"
                                    className="image-preview__remove"
                                    aria-label="Remove image"
                                    onClick={() => { set('Background Image', ''); set('Background Image Name', '') }}
                                  >
                                    <Icon name="trash-filled" category="general" size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div className="upload-area">
                                  <DSButton
                                    variant="filled"
                                    colorScheme="secondary"
                                    shape="rectangle"
                                    size="md"
                                    leftIcon={<Icon name="image-plus-filled" category="media" size={16} />}
                                    onClick={() => document.getElementById(bannerBgInputId)?.click()}
                                  >
                                    Choose File
                                  </DSButton>
                                  <span className="upload-area__hint">OR DRAG AND DROP HERE</span>
                                </div>
                              )}
                            </DSFormField>
                          </div>
                        )}
                        <div className="property-panel__field">
                          <DSFormField title="Text Color" size="md" showDescription={false} showHelpText={false}>
                            <Segmented
                              accent="apps"
                              variant="text"
                              value={str('Text Color') || 'auto'}
                              onChange={(val) => set('Text Color', val)}
                              items={[{ value: 'auto', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
                            />
                          </DSFormField>
                        </div>
                        <div className="property-panel__field">
                          <DSFormField title="Height" size="md" showDescription={false} showHelpText={false}>
                            <DSSlider
                              size="md"
                              min={120}
                              max={720}
                              step={4}
                              value={Number(p['Height']) || 320}
                              onChange={(v) => set('Height', v)}
                              showValue
                              formatValue={(v) => `${v}px`}
                              aria-label="Banner height"
                            />
                          </DSFormField>
                        </div>
                      </div>
                    )
                  }

                  // Testimonial items tab — list view + drill-down edit form (image / title / description).
                  if (isTestimonial && propertyTab === 'general') {
                    const readItems = (): TestimonialItem[] => {
                      try {
                        const parsed = JSON.parse(String(selectedElement.properties['Items'] ?? '[]'))
                        return Array.isArray(parsed) ? parsed : []
                      } catch {
                        return []
                      }
                    }
                    const writeItems = (next: TestimonialItem[]) => handlePropertyChange(selectedElement.id, 'Items', JSON.stringify(ensureTestimonialIds(next)))
                    const list = readItems()

                    const idx = editingTestimonialIndex
                    const editing = idx !== null
                    const isNew = idx !== null && idx === list.length
                    const current: TestimonialItem =
                      idx !== null && idx < list.length
                        ? (list[idx] ?? { name: '', text: '' })
                        : { name: '', text: '', rating: 5 }
                    const updateItem = (updates: Partial<TestimonialItem>) => {
                      if (idx === null) return
                      const next = [...list]
                      if (isNew) next.push({ ...current, ...updates })
                      else next[idx] = { ...current, ...updates }
                      writeItems(next)
                    }
                    const updateField = <K extends keyof TestimonialItem>(field: K, value: TestimonialItem[K]) =>
                      updateItem({ [field]: value } as Partial<TestimonialItem>)
                    const editInputId = `testimonial-image-${selectedElement.id}`
                    const slidePos = editing ? 1 : 0

                    return (
                      <div className="property-panel__body product-panel-host">
                        <div className="product-panel-slider" data-slide={slidePos}>

                          {/* Slide 1 — Testimonials list */}
                          <div className="product-panel-slide product-list-panel">
                            <div className="product-list-rows faq-rows">
                              {list.map((t, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  className="testimonial-row"
                                  onClick={() => setEditingTestimonialIndex(i)}
                                >
                                  <span className="testimonial-row__handle">
                                    <Icon name="grid-dots-vertical" category="general" size={16} />
                                  </span>
                                  <div className="testimonial-row__card">
                                    <div className="testimonial-row__image">
                                      {t.avatar ? (
                                        <img src={t.avatar} alt="" />
                                      ) : (
                                        <Icon name="user-filled" category="users" size={18} />
                                      )}
                                    </div>
                                    <div className="testimonial-row__info">
                                      <div className="testimonial-row__name">{t.name || 'Untitled'}</div>
                                      <div className="testimonial-row__subtitle">{t.text ? t.text : 'No description yet'}</div>
                                    </div>
                                    <span className="testimonial-row__actions">
                                      <button
                                        type="button"
                                        className="testimonial-row__btn"
                                        aria-label="Delete testimonial"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          writeItems(list.filter((_, j) => j !== i))
                                        }}
                                      >
                                        <Icon name="trash-filled" category="general" size={16} />
                                      </button>
                                      <button
                                        type="button"
                                        className="testimonial-row__btn"
                                        aria-label="Edit testimonial"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setEditingTestimonialIndex(i)
                                        }}
                                      >
                                        <Icon name="pencil-filled" category="editor" size={16} />
                                      </button>
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                            <div className="product-list-panel__footer">
                              <DSButton
                                variant="filled"
                                colorScheme="primary"
                                leftIcon={<Icon name="plus" category="general" size={20} />}
                                onClick={() => setEditingTestimonialIndex(list.length)}
                                className="product-list-panel__add-btn"
                              >
                                Add Testimonial
                              </DSButton>
                            </div>
                          </div>

                          {/* Slide 2 — Testimonial settings */}
                          <div className="product-panel-slide">
                            {editing && (
                              <div className="product-settings">
                                <div className="product-settings__body">
                                  <div className="property-panel__field">
                                    <DSFormField title="Image" size="md" showDescription={false} showHelpText={false}>
                                      <input
                                        id={editInputId}
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={(e) => {
                                          const file = e.target.files?.[0]
                                          if (!file) return
                                          compressImageFile(file).then((url) => updateItem({ avatar: url, avatarName: file.name }))
                                          e.target.value = ''
                                        }}
                                      />
                                      {current.avatar ? (
                                        <div className="image-preview">
                                          <div
                                            className="image-preview__thumb"
                                            style={{ backgroundImage: `url(${current.avatar})` }}
                                          />
                                          <span className="image-preview__name" title={current.avatarName ?? ''}>
                                            {current.avatarName ?? 'image'}
                                          </span>
                                          <button
                                            type="button"
                                            className="image-preview__remove"
                                            aria-label="Remove image"
                                            onClick={() => updateItem({ avatar: undefined, avatarName: undefined })}
                                          >
                                            <Icon name="trash-filled" category="general" size={16} />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="upload-area">
                                          <DSButton
                                            variant="filled"
                                            colorScheme="secondary"
                                            shape="rectangle"
                                            size="md"
                                            leftIcon={<Icon name="image-plus-filled" category="media" size={16} />}
                                            onClick={() => document.getElementById(editInputId)?.click()}
                                          >
                                            Choose File
                                          </DSButton>
                                          <span className="upload-area__hint">OR DRAG AND DROP HERE</span>
                                        </div>
                                      )}
                                    </DSFormField>
                                  </div>
                                  <div className="property-panel__field">
                                    <DSFormField title="Title" required size="md" showDescription={false} showHelpText={false}>
                                      <DSInput
                                        value={current.name}
                                        placeholder="Name"
                                        onChange={(e) => updateField('name', e.target.value)}
                                      />
                                    </DSFormField>
                                  </div>
                                  <div className="property-panel__field">
                                    <DSFormField title="Role" size="md" showDescription={false} showHelpText={false}>
                                      <DSInput
                                        value={current.role ?? ''}
                                        placeholder="Role / company (e.g. Founder, Acme)"
                                        onChange={(e) => updateField('role', e.target.value)}
                                      />
                                    </DSFormField>
                                  </div>
                                  <div className="property-panel__field">
                                    <DSFormField title="Description" size="md" showDescription={false} showHelpText={false}>
                                      <DSTextArea
                                        size="md"
                                        rows={5}
                                        placeholder="What did they say?"
                                        value={current.text ?? ''}
                                        onChange={(e) => updateField('text', e.target.value)}
                                      />
                                    </DSFormField>
                                  </div>
                                  <div className="property-panel__field">
                                    <DSFormField title="Rating" description="Star rating from 0 to 5." size="md" showDescription showHelpText={false}>
                                      <DSNumberInput
                                        showUnit={false}
                                        min={0}
                                        max={5}
                                        value={typeof current.rating === 'number' ? current.rating : 5}
                                        onChange={(val) => updateField('rating', val ?? 0)}
                                      />
                                    </DSFormField>
                                  </div>
                                  <div className="property-panel__field property-panel__field--inline">
                                    <DSFormField
                                      title="Show in carousel"
                                      description="Display this testimonial in the carousel."
                                      size="md"
                                      showDescription
                                      showHelpText={false}
                                    >
                                      <DSToggle
                                        size="md"
                                        checked={current.visible !== false}
                                        onChange={(e) => updateField('visible', e.target.checked)}
                                      />
                                    </DSFormField>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // FAQ items tab — list view + drill-down edit form (Q & A).
                  if (isFaq && propertyTab === 'general') {
                    const readFaqs = (): FaqItem[] => {
                      try {
                        const parsed = JSON.parse(String(selectedElement.properties['Items'] ?? '[]'))
                        return Array.isArray(parsed) ? parsed : []
                      } catch {
                        return []
                      }
                    }
                    const writeFaqs = (next: FaqItem[]) => handlePropertyChange(selectedElement.id, 'Items', JSON.stringify(ensureFaqIds(next)))
                    const faqs = readFaqs()

                    const idx = editingFaqIndex
                    const editing = idx !== null
                    const isNew = idx !== null && idx === faqs.length
                    const current: FaqItem =
                      idx !== null && idx < faqs.length
                        ? (faqs[idx] ?? { question: '', answer: '' })
                        : { question: '', answer: '' }
                    const updateFaq = (updates: Partial<FaqItem>) => {
                      if (idx === null) return
                      const next = [...faqs]
                      if (isNew) next.push({ ...current, ...updates })
                      else next[idx] = { ...current, ...updates }
                      writeFaqs(next)
                    }
                    const updateField = <K extends keyof FaqItem>(field: K, value: FaqItem[K]) =>
                      updateFaq({ [field]: value } as Partial<FaqItem>)
                    const slidePos = editing ? 1 : 0

                    return (
                      <div className="property-panel__body product-panel-host">
                        <div className="product-panel-slider" data-slide={slidePos}>

                          {/* Slide 1 — FAQ list */}
                          <div className="product-panel-slide product-list-panel">
                            <div className="product-list-rows faq-rows">
                              {faqs.map((f, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  className="faq-row"
                                  onClick={() => setEditingFaqIndex(i)}
                                >
                                  <span className="faq-row__handle">
                                    <Icon name="grid-dots-vertical" category="general" size={16} />
                                  </span>
                                  <div className="faq-row__card">
                                    <div className="faq-row__info">
                                      <div className="faq-row__name">{f.question || 'Untitled question'}</div>
                                      <div className="faq-row__subtitle">{f.answer ? f.answer : 'No answer yet'}</div>
                                    </div>
                                    <span className="faq-row__actions">
                                      <button
                                        type="button"
                                        className="faq-row__btn"
                                        aria-label="Delete question"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          writeFaqs(faqs.filter((_, j) => j !== i))
                                        }}
                                      >
                                        <Icon name="trash-filled" category="general" size={16} />
                                      </button>
                                      <button
                                        type="button"
                                        className="faq-row__btn"
                                        aria-label="Edit question"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setEditingFaqIndex(i)
                                        }}
                                      >
                                        <Icon name="pencil-filled" category="editor" size={16} />
                                      </button>
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                            <div className="product-list-panel__footer">
                              <DSButton
                                variant="filled"
                                colorScheme="primary"
                                leftIcon={<Icon name="plus" category="general" size={20} />}
                                onClick={() => setEditingFaqIndex(faqs.length)}
                                className="product-list-panel__add-btn"
                              >
                                Add Question
                              </DSButton>
                            </div>
                          </div>

                          {/* Slide 2 — FAQ item settings */}
                          <div className="product-panel-slide">
                            {editing && (
                              <div className="product-settings">
                                <div className="product-settings__body">
                                  <div className="property-panel__field">
                                    <DSFormField title="Question" required size="md" showDescription={false} showHelpText={false}>
                                      <DSInput
                                        value={current.question}
                                        placeholder="Your question goes here?"
                                        onChange={(e) => updateField('question', e.target.value)}
                                      />
                                    </DSFormField>
                                  </div>
                                  <div className="property-panel__field">
                                    <DSFormField title="Answer" size="md" showDescription={false} showHelpText={false}>
                                      <DSTextArea
                                        size="md"
                                        rows={6}
                                        placeholder="Write the answer to this question"
                                        value={current.answer ?? ''}
                                        onChange={(e) => updateField('answer', e.target.value)}
                                      />
                                    </DSFormField>
                                  </div>
                                  <div className="property-panel__field property-panel__field--inline">
                                    <DSFormField
                                      title="Show in list"
                                      description="Display this question in the FAQ list."
                                      size="md"
                                      showDescription
                                      showHelpText={false}
                                    >
                                      <DSToggle
                                        size="md"
                                        checked={current.visible !== false}
                                        onChange={(e) => updateField('visible', e.target.checked)}
                                      />
                                    </DSFormField>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // Product List Products tab — list view + inline edit form.
                  if (isProductList && propertyTab === 'products') {
                    type Product = ProductItem
                    const readProducts = (): Product[] => {
                      try {
                        const parsed = JSON.parse(String(selectedElement.properties['Products'] ?? '[]'))
                        return Array.isArray(parsed) ? parsed : []
                      } catch {
                        return []
                      }
                    }
                    const writeProducts = (next: Product[]) => handlePropertyChange(selectedElement.id, 'Products', JSON.stringify(ensureProductIds(next)))
                    const products = readProducts()
                    const currency = String(selectedElement.properties['Currency'] ?? '$')

                    const idx = editingProductIndex
                    const editing = idx !== null
                    const isNew = idx !== null && idx === products.length
                    const current: Product =
                      idx !== null && idx < products.length
                        ? (products[idx] ?? { name: '', price: '0.00' })
                        : { name: '', price: '0.00' }
                    const updateProduct = (updates: Partial<Product>) => {
                      if (idx === null) return
                      const next = [...products]
                      if (isNew) next.push({ ...current, ...updates })
                      else next[idx] = { ...current, ...updates }
                      writeProducts(next)
                    }
                    const updateField = <K extends keyof Product>(field: K, value: Product[K]) =>
                      updateProduct({ [field]: value } as Partial<Product>)
                    const editInputId = `product-image-${selectedElement.id}`
                    const dimensions = current.optionDimensions ?? []
                    const updateDimensions = (dims: typeof dimensions) =>
                      updateProduct({ optionDimensions: dims, variants: generateVariants(dims) })
                    const handleOptionSubmit = (name: string, fieldType: 'text' | 'color', values: ProductOptionChoice[]) => {
                      if (editingOptionIndex !== null) {
                        const existing = dimensions[editingOptionIndex]
                        updateDimensions(dimensions.map((d, i) => (i === editingOptionIndex ? { ...existing, label: name, values, type: fieldType } : d)))
                      } else {
                        updateDimensions([...dimensions, { id: makeDimensionId(), label: name, values, type: fieldType }])
                      }
                    }
                    const removeOption = (i: number) => updateDimensions(dimensions.filter((_, j) => j !== i))
                    const modifiers = current.modifiers ?? []
                    const updateModifiers = (mods: typeof modifiers) => updateProduct({ modifiers: mods })
                    const handleModifierSubmit = (data: Omit<ProductModifier, 'id'>) => {
                      if (editingModifierIndex !== null) {
                        const existing = modifiers[editingModifierIndex]
                        updateModifiers(modifiers.map((m, i) => (i === editingModifierIndex ? { ...existing, ...data } : m)))
                      } else {
                        updateModifiers([...modifiers, { id: makeDimensionId(), ...data }])
                      }
                    }
                    const removeModifier = (i: number) => updateModifiers(modifiers.filter((_, j) => j !== i))
                    const subscription = current.subscription ?? null
                    const handleSubscriptionSubmit = (sub: ProductSubscription) => updateProduct({ subscription: sub })
                    const removeSubscription = () => updateProduct({ subscription: undefined })
                    const slidePos = editing ? 1 : 0
                    const filtered = productSearch.trim().length > 0
                      ? products.map((p, i) => ({ p, i })).filter(({ p }) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                      : products.map((p, i) => ({ p, i }))

                    return (
                      <div className="property-panel__body product-panel-host">
                        <div className="product-panel-slider" data-slide={slidePos}>

                          {/* Slide 1 — Products list */}
                          <div className="product-panel-slide product-list-panel">
                            <div ref={productSearchFieldRef} className="property-panel__field property-panel__field--no-divider">
                              <DSSearchInput
                                placeholder="Search products"
                                showFilter
                                onFilterClick={() => setFilterOpen((v) => !v)}
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                onClear={() => setProductSearch('')}
                              />
                            </div>
                            {filterOpen && (
                              <ProductFilterPopover
                                anchorRef={productSearchFieldRef}
                                inventory={inventoryFilter}
                                visibility={visibilityFilter}
                                onInventoryChange={setInventoryFilter}
                                onVisibilityChange={setVisibilityFilter}
                                onClose={() => setFilterOpen(false)}
                              />
                            )}
                            <div className="product-list-rows">
                              {filtered.map(({ p, i }) => (
                                <button
                                  key={i}
                                  type="button"
                                  className="product-list-row"
                                  onClick={() => { setEditingOptionIndex(null); setProductSettingsTab('basic'); setEditingProductIndex(i) }}
                                >
                                  <span className="product-list-row__handle">
                                    <Icon name="grid-dots-vertical" category="general" size={16} />
                                  </span>
                                  <div className="product-list-row__card">
                                    <div className="product-list-row__image">
                                      {p.image ? (
                                        <img src={p.image} alt="" />
                                      ) : (
                                        <Icon name="image-filled" category="media" size={20} />
                                      )}
                                    </div>
                                    <div className="product-list-row__info">
                                      <div className="product-list-row__name">{p.name || 'Untitled'}</div>
                                      <div className="product-list-row__subtitle">
                                        {p.price && Number(p.price) > 0 ? `${currency}${p.price}` : 'Free'}
                                        {p.optionDimensions && p.optionDimensions.length > 0
                                          ? ` - ${p.optionDimensions.map((d) => d.label || 'Option').join(', ')}`
                                          : ''}
                                      </div>
                                    </div>
                                    <span className="product-list-row__actions">
                                      <button
                                        type="button"
                                        className="product-list-row__btn"
                                        aria-label="Delete product"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          writeProducts(products.filter((_, j) => j !== i))
                                        }}
                                      >
                                        <Icon name="trash-filled" category="general" size={16} />
                                      </button>
                                      <button
                                        type="button"
                                        className="product-list-row__btn"
                                        aria-label="Edit product"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setEditingOptionIndex(null)
                                          setProductSettingsTab('basic')
                                          setEditingProductIndex(i)
                                        }}
                                      >
                                        <Icon name="pencil-filled" category="editor" size={16} />
                                      </button>
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                            <div className="product-list-panel__footer">
                              <DSButton
                                variant="filled"
                                colorScheme="primary"
                                leftIcon={<Icon name="plus" category="general" size={20} />}
                                onClick={() => { setEditingOptionIndex(null); setProductSettingsTab('basic'); setEditingProductIndex(products.length) }}
                                className="product-list-panel__add-btn"
                              >
                                Add Product
                              </DSButton>
                              <DSButton
                                variant="filled"
                                colorScheme="secondary"
                                leftIcon={<Icon name="arrow-down-to-bracket" category="arrows" size={20} />}
                                className="product-list-panel__import-btn"
                              >
                                Import Products
                              </DSButton>
                            </div>
                          </div>

                          {/* Slide 2 — Product Settings */}
                          <div className="product-panel-slide">
                            {editing && (
                              <div className="product-settings">
                                <div className="product-settings__tabs">
                                  <DSTabs
                                    accent="apps"
                                    value={productSettingsTab}
                                    onChange={setProductSettingsTab}
                                    items={[
                                      { value: 'basic', label: 'Basic' },
                                      { value: 'options', label: 'Options' },
                                      { value: 'stock', label: 'Stock' },
                                    ]}
                                  />
                                </div>
                                <div className="product-settings__body">
                                  {productSettingsTab === 'basic' && (
                                    <>
                                      <div className="property-panel__field">
                                        <DSFormField title="Name" required size="md" showDescription={false} showHelpText={false}>
                                          <DSInput
                                            value={current.name}
                                            placeholder="Product Name"
                                            onChange={(e) => updateField('name', e.target.value)}
                                          />
                                        </DSFormField>
                                      </div>
                                      <div className="property-panel__field">
                                        <DSFormField title="Description" size="md" showDescription={false} showHelpText={false}>
                                          <DSTextArea
                                            size="md"
                                            rows={4}
                                            placeholder="Please enter a short description"
                                            value={current.description ?? ''}
                                            onChange={(e) => updateField('description', e.target.value)}
                                          />
                                        </DSFormField>
                                      </div>
                                      <div className="property-panel__field">
                                        <DSFormField title="Price" size="md" showDescription={false} showHelpText={false}>
                                          <div className="product-edit__price">
                                            <DSInput
                                              className="product-edit__price-input"
                                              value={current.price}
                                              placeholder="0.00"
                                              onChange={(e) => updateField('price', e.target.value)}
                                            />
                                            <DSDropdownSingle
                                              className="product-edit__currency"
                                              showLeadingIcon={false}
                                              value={currency}
                                              onChange={(val) => handlePropertyChange(selectedElement.id, 'Currency', val)}
                                              options={[
                                                { value: '$', label: 'USD' },
                                                { value: '€', label: 'EUR' },
                                                { value: '£', label: 'GBP' },
                                                { value: '₺', label: 'TRY' },
                                                { value: '¥', label: 'JPY' },
                                              ]}
                                            />
                                          </div>
                                        </DSFormField>
                                      </div>
                                      <div className="property-panel__field">
                                        <DSFormField title="Image" size="md" showDescription={false} showHelpText={false}>
                                          <input
                                            id={editInputId}
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            onChange={(e) => {
                                              const file = e.target.files?.[0]
                                              if (!file) return
                                              compressImageFile(file).then((url) => updateField('image', url))
                                              e.target.value = ''
                                            }}
                                          />
                                          {current.image ? (
                                            <div className="product-edit__image">
                                              <img src={current.image} alt="" />
                                              <button
                                                type="button"
                                                className="product-edit__image-remove"
                                                onClick={() => updateField('image', undefined)}
                                              >
                                                <Icon name="trash-filled" category="general" size={14} />
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="upload-area">
                                              <DSButton
                                                variant="filled"
                                                colorScheme="secondary"
                                                shape="rectangle"
                                                size="md"
                                                leftIcon={<Icon name="image-plus-filled" category="media" size={16} />}
                                                onClick={() => document.getElementById(editInputId)?.click()}
                                              >
                                                Choose File
                                              </DSButton>
                                              <span className="upload-area__hint">OR DRAG AND DROP HERE</span>
                                            </div>
                                          )}
                                        </DSFormField>
                                      </div>
                                      <div className="property-panel__field property-panel__field--inline">
                                        <DSFormField
                                          title="Show in product list"
                                          description="Display this product in the product list."
                                          size="md"
                                          showDescription
                                          showHelpText={false}
                                        >
                                          <DSToggle
                                            size="md"
                                            checked={current.visible !== false}
                                            onChange={(e) => updateField('visible', e.target.checked)}
                                          />
                                        </DSFormField>
                                      </div>
                                    </>
                                  )}
                                  {productSettingsTab === 'options' && (
                                    <div className="product-options">
                                      <div className="product-options__section">
                                        <div className="product-options__choice">
                                          <div className="product-options__choice-text">
                                            <span className="product-options__choice-title">Product Options</span>
                                            <span className="product-options__choice-desc">
                                              Create variants like size and color.
                                            </span>
                                          </div>
                                          <DSButton
                                            variant="filled"
                                            colorScheme="primary"
                                            leftIcon={<Icon name="plus" category="general" size={20} />}
                                            onClick={() => { setEditingOptionIndex(null); setOptionModalOpen(true) }}
                                            className="product-options__add-btn"
                                          >
                                            Add
                                          </DSButton>
                                        </div>
                                      {dimensions.map((dim, i) => (
                                        <button
                                          key={dim.id}
                                          type="button"
                                          className="product-options__row"
                                          onClick={() => { setEditingOptionIndex(i); setOptionModalOpen(true) }}
                                        >
                                          <div className="product-options__row-text">
                                            <span className="product-options__row-label">{dim.label || 'Untitled option'}</span>
                                            <span className="product-options__row-meta">
                                              {dim.values.length} {dim.values.length === 1 ? 'value' : 'values'}
                                            </span>
                                          </div>
                                          <span className="product-options__row-actions">
                                            <button
                                              type="button"
                                              className="product-options__row-btn"
                                              aria-label="Remove option"
                                              onClick={(e) => { e.stopPropagation(); removeOption(i) }}
                                            >
                                              <Icon name="trash-filled" category="general" size={16} />
                                            </button>
                                            <button
                                              type="button"
                                              className="product-options__row-btn"
                                              aria-label="Edit option"
                                              onClick={(e) => { e.stopPropagation(); setEditingOptionIndex(i); setOptionModalOpen(true) }}
                                            >
                                              <Icon name="pencil-filled" category="editor" size={16} />
                                            </button>
                                          </span>
                                        </button>
                                      ))}
                                      </div>
                                      <div className="product-options__section">
                                        <div className="product-options__choice">
                                          <div className="product-options__choice-text">
                                            <span className="product-options__choice-title">Modifiers</span>
                                            <span className="product-options__choice-desc">
                                              Custom add-ons without price or stock.
                                            </span>
                                          </div>
                                          <DSButton
                                            variant="filled"
                                            colorScheme="primary"
                                            leftIcon={<Icon name="plus" category="general" size={20} />}
                                            className="product-options__add-btn"
                                            onClick={() => { setEditingModifierIndex(null); setModifierModalOpen(true) }}
                                          >
                                            Add
                                          </DSButton>
                                        </div>
                                        {modifiers.map((mod, i) => (
                                          <button
                                            key={mod.id}
                                            type="button"
                                            className="product-options__row"
                                            onClick={() => { setEditingModifierIndex(i); setModifierModalOpen(true) }}
                                          >
                                            <div className="product-options__row-text">
                                              <span className="product-options__row-label">{mod.name || 'Untitled modifier'}</span>
                                              <span className="product-options__row-meta">
                                                {mod.fieldType === 'color'
                                                  ? 'Color swatches'
                                                  : mod.fieldType === 'textbox'
                                                    ? 'Text box'
                                                    : 'Text choices'}
                                                {mod.required ? ' · Required' : ''}
                                              </span>
                                            </div>
                                            <span className="product-options__row-actions">
                                              <button
                                                type="button"
                                                className="product-options__row-btn"
                                                aria-label="Remove modifier"
                                                onClick={(e) => { e.stopPropagation(); removeModifier(i) }}
                                              >
                                                <Icon name="trash-filled" category="general" size={16} />
                                              </button>
                                              <button
                                                type="button"
                                                className="product-options__row-btn"
                                                aria-label="Edit modifier"
                                                onClick={(e) => { e.stopPropagation(); setEditingModifierIndex(i); setModifierModalOpen(true) }}
                                              >
                                                <Icon name="pencil-filled" category="editor" size={16} />
                                              </button>
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                      <div className="product-options__section">
                                        <div className="product-options__choice">
                                          <div className="product-options__choice-text">
                                            <span className="product-options__choice-title">Subscription</span>
                                            <span className="product-options__choice-desc">
                                              Charge customers on a recurring schedule.
                                            </span>
                                          </div>
                                          {!subscription && (
                                            <DSButton
                                              variant="filled"
                                              colorScheme="primary"
                                              leftIcon={<Icon name="plus" category="general" size={20} />}
                                              className="product-options__add-btn"
                                              onClick={() => setSubscriptionModalOpen(true)}
                                            >
                                              Add
                                            </DSButton>
                                          )}
                                        </div>
                                        {subscription && (
                                          <button
                                            type="button"
                                            className="product-options__row"
                                            onClick={() => setSubscriptionModalOpen(true)}
                                          >
                                            <div className="product-options__row-text">
                                              <span className="product-options__row-label">{subscription.name || 'Untitled subscription'}</span>
                                              <span className="product-options__row-meta">
                                                {`Every ${subscription.repeatEvery} ${subscription.repeatEvery === 1 ? subscription.repeatUnit : `${subscription.repeatUnit}s`}`}
                                                {' · '}
                                                {subscription.expiresAfterCycles === 0
                                                  ? 'Never expires'
                                                  : `${subscription.expiresAfterCycles} billing cycles`}
                                              </span>
                                            </div>
                                            <span className="product-options__row-actions">
                                              <button
                                                type="button"
                                                className="product-options__row-btn"
                                                aria-label="Remove subscription"
                                                onClick={(e) => { e.stopPropagation(); removeSubscription() }}
                                              >
                                                <Icon name="trash-filled" category="general" size={16} />
                                              </button>
                                              <button
                                                type="button"
                                                className="product-options__row-btn"
                                                aria-label="Edit subscription"
                                                onClick={(e) => { e.stopPropagation(); setSubscriptionModalOpen(true) }}
                                              >
                                                <Icon name="pencil-filled" category="editor" size={16} />
                                              </button>
                                            </span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {productSettingsTab === 'stock' && (
                                    <div className="product-stock-empty">
                                      <p className="product-stock-empty__text">Stock control arrives in the next update.</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                        <ProductOptionModal
                          open={optionModalOpen}
                          option={editingOptionIndex !== null ? dimensions[editingOptionIndex] : null}
                          currency={currency}
                          onClose={() => { setOptionModalOpen(false); setEditingOptionIndex(null) }}
                          onSubmit={handleOptionSubmit}
                        />
                        <ProductModifierModal
                          open={modifierModalOpen}
                          modifier={editingModifierIndex !== null ? modifiers[editingModifierIndex] : null}
                          onClose={() => { setModifierModalOpen(false); setEditingModifierIndex(null) }}
                          onSubmit={handleModifierSubmit}
                        />
                        <ProductSubscriptionModal
                          open={subscriptionModalOpen}
                          subscription={subscription}
                          price={current.price}
                          currency={currency}
                          onClose={() => setSubscriptionModalOpen(false)}
                          onSubmit={handleSubscriptionSubmit}
                        />
                      </div>
                    )
                  }

                  // Image General tab — bespoke upload area + alignment/size when image is set.
                  if (isImage && propertyTab === 'general') {
                    const imageUrl = String(selectedElement.properties['Image URL'] ?? '')
                    const imageName = String(selectedElement.properties['Image Name'] ?? '')
                    const hasImage = imageUrl.length > 0
                    const inputId = `image-input-${selectedElement.id}`

                    const setImage = (url: string, name: string) => {
                      handlePropertyChange(selectedElement.id, 'Image URL', url)
                      handlePropertyChange(selectedElement.id, 'Image Name', name)
                      handleVariantChange(selectedElement.id, 'Has Image', url ? 'Yes' : 'No')
                      if (url) {
                        handlePropertyChange(selectedElement.id, 'Width', '')
                        handlePropertyChange(selectedElement.id, 'Height', 450)
                      }
                    }

                    return (
                      <div className="property-panel__body">
                        <div className="property-panel__field">
                          <DSFormField title="Image" size="md" showDescription={false} showHelpText={false}>
                            <input
                              id={inputId}
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                compressImageFile(file).then((url) => setImage(url, file.name))
                                e.target.value = ''
                              }}
                            />
                            {hasImage ? (
                              <div className="image-preview">
                                <div
                                  className="image-preview__thumb"
                                  style={{ backgroundImage: `url(${imageUrl})` }}
                                />
                                <span className="image-preview__name" title={imageName}>
                                  {imageName || 'image'}
                                </span>
                                <button
                                  type="button"
                                  className="image-preview__remove"
                                  aria-label="Remove image"
                                  onClick={() => setImage('', '')}
                                >
                                  <Icon name="trash-filled" category="general" size={16} />
                                </button>
                              </div>
                            ) : (
                              <div className="upload-area">
                                <DSButton
                                  variant="filled"
                                  colorScheme="secondary"
                                  shape="rectangle"
                                  size="md"
                                  leftIcon={<Icon name="image-plus-filled" category="media" size={16} />}
                                  onClick={() => document.getElementById(inputId)?.click()}
                                >
                                  Choose File
                                </DSButton>
                                <span className="upload-area__hint">OR DRAG AND DROP HERE</span>
                              </div>
                            )}
                          </DSFormField>
                        </div>
                        {hasImage && (
                          <>
                            <div className="property-panel__field">
                              <DSFormField title="Size" size="md" showDescription={false} showHelpText={false}>
                                <div className="image-size">
                                  <div className="image-size__input">
                                    <DSNumberInput
                                      unit="PX"
                                      showUnit
                                      min={1}
                                      max={9999}
                                      placeholder={canvasElementWidth ? String(canvasElementWidth) : 'Auto'}
                                      value={Number(selectedElement.properties['Width']) > 0 ? Number(selectedElement.properties['Width']) : undefined}
                                      onChange={(val) => handlePropertyChange(selectedElement.id, 'Width', val ?? '')}
                                      description="Width"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    className="image-size__lock"
                                    aria-label="Lock aspect ratio"
                                    aria-pressed={Boolean(selectedElement.properties['Aspect Locked'])}
                                    onClick={() => handlePropertyChange(selectedElement.id, 'Aspect Locked', !selectedElement.properties['Aspect Locked'])}
                                  >
                                    <Icon name="lock-filled" category="security" size={16} />
                                  </button>
                                  <div className="image-size__input">
                                    <DSNumberInput
                                      unit="PX"
                                      showUnit
                                      min={1}
                                      max={9999}
                                      value={Number(selectedElement.properties['Height']) > 0 ? Number(selectedElement.properties['Height']) : undefined}
                                      onChange={(val) => handlePropertyChange(selectedElement.id, 'Height', val ?? '')}
                                      description="Height"
                                    />
                                  </div>
                                </div>
                              </DSFormField>
                            </div>
                            <div className="property-panel__field">
                              <DSFormField
                                title="Image Alignment"
                                description="Select how the image is aligned horizontally."
                                size="md"
                                showDescription
                                showHelpText={false}
                              >
                                <Segmented
                                  accent="apps"
                                  variant="text"
                                  value={String(selectedElement.variants['Alignment'] ?? 'Center')}
                                  onChange={(val) => handleVariantChange(selectedElement.id, 'Alignment', val)}
                                  items={[
                                    { value: 'Left', label: 'Left' },
                                    { value: 'Center', label: 'Center' },
                                    { value: 'Right', label: 'Right' },
                                  ]}
                                />
                              </DSFormField>
                            </div>
                            <div className="property-panel__field">
                              <DSFormField
                                title="Alternative Text"
                                description="Shown if the image fails to load."
                                size="md"
                                showDescription
                                showHelpText={false}
                              >
                                <DSInput
                                  placeholder="Description of the image"
                                  value={String(selectedElement.properties['Alt Text'] ?? '')}
                                  onChange={(e) => handlePropertyChange(selectedElement.id, 'Alt Text', e.target.value)}
                                />
                              </DSFormField>
                            </div>
                            <div className="property-panel__field property-panel__field--inline">
                              <DSFormField
                                title="Shrink"
                                description="Make element smaller."
                                size="md"
                                showDescription
                                showHelpText={false}
                              >
                                <DSToggle
                                  size="md"
                                  checked={Boolean(selectedElement.properties['Shrinked'])}
                                  onChange={(e) => handlePropertyChange(selectedElement.id, 'Shrinked', e.target.checked)}
                                />
                              </DSFormField>
                            </div>
                            <div className="property-panel__field">
                              <DSFormField
                                title="Duplicate Element"
                                description="Clone selected elements with all saved properties."
                                size="md"
                                showDescription
                                showHelpText={false}
                              >
                                <DSButton
                                  variant="filled"
                                  colorScheme="secondary"
                                  shape="rectangle"
                                  size="md"
                                  leftIcon={<Icon name="copy-filled" category="general" size={16} />}
                                >
                                  Duplicate
                                </DSButton>
                              </DSFormField>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  }

                  // List General tab — bespoke per Figma (Show Header, Data Source, Field mapping, Filter/Sorting, Items to show).
                  if (isList && propertyTab === 'general') {
                    return (
                      <div className="property-panel__body">
                        <div className="property-panel__field">
                          <DSFormField
                            title="Data Source"
                            description={
                              <>
                                This list shows data from App Tables{' '}
                                <DSLink
                                  href="#"
                                  size="sm"
                                  rightIcon={<Icon name="arrow-up-right-from-square" category="arrows" size={14} />}
                                >
                                  Open
                                </DSLink>
                              </>
                            }
                            size="md"
                            showDescription
                            showHelpText={false}
                          >
                            <div className="list-general__data-source">
                              {(() => {
                                const dataSource = String(selectedElement.properties['Data Source'] ?? 'New Table')
                                const checkIcon = <Icon name="check" category="general" size={20} />
                                return (
                                  <DSDropdownSingle
                                    value={dataSource}
                                    onChange={(val) => handlePropertyChange(selectedElement.id, 'Data Source', val)}
                                    options={[
                                      {
                                        value: 'New Table',
                                        label: 'New Table',
                                        leading: <Icon name="table" category="general" size={20} />,
                                        trailing: dataSource === 'New Table' ? checkIcon : undefined,
                                      },
                                      {
                                        value: 'Our Team',
                                        label: 'Our Team',
                                        leading: <Icon name="table" category="general" size={20} />,
                                        trailing: dataSource === 'Our Team' ? checkIcon : undefined,
                                      },
                                      {
                                        value: 'New app table',
                                        label: 'New app table',
                                        leading: <Icon name="plus-circle" category="general" size={20} />,
                                        divider: true,
                                      },
                                    ]}
                                  />
                                )
                              })()}
                              <DSButton
                                variant="filled"
                                colorScheme="secondary"
                                shape="rectangle"
                                size="md"
                                leftIcon={<Icon name="pencil-to-square" category="general" size={16} />}
                                onClick={() => setEditItemsOpen(true)}
                              >
                                Edit Table
                              </DSButton>
                            </div>
                          </DSFormField>
                        </div>
                        {(() => {
                          const fieldOptions = [
                            { value: 'Title', label: 'Title', icon: 'type-square-filled', iconCategory: 'editor' },
                            { value: 'Description', label: 'Description', icon: 'type-square-filled', iconCategory: 'editor' },
                            { value: 'Image', label: 'Image', icon: 'paperclip-diagonal', iconCategory: 'forms-files' },
                          ]
                          const labelFor = (val: string) => fieldOptions.find((o) => o.value === val) ?? fieldOptions[0]

                          const readTokens = (propKey: string, defaultLabel: string): FieldToken[] => {
                            const raw = selectedElement.properties[propKey]
                            if (typeof raw === 'string' && raw.startsWith('[')) {
                              try { return JSON.parse(raw) as FieldToken[] } catch { /* fall through */ }
                            }
                            const opt = labelFor(defaultLabel)
                            return [{ type: 'field', value: opt.value, label: opt.label, icon: opt.icon, iconCategory: opt.iconCategory }]
                          }

                          const writeTokens = (propKey: string, tokens: FieldToken[]) => {
                            handlePropertyChange(selectedElement.id, propKey, JSON.stringify(tokens))
                          }

                          const renderComposerRow = (title: string, propKey: string, defaultLabel: string) => {
                            const tokens = readTokens(propKey, defaultLabel)
                            return (
                              <div className="property-panel__field" key={propKey}>
                                <DSFormField title={title} size="md" showDescription={false} showHelpText={false}>
                                  <DSFieldComposer
                                    value={tokens}
                                    onChange={(t) => writeTokens(propKey, t)}
                                    options={fieldOptions}
                                    onCreate={() => {}}
                                    placeholder="Type or insert a field…"
                                  />
                                </DSFormField>
                              </div>
                            )
                          }

                          const renderMapperRow = (title: string, propKey: string, defaultVal: string) => {
                            const selected = String(selectedElement.properties[propKey] ?? defaultVal)
                            const opt = labelFor(selected)
                            return (
                              <div className="property-panel__field" key={propKey}>
                                <DSFormField title={title} size="md" showDescription={false} showHelpText={false}>
                                  <DSFieldMapper
                                    field={{ label: opt.label, icon: opt.icon, iconCategory: opt.iconCategory }}
                                    options={fieldOptions}
                                    value={selected}
                                    onChange={(val) => handlePropertyChange(selectedElement.id, propKey, val)}
                                    onCreate={() => {}}
                                    onAdd={() => {}}
                                  />
                                </DSFormField>
                              </div>
                            )
                          }

                          return (
                            <>
                              {renderComposerRow('Title', 'Field Title', 'Title')}
                              {renderComposerRow('Description', 'Field Description', 'Description')}
                              {renderMapperRow('Image', 'Field Image', 'Image')}
                            </>
                          )
                        })()}
                        <div className="property-panel__field property-panel__field--inline">
                          <DSFormField title="Filter" size="md" showDescription={false} showHelpText={false}>
                            <DSToggle
                              size="md"
                              checked={Boolean(selectedElement.properties['Filter'])}
                              onChange={(e) => handlePropertyChange(selectedElement.id, 'Filter', e.target.checked)}
                            />
                          </DSFormField>
                        </div>
                        <div className="property-panel__field property-panel__field--inline">
                          <DSFormField title="Sorting" size="md" showDescription={false} showHelpText={false}>
                            <DSToggle
                              size="md"
                              checked={Boolean(selectedElement.properties['Sorting'])}
                              onChange={(e) => handlePropertyChange(selectedElement.id, 'Sorting', e.target.checked)}
                            />
                          </DSFormField>
                        </div>
                        <div className="property-panel__field">
                          <DSFormField
                            title="Items to show"
                            description="How many list items to show at first"
                            size="md"
                            showDescription
                            showHelpText={false}
                          >
                            <DSNumberInput
                              showUnit={false}
                              min={1}
                              max={999}
                              value={Number(selectedElement.properties['Items to show']) || 10}
                              onChange={(val) => handlePropertyChange(selectedElement.id, 'Items to show', val ?? 10)}
                            />
                          </DSFormField>
                        </div>
                        <div className="property-panel__field property-panel__field--inline">
                          <DSFormField
                            title="Show Header"
                            description="Display a header above the list items."
                            size="md"
                            showDescription
                            showHelpText={false}
                          >
                            <DSToggle
                              size="md"
                              checked={Boolean(selectedElement.properties['Show Header'])}
                              onChange={(e) => handlePropertyChange(selectedElement.id, 'Show Header', e.target.checked)}
                            />
                          </DSFormField>
                        </div>
                      </div>
                    )
                  }

                  // List: Card Actions dropdown + Layout-aware Action variant with nested controls.
                  if (isList && propertyTab === 'action') {
                    const cardActionType = String(selectedElement.properties['Card Action'] ?? 'Do Nothing')
                    const layout = String(selectedElement.variants['Layout'] ?? 'Basic')
                    const variantKey = layout === 'Card' ? 'Card Action' : 'Action'
                    const variantConfig = selectedComponent.variants[variantKey]
                    const actionValue = String(selectedElement.variants[variantKey] ?? 'None')
                    return (
                      <div className="property-panel__body">
                        {renderCardActionsDropdown(selectedElement.id)}
                        {cardActionType !== 'Do Nothing' && (
                          <div className="property-panel__field">
                            <DSFormField title="Action" size="md" showDescription={false} showHelpText={false}>
                              <Segmented
                                accent="apps"
                                variant="text"
                                value={actionValue}
                                onChange={(val) => handleVariantChange(selectedElement.id, variantKey, val)}
                                items={variantConfig.options.map((opt) => ({ value: opt, label: opt }))}
                              />
                            </DSFormField>
                            {actionValue === 'Button' && (
                              <DSFormField title="Button Label" size="md" showDescription={false} showHelpText={false}>
                                <DSInput
                                  value={String(selectedElement.properties['Button Label'] ?? '')}
                                  onChange={(e) => handlePropertyChange(selectedElement.id, 'Button Label', e.target.value)}
                                />
                              </DSFormField>
                            )}
                            {actionValue === 'Icon' && (
                              <DSFormField title="Icon" size="md" showDescription={false} showHelpText={false}>
                                <IconPropertyField
                                  value={String(selectedElement.properties['Action Icon'] ?? 'ChevronRight')}
                                  onChange={(val) => handlePropertyChange(selectedElement.id, 'Action Icon', val)}
                                />
                              </DSFormField>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  }

                  // Card's Action tab — bespoke: Card Actions dropdown + nested Action variant with Button Label/Icon Filled inside.
                  if (isCard && propertyTab === 'action') {
                    const cardActionType = String(selectedElement.properties['Card Action'] ?? 'Do Nothing')
                    const cardActionOptions = [
                      { value: 'Do Nothing', label: 'Do Nothing', icon: 'minus-sm', iconCategory: 'general' },
                      { value: 'Navigate to Page', label: 'Navigate to Page', icon: 'form-title-filled', iconCategory: 'general' },
                      { value: 'Open Form', label: 'Open Form', icon: 'form-filled', iconCategory: 'forms-files' },
                      { value: 'Open URL', label: 'Open URL', icon: 'link-horizontal', iconCategory: 'general' },
                      { value: 'Send Email', label: 'Send Email', icon: 'envelope-closed-filled', iconCategory: 'communication' },
                      { value: 'Make Call', label: 'Make Call', icon: 'phone-filled', iconCategory: 'communication' },
                    ]
                    const actionVariantConfig = selectedComponent.variants['Action']
                    const actionValue = String(selectedElement.variants['Action'] ?? 'None')
                    return (
                      <div className="property-panel__body">
                        <div className="property-panel__field">
                          <DSFormField title="Card Actions" size="md" showDescription={false} showHelpText={false}>
                            <DSDropdownSingle
                              value={cardActionType}
                              onChange={(val) => handlePropertyChange(selectedElement.id, 'Card Action', val)}
                              options={cardActionOptions.map((o) => ({
                                value: o.value,
                                label: o.label,
                                leading: <Icon name={o.icon} category={o.iconCategory} size={20} />,
                              }))}
                            />
                          </DSFormField>
                        </div>
                        {cardActionType !== 'Do Nothing' && (
                          <div className="property-panel__field">
                            <DSFormField title="Action" size="md" showDescription={false} showHelpText={false}>
                              <Segmented
                                accent="apps"
                                variant="text"
                                value={actionValue}
                                onChange={(val) => handleVariantChange(selectedElement.id, 'Action', val)}
                                items={actionVariantConfig.options.map((opt) => ({ value: opt, label: opt }))}
                              />
                            </DSFormField>
                            {actionValue === 'Button' && (
                              <DSFormField title="Button Label" size="md" showDescription={false} showHelpText={false}>
                                <DSInput
                                  value={String(selectedElement.properties['Button Label'] ?? '')}
                                  onChange={(e) => handlePropertyChange(selectedElement.id, 'Button Label', e.target.value)}
                                />
                              </DSFormField>
                            )}
                            {actionValue === 'Icon' && (
                              <DSFormField title="Icon" size="md" showDescription={false} showHelpText={false}>
                                <IconPropertyField
                                  value={String(selectedElement.properties['Action Icon'] ?? 'ChevronRight')}
                                  onChange={(val) => handlePropertyChange(selectedElement.id, 'Action Icon', val)}
                                />
                              </DSFormField>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  }

                  // Card's Layout tab is bespoke — Layout segment + Image Style segment + conditional Icon/Image upload.
                  if (isCard && propertyTab === 'layout') {
                    const imageStyle = String(selectedElement.variants['Image Style'] ?? 'Square')
                    const layoutVariant = selectedComponent.variants['Layout']
                    const imageStyleVariant = selectedComponent.variants['Image Style']
                    const cardImageUrl = String(selectedElement.properties['Image URL'] ?? '')
                    const cardImageName = String(selectedElement.properties['Image Name'] ?? '')
                    const cardImageInputId = `card-image-input-${selectedElement.id}`
                    return (
                      <div className="property-panel__body">
                        <div className="property-panel__field">
                          <DSFormField title="Layout" size="md" showDescription={false} showHelpText={false}>
                            <Segmented
                              accent="apps"
                              variant="text"
                              value={String(selectedElement.variants['Layout'] ?? 'Horizontal')}
                              onChange={(val) => handleVariantChange(selectedElement.id, 'Layout', val)}
                              items={layoutVariant.options.map((opt) => ({ value: opt, label: opt }))}
                            />
                          </DSFormField>
                        </div>
                        <div className="property-panel__field">
                          <DSFormField title="Image Style" size="md" showDescription={false} showHelpText={false}>
                            <Segmented
                              accent="apps"
                              variant="text"
                              value={imageStyle}
                              onChange={(val) => handleVariantChange(selectedElement.id, 'Image Style', val)}
                              items={imageStyleVariant.options.map((opt) => ({ value: opt, label: opt }))}
                            />
                          </DSFormField>
                          {imageStyle === 'Icon' && (
                            <IconPropertyField
                              value={String(selectedElement.properties['Icon'] ?? '')}
                              onChange={(val) => handlePropertyChange(selectedElement.id, 'Icon', val)}
                            />
                          )}
                          {(imageStyle === 'Square' || imageStyle === 'Circle') && (
                            <>
                              <input
                                id={cardImageInputId}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return
                                  compressImageFile(file).then((url) => {
                                    handlePropertyChange(selectedElement.id, 'Image URL', url)
                                    handlePropertyChange(selectedElement.id, 'Image Name', file.name)
                                  })
                                  e.target.value = ''
                                }}
                              />
                              {cardImageUrl ? (
                                <div className="image-preview">
                                  <div
                                    className="image-preview__thumb"
                                    style={{ backgroundImage: `url(${cardImageUrl})` }}
                                  />
                                  <span className="image-preview__name" title={cardImageName}>
                                    {cardImageName || 'image'}
                                  </span>
                                  <button
                                    type="button"
                                    className="image-preview__remove"
                                    aria-label="Remove image"
                                    onClick={() => {
                                      handlePropertyChange(selectedElement.id, 'Image URL', '')
                                      handlePropertyChange(selectedElement.id, 'Image Name', '')
                                    }}
                                  >
                                    <Icon name="trash-filled" category="general" size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div className="upload-area">
                                  <DSButton
                                    variant="filled"
                                    colorScheme="secondary"
                                    shape="rectangle"
                                    size="md"
                                    leftIcon={<Icon name="image-plus-filled" category="media" size={16} />}
                                    onClick={() => document.getElementById(cardImageInputId)?.click()}
                                  >
                                    Choose File
                                  </DSButton>
                                  <span className="upload-area__hint">OR DRAG AND DROP HERE</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  }

                  // Card's General tab is bespoke — Title / Description / Shrink / Duplicate placeholder.
                  if (isCard && propertyTab === 'general') {
                    return (
                      <div className="property-panel__body">
                        <div className="property-panel__field">
                          <DSFormField title="Title" size="md" showDescription={false} showHelpText={false}>
                            <DSInput
                              value={String(selectedElement.properties['Title'] ?? '')}
                              onChange={(e) => handlePropertyChange(selectedElement.id, 'Title', e.target.value)}
                            />
                          </DSFormField>
                        </div>
                        <div className="property-panel__field">
                          <DSFormField title="Description" size="md" showDescription={false} showHelpText={false}>
                            <DSTextArea
                              size="md"
                              maxLength={240}
                              showCount
                              showDrag={false}
                              placeholder="Add description"
                              value={String(selectedElement.properties['Description'] ?? '')}
                              onChange={(e) => handlePropertyChange(selectedElement.id, 'Description', e.target.value)}
                            />
                          </DSFormField>
                        </div>
                        <div className="property-panel__field property-panel__field--inline">
                          <DSFormField
                            title="Shrink"
                            description="Make element smaller."
                            size="md"
                            showDescription
                            showHelpText={false}
                          >
                            <DSToggle
                              size="md"
                              checked={Boolean(selectedElement.properties['Shrinked'])}
                              onChange={(e) => handlePropertyChange(selectedElement.id, 'Shrinked', e.target.checked)}
                            />
                          </DSFormField>
                        </div>
                        <div className="property-panel__field">
                          <DSFormField
                            title="Duplicate Element"
                            description="Clone selected elements with all saved properties."
                            size="md"
                            showDescription
                            showHelpText={false}
                          >
                            <DSButton
                              variant="filled"
                              colorScheme="secondary"
                              shape="rectangle"
                              size="md"
                              leftIcon={<Icon name="copy-filled" category="general" size={16} />}
                            >
                              Duplicate
                            </DSButton>
                          </DSFormField>
                        </div>
                      </div>
                    )
                  }

                  if (isSocialFollow && propertyTab === 'general') {
                    return (
                      <div className="property-panel__body">
                        {socialPlatforms.map((p) => {
                          const saved = selectedElement.properties[p.key]
                          const fallback = selectedComponent.properties.find((d) => d.name === p.key)?.default
                          const value = String(saved ?? fallback ?? '')
                          return (
                            <div key={p.key} className="property-panel__field">
                              <DSFormField title={p.key} size="md" showDescription={false} showHelpText={false}>
                                <DSInput
                                  leftContent={p.icon}
                                  value={value}
                                  placeholder={p.placeholder}
                                  onChange={(e) => handlePropertyChange(selectedElement.id, p.key, e.target.value)}
                                />
                              </DSFormField>
                            </div>
                          )
                        })}
                        <div className="property-panel__field property-panel__field--inline">
                          <DSFormField
                            title="Shrink"
                            description="Make element smaller."
                            size="md"
                            showDescription
                            showHelpText={false}
                          >
                            <DSToggle
                              size="md"
                              checked={Boolean(selectedElement.properties['Shrinked'])}
                              onChange={(e) => handlePropertyChange(selectedElement.id, 'Shrinked', e.target.checked)}
                            />
                          </DSFormField>
                        </div>
                      </div>
                    )
                  }

                  if (isSocialFollow && propertyTab === 'style') {
                    const visibleSocialVariants = Object.entries(selectedComponent.variants)
                      .filter(([group]) => group !== 'Layout')
                      .filter(([, config]) => {
                        if (!config.showWhen) return true
                        return Object.entries(config.showWhen).every(
                          ([key, val]) => selectedElement.variants[key] === val,
                        )
                      })
                    const isFilled = selectedElement.variants['Filled'] !== 'No'
                    const isPrimary = selectedElement.variants['Variant'] !== 'Secondary'
                    return (
                      <div className="property-panel__body">
                        {visibleSocialVariants.map(([group, config]) => (
                          <div key={group} className="property-panel__field">
                            <DSFormField title={group} size="md" showDescription={false} showHelpText={false}>
                              <Segmented
                                accent="apps"
                                variant="text"
                                value={String(selectedElement.variants[group] ?? '')}
                                onChange={(val) => handleVariantChange(selectedElement.id, group, val)}
                                items={config.options.map((opt) => ({ value: opt, label: opt }))}
                              />
                            </DSFormField>
                          </div>
                        ))}
                        {isPrimary && (
                          <div className="property-panel__field">
                            <DSFormField title="Icon Color" size="md" showDescription={false} showHelpText={false}>
                              <SocialIconColorField
                                value={String(selectedElement.properties['Icon Color'] || '')}
                                onChange={(val) => handlePropertyChange(selectedElement.id, 'Icon Color', val)}
                                tokenVariable={isFilled ? '--bg-fill-brand' : '--fg-brand'}
                              />
                            </DSFormField>
                          </div>
                        )}
                      </div>
                    )
                  }

                  const showVariants =
                    isAppHeader
                      ? false // Layout (the only variant) is a custom control in the Style tab now
                      : isCard
                        ? (propertyTab === 'layout' || propertyTab === 'action')
                        : isList
                          ? (propertyTab === 'general' || propertyTab === 'layout')
                          : isButton
                            ? (propertyTab === 'general' || propertyTab === 'style')
                            : isSocialFollow
                              ? false
                              : isFaq
                                ? propertyTab === 'style'
                                : isTestimonial
                                  ? propertyTab === 'style'
                                  : propertyTab === 'general'

                  const cardTabVariants = propertyTab === 'layout' ? CARD_LAYOUT_VARIANTS : []
                  const cardTabProps = propertyTab === 'layout' ? CARD_LAYOUT_PROPS : []

                  const LIST_ACTION_VARIANTS = ['Action', 'Icon Filled', 'Card Action', 'Card Icon Filled']
                  const LIST_LAYOUT_VARIANTS = ['Layout', 'Image Style', 'Size', 'Card Image Style', 'Card Layout', 'Card Size']
                  // Button: the visual variants (Variant / Size / Width / Filled) live in the
                  // Style tab. General keeps the content (Label / Icon) with Shrinked at the
                  // bottom. Type, Corner, Left/Right Icon and the Action/Form props are hidden.
                  const BUTTON_STYLE_VARIANTS = ['Variant', 'Size', 'Width', 'Alignment', 'Filled']
                  const BUTTON_STYLE_PROPS: string[] = []
                  const BUTTON_GENERAL_PROPS = ['Label', 'Left Icon', 'Right Icon', 'Icon', 'Shrinked']

                  const visibleVariants = !showVariants
                    ? []
                    : Object.entries(selectedComponent.variants)
                        .filter(([group]) => {
                          if (isCard) return cardTabVariants.includes(group)
                          if (isList) {
                            if (propertyTab === 'layout') return LIST_LAYOUT_VARIANTS.includes(group)
                            // General: exclude both action and layout variants.
                            return !LIST_ACTION_VARIANTS.includes(group) && !LIST_LAYOUT_VARIANTS.includes(group)
                          }
                          if (isButton) {
                            // Only the Style tab shows variants (Variant / Size / Filled);
                            // Type and Corner are removed entirely (not in the list).
                            return propertyTab === 'style' && BUTTON_STYLE_VARIANTS.includes(group)
                          }
                          return true
                        })
                        .filter(([, config]) => {
                          if (!config.showWhen) return true
                          return Object.entries(config.showWhen).every(
                            ([key, val]) => selectedElement.variants[key] === val
                          )
                        })
                        .sort(([a], [b]) => {
                          if (!isCard) return 0
                          return cardTabVariants.indexOf(a) - cardTabVariants.indexOf(b)
                        })

                  const visibleProps = selectedComponent.properties
                    .filter((prop) => prop.name !== 'Selected' && prop.name !== 'Skeleton' && prop.name !== 'Skeleton Animation')
                    .filter((prop) => {
                      if (isAppHeader) {
                        // Style tab → everything except Title/Subtitle (general) and Icon (rendered inside Image Style).
                        return prop.name !== 'Title' && prop.name !== 'Subtitle' && prop.name !== 'Icon'
                      }
                      if (isCard) {
                        if (propertyTab === 'general') {
                          return !CARD_LAYOUT_PROPS.includes(prop.name) && !CARD_ACTION_PROPS.includes(prop.name)
                        }
                        return cardTabProps.includes(prop.name)
                      }
                      if (isList) {
                        // Button Label is rendered inside the Action tab; Show Header is rendered bespoke at the top.
                        if (propertyTab === 'general') return prop.name !== 'Button Label' && prop.name !== 'Show Header'
                        return false
                      }
                      if (isProductList) {
                        // Products & Currency live in the Products tab; default render shows the rest on General.
                        if (propertyTab === 'general') return prop.name !== 'Products' && prop.name !== 'Currency'
                        return false
                      }
                      if (isFaq) {
                        // The General tab is a bespoke list panel (returns early); the Style
                        // tab shows variants. No generic property fields for FAQ.
                        return false
                      }
                      if (isTestimonial) {
                        // General is a bespoke list panel (returns early); Style shows the
                        // display toggles. Items is managed by the list panel.
                        if (propertyTab === 'style') return ['Show Avatars', 'Show Rating', 'Show Role', 'Show Quote Icon', 'Show Arrows'].includes(prop.name)
                        return false
                      }
                      if (isBanner) {
                        // Banner has fully bespoke Content + Style panels.
                        return false
                      }
                      if (isButton) {
                        // Style tab → Full Width. General → Label / Icon / Shrinked (kept in
                        // register order, so Shrinked sits at the bottom). Left/Right Icon and
                        // the Action/Form props are hidden; Style variants are in visibleVariants.
                        if (propertyTab === 'style') return BUTTON_STYLE_PROPS.includes(prop.name)
                        if (propertyTab === 'general') return BUTTON_GENERAL_PROPS.includes(prop.name)
                        return false
                      }
                      return propertyTab === 'general'
                    })
                    .filter((prop) => {
                      if (!prop.showWhen) return true
                      return Object.entries(prop.showWhen).every(
                        ([key, val]) => selectedElement.variants[key] === val || selectedElement.properties[key] === val
                      )
                    })

                  // App header keeps a bespoke Style body (Show Background / Background
                  // Image / Text Color) even with no generic variants/props, so don't
                  // fall through to the empty state for it.
                  if (visibleVariants.length === 0 && visibleProps.length === 0 && !isAppHeader) {
                    return (
                      <div className="property-panel__empty">
                        <Icon name="info-circle" category="general" size={20} />
                        <span>Coming soon</span>
                      </div>
                    )
                  }

                  return (
                    <div className="property-panel__body">
                      {isList && propertyTab === 'general' && (
                        <div className="property-panel__field property-panel__field--inline">
                          <DSFormField
                            title="Show Header"
                            description="Display a header above the list items."
                            size="md"
                            showDescription
                            showHelpText={false}
                          >
                            <DSToggle
                              size="md"
                              checked={Boolean(selectedElement.properties['Show Header'])}
                              onChange={(e) => handlePropertyChange(selectedElement.id, 'Show Header', e.target.checked)}
                            />
                          </DSFormField>
                        </div>
                      )}
                      {isAppHeader && propertyTab === 'style' && (
                        <>
                          <div className="property-panel__field">
                            <DSFormField title="Header Layout" size="md" showDescription={false} showHelpText={false}>
                              <HeaderLayoutPicker
                                value={appHeaderState.headerLayout ?? 'Hero'}
                                onChange={(value) => setAppHeaderState((s) => ({ ...s, headerLayout: value }))}
                              />
                            </DSFormField>
                          </div>
                          {/* The current style controls live under the Hero layout; the other
                              archetypes (Default/Cover/Profile) get their own content later. */}
                          {(appHeaderState.headerLayout ?? 'Hero') === 'Hero' && (
                          <>
                          {/* Sizing & alignment — moved here from the former Layout tab */}
                          {SHOW_APP_HEADER_SIZE && (
                          <div className="property-panel__field">
                            <DSFormField title="Size" size="md" showDescription={false} showHelpText={false}>
                              <Segmented
                                accent="apps"
                                variant="text"
                                value={appHeaderState.size ?? 'Large'}
                                onChange={(value) => setAppHeaderState((s) => ({ ...s, size: value as AppHeaderSize }))}
                                items={[
                                  { value: 'XLarge', label: 'XLarge' },
                                  { value: 'Large', label: 'Large' },
                                  { value: 'Medium', label: 'Medium' },
                                  { value: 'Small', label: 'Small' },
                                ]}
                              />
                            </DSFormField>
                          </div>
                          )}
                          <div className="property-panel__field">
                            <DSFormField title="Height" size="md" showDescription={false} showHelpText={false}>
                              <DSSlider
                                size="md"
                                min={APP_HEADER_HEIGHT_MIN}
                                max={APP_HEADER_HEIGHT_MAX}
                                step={4}
                                value={typeof appHeaderState.minHeight === 'number' ? appHeaderState.minHeight : APP_HEADER_HEIGHT_DEFAULT}
                                onChange={(v) => setAppHeaderState((s) => ({ ...s, minHeight: v }))}
                                showValue
                                formatValue={(v) => `${v}px`}
                                aria-label="App header height"
                              />
                            </DSFormField>
                          </div>
                          {SHOW_APP_HEADER_HORIZONTAL_ALIGN && (
                          <div className="property-panel__field">
                            <DSFormField title="Horizontal Alignment" size="md" showDescription={false} showHelpText={false}>
                              <Segmented
                                accent="apps"
                                variant="text"
                                value={appHeaderState.layout ?? 'Center'}
                                onChange={(value) => setAppHeaderState((s) => ({ ...s, layout: value }))}
                                items={[
                                  { value: 'Left', label: 'Left' },
                                  { value: 'Center', label: 'Center' },
                                  { value: 'Right', label: 'Right' },
                                ]}
                              />
                            </DSFormField>
                          </div>
                          )}
                          {SHOW_APP_HEADER_VERTICAL_ALIGN && (
                          <div className="property-panel__field">
                            <DSFormField title="Vertical Alignment" size="md" showDescription={false} showHelpText={false}>
                              <Segmented
                                accent="apps"
                                variant="text"
                                value={appHeaderState.contentAlign ?? 'Center'}
                                onChange={(value) => setAppHeaderState((s) => ({ ...s, contentAlign: value as AppHeaderContentAlign }))}
                                items={[
                                  { value: 'Center', label: 'Center' },
                                  { value: 'Bottom', label: 'Bottom' },
                                ]}
                              />
                            </DSFormField>
                          </div>
                          )}
                          <div className="property-panel__field">
                            <DSFormField title="Background" size="md" showDescription={false} showHelpText={false}>
                              <Segmented
                                accent="apps"
                                variant="text"
                                value={appHeaderState.bgSource ?? 'color'}
                                onChange={(val) => setAppHeaderState((s) => ({ ...s, bgSource: val as 'color' | 'image' }))}
                                items={[
                                  { value: 'color', label: 'Color' },
                                  { value: 'image', label: 'Image' },
                                ]}
                              />
                            </DSFormField>
                          </div>
                          {(appHeaderState.bgSource ?? 'color') === 'color' && (
                          <div className="property-panel__field">
                            <DSFormField title="Background Color" size="md" showDescription={false} showHelpText={false}>
                              <HeaderBackgroundField
                                mode={appHeaderState.backgroundMode ?? 'solid'}
                                color={appHeaderState.backgroundColor ?? ''}
                                gradientStart={appHeaderState.gradientStart ?? ''}
                                gradientEnd={appHeaderState.gradientEnd ?? ''}
                                onModeChange={(m) => setAppHeaderState((s) => ({ ...s, backgroundMode: m }))}
                                onColorChange={(c) => setAppHeaderState((s) => ({ ...s, backgroundColor: c }))}
                                onGradientChange={(start, end) => setAppHeaderState((s) => ({ ...s, gradientStart: start, gradientEnd: end }))}
                              />
                            </DSFormField>
                          </div>
                          )}
                          {(appHeaderState.bgSource ?? 'color') === 'image' && (
                          <div className="property-panel__field">
                            <DSFormField title="Background Image" size="md" showDescription={false} showHelpText={false}>
                              <input
                                ref={appHeaderBgImageInputRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return
                                  compressImageFile(file).then((url) => {
                                    setAppHeaderState((s) => ({
                                      ...s,
                                      backgroundImageUrl: url,
                                      backgroundImageName: file.name,
                                    }))
                                  })
                                  e.target.value = ''
                                }}
                              />
                              {appHeaderState.backgroundImageUrl ? (
                                <div className="image-preview">
                                  <div
                                    className="image-preview__thumb"
                                    style={{ backgroundImage: `url(${appHeaderState.backgroundImageUrl})` }}
                                  />
                                  <span className="image-preview__name" title={appHeaderState.backgroundImageName ?? ''}>
                                    {appHeaderState.backgroundImageName ?? 'image'}
                                  </span>
                                  <button
                                    type="button"
                                    className="image-preview__remove"
                                    aria-label="Remove image"
                                    onClick={() => setAppHeaderState((s) => ({ ...s, backgroundImageUrl: null, backgroundImageName: null }))}
                                  >
                                    <Icon name="trash-filled" category="general" size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div className="upload-area">
                                  <DSButton
                                    variant="filled"
                                    colorScheme="secondary"
                                    shape="rectangle"
                                    size="md"
                                    leftIcon={<Icon name="image-plus-filled" category="media" size={16} />}
                                    onClick={() => appHeaderBgImageInputRef.current?.click()}
                                  >
                                    Choose File
                                  </DSButton>
                                  <span className="upload-area__hint">OR DRAG AND DROP HERE</span>
                                </div>
                              )}
                            </DSFormField>
                          </div>
                          )}
                          {SHOW_APP_HEADER_TEXT_COLOR && (
                          <div className="property-panel__field">
                            <DSFormField title="Text Color" size="md" showDescription={false} showHelpText={false}>
                              <Segmented
                                accent="apps"
                                variant="text"
                                value={appHeaderState.textColorMode ?? 'auto'}
                                onChange={(val) => setAppHeaderState((s) => ({ ...s, textColorMode: val as 'auto' | 'light' | 'dark' }))}
                                items={[
                                  { value: 'auto', label: 'Auto' },
                                  { value: 'light', label: 'Light' },
                                  { value: 'dark', label: 'Dark' },
                                ]}
                              />
                            </DSFormField>
                          </div>
                          )}
                          {SHOW_APP_HEADER_IMAGE_STYLE && (
                          <div className="property-panel__field">
                            <DSFormField title="Image Style" size="md" showDescription={false} showHelpText={false}>
                              <Segmented
                                accent="apps"
                                variant="text"
                                value={appHeaderState.imageStyle}
                                onChange={(val) => setAppHeaderState((s) => ({ ...s, imageStyle: val as AppHeaderImageStyle }))}
                                items={[
                                  { value: 'Image', label: 'Image' },
                                  { value: 'Icon', label: 'Icon' },
                                  { value: 'None', label: 'None' },
                                ]}
                              />
                            </DSFormField>
                            {appHeaderState.imageStyle === 'Icon' && (
                              <IconPropertyField
                                value={appHeaderState.icon}
                                onChange={(val) => setAppHeaderState((s) => ({ ...s, icon: val }))}
                              />
                            )}
                            {appHeaderState.imageStyle === 'Image' && (
                              <>
                                <input
                                  ref={appHeaderImageInputRef}
                                  type="file"
                                  accept="image/*"
                                  hidden
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return
                                    compressImageFile(file).then((url) => {
                                      setAppHeaderState((s) => ({
                                        ...s,
                                        imageUrl: url,
                                        imageName: file.name,
                                      }))
                                    })
                                    // Allow re-selecting the same file later.
                                    e.target.value = ''
                                  }}
                                />
                                {appHeaderState.imageUrl ? (
                                  <div className="image-preview">
                                    <div
                                      className="image-preview__thumb"
                                      style={{ backgroundImage: `url(${appHeaderState.imageUrl})` }}
                                    />
                                    <span className="image-preview__name" title={appHeaderState.imageName ?? ''}>
                                      {appHeaderState.imageName ?? 'image'}
                                    </span>
                                    <button
                                      type="button"
                                      className="image-preview__remove"
                                      aria-label="Remove image"
                                      onClick={() => setAppHeaderState((s) => ({ ...s, imageUrl: null, imageName: null }))}
                                    >
                                      <Icon name="trash-filled" category="general" size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="upload-area">
                                    <DSButton
                                      variant="filled"
                                      colorScheme="secondary"
                                      shape="rectangle"
                                      size="md"
                                      leftIcon={<Icon name="image-plus-filled" category="media" size={16} />}
                                      onClick={() => appHeaderImageInputRef.current?.click()}
                                    >
                                      Choose File
                                    </DSButton>
                                    <span className="upload-area__hint">OR DRAG AND DROP HERE</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          )}
                          {/* CTA Button — Hero-only, prop-based replacement for the
                              drag-and-drop header actions. Toggle to enable, then set a
                              label + action (each action reveals its own sub-field). */}
                          <div className="property-panel__field property-panel__field--inline">
                            <DSFormField title="CTA Button" size="md" showDescription={false} showHelpText={false}>
                              <DSToggle
                                size="md"
                                checked={appHeaderState.ctaEnabled ?? false}
                                onChange={(e) => setAppHeaderState((s) => ({ ...s, ctaEnabled: e.target.checked }))}
                              />
                            </DSFormField>
                          </div>
                          {(appHeaderState.ctaEnabled ?? false) && (
                          <>
                          <div className="property-panel__field">
                            <DSFormField title="Button Text" size="md" showDescription={false} showHelpText={false}>
                              <DSInput
                                value={appHeaderState.ctaLabel ?? ''}
                                placeholder="Get Started"
                                onChange={(e) => setAppHeaderState((s) => ({ ...s, ctaLabel: e.target.value }))}
                              />
                            </DSFormField>
                          </div>
                          <div className="property-panel__field">
                            <DSFormField title="Button Action" size="md" showDescription={false} showHelpText={false}>
                              <DSDropdownSingle
                                value={appHeaderState.ctaAction ?? 'None'}
                                onChange={(val) => setAppHeaderState((s) => ({ ...s, ctaAction: val as AppHeaderCtaAction }))}
                                options={APP_HEADER_CTA_ACTION_OPTIONS.map((o) => ({
                                  value: o.value,
                                  label: o.label,
                                  leading: <Icon name={o.icon} category={o.iconCategory} size={20} />,
                                }))}
                              />
                            </DSFormField>
                          </div>
                          {appHeaderState.ctaAction === 'Navigate to Page' && (
                          <div className="property-panel__field">
                            <DSFormField title="Target Page" size="md" showDescription={false} showHelpText={false}>
                              <DSDropdownSingle
                                value={appHeaderState.ctaPageId ?? (pages[0]?.id ?? '')}
                                onChange={(val) => setAppHeaderState((s) => ({ ...s, ctaPageId: val }))}
                                options={pages.map((p) => ({ value: p.id, label: p.name }))}
                              />
                            </DSFormField>
                          </div>
                          )}
                          {appHeaderState.ctaAction === 'Open URL' && (
                          <div className="property-panel__field">
                            <DSFormField title="URL" size="md" showDescription={false} showHelpText={false}>
                              <DSInput
                                value={appHeaderState.ctaUrl ?? ''}
                                placeholder="https://example.com"
                                onChange={(e) => setAppHeaderState((s) => ({ ...s, ctaUrl: e.target.value }))}
                              />
                            </DSFormField>
                          </div>
                          )}
                          {appHeaderState.ctaAction === 'Send Email' && (
                          <div className="property-panel__field">
                            <DSFormField title="Email Address" size="md" showDescription={false} showHelpText={false}>
                              <DSInput
                                value={appHeaderState.ctaEmail ?? ''}
                                placeholder="hello@example.com"
                                onChange={(e) => setAppHeaderState((s) => ({ ...s, ctaEmail: e.target.value }))}
                              />
                            </DSFormField>
                          </div>
                          )}
                          {appHeaderState.ctaAction === 'Make Call' && (
                          <div className="property-panel__field">
                            <DSFormField title="Phone Number" size="md" showDescription={false} showHelpText={false}>
                              <DSInput
                                value={appHeaderState.ctaPhone ?? ''}
                                placeholder="+1 555 000 0000"
                                onChange={(e) => setAppHeaderState((s) => ({ ...s, ctaPhone: e.target.value }))}
                              />
                            </DSFormField>
                          </div>
                          )}
                          {appHeaderState.ctaAction === 'Open Form' && (
                          <>
                          <div className="property-panel__field">
                            <DSFormField title="Form Title" size="md" showDescription={false} showHelpText={false}>
                              <DSInput
                                value={appHeaderState.ctaFormTitle ?? ''}
                                placeholder="Add new item"
                                onChange={(e) => setAppHeaderState((s) => ({ ...s, ctaFormTitle: e.target.value }))}
                              />
                            </DSFormField>
                          </div>
                          <div className="property-panel__field">
                            <DSFormField title="Form Fields" size="md" description="Comma-separated field names, or a JSON array of fields." showDescription showHelpText={false}>
                              <DSInput
                                value={appHeaderState.ctaFormFields ?? ''}
                                placeholder="Name, Email, Message"
                                onChange={(e) => setAppHeaderState((s) => ({ ...s, ctaFormFields: e.target.value }))}
                              />
                            </DSFormField>
                          </div>
                          <div className="property-panel__field">
                            <DSFormField title="Submit Label" size="md" showDescription={false} showHelpText={false}>
                              <DSInput
                                value={appHeaderState.ctaFormSubmitLabel ?? ''}
                                placeholder="Submit"
                                onChange={(e) => setAppHeaderState((s) => ({ ...s, ctaFormSubmitLabel: e.target.value }))}
                              />
                            </DSFormField>
                          </div>
                          <div className="property-panel__field">
                            <DSFormField title="Submits To" size="md" showDescription={false} showHelpText={false}>
                              <DSInput
                                value={appHeaderState.ctaSubmitsTo ?? ''}
                                placeholder="Collection or endpoint"
                                onChange={(e) => setAppHeaderState((s) => ({ ...s, ctaSubmitsTo: e.target.value }))}
                              />
                            </DSFormField>
                          </div>
                          </>
                          )}
                          </>
                          )}
                          </>
                          )}
                        </>
                      )}
                      {visibleVariants.map(([group, config]) => (
                        <div key={group} className="property-panel__field">
                          <DSFormField title={group} size="md" showDescription={false} showHelpText={false}>
                            <Segmented
                              accent="apps"
                              variant="text"
                              value={String(selectedElement.variants[group] ?? config.default ?? '')}
                              onChange={(val) => handleVariantChange(selectedElement.id, group, val)}
                              items={config.options.map((opt) => ({ value: opt, label: opt }))}
                            />
                          </DSFormField>
                        </div>
                      ))}

                      {visibleProps.map((prop) => (
                        <div key={prop.name} className="property-panel__field">
                          <DSFormField title={prop.name} size="md" description={prop.description} showDescription={Boolean(prop.description)} showHelpText={false}>
                            {prop.type === 'boolean' ? (
                              <DSToggle
                                checked={Boolean(selectedElement.properties[prop.name])}
                                onChange={(e) =>
                                  handlePropertyChange(selectedElement.id, prop.name, e.target.checked)
                                }
                              />
                            ) : prop.type === 'number' ? (
                              <DSNumberInput
                                showUnit={false}
                                min={prop.min ?? 0}
                                max={prop.max ?? 200}
                                value={Number(selectedElement.properties[prop.name]) || 0}
                                onChange={(val) =>
                                  handlePropertyChange(selectedElement.id, prop.name, val ?? 0)
                                }
                              />
                            ) : prop.type === 'icon' ? (
                              <IconPropertyField
                                clearable={prop.default === 'none'}
                                value={String(selectedElement.properties[prop.name] || '')}
                                onChange={(val) =>
                                  handlePropertyChange(selectedElement.id, prop.name, val)
                                }
                              />
                            ) : prop.type === 'select' && prop.options ? (
                              <Segmented
                                accent="apps"
                                variant="text"
                                value={String(selectedElement.properties[prop.name] ?? prop.default ?? '')}
                                onChange={(val) => handlePropertyChange(selectedElement.id, prop.name, val)}
                                items={prop.options.map((opt) => ({ value: opt, label: opt }))}
                              />
                            ) : (
                              <DSInput
                                value={String(selectedElement.properties[prop.name] || '')}
                                placeholder={prop.placeholder}
                                maxLength={prop.maxLength}
                                rightContent={
                                  prop.maxLength ? (
                                    <span className="property-panel__char-count">
                                      {String(selectedElement.properties[prop.name] || '').length}/{prop.maxLength}
                                    </span>
                                  ) : undefined
                                }
                                onChange={(e) =>
                                  handlePropertyChange(selectedElement.id, prop.name, e.target.value)
                                }
                              />
                            )}
                          </DSFormField>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            ) : (
              <CollectionsProvider>
              <CartProvider>
              <FavoritesProvider>
              <ProductDetailProvider onOpenChange={setIsPreviewDetailOpen}>
              <div className="live-preview">
                <div className="live-preview__header" data-theme="dark">
                  <span className="live-preview__title">Live Preview</span>
                  <div className="live-preview__toolbar">
                    <div className="live-preview__role-dropdown">
                      <DSDropdownSingle
                        size="sm"
                        value={viewingAsRole}
                        onChange={(v) => setViewingAsRole(v as 'anyone' | 'admin' | 'user')}
                        options={[
                          { value: 'admin', label: 'Admin', leading: <span className="live-preview__role-dot" style={{ background: 'var(--purple-200)' }} /> },
                          { value: 'user', label: 'User', leading: <span className="live-preview__role-dot" style={{ background: 'var(--blue-200)' }} /> },
                          { value: 'anyone', label: 'Public', leading: <span className="live-preview__role-dot" style={{ background: 'var(--green-200)' }} /> },
                        ]}
                      />
                    </div>
                    <div className="live-preview__device-dropdown">
                      <DSDropdownSingle
                        size="sm"
                        value={previewDevice}
                        onChange={(v) => setPreviewDevice(v as 'phone' | 'tablet' | 'desktop')}
                        options={[
                          {
                            value: 'phone',
                            label: 'Phone',
                            leading: <Icon name="mobile" category="technology" size={16} />,
                            trailing: previewDevice === 'phone' ? <Icon name="check" size={16} /> : undefined,
                          },
                          {
                            value: 'tablet',
                            label: 'Tablet',
                            leading: <Icon name="tablet" category="technology" size={16} />,
                            trailing: <Icon name="arrow-up-right-from-square" category="arrows" size={16} />,
                          },
                          {
                            value: 'desktop',
                            label: 'Desktop',
                            leading: <Icon name="desktop" category="technology" size={16} />,
                            trailing: <Icon name="arrow-up-right-from-square" category="arrows" size={16} />,
                          },
                        ]}
                      />
                    </div>
                    <div className="live-preview__qr-wrapper" ref={qrPopoverWrapperRef}>
                      <DSButton
                        className="live-preview__tool-btn"
                        variant="ghost"
                        size="sm"
                        iconOnly
                        aria-label="Show QR code"
                        aria-expanded={isQrPopoverOpen}
                        leftIcon={<Icon name="qr" category="media" size={16} />}
                        onClick={() => setIsQrPopoverOpen((v) => !v)}
                      />
                      {!isQrPopoverOpen && (
                        <span className="live-preview__tooltip live-preview__tooltip--qr" role="tooltip">Try it on your device</span>
                      )}
                      {isQrPopoverOpen && <QrPopover />}
                    </div>
                    <div className="live-preview__close-wrapper">
                      <DSButton
                        className="live-preview__tool-btn"
                        variant="ghost"
                        size="sm"
                        iconOnly
                        aria-label="Close live preview"
                        leftIcon={<Icon name="xmark" size={16} />}
                        onClick={() => setIsLivePreviewVisible(false)}
                      />
                      <span className="live-preview__tooltip live-preview__tooltip--close" role="tooltip">Close</span>
                    </div>
                  </div>
                </div>
                <div className="live-preview__body">
                  <div className="live-preview__phone">
                    {/* Layer 1: Gray shell */}
                    <div className="live-preview__phone-shell app-scope" />
                    {/* Layer 3: Black bezel */}
                    <div className="live-preview__phone-bezel" />
                    {/* Layer 4: Screen */}
                    <div className="live-preview__phone-screen">
                      {!previewMode && (
                      <>
                      <div className="live-preview__status-bar-bg app-scope" />
                      <PhoneStatusBar className="live-preview__status-bar app-scope" style={{ color: 'var(--fg-primary, #000)' }} />
                      {(isLoginPopoverOpen || isAvatarPopoverOpen) && (
                        <div
                          className="live-preview__popover-scrim"
                          onClick={() => {
                            setIsLoginPopoverOpen(false)
                            setIsAvatarPopoverOpen(false)
                          }}
                        />
                      )}
                      <div ref={previewTopHeaderRef} className={`live-preview__top-header app-scope${isPreviewContentScrolled ? ' live-preview__top-header--scrolled' : ''}${topNavOverlay ? ' live-preview__top-header--transparent' : ''}${topNavOverlay && !topNavOverHero ? ' live-preview__top-header--over-content' : ''}${mobileTopHeaderHidden ? ' live-preview__top-header--hidden' : ''}`} style={topNavOverlay && topNavOverHero ? { color: topNavOverlayFg } : undefined} data-nav-align={desktopNavAlignment}>
                        {(() => {
                          // Profile system page: a back affordance + "Profile" title
                          // (mobile/tablet only — desktop keeps its branded nav).
                          if (isPreviewProfileOpen && previewDevice !== 'desktop') {
                            return (
                              <div className="live-preview__top-header-page">
                                <button
                                  type="button"
                                  className="live-preview__top-header-back"
                                  aria-label="Back"
                                  onClick={() => setIsPreviewProfileOpen(false)}
                                >
                                  <AppIcon name="ChevronLeft" size={24} />
                                </button>
                                <span className="live-preview__top-header-page-name">Profile</span>
                              </div>
                            )
                          }
                          const isFirstPage = activePageId === pages[0]?.id
                          // Show the app icon + title in the top header: always on the
                          // landing, and on the first page whenever the app header is
                          // closed or the user has scrolled. (Hidden while the menu is open.)
                          const showCompact = !isMorePageOpen && (showLandingNav || (isFirstPage && (!appHeaderState.show || isPreviewContentScrolled)))
                          if (showCompact) {
                            return (
                              <div className="live-preview__top-header-compact">
                                {/* Nav logo is the app identity — always shown, independent of the hero's
                  imageStyle. Falls back to the icon glyph when the hero icon is removed. */ (
                                  <div className={`live-preview__top-header-compact-icon${appIcon.variant === 'Image' && appIcon.imageUrl ? ' live-preview__top-header-compact-icon--image' : ''}`}>
                                    {appIcon.variant === 'Image' && appIcon.imageUrl ? (
                                      <img src={appIcon.imageUrl} alt="" />
                                    ) : (
                                      <AppIcon name={appIcon.icon} size={24} />
                                    )}
                                  </div>
                                )}
                                <span className="live-preview__top-header-compact-title">{appTitle}</span>
                              </div>
                            )
                          }
                          const activePage = pages.find((p) => p.id === activePageId)
                          return isMorePageOpen ? (
                            <div className="live-preview__top-header-compact">
                              {/* Nav logo is the app identity — always shown, independent of the hero's
                  imageStyle. Falls back to the icon glyph when the hero icon is removed. */ (
                                <div className={`live-preview__top-header-compact-icon${appIcon.variant === 'Image' && appIcon.imageUrl ? ' live-preview__top-header-compact-icon--image' : ''}`}>
                                  {appIcon.variant === 'Image' && appIcon.imageUrl ? (
                                    <img src={appIcon.imageUrl} alt="" />
                                  ) : (
                                    <AppIcon name={appIcon.icon} size={24} />
                                  )}
                                </div>
                              )}
                              <span className="live-preview__top-header-compact-title">{appTitle}</span>
                            </div>
                          ) : activePage ? (
                            <div className="live-preview__top-header-page">
                              <span className="live-preview__top-header-page-name">{activePage.name}</span>
                            </div>
                          ) : (
                            <span className="live-preview__top-header-btn" aria-hidden="true" />
                          )
                        })()}
                        <div className="live-preview__top-header-right">
                          {pages.some((p) => p.elements.some((el) => el.componentId === 'product-list')) && (
                            <LivePreviewCartButton onClick={() => setIsPreviewCartOpen(true)} />
                          )}
                          {isPreviewLoggedIn ? (
                            <>
                              {/* Profile page (mobile/tablet): drop the account avatar
                                  from the top header — back affordance handles exit. */}
                              {!(isPreviewProfileOpen && previewDevice !== 'desktop') && (
                                <button
                                  type="button"
                                  className="live-preview__top-header-avatar-btn"
                                  aria-label="Account menu"
                                  onClick={() => setIsAvatarPopoverOpen((v) => !v)}
                                >
                                  <span className="live-preview__top-header-avatar" aria-hidden="true">
                                    {PROFILE_INITIALS}
                                  </span>
                                </button>
                              )}
                              <LivePreviewAvatarPopover
                                open={isAvatarPopoverOpen}
                                onClose={() => setIsAvatarPopoverOpen(false)}
                                onLogout={handlePreviewLogout}
                                onProfile={() => setIsPreviewProfileOpen(true)}
                              />
                            </>
                          ) : showLandingNav ? (
                            <button
                              type="button"
                              className="live-preview__top-header-menu-btn"
                              aria-label={isMorePageOpen ? 'Close menu' : 'Menu'}
                              aria-expanded={isMorePageOpen}
                              onClick={() => setIsMorePageOpen((v) => !v)}
                            >
                              <AppIcon name={isMorePageOpen ? 'X' : 'Menu'} size={20} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="live-preview__top-header-login-btn"
                              aria-label="Login"
                              onClick={() => setIsLoginPopoverOpen((v) => !v)}
                            >
                              <Icon name="circle-user-filled" category="users" size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                      {!isPreviewLoggedIn && (
                        <LivePreviewLoginPopover
                          variant={previewDevice === 'desktop' ? 'modal' : 'popover'}
                          open={isLoginPopoverOpen}
                          onClose={() => setIsLoginPopoverOpen(false)}
                          onLoggedIn={handlePreviewLogin}
                        />
                      )}
                      <div ref={setPreviewContentScalerEl} className={`live-preview__content-scaler app-scope${mobileTopHeaderHidden ? ' live-preview__content-scaler--no-top-nav' : ''}`}>
                        <div className="live-preview__content app-scope">
                          {isPreviewProfileOpen ? (
                            <>
                              <div className="live-preview__app-header-slot">
                                {profileHeaderEl}
                              </div>
                              <div className="themes-view__canvas themes-view__canvas--first">
                                <div className="themes-view__app">
                                  <section className="themes-view__section">
                                    <LivePreviewProfilePage
                                      onLogout={handlePreviewLogout}
                                      onClose={() => setIsPreviewProfileOpen(false)}
                                      name={PROFILE_USER.name}
                                      username={PROFILE_USER.username}
                                      email={PROFILE_USER.email}
                                    />
                                  </section>
                                </div>
                              </div>
                            </>
                          ) : isMorePageOpen ? (
                            <LivePreviewMorePagesView
                              pages={navPages}
                              onPageSelect={handleMorePageSelect}
                              isLoggedIn={isPreviewLoggedIn}
                              large={showLandingNav}
                              onLoginClick={() => { setIsMorePageOpen(false); setPreviewAuthView('login') }}
                              onSignUpClick={() => { setIsMorePageOpen(false); setPreviewAuthView('signup') }}
                            />
                          ) : (() => {
                            const activePage = pages.find((p) => p.id === activePageId) || pages[0]
                            const isFirstPage = activePage?.id === pages[0]?.id
                            return activePage ? (
                              <>
                              {isFirstPage && appHeaderState.show && (
                                <div>
                                <AppHeader
                                  layout={appHeaderState.layout as 'Center' | 'Left' | 'Right'}
                                  contentAlign={appHeaderState.contentAlign}
                                  size={appHeaderState.size}
                                  minHeight={typeof appHeaderState.minHeight === 'number' ? appHeaderState.minHeight : APP_HEADER_HEIGHT_DEFAULT}
                                  icon={appHeaderState.icon}
                                  imageStyle={appHeaderState.imageStyle}
                                  imageUrl={appHeaderState.imageUrl}
                                  textColor={resolveHeaderTextColor(appHeaderState)}
                                  backgroundImageUrl={resolveHeaderImage(appHeaderState)}
                                  backgroundColor={resolveHeaderBackground(appHeaderState)}
                                  skeleton={appHeaderState.skeleton}
                                  title={appHeaderState.title ?? appTitle}
                                  subtitle={appHeaderState.subtitle ?? appSubtitle}
                                  actions={appHeaderIsHero ? (
                                    heroCtaActive ? <HeroCtaButton cta={heroCtaConfig} interactive onNavigate={navigateToPage} /> : null
                                  ) : headerActions.map((el) => {
                                    const comp = ComponentRegistry.get(el.componentId)
                                    if (!comp) return null
                                    const isShrinked = el.componentId === 'button' && el.properties['Shrinked'] === true
                                    return (
                                      <div
                                        key={el.id}
                                        className={`live-preview__header-action${isShrinked ? ' live-preview__header-action--shrinked' : ''}`}
                                      >
                                        {comp.render(el.variants, el.properties, el.states)}
                                      </div>
                                    )
                                  })}
                                />
                                </div>
                              )}
                              <div className={`themes-view__canvas${isFirstPage && appHeaderState.show ? ' themes-view__canvas--first' : ''}`}>
                                <div className="themes-view__app">
                                  {activePage.elements.map((element) => {
                                    const comp = ComponentRegistry.get(element.componentId)
                                    if (!comp) return null
                                    const previewProps = {
                                      ...element.properties,
                                      'Add New Card': false,
                                    }
                                    // Shrinked elements carry --shrinked; columns are resolved by
                                    // the @container app-content rule (full-width on a narrow page,
                                    // flowing two-up once it is wide enough). No device-specific
                                    // stripping needed — the container query handles every shell.
                                    const isShrinked = element.properties['Shrinked'] === true
                                    const isFlow = isAutoFlowElement(element)
                                    return (
                                      <section key={element.id} className={`themes-view__section${isShrinked ? ' themes-view__section--shrinked' : ''}${isFlow ? ' themes-view__section--flow' : ''}`}>
                                        {comp.render(element.variants, previewProps, element.states)}
                                      </section>
                                    )
                                  })}
                                </div>
                              </div>
                              {isFirstPage && !isPreviewCartOpen && !isPreviewCheckoutOpen && !isPreviewDetailOpen && (
                                <div className="themes-view__attribution-footer">
                                  <AttributionBar openAiSheetOnMount={openAttributionSheet} />
                                </div>
                              )}
                              </>
                            ) : null
                          })()}
                        </div>
                      </div>
                      {pages.length > 1 && bottomNavEnabled && !isPreviewCartOpen && !isPreviewCheckoutOpen && !isPreviewDetailOpen && !isPreviewProfileOpen && !showLandingNav && (
                        <div className="live-preview__bottom-nav app-scope">
                          <BottomNavigation
                            items={bottomNavItems}
                            activeIndex={bottomNavActiveIndex}
                            showLabels={bottomNavDisplayStyle !== 'icon'}
                            onItemClick={handleBottomNavClick}
                          />
                        </div>
                      )}
                      <img src={phoneHomeIndicator} alt="" className="live-preview__home-indicator" />
                      <FormSheet />
                      <LivePreviewCartPage
                        open={isPreviewCartOpen}
                        onClose={() => setIsPreviewCartOpen(false)}
                        onContinue={() => setIsPreviewCheckoutOpen(true)}
                        avatarUrl={previewUserAvatar}
                      />
                      <LivePreviewProductDetailPage />
                      <LivePreviewCheckoutPage
                        open={isPreviewCheckoutOpen}
                        onClose={() => setIsPreviewCheckoutOpen(false)}
                        avatarUrl={previewUserAvatar}
                      />
                      <LivePreviewLoginPopover
                        variant={previewDevice === 'desktop' ? 'modal' : 'page'}
                        open={previewAuthView !== null}
                        initialView={previewAuthView ?? 'login'}
                        onClose={() => { setPreviewAuthView(null); setIsMorePageOpen(false); pendingAuthRedirectRef.current = null }}
                        onLoggedIn={handlePreviewLogin}
                      />
                      <LivePreviewOrderBar
                        hidden={isPreviewCartOpen || isPreviewCheckoutOpen || isPreviewDetailOpen || isPreviewProfileOpen}
                        hasBottomNav={pages.length > 1}
                        onClick={() => setIsPreviewCheckoutOpen(true)}
                      />
                      </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              </ProductDetailProvider>
              </FavoritesProvider>
              </CartProvider>
              </CollectionsProvider>
            )}
          </div>

          {/* Slide 2: App Designer */}
          <div className="build-page__right-slide build-page__right-slide--designer" data-theme="dark">
            <AppDesigner
              onClose={handleCloseDesigner}
              targetSelector=".app-scope"
              isMobile={isMobileView}
              visible={rightPanel === 'designer'}
              namespace={preset?.id === 'empty' ? undefined : preset?.id}
              onThemeColorChange={() =>
                setAppHeaderState((s) => {
                  // Theme color is global; drop the header's custom (fixed-hex) fill so
                  // it re-syncs to the new brand. No-op when nothing custom is set.
                  if (!s.backgroundColor && !s.gradientStart && !s.gradientEnd) return s
                  return { ...s, backgroundMode: 'solid', backgroundColor: undefined, gradientStart: undefined, gradientEnd: undefined }
                })
              }
              renderIcon={(name, size) => <Icon name={name} category="editor" size={size} />}
              doneButton={<DSButton variant="filled" colorScheme="primary" shape="rectangle" size="md" onClick={handleCloseDesigner}>Done</DSButton>}
            />
          </div>

        </div>
      </aside>
    </div>

    {/* Mobile: Bottom Bar (replaces floating buttons) */}
    {isMobileView && (
      <MobileBottomBar
        onElementsClick={() => {
          if (rightPanel === 'designer') setRightPanel('preview')
          setMobileElementsSheet(true)
        }}
        onDesignClick={() => {
          setMobileElementsSheet(false)
          setSelectedElementId(null)
          setRightPanel('designer')
        }}
        onPagesClick={() => {
          /* placeholder */
        }}
        onPreviewClick={() => {
          /* placeholder */
        }}
      />
    )}

    {/* Mobile: Add Element Bottom Sheet */}
    <BottomSheet
      open={mobileElementsSheet}
      onClose={() => setMobileElementsSheet(false)}
      title="App Elements"
      noOverlay
      dark
      renderCloseButton={(onClose) => (
        <button className="sidebar-panel__close" onClick={onClose}>
          <Icon name="xmark" category="general" size={20} />
        </button>
      )}
    >
      <div className="mobile-elements-sheet v2-sheet">
        <TabMenu activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === 'widgets' && (
          <>
            <div className="build-page__ai-create" data-theme="dark">
              <AiCreateWidgetButton />
            </div>
            <div className="build-page__widget-search" data-theme="dark">
              <DSSearchInput
                size="sm"
                placeholder="Search widgets"
                value={widgetSearch}
                onChange={(e) => setWidgetSearch(e.target.value)}
                onClear={() => setWidgetSearch('')}
              />
            </div>
          </>
        )}
        <div className="mobile-elements-sheet__list">
          {activeTab === 'widgets' && widgetSearchTerm && activeGroups.length === 0 && (
            <div className="build-page__widget-search-empty">No widgets found</div>
          )}
          {activeGroups.map((group, groupIndex) => {
            const validItems = group.elementIds.map((id) => componentMap[id]).filter(Boolean)
            if (validItems.length === 0) return null
            return (
              <div key={group.label || groupIndex}>
                {group.label && (
                  <div className="mobile-elements-grid__separator">{group.label}</div>
                )}
                <div className="mobile-elements-grid">
                  {validItems.map((comp) => {
                    const iconInfo = ELEMENT_ICON_MAP[comp.id]
                    return (
                      <button
                        key={comp.id}
                        className="mobile-elements-grid__item"
                        onClick={() => { handleAddElement(comp); }}
                      >
                        <div className="mobile-elements-grid__icon">
                          {iconInfo ? (
                            <Icon name={iconInfo.icon} category={iconInfo.iconCategory} size={24} />
                          ) : (
                            <Icon name="grid-2-filled" category="layout" size={24} />
                          )}
                        </div>
                        <span className="mobile-elements-grid__label">{comp.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </BottomSheet>

    {/* List items editor modal */}
    {editItemsOpen && selectedComponent?.id === 'list' && selectedElement && (() => {
      type Item = { id: string; title: string; description: string; image?: string }
      const readItems = (): Item[] => {
        const raw = selectedElement.properties['Items']
        if (typeof raw === 'string' && raw.startsWith('[')) {
          try {
            const parsed = JSON.parse(raw) as Item[]
            if (Array.isArray(parsed)) return parsed
          } catch { /* fall through */ }
        }
        return [
          { id: 'item-1', title: 'Title 1', description: 'Description 1' },
          { id: 'item-2', title: 'Title 2', description: 'Description 2' },
          { id: 'item-3', title: 'Title 3', description: 'Description 3' },
        ]
      }
      const items = readItems()
      const writeItems = (next: Item[]) => {
        handlePropertyChange(selectedElement.id, 'Items', JSON.stringify(next))
      }
      const updateItem = (idx: number, patch: Partial<Item>) => {
        const next = items.map((it, i) => i === idx ? { ...it, ...patch } : it)
        writeItems(next)
      }
      const addItem = () => {
        const n = items.length + 1
        const id = `item-${Date.now()}`
        writeItems([
          ...items,
          { id, title: `Title ${n}`, description: `Description ${n}` },
        ])
      }
      const removeItem = (idx: number) => {
        writeItems(items.filter((_, i) => i !== idx))
      }
      return (
        <DSModal
          open={editItemsOpen}
          onClose={() => setEditItemsOpen(false)}
          size="lg"
          title="Edit list items"
          description="Add or update each item's title, description, and image."
          confirmLabel="Done"
          cancelLabel="Close"
          onConfirm={() => setEditItemsOpen(false)}
        >
          <div className="list-items-editor">
            <div className="list-items-editor__row list-items-editor__row--header">
              <span className="list-items-editor__cell list-items-editor__cell--title">Title</span>
              <span className="list-items-editor__cell list-items-editor__cell--description">Description</span>
              <span className="list-items-editor__cell list-items-editor__cell--image">Image</span>
              <span className="list-items-editor__cell list-items-editor__cell--actions" />
            </div>
            {items.map((item, idx) => (
              <div className="list-items-editor__row" key={item.id}>
                <div className="list-items-editor__cell list-items-editor__cell--title">
                  <DSInput
                    value={item.title}
                    onChange={(e) => updateItem(idx, { title: e.target.value })}
                  />
                </div>
                <div className="list-items-editor__cell list-items-editor__cell--description">
                  <DSInput
                    value={item.description}
                    onChange={(e) => updateItem(idx, { description: e.target.value })}
                  />
                </div>
                <div className="list-items-editor__cell list-items-editor__cell--image">
                  {item.image ? (
                    <button
                      type="button"
                      className="list-items-editor__image-thumb"
                      style={{ backgroundImage: `url(${item.image})` }}
                      onClick={() => updateItem(idx, { image: undefined })}
                      aria-label="Remove image"
                    />
                  ) : (
                    <label className="list-items-editor__image-upload">
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          compressImageFile(file).then((url) => updateItem(idx, { image: url }))
                          e.target.value = ''
                        }}
                      />
                      <Icon name="image-plus-filled" category="media" size={16} />
                      <span>Choose</span>
                    </label>
                  )}
                </div>
                <div className="list-items-editor__cell list-items-editor__cell--actions">
                  <button
                    type="button"
                    className="list-items-editor__remove"
                    aria-label="Remove item"
                    onClick={() => removeItem(idx)}
                  >
                    <Icon name="trash-filled" category="general" size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="list-items-editor__add" onClick={addItem}>
              <Icon name="plus-circle" category="general" size={16} />
              <span>Add item</span>
            </button>
          </div>
        </DSModal>
      )
    })()}

    </>
  )
}
