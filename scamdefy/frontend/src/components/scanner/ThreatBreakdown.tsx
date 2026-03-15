import React from 'react';
import { SignalItem } from '../../types';

const severityColor = (s: string): string => ({
  CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#94a3b8',
}[s] ?? '#94a3b8');

export function ThreatBreakdown({ signals }: { signals: SignalItem[] }) {
  if (!signals.length) return null;
  return (
    <div style={{ background: '#0a0f1e', borderRadius: 8, padding: 12, marginTop: 8 }}>
      {signals.map((sig, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '6px 0',
          borderBottom: i < signals.length - 1 ? '1px solid #1e293b' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: severityColor(sig.severity), flexShrink: 0,
            }} />
            <span style={{ color: '#d1d5db', fontSize: 12 }}>{sig.name}</span>
          </div>
          <span style={{ color: severityColor(sig.severity), fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
            +{sig.points}
          </span>
        </div>
      ))}
    </div>
  );
}
