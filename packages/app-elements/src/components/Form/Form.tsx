import type { FC } from 'react';
import { Icon } from '../Icon/Icon';
import { Button } from '../Button';
import './Form.scss';

export type FormAlignment = 'Left' | 'Center' | 'Right';
export type FormSize = 'Normal' | 'Large';

export interface FormProps {
  alignment?: FormAlignment;
  size?: FormSize;
  label?: string;
  description?: string;
  formTitle?: string;
  formDescription?: string;
  submitLabel?: string;
  formFields?: string;
  defaultValues?: string;
  showIcon?: boolean;
  icon?: string;
  required?: boolean;
  selected?: boolean;
  shrinked?: boolean;
  showForm?: boolean;
  showBorder?: boolean;
  skeleton?: boolean;
  skeletonAnimation?: 'pulse' | 'shimmer';
}

type OpenFormFieldType = 'text' | 'email' | 'tel' | 'textarea' | 'radio';
type OpenFormFieldWidth = 'half' | 'full';

interface OpenFormField {
  name: string;
  label: string;
  type?: OpenFormFieldType;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  labelHidden?: boolean;
  width?: OpenFormFieldWidth;
  options?: string[];
}

type OpenFormDefaultValues = Record<string, string>;

function parseOpenFormDefaultValues(raw?: string): OpenFormDefaultValues {
  if (!raw) return {};
  const trimmed = raw.trim();
  if (!trimmed) return {};

  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed)
        .filter((entry): entry is [string, string] => (
          typeof entry[0] === 'string' && typeof entry[1] === 'string'
        ))
    );
  } catch {
    return {};
  }
}

function parseOpenFormFields(raw?: string): OpenFormField[] | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((field): OpenFormField | null => {
        if (!field || typeof field !== 'object') return null;
        const value = field as Partial<OpenFormField>;
        if (typeof value.name !== 'string' || typeof value.label !== 'string') return null;
        return {
          name: value.name,
          label: value.label,
          type: value.type ?? 'text',
          placeholder: value.placeholder,
          helpText: value.helpText,
          required: Boolean(value.required),
          labelHidden: Boolean(value.labelHidden),
          width: value.width === 'full' ? 'full' : 'half',
          options: Array.isArray(value.options) ? value.options.filter((option): option is string => typeof option === 'string') : undefined,
        };
      })
      .filter((field): field is OpenFormField => Boolean(field));
  } catch {
    return null;
  }
}

export const Form: FC<FormProps> = ({
  alignment = 'Left',
  size = 'Normal',
  label = 'Form',
  description = 'Type a description',
  formTitle = '',
  formDescription = '',
  submitLabel = 'Submit',
  formFields = '',
  defaultValues = '',
  showIcon = true,
  icon = 'ClipboardList',
  required = true,
  selected = false,
  shrinked = false,
  showForm = false,
  showBorder = true,
  skeleton = false,
  skeletonAnimation = 'pulse',
}) => {
  const animClass = skeletonAnimation === 'shimmer' ? 'animate-shimmer' : 'animate-pulse';
  const configuredFields = parseOpenFormFields(formFields);
  const openFormDefaultValues = parseOpenFormDefaultValues(defaultValues);

  if (skeleton && showForm) {
    const openClasses = [
      'jf-form-open',
      !showBorder && 'jf-form-open--no-border',
    ].filter(Boolean).join(' ');

    return (
      <div className={openClasses}>
        <div className="jf-form-open__section">
          <div className="jf-form-open__row">
            <div className="jf-form-open__field">
              <div className={`jf-skeleton__line jf-skeleton__line--sm ${animClass}`} style={{ width: '30%' }} />
              <div className={`jf-skeleton__bone ${animClass}`} style={{ height: 40, borderRadius: 8 }} />
            </div>
            <div className="jf-form-open__field">
              <div className={`jf-skeleton__line jf-skeleton__line--sm ${animClass}`} style={{ width: '30%' }} />
              <div className={`jf-skeleton__bone ${animClass}`} style={{ height: 40, borderRadius: 8 }} />
            </div>
          </div>
          <div className="jf-form-open__field">
            <div className={`jf-skeleton__line jf-skeleton__line--sm ${animClass}`} style={{ width: '40%' }} />
            <div className={`jf-skeleton__bone ${animClass}`} style={{ height: 40, borderRadius: 8 }} />
          </div>
        </div>
        <div className="jf-form-open__field">
          <div className={`jf-skeleton__line jf-skeleton__line--sm ${animClass}`} style={{ width: '20%' }} />
          <div className={`jf-skeleton__bone ${animClass}`} style={{ height: 80, borderRadius: 8 }} />
        </div>
        <div className="jf-form-open__buttons">
          <div className={`jf-skeleton__bone ${animClass}`} style={{ height: 40, borderRadius: 8, flex: 1 }} />
          <div className={`jf-skeleton__bone ${animClass}`} style={{ height: 40, borderRadius: 8, flex: 1 }} />
        </div>
      </div>
    );
  }

  if (skeleton && !showForm) {
    const isCenter = alignment === 'Center';
    const isNormal = size === 'Normal';
    const iconSize = isNormal ? 60 : 100;

    const rootClasses = [
      'jf-form',
      isCenter ? 'jf-form--center' : 'jf-form--horizontal',
      alignment === 'Right' && 'jf-form--right',
      shrinked && 'jf-form--shrinked',
    ].filter(Boolean).join(' ');

    return (
      <div className={rootClasses}>
        {showIcon && (
          <div className={`jf-form__icon jf-skeleton__bone ${animClass}`} style={{ width: iconSize, height: iconSize }} />
        )}
        <div className="jf-form__content">
          <div className={`jf-skeleton__line jf-skeleton__line--lg ${animClass}`} style={{ width: '60%' }} />
          <div className={`jf-skeleton__line jf-skeleton__line--sm ${animClass}`} style={{ width: '80%' }} />
        </div>
      </div>
    );
  }

  if (showForm) {
    if (configuredFields) {
      const openClasses = [
        'jf-form-open',
        'jf-form-open--designed',
        !showBorder && 'jf-form-open--frameless',
        selected && 'jf-form-open--selected',
      ].filter(Boolean).join(' ');

      return (
        <form className={openClasses} onSubmit={(e) => e.preventDefault()}>
          <header className="jf-form-open__header">
            <h2 className="jf-form-open__title">{formTitle || label}</h2>
            {(formDescription || description) && (
              <p className="jf-form-open__description">{formDescription || description}</p>
            )}
          </header>

          <div className="jf-form-open__grid">
            {configuredFields.map((field) => {
              const fieldClasses = [
                'jf-form-open__field',
                `jf-form-open__field--${field.width ?? 'half'}`,
                field.type === 'radio' && 'jf-form-open__field--radio-group',
              ].filter(Boolean).join(' ');
              const labelClasses = [
                'jf-form-open__label',
                field.labelHidden && 'jf-form-open__label--hidden',
              ].filter(Boolean).join(' ');

              if (field.type === 'radio') {
                return (
                  <fieldset key={field.name} className={fieldClasses}>
                    <legend className="jf-form-open__label">
                      {field.label}
                      {field.required && <span className="jf-form-open__required">*</span>}
                    </legend>
                    <div className="jf-form-open__options">
                      {(field.options ?? []).map((option) => (
                        <label key={option} className="jf-form-open__option">
                          <input type="radio" name={field.name} className="jf-form-open__radio" />
                          <span className="jf-form-open__option-label">{option}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              }

              return (
                <label key={field.name} className={fieldClasses}>
                  <span className={labelClasses}>{field.label}</span>
                  {field.type === 'textarea' ? (
                    <textarea
                      className="jf-form-open__input jf-form-open__input--textarea"
                      placeholder={field.placeholder}
                      defaultValue={openFormDefaultValues[field.name] ?? ''}
                    />
                  ) : (
                    <input
                      className="jf-form-open__input"
                      type={field.type ?? 'text'}
                      placeholder={field.placeholder}
                      defaultValue={openFormDefaultValues[field.name] ?? ''}
                    />
                  )}
                  {field.helpText && <span className="jf-form-open__hint">{field.helpText}</span>}
                </label>
              );
            })}
          </div>

          <button type="submit" className="jf-form-open__submit">
            {submitLabel}
          </button>
        </form>
      );
    }

    const openClasses = [
      'jf-form-open',
      !showBorder && 'jf-form-open--no-border',
      selected && 'jf-form-open--selected',
    ].filter(Boolean).join(' ');

    return (
      <div className={openClasses}>
        {/* Name Fields */}
        <div className="jf-form-open__section">
          <div className="jf-form-open__row">
            <div className="jf-form-open__field">
              <label className="jf-form-open__label">Name</label>
              <input type="text" className="jf-form-open__input" />
              <span className="jf-form-open__hint">First Name</span>
            </div>
            <div className="jf-form-open__field">
              <label className="jf-form-open__label jf-form-open__label--hidden">Name</label>
              <input type="text" className="jf-form-open__input" />
              <span className="jf-form-open__hint">Last Name</span>
            </div>
          </div>

          {/* Phone Number */}
          <div className="jf-form-open__field">
            <label className="jf-form-open__label">Phone Number</label>
            <input type="tel" className="jf-form-open__input" placeholder="(000) 000-0000" />
            <span className="jf-form-open__hint">Please enter a valid phone number</span>
          </div>

          {/* Subject (Radio) */}
          <div className="jf-form-open__field">
            <label className="jf-form-open__label">Subject</label>
            <div className="jf-form-open__options">
              <label className="jf-form-open__option">
                <input type="radio" name="subject" className="jf-form-open__radio" defaultChecked />
                <span className="jf-form-open__option-label">General Inquiry</span>
              </label>
              <label className="jf-form-open__option">
                <input type="radio" name="subject" className="jf-form-open__radio" />
                <span className="jf-form-open__option-label">Support</span>
              </label>
              <label className="jf-form-open__option">
                <input type="radio" name="subject" className="jf-form-open__radio" />
                <span className="jf-form-open__option-label">Feedback</span>
              </label>
            </div>
          </div>

          {/* Interests (Checkbox) */}
          <div className="jf-form-open__field">
            <label className="jf-form-open__label">Interests</label>
            <div className="jf-form-open__options">
              <label className="jf-form-open__option">
                <input type="checkbox" className="jf-form-open__checkbox" defaultChecked />
                <span className="jf-form-open__option-label">Newsletter</span>
              </label>
              <label className="jf-form-open__option">
                <input type="checkbox" className="jf-form-open__checkbox" />
                <span className="jf-form-open__option-label">Promotions</span>
              </label>
              <label className="jf-form-open__option">
                <input type="checkbox" className="jf-form-open__checkbox" />
                <span className="jf-form-open__option-label">Product Updates</span>
              </label>
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="jf-form-open__field">
          <label className="jf-form-open__label">Image</label>
          <div className="jf-form-open__upload">
            <Icon name="CloudUpload" size={32} className="jf-form-open__upload-icon" />
            <div className="jf-form-open__upload-text">
              <span className="jf-form-open__upload-title">Browse Files</span>
              <span className="jf-form-open__upload-desc">Drag and drop files here</span>
            </div>
          </div>
          <div className="jf-form-open__file">
            <div className="jf-form-open__file-preview" />
            <span className="jf-form-open__file-name">Screens...766.png</span>
            <button className="jf-form-open__file-delete">
              <Icon name="Trash2" size={20} />
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="jf-form-open__buttons">
          <Button variant="Outlined" label="Save" leftIcon="none" rightIcon="none" fullWidth />
          <Button variant="Default" label="Submit" leftIcon="none" rightIcon="none" fullWidth />
        </div>
      </div>
    );
  }

  const isCenter = alignment === 'Center';
  const isNormal = size === 'Normal';

  const iconSize = isNormal ? 60 : 100;
  const iconInner = isNormal ? 32 : 52;

  const rootClasses = [
    'jf-form',
    isCenter ? 'jf-form--center' : 'jf-form--horizontal',
    alignment === 'Right' && 'jf-form--right',
    selected && 'jf-form--selected',
    shrinked && 'jf-form--shrinked',
  ].filter(Boolean).join(' ');

  return (
    <div className={rootClasses}>
      {showIcon && (
        <div className="jf-form__icon" style={{ width: iconSize, height: iconSize }}>
          <Icon name={icon} size={iconInner} />
        </div>
      )}
      <div className="jf-form__content">
        <div className={`jf-form__title jf-form__title--${isNormal ? 'normal' : 'large'}`}>
          {label}
        </div>
        <div className={`jf-form__desc jf-form__desc--${isNormal ? 'normal' : 'large'}`}>
          {description}
        </div>
      </div>
      {required && (
        <div className="jf-form__badge">
          <Icon name="Asterisk" size={20} />
        </div>
      )}
    </div>
  );
};

export default Form;
