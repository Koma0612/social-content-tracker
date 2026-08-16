import { useEffect, useState } from 'react';
import { fetchDashboardStats } from '../api/client';
import { DashboardStats } from '../types';
import BarList from '../components/BarList';
import { buildCsvContent, downloadCsv } from '../utils/csv';

// 样本数低于这个值时,该分组的平均值仅供参考——一两条数据的平均值很容易
// 被极端值带偏,不该被当成"这个平台/目标组合效果好不好"的可靠结论。
const MIN_RELIABLE_SAMPLE_SIZE = 3;

/**
 * 看板有好几张不同形状的表，导出成一份 CSV 时用"小节标题 + 空行分隔"的方式
 * 把几张表拼在一起——用 Excel 打开是一整张表，靠空行和小节标题区分每一段，
 * 整理周报时够用，不需要为此导出多个文件。
 */
function buildDashboardCsv(stats: DashboardStats): string {
  const sections: (string | number | null)[][] = [];

  sections.push(['汇总指标']);
  sections.push(['指标', '数值']);
  sections.push(['当前阻塞内容数', stats.blocked_summary.total_blocked]);
  sections.push(['平均审核轮次', stats.avg_review_rounds ?? '']);
  sections.push([]);

  sections.push(['阻塞环节分布']);
  sections.push(['环节', '数量']);
  stats.blocked_summary.by_status.forEach((s) => sections.push([s.status, s.count]));
  sections.push([]);

  sections.push(['打回原因分布']);
  sections.push(['原因', '数量']);
  stats.reject_reason_distribution.forEach((r) => sections.push([r.reason, r.count]));
  sections.push([]);

  sections.push(['各内容目标效果']);
  sections.push(['内容目标', '样本数', '平均曝光量', '平均互动数', '平均私信数', '平均涨粉数']);
  stats.content_goal_performance.forEach((g) =>
    sections.push([
      g.content_goal,
      g.count,
      g.avg_impressions,
      g.avg_engagement,
      g.avg_dm_count,
      g.avg_new_followers,
    ]),
  );
  sections.push([]);

  sections.push(['平台效率对比']);
  sections.push([
    '平台',
    '内容目标',
    '样本数',
    '平均曝光量',
    '平均点赞',
    '平均评论',
    '平均转发',
    '平均收藏',
    '平均私信',
    '平均涨粉',
  ]);
  stats.platform_goal_performance.forEach((p) =>
    sections.push([
      p.platform,
      p.content_goal,
      p.sample_size < MIN_RELIABLE_SAMPLE_SIZE ? `${p.sample_size}(数据不足)` : p.sample_size,
      p.avg_impressions,
      p.avg_likes,
      p.avg_comments,
      p.avg_shares,
      p.avg_saves,
      p.avg_dm_count,
      p.avg_new_followers,
    ]),
  );
  sections.push([]);

  sections.push(['发布节奏(按平台)']);
  sections.push(['平台', '内容总数', '已发布数', '发布率']);
  stats.publish_rhythm.forEach((p) =>
    sections.push([
      p.platform,
      p.planned_count,
      p.published_count,
      `${Math.round((p.published_count / p.planned_count) * 100)}%`,
    ]),
  );
  sections.push([]);

  sections.push(['素材等待统计 - 已完成等待(按素材来源)']);
  sections.push(['素材来源', '样本数', '平均等待天数']);
  stats.material_wait.completed.forEach((c) =>
    sections.push([
      c.material_source,
      c.sample_size < MIN_RELIABLE_SAMPLE_SIZE ? `${c.sample_size}(数据不足)` : c.sample_size,
      c.avg_wait_days,
    ]),
  );
  sections.push([]);

  sections.push(['素材等待统计 - 进行中等待(按素材来源)']);
  sections.push(['素材来源', '当前等待条数', '最长已等天数']);
  stats.material_wait.ongoing.forEach((o) =>
    sections.push([o.material_source, o.ongoing_count, o.max_wait_days]),
  );

  return buildCsvContent(sections);
}

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
    stats.platform_goal_performance.length > 0 ||
    stats.reject_reason_distribution.length > 0 ||
    stats.publish_rhythm.length > 0 ||
    stats.material_wait.completed.length > 0 ||
    stats.material_wait.ongoing.length > 0;

  function handleExport() {
    if (!stats) return;
    const csv = buildDashboardCsv(stats);
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`数据看板_${today}.csv`, csv);
  }

  return (
    <div className="dashboard-page">
      <div className="list-page-header">
        <h2>数据看板</h2>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleExport}
          disabled={!hasAnyData}
        >
          导出 CSV
        </button>
      </div>

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
        <h3>平台效率对比</h3>
        <p className="hint">
          按"平台 × 内容目标"交叉分组——回答"同样类型的内容，发在不同平台上效果差多少"。样本数低于{' '}
          {MIN_RELIABLE_SAMPLE_SIZE} 的分组会标"数据不足"，一两条数据的平均值容易被极端值带偏，别当结论看。
        </p>
        {stats.platform_goal_performance.length === 0 ? (
          <p className="hint">还没有已发布并回填复盘数据的内容。</p>
        ) : (
          <div className="table-wrap">
            <table className="content-table">
              <thead>
                <tr>
                  <th>平台</th>
                  <th>内容目标</th>
                  <th>样本数</th>
                  <th>平均曝光量</th>
                  <th>平均点赞</th>
                  <th>平均评论</th>
                  <th>平均转发</th>
                  <th>平均收藏</th>
                  <th>平均私信</th>
                  <th>平均涨粉</th>
                </tr>
              </thead>
              <tbody>
                {stats.platform_goal_performance.map((p) => {
                  const lowSample = p.sample_size < MIN_RELIABLE_SAMPLE_SIZE;
                  return (
                    <tr key={`${p.platform}-${p.content_goal}`} className={lowSample ? 'row-low-sample' : undefined}>
                      <td>{p.platform}</td>
                      <td>{p.content_goal}</td>
                      <td>
                        n={p.sample_size}
                        {lowSample && <span className="sample-warning">数据不足，仅供参考</span>}
                      </td>
                      <td>{p.avg_impressions ?? '—'}</td>
                      <td>{p.avg_likes ?? '—'}</td>
                      <td>{p.avg_comments ?? '—'}</td>
                      <td>{p.avg_shares ?? '—'}</td>
                      <td>{p.avg_saves ?? '—'}</td>
                      <td>{p.avg_dm_count ?? '—'}</td>
                      <td>{p.avg_new_followers ?? '—'}</td>
                    </tr>
                  );
                })}
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

      <section className="dashboard-section">
        <h3>素材等待统计</h3>
        <p className="hint">
          只统计"收集素材"这一个环节，按素材来源分组。已完成的等待和还在进行中的等待分开展示，不合并——
          如果把还没结束的等待排除在外，等得最久、最有问题的那批(比如某个供应方拖了很久还没交)恰恰会被藏起来，
          平均值会显得比实际情况更健康。
        </p>

        <h4 className="dashboard-subheading">已完成等待</h4>
        {stats.material_wait.completed.length === 0 ? (
          <p className="hint">还没有已经结束的"收集素材"等待记录。</p>
        ) : (
          <div className="table-wrap">
            <table className="content-table">
              <thead>
                <tr>
                  <th>素材来源</th>
                  <th>样本数</th>
                  <th>平均等待天数</th>
                </tr>
              </thead>
              <tbody>
                {stats.material_wait.completed.map((c) => {
                  const lowSample = c.sample_size < MIN_RELIABLE_SAMPLE_SIZE;
                  return (
                    <tr key={c.material_source} className={lowSample ? 'row-low-sample' : undefined}>
                      <td>{c.material_source}</td>
                      <td>
                        n={c.sample_size}
                        {lowSample && <span className="sample-warning">数据不足，仅供参考</span>}
                      </td>
                      <td>{c.avg_wait_days ?? '—'} 天</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <h4 className="dashboard-subheading">进行中等待</h4>
        {stats.material_wait.ongoing.length === 0 ? (
          <p className="hint">目前没有内容正卡在"收集素材"环节。</p>
        ) : (
          <div className="table-wrap">
            <table className="content-table">
              <thead>
                <tr>
                  <th>素材来源</th>
                  <th>当前等待条数</th>
                  <th>最长已等天数</th>
                </tr>
              </thead>
              <tbody>
                {stats.material_wait.ongoing.map((o) => (
                  <tr key={o.material_source} className={o.max_wait_days >= 3 ? 'row-blocked' : undefined}>
                    <td>{o.material_source}</td>
                    <td>{o.ongoing_count}</td>
                    <td>{o.max_wait_days} 天</td>
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
