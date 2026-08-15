import { Request, Response } from 'express';
import { ContentStatus } from '../types';
import * as contentService from '../services/contentService';

/**
 * 查询内容列表，支持按 platform / status / owner / content_type 筛选，
 * 都是可选的 query 参数，不传就是查全部。
 */
export function listContents(req: Request, res: Response): void {
  const { platform, status, owner, content_type } = req.query;

  const filter: contentService.ContentFilter = {};
  if (typeof platform === 'string' && platform) filter.platform = platform;
  if (typeof status === 'string' && status) filter.status = status as ContentStatus;
  if (typeof owner === 'string' && owner) filter.owner = owner;
  if (typeof content_type === 'string' && content_type) filter.content_type = content_type;

  const rows = contentService.listContents(filter);
  res.json(rows);
}

/**
 * 创建一条内容记录。只在服务端硬性校验和数据库约束一致的两个必填字段
 * （发布平台、选题），其余字段是否必填交给前端表单引导用户填写完整。
 */
export function createContent(req: Request, res: Response): void {
  const body = req.body ?? {};
  const platform = typeof body.platform === 'string' ? body.platform.trim() : '';
  const topic = typeof body.topic === 'string' ? body.topic.trim() : '';

  if (!platform) {
    res.status(400).json({ error: '发布平台不能为空' });
    return;
  }
  if (!topic) {
    res.status(400).json({ error: '选题不能为空' });
    return;
  }

  try {
    const created = contentService.createContent({ ...body, platform, topic });
    res.status(201).json(created);
  } catch (err) {
    console.error('[createContent] failed:', err);
    res.status(500).json({ error: '保存失败，请稍后重试' });
  }
}
