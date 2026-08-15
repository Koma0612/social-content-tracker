import { FormEvent, useEffect, useState } from 'react';
import {
  fetchContentById,
  fetchContentHistory,
  fetchReviews,
  transitionContentStatus,
  submitReview,
} from '../api/client';
import {
  ContentWithBlockInfo,
  StatusHistoryRecord,
  ReviewWithReasons,
  ReviewerRole,
  ReviewResult,
  RejectReason,
} from '../types';
import { getStatusOptions, getRollbackOptions } from '../utils/statusRules';
import { REVIEWER_ROLES, REJECT_REASONS, REVIEWABLE_STATUSES } from '../constants/options';

interface ContentDetailPageProps {
  contentId: number;
  onBack: () => void;
}

type LoadState = 'loading' | 'ready' | 'error';

export default function ContentDetailPage({ contentId, onBack }: ContentDetailPageProps) {
  const [content, setContent] = useState<ContentWithBlockInfo | null>(null);
  const [history, setHistory] = useState<StatusHistoryRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewWithReasons[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);

  const [toStatus, setToStatus] = useState('');
  const [changedBy, setChangedBy] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [reviewerRole, setReviewerRole] = useState<ReviewerRole | ''>('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewResult, setReviewResult] = useState<ReviewResult | ''>('');
  const [reviewReasons, setReviewReasons] = useState<RejectReason[]>([]);
  const [reviewRollbackTo, setReviewRollbackTo] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  async function load() {
    setLoadState('loading');
    setLoadError(null);
    try {
      const [contentRes, historyRes, reviewsRes] = await Promise.all([
        fetchContentById(contentId),
        fetchContentHistory(contentId),
        fetchReviews(contentId),
      ]);
      setContent(contentRes);
      setHistory(historyRes);
      setReviews(reviewsRes);
      setNewOwner(contentRes.current_owner ?? '');
      setLoadState('ready');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '加载失败，请稍后重试');
      setLoadState('error');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId]);

  async function handleTransition(e: FormEvent) {
    e.preventDefault();
    if (!content || !toStatus) return;

    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await transitionContentStatus(content.id, {
        to_status: toStatus as ContentWithBlockInfo['current_status'],
        changed_by: changedBy || undefined,
        new_owner: newOwner || undefined,
      });
      setActionSuccess(`已变更为「${toStatus}」`);
      setToStatus('');
      setChangedBy('');
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '状态变更失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }

  function toggleReason(reason: RejectReason) {
    setReviewReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason],
    );
  }

  async function handleReviewSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content || !reviewerRole || !reviewResult) return;

    if (reviewResult === '打回' && reviewReasons.length === 0) {
      setReviewError('打回时至少要勾选一个打回原因');
      return;
    }
    if (reviewResult === '打回' && content.current_status === '审核' && !reviewRollbackTo) {
      setReviewError('审核环节打回时必须指定退回到哪个环节');
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      await submitReview(content.id, {
        reviewer_role: reviewerRole,
        reviewer_name: reviewerName || undefined,
        result: reviewResult,
        comment: reviewComment || undefined,
        reject_reasons: reviewResult === '打回' ? reviewReasons : undefined,
        rollback_to_status:
          reviewResult === '打回' && content.current_status === '审核'
            ? (reviewRollbackTo as ContentWithBlockInfo['current_status'])
            : undefined,
      });
      setReviewSuccess('审核记录已提交');
      setReviewerRole('');
      setReviewerName('');
      setReviewResult('');
      setReviewReasons([]);
      setReviewRollbackTo('');
      setReviewComment('');
      await load();
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : '提交审核失败，请稍后重试');
    } finally {
      setReviewSubmitting(false);
    }
  }

  if (loadState === 'loading') {
    return (
      <div className="detail-page">
        <button className="btn-secondary" onClick={onBack}>
          ← 返回列表
        </button>
        <p className="hint">加载中…</p>
      </div>
    );
  }

  if (loadState === 'error' || !content) {
    return (
      <div className="detail-page">
        <button className="btn-secondary" onClick={onBack}>
          ← 返回列表
        </button>
        <div className="banner banner-error">{loadError ?? '内容不存在'}</div>
      </div>
    );
  }

  const statusOptions = getStatusOptions(content.current_status);
  const rollbackOptions = getRollbackOptions(content.current_status);
  const canReview = REVIEWABLE_STATUSES.includes(
    content.current_status as (typeof REVIEWABLE_STATUSES)[number],
  );

  return (
    <div className="detail-page">
      <button className="btn-secondary" onClick={onBack}>
        ← 返回列表
      </button>

      <div className="detail-header">
        <h2>{content.topic}</h2>
        <span className={content.is_blocked ? 'status-pill status-pill-blocked' : 'status-pill'}>
          {content.current_status} · 已停留 {content.blocked_days} 天
          {content.is_blocked ? '（阻塞）' : ''}
        </span>
      </div>

      <div className="detail-grid">
        <div>
          <span className="detail-label">平台</span>
          <span>{content.platform}</span>
        </div>
        <div>
          <span className="detail-label">当前责任人</span>
          <span>{content.current_owner ?? '—'}</span>
        </div>
        <div>
          <span className="detail-label">内容类型</span>
          <span>{content.content_type ?? '—'}</span>
        </div>
        <div>
          <span className="detail-label">内容形式</span>
          <span>{content.content_format ?? '—'}</span>
        </div>
        <div>
          <span className="detail-label">内容目标</span>
          <span>{content.content_goal ?? '—'}</span>
        </div>
        <div>
          <span className="detail-label">计划发布日期</span>
          <span>{content.planned_publish_date ?? '—'}</span>
        </div>
      </div>

      <section className="detail-section">
        <h3>变更状态</h3>

        {statusOptions.length === 0 ? (
          <p className="hint">内容已发布，不能再变更状态。</p>
        ) : (
          <form className="transition-form" onSubmit={handleTransition}>
            <select value={toStatus} onChange={(e) => setToStatus(e.target.value)} required>
              <option value="">选择目标状态</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="操作人(是谁推进的)"
              value={changedBy}
              onChange={(e) => setChangedBy(e.target.value)}
            />
            <input
              type="text"
              placeholder="新的当前责任人"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
            />
            <button type="submit" className="btn-primary" disabled={submitting || !toStatus}>
              {submitting ? '提交中…' : '确认变更'}
            </button>
          </form>
        )}

        {actionSuccess && <div className="banner banner-success">{actionSuccess}</div>}
        {actionError && <div className="banner banner-error">{actionError}</div>}
      </section>

      <section className="detail-section">
        <h3>提交审核</h3>

        {!canReview ? (
          <p className="hint">
            当前处于"{content.current_status}"环节，不能提交审核记录（只能在写文案/制作/审核环节提交）。
          </p>
        ) : (
          <form className="review-form" onSubmit={handleReviewSubmit}>
            <div className="form-row">
              <label>
                审核角色 <span className="required">*</span>
                <select
                  value={reviewerRole}
                  onChange={(e) => setReviewerRole(e.target.value as ReviewerRole)}
                >
                  <option value="">请选择</option>
                  {REVIEWER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                审核人姓名
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="同一角色可能是不同的人"
                />
              </label>
            </div>

            <label>
              审核结果 <span className="required">*</span>
              <select
                value={reviewResult}
                onChange={(e) => setReviewResult(e.target.value as ReviewResult)}
              >
                <option value="">请选择</option>
                <option value="通过">通过</option>
                <option value="打回">打回</option>
              </select>
            </label>

            {reviewResult === '打回' && (
              <div className="reason-checkboxes">
                <span className="detail-label">打回原因(可多选)</span>
                <div className="checkbox-group">
                  {REJECT_REASONS.map((reason) => (
                    <label key={reason} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={reviewReasons.includes(reason)}
                        onChange={() => toggleReason(reason)}
                      />
                      {reason}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {reviewResult === '打回' && content.current_status === '审核' && (
              <label>
                退回到 <span className="required">*</span>
                <select value={reviewRollbackTo} onChange={(e) => setReviewRollbackTo(e.target.value)}>
                  <option value="">请选择退回目标</option>
                  {rollbackOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label>
              具体意见
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </label>

            <button
              type="submit"
              className="btn-primary"
              disabled={reviewSubmitting || !reviewerRole || !reviewResult}
            >
              {reviewSubmitting ? '提交中…' : '提交审核'}
            </button>
          </form>
        )}

        {reviewSuccess && <div className="banner banner-success">{reviewSuccess}</div>}
        {reviewError && <div className="banner banner-error">{reviewError}</div>}
      </section>

      <section className="detail-section">
        <h3>审核历史</h3>
        {reviews.length === 0 ? (
          <p className="hint">还没有审核记录。</p>
        ) : (
          <ul className="timeline">
            {reviews.map((r) => (
              <li key={r.id} className="timeline-item review-item">
                <span className={r.result === '打回' ? 'timeline-tag timeline-tag-rollback' : 'timeline-tag'}>
                  第{r.round_number}轮 · {r.result}
                </span>
                <span>
                  {r.reviewer_role}
                  {r.reviewer_name ? `(${r.reviewer_name})` : ''}
                </span>
                {r.reject_reasons.length > 0 && (
                  <span className="review-reasons">{r.reject_reasons.join('、')}</span>
                )}
                {r.comment && <span className="review-comment">{r.comment}</span>}
                <span className="timeline-meta">{r.reviewed_at}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-section">
        <h3>状态时间线</h3>
        <ul className="timeline">
          {history.map((h) => (
            <li key={h.id} className="timeline-item">
              <span
                className={
                  h.transition_type === '审核回退' ? 'timeline-tag timeline-tag-rollback' : 'timeline-tag'
                }
              >
                {h.transition_type}
              </span>
              <span>
                {h.from_status ?? '（新建）'} → {h.to_status}
              </span>
              <span className="timeline-meta">
                {h.changed_by ?? '—'} · {h.changed_at}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
