import React, { useState } from 'react';
import { useUrlScan } from '../hooks/useUrlScan';
import { useThreatHistory } from '../hooks/useThreatHistory';
import { UrlInput } from '../components/scanner/UrlInput';
import { ScanResultCard } from '../components/scanner/ScanResultCard';
import { ThreatCard } from '../components/threats/ThreatCard';
import { ThreatFilters } from '../components/threats/ThreatFilters';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/SkeletonCard';

type Tab = 'scanner' | 'history';

export function WebThreats() {
  const [tab, setTab] = useState<Tab>('scanner');
  const { result, loading, error, scan, reset } = useUrlScan();
  const { threats, loading: threatLoading, error: threatError, load, clear, activeFilter, applyFilter } = useThreatHistory();

  const tabStyle = (t: Tab) => ({
    flex: 1, padding: '10px 0', textAlign: 'center' as const,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    background: 'none', border: 'none',
    color: tab === t ? '#6366f1' : '#94a3b8',
    borderBottom: `2px solid ${tab === t ? '#6366f1' : 'transparent'}`,
    transition: 'all 0.2s',
  });

  return (
    <div className="screen-enter" style={{ padding: '52px 0 80px', maxWidth: 430, margin: '0 auto' }}>
      {/* Tab Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', marginBottom: 16 }}>
        <button style={tabStyle('scanner')} onClick={() => setTab('scanner')}>🔍 Scanner</button>
        <button style={tabStyle('history')} onClick={() => setTab('history')}>
          📋 History {threats.length > 0 && <span style={{
            background: '#6366f115', color: '#6366f1', borderRadius: 9999,
            padding: '1px 6px', fontSize: 11, marginLeft: 4,
          }}>{threats.length}</span>}
        </button>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* SCANNER TAB */}
        {tab === 'scanner' && (
          <>
            <UrlInput onScan={scan} loading={loading} />
            {error && <div style={{ marginTop: 12 }}><ErrorBanner error={error} /></div>}
            {result && (
              <>
                <div style={{ marginTop: 16 }}><ScanResultCard result={result} /></div>
                <button onClick={reset} style={{
                  width: '100%', marginTop: 12, background: 'none',
                  border: '1px solid #1e293b', borderRadius: 10, padding: '10px 0',
                  color: '#6366f1', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  ← Scan Another URL
                </button>
              </>
            )}
          </>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600, margin: 0, fontFamily: 'Syne' }}>
                Threat Log
              </p>
              {threats.length > 0 && (
                <button onClick={clear} style={{
                  background: '#ef444410', color: '#ef4444', border: '1px solid #ef444430',
                  borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                }}>
                  Clear All
                </button>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <ThreatFilters active={activeFilter} onChange={applyFilter} />
            </div>

            {threatError && (
              <div style={{ marginBottom: 12 }}>
                <ErrorBanner error={{ message: threatError, retryable: true }} onRetry={() => load()} />
              </div>
            )}

            {threatLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[0, 1, 2, 4].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : threats.length === 0 ? (
              <EmptyState
                icon="🛡️"
                title="No threats detected"
                description="Scanned URLs that score above 30 will appear here."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {threats.map(t => <ThreatCard key={t.id} threat={t} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
