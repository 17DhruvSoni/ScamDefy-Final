import { apiClient } from './client';
import type { ScanResult } from '../types';

export async function scanUrl(url: string): Promise<ScanResult> {
  const response = await apiClient.post<ScanResult>('/api/scan', { url });
  return response.data;
}

export async function getScan(id: string): Promise<ScanResult> {
  const response = await apiClient.get<ScanResult>(`/api/scan/${id}`);
  return response.data;
}
