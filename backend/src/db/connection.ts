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

// 建表放在连接建立后立刻执行(而不是放在 index.ts 里、等所有 import 都跑完再调用)。
// 原因：service 文件(如 contentService.ts / statusService.ts)在被 import 的那一刻,
// 模块顶层就会调用 db.prepare() 预编译 SQL 语句——如果建表逻辑写在别处、
// 靠 index.ts 显式调用触发，一旦哪个 service 在 index.ts 调用建表之前被 import，
// 就会出现"表还没建出来，prepare 就先执行了"的报错。放在这里可以保证：
// 任何模块只要 import { db }，就一定已经建好表了，不用关心谁先谁后。
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);
console.log('[db] schema ready:', dbPath);
