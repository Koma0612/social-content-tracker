// 与后端 backend/src/types/index.ts 保持一致。
// 阶段一先只放用得到的最小子集，阶段二录入表单会逐步补全。

export type ContentStatus =
  | '选题'
  | '收集素材'
  | '写文案'
  | '制作'
  | '审核'
  | '排期'
  | '发布';

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
  is_paid_promotion: number;
  paid_amount: number | null;
  actual_publish_date: string | null;
  publish_url: string | null;
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  dm_count: number | null;
  new_followers: number | null;
  metrics_captured_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentWithBlockInfo extends ContentRecord {
  blocked_days: number;
  is_blocked: boolean;
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

export type ReviewerRole = '老板' | '同事/mentor' | '英语母语者';
export type ReviewResult = '通过' | '打回';
export type RejectReason = '语言准确性' | '本地化表达' | '受众适配' | '视听呈现' | '内容结构';

export interface ReviewRecord {
  id: number;
  content_id: number;
  reviewer_role: ReviewerRole;
  reviewer_name: string | null;
  round_number: number;
  result: ReviewResult;
  comment: string | null;
  reviewed_at: string;
}

export interface ReviewWithReasons extends ReviewRecord {
  reject_reasons: RejectReason[];
}

export interface BlockedSummary {
  total_blocked: number;
  by_status: { status: ContentStatus; count: number }[];
}

export interface ContentGoalPerformance {
  content_goal: string;
  count: number;
  avg_impressions: number | null;
  avg_engagement: number | null;
  avg_dm_count: number | null;
  avg_new_followers: number | null;
}

export interface PlatformGoalPerformance {
  platform: string;
  content_goal: string;
  sample_size: number;
  avg_impressions: number | null;
  avg_likes: number | null;
  avg_comments: number | null;
  avg_shares: number | null;
  avg_saves: number | null;
  avg_dm_count: number | null;
  avg_new_followers: number | null;
}

export interface RejectReasonCount {
  reason: RejectReason;
  count: number;
}

export interface PublishRhythm {
  platform: string;
  planned_count: number;
  published_count: number;
}

export interface DashboardStats {
  blocked_summary: BlockedSummary;
  content_goal_performance: ContentGoalPerformance[];
  platform_goal_performance: PlatformGoalPerformance[];
  avg_review_rounds: number | null;
  reject_reason_distribution: RejectReasonCount[];
  publish_rhythm: PublishRhythm[];
}
