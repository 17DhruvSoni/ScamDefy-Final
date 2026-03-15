import React from 'react';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Critical', value: 'CRITICAL' },
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
];

export function ThreatFilters({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
      {FILTERS.map(f => (
        <button key={f.value} onClick={() => onChange(f.value)} style={{
          padding: '5px 13px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap',
          borderColor: active === f.value ? '#6366f1' : '#1e293b',
          background: active === f.value ? '#6366f115' : 'transparent',
          color: active === f.value ? '#6366f1' : '#94a3b8',
          transition: 'all 0.15s',
        }}>
          {f.label}
        </button>
      ))}
    </div>
  );
}
