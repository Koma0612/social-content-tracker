import { useEffect, useState } from 'react';
import { fetchDashboardStats } from '../api/client';
import { DashboardStats } from '../types';
import BarList from '../components/BarList';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败，请稍后重试'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page">
        <p className="hint">加载中…</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="dashboard-page">
        <div className="banner banner-error">{error ?? '加载失败'}</div>
      </div>
    );
  }

  const hasAnyData =
    stats.blocked_summary.by_status.length > 0 ||
    stats.content_goal_performance.length > 0 ||
    stats.reject_reason_distribution.length > 0 ||
    stats.publish_rhythm.length > 0;

  return (
    <div className="dashboard-page">
      <h2>数据看板</h2>

      {!hasAnyData && (
        <p className="hint">
          还没有数据。可以先去"录入内容"填几条，或者在项目根目录执行{' '}
          <code>npm run seed -w backend</code> 灌入一批示例数据看效果。
        </p>
      )}

      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-label">当前阻塞内容数</span>
          <span className="stat-value stat-value-danger">{stats.blocked_summary.total_blocked}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">平均审核轮次</span>
          <span className="stat-value">{stats.avg_review_rounds ?? '—'}</span>
        </div>
      </div>

      <section className="dashboard-section">
        <h3>阻塞环节分布</h3>
        {stats.blocked_summary.by_status.length === 0 ? (
          <p className="hint">目前没有停留超过 3 天的内容。</p>
        ) : (
          <BarList
            items={stats.blocked_summary.by_status.map((s) => ({ label: s.status, value: s.count }))}
          />
        )}
      </section>

      <section className="dashboard-section">
        <h3>打回原因分布</h3>
        {stats.reject_reason_distribution.length === 0 ? (
          <p className="hint">还没有打回记录。</p>
        ) : (
          <BarList
            items={stats.reject_reason_distribution.map((r) => ({ label: r.reason, value: r.count }))}
          />
        )}
      </section>

      <section className="dashboard-section">
        <h3>各内容目标效果</h3>
        <p className="hint">
          不同目标看不同指标：品牌曝光看平均曝光量，线索转化看平均私信数，用户教育/活动引流看平均互动数。
        </p>
        {stats.content_goal_performance.length === 0 ? (
          <p className="hint">还没有已发布并回填复盘数据的内容。</p>
        ) : (
          <div className="table-wrap">
            <table className="content-table">
              <thead>
                <tr>
                  <th>内容目标</th>
                  <th>样本数</th>
                  <th>平均曝光量</th>
                  <th>平均互动数</th>
                  <th>平均私信数</th>
                  <th>平均涨粉数</th>
                </tr>
              </thead>
              <tbody>
                {stats.content_goal_performance.map((g) => (
                  <tr key={g.content_goal}>
                    <td>{g.content_goal}</td>
                    <td>{g.count}</td>
                    <td>{g.avg_impressions ?? '—'}</td>
                    <td>{g.avg_engagement ?? '—'}</td>
                    <td>{g.avg_dm_count ?? '—'}</td>
                    <td>{g.avg_new_followers ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <h3>发布节奏(按平台)</h3>
        {stats.publish_rhythm.length === 0 ? (
          <p className="hint">还没有内容数据。</p>
        ) : (
          <div className="table-wrap">
            <table className="content-table">
              <thead>
                <tr>
                  <th>平台</th>
                  <th>内容总数</th>
                  <th>已发布数</th>
                  <th>发布率</th>
                </tr>
              </thead>
              <tbody>
                {stats.publish_rhythm.map((p) => (
                  <tr key={p.platform}>
                    <td>{p.platform}</td>
                    <td>{p.planned_count}</td>
                    <td>{p.published_count}</td>
                    <td>{Math.round((p.published_count / p.planned_count) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
