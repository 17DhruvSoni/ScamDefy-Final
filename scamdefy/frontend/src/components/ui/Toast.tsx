import React from 'react';
import { useAppStore } from '../../store/appStore';

const COLORS = {
  success: { bg: '#22c55e15', text: '#22c55e', border: '#22c55e40', icon: '✓' },
  warning: { bg: '#f59e0b15', text: '#f59e0b', border: '#f59e0b40', icon: '⚠' },
  error:   { bg: '#ef444415', text: '#ef4444', border: '#ef444440', icon: '✕' },
  info:    { bg: '#6366f115', text: '#6366f1', border: '#6366f140', icon: 'ℹ' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore();
  return (
    <div style={{
      position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', gap: 8,
      zIndex: 9999, width: '92%', maxWidth: 390, pointerEvents: 'none',
    }}>
      {toasts.map(toast => {
        const cfg = COLORS[toast.type as keyof typeof COLORS] ?? COLORS.info;
        return (
          <div key={toast.id}
            onClick={() => removeToast(toast.id)}
            style={{
              background: '#111827', border: `1px solid ${cfg.border}`,
              borderLeft: `3px solid ${cfg.text}`,
              borderRadius: 10, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer', boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              animation: 'slideDown 0.25s ease',
              pointerEvents: 'all',
            }}>
            <span style={{ color: cfg.text, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{cfg.icon}</span>
            <span style={{ color: '#f1f5f9', fontSize: 13, flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
