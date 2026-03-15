import { useState, useCallback } from 'react';
import type { ScanResult, AppError, ThreatEntry } from '../types';
import { scanUrl } from '../api/scanService';
import { apiClient } from '../api/client';
import { useAppStore } from '../store/appStore';

const THREATS_STORAGE_KEY = 'scamdefy_threats';

function saveThreatLocally(threat: ThreatEntry) {
  try {
    const existing: ThreatEntry[] = JSON.parse(localStorage.getItem(THREATS_STORAGE_KEY) || '[]');
    const updated = [threat, ...existing].slice(0, 100); // keep last 100
    localStorage.setItem(THREATS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

function scanResultToThreat(result: ScanResult): ThreatEntry | null {
  if (result.score < 30) return null; // only log threats
  return {
    id: result.id,
    url: result.url,
    risk_level: result.risk_level,
    score: result.score,
    scam_type: result.scam_type,
    explanation: result.explanation || '',
    signals: result.signals.map((s: any) => typeof s === 'string' ? s : s.name) || [],
    user_proceeded: false,
    blocked: result.should_block,
    timestamp: result.timestamp,
  };
}

export function useUrlScan() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const { addScan, addToast } = useAppStore();

  const scan = useCallback(async (url: string) => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await scanUrl(url.trim());
      setResult(data);
      addScan(data);

      // Persist threat if score >= 30
      const threat = scanResultToThreat(data);
      if (threat) {
        saveThreatLocally(threat);
        // Best-effort push to backend (fire and forget — don't block UI)
        apiClient.post('/api/threats', threat).catch(() => {});
      }

      if (data.should_block) {
        addToast('error', `🚫 Blocked: ${data.scam_type} (${data.score}/100)`);
      } else if (data.score >= 30) {
        addToast('warning', `⚠️ Caution: ${data.scam_type} (${data.score}/100)`);
      } else {
        addToast('success', `✓ URL appears safe (${data.score}/100)`);
      }
    } catch (err: any) {
      const appError: AppError = { message: err.message || 'Scan failed. Check backend connection.', retryable: true };
      setError(appError);
      addToast('error', appError.message);
    } finally {
      setLoading(false);
    }
  }, [addScan, addToast]);

  const reset = useCallback(() => { setResult(null); setError(null); }, []);
  return { result, loading, error, scan, reset };
}
