/**
 * Maps semantic CSS variable names to their primitive token names.
 * Based on the :root definitions in app.scss.
 */
const semanticToPrimitiveMap: Record<string, string> = {
  // Background / Surface
  '--bg-page': 'neutral-50',
  '--bg-surface': 'neutral-0',
  '--bg-surface-hover': 'neutral-50',
  '--bg-surface-active': 'neutral-100',
  '--bg-surface-disabled': 'neutral-50',
  '--bg-surface-brand': 'primary-100',
  '--bg-surface-brand-hover': 'primary-200',

  // Background / Fill
  '--bg-fill': 'neutral-0',
  '--bg-fill-hover': 'neutral-50',
  '--bg-fill-active': 'neutral-100',
  '--bg-fill-selected': 'neutral-200',
  '--bg-fill-disabled': 'neutral-50',
  '--bg-fill-brand': 'primary-600',
  '--bg-fill-brand-hover': 'primary-700',
  '--bg-fill-brand-active': 'primary-700',
  '--bg-fill-brand-disabled': 'primary-200',
  '--bg-fill-secondary': 'neutral-100',
  '--bg-fill-secondary-hover': 'neutral-200',

  // Foreground
  '--fg-inverse': 'neutral-0',
  '--fg-primary': 'neutral-900',
  '--fg-secondary': 'neutral-600',
  '--fg-tertiary': 'neutral-400',
  '--fg-disabled': 'neutral-300',
  '--fg-brand': 'primary-600',
  '--fg-brand-hover': 'primary-700',

  // Border
  '--border': 'neutral-100',
  '--border-hover': 'neutral-200',
  '--border-active': 'neutral-200',
  '--border-disabled': 'neutral-50',
  '--border-secondary': 'neutral-200',
  '--border-tertiary': 'neutral-50',
  '--border-brand': 'primary-200',

  // Status — Surface
  '--bg-surface-info': 'info-100',
  '--bg-surface-info-hover': 'info-200',
  '--bg-surface-success': 'success-100',
  '--bg-surface-success-hover': 'success-200',
  '--bg-surface-warning': 'warning-100',
  '--bg-surface-warning-hover': 'warning-200',
  '--bg-surface-error': 'error-100',
  '--bg-surface-error-hover': 'error-200',

  // Status — Fill
  '--bg-fill-info': 'info-600',
  '--bg-fill-info-hover': 'info-700',
  '--bg-fill-info-active': 'info-700',
  '--bg-fill-success': 'success-600',
  '--bg-fill-success-hover': 'success-700',
  '--bg-fill-success-active': 'success-700',
  '--bg-fill-warning': 'warning-600',
  '--bg-fill-warning-hover': 'warning-700',
  '--bg-fill-warning-active': 'warning-700',
  '--bg-fill-error': 'error-600',
  '--bg-fill-error-hover': 'error-700',
  '--bg-fill-error-active': 'error-700',

  // Status — Foreground
  '--fg-link': 'info-600',
  '--fg-info': 'info-600',
  '--fg-info-hover': 'info-700',
  '--fg-success': 'success-600',
  '--fg-success-hover': 'success-700',
  '--fg-warning': 'warning-600',
  '--fg-warning-hover': 'warning-700',
  '--fg-error': 'error-600',
  '--fg-error-hover': 'error-700',

  // Status — Border
  '--border-info': 'info-500',
  '--border-success': 'success-500',
  '--border-warning': 'warning-500',
  '--border-error': 'error-500',
};

/**
 * Resolves a semantic CSS variable name to its primitive token name.
 * Returns the primitive name (e.g., "primary-600") or the original variable if no mapping exists.
 */
export function resolvePrimitive(variable: string): string {
  return semanticToPrimitiveMap[variable] ?? variable;
}

/**
 * Returns a formatted string showing the semantic token and its primitive mapping.
 * e.g., "--fg-primary → neutral-900"
 */
export function resolveSemanticLabel(variable: string): string {
  const primitive = semanticToPrimitiveMap[variable];
  if (primitive) {
    return `${variable} → ${primitive}`;
  }
  return variable;
}

const darkSemanticToPrimitiveMap: Record<string, string> = {
  '--bg-page': 'neutral-50',
  '--bg-surface': 'neutral-0',
  '--bg-surface-hover': 'neutral-50',
  '--bg-surface-active': 'neutral-100',
  '--bg-surface-brand': 'primary-100',
  '--bg-surface-brand-hover': 'primary-200',
  '--bg-fill': 'neutral-50',
  '--bg-fill-hover': 'neutral-100',
  '--bg-fill-active': 'neutral-100',
  '--bg-fill-brand': 'primary-400',
  '--bg-fill-brand-hover': 'primary-500',
  '--bg-fill-brand-disabled': 'primary-200',
  '--bg-fill-secondary': 'neutral-100',
  '--fg-inverse': '#FFFFFF',
  '--fg-primary': 'neutral-900',
  '--fg-secondary': 'neutral-600',
  '--fg-tertiary': 'neutral-400',
  '--fg-disabled': 'neutral-300',
  '--fg-brand': 'primary-600',
  '--fg-brand-hover': 'primary-700',
  '--border': 'neutral-100',
  '--border-hover': 'neutral-200',
  '--border-active': 'neutral-200',

  // Status — same ramp steps as light; the dark ramp redefinition handles inversion
  '--bg-surface-info': 'info-100',
  '--bg-surface-info-hover': 'info-200',
  '--bg-surface-success': 'success-100',
  '--bg-surface-success-hover': 'success-200',
  '--bg-surface-warning': 'warning-100',
  '--bg-surface-warning-hover': 'warning-200',
  '--bg-surface-error': 'error-100',
  '--bg-surface-error-hover': 'error-200',
  '--bg-fill-info': 'info-600',
  '--bg-fill-info-hover': 'info-700',
  '--bg-fill-info-active': 'info-700',
  '--bg-fill-success': 'success-600',
  '--bg-fill-success-hover': 'success-700',
  '--bg-fill-success-active': 'success-700',
  '--bg-fill-warning': 'warning-600',
  '--bg-fill-warning-hover': 'warning-700',
  '--bg-fill-warning-active': 'warning-700',
  '--bg-fill-error': 'error-600',
  '--bg-fill-error-hover': 'error-700',
  '--bg-fill-error-active': 'error-700',
  '--fg-link': 'info-600',
  '--fg-info': 'info-600',
  '--fg-info-hover': 'info-700',
  '--fg-success': 'success-600',
  '--fg-success-hover': 'success-700',
  '--fg-warning': 'warning-600',
  '--fg-warning-hover': 'warning-700',
  '--fg-error': 'error-600',
  '--fg-error-hover': 'error-700',
  '--border-info': 'info-500',
  '--border-success': 'success-500',
  '--border-warning': 'warning-500',
  '--border-error': 'error-500',
};

export function resolvePrimitiveDark(variable: string): string {
  return darkSemanticToPrimitiveMap[variable] ?? variable;
}
