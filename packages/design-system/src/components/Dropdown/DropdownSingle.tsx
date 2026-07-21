import { Fragment, forwardRef, useImperativeHandle, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import { DropdownWrapper } from './DropdownWrapper';
import { DropdownMenuShell } from './DropdownMenuShell';
import { useDropdown } from './useDropdown';
import type { DropdownBaseProps, DropdownOption } from './types';
import './Dropdown.scss';

export interface DropdownSingleProps extends DropdownBaseProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  /**
   * Fires while the user hovers (or keyboard-focuses) an option in the open
   * menu. Useful for live-previewing a value before commit.
   */
  onItemHover?: (value: string) => void;
  /**
   * Fires when the pointer leaves the menu without selecting, or the menu
   * closes. Pair with `onItemHover` to clear preview state.
   */
  onItemHoverEnd?: () => void;
  showLeadingIcon?: boolean;
  /** Replaces the default chevron in the trigger while preserving dropdown behavior. */
  trailingIcon?: ReactNode;
  menuPlacement?: 'auto' | 'top' | 'bottom';
  mobileBehavior?: 'auto' | 'inline' | 'sheet';
  /** Render the desktop menu in a portal — use when the trigger sits inside an `overflow: hidden` ancestor. */
  usePortal?: boolean;
  portalAlign?: 'start' | 'center' | 'end';
  /** Additional class applied to the rendered menu, including portal menus. */
  menuClassName?: string;
}

export interface DropdownHandle {
  focus: () => void;
}

export const DropdownSingle = forwardRef<DropdownHandle, DropdownSingleProps>(
  (
    {
      options,
      value,
      onChange,
      onItemHover,
      onItemHoverEnd,
      size = 'md',
      status = 'default',
      disabled = false,
      placeholder = 'Placeholder',
      showLeadingIcon = true,
      trailingIcon,
      menuPlacement = 'auto',
      mobileBehavior = 'auto',
      usePortal,
      portalAlign,
      menuClassName,
      title,
      className,
      ...wrapperProps
    },
    ref
  ) => {
    const readOnly = status === 'readonly';
    const selectedIdx = options.findIndex((o) => o.value === value);
    const selected = selectedIdx >= 0 ? options[selectedIdx] : null;

    const {
      open,
      setOpen,
      activeIndex,
      rootRef,
      triggerRef,
      menuRef,
      toggle,
      handleTriggerKey,
      handleMenuKey,
      placement,
      isMobileSheet,
    } = useDropdown({
      disabled,
      readOnly,
      optionCount: options.length,
      isOptionDisabled: (index) => Boolean(options[index]?.disabled),
      onSelect: (i) => onChange?.(options[i].value),
      menuPlacement,
      mobileBehavior,
    });

    useImperativeHandle(ref, () => ({ focus: () => triggerRef.current?.focus() }));

    const triggerClass = [
      'jf-dropdown',
      `jf-dropdown--${size}`,
      `jf-dropdown--${status}`,
      disabled && 'jf-dropdown--disabled',
      open && 'jf-dropdown--open',
    ]
      .filter(Boolean)
      .join(' ');

    const leading = selected?.leading ?? (showLeadingIcon ? (
      <Icon name="circle-filled" category="general" size={size === 'lg' ? 24 : 20} />
    ) : null);

    return (
      <DropdownWrapper
        size={size}
        status={status}
        disabled={disabled}
        title={title}
        className={className}
        {...wrapperProps}
      >
        <div className="jf-dropdown__root" ref={rootRef}>
          <button
            ref={triggerRef}
            type="button"
            className={triggerClass}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={toggle}
            onKeyDown={handleTriggerKey}
          >
            {leading && <span className="jf-dropdown__leading">{leading}</span>}
            <span
              className={`jf-dropdown__value${selected ? '' : ' jf-dropdown__value--placeholder'}`}
              style={selected?.labelStyle}
            >
              {selected ? selected.label : placeholder}
            </span>
            <span className="jf-dropdown__trailing">
              {trailingIcon ?? <Icon name={open ? 'angle-up' : 'angle-down'} category="arrows" size={size === 'sm' ? 16 : 24} />}
            </span>
          </button>

          {open && !disabled && !readOnly && (
            <DropdownMenuShell
              placement={placement}
              isSheet={isMobileSheet}
              usePortal={usePortal}
              portalAlign={portalAlign}
              className={menuClassName}
              title={title}
              menuRef={menuRef}
              triggerRef={triggerRef}
              onClose={() => {
                setOpen(false);
                onItemHoverEnd?.();
              }}
              onKeyDown={handleMenuKey}
              onMouseLeave={() => onItemHoverEnd?.()}
            >
              {options.map((opt, i) => {
                const isSelected = opt.value === value;
                const isActive = i === activeIndex;
                const isDisabled = Boolean(opt.disabled);
                const itemClass = [
                  'jf-dropdown__item',
                  isSelected && 'jf-dropdown__item--selected',
                  isActive && 'jf-dropdown__item--active',
                  isDisabled && 'jf-dropdown__item--disabled',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <Fragment key={opt.value}>
                    {opt.divider && <div className="jf-dropdown__divider" role="separator" />}
                    <div
                      className={itemClass}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={isDisabled || undefined}
                      data-dd-index={i}
                      onMouseEnter={() => !isDisabled && onItemHover?.(opt.value)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (isDisabled) return;
                        onChange?.(opt.value);
                        setOpen(false);
                      }}
                    >
                      {opt.leading ?? (showLeadingIcon && (
                        <span className="jf-dropdown__item-leading">
                          <Icon name="circle-filled" category="general" size={size === 'lg' ? 24 : 20} />
                        </span>
                      ))}
                      <span className="jf-dropdown__item-label" style={opt.labelStyle}>{opt.label}</span>
                      {opt.trailing && <span className="jf-dropdown__item-trailing">{opt.trailing}</span>}
                    </div>
                  </Fragment>
                );
              })}
            </DropdownMenuShell>
          )}
        </div>
      </DropdownWrapper>
    );
  }
);

DropdownSingle.displayName = 'DropdownSingle';
