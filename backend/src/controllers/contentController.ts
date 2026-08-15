import { Request, Response } from 'express';
import { db } from '../db/connection';
import { ContentRecord } from '../types';
import * as contentService from '../services/contentService';

/**
 * 阶段一占位实现：先证明"接口 -> 数据库"这条链路是通的。
 * 真正的筛选参数在阶段二后半段（列表 + 筛选）补上。
 */
export function listContents(_req: Request, res: Response): void {
  const rows = db
    .prepare('SELECT * FROM contents ORDER BY id DESC')
    .all() as ContentRecord[];
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
