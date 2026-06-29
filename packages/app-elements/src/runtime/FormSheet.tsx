import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { useCollections } from './CollectionsContext';
import { Icon } from '../components/Icon/Icon';
import './FormSheet.scss';

export function FormSheet() {
  const ctx = useCollections();
  const [values, setValues] = useState<Record<string, string>>({});
  const firstFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const schema = ctx?.activeForm ?? null;

  useEffect(() => {
    if (schema) {
      setValues({});
      const t = window.setTimeout(() => firstFieldRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [schema]);

  useEffect(() => {
    if (!schema) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') ctx?.closeForm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [schema, ctx]);

  if (!ctx || !schema) return null;

  const handleChange = (name: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    ctx.append(schema.submitsTo, { ...values });
    ctx.closeForm();
  };

  const submitLabel = schema.submitButtonLabel || 'Submit';

  return (
    <div className="jf-form-sheet" role="dialog" aria-modal="true" onClick={ctx.closeForm}>
      <div className="jf-form-sheet__panel" onClick={(e) => e.stopPropagation()}>
        <header className="jf-form-sheet__header">
          <div className="jf-form-sheet__header-text">
            <h3 className="jf-form-sheet__title">{schema.title}</h3>
            {schema.description && <p className="jf-form-sheet__description">{schema.description}</p>}
          </div>
          <button type="button" className="jf-form-sheet__close" onClick={ctx.closeForm} aria-label="Close">
            <Icon name="X" size={20} />
          </button>
        </header>
        <form className="jf-form-sheet__form" onSubmit={handleSubmit}>
          {schema.fields.map((field, i) => (
            <label key={field.name} className="jf-form-sheet__field" data-form-field-name={field.name}>
              <span className="jf-form-sheet__label">{field.label}</span>
              {field.type === 'textarea' ? (
                <textarea
                  ref={i === 0 ? (el) => { firstFieldRef.current = el; } : undefined}
                  className="jf-form-sheet__input jf-form-sheet__input--textarea"
                  value={values[field.name] ?? ''}
                  onChange={handleChange(field.name)}
                  placeholder={field.placeholder}
                  rows={3}
                />
              ) : (
                <input
                  ref={i === 0 ? (el) => { firstFieldRef.current = el; } : undefined}
                  className="jf-form-sheet__input"
                  type={field.type}
                  value={values[field.name] ?? ''}
                  onChange={handleChange(field.name)}
                  placeholder={field.placeholder}
                />
              )}
            </label>
          ))}
          <div className="jf-form-sheet__buttons">
            <button type="submit" className="jf-form-sheet__button jf-form-sheet__button--primary">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
