import React from 'react';

export function LoadingSpinner({ size = 'md', color = '#6366f1' }: { size?: 'sm'|'md'|'lg'; color?: string }) {
  const px = size === 'sm' ? 16 : size === 'lg' ? 40 : 24;
  return (
    <div style={{
      width: px, height: px, borderRadius: '50%',
      border: `2px solid #1e293b`, borderTopColor: color,
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  );
}
