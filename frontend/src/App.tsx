import { useState } from 'react';
import ContentFormPage from './pages/ContentFormPage';

// 页面还少，先用最简单的状态切换代替路由库(react-router-dom 当前有安全漏洞，
// 等阶段三/四页面变多、需要独立网址时再评估要不要引入)。
type Tab = 'form' | 'list';

export default function App() {
  const [tab, setTab] = useState<Tab>('form');

  return (
    <div className="page">
      <header className="page-header">
        <h1>社媒内容生产流程管理系统</h1>
        <p className="subtitle">Social Content Workflow &amp; Performance Tracker</p>
      </header>

      <nav className="tab-nav">
        <button className={tab === 'form' ? 'tab active' : 'tab'} onClick={() => setTab('form')}>
          录入内容
        </button>
        <button className={tab === 'list' ? 'tab active' : 'tab'} onClick={() => setTab('list')}>
          内容列表
        </button>
      </nav>

      {tab === 'form' && <ContentFormPage />}
      {tab === 'list' && (
        <div className="status-card">
          <p className="hint">列表 + 筛选功能在下一次 commit（阶段二后半段）实现。</p>
        </div>
      )}
    </div>
  );
}
