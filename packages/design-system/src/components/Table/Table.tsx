import { useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { Checkbox } from '../Checkbox/Checkbox';
import { EmptyContent } from './EmptyContent';
import type { EmptyContentState } from './EmptyContent';
import { TableFooter } from './TableFooter';
import type { TableFooterType, TablePagination } from './TableFooter';
import './Table.scss';

export type TableSize = 'sm' | 'md' | 'lg';
export type TableAlign = 'left' | 'right';
export type TableHeaderStyle = 'white' | 'grey';
export type SortDirection = 'asc' | 'desc';
export type TableLoadingVariant = 'skeleton' | 'scrim' | 'spinner';

const MIN_COLUMN_WIDTH = 64;

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  align?: TableAlign;
  sortable?: boolean;
  width?: number | string;
  render?: (row: T, rowIndex: number) => ReactNode;
}

export interface TableSort {
  key: string;
  direction: SortDirection;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  size?: TableSize;
  bordered?: boolean;
  headerStyle?: TableHeaderStyle;
  sort?: TableSort | null;
  onSortChange?: (sort: TableSort | null) => void;
  loading?: boolean;
  loadingVariant?: TableLoadingVariant;
  skeletonRows?: number;
  rowKey?: (row: T, index: number) => string | number;
  selectable?: boolean;
  selectedRowKeys?: Array<string | number>;
  onSelectionChange?: (keys: Array<string | number>) => void;
  onRowClick?: (row: T, index: number) => void;
  resizable?: boolean;
  emptyState?: EmptyContentState;
  emptyContent?: ReactNode;
  pagination?: TablePagination;
  totalItems?: number;
  footerType?: TableFooterType;
  toolbar?: ReactNode;
  className?: string;
}

function nextSort(current: TableSort | null | undefined, key: string): TableSort | null {
  if (!current || current.key !== key) return { key, direction: 'asc' };
  if (current.direction === 'asc') return { key, direction: 'desc' };
  return null;
}

function defaultCell<T>(row: T, key: string): ReactNode {
  const value = (row as Record<string, unknown>)[key];
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return value;
  return String(value);
}

function SortIndicator({ direction }: { direction: SortDirection | null }) {
  return (
    <svg
      className="jf-table__sort"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className={`jf-table__sort-arrow${direction === 'asc' ? ' jf-table__sort-arrow--active' : ''}`}
        transform="translate(5.83333 3.33333)"
        d="M4.75592 0.244078C4.43049 -0.0813592 3.90285 -0.0813592 3.57741 0.244078L0.244078 3.57741C-0.0813592 3.90285 -0.0813592 4.43049 0.244078 4.75592C0.569515 5.08136 1.09715 5.08136 1.42259 4.75592L4.16667 2.01184L6.91074 4.75592C7.23618 5.08136 7.76382 5.08136 8.08926 4.75592C8.41469 4.43049 8.41469 3.90285 8.08926 3.57741L4.75592 0.244078Z"
      />
      <path
        className={`jf-table__sort-arrow${direction === 'desc' ? ' jf-table__sort-arrow--active' : ''}`}
        transform="translate(5.83333 11.66667)"
        d="M1.42259 0.244078C1.09715 -0.0813593 0.569515 -0.0813593 0.244078 0.244078C-0.0813592 0.569515 -0.0813592 1.09715 0.244078 1.42259L3.57741 4.75592C3.90285 5.08136 4.43049 5.08136 4.75592 4.75592L8.08926 1.42259C8.41469 1.09715 8.41469 0.569515 8.08926 0.244078C7.76382 -0.0813593 7.23618 -0.0813593 6.91074 0.244078L4.16667 2.98816L1.42259 0.244078Z"
      />
    </svg>
  );
}

export function Table<T>({
  columns,
  data,
  size = 'md',
  bordered = true,
  headerStyle = 'white',
  sort = null,
  onSortChange,
  loading = false,
  loadingVariant = 'skeleton',
  skeletonRows = 5,
  rowKey,
  selectable = false,
  selectedRowKeys,
  onSelectionChange,
  onRowClick,
  resizable = false,
  emptyState = 'empty',
  emptyContent,
  pagination,
  totalItems,
  footerType = 'simple',
  toolbar,
  className,
}: TableProps<T>) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizingKey, setResizingKey] = useState<string | null>(null);

  const rootClass = [
    'jf-table',
    `jf-table--${size}`,
    `jf-table--header-${headerStyle}`,
    bordered && 'jf-table--bordered',
    onRowClick && 'jf-table--interactive',
    resizingKey && 'jf-table--resizing',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const hasWidths = columns.some((column) => column.width != null);
  const interactive = Boolean(onRowClick);

  const getKey = (row: T, index: number): string | number =>
    rowKey ? rowKey(row, index) : index;

  const selected = new Set(selectedRowKeys ?? []);
  const allKeys = data.map((row, index) => getKey(row, index));
  const allSelected = data.length > 0 && allKeys.every((key) => selected.has(key));
  const someSelected = allKeys.some((key) => selected.has(key));

  const toggleAll = () => onSelectionChange?.(allSelected ? [] : allKeys);
  const toggleRow = (key: string | number) => {
    if (!onSelectionChange) return;
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange([...next]);
  };

  const showSkeleton = loading && loadingVariant === 'skeleton';
  const showSpinner = loading && loadingVariant === 'spinner';
  const showScrim = loading && loadingVariant === 'scrim';
  const showEmpty = !showSkeleton && !showSpinner && data.length === 0;
  const colSpanCount = columns.length + (selectable ? 1 : 0);

  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable || !onSortChange) return;
    onSortChange(nextSort(sort, column.key));
  };

  const startResize = (event: ReactPointerEvent<HTMLElement>, columnKey: string) => {
    event.preventDefault();
    event.stopPropagation();
    const th = event.currentTarget.closest('th');
    if (!th) return;
    const startX = event.clientX;
    const startWidth = th.getBoundingClientRect().width;
    setResizingKey(columnKey);

    const onMove = (moveEvent: PointerEvent) => {
      const width = Math.max(MIN_COLUMN_WIDTH, startWidth + moveEvent.clientX - startX);
      setColumnWidths((prev) => ({ ...prev, [columnKey]: width }));
    };
    const onUp = () => {
      setResizingKey(null);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  const renderStateRow = (content: ReactNode) => (
    <tr className="jf-table__row jf-table__state-row">
      <td className="jf-table__state-cell" colSpan={colSpanCount}>
        <div className="jf-table__state-inner">{content}</div>
      </td>
    </tr>
  );

  return (
    <div className={rootClass}>
      {toolbar && <div className="jf-table__toolbar">{toolbar}</div>}
      <div className="jf-table__box">
        <table className="jf-table__table">
          {(hasWidths || resizable) && (
            <colgroup>
              {selectable && <col style={{ width: '48px' }} />}
              {columns.map((column) => {
                const resized = columnWidths[column.key];
                const width =
                  resized != null
                    ? `${resized}px`
                    : column.width != null
                      ? typeof column.width === 'number'
                        ? `${column.width}px`
                        : column.width
                      : undefined;
                return (
                  <col key={column.key} style={width != null ? { width } : undefined} />
                );
              })}
            </colgroup>
          )}
          <thead className="jf-table__head">
            <tr className="jf-table__head-row">
              {selectable && (
                <th className="jf-table__th jf-table__select-cell" scope="col">
                  <Checkbox
                    label=""
                    size="sm"
                    aria-label="Select all rows"
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((column, columnIndex) => {
                const align = column.align ?? 'left';
                const isSorted = sort?.key === column.key;
                const direction = isSorted ? sort!.direction : null;
                const thClass = [
                  'jf-table__th',
                  `jf-table__th--${align}`,
                  column.sortable && 'jf-table__th--sortable',
                ]
                  .filter(Boolean)
                  .join(' ');
                const ariaSort: 'ascending' | 'descending' | 'none' | undefined = column.sortable
                  ? direction === 'asc'
                    ? 'ascending'
                    : direction === 'desc'
                      ? 'descending'
                      : 'none'
                  : undefined;
                const showResizeHandle = resizable && columnIndex < columns.length - 1;

                return (
                  <th key={column.key} className={thClass} scope="col" aria-sort={ariaSort}>
                    {column.sortable ? (
                      <button
                        type="button"
                        className="jf-table__th-inner"
                        onClick={() => handleSort(column)}
                      >
                        <span className="jf-table__th-label">{column.header}</span>
                        <SortIndicator direction={direction} />
                      </button>
                    ) : (
                      <span className="jf-table__th-inner">
                        <span className="jf-table__th-label">{column.header}</span>
                      </span>
                    )}
                    {showResizeHandle && (
                      <span
                        className={`jf-table__resize-handle${
                          resizingKey === column.key ? ' jf-table__resize-handle--active' : ''
                        }`}
                        onPointerDown={(event) => startResize(event, column.key)}
                      >
                        <span className="jf-table__resize-indicator" />
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="jf-table__body">
            {showSkeleton
              ? Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                  <tr
                    key={`skeleton-${rowIndex}`}
                    className="jf-table__row jf-table__row--skeleton"
                  >
                    {selectable && <td className="jf-table__td jf-table__select-cell" />}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`jf-table__td jf-table__td--${column.align ?? 'left'}`}
                      >
                        <span className="jf-table__skeleton" />
                      </td>
                    ))}
                  </tr>
                ))
              : showSpinner
                ? renderStateRow(<EmptyContent state="loading" />)
                : showEmpty
                  ? renderStateRow(emptyContent ?? <EmptyContent state={emptyState} />)
                  : data.map((row, rowIndex) => {
                      const key = getKey(row, rowIndex);
                      const isSelected = selected.has(key);
                      const rowClass = [
                        'jf-table__row',
                        'jf-table__row--data',
                        isSelected && 'jf-table__row--selected',
                      ]
                        .filter(Boolean)
                        .join(' ');

                      return (
                        <tr
                          key={key}
                          className={rowClass}
                          tabIndex={interactive ? 0 : undefined}
                          role={interactive ? 'button' : undefined}
                          aria-selected={isSelected || undefined}
                          onClick={interactive ? () => onRowClick!(row, rowIndex) : undefined}
                          onKeyDown={
                            interactive
                              ? (event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    onRowClick!(row, rowIndex);
                                  }
                                }
                              : undefined
                          }
                        >
                          {selectable && (
                            <td
                              className="jf-table__td jf-table__select-cell"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Checkbox
                                label=""
                                size="sm"
                                aria-label="Select row"
                                checked={isSelected}
                                onChange={() => toggleRow(key)}
                              />
                            </td>
                          )}
                          {columns.map((column) => {
                            const align = column.align ?? 'left';
                            const content = column.render
                              ? column.render(row, rowIndex)
                              : defaultCell(row, column.key);
                            return (
                              <td
                                key={column.key}
                                className={`jf-table__td jf-table__td--${align}`}
                              >
                                <span className="jf-table__cell">{content}</span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
          </tbody>
        </table>
        {(pagination != null || totalItems != null) && (
          <TableFooter type={footerType} pagination={pagination} totalItems={totalItems} />
        )}
        {showScrim && (
          <div className="jf-table__scrim" role="status" aria-label="Loading">
            <div className="jf-table__progress">
              <span className="jf-table__progress-bar" />
            </div>
            <div className="jf-table__scrim-veil" />
          </div>
        )}
      </div>
    </div>
  );
}
