import fs from 'fs';
import path from 'path';
import { db } from './connection';

/**
 * 启动时执行一次建表脚本。schema.sql 里全部用 CREATE TABLE IF NOT EXISTS，
 * 所以重复执行是安全的——不会清空已有数据。
 */
export function migrate(): void {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('[db] schema ready:', db.name);
}
