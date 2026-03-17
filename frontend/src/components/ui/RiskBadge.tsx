import React from 'react';

interface Props {
  level: string;
  size?: 'sm' | 'md';
}

const CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CRITICAL: { label: 'CRITICAL',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.4)'   },
  HIGH:     { label: 'HIGH',       color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.4)'  },
  MEDIUM:   { label: 'MEDIUM',     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.4)'  },
  LOW:      { label: 'LOW',        color: '#00f2ff', bg: 'rgba(0,242,255,0.1)',   border: 'rgba(0,242,255,0.4)'   },
  SAFE:     { label: 'SAFE',       color: '#00f2ff', bg: 'rgba(0,242,255,0.1)',   border: 'rgba(0,242,255,0.4)'   },
  BLOCKED:  { label: 'BLOCKED',    color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.5)'   },
  CAUTION:  { label: 'CAUTION',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.4)'  },
  DANGER:   { label: 'DANGER',     color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.4)'  },
};

export function RiskBadge({ level, size = 'sm' }: Props) {
  const cfg = CONFIG[level?.toUpperCase()] ?? CONFIG.LOW;
  const pad = size === 'sm' ? '2px 8px' : '4px 14px';
  const fs = size === 'sm' ? 10 : 12;
  return (
    <span
      className="font-mono font-bold uppercase tracking-widest rounded-full"
      style={{
        padding: pad,
        fontSize: fs,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        textShadow: `0 0 6px ${cfg.color}`,
      }}
    >
      {cfg.label}
    </span>
  );
}
