// 内容生产的 7 个环节
export type ContentStatus =
  | '选题'
  | '收集素材'
  | '写文案'
  | '制作'
  | '审核'
  | '排期'
  | '发布';

export const CONTENT_STATUSES: ContentStatus[] = [
  '选题',
  '收集素材',
  '写文案',
  '制作',
  '审核',
  '排期',
  '发布',
];

export type ReviewerRole = '老板' | '同事/mentor' | '英语母语者';

export type ReviewResult = '通过' | '打回';

export type RejectReason =
  | '语言准确性'
  | '本地化表达'
  | '受众适配'
  | '视听呈现'
  | '内容结构';

export const REJECT_REASONS: RejectReason[] = [
  '语言准确性',
  '本地化表达',
  '受众适配',
  '视听呈现',
  '内容结构',
];

export interface ContentRecord {
  id: number;

  planned_publish_date: string | null;
  platform: string;
  topic: string;
  content_type: string | null;
  content_format: string | null;
  content_goal: string | null;
  campaign: string | null;
  language_market: string | null;
  owner: string | null;

  copywriting: string | null;
  material_source: string | null;
  current_status: ContentStatus;
  status_entered_at: string;
  current_owner: string | null;
  is_paid_promotion: number; // sqlite 无原生 boolean，0/1 存储
  paid_amount: number | null;

  actual_publish_date: string | null;
  publish_url: string | null;
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  dm_count: number | null;
  new_followers: number | null;
  metrics_captured_at: string | null;

  created_at: string;
  updated_at: string;
}

export type TransitionType = '正常推进' | '审核回退';

export interface StatusHistoryRecord {
  id: number;
  content_id: number;
  from_status: ContentStatus | null;
  to_status: ContentStatus;
  transition_type: TransitionType;
  changed_by: string | null;
  changed_at: string;
}

export interface ContentWithBlockInfo extends ContentRecord {
  blocked_days: number;
  is_blocked: boolean;
}

export interface ReviewRecord {
  id: number;
  content_id: number;
  reviewer_role: ReviewerRole;
  round_number: number;
  result: ReviewResult;
  comment: string | null;
  reviewed_at: string;
}

export interface ReviewWithReasons extends ReviewRecord {
  reject_reasons: RejectReason[];
}
