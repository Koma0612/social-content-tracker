import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';
import { createContent, CreateContentInput } from './contentService';

// CSV 表头(中文，跟录入表单字段一一对应) -> 数据库字段名
const COLUMN_MAP: Record<string, keyof CreateContentInput> = {
  计划发布日期: 'planned_publish_date',
  发布平台: 'platform',
  选题: 'topic',
  内容类型: 'content_type',
  内容形式: 'content_format',
  内容目标: 'content_goal',
  关联Campaign: 'campaign',
  语言与目标市场: 'language_market',
  负责人: 'owner',
  文案: 'copywriting',
  素材来源: 'material_source',
};

export interface ImportFailure {
  row: number; // 第几行数据(不含表头，从 1 开始)
  reason: string;
}

export interface ImportResult {
  total: number;
  success_count: number;
  failed_count: number;
  failures: ImportFailure[];
}

/**
 * 把上传文件的原始字节解码成文本。
 * Excel 导出的 CSV 常见两种情况：UTF-8(可能带 BOM 头) 或者中文版 Excel 默认的 GBK。
 * 策略：先剥掉 UTF-8 BOM(如果有)，然后严格按 UTF-8 解码——如果失败(说明字节
 * 不是合法 UTF-8)，就改用 GBK 解码。这样两种常见情况都能正确处理，不会中文乱码。
 */
function decodeCsvBuffer(buf: Buffer): string {
  let bytes: Buffer = buf;
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    bytes = bytes.subarray(3);
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return iconv.decode(bytes, 'gbk');
  }
}

/**
 * 批量导入内容。每一行独立处理、独立校验——某几行数据有问题不会导致整批全部失败，
 * 校验通过的行正常写入，校验不通过的行记进 failures 列表，附带行号和具体原因。
 */
export function importContentsFromCsv(fileBuffer: Buffer): ImportResult {
  const text = decodeCsvBuffer(fileBuffer);

  let records: Record<string, string>[];
  try {
    records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    throw new Error('CSV 文件解析失败，请确认是标准的逗号分隔格式，且表头跟模板一致');
  }

  const failures: ImportFailure[] = [];
  let successCount = 0;

  records.forEach((record, idx) => {
    const rowNumber = idx + 1;

    // 用 Record<string, string|null> 收集字段值——CreateContentInput 里
    // platform/topic 是必填的 string(不允许 null)，用它做类型标注反而没法在
    // 循环里统一赋 null，这里先用宽松类型收集，下面校验完必填项后再拼成正式类型。
    const input: Record<string, string | null> = {};
    for (const [csvHeader, field] of Object.entries(COLUMN_MAP)) {
      const raw = record[csvHeader];
      input[field] = raw && raw.trim() ? raw.trim() : null;
    }

    const platform = input.platform?.trim();
    const topic = input.topic?.trim();

    if (!platform) {
      failures.push({ row: rowNumber, reason: '发布平台不能为空' });
      return;
    }
    if (!topic) {
      failures.push({ row: rowNumber, reason: '选题不能为空' });
      return;
    }

    try {
      createContent({ ...input, platform, topic } as CreateContentInput);
      successCount += 1;
    } catch (err) {
      failures.push({ row: rowNumber, reason: err instanceof Error ? err.message : '保存失败' });
    }
  });

  return {
    total: records.length,
    success_count: successCount,
    failed_count: failures.length,
    failures,
  };
}
