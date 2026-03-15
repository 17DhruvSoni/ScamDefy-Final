import React from 'react';
import { AppError } from '../../types';

export function ErrorBanner({ error, onRetry }: { error: AppError | string; onRetry?: () => void }) {
  const message = typeof error === 'string' ? error : error.message;
  const retryable = typeof error === 'string' ? true : error.retryable;
  return (
    <div style={{
      background: '#ef444410', border: '1px solid #ef444430', borderRadius: 10,
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
      <p style={{ color: '#ef4444', fontSize: 13, margin: 0, flex: 1 }}>{message}</p>
      {onRetry && retryable && (
        <button onClick={onRetry} style={{
          background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440',
          borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', flexShrink: 0,
        }}>
          Retry
        </button>
      )}
    </div>
  );
}
