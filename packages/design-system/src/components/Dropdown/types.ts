import type { CSSProperties, ReactNode } from 'react';

export type DropdownSize = 'sm' | 'md' | 'lg';
export type DropdownStatus = 'default' | 'error' | 'readonly';

export interface DropdownOption {
  value: string;
  label: string;
  /** Excludes this option from selection while keeping it visible in the menu. */
  disabled?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Render a divider directly above this option in the menu. */
  divider?: boolean;
  /** Inline style applied to the label span (trigger + menu item). Useful e.g. for font-preview rows. */
  labelStyle?: CSSProperties;
}

export interface DropdownBaseProps {
  size?: DropdownSize;
  status?: DropdownStatus;
  disabled?: boolean;
  placeholder?: string;
  title?: string;
  description?: string;
  required?: boolean;
  helperText?: string;
  showTitle?: boolean;
  showDescription?: boolean;
  showHelpText?: boolean;
  className?: string;
}
