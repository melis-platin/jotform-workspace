import { type CSSProperties, type FormEvent, type KeyboardEvent, type PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  hidden?: boolean
  dynamic?: boolean
  dynamicSourceElementId?: string
  elements?: SearchSourceElement[]
}

export type SearchResultTarget =
  | { type: 'page', pageId: string }
  | { type: 'element', pageId: string, elementId: string }
  | { type: 'dynamic-item', pageId: string, elementId: string, itemIndex: number }
  | { type: 'form', pageId: string, elementId: string, fieldName?: string, openForm?: boolean }

export type SearchMatchVisual =
  | { type: 'icon', name: string, color?: string, backgroundColor?: string }
  | { type: 'image', src: string }

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

interface SearchMatchResult {
  id: string
  title: string
  description: string
  matchContext?: string
  category: SearchResultCategory
  visual: SearchMatchVisual
  target: SearchResultTarget
}

interface LivePreviewSearchPageProps {
  onClose: () => void
  onResultSelect?: (target: SearchResultTarget) => void
  appTitle?: string
  appSubtitle?: string
  pages?: SearchSourcePage[]
  searchActions?: SearchSourceAction[]
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
const SEARCH_RESULT_ICON_COLOR_KEYS = ['Icon Color', 'Indicator Icon Color', 'Action Icon Color', 'iconColor']
const SEARCH_RESULT_ICON_BACKGROUND_KEYS = ['Icon Background Color', 'Icon Background', 'Background Color', 'Indicator Background Color', 'Icon BG', 'iconBgColor']

type SearchResultCategory = 'pages' | 'forms' | 'sign' | 'contents'
type SearchResultFilter = 'all' | SearchResultCategory

const SEARCH_RESULT_CATEGORY_ORDER: SearchResultCategory[] = ['pages', 'forms', 'sign', 'contents']
const SEARCH_RESULT_CATEGORY_LABELS: Record<SearchResultCategory, string> = {
  pages: 'PAGES',
  forms: 'FORMS',
  sign: 'SIGN',
  contents: 'CONTENTS',
}
const SEARCH_RESULT_FILTER_LABELS: Record<SearchResultCategory, string> = {
  pages: 'Pages',
  forms: 'Forms',
  sign: 'Sign',
  contents: 'Contents',
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
  faq: 'HelpCircle',
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

  pushSearchCandidate(keywords, seen, appTitle)
  pushTextSearchCandidates(keywords, seen, appSubtitle)

  pages
    .filter((page) => !page.hidden && !page.dynamic)
    .forEach((page) => pushSearchCandidate(keywords, seen, page.name))

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
    pushSearchCandidate(keywords, seen, pages.find((page) => !page.dynamic)?.name)
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
): SearchMatchVisual => ({
  type: 'icon',
  name: getFirstRecordValue(record, SEARCH_RESULT_ICON_KEYS) || fallbackIcon,
  color: getFirstRecordValue(record, SEARCH_RESULT_ICON_COLOR_KEYS) || undefined,
  backgroundColor: getFirstRecordValue(record, SEARCH_RESULT_ICON_BACKGROUND_KEYS) || undefined,
})

const getElementVisual = (componentId: string | undefined, properties: Record<string, unknown>): SearchMatchVisual => {
  const imageValue = getImageFromRecord(properties)
  if (imageValue) return { type: 'image', src: imageValue }

  return getIconVisualFromRecord(properties, COMPONENT_RESULT_ICONS[componentId || ''] || 'Layers')
}

const getItemVisual = (item: Record<string, unknown>, fallbackIcon = 'List'): SearchMatchVisual => {
  const imageValue = getImageFromRecord(item)
  if (imageValue) return { type: 'image', src: imageValue }

  return getIconVisualFromRecord(item, fallbackIcon)
}

const getElementSearchCategory = (componentId: string | undefined, hasFormConfig: boolean): SearchResultCategory => {
  if (componentId === 'sign-document') return 'sign'
  if (hasFormConfig) return 'forms'
  return 'contents'
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
  if (target.type === 'dynamic-item') return 4
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

const truncateSearchDescription = (description: string, searchText: string) => {
  const cleanDescription = description.replace(/\s+/g, ' ').trim()
  if (cleanDescription.length <= SEARCH_DESCRIPTION_MAX_LENGTH) return cleanDescription

  const matchRange = getSearchMatchRanges(cleanDescription, searchText)[0]

  if (!matchRange) {
    return `${cleanDescription.slice(0, SEARCH_DESCRIPTION_MAX_LENGTH).trim()}...`
  }

  const start = Math.max(0, matchRange.start - 36)
  const end = Math.min(cleanDescription.length, matchRange.end + 56)
  const prefix = start > 0 ? '... ' : ''
  const suffix = end < cleanDescription.length ? '...' : ''

  return `${prefix}${cleanDescription.slice(start, end).trim()}${suffix}`
}

const getDisplayDescription = (
  category: SearchResultCategory,
  description: string,
  searchText: string,
) => {
  if (category === 'pages') return 'Go to page'
  if (category === 'forms') return 'Fill out form'
  if (!description) return ''
  return truncateSearchDescription(description, searchText)
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
    || (category === 'forms' || category === 'sign' ? getStringValue(title) : '')
  const resultDescription = getCleanSearchResultText(description)

  if (!resultTitle) return

  const searchCorpus = matchText ?? [resultTitle, resultDescription, extraSearchText].filter(Boolean).join(' ')
  if (!textMatchesSearch(searchCorpus, normalizedSearchText)) return

  const displayDescription = getDisplayDescription(category, resultDescription, searchText)
  const visibleText = [resultTitle, displayDescription].filter(Boolean).join(' ')
  const matchContext = getSearchMatchContext(searchCorpus, searchText, visibleText)
  if (!textMatchesSearch([visibleText, matchContext].filter(Boolean).join(' '), normalizedSearchText)) return

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
    visual: { type: 'icon', name: 'FileText' },
    target,
    matchText,
  })
}

const getPreviewSearchResults = (
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

  const overviewPageId = visiblePages[0]?.id
  if (overviewPageId) {
    pushSearchResult(results, seen, searchText, {
      id: 'app-overview',
      title: appTitle,
      description: appSubtitle || 'Open app',
      category: 'contents',
      visual: { type: 'icon', name: 'Home' },
      target: { type: 'page', pageId: overviewPageId },
    })
  }

  searchActions.forEach((action) => {
    const actionSourceVisibleText = action.title
    pushSearchResult(results, seen, searchText, {
      id: `action-${action.id}`,
      title: action.title,
      description: '',
      category: 'contents',
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
          target: action.target,
        })
      }
    }
  })

  visiblePages.forEach((page, pageIndex) => {
    if (page.id && textMatchesSearch(page.name, normalizedSearchText)) {
      pushSearchResult(results, seen, searchText, {
        id: `page-${pageIndex}-${page.name}`,
        title: page.name,
        description: 'Go to page',
        category: 'pages',
        visual: { type: 'icon', name: 'FileText' },
        target: { type: 'page', pageId: page.id },
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
          category: getElementSearchCategory(element.componentId, false),
          visual: getElementVisual(element.componentId, properties),
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
          target: { type: 'page', pageId },
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
          target: { type: 'page', pageId: navigationPage.id || pageId },
        })
      }

      const listItems = [
        ...parseSearchJsonItems(properties.Items),
        ...parseSearchJsonItems(properties.Products),
      ]
      const dynamicDetailPage = isDynamicListNavigation
        ? getDynamicPageForElement(pages, elementId)
        : undefined
      const hasDynamicDetailTarget = Boolean(dynamicDetailPage)

      listItems.forEach((item, itemIndex) => {
        const itemTitle = getItemText(item, ['title', 'name', 'label', 'question'])
        const itemDescription = getItemText(item, ['description', 'text', 'answer', 'details', 'category', 'price'])
        const itemSearchCorpus = getItemSearchCorpus(item)
        const itemMatchesSearch = textMatchesSearch(itemSearchCorpus, normalizedSearchText)
        pushSearchResult(results, seen, searchText, {
          id: `item-${pageIndex}-${elementIndex}-${itemIndex}`,
          title: itemTitle || elementTitle || componentLabel,
          description: itemDescription,
          category: 'contents',
          visual: getItemVisual(item, COMPONENT_RESULT_ICONS[element.componentId || ''] || 'List'),
          target: hasDynamicDetailTarget
            ? { type: 'dynamic-item', pageId, elementId, itemIndex }
            : elementTarget,
          matchText: itemSearchCorpus,
        })

        if (itemMatchesSearch) {
          pushNavigationPageResult(results, seen, searchText, {
            id: `item-source-page-${pageIndex}-${elementIndex}-${itemIndex}`,
            targetPage: page,
            sourceTitle: itemTitle || elementTitle || componentLabel,
            matchText: [page.name, itemSearchCorpus].filter(Boolean).join(' '),
            target: { type: 'page', pageId },
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
          target: { type: 'form', pageId, elementId, openForm: openFormTarget },
          matchText: formVisibleSearchText,
        })
      }

    })
  })

  return results
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

const getSearchResultVisualStyle = (visual: SearchMatchVisual): CSSProperties | undefined => {
  if (visual.type !== 'icon' || (!visual.color && !visual.backgroundColor)) return undefined

  return {
    color: visual.color,
    background: visual.backgroundColor,
  }
}

const renderSearchResultVisual = (visual: SearchMatchVisual) => (
  <span
    className={`live-preview__search-match-visual live-preview__search-match-visual--${visual.type}`}
    aria-hidden="true"
    style={getSearchResultVisualStyle(visual)}
  >
    {visual.type === 'image'
      ? <img src={visual.src} alt="" loading="lazy" />
      : <AppIcon name={visual.name} size={24} />}
  </span>
)

export function LivePreviewSearchPage({
  onClose,
  onResultSelect,
  appTitle,
  appSubtitle,
  pages,
  searchActions = [],
}: LivePreviewSearchPageProps) {
  const [query, setQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const recentSearchStorageKey = useMemo(() => getRecentSearchStorageKey(appTitle), [appTitle])
  const [recentSearches, setRecentSearches] = useState<string[]>(
    () => readRecentSearches(recentSearchStorageKey),
  )
  const [noResultsQuery, setNoResultsQuery] = useState('')
  const [resultQuery, setResultQuery] = useState('')
  const [activeResultFilter, setActiveResultFilter] = useState<SearchResultFilter>('all')
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
  const searchResultGroups = useMemo(() => (
    SEARCH_RESULT_CATEGORY_ORDER.map((category) => ({
      category,
      label: SEARCH_RESULT_CATEGORY_LABELS[category],
      results: matchingSearchResults.filter((result) => result.category === category),
    }))
  ), [matchingSearchResults])
  const searchResultFilters = useMemo<Array<{ id: SearchResultFilter, label: string }>>(() => [
    { id: 'all', label: 'All' },
    ...searchResultGroups
      .filter((group) => group.results.length > 0)
      .map((group) => ({
        id: group.category,
        label: SEARCH_RESULT_FILTER_LABELS[group.category],
      })),
  ], [searchResultGroups])
  const visibleSearchResultGroups = searchResultGroups.filter((group) => (
    group.results.length > 0
    && (activeResultFilter === 'all' || group.category === activeResultFilter)
  ))
  const showRecentSearches = !hasQuery && !hasNoResults && !hasSearchResults && hasRecentSearches
  const showSearchWelcome = !hasQuery && !hasNoResults && !hasSearchResults && !hasRecentSearches

  useEffect(() => {
    setRecentSearches(readRecentSearches(recentSearchStorageKey))
  }, [recentSearchStorageKey])

  useEffect(() => {
    if (!searchResultFilters.some((filter) => filter.id === activeResultFilter)) {
      setActiveResultFilter('all')
    }
  }, [activeResultFilter, searchResultFilters])

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

  const applySearchState = (nextQuery: string) => {
    if (getPreviewSearchResults(nextQuery, pages, appTitle, appSubtitle, searchActions).length === 0) {
      setNoResultsQuery(nextQuery)
      setResultQuery('')
      return
    }

    setNoResultsQuery('')
    setResultQuery(nextQuery)
  }

  const startSearch = (searchText: string, { syncQuery = true, recordRecent = true } = {}) => {
    const nextQuery = searchText.trim()

    if (!nextQuery) {
      if (syncQuery) setQuery('')
      setNoResultsQuery('')
      setResultQuery('')
      setActiveResultFilter('all')
      inputRef.current?.focus()
      return
    }

    if (syncQuery) setQuery(nextQuery)
    setActiveResultFilter('all')
    if (recordRecent) recordRecentSearch(nextQuery)
    applySearchState(nextQuery)
    inputRef.current?.focus()
  }

  const handleClear = () => {
    setQuery('')
    setNoResultsQuery('')
    setResultQuery('')
    setActiveResultFilter('all')
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
    setNoResultsQuery('')
    setResultQuery('')
    setActiveResultFilter('all')

    if (!nextQuery.trim()) {
      return
    }

    startSearch(nextQuery, { syncQuery: false, recordRecent: false })
  }

  return (
    <section className="live-preview__search-page app-scope" aria-label="Search">
      <header className="live-preview__search-header">
        <button
          type="button"
          className="live-preview__search-back"
          aria-label="Back"
          onClick={onClose}
        >
          <AppIcon name="ChevronLeft" size={20} />
        </button>
        <form
          className={`live-preview__search-field${hasQuery ? ' live-preview__search-field--has-value' : ''}`}
          onSubmit={handleSubmit}
        >
          <AppIcon name="Search" size={20} />
          <input
            ref={inputRef}
            type="search"
            aria-label="Search"
            placeholder={isSearchFocused ? '' : 'Search'}
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            onPointerDown={() => setIsSearchFocused(true)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onKeyDown={handleKeyDown}
          />
          {hasQuery && (
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
      </header>

      {hasNoResults && (
        <section className="live-preview__search-empty" aria-live="polite">
          <div className="live-preview__search-empty-icon" aria-hidden="true">
            <AppIcon name="Search" size={32} />
          </div>
          <div className="live-preview__search-empty-copy">
            <h2 className="live-preview__search-empty-title">
              No matches for &ldquo;{noResultsQuery}&rdquo;
            </h2>
            <p className="live-preview__search-empty-description">Try another keyword.</p>
          </div>
        </section>
      )}

      {hasSearchResults && (
        <section className="live-preview__search-match-results" aria-label={`Search results for ${resultQuery}`}>
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
                    className="live-preview__search-match-item"
                    onClick={() => {
                      recordRecentSearch(resultQuery)
                      onResultSelect?.(result.target)
                    }}
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
