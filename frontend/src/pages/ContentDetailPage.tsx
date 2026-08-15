import { FormEvent, useEffect, useState } from 'react';
import {
  fetchContentById,
  fetchContentHistory,
  transitionContentStatus,
} from '../api/client';
import { ContentWithBlockInfo, StatusHistoryRecord } from '../types';
import { getStatusOptions } from '../utils/statusRules';

interface ContentDetailPageProps {
  contentId: number;
  onBack: () => void;
}

type LoadState = 'loading' | 'ready' | 'error';

export default function ContentDetailPage({ contentId, onBack }: ContentDetailPageProps) {
  const [content, setContent] = useState<ContentWithBlockInfo | null>(null);
  const [history, setHistory] = useState<StatusHistoryRecord[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);

  const [toStatus, setToStatus] = useState('');
  const [changedBy, setChangedBy] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  async function load() {
    setLoadState('loading');
    setLoadError(null);
    try {
      const [contentRes, historyRes] = await Promise.all([
        fetchContentById(contentId),
        fetchContentHistory(contentId),
      ]);
      setContent(contentRes);
      setHistory(historyRes);
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
