# Skill: Jotform Design System

Bu proje **Jotform Design System** tasarım sistemini kullanır. Görsel stil için bağlayıcıdır — her görsel bu sisteme uymalıdır. Burada tanımlı olmayan renk, tipografi, boşluk veya bileşen icat etmeyin.

Kapsam: tasarım sistemi yalnızca görsel stil referansıdır. Kılavuzdaki örnek ürünler/markalar kullanıcı veya konuşma konusuyla ilgili gerçekler olarak yorumlanmamalıdır.

Sistem şu yolda bağlıdır: `_ds/jotform-design-system-0f12b26d-79e0-4346-958a-f44df53839a9/`

## Yükleme (her Design Component'te zorunlu)

Her DC, `<helmet>` içinde bundle'ı yüklemelidir (alt DC'lerde de — URL bazında de-dupe edilir):

```html
<helmet>
  <link rel="stylesheet" href="_ds/jotform-design-system-0f12b26d-79e0-4346-958a-f44df53839a9/vendor/jf-bundle.css">
  <link rel="stylesheet" href="_ds/jotform-design-system-0f12b26d-79e0-4346-958a-f44df53839a9/tokens/overrides.css">
  <link rel="stylesheet" href="_ds/jotform-design-system-0f12b26d-79e0-4346-958a-f44df53839a9/styles.css">
  <script src="_ds/jotform-design-system-0f12b26d-79e0-4346-958a-f44df53839a9/_ds_bundle.js"></script>
</helmet>
```

Bileşen kullanımı (logic class gerekmez):

```html
<x-import component-from-global-scope="JFDesignSystem.Button" hint-size="auto,40px">Label</x-import>
```

Prop'lar template attribute'larıdır (kebab → camelCase); çocuk içerik `props.children` olarak geçer. Stil değerlerini tahmin etmek yerine `var(--*)` token'larını ve sistem sınıflarını kullanın.

## Şablonlar (uygunsa şablondan başlayın)

- `AI Agent Builder` — `/projects/0f12b26d-79e0-4346-958a-f44df53839a9/templates/ai-agent-builder/` — kanal sidebar'ı, gradient nav, chatbot embed paneli
- `App Dashboard` — `/projects/0f12b26d-79e0-4346-958a-f44df53839a9/templates/app-dashboard/` — Header (Build/Settings/Publish), Tabs, Badge'li içerik grid'i
- `Form Page` — `/projects/0f12b26d-79e0-4346-958a-f44df53839a9/templates/form-page/` — Jotform alanlarıyla tek sayfalık form, validasyon durumları, submit butonu

Tam kaynak ağacı: `/projects/0f12b26d-79e0-4346-958a-f44df53839a9/`

---

# Jotform Design System — Kılavuz

## Overview

**Jotform** is an online form and app builder platform that lets users create forms, surveys, and no-code apps without writing code. The core product is the **App Builder** — a drag-and-drop interface where users compose pages from pre-built field and layout elements, configure page properties, and publish apps to the web.

This design system packages the real `@jf/design-system` React component library as a browser-ready bundle, together with the brand fonts, complete design token set, foundation cards, and interactive UI kit specimens for the App Builder product surface.

## Sources

- **Codebase**: `JF Design System/` (local mount) — the published `@jf/design-system@0.0.0` package.
  Contains 34 compiled React components, preview stories, font files, and the compiled CSS bundle.

No Figma link was provided. Component structure and token values were read directly from the codebase.

---

## Setup

```html
<!-- 1. Load the design system styles (tokens + component CSS + fonts) -->
<link rel="stylesheet" href="path/to/styles.css">

<!-- 2. Load React (required peer dependency) -->
<script src="path/to/_vendor/react.js"></script>
<script src="path/to/_vendor/react-dom.js"></script>

<!-- 3. Load the component bundle -->
<script src="path/to/_ds_bundle.js"></script>

<!-- 4. Use components -->
<script type="text/babel">
  const { Button, Badge, Icon } = window.JFDesignSystem;
</script>
```

No theme provider or wrapper is needed. **Dark mode**: set `data-theme="dark"` on any ancestor. **Radius scale**: set `data-radius="small|large|xlarge"` on any ancestor.

---

## CONTENT FUNDAMENTALS

### Voice & Tone
Jotform copy is **practical, efficient, and friendly** — never corporate or stiff. The platform is for builders of all technical levels, so the tone stays accessible without being condescending.

- **Action-first**: Labels use verbs. "Create form", "Publish app", "Add element" — not "Form Creation".
- **Second person (you/your)**: "Your forms", "Your responses", "Preview your app". The product speaks to the user, not at them.
- **Sentence case** throughout the UI: "Add new element", not "Add New Element". (Exception: product names and proper nouns.)
- **Concise**: Tooltips are 1 sentence. Error messages state what happened + what to do. No "please".
- **No emoji in UI chrome**: Emoji are reserved for user-created form content, not system UI.
- **Numbers are numeric**: Always "3 responses", never "three responses".
- **Confirmation dialogs use plain language**: "Delete form? This can't be undone." — no legalese.

### Copy Examples
- Buttons: "Save changes", "Publish", "Preview", "Add field", "Delete", "Cancel"
- Badges: "Active", "Draft", "Published", "Failed", "Pending", "In review"
- Empty states: "No responses yet. Share your form to start collecting data."
- Tooltips: "Toggle preview mode to see how your form looks to respondents."
- Errors: "Something went wrong. Try again or contact support."

---

## VISUAL FOUNDATIONS

### Color System

The palette uses **oklch** for perceptually uniform color. There are 6 palettes × 11 steps each:

| Palette | Hue | Role |
|---------|-----|------|
| **Primary** | 293 (purple/violet) | Brand, interactive, CTA |
| **Neutral** | 277–286 (cool gray) | Text, backgrounds, borders |
| **Info** | 230–242 (blue) | Informational states |
| **Success** | 149–157 (green) | Positive, constructive actions |
| **Warning** | 46–97 (amber/orange) | Caution states |
| **Error** | 17–28 (red) | Destructive, danger states |

**Primary purple** (`--primary-600`, oklch 54% .25 293) is the main brand color. The page background is `--bg-page` which resolves to `--primary-50` — a very light lavender tint that's subtly on-brand. Surfaces (cards) are white (`--neutral-0`).

**Semantic tokens** to use in layout:
- Background: `--bg-page` (page), `--bg-surface` (card/panel), `--bg-surface-hover`
- Fill: `--bg-fill-brand` (primary CTA fill), `--bg-fill-secondary` (secondary fill)
- Foreground: `--fg-primary`, `--fg-secondary`, `--fg-tertiary`, `--fg-brand`, `--fg-disabled`
- Border: `--border` (default), `--border-secondary` (stronger), `--border-brand`
- Status: `--fg-success`, `--fg-error`, `--fg-warning`, `--fg-info`

### Typography

**Two font families:**
1. `--font-family-shell: "Circular"` — used for builder chrome, navigation, buttons, labels. Circular Std is Jotform's primary brand typeface (geometric sans-serif, Lineto).
2. `--font-family: "Inter"` — used for content text, form fields, data display. Falls back to system-ui.

**Heading scale** (fluid, using clamp with `cqi`):
- `--font-size-heading-xxl`: ~2–3rem
- `--font-size-heading-xl`: ~1.875–2.75rem
- `--font-size-heading-lg`: ~1.625–2.375rem
- `--font-size-heading-md`: ~1.5–2rem
- `--font-size-heading-sm`: ~1.25–1.75rem
- `--font-size-heading-xs`: ~1.125–1.375rem

**Paragraph scale** (fixed at small sizes, fluid at larger):
- `--font-size-paragraph-lg`: ~1.125–1.25rem
- `--font-size-paragraph-md`: ~1–1.125rem
- `--font-size-paragraph-sm`: 14px (most common body size)
- `--font-size-paragraph-xs`: 12px (captions, helper text)

**Label scale** (fixed):
- `--font-size-label-lg`: 16px
- `--font-size-label-md`: 14px
- `--font-size-label-sm`: 12px
- `--font-size-label-xs`: 10px (smallest, use sparingly)

**Weights**: regular (400), medium (500), bold (600). Heading letter-spacing: `--letter-spacing-heading: -0.02em`.

### Spacing

4px base unit. Named by grid multiple:
`--space-1: 4px` · `--space-2: 8px` · `--space-3: 12px` · `--space-4: 16px` · `--space-5: 20px` · `--space-6: 24px` · `--space-8: 32px` · `--space-10: 40px` · `--space-12: 48px` · `--space-16: 64px` · `--space-20: 80px`

Gaps between sibling UI elements use `--space-2` (tight) or `--space-3` (default). Section padding uses `--space-4` to `--space-6`. Page gutters use `--space-8` or larger.

### Border Radius
`--radius-sm: 4px` · `--radius-md: 8px` · `--radius-lg: 12px` · `--radius-xl: 16px` · `--radius-xxl: 24px` · `--radius-rounded: 9999px`
Buttons default to `--radius-rounded` (pill) or `--radius-md` depending on `shape` prop. Cards/panels use `--radius-lg`. Small chips/tags use `--radius-rounded`.

### Shadows
Shadow scale is low-contrast and subtle — thin ambient shadows rather than heavy drop shadows:
- `--shadow-2xs`: 0 1px 0 — hairline separator
- `--shadow-xs`: 0 1px 2px — minimal lift (inputs, chips)
- `--shadow-sm`: 0 1–3px — card/surface lift
- `--shadow-md`, `--shadow-lg`: panel/popover shadows
- `--shadow-xl`, `--shadow-2xl`: modal/overlay shadows
- `--shadow-focus`: 4px ring in brand color + white inset — focus indicator
- `--shadow-error`: 4px ring in error color — error focus

Dark mode reuses the same token names but shadows become darker (rgba with higher alpha).

### Backgrounds & Layout
- Page background is `--bg-page` (light lavender tint from primary-50), not pure white.
- Cards and panels are `--bg-surface` (white).
- The builder layout uses fixed-width sidebars: `--sidebar-width-left: 260px`, `--sidebar-width-right: 300px`, header height `--header-height: 56px`.
- No decorative background textures, patterns, or illustrations in the builder chrome.
- Full-bleed imagery and illustrations appear in marketing contexts, not in the app.

### Animations & Transitions
- `--transition: .15s ease` — the standard transition for state changes (hover, focus, active).
- Interactions are snappy and direct; no elaborate entrance animations.
- Hover states use color shifts (darker fill / lighter surface), not opacity changes.
- Loading states use spinner animations built into Button (`loading` prop).

### Borders
- Default input border: `color-mix(in oklch, --neutral-300 70%, transparent)` — slightly transparent gray. On hover it becomes fully `--neutral-300`.
- Structural dividers: `1px solid var(--border)` — very light (`--neutral-100`).
- Brand-colored borders: `--border-brand` (primary-200) for focus/selected states.

### Cards
- Background: `--bg-surface` (white)
- Border: `1px solid var(--border)` (neutral-100 — very subtle)
- Radius: `--radius-lg` (12px) standard; `--radius-xl` for larger feature cards
- Shadow: `--shadow-sm` for floating cards; `--shadow-xs` for inline cards

### Hover / Press States
- Surface hover: `--bg-surface-hover` (neutral-50, near-white)
- Fill hover: fills darken by one step (e.g., primary-600 → primary-700)
- Ghost/transparent buttons: background reveals on hover
- No scale transforms on press in desktop UI
- Active state: `--bg-fill-active` one step darker than hover

### Dark Mode
All semantic tokens remap automatically. The primary palette lightens (so primary-600 becomes a lighter periwinkle on dark). Surfaces invert (neutral-0 becomes very dark). Shadows increase in opacity since they rely on rgba.

---

## ICONOGRAPHY

The design system ships a built-in icon library accessed via the `Icon` component. Icons are internally rendered as SVG (embedded in the bundle) and inherit `currentColor`.

### Usage
```jsx
const { Icon } = window.JFDesignSystem;
<Icon name="star-filled" size={24} />
<Icon name="angle-right" category="arrows" size={16} />
```

### Categories
Icons are namespaced by `category` prop (defaults to `"general"`):
- `general` — common UI icons (star, heart, check, gear, trash, plus, magnifying-glass, etc.)
- `arrows` — directional icons (angle-right, arrow-up, etc.)
- `communication` — chat, email, phone
- `users` — face-smile, person, group
- `finance` — briefcase, currency
- `time-date` — alarm-clock, calendar
- `media` — bolt, play, image
- `brands` — apple, google, social media logos
- `ai` — AI-related icons
- `alerts-feedback` — warning, info, error icons
- `documents` — file, folder, page
- `editor` — text formatting icons
- `forms-files` — form-specific icons
- `layout` — grid, column, row layout icons
- `products` — Jotform product icons
- `security` — lock, shield
- `technology` — code, terminal

Icons are identified by name (e.g., `"star-filled"`, `"check-sm"`, `"xmark-sm"`, `"plus"`, `"trash-filled"`, `"gear-filled"`, `"magnifying-glass"`). There is no external icon font CDN or SVG sprite — the entire set is embedded in `_ds_bundle.js`.

**No emoji are used as icons** in the design system. The Icon component covers all iconographic needs.

---

## Layout Tokens for Builder Chrome

The App Builder uses fixed layout constants:
- `--sidebar-width-left: 260px` — AddElementPanel
- `--sidebar-width-right: 300px` — PagePropertiesPanel
- `--header-height: 56px` — TopBar height

---

## File Index

```
styles.css                      Global CSS entry (import this + _ds_bundle.js)
_ds_bundle.css                  Compiled tokens + component styles (auto-generated)
_ds_bundle.js                   Compiled React component library → window.JFDesignSystem
_vendor/react.js                Bundled React 18
_vendor/react-dom.js            Bundled ReactDOM 18

tokens/
  fonts.css                     @font-face declarations for Circular Std
                                 (font files are assets/fonts/)

assets/
  fonts/                        Circular Std OTF files (Light → Black, normal + italic)

components/
  general/                      Core UI primitives
    Badge/                      Status badge — success/error/warning/info/neutral
    Button/                     Primary action — variant, colorScheme, size, icons
    Checkbox/                   Checkbox input with label
    ColorInput/                 Color picker input
    DateInput/                  Date input field
    Dialog/                     Confirmation dialog (inline)
    FieldChip/                  Chip/tag representing a form field
    FieldComposer/              Rich form field editor
    FieldMapper/                Maps source fields to destination fields
    FormField/                  Label + helper text wrapper for form inputs
    Header/                     App-level page header with tabs
    Icon/                       SVG icon from the built-in icon library
    Indicator/                  Dot/ring status indicator
    Input/                      Text input with status + adornments
    Link/                       Styled hyperlink
    Modal/                      Overlay modal (confirm/destructive/constructive)
    NumberInput/                Numeric stepper input
    RadioButton/                Radio input
    SearchInput/                Search bar input
    Segmented/                  Segmented control (button group)
    Slider/                     Range slider
    Table/                      Data table with sortable columns
    Tabs/                       Tab bar navigation
    TextArea/                   Multi-line text input
    Toggle/                     On/off toggle switch
    UrlInput/                   URL validation input
  dropdown/                     Dropdown/select components
    DropdownLanguage/           Language selector
    DropdownMenuShell/          Generic dropdown menu container
    DropdownMulti/              Multi-select dropdown
    DropdownSingle/             Single-select dropdown
  builder-chrome/               App Builder-specific chrome (not for form content)
    AddElementPanel/            Left sidebar — element/field picker
    PagePropertiesPanel/        Right sidebar — page settings
    TopBar/                     Top navigation bar with Build/Settings/Publish tabs
  table/
    TableTitle/                 Table header with title + actions

guidelines/                     Foundation specimen cards (visible in Design System tab)

ui_kits/
  app-builder/
    index.html                  Interactive App Builder prototype

templates/
  form-page/
    FormPage.dc.html            Single-page data-collection form (FormField + Input + TextArea + Button)
    ds-base.js                  Template loader (styles + React + JF bundle)
  app-dashboard/
    AppDashboard.dc.html        App shell with Header tabs, sub-nav Tabs, content grid + Badges
    ds-base.js                  Template loader

vendor/
  jf-bundle.js                  Compiled @jf/design-system React component bundle (window.JFDesignSystem)
  jf-bundle.css                 JF component CSS (imported by styles.css)
```

---

## Components Quick Reference

| Component | Group | Key Props |
|-----------|-------|-----------|
| Button | general | `variant` (filled/ghost/transparent), `colorScheme` (primary/secondary/constructive/destructive), `size` (sm/md/lg), `leftIcon`, `rightIcon`, `iconOnly`, `loading` |
| Badge | general | `status` (success/error/warning/information/neutral), `emphasis` (subtle/bold/outlined), `size`, `shape`, `icon` |
| Icon | general | `name`, `category`, `size` |
| Input | general | `size`, `status` (default/success/error/warning/readonly), `leftContent`, `rightContent` |
| FormField | general | `title`, `description`, `helpText`, `status`, `required`, `disabled` |
| Toggle | general | `size`, `label`, `description`, `error`, `loading` |
| Tabs | general | `items`, `value`, `onChange`, `size` (sm/md), `accent` (default/apps) |
| Modal | general | `open`, `title`, `intent` (primary/constructive/destructive), `confirmLabel`, `cancelLabel` |
| Dialog | general | Inline confirmation with icon + actions |
| Segmented | general | Segmented button group control |
| Table | general | Data table with column definitions |
| TopBar | builder-chrome | `activePage`, `appName`, `previewMode`, `presets`, `activePresetId` |
| AddElementPanel | builder-chrome | Element/field picker for the builder left sidebar |
| PagePropertiesPanel | builder-chrome | Page settings right sidebar |
