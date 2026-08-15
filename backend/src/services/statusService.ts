import { db } from '../db/connection';
import {
  CONTENT_STATUSES,
  ContentStatus,
  ContentRecord,
  ContentWithBlockInfo,
  StatusHistoryRecord,
  TransitionType,
} from '../types';

// 超过这么多天没离开当前状态，就标记为"阻塞"
export const BLOCK_THRESHOLD_DAYS = 3;

export class TransitionError extends Error {}

function statusIndex(status: ContentStatus): number {
  return CONTENT_STATUSES.indexOf(status);
}

/**
 * 校验一次状态变化是否合法，合法的话返回这次变化的类型(正常推进 / 审核回退)。
 *
 * 规则:
 * - 目标状态不能和当前状态相同
 * - "发布"是终点，不能再变
 * - 往后走(哪怕跳级)一律允许，记为"正常推进"
 * - 往前退，只有当前处于"审核"时才允许，退到"审核"之前的任意环节，记为"审核回退"
 * - 除"审核"外，其他环节一律不允许倒退
 */
export function validateTransition(from: ContentStatus, to: ContentStatus): TransitionType {
  if (from === to) {
    throw new TransitionError('目标状态与当前状态相同，无需变更');
  }
  if (from === '发布') {
    throw new TransitionError('内容已经发布，不能再变更状态');
  }

  const fromIdx = statusIndex(from);
  const toIdx = statusIndex(to);

  if (toIdx > fromIdx) {
    return '正常推进';
  }

  if (from === '审核') {
    return '审核回退';
  }

  throw new TransitionError(`不允许从"${from}"退回"${to}"：只有"审核"环节允许退回更早的环节`);
}

/**
 * 阻塞天数：不存数据库，每次查询时用"当前时间 - 进入当前状态的时间"现算，
 * 保证数据永远是准的。sqlite 的 datetime('now') 存的是 UTC 时间、格式
 * "YYYY-MM-DD HH:MM:SS"（不带时区标记），这里显式按 UTC 解析，避免本地时区
 * 把日期算错。
 */
export function attachBlockInfo(row: ContentRecord): ContentWithBlockInfo {
  const enteredAt = new Date(row.status_entered_at.replace(' ', 'T') + 'Z');
  const now = new Date();
  const diffMs = now.getTime() - enteredAt.getTime();
  const blockedDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  return {
    ...row,
    blocked_days: blockedDays,
    is_blocked: row.current_status !== '发布' && blockedDays >= BLOCK_THRESHOLD_DAYS,
  };
}

const getContentStmt = db.prepare('SELECT * FROM contents WHERE id = ?');

const updateContentStatusStmt = db.prepare(`
  UPDATE contents
  SET current_status = @to_status,
      status_entered_at = datetime('now'),
      current_owner = @current_owner,
      updated_at = datetime('now')
  WHERE id = @content_id
`);

const insertHistoryStmt = db.prepare(`
  INSERT INTO status_history (content_id, from_status, to_status, transition_type, changed_by, changed_at)
  VALUES (@content_id, @from_status, @to_status, @transition_type, @changed_by, datetime('now'))
`);

export interface TransitionInput {
  contentId: number;
  toStatus: ContentStatus;
  changedBy?: string | null;
  newOwner?: string | null; // 不传就沿用原来的当前责任人
}

const transitionTxn = db.transaction(
  (params: {
    contentId: number;
    fromStatus: ContentStatus;
    toStatus: ContentStatus;
    transitionType: TransitionType;
    changedBy: string | null;
    owner: string | null;
  }) => {
    updateContentStatusStmt.run({
      content_id: params.contentId,
      to_status: params.toStatus,
      current_owner: params.owner,
    });

    insertHistoryStmt.run({
      content_id: params.contentId,
      from_status: params.fromStatus,
      to_status: params.toStatus,
      transition_type: params.transitionType,
      changed_by: params.changedBy,
    });
  },
);

/**
 * 执行一次状态变化。校验规则 + 更新 contents 表 + 写 status_history 记录
 * 放在同一个事务里，保证两边一致。
 */
export function transitionStatus(input: TransitionInput): ContentWithBlockInfo {
  const existing = getContentStmt.get(input.contentId) as ContentRecord | undefined;
  if (!existing) {
    throw new TransitionError('内容不存在');
  }

  const transitionType = validateTransition(existing.current_status, input.toStatus);
  const owner = input.newOwner ?? existing.current_owner;

  transitionTxn({
    contentId: input.contentId,
    fromStatus: existing.current_status,
    toStatus: input.toStatus,
    transitionType,
    changedBy: input.changedBy ?? null,
    owner,
  });

  const updated = getContentStmt.get(input.contentId) as ContentRecord;
  return attachBlockInfo(updated);
}

const getHistoryStmt = db.prepare(
  'SELECT * FROM status_history WHERE content_id = ? ORDER BY changed_at ASC, id ASC',
);

export function getStatusHistory(contentId: number): StatusHistoryRecord[] {
  return getHistoryStmt.all(contentId) as StatusHistoryRecord[];
}
