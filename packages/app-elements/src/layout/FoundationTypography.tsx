import { useEffect, useState, type CSSProperties } from 'react';

interface FontToken {
  name: string;
  variable: string;
}

const fontFamilies: FontToken[] = [
  { name: 'font-family', variable: '--font-family' },
  { name: 'font-family-heading', variable: '--font-family-heading' },
];

const fontWeights: FontToken[] = [
  { name: 'Regular (400)', variable: '--font-weight-regular' },
  { name: 'Medium (500)', variable: '--font-weight-medium' },
  { name: 'Bold (600)', variable: '--font-weight-bold' },
];

interface ScaleRow {
  name: string;
  variable: string;
  size: string;       // fluid range ("32 → 48px") or fixed ("14px")
  fluid: boolean;
  lh: string;         // "1.2" (ratio) or "20px"
  lhRatio: boolean;   // unitless ratio that scales with the font
}

interface ScaleCategory {
  title: string;
  preview: string;
  tracking: string;   // letter-spacing applied to this category
  trackingVar: string;
  fontVar: string;    // family used for the preview
  bold: boolean;
  rows: ScaleRow[];
  note?: string;
}

// Mirrors the fluid type scale defined in app.scss (:root). Headings and body
// lg/md are fluid — clamp() driven by `cqi` (the page card's width) with rem
// bounds; body sm/xs and labels are fixed. Line heights are unitless ratios
// where the font is fluid, so leading scales WITH the font.
const scaleCategories: ScaleCategory[] = [
  {
    title: 'Heading',
    preview: 'The quick brown fox',
    tracking: '−0.02em',
    trackingVar: '--letter-spacing-heading',
    fontVar: '--font-family-heading',
    bold: true,
    rows: [
      { name: 'XXL', variable: '--font-size-heading-xxl', size: '32 → 48px', fluid: true, lh: '1.2', lhRatio: true },
      { name: 'XL', variable: '--font-size-heading-xl', size: '30 → 44px', fluid: true, lh: '1.222', lhRatio: true },
      { name: 'LG', variable: '--font-size-heading-lg', size: '26 → 38px', fluid: true, lh: '1.25', lhRatio: true },
      { name: 'MD', variable: '--font-size-heading-md', size: '24 → 32px', fluid: true, lh: '1.286', lhRatio: true },
      { name: 'SM', variable: '--font-size-heading-sm', size: '20 → 28px', fluid: true, lh: '1.333', lhRatio: true },
      { name: 'XS', variable: '--font-size-heading-xs', size: '18 → 22px', fluid: true, lh: '1.4', lhRatio: true },
    ],
  },
  {
    title: 'Paragraph',
    preview: 'The quick brown fox jumps over the lazy dog',
    tracking: 'normal',
    trackingVar: '--letter-spacing-paragraph',
    fontVar: '--font-family',
    bold: false,
    rows: [
      { name: 'LG', variable: '--font-size-paragraph-lg', size: '18 → 20px', fluid: true, lh: '1.556', lhRatio: true },
      { name: 'MD', variable: '--font-size-paragraph-md', size: '16 → 18px', fluid: true, lh: '1.5', lhRatio: true },
      { name: 'SM', variable: '--font-size-paragraph-sm', size: '14px', fluid: false, lh: '20px', lhRatio: false },
      { name: 'XS', variable: '--font-size-paragraph-xs', size: '12px', fluid: false, lh: '20px', lhRatio: false },
    ],
    note: 'Opt-in fluid variant --font-size-paragraph-sm-fluid scales 14 → 16px for card / list-item descriptions; paragraph-sm itself stays fixed (≈13 compact contexts depend on it).',
  },
  {
    title: 'Label',
    preview: 'Label text',
    tracking: 'normal',
    trackingVar: '--letter-spacing-label',
    fontVar: '--font-family',
    bold: false,
    rows: [
      { name: 'LG', variable: '--font-size-label-lg', size: '16px', fluid: false, lh: '24px', lhRatio: false },
      { name: 'MD', variable: '--font-size-label-md', size: '14px', fluid: false, lh: '20px', lhRatio: false },
      { name: 'SM', variable: '--font-size-label-sm', size: '12px', fluid: false, lh: '16px', lhRatio: false },
      { name: 'XS', variable: '--font-size-label-xs', size: '10px', fluid: false, lh: '14px', lhRatio: false },
    ],
  },
];

function resolveFontFamily(variable: string): string {
  const temp = document.createElement('div');
  temp.style.fontFamily = `var(${variable})`;
  document.documentElement.appendChild(temp);
  const value = getComputedStyle(temp).fontFamily;
  document.documentElement.removeChild(temp);
  return value;
}

function Badge({ fluid }: { fluid: boolean }) {
  return (
    <span className={`foundation-tokens__badge foundation-tokens__badge--${fluid ? 'fluid' : 'fixed'}`}>
      {fluid ? 'Fluid' : 'Fixed'}
    </span>
  );
}

const ScaleColGroup = () => (
  <colgroup>
    <col style={{ width: '22%' }} />
    <col style={{ width: '20%' }} />
    <col style={{ width: '13%' }} />
    <col style={{ width: '12%' }} />
    <col style={{ width: '33%' }} />
  </colgroup>
);

export function FoundationTypography() {
  const [resolved, setResolved] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const map = new Map<string, string>();
    for (const token of fontFamilies) {
      map.set(token.variable, resolveFontFamily(token.variable));
    }
    for (const token of fontWeights) {
      const temp = document.createElement('div');
      temp.style.fontWeight = `var(${token.variable})`;
      document.documentElement.appendChild(temp);
      map.set(token.variable, getComputedStyle(temp).fontWeight);
      document.documentElement.removeChild(temp);
    }
    setResolved(map);
  }, []);

  return (
    <main className="main-content">
      <div className="component-view">
        <div className="component-view__toolbar">
          <div className="component-view__name">
            <h2>Typography</h2>
            <span className="component-view__tag">Foundations</span>
          </div>
        </div>
        <div className="foundation-tokens">
          {/* Responsive system legend */}
          <div className="foundation-tokens__legend">
            <h3 className="foundation-tokens__legend-title">Responsive type scale</h3>
            <ul className="foundation-tokens__legend-list">
              <li><strong>Headings &amp; body LG/MD are fluid</strong> — sized with <code>clamp()</code> driven by <code>cqi</code> (1% of the page card&apos;s width), so type scales to the device/page, not the browser viewport. Bounds are in <code>rem</code> (zoom-safe, WCAG 1.4.4).</li>
              <li><strong>Body SM/XS and all labels are fixed</strong> — a legibility floor (body stays ≥ 16px).</li>
              <li><strong>Line heights are unitless ratios</strong> for fluid sizes, so leading scales with the font; fixed <code>px</code> elsewhere. One-line height reservation uses the <code>lh</code> unit.</li>
              <li><strong>Headings track −0.02em</strong> (em-based, scales with size); body &amp; labels use normal tracking.</li>
              <li><strong>Text wrap:</strong> titles use <code>text-wrap: balance</code>; descriptions use <code>pretty</code>.</li>
            </ul>
          </div>

          {/* Live responsive demo — drag the handle to watch headings scale */}
          <div className="foundation-tokens__section">
            <h3 className="foundation-tokens__section-title">Live scaling</h3>
            <p className="foundation-tokens__hint">Drag the bottom-right handle to resize the container — the heading scales fluidly between its min and max (this box is the <code>cqi</code> container).</p>
            <div className="foundation-tokens__resize-demo">
              <span
                className="jf-heading__title"
                style={{
                  fontSize: 'var(--font-size-heading-xl)',
                  lineHeight: 'var(--line-height-heading-xl)',
                  letterSpacing: 'var(--letter-spacing-heading)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)' as unknown as number,
                  color: 'var(--color-text)',
                  display: 'block',
                }}
              >
                The quick brown fox
              </span>
            </div>
          </div>

          {/* Font Families */}
          <div className="foundation-tokens__section">
            <h3 className="foundation-tokens__section-title">Font Family</h3>
            <table className="foundation-tokens__table">
              <colgroup>
                <col style={{ width: '30%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '45%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Value</th>
                  <th>Preview</th>
                </tr>
              </thead>
              <tbody>
                {fontFamilies.map((token) => {
                  const value = resolved.get(token.variable) ?? '';
                  const short = value.split(',')[0]?.replace(/['"]/g, '').trim() || value;
                  return (
                    <tr key={token.variable}>
                      <td className="foundation-tokens__table-token"><code>{token.variable}</code></td>
                      <td className="foundation-tokens__table-value">{short}</td>
                      <td>
                        <span style={{ fontFamily: `var(${token.variable})`, fontSize: 16 }}>
                          Aa Bb Cc 123
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Font Weights */}
          <div className="foundation-tokens__section">
            <h3 className="foundation-tokens__section-title">Font Weight</h3>
            <table className="foundation-tokens__table">
              <colgroup>
                <col style={{ width: '30%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '45%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Value</th>
                  <th>Preview</th>
                </tr>
              </thead>
              <tbody>
                {fontWeights.map((token) => (
                  <tr key={token.variable}>
                    <td className="foundation-tokens__table-token"><code>{token.variable}</code></td>
                    <td className="foundation-tokens__table-value">{resolved.get(token.variable) ?? ''}</td>
                    <td>
                      <span style={{ fontWeight: `var(${token.variable})` as unknown as number, fontSize: 16, fontFamily: 'var(--font-family)' }}>
                        The quick brown fox
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Type Scale */}
          {scaleCategories.map((cat) => (
            <div key={cat.title} className="foundation-tokens__section">
              <h3 className="foundation-tokens__section-title">{cat.title}</h3>
              <table className="foundation-tokens__table">
                <ScaleColGroup />
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Size</th>
                    <th>Line height</th>
                    <th>Tracking</th>
                    <th>Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.rows.map((row) => {
                    const lineHeightVar = row.variable.replace('font-size', 'line-height');
                    const previewStyle: CSSProperties = {
                      fontSize: `var(${row.variable})`,
                      lineHeight: `var(${lineHeightVar})`,
                      letterSpacing: `var(${cat.trackingVar})`,
                      fontFamily: `var(${cat.fontVar})`,
                      fontWeight: cat.bold ? ('var(--font-weight-bold)' as unknown as number) : undefined,
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    };
                    return (
                      <tr key={row.variable}>
                        <td className="foundation-tokens__table-token"><code>{row.variable}</code></td>
                        <td className="foundation-tokens__table-value">
                          <span className="foundation-tokens__size-cell">
                            {row.size}
                            <Badge fluid={row.fluid} />
                          </span>
                        </td>
                        <td className="foundation-tokens__table-value">
                          {row.lh}{row.lhRatio && <span className="foundation-tokens__lh-hint"> ×</span>}
                        </td>
                        <td className="foundation-tokens__table-value">{cat.tracking}</td>
                        <td>
                          <span style={previewStyle}>{cat.preview}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {cat.note && <p className="foundation-tokens__hint foundation-tokens__hint--note">{cat.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
