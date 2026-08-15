import { useEffect, useState } from 'react';
import { getHealth, fetchContents } from './api/client';

type ConnectionState = 'checking' | 'ok' | 'error';

export default function App() {
  const [connection, setConnection] = useState<ConnectionState>('checking');
  const [contentCount, setContentCount] = useState<number | null>(null);

  useEffect(() => {
    getHealth()
      .then(() => setConnection('ok'))
      .catch(() => setConnection('error'));

    fetchContents()
      .then((rows) => setContentCount(rows.length))
      .catch(() => setContentCount(null));
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <h1>社媒内容生产流程管理系统</h1>
        <p className="subtitle">Social Content Workflow &amp; Performance Tracker</p>
      </header>

      <section className="status-card">
        <h2>阶段一：项目骨架验证</h2>
        <ul>
          <li>
            后端连接状态：
            {connection === 'checking' && <span className="badge badge-checking">检查中…</span>}
            {connection === 'ok' && <span className="badge badge-ok">已连接</span>}
            {connection === 'error' && <span className="badge badge-error">连接失败</span>}
          </li>
          <li>
            数据库中现有内容条数：
            <span className="badge badge-neutral">
              {contentCount === null ? '未知' : contentCount}
            </span>
          </li>
        </ul>
        <p className="hint">
          这个页面只是用来证明"前端 → 后端 → 数据库"这条链路是通的。
          正式的录入表单、列表筛选会在阶段二加上。
        </p>
      </section>
    </div>
  );
}
