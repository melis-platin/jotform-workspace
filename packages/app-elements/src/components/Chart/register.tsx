import { ComponentRegistry } from '../../types/registry';
import { Chart } from './Chart';
import type { ChartDataSet, ChartType } from './Chart';
import type { VariantValues, PropertyValues } from '../../types/component';
import scss from './Chart.scss?raw';

const DEFAULT_CHART_TABLE_ROWS = '[{"category":"Category 1","value":12,"note":"Note 1"},{"category":"Category 2","value":19,"note":"Note 2"},{"category":"Category 3","value":15,"note":"Note 3"},{"category":"Category 4","value":24,"note":"Note 4"},{"category":"Category 5","value":21,"note":"Note 5"},{"category":"Category 6","value":9,"note":"Note 6"}]';

ComponentRegistry.register({
  id: 'chart',
  name: 'Chart',
  category: 'Basic',
  icon: 'TrendingUp',

  variants: {
    Type: {
      options: ['Bar', 'Horizontal Bar', 'Line', 'Area', 'Pie', 'Donut'],
      default: 'Bar',
    },
  },

  properties: [
    { name: 'Title', type: 'text', default: 'My Chart' },
    { name: 'Description', type: 'text', default: '' },
    { name: 'Primary Label', type: 'text', default: 'This period' },
    { name: 'Secondary Label', type: 'text', default: 'Previous period' },
    { name: 'Data Set', type: 'select', default: 'Orders', options: ['Orders', 'Revenue', 'Visitors'] },
    { name: 'Data Source', type: 'text', default: 'My Chart' },
    { name: 'Chart Table Rows', type: 'text', default: DEFAULT_CHART_TABLE_ROWS },
    { name: 'Measure Field', type: 'text', default: 'Value' },
    { name: 'Aggregation', type: 'text', default: 'Sum' },
    { name: 'Measures', type: 'text', default: '[{"agg":"Sum","col":"Value"}]' },
    { name: 'Table Settings', type: 'text', default: '{}' },
    { name: 'Group By', type: 'text', default: 'Category' },
    { name: 'Time Range', type: 'text', default: 'All Time' },
    { name: 'Show Time Range Selector', type: 'boolean', default: true },
    { name: 'Time Range Options', type: 'text', default: '6 selected' },
    { name: 'Show Icon', type: 'boolean', default: false },
    { name: 'Icon', type: 'icon', default: 'TrendingUp' },
    { name: 'Date Filter', type: 'boolean', default: false },
    { name: 'Show Legend', type: 'boolean', default: true },
    { name: 'Chart Color', type: 'text', default: 'var(--chart-blue-900)' },
    { name: 'Response Values', type: 'boolean', default: true },
    { name: 'Percentages', type: 'boolean', default: true },
    { name: 'Round Percentages', type: 'boolean', default: false },
    { name: 'Value Labels', type: 'boolean', default: true },
    { name: 'Grid', type: 'boolean', default: true },
    { name: 'Tooltips', type: 'boolean', default: true },
    { name: 'Selected', type: 'boolean', default: false },
    { name: 'Skeleton', type: 'boolean', default: false },
  ],

  states: [],

  scss,

  colorTokens: [
    { token: 'Background', variable: '--bg-fill', value: '#FFFFFF', description: '--bg-fill → neutral-0' },
    { token: 'Border', variable: '--border', value: '#DADEF3', description: '--border → neutral-100' },
    { token: 'Title', variable: '--fg-primary', value: '#091141', description: '--fg-primary → neutral-900' },
    { token: 'X-axis Labels', variable: '--fg-secondary', value: '#353C6A', description: '--fg-secondary → neutral-600' },
    { token: 'Grid Lines', variable: '--border', value: '#DADEF3', description: '--border → neutral-100' },
    { token: 'Series Fill', variable: '--bg-fill-brand', value: '#7D38EF', description: '--bg-fill-brand → primary-600' },
    { token: 'Series Accent', variable: '--fg-brand', value: '#7D38EF', description: '--fg-brand → primary-600' },
    { token: 'Selected Border', variable: '--border-info', value: '#00A3E9', description: '--border-info → info-500' },
  ],

  usage: `import { Chart } from '@/components/Chart';

// Default bar chart
<Chart type="Bar" />

// Area and donut variants
<Chart type="Area" title="Monthly Revenue" />
<Chart type="Donut" title="Audience overview" />

// Selected state
<Chart type="Bar" selected />

// Skeleton loading state
<Chart skeleton />`,

  propDocs: [
    {
      name: 'type',
      type: '"Bar" | "Line" | "Area" | "Donut"',
      default: '"Bar"',
      description:
        'Determines the chart variant. Bar compares values, Line shows a trend, Area emphasizes the magnitude of a trend, and Donut shows a proportional two-part summary.',
    },
    {
      name: 'title',
      type: 'string',
      default: '"Orders"',
      description:
        'The chart title displayed at the top left. If not provided, defaults based on the chart type.',
    },
    {
      name: 'selected',
      type: 'boolean',
      default: 'false',
      description:
        'When true, applies a 2px border-info outline around the chart card to indicate the selected/active state.',
    },
    {
      name: 'skeleton',
      type: 'boolean',
      default: 'false',
      description:
        'When true, renders a skeleton placeholder with bone elements instead of the actual chart content.',
    },
    {
      name: 'skeletonAnimation',
      type: '"pulse" | "shimmer"',
      default: '"pulse"',
      description:
        'Controls the skeleton animation style. **pulse** applies a pulsing opacity animation. **shimmer** applies a horizontal shimmer sweep.',
    },
  ],

  render(_variants: VariantValues, props: PropertyValues) {
    return (
      <Chart
        type={_variants['Type'] as ChartType}
        title={props['Title'] as string}
        description={props['Description'] as string}
        primaryLabel={props['Primary Label'] as string}
        secondaryLabel={props['Secondary Label'] as string}
        dataSet={props['Data Set'] as ChartDataSet}
        showIcon={props['Show Icon'] as boolean}
        iconName={props['Icon'] as string}
        showDateFilter={props['Date Filter'] as boolean}
        showTimeRangeSelector={props['Show Time Range Selector'] as boolean}
        timeRange={props['Time Range'] as string}
        timeRangeOptions={props['Time Range Options'] as string}
        showLegend={props['Show Legend'] as boolean}
        chartColor={props['Chart Color'] as string}
        tableRows={(props['Chart Table Rows'] as string) || DEFAULT_CHART_TABLE_ROWS}
        measures={props['Measures'] as string}
        measureField={props['Measure Field'] as string}
        aggregation={props['Aggregation'] as string}
        groupBy={props['Group By'] as string}
        selected={props['Selected'] as boolean}
        skeleton={props['Skeleton'] as boolean}
      />
    );
  },
});
