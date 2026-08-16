import { useState } from 'react';
import ContentFormPage from './pages/ContentFormPage';
import ContentListPage from './pages/ContentListPage';
import ContentDetailPage from './pages/ContentDetailPage';
import DashboardPage from './pages/DashboardPage';
import ContentImportPage from './pages/ContentImportPage';

// 页面还少，先用最简单的状态切换代替路由库(react-router-dom 当前有安全漏洞，
// 等页面进一步变多、需要独立网址分享时再评估要不要引入)。
// "批量导入"不算一个独立的主功能，而是"录入内容"的另一种方式，所以不占用
// 顶层导航的位置，收进"录入内容"页面右上角的一个小按钮里做二级切换。
type Tab = 'form' | 'list' | 'detail' | 'dashboard';
type EntryView = 'manual' | 'import';

export default function App() {
  const [tab, setTab] = useState<Tab>('form');
  const [entryView, setEntryView] = useState<EntryView>('manual');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  function openDetail(id: number) {
    setSelectedId(id);
    setTab('detail');
  }

  function goToList() {
    setTab('list');
  }

  function goToForm() {
    setTab('form');
    setEntryView('manual');
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>社媒内容生产流程管理系统</h1>
        <p className="subtitle">Social Content Workflow &amp; Performance Tracker</p>
      </header>

      <nav className="tab-nav">
        <button className={tab === 'form' ? 'tab active' : 'tab'} onClick={goToForm}>
          录入内容
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

      {tab === 'form' && entryView === 'manual' && (
        <ContentFormPage onSwitchToImport={() => setEntryView('import')} />
      )}
      {tab === 'form' && entryView === 'import' && (
        <ContentImportPage onSwitchToManual={() => setEntryView('manual')} />
      )}
      {tab === 'list' && <ContentListPage onSelectContent={openDetail} />}
      {tab === 'detail' && selectedId !== null && (
        <ContentDetailPage contentId={selectedId} onBack={goToList} />
      )}
      {tab === 'dashboard' && <DashboardPage />}
    </div>
  );
}
