import { Request, Response } from 'express';
import { ContentStatus } from '../types';
import * as contentService from '../services/contentService';
import { MetricsError } from '../services/contentService';
import * as statusService from '../services/statusService';
import { TransitionError } from '../services/statusService';

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

/**
 * 查询单条内容详情(带阻塞天数)。
 */
export function getContent(req: Request, res: Response): void {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: '无效的内容 ID' });
    return;
  }

  const content = contentService.getContentById(id);
  if (!content) {
    res.status(404).json({ error: '内容不存在' });
    return;
  }
  res.json(content);
}

/**
 * 查询单条内容的状态变化历史（时间线）。
 */
export function getContentHistory(req: Request, res: Response): void {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: '无效的内容 ID' });
    return;
  }

  res.json(statusService.getStatusHistory(id));
}

/**
 * 推进 / 回退内容状态。合法性校验(能不能这么变)在 statusService 里做,
 * 这里只负责把请求参数转成 service 需要的形状,以及把校验失败转成 400。
 */
export function transitionContentStatus(req: Request, res: Response): void {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: '无效的内容 ID' });
    return;
  }

  const { to_status, changed_by, new_owner } = req.body ?? {};
  if (typeof to_status !== 'string' || !to_status) {
    res.status(400).json({ error: '目标状态不能为空' });
    return;
  }

  try {
    const updated = statusService.transitionStatus({
      contentId: id,
      toStatus: to_status as ContentStatus,
      changedBy: typeof changed_by === 'string' ? changed_by : null,
      newOwner: typeof new_owner === 'string' ? new_owner : null,
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof TransitionError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error('[transitionContentStatus] failed:', err);
    res.status(500).json({ error: '状态变更失败，请稍后重试' });
  }
}

const METRIC_NUMBER_FIELDS = [
  'impressions',
  'likes',
  'comments',
  'shares',
  'saves',
  'dm_count',
  'new_followers',
] as const;

/**
 * 把请求体里的一个数字字段安全地转成 number | null。
 * 关键点：不填(undefined)、显式传 null、传空字符串，统一当成"没有这个数据"存成 NULL；
 * 只有真的是一个合法数字才存那个数字——绝不能把"没填"悄悄当成 0，
 * 否则会拉低平台/内容目标的平均值,导致统计结论失真。
 */
function parseOptionalNumber(value: unknown, fieldLabel: string): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) {
    throw new MetricsError(`${fieldLabel} 必须是数字`);
  }
  return num;
}

/**
 * 更新一条内容的复盘数据。只允许在"发布"状态下更新，支持重复调用覆盖式更新。
 */
export function updateContentMetrics(req: Request, res: Response): void {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: '无效的内容 ID' });
    return;
  }

  const body = req.body ?? {};

  try {
    const input: contentService.UpdateMetricsInput = {
      actual_publish_date:
        typeof body.actual_publish_date === 'string' && body.actual_publish_date
          ? body.actual_publish_date
          : null,
      publish_url: typeof body.publish_url === 'string' && body.publish_url ? body.publish_url : null,
    };
    for (const field of METRIC_NUMBER_FIELDS) {
      input[field] = parseOptionalNumber(body[field], field);
    }

    const updated = contentService.updateMetrics(id, input);
    res.json(updated);
  } catch (err) {
    if (err instanceof MetricsError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error('[updateContentMetrics] failed:', err);
    res.status(500).json({ error: '保存复盘数据失败，请稍后重试' });
  }
}
