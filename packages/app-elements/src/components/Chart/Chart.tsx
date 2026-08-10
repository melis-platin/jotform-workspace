import { useState, useCallback, useRef, useEffect, type FC } from 'react';
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
  showLegend?: boolean;
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
const CHART_WIDTH = 560;
const CHART_HEIGHT = 200;
const PADDING_LEFT = 8;
const PADDING_RIGHT = 8;
const PADDING_TOP = 8;
const PADDING_BOTTOM = 36;

const PLOT_WIDTH = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

// ============================================
// Date Filter Dropdown
// ============================================
const DATE_OPTIONS: ChartDateFilter[] = ['Yearly', 'Monthly', 'Weekly'];

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
  const maxVal = Math.max(...data.barSeries1, ...data.barSeries2);
  const count = data.labels.length;
  const gridLines = [0.25, 0.5, 0.75, 1.0];
  const barGroupWidth = PLOT_WIDTH / count;
  const barWidth = barGroupWidth * 0.3;
  const barGap = 2;

  return (
    <svg
      className="jf-chart__svg"
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {gridLines.map((ratio) => {
        const y = PADDING_TOP + PLOT_HEIGHT * (1 - ratio);
        return (
          <line
            key={ratio}
            x1={PADDING_LEFT}
            y1={y}
            x2={CHART_WIDTH - PADDING_RIGHT}
            y2={y}
            className="jf-chart__grid-line"
          />
        );
      })}

      {/* Bars + hit areas */}
      {data.labels.map((month, i) => {
        const groupX = PADDING_LEFT + i * barGroupWidth + barGroupWidth / 2;
        const h1 = (data.barSeries1[i] / maxVal) * PLOT_HEIGHT;
        const h2 = (data.barSeries2[i] / maxVal) * PLOT_HEIGHT;
        const y1 = PADDING_TOP + PLOT_HEIGHT - h1;
        const y2 = PADDING_TOP + PLOT_HEIGHT - h2;

        return (
          <g
            key={i}
            onMouseEnter={() => onHover({
              x: groupX,
              y: Math.min(y1, y2) - 8,
              month,
              values: [
                { label: seriesLabels[0], value: data.barSeries1[i].toLocaleString(), series: 1 },
                { label: seriesLabels[1], value: data.barSeries2[i].toLocaleString(), series: 2 },
              ],
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
            <rect
              x={groupX - barWidth - barGap / 2}
              y={y1}
              width={barWidth}
              height={h1}
              className="jf-chart__bar jf-chart__bar--series1"
            />
            <rect
              x={groupX + barGap / 2}
              y={y2}
              width={barWidth}
              height={h2}
              className="jf-chart__bar jf-chart__bar--series2"
            />
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
// Line Chart
// ============================================
const buildSmoothPath = (points: Array<{ x: number; y: number }>): string => {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpx = (curr.x + next.x) / 2;
    d += ` C ${cpx} ${curr.y}, ${cpx} ${next.y}, ${next.x} ${next.y}`;
  }
  return d;
};

const buildAreaPath = (points: Array<{ x: number; y: number }>, baseline: number): string => {
  const linePath = buildSmoothPath(points);
  if (!linePath) return '';
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  return `${linePath} L ${lastPoint.x} ${baseline} L ${firstPoint.x} ${baseline} Z`;
};

const LineChart: FC<{ data: ChartData; tooltip: TooltipInfo | null; onHover: (info: TooltipInfo | null) => void; labelStep?: number; seriesLabels: [string, string]; showArea?: boolean }> = ({ data, tooltip, onHover, labelStep = 1, seriesLabels, showArea = false }) => {
  const count = data.labels.length;
  const maxVal = Math.max(...data.lineSeries1, ...data.lineSeries2);
  const stepX = PLOT_WIDTH / (count - 1);
  const baseline = PADDING_TOP + PLOT_HEIGHT;

  const toPoints = (series: number[]) =>
    series.map((val, i) => ({
      x: PADDING_LEFT + i * stepX,
      y: PADDING_TOP + PLOT_HEIGHT - (val / maxVal) * PLOT_HEIGHT,
    }));

  const points1 = toPoints(data.lineSeries1);
  const points2 = toPoints(data.lineSeries2);

  const gridLines = data.labels.map((_, i) => PADDING_LEFT + i * stepX);

  return (
    <svg
      className="jf-chart__svg"
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Vertical grid lines */}
      {gridLines.map((x, i) => (
        <line
          key={i}
          x1={x}
          y1={PADDING_TOP}
          x2={x}
          y2={baseline}
          className="jf-chart__grid-line jf-chart__grid-line--vertical"
        />
      ))}

      {showArea && <>
        <path d={buildAreaPath(points1, baseline)} className="jf-chart__area jf-chart__area--series1" />
        <path d={buildAreaPath(points2, baseline)} className="jf-chart__area jf-chart__area--series2" />
      </>}

      {/* Lines */}
      <path
        d={buildSmoothPath(points1)}
        className="jf-chart__line jf-chart__line--series1"
      />
      <path
        d={buildSmoothPath(points2)}
        className="jf-chart__line jf-chart__line--series2"
      />

      {/* Hit areas + hover indicator */}
      {data.labels.map((label, i) => {
        const x = PADDING_LEFT + i * stepX;
        const isActive = tooltip?.month === label;
        return (
          <g
            key={label}
            onMouseEnter={() => onHover({
              x,
              y: Math.min(points1[i].y, points2[i].y) - 8,
              month: label,
              values: [
                { label: seriesLabels[0], value: `$${(data.lineSeries1[i]).toLocaleString()}`, series: 1 },
                { label: seriesLabels[1], value: `$${(data.lineSeries2[i]).toLocaleString()}`, series: 2 },
              ],
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
                <circle cx={x} cy={points1[i].y} r={4} className="jf-chart__dot jf-chart__dot--s1" />
                <circle cx={x} cy={points2[i].y} r={4} className="jf-chart__dot jf-chart__dot--s2" />
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
  const primary = data.barSeries1.reduce((sum, value) => sum + value, 0);
  const secondary = data.barSeries2.reduce((sum, value) => sum + value, 0);
  const total = primary + secondary;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const primaryLength = total ? (primary / total) * circumference : 0;

  return (
    <div className="jf-chart__donut-layout">
      <svg className="jf-chart__donut" viewBox="0 0 180 180" role="img" aria-label={`${primary} ${seriesLabels[0]} and ${secondary} ${seriesLabels[1]}`}>
        <circle className="jf-chart__donut-track" cx="90" cy="90" r={radius} />
        <circle className="jf-chart__donut-segment jf-chart__donut-segment--secondary" cx="90" cy="90" r={radius} />
        <circle
          className="jf-chart__donut-segment jf-chart__donut-segment--primary"
          cx="90"
          cy="90"
          r={radius}
          strokeDasharray={`${primaryLength} ${circumference - primaryLength}`}
        />
        <text className="jf-chart__donut-total" x="90" y="85">{total.toLocaleString()}</text>
        <text className="jf-chart__donut-caption" x="90" y="105">Total</text>
      </svg>
      <div className="jf-chart__donut-legend">
        <div className="jf-chart__donut-legend-row">
          <span className="jf-chart__legend-dot jf-chart__legend-dot--series1" />
          <span>{seriesLabels[0]}</span>
          <strong>{primary.toLocaleString()}</strong>
        </div>
        <div className="jf-chart__donut-legend-row">
          <span className="jf-chart__legend-dot jf-chart__legend-dot--series2" />
          <span>{seriesLabels[1]}</span>
          <strong>{secondary.toLocaleString()}</strong>
        </div>
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
  showLegend = true,
  selected = false,
  skeleton = false,
  skeletonAnimation = 'pulse',
}) => {
  const defaultTitle = dataSet === 'Revenue' ? 'Revenue' : dataSet === 'Visitors' ? 'Visitors' : 'Orders';
  const resolvedTitle = title || (type === 'Donut' ? 'Audience overview' : defaultTitle);
  const resolvedDesc = description || (type === 'Donut' ? 'How your audience is distributed' : `Monthly ${defaultTitle.toLowerCase()} overview`);
  const seriesLabels: [string, string] = [primaryLabel || 'This period', secondaryLabel || 'Previous period'];
  const animClass = skeletonAnimation === 'shimmer' ? 'animate-shimmer' : 'animate-pulse';

  const classes = [
    'jf-chart',
    selected && 'jf-chart--selected',
  ].filter(Boolean).join(' ');

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

  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [dateFilter, setDateFilter] = useState<ChartDateFilter>('Yearly');
  const handleHover = useCallback((info: TooltipInfo | null) => setTooltip(info), []);
  const chartData = dataForSet(dataSet, dateFilter);
  const isMobile = useIsMobile();
  const labelStep = isMobile && chartData.labels.length > 7 ? 2 : 1;

  return (
    <div className={classes}>
      <div className="jf-chart__header">
        {showIcon && (
          <div className="jf-chart__icon">
            <Icon name={iconName} size={24} />
          </div>
        )}
        <div className="jf-chart__header-text">
          <div className="jf-chart__title">{resolvedTitle}</div>
          <div className="jf-chart__description">{resolvedDesc}</div>
        </div>
        {showDateFilter && <DateFilterDropdown value={dateFilter} onChange={setDateFilter} />}
      </div>
      <div className="jf-chart__canvas">
        {(type === 'Bar' || type === 'Horizontal Bar') && <BarChart data={chartData} tooltip={tooltip} onHover={handleHover} labelStep={labelStep} seriesLabels={seriesLabels} />}
        {(type === 'Line' || type === 'Area') && <LineChart data={chartData} tooltip={tooltip} onHover={handleHover} labelStep={labelStep} seriesLabels={seriesLabels} showArea={type === 'Area'} />}
        {(type === 'Pie' || type === 'Donut') && <DonutChart data={chartData} seriesLabels={seriesLabels} />}
        {tooltip && <ChartTooltip info={tooltip} />}
      </div>
      {showLegend && type !== 'Donut' && type !== 'Pie' && (
        <div className="jf-chart__legend" aria-label="Chart legend">
          <span><i className="jf-chart__legend-dot jf-chart__legend-dot--series1" />{seriesLabels[0]}</span>
          <span><i className="jf-chart__legend-dot jf-chart__legend-dot--series2" />{seriesLabels[1]}</span>
        </div>
      )}
    </div>
  );
};

export default Chart;
