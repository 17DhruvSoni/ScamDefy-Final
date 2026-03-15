import React from 'react';
import { VoiceResult as VR } from '../../types';

export function VoiceResult({ result }: { result: VR }) {
  const isSynthetic = result.verdict === 'SYNTHETIC';
  const isReal = result.verdict === 'REAL';
  const color = isSynthetic ? '#ef4444' : isReal ? '#22c55e' : '#f59e0b';
  const icon = isSynthetic ? '🤖' : isReal ? '✅' : '❓';

  return (
    <div className="slide-up" style={{
      background: '#111827', border: `1px solid ${color}30`,
      borderRadius: 16, padding: 20,
      boxShadow: `0 0 24px ${color}15`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 48, flexShrink: 0 }}>{icon}</span>
        <div>
          <p style={{ color, fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'Syne' }}>
            {isSynthetic ? 'AI VOICE DETECTED' : isReal ? 'VOICE APPEARS REAL' : 'INCONCLUSIVE'}
          </p>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
            {result.confidence_pct}% confidence
          </p>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
          <span>Confidence</span>
          <span style={{ color, fontWeight: 700 }}>{result.confidence_pct}%</span>
        </div>
        <div style={{ height: 6, background: '#1e293b', borderRadius: 9999 }}>
          <div style={{
            height: '100%', width: `${result.confidence_pct}%`, background: color,
            borderRadius: 9999, transition: 'width 0.6s ease-out',
          }} />
        </div>
      </div>

      {isSynthetic && (
        <div style={{
          background: '#ef444410', borderRadius: 8, padding: 12, marginTop: 14,
          borderLeft: '3px solid #ef4444',
        }}>
          <p style={{ color: '#ef4444', fontSize: 13, margin: 0, fontWeight: 600 }}>⚠️ Hang up immediately.</p>
          <p style={{ color: '#94a3b8', fontSize: 12, margin: '4px 0 0', lineHeight: 1.6 }}>
            Do not share personal or financial information. This voice shows signs of AI generation or cloning.
          </p>
        </div>
      )}

      {result.warning && (
        <p style={{
          color: '#f59e0b', fontSize: 11, marginTop: 12,
          background: '#f59e0b10', borderRadius: 6, padding: '6px 10px',
        }}>
          ⚠️ {result.warning}
        </p>
      )}

      {!result.model_loaded && (
        <p style={{ color: '#475569', fontSize: 11, marginTop: 8 }}>
          Note: No trained weights found — results are indicative only.
          Train the model with real/synthetic audio for production accuracy.
        </p>
      )}
    </div>
  );
}
