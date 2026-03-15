import React, { useEffect, useState } from 'react';
import { useUrlScan } from '../hooks/useUrlScan';
import { useAppStore } from '../store/appStore';
import { getHealth, getStats } from '../api/threatService';
import { UrlInput } from '../components/scanner/UrlInput';
import { ScanResultCard } from '../components/scanner/ScanResultCard';
import { ThreatCard } from '../components/threats/ThreatCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SkeletonCard } from '../components/ui/SkeletonCard';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { HealthStatus } from '../types';

export function Dashboard() {
  const { result, loading: scanLoading, error: scanError, scan } = useUrlScan();
  const { health, setHealth, recentScans, threats, totalBlocked, todayBlocked, setStats } = useAppStore();
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [backendAlive, setBackendAlive] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const [healthData, statsData] = await Promise.all([
          getHealth(),
          getStats(),
        ]);
        if (!cancelled) {
          setHealth(healthData);
          setStats(statsData.total_blocked, statsData.today_detected);
          setBackendAlive(true);
        }
      } catch (err: any) {
        if (!cancelled) {
          setStatsError(err.message || 'Cannot reach backend');
          setBackendAlive(false);
          console.error('[ScamDefy][Dashboard]', err);
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [setHealth, setStats]);

  const MODULE_ICONS: Record<string, string> = {
    gemini: '🤖', google_safe_browsing: '🔍', ipqualityscore: '📊',
    virustotal: '🦠', database: '🗄️', urlhaus: '🕷️', threatfox: '🦊', voice: '🎙️',
  };

  return (
    <div className="screen-enter" style={{ padding: '52px 16px 80px', maxWidth: 430, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>🛡️</span>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, fontFamily: 'Syne' }}>ScamDefy</h1>
            <span style={{ fontSize: 10, color: '#475569' }}>v1.0.0</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: backendAlive === true ? '#22c55e' : backendAlive === false ? '#ef4444' : '#f59e0b',
            animation: backendAlive === true ? 'pulse 2s infinite' : 'none',
            boxShadow: backendAlive === true ? '0 0 6px #22c55e' : 'none',
          }} />
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            {backendAlive === true ? 'Protected' : backendAlive === false ? 'Offline' : 'Checking...'}
          </span>
        </div>
      </div>

      {/* Backend error */}
      {statsError && (
        <div style={{ marginBottom: 16 }}>
          <ErrorBanner
            error={{ message: `Backend unreachable: ${statsError}. Is the server running on port 8000?`, retryable: true }}
            onRetry={() => window.location.reload()}
          />
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        {statsLoading ? (
          [0, 1, 2].map(i => <SkeletonCard key={i} height={70} />)
        ) : (
          <>
            {[
              { label: "Today's Threats", value: todayBlocked, color: '#f97316' },
              { label: 'Total Blocked',   value: totalBlocked, color: '#ef4444' },
              { label: 'Protection',      value: backendAlive ? '✓' : '✗', color: backendAlive ? '#22c55e' : '#ef4444' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#111827', border: '1px solid #1e293b', borderRadius: 10, padding: '12px 10px',
              }}>
                <p style={{ color: stat.color, fontSize: 22, fontWeight: 800, margin: 0, fontFamily: 'Syne' }}>
                  {stat.value}
                </p>
                <p style={{ color: '#94a3b8', fontSize: 10, margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Quick Scan */}
      <div style={{ marginBottom: 16 }}>
        <UrlInput onScan={scan} loading={scanLoading} />
      </div>

      {/* Scan error */}
      {scanError && (
        <div style={{ marginBottom: 12 }}>
          <ErrorBanner error={scanError} />
        </div>
      )}

      {/* Last Scan Result */}
      {result && (
        <div style={{ marginBottom: 20 }}>
          <ScanResultCard result={result} />
        </div>
      )}

      {/* Recent Threats */}
      {threats.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            Recent Threats
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {threats.slice(0, 3).map(t => <ThreatCard key={t.id} threat={t} />)}
          </div>
        </div>
      )}

      {/* Module Health Grid */}
      {health && (
        <div>
          <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            Module Status
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {Object.entries(health.modules).map(([mod, active]) => (
              <div key={mod} style={{
                background: '#111827', border: `1px solid ${active ? '#22c55e20' : '#f59e0b20'}`,
                borderRadius: 8, padding: '8px 12px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>{MODULE_ICONS[mod] || '⚙️'}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: '#f1f5f9', fontSize: 11, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mod.replace(/_/g, ' ')}
                  </p>
                  <p style={{ fontSize: 10, margin: 0, color: active ? '#22c55e' : '#f59e0b' }}>
                    {active ? 'ACTIVE' : 'NO KEY'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
