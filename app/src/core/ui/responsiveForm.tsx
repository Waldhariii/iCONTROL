/**
 * ICONTROL_RESPONSIVE_FORM_V1
 * Composant Form responsive avec layout adaptatif
 */

import React from 'react';
import { useIsMobile, useIsTabletOrLarger } from '../responsive/hooks';

export interface ResponsiveFormField {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
}

export interface ResponsiveFormProps {
  fields: ResponsiveFormField[];
  onSubmit: (data: Record<string, any>) => void;
  submitLabel?: string;
  className?: string;
}

export function ResponsiveForm({
  fields,
  onSubmit,
  submitLabel = 'Soumettre',
  className = '',
}: ResponsiveFormProps) {
  const isMobile = useIsMobile();
  const isTabletOrLarger = useIsTabletOrLarger();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {};
    fields.forEach(field => {
      data[field.id] = formData.get(field.id);
    });
    onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`responsive-form ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        padding: isMobile ? 'var(--spacing-md)' : 'var(--spacing-lg)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTabletOrLarger ? 'repeat(2, 1fr)' : '1fr',
          gap: 'var(--spacing-md)',
        }}
      >
        {fields.map((field) => (
          <div
            key={field.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              gridColumn: field.type === 'textarea' ? '1 / -1' : undefined,
            }}
          >
            <label
              htmlFor={field.id}
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                color: 'var(--ic-text, var(--text))',
              }}
            >
              {field.label}
              {field.required && <span style={{ color: '#f48771', marginLeft: '4px' }}>*</span>}
            </label>
            
            {field.type === 'textarea' ? (
              <textarea
                id={field.id}
                name={field.id}
                required={field.required}
                placeholder={field.placeholder}
                rows={field.rows || 4}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--ic-border, var(--line))',
                  background: 'var(--ic-panel, var(--panel))',
                  color: 'var(--ic-text, var(--text))',
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '100px',
                }}
              />
            ) : field.type === 'select' ? (
              <select
                id={field.id}
                name={field.id}
                required={field.required}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--ic-border, var(--line))',
                  background: 'var(--ic-panel, var(--panel))',
                  color: 'var(--ic-text, var(--text))',
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  id={field.id}
                  name={field.id}
                  required={field.required}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: 'var(--font-size-base)' }}>
                  {field.placeholder || field.label}
                </span>
              </label>
            ) : (
              <input
                type={field.type || 'text'}
                id={field.id}
                name={field.id}
                required={field.required}
                placeholder={field.placeholder}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--ic-border, var(--line))',
                  background: 'var(--ic-panel, var(--panel))',
                  color: 'var(--ic-text, var(--text))',
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'inherit',
                  minHeight: '44px', // Touch target minimum
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          justifyContent: isMobile ? 'stretch' : 'flex-end',
          marginTop: 'var(--spacing-md)',
        }}
      >
        <button
          type="submit"
          style={{
            padding: isMobile ? '14px 24px' : '12px 32px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--ic-accent, var(--accent))',
            color: 'white',
            fontSize: 'var(--font-size-base)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            minHeight: '44px', // Touch target minimum
            width: isMobile ? '100%' : 'auto',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.opacity = '1';
          }}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
