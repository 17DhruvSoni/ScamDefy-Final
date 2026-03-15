import React, { useState } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function UrlInput({ onScan, loading }: { onScan: (url: string) => void; loading: boolean }) {
  const [url, setUrl] = useState('');

  const handleScan = () => { if (url.trim() && !loading) onScan(url.trim()); };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text.trim());
    } catch {
      // clipboard API not available — user pastes manually
    }
  };

  return (
    <div style={{
      background: '#111827', border: '1px solid #1e293b', borderRadius: 14,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🔗</span>
        <span style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600, fontFamily: 'Syne' }}>Scan a URL</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleScan()}
          placeholder="Paste any suspicious URL here..."
          style={{
            flex: 1, background: '#0a0f1e', border: '1px solid #1e293b',
            borderRadius: 8, padding: '10px 12px', color: '#f1f5f9',
            fontSize: 13, fontFamily: 'JetBrains Mono, monospace',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => (e.target.style.borderColor = '#6366f1')}
          onBlur={e => (e.target.style.borderColor = '#1e293b')}
        />
        <button onClick={handlePaste} title="Paste from clipboard" style={{
          background: '#1e293b', border: '1px solid #2d3748', color: '#94a3b8',
          borderRadius: 8, padding: '0 12px', cursor: 'pointer', fontSize: 18,
          transition: 'background 0.15s',
        }}>
          📋
        </button>
      </div>
      <button
        onClick={handleScan}
        disabled={!url.trim() || loading}
        style={{
          background: loading || !url.trim() ? '#1e293b' : '#6366f1',
          color: loading || !url.trim() ? '#475569' : '#fff',
          border: 'none', borderRadius: 10, padding: '12px 0',
          fontSize: 14, fontWeight: 600, cursor: !url.trim() || loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
        {loading ? <><LoadingSpinner size="sm" color="#94a3b8" /> Scanning...</> : '🔍 Scan Now'}
      </button>
    </div>
  );
}
