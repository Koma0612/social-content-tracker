import { Request, Response } from 'express';
import { importContentsFromCsv } from '../services/importService';

/**
 * 接收前端传来的文件内容(base64 编码，避免引入 multer 这类专门处理文件上传的
 * 中间件——项目里目前只有这一处文件上传需求，用现成的 JSON 接口+ base64 更简单)。
 */
export function importContents(req: Request, res: Response): void {
  const { content_base64 } = req.body ?? {};

  if (typeof content_base64 !== 'string' || !content_base64) {
    res.status(400).json({ error: '没有收到文件内容' });
    return;
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(content_base64, 'base64');
  } catch {
    res.status(400).json({ error: '文件内容解析失败' });
    return;
  }

  try {
    const result = importContentsFromCsv(buffer);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : '导入失败，请稍后重试' });
  }
}
