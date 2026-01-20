/**
 * ICONTROL_RESPONSIVE_TABLE_V1
 * Composant Table responsive qui se transforme en Cards sur mobile
 */

import React from 'react';
import { useIsMobile } from '../responsive/hooks';

export interface ResponsiveTableColumn<T = any> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  mobileLabel?: string;
}

export interface ResponsiveTableProps<T = any> {
  data: T[];
  columns: ResponsiveTableColumn<T>[];
  keyExtractor: (item: T) => string;
  className?: string;
}

export function ResponsiveTable<T = any>({
  data,
  columns,
  keyExtractor,
  className = '',
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    // Vue Cards sur mobile
    return (
      <div className={`responsive-table-cards ${className}`} style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-md)',
      }}>
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            style={{
              background: 'var(--ic-card, var(--panel))',
              border: '1px solid var(--ic-border, var(--line))',
              borderRadius: 'var(--radius, 12px)',
              padding: 'var(--spacing-md)',
            }}
          >
            {columns.map((col) => (
              <div
                key={col.key}
                style={{
                  marginBottom: 'var(--spacing-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--ic-mutedText, var(--muted))',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {col.mobileLabel || col.label}
                </div>
                <div style={{
                  fontSize: 'var(--font-size-base)',
                  color: 'var(--ic-text, var(--text))',
                }}>
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Vue Table sur tablette+
  return (
    <div className={`responsive-table-wrapper ${className}`} style={{
      overflowX: 'auto',
      width: '100%',
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        background: 'var(--ic-card, var(--panel))',
        borderRadius: 'var(--radius, 12px)',
        overflow: 'hidden',
      }}>
        <thead>
          <tr style={{
            background: 'var(--ic-panel, var(--panel2))',
            borderBottom: '1px solid var(--ic-border, var(--line))',
          }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: 'var(--spacing-md)',
                  textAlign: 'left',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: 'var(--ic-text, var(--text))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr
              key={keyExtractor(item)}
              style={{
                borderBottom: idx < data.length - 1 ? '1px solid var(--ic-border, var(--line))' : 'none',
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: 'var(--spacing-md)',
                    fontSize: 'var(--font-size-base)',
                    color: 'var(--ic-text, var(--text))',
                  }}
                >
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
