import { ChangeEvent, useState } from 'react';
import { importContents, ImportResult } from '../api/client';
import { buildCsvContent, downloadCsv } from '../utils/csv';

const TEMPLATE_HEADERS = [
  '计划发布日期',
  '发布平台',
  '选题',
  '内容类型',
  '内容形式',
  '内容目标',
  '关联Campaign',
  '语言与目标市场',
  '负责人',
  '文案',
  '素材来源',
];

const TEMPLATE_EXAMPLE_ROW = [
  '2026-09-01',
  'Facebook',
  '示例:新品上市预告短视频',
  '产品卖点',
  '短视频',
  '品牌曝光',
  '新品推广',
  '英语/北美市场',
  'Amy',
  '',
  '',
];

/**
 * 把文件的 ArrayBuffer 转成 base64 字符串。分块转换是为了避免大文件时
 * String.fromCharCode(...bytes) 展开参数过多导致栈溢出。
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export default function ContentImportPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<ArrayBuffer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleDownloadTemplate() {
    const csv = buildCsvContent([TEMPLATE_HEADERS, TEMPLATE_EXAMPLE_ROW]);
    downloadCsv('内容导入模板.csv', csv);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setResult(null);
    setError(null);

    if (!file) {
      setFileName(null);
      setFileContent(null);
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setFileContent(reader.result as ArrayBuffer);
    reader.onerror = () => setError('文件读取失败，请重试');
    reader.readAsArrayBuffer(file);
  }

  async function handleImport() {
    if (!fileContent) return;

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const base64 = arrayBufferToBase64(fileContent);
      const res = await importContents(base64);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="import-page">
      <h2>批量导入内容</h2>
      <p className="hint">
        先下载模板，在 Excel 里按模板格式填好数据、另存为 CSV，再上传导入。只支持导入计划阶段的字段(选题、平台等)，审核记录和发布后的复盘数据不支持批量导入。
      </p>

      <button type="button" className="btn-secondary" onClick={handleDownloadTemplate}>
        下载导入模板
      </button>

      <div className="import-upload">
        <input type="file" accept=".csv" onChange={handleFileChange} />
        <button
          type="button"
          className="btn-primary"
          onClick={handleImport}
          disabled={!fileContent || submitting}
        >
          {submitting ? '导入中…' : '开始导入'}
        </button>
      </div>

      {fileName && !result && !error && <p className="hint">已选择文件：{fileName}</p>}
      {error && <div className="banner banner-error">{error}</div>}

      {result && (
        <div className="import-result">
          <div className="stat-row">
            <div className="stat-card">
              <span className="stat-label">总行数</span>
              <span className="stat-value">{result.total}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">成功</span>
              <span className="stat-value stat-value-success">{result.success_count}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">失败</span>
              <span className="stat-value stat-value-danger">{result.failed_count}</span>
            </div>
          </div>

          {result.failures.length > 0 && (
            <div className="table-wrap import-failures">
              <table className="content-table">
                <thead>
                  <tr>
                    <th>行号</th>
                    <th>失败原因</th>
                  </tr>
                </thead>
                <tbody>
                  {result.failures.map((f) => (
                    <tr key={f.row}>
                      <td>第 {f.row} 行</td>
                      <td>{f.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
