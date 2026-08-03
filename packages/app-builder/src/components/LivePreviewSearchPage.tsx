import { type FormEvent, type KeyboardEvent, type PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppIcon } from '@jf/app-elements'
import { Icon as DSIcon } from '@jf/design-system'

export interface SearchSourceElement {
  id?: string
  componentId?: string
  variants?: Record<string, unknown>
  properties?: Record<string, unknown>
}

export interface SearchSourcePage {
  id?: string
  name: string
  icon?: string
  hidden?: boolean
  dynamic?: boolean
  dynamicSourceElementId?: string
  elements?: SearchSourceElement[]
}

export type SearchResultTarget =
  | { type: 'page', pageId: string, elementId?: string }
  | { type: 'element', pageId: string, elementId: string }
  | { type: 'dynamic-item', pageId: string, elementId: string, itemIndex: number }
  | { type: 'product-item', pageId: string, elementId: string, itemIndex: number }
  | { type: 'form', pageId: string, elementId: string, fieldName?: string, openForm?: boolean }

type SearchMatchImageShape = 'square' | 'rounded' | 'circle'

export type SearchMatchVisual =
  | { type: 'icon', name: string }
  | { type: 'design-icon', name: string, category: string }
  | { type: 'image', src: string, shape?: SearchMatchImageShape }

export interface SearchSourceAction {
  id: string
  title: string
  description?: string
  target: SearchResultTarget
  sourceTarget?: SearchResultTarget
  visual?: SearchMatchVisual
  searchText?: string
  sourceSearchText?: string
}

export interface SearchMatchResult {
  id: string
  title: string
  description: string
  matchContext?: string
  category: SearchResultCategory
  visual: SearchMatchVisual
  target: SearchResultTarget
}

type LivePreviewSearchPresentation = 'page' | 'desktop-context' | 'desktop-modal'

interface LivePreviewSearchPageProps {
  onClose: () => void
  onResultSelect?: (target: SearchResultTarget) => void
  appTitle?: string
  appSubtitle?: string
  pages?: SearchSourcePage[]
  searchActions?: SearchSourceAction[]
  initialQuery?: string
  externalQuery?: string
  onQueryChange?: (query: string) => void
  presentation?: LivePreviewSearchPresentation
  showHeader?: boolean
}

const APP_TITLE_PLACEHOLDER = 'New App'
const APP_DESCRIPTION_PLACEHOLDER = 'Add a short description to tell people what your app does.'
const FEATURED_SEARCH_LIMIT = 10
const FEATURED_SEARCH_MAX_WORDS = 2
const RECENT_SEARCH_LIMIT = 10
const RECENT_SEARCH_STORAGE_PREFIX = 'jf-live-preview-search-recent'
const SEARCH_DESCRIPTION_MAX_LENGTH = 96
const SEARCH_RESULT_IMAGE_KEYS = ['image', 'Image', 'Image URL', 'photo', 'Photo', 'avatar', 'Avatar', 'thumbnail', 'Thumbnail']
const SEARCH_RESULT_ICON_KEYS = ['Icon', 'Left Icon', 'Right Icon', 'Action Icon', 'icon']

type SearchResultCategory =
  | 'pages'
  | 'forms'
  | 'tables'
  | 'sign-documents'
  | 'reports'
  | 'sendbox'
  | 'documents'
  | 'content'
type SearchResultFilter = 'all' | SearchResultCategory

const SEARCH_RESULT_CATEGORY_ORDER: SearchResultCategory[] = [
  // Page matches are represented by the consolidated Search results section,
  // so they are intentionally excluded from the typed result sections below.
  'forms',
  'tables',
  'sign-documents',
  'reports',
  'sendbox',
  'documents',
]
const SEARCH_RESULT_CATEGORY_LABELS: Record<SearchResultCategory, string> = {
  pages: 'PAGES',
  forms: 'FORMS',
  tables: 'TABLES',
  'sign-documents': 'SIGN DOCUMENTS',
  reports: 'REPORTS',
  sendbox: 'SENDBOX',
  documents: 'DOCUMENTS',
  content: 'SEARCH RESULTS',
}
const SEARCH_RESULT_FILTER_LABELS: Record<SearchResultCategory, string> = {
  pages: 'Pages',
  forms: 'Forms',
  tables: 'Tables',
  'sign-documents': 'Sign Documents',
  reports: 'Reports',
  sendbox: 'Sendbox',
  documents: 'Document',
  content: 'Content',
}
const SEARCH_RESULT_DESCRIPTION_FALLBACKS: Partial<Record<SearchResultCategory, string>> = {
  pages: 'Go to page',
  forms: 'Fill out the form',
  tables: 'Open table',
  'sign-documents': 'Open sign document',
  reports: 'Open report',
  sendbox: 'Open inbox',
  documents: 'Open document',
}

const GENERIC_SEARCH_PHRASES = new Set([
  'new app',
  'home',
  'get started',
  'cards',
  'list',
  'table',
  'title',
  'title 1',
  'title 2',
  'title 3',
  'description',
  'description 1',
  'description 2',
  'description 3',
  'add a short description to tell people what your app does',
])

const GENERIC_RESULT_VALUES = new Set([
  '',
  'button',
  'card description',
  'card title',
  'choose a file',
  'description',
  'description 1',
  'description 2',
  'description 3',
  'edit',
  'element',
  'form',
  'heading',
  'image',
  'new table',
  'submit',
  'table',
  'title',
  'title 1',
  'title 2',
  'title 3',
  'type a description',
])

const SEARCH_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'app',
  'are',
  'for',
  'from',
  'get',
  'has',
  'have',
  'here',
  'into',
  'new',
  'our',
  'page',
  'short',
  'that',
  'the',
  'this',
  'to',
  'what',
  'with',
  'your',
])

const COMPONENT_KEYWORDS: Record<string, string> = {
  'product-list': 'Products',
  donation: 'Donation',
  faq: 'FAQ',
  form: 'Form',
  testimonial: 'Testimonials',
}

const COMPONENT_RESULT_LABELS: Record<string, string> = {
  banner: 'Banner',
  button: 'Button',
  card: 'Card',
  chart: 'Chart',
  document: 'Document',
  faq: 'FAQ',
  form: 'Form',
  heading: 'Heading',
  image: 'Image',
  'image-gallery': 'Image gallery',
  list: 'List',
  paragraph: 'Text',
  'product-list': 'Product',
  'sign-document': 'Sign Document',
  table: 'Table',
  testimonial: 'Testimonial',
}

const COMPONENT_RESULT_ICONS: Record<string, string> = {
  button: 'Pointer',
  card: 'Layout',
  chart: 'Table2',
  document: 'FileText',
  faq: 'CircleQuestionMark',
  form: 'ClipboardList',
  heading: 'Type',
  image: 'Image',
  'image-gallery': 'Grid2x2',
  list: 'List',
  paragraph: 'Type',
  'product-list': 'Package',
  'sign-document': 'FilePenLine',
  table: 'Table2',
  testimonial: 'MessageCircle',
}

const SEARCH_RESULT_ICON_ALIASES: Record<string, string> = {
  HelpCircle: 'CircleQuestionMark',
  CircleHelp: 'CircleQuestionMark',
}

const DEFAULT_SEARCH_PAGE_ICON = 'FileText'

const getSearchResultIconName = (iconName: string) => (
  SEARCH_RESULT_ICON_ALIASES[iconName] ?? iconName
)

const SEARCH_PROPERTY_KEYS = ['Heading', 'Title', 'Label', 'Text', 'Description', 'Subheading', 'Button Text']
const SEARCH_RESULT_SOURCE_VISIBLE_PROPERTY_KEYS = [
  'Heading',
  'Subheading',
  'Subtitle',
  'Title',
  'Label',
  'Text',
  'Description',
  'Button Label',
  'Button Text',
  'Alt Text',
]
const SEARCH_RESULT_FORM_VISIBLE_PROPERTY_KEYS = [
  'Form Title',
  'Form Description',
  'Form Submit Label',
  'Submit Label',
  'Label',
  'Description',
]
const SEARCH_RESULT_ITEM_VISIBLE_KEYS = [
  'title',
  'name',
  'label',
  'question',
  'description',
  'text',
  'answer',
  'details',
  'category',
  'price',
  'Title',
  'Name',
  'Label',
  'Question',
  'Description',
  'Text',
  'Answer',
  'Details',
  'Category',
  'Price',
]
const SEARCH_RESULT_FORM_FIELD_VISIBLE_KEYS = [
  'label',
  'name',
  'placeholder',
  'options',
  'Label',
  'Name',
  'Placeholder',
  'Options',
]
const NAVIGATION_ACTION_KEYS = ['Action', 'Button Action', 'Card Action', 'Click Action']
const NAVIGATION_PAGE_PROPERTY_KEYS = [
  'Action Page',
  'Action Page ID',
  'Destination Page',
  'Navigate Page',
  'Navigate To Page',
  'Page',
  'Page ID',
  'Page to Open',
  'Target Page',
  'Target Page ID',
]
const SEARCH_TEXT_SEPARATOR_REGEX = /\s*(?:[·•,&/|+]|\s[-–—]\s)\s*/

const getNormalizedSearchIndex = (value: string) => {
  const chars: string[] = []
  const sourceIndexes: number[] = []
  let sourceIndex = 0

  Array.from(value).forEach((char) => {
    const currentSourceIndex = sourceIndex
    sourceIndex += char.length

    if (/['"“”‘’]/.test(char)) return

    const normalizedChar = /[a-z0-9ğüşöçıİĞÜŞÖÇ-]/i.test(char)
      ? char.toLocaleLowerCase()
      : ' '

    if (/\s/.test(normalizedChar)) {
      if (chars.length === 0 || chars[chars.length - 1] === ' ') return
      chars.push(' ')
      sourceIndexes.push(currentSourceIndex)
      return
    }

    chars.push(normalizedChar)
    sourceIndexes.push(currentSourceIndex)
  })

  if (chars[chars.length - 1] === ' ') {
    chars.pop()
    sourceIndexes.pop()
  }

  return {
    text: chars.join(''),
    sourceIndexes,
  }
}

const normalizeSearchPhrase = (value: string) => (
  getNormalizedSearchIndex(value).text
)

const toTitleCase = (value: string) => (
  value
    .trim()
    .split(/\s+/)
    .map((word) => (
      /^[A-Z0-9]{2,}$/.test(word)
        ? word
        : `${word.charAt(0).toLocaleUpperCase()}${word.slice(1)}`
    ))
    .join(' ')
)

const splitSearchText = (value: string) => (
  value
    .split(SEARCH_TEXT_SEPARATOR_REGEX)
    .map((item) => item.trim())
    .filter(Boolean)
)

const getRecentSearchStorageKey = (appTitle?: string) => (
  `${RECENT_SEARCH_STORAGE_PREFIX}:${normalizeSearchPhrase(appTitle || APP_TITLE_PLACEHOLDER) || 'app'}`
)

const readRecentSearches = (storageKey: string) => {
  if (typeof window === 'undefined') return []

  try {
    const parsedValue = JSON.parse(window.sessionStorage.getItem(storageKey) || '[]') as unknown
    if (!Array.isArray(parsedValue)) return []

    return parsedValue
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .slice(0, RECENT_SEARCH_LIMIT)
  } catch {
    return []
  }
}

const writeRecentSearches = (storageKey: string, searches: string[]) => {
  if (typeof window === 'undefined') return

  try {
    if (searches.length === 0) {
      window.sessionStorage.removeItem(storageKey)
      return
    }

    window.sessionStorage.setItem(storageKey, JSON.stringify(searches.slice(0, RECENT_SEARCH_LIMIT)))
  } catch {
    // Search history is helpful state only; failing storage should not block search.
  }
}

const isUsefulSearchPhrase = (value: string) => {
  const normalized = normalizeSearchPhrase(value)
  if (!normalized || GENERIC_SEARCH_PHRASES.has(normalized)) return false
  if (/^https?:\/\//i.test(value) || /^data:/i.test(value) || /^#[0-9a-f]{3,8}$/i.test(value)) return false
  if (/^\d+$/.test(normalized)) return false

  const words = normalized.split(' ').filter(Boolean)
  if (words.length === 0 || words.length > FEATURED_SEARCH_MAX_WORDS) return false
  if (words.every((word) => SEARCH_STOP_WORDS.has(word) || word.length < 3)) return false

  return true
}

const pushSearchCandidate = (keywords: string[], seen: Set<string>, value: unknown) => {
  if (typeof value !== 'string') return
  const trimmed = value.trim()
  if (!isUsefulSearchPhrase(trimmed)) return

  const normalized = normalizeSearchPhrase(trimmed)
  if (seen.has(normalized)) return

  seen.add(normalized)
  keywords.push(toTitleCase(trimmed))
}

const pushTextSearchCandidates = (keywords: string[], seen: Set<string>, value: unknown) => {
  if (typeof value !== 'string') return
  const trimmed = value.trim()
  if (!trimmed || trimmed === APP_DESCRIPTION_PLACEHOLDER) return

  const searchTerms = splitSearchText(trimmed)
  if (searchTerms.length > 1) {
    searchTerms.forEach((term) => pushSearchCandidate(keywords, seen, term))
    return
  }

  pushSearchCandidate(keywords, seen, trimmed)
}

const collectItemSearchCandidates = (keywords: string[], seen: Set<string>, value: unknown) => {
  if (typeof value !== 'string' || !value.trim().startsWith('[')) return

  try {
    const items = JSON.parse(value) as Array<Record<string, unknown>>
    if (!Array.isArray(items)) return

    items.slice(0, 4).forEach((item) => {
      pushTextSearchCandidates(keywords, seen, item.title)
      pushTextSearchCandidates(keywords, seen, item.name)
      pushTextSearchCandidates(keywords, seen, item.category)
      pushTextSearchCandidates(keywords, seen, item.description)
    })
  } catch {
    // Ignore non-JSON strings; they are handled by the normal text extraction path.
  }
}

export const deriveFeaturedSearches = ({
  appTitle,
  appSubtitle,
  pages = [],
  searchActions = [],
}: {
  appTitle?: string
  appSubtitle?: string
  pages?: SearchSourcePage[]
  searchActions?: SearchSourceAction[]
}) => {
  const keywords: string[] = []
  const seen = new Set<string>()

  // Suggestions should help people discover real app content, rather than
  // repeat the current app name or page-navigation labels such as “Field Requests”.
  void appTitle
  void appSubtitle

  pages.forEach((page) => {
    page.elements?.forEach((element) => {
      if (element.componentId) {
        pushSearchCandidate(keywords, seen, COMPONENT_KEYWORDS[element.componentId])
      }

      const properties = element.properties ?? {}
      SEARCH_PROPERTY_KEYS.forEach((key) => {
        pushTextSearchCandidates(keywords, seen, properties[key])
      })
      collectItemSearchCandidates(keywords, seen, properties.Items)
    })
  })

  searchActions.forEach((action) => {
    pushTextSearchCandidates(keywords, seen, action.title)
    pushTextSearchCandidates(keywords, seen, action.description)
    pushTextSearchCandidates(keywords, seen, action.searchText)
  })

  if (keywords.length === 0) {
    pages
      .filter((page) => !page.hidden && !page.dynamic)
      .flatMap((page) => page.elements ?? [])
      .some((element) => {
        const properties = element.properties ?? {}
        const candidate = SEARCH_PROPERTY_KEYS
          .map((key) => getCleanSearchResultText(properties[key]))
          .find(isUsefulSearchPhrase)
        if (!candidate) return false
        pushSearchCandidate(keywords, seen, candidate)
        return true
      })
  }

  return keywords.slice(0, FEATURED_SEARCH_LIMIT)
}

const getCleanSearchResultText = (value: unknown) => {
  if (typeof value !== 'string') return ''
  const trimmed = value.replace(/\s+/g, ' ').trim()
  if (!trimmed || trimmed === APP_DESCRIPTION_PLACEHOLDER) return ''
  if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed) || /^#[0-9a-f]{3,8}$/i.test(trimmed)) return ''
  if (GENERIC_RESULT_VALUES.has(normalizeSearchPhrase(trimmed))) return ''
  return trimmed
}

const parseSearchJsonItems = (value: unknown): Array<Record<string, unknown>> => {
  if (typeof value !== 'string' || !value.trim().startsWith('[')) return []

  try {
    const parsedValue = JSON.parse(value) as unknown
    if (!Array.isArray(parsedValue)) return []
    return parsedValue.filter((item): item is Record<string, unknown> => (
      item !== null && typeof item === 'object' && !Array.isArray(item)
    ))
  } catch {
    return []
  }
}

const getItemText = (item: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = getCleanSearchResultText(item[key])
    if (value) return value
  }

  return ''
}

const getRecordSearchCorpus = (record: Record<string, unknown>, keys: string[]) => (
  keys
    .flatMap((key) => {
      const value = record[key]
      if (Array.isArray(value)) return value.map((item) => String(item ?? ''))
      return typeof value === 'string' || typeof value === 'number' ? [String(value)] : []
    })
    .join(' ')
)

const getItemSearchCorpus = (item: Record<string, unknown>) => (
  getRecordSearchCorpus(item, SEARCH_RESULT_ITEM_VISIBLE_KEYS)
)

const getFormFieldSearchCorpus = (field: Record<string, unknown>) => (
  getRecordSearchCorpus(field, SEARCH_RESULT_FORM_FIELD_VISIBLE_KEYS)
)

const getStringValue = (value: unknown) => (
  typeof value === 'string' ? value.trim() : ''
)

const getImageValue = (value: unknown) => {
  const imageValue = getStringValue(value)
  if (!imageValue) return ''
  if (/^(https?:\/\/|data:image\/|blob:)/i.test(imageValue)) return imageValue
  return ''
}

const getImageFromRecord = (record: Record<string, unknown>) => {
  for (const key of SEARCH_RESULT_IMAGE_KEYS) {
    const imageValue = getImageValue(record[key])
    if (imageValue) return imageValue
  }

  return ''
}

const getFirstItemImageFromRecord = (record: Record<string, unknown>) => (
  [
    ...parseSearchJsonItems(record.Items),
    ...parseSearchJsonItems(record.Products),
  ].map(getImageFromRecord).find(Boolean) || ''
)

const getVisualStyleValue = (value: unknown) => {
  const styleValue = getStringValue(value)
  if (!styleValue || styleValue === 'none') return ''
  return styleValue
}

const getFirstRecordValue = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = getVisualStyleValue(record[key])
    if (value) return value
  }

  return ''
}

const getIconVisualFromRecord = (
  record: Record<string, unknown>,
  fallbackIcon: string,
): SearchMatchVisual => {
  const iconName = getFirstRecordValue(record, SEARCH_RESULT_ICON_KEYS) || fallbackIcon

  return {
    type: 'icon',
    name: getSearchResultIconName(iconName),
  }
}

const getPageVisual = (page: SearchSourcePage): SearchMatchVisual => ({
  type: 'icon',
  name: getSearchResultIconName(page.icon || DEFAULT_SEARCH_PAGE_ICON),
})

const getSearchMatchImageShape = (value: unknown, squareShape?: SearchMatchImageShape) => {
  const shapeValue = getStringValue(value).toLowerCase()
  if (shapeValue === 'circle') return 'circle'
  if (shapeValue === 'rounded') return 'rounded'
  if (shapeValue === 'square') return squareShape
  return undefined
}

const getElementImageShape = (
  componentId: string | undefined,
  variants: Record<string, unknown> | undefined,
): SearchMatchImageShape | undefined => {
  if (!variants) return undefined

  if (componentId === 'image') {
    return getSearchMatchImageShape(variants['Image Shape'], 'square')
  }

  if (componentId === 'list') {
    return getSearchMatchImageShape(
      variants['Layout'] === 'Card' ? variants['Card Image Style'] : variants['Image Style'],
    )
  }

  if (componentId === 'card') {
    return getSearchMatchImageShape(variants['Image Style'])
  }

  return undefined
}

const getElementVisual = (
  componentId: string | undefined,
  properties: Record<string, unknown>,
  variants?: Record<string, unknown>,
): SearchMatchVisual => {
  if (componentId === 'table') {
    return {
      type: 'design-icon',
      name: 'product-tables-filled',
      category: 'products',
    }
  }

  const imageValue = getImageFromRecord(properties)
    || (componentId === 'list' ? '' : getFirstItemImageFromRecord(properties))
  if (imageValue) {
    return { type: 'image', src: imageValue, shape: getElementImageShape(componentId, variants) }
  }

  return getIconVisualFromRecord(properties, COMPONENT_RESULT_ICONS[componentId || ''] || 'Layers')
}

const getItemVisual = (
  item: Record<string, unknown>,
  fallbackIcon = 'List',
  imageShape?: SearchMatchImageShape,
): SearchMatchVisual => {
  const imageValue = getImageFromRecord(item)
  if (imageValue) return { type: 'image', src: imageValue, shape: imageShape }

  return getIconVisualFromRecord(item, fallbackIcon)
}

const getElementSearchCategory = (
  componentId: string | undefined,
  hasFormConfig: boolean,
  properties: Record<string, unknown> = {},
): SearchResultCategory => {
  const categoryOverride = getStringValue(properties['Search Category']).trim().toLocaleLowerCase()
  if (categoryOverride === 'sendbox') return 'sendbox'
  if (categoryOverride === 'reports') return 'reports'
  if (categoryOverride === 'tables') return 'tables'
  if (categoryOverride === 'sign documents') return 'sign-documents'
  if (categoryOverride === 'documents') return 'documents'
  if (componentId === 'sign-document') return 'sign-documents'
  if (componentId === 'table') return 'tables'
  if (componentId === 'chart') return 'reports'
  if (componentId === 'document') return 'documents'
  if (componentId === 'inbox' || componentId === 'sendbox') return 'sendbox'
  if (hasFormConfig) return 'forms'
  return 'content'
}

const hasOpenFormAction = (properties: Record<string, unknown>) => (
  properties.Action === 'Open Form'
  || properties['Button Action'] === 'Open Form'
  || properties['Card Action'] === 'Open Form'
)

const shouldOpenFormTarget = (componentId: string | undefined, variants: Record<string, unknown> | undefined, properties: Record<string, unknown>) => {
  if (componentId === 'form') return variants?.['Layout Type'] !== 'Form'
  return hasOpenFormAction(properties)
}

const getDynamicPageForElement = (pages: SearchSourcePage[], elementId: string) => (
  pages.find((page) => page.dynamic && page.dynamicSourceElementId === elementId)
)

const getElementVisibleSearchCorpus = (element: SearchSourceElement) => {
  const properties = element.properties ?? {}
  const sourceText = getRecordSearchCorpus(properties, SEARCH_RESULT_SOURCE_VISIBLE_PROPERTY_KEYS)
  const itemText = [
    ...parseSearchJsonItems(properties.Items),
    ...parseSearchJsonItems(properties.Products),
  ].map(getItemSearchCorpus)

  if (element.componentId !== 'form') {
    return [sourceText, ...itemText].filter(Boolean).join(' ')
  }

  const formText = getRecordSearchCorpus(properties, SEARCH_RESULT_FORM_VISIBLE_PROPERTY_KEYS)
  const fieldText = parseSearchJsonItems(properties['Form Fields']).map(getFormFieldSearchCorpus)
  return [sourceText, formText, ...fieldText, ...itemText].filter(Boolean).join(' ')
}

const getFormVisibleSearchCorpus = (
  properties: Record<string, unknown>,
  formTitle: string,
  formDescription: string,
  formFields: Array<Record<string, unknown>>,
) => (
  [
    formTitle,
    formDescription,
    getRecordSearchCorpus(properties, SEARCH_RESULT_FORM_VISIBLE_PROPERTY_KEYS),
    ...formFields.map(getFormFieldSearchCorpus),
  ].filter(Boolean).join(' ')
)

const getPageVisibleSearchCorpus = (page: SearchSourcePage) => (
  [
    page.name,
    ...(page.elements ?? []).map(getElementVisibleSearchCorpus),
  ].filter(Boolean).join(' ')
)

const getFirstMatchingElementId = (
  page: SearchSourcePage,
  normalizedSearchText: string,
) => (
  page.elements?.find((element) => (
    element.id
    && textMatchesSearch(getElementVisibleSearchCorpus(element), normalizedSearchText)
  ))?.id
)

const getFirstVisibleElementId = (page: SearchSourcePage) => (
  page.elements?.find((element) => element.id && getElementVisibleSearchCorpus(element))?.id
  ?? page.elements?.find((element) => element.id)?.id
)

const getBestPageTargetElementId = (
  page: SearchSourcePage,
  normalizedSearchText: string,
) => (
  getFirstMatchingElementId(page, normalizedSearchText)
  ?? getFirstVisibleElementId(page)
)

const getFirstMatchingFormFieldName = (
  formFields: Array<Record<string, unknown>>,
  normalizedSearchText: string,
) => {
  const matchingField = formFields.find((field) => textMatchesSearch(getFormFieldSearchCorpus(field), normalizedSearchText))
  if (!matchingField) return undefined

  return getStringValue(matchingField.name)
    || getStringValue(matchingField.Name)
    || getItemText(matchingField, ['label', 'Label'])
    || undefined
}

const hasNavigateToPageAction = (properties: Record<string, unknown>) => (
  NAVIGATION_ACTION_KEYS.some((key) => getStringValue(properties[key]) === 'Navigate to Page')
)

const getNavigationPageReference = (properties: Record<string, unknown>) => {
  for (const key of NAVIGATION_PAGE_PROPERTY_KEYS) {
    const value = getStringValue(properties[key])
    if (value) return value
  }

  return ''
}

const findPageByReference = (pages: SearchSourcePage[], pageReference: string) => {
  const cleanReference = pageReference.trim().replace(/^page:/i, '')
  if (!cleanReference) return undefined

  const normalizedReference = normalizeSearchPhrase(cleanReference)

  return pages.find((page) => page.id === cleanReference)
    ?? pages.find((page) => normalizeSearchPhrase(page.name) === normalizedReference)
}

const getElementNavigationPage = (
  pages: SearchSourcePage[],
  element: SearchSourceElement,
) => {
  const properties = element.properties ?? {}

  if (element.componentId === 'list' && getStringValue(properties['Click Action']) === 'Open Dynamic Page' && element.id) {
    return getDynamicPageForElement(pages, element.id)
  }

  if (!hasNavigateToPageAction(properties)) return undefined

  const pageReference = getNavigationPageReference(properties)
  if (!pageReference) return undefined

  return findPageByReference(pages, pageReference)
}

const getSearchResultTargetPriority = (target: SearchResultTarget) => {
  if (target.type === 'dynamic-item' || target.type === 'product-item') return 4
  if (target.type === 'form') return 3
  if (target.type === 'element') return 2
  return 1
}

const textMatchesSearch = (value: string, normalizedSearchText: string) => {
  if (!normalizedSearchText) return false
  const normalizedValue = normalizeSearchPhrase(value)
  if (!normalizedValue) return false
  return normalizedValue.includes(normalizedSearchText) || normalizedSearchText.includes(normalizedValue)
}

const pageNameMatchesSearch = (page: SearchSourcePage, normalizedSearchText: string) => {
  if (!normalizedSearchText) return false
  const normalizedPageName = normalizeSearchPhrase(page.name)
  return Boolean(normalizedPageName && normalizedPageName.includes(normalizedSearchText))
}

const getOriginalRangeFromNormalizedRange = (
  normalizedIndex: ReturnType<typeof getNormalizedSearchIndex>,
  start: number,
  length: number,
) => {
  const rangeStart = normalizedIndex.sourceIndexes[start]
  const rangeEndSourceIndex = normalizedIndex.sourceIndexes[start + length - 1]
  if (rangeStart === undefined || rangeEndSourceIndex === undefined) return undefined

  return {
    start: rangeStart,
    end: rangeEndSourceIndex + 1,
  }
}

const collectNormalizedMatchRanges = (
  normalizedIndex: ReturnType<typeof getNormalizedSearchIndex>,
  normalizedSearchText: string,
) => {
  const ranges: Array<{ start: number, end: number }> = []
  let cursor = 0
  let matchIndex = normalizedIndex.text.indexOf(normalizedSearchText, cursor)

  while (matchIndex !== -1) {
    const range = getOriginalRangeFromNormalizedRange(normalizedIndex, matchIndex, normalizedSearchText.length)
    if (range) ranges.push(range)
    cursor = matchIndex + normalizedSearchText.length
    matchIndex = normalizedIndex.text.indexOf(normalizedSearchText, cursor)
  }

  return ranges
}

const mergeSearchMatchRanges = (ranges: Array<{ start: number, end: number }>) => (
  ranges
    .filter((range) => range.end > range.start)
    .sort((a, b) => a.start - b.start)
    .reduce<Array<{ start: number, end: number }>>((mergedRanges, range) => {
      const lastRange = mergedRanges[mergedRanges.length - 1]
      if (!lastRange || range.start > lastRange.end) {
        mergedRanges.push({ ...range })
        return mergedRanges
      }

      lastRange.end = Math.max(lastRange.end, range.end)
      return mergedRanges
    }, [])
)

const getSearchMatchRanges = (text: string, searchText: string) => {
  const normalizedSearchText = normalizeSearchPhrase(searchText)
  if (!normalizedSearchText) return []

  const normalizedIndex = getNormalizedSearchIndex(text)
  if (!normalizedIndex.text) return []

  const phraseRanges = collectNormalizedMatchRanges(normalizedIndex, normalizedSearchText)
  if (phraseRanges.length > 0) return mergeSearchMatchRanges(phraseRanges)

  const tokenRanges = normalizedSearchText
    .split(' ')
    .filter((token) => token.length > 1)
    .flatMap((token) => collectNormalizedMatchRanges(normalizedIndex, token))

  return mergeSearchMatchRanges(tokenRanges)
}

const getSearchSnippetStart = (text: string, index: number) => {
  if (index <= 0) return 0
  const boundary = text.lastIndexOf(' ', index - 1)
  return boundary < 0 ? 0 : boundary + 1
}

const getSearchSnippetEnd = (text: string, index: number) => {
  if (index >= text.length) return text.length
  const boundary = text.indexOf(' ', index)
  return boundary < 0 ? text.length : boundary
}

const truncateSearchDescription = (
  description: string,
  searchText: string,
  maxLength = SEARCH_DESCRIPTION_MAX_LENGTH,
) => {
  const cleanDescription = description.replace(/\s+/g, ' ').trim()
  if (cleanDescription.length <= maxLength) return cleanDescription

  const matchRange = getSearchMatchRanges(cleanDescription, searchText)[0]

  if (!matchRange) {
    return `${cleanDescription.slice(0, maxLength).trim()}...`
  }

  const availableContextLength = Math.max(0, maxLength - (matchRange.end - matchRange.start))
  const leadingContextLength = Math.round(availableContextLength * 0.4)
  const trailingContextLength = availableContextLength - leadingContextLength
  const start = getSearchSnippetStart(cleanDescription, Math.max(0, matchRange.start - leadingContextLength))
  const end = getSearchSnippetEnd(cleanDescription, Math.min(cleanDescription.length, matchRange.end + trailingContextLength))
  const prefix = start > 0 ? '... ' : ''
  const suffix = end < cleanDescription.length ? '...' : ''

  return `${prefix}${cleanDescription.slice(start, end).trim()}${suffix}`
}

const getDisplayDescription = (
  category: SearchResultCategory,
  description: string,
  searchText: string,
) => {
  // Every result prefers its own description so the matching phrase can be
  // highlighted; component-specific action labels are only empty-state fallbacks.
  if (description) return truncateSearchDescription(description, searchText)
  return SEARCH_RESULT_DESCRIPTION_FALLBACKS[category] ?? ''
}

const getSearchMatchContext = (
  matchText: string,
  searchText: string,
  visibleText: string,
) => {
  if (!matchText || textMatchesSearch(visibleText, normalizeSearchPhrase(searchText))) return ''

  const matchExcerpt = truncateSearchDescription(matchText, searchText)
  return textMatchesSearch(matchExcerpt, normalizeSearchPhrase(searchText)) ? matchExcerpt : ''
}

const pushSearchResult = (
  results: SearchMatchResult[],
  seen: Set<string>,
  searchText: string,
  {
    id,
    title,
    description,
    category,
    visual,
    target,
    searchText: extraSearchText = '',
    matchText,
  }: {
    id: string
    title: unknown
    description?: unknown
    category: SearchResultCategory
    visual: SearchMatchVisual
    target: SearchResultTarget
    searchText?: string
    matchText?: string
  },
) => {
  const normalizedSearchText = normalizeSearchPhrase(searchText)
  const resultTitle = getCleanSearchResultText(title)
    || (category === 'forms' || category === 'sign-documents' ? getStringValue(title) : '')
  const resultDescription = getCleanSearchResultText(description)

  if (!resultTitle) return

  const searchCorpus = matchText ?? [resultTitle, resultDescription, extraSearchText].filter(Boolean).join(' ')
  if (!textMatchesSearch(searchCorpus, normalizedSearchText)) return

  const displayDescription = getDisplayDescription(category, resultDescription, searchText)
  const visibleText = [resultTitle, displayDescription].filter(Boolean).join(' ')
  const searchMatchContext = getSearchMatchContext(searchCorpus, searchText, visibleText)
  const matchContext = category === 'pages' || category === 'forms' ? '' : searchMatchContext
  if (!textMatchesSearch([visibleText, searchMatchContext].filter(Boolean).join(' '), normalizedSearchText)) return

  const normalizedKey = `${normalizeSearchPhrase(resultTitle)}:${normalizeSearchPhrase(displayDescription)}:${normalizeSearchPhrase(matchContext)}`
  if (seen.has(normalizedKey)) {
    const existingIndex = results.findIndex((result) => (
      `${normalizeSearchPhrase(result.title)}:${normalizeSearchPhrase(result.description)}:${normalizeSearchPhrase(result.matchContext || '')}` === normalizedKey
    ))
    const existingResult = existingIndex >= 0 ? results[existingIndex] : undefined
    if (existingResult && getSearchResultTargetPriority(target) > getSearchResultTargetPriority(existingResult.target)) {
      results[existingIndex] = {
        id,
        title: resultTitle,
        description: displayDescription,
        matchContext,
        category,
        visual,
        target,
      }
    }
    return
  }

  seen.add(normalizedKey)
  results.push({
    id,
    title: resultTitle,
    description: displayDescription,
    matchContext,
    category,
    visual,
    target,
  })
}

const pushNavigationPageResult = (
  results: SearchMatchResult[],
  seen: Set<string>,
  searchText: string,
  {
    id,
    targetPage,
    title,
    sourceTitle,
    description,
    matchText,
    target,
  }: {
    id: string
    targetPage: SearchSourcePage
    title?: string
    sourceTitle: string
    description?: string
    matchText: string
    target: SearchResultTarget
  },
) => {
  if (!targetPage.id) return
  const normalizedSearchText = normalizeSearchPhrase(searchText)
  if (!pageNameMatchesSearch(targetPage, normalizedSearchText)) return

  const targetPageTitle = getCleanSearchResultText(title) || getCleanSearchResultText(targetPage.name) || targetPage.name
  if (results.some((result) => (
    result.category === 'pages'
    && normalizeSearchPhrase(result.title) === normalizeSearchPhrase(targetPageTitle)
  ))) return

  pushSearchResult(results, seen, searchText, {
    id,
    title: targetPageTitle,
    description: description || `Contains ${sourceTitle || 'element'}`,
    category: 'pages',
    visual: getPageVisual(targetPage),
    target,
    matchText,
  })
}

export const getPreviewSearchResults = (
  searchText: string,
  pages: SearchSourcePage[] = [],
  appTitle = APP_TITLE_PLACEHOLDER,
  appSubtitle = '',
  searchActions: SearchSourceAction[] = [],
) => {
  const normalizedSearchText = normalizeSearchPhrase(searchText)
  if (!normalizedSearchText) return []

  const results: SearchMatchResult[] = []
  const seen = new Set<string>()
  const visiblePages = pages.filter((page) => !page.hidden && !page.dynamic)

  const overviewPage = visiblePages[0]
  if (overviewPage?.id) {
    pushSearchResult(results, seen, searchText, {
      id: 'app-overview',
      title: appTitle,
      description: appSubtitle || 'Open app',
      category: 'content',
      visual: getPageVisual(overviewPage),
      target: {
        type: 'page',
        pageId: overviewPage.id,
        elementId: getBestPageTargetElementId(overviewPage, normalizedSearchText),
      },
    })
  }

  searchActions.forEach((action) => {
    const actionSourceVisibleText = action.title
    pushSearchResult(results, seen, searchText, {
      id: `action-${action.id}`,
      title: action.title,
      description: '',
      category: 'content',
      visual: action.visual ?? { type: 'icon', name: 'MousePointerClick' },
      target: action.sourceTarget ?? action.target,
      matchText: actionSourceVisibleText,
    })

    if (action.target.type === 'page') {
      const targetPage = pages.find((page) => page.id === action.target.pageId)
      if (targetPage) {
        pushNavigationPageResult(results, seen, searchText, {
          id: `action-page-${action.id}`,
          targetPage,
          sourceTitle: action.title,
          description: `Opened by ${action.title}`,
          matchText: getPageVisibleSearchCorpus(targetPage),
          target: { ...action.target, elementId: getBestPageTargetElementId(targetPage, normalizedSearchText) },
        })
      }
    }
  })

  visiblePages.forEach((page, pageIndex) => {
    if (page.id && pageNameMatchesSearch(page, normalizedSearchText)) {
      pushSearchResult(results, seen, searchText, {
        id: `page-${pageIndex}-${page.name}`,
        title: page.name,
        description: 'Go to page',
        category: 'pages',
        visual: getPageVisual(page),
        target: {
          type: 'page',
          pageId: page.id,
          elementId: getBestPageTargetElementId(page, normalizedSearchText),
        },
      })
    }
  })

  visiblePages.forEach((page, pageIndex) => {
    page.elements?.forEach((element, elementIndex) => {
      const pageId = page.id
      const elementId = element.id
      if (!pageId || !elementId) return

      const componentLabel = COMPONENT_RESULT_LABELS[element.componentId || ''] || 'Element'
      const properties = element.properties ?? {}
      const formTitle = getCleanSearchResultText(properties['Form Title'])
        || getCleanSearchResultText(properties.Label)
        || getCleanSearchResultText(properties['Button Label'])
        || getCleanSearchResultText(properties.Title)
        || getCleanSearchResultText(properties['Action Form'])
      const formDescription = getCleanSearchResultText(properties['Form Description'])
        || getCleanSearchResultText(properties.Description)
      const formFields = parseSearchJsonItems(properties['Form Fields'])
      const hasFormConfig = element.componentId === 'form'
        || hasOpenFormAction(properties)
        || Boolean(getCleanSearchResultText(properties['Form Title']))
        || formFields.length > 0
      const openFormTarget = shouldOpenFormTarget(element.componentId, element.variants, properties)
      const elementTitle = SEARCH_RESULT_SOURCE_VISIBLE_PROPERTY_KEYS
        .map((key) => getCleanSearchResultText(properties[key]))
        .find(Boolean)
      const elementDescription = getCleanSearchResultText(properties.Description)
        || getCleanSearchResultText(properties.Subheading)
        || getCleanSearchResultText(properties.Text)
      const elementTarget: SearchResultTarget = {
        type: 'element',
        pageId,
        elementId,
      }
      const elementVisibleSearchText = getElementVisibleSearchCorpus(element)
      const elementMatchesSearch = textMatchesSearch(elementVisibleSearchText, normalizedSearchText)

      if (element.componentId !== 'form') {
        pushSearchResult(results, seen, searchText, {
          id: `element-${pageIndex}-${elementIndex}`,
          title: elementTitle || componentLabel,
          description: elementDescription,
          category: getElementSearchCategory(element.componentId, false, properties),
          visual: getElementVisual(element.componentId, properties, element.variants),
          target: elementTarget,
          matchText: elementVisibleSearchText,
        })
      }

      if (elementMatchesSearch) {
        pushNavigationPageResult(results, seen, searchText, {
          id: `source-page-${pageIndex}-${elementIndex}`,
          targetPage: page,
          sourceTitle: elementTitle || componentLabel,
          matchText: [page.name, elementVisibleSearchText].filter(Boolean).join(' '),
          target: { type: 'page', pageId, elementId },
        })
      }

      const isDynamicListNavigation = element.componentId === 'list'
        && String(properties['Click Action'] ?? '') === 'Open Dynamic Page'
      const navigationPage = isDynamicListNavigation
        ? undefined
        : getElementNavigationPage(pages, element)
      if (navigationPage) {
        pushNavigationPageResult(results, seen, searchText, {
          id: `element-page-${pageIndex}-${elementIndex}`,
          targetPage: navigationPage,
          sourceTitle: elementTitle || componentLabel,
          description: `Opened by ${elementTitle || componentLabel}`,
          matchText: getPageVisibleSearchCorpus(navigationPage),
          target: {
            type: 'page',
            pageId: navigationPage.id || pageId,
            elementId: getBestPageTargetElementId(navigationPage, normalizedSearchText),
          },
        })
      }

      const isProductList = element.componentId === 'product-list'
      const listItems = isProductList
        ? parseSearchJsonItems(properties.Products)
        : [
            ...parseSearchJsonItems(properties.Items),
            ...parseSearchJsonItems(properties.Products),
          ]
      // A List with an existing generated detail page must always resolve its
      // item-level search results to that detail page. The result connection is
      // based on the page relationship, not on the List's current button label.
      const dynamicDetailPage = element.componentId === 'list'
        ? getDynamicPageForElement(pages, elementId)
        : undefined
      const hasDynamicDetailTarget = Boolean(dynamicDetailPage)

      listItems.forEach((item, itemIndex) => {
        if (isProductList && item.visible === false) return

        const itemTitle = getItemText(item, ['title', 'name', 'label', 'question'])
        const itemDescription = getItemText(item, ['description', 'text', 'answer', 'details', 'category', 'price'])
        const itemSearchCorpus = getItemSearchCorpus(item)
        const itemMatchesSearch = textMatchesSearch(itemSearchCorpus, normalizedSearchText)
        const itemTarget: SearchResultTarget = isProductList
          ? { type: 'product-item', pageId, elementId, itemIndex }
          : hasDynamicDetailTarget
            ? { type: 'dynamic-item', pageId, elementId, itemIndex }
            : elementTarget
        pushSearchResult(results, seen, searchText, {
          id: `item-${pageIndex}-${elementIndex}-${itemIndex}`,
          title: itemTitle || elementTitle || componentLabel,
          description: itemDescription,
          category: 'content',
          visual: element.componentId === 'list' && itemTarget.type === 'element'
            ? getIconVisualFromRecord(item, COMPONENT_RESULT_ICONS.list)
            : getItemVisual(
              item,
              COMPONENT_RESULT_ICONS[element.componentId || ''] || 'List',
              getElementImageShape(element.componentId, element.variants),
            ),
          target: itemTarget,
          matchText: itemSearchCorpus,
        })

        if (itemMatchesSearch) {
          pushNavigationPageResult(results, seen, searchText, {
            id: `item-source-page-${pageIndex}-${elementIndex}-${itemIndex}`,
            targetPage: page,
            sourceTitle: itemTitle || elementTitle || componentLabel,
            matchText: [page.name, itemSearchCorpus].filter(Boolean).join(' '),
            target: { type: 'page', pageId, elementId },
          })
        }

        if (dynamicDetailPage) {
          pushNavigationPageResult(results, seen, searchText, {
            id: `item-page-${pageIndex}-${elementIndex}-${itemIndex}`,
            targetPage: dynamicDetailPage,
            title: itemTitle || elementTitle || componentLabel,
            sourceTitle: itemTitle || elementTitle || componentLabel,
            description: `Opened by ${itemTitle || elementTitle || componentLabel}`,
            matchText: itemSearchCorpus,
            target: { type: 'dynamic-item', pageId, elementId, itemIndex },
          })
        }
      })

      if (hasFormConfig && (formTitle || formFields.length > 0 || openFormTarget)) {
        const formVisibleSearchText = getFormVisibleSearchCorpus(properties, formTitle, formDescription, formFields)
        pushSearchResult(results, seen, searchText, {
          id: `form-${pageIndex}-${elementIndex}`,
          title: formTitle || 'Form',
          description: formDescription,
          category: 'forms',
          visual: { type: 'icon', name: 'ClipboardList' },
          target: {
            type: 'form',
            pageId,
            elementId,
            fieldName: getFirstMatchingFormFieldName(formFields, normalizedSearchText),
            openForm: openFormTarget,
          },
          matchText: formVisibleSearchText,
        })
      }

    })
  })

  return results
}

const getPageContentSearchResults = (
  searchText: string,
  pages: SearchSourcePage[] = [],
): SearchMatchResult[] => {
  const normalizedSearchText = normalizeSearchPhrase(searchText)
  if (!normalizedSearchText) return []

  return pages
    .filter((page) => !page.hidden && !page.dynamic && page.id)
    .flatMap((page) => {
      const matchingElementText = (page.elements ?? [])
        .map(getElementVisibleSearchCorpus)
        .filter((text) => textMatchesSearch(text, normalizedSearchText))
        .slice(0, 3)

      if (matchingElementText.length === 0 || !page.id) return []

      return [{
        id: `page-content-${page.id}`,
        title: page.name,
        description: matchingElementText
          .map((text) => truncateSearchDescription(text, searchText, 64))
          .join(' / '),
        category: 'content' as const,
        visual: getPageVisual(page),
        target: {
          type: 'page' as const,
          pageId: page.id,
          elementId: getBestPageTargetElementId(page, normalizedSearchText),
        },
      }]
    })
}

const renderFeaturedSearchList = (
  featuredSearches: string[],
  onSelect: (keyword: string) => void,
  className = 'live-preview__search-featured-list',
) => (
  <div className={className}>
    {featuredSearches.map((keyword) => (
      <button
        key={keyword}
        type="button"
        className="live-preview__search-featured-item"
        onClick={() => onSelect(keyword)}
      >
        <span className="live-preview__search-featured-text">{keyword}</span>
      </button>
    ))}
  </div>
)

const renderSearchWelcome = (
  featuredSearches: string[],
  onSelect: (keyword: string) => void,
) => (
  <section className="live-preview__search-welcome" aria-label="Search suggestions">
    <div className="live-preview__search-welcome-main">
      <div className="live-preview__search-welcome-icon" aria-hidden="true">
        <AppIcon name="Search" size={32} />
      </div>
      <div className="live-preview__search-welcome-copy">
        <h2 className="live-preview__search-welcome-title">What are you looking for?</h2>
        <p className="live-preview__search-welcome-description">
          Enter a name to find what you&apos;re looking for.
        </p>
      </div>
    </div>
    {featuredSearches.length > 0 && (
      renderFeaturedSearchList(featuredSearches, onSelect, 'live-preview__search-welcome-chips')
    )}
  </section>
)

const getHighlightedParts = (text: string, searchText: string) => {
  const matchRanges = getSearchMatchRanges(text, searchText)

  if (matchRanges.length === 0) {
    return [{ isMatch: false, text }]
  }

  const parts: Array<{ isMatch: boolean, text: string }> = []
  let cursor = 0

  matchRanges.forEach((range) => {
    if (range.start > cursor) {
      parts.push({ isMatch: false, text: text.slice(cursor, range.start) })
    }

    parts.push({ isMatch: true, text: text.slice(range.start, range.end) })
    cursor = range.end
  })

  if (cursor < text.length) {
    parts.push({ isMatch: false, text: text.slice(cursor) })
  }

  return parts
}

const renderHighlightedText = (text: string, searchText: string) => (
  getHighlightedParts(text, searchText).map((part, index) => (
    part.isMatch
      ? (
        <mark key={`${part.text}-${index}`} className="live-preview__search-match-highlight">
          {part.text}
        </mark>
      )
      : part.text
  ))
)

const renderSearchResultVisual = (visual: SearchMatchVisual) => (
  <span
    className={[
      'live-preview__search-match-visual',
      `live-preview__search-match-visual--${visual.type}`,
      visual.type === 'image' && visual.shape && `live-preview__search-match-visual--${visual.shape}`,
    ].filter(Boolean).join(' ')}
    aria-hidden="true"
  >
    {visual.type === 'image'
      ? <img src={visual.src} alt="" loading="lazy" />
      : visual.type === 'design-icon'
        ? <DSIcon name={visual.name} category={visual.category} size={20} />
      : <AppIcon name={visual.name} size={24} />}
  </span>
)

export function LivePreviewSearchEmptyState({ query }: { query: string }) {
  return (
    <section className="live-preview__search-empty" aria-live="polite">
      <div className="live-preview__search-empty-icon" aria-hidden="true">
        <AppIcon name="Search" size={32} />
      </div>
      <div className="live-preview__search-empty-copy">
        <h2 className="live-preview__search-empty-title">
          No matches for &ldquo;{query}&rdquo;
        </h2>
        <p className="live-preview__search-empty-description">Try another keyword.</p>
      </div>
    </section>
  )
}

export function LivePreviewSearchResultList({
  resultQuery,
  results,
  pages,
  onResultSelect,
}: {
  resultQuery: string
  results: SearchMatchResult[]
  pages?: SearchSourcePage[]
  onResultSelect?: (target: SearchResultTarget) => void
}) {
  const [activeResultFilter, setActiveResultFilter] = useState<SearchResultFilter>('all')
  const searchResultGroups = useMemo(() => (
    SEARCH_RESULT_CATEGORY_ORDER.map((category) => ({
      category,
      label: SEARCH_RESULT_CATEGORY_LABELS[category],
      results: results.filter((result) => result.category === category),
    }))
  ), [results])
  const pageContentResults = useMemo(
    () => getPageContentSearchResults(resultQuery, pages),
    [pages, resultQuery],
  )
  // List and Product List item results are detail destinations. They share the
  // consolidated Search results area with page-content matches (rather than a
  // separate Content filter), so selecting an item can open its own detail view.
  const consolidatedContentResults = useMemo(() => [
    ...pageContentResults,
    ...results.filter((result) => result.category === 'content'),
  ], [pageContentResults, results])
  const nonEmptySearchResultGroups = useMemo(() => (
    searchResultGroups.filter((group) => group.results.length > 0)
  ), [searchResultGroups])
  const showSearchResultFilters = nonEmptySearchResultGroups.length > 1
  const searchResultFilters = useMemo<Array<{ id: SearchResultFilter, label: string }>>(() => [
    { id: 'all', label: 'All' },
    // Page results remain visible under All; pages are destinations, not a
    // separately filterable result type.
    ...nonEmptySearchResultGroups.filter((group) => group.category !== 'pages').map((group) => ({
      id: group.category,
      label: SEARCH_RESULT_FILTER_LABELS[group.category],
    })),
  ], [nonEmptySearchResultGroups])
  const activeVisibleResultFilter = showSearchResultFilters ? activeResultFilter : 'all'

  useEffect(() => {
    setActiveResultFilter('all')
  }, [resultQuery])

  useEffect(() => {
    if (!showSearchResultFilters) {
      if (activeResultFilter !== 'all') setActiveResultFilter('all')
      return
    }

    if (!searchResultFilters.some((filter) => filter.id === activeResultFilter)) {
      setActiveResultFilter('all')
    }
  }, [activeResultFilter, searchResultFilters, showSearchResultFilters])
  const visibleSearchResultGroups = searchResultGroups.filter((group) => (
    group.results.length > 0
    && (activeVisibleResultFilter === 'all' || group.category === activeVisibleResultFilter)
  ))

  return (
    <section className="live-preview__search-match-results" aria-label={`Search results for ${resultQuery}`}>
      {showSearchResultFilters && (
        <div className="live-preview__search-filter-row" role="tablist" aria-label="Search result categories">
          {searchResultFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={activeResultFilter === filter.id}
              className={`live-preview__search-filter-chip${activeResultFilter === filter.id ? ' live-preview__search-filter-chip--active' : ''}`}
              onClick={() => setActiveResultFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {activeVisibleResultFilter === 'all' && consolidatedContentResults.length > 0 && (
        <section className="live-preview__search-content-results" aria-label={`Page content results for ${resultQuery}`}>
          <h2 className="live-preview__search-match-section-title">Search results ({consolidatedContentResults.length})</h2>
          <div className="live-preview__search-match-section-list">
            {consolidatedContentResults.map((result) => (
              <button
                key={result.id}
                type="button"
                className="live-preview__search-content-result"
                onClick={() => onResultSelect?.(result.target)}
              >
                <span className="live-preview__search-match-title">
                  {renderHighlightedText(result.title, resultQuery)}
                </span>
                <span className="live-preview__search-match-description">
                  {renderHighlightedText(result.description, resultQuery)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {visibleSearchResultGroups.map((group) => (
        <section
          key={group.category}
          className="live-preview__search-match-section"
          aria-label={group.label}
        >
          <h2 className="live-preview__search-match-section-title">{group.label}</h2>
          <div className="live-preview__search-match-section-list">
            {group.results.map((result) => (
              <button
                key={result.id}
                type="button"
                className={`live-preview__search-match-item${!result.description && !result.matchContext ? ' live-preview__search-match-item--single-line' : ''}`}
                onClick={() => onResultSelect?.(result.target)}
              >
                {renderSearchResultVisual(result.visual)}
                <span className="live-preview__search-match-copy">
                  <span className="live-preview__search-match-title">
                    {renderHighlightedText(result.title, resultQuery)}
                  </span>
                  {result.description && (
                    <span className="live-preview__search-match-description">
                      {renderHighlightedText(result.description, resultQuery)}
                    </span>
                  )}
                  {result.matchContext && (
                    <span className="live-preview__search-match-context">
                      {renderHighlightedText(result.matchContext, resultQuery)}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </section>
  )
}

export function LivePreviewSearchPage({
  onClose,
  onResultSelect,
  appTitle,
  appSubtitle,
  pages,
  searchActions = [],
  initialQuery = '',
  externalQuery,
  onQueryChange,
  presentation = 'page',
  showHeader = true,
}: LivePreviewSearchPageProps) {
  const normalizedInitialQuery = (externalQuery ?? initialQuery).trim()
  const initialSearchState = (() => {
    const nextQuery = normalizedInitialQuery
    if (!nextQuery) return { query: '', noResultsQuery: '', resultQuery: '' }

    const hasResults = getPreviewSearchResults(nextQuery, pages, appTitle, appSubtitle, searchActions).length > 0
    return {
      query: nextQuery,
      noResultsQuery: hasResults ? '' : nextQuery,
      resultQuery: hasResults ? nextQuery : '',
    }
  })()
  const [query, setQuery] = useState(initialSearchState.query)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const recentSearchStorageKey = useMemo(() => getRecentSearchStorageKey(appTitle), [appTitle])
  const [recentSearches, setRecentSearches] = useState<string[]>(
    () => readRecentSearches(recentSearchStorageKey),
  )
  const [noResultsQuery, setNoResultsQuery] = useState(initialSearchState.noResultsQuery)
  const [resultQuery, setResultQuery] = useState(initialSearchState.resultQuery)
  const inputRef = useRef<HTMLInputElement>(null)
  const autoRecordedQueryRef = useRef('')
  const featuredSearches = useMemo(
    () => deriveFeaturedSearches({ appTitle, appSubtitle, pages, searchActions }),
    [appTitle, appSubtitle, pages, searchActions],
  )
  const hasQuery = query.length > 0
  const hasNoResults = noResultsQuery.length > 0
  const hasSearchResults = resultQuery.length > 0
  const hasRecentSearches = recentSearches.length > 0
  const matchingSearchResults = useMemo(
    () => (
      hasSearchResults
        ? getPreviewSearchResults(resultQuery, pages, appTitle, appSubtitle, searchActions)
        : []
    ),
    [appSubtitle, appTitle, hasSearchResults, pages, resultQuery, searchActions],
  )
  const showRecentSearches = !hasQuery && !hasNoResults && !hasSearchResults && hasRecentSearches
  const showSearchWelcome = !hasQuery && !hasNoResults && !hasSearchResults && !hasRecentSearches

  useEffect(() => {
    if (!showHeader) return undefined

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      setIsSearchFocused(true)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [showHeader])

  useEffect(() => {
    setRecentSearches(readRecentSearches(recentSearchStorageKey))
  }, [recentSearchStorageKey])

  const updateRecentSearches = useCallback((getNextSearches: (currentSearches: string[]) => string[]) => {
    setRecentSearches((currentSearches) => {
      const nextSearches = getNextSearches(currentSearches).slice(0, RECENT_SEARCH_LIMIT)
      writeRecentSearches(recentSearchStorageKey, nextSearches)
      return nextSearches
    })
  }, [recentSearchStorageKey])

  const recordRecentSearch = useCallback((nextQuery: string) => {
    updateRecentSearches((currentSearches) => [
      nextQuery,
      ...currentSearches.filter((item) => item.toLocaleLowerCase() !== nextQuery.toLocaleLowerCase()),
    ])
  }, [updateRecentSearches])

  useEffect(() => {
    autoRecordedQueryRef.current = ''
  }, [recentSearchStorageKey])

  useEffect(() => {
    const nextQuery = query.trim()
    const settledQuery = noResultsQuery || resultQuery

    if (!nextQuery || settledQuery !== nextQuery || autoRecordedQueryRef.current === nextQuery) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      autoRecordedQueryRef.current = nextQuery
      recordRecentSearch(nextQuery)
    }, 800)

    return () => window.clearTimeout(timer)
  }, [noResultsQuery, query, recentSearchStorageKey, resultQuery, recordRecentSearch])

  const applySearchState = useCallback((nextQuery: string) => {
    if (getPreviewSearchResults(nextQuery, pages, appTitle, appSubtitle, searchActions).length === 0) {
      setNoResultsQuery(nextQuery)
      setResultQuery('')
      return
    }

    setNoResultsQuery('')
    setResultQuery(nextQuery)
  }, [appSubtitle, appTitle, pages, searchActions])

  const startSearch = (searchText: string, { syncQuery = true, recordRecent = true } = {}) => {
    const nextQuery = searchText.trim()

    if (!nextQuery) {
      if (syncQuery) {
        setQuery('')
        onQueryChange?.('')
      }
      setNoResultsQuery('')
      setResultQuery('')
      inputRef.current?.focus()
      return
    }

    if (syncQuery) {
      setQuery(nextQuery)
      onQueryChange?.(nextQuery)
    }
    if (recordRecent) recordRecentSearch(nextQuery)
    applySearchState(nextQuery)
    inputRef.current?.focus()
  }

  const handleClear = () => {
    setQuery('')
    onQueryChange?.('')
    setNoResultsQuery('')
    setResultQuery('')
    inputRef.current?.focus()
  }

  const handleClearPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    handleClear()
  }

  const submitSearch = (searchText = query) => {
    startSearch(searchText)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitSearch()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    submitSearch(event.currentTarget.value)
  }

  const handleRemoveRecentSearch = (search: string) => {
    updateRecentSearches((currentSearches) => currentSearches.filter((item) => item !== search))
  }

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery)
    onQueryChange?.(nextQuery)
    setNoResultsQuery('')
    setResultQuery('')

    if (!nextQuery.trim()) {
      return
    }

    startSearch(nextQuery, { syncQuery: false, recordRecent: false })
  }

  useEffect(() => {
    if (externalQuery === undefined) return

    const nextExternalQuery = externalQuery.trim()
    setQuery(externalQuery)

    if (!nextExternalQuery) {
      setNoResultsQuery('')
      setResultQuery('')
      return
    }

    applySearchState(nextExternalQuery)
  }, [applySearchState, externalQuery])

  const usesDesktopModalHeader = presentation === 'desktop-modal'
  const rootClassName = [
    'live-preview__search-page',
    presentation !== 'page' ? `live-preview__search-page--${presentation}` : '',
    showSearchWelcome ? 'live-preview__search-page--welcome' : '',
    !showHeader ? 'live-preview__search-page--no-header' : '',
  ].filter(Boolean).join(' ')

  return (
    <section className={`${rootClassName} app-scope`} aria-label="Search">
      {showHeader && (
        <header className={`live-preview__search-header${usesDesktopModalHeader ? ' live-preview__search-header--desktop-modal' : ''}`}>
          {!usesDesktopModalHeader && (
            <button
              type="button"
              className="live-preview__search-back"
              aria-label="Back"
              onClick={onClose}
            >
              <AppIcon name="ChevronLeft" size={20} />
            </button>
          )}
          <form
            className={`live-preview__search-field${hasQuery ? ' live-preview__search-field--has-value' : ''}`}
            onSubmit={handleSubmit}
          >
            {!usesDesktopModalHeader && <AppIcon name="Search" size={20} />}
            <input
              ref={inputRef}
              type="search"
              aria-label="Search"
              placeholder={usesDesktopModalHeader ? 'Search' : (isSearchFocused ? '' : 'Search')}
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              onPointerDown={() => setIsSearchFocused(true)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onKeyDown={handleKeyDown}
            />
            {hasQuery && !usesDesktopModalHeader && (
              <button
                type="button"
                className="live-preview__search-clear"
                aria-label="Clear search"
                onPointerDown={handleClearPointerDown}
                onClick={handleClear}
              >
                <DSIcon name="xmark-circle-filled" size={20} />
              </button>
            )}
          </form>
          {usesDesktopModalHeader && (
            <button
              type="button"
              className="live-preview__search-close"
              aria-label="Close search"
              onClick={onClose}
            >
              <DSIcon name="xmark" size={20} />
            </button>
          )}
        </header>
      )}

      {hasNoResults && <LivePreviewSearchEmptyState query={noResultsQuery} />}

      {hasSearchResults && (
        <LivePreviewSearchResultList
          resultQuery={resultQuery}
          results={matchingSearchResults}
          pages={pages}
          onResultSelect={(target) => {
            recordRecentSearch(resultQuery)
            onResultSelect?.(target)
          }}
        />
      )}

      {showRecentSearches && (
        <section className="live-preview__search-results" aria-label="Recent searches">
          <div className="live-preview__search-results-header">
            <h2 className="live-preview__search-results-title">Recent searches</h2>
            <button
              type="button"
              className="live-preview__search-results-clear"
              onClick={() => updateRecentSearches(() => [])}
            >
              Clear
            </button>
          </div>

          <div className="live-preview__search-history-list">
            {recentSearches.map((search) => (
              <div key={search} className="live-preview__search-history-item">
                <button
                  type="button"
                  className="live-preview__search-history-content"
                  onClick={() => submitSearch(search)}
                >
                  <span className="live-preview__search-history-icon" aria-hidden="true">
                    <DSIcon name="clock-arrow-rotate-left" category="time-date" size={16} />
                  </span>
                  <span className="live-preview__search-history-text">{search}</span>
                </button>
                <button
                  type="button"
                  className="live-preview__search-history-remove"
                  aria-label={`Remove ${search}`}
                  onClick={() => handleRemoveRecentSearch(search)}
                >
                  <DSIcon name="xmark" size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {showSearchWelcome && renderSearchWelcome(featuredSearches, submitSearch)}
    </section>
  )
}
