import React from 'react';

interface Props { height?: number; }

export function SkeletonCard({ height = 80 }: Props) {
  return (
    <div
      className="glass-panel rounded animate-pulse"
      style={{ height }}
    >
      <div className="h-full rounded bg-white/[0.02]" />
    </div>
  );
}
