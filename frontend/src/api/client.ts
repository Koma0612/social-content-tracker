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

export type CreateContentInput = Partial<
  Omit<ContentRecord, 'id' | 'created_at' | 'updated_at' | 'current_status' | 'status_entered_at'>
> & {
  platform: string;
  topic: string;
};

export async function createContent(input: CreateContentInput): Promise<ContentRecord> {
  const res = await fetch(`${API_BASE}/contents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `保存失败: ${res.status}`);
  }

  return res.json();
}
