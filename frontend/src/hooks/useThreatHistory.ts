import { useState, useCallback, useEffect } from 'react';
import { getThreats, clearThreats, getStats } from '../api/threatService';
import { useAppStore } from '../store/appStore';
import type { ThreatEntry } from '../types';

const THREATS_STORAGE_KEY = 'scamdefy_threats';

function loadLocalThreats(): ThreatEntry[] {
  try {
    return JSON.parse(localStorage.getItem(THREATS_STORAGE_KEY) || '[]');
  } catch { return []; }
}

export function useThreatHistory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('');
  const { threats, setThreats, setStats, addToast } = useAppStore();

  const load = useCallback(async (riskLevel?: string) => {
    setLoading(true);
    setError(null);
    try {
      // Always load localStorage threats first for instant display
      let localThreats = loadLocalThreats();
      if (riskLevel) localThreats = localThreats.filter(t => t.risk_level === riskLevel);
      setThreats(localThreats);

      // Then try backend (may have additional entries from extension)
      const [data, stats] = await Promise.all([
        getThreats(50, riskLevel || undefined),
        getStats(),
      ]);

      // Merge: backend threats take precedence, deduplicate by id
      const backendThreats = data.threats;
      const localIds = new Set(backendThreats.map((t: ThreatEntry) => t.id));
      const merged = [...backendThreats, ...localThreats.filter(t => !localIds.has(t.id))];
      // Sort newest first
      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setThreats(merged.slice(0, 50));
      setStats(stats.total_blocked, stats.today_detected);
    } catch {
      // Backend unavailable — fall back to localStorage only
      const localThreats = loadLocalThreats();
      if (riskLevel) setThreats(localThreats.filter(t => t.risk_level === riskLevel));
      else setThreats(localThreats);
      setError(null); // don't show error if we have local data
    } finally {
      setLoading(false);
    }
  }, [setThreats, setStats]);

  const clear = useCallback(async () => {
    try {
      await clearThreats();
    } catch {}
    // Always clear localStorage regardless of backend result
    try { localStorage.removeItem(THREATS_STORAGE_KEY); } catch {}
    setThreats([]);
    setStats(0, 0);
    addToast('success', 'Threat history cleared');
  }, [setThreats, setStats, addToast]);

  const applyFilter = (f: string) => {
    setActiveFilter(f);
    load(f || undefined);
  };

  useEffect(() => { load(); }, [load]);
  return { threats, loading, error, load, clear, activeFilter, applyFilter };
}
