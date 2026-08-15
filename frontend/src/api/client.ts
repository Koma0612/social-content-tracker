import {
  ContentRecord,
  ContentStatus,
  ContentWithBlockInfo,
  StatusHistoryRecord,
  ReviewerRole,
  ReviewResult,
  RejectReason,
  ReviewWithReasons,
  DashboardStats,
} from '../types';

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

export interface ContentFilter {
  platform?: string;
  status?: string;
  owner?: string;
  content_type?: string;
}

export async function fetchContents(filter: ContentFilter = {}): Promise<ContentWithBlockInfo[]> {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const qs = params.toString();

  const res = await fetch(`${API_BASE}/contents${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(`获取内容列表失败: ${res.status}`);
  return res.json();
}

export async function fetchContentById(id: number): Promise<ContentWithBlockInfo> {
  const res = await fetch(`${API_BASE}/contents/${id}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `获取内容详情失败: ${res.status}`);
  }
  return res.json();
}

export async function fetchContentHistory(id: number): Promise<StatusHistoryRecord[]> {
  const res = await fetch(`${API_BASE}/contents/${id}/history`);
  if (!res.ok) throw new Error(`获取状态历史失败: ${res.status}`);
  return res.json();
}

export interface TransitionInput {
  to_status: ContentStatus;
  changed_by?: string;
  new_owner?: string;
}

export async function transitionContentStatus(
  id: number,
  input: TransitionInput,
): Promise<ContentWithBlockInfo> {
  const res = await fetch(`${API_BASE}/contents/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `状态变更失败: ${res.status}`);
  }

  return res.json();
}

export async function fetchReviews(contentId: number): Promise<ReviewWithReasons[]> {
  const res = await fetch(`${API_BASE}/contents/${contentId}/reviews`);
  if (!res.ok) throw new Error(`获取审核记录失败: ${res.status}`);
  return res.json();
}

export interface SubmitReviewInput {
  reviewer_role: ReviewerRole;
  reviewer_name?: string;
  result: ReviewResult;
  comment?: string;
  reject_reasons?: RejectReason[];
  rollback_to_status?: ContentStatus;
}

export async function submitReview(
  contentId: number,
  input: SubmitReviewInput,
): Promise<ReviewWithReasons> {
  const res = await fetch(`${API_BASE}/contents/${contentId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `提交审核失败: ${res.status}`);
  }

  return res.json();
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/dashboard`);
  if (!res.ok) throw new Error(`获取看板数据失败: ${res.status}`);
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
