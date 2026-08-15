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
  dm_count: number | null;
  new_followers: number | null;
  metrics_captured_at: string | null;
  created_at: string;
  updated_at: string;
}
