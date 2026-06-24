import { type FormEvent, type KeyboardEvent, useRef, useState } from 'react'
import { AppIcon } from '@jf/app-elements'
import { Icon as DSIcon } from '@jf/design-system'

interface LivePreviewSearchPageProps {
  onClose: () => void
}

const SEARCHABLE_PREVIEW_TERMS = [
  'northstar family clinic',
  'same-day care',
  'trusted clinicians',
  'patient experience',
  'care that fits your life',
  'appointment',
  'book a visit',
  'urgent needs',
  'long-term wellness',
  'lab results',
  'family health',
  'front desk',
  'services',
  'doctors',
  'portal',
  'melis',
]

const hasRelatedSearchResult = (searchText: string) => {
  const normalizedSearchText = searchText.toLocaleLowerCase()

  return SEARCHABLE_PREVIEW_TERMS.some((term) => (
    term.includes(normalizedSearchText) || normalizedSearchText.includes(term)
  ))
}

const formatSearchTerm = (searchText: string) => (
  searchText
    .trim()
    .split(/\s+/)
    .map((word) => `${word.charAt(0).toLocaleUpperCase()}${word.slice(1)}`)
    .join(' ')
)

const getPreviewSearchResults = (searchText: string) => {
  const displaySearchText = formatSearchTerm(searchText)
  const inlineSearchText = searchText.trim().toLocaleLowerCase()

  return [
    { id: 'page-primary', title: `${displaySearchText} Care Page`, description: 'Go to page' },
    { id: 'page-booking', title: `${displaySearchText} Visit Page`, description: 'Go to page' },
    { id: 'page-services', title: `${displaySearchText} Services Page`, description: 'Go to page' },
    { id: 'page-doctors', title: `${displaySearchText} Doctors Page`, description: 'Go to page' },
    { id: 'page-portal', title: `${displaySearchText} Portal Page`, description: 'Go to page' },
    { id: 'page-results', title: `${displaySearchText} Results Page`, description: 'Go to page' },
    {
      id: 'content-appointment',
      title: `Same-day ${displaySearchText} Appointment`,
      description: `... review available ${inlineSearchText} appointments, care team notes, and visit details...`,
    },
    {
      id: 'content-care-team',
      title: `Northstar ${displaySearchText} Care Team`,
      description: `A simple way to message your ${inlineSearchText} care team and manage family health updates.`,
    },
    {
      id: 'content-lab-results',
      title: 'Lab Results Overview',
      description: `... track ${inlineSearchText} results, follow-up notes, prescriptions, and secure portal updates...`,
    },
  ]
}

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

export function LivePreviewSearchPage({ onClose }: LivePreviewSearchPageProps) {
  const [query, setQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [noResultsQuery, setNoResultsQuery] = useState('')
  const [resultQuery, setResultQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const hasQuery = query.length > 0
  const hasNoResults = noResultsQuery.length > 0
  const hasSearchResults = resultQuery.length > 0
  const hasRecentSearches = recentSearches.length > 0
  const matchingSearchResults = hasSearchResults ? getPreviewSearchResults(resultQuery) : []
  const showRecentSearches = !hasQuery && !hasNoResults && !hasSearchResults && hasRecentSearches

  const handleClear = () => {
    setQuery('')
    setNoResultsQuery('')
    setResultQuery('')
    inputRef.current?.focus()
  }

  const submitSearch = (searchText = query) => {
    const nextQuery = searchText.trim()
    if (!nextQuery) {
      inputRef.current?.focus()
      return
    }

    setRecentSearches((currentSearches) => [
      nextQuery,
      ...currentSearches.filter((item) => item.toLocaleLowerCase() !== nextQuery.toLocaleLowerCase()),
    ].slice(0, 3))

    if (!hasRelatedSearchResult(nextQuery)) {
      setQuery(nextQuery)
      setNoResultsQuery(nextQuery)
      setResultQuery('')
      inputRef.current?.focus()
      return
    }

    setNoResultsQuery('')
    setResultQuery(nextQuery)
    setQuery(nextQuery)
    inputRef.current?.focus()
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
    setRecentSearches((currentSearches) => currentSearches.filter((item) => item !== search))
  }

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery)
    setNoResultsQuery('')
    setResultQuery('')
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
            placeholder="Search"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {hasQuery && (
            <button
              type="button"
              className="live-preview__search-clear"
              aria-label="Clear search"
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
              onClick={() => setRecentSearches([])}
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
    </section>
  )
}
