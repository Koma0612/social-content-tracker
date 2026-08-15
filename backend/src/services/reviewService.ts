import { db } from '../db/connection';
import {
  CONTENT_STATUSES,
  ContentRecord,
  ContentStatus,
  ReviewRecord,
  ReviewWithReasons,
  ReviewerRole,
  ReviewResult,
  RejectReason,
  REVIEWABLE_STATUSES,
} from '../types';
import { transitionStatus, validateTransition } from './statusService';

export class ReviewError extends Error {}

const getContentStmt = db.prepare('SELECT * FROM contents WHERE id = ?');
const countReviewsStmt = db.prepare('SELECT COUNT(*) AS cnt FROM reviews WHERE content_id = ?');

const insertReviewStmt = db.prepare(`
  INSERT INTO reviews (content_id, reviewer_role, reviewer_name, round_number, result, comment, reviewed_at)
  VALUES (@content_id, @reviewer_role, @reviewer_name, @round_number, @result, @comment, datetime('now'))
`);

const insertReasonStmt = db.prepare(`
  INSERT INTO review_reject_reasons (review_id, reason) VALUES (?, ?)
`);

const getReviewStmt = db.prepare('SELECT * FROM reviews WHERE id = ?');
const getReasonsStmt = db.prepare(
  'SELECT reason FROM review_reject_reasons WHERE review_id = ? ORDER BY id ASC',
);
const listReviewsStmt = db.prepare(
  'SELECT * FROM reviews WHERE content_id = ? ORDER BY reviewed_at ASC, id ASC',
);

export interface CreateReviewInput {
  contentId: number;
  reviewerRole: ReviewerRole;
  reviewerName?: string | null;
  result: ReviewResult;
  comment?: string | null;
  rejectReasons?: RejectReason[];
  rollbackToStatus?: ContentStatus | null;
}

function attachReasons(review: ReviewRecord): ReviewWithReasons {
  const reasons = getReasonsStmt.all(review.id) as { reason: RejectReason }[];
  return { ...review, reject_reasons: reasons.map((r) => r.reason) };
}

const createReviewTxn = db.transaction(
  (input: CreateReviewInput & { roundNumber: number; shouldRollback: boolean }): number => {
    const result = insertReviewStmt.run({
      content_id: input.contentId,
      reviewer_role: input.reviewerRole,
      reviewer_name: input.reviewerName ?? null,
      round_number: input.roundNumber,
      result: input.result,
      comment: input.comment ?? null,
    });
    const reviewId = Number(result.lastInsertRowid);

    for (const reason of input.rejectReasons ?? []) {
      insertReasonStmt.run(reviewId, reason);
    }

    // 只有内容当下正处于"审核"状态、且这次是打回，才联动触发状态回退。
    // 复用 statusService 已经写好的状态变更逻辑(它内部也是一个 db.transaction，
    // better-sqlite3 支持事务嵌套，会自动用 savepoint 处理，不用重复写一遍 SQL)。
    if (input.shouldRollback && input.rollbackToStatus) {
      transitionStatus({
        contentId: input.contentId,
        toStatus: input.rollbackToStatus,
        changedBy: input.reviewerName || input.reviewerRole,
      });
    }

    return reviewId;
  },
);

/**
 * 提交一条审核记录。
 * - 只有内容处于"写文案"/"制作"/"审核"三个环节时才允许提交(语言审核经常提前进行)
 * - 打回时必须至少选一个打回原因
 * - 只有当前处于"审核"环节的打回，才要求同时指定退回目标，并联动触发状态回退
 */
export function createReview(input: CreateReviewInput): ReviewWithReasons {
  const content = getContentStmt.get(input.contentId) as ContentRecord | undefined;
  if (!content) {
    throw new ReviewError('内容不存在');
  }
  if (!REVIEWABLE_STATUSES.includes(content.current_status)) {
    throw new ReviewError(
      `内容当前处于"${content.current_status}"环节，不能提交审核记录（只能在写文案/制作/审核环节提交）`,
    );
  }

  if (input.result === '打回' && (!input.rejectReasons || input.rejectReasons.length === 0)) {
    throw new ReviewError('打回时至少要选择一个打回原因');
  }

  const shouldRollback = input.result === '打回' && content.current_status === '审核';
  if (shouldRollback) {
    if (!input.rollbackToStatus) {
      throw new ReviewError('审核环节打回时必须指定退回到哪个环节');
    }
    // 「打回」在语义上只能往更早的环节退，不能往后走。
    // 只调用 validateTransition('审核', X) 是不够的——它只校验"这个变化本身合不合法"，
    // 而"审核"往后走(比如到"排期")在状态机规则里也是合法的正常推进，会被放过。
    // 这里先显式检查目标状态的顺序必须早于"审核"，堵住"打回却退到更后面环节"这个漏洞。
    const auditIdx = CONTENT_STATUSES.indexOf('审核');
    const targetIdx = CONTENT_STATUSES.indexOf(input.rollbackToStatus);
    if (targetIdx === -1 || targetIdx >= auditIdx) {
      throw new ReviewError('打回的退回目标必须是"审核"之前的环节(选题/收集素材/写文案/制作)');
    }
    // 兜底再跑一次完整校验；真正的执行时校验在 transitionStatus 内部还会再验一次。
    validateTransition('审核', input.rollbackToStatus);
  }

  const { cnt } = countReviewsStmt.get(input.contentId) as { cnt: number };
  const roundNumber = cnt + 1;

  const reviewId = createReviewTxn({ ...input, roundNumber, shouldRollback });
  const review = getReviewStmt.get(reviewId) as ReviewRecord;
  return attachReasons(review);
}

export function listReviews(contentId: number): ReviewWithReasons[] {
  const reviews = listReviewsStmt.all(contentId) as ReviewRecord[];
  return reviews.map(attachReasons);
}
