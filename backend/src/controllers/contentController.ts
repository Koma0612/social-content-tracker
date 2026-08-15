import { Request, Response } from 'express';
import { db } from '../db/connection';
import { ContentRecord } from '../types';

/**
 * 阶段一占位实现：先证明"接口 -> 数据库"这条链路是通的。
 * 真正的录入 / 筛选逻辑在阶段二实现。
 */
export function listContents(_req: Request, res: Response): void {
  const rows = db
    .prepare('SELECT * FROM contents ORDER BY id DESC')
    .all() as ContentRecord[];
  res.json(rows);
}
