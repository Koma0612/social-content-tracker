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

export interface MaterialWaitCompleted {
  material_source: string;
  sample_size: number;
  avg_wait_days: number | null;
}

export interface MaterialWaitOngoing {
  material_source: string;
  ongoing_count: number;
  max_wait_days: number;
}

export interface MaterialWaitStats {
  completed: MaterialWaitCompleted[];
  ongoing: MaterialWaitOngoing[];
}

const NO_MATERIAL_SOURCE_LABEL = '未填写';

/**
 * 素材等待统计：按"素材来源"分组，分开统计"已完成的等待"和"正在进行的等待"，
 * 不合并成一个数字——如果把还没结束的等待直接排除在平均值之外，会出现幸存者
 * 偏差:等得最久、最有问题的那批(比如某个供应方拖了 20 天还没交)恰恰是还没
 * 结束的，一旦排除，平均值会显得很健康，但最严重的问题反而被藏起来了。
 */
export function getMaterialWaitStats(): MaterialWaitStats {
  // 已完成的等待：用窗口函数 LEAD 在同一条内容的完整状态历史里，找到每一次
  // "进入收集素材"之后紧跟着的下一条记录(也就是离开收集素材的那一刻)。
  // 只有真的有"下一条记录"的，才说明这次等待已经结束，可以计入平均值。
  const completedRows = db
    .prepare(
      `WITH ordered_history AS (
         SELECT
           content_id,
           to_status,
           changed_at,
           LEAD(changed_at) OVER (PARTITION BY content_id ORDER BY changed_at, id) AS next_changed_at
         FROM status_history
       ),
       completed_waits AS (
         SELECT
           content_id,
           (julianday(next_changed_at) - julianday(changed_at)) AS wait_days
         FROM ordered_history
         WHERE to_status = '收集素材' AND next_changed_at IS NOT NULL
       )
       SELECT
         COALESCE(c.material_source, @noSource) AS material_source,
         COUNT(*) AS sample_size,
         AVG(w.wait_days) AS avg_wait_days
       FROM completed_waits w
       JOIN contents c ON c.id = w.content_id
       GROUP BY COALESCE(c.material_source, @noSource)
       ORDER BY sample_size DESC`,
    )
    .all({ noSource: NO_MATERIAL_SOURCE_LABEL }) as MaterialWaitCompleted[];

  const round1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);

  // 进行中的等待：现在还处于"收集素材"状态的内容，用跟阻塞天数一样的口径
  // (当前时间 - 进入该状态的时间)现算，在 JS 里算而不是用 SQL 的 julianday('now')，
  // 是为了跟 statusService.attachBlockInfo 用同一套时间处理逻辑，避免两处口径不一致。
  const ongoingContents = db
    .prepare(`SELECT material_source, status_entered_at FROM contents WHERE current_status = '收集素材'`)
    .all() as { material_source: string | null; status_entered_at: string }[];

  const ongoingMap = new Map<string, { count: number; maxDays: number }>();
  for (const row of ongoingContents) {
    const label = row.material_source ?? NO_MATERIAL_SOURCE_LABEL;
    const enteredAt = new Date(row.status_entered_at.replace(' ', 'T') + 'Z');
    const days = Math.max(0, Math.floor((Date.now() - enteredAt.getTime()) / (1000 * 60 * 60 * 24)));

    const existing = ongoingMap.get(label);
    if (existing) {
      existing.count += 1;
      existing.maxDays = Math.max(existing.maxDays, days);
    } else {
      ongoingMap.set(label, { count: 1, maxDays: days });
    }
  }

  const ongoing: MaterialWaitOngoing[] = Array.from(ongoingMap.entries())
    .map(([material_source, v]) => ({
      material_source,
      ongoing_count: v.count,
      max_wait_days: v.maxDays,
    }))
    .sort((a, b) => b.max_wait_days - a.max_wait_days);

  return {
    completed: completedRows.map((r) => ({ ...r, avg_wait_days: round1(r.avg_wait_days) })),
    ongoing,
  };
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
  material_wait: MaterialWaitStats;
}

export function getDashboardStats(): DashboardStats {
  return {
    blocked_summary: getBlockedSummary(),
    content_goal_performance: getContentGoalPerformance(),
    platform_goal_performance: getPlatformGoalPerformance(),
    avg_review_rounds: getAvgReviewRounds(),
    reject_reason_distribution: getRejectReasonDistribution(),
    publish_rhythm: getPublishRhythm(),
    material_wait: getMaterialWaitStats(),
  };
}
