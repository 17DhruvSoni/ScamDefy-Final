import { useState } from 'react';
import { ENV } from '../config/env';

const STORAGE_KEY = 'scamdefy_settings';

interface Settings {
  backendUrl: string;
  protectionLevel: 'conservative' | 'balanced' | 'aggressive';
  geminiKey: string;
  gsbKey: string;
  ipqsKey: string;
  vtKey: string;
}

const DEFAULTS: Settings = {
  backendUrl: ENV.API_BASE,
  protectionLevel: 'balanced',
  geminiKey: '',
  gsbKey: '',
  ipqsKey: '',
  vtKey: '',
};

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch { return DEFAULTS; }
  });

  const save = (updates: Partial<Settings>) => {
    const next = { ...settings, ...updates };
    setSettingsState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const clear = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setSettingsState(DEFAULTS);
  };

  return { settings, save, clear };
}
