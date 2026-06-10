import { useEffect, useState, useCallback } from 'react';
import { resolvePrimitive, resolvePrimitiveDark } from '../utils/semanticToPrimitive';
import { generatePalette } from '../utils/colorPalette';
import type { PaletteShade as GeneratedShade } from '../utils/colorPalette';
import { generateNeutralPalette, applyNeutralToDOM } from '../utils/neutralTint';
import { ColorPicker } from './components/ColorPicker';

interface PaletteShade {
  name: string;
  variable: string;
}

const neutralShades: PaletteShade[] = [
  { name: '0', variable: '--neutral-0' },
  { name: '50', variable: '--neutral-50' },
  { name: '100', variable: '--neutral-100' },
  { name: '200', variable: '--neutral-200' },
  { name: '300', variable: '--neutral-300' },
  { name: '400', variable: '--neutral-400' },
  { name: '500', variable: '--neutral-500' },
  { name: '600', variable: '--neutral-600' },
  { name: '700', variable: '--neutral-700' },
  { name: '800', variable: '--neutral-800' },
  { name: '900', variable: '--neutral-900' },
  { name: '950', variable: '--neutral-950' },
];

const primaryShades: PaletteShade[] = [
  { name: '50', variable: '--primary-50' },
  { name: '100', variable: '--primary-100' },
  { name: '200', variable: '--primary-200' },
  { name: '300', variable: '--primary-300' },
  { name: '400', variable: '--primary-400' },
  { name: '500', variable: '--primary-500' },
  { name: '600', variable: '--primary-600' },
  { name: '700', variable: '--primary-700' },
  { name: '800', variable: '--primary-800' },
  { name: '900', variable: '--primary-900' },
  { name: '950', variable: '--primary-950' },
];

const STD_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const makeShades = (prefix: string): PaletteShade[] =>
  STD_STEPS.map((s) => ({ name: s, variable: `--${prefix}-${s}` }));

const infoShades = makeShades('info');
const successShades = makeShades('success');
const warningShades = makeShades('warning');
const errorShades = makeShades('error');

interface TokenDef {
  name: string;
  variable: string;
  usage: number;
}

interface TokenCategory {
  title: string;
  tokens: TokenDef[];
}

const semanticCategories: TokenCategory[] = [
  {
    title: 'Background / Surface',
    tokens: [
      { name: 'bg-page', variable: '--bg-page', usage: 1 },
      { name: 'bg-surface', variable: '--bg-surface', usage: 5 },
      { name: 'bg-surface-brand', variable: '--bg-surface-brand', usage: 12 },
      { name: 'bg-surface-brand-hover', variable: '--bg-surface-brand-hover', usage: 2 },
      { name: 'bg-surface-info', variable: '--bg-surface-info', usage: 1 },
      { name: 'bg-surface-info-hover', variable: '--bg-surface-info-hover', usage: 0 },
      { name: 'bg-surface-success', variable: '--bg-surface-success', usage: 0 },
      { name: 'bg-surface-success-hover', variable: '--bg-surface-success-hover', usage: 0 },
      { name: 'bg-surface-warning', variable: '--bg-surface-warning', usage: 0 },
      { name: 'bg-surface-warning-hover', variable: '--bg-surface-warning-hover', usage: 0 },
      { name: 'bg-surface-error', variable: '--bg-surface-error', usage: 0 },
      { name: 'bg-surface-error-hover', variable: '--bg-surface-error-hover', usage: 0 },
    ],
  },
  {
    title: 'Background / Fill',
    tokens: [
      { name: 'bg-fill', variable: '--bg-fill', usage: 25 },
      { name: 'bg-fill-hover', variable: '--bg-fill-hover', usage: 2 },
      { name: 'bg-fill-brand', variable: '--bg-fill-brand', usage: 37 },
      { name: 'bg-fill-brand-hover', variable: '--bg-fill-brand-hover', usage: 5 },
      { name: 'bg-fill-brand-disabled', variable: '--bg-fill-brand-disabled', usage: 2 },
      { name: 'bg-fill-info', variable: '--bg-fill-info', usage: 0 },
      { name: 'bg-fill-info-hover', variable: '--bg-fill-info-hover', usage: 0 },
      { name: 'bg-fill-info-active', variable: '--bg-fill-info-active', usage: 0 },
      { name: 'bg-fill-success', variable: '--bg-fill-success', usage: 1 },
      { name: 'bg-fill-success-hover', variable: '--bg-fill-success-hover', usage: 0 },
      { name: 'bg-fill-success-active', variable: '--bg-fill-success-active', usage: 0 },
      { name: 'bg-fill-warning', variable: '--bg-fill-warning', usage: 0 },
      { name: 'bg-fill-warning-hover', variable: '--bg-fill-warning-hover', usage: 0 },
      { name: 'bg-fill-warning-active', variable: '--bg-fill-warning-active', usage: 0 },
      { name: 'bg-fill-error', variable: '--bg-fill-error', usage: 0 },
      { name: 'bg-fill-error-hover', variable: '--bg-fill-error-hover', usage: 0 },
      { name: 'bg-fill-error-active', variable: '--bg-fill-error-active', usage: 0 },
    ],
  },
  {
    title: 'Foreground',
    tokens: [
      { name: 'fg-inverse', variable: '--fg-inverse', usage: 9 },
      { name: 'fg-primary', variable: '--fg-primary', usage: 34 },
      { name: 'fg-secondary', variable: '--fg-secondary', usage: 11 },
      { name: 'fg-disabled', variable: '--fg-disabled', usage: 12 },
      { name: 'fg-brand', variable: '--fg-brand', usage: 15 },
      { name: 'fg-link', variable: '--fg-link', usage: 0 },
      { name: 'fg-info', variable: '--fg-info', usage: 1 },
      { name: 'fg-info-hover', variable: '--fg-info-hover', usage: 0 },
      { name: 'fg-success', variable: '--fg-success', usage: 0 },
      { name: 'fg-success-hover', variable: '--fg-success-hover', usage: 0 },
      { name: 'fg-warning', variable: '--fg-warning', usage: 1 },
      { name: 'fg-warning-hover', variable: '--fg-warning-hover', usage: 0 },
      { name: 'fg-error', variable: '--fg-error', usage: 3 },
      { name: 'fg-error-hover', variable: '--fg-error-hover', usage: 0 },
    ],
  },
  {
    title: 'Border',
    tokens: [
      { name: 'border', variable: '--border', usage: 29 },
      { name: 'border-info', variable: '--border-info', usage: 29 },
      { name: 'border-success', variable: '--border-success', usage: 0 },
      { name: 'border-warning', variable: '--border-warning', usage: 0 },
      { name: 'border-error', variable: '--border-error', usage: 0 },
    ],
  },
];

const DEFAULT_COLOR = '#7D38EF';
const DEFAULT_TINT = 50;

function applyPaletteToDOM(palette: GeneratedShade[]) {
  const root = document.documentElement;
  for (const shade of palette) {
    root.style.setProperty(`--primary-${shade.key}`, shade.hex);
  }
}

const colorCanvas = document.createElement('canvas');
colorCanvas.width = 1;
colorCanvas.height = 1;
const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true })!;

function cssToHex(cssColor: string): string {
  colorCtx.clearRect(0, 0, 1, 1);
  colorCtx.fillStyle = '#000000';
  colorCtx.fillStyle = cssColor;
  colorCtx.fillRect(0, 0, 1, 1);
  const [r, g, b] = colorCtx.getImageData(0, 0, 1, 1).data;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

function resolveColor(variable: string, el: HTMLElement): string {
  const temp = document.createElement('div');
  temp.style.color = `var(${variable})`;
  el.appendChild(temp);
  const resolved = getComputedStyle(temp).color;
  el.removeChild(temp);
  return cssToHex(resolved);
}

function isLightColor(hex: string): boolean {
  const match = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return true;
  const r = parseInt(match[1], 16);
  const g = parseInt(match[2], 16);
  const b = parseInt(match[3], 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

interface ResolvedColor {
  name: string;
  variable: string;
  light: string;
  dark: string;
}

function ColorSwatch({ hex, label }: { hex: string; label?: string }) {
  return (
    <div className="foundation-colors__table-swatch-wrap">
      <div
        className="foundation-colors__table-swatch"
        style={{ background: hex }}
        data-light={isLightColor(hex) ? '' : undefined}
        data-dark={!isLightColor(hex) ? '' : undefined}
      />
      <span className="foundation-colors__table-hex">{label || hex}</span>
    </div>
  );
}

function PaletteTable({ title, shades, resolved }: { title: string; shades: PaletteShade[]; resolved: Map<string, ResolvedColor> }) {
  return (
    <div className="foundation-colors__section">
      <h3 className="foundation-colors__section-title">{title}</h3>
      <table className="foundation-colors__table">
        <colgroup>
          <col style={{ width: '20%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '22.5%' }} />
          <col style={{ width: '22.5%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Shade</th>
            <th>Token</th>
            <th></th>
            <th>Light</th>
            <th>Dark</th>
          </tr>
        </thead>
        <tbody>
          {shades.map((shade) => {
            const entry = resolved.get(shade.variable);
            if (!entry) return null;
            return (
              <tr key={shade.variable}>
                <td className="foundation-colors__table-name">{shade.name}</td>
                <td className="foundation-colors__table-token"><code>{shade.variable}</code></td>
                <td></td>
                <td><ColorSwatch hex={entry.light} /></td>
                <td><ColorSwatch hex={entry.dark} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SemanticTable({ title, tokens, resolved }: { title: string; tokens: TokenDef[]; resolved: Map<string, ResolvedColor> }) {
  return (
    <div className="foundation-colors__section">
      <h3 className="foundation-colors__section-title">{title}</h3>
      <table className="foundation-colors__table">
        <colgroup>
          <col style={{ width: '20%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '22.5%' }} />
          <col style={{ width: '22.5%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Name</th>
            <th>Token</th>
            <th>Usage</th>
            <th>Light</th>
            <th>Dark</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => {
            const entry = resolved.get(token.variable);
            if (!entry) return null;
            return (
              <tr key={token.variable}>
                <td className="foundation-colors__table-name">{token.name}</td>
                <td className="foundation-colors__table-token"><code>{token.variable}</code></td>
                <td><span className="foundation-colors__table-usage">{token.usage}</span></td>
                <td><ColorSwatch hex={entry.light} label={resolvePrimitive(token.variable)} /></td>
                <td><ColorSwatch hex={entry.dark} label={resolvePrimitiveDark(token.variable)} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function resolveAllColors(): Map<string, ResolvedColor> {
  const root = document.documentElement;
  const allSemantic: TokenDef[] = semanticCategories.flatMap((c) => c.tokens);
  const allVars = [
    ...neutralShades,
    ...primaryShades,
    ...infoShades,
    ...successShades,
    ...warningShades,
    ...errorShades,
    ...allSemantic,
  ];

  const map = new Map<string, ResolvedColor>();
  const currentTheme = root.getAttribute('data-theme');

  // Resolve light mode
  root.removeAttribute('data-theme');
  for (const v of allVars) {
    const light = resolveColor(v.variable, root);
    map.set(v.variable, { name: v.name, variable: v.variable, light, dark: '' });
  }

  // Resolve dark mode
  root.setAttribute('data-theme', 'dark');
  for (const v of allVars) {
    map.get(v.variable)!.dark = resolveColor(v.variable, root);
  }

  // Restore theme
  if (currentTheme) {
    root.setAttribute('data-theme', currentTheme);
  } else {
    root.removeAttribute('data-theme');
  }

  return map;
}

export function FoundationColors() {
  const [resolved, setResolved] = useState<Map<string, ResolvedColor>>(new Map());
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [tint, setTint] = useState(DEFAULT_TINT);

  const refreshColors = useCallback(() => {
    requestAnimationFrame(() => setResolved(resolveAllColors()));
  }, []);

  // Initial resolve
  useEffect(() => {
    setResolved(resolveAllColors());
  }, []);

  const handleColorChange = useCallback((newColor: string) => {
    setColor(newColor);
    applyPaletteToDOM(generatePalette(newColor, false));
    applyNeutralToDOM(generateNeutralPalette(newColor, tint, false));
    refreshColors();
  }, [tint, refreshColors]);

  const handleTintChange = useCallback((newTint: number) => {
    setTint(newTint);
    applyNeutralToDOM(generateNeutralPalette(color, newTint, false));
    refreshColors();
  }, [color, refreshColors]);

  return (
    <main className="main-content">
      <div className="component-view">
        <div className="component-view__toolbar">
          <div className="component-view__name">
            <h2>Colors</h2>
            <span className="component-view__tag">Foundations</span>
          </div>
        </div>
        <div className="foundation-colors">
          <div className="foundation-colors__picker">
            <ColorPicker
              color={color}
              onChange={handleColorChange}
              tint={tint}
              onTintChange={handleTintChange}
            />
          </div>
          <PaletteTable title="Neutral" shades={neutralShades} resolved={resolved} />
          <PaletteTable title="Primary" shades={primaryShades} resolved={resolved} />
          <PaletteTable title="Info" shades={infoShades} resolved={resolved} />
          <PaletteTable title="Success" shades={successShades} resolved={resolved} />
          <PaletteTable title="Warning" shades={warningShades} resolved={resolved} />
          <PaletteTable title="Error" shades={errorShades} resolved={resolved} />
          {semanticCategories.map((cat) => (
            <SemanticTable key={cat.title} title={cat.title} tokens={cat.tokens} resolved={resolved} />
          ))}
        </div>
      </div>
    </main>
  );
}
