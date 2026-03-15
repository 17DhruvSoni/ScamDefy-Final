import React from 'react';
import { ThreatEntry, RiskLevel } from '../../types';

const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444',
};

export function ThreatCard({ threat }: { threat: ThreatEntry }) {
  const color = RISK_COLORS[threat.risk_level as RiskLevel] ?? '#94a3b8';
  const date = new Date(threat.timestamp);
  const minsAgo = (Date.now() - date.getTime()) / 60000;
  const rel = minsAgo < 60
    ? `${Math.floor(minsAgo)}m ago`
    : minsAgo < 1440
    ? `${Math.floor(minsAgo / 60)}h ago`
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  const shortUrl = (() => {
    try {
      const { hostname, pathname } = new URL(threat.url);
      const p = pathname.slice(0, 18);
      return hostname + (p.length < pathname.length ? p + '…' : p);
    } catch { return threat.url.slice(0, 38); }
  })();

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      background: '#111827', borderRadius: 10, border: '1px solid #1e293b',
      transition: 'background 0.15s', cursor: 'pointer',
    }}
      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = '#1a2234')}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = '#111827')}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          color: '#f1f5f9', fontSize: 12, margin: 0,
          fontFamily: 'JetBrains Mono, monospace',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{shortUrl}</p>
        <p style={{ color: '#94a3b8', fontSize: 11, margin: '2px 0 0' }}>
          {threat.scam_type} · {threat.score}/100 · {threat.blocked ? '🚫 Blocked' : '⚠️ Warned'}
        </p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ color: '#475569', fontSize: 10, margin: 0 }}>{rel}</p>
        <p style={{ color, fontSize: 11, fontWeight: 700, margin: '2px 0 0' }}>{threat.risk_level}</p>
      </div>
    </div>
  );
}
