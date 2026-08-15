import { db } from '../db/connection';
import { ContentRecord, ContentStatus, ContentWithBlockInfo } from '../types';
import { attachBlockInfo } from './statusService';

export interface ContentFilter {
  platform?: string;
  status?: ContentStatus;
  owner?: string; // 模糊匹配,负责人是自由文本字段,没有固定枚举
  content_type?: string;
}

/**
 * 按条件筛选内容列表。所有条件都是可选的,不传就是查全部。
 * 用具名参数(@platform 等)拼 SQL,better-sqlite3 会自动做参数转义,避免 SQL 注入。
 * 返回的每一行都附带阻塞天数(blocked_days / is_blocked),供列表页直接展示。
 */
export function listContents(filter: ContentFilter = {}): ContentWithBlockInfo[] {
  const conditions: string[] = [];
  const params: Record<string, string> = {};

  if (filter.platform) {
    conditions.push('platform = @platform');
    params.platform = filter.platform;
  }
  if (filter.status) {
    conditions.push('current_status = @status');
    params.status = filter.status;
  }
  if (filter.owner) {
    conditions.push('owner LIKE @owner');
    params.owner = `%${filter.owner}%`;
  }
  if (filter.content_type) {
    conditions.push('content_type = @content_type');
    params.content_type = filter.content_type;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db
    .prepare(`SELECT * FROM contents ${where} ORDER BY id DESC`)
    .all(params) as ContentRecord[];

  return rows.map(attachBlockInfo);
}

export function getContentById(id: number): ContentWithBlockInfo | undefined {
  const row = db.prepare('SELECT * FROM contents WHERE id = ?').get(id) as
    | ContentRecord
    | undefined;
  return row ? attachBlockInfo(row) : undefined;
}

export interface CreateContentInput {
  planned_publish_date?: string | null;
  platform: string;
  topic: string;
  content_type?: string | null;
  content_format?: string | null;
  content_goal?: string | null;
  campaign?: string | null;
  language_market?: string | null;
  owner?: string | null;
  copywriting?: string | null;
  material_source?: string | null;
}

// 一条内容刚被创建出来，本质上就是"进入选题环节"这个动作本身，
// 所以录入的同时也在 status_history 里补一条初始记录，
// 这样从第一条数据开始，状态历史就是完整的，阶段三做状态流转时不用回头补数据。
const INITIAL_STATUS: ContentStatus = '选题';

const insertContentStmt = db.prepare(`
  INSERT INTO contents (
    planned_publish_date, platform, topic, content_type, content_format,
    content_goal, campaign, language_market, owner,
    copywriting, material_source,
    current_status, status_entered_at, current_owner
  ) VALUES (
    @planned_publish_date, @platform, @topic, @content_type, @content_format,
    @content_goal, @campaign, @language_market, @owner,
    @copywriting, @material_source,
    @current_status, datetime('now'), @current_owner
  )
`);

const insertHistoryStmt = db.prepare(`
  INSERT INTO status_history (content_id, from_status, to_status, transition_type, changed_by, changed_at)
  VALUES (?, NULL, ?, '正常推进', ?, datetime('now'))
`);

const getByIdStmt = db.prepare('SELECT * FROM contents WHERE id = ?');

const createContentTxn = db.transaction((input: CreateContentInput): number => {
  const result = insertContentStmt.run({
    planned_publish_date: input.planned_publish_date ?? null,
    platform: input.platform,
    topic: input.topic,
    content_type: input.content_type ?? null,
    content_format: input.content_format ?? null,
    content_goal: input.content_goal ?? null,
    campaign: input.campaign ?? null,
    language_market: input.language_market ?? null,
    owner: input.owner ?? null,
    copywriting: input.copywriting ?? null,
    material_source: input.material_source ?? null,
    current_status: INITIAL_STATUS,
    current_owner: input.owner ?? null,
  });

  const contentId = Number(result.lastInsertRowid);
  insertHistoryStmt.run(contentId, INITIAL_STATUS, input.owner ?? null);
  return contentId;
});

/**
 * 创建一条内容记录。写 contents 表 + 写 status_history 表放在同一个事务里，
 * 保证两个表要么一起成功，要么一起失败，不会出现"内容存了但没有状态记录"的半截数据。
 */
export function createContent(input: CreateContentInput): ContentRecord {
  const contentId = createContentTxn(input);
  return getByIdStmt.get(contentId) as ContentRecord;
}
