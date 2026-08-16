import { useState } from 'react';
import ContentFormPage from './pages/ContentFormPage';
import ContentListPage from './pages/ContentListPage';
import ContentDetailPage from './pages/ContentDetailPage';
import DashboardPage from './pages/DashboardPage';
import ContentImportPage from './pages/ContentImportPage';

// 页面还少，先用最简单的状态切换代替路由库(react-router-dom 当前有安全漏洞，
// 等页面进一步变多、需要独立网址分享时再评估要不要引入)。
type Tab = 'form' | 'list' | 'detail' | 'dashboard' | 'import';

export default function App() {
  const [tab, setTab] = useState<Tab>('form');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  function openDetail(id: number) {
    setSelectedId(id);
    setTab('detail');
  }

  function goToList() {
    setTab('list');
  }

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
        <button
          className={tab === 'import' ? 'tab active' : 'tab'}
          onClick={() => setTab('import')}
        >
          批量导入
        </button>
        <button
          className={tab === 'list' || tab === 'detail' ? 'tab active' : 'tab'}
          onClick={goToList}
        >
          内容列表
        </button>
        <button
          className={tab === 'dashboard' ? 'tab active' : 'tab'}
          onClick={() => setTab('dashboard')}
        >
          数据看板
        </button>
      </nav>

      {tab === 'form' && <ContentFormPage />}
      {tab === 'import' && <ContentImportPage />}
      {tab === 'list' && <ContentListPage onSelectContent={openDetail} />}
      {tab === 'detail' && selectedId !== null && (
        <ContentDetailPage contentId={selectedId} onBack={goToList} />
      )}
      {tab === 'dashboard' && <DashboardPage />}
    </div>
  );
}
