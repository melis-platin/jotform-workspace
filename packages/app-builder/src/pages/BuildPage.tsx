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
  CartProvider,
  FavoritesProvider,
  FormSheet,
  compressImageFile,
  compressImageFiles,
  ensureProductIds,
  generateVariants,
  makeDimensionId,
  type ProductItem,
  type ProductModifier,
  type ProductOptionChoice,
  type ProductSubscription,
  type RegisteredComponent,
  type VariantValues,
  type PropertyValues,
  type StateValues,
  HsvColorPicker,
} from '@jf/app-elements'
import { Icon, Button as DSButton, Tabs as DSTabs, Segmented, Input as DSInput, Toggle as DSToggle, NumberInput as DSNumberInput, FormField as DSFormField, TextArea as DSTextArea, DropdownSingle as DSDropdownSingle, FieldMapper as DSFieldMapper, FieldComposer as DSFieldComposer, type FieldToken, Link as DSLink, Modal as DSModal, SearchInput as DSSearchInput, ColorInput as DSColorInput } from '@jf/design-system'
import phoneHomeIndicator from '@jf/design-system/src/assets/phone-home-indicator.svg'
import previewUserAvatar from '../assets/preview-user-avatar.jpg'
import { PhoneStatusBar } from '../components/PhoneStatusBar'
import { PageNavigationBar, getPageIconName } from '../components/PageNavigationBar'
import { LivePreviewMenuDrawer } from '../components/LivePreviewMenuDrawer'
import { LivePreviewMorePagesView } from '../components/LivePreviewMorePagesView'
import { LivePreviewCartButton } from '../components/LivePreviewCartButton'
import { LivePreviewCartPage } from '../components/LivePreviewCartPage'
import { LivePreviewCheckoutPage } from '../components/LivePreviewCheckoutPage'
import { LivePreviewOrderBar } from '../components/LivePreviewOrderBar'
import { LivePreviewAvatarPopover } from '../components/LivePreviewAvatarPopover'
import { LivePreviewLoginPopover } from '../components/LivePreviewLoginPopover'
import { QrPopover } from '../components/QrPopover'
import { MobileBottomBar } from '../components/MobileBottomBar'
import { AppPreviewScreen } from '../components/AppPreviewScreen'
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
import { ColorInputWithPicker } from '../components/ColorInputWithPicker'
import { ProductFilterPopover } from '../components/ProductFilterPopover'
import { ProductOptionModal } from '../components/ProductOptionModal'
import { ProductModifierModal } from '../components/ProductModifierModal'
import { ProductSubscriptionModal } from '../components/ProductSubscriptionModal'
import { loadSnapshot, saveSnapshot } from '../presets/storage'

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
  { elementIds: ['form', 'heading', 'list', 'paragraph', 'card', 'sign-document', 'document', 'image', 'image-gallery', 'button', 'spacer'] },
  { label: 'PAYMENT ELEMENTS', elementIds: ['product-list', 'donation-box'] },
  { label: 'FEATURED WIDGETS', elementIds: ['social-follow', 'testimonial'] },
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
        icon: storedHeader.icon ?? APP_HEADER_DEFAULTS.icon,
        skeleton: storedHeader.skeleton ?? APP_HEADER_DEFAULTS.skeleton,
        show: typeof storedHeader.show === 'boolean' ? storedHeader.show : APP_HEADER_DEFAULTS.show,
        imageStyle: (storedHeader.imageStyle as AppHeaderImageStyle | undefined) ?? APP_HEADER_DEFAULTS.imageStyle,
        imageUrl: storedHeader.imageUrl ?? APP_HEADER_DEFAULTS.imageUrl,
        imageName: storedHeader.imageName ?? APP_HEADER_DEFAULTS.imageName,
        textColor: storedHeader.textColor ?? APP_HEADER_DEFAULTS.textColor,
        backgroundImageUrl: storedHeader.backgroundImageUrl ?? APP_HEADER_DEFAULTS.backgroundImageUrl,
        backgroundImageName: storedHeader.backgroundImageName ?? APP_HEADER_DEFAULTS.backgroundImageName,
        title: storedHeader.title,
        subtitle: storedHeader.subtitle,
      },
    }
  }
  let nextId = 1
  const pages: AppPage[] = preset.pages.map((p) => {
    const built = buildCanvasElementsFromPreset(p.elements, nextId)
    nextId = built.nextId
    return { id: p.id, name: p.name, icon: p.icon, elements: built.elements }
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
interface AppHeaderState {
  layout: string
  icon: string
  skeleton: boolean
  show: boolean
  imageStyle: AppHeaderImageStyle
  imageUrl: string | null
  imageName: string | null
  textColor: string
  backgroundImageUrl: string | null
  backgroundImageName: string | null
  // Optional overrides — when set (including empty string), they take precedence
  // over appTitle/appSubtitle so users can hide the header text without clearing
  // the chrome-level app name.
  title?: string
  subtitle?: string
}
const APP_HEADER_DEFAULTS: AppHeaderState = {
  layout: 'Center',
  icon: 'Leaf',
  skeleton: false,
  show: true,
  imageStyle: 'Icon',
  imageUrl: null,
  imageName: null,
  textColor: '#FFFFFF',
  backgroundImageUrl: null,
  backgroundImageName: null,
}

const HEADER_ACTION_ALLOWED = ['button', 'social-follow']
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
      className={`themes-view__section build-page__canvas-element ${isSelected ? 'build-page__canvas-element--selected' : ''} ${isShrinked ? 'build-page__canvas-element--shrinked' : ''}`}
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

function AddPageDivider({ onClick }: { onClick: () => void }) {
  return (
    <div className="add-page-divider" onClick={(e) => e.stopPropagation()}>
      <div className="add-page-divider__line" />
      <button className="add-page-divider__btn" onClick={onClick}>
        <Icon name="plus-sm" category="general" size={24} />
        <span>Add a Page</span>
      </button>
      <div className="add-page-divider__line" />
    </div>
  )
}

type RightPanelMode = 'preview' | 'designer' | 'properties'

interface BuildPageProps {
  appTitle?: string
  onAppTitleChange?: (title: string) => void
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
  preset,
  initialPageId,
  chromeless = false,
  openAttributionSheet = false,
  previewMode = false,
  onPreviewClose,
}: BuildPageProps) {
  const [rightPanel, setRightPanel] = useState<RightPanelMode>('preview')
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
  useEffect(() => { setEditingProductIndex(null); setEditingOptionIndex(null); setProductSettingsTab('basic'); setProductSearch(''); setFilterOpen(false); setOptionModalOpen(false); setEditingModifierIndex(null); setModifierModalOpen(false); setSubscriptionModalOpen(false) }, [selectedElementId, propertyTab])

  const migratedSocialFollowIds = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!selectedElementId) return
    if (migratedSocialFollowIds.current.has(selectedElementId)) return
    const all = [...pagesRef.current.flatMap((p) => p.elements), ...headerActionsRef.current]
    const el = all.find((e) => e.id === selectedElementId)
    if (!el || el.componentId !== 'social-follow') return
    const comp = ComponentRegistry.get('social-follow')
    if (!comp) return
    const updates: Record<string, string | boolean | number> = {}
    for (const prop of comp.properties) {
      const current = el.properties[prop.name]
      if ((current === undefined || current === '') && prop.default !== undefined && prop.default !== '') {
        updates[prop.name] = prop.default as string | boolean | number
      }
    }
    migratedSocialFollowIds.current.add(selectedElementId)
    if (Object.keys(updates).length === 0) return
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        elements: page.elements.map((e) =>
          e.id === selectedElementId
            ? { ...e, properties: { ...e.properties, ...updates } }
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
  const setAppTitle = (title: string) => onAppTitleChange?.(title)
  const [appSubtitle, setAppSubtitle] = useState(initial.appSubtitle)
  const [appHeaderState, setAppHeaderState] = useState<AppHeaderState>(initial.appHeader)
  const [isPreviewMenuOpen, setIsPreviewMenuOpen] = useState(false)
  const [isMorePageOpen, setIsMorePageOpen] = useState(false)
  const [isPreviewCartOpen, setIsPreviewCartOpen] = useState(false)
  const [isPreviewCheckoutOpen, setIsPreviewCheckoutOpen] = useState(false)
  const [isAvatarPopoverOpen, setIsAvatarPopoverOpen] = useState(false)
  const [isLoginPopoverOpen, setIsLoginPopoverOpen] = useState(false)
  const [loginPopoverView, setLoginPopoverView] = useState<'login' | 'signup'>('login')
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
    const isAsideVisible = isLivePreviewVisible || rightPanel === 'designer'
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
    saveSnapshot(preset.id, {
      appTitle, appSubtitle, pages, headerActions, appHeader: appHeaderState,
    })
  }, [preset, appTitle, appSubtitle, pages, headerActions, appHeaderState])
  const appHeaderRef = useRef<HTMLDivElement>(null)
  const designBtnRef = useRef<HTMLButtonElement>(null)
  const [designBtnOnHeader, setDesignBtnOnHeader] = useState(true)

  // Live preview: track scroll so the top-header chrome can collapse to show
  // its icon + title (iOS large-title pattern) the moment the first page
  // starts scrolling.
  const [previewContentScalerEl, setPreviewContentScalerEl] = useState<HTMLDivElement | null>(null)
  const [isPreviewContentScrolled, setIsPreviewContentScrolled] = useState(false)

  useEffect(() => {
    if (!previewContentScalerEl) {
      setIsPreviewContentScrolled(false)
      return
    }
    const onScroll = () => {
      setIsPreviewContentScrolled(previewContentScalerEl.scrollTop > 0)
    }
    onScroll()
    previewContentScalerEl.addEventListener('scroll', onScroll, { passive: true })
    return () => previewContentScalerEl.removeEventListener('scroll', onScroll)
  }, [previewContentScalerEl])

  // Bottom-nav overflow: when 5+ pages exist, show the first 4 and replace the
  // 5th slot with a "More" tab. Tapping More opens a full-screen list of all
  // pages; tapping a page from that list navigates and dismisses More.
  const hasNavOverflow = pages.length >= 5
  const visibleNavPages = hasNavOverflow ? pages.slice(0, 4) : pages
  const isActiveInOverflow = hasNavOverflow && pages.slice(4).some((p) => p.id === activePageId)
  const bottomNavItems = hasNavOverflow
    ? [...visibleNavPages.map((p, i) => ({ icon: getPageIconName(p, i), label: p.name })), { icon: 'Ellipsis', label: 'More' }]
    : visibleNavPages.map((p, i) => ({ icon: getPageIconName(p, i), label: p.name }))
  const bottomNavActiveIndex = (() => {
    if (hasNavOverflow && (isMorePageOpen || isActiveInOverflow)) return visibleNavPages.length
    const idx = visibleNavPages.findIndex((p) => p.id === activePageId)
    return idx === -1 ? 0 : idx
  })()
  const handleBottomNavClick = (index: number) => {
    if (hasNavOverflow && index === visibleNavPages.length) {
      setIsMorePageOpen(true)
      return
    }
    setIsMorePageOpen(false)
    setActivePageId(visibleNavPages[index].id)
  }
  const handleMorePageSelect = (pageId: string) => {
    setActivePageId(pageId)
    setIsMorePageOpen(false)
  }

  // Top-header compact (app icon + title) shown the moment scrolling starts.
  // On mobile/tablet it's first-page only (AppHeader lives there). Desktop
  // preview promotes every page so the chrome reads "app branding" consistently
  // across pages once you scroll.
  // Keep the element in the DOM 250ms after dismissal so the exit animation runs.
  const previewIsFirstPage = activePageId === pages[0]?.id
  const isDesktopFullPreview = previewMode && previewDevice === 'desktop'
  const showCompactTitle = appHeaderState.show && isPreviewContentScrolled && (previewIsFirstPage || isDesktopFullPreview)
  const [compactTitleInDom, setCompactTitleInDom] = useState(false)
  useEffect(() => {
    if (showCompactTitle) {
      setCompactTitleInDom(true)
      return
    }
    if (!compactTitleInDom) return
    const t = setTimeout(() => setCompactTitleInDom(false), 250)
    return () => clearTimeout(t)
  }, [showCompactTitle, compactTitleInDom])

  useEffect(() => {
    return ComponentRegistry.subscribe(() => {
      setComponents(ComponentRegistry.getAll())
    })
  }, [])

  const isReorderingInHeader =
    dragSession?.type === 'canvas' &&
    headerActions.some((a) => a.id === dragSession.elementId)

  const canDropInHeader = (() => {
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
  }, [])

  const handleCloseDesigner = useCallback(() => {
    setRightPanel('preview')
  }, [])

  useEffect(() => {
    applyStoredOrDefaultTheme(preset?.id === 'empty' ? undefined : preset?.id)
  }, [preset?.id])

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

    const fields = [
      { el: titleEl, defaultValue: 'App Title', setter: setAppTitle },
      { el: subtitleEl, defaultValue: '', setter: setAppSubtitle },
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
        const newText = el.textContent || ''
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
  }, [appTitle, appSubtitle])

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

  const phoneScreenContent = (
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
      <div className={`live-preview__top-header app-scope${isPreviewContentScrolled ? ' live-preview__top-header--scrolled' : ''}`}>
        {(() => {
          const compactPersistent = previewDevice === 'desktop'
          const compactDomReady = compactTitleInDom || compactPersistent
          const compactExiting = !compactPersistent && compactTitleInDom && !showCompactTitle
          const titleCollapsed = compactPersistent && !showCompactTitle
          if (compactDomReady) {
            const compactClass = [
              'live-preview__top-header-compact',
              compactExiting && 'live-preview__top-header-compact--exiting',
              compactPersistent && 'live-preview__top-header-compact--persistent',
              titleCollapsed && 'live-preview__top-header-compact--icon-only',
            ].filter(Boolean).join(' ')
            return (
              <div className={compactClass}>
                {appHeaderState.imageStyle !== 'None' && (
                  <div className={`live-preview__top-header-compact-icon${appHeaderState.imageStyle === 'Image' && appHeaderState.imageUrl ? ' live-preview__top-header-compact-icon--image' : ''}`}>
                    {appHeaderState.imageStyle === 'Image' && appHeaderState.imageUrl ? (
                      <img src={appHeaderState.imageUrl} alt="" />
                    ) : (
                      <AppIcon name={appHeaderState.icon} size={24} />
                    )}
                  </div>
                )}
                <span className="live-preview__top-header-compact-title">{appTitle}</span>
              </div>
            )
          }
          const activePage = pages.find((p) => p.id === activePageId)
          return isMorePageOpen ? (
            <div className="live-preview__top-header-page">
              <span className="live-preview__top-header-page-name">Menu</span>
            </div>
          ) : activePage ? (
            <div className="live-preview__top-header-page">
              <span className="live-preview__top-header-page-name">{activePage.name}</span>
            </div>
          ) : (
            <span className="live-preview__top-header-btn" aria-hidden="true" />
          )
        })()}
        <nav className="live-preview__top-header-nav">
          {pages.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`live-preview__top-header-nav-link${p.id === activePageId ? ' live-preview__top-header-nav-link--active' : ''}`}
              onClick={() => setActivePageId(p.id)}
            >
              {p.name}
            </button>
          ))}
        </nav>
        <div className="live-preview__top-header-right">
          {pages.some((p) => p.elements.some((el) => el.componentId === 'product-list')) && (
            <LivePreviewCartButton onClick={() => setIsPreviewCartOpen(true)} />
          )}
          {isPreviewLoggedIn ? (
            <>
              <button
                type="button"
                className="live-preview__top-header-avatar-btn"
                aria-label="Account menu"
                onClick={() => setIsAvatarPopoverOpen((v) => !v)}
              >
                <img
                  className="live-preview__top-header-avatar"
                  src={previewUserAvatar}
                  alt=""
                  aria-hidden="true"
                />
              </button>
              <LivePreviewAvatarPopover
                open={isAvatarPopoverOpen}
                onClose={() => setIsAvatarPopoverOpen(false)}
              />
            </>
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
          open={isLoginPopoverOpen}
          onClose={() => setIsLoginPopoverOpen(false)}
          onLoggedIn={() => setIsPreviewLoggedIn(true)}
          initialView={loginPopoverView}
        />
      )}
      <div ref={setPreviewContentScalerEl} className="live-preview__content-scaler app-scope">
        <div className="live-preview__content app-scope">
          {isMorePageOpen ? (
            <LivePreviewMorePagesView
              pages={pages}
              onPageSelect={handleMorePageSelect}
              isLoggedIn={isPreviewLoggedIn}
              onLoginClick={() => { setLoginPopoverView('login'); setIsLoginPopoverOpen(true) }}
              onSignUpClick={() => { setLoginPopoverView('signup'); setIsLoginPopoverOpen(true) }}
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
                  icon={appHeaderState.icon}
                  imageStyle={appHeaderState.imageStyle}
                  imageUrl={appHeaderState.imageUrl}
                  textColor={appHeaderState.textColor}
                  backgroundImageUrl={appHeaderState.backgroundImageUrl}
                  skeleton={appHeaderState.skeleton}
                  title={appTitle}
                  subtitle={appSubtitle}
                  actions={headerActions.map((el) => {
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
              <div className={`themes-view__canvas${isFirstPage ? ' themes-view__canvas--first' : ''}`}>
                <div className="themes-view__app">
                  {activePage.elements.map((element) => {
                    const comp = ComponentRegistry.get(element.componentId)
                    if (!comp) return null
                    const previewProps = {
                      ...element.properties,
                      'Add New Card': false,
                      // Strip Shrinked in mobile preview so elements stretch full-width.
                      // Button keeps its shrinked state — a full-width button is worse than a compact one.
                      Shrinked: element.componentId === 'button' ? element.properties['Shrinked'] : false,
                    }
                    const isButtonShrinked = element.componentId === 'button' && element.properties['Shrinked'] === true
                    return (
                      <section key={element.id} className={`themes-view__section${isButtonShrinked ? ' themes-view__section--shrinked' : ''}`}>
                        {comp.render(element.variants, previewProps, element.states)}
                      </section>
                    )
                  })}
                </div>
              </div>
              {isFirstPage && !isPreviewCartOpen && !isPreviewCheckoutOpen && (
                <div className="themes-view__attribution-footer">
                  <AttributionBar openAiSheetOnMount={openAttributionSheet} />
                </div>
              )}
              </>
            ) : null
          })()}
        </div>
      </div>
      {pages.length > 1 && !isPreviewCartOpen && !isPreviewCheckoutOpen && (
        <div className="live-preview__bottom-nav app-scope">
          <BottomNavigation
            items={bottomNavItems}
            activeIndex={bottomNavActiveIndex}
            onItemClick={handleBottomNavClick}
          />
        </div>
      )}
      <img src={phoneHomeIndicator} alt="" className="live-preview__home-indicator" />
      <FormSheet />
      <LivePreviewMenuDrawer
        open={isPreviewMenuOpen}
        onClose={() => setIsPreviewMenuOpen(false)}
        pages={pages}
        activePageId={activePageId}
        onPageSelect={setActivePageId}
        appTitle={appTitle}
        appHeader={appHeaderState}
      />
      <LivePreviewCartPage
        open={isPreviewCartOpen}
        onClose={() => setIsPreviewCartOpen(false)}
        onContinue={() => setIsPreviewCheckoutOpen(true)}
        avatarUrl={previewUserAvatar}
      />
      <LivePreviewCheckoutPage
        open={isPreviewCheckoutOpen}
        onClose={() => setIsPreviewCheckoutOpen(false)}
        avatarUrl={previewUserAvatar}
      />
      <LivePreviewOrderBar
        hidden={isPreviewCartOpen || isPreviewCheckoutOpen}
        hasBottomNav={pages.length > 1}
        onClick={() => setIsPreviewCheckoutOpen(true)}
      />
    </>
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
        setSelectedElementId(null)
        setRightPanel('preview')
      }}>
          {/* Floating Buttons */}
          <div className="build-page__floating-buttons">
            <button className={`build-page__add-element-btn${leftPanelOpen ? ' build-page__add-element-btn--hidden' : ''}`} onClick={(e) => { e.stopPropagation(); if (isMobileView) { setMobileElementsSheet(true); } else { setLeftPanelOpen(true); } }}>
              <Icon name="plus" category="general" size={24} />
              <span className="build-page__add-element-btn-tooltip">Add Element</span>
            </button>
            <button ref={designBtnRef} className={`build-page__design-btn${rightPanel === 'designer' ? ' build-page__design-btn--hidden' : ''}${!designBtnOnHeader ? ' build-page__design-btn--brand' : ''}`} onClick={(e) => {
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
          <div className="app-scope">
            <div className="themes-view__device">
              <div ref={appHeaderRef}>
                {appHeaderState.show && <AppHeader
                  layout={appHeaderState.layout as 'Center' | 'Left' | 'Right'}
                  icon={appHeaderState.icon}
                  imageStyle={appHeaderState.imageStyle}
                  imageUrl={appHeaderState.imageUrl}
                  textColor={appHeaderState.textColor}
                  backgroundImageUrl={appHeaderState.backgroundImageUrl}
                  skeleton={appHeaderState.skeleton}
                  title={appHeaderState.title ?? appTitle}
                  subtitle={appHeaderState.subtitle ?? appSubtitle}
                  iconSelected={selectedElementId === APP_HEADER_ID}
                  onIconClick={(e) => {
                    e.stopPropagation()
                    setSelectedElementId(APP_HEADER_ID)
                    setRightPanel('properties')
                  }}
                  actionsSlotRef={headerActionsSlotRef}
                  actions={
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
                  }
                />}
              </div>

              {pages.map((page, pageIndex) => (
                <div key={page.id}>
                  <div
                    className={`themes-view__canvas ${pageIndex === 0 ? 'themes-view__canvas--first' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActivePageId(page.id)
                      if (e.target === e.currentTarget) {
                        setSelectedElementId(null)
                        setRightPanel('preview')
                      }
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

      </main>

      {/* Page Navigation Bar */}
      {!isMobileView && pages.length > 1 && (
        <PageNavigationBar
          pages={pages}
          activePageId={activePageId}
          onPageSelect={(pageId) => {
            setActivePageId(pageId)
            requestAnimationFrame(() => {
              const el = document.querySelector(`[data-page-id="${pageId}"]`)
              const scrollContainer = document.querySelector('.build-page__canvas')
              if (!el || !scrollContainer) return
              const containerRect = scrollContainer.getBoundingClientRect()
              const elRect = el.getBoundingClientRect()
              const targetY = scrollContainer.scrollTop + elRect.top - containerRect.top - containerRect.height / 2 + elRect.height / 2
              scrollContainer.scrollTo({ top: targetY, behavior: 'smooth' })
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
        />
      )}
      </div>
      )}

      {/* Right Panel - Designer/Properties or Live Preview */}
      <aside className={`build-page__right ${isLivePreviewVisible || rightPanel === 'designer' ? '' : 'build-page__right--hidden'}`}>

        {/* Sliding content wrapper */}
        <div className={`build-page__right-slider${sliderMode === 'designer' ? ' build-page__right-slider--designer' : ''}${skipSliderTransition ? ' build-page__right-slider--no-transition' : ''}`}>

          {/* Slide 1: Live Preview / Properties */}
          <div className="build-page__right-slide">
            {/* Properties Panel */}
            {rightPanel === 'properties' && selectedElement && selectedComponent ? (
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
                  ) : (
                    <span className="property-panel__title">{selectedComponent.name}</span>
                  )}
                  <div className="property-panel__header-actions">
                    {!(selectedComponent.id === 'product-list' && propertyTab === 'products' && editingProductIndex !== null) && selectedElement.id !== APP_HEADER_ID && (
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

                {!(selectedComponent.id === 'product-list' && propertyTab === 'products' && editingProductIndex !== null) && (
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
                            : (selectedComponent.id === 'button' || selectedComponent.id === 'image')
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
                          <DSFormField title="App Title" size="md" showDescription={false} showHelpText={false}>
                            <DSInput
                              value={appTitle}
                              onChange={(e) => setAppTitle(e.target.value)}
                            />
                          </DSFormField>
                        </div>
                        <div className="property-panel__field">
                          <DSFormField title="App Description" size="md" showDescription={false} showHelpText={false}>
                            <DSTextArea
                              size="md"
                              maxLength={240}
                              showCount
                              showDrag={false}
                              placeholder="Add description"
                              value={appSubtitle}
                              onChange={(e) => setAppSubtitle(e.target.value)}
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
                      ? propertyTab === 'style'
                      : isCard
                        ? (propertyTab === 'layout' || propertyTab === 'action')
                        : isList
                          ? (propertyTab === 'general' || propertyTab === 'layout')
                          : isSocialFollow
                            ? false
                            : propertyTab === 'general'

                  const cardTabVariants = propertyTab === 'layout' ? CARD_LAYOUT_VARIANTS : []
                  const cardTabProps = propertyTab === 'layout' ? CARD_LAYOUT_PROPS : []

                  const LIST_ACTION_VARIANTS = ['Action', 'Icon Filled', 'Card Action', 'Card Icon Filled']
                  const LIST_LAYOUT_VARIANTS = ['Layout', 'Image Style', 'Size', 'Card Image Style', 'Card Layout', 'Card Size']

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
                      return propertyTab === 'general'
                    })
                    .filter((prop) => {
                      if (!prop.showWhen) return true
                      return Object.entries(prop.showWhen).every(
                        ([key, val]) => selectedElement.variants[key] === val || selectedElement.properties[key] === val
                      )
                    })

                  if (visibleVariants.length === 0 && visibleProps.length === 0) {
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
                          <div className="property-panel__field property-panel__field--inline">
                            <DSFormField
                              title="Show Background"
                              description="Show a colored background behind the header."
                              size="md"
                              showDescription
                              showHelpText={false}
                            >
                              <DSToggle size="md" defaultChecked />
                            </DSFormField>
                          </div>
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
                          <div className="property-panel__field">
                            <DSFormField title="Text Color" size="md" showDescription={false} showHelpText={false}>
                              <ColorInputWithPicker
                                size="md"
                                color={appHeaderState.textColor}
                                onColorChange={(val) => setAppHeaderState((s) => ({ ...s, textColor: val }))}
                              />
                            </DSFormField>
                          </div>
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
                        </>
                      )}
                      {visibleVariants.map(([group, config]) => (
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

                      {visibleProps.map((prop) => (
                        <div key={prop.name} className="property-panel__field">
                          <DSFormField title={prop.name} size="md" showDescription={false} showHelpText={false}>
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
                                value={String(selectedElement.properties[prop.name] || '')}
                                onChange={(val) =>
                                  handlePropertyChange(selectedElement.id, prop.name, val)
                                }
                              />
                            ) : (
                              <DSInput
                                value={String(selectedElement.properties[prop.name] || '')}
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
                          { value: 'anyone', label: 'Anyone', leading: <span className="live-preview__role-dot" style={{ background: 'var(--green-200)' }} /> },
                          { value: 'admin', label: 'Admin', leading: <span className="live-preview__role-dot" style={{ background: 'var(--purple-200)' }} /> },
                          { value: 'user', label: 'User', leading: <span className="live-preview__role-dot" style={{ background: 'var(--blue-200)' }} /> },
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
                      <div className={`live-preview__top-header app-scope${isPreviewContentScrolled ? ' live-preview__top-header--scrolled' : ''}`}>
                        {(() => {
                          const isFirstPage = activePageId === pages[0]?.id
                          const showCompact = isFirstPage && appHeaderState.show && isPreviewContentScrolled
                          if (showCompact) {
                            return (
                              <div className="live-preview__top-header-compact">
                                {appHeaderState.imageStyle !== 'None' && (
                                  <div className={`live-preview__top-header-compact-icon${appHeaderState.imageStyle === 'Image' && appHeaderState.imageUrl ? ' live-preview__top-header-compact-icon--image' : ''}`}>
                                    {appHeaderState.imageStyle === 'Image' && appHeaderState.imageUrl ? (
                                      <img src={appHeaderState.imageUrl} alt="" />
                                    ) : (
                                      <AppIcon name={appHeaderState.icon} size={24} />
                                    )}
                                  </div>
                                )}
                                <span className="live-preview__top-header-compact-title">{appTitle}</span>
                              </div>
                            )
                          }
                          const activePage = pages.find((p) => p.id === activePageId)
                          return isMorePageOpen ? (
                            <div className="live-preview__top-header-page">
                              <span className="live-preview__top-header-page-name">Menu</span>
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
                              <button
                                type="button"
                                className="live-preview__top-header-avatar-btn"
                                aria-label="Account menu"
                                onClick={() => setIsAvatarPopoverOpen((v) => !v)}
                              >
                                <img
                                  className="live-preview__top-header-avatar"
                                  src={previewUserAvatar}
                                  alt=""
                                  aria-hidden="true"
                                />
                              </button>
                              <LivePreviewAvatarPopover
                                open={isAvatarPopoverOpen}
                                onClose={() => setIsAvatarPopoverOpen(false)}
                              />
                            </>
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
                          open={isLoginPopoverOpen}
                          onClose={() => setIsLoginPopoverOpen(false)}
                          onLoggedIn={() => setIsPreviewLoggedIn(true)}
                        />
                      )}
                      <div ref={setPreviewContentScalerEl} className="live-preview__content-scaler app-scope">
                        <div className="live-preview__content app-scope">
                          {isMorePageOpen ? (
                            <LivePreviewMorePagesView
                              pages={pages}
                              onPageSelect={handleMorePageSelect}
                              isLoggedIn={isPreviewLoggedIn}
                              onLoginClick={() => { setLoginPopoverView('login'); setIsLoginPopoverOpen(true) }}
                              onSignUpClick={() => { setLoginPopoverView('signup'); setIsLoginPopoverOpen(true) }}
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
                                  icon={appHeaderState.icon}
                                  imageStyle={appHeaderState.imageStyle}
                                  imageUrl={appHeaderState.imageUrl}
                                  textColor={appHeaderState.textColor}
                                  backgroundImageUrl={appHeaderState.backgroundImageUrl}
                                  skeleton={appHeaderState.skeleton}
                                  title={appTitle}
                                  subtitle={appSubtitle}
                                  actions={headerActions.map((el) => {
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
                              <div className={`themes-view__canvas${isFirstPage ? ' themes-view__canvas--first' : ''}`}>
                                <div className="themes-view__app">
                                  {activePage.elements.map((element) => {
                                    const comp = ComponentRegistry.get(element.componentId)
                                    if (!comp) return null
                                    const previewProps = {
                                      ...element.properties,
                                      'Add New Card': false,
                                      // Strip Shrinked in mobile preview so elements stretch full-width.
                                      // Button keeps its shrinked state — a full-width button is worse than a compact one.
                                      Shrinked: element.componentId === 'button' ? element.properties['Shrinked'] : false,
                                    }
                                    const isButtonShrinked = element.componentId === 'button' && element.properties['Shrinked'] === true
                                    return (
                                      <section key={element.id} className={`themes-view__section${isButtonShrinked ? ' themes-view__section--shrinked' : ''}`}>
                                        {comp.render(element.variants, previewProps, element.states)}
                                      </section>
                                    )
                                  })}
                                </div>
                              </div>
                              {isFirstPage && !isPreviewCartOpen && !isPreviewCheckoutOpen && (
                                <div className="themes-view__attribution-footer">
                                  <AttributionBar openAiSheetOnMount={openAttributionSheet} />
                                </div>
                              )}
                              </>
                            ) : null
                          })()}
                        </div>
                      </div>
                      {pages.length > 1 && !isPreviewCartOpen && !isPreviewCheckoutOpen && (
                        <div className="live-preview__bottom-nav app-scope">
                          <BottomNavigation
                            items={bottomNavItems}
                            activeIndex={bottomNavActiveIndex}
                            onItemClick={handleBottomNavClick}
                          />
                        </div>
                      )}
                      <img src={phoneHomeIndicator} alt="" className="live-preview__home-indicator" />
                      <FormSheet />
                      <LivePreviewMenuDrawer
                        open={isPreviewMenuOpen}
                        onClose={() => setIsPreviewMenuOpen(false)}
                        pages={pages}
                        activePageId={activePageId}
                        onPageSelect={setActivePageId}
                        appTitle={appTitle}
                        appHeader={appHeaderState}
                      />
                      <LivePreviewCartPage
                        open={isPreviewCartOpen}
                        onClose={() => setIsPreviewCartOpen(false)}
                        onContinue={() => setIsPreviewCheckoutOpen(true)}
                        avatarUrl={previewUserAvatar}
                      />
                      <LivePreviewCheckoutPage
                        open={isPreviewCheckoutOpen}
                        onClose={() => setIsPreviewCheckoutOpen(false)}
                        avatarUrl={previewUserAvatar}
                      />
                      <LivePreviewOrderBar
                        hidden={isPreviewCartOpen || isPreviewCheckoutOpen}
                        hasBottomNav={pages.length > 1}
                        onClick={() => setIsPreviewCheckoutOpen(true)}
                      />
                      </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
