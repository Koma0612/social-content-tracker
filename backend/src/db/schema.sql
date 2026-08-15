-- 内容主表：一条社媒内容一行记录，贯穿计划 / 制作 / 复盘三个阶段
CREATE TABLE IF NOT EXISTS contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- 计划阶段
  planned_publish_date TEXT,
  platform TEXT NOT NULL,
  topic TEXT NOT NULL,
  content_type TEXT,
  content_format TEXT,
  content_goal TEXT,
  campaign TEXT,
  language_market TEXT,
  owner TEXT,

  -- 制作阶段
  copywriting TEXT,
  material_source TEXT,
  current_status TEXT NOT NULL DEFAULT '选题',
  status_entered_at TEXT NOT NULL DEFAULT (datetime('now')),
  current_owner TEXT,
  is_paid_promotion INTEGER NOT NULL DEFAULT 0,
  paid_amount REAL,

  -- 复盘阶段（发布后再补）
  actual_publish_date TEXT,
  publish_url TEXT,
  impressions INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  dm_count INTEGER,
  new_followers INTEGER,
  metrics_captured_at TEXT, -- 数据抓取时间：同一条内容不同时间点的数据不能直接比较

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 状态流转历史表：一条内容对应多条状态变化记录
CREATE TABLE IF NOT EXISTS status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  transition_type TEXT NOT NULL DEFAULT '正常推进', -- 正常推进 / 审核回退，看板用它统计"打回主要退到哪个环节"
  changed_by TEXT, -- 操作人：追踪是谁推进了这个环节
  changed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 审核记录表：一条内容对应多条审核记录（三个角色、可多轮）
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  reviewer_role TEXT NOT NULL, -- 老板 / 同事mentor / 英语母语者
  round_number INTEGER NOT NULL,
  result TEXT NOT NULL, -- 通过 / 打回
  comment TEXT,
  reviewed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 打回原因表：一条审核记录可以对应多个打回原因（多选）
CREATE TABLE IF NOT EXISTS review_reject_reasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reason TEXT NOT NULL -- 语言准确性 / 本地化表达 / 受众适配 / 视听呈现 / 内容结构
);

CREATE INDEX IF NOT EXISTS idx_status_history_content ON status_history(content_id);
CREATE INDEX IF NOT EXISTS idx_reviews_content ON reviews(content_id);
CREATE INDEX IF NOT EXISTS idx_review_reasons_review ON review_reject_reasons(review_id);
