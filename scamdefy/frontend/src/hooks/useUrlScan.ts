import { useState, useCallback } from 'react';
import { ScanResult, AppError } from '../types';
import { scanUrl } from '../api/scanService';
import { useAppStore } from '../store/appStore';

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
      console.error('[ScamDefy][useUrlScan]', err);
    } finally {
      setLoading(false);
    }
  }, [addScan, addToast]);

  const reset = useCallback(() => { setResult(null); setError(null); }, []);
  return { result, loading, error, scan, reset };
}
