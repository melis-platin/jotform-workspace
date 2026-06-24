import type { PropertyValues } from '@jf/app-elements'
import type { AppPreset } from '../presets/appPresets'

export type DeepLinkTargetType = 'page' | 'form'

export interface DeepLinkTarget {
  id: string
  label: string
  type: DeepLinkTargetType
}

interface DeepLinkElementSource {
  id?: string
  componentId: string
  properties?: Partial<PropertyValues> | Record<string, unknown>
}

interface DeepLinkPageSource {
  id: string
  name: string
  elements: DeepLinkElementSource[]
}

const FALLBACK_PAGES: DeepLinkPageSource[] = [
  { id: 'page-1', name: 'Home', elements: [] },
]

const FORM_LABEL_KEYS = ['Label', 'Form Title', 'Title', 'Name', 'Button Label']

function getTextProperty(properties: DeepLinkElementSource['properties'], key: string): string {
  const value = properties?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

function isFormTarget(element: DeepLinkElementSource): boolean {
  if (element.componentId === 'form') return true
  return getTextProperty(element.properties, 'Action') === 'Open Form'
}

function getFormTargetLabel(element: DeepLinkElementSource, formIndex: number): string {
  for (const key of FORM_LABEL_KEYS) {
    const label = getTextProperty(element.properties, key)
    if (label) return label
  }

  return `Form ${formIndex + 1}`
}

export function createDeepLinkTargetsFromPages(pages: DeepLinkPageSource[]): DeepLinkTarget[] {
  const sourcePages = pages.length > 0 ? pages : FALLBACK_PAGES
  const targets: DeepLinkTarget[] = sourcePages.map((page, index) => ({
    id: `page:${page.id}`,
    label: page.name.trim() || `Page ${index + 1}`,
    type: 'page',
  }))

  let formIndex = 0

  for (const page of sourcePages) {
    for (const element of page.elements) {
      if (!isFormTarget(element)) continue

      targets.push({
        id: `form:${element.id ?? `${page.id}:${formIndex}`}`,
        label: getFormTargetLabel(element, formIndex),
        type: 'form',
      })
      formIndex += 1
    }
  }

  return targets
}

export function createDeepLinkTargetsFromPreset(preset?: AppPreset): DeepLinkTarget[] {
  if (!preset) return createDeepLinkTargetsFromPages(FALLBACK_PAGES)

  let elementIndex = 1
  const pages: DeepLinkPageSource[] = preset.pages.map((page) => ({
    id: page.id,
    name: page.name,
    elements: page.elements.map((element) => ({
      id: `element-${elementIndex++}`,
      componentId: element.componentId,
      properties: element.properties,
    })),
  }))

  return createDeepLinkTargetsFromPages(pages)
}
