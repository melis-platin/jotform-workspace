import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { Icon } from '../Icon';
import './TextArea.scss';

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  size?: 'md' | 'lg';
  height?: 'default' | 'compact' | 'tall';
  status?: 'default' | 'error' | 'readonly';
  showCount?: boolean;
  showDrag?: boolean;
  countValue?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      size = 'lg',
      height = 'default',
      status = 'default',
      showCount = true,
      showDrag = true,
      countValue,
      disabled,
      readOnly,
      maxLength = 300,
      className,
      value,
      defaultValue,
      onChange,
      ...rest
    },
    ref
  ) => {
    const resolvedStatus = readOnly ? 'readonly' : status;

    const charCount = countValue ?? (
      typeof value === 'string'
        ? value.length
        : typeof defaultValue === 'string'
          ? defaultValue.length
          : 0
    );

    const rootClass = [
      'jf-textarea',
      `jf-textarea--${size}`,
      height !== 'default' && `jf-textarea--height-${height}`,
      `jf-textarea--${resolvedStatus}`,
      disabled && 'jf-textarea--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={rootClass}>
        <div className="jf-textarea__wrapper">
          <textarea
            ref={ref}
            className="jf-textarea__field"
            disabled={disabled}
            readOnly={readOnly || resolvedStatus === 'readonly'}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            {...rest}
          />
          {showCount && (
            <div className="jf-textarea__count">
              {resolvedStatus === 'readonly' && (
                <Icon name="lock-filled" category="security" size={size === 'lg' ? 20 : 16} />
              )}
              <span className="jf-textarea__count-current">{charCount}</span>
              <span className="jf-textarea__count-separator">/</span>
              <span className="jf-textarea__count-limit">{maxLength}</span>
            </div>
          )}
        </div>
        {showDrag && <span className="jf-textarea__drag" aria-hidden="true" />}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
