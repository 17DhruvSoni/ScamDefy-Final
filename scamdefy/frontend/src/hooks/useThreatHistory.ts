import { useState, useCallback, useEffect } from 'react';
import { getThreats, clearThreats, getStats } from '../api/threatService';
import { useAppStore } from '../store/appStore';

export function useThreatHistory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('');
  const { threats, setThreats, setStats, addToast } = useAppStore();

  const load = useCallback(async (riskLevel?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [data, stats] = await Promise.all([
        getThreats(50, riskLevel || undefined),
        getStats(),
      ]);
      setThreats(data.threats);
      setStats(stats.total_blocked, stats.today_detected);
    } catch (err: any) {
      const msg = err.message || 'Failed to load threats';
      setError(msg);
      console.error('[ScamDefy][useThreatHistory]', err);
    } finally {
      setLoading(false);
    }
  }, [setThreats, setStats]);

  const clear = useCallback(async () => {
    try {
      await clearThreats();
      setThreats([]);
      setStats(0, 0);
      addToast('success', 'Threat history cleared');
    } catch (err: any) {
      addToast('error', 'Failed to clear history');
      console.error('[ScamDefy][useThreatHistory clear]', err);
    }
  }, [setThreats, setStats, addToast]);

  const applyFilter = (f: string) => {
    setActiveFilter(f);
    load(f || undefined);
  };

  useEffect(() => { load(); }, [load]);
  return { threats, loading, error, load, clear, activeFilter, applyFilter };
}
