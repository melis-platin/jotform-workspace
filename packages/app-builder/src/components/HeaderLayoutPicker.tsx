import './HeaderLayoutPicker.scss'

// The header layout archetypes. 'Hero' carries the current style controls;
// the other three are placeholders whose bespoke content is added later.
export type AppHeaderLayout = 'Default' | 'Hero' | 'Cover' | 'Profile'

const OPTIONS: { value: AppHeaderLayout; label: string }[] = [
  { value: 'Default', label: 'Default' },
  { value: 'Hero', label: 'Hero' },
  { value: 'Cover', label: 'Cover' },
  { value: 'Profile', label: 'Profile' },
]

// Each option renders a tiny abstract mock of the header arrangement. All colors
// come from DS tokens (see HeaderLayoutPicker.scss) — no hardcoded values.
function LayoutArt({ value }: { value: AppHeaderLayout }) {
  switch (value) {
    // Centered title/subtitle lines above a small "button" pill, inside a chip.
    case 'Hero':
      return (
        <span className="header-layout-picker__chip header-layout-picker__chip--hero">
          <span className="header-layout-picker__hero-lines">
            <span className="header-layout-picker__line header-layout-picker__line--16" />
            <span className="header-layout-picker__line header-layout-picker__line--24" />
          </span>
          <span className="header-layout-picker__pill" />
        </span>
      )
    // Cover strip on top; an image block to the left of two text lines below.
    case 'Cover':
      return (
        <span className="header-layout-picker__stage header-layout-picker__stage--cover">
          <span className="header-layout-picker__bar header-layout-picker__bar--cover" />
          <span className="header-layout-picker__square header-layout-picker__square--cover" />
          <span className="header-layout-picker__line header-layout-picker__line--16 header-layout-picker__at--cover-l1" />
          <span className="header-layout-picker__line header-layout-picker__line--12 header-layout-picker__at--cover-l2" />
        </span>
      )
    // Cover strip with a centered round avatar overlapping it, centered text below.
    case 'Profile':
      return (
        <span className="header-layout-picker__stage header-layout-picker__stage--profile">
          <span className="header-layout-picker__bar header-layout-picker__bar--profile" />
          <span className="header-layout-picker__avatar" />
          <span className="header-layout-picker__line header-layout-picker__line--16 header-layout-picker__at--profile-l1" />
          <span className="header-layout-picker__line header-layout-picker__line--12 header-layout-picker__at--profile-l2" />
        </span>
      )
    // Left-aligned icon square above two short text lines, inside a chip.
    case 'Default':
    default:
      return (
        <span className="header-layout-picker__chip header-layout-picker__chip--default">
          <span className="header-layout-picker__square header-layout-picker__square--default" />
          <span className="header-layout-picker__line header-layout-picker__line--16 header-layout-picker__at--default-l1" />
          <span className="header-layout-picker__line header-layout-picker__line--12 header-layout-picker__at--default-l2" />
        </span>
      )
  }
}

interface HeaderLayoutPickerProps {
  value: AppHeaderLayout
  onChange: (value: AppHeaderLayout) => void
}

export function HeaderLayoutPicker({ value, onChange }: HeaderLayoutPickerProps) {
  return (
    <div className="header-layout-picker" role="radiogroup" aria-label="Header layout">
      {OPTIONS.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`header-layout-picker__option${selected ? ' header-layout-picker__option--selected' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            <span className="header-layout-picker__box">
              <LayoutArt value={opt.value} />
            </span>
            <span className="header-layout-picker__label">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
