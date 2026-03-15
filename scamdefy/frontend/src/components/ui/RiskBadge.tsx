import React from 'react';
import { Verdict } from '../../types';

const CONFIG = {
  SAFE:    { label: 'SAFE',    bg: '#22c55e15', text: '#22c55e', border: '#22c55e30' },
  CAUTION: { label: 'CAUTION', bg: '#f59e0b15', text: '#f59e0b', border: '#f59e0b30' },
  DANGER:  { label: 'DANGER',  bg: '#f9731615', text: '#f97316', border: '#f9731630' },
  BLOCKED: { label: 'BLOCKED', bg: '#ef444415', text: '#ef4444', border: '#ef444430' },
};

export function RiskBadge({ verdict }: { verdict: Verdict }) {
  const cfg = CONFIG[verdict] ?? CONFIG.CAUTION;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 10px', borderRadius: 9999,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.8px',
      textTransform: 'uppercase',
      backgroundColor: cfg.bg, color: cfg.text,
      border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
}
