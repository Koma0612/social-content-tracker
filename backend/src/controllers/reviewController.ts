import { Request, Response } from 'express';
import * as reviewService from '../services/reviewService';
import { ReviewError } from '../services/reviewService';
import { TransitionError } from '../services/statusService';
import { ReviewerRole, ReviewResult, RejectReason, ContentStatus } from '../types';

const VALID_ROLES: ReviewerRole[] = ['老板', '同事/mentor', '英语母语者'];
const VALID_RESULTS: ReviewResult[] = ['通过', '打回'];

export function createReview(req: Request, res: Response): void {
  const contentId = Number(req.params.id);
  if (!Number.isInteger(contentId)) {
    res.status(400).json({ error: '无效的内容 ID' });
    return;
  }

  const body = req.body ?? {};
  const reviewerRole = body.reviewer_role;
  const result = body.result;

  if (!VALID_ROLES.includes(reviewerRole)) {
    res.status(400).json({ error: '审核角色不合法' });
    return;
  }
  if (!VALID_RESULTS.includes(result)) {
    res.status(400).json({ error: '审核结果只能是"通过"或"打回"' });
    return;
  }

  try {
    const review = reviewService.createReview({
      contentId,
      reviewerRole: reviewerRole as ReviewerRole,
      reviewerName: typeof body.reviewer_name === 'string' ? body.reviewer_name : null,
      result: result as ReviewResult,
      comment: typeof body.comment === 'string' ? body.comment : null,
      rejectReasons: Array.isArray(body.reject_reasons) ? (body.reject_reasons as RejectReason[]) : [],
      rollbackToStatus:
        typeof body.rollback_to_status === 'string'
          ? (body.rollback_to_status as ContentStatus)
          : null,
    });
    res.status(201).json(review);
  } catch (err) {
    if (err instanceof ReviewError || err instanceof TransitionError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error('[createReview] failed:', err);
    res.status(500).json({ error: '提交审核失败，请稍后重试' });
  }
}

export function listReviews(req: Request, res: Response): void {
  const contentId = Number(req.params.id);
  if (!Number.isInteger(contentId)) {
    res.status(400).json({ error: '无效的内容 ID' });
    return;
  }
  res.json(reviewService.listReviews(contentId));
}
