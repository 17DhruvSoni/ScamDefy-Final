import { useState, useCallback } from 'react';
import { VoiceResult } from '../types';
import { analyzeVoice } from '../api/voiceService';
import { useAppStore } from '../store/appStore';

export function useVoiceAnalysis() {
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { addToast } = useAppStore();

  const analyze = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(20);
    try {
      setProgress(50);
      const data = await analyzeVoice(file);
      setProgress(100);
      setResult(data);
      if (data.verdict === 'SYNTHETIC') {
        addToast('error', `🤖 AI voice detected — ${data.confidence_pct}% confidence`);
      } else if (data.verdict === 'REAL') {
        addToast('success', `✓ Voice appears real — ${data.confidence_pct}% confidence`);
      } else {
        addToast('warning', 'Voice analysis inconclusive');
      }
    } catch (err: any) {
      const msg = err.message || 'Voice analysis failed';
      setError(msg);
      addToast('error', msg);
      console.error('[ScamDefy][useVoiceAnalysis]', err);
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 800);
    }
  }, [addToast]);

  return { result, loading, error, progress, analyze };
}
