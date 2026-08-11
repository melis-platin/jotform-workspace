import { useState, useCallback, useRef, useEffect, useId, type CSSProperties, type FC } from 'react';
import { Icon } from '../Icon/Icon';
import './Chart.scss';

// ============================================
// Types
// ============================================
export type ChartType = 'Bar' | 'Horizontal Bar' | 'Line' | 'Area' | 'Pie' | 'Donut';
export type ChartDataSet = 'Orders' | 'Revenue' | 'Visitors';

export type ChartDateFilter = 'Yearly' | 'Monthly' | 'Weekly';

export interface ChartProps {
  type?: ChartType;
  title?: string;
  description?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  dataSet?: ChartDataSet;
  iconName?: string;
  showIcon?: boolean;
  showDateFilter?: boolean;
  showTimeRangeSelector?: boolean;
  timeRange?: string;
  timeRangeOptions?: string;
  showLegend?: boolean;
  chartColor?: string;
  tableRows?: string;
  measures?: string;
  measureField?: string;
  aggregation?: string;
  groupBy?: string;
  selected?: boolean;
  skeleton?: boolean;
  skeletonAnimation?: 'pulse' | 'shimmer';
}

// ============================================
// Sample Data by filter
// ============================================
interface ChartData {
  labels: string[];
  barSeries1: number[];
  barSeries2: number[];
  lineSeries1: number[];
  lineSeries2: number[];
  hasSecondary?: boolean;
  series?: Array<{ label: string; values: number[] }>;
}

type ChartMeasure = { agg: 'Count' | 'Sum' | 'Average' | 'Highest' | 'Lowest'; col?: string };

// Keep chart previews legible without asking the app owner to tune a technical
// limit. Categories after the first ten are represented by one aggregated bar,
// line point, or slice.
const MAX_CHART_CATEGORIES = 10;

function limitCategories(data: ChartData): ChartData {
  if (data.labels.length <= MAX_CHART_CATEGORIES) return data;

  const retainedCount = MAX_CHART_CATEGORIES;
  const overflowStart = retainedCount;
  const sumOverflow = (series: number[]) => series.slice(overflowStart).reduce((sum, value) => sum + value, 0);

  return {
    labels: [...data.labels.slice(0, retainedCount), 'Other'],
    barSeries1: [...data.barSeries1.slice(0, retainedCount), sumOverflow(data.barSeries1)],
    barSeries2: [...data.barSeries2.slice(0, retainedCount), sumOverflow(data.barSeries2)],
    lineSeries1: [...data.lineSeries1.slice(0, retainedCount), sumOverflow(data.lineSeries1)],
    lineSeries2: [...data.lineSeries2.slice(0, retainedCount), sumOverflow(data.lineSeries2)],
    hasSecondary: data.hasSecondary,
    series: data.series?.map((series) => ({
      ...series,
      values: [...series.values.slice(0, retainedCount), sumOverflow(series.values)],
    })),
  };
}

type ChartTableRow = Record<string, string | number | boolean | null>;

function readTableRows(value: string | undefined): ChartTableRow[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((row): row is ChartTableRow => Boolean(row) && typeof row === 'object' && !Array.isArray(row))
      : [];
  } catch {
    return [];
  }
}

function getRowValue(row: ChartTableRow, field: string): ChartTableRow[string] | undefined {
  const matchingKey = Object.keys(row).find((key) => key.toLocaleLowerCase() === field.toLocaleLowerCase());
  return matchingKey ? row[matchingKey] : undefined;
}

function isDateValue(value: unknown): boolean {
  return typeof value === 'string' && /^(?:\d{4}-\d{2}-\d{2}(?:[T\s].*)?|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})$/.test(value.trim()) && !Number.isNaN(Date.parse(value));
}

function inferGroupBy(rows: ChartTableRow[]): string {
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const textCandidates = keys.filter((key) => {
    const values = rows.map((row) => getRowValue(row, key)).filter((value) => value != null && value !== '');
    return values.length > 0 && values.every((value) => typeof value === 'string' && !isDateValue(value) && !Number.isFinite(Number(value)));
  });
  const scored = textCandidates.map((key) => ({ key, unique: new Set(rows.map((row) => String(getRowValue(row, key) ?? ''))).size }))
    .filter((item) => item.unique < rows.length)
    .sort((a, b) => b.unique - a.unique);
  return scored[0]?.key ?? textCandidates[0] ?? '';
}

function filterRowsByTimeRange(rows: ChartTableRow[], range: string): ChartTableRow[] {
  if (!range || range.toLocaleLowerCase() === 'all time') return rows;
  const dateKey = [...new Set(rows.flatMap((row) => Object.keys(row)))].find((key) => rows.some((row) => isDateValue(getRowValue(row, key))));
  if (!dateKey) return rows;
  const now = new Date();
  const rangeStart = new Date(now);
  if (range === 'Last 7 days') rangeStart.setDate(now.getDate() - 7);
  else if (range === 'Last 30 days' || range === 'Last 1 month') rangeStart.setDate(now.getDate() - 30);
  else if (range === 'Last 3 months') rangeStart.setMonth(now.getMonth() - 3);
  else if (range === 'Last 6 months') rangeStart.setMonth(now.getMonth() - 6);
  else if (range === 'Last 1 year') rangeStart.setFullYear(now.getFullYear() - 1);
  else if (range === 'This quarter') rangeStart.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
  else return rows;
  return rows.filter((row) => {
    const value = getRowValue(row, dateKey);
    const date = new Date(String(value));
    return !Number.isNaN(date.getTime()) && date >= rangeStart && date <= now;
  });
}

function readableField(field: string): string {
  return field.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (char) => char.toUpperCase());
}

function chartSeriesColor(index: number): string {
  if (index === 0) return 'var(--accent-default)';
  if (index === 1) return 'var(--blue-400)';
  return `var(--chart-${index + 1})`;
}

function pieSliceColor(index: number): string {
  const colors = [
    'var(--blue-600)',
    'var(--accent-default)',
    'var(--blue-400)',
    'var(--blue-300)',
    'var(--blue-200)',
    'var(--blue-100)',
  ];
  return colors[index % colors.length];
}

function aggregateValues(values: number[], aggregation: string): number {
  if (values.length === 0) return 0;
  if (aggregation === 'Average') return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  if (aggregation === 'Highest') return Math.max(...values);
  if (aggregation === 'Lowest') return Math.min(...values);
  return values.reduce((sum, value) => sum + value, 0);
}

function readMeasures(value: string | undefined, measureField: string, aggregation: string, rows: ChartTableRow[]): ChartMeasure[] {
  if (value?.startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const measures = parsed.filter((measure): measure is ChartMeasure => Boolean(measure) && typeof measure === 'object' && ['Count', 'Sum', 'Average', 'Highest', 'Lowest'].includes(measure.agg));
        if (measures.length) return measures.slice(0, 3);
      }
    } catch {
      // Fall through to the legacy single-measure properties.
    }
  }
  if (measureField === 'Number of rows') {
    const numericColumn = [...new Set(rows.flatMap((row) => Object.keys(row)))].find((key) => {
      const values = rows.map((row) => getRowValue(row, key)).filter((item) => item !== '' && item != null);
      return values.length > 0 && values.every((item) => typeof item === 'number' || (typeof item === 'string' && item.trim() !== '' && Number.isFinite(Number(item))));
    });
    if (numericColumn) return [{ agg: 'Sum', col: numericColumn }];
    return [{ agg: 'Count' }];
  }
  return [{ agg: aggregation as ChartMeasure['agg'], col: measureField }];
}

function measureLabel(measure: ChartMeasure): string {
  return measure.agg === 'Count' ? 'Number of rows' : `${measure.agg} of ${readableField(measure.col ?? '')}`;
}

function dataFromTableRows(rows: ChartTableRow[], measures: ChartMeasure[], groupBy: string): ChartData | null {
  if (rows.length === 0) return null;
  if (!measures.length || !groupBy) return null;
  const groups = new Map<string, ChartTableRow[]>();

  rows.forEach((row, index) => {
    const rawGroup = groupBy === 'Row order' ? index + 1 : getRowValue(row, groupBy);
    const label = rawGroup == null || rawGroup === '' ? 'Untitled' : String(rawGroup);
    const values = groups.get(label) ?? [];
    values.push(row);
    groups.set(label, values);
  });

  if (groups.size === 0) return null;
  const labels = [...groups.keys()];
  const series = measures.map((measure) => ({
    label: measureLabel(measure),
    values: labels.map((label) => {
      const groupRows = groups.get(label) ?? [];
      if (measure.agg === 'Count') return groupRows.length;
      const values = groupRows.map((row) => {
        const raw = getRowValue(row, measure.col ?? '');
        const value = typeof raw === 'number' ? raw : Number(raw);
        return Number.isFinite(value) ? value : 0;
      });
      return aggregateValues(values, measure.agg);
    }),
  }));
  const values = series[0]?.values ?? [];
  return {
    labels,
    barSeries1: values,
    barSeries2: values.map(() => 0),
    lineSeries1: values,
    lineSeries2: values.map(() => 0),
    hasSecondary: series.length > 1,
    series,
  };
}

function chartSeries(data: ChartData, mode: 'bar' | 'line', labels: string[]): Array<{ label: string; values: number[] }> {
  if (data.series?.length) return data.series;
  const primary = mode === 'bar' ? data.barSeries1 : data.lineSeries1;
  const secondary = mode === 'bar' ? data.barSeries2 : data.lineSeries2;
  return data.hasSecondary === false
    ? [{ label: labels[0], values: primary }]
    : [{ label: labels[0], values: primary }, { label: labels[1], values: secondary }];
}

const DATA_BY_FILTER: Record<ChartDateFilter, ChartData> = {
  'Yearly': {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    barSeries1: [120, 180, 150, 210, 170, 240, 200, 260, 220, 190, 280, 310],
    barSeries2: [90, 140, 130, 170, 150, 200, 180, 220, 200, 160, 230, 270],
    lineSeries1: [2400, 3200, 2800, 4100, 3600, 4800, 4200, 5100, 4600, 3900, 5400, 6200],
    lineSeries2: [1800, 2600, 2200, 3400, 2900, 3800, 3500, 4300, 3800, 3200, 4600, 5400],
  },
  'Monthly': {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    barSeries1: [68, 82, 74, 96],
    barSeries2: [52, 64, 58, 78],
    lineSeries1: [1400, 1680, 1520, 1960],
    lineSeries2: [1050, 1280, 1160, 1560],
  },
  'Weekly': {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    barSeries1: [14, 18, 16, 22, 20, 12, 8],
    barSeries2: [10, 14, 12, 18, 16, 9, 6],
    lineSeries1: [280, 360, 320, 440, 400, 240, 160],
    lineSeries2: [210, 280, 240, 360, 320, 180, 120],
  },
};

const scaleSeries = (series: number[], multiplier: number) => series.map((value) => Math.round(value * multiplier));

function dataForSet(dataSet: ChartDataSet, filter: ChartDateFilter): ChartData {
  const source = DATA_BY_FILTER[filter];
  if (dataSet === 'Orders') return source;
  if (dataSet === 'Revenue') {
    return {
      ...source,
      barSeries1: scaleSeries(source.barSeries1, 24),
      barSeries2: scaleSeries(source.barSeries2, 24),
      lineSeries1: scaleSeries(source.lineSeries1, 1.5),
      lineSeries2: scaleSeries(source.lineSeries2, 1.5),
    };
  }
  return {
    ...source,
    barSeries1: scaleSeries(source.barSeries1, 8),
    barSeries2: scaleSeries(source.barSeries2, 8),
    lineSeries1: scaleSeries(source.lineSeries1, 2.4),
    lineSeries2: scaleSeries(source.lineSeries2, 2.4),
  };
}

// ============================================
// Chart Constants
// ============================================
const CHART_WIDTH = 692;
const CHART_HEIGHT = 222;
const PADDING_LEFT = 40;
const PADDING_RIGHT = 10;
const PADDING_TOP = 8;
const PADDING_BOTTOM = 28;

const PLOT_WIDTH = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

// The horizontal-bar treatment has a longer plotting area so labels can sit
// outside the graph without competing with the values at the end of each bar.
const HORIZONTAL_CHART_HEIGHT = 320;
const HORIZONTAL_LABEL_WIDTH = 90;
const HORIZONTAL_PADDING_RIGHT = 20;
const HORIZONTAL_PADDING_TOP = 4;
const HORIZONTAL_PADDING_BOTTOM = 28;
const HORIZONTAL_PLOT_WIDTH = CHART_WIDTH - HORIZONTAL_LABEL_WIDTH - HORIZONTAL_PADDING_RIGHT;
const HORIZONTAL_PLOT_HEIGHT = HORIZONTAL_CHART_HEIGHT - HORIZONTAL_PADDING_TOP - HORIZONTAL_PADDING_BOTTOM;

function getAxisStep(maxValue: number): number {
  const targetStep = Math.max(maxValue, 1) / 3;
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const normalized = targetStep / magnitude;
  const rounded = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return rounded * magnitude;
}

// ============================================
// Date Filter Dropdown
// ============================================
const DATE_OPTIONS: ChartDateFilter[] = ['Yearly', 'Monthly', 'Weekly'];
const DEFAULT_TIME_RANGE_OPTIONS = ['All time', 'Last 3 months', 'Last 6 months', 'Last 1 year', 'Last 2 years', 'This year'];

function readTimeRangeOptions(value: string | undefined): string[] {
  if (!value?.startsWith('[')) return DEFAULT_TIME_RANGE_OPTIONS;
  try {
    const parsed = JSON.parse(value);
    const options = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string' && DEFAULT_TIME_RANGE_OPTIONS.includes(item)) : [];
    return options.length ? options : DEFAULT_TIME_RANGE_OPTIONS;
  } catch {
    return DEFAULT_TIME_RANGE_OPTIONS;
  }
}

function TimeRangeDropdown({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="jf-chart__filter jf-chart__filter--time-range" ref={ref}>
      <button type="button" className="jf-chart__filter-trigger" onClick={() => setOpen(!open)} aria-haspopup="listbox" aria-expanded={open}>
        <span>{value}</span>
        <Icon name="ChevronDown" size={16} />
      </button>
      {open && (
        <div className="jf-chart__filter-menu">
          {options.map((option) => (
            <button key={option} className={`jf-chart__filter-item${option === value ? ' jf-chart__filter-item--active' : ''}`} type="button" onClick={() => { onChange(option); setOpen(false); }}>
              <span>{option}</span>
              {option === value && <Icon name="Check" size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DateFilterDropdown({ value, onChange }: { value: ChartDateFilter; onChange: (v: ChartDateFilter) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="jf-chart__filter" ref={ref}>
      <button type="button" className="jf-chart__filter-trigger" onClick={() => setOpen(!open)} aria-haspopup="listbox" aria-expanded={open}>
        <span>{value}</span>
        <Icon name="ChevronDown" size={16} />
      </button>
      {open && (
        <div className="jf-chart__filter-menu">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt}
              className={`jf-chart__filter-item${opt === value ? ' jf-chart__filter-item--active' : ''}`}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              <span>{opt}</span>
              {opt === value && <Icon name="Check" size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Tooltip
// ============================================
interface TooltipInfo {
  x: number;
  y: number;
  month: string;
  values: Array<{ label: string; value: string; series: number }>;
}

function ChartTooltip({ info }: { info: TooltipInfo }) {
  return (
    <div
      className="jf-chart__tooltip"
      style={{ left: `${(info.x / CHART_WIDTH) * 100}%`, top: `${(info.y / CHART_HEIGHT) * 100}%` }}
    >
      <div className="jf-chart__tooltip-title">{info.month}</div>
      {info.values.map((v, i) => (
        <div key={i} className="jf-chart__tooltip-row">
          <span className={`jf-chart__tooltip-dot jf-chart__tooltip-dot--s${v.series}`} />
          <span className="jf-chart__tooltip-label">{v.label}</span>
          <span className="jf-chart__tooltip-value">{v.value}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Bar Chart
// ============================================
const BarChart: FC<{ data: ChartData; tooltip: TooltipInfo | null; onHover: (info: TooltipInfo | null) => void; labelStep?: number; seriesLabels: [string, string] }> = ({ data, onHover, labelStep = 1, seriesLabels }) => {
  const series = chartSeries(data, 'bar', seriesLabels);
  const highestValue = Math.max(...series.flatMap((item) => item.values), 1);
  const axisStep = getAxisStep(highestValue);
  const maxVal = axisStep * 4;
  const count = data.labels.length;
  const gridLines = [0, 1, 2, 3, 4];
  const barGroupWidth = PLOT_WIDTH / count;
  const barWidth = barGroupWidth * (series.length === 1 ? 0.82 : Math.min(0.7 / series.length, 0.3));
  const barGap = 2;

  return (
    <svg
      className="jf-chart__svg"
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {gridLines.map((step) => {
        const y = PADDING_TOP + PLOT_HEIGHT * (1 - step / 4);
        return (
          <g key={step}>
            <text x={PADDING_LEFT - 20} y={y + 3} className="jf-chart__y-label">{(axisStep * step).toLocaleString()}</text>
            <line
              x1={PADDING_LEFT}
              y1={y}
              x2={CHART_WIDTH - PADDING_RIGHT}
              y2={y}
              className="jf-chart__grid-line"
            />
          </g>
        );
      })}

      {/* Bars + hit areas */}
      {data.labels.map((month, i) => {
        const groupX = PADDING_LEFT + i * barGroupWidth + barGroupWidth / 2;
        const values = series.map((item) => item.values[i] ?? 0);
        const heights = values.map((value) => (value / maxVal) * PLOT_HEIGHT);
        const ys = heights.map((height) => PADDING_TOP + PLOT_HEIGHT - height);

        return (
          <g
            key={i}
            onMouseEnter={() => onHover({
              x: groupX,
              y: Math.min(...ys) - 8,
              month,
              values: series.map((item, index) => ({ label: item.label, value: (item.values[i] ?? 0).toLocaleString(), series: index + 1 })),
            })}
            onMouseLeave={() => onHover(null)}
          >
            {/* Invisible hit area */}
            <rect
              x={groupX - barGroupWidth / 2}
              y={PADDING_TOP}
              width={barGroupWidth}
              height={PLOT_HEIGHT}
              fill="transparent"
            />
            {series.map((item, seriesIndex) => (
              <rect
                key={item.label}
                x={groupX - ((series.length * barWidth + (series.length - 1) * barGap) / 2) + seriesIndex * (barWidth + barGap)}
                y={ys[seriesIndex]}
                width={barWidth}
                height={heights[seriesIndex]}
                className="jf-chart__bar"
                style={{ fill: chartSeriesColor(seriesIndex) } as CSSProperties}
              />
            ))}
            {series.map((item, seriesIndex) => <text key={`${item.label}-value`} x={groupX - ((series.length * barWidth + (series.length - 1) * barGap) / 2) + seriesIndex * (barWidth + barGap) + barWidth / 2} y={ys[seriesIndex] - 8} className="jf-chart__bar-value">{values[seriesIndex].toLocaleString()}</text>)}
          </g>
        );
      })}

      {/* X-axis labels */}
      {data.labels.map((label, i) => {
        if (i % labelStep !== 0) return null;
        const x = PADDING_LEFT + i * barGroupWidth + barGroupWidth / 2;
        return (
          <text
            key={label}
            x={x}
            y={CHART_HEIGHT - 6}
            className="jf-chart__x-label"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
};

// ============================================
// Horizontal Bar Chart
// ============================================
const HorizontalBarChart: FC<{ data: ChartData; tooltip: TooltipInfo | null; onHover: (info: TooltipInfo | null) => void; seriesLabels: [string, string] }> = ({ data, onHover, seriesLabels }) => {
  const series = chartSeries(data, 'bar', seriesLabels);
  const highestValue = Math.max(...series.flatMap((item) => item.values), 1);
  const axisStep = getAxisStep(highestValue);
  const maxVal = axisStep * 4;
  const rowHeight = HORIZONTAL_PLOT_HEIGHT / data.labels.length;
  const gridLines = [0, 1, 2, 3, 4];
  const singleBarHeight = 24;
  const barGap = 2;
  const barHeight = series.length === 1
    ? singleBarHeight
    : Math.min(16, (rowHeight - barGap * (series.length - 1)) / series.length);
  const groupHeight = series.length * barHeight + (series.length - 1) * barGap;

  return (
    <svg
      className="jf-chart__svg jf-chart__svg--horizontal"
      viewBox={`0 0 ${CHART_WIDTH} ${HORIZONTAL_CHART_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {gridLines.map((step) => {
        const x = HORIZONTAL_LABEL_WIDTH + HORIZONTAL_PLOT_WIDTH * (step / 4);
        return (
          <g key={step}>
            <line
              x1={x}
              y1={HORIZONTAL_PADDING_TOP}
              x2={x}
              y2={HORIZONTAL_PADDING_TOP + HORIZONTAL_PLOT_HEIGHT}
              className="jf-chart__grid-line jf-chart__grid-line--vertical"
            />
            <text x={x} y={HORIZONTAL_CHART_HEIGHT - 6} className="jf-chart__x-label">
              {(axisStep * step).toLocaleString()}
            </text>
          </g>
        );
      })}

      {data.labels.map((label, rowIndex) => {
        const rowCenter = HORIZONTAL_PADDING_TOP + rowIndex * rowHeight + rowHeight / 2;
        const values = series.map((item) => item.values[rowIndex] ?? 0);
        const barTop = rowCenter - groupHeight / 2;
        const tooltipY = barTop - 8;

        return (
          <g
            key={label}
            onMouseEnter={() => onHover({
              x: HORIZONTAL_LABEL_WIDTH + Math.max(...values.map((value) => (value / maxVal) * HORIZONTAL_PLOT_WIDTH)),
              y: tooltipY,
              month: label,
              values: series.map((item, index) => ({ label: item.label, value: (item.values[rowIndex] ?? 0).toLocaleString(), series: index + 1 })),
            })}
            onMouseLeave={() => onHover(null)}
          >
            <rect
              x={HORIZONTAL_LABEL_WIDTH}
              y={HORIZONTAL_PADDING_TOP + rowIndex * rowHeight}
              width={HORIZONTAL_PLOT_WIDTH}
              height={rowHeight}
              fill="transparent"
            />
            <text x={HORIZONTAL_LABEL_WIDTH - 20} y={rowCenter + 3} className="jf-chart__horizontal-label">{label}</text>
            {series.map((item, seriesIndex) => {
              const value = values[seriesIndex];
              const width = (value / maxVal) * HORIZONTAL_PLOT_WIDTH;
              const y = barTop + seriesIndex * (barHeight + barGap);
              return (
                <g key={item.label}>
                  <rect
                    x={HORIZONTAL_LABEL_WIDTH}
                    y={y}
                    width={width}
                    height={barHeight}
                    className="jf-chart__bar"
                    style={{ fill: chartSeriesColor(seriesIndex) } as CSSProperties}
                  />
                  <text x={HORIZONTAL_LABEL_WIDTH + width + 8} y={y + barHeight / 2 + 4} className="jf-chart__horizontal-value">
                    {value.toLocaleString()}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

// ============================================
// Line Chart
// ============================================
const buildLinePath = (points: Array<{ x: number; y: number }>): string => {
  if (points.length < 2) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
};

const buildAreaPath = (points: Array<{ x: number; y: number }>, baseline: number): string => {
  const linePath = buildLinePath(points);
  if (!linePath) return '';
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  return `${linePath} L ${lastPoint.x} ${baseline} L ${firstPoint.x} ${baseline} Z`;
};

const LineChart: FC<{ data: ChartData; tooltip: TooltipInfo | null; onHover: (info: TooltipInfo | null) => void; labelStep?: number; seriesLabels: [string, string]; showArea?: boolean }> = ({ data, tooltip, onHover, labelStep = 1, seriesLabels, showArea = false }) => {
  const series = chartSeries(data, 'line', seriesLabels);
  const count = data.labels.length;
  const highestValue = Math.max(...series.flatMap((item) => item.values), 1);
  const axisStep = getAxisStep(highestValue);
  const maxVal = axisStep * 4;
  const stepX = PLOT_WIDTH / (count - 1);
  const baseline = PADDING_TOP + PLOT_HEIGHT;

  const toPoints = (series: number[]) =>
    series.map((val, i) => ({
      x: PADDING_LEFT + i * stepX,
      y: PADDING_TOP + PLOT_HEIGHT - (val / maxVal) * PLOT_HEIGHT,
    }));

  const pointsBySeries = series.map((item) => toPoints(item.values));
  const areaGradientPrefix = useId().replace(/:/g, '');

  const gridLines = [0, 1, 2, 3, 4];

  return (
    <svg
      className="jf-chart__svg"
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {showArea && (
        <defs>
          {series.map((_, index) => (
            <linearGradient key={index} id={`${areaGradientPrefix}-area-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartSeriesColor(index)} stopOpacity="0.34" />
              <stop offset="100%" stopColor={chartSeriesColor(index)} stopOpacity="0.04" />
            </linearGradient>
          ))}
        </defs>
      )}
      {/* Horizontal value guides */}
      {gridLines.map((step) => {
        const y = PADDING_TOP + PLOT_HEIGHT * (1 - step / 4);
        return (
          <g key={step}>
            <text x={PADDING_LEFT - 20} y={y + 3} className="jf-chart__y-label">{(axisStep * step).toLocaleString()}</text>
            <line x1={PADDING_LEFT} y1={y} x2={CHART_WIDTH - PADDING_RIGHT} y2={y} className="jf-chart__grid-line" />
          </g>
        );
      })}

      {showArea && pointsBySeries.map((points, index) => <path key={`area-${index}`} d={buildAreaPath(points, baseline)} className="jf-chart__area" style={{ fill: `url(#${areaGradientPrefix}-area-${index})` } as CSSProperties} />)}

      {/* Lines and their always-visible data points */}
      {pointsBySeries.map((points, index) => (
        <g key={`line-${index}`}>
          <path d={buildLinePath(points)} className="jf-chart__line" style={{ stroke: chartSeriesColor(index) } as CSSProperties} />
          {points.map((point, pointIndex) => (
            <circle
              key={pointIndex}
              cx={point.x}
              cy={point.y}
              r={3}
              className="jf-chart__line-point"
              style={{ stroke: chartSeriesColor(index) } as CSSProperties}
            />
          ))}
        </g>
      ))}

      {/* Hit areas + hover indicator */}
      {data.labels.map((label, i) => {
        const x = PADDING_LEFT + i * stepX;
        const isActive = tooltip?.month === label;
        return (
          <g
            key={label}
            onMouseEnter={() => onHover({
              x,
              y: Math.min(...pointsBySeries.map((points) => points[i].y)) - 8,
              month: label,
              values: series.map((item, index) => ({ label: item.label, value: (item.values[i] ?? 0).toLocaleString(), series: index + 1 })),
            })}
            onMouseLeave={() => onHover(null)}
          >
            <rect
              x={x - stepX / 2}
              y={PADDING_TOP}
              width={stepX}
              height={PLOT_HEIGHT}
              fill="transparent"
            />
            {isActive && (
              <>
                <line x1={x} y1={PADDING_TOP} x2={x} y2={baseline} className="jf-chart__hover-line" />
                {pointsBySeries.map((points, index) => <circle key={index} cx={x} cy={points[i].y} r={4} className="jf-chart__dot" style={{ fill: chartSeriesColor(index) } as CSSProperties} />)}
              </>
            )}
          </g>
        );
      })}

      {/* X-axis labels */}
      {data.labels.map((label, i) => {
        if (i % labelStep !== 0) return null;
        return (
          <text
            key={label}
            x={PADDING_LEFT + i * stepX}
            y={CHART_HEIGHT - 6}
            className="jf-chart__x-label"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
};

const DonutChart: FC<{ data: ChartData; seriesLabels: [string, string] }> = ({ data, seriesLabels }) => {
  const dataSeries = chartSeries(data, 'bar', seriesLabels);
  const isMultiMeasure = dataSeries.length > 1;
  const slices = isMultiMeasure
    ? dataSeries.map((series) => ({ label: series.label, value: series.values.reduce((sum, value) => sum + value, 0) }))
    : data.labels.map((label, index) => ({ label, value: dataSeries[0]?.values[index] ?? 0 })).sort((a, b) => b.value - a.value);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let currentAngle = -Math.PI / 2;

  return (
    <div className="jf-chart__donut-layout">
      <svg className="jf-chart__donut" viewBox="0 0 200 200" role="img" aria-label="Donut chart">
        {slices.map((slice, index) => {
          const nextAngle = currentAngle + (total ? slice.value / total : 0) * Math.PI * 2;
          const path = pieSlicePath(100, 100, currentAngle, nextAngle);
          currentAngle = nextAngle;
          return <path key={slice.label} d={path} fill={pieSliceColor(index)} />;
        })}
        <circle className="jf-chart__donut-hole" cx="100" cy="100" r="68" />
      </svg>
      <div className="jf-chart__donut-legend">
        {slices.map((slice, index) => <div className="jf-chart__donut-legend-row" key={slice.label}>
          <span className="jf-chart__legend-dot" style={{ background: pieSliceColor(index) } as CSSProperties} />
          <span>{slice.label}</span>
          <strong>{total ? `${Math.round((slice.value / total) * 100)}%` : '0%'}</strong>
        </div>)}
      </div>
    </div>
  );
};

const piePoint = (center: number, radius: number, angle: number) => ({
  x: center + radius * Math.cos(angle),
  y: center + radius * Math.sin(angle),
});

function pieSlicePath(center: number, radius: number, startAngle: number, endAngle: number): string {
  const start = piePoint(center, radius, startAngle);
  const end = piePoint(center, radius, endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${center} ${center} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

const PieChart: FC<{ data: ChartData; seriesLabels: [string, string] }> = ({ data, seriesLabels }) => {
  const dataSeries = chartSeries(data, 'bar', seriesLabels);
  const isMultiMeasure = dataSeries.length > 1;
  const slices = (isMultiMeasure
    ? dataSeries.map((series) => ({ label: series.label, value: series.values.reduce((sum, value) => sum + value, 0) }))
    : data.labels.map((label, index) => ({ label, value: dataSeries[0]?.values[index] ?? 0 })))
    .sort((a, b) => b.value - a.value);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = 100;
  let currentAngle = -Math.PI / 2;

  return (
    <div className="jf-chart__pie-layout">
      <svg className="jf-chart__pie" viewBox="0 0 200 200" role="img" aria-label={`Total ${total}`}>
        {slices.map((slice, index) => {
          const portion = total ? slice.value / total : 0;
          const nextAngle = currentAngle + portion * Math.PI * 2;
          const path = pieSlicePath(100, radius, currentAngle, nextAngle);
          currentAngle = nextAngle;
          return <path key={slice.label} d={path} fill={pieSliceColor(index)} />;
        })}
      </svg>
      <div className="jf-chart__pie-legend">
        {slices.map((slice, index) => (
          <div className="jf-chart__pie-legend-row" key={slice.label}>
            <span className="jf-chart__legend-dot" style={{ background: pieSliceColor(index) } as CSSProperties} />
            <span>{slice.label}</span>
            <strong>{total ? `${Math.round((slice.value / total) * 100)}%` : '0%'}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// Chart Component
// ============================================
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

export const Chart: FC<ChartProps> = ({
  type = 'Bar',
  title,
  description,
  primaryLabel = 'This period',
  secondaryLabel = 'Previous period',
  dataSet = 'Orders',
  iconName = 'TrendingUp',
  showIcon = true,
  showDateFilter = true,
  showTimeRangeSelector = false,
  timeRange = 'All time',
  timeRangeOptions,
  showLegend = true,
  chartColor = 'var(--blue-600)',
  tableRows,
  measures,
  measureField = 'Value',
  aggregation = 'Sum',
  groupBy = 'Category',
  selected = false,
  skeleton = false,
  skeletonAnimation = 'pulse',
}) => {
  const parsedRows = readTableRows(tableRows);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const activeMeasures = readMeasures(measures, measureField, aggregation, parsedRows);
  const filteredRows = filterRowsByTimeRange(parsedRows, showTimeRangeSelector ? selectedTimeRange : timeRange);
  const resolvedGroupBy = groupBy && parsedRows.some((row) => getRowValue(row, groupBy) !== undefined) ? groupBy : inferGroupBy(parsedRows);
  const tableData = dataFromTableRows(filteredRows, activeMeasures, resolvedGroupBy);
  const defaultTitle = dataSet === 'Revenue' ? 'Revenue' : dataSet === 'Visitors' ? 'Visitors' : 'Orders';
  const isLegacyDefaultTitle = title === 'Orders';
  const isLegacyDefaultDescription = description === 'Monthly order volume';
  const resolvedTitle = (tableData && (isLegacyDefaultTitle || !title))
    ? 'My Chart'
    : title || (type === 'Donut' ? 'Audience overview' : defaultTitle);
  const automaticDescription = `${activeMeasures.map(measureLabel).join(' and ')}${resolvedGroupBy ? ` by ${readableField(resolvedGroupBy)}` : ''}`;
  const resolvedDesc = (tableData && (isLegacyDefaultDescription || !description))
    ? automaticDescription
    : description || (tableData
    ? automaticDescription
    : type === 'Donut' ? 'How your audience is distributed' : `Monthly ${defaultTitle.toLowerCase()} overview`);
  const seriesLabels: [string, string] = [primaryLabel || 'This period', secondaryLabel || 'Previous period'];
  const animClass = skeletonAnimation === 'shimmer' ? 'animate-shimmer' : 'animate-pulse';

  const classes = [
    'jf-chart',
    selected && 'jf-chart--selected',
    type === 'Horizontal Bar' && 'jf-chart--horizontal',
    type === 'Pie' && 'jf-chart--pie',
    type === 'Donut' && 'jf-chart--donut',
  ].filter(Boolean).join(' ');

  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [dateFilter, setDateFilter] = useState<ChartDateFilter>('Yearly');
  const handleHover = useCallback((info: TooltipInfo | null) => setTooltip(info), []);
  const chartData = limitCategories(tableData ?? dataForSet(dataSet, dateFilter));
  const tableHasDateColumn = parsedRows.some((row) => Object.values(row).some(isDateValue));
  const isTableColumnChart = type === 'Bar' && tableData !== null;
  const isMobile = useIsMobile();
  const labelStep = isMobile && chartData.labels.length > 7 ? 2 : 1;

  if (skeleton) {
    return (
      <div className={classes}>
        <div className="jf-chart__header">
          <div className={`jf-chart__icon jf-skeleton__bone ${animClass}`} />
          <div className="jf-chart__header-text">
            <div className={`jf-skeleton__bone jf-skeleton__line jf-skeleton__line--lg ${animClass}`} />
            <div className={`jf-skeleton__bone jf-skeleton__line jf-skeleton__line--sm ${animClass}`} />
          </div>
        </div>
        <div className={`jf-chart__canvas jf-skeleton__bone ${animClass}`} />
      </div>
    );
  }

  return (
    <div className={classes} style={{ '--accent-default': chartColor } as CSSProperties}>
      <div className="jf-chart__header">
        {showIcon && !isTableColumnChart && (
          <div className="jf-chart__icon">
            <Icon name={iconName} size={24} />
          </div>
        )}
        <div className="jf-chart__header-text">
          <div className="jf-chart__title">{resolvedTitle}</div>
          <div className="jf-chart__description">{resolvedDesc}</div>
        </div>
        {showTimeRangeSelector && type !== 'Horizontal Bar' && type !== 'Line' && type !== 'Area' && type !== 'Pie' && type !== 'Donut'
          ? <TimeRangeDropdown value={selectedTimeRange} onChange={setSelectedTimeRange} options={readTimeRangeOptions(timeRangeOptions)} />
          : showDateFilter && !isTableColumnChart && (!tableRows || tableHasDateColumn) && <DateFilterDropdown value={dateFilter} onChange={setDateFilter} />}
      </div>
      <div className="jf-chart__canvas">
        {type === 'Bar' && <BarChart data={chartData} tooltip={tooltip} onHover={handleHover} labelStep={labelStep} seriesLabels={seriesLabels} />}
        {type === 'Horizontal Bar' && <HorizontalBarChart data={chartData} tooltip={tooltip} onHover={handleHover} seriesLabels={seriesLabels} />}
        {(type === 'Line' || type === 'Area') && <LineChart data={chartData} tooltip={tooltip} onHover={handleHover} labelStep={labelStep} seriesLabels={seriesLabels} showArea={type === 'Area'} />}
        {type === 'Pie' && <PieChart data={chartData} seriesLabels={seriesLabels} />}
        {type === 'Donut' && <DonutChart data={chartData} seriesLabels={seriesLabels} />}
        {tooltip && <ChartTooltip info={tooltip} />}
      </div>
      {showLegend && (chartData.series?.length ?? (chartData.hasSecondary === false ? 1 : 2)) > 1 && type !== 'Donut' && type !== 'Pie' && (
        <div className="jf-chart__legend" aria-label="Chart legend">
          {chartSeries(chartData, 'bar', seriesLabels).map((series, index) => <span key={series.label}><i className="jf-chart__legend-dot" style={{ background: chartSeriesColor(index) } as CSSProperties} />{series.label}</span>)}
        </div>
      )}
    </div>
  );
};

export default Chart;
