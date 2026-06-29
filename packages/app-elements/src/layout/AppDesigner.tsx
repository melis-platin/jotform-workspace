import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Tabs as DSTabs, DropdownSingle, Segmented, FormField as DSFormField } from '@jf/design-system';
import { Icon } from '../components/Icon/Icon';
import { generatePalette, applySecondaryPaletteToDOM, resetSecondaryPalette } from '../utils/colorPalette';
import type { PaletteShade } from '../utils/colorPalette';
import { generateNeutralPalette, applyNeutralToDOM } from '../utils/neutralTint';
import { THEME_CATALOG, type AppTheme, type RadiusScale } from '../utils/themeCatalog';
import { ColorPicker } from './components/ColorPicker';
import { ColorPicker as TokenColorPicker } from '../components/ColorPicker/ColorPicker';
import { BottomSheet } from './components/BottomSheet';

// ── Constants ──────────────────────────────────────────────────────────

const DEFAULT_COLOR = '#0385C8';
const DEFAULT_FONT = 'DM Sans';
const DEFAULT_HEADING_FONT = 'DM Sans';
const DEFAULT_RADIUS = 'Large';
const DEFAULT_TINT = 30;
const DEFAULT_HARMONY = 150;

const FONT_OPTIONS = [
  'Bricolage Grotesque',
  'DM Sans',
  'Figtree',
  'Fredoka',
  'Geist',
  'Google Sans',
  'Hanken Grotesk',
  'IBM Plex Mono',
  'Instrument Sans',
  'Inter',
  'JetBrains Mono',
  'Public Sans',
  'Varela Round',
];

const HEADING_FONT_OPTIONS = [
  'Bitter',
  'DM Serif Display',
  'Fraunces',
  'Libre Baskerville',
  'Lora',
  'Merriweather',
  'Outfit',
  'Playfair Display',
  'Sora',
  'Space Grotesk',
  ...FONT_OPTIONS,
].sort();

type ThemePreset = AppTheme;

const THEME_PRESETS: ThemePreset[] = THEME_CATALOG.filter(t => t.surfaceIn !== 'copilot');

// ── Token Editor ───────────────────────────────────────────────────────

interface SemanticToken {
  variable: string;
  label: string;
}

interface TokenCategory {
  name: string;
  tokens: SemanticToken[];
}

const TOKEN_CATEGORIES: TokenCategory[] = [
  {
    name: 'Background',
    tokens: [
      { variable: '--bg-page', label: 'Main' },
      { variable: '--bg-surface', label: 'Page' },
      { variable: '--bg-fill', label: 'Card' },
    ],
  },
  {
    name: 'Brand',
    tokens: [
      { variable: '--bg-surface-brand', label: 'Icon Background' },
      { variable: '--bg-fill-brand', label: 'Button' },
      { variable: '--fg-brand', label: 'Icon & Link' },
    ],
  },
  {
    name: 'Text',
    tokens: [
      { variable: '--fg-primary', label: 'Heading' },
      { variable: '--fg-secondary', label: 'Body' },
      { variable: '--fg-tertiary', label: 'Subtle' },
    ],
  },
  {
    name: 'Border',
    tokens: [
      { variable: '--border', label: 'Border' },
      { variable: '--border-hover', label: 'Divider' },
    ],
  },
];

const appliedTokenOverrideVariables = new Set<string>();

function clearAppliedTokenOverrides() {
  const root = document.documentElement;
  for (const variable of appliedTokenOverrideVariables) {
    root.style.removeProperty(variable);
  }
  appliedTokenOverrideVariables.clear();
  root.style.removeProperty('--bg-page-gradient');
  root.style.removeProperty('--fg-disabled');
}

// ── Utility Functions ──────────────────────────────────────────────────

function loadGoogleFont(fontName: string) {
  const id = `gfont-${fontName.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

function hexToOklab(hex: string): { L: number; C: number; H: number } {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const R = toLinear(r), G = toLinear(g), B = toLinear(b);
  const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
  const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
  const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bv = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  const C = Math.sqrt(a * a + bv * bv);
  let H = Math.atan2(bv, a) * 180 / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
}

function getContrastColor(hex: string, brandHex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  if (luminance > 0.4) {
    const { H } = hexToOklab(brandHex);
    return `oklch(0.20 0.08 ${Math.round(H)})`;
  }
  return '#FFFFFF';
}

function applyPaletteToDOM(palette: PaletteShade[], lightPalette?: PaletteShade[]) {
  const root = document.documentElement;
  const map: Record<string, string> = {};
  for (const shade of palette) {
    map[shade.key] = shade.hex;
  }
  root.style.setProperty('--primary-50', map['50']);
  root.style.setProperty('--primary-100', map['100']);
  root.style.setProperty('--primary-200', map['200']);
  root.style.setProperty('--primary-300', map['300']);
  root.style.setProperty('--primary-400', map['400']);
  root.style.setProperty('--primary-500', map['500']);
  root.style.setProperty('--primary-600', map['600']);
  root.style.setProperty('--primary-700', map['700']);
  root.style.setProperty('--primary-800', map['800']);
  root.style.setProperty('--primary-900', map['900']);
  root.style.setProperty('--primary-950', map['950']);
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const btnBgShade = dark ? map['400'] : map['600'];
  root.style.setProperty('--fg-inverse', getContrastColor(btnBgShade, map['600']));

  // Light-mode-locked tokens for floating buttons (never inverted)
  if (lightPalette) {
    const lightMap: Record<string, string> = {};
    for (const shade of lightPalette) {
      lightMap[shade.key] = shade.hex;
    }
    root.style.setProperty('--btn-primary-bg', lightMap['950']);
    root.style.setProperty('--btn-primary-fg', lightMap['50']);
    root.style.setProperty('--btn-brand', lightMap['600']);
  }
}

function hexToHslHue(hex: string): number {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return Math.round(h * 360);
}

function hslHueToHex(h: number): string {
  const s = 0.75;
  const l = 0.45;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function getSecondaryColor(primaryHex: string, offsetDegrees: number): string {
  const primaryHue = hexToHslHue(primaryHex);
  const secondaryHue = (primaryHue + offsetDegrees) % 360;
  return hslHueToHex(secondaryHue);
}

function isDarkMode(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

// Track the active radius scale so the MutationObserver below can apply it
// to .app-scope elements that mount AFTER applyRadius runs (e.g. popovers,
// drawers, and other lazily-rendered chrome).
let currentRadiusScale: RadiusScale = 'Medium';
let radiusObserver: MutationObserver | null = null;

function setRadiusAttribute(el: HTMLElement) {
  if (currentRadiusScale === 'Medium') {
    el.removeAttribute('data-radius');
  } else {
    el.setAttribute('data-radius', currentRadiusScale.toLowerCase());
  }
}

function ensureRadiusObserver() {
  if (radiusObserver || typeof document === 'undefined') return;
  radiusObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.classList.contains('app-scope')) setRadiusAttribute(node);
        node.querySelectorAll<HTMLElement>('.app-scope').forEach(setRadiusAttribute);
      });
    }
  });
  radiusObserver.observe(document.body, { childList: true, subtree: true });
}

function applyRadius(scale: RadiusScale, targets: NodeListOf<HTMLElement> | null) {
  currentRadiusScale = scale;
  ensureRadiusObserver();
  if (!targets || targets.length === 0) return;
  targets.forEach(setRadiusAttribute);
}

/**
 * Apply the Default preset theme to the DOM.
 * Call this on app initialization so components are styled before AppDesigner opens.
 */
export function applyDefaultTheme() {
  clearAppliedTokenOverrides();
  document.documentElement.removeAttribute('data-theme');
  const dark = false;
  const palette = generatePalette(DEFAULT_COLOR, dark);
  const lightPalette = generatePalette(DEFAULT_COLOR, false);
  applyPaletteToDOM(palette, lightPalette);
  applyNeutralToDOM(generateNeutralPalette(DEFAULT_COLOR, DEFAULT_TINT, dark), DEFAULT_COLOR, DEFAULT_TINT);
  loadGoogleFont(DEFAULT_FONT);
  const headingFamily = DEFAULT_HEADING_FONT || DEFAULT_FONT;
  if (DEFAULT_HEADING_FONT) loadGoogleFont(DEFAULT_HEADING_FONT);
  document.documentElement.style.setProperty('--font-family', `'${DEFAULT_FONT}', -apple-system, BlinkMacSystemFont, sans-serif`);
  document.documentElement.style.setProperty('--font-family-heading', `'${headingFamily}', -apple-system, BlinkMacSystemFont, sans-serif`);
}

// ── AppDesigner persistence ─────────────────────────────────────────────

const APP_DESIGNER_STORAGE_PREFIX = 'jf-app-designer:';

export interface AppDesignerSnapshot {
  color: string;
  tint: number;
  font: string;
  headingFont: string;
  radius: RadiusScale;
  harmonyOffset: number;
  activePreset: string;
  colorMode: 'light' | 'dark';
  tokenOverrides: Record<string, string>;
}

function isLegacyDefaultSnapshot(snapshot: AppDesignerSnapshot): boolean {
  const color = snapshot.color.toUpperCase();
  const headingFont = snapshot.headingFont || snapshot.font;
  return (
    color === '#0385C8' &&
    snapshot.tint === 30 &&
    snapshot.font === 'DM Sans' &&
    headingFont === 'DM Sans' &&
    snapshot.radius === 'Large' &&
    snapshot.harmonyOffset === 150 &&
    snapshot.colorMode === 'light' &&
    (snapshot.activePreset === 'Default' || snapshot.activePreset === 'Sky') &&
    Object.keys(snapshot.tokenOverrides).length === 0
  );
}

function resolveAppDesignerSnapshot(
  stored: AppDesignerSnapshot | null,
  fallback?: AppDesignerSnapshot,
): AppDesignerSnapshot | null {
  if (stored && !(fallback && isLegacyDefaultSnapshot(stored))) return stored;
  return fallback ?? stored;
}

function appDesignerKey(namespace: string) {
  return `${APP_DESIGNER_STORAGE_PREFIX}${namespace}`;
}

export function loadAppDesignerSnapshot(namespace: string): AppDesignerSnapshot | null {
  try {
    const raw = localStorage.getItem(appDesignerKey(namespace));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppDesignerSnapshot>;
    if (
      typeof parsed.color !== 'string' ||
      typeof parsed.tint !== 'number' ||
      typeof parsed.font !== 'string' ||
      typeof parsed.headingFont !== 'string' ||
      typeof parsed.radius !== 'string' ||
      typeof parsed.harmonyOffset !== 'number' ||
      typeof parsed.activePreset !== 'string' ||
      (parsed.colorMode !== 'light' && parsed.colorMode !== 'dark') ||
      !parsed.tokenOverrides ||
      typeof parsed.tokenOverrides !== 'object'
    ) return null;
    return parsed as AppDesignerSnapshot;
  } catch {
    return null;
  }
}

export function saveAppDesignerSnapshot(namespace: string, snapshot: AppDesignerSnapshot): void {
  try {
    localStorage.setItem(appDesignerKey(namespace), JSON.stringify(snapshot));
  } catch {
    // Best-effort persistence.
  }
}

function applyThemeSnapshot(s: AppDesignerSnapshot, targetSelector = '.app-scope') {
  clearAppliedTokenOverrides();
  if (s.colorMode === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');

  const dark = s.colorMode === 'dark';
  applyPaletteToDOM(generatePalette(s.color, dark), generatePalette(s.color, false));
  applyNeutralToDOM(generateNeutralPalette(s.color, s.tint, dark), s.color, s.tint);

  loadGoogleFont(s.font);
  document.documentElement.style.setProperty('--font-family', `'${s.font}', -apple-system, BlinkMacSystemFont, sans-serif`);
  if (s.headingFont) {
    loadGoogleFont(s.headingFont);
    document.documentElement.style.setProperty('--font-family-heading', `'${s.headingFont}', -apple-system, BlinkMacSystemFont, sans-serif`);
  } else {
    document.documentElement.style.setProperty('--font-family-heading', `'${s.font}', -apple-system, BlinkMacSystemFont, sans-serif`);
  }

  applyRadius(s.radius, document.querySelectorAll<HTMLElement>(targetSelector));

  for (const [variable, color] of Object.entries(s.tokenOverrides)) {
    document.documentElement.style.setProperty(variable, color);
    appliedTokenOverrideVariables.add(variable);
  }
}

/**
 * Apply the stored AppDesigner snapshot for the given namespace, falling back
 * to the default theme when no snapshot exists.
 */
export function applyStoredOrDefaultTheme(
  namespace?: string,
  targetSelector = '.app-scope',
  fallback?: AppDesignerSnapshot,
) {
  const stored = namespace ? loadAppDesignerSnapshot(namespace) : null;
  const effectiveStored = resolveAppDesignerSnapshot(stored, fallback);
  if (effectiveStored) applyThemeSnapshot(effectiveStored, targetSelector);
  else if (fallback) applyThemeSnapshot(fallback, targetSelector);
  else applyDefaultTheme();
}

const _tokenCanvas = document.createElement('canvas');
_tokenCanvas.width = 1;
_tokenCanvas.height = 1;
const _tokenCtx = _tokenCanvas.getContext('2d', { willReadFrequently: true })!;

function resolveTokenColor(variable: string): string {
  const temp = document.createElement('div');
  temp.style.color = `var(${variable})`;
  document.documentElement.appendChild(temp);
  const resolved = getComputedStyle(temp).color;
  document.documentElement.removeChild(temp);
  _tokenCtx.clearRect(0, 0, 1, 1);
  _tokenCtx.fillStyle = '#000000';
  _tokenCtx.fillStyle = resolved;
  _tokenCtx.fillRect(0, 0, 1, 1);
  const [r, g, b] = _tokenCtx.getImageData(0, 0, 1, 1).data;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

const LightModeIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const DarkModeIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const RADIUS_OPTIONS: { scale: RadiusScale; iconName: string }[] = [
  { scale: 'Small', iconName: 'corner-radius-sm' },
  { scale: 'Medium', iconName: 'corner-radius-md' },
  { scale: 'Large', iconName: 'corner-radius-lg' },
  { scale: 'XLarge', iconName: 'corner-radius-xl' },
];

// ── Sub-components ─────────────────────────────────────────────────────

function TokenSwatch({ variable, label, color, gradient, isEditing, onEdit }: {
  variable: string;
  label: string;
  color: string;
  gradient?: string;
  isEditing: boolean;
  onEdit: (variable: string, rect: DOMRect) => void;
}) {
  return (
    <button
      className={`edit-theme-panel__row${isEditing ? ' edit-theme-panel__row--editing' : ''}`}
      onClick={(e) => onEdit(variable, e.currentTarget.getBoundingClientRect())}
      title={`${label} (${variable})`}
    >
      <span
        className="edit-theme-panel__row-color"
        style={{ background: gradient || color }}
      />
      <span className="edit-theme-panel__row-label">{label}</span>
      <span className="edit-theme-panel__row-hex">{gradient ? 'Gradient' : color}</span>
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

interface AppDesignerProps {
  onClose?: () => void;
  targetSelector?: string;
  isMobile?: boolean;
  visible?: boolean;
  renderIcon?: (name: string, size: number) => React.ReactNode;
  doneButton?: React.ReactNode;
  /** Optional storage namespace for persisting theme state across sessions. */
  namespace?: string;
  /** Optional preset theme used before the user has made real designer changes. */
  fallbackSnapshot?: AppDesignerSnapshot;
  /** Fired when the brand color changes by user action (main picker or a preset),
   *  so the host can re-sync per-element custom colors to the new global theme. */
  onThemeColorChange?: (color: string) => void;
}

export function AppDesigner({ onClose, targetSelector = '.app-scope', isMobile, renderIcon, doneButton, visible = true, namespace, fallbackSnapshot, onThemeColorChange }: AppDesignerProps) {
  const storedSnapshot = resolveAppDesignerSnapshot(
    namespace ? loadAppDesignerSnapshot(namespace) : null,
    fallbackSnapshot,
  );

  // Theme state
  const [color, setColor] = useState(storedSnapshot?.color ?? DEFAULT_COLOR);

  // Notify the host whenever the brand color changes by user action (main picker
  // or a preset) so per-element custom colors — e.g. the app header background —
  // can re-sync to the new global theme. Skip the initial mount value.
  const skipFirstColorNotify = useRef(true);
  useEffect(() => {
    if (skipFirstColorNotify.current) { skipFirstColorNotify.current = false; return; }
    onThemeColorChange?.(color);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);
  const [tint, setTint] = useState(storedSnapshot?.tint ?? DEFAULT_TINT);
  const [font, setFont] = useState(storedSnapshot?.font ?? DEFAULT_FONT);
  const [headingFont, setHeadingFont] = useState(storedSnapshot?.headingFont ?? DEFAULT_HEADING_FONT);
  const [radius, setRadius] = useState<RadiusScale>((storedSnapshot?.radius ?? DEFAULT_RADIUS) as RadiusScale);
  const [, setPalette] = useState<PaletteShade[]>(() => generatePalette(storedSnapshot?.color ?? DEFAULT_COLOR, isDarkMode()));
  const [harmonyOffset, setHarmonyOffset] = useState(storedSnapshot?.harmonyOffset ?? DEFAULT_HARMONY);
  const [secondaryEnabled] = useState(false);
  const [activePreset, setActivePreset] = useState(storedSnapshot?.activePreset ?? 'Default');
  const [colorMode, setColorMode] = useState<'light' | 'dark'>(() => {
    if (storedSnapshot) return storedSnapshot.colorMode;
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  });
  const [designerTab, setDesignerTab] = useState<'general' | 'layout'>('general');

  // Preload fonts so their previews render in the font dropdowns.
  useEffect(() => {
    FONT_OPTIONS.forEach(loadGoogleFont);
    HEADING_FONT_OPTIONS.forEach(loadGoogleFont);
  }, []);

  // Picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const pickerRef = useRef<HTMLDivElement>(null);
  const pickerPopupRef = useRef<HTMLDivElement>(null);
  const customBtnRef = useRef<HTMLButtonElement>(null);

  // Token editor state
  const [tokenEditorOpen, setTokenEditorOpen] = useState(false);
  const [tokenOverrides, setTokenOverrides] = useState<Record<string, string>>(storedSnapshot?.tokenOverrides ?? {});
  const [editingToken, setEditingToken] = useState<string | null>(null);
  const [resolvedTokenColors, setResolvedTokenColors] = useState<Record<string, string>>({});
  const [tokenPickerPos, setTokenPickerPos] = useState({ top: 0, left: 0 });
  const [tokenOpacity, setTokenOpacity] = useState(100);
  const [colorPickerMode, setColorPickerMode] = useState<'solid' | 'gradient'>('solid');
  const [gradientStart, setGradientStart] = useState(color);
  const [gradientEnd, setGradientEnd] = useState('#FFFFFF');
  const tokenPickerRef = useRef<HTMLDivElement>(null);

  // Mobile state
  const [activeTab, setActiveTab] = useState<'themes' | 'style' | 'font' | null>(null);
  const [mobileFontSheet, setMobileFontSheet] = useState<'heading' | 'body' | null>(null);
  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);
  const [mobileEditThemeOpen, setMobileEditThemeOpen] = useState(false);
  const [mobileTokenPickerOpen, setMobileTokenPickerOpen] = useState(false);
  const mobileEditThemeScrollRef = useRef(0);

  const handleTabToggle = useCallback((tab: 'themes' | 'style' | 'font') => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  }, []);

  // Reset mobile sheets when panel is hidden
  useEffect(() => {
    if (!visible && isMobile) {
      setActiveTab(null);
      setMobileFontSheet(null);
      setMobilePickerOpen(false);
      setMobileEditThemeOpen(false);
      setMobileTokenPickerOpen(false);
      setEditingToken(null);
    }
  }, [visible, isMobile]);

  const resetMobileState = useCallback(() => {
    setActiveTab(null);
    setMobileFontSheet(null);
    setMobilePickerOpen(false);
    setMobileEditThemeOpen(false);
    setMobileTokenPickerOpen(false);
    setEditingToken(null);
  }, []);

  // Persist theme state per namespace.
  useEffect(() => {
    if (!namespace) return;
    saveAppDesignerSnapshot(namespace, {
      color, tint, font, headingFont, radius,
      harmonyOffset, activePreset, colorMode, tokenOverrides,
    });
  }, [namespace, color, tint, font, headingFont, radius, harmonyOffset, activePreset, colorMode, tokenOverrides]);

  // ── Target element for radius ──

  const getTargets = useCallback(() => {
    return document.querySelectorAll<HTMLElement>(targetSelector);
  }, [targetSelector]);

  // ── Callbacks ──

  const applySecondary = useCallback((primaryColor: string, offset: number, dark: boolean) => {
    const secondaryColor = getSecondaryColor(primaryColor, offset);
    const secondaryPalette = generatePalette(secondaryColor, dark);
    applySecondaryPaletteToDOM(secondaryPalette);
  }, []);

  const applyHeadingFontToDOM = useCallback((hFont: string, bodyFont: string) => {
    if (hFont) {
      loadGoogleFont(hFont);
      document.documentElement.style.setProperty('--font-family-heading', `'${hFont}', -apple-system, BlinkMacSystemFont, sans-serif`);
    } else {
      document.documentElement.style.setProperty('--font-family-heading', `'${bodyFont}', -apple-system, BlinkMacSystemFont, sans-serif`);
    }
  }, []);

  const applyPreset = useCallback((preset: ThemePreset) => {
    setActivePreset(preset.name);
    for (const cat of TOKEN_CATEGORIES) {
      for (const tok of cat.tokens) {
        document.documentElement.style.removeProperty(tok.variable);
      }
    }
    document.documentElement.style.removeProperty('--fg-disabled');
    document.documentElement.style.removeProperty('--bg-page-gradient');
    setColorPickerMode('solid');
    setTokenOverrides({});
    setEditingToken(null);
    setTokenEditorOpen(false);
    setColor(preset.color);
    const newPalette = generatePalette(preset.color, preset.mode === 'dark');
    setPalette(newPalette);
    applyPaletteToDOM(newPalette, generatePalette(preset.color, false));
    setHarmonyOffset(preset.harmonyOffset);
    if (secondaryEnabled) {
      applySecondary(preset.color, preset.harmonyOffset, preset.mode === 'dark');
    }
    setTint(preset.tint);
    applyNeutralToDOM(generateNeutralPalette(preset.color, preset.tint, preset.mode === 'dark'), preset.color, preset.tint);
    setFont(preset.font);
    loadGoogleFont(preset.font);
    document.documentElement.style.setProperty('--font-family', `'${preset.font}', -apple-system, BlinkMacSystemFont, sans-serif`);
    setHeadingFont(preset.headingFont);
    applyHeadingFontToDOM(preset.headingFont, preset.font);
    setRadius(preset.radius);
    applyRadius(preset.radius, getTargets());
    setColorMode(preset.mode);
    if (preset.mode === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('jf-lib-theme', preset.mode);
  }, [secondaryEnabled, applySecondary, applyHeadingFontToDOM, getTargets]);

  const handleColorChange = useCallback((newColor: string) => {
    setColor(newColor);
    const newPalette = generatePalette(newColor, isDarkMode());
    setPalette(newPalette);
    applyPaletteToDOM(newPalette, generatePalette(newColor, false));
    if (secondaryEnabled) {
      applySecondary(newColor, harmonyOffset, isDarkMode());
    }
    applyNeutralToDOM(generateNeutralPalette(newColor, tint, isDarkMode()), newColor, tint);
  }, [tint, harmonyOffset, secondaryEnabled, applySecondary]);

  const handleGradientChange = useCallback((start: string, end: string) => {
    setGradientStart(start);
    setGradientEnd(end);
    document.documentElement.style.setProperty('--bg-page-gradient', `linear-gradient(to bottom, ${start}, ${end})`);
  }, []);

  const handleTintChange = useCallback((newTint: number) => {
    setTint(newTint);
    const neutralPalette = generateNeutralPalette(color, newTint, isDarkMode());
    applyNeutralToDOM(neutralPalette, color, newTint);
  }, [color]);

  const handleFontChange = useCallback((newFont: string) => {
    setFont(newFont);
    loadGoogleFont(newFont);
    document.documentElement.style.setProperty('--font-family', `'${newFont}', -apple-system, BlinkMacSystemFont, sans-serif`);
    setHeadingFont((prev) => {
      if (!prev) {
        document.documentElement.style.setProperty('--font-family-heading', `'${newFont}', -apple-system, BlinkMacSystemFont, sans-serif`);
      }
      return prev;
    });
  }, []);

  const handleHeadingFontChange = useCallback((newFont: string) => {
    setHeadingFont(newFont);
    setFont((currentBody) => {
      applyHeadingFontToDOM(newFont, currentBody);
      return currentBody;
    });
  }, [applyHeadingFontToDOM]);

  const handleRadiusChange = useCallback((scale: RadiusScale) => {
    setRadius(scale);
    applyRadius(scale, getTargets());
  }, [getTargets]);

  const handleColorModeChange = useCallback((mode: 'light' | 'dark') => {
    setColorMode(mode);
    if (mode === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('jf-lib-theme', mode);
  }, []);

  // ── Token editor callbacks ──

  const resolveAllTokens = useCallback(() => {
    const colors: Record<string, string> = {};
    for (const category of TOKEN_CATEGORIES) {
      for (const token of category.tokens) {
        colors[token.variable] = resolveTokenColor(token.variable);
      }
    }
    setResolvedTokenColors(colors);
  }, []);

  const handleTokenColorChange = useCallback((variable: string, newColor: string) => {
    document.documentElement.style.setProperty(variable, newColor);
    appliedTokenOverrideVariables.add(variable);
    setTokenOverrides((prev) => ({ ...prev, [variable]: newColor }));
    setResolvedTokenColors((prev) => ({ ...prev, [variable]: newColor }));
    if (variable === '--bg-page') {
      document.documentElement.style.removeProperty('--bg-page-gradient');
    }
    if (variable === '--fg-tertiary') {
      document.documentElement.style.setProperty('--fg-disabled', newColor);
    }
    if (variable === '--bg-fill-brand') {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const newPalette = generatePalette(newColor, isDark);
      applyPaletteToDOM(newPalette, generatePalette(newColor, false));
      document.documentElement.style.setProperty('--fg-inverse', getContrastColor(newColor, newColor));
      setTokenOverrides((prev) => {
        for (const [v, c] of Object.entries(prev)) {
          if (v !== variable) {
            document.documentElement.style.setProperty(v, c);
          }
        }
        return prev;
      });
    }
  }, []);

  const handleResetTokenOverrides = useCallback(() => {
    for (const variable of Object.keys(tokenOverrides)) {
      document.documentElement.style.removeProperty(variable);
      appliedTokenOverrideVariables.delete(variable);
    }
    document.documentElement.style.removeProperty('--fg-disabled');
    setTokenOverrides({});
    setEditingToken(null);
    setTimeout(() => resolveAllTokens(), 50);
  }, [tokenOverrides, resolveAllTokens]);

  // ── Effects ──

  // Apply palette + neutrals + secondary on changes and theme toggle
  useEffect(() => {
    const lightPalette = generatePalette(color, false);
    const palette = generatePalette(color, isDarkMode());
    applyPaletteToDOM(palette, lightPalette);
    if (secondaryEnabled) {
      applySecondary(color, harmonyOffset, isDarkMode());
    } else {
      resetSecondaryPalette();
    }
    applyNeutralToDOM(generateNeutralPalette(color, tint, isDarkMode()), color, tint);

    const observer = new MutationObserver(() => {
      applyPaletteToDOM(generatePalette(color, isDarkMode()), lightPalette);
      if (secondaryEnabled) {
        applySecondary(color, harmonyOffset, isDarkMode());
      }
      applyNeutralToDOM(generateNeutralPalette(color, tint, isDarkMode()), color, tint);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [color, tint, harmonyOffset, secondaryEnabled, applySecondary]);

  // No cleanup on unmount — theme changes persist after closing the panel

  // Resolve tokens when editor opens or theme changes
  useEffect(() => {
    if (tokenEditorOpen) {
      resolveAllTokens();
    }
  }, [tokenEditorOpen, colorMode, color, tint, resolveAllTokens]);

  // Re-resolve on data-theme attribute change
  useEffect(() => {
    if (!tokenEditorOpen) return;
    const observer = new MutationObserver(() => resolveAllTokens());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [tokenEditorOpen, resolveAllTokens]);

  // Reposition token picker if it overflows viewport
  useEffect(() => {
    if (editingToken && tokenPickerRef.current) {
      requestAnimationFrame(() => {
        const el = tokenPickerRef.current;
        if (!el) return;
        const pickerRect = el.getBoundingClientRect();
        if (pickerRect.bottom > window.innerHeight) {
          const swatchTop = tokenPickerPos.top - 8;
          const newTop = swatchTop - pickerRect.height - 8;
          el.style.top = `${Math.max(8, newTop)}px`;
        }
      });
    }
  }, [editingToken, tokenPickerPos]);

  // Close token picker on outside click
  useEffect(() => {
    if (!editingToken) return;
    const handleClick = (e: MouseEvent) => {
      if (tokenPickerRef.current && !tokenPickerRef.current.contains(e.target as Node)) {
        setEditingToken(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [editingToken]);

  // Close color picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        pickerRef.current && !pickerRef.current.contains(target) &&
        pickerPopupRef.current && !pickerPopupRef.current.contains(target)
      ) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [pickerOpen]);

  // ── Render ──

  const editThemePanel = (
    <div className="edit-theme-panel">
      <div className="edit-theme-panel__body">
        {TOKEN_CATEGORIES.map((category) => (
          <div key={category.name} className="edit-theme-panel__category">
            <h4 className="edit-theme-panel__category-title">{category.name}</h4>
            <div className="edit-theme-panel__tokens">
              {category.tokens.map((token) => {
                const currentColor = tokenOverrides[token.variable] || resolvedTokenColors[token.variable] || '#000000';
                return (
                  <TokenSwatch
                    key={token.variable}
                    variable={token.variable}
                    label={token.label}
                    color={currentColor}
                    gradient={token.variable === '--bg-page' && colorPickerMode === 'gradient' ? `linear-gradient(to bottom, ${gradientStart}, ${gradientEnd})` : undefined}
                    isEditing={editingToken === token.variable}
                    onEdit={(v, rect) => {
                      const opening = editingToken !== v;
                      setEditingToken(opening ? v : null);
                      if (opening) {
                        setPickerOpen(false);
                        setTokenPickerPos({ top: rect.bottom + 8, left: rect.left });
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {Object.keys(tokenOverrides).length > 0 && (
        <div className="edit-theme-panel__reset-wrapper">
          <button className="edit-theme-panel__reset-btn" onClick={handleResetTokenOverrides}>
            <Icon name="RotateCcw" size={14} />
            <span>Reset All Overrides</span>
          </button>
        </div>
      )}
      {editingToken && createPortal(
        <div className="color-theme-grid__picker-popup" ref={tokenPickerRef} data-theme="dark" style={{ top: tokenPickerPos.top, left: tokenPickerPos.left }}>
          {editingToken === '--bg-page' ? (
            <ColorPicker
              color={tokenOverrides[editingToken] || resolvedTokenColors[editingToken] || '#000000'}
              onChange={(newColor) => handleTokenColorChange(editingToken, newColor)}
              tint={tint}
              onTintChange={handleTintChange}
              hideTint
              opacity={tokenOpacity}
              onOpacityChange={setTokenOpacity}
              showTabs
              mode={colorPickerMode}
              onModeChange={setColorPickerMode}
              gradientStart={gradientStart}
              gradientEnd={gradientEnd}
              onGradientChange={handleGradientChange}
            />
          ) : (
            <TokenColorPicker
              color={tokenOverrides[editingToken] || resolvedTokenColors[editingToken] || '#000000'}
              onChange={(newColor) => handleTokenColorChange(editingToken, newColor)}
              tint={tint}
              onTintChange={handleTintChange}
              mode="Opacity"
              opacity={tokenOpacity}
              onOpacityChange={setTokenOpacity}
            />
          )}
        </div>,
        document.body
      )}
    </div>
  );

  // ── Mobile Render ──

  const sheetCloseButton = (onSheetClose: () => void) => (
    <button className="sidebar-panel__close" onClick={onSheetClose}>
      <Icon name="X" size={20} />
    </button>
  );

  if (isMobile) {
    return (
      <>
        {/* Top Bar */}
        <div className="design-top-bar" data-theme="dark">
          <div className="design-top-bar__left">
            <span className="design-top-bar__title">App Designer</span>
          </div>
          <span onClick={resetMobileState}>{doneButton}</span>
        </div>

        {/* Bottom Tab Bar — hidden when a sheet is open */}
        <div className={`design-bottom-bar${activeTab ? ' design-bottom-bar--sheet-open' : ''}`} data-theme="dark">
          <button
            className={`design-bottom-bar__tab${activeTab === 'themes' ? ' active' : ''}`}
            onClick={() => handleTabToggle('themes')}
          >
            {renderIcon?.('palette-filled', 20)}
            <span>Themes</span>
          </button>
          <button
            className={`design-bottom-bar__tab${activeTab === 'style' ? ' active' : ''}`}
            onClick={() => handleTabToggle('style')}
          >
            {renderIcon?.('contrast-filled', 20)}
            <span>Style</span>
          </button>
          <button
            className={`design-bottom-bar__tab${activeTab === 'font' ? ' active' : ''}`}
            onClick={() => handleTabToggle('font')}
          >
            {renderIcon?.('type', 20)}
            <span>Font</span>
          </button>
        </div>

        {/* Themes BottomSheet */}
        <BottomSheet open={activeTab === 'themes'} onClose={() => setActiveTab(null)} title="Themes" noOverlay dark renderCloseButton={sheetCloseButton}>
          <div className="themes-sheet-content v2-sheet">
            <div className="themes-sheet-content__section">
              <div className="v2-scroll-wrapper" ref={(el) => {
                if (!el) return;
                const scrollEl = el.querySelector('.v2-preset-grid--scroll');
                if (!scrollEl) return;
                const check = () => {
                  const atEnd = scrollEl.scrollLeft + scrollEl.clientWidth >= scrollEl.scrollWidth - 5;
                  el.classList.toggle('scrolled-end', atEnd);
                };
                scrollEl.addEventListener('scroll', check, { passive: true });
                check();
              }}>
              <div className="v2-preset-grid v2-preset-grid--scroll">
                <div className="v2-preset-grid__item">
                  <button
                    className={`color-theme-grid__custom${activePreset === '' ? ' active customized' : ''}`}
                    style={activePreset === '' ? { background: color } : undefined}
                    onClick={() => { setActivePreset(''); setMobilePickerOpen(true); }}
                  >
                    <div className="color-theme-grid__custom-inner">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </button>
                  <span className={`v2-preset-grid__label${activePreset === '' ? ' v2-preset-grid__label--active' : ''}`}>Custom</span>
                </div>
                {THEME_PRESETS.map((preset) => {
                  const isActive = activePreset === preset.name;
                  return (
                    <div key={preset.name} className="v2-preset-grid__item">
                      <button
                        className={`color-theme-grid__item${isActive ? ' active' : ''}`}
                        onClick={() => { applyPreset(preset); }}
                        title={preset.name}
                      >
                        <div className="color-theme-grid__outer" style={{ background: `linear-gradient(145deg, color-mix(in srgb, ${preset.color}, #fff 20%) 0%, ${preset.color} 50%, color-mix(in srgb, ${preset.color}, #000 25%) 100%)` }} />
                      </button>
                      <span className={`v2-preset-grid__label${isActive ? ' v2-preset-grid__label--active' : ''}`}>{preset.shortName || preset.name}</span>
                    </div>
                  );
                })}
              </div>
              </div>
              <button className="v2-edit-theme-btn" onClick={() => {
                setActivePreset('');
                setMobileEditThemeOpen(true);
                resolveAllTokens();
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M3.333 4.167c0-.46.373-.834.834-.834H10c.46 0 .833-.373.833-.833S10.46 1.667 10 1.667H4.167A2.5 2.5 0 001.667 4.167v11.666a2.5 2.5 0 002.5 2.5h11.666a2.5 2.5 0 002.5-2.5V10c0-.46-.373-.833-.833-.833s-.833.373-.833.833v5.833c0 .461-.373.834-.834.834H4.167a.833.833 0 01-.834-.834V4.167zM9.033 7.642a1.667 1.667 0 01.507-1.17l4.536-4.536a2.083 2.083 0 012.926 0l.724.725a2.083 2.083 0 010 2.926l-4.536 4.536c-.232.232-.517.406-.83.506l-1.927.62a1.667 1.667 0 01-2.02-2.02l.62-1.928zm1.685.35a.833.833 0 00-.098.16l-.584 1.815 1.815-.584a.833.833 0 00.161-.098l2.76-2.76-1.294-1.294-2.76 2.76zm5.83-3.243l-.598.597-1.293-1.293.597-.598a.417.417 0 01.57 0l.724.725a.417.417 0 010 .569z"/></svg>
                <span>Edit Theme</span>
              </button>
            </div>
          </div>
        </BottomSheet>

        {/* Style BottomSheet */}
        <BottomSheet open={activeTab === 'style'} onClose={() => setActiveTab(null)} title="Style" noOverlay dark renderCloseButton={sheetCloseButton}>
          <div className="themes-sheet-content v2-sheet">
            <div className="themes-sheet-content__section">
              <DSFormField title="Color Mode" size="md" showDescription={false} showHelpText={false}>
                <Segmented
                  variant="iconText"
                  value={colorMode}
                  onChange={(v) => handleColorModeChange(v as 'light' | 'dark')}
                  items={[
                    { value: 'light', label: 'Light', iconContent: LightModeIcon },
                    { value: 'dark', label: 'Dark', iconContent: DarkModeIcon },
                  ]}
                />
              </DSFormField>
            </div>
            <div className="themes-sheet-content__section">
              <DSFormField title="Corner Style" size="md" showDescription={false} showHelpText={false}>
                <Segmented
                  variant="icon"
                  value={radius}
                  onChange={(v) => handleRadiusChange(v as RadiusScale)}
                  items={RADIUS_OPTIONS.map(({ scale, iconName }) => ({
                    value: scale,
                    ariaLabel: scale,
                    icon: iconName,
                    iconCategory: 'layout',
                  }))}
                />
              </DSFormField>
            </div>
          </div>
        </BottomSheet>

        {/* Font BottomSheet */}
        <BottomSheet open={activeTab === 'font' && !mobileFontSheet} onClose={() => setActiveTab(null)} title="Font" noOverlay dark renderCloseButton={sheetCloseButton}>
          <div className="themes-sheet-content v2-sheet">
            <div className="themes-sheet-content__section">
              <DSFormField title="Heading Font" size="md" showDescription={false} showHelpText={false}>
                <button className="themes-sheet-content__font-trigger" onClick={() => setMobileFontSheet('heading')}>
                  <span className="font-preview" style={{ fontFamily: `'${headingFont || font}', sans-serif` }}>{headingFont || font}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </DSFormField>
            </div>
            <div className="themes-sheet-content__section">
              <DSFormField title="Body Font" size="md" showDescription={false} showHelpText={false}>
                <button className="themes-sheet-content__font-trigger" onClick={() => setMobileFontSheet('body')}>
                  <span className="font-preview" style={{ fontFamily: `'${font}', sans-serif` }}>{font}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </DSFormField>
            </div>
          </div>
        </BottomSheet>

        {/* Heading Font List */}
        <BottomSheet open={mobileFontSheet === 'heading'} onClose={() => setMobileFontSheet(null)} title="Heading Font" noOverlay dark renderCloseButton={sheetCloseButton}>
          <div className="themes-sheet-content themes-sheet-content--font-list themes-sheet-content--font-grid v2-sheet">
            {HEADING_FONT_OPTIONS.map((f) => {
              const isActive = f === (headingFont || font);
              loadGoogleFont(f);
              return (
                <button
                  key={f}
                  className={`themes-sheet-content__font-item${isActive ? ' active' : ''}`}
                  onClick={() => handleHeadingFontChange(f)}
                >
                  <span className="font-preview" style={{ fontFamily: `'${f}', sans-serif`, color: '#e8e9ed' }}>{f}</span>
                  {isActive && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#0066C3', flexShrink: 0 }}><path d="M20 6 9 17l-5-5"/></svg>
                  )}
                </button>
              );
            })}
          </div>
        </BottomSheet>

        {/* Body Font List */}
        <BottomSheet open={mobileFontSheet === 'body'} onClose={() => setMobileFontSheet(null)} title="Body Font" noOverlay dark renderCloseButton={sheetCloseButton}>
          <div className="themes-sheet-content themes-sheet-content--font-list themes-sheet-content--font-grid v2-sheet">
            {FONT_OPTIONS.map((f) => {
              const isActive = f === font;
              loadGoogleFont(f);
              return (
                <button
                  key={f}
                  className={`themes-sheet-content__font-item${isActive ? ' active' : ''}`}
                  onClick={() => handleFontChange(f)}
                >
                  <span className="font-preview" style={{ fontFamily: `'${f}', sans-serif`, color: '#e8e9ed' }}>{f}</span>
                  {isActive && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#0066C3', flexShrink: 0 }}><path d="M20 6 9 17l-5-5"/></svg>
                  )}
                </button>
              );
            })}
          </div>
        </BottomSheet>

        {/* Custom Color Picker */}
        <BottomSheet open={mobilePickerOpen} onClose={() => setMobilePickerOpen(false)} title="Custom Color" noOverlay dark renderCloseButton={sheetCloseButton}>
          <div className="themes-sheet-content themes-sheet-content--picker v2-sheet">
            <ColorPicker color={color} onChange={handleColorChange} tint={tint} onTintChange={handleTintChange} />
          </div>
        </BottomSheet>

        {/* Edit Theme */}
        <BottomSheet open={mobileEditThemeOpen} onClose={() => { setMobileEditThemeOpen(false); setEditingToken(null); }} title="Edit Theme" noOverlay dark renderCloseButton={sheetCloseButton}>
          <div className="themes-sheet-content v2-sheet v2-sheet--edit-theme" style={{ padding: 0 }} ref={(el) => {
            if (el && mobileEditThemeScrollRef.current) {
              const body = el.closest('.bottom-sheet')?.querySelector('.bottom-sheet__body');
              if (body) requestAnimationFrame(() => { body.scrollTop = mobileEditThemeScrollRef.current; });
            }
          }}>
            <div className="edit-theme-panel__body" style={{ padding: 0 }}>
              {TOKEN_CATEGORIES.map((category) => (
                <div key={category.name} className="edit-theme-panel__category">
                  <h4 className="edit-theme-panel__category-title">{category.name}</h4>
                  <div className="edit-theme-panel__tokens">
                    {category.tokens.map((token) => {
                      const currentColor = tokenOverrides[token.variable] || resolvedTokenColors[token.variable] || '#000000';
                      return (
                        <TokenSwatch
                          key={token.variable}
                          variable={token.variable}
                          label={token.label}
                          color={currentColor}
                          isEditing={editingToken === token.variable}
                          onEdit={(v) => {
                            setEditingToken(editingToken === v ? null : v);
                            if (editingToken !== v) {
                              const body = document.querySelector('.v2-sheet--edit-theme')?.closest('.bottom-sheet')?.querySelector('.bottom-sheet__body');
                              if (body) mobileEditThemeScrollRef.current = body.scrollTop;
                              setMobileEditThemeOpen(false);
                              setMobileTokenPickerOpen(true);
                            }
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              {Object.keys(tokenOverrides).length > 0 && (
                <div className="edit-theme-panel__reset-wrapper">
                  <button className="edit-theme-panel__reset-btn" onClick={handleResetTokenOverrides}>
                    <Icon name="RotateCcw" size={14} />
                    <span>Reset All Overrides</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </BottomSheet>

        {/* Token Color Picker */}
        <BottomSheet
          open={mobileTokenPickerOpen && !!editingToken}
          onClose={() => { setMobileTokenPickerOpen(false); setEditingToken(null); setMobileEditThemeOpen(true); }}
          title={TOKEN_CATEGORIES.flatMap((c) => c.tokens).find((t) => t.variable === editingToken)?.label || 'Color'}
          noOverlay
          dark
        >
          <div className="themes-sheet-content themes-sheet-content--picker v2-sheet">
            {editingToken && (
              <ColorPicker
                color={tokenOverrides[editingToken] || resolvedTokenColors[editingToken] || '#000000'}
                onChange={(newColor) => handleTokenColorChange(editingToken, newColor)}
                tint={tint}
                onTintChange={handleTintChange}
              />
            )}
          </div>
        </BottomSheet>
      </>
    );
  }

  // ── Desktop Render ──

  return (
    <>
      {/* Header */}
      <div className="sidebar-panel__header">
        <div className="sidebar-panel__header-left">
          {tokenEditorOpen && (
            <button className="sidebar-panel__back" onClick={() => { setTokenEditorOpen(false); setEditingToken(null); }}>
              <Icon name="ArrowLeft" size={18} />
            </button>
          )}
          <span className="sidebar-panel__title">{tokenEditorOpen ? 'Edit Theme' : 'App Designer'}</span>
        </div>
        {onClose && (
          <button className="sidebar-panel__close" onClick={onClose}>
            <Icon name="X" size={20} />
          </button>
        )}
      </div>

      {/* Sliding content wrapper */}
      <div className={`sidebar-panel__slider${tokenEditorOpen ? ' sidebar-panel__slider--editor' : ''}`}>

      {/* Slide 1: Designer */}
      <div className="sidebar-panel__slide">
      {/* Tab Bar */}
      <div className="sidebar-panel__tabs" data-theme="dark">
        <DSTabs
          accent="apps"
          value={designerTab}
          onChange={(v) => setDesignerTab(v as 'general' | 'layout')}
          items={[
            { value: 'general', label: 'General' },
            { value: 'layout', label: 'Layout' },
          ]}
        />
      </div>
      {/* Color Themes */}
      <div className="v2-section v2-section--color-themes">
        <h3 className="v2-section__title">Themes</h3>
        <div className="v2-preset-grid">
          {THEME_PRESETS.map((preset) => {
            const isActive = activePreset === preset.name;
            loadGoogleFont(preset.headingFont || preset.font);
            return (
              <div key={preset.name} className="v2-preset-grid__item">
                <button
                  className={`color-theme-grid__item${isActive ? ' active' : ''}`}
                  onClick={() => { applyPreset(preset); setPickerOpen(false); }}
                  title={preset.name}
                >
                  <div className="color-theme-grid__outer" style={{ background: `linear-gradient(145deg, color-mix(in srgb, ${preset.color}, #fff 20%) 0%, ${preset.color} 50%, color-mix(in srgb, ${preset.color}, #000 25%) 100%)` }} />
                </button>
                <span className={`v2-preset-grid__label${isActive ? ' v2-preset-grid__label--active' : ''}`}>{preset.shortName || preset.name}</span>
              </div>
            );
          })}
          {/* Custom color button */}
          <div className="v2-preset-grid__item">
            <div className="color-theme-grid__custom-wrapper" ref={pickerRef}>
              <button
                ref={customBtnRef}
                className={`color-theme-grid__custom${activePreset === '' ? ' active customized' : ''}`}
                style={activePreset === '' ? { background: color } : undefined}
                onClick={() => {
                  if (activePreset !== '') setActivePreset('');
                  if (!pickerOpen && customBtnRef.current) {
                    const rect = customBtnRef.current.getBoundingClientRect();
                    setPickerPos({ top: rect.bottom + 8, left: rect.right - 272 });
                  }
                  setPickerOpen(!pickerOpen);
                }}
                title="Custom color"
              >
                <div className="color-theme-grid__custom-inner">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </button>
              {pickerOpen && createPortal(
                <div className="color-theme-grid__picker-popup" ref={pickerPopupRef} data-theme="dark" style={{ top: pickerPos.top, left: pickerPos.left }}>
                  <ColorPicker color={color} onChange={handleColorChange} tint={tint} onTintChange={handleTintChange} />
                </div>,
                document.body
              )}
            </div>
            <span className={`v2-preset-grid__label${activePreset === '' ? ' v2-preset-grid__label--active' : ''}`}>Custom</span>
          </div>
        </div>
        <button className="v2-edit-theme-btn" onClick={() => {
          if (activePreset !== '') setActivePreset('');
          setTokenEditorOpen(true);
          setPickerOpen(false);
          resolveAllTokens();
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M3.333 4.167c0-.46.373-.834.834-.834H10c.46 0 .833-.373.833-.833S10.46 1.667 10 1.667H4.167A2.5 2.5 0 001.667 4.167v11.666a2.5 2.5 0 002.5 2.5h11.666a2.5 2.5 0 002.5-2.5V10c0-.46-.373-.833-.833-.833s-.833.373-.833.833v5.833c0 .461-.373.834-.834.834H4.167a.833.833 0 01-.834-.834V4.167zM9.033 7.642a1.667 1.667 0 01.507-1.17l4.536-4.536a2.083 2.083 0 012.926 0l.724.725a2.083 2.083 0 010 2.926l-4.536 4.536c-.232.232-.517.406-.83.506l-1.927.62a1.667 1.667 0 01-2.02-2.02l.62-1.928zm1.685.35a.833.833 0 00-.098.16l-.584 1.815 1.815-.584a.833.833 0 00.161-.098l2.76-2.76-1.294-1.294-2.76 2.76zm5.83-3.243l-.598.597-1.293-1.293.597-.598a.417.417 0 01.57 0l.724.725a.417.417 0 010 .569z"/></svg>
          <span>Edit Theme</span>
        </button>
      </div>

      {/* Color Mode */}
      <div className="v2-section v2-section--color-mode">
        <DSFormField title="Color Mode" size="md" showDescription={false} showHelpText={false}>
          <Segmented
            variant="iconText"
            value={colorMode}
            onChange={(v) => handleColorModeChange(v as 'light' | 'dark')}
            items={[
              { value: 'light', label: 'Light', iconContent: LightModeIcon },
              { value: 'dark', label: 'Dark', iconContent: DarkModeIcon },
            ]}
          />
        </DSFormField>
      </div>

      {/* Corners */}
      <div className="v2-section v2-section--corners">
        <DSFormField title="Corner Style" size="md" showDescription={false} showHelpText={false}>
          <Segmented
            variant="icon"
            value={radius}
            onChange={(v) => handleRadiusChange(v as RadiusScale)}
            items={RADIUS_OPTIONS.map(({ scale, iconName }) => ({
              value: scale,
              ariaLabel: scale,
              icon: iconName,
              iconCategory: 'layout',
            }))}
          />
        </DSFormField>
      </div>

      {/* Heading Font */}
      <div className="v2-section v2-section--heading-font">
        <DSFormField title="Heading Font" size="md" showDescription={false} showHelpText={false}>
          <DropdownSingle
            showLeadingIcon={false}
            value={headingFont || font}
            onChange={handleHeadingFontChange}
            options={HEADING_FONT_OPTIONS.map((f) => ({
              value: f,
              label: f,
              labelStyle: { fontFamily: `'${f}', sans-serif` },
            }))}
          />
        </DSFormField>
      </div>

      {/* Body Font */}
      <div className="v2-section v2-section--body-font">
        <DSFormField title="Body Font" size="md" showDescription={false} showHelpText={false}>
          <DropdownSingle
            showLeadingIcon={false}
            value={font}
            onChange={handleFontChange}
            options={FONT_OPTIONS.map((f) => ({
              value: f,
              label: f,
              labelStyle: { fontFamily: `'${f}', sans-serif` },
            }))}
          />
        </DSFormField>
      </div>

      </div>{/* end Slide 1 */}

      {/* Slide 2: Edit Theme */}
      <div className="sidebar-panel__slide sidebar-panel__slide--editor">
        {editThemePanel}
      </div>

      </div>{/* end slider */}
    </>
  );
}
