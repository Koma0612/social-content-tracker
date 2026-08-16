/**
 * 把单个字段转成合法的 CSV 字段值——如果内容包含逗号、引号或换行，
 * 需要用双引号包起来，内部的双引号要转义成两个双引号(CSV 标准写法)。
 */
export function escapeCsvField(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsvContent(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(escapeCsvField).join(',')).join('\r\n');
}

// UTF-8 BOM：不加这个字符，Excel 打开导出的 CSV 时中文会乱码。
// 用 \uFEFF 转义写法而不是直接放一个看不见的字符在源码里，避免被编辑器/工具意外改动。
const UTF8_BOM = '\uFEFF';

/**
 * 触发浏览器下载一个 CSV 文件。
 */
export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([UTF8_BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
