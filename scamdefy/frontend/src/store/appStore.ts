import { create } from 'zustand';
import { ScanResult, ThreatEntry, HealthStatus } from '../types';

interface Toast { id: string; type: string; message: string; }

interface AppState {
  health: HealthStatus | null;
  setHealth: (h: HealthStatus) => void;
  recentScans: ScanResult[];
  addScan: (s: ScanResult) => void;
  threats: ThreatEntry[];
  setThreats: (t: ThreatEntry[]) => void;
  totalBlocked: number;
  todayBlocked: number;
  setStats: (total: number, today: number) => void;
  toasts: Toast[];
  addToast: (type: string, message: string) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  health: null,
  setHealth: (health) => set({ health }),
  recentScans: [],
  addScan: (scan) => set(state => ({
    recentScans: [scan, ...state.recentScans].slice(0, 20)
  })),
  threats: [],
  setThreats: (threats) => set({ threats }),
  totalBlocked: 0,
  todayBlocked: 0,
  setStats: (totalBlocked, todayBlocked) => set({ totalBlocked, todayBlocked }),
  toasts: [],
  addToast: (type, message) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    set(state => ({ toasts: [...state.toasts.slice(-2), { id, type, message }] }));
    setTimeout(() => get().removeToast(id), 4000);
  },
  removeToast: (id) => set(state => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),
}));
