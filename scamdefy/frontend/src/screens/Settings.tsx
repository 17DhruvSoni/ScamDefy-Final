import React, { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { getHealth } from '../api/threatService';
import { clearThreats } from '../api/threatService';
import { useAppStore } from '../store/appStore';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorBanner } from '../components/ui/ErrorBanner';

export function Settings() {
  const { settings, save, clear } = useSettings();
  const { addToast, setThreats, setStats } = useAppStore();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Local state for inputs
  const [local, setLocal] = useState({ ...settings });

  const handleSave = () => {
    save(local);
    addToast('success', 'Settings saved');
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setTestError(null);
    const start = Date.now();
    try {
      const data = await getHealth();
      setTestResult({ ...data, latencyMs: Date.now() - start });
    } catch (err: any) {
      setTestError(err.message || 'Cannot reach backend');
      console.error('[ScamDefy][Settings testConnection]', err);
    } finally {
      setTesting(false);
    }
  };

  const handleClearHistory = async () => {
    if (!clearConfirm) { setClearConfirm(true); return; }
    try {
      await clearThreats();
      setThreats([]);
      setStats(0, 0);
      addToast('success', 'All threat history cleared');
      setClearConfirm(false);
    } catch (err: any) {
      addToast('error', 'Failed to clear history');
      console.error('[ScamDefy][Settings clearHistory]', err);
    }
  };

  const toggleShow = (key: string) => setShowKeys(p => ({ ...p, [key]: !p[key] }));

  const keyFields = [
    { key: 'geminiKey',  label: 'Gemini API Key',           required: true,  link: 'https://aistudio.google.com/app/apikey' },
    { key: 'gsbKey',     label: 'Google Safe Browsing Key',  required: false, link: 'https://console.cloud.google.com' },
    { key: 'ipqsKey',    label: 'IPQualityScore Key',         required: false, link: 'https://ipqualityscore.com/create-account' },
    { key: 'vtKey',      label: 'VirusTotal Key',             required: false, link: 'https://virustotal.com/gui/join-us' },
  ];

  const section = (title: string) => (
    <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px' }}>
      {title}
    </p>
  );

  const sectionWrap = (children: React.ReactNode) => (
    <div style={{
      background: '#111827', border: '1px solid #1e293b', borderRadius: 14, padding: 16, marginBottom: 16,
    }}>
      {children}
    </div>
  );

  return (
    <div className="screen-enter" style={{ padding: '52px 16px 80px', maxWidth: 430, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 20px', fontFamily: 'Syne' }}>⚙️ Settings</h1>

      {/* API Keys */}
      {sectionWrap(<>
        {section('API Keys')}
        <p style={{ color: '#94a3b8', fontSize: 12, margin: '0 0 14px', lineHeight: 1.6 }}>
          Keys are stored locally on your device. Add them in the backend <code style={{ color: '#6366f1' }}>.env</code> file.
        </p>
        {keyFields.map(field => {
          const val = (local as any)[field.key] ?? '';
          return (
            <div key={field.key} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <label style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500 }}>
                  {field.label}
                  {field.required && (
                    <span style={{
                      marginLeft: 6, fontSize: 10, color: !val ? '#ef4444' : '#22c55e',
                      background: !val ? '#ef444415' : '#22c55e15',
                      border: `1px solid ${!val ? '#ef444430' : '#22c55e30'}`,
                      padding: '1px 6px', borderRadius: 9999,
                    }}>
                      {!val ? 'MISSING' : 'SET'}
                    </span>
                  )}
                </label>
                <a href={field.link} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', fontSize: 10 }}>
                  Get key →
                </a>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type={showKeys[field.key] ? 'text' : 'password'}
                  value={val}
                  onChange={e => setLocal(p => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={`Enter ${field.label}`}
                  style={{
                    flex: 1, background: '#0a0f1e', border: '1px solid #1e293b',
                    borderRadius: 8, padding: '9px 12px', color: '#f1f5f9',
                    fontSize: 12, fontFamily: 'monospace',
                  }}
                />
                <button onClick={() => toggleShow(field.key)} style={{
                  background: '#1e293b', border: '1px solid #2d3748', borderRadius: 8,
                  padding: '0 10px', cursor: 'pointer', fontSize: 14,
                }}>
                  {showKeys[field.key] ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          );
        })}
        <button onClick={handleSave} style={{
          width: '100%', background: '#6366f1', color: '#fff', border: 'none',
          borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          marginTop: 4,
        }}>
          Save Keys
        </button>
      </>)}

      {/* Backend Connection */}
      {sectionWrap(<>
        {section('Backend Connection')}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={local.backendUrl}
            onChange={e => setLocal(p => ({ ...p, backendUrl: e.target.value }))}
            style={{
              flex: 1, background: '#0a0f1e', border: '1px solid #1e293b',
              borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 12, fontFamily: 'monospace',
            }}
          />
          <button onClick={handleTest} disabled={testing} style={{
            background: testing ? '#1e293b' : '#6366f110', color: '#6366f1',
            border: '1px solid #6366f130', borderRadius: 8, padding: '0 14px',
            fontSize: 13, cursor: testing ? 'not-allowed' : 'pointer', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          }}>
            {testing ? <><LoadingSpinner size="sm" /> Testing</> : 'Test'}
          </button>
        </div>
        {testError && <ErrorBanner error={{ message: testError, retryable: true }} onRetry={handleTest} />}
        {testResult && (
          <div style={{
            background: '#22c55e10', border: '1px solid #22c55e30', borderRadius: 8, padding: 12,
          }}>
            <p style={{ color: '#22c55e', fontSize: 12, fontWeight: 600, margin: '0 0 4px' }}>
              ✓ Connected — {testResult.latencyMs}ms
            </p>
            <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>
              Backend v{testResult.version} · {Object.values(testResult.modules).filter(Boolean).length}/{Object.keys(testResult.modules).length} modules active
            </p>
          </div>
        )}
      </>)}

      {/* Protection Level */}
      {sectionWrap(<>
        {section('Protection Level')}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['conservative', 'balanced', 'aggressive'] as const).map(level => (
            <button key={level} onClick={() => setLocal(p => ({ ...p, protectionLevel: level }))} style={{
              flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', border: '1px solid', textTransform: 'capitalize',
              borderColor: local.protectionLevel === level ? '#6366f1' : '#1e293b',
              background: local.protectionLevel === level ? '#6366f115' : 'transparent',
              color: local.protectionLevel === level ? '#6366f1' : '#94a3b8',
              transition: 'all 0.15s',
            }}>
              {level === 'conservative' ? '🟡' : level === 'balanced' ? '🟠' : '🔴'}{' '}
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
        <p style={{ color: '#475569', fontSize: 11, margin: '10px 0 0', lineHeight: 1.6 }}>
          {local.protectionLevel === 'conservative' ? 'Only block confirmed threats (score ≥ 80). Fewer false positives.' :
           local.protectionLevel === 'balanced' ? 'Block at ≥ 80, warn at ≥ 30. Recommended for most users.' :
           'Warn at any non-zero risk score. Maximum protection, may flag legitimate sites.'}
        </p>
        <button onClick={handleSave} style={{
          marginTop: 12, background: '#6366f1', color: '#fff', border: 'none',
          borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          Save
        </button>
      </>)}

      {/* About */}
      {sectionWrap(<>
        {section('About')}
        <p style={{ color: '#94a3b8', fontSize: 12, margin: 0, lineHeight: 1.8 }}>
          ScamDefy v1.0.0<br />
          AI-powered scam protection for URLs, calls, and messages.<br />
          Built with FastAPI + React + Gemini AI.
        </p>
      </>)}

      {/* Danger Zone */}
      <div style={{
        background: '#ef444408', border: '1px solid #ef444430', borderRadius: 14, padding: 16,
      }}>
        {section('Danger Zone')}
        <button onClick={handleClearHistory} style={{
          width: '100%', background: clearConfirm ? '#ef4444' : '#ef444415',
          color: clearConfirm ? '#fff' : '#ef4444',
          border: '1px solid #ef444440', borderRadius: 8, padding: '10px 0',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
        }}>
          {clearConfirm ? '⚠️ Confirm — This cannot be undone' : '🗑️ Clear All Threat History'}
        </button>
        {clearConfirm && (
          <button onClick={() => setClearConfirm(false)} style={{
            width: '100%', marginTop: 6, background: 'none', border: '1px solid #1e293b',
            color: '#94a3b8', borderRadius: 8, padding: '8px 0', fontSize: 12, cursor: 'pointer',
          }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
