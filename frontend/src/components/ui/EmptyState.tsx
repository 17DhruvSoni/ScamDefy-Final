import React from 'react';

interface Props {
  icon?: string;
  title: string;
  description?: string;
}

export function EmptyState({ icon = '🛡️', title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 border border-electricCyan/30 hexagon-clip flex items-center justify-center text-2xl opacity-50">
        {icon}
      </div>
      <div className="text-center">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-white/40 mb-1">{title}</p>
        {description && (
          <p className="text-xs text-white/25 max-w-xs">{description}</p>
        )}
      </div>
    </div>
  );
}
