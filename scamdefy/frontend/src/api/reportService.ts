import { apiClient } from './client';
import { MessageAnalysis } from '../types';

export async function reportUrl(url: string, reason: string, notes?: string) {
  const resp = await apiClient.post('/api/report', { url, reason, notes });
  return resp.data;
}

export async function analyzeMessage(text: string): Promise<MessageAnalysis> {
  const resp = await apiClient.post<MessageAnalysis>('/api/analyze-message', { text });
  return resp.data;
}
