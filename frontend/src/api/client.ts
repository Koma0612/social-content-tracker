import { ContentRecord } from '../types';

const API_BASE = '/api';

export interface HealthResponse {
  status: string;
  time: string;
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`健康检查失败: ${res.status}`);
  return res.json();
}

export async function fetchContents(): Promise<ContentRecord[]> {
  const res = await fetch(`${API_BASE}/contents`);
  if (!res.ok) throw new Error(`获取内容列表失败: ${res.status}`);
  return res.json();
}
