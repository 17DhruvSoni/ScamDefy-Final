import React from 'react';

export function EmptyState({
  icon, title, description, action
}: { icon: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', gap: 12, textAlign: 'center',
    }}>
      <span style={{ fontSize: 52 }}>{icon}</span>
      <p style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 600, margin: 0, fontFamily: 'Syne' }}>{title}</p>
      <p style={{ color: '#94a3b8', fontSize: 13, margin: 0, maxWidth: 260, lineHeight: 1.6 }}>{description}</p>
      {action}
    </div>
  );
}
