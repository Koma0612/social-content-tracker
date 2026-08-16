import { db } from '../db/connection';
import { ContentRecord, ContentStatus, RejectReason } from '../types';
import { attachBlockInfo } from './statusService';

export interface BlockedSummary {
  total_blocked: number;
  by_status: { status: ContentStatus; count: number }[];
}

/**
 * 阻塞内容数 + 阻塞环节分布。复用 statusService.attachBlockInfo，
 * 跟内容列表页用的是同一套"阻塞"判定逻辑，口径保持一致。
 */
export function getBlockedSummary(): BlockedSummary {
  const rows = (db.prepare('SELECT * FROM contents').all() as ContentRecord[]).map(attachBlockInfo);
  const blocked = rows.filter((r) => r.is_blocked);

  const counts = new Map<ContentStatus, number>();
  for (const r of blocked) {
    counts.set(r.current_status, (counts.get(r.current_status) ?? 0) + 1);
  }

  return {
    total_blocked: blocked.length,
    by_status: Array.from(counts.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export interface ContentGoalPerformance {
  content_goal: string;
  count: number;
  avg_impressions: number | null;
  avg_engagement: number | null; // 平均 (赞+评论+转发)
  avg_dm_count: number | null;
  avg_new_followers: number | null;
}

/**
 * 按"内容目标"分组比较效果，只统计已经填过复盘数据的内容(用 metrics_captured_at
 * 判断"有没有填过"，而不是用某一个具体指标是否为空来判断——因为不同平台能采集
 * 的指标本来就不一样，用单个指标做筛选条件会漏掉"填了别的指标、但这个指标恰好没有"
 * 的内容)。不同目标看不同指标才有意义——曝光类看 avg_impressions，转化类看
 * avg_dm_count，这里只负责把分组平均值算出来，具体"该看哪一列"由前端展示时引导。
 */
export function getContentGoalPerformance(): ContentGoalPerformance[] {
  const rows = db
    .prepare(
      `SELECT
         content_goal,
         COUNT(*) AS count,
         AVG(impressions) AS avg_impressions,
         AVG(likes + comments + shares) AS avg_engagement,
         AVG(dm_count) AS avg_dm_count,
         AVG(new_followers) AS avg_new_followers
       FROM contents
       WHERE metrics_captured_at IS NOT NULL AND content_goal IS NOT NULL
       GROUP BY content_goal
       ORDER BY count DESC`,
    )
    .all() as ContentGoalPerformance[];

  const round = (n: number | null) => (n === null ? null : Math.round(n));

  return rows.map((r) => ({
    ...r,
    avg_impressions: round(r.avg_impressions),
    avg_engagement: round(r.avg_engagement),
    avg_dm_count: round(r.avg_dm_count),
    avg_new_followers: round(r.avg_new_followers),
  }));
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

/**
 * 平台效率对比：按"平台 × 内容目标"交叉分组，回答"同样类型的内容，发在不同
 * 平台上效果差多少"——这跟 getContentGoalPerformance(只按内容目标分组，不分平台)
 * 是两个不同的切面。样本数(sample_size)会一起返回，前端据此判断是不是"一两条数据
 * 就敢下结论"，样本太少时应该提示"仅供参考"而不是当成可靠结论展示。
 */
export function getPlatformGoalPerformance(): PlatformGoalPerformance[] {
  const rows = db
    .prepare(
      `SELECT
         platform,
         content_goal,
         COUNT(*) AS sample_size,
         AVG(impressions) AS avg_impressions,
         AVG(likes) AS avg_likes,
         AVG(comments) AS avg_comments,
         AVG(shares) AS avg_shares,
         AVG(saves) AS avg_saves,
         AVG(dm_count) AS avg_dm_count,
         AVG(new_followers) AS avg_new_followers
       FROM contents
       WHERE metrics_captured_at IS NOT NULL AND content_goal IS NOT NULL
       GROUP BY platform, content_goal
       ORDER BY platform, content_goal`,
    )
    .all() as PlatformGoalPerformance[];

  const round = (n: number | null) => (n === null ? null : Math.round(n));

  return rows.map((r) => ({
    ...r,
    avg_impressions: round(r.avg_impressions),
    avg_likes: round(r.avg_likes),
    avg_comments: round(r.avg_comments),
    avg_shares: round(r.avg_shares),
    avg_saves: round(r.avg_saves),
    avg_dm_count: round(r.avg_dm_count),
    avg_new_followers: round(r.avg_new_followers),
  }));
}

/**
 * 平均审核轮次：每条内容取它审核记录里最大的轮次(即这条内容总共审了几轮)，
 * 再对所有有过审核记录的内容取平均，量化返工成本。没有任何审核记录的
 * 内容不参与这个平均值的计算(还没进入过审核环节，不该拉低平均值)。
 */
export function getAvgReviewRounds(): number | null {
  const row = db
    .prepare(
      `SELECT AVG(max_round) AS avg_rounds FROM (
         SELECT content_id, MAX(round_number) AS max_round FROM reviews GROUP BY content_id
       )`,
    )
    .get() as { avg_rounds: number | null };
  return row.avg_rounds !== null ? Math.round(row.avg_rounds * 10) / 10 : null;
}

export interface RejectReasonCount {
  reason: RejectReason;
  count: number;
}

/** 打回原因分布：定位返工的根本原因。 */
export function getRejectReasonDistribution(): RejectReasonCount[] {
  return db
    .prepare(
      `SELECT reason, COUNT(*) AS count
       FROM review_reject_reasons
       GROUP BY reason
       ORDER BY count DESC`,
    )
    .all() as RejectReasonCount[];
}

export interface PublishRhythm {
  platform: string;
  planned_count: number;
  published_count: number;
}

/** 发布节奏：按平台对比"计划内容数"和"已发布数"，看哪个平台计划多但发得少。 */
export function getPublishRhythm(): PublishRhythm[] {
  return db
    .prepare(
      `SELECT
         platform,
         COUNT(*) AS planned_count,
         SUM(CASE WHEN current_status = '发布' THEN 1 ELSE 0 END) AS published_count
       FROM contents
       GROUP BY platform
       ORDER BY planned_count DESC`,
    )
    .all() as PublishRhythm[];
}

export interface DashboardStats {
  blocked_summary: BlockedSummary;
  content_goal_performance: ContentGoalPerformance[];
  platform_goal_performance: PlatformGoalPerformance[];
  avg_review_rounds: number | null;
  reject_reason_distribution: RejectReasonCount[];
  publish_rhythm: PublishRhythm[];
}

export function getDashboardStats(): DashboardStats {
  return {
    blocked_summary: getBlockedSummary(),
    content_goal_performance: getContentGoalPerformance(),
    platform_goal_performance: getPlatformGoalPerformance(),
    avg_review_rounds: getAvgReviewRounds(),
    reject_reason_distribution: getRejectReasonDistribution(),
    publish_rhythm: getPublishRhythm(),
  };
}
