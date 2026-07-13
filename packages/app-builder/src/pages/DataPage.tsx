import { useEffect, useMemo, useState } from 'react'
import { AppIcon, ComponentRegistry } from '@jf/app-elements'
import { Icon } from '@jf/design-system'
import { type AppPreset, type PresetElement } from '../presets/appPresets'
import { buildInitialStateFromPreset, type AppPage, type CanvasElement } from './BuildPage'

type DataCellValue = string | number | boolean | null | undefined

interface DataColumn {
  key: string
  label: string
  type?: 'text' | 'image'
}

interface DataTable {
  id: string
  name: string
  description: string
  sourceType: 'List' | 'Form' | 'Products' | 'Table' | 'Tasks'
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

const DATA_ELEMENT_IDS = new Set(['list', 'product-list', 'form', 'table', 'daily-task-manager'])
const SHARED_TABLE_CONSUMER_IDS = new Set(['list', 'ai-widget'])
const LIST_COLUMN_PRIORITY = ['title', 'name', 'description', 'image', 'avatar', 'photo', 'price', 'date', 'time', 'duration', 'coach', 'category', 'location', 'details', 'detail']
const PRODUCT_COLUMN_PRIORITY = ['name', 'title', 'description', 'price', 'image', 'category', 'sku', 'inventory']
const DEFAULT_FORM_FIELDS: FormFieldLike[] = [
  { name: 'fullName', label: 'Full Name', type: 'text' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'message', label: 'Message', type: 'textarea' },
]

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
    type: isImageKey(key) ? 'image' : 'text',
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
    icon: isFormConnection ? 'cart-shopping-filled' : component?.icon ?? 'LayoutGrid',
    iconCategory: isFormConnection ? 'finance' : undefined,
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
    connections: [],
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
      type: 'text' as const,
    })),
    { key: 'submittedAt', label: 'Submitted At', type: 'text' as const },
    { key: 'status', label: 'Status', type: 'text' as const },
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
  if (element.componentId === 'form' || (element.componentId === 'button' && String(element.properties.Action ?? '') === 'Open Form')) return buildFormTable(element, page)
  if (element.componentId === 'table') return buildWidgetTable(element, page)
  if (element.componentId === 'daily-task-manager') return buildTaskTable(element, page)
  return null
}

function collectDataTables(pages: AppPage[]): DataTable[] {
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

function renderCellValue(column: DataColumn, value: DataCellValue) {
  if (column.type === 'image' && typeof value === 'string' && value.trim()) {
    return (
      <span className="data-page__image-cell">
        <img src={value} alt="" />
      </span>
    )
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return value == null || value === '' ? '' : String(value)
}

function tableConnectionLabel(table: DataTable): string {
  const connectionCount = table.connections.length
  return `${table.name} is connected to ${connectionCount} ${connectionCount === 1 ? 'element' : 'elements'}`
}

function columnHeaderIcon(column: DataColumn) {
  return column.type === 'image'
    ? { name: 'paperclip-diagonal', category: 'general' }
    : { name: 'type-square-filled', category: 'general' }
}

interface DataPageProps {
  preset: AppPreset
  onElementNavigate?: (pageId: string, elementId: string) => void
}

export function DataPage({ preset, onElementNavigate }: DataPageProps) {
  const initialState = useMemo(() => buildInitialStateFromPreset(preset), [preset])
  const tables = useMemo(() => collectDataTables(initialState.pages), [initialState.pages])
  const [activeTableId, setActiveTableId] = useState(() => tables[0]?.id ?? '')
  const [openConnectionTableId, setOpenConnectionTableId] = useState<string | null>(null)
  const [tableRowsById, setTableRowsById] = useState<Record<string, Record<string, DataCellValue>[]>>({})
  const activeTable = tables.find((table) => table.id === activeTableId) ?? tables[0] ?? null
  const activeRows = activeTable ? tableRowsById[activeTable.id] ?? activeTable.rows : []

  useEffect(() => {
    if (!activeTable || activeTable.id === activeTableId) return
    setActiveTableId(activeTable.id)
  }, [activeTable, activeTableId])

  useEffect(() => {
    setTableRowsById({})
  }, [tables])

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
              <button
                type="button"
                className="data-page__table-select"
                onClick={() => {
                  setActiveTableId(table.id)
                  setOpenConnectionTableId(null)
                }}
                aria-label={table.name}
                title={table.name}
              >
                <span className="data-page__table-icon">
                  <Icon name="product-tables-mono" category="products" size={20} />
                </span>
                <span className="data-page__table-name">{table.name}</span>
              </button>
              {table.connections.length > 0 ? (
                <span
                  className={`data-page__table-connection${openConnectionTableId === table.id ? ' data-page__table-connection--open' : ''}`}
                  onMouseEnter={() => setOpenConnectionTableId(table.id)}
                  onMouseLeave={() => setOpenConnectionTableId((openTableId) => openTableId === table.id ? null : openTableId)}
                >
                  <button
                    type="button"
                    className="data-page__table-link-badge"
                    aria-label={tableConnectionLabel(table)}
                    aria-haspopup="menu"
                    aria-expanded={openConnectionTableId === table.id}
                    onClick={() => setOpenConnectionTableId((openTableId) => openTableId === table.id ? null : table.id)}
                  >
                    <Icon name="link-diagonal" category="general" size={12} />
                  </button>
                  <span className="data-page__connection-menu" role="menu" aria-label={`Elements connected to ${table.name}`}>
                    {table.connections.map((connection) => (
                      <button
                        key={`${connection.pageId}:${connection.elementId}`}
                        type="button"
                        role="menuitem"
                        className="data-page__connection-menu-item"
                        onClick={() => onElementNavigate?.(connection.pageId, connection.elementId)}
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
                        <Icon name="arrow-up-right-from-square-sm" category="arrows" size={12} />
                      </button>
                    ))}
                  </span>
                </span>
              ) : (
                <span className="data-page__table-link-badge data-page__table-link-badge--static" aria-hidden="true">
                  <Icon name="link-diagonal" category="general" size={12} />
                </span>
              )}
              <span className="data-page__table-more" aria-hidden="true">
                <Icon name="ellipsis-vertical" category="general" size={16} />
              </span>
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
          <div className="data-page__toolbar-spacer" />
          <div className="data-page__toolbar-actions">
            <button type="button" className="data-page__utility-btn">
              <Icon name="ai-squares-filled" category="ai" size={20} />
              <span>Columns &amp; AI</span>
              <Icon name="angle-down" category="arrows" size={16} />
            </button>
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
                  <Icon name="plus-square-filled" category="general" size={16} />
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
                      <div key={`${rowIndex}-${column.key}`} className="data-page__grid-cell data-page__grid-cell--body">
                        {renderCellValue(column, row[column.key])}
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
