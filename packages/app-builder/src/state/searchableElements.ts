export const SEARCH_BAR_AUTO_ENABLE_THRESHOLD = 5

export const SEARCHABLE_ELEMENT_IDS = new Set([
  'form',
  'heading',
  'rich-text',
  'text',
  'paragraph',
  'list',
  'card',
  'sign-document',
  'link',
  'document',
  'button',
  'social-follow',
  'accordion',
  'faq',
  'product-list',
  'donation-box',
  'table',
  'report',
  'chart',
  'sentbox',
  'sent-box',
])

interface SearchableElementSource {
  componentId?: string
}

interface SearchablePageSource {
  dynamic?: boolean
  elements?: SearchableElementSource[]
}

export const isSearchableElement = (componentId?: string) => (
  Boolean(componentId && SEARCHABLE_ELEMENT_IDS.has(componentId))
)

export const countSearchableElements = (pages: SearchablePageSource[] = []) => (
  pages
    .filter((page) => !page.dynamic)
    .reduce((total, page) => (
      total + (page.elements ?? []).filter((element) => isSearchableElement(element.componentId)).length
    ), 0)
)
