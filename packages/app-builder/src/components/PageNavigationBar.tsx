import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Icon, Button } from '@jf/design-system'
import { LucideIcon, IconPickerPopover } from './IconPicker'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface PageTab {
  id: string
  name: string
  icon?: string
  iconCategory?: string
}

interface PageNavigationBarProps {
  pages: PageTab[]
  activePageId: string
  variant?: 'default' | 'empty'
  onPageSelect: (pageId: string) => void
  onPageReorder: (pages: PageTab[]) => void
  onPageRename: (pageId: string, name: string) => void
  onChangeIcon: (pageId: string, icon: string) => void
  onDeletePage: (pageId: string) => void
  onAddPage: () => void
  onOpenSettings: () => void
}

export const DEFAULT_PAGE_ICON = 'FileText'

export function getPageIconName(page: PageTab, _index: number): string {
  return page.icon || DEFAULT_PAGE_ICON
}


function PageContextMenu({
  isFirstPage,
  onChangeIcon,
  onHidePage,
  onRequireLogin,
  onRename,
  onDelete,
}: {
  isFirstPage: boolean
  onChangeIcon: () => void
  onHidePage: () => void
  onRequireLogin: () => void
  onRename: () => void
  onDelete: () => void
}) {
  return (
    <>
      <button className="page-nav__context-item" onClick={onChangeIcon}>
        <Icon name="arrows-rotate" category="arrows" size={20} />
        <span>Change Icon</span>
      </button>
      <button className="page-nav__context-item" onClick={onHidePage}>
        <Icon name="eye-slash-filled" category="general" size={20} />
        <span>Hide Page</span>
      </button>
      <button className="page-nav__context-item" onClick={onRequireLogin}>
        <Icon name="lock-filled" category="security" size={20} />
        <span>Require Login</span>
      </button>
      <button className="page-nav__context-item" onClick={onRename}>
        <Icon name="pencil-line-filled" category="editor" size={20} />
        <span>Rename</span>
      </button>
      <button className={`page-nav__context-item${isFirstPage ? ' page-nav__context-item--disabled' : ' page-nav__context-item--danger'}`} onClick={isFirstPage ? undefined : onDelete} disabled={isFirstPage}>
        <Icon name="trash-filled" category="general" size={20} />
        <span>Delete</span>
      </button>
    </>
  )
}

function SortablePageTab({
  page,
  index,
  isActive,
  isFirstPage,
  onSelect,
  onRename,
  onChangeIcon,
  onDelete,
}: {
  page: PageTab
  index: number
  isActive: boolean
  isFirstPage: boolean
  onSelect: () => void
  onRename: (name: string) => void
  onChangeIcon: (icon: string) => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id })
  const [editing, setEditing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const [iconPickerPos, setIconPickerPos] = useState({ top: 0, left: 0 })
  const nameRef = useRef<HTMLSpanElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuTriggerRef = useRef<HTMLSpanElement>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const iconName = getPageIconName(page, index)

  const startEditing = () => {
    setMenuOpen(false)
    setEditing(true)
    requestAnimationFrame(() => {
      if (!nameRef.current) return
      nameRef.current.focus()
      const range = document.createRange()
      range.selectNodeContents(nameRef.current)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    })
  }

  const finishEditing = () => {
    setEditing(false)
    const text = nameRef.current?.textContent?.trim()
    if (text && text !== page.name) {
      onRename(text)
    } else if (nameRef.current) {
      nameRef.current.textContent = page.name
    }
  }

  // Close context menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        menuTriggerRef.current && !menuTriggerRef.current.contains(target)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`page-nav__tab${isActive ? ' page-nav__tab--active' : ''}${editing ? ' page-nav__tab--editing' : ''}`}
      data-page-tab={page.id}
      onClick={() => { if (!editing) onSelect() }}
    >
      <span className="page-nav__tab-icon-wrapper" {...attributes} {...listeners}>
        <span className="page-nav__tab-icon">
          <LucideIcon name={iconName} size={18} />
        </span>
        <span className="page-nav__tab-drag">
          <Icon name="grid-dots-vertical" category="general" size={18} />
        </span>
      </span>
      <span
        ref={nameRef}
        className="page-nav__tab-name"
        contentEditable={editing}
        suppressContentEditableWarning
        onClick={(e) => { e.stopPropagation(); startEditing() }}
        onBlur={finishEditing}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); finishEditing() }
          if (e.key === 'Escape') { setEditing(false); if (nameRef.current) nameRef.current.textContent = page.name; nameRef.current?.blur() }
        }}
      >
        {page.name}
      </span>
      <span
        className="page-nav__tab-menu"
        ref={menuTriggerRef}
        onClick={(e) => {
          e.stopPropagation()
          if (!menuOpen && menuTriggerRef.current) {
            const rect = menuTriggerRef.current.getBoundingClientRect()
            setMenuPos({ top: rect.top, left: rect.left + rect.width / 2 })
          }
          setMenuOpen(!menuOpen)
        }}
      >
        <Icon name="ellipsis-vertical" category="general" size={18} />
      </span>
      {menuOpen && createPortal(
        <div ref={menuRef} className="page-nav__context-menu" style={{ top: menuPos.top, left: menuPos.left }}>
          <PageContextMenu
            isFirstPage={isFirstPage}
            onChangeIcon={() => {
              setMenuOpen(false)
              if (menuTriggerRef.current) {
                const rect = menuTriggerRef.current.getBoundingClientRect()
                setIconPickerPos({ top: rect.top, left: rect.left + rect.width / 2 })
              }
              setIconPickerOpen(true)
            }}
            onHidePage={() => setMenuOpen(false)}
            onRequireLogin={() => setMenuOpen(false)}
            onRename={startEditing}
            onDelete={() => { setMenuOpen(false); onDelete() }}
          />
        </div>,
        document.body
      )}
      {iconPickerOpen && (
        <IconPickerPopover
          value={iconName}
          anchorPos={iconPickerPos}
          onSelect={(icon) => {
            onChangeIcon(icon)
            setIconPickerOpen(false)
          }}
          onClose={() => setIconPickerOpen(false)}
        />
      )}
    </div>
  )
}

function DragOverlayTab({ page, index }: { page: PageTab; index: number }) {
  const iconName = getPageIconName(page, index)
  return (
    <div className="page-nav__tab page-nav__tab--dragging">
      <span className="page-nav__tab-icon" style={{ opacity: 1 }}>
        <LucideIcon name={iconName} size={18} />
      </span>
      <span className="page-nav__tab-name">{page.name}</span>
    </div>
  )
}

export function PageNavigationBar({
  pages,
  activePageId,
  variant = 'default',
  onPageSelect,
  onPageReorder,
  onPageRename,
  onChangeIcon,
  onDeletePage,
  onAddPage,
  onOpenSettings,
}: PageNavigationBarProps) {
  const [dragActiveId, setDragActiveId] = useState<string | null>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const pagesRef = useRef<HTMLDivElement>(null)
  const emptyVariant = variant === 'empty'
  const showNavigationSettings = pages.length > 1

  const checkOverflow = useCallback(() => {
    const el = pagesRef.current
    if (!el) return
    const hasMore = el.scrollWidth - el.scrollLeft - el.clientWidth > 1
    setIsOverflowing(hasMore)
  }, [])

  useEffect(() => {
    const el = pagesRef.current
    if (!el) return
    checkOverflow()
    const observer = new ResizeObserver(checkOverflow)
    observer.observe(el)
    el.addEventListener('scroll', checkOverflow, { passive: true })
    return () => { observer.disconnect(); el.removeEventListener('scroll', checkOverflow) }
  }, [pages.length, checkOverflow])

  // Auto-scroll nav bar to show active page tab
  useEffect(() => {
    const container = pagesRef.current
    if (!container) return
    requestAnimationFrame(() => {
      const activeTab = container.querySelector(`[data-page-tab="${activePageId}"]`) as HTMLElement
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      }
      // Re-check after scroll + layout settles
      setTimeout(checkOverflow, 400)
    })
  }, [activePageId, pages.length, checkOverflow])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDragActiveId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDragActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = pages.findIndex((p) => p.id === active.id)
    const newIndex = pages.findIndex((p) => p.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      onPageReorder(arrayMove(pages, oldIndex, newIndex))
    }
  }, [pages, onPageReorder])

  const draggedPage = dragActiveId ? pages.find((p) => p.id === dragActiveId) : null
  const draggedIndex = dragActiveId ? pages.findIndex((p) => p.id === dragActiveId) : -1

  return (
    <div className={`page-nav${emptyVariant ? ' page-nav--empty' : ''}`}>
      <div className="page-nav__pages-wrapper">
      {isOverflowing && <div className="page-nav__fade" />}
      <div className="page-nav__pages" ref={pagesRef}>
        {emptyVariant ? (
          pages.map((page) => (
            <button
              key={page.id}
              type="button"
              className={`page-nav__tab page-nav__tab--empty${page.id === activePageId ? ' page-nav__tab--active' : ''}`}
              data-page-tab={page.id}
              onClick={() => onPageSelect(page.id)}
            >
              <span className="page-nav__tab-name">{page.name}</span>
            </button>
          ))
        ) : (
          <DndContext
            id="page-nav-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={pages.map((p) => p.id)} strategy={horizontalListSortingStrategy}>
              {pages.map((page, index) => (
                <SortablePageTab
                  key={page.id}
                  page={page}
                  index={index}
                  isActive={page.id === activePageId}
                  isFirstPage={index === 0}
                  onSelect={() => onPageSelect(page.id)}
                  onRename={(name) => onPageRename(page.id, name)}
                  onChangeIcon={(icon) => onChangeIcon(page.id, icon)}
                  onDelete={() => onDeletePage(page.id)}
                />
              ))}
            </SortableContext>
            <DragOverlay>
              {draggedPage ? (
                <DragOverlayTab page={draggedPage} index={draggedIndex} />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
      </div>
      <Button
        variant="ghost"
        colorScheme="secondary"
        shape="rectangle"
        size="md"
        leftIcon={<Icon name="plus-circle-filled" category="general" size={20} />}
        onClick={onAddPage}
        className="page-nav__add-page"
      >
        Add Page
      </Button>
      {showNavigationSettings && (
        <div className="page-nav__end">
          <div className="page-nav__divider" />
          <Button
            variant="ghost"
            colorScheme="secondary"
            shape="rectangle"
            size="md"
            leftIcon={<Icon name="gear-filled" category="general" size={20} />}
            onClick={onOpenSettings}
          >
            Navigation Settings
          </Button>
        </div>
      )}
    </div>
  )
}
