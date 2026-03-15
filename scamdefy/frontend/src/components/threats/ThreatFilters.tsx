import React from 'react';

interface Props { active: string; onChange: (f: string) => void; }

const FILTERS = [
  { value: '',         label: 'ALL' },
  { value: 'CRITICAL', label: 'CRITICAL' },
  { value: 'HIGH',     label: 'HIGH' },
  { value: 'MEDIUM',   label: 'MEDIUM' },
  { value: 'LOW',      label: 'LOW' },
];

const COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#f59e0b',
  LOW:      '#00f2ff',
  '':       '#94a3b8',
};

export function ThreatFilters({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map(f => {
        const isActive = active === f.value;
        const color = COLORS[f.value];
        return (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            className="text-[10px] font-mono tracking-[0.2em] uppercase rounded px-3 py-1.5 transition-all"
            style={{
              color: isActive ? '#0a0b0d' : color,
              background: isActive ? color : 'transparent',
              border: `1px solid ${isActive ? color : `${color}40`}`,
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
