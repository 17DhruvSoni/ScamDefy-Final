import React, { useState } from 'react';
import { ScanResult } from '../../types';
import { RiskBadge } from '../ui/RiskBadge';
import { ScoreGauge } from '../ui/ScoreGauge';
import { ThreatBreakdown } from './ThreatBreakdown';
import { reportUrl } from '../../api/reportService';
import { useAppStore } from '../../store/appStore';

export function ScanResultCard({ result }: { result: ScanResult }) {
  const [expanded, setExpanded] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('false_positive');
  const [reportNotes, setReportNotes] = useState('');
  const [reporting, setReporting] = useState(false);
  const { addToast } = useAppStore();

  const glows: Record<string, string> = {
    SAFE:    '0 0 24px rgba(34,197,94,0.1)',
    CAUTION: '0 0 24px rgba(245,158,11,0.1)',
    DANGER:  '0 0 24px rgba(249,115,22,0.15)',
    BLOCKED: '0 0 30px rgba(239,68,68,0.2)',
  };

  const submitReport = async () => {
    setReporting(true);
    try {
      await reportUrl(result.url, reportReason, reportNotes);
      addToast('success', 'Report submitted — thank you!');
      setReportOpen(false);
      setReportNotes('');
    } catch (err: any) {
      addToast('error', 'Failed to submit report');
      console.error('[ScamDefy][ScanResultCard report]', err);
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="slide-up" style={{
      background: '#111827', border: '1px solid #1e293b',
      borderRadius: 16, padding: 16,
      boxShadow: glows[result.verdict] ?? glows.CAUTION,
    }}>
      {/* Score + Info Row */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <ScoreGauge score={result.score} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <RiskBadge verdict={result.verdict} />
          <p style={{
            color: '#f1f5f9', fontSize: 12, fontWeight: 600, margin: '8px 0 4px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {result.final_url}
          </p>
          <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>
            {result.scam_type} · {result.scan_time_ms}ms{result.cached ? ' · cached' : ''}
          </p>
        </div>
      </div>

      {/* AI Explanation */}
      {result.explanation && (
        <div style={{
          background: '#0a0f1e', borderRadius: 8, padding: 12, marginTop: 12,
          borderLeft: `3px solid ${result.color}`,
        }}>
          <p style={{ color: '#94a3b8', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
            🤖 <em>{result.explanation}</em>
          </p>
        </div>
      )}

      {/* Expand signals */}
      {result.signals.length > 0 && (
        <button onClick={() => setExpanded(!expanded)} style={{
          background: 'none', border: 'none', color: '#6366f1',
          fontSize: 12, cursor: 'pointer', padding: '8px 0 0',
          fontWeight: 600,
        }}>
          {expanded ? '▲ Hide' : '▼ Show'} {result.signals.length} signals
        </button>
      )}
      {expanded && <ThreatBreakdown signals={result.signals} />}

      {/* Report Button */}
      <button onClick={() => setReportOpen(!reportOpen)} style={{
        background: 'none', border: '1px solid #1e293b', color: '#475569',
        fontSize: 11, cursor: 'pointer', padding: '5px 10px',
        borderRadius: 6, marginTop: 10, display: 'block',
        transition: 'color 0.15s, border-color 0.15s',
      }}
        onMouseEnter={e => { (e.target as HTMLButtonElement).style.color = '#94a3b8'; }}
        onMouseLeave={e => { (e.target as HTMLButtonElement).style.color = '#475569'; }}
      >
        Report false result
      </button>

      {/* Report Modal */}
      {reportOpen && (
        <div style={{
          background: '#0a0f1e', borderRadius: 10, padding: 14, marginTop: 8,
          border: '1px solid #1e293b',
        }}>
          <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            Report this result
          </p>
          <select
            value={reportReason}
            onChange={e => setReportReason(e.target.value)}
            style={{
              width: '100%', background: '#111827', border: '1px solid #1e293b',
              borderRadius: 6, padding: '8px 10px', color: '#f1f5f9', fontSize: 13, marginBottom: 8,
            }}>
            <option value="false_positive">False positive — URL is safe</option>
            <option value="missed_threat">Missed threat — URL is dangerous</option>
            <option value="other">Other</option>
          </select>
          <textarea
            value={reportNotes}
            onChange={e => setReportNotes(e.target.value)}
            placeholder="Additional notes (optional)"
            rows={2}
            style={{
              width: '100%', background: '#111827', border: '1px solid #1e293b',
              borderRadius: 6, padding: '8px 10px', color: '#f1f5f9', fontSize: 13,
              resize: 'vertical', marginBottom: 8,
            }}
          />
          <button onClick={submitReport} disabled={reporting} style={{
            background: reporting ? '#1e293b' : '#6366f1', color: reporting ? '#475569' : '#fff',
            border: 'none', borderRadius: 6, padding: '8px 16px',
            fontSize: 13, fontWeight: 600, cursor: reporting ? 'not-allowed' : 'pointer',
          }}>
            {reporting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      )}
    </div>
  );
}
