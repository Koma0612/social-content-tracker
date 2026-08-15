import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'tracker.db');

export const db = new Database(dbPath);

// WAL 模式提升读写并发性能；开启外键约束保证 status_history / reviews 的级联关系生效
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
