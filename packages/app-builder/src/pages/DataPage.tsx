import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AppIcon, ComponentRegistry } from '@jf/app-elements'
import { Icon } from '@jf/design-system'
import { type AppPreset, type PresetElement } from '../presets/appPresets'
import { ROLE_COLOR_PALETTE } from '../state/appUserRoles'
import { buildInitialStateFromPreset, type AppPage, type CanvasElement } from './BuildPage'

type DataCellValue = string | number | boolean | null | undefined
type DataColumnType =
  | 'shortText'
  | 'longText'
  | 'email'
  | 'dateTime'
  | 'attachment'
  | 'starRating'
  | 'singleSelect'
  | 'multipleSelection'
  | 'assignee'
  | 'number'
  | 'phoneNumber'
  | 'checkbox'

interface DataColumn {
  key: string
  label: string
  type: DataColumnType
}

interface DataTable {
  id: string
  name: string
  description: string
  sourceType: 'List' | 'Form' | 'Products' | 'Donation' | 'Table' | 'Tasks' | 'Chart'
  sharedSourceKey?: string
  formSourceKey?: string
  columns: DataColumn[]
  rows: Record<string, DataCellValue>[]
  connections: DataTableConnection[]
}

interface DataTableConnection {
  elementId: string
  pageId: string
  label: string
  icon: string
  iconCategory?: string
  isFormElement?: boolean
}

interface FormFieldLike {
  name?: string
  label?: string
  type?: string
  placeholder?: string
  options?: string[]
}

const DATA_ELEMENT_IDS = new Set(['list', 'product-list', 'donation-box', 'form', 'table', 'daily-task-manager', 'chart'])
const SHARED_TABLE_CONSUMER_IDS = new Set(['list', 'ai-widget'])
const LIST_COLUMN_PRIORITY = ['title', 'name', 'description', 'image', 'avatar', 'photo', 'price', 'date', 'time', 'duration', 'coach', 'category', 'location', 'details', 'detail']
const PRODUCT_COLUMN_PRIORITY = ['name', 'title', 'description', 'price', 'image', 'category', 'sku', 'inventory']
const SELECTION_BADGE_COLOR_ORDER = [0, 2, 1, 3, 17, 18, 19, 15, 7, 8, 9, 20, 23, 24, 25]
const DATA_COLUMN_ICON_BY_TYPE: Record<DataColumnType, { name: string; category: string }> = {
  shortText: { name: 'type-square-filled', category: 'editor' },
  longText: { name: 'text', category: 'general' },
  email: { name: 'at', category: 'general' },
  dateTime: { name: 'calendar-filled', category: 'time-date' },
  attachment: { name: 'paperclip-diagonal', category: 'forms-files' },
  starRating: { name: 'star-filled', category: 'general' },
  singleSelect: { name: 'tag-filled', category: 'finance' },
  multipleSelection: { name: 'tags-filled', category: 'finance' },
  assignee: { name: 'user-filled', category: 'users' },
  number: { name: 'number-square-filled', category: 'general' },
  phoneNumber: { name: 'phone-filled', category: 'communication' },
  checkbox: { name: 'check-square-filled', category: 'general' },
}
const DEFAULT_FORM_FIELDS: FormFieldLike[] = [
  { name: 'fullName', label: 'Full Name', type: 'text' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'message', label: 'Message', type: 'textarea' },
]

function DataPageAiSquaresIcon() {
  return (
    <span className="jf-icon data-page__ai-squares-icon" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M17.9599 6.36973C18.4578 6.18547 18.4578 5.48119 17.9599 5.29694L17.227 5.02575C16.1833 4.63955 15.3604 3.81668 14.9743 2.773L14.7031 2.04012C14.5188 1.54218 13.8145 1.54218 13.6303 2.04012L13.3591 2.773C12.9729 3.81668 12.15 4.63955 11.1063 5.02575L10.3735 5.29694C9.87552 5.48119 9.87552 6.18547 10.3735 6.36973L11.1063 6.64092C12.15 7.02711 12.9729 7.84999 13.3591 8.89367L13.6303 9.62654C13.8145 10.1245 14.5188 10.1245 14.7031 9.62654L14.9743 8.89366C15.3604 7.84999 16.1833 7.02711 17.227 6.64092L17.9599 6.36973ZM2.5 3.33333C2.03976 3.33333 1.66667 3.70643 1.66667 4.16667V9.16667C1.66667 9.6269 2.03976 10 2.5 10H7.5C7.96024 10 8.33333 9.6269 8.33333 9.16667V4.16667C8.33333 3.70643 7.96024 3.33333 7.5 3.33333H2.5ZM2.5 11.6667C2.03976 11.6667 1.66667 12.0398 1.66667 12.5V17.5C1.66667 17.9602 2.03976 18.3333 2.5 18.3333H7.5C7.96024 18.3333 8.33333 17.9602 8.33333 17.5V12.5C8.33333 12.0398 7.96024 11.6667 7.5 11.6667H2.5ZM10 12.5C10 12.0398 10.3731 11.6667 10.8333 11.6667H15.8333C16.2936 11.6667 16.6667 12.0398 16.6667 12.5V17.5C16.6667 17.9602 16.2936 18.3333 15.8333 18.3333H10.8333C10.3731 18.3333 10 17.9602 10 17.5V12.5Z"
          fill="url(#data-page-ai-squares-gradient)"
        />
        <defs>
          <linearGradient id="data-page-ai-squares-gradient" x1="1.66667" y1="10" x2="18.3333" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0.370192" stopColor="#9747FF" />
            <stop offset="1" stopColor="#0099FF" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  )
}

function DataPagePlusSquareIcon() {
  return (
    <span className="jf-icon data-page__plus-square-icon" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3.33333 1.33333C2.22876 1.33333 1.33333 2.22876 1.33333 3.33333V12.6667C1.33333 13.7712 2.22876 14.6667 3.33333 14.6667H12.6667C13.7712 14.6667 14.6667 13.7712 14.6667 12.6667V3.33333C14.6667 2.22876 13.7712 1.33333 12.6667 1.33333H3.33333ZM8 4.66667C8.36819 4.66667 8.66667 4.96514 8.66667 5.33333V7.33333H10.6667C11.0349 7.33333 11.3333 7.63181 11.3333 8C11.3333 8.36819 11.0349 8.66667 10.6667 8.66667H8.66667V10.6667C8.66667 11.0349 8.36819 11.3333 8 11.3333C7.63181 11.3333 7.33333 11.0349 7.33333 10.6667V8.66667H5.33333C4.96514 8.66667 4.66667 8.36819 4.66667 8C4.66667 7.63181 4.96514 7.33333 5.33333 7.33333H7.33333V5.33333C7.33333 4.96514 7.63181 4.66667 8 4.66667Z"
          fill="url(#data-page-plus-square-gradient)"
        />
        <defs>
          <linearGradient id="data-page-plus-square-gradient" x1="1.33333" y1="8" x2="14.6667" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0.323411" stopColor="#9747FF" />
            <stop offset="1" stopColor="#0099FF" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  )
}

export function presetUsesDataElement(preset: AppPreset): boolean {
  return preset.pages.some((page) => page.elements.some(isPresetDataElement))
}

function isPresetDataElement(element: PresetElement): boolean {
  if (DATA_ELEMENT_IDS.has(element.componentId)) return true
  if (isSharedTableConsumerId(element.componentId)) return true
  return element.componentId === 'button' && element.properties?.Action === 'Open Form'
}

function isCanvasDataElement(element: CanvasElement): boolean {
  if (DATA_ELEMENT_IDS.has(element.componentId)) return true
  return element.componentId === 'button' && String(element.properties.Action ?? '') === 'Open Form'
}

function isSharedTableConsumerId(componentId: string): boolean {
  return SHARED_TABLE_CONSUMER_IDS.has(componentId)
    || ComponentRegistry.get(componentId)?.name === 'AI Widget'
}

function isSharedTableConsumer(element: CanvasElement): boolean {
  return isSharedTableConsumerId(element.componentId)
}

function parseJsonArray(value: unknown): Record<string, DataCellValue>[] {
  if (Array.isArray(value)) return value.map(normalizeRecord)
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(normalizeRecord) : []
  } catch {
    return []
  }
}

function parseFormFields(value: unknown): FormFieldLike[] {
  if (Array.isArray(value)) return value.map(normalizeFormField)
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(normalizeFormField) : []
  } catch {
    return []
  }
}

function normalizeRecord(value: unknown): Record<string, DataCellValue> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, DataCellValue>>((acc, [key, entry]) => {
    if (entry == null || typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean') {
      acc[key] = entry
    } else {
      acc[key] = JSON.stringify(entry)
    }
    return acc
  }, {})
}

function normalizeFormField(value: unknown): FormFieldLike {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const field = value as Record<string, unknown>
  return {
    name: typeof field.name === 'string' ? field.name : undefined,
    label: typeof field.label === 'string' ? field.label : undefined,
    type: typeof field.type === 'string' ? field.type : undefined,
    placeholder: typeof field.placeholder === 'string' ? field.placeholder : undefined,
    options: Array.isArray(field.options) ? field.options.filter((option): option is string => typeof option === 'string') : undefined,
  }
}

function titleCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function isImageKey(key: string): boolean {
  const normalized = key.toLowerCase()
  return normalized.includes('image') || normalized.includes('avatar') || normalized.includes('photo') || normalized.includes('logo')
}

function normalizeColumnText(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
}

function inferColumnTypeFromKey(key: string, sampleValues: DataCellValue[] = []): DataColumnType {
  const normalized = normalizeColumnText(key)
  const nonEmptyValues = sampleValues.filter((value) => value != null && value !== '')

  if (nonEmptyValues.some((value) => typeof value === 'boolean')) return 'checkbox'
  if (isImageKey(key) || /\b(file|attachment|upload|document|pdf)\b/.test(normalized)) return 'attachment'
  if (/\b(email|e mail|mail)\b/.test(normalized)) return 'email'
  if (/\b(phone|mobile|tel|telephone)\b/.test(normalized)) return 'phoneNumber'
  if (/\b(date|time|submitted at|created at|updated|due)\b/.test(normalized)) return 'dateTime'
  if (/\b(rating|score|stars?)\b/.test(normalized)) return 'starRating'
  if (/\b(amount|age|price|total|count|number|size|inventory|qty|quantity|value|metric|duration|sleep|energy)\b/.test(normalized)) return 'number'
  if (/\b(owner|assignee|assigned|responsible)\b/.test(normalized)) return 'assignee'
  if (/\b(tags?|categories|options|features)\b/.test(normalized)) return 'multipleSelection'
  if (/\b(description|details?|notes?|message|comment|answer|question|reason|experience|allergies|medications|need|text|body|content|which|what|space)\b/.test(normalized)) return 'longText'
  if (/\b(status|category|session|class|track|type|goal|location)\b/.test(normalized)) return 'singleSelect'
  return 'shortText'
}

function columnTypeFromFormField(field: FormFieldLike): DataColumnType {
  const normalizedType = String(field.type ?? '').toLowerCase()
  const key = `${field.name ?? ''} ${field.label ?? ''}`

  if (['textarea', 'longtext', 'long-text', 'paragraph'].includes(normalizedType)) return 'longText'
  if (normalizedType === 'email') return 'email'
  if (['date', 'datetime', 'datetime-local', 'time'].includes(normalizedType)) return 'dateTime'
  if (['file', 'attachment', 'upload'].includes(normalizedType)) return 'attachment'
  if (['rating', 'star', 'star-rating'].includes(normalizedType)) return 'starRating'
  if (['select', 'dropdown', 'radio', 'single-select'].includes(normalizedType)) return 'singleSelect'
  if (['multiselect', 'multi-select', 'checkbox-group', 'multiple-selection'].includes(normalizedType)) return 'multipleSelection'
  if (['assignee', 'user'].includes(normalizedType)) return 'assignee'
  if (['number', 'numeric', 'range'].includes(normalizedType)) return 'number'
  if (['tel', 'phone', 'phone-number'].includes(normalizedType)) return 'phoneNumber'
  if (['checkbox', 'boolean', 'switch'].includes(normalizedType)) return 'checkbox'
  return inferColumnTypeFromKey(key)
}

function isSelectionColumn(column: DataColumn): boolean {
  return column.type === 'singleSelect' || column.type === 'multipleSelection'
}

function parseSelectionArray(value: string): string[] | null {
  const trimmedValue = value.trim()
  if (!trimmedValue.startsWith('[')) return null

  try {
    const parsed = JSON.parse(trimmedValue)
    return Array.isArray(parsed)
      ? parsed
        .map((option) => typeof option === 'string' || typeof option === 'number' || typeof option === 'boolean' ? String(option).trim() : '')
        .filter(Boolean)
      : null
  } catch {
    return null
  }
}

function getSelectionValues(column: DataColumn, value: DataCellValue): string[] {
  if (value == null || value === '') return []
  const displayValue = String(value).trim()
  if (!displayValue) return []

  if (column.type === 'multipleSelection') {
    const parsedValues = parseSelectionArray(displayValue)
    if (parsedValues) return parsedValues
    return displayValue
      .split(/\s*[,;]\s*/)
      .map((option) => option.trim())
      .filter(Boolean)
  }

  return [displayValue]
}

function buildSelectionColorMap(columns: DataColumn[], rows: Record<string, DataCellValue>[]) {
  return columns.reduce<Record<string, Record<string, string>>>((selectionColorsByColumn, column) => {
    if (!isSelectionColumn(column)) return selectionColorsByColumn

    const columnColors: Record<string, string> = {}
    rows.forEach((row) => {
      getSelectionValues(column, row[column.key]).forEach((option) => {
        if (columnColors[option]) return
        const colorIndex = SELECTION_BADGE_COLOR_ORDER[Object.keys(columnColors).length % SELECTION_BADGE_COLOR_ORDER.length] ?? 0
        columnColors[option] = ROLE_COLOR_PALETTE[colorIndex] ?? ROLE_COLOR_PALETTE[0]
      })
    })
    selectionColorsByColumn[column.key] = columnColors
    return selectionColorsByColumn
  }, {})
}

function getSelectionBadgeStyle(color?: string): CSSProperties {
  return { '--data-page-selection-badge-bg': color ?? ROLE_COLOR_PALETTE[0] } as CSSProperties
}

function orderKeys(keys: string[], priority: string[]): string[] {
  const lowerPriority = priority.map((key) => key.toLowerCase())
  return [...keys].sort((a, b) => {
    const aIndex = lowerPriority.indexOf(a.toLowerCase())
    const bIndex = lowerPriority.indexOf(b.toLowerCase())
    if (aIndex !== -1 || bIndex !== -1) {
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    }
    return a.localeCompare(b)
  })
}

function columnsFromRows(rows: Record<string, DataCellValue>[], priority: string[]): DataColumn[] {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).filter(Boolean)
  return orderKeys(keys, priority).map((key) => ({
    key,
    label: titleCase(key),
    type: inferColumnTypeFromKey(key, rows.map((row) => row[key])),
  }))
}

function getElementTitle(element: CanvasElement, fallback: string): string {
  const title = element.properties.Title
    ?? element.properties['Form Title']
    ?? element.properties.Label
    ?? element.properties['Submits To']
  return typeof title === 'string' && title.trim() ? title.trim() : fallback
}

function buildTableConnection(element: CanvasElement, page: AppPage): DataTableConnection {
  const component = ComponentRegistry.get(element.componentId)
  const isFormConnection = element.componentId === 'form'
    || (element.componentId === 'button' && String(element.properties.Action ?? '') === 'Open Form')
  const isProductListConnection = element.componentId === 'product-list'
  const isDonationConnection = element.componentId === 'donation-box'
  const isListConnection = element.componentId === 'list'
  const isAiWidgetConnection = isSharedTableConsumerId(element.componentId) && !isListConnection
  const listTitle = element.componentId === 'list' ? element.properties.Title : undefined
  const label = isFormConnection
    ? getElementTitle(element, component?.name ?? 'Form')
    : listTitle ?? element.properties.Label

  return {
    elementId: element.id,
    pageId: page.id,
    label: typeof label === 'string' && label.trim()
      ? label.trim()
      : component?.name ?? titleCase(element.componentId),
    icon: isFormConnection
      ? 'product-form-builder-filled'
      : isProductListConnection
        ? 'cart-shopping-filled'
        : isDonationConnection
          ? 'heart-filled'
          : isListConnection
            ? 'list-bullet'
            : isAiWidgetConnection
              ? 'ai-filled'
        : component?.icon ?? 'LayoutGrid',
    iconCategory: isFormConnection
      ? 'products'
      : isProductListConnection
        ? 'finance'
        : isDonationConnection
          ? 'general'
          : isListConnection
            ? 'editor'
            : isAiWidgetConnection
              ? 'ai'
          : undefined,
    isFormElement: element.componentId === 'form',
  }
}

function getSharedSourceKey(element: CanvasElement): string | undefined {
  if (!isSharedTableConsumer(element)) return undefined
  const dataSource = element.properties['Data Source']
  if (typeof dataSource !== 'string' || !dataSource.trim() || dataSource === 'New Table') return undefined
  return dataSource.trim().toLocaleLowerCase('en-US')
}

function getFormSourceKey(element: CanvasElement): string {
  return getElementTitle(element, 'Form').toLocaleLowerCase('en-US')
}

function formatPrice(value: DataCellValue, currency: string): DataCellValue {
  if (value == null || value === '') return value
  const text = String(value)
  if (/^[^\d\s]/.test(text)) return text
  return `${currency}${text}`
}

function buildListTable(element: CanvasElement, page: AppPage): DataTable | null {
  const rows = parseJsonArray(element.properties.Items)
  if (rows.length === 0) return null
  const title = getElementTitle(element, `${page.name} List`)
  const name = `${title} Dynamic List Table`
  return {
    id: element.id,
    name,
    description: `${page.name} / List`,
    sourceType: 'List',
    sharedSourceKey: getSharedSourceKey(element),
    columns: columnsFromRows(rows, LIST_COLUMN_PRIORITY),
    rows,
    connections: [buildTableConnection(element, page)],
  }
}

function buildProductTable(element: CanvasElement, page: AppPage): DataTable | null {
  const currency = typeof element.properties.Currency === 'string' ? element.properties.Currency : '$'
  const rows = parseJsonArray(element.properties.Products).map((row) => ({
    ...row,
    price: formatPrice(row.price, currency),
  }))
  if (rows.length === 0) return null
  const title = getElementTitle(element, `${page.name} Products`)
  const name = `${title} Products Table`
  return {
    id: element.id,
    name,
    description: `${page.name} / Products`,
    sourceType: 'Products',
    columns: columnsFromRows(rows, PRODUCT_COLUMN_PRIORITY),
    rows,
    connections: [buildTableConnection(element, page)],
  }
}

function buildDonationTable(element: CanvasElement, page: AppPage): DataTable {
  const currency = typeof element.properties['Currency Symbol'] === 'string'
    ? element.properties['Currency Symbol']
    : '$'
  const title = getElementTitle(element, 'Donations')
  const rows = [
    { donor: 'Jamie Morgan', amount: `${currency}50`, donatedAt: 'Jul 2, 2026 09:16', status: 'Completed' },
    { donor: 'Taylor Brooks', amount: `${currency}25`, donatedAt: 'Jul 1, 2026 18:42', status: 'Completed' },
    { donor: 'Avery Carter', amount: `${currency}100`, donatedAt: 'Jun 30, 2026 12:05', status: 'Completed' },
    { donor: 'Jordan Ellis', amount: `${currency}75`, donatedAt: 'Jun 29, 2026 08:31', status: 'Completed' },
  ]

  return {
    id: element.id,
    name: `${title} Donations`,
    description: `${page.name} / Donations`,
    sourceType: 'Donation',
    columns: columnsFromRows(rows, ['donor', 'amount', 'donatedAt', 'status']),
    rows,
    connections: [buildTableConnection(element, page)],
  }
}

function buildFormTable(element: CanvasElement, page: AppPage): DataTable {
  const fields = parseFormFields(element.properties['Form Fields'])
  const usableFields = fields.length > 0 ? fields : DEFAULT_FORM_FIELDS
  const title = getElementTitle(element, `${page.name} Form`)
  const name = `${title} Submissions`
  const columns = [
    ...usableFields.map((field, index) => ({
      key: field.name || `field${index + 1}`,
      label: field.label || titleCase(field.name || `Field ${index + 1}`),
      type: columnTypeFromFormField(field),
    })),
    { key: 'submittedAt', label: 'Submitted At', type: 'dateTime' as const },
    { key: 'status', label: 'Status', type: 'singleSelect' as const },
  ]
  return {
    id: element.id,
    name,
    description: `${page.name} / Form`,
    sourceType: 'Form',
    formSourceKey: getFormSourceKey(element),
    columns,
    rows: buildSubmissionRows(usableFields),
    connections: [buildTableConnection(element, page)],
  }
}

function buildSubmissionRows(fields: FormFieldLike[]): Record<string, DataCellValue>[] {
  const submittedDates = ['Jul 2, 2026 09:16', 'Jul 1, 2026 18:42', 'Jun 30, 2026 12:05', 'Jun 29, 2026 08:31']
  return submittedDates.map((submittedAt, rowIndex) => {
    const row = fields.reduce<Record<string, DataCellValue>>((acc, field, fieldIndex) => {
      const key = field.name || `field${fieldIndex + 1}`
      acc[key] = sampleFieldValue(field, rowIndex)
      return acc
    }, {})
    row.submittedAt = submittedAt
    row.status = rowIndex === 0 ? 'New' : 'Reviewed'
    return row
  })
}

function sampleFieldValue(field: FormFieldLike, index: number): string {
  const label = `${field.label ?? ''} ${field.name ?? ''} ${field.type ?? ''}`.toLowerCase()
  const names = ['Jamie Morgan', 'Taylor Brooks', 'Avery Carter', 'Jordan Ellis']
  if (field.options?.length) return field.options[index % field.options.length] ?? field.options[0] ?? ''
  if (label.includes('email')) return ['jamie.morgan@example.com', 'taylor.brooks@example.com', 'avery.carter@example.com', 'jordan.ellis@example.com'][index] ?? 'member@example.com'
  if (label.includes('phone')) return ['(555) 013-4488', '(555) 019-7402', '(555) 016-3381', '(555) 011-2048'][index] ?? '(555) 010-0000'
  if (label.includes('date')) return ['July 8', 'July 10', 'July 13', 'July 15'][index] ?? 'July 18'
  if (label.includes('time')) return ['Weekday mornings', 'After 6 PM', 'Saturday', 'Lunch break'][index] ?? 'Weekdays'
  if (label.includes('goal')) return ['Build strength', 'Improve conditioning', 'Lose fat', 'Move without pain'][index] ?? 'Build strength'
  if (label.includes('sleep')) return ['7 hours', '6.5 hours', '8 hours', '5 hours'][index] ?? '7 hours'
  if (label.includes('energy')) return ['8/10', '6/10', '9/10', '7/10'][index] ?? '8/10'
  if (label.includes('note') || label.includes('message') || label.includes('question') || label.includes('review')) {
    return ['Needs coach follow-up', 'Prefers small groups', 'Interested in nutrition', 'Returning after travel'][index] ?? 'Needs follow-up'
  }
  if (label.includes('name')) return names[index] ?? names[0]
  return field.placeholder?.replace(/^e\.g\.\s*/i, '') || ['Strength', 'Conditioning', 'Mobility', 'Recovery'][index] || 'Entry'
}

function buildWidgetTable(element: CanvasElement, page: AppPage): DataTable {
  const title = getElementTitle(element, `${page.name} Table`)
  const name = `${title} Table`
  const lowerTitle = title.toLowerCase()
  const rows = lowerTitle.includes('attendance')
    ? [
        { class: 'Strength Engine', member: 'Jamie Morgan', status: 'Reserved', coachNotes: 'Front squat focus' },
        { class: 'Pulse HIIT', member: 'Taylor Brooks', status: 'Waitlist', coachNotes: 'Bike option' },
        { class: 'Mobility Reset', member: 'Avery Carter', status: 'Checked In', coachNotes: 'Shoulder prep' },
        { class: 'Lift Lab', member: 'Jordan Ellis', status: 'No Show', coachNotes: 'Follow up' },
      ]
    : lowerTitle.includes('metric')
      ? [
          { member: 'Jamie Morgan', metric: 'Back Squat', value: '185 lb', updated: 'Jul 1, 2026' },
          { member: 'Taylor Brooks', metric: '2K Row', value: '7:54', updated: 'Jun 28, 2026' },
          { member: 'Avery Carter', metric: 'Attendance', value: '12 sessions', updated: 'Jun 27, 2026' },
          { member: 'Jordan Ellis', metric: 'Sleep Average', value: '7.2 hours', updated: 'Jun 26, 2026' },
        ]
      : [
          { entry: 'Record 1', owner: 'Melis Platin', status: 'Active', updated: 'Jul 2, 2026' },
          { entry: 'Record 2', owner: 'Taylor Brooks', status: 'Pending', updated: 'Jul 1, 2026' },
          { entry: 'Record 3', owner: 'Avery Carter', status: 'Complete', updated: 'Jun 30, 2026' },
          { entry: 'Record 4', owner: 'Jordan Ellis', status: 'Active', updated: 'Jun 29, 2026' },
        ]
  return {
    id: element.id,
    name,
    description: `${page.name} / Table`,
    sourceType: 'Table',
    columns: columnsFromRows(rows, ['class', 'member', 'entry', 'metric', 'value', 'status', 'coachNotes', 'owner', 'updated']),
    rows,
    connections: [],
  }
}

function buildChartTable(element: CanvasElement, page: AppPage): DataTable {
  const sourceName = String(element.properties['Data Source'] ?? '').trim() || 'My Chart'
  const rows = [
    { category: 'Category 1', value: 5, note: 'Note 1' },
    { category: 'Category 2', value: 10, note: 'Note 2' },
    { category: 'Category 3', value: 15, note: 'Note 3' },
    { category: 'Category 4', value: 20, note: 'Note 4' },
    { category: 'Category 5', value: 25, note: 'Note 5' },
    { category: 'Category 6', value: 30, note: 'Note 6' },
  ]
  return {
    id: element.id,
    name: sourceName,
    description: `${page.name} / Chart`,
    sourceType: 'Chart',
    columns: columnsFromRows(rows, ['category', 'value', 'note']),
    rows,
    connections: [buildTableConnection(element, page)],
  }
}

function buildTaskTable(element: CanvasElement, page: AppPage): DataTable {
  const rows = [
    { task: 'Complete onboarding workout', completed: 'No', owner: 'Member', dueDate: 'Jul 3, 2026' },
    { task: 'Log weekly check-in', completed: 'Yes', owner: 'Member', dueDate: 'Jul 2, 2026' },
    { task: 'Review coach notes', completed: 'No', owner: 'Coach', dueDate: 'Jul 4, 2026' },
    { task: 'Book recovery session', completed: 'No', owner: 'Member', dueDate: 'Jul 5, 2026' },
  ]
  const name = `${getElementTitle(element, 'Daily Tasks')} Table`
  return {
    id: element.id,
    name,
    description: `${page.name} / Tasks`,
    sourceType: 'Tasks',
    columns: columnsFromRows(rows, ['task', 'completed', 'owner', 'dueDate']),
    rows,
    connections: [],
  }
}

function buildTableForElement(element: CanvasElement, page: AppPage): DataTable | null {
  if (element.componentId === 'list') return buildListTable(element, page)
  if (element.componentId === 'product-list') return buildProductTable(element, page)
  if (element.componentId === 'donation-box') return buildDonationTable(element, page)
  if (element.componentId === 'form' || (element.componentId === 'button' && String(element.properties.Action ?? '') === 'Open Form')) return buildFormTable(element, page)
  if (element.componentId === 'table') return buildWidgetTable(element, page)
  if (element.componentId === 'daily-task-manager') return buildTaskTable(element, page)
  if (element.componentId === 'chart') return buildChartTable(element, page)
  return null
}

export function collectDataTables(pages: AppPage[]): DataTable[] {
  const elementTables = pages
    .filter((page) => !page.dynamic)
    .flatMap((page) => page.elements
      .filter(isCanvasDataElement)
      .map((element) => buildTableForElement(element, page))
      .filter((table): table is DataTable => Boolean(table)))

  const tables: DataTable[] = []
  const tablesBySharedSource = new Map<string, DataTable>()
  const tablesByFormSource = new Map<string, DataTable>()

  elementTables.forEach((table) => {
    const existingTable = table.sharedSourceKey
      ? tablesBySharedSource.get(table.sharedSourceKey)
      : table.formSourceKey
        ? tablesByFormSource.get(table.formSourceKey)
        : undefined

    if (!existingTable) {
      tables.push(table)
      if (table.sharedSourceKey) tablesBySharedSource.set(table.sharedSourceKey, table)
      if (table.formSourceKey) tablesByFormSource.set(table.formSourceKey, table)
      return
    }

    if (table.formSourceKey) {
      const existingTargetsForm = existingTable.connections.some((connection) => connection.isFormElement)
      const incomingTargetsForm = table.connections.some((connection) => connection.isFormElement)

      // An Open Form button is a trigger, not the actual form surface. When the
      // form exists in the app, make it the sole navigation target for this table.
      if (incomingTargetsForm && !existingTargetsForm) {
        existingTable.columns = table.columns
        existingTable.rows = table.rows
        existingTable.connections = table.connections
      } else if (!existingTargetsForm) {
        const connectedElements = new Set(
          existingTable.connections.map((connection) => `${connection.pageId}:${connection.elementId}`),
        )
        existingTable.connections.push(...table.connections.filter((connection) => (
          !connectedElements.has(`${connection.pageId}:${connection.elementId}`)
        )))
      }
      return
    }

    const connectedElements = new Set(
      existingTable.connections.map((connection) => `${connection.pageId}:${connection.elementId}`),
    )
    existingTable.connections.push(...table.connections.filter((connection) => (
      !connectedElements.has(`${connection.pageId}:${connection.elementId}`)
    )))
    if (table.rows.length > existingTable.rows.length) {
      existingTable.columns = table.columns
      existingTable.rows = table.rows
    }
  })

  pages
    .filter((page) => !page.dynamic)
    .flatMap((page) => page.elements.map((element) => ({ element, page })))
    .filter(({ element }) => isSharedTableConsumer(element) && element.componentId !== 'list')
    .forEach(({ element, page }) => {
      const sharedSourceKey = getSharedSourceKey(element)
      const table = sharedSourceKey ? tablesBySharedSource.get(sharedSourceKey) : undefined
      if (!table) return

      const connectionKey = `${page.id}:${element.id}`
      if (table.connections.some((connection) => `${connection.pageId}:${connection.elementId}` === connectionKey)) return
      table.connections.push(buildTableConnection(element, page))
    })

  return tables
}

function renderCellValue(column: DataColumn, value: DataCellValue, selectionColors?: Record<string, string>) {
  if (column.type === 'attachment' && typeof value === 'string' && value.trim()) {
    return (
      <span className="data-page__image-cell">
        <img src={value} alt="" />
      </span>
    )
  }
  if (isSelectionColumn(column)) {
    const selectionValues = getSelectionValues(column, value)
    if (selectionValues.length === 0) return <span className="data-page__cell-text" />

    return (
      <span className="data-page__selection-badges">
        {selectionValues.map((selectionValue) => (
          <span
            key={selectionValue}
            className="data-page__selection-badge"
            style={getSelectionBadgeStyle(selectionColors?.[selectionValue])}
          >
            <span className="data-page__selection-badge-label">{selectionValue}</span>
          </span>
        ))}
      </span>
    )
  }
  const displayValue = typeof value === 'boolean'
    ? value ? 'Yes' : 'No'
    : value == null || value === '' ? '' : String(value)
  return <span className="data-page__cell-text">{displayValue}</span>
}

function columnHeaderIcon(column: DataColumn) {
  return DATA_COLUMN_ICON_BY_TYPE[column.type]
}

interface DataPageProps {
  preset: AppPreset
  onElementNavigate?: (pageId: string, elementId: string) => void
  dataTableNavigationTarget?: {
    tableId: string
    requestId: number
  } | null
}

export function findDataTableIdForElement(preset: AppPreset, elementId: string): string | null {
  const initialState = buildInitialStateFromPreset(preset)
  const tables = collectDataTables(initialState.pages)
  return tables.find((table) => (
    table.id === elementId
    || table.connections.some((connection) => connection.elementId === elementId)
  ))?.id ?? null
}

export function DataPage({ preset, onElementNavigate, dataTableNavigationTarget }: DataPageProps) {
  const initialState = useMemo(() => buildInitialStateFromPreset(preset), [preset])
  const tables = useMemo(() => collectDataTables(initialState.pages), [initialState.pages])
  const [activeTableId, setActiveTableId] = useState(() => tables[0]?.id ?? '')
  const [openTableMenuId, setOpenTableMenuId] = useState<string | null>(null)
  const [columnsAiMenuOpen, setColumnsAiMenuOpen] = useState(false)
  const [formContextMenuOpen, setFormContextMenuOpen] = useState(false)
  const [openTableContextConnectionId, setOpenTableContextConnectionId] = useState<string | null>(null)
  const [tableContextConnectionAnchor, setTableContextConnectionAnchor] = useState<{ tableId: string; left: number; top: number } | null>(null)
  const tableContextConnectionCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [tableRowsById, setTableRowsById] = useState<Record<string, Record<string, DataCellValue>[]>>({})
  const activeTable = tables.find((table) => table.id === activeTableId) ?? tables[0] ?? null
  const activeRows = activeTable ? tableRowsById[activeTable.id] ?? activeTable.rows : []
  const selectionColorMap = useMemo(
    () => activeTable ? buildSelectionColorMap(activeTable.columns, activeRows) : {},
    [activeRows, activeTable]
  )

  useEffect(() => {
    if (!activeTable || activeTable.id === activeTableId) return
    setActiveTableId(activeTable.id)
  }, [activeTable, activeTableId])

  useEffect(() => {
    setTableRowsById({})
  }, [tables])

  useEffect(() => {
    if (!dataTableNavigationTarget) return
    if (!tables.some((table) => table.id === dataTableNavigationTarget.tableId)) return
    setActiveTableId(dataTableNavigationTarget.tableId)
    setOpenTableMenuId(null)
    setColumnsAiMenuOpen(false)
    setFormContextMenuOpen(false)
    setOpenTableContextConnectionId(null)
    setTableContextConnectionAnchor(null)
  }, [dataTableNavigationTarget, tables])

  const clearTableContextConnectionCloseTimer = () => {
    if (tableContextConnectionCloseTimer.current == null) return
    clearTimeout(tableContextConnectionCloseTimer.current)
    tableContextConnectionCloseTimer.current = null
  }

  const closeTableContextConnections = () => {
    clearTableContextConnectionCloseTimer()
    setOpenTableContextConnectionId(null)
    setTableContextConnectionAnchor(null)
  }

  const openTableContextConnections = (tableId: string, anchorElement: HTMLElement) => {
    clearTableContextConnectionCloseTimer()
    const anchor = anchorElement.getBoundingClientRect()
    const menu = anchorElement.closest('.data-page__table-context-menu')?.getBoundingClientRect()
    setOpenTableContextConnectionId(tableId)
    setTableContextConnectionAnchor({ tableId, left: (menu?.right ?? anchor.right) + 4, top: anchor.top })
  }

  const scheduleTableContextConnectionsClose = () => {
    clearTableContextConnectionCloseTimer()
    tableContextConnectionCloseTimer.current = setTimeout(closeTableContextConnections, 120)
  }

  useEffect(() => () => clearTableContextConnectionCloseTimer(), [])

  useEffect(() => {
    if (!openTableMenuId && !columnsAiMenuOpen && !formContextMenuOpen) return

    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return
      if (event.target.closest('.data-page__table-menu, .data-page__table-context-connections--portal, .data-page__columns-ai-dropdown, .data-page__form-dropdown')) return

      setOpenTableMenuId(null)
      setColumnsAiMenuOpen(false)
      setFormContextMenuOpen(false)
      closeTableContextConnections()
    }

    document.addEventListener('pointerdown', handleOutsidePointerDown)
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown)
  }, [openTableMenuId, columnsAiMenuOpen, formContextMenuOpen])

  const showColumnsAiMenu = Boolean(activeTable && (
    activeTable.sourceType === 'List'
    || activeTable.connections.some((connection) => connection.icon === 'ai-filled')
  ))

  useEffect(() => {
    if (showColumnsAiMenu) return
    setColumnsAiMenuOpen(false)
  }, [showColumnsAiMenu])

  useEffect(() => {
    if (activeTable?.sourceType === 'Form') return
    setFormContextMenuOpen(false)
  }, [activeTable?.sourceType])

  const handleAddRow = () => {
    if (!activeTable) return
    const emptyRow = activeTable.columns.reduce<Record<string, DataCellValue>>((row, column) => {
      row[column.key] = ''
      return row
    }, {})

    setTableRowsById((currentRowsById) => {
      const currentRows = currentRowsById[activeTable.id] ?? activeTable.rows
      return {
        ...currentRowsById,
        [activeTable.id]: [...currentRows, emptyRow],
      }
    })
  }

  const closeTableContextMenu = () => {
    clearTableContextConnectionCloseTimer()
    setOpenTableMenuId(null)
    setOpenTableContextConnectionId(null)
    setTableContextConnectionAnchor(null)
  }

  const gridTemplateColumns = activeTable
    ? `86px repeat(${activeTable.columns.length}, 200px) 86px`
    : '1fr'

  return (
    <div className="data-page">
      <aside className="data-page__sidebar" aria-label="Data tables">
        <div className="data-page__sidebar-action">
          <button type="button" className="data-page__create-btn">
            <Icon name="plus" category="general" size={16} />
            Create Table
          </button>
        </div>
        <div className="data-page__table-list">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`data-page__table-item${table.id === activeTable?.id ? ' data-page__table-item--active' : ''}`}
            >
              <span className="data-page__table-connection" aria-hidden="true">
                <span className="data-page__table-icon">
                  <Icon name="product-tables-mono" category="products" size={28} />
                </span>
                <span className="data-page__table-link-badge">
                  <Icon name="link-diagonal" category="general" size={12} />
                </span>
              </span>
              <button
                type="button"
                className="data-page__table-select"
                onClick={() => {
                  setActiveTableId(table.id)
                  setOpenTableMenuId(null)
                  setColumnsAiMenuOpen(false)
                  setFormContextMenuOpen(false)
                  setOpenTableContextConnectionId(null)
                  setTableContextConnectionAnchor(null)
                }}
                aria-label={table.name}
                title={table.name}
              >
                <span className="data-page__table-name">{table.name}</span>
              </button>
              <span className={`data-page__table-menu${openTableMenuId === table.id ? ' data-page__table-menu--open' : ''}`}>
                <button
                  type="button"
                  className="data-page__table-more"
                  aria-label={`More options for ${table.name}`}
                  aria-haspopup="menu"
                  aria-expanded={openTableMenuId === table.id}
                  onClick={() => {
                    clearTableContextConnectionCloseTimer()
                    setOpenTableContextConnectionId(null)
                    setTableContextConnectionAnchor(null)
                    setOpenTableMenuId((openTableId) => openTableId === table.id ? null : table.id)
                  }}
                >
                  <Icon name="ellipsis-vertical" category="general" size={16} />
                </button>
                <span className="data-page__table-context-menu" role="menu" aria-label={`Options for ${table.name}`}>
                  <button type="button" role="menuitem" className="data-page__table-context-item" onClick={closeTableContextMenu}>
                    <Icon name="gear-filled" category="general" size={16} />
                    <span>Manage columns</span>
                  </button>
                  <button type="button" role="menuitem" className="data-page__table-context-item data-page__table-context-item--submenu" onClick={closeTableContextMenu}>
                    <span className="data-page__table-context-copy">
                      <Icon name="droplet-filled" category="editor" size={16} />
                      <span>Tab colors</span>
                    </span>
                    <Icon name="chevron-right" category="arrows" size={16} />
                  </button>
                  <span className="data-page__table-context-divider" />
                  {table.connections.length > 1 ? (
                    <span
                      className="data-page__table-context-connection"
                      onMouseLeave={scheduleTableContextConnectionsClose}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className="data-page__table-context-item data-page__table-context-item--submenu"
                        aria-haspopup="menu"
                        aria-expanded={openTableContextConnectionId === table.id}
                        onMouseEnter={(event) => openTableContextConnections(table.id, event.currentTarget)}
                        onFocus={(event) => openTableContextConnections(table.id, event.currentTarget)}
                        onClick={(event) => openTableContextConnections(table.id, event.currentTarget)}
                      >
                        <span className="data-page__table-context-copy">
                          <Icon name="link-diagonal" category="general" size={16} />
                          <span>View Connected Elements</span>
                        </span>
                        <Icon name="chevron-right" category="arrows" size={16} />
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      className="data-page__table-context-item"
                      onClick={() => {
                        closeTableContextMenu()
                        const connection = table.connections[0]
                        if (connection) onElementNavigate?.(connection.pageId, connection.elementId)
                      }}
                    >
                      <Icon name="link-diagonal" category="general" size={16} />
                      <span>View Connected Element</span>
                    </button>
                  )}
                  <span className="data-page__table-context-divider" />
                  <button type="button" role="menuitem" className="data-page__table-context-item" onClick={closeTableContextMenu}>
                    <Icon name="pencil-to-square" category="general" size={16} />
                    <span>Rename</span>
                  </button>
                  <button type="button" role="menuitem" className="data-page__table-context-item" onClick={closeTableContextMenu}>
                    <Icon name="copy-filled" category="general" size={16} />
                    <span>Duplicate</span>
                  </button>
                  <button type="button" role="menuitem" className="data-page__table-context-item data-page__table-context-item--submenu" onClick={closeTableContextMenu}>
                    <span className="data-page__table-context-copy">
                      <Icon name="arrows-rotate" category="arrows" size={16} />
                      <span>Change type</span>
                    </span>
                    <Icon name="chevron-right" category="arrows" size={16} />
                  </button>
                  <button type="button" role="menuitem" className="data-page__table-context-item" onClick={closeTableContextMenu}>
                    <Icon name="sticker-filled" category="forms-files" size={16} />
                    <span>Add tab note</span>
                  </button>
                  <span className="data-page__table-context-divider" />
                  <button type="button" role="menuitem" className="data-page__table-context-item data-page__table-context-item--submenu" onClick={closeTableContextMenu}>
                    <span className="data-page__table-context-copy">
                      <Icon name="arrow-down-to-line" category="arrows" size={16} />
                      <span>Download</span>
                    </span>
                    <Icon name="chevron-right" category="arrows" size={16} />
                  </button>
                </span>
              </span>
              {openTableContextConnectionId === table.id && tableContextConnectionAnchor?.tableId === table.id && createPortal(
                <span
                  className="data-page__connection-menu data-page__table-context-connections--portal"
                  role="menu"
                  aria-label={`Elements connected to ${table.name}`}
                  style={{ left: tableContextConnectionAnchor.left, top: tableContextConnectionAnchor.top }}
                  onMouseEnter={clearTableContextConnectionCloseTimer}
                  onMouseLeave={scheduleTableContextConnectionsClose}
                >
                  {table.connections.map((connection) => (
                    <button
                      key={`${connection.pageId}:${connection.elementId}`}
                      type="button"
                      role="menuitem"
                      className="data-page__connection-menu-item"
                      onClick={() => {
                        closeTableContextMenu()
                        onElementNavigate?.(connection.pageId, connection.elementId)
                      }}
                      title={connection.label}
                    >
                      <span className="data-page__connection-menu-copy">
                        {connection.iconCategory ? (
                          <Icon name={connection.icon} category={connection.iconCategory} size={16} />
                        ) : (
                          <AppIcon name={connection.icon} size={16} />
                        )}
                        <span>{connection.label}</span>
                      </span>
                    </button>
                  ))}
                </span>,
                document.body,
              )}
            </div>
          ))}
        </div>
      </aside>

      <main className="data-page__main">
        <div className="data-page__toolbar">
          <div className="data-page__search-filter">
            <div className="data-page__search">
              <Icon name="magnifying-glass" category="general" size={20} />
              <span>Search</span>
            </div>
            <button type="button" className="data-page__filter-btn">
              <span>Filter</span>
              <Icon name="funnel-filled" category="general" size={16} />
            </button>
          </div>
          <div className="data-page__toolbar-actions">
            <span className={`data-page__columns-ai-dropdown${columnsAiMenuOpen ? ' data-page__columns-ai-dropdown--open' : ''}`}>
              <button
                type="button"
                className="data-page__utility-btn"
                aria-haspopup={showColumnsAiMenu ? 'menu' : undefined}
                aria-expanded={showColumnsAiMenu ? columnsAiMenuOpen : undefined}
                onClick={() => {
                  if (!showColumnsAiMenu) return
                  setOpenTableMenuId(null)
                  setFormContextMenuOpen(false)
                  closeTableContextConnections()
                  setColumnsAiMenuOpen((open) => !open)
                }}
              >
                <DataPageAiSquaresIcon />
                <span>Columns &amp; AI</span>
                <Icon name="angle-down" category="arrows" size={16} />
              </button>
              {showColumnsAiMenu && (
                <span className="data-page__columns-ai-menu" role="menu" aria-label="Columns and AI options">
                  <span className="data-page__columns-ai-title">Show Hide Columns</span>
                  <span className="data-page__columns-ai-search">
                    <Icon name="magnifying-glass" category="general" size={16} />
                    <span>Search in columns...</span>
                  </span>
                  <button type="button" role="menuitemcheckbox" aria-checked="true" className="data-page__columns-ai-item data-page__columns-ai-item--checked">
                    <span className="data-page__columns-ai-check" />
                    <span>Show All</span>
                  </button>
                  {['Submission Date', 'Source App', 'Name', 'Address', 'Email'].map((columnName) => (
                    <button key={columnName} type="button" role="menuitemcheckbox" aria-checked="true" className="data-page__columns-ai-item data-page__columns-ai-item--checked">
                      <span className="data-page__columns-ai-check" />
                      <span>{columnName}</span>
                    </button>
                  ))}
                  <span className="data-page__columns-ai-divider" />
                  <button type="button" role="menuitem" className="data-page__columns-ai-action data-page__columns-ai-action--ai">
                    <Icon name="ai-filled" category="ai" size={16} />
                    <span>Add a new AI column</span>
                  </button>
                  <button type="button" role="menuitem" className="data-page__columns-ai-action data-page__columns-ai-action--column">
                    <Icon name="plus-circle-filled" category="general" size={16} />
                    <span>Add a new column</span>
                  </button>
                </span>
              )}
            </span>
            {activeTable?.sourceType === 'Form' && (
              <span className={`data-page__form-dropdown${formContextMenuOpen ? ' data-page__form-dropdown--open' : ''}`}>
                <button
                  type="button"
                  className="data-page__form-dropdown-btn"
                  aria-haspopup="menu"
                  aria-expanded={formContextMenuOpen}
                  onClick={() => {
                    setOpenTableMenuId(null)
                    setColumnsAiMenuOpen(false)
                    closeTableContextConnections()
                    setFormContextMenuOpen((open) => !open)
                  }}
                >
                  <Icon name="product-form-builder-filled" category="products" size={20} />
                  <span>Form</span>
                  <Icon name="angle-down" category="arrows" size={16} />
                </button>
                <span className="data-page__form-context-menu" role="menu" aria-label="Form options">
                  <button
                    type="button"
                    role="menuitem"
                    className="data-page__form-context-item"
                    onClick={() => {
                      setFormContextMenuOpen(false)
                      const formConnection = activeTable.connections.find((connection) => connection.isFormElement) ?? activeTable.connections[0]
                      if (formConnection) onElementNavigate?.(formConnection.pageId, formConnection.elementId)
                    }}
                  >
                    <Icon name="arrow-up-right-from-square-sm" category="arrows" size={16} />
                    <span>View Form</span>
                  </button>
                  <button type="button" role="menuitem" className="data-page__form-context-item" onClick={() => setFormContextMenuOpen(false)}>
                    <Icon name="users-filled" category="users" size={16} />
                    <span>Assing Form</span>
                  </button>
                  <button type="button" role="menuitem" className="data-page__form-context-item" onClick={() => setFormContextMenuOpen(false)}>
                    <Icon name="pencil-to-square" category="general" size={16} />
                    <span>Edit Form</span>
                  </button>
                  <button type="button" role="menuitem" className="data-page__form-context-item" onClick={() => setFormContextMenuOpen(false)}>
                    <span className="data-page__form-context-copy">
                      <Icon name="trash-clock-filled" category="general" size={16} />
                      <span>Auto-Delete Submission</span>
                    </span>
                    <span className="data-page__form-context-badge">DISABLED</span>
                  </button>
                </span>
              </span>
            )}
            <button type="button" className="data-page__download-btn">
              <Icon name="arrow-down-to-line" category="arrows" size={20} />
              <span>Download All</span>
            </button>
          </div>
        </div>

        {activeTable ? (
          <>
            <div className="data-page__grid-scroll">
              <div className="data-page__grid" style={{ gridTemplateColumns }}>
                <div className="data-page__grid-cell data-page__grid-cell--corner">
                  <span className="data-page__checkbox" />
                  <Icon name="angle-down" category="arrows" size={16} />
                </div>
                {activeTable.columns.map((column) => {
                  const headerIcon = columnHeaderIcon(column)
                  return (
                    <div key={column.key} className="data-page__grid-cell data-page__grid-cell--header">
                      <span className="data-page__grid-header-main">
                        <Icon name={headerIcon.name} category={headerIcon.category} size={16} />
                        <span>{column.label}</span>
                      </span>
                      <Icon name="ellipsis-vertical" category="general" size={16} />
                    </div>
                  )
                })}
                <div className="data-page__grid-cell data-page__grid-cell--add-column">
                  <DataPagePlusSquareIcon />
                  ADD
                </div>

                {activeRows.map((row, rowIndex) => (
                  <div className="data-page__grid-row" key={`row-${rowIndex}`}>
                    <div className="data-page__grid-cell data-page__grid-cell--row-index">
                      <span className="data-page__row-select-control">
                        <span className="data-page__row-number">{rowIndex + 1}</span>
                        <span className="data-page__checkbox data-page__row-hover-checkbox" />
                      </span>
                      <Icon name="star" category="general" size={20} className="data-page__row-star" />
                      <Icon name="ellipsis-vertical" category="general" size={16} className="data-page__row-more" />
                    </div>
                    {activeTable.columns.map((column) => (
                      <div
                        key={`${rowIndex}-${column.key}`}
                        className={`data-page__grid-cell data-page__grid-cell--body${column.type === 'longText' ? ' data-page__grid-cell--long-text' : ''}${isSelectionColumn(column) ? ' data-page__grid-cell--selection' : ''}`}
                      >
                        {renderCellValue(column, row[column.key], selectionColorMap[column.key])}
                      </div>
                    ))}
                    <div className="data-page__grid-cell data-page__grid-cell--row-tail" />
                  </div>
                ))}

                <button
                  type="button"
                  className="data-page__grid-cell data-page__grid-cell--add-row"
                  onClick={handleAddRow}
                  aria-label="Add empty row"
                >
                  <Icon name="plus-square-filled" category="general" size={16} />
                  ADD
                </button>
                {activeTable.columns.map((column) => (
                  <div key={`empty-${column.key}`} className="data-page__grid-cell data-page__grid-cell--add-row-fill" />
                ))}
                <div className="data-page__grid-cell data-page__grid-cell--row-tail" />
              </div>
            </div>
            <div className="data-page__footer">
              <span>Total {activeRows.length}</span>
            </div>
          </>
        ) : (
          <div className="data-page__empty">
            <Icon name="table" category="general" size={32} />
            <h2>No data tables yet</h2>
            <p>Add a list, form, product list, table, or data-backed widget in Build to see its data here.</p>
          </div>
        )}
      </main>
    </div>
  )
}
