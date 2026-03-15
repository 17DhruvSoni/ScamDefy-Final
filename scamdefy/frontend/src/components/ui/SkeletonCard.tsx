import React from 'react';

export function SkeletonCard({ height = 72 }: { height?: number }) {
  return (
    <div style={{
      height, borderRadius: 10,
      background: 'linear-gradient(90deg, #111827 25%, #1a2234 50%, #111827 75%)',
      backgroundSize: '400px 100%',
      animation: 'shimmer 1.4s infinite linear',
      border: '1px solid #1e293b',
    }} />
  );
}
