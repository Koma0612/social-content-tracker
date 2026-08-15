import { useEffect, useState } from 'react';
import { fetchContents, ContentFilter } from '../api/client';
import { ContentWithBlockInfo } from '../types';
import FilterBar from '../components/FilterBar';

interface ContentListPageProps {
  onSelectContent: (id: number) => void;
}

export default function ContentListPage({ onSelectContent }: ContentListPageProps) {
  const [filter, setFilter] = useState<ContentFilter>({});
  const [contents, setContents] = useState<ContentWithBlockInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(nextFilter: ContentFilter) {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchContents(nextFilter);
      setContents(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  // 页面刚打开时先查一次全部
  useEffect(() => {
    load({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApply() {
    load(filter);
  }

  function handleReset() {
    setFilter({});
    load({});
  }

  return (
    <div className="list-page">
      <h2>内容列表</h2>

      <FilterBar value={filter} onChange={setFilter} onApply={handleApply} onReset={handleReset} />

      {loading && <p className="hint">加载中…</p>}
      {error && <div className="banner banner-error">{error}</div>}

      {!loading && !error && contents.length === 0 && (
        <p className="hint">没有符合条件的内容。</p>
      )}

      {!loading && !error && contents.length > 0 && (
        <div className="table-wrap">
          <table className="content-table">
            <thead>
              <tr>
                <th>选题</th>
                <th>平台</th>
                <th>当前状态</th>
                <th>停留天数</th>
                <th>负责人</th>
                <th>计划发布日期</th>
                <th>内容类型</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contents.map((c) => (
                <tr key={c.id} className={c.is_blocked ? 'row-blocked' : undefined}>
                  <td>{c.topic}</td>
                  <td>{c.platform}</td>
                  <td>
                    <span className="status-pill">{c.current_status}</span>
                  </td>
                  <td>
                    {c.is_blocked ? (
                      <span className="blocked-tag">{c.blocked_days} 天(阻塞)</span>
                    ) : (
                      `${c.blocked_days} 天`
                    )}
                  </td>
                  <td>{c.owner ?? '—'}</td>
                  <td>{c.planned_publish_date ?? '—'}</td>
                  <td>{c.content_type ?? '—'}</td>
                  <td>
                    <button className="btn-link" onClick={() => onSelectContent(c.id)}>
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
