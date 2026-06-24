import { type FormEvent, type KeyboardEvent, type PointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import { AppIcon } from '@jf/app-elements'
import { Icon as DSIcon } from '@jf/design-system'

interface SearchSourceElement {
  componentId?: string
  properties?: Record<string, unknown>
}

interface SearchSourcePage {
  name: string
  hidden?: boolean
  dynamic?: boolean
  elements?: SearchSourceElement[]
}

interface SearchMatchResult {
  id: string
  title: string
  description: string
}

interface LivePreviewSearchPageProps {
  onClose: () => void
  appTitle?: string
  appSubtitle?: string
  pages?: SearchSourcePage[]
}

const APP_TITLE_PLACEHOLDER = 'New App'
const APP_DESCRIPTION_PLACEHOLDER = 'Add a short description to tell people what your app does.'
const FEATURED_SEARCH_LIMIT = 10
const FEATURED_SEARCH_MAX_WORDS = 2
const RECENT_SEARCH_LIMIT = 10
const RECENT_SEARCH_STORAGE_PREFIX = 'jf-live-preview-search-recent'
const SEARCH_LOADING_DELAY_MS = 2500
const SEARCH_SKELETON_ITEMS = Array.from({ length: 6 }, (_, index) => index)
const SEARCH_RESULT_LIMIT = 10
const SEARCH_DESCRIPTION_MAX_LENGTH = 96

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
  table: 'Table',
  testimonial: 'Testimonial',
}

const SEARCH_PROPERTY_KEYS = ['Heading', 'Title', 'Label', 'Text', 'Description', 'Subheading', 'Button Text']
const SEARCH_RESULT_PROPERTY_KEYS = [
  'Heading',
  'Subheading',
  'Title',
  'Label',
  'Text',
  'Description',
  'Button Label',
  'Form Title',
  'Form Description',
  'Form Submit Label',
  'Submit Label',
  'Alt Text',
  'Data Source',
]
const SEARCH_TEXT_SEPARATOR_REGEX = /\s*(?:[·•,&/|+]|\s[-–—]\s)\s*/

const normalizeSearchPhrase = (value: string) => (
  value
    .trim()
    .toLocaleLowerCase()
    .replace(/['"“”‘’]/g, '')
    .replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ\s-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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

const deriveFeaturedSearches = ({
  appTitle,
  appSubtitle,
  pages = [],
}: {
  appTitle?: string
  appSubtitle?: string
  pages?: SearchSourcePage[]
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

const getItemSearchCorpus = (item: Record<string, unknown>) => (
  Object.values(item)
    .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
    .join(' ')
)

const textMatchesSearch = (value: string, normalizedSearchText: string) => {
  if (!normalizedSearchText) return false
  const normalizedValue = normalizeSearchPhrase(value)
  if (!normalizedValue) return false
  return normalizedValue.includes(normalizedSearchText) || normalizedSearchText.includes(normalizedValue)
}

const truncateSearchDescription = (description: string, searchText: string) => {
  const cleanDescription = description.replace(/\s+/g, ' ').trim()
  if (cleanDescription.length <= SEARCH_DESCRIPTION_MAX_LENGTH) return cleanDescription

  const normalizedDescription = cleanDescription.toLocaleLowerCase()
  const normalizedSearchText = searchText.trim().toLocaleLowerCase()
  const matchIndex = normalizedDescription.indexOf(normalizedSearchText)

  if (matchIndex === -1) {
    return `${cleanDescription.slice(0, SEARCH_DESCRIPTION_MAX_LENGTH).trim()}...`
  }

  const start = Math.max(0, matchIndex - 36)
  const end = Math.min(cleanDescription.length, matchIndex + normalizedSearchText.length + 56)
  const prefix = start > 0 ? '... ' : ''
  const suffix = end < cleanDescription.length ? '...' : ''

  return `${prefix}${cleanDescription.slice(start, end).trim()}${suffix}`
}

const pushSearchResult = (
  results: SearchMatchResult[],
  seen: Set<string>,
  searchText: string,
  {
    id,
    title,
    description,
    searchText: extraSearchText = '',
  }: {
    id: string
    title: unknown
    description?: unknown
    searchText?: string
  },
) => {
  const normalizedSearchText = normalizeSearchPhrase(searchText)
  const resultTitle = getCleanSearchResultText(title)
  const resultDescription = getCleanSearchResultText(description)

  if (!resultTitle) return

  const searchCorpus = [resultTitle, resultDescription, extraSearchText].filter(Boolean).join(' ')
  if (!textMatchesSearch(searchCorpus, normalizedSearchText)) return

  const normalizedKey = `${normalizeSearchPhrase(resultTitle)}:${normalizeSearchPhrase(resultDescription)}`
  if (seen.has(normalizedKey)) return

  seen.add(normalizedKey)
  results.push({
    id,
    title: resultTitle,
    description: resultDescription ? truncateSearchDescription(resultDescription, searchText) : 'Open result',
  })
}

const getPreviewSearchResults = (
  searchText: string,
  pages: SearchSourcePage[] = [],
  appTitle = APP_TITLE_PLACEHOLDER,
  appSubtitle = '',
) => {
  const normalizedSearchText = normalizeSearchPhrase(searchText)
  if (!normalizedSearchText) return []

  const results: SearchMatchResult[] = []
  const seen = new Set<string>()
  const visiblePages = pages.filter((page) => !page.hidden && !page.dynamic)

  pushSearchResult(results, seen, searchText, {
    id: 'app-overview',
    title: appTitle,
    description: appSubtitle,
  })

  visiblePages.forEach((page, pageIndex) => {
    if (textMatchesSearch(page.name, normalizedSearchText)) {
      pushSearchResult(results, seen, searchText, {
        id: `page-${pageIndex}-${page.name}`,
        title: page.name,
        description: 'Go to page',
      })
    }
  })

  visiblePages.forEach((page, pageIndex) => {
    page.elements?.forEach((element, elementIndex) => {
      const componentLabel = COMPONENT_RESULT_LABELS[element.componentId || ''] || 'Element'
      const properties = element.properties ?? {}
      const elementTitle = SEARCH_RESULT_PROPERTY_KEYS
        .map((key) => getCleanSearchResultText(properties[key]))
        .find(Boolean)
      const elementDescription = getCleanSearchResultText(properties.Description)
        || getCleanSearchResultText(properties.Subheading)
        || getCleanSearchResultText(properties.Text)
        || componentLabel

      pushSearchResult(results, seen, searchText, {
        id: `element-${pageIndex}-${elementIndex}`,
        title: elementTitle || componentLabel,
        description: elementDescription,
        searchText: [
          componentLabel,
          ...SEARCH_RESULT_PROPERTY_KEYS.map((key) => String(properties[key] ?? '')),
        ].join(' '),
      })

      const listItems = [
        ...parseSearchJsonItems(properties.Items),
        ...parseSearchJsonItems(properties.Products),
      ]

      listItems.forEach((item, itemIndex) => {
        const itemTitle = getItemText(item, ['title', 'name', 'label', 'question'])
        const itemDescription = getItemText(item, ['description', 'text', 'answer', 'details', 'category', 'price'])
        pushSearchResult(results, seen, searchText, {
          id: `item-${pageIndex}-${elementIndex}-${itemIndex}`,
          title: itemTitle || elementTitle || componentLabel,
          description: itemDescription || `${componentLabel} item in ${page.name}`,
          searchText: getItemSearchCorpus(item),
        })
      })

      const formTitle = getCleanSearchResultText(properties['Form Title'])
        || getCleanSearchResultText(properties.Label)
        || getCleanSearchResultText(properties['Button Label'])
      const formDescription = getCleanSearchResultText(properties['Form Description'])
        || getCleanSearchResultText(properties.Description)
      const formFields = parseSearchJsonItems(properties['Form Fields'])
      const hasFormConfig = element.componentId === 'form'
        || properties.Action === 'Open Form'
        || Boolean(getCleanSearchResultText(properties['Form Title']))
        || formFields.length > 0

      if (hasFormConfig && (formTitle || formFields.length > 0)) {
        pushSearchResult(results, seen, searchText, {
          id: `form-${pageIndex}-${elementIndex}`,
          title: formTitle || 'Form',
          description: formDescription || `Open form from ${page.name}`,
          searchText: [
            componentLabel,
            String(properties.Action ?? ''),
            String(properties['Submits To'] ?? ''),
            String(properties['Form Submit Label'] ?? ''),
          ].join(' '),
        })
      }

      formFields.forEach((field, fieldIndex) => {
        const fieldTitle = getItemText(field, ['label', 'name'])
        const fieldDescription = getItemText(field, ['placeholder', 'type'])
        pushSearchResult(results, seen, searchText, {
          id: `form-field-${pageIndex}-${elementIndex}-${fieldIndex}`,
          title: fieldTitle,
          description: fieldDescription || `Field in ${formTitle || 'form'}`,
          searchText: getItemSearchCorpus(field),
        })
      })

      const submitsTo = getCleanSearchResultText(properties['Submits To'])
      if (hasFormConfig && submitsTo) {
        pushSearchResult(results, seen, searchText, {
          id: `collection-${pageIndex}-${elementIndex}`,
          title: submitsTo,
          description: `Data collection for ${formTitle || page.name}`,
          searchText: `${componentLabel} data form submissions ${formTitle}`,
        })
      }
    })
  })

  return results.slice(0, SEARCH_RESULT_LIMIT)
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

const renderFeaturedSearches = (
  featuredSearches: string[],
  onSelect: (keyword: string) => void,
) => (
  <section className="live-preview__search-featured" aria-label="Featured searches">
    <h2 className="live-preview__search-featured-title">Featured searches</h2>
    {renderFeaturedSearchList(featuredSearches, onSelect)}
  </section>
)

const renderNoResultsFeaturedSearches = (
  featuredSearches: string[],
  onSelect: (keyword: string) => void,
) => (
  <section className="live-preview__search-empty-featured" aria-label="Featured searches">
    {renderFeaturedSearchList(featuredSearches, onSelect, 'live-preview__search-empty-featured-list')}
  </section>
)

const renderSearchSkeleton = () => (
  <section
    className="live-preview__search-skeleton"
    aria-label="Loading search results"
    aria-live="polite"
    aria-busy="true"
  >
    {SEARCH_SKELETON_ITEMS.map((item) => (
      <div key={item} className="live-preview__search-skeleton-row">
        <div className="live-preview__search-skeleton-content">
          <span className="live-preview__search-skeleton-block live-preview__search-skeleton-avatar" />
          <span className="live-preview__search-skeleton-copy">
            <span className="live-preview__search-skeleton-block live-preview__search-skeleton-line live-preview__search-skeleton-line--title" />
            <span className="live-preview__search-skeleton-block live-preview__search-skeleton-line live-preview__search-skeleton-line--subtitle" />
          </span>
        </div>
        <span className="live-preview__search-skeleton-block live-preview__search-skeleton-pill" />
      </div>
    ))}
  </section>
)

const getHighlightedParts = (text: string, searchText: string) => {
  const normalizedSearchText = searchText.trim().toLocaleLowerCase()
  const normalizedText = text.toLocaleLowerCase()
  const parts: Array<{ isMatch: boolean, text: string }> = []

  if (!normalizedSearchText) {
    return [{ isMatch: false, text }]
  }

  let cursor = 0
  let matchIndex = normalizedText.indexOf(normalizedSearchText, cursor)

  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      parts.push({ isMatch: false, text: text.slice(cursor, matchIndex) })
    }

    const matchEnd = matchIndex + normalizedSearchText.length
    parts.push({ isMatch: true, text: text.slice(matchIndex, matchEnd) })
    cursor = matchEnd
    matchIndex = normalizedText.indexOf(normalizedSearchText, cursor)
  }

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

export function LivePreviewSearchPage({
  onClose,
  appTitle,
  appSubtitle,
  pages,
}: LivePreviewSearchPageProps) {
  const [query, setQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const recentSearchStorageKey = useMemo(() => getRecentSearchStorageKey(appTitle), [appTitle])
  const [recentSearches, setRecentSearches] = useState<string[]>(
    () => readRecentSearches(recentSearchStorageKey),
  )
  const [noResultsQuery, setNoResultsQuery] = useState('')
  const [resultQuery, setResultQuery] = useState('')
  const [pendingSearchQuery, setPendingSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const searchDelayRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const featuredSearches = useMemo(
    () => deriveFeaturedSearches({ appTitle, appSubtitle, pages }),
    [appTitle, appSubtitle, pages],
  )
  const hasQuery = query.length > 0
  const isSearchLoading = pendingSearchQuery.length > 0
  const hasNoResults = !isSearchLoading && noResultsQuery.length > 0
  const hasSearchResults = !isSearchLoading && resultQuery.length > 0
  const hasRecentSearches = recentSearches.length > 0
  const matchingSearchResults = hasSearchResults
    ? getPreviewSearchResults(resultQuery, pages, appTitle, appSubtitle)
    : []
  const showRecentSearches = !isSearchLoading && !hasQuery && !hasNoResults && !hasSearchResults && hasRecentSearches
  const showDefaultSearches = !isSearchLoading && !hasQuery && !hasNoResults && !hasSearchResults && featuredSearches.length > 0
  const showNoResultsFeaturedSearches = hasNoResults && featuredSearches.length > 0

  useEffect(() => {
    setRecentSearches(readRecentSearches(recentSearchStorageKey))
  }, [recentSearchStorageKey])

  useEffect(() => () => {
    if (searchDelayRef.current !== null) {
      window.clearTimeout(searchDelayRef.current)
    }
  }, [])

  const updateRecentSearches = (getNextSearches: (currentSearches: string[]) => string[]) => {
    setRecentSearches((currentSearches) => {
      const nextSearches = getNextSearches(currentSearches).slice(0, RECENT_SEARCH_LIMIT)
      writeRecentSearches(recentSearchStorageKey, nextSearches)
      return nextSearches
    })
  }

  const clearPendingSearch = () => {
    if (searchDelayRef.current !== null) {
      window.clearTimeout(searchDelayRef.current)
      searchDelayRef.current = null
    }
    setPendingSearchQuery('')
  }

  const completeSearch = (nextQuery: string) => {
    updateRecentSearches((currentSearches) => [
      nextQuery,
      ...currentSearches.filter((item) => item.toLocaleLowerCase() !== nextQuery.toLocaleLowerCase()),
    ])

    if (getPreviewSearchResults(nextQuery, pages, appTitle, appSubtitle).length === 0) {
      setQuery(nextQuery)
      setNoResultsQuery(nextQuery)
      setResultQuery('')
      setPendingSearchQuery('')
      inputRef.current?.focus()
      return
    }

    setNoResultsQuery('')
    setResultQuery(nextQuery)
    setQuery(nextQuery)
    setPendingSearchQuery('')
    inputRef.current?.focus()
  }

  const startSearch = (searchText: string, { syncQuery = true } = {}) => {
    const nextQuery = searchText.trim()
    clearPendingSearch()

    if (!nextQuery) {
      if (syncQuery) setQuery('')
      setNoResultsQuery('')
      setResultQuery('')
      inputRef.current?.focus()
      return
    }

    if (syncQuery) setQuery(nextQuery)
    setNoResultsQuery('')
    setResultQuery('')
    setPendingSearchQuery(nextQuery)
    searchDelayRef.current = window.setTimeout(() => {
      searchDelayRef.current = null
      completeSearch(nextQuery)
    }, SEARCH_LOADING_DELAY_MS)
    inputRef.current?.focus()
  }

  const handleClear = () => {
    clearPendingSearch()
    setQuery('')
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
    setNoResultsQuery('')
    setResultQuery('')

    if (!nextQuery.trim()) {
      clearPendingSearch()
      return
    }

    startSearch(nextQuery, { syncQuery: false })
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

      {isSearchLoading && renderSearchSkeleton()}

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

      {showNoResultsFeaturedSearches && renderNoResultsFeaturedSearches(featuredSearches, submitSearch)}

      {hasSearchResults && (
        <section className="live-preview__search-match-results" aria-label={`Search results for ${resultQuery}`}>
          {matchingSearchResults.map((result) => (
            <button
              key={result.id}
              type="button"
              className="live-preview__search-match-item"
            >
              <span className="live-preview__search-match-copy">
                <span className="live-preview__search-match-title">
                  {renderHighlightedText(result.title, resultQuery)}
                </span>
                <span className="live-preview__search-match-description">
                  {renderHighlightedText(result.description, resultQuery)}
                </span>
              </span>
            </button>
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
                <div className="live-preview__search-history-content">
                  <span className="live-preview__search-history-icon" aria-hidden="true">
                    <DSIcon name="clock-arrow-rotate-left" category="time-date" size={16} />
                  </span>
                  <span className="live-preview__search-history-text">{search}</span>
                </div>
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

      {showDefaultSearches && renderFeaturedSearches(featuredSearches, submitSearch)}
    </section>
  )
}
