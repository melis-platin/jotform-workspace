import {
  forwardRef,
  useId,
  type CSSProperties,
  type InputHTMLAttributes,
} from 'react';
import './Slider.scss';

export type SliderSize = 'sm' | 'md' | 'lg';

export interface SliderProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'size' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step'
  > {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  /** Fires with the parsed numeric value. */
  onChange?: (value: number) => void;
  size?: SliderSize;
  error?: boolean;
  disabled?: boolean;
  /** Render the live value next to the track. */
  showValue?: boolean;
  /** Optional formatter for the rendered value (e.g. v => `${v}px`). */
  formatValue?: (value: number) => string;
  className?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value,
      defaultValue,
      min = 0,
      max = 100,
      step = 1,
      onChange,
      size = 'md',
      error = false,
      disabled = false,
      showValue = false,
      formatValue,
      className,
      id: idProp,
      ...rest
    },
    ref
  ) => {
    const autoId = useId();
    const id = idProp ?? autoId;

    // Current value for the % fill. Prefer controlled value, then defaultValue,
    // then the midpoint so the fallback is never a bare 0%.
    const current = value ?? defaultValue ?? min + (max - min) / 2;
    const span = max - min || 1;
    const pct = Math.min(100, Math.max(0, ((current - min) / span) * 100));

    const rootClass = [
      'jf-slider',
      `jf-slider--${size}`,
      error && 'jf-slider--error',
      disabled && 'jf-slider--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const rendered = formatValue ? formatValue(current) : String(current);

    return (
      <span className={rootClass} style={{ '--_pct': `${pct}%` } as CSSProperties}>
        <input
          ref={ref}
          id={id}
          type="range"
          className="jf-slider__input"
          min={min}
          max={max}
          step={step}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          disabled={disabled}
          onChange={(e) => onChange?.(Number(e.target.value))}
          {...rest}
        />
        {showValue && (
          <span className="jf-slider__value" aria-hidden>
            {rendered}
          </span>
        )}
      </span>
    );
  }
);

Slider.displayName = 'Slider';
