import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { config } from './config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'data')
mkdirSync(dataDir, { recursive: true })

const db = new Database(config.dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  username    TEXT UNIQUE NOT NULL,
  password    TEXT,
  target_band REAL,
  exam_date   TEXT,
  created_at  INTEGER
);

-- 题目整条 JSON 存于 data 列，section 便于按科检索
-- source: 'practice'(练习库) | 'past'(历年真题风格库)；band: 雅思难度档(5.0-9.0) 实数，用于筛选/排序
CREATE TABLE IF NOT EXISTS questions (
  id      TEXT PRIMARY KEY,
  section TEXT NOT NULL,
  source  TEXT NOT NULL DEFAULT 'practice',
  band    REAL,
  data    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vocab (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  word       TEXT NOT NULL,
  meaning    TEXT,
  note       TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS mistakes (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  section       TEXT,
  title         TEXT,
  type          TEXT,
  topic         TEXT,
  your_answer   TEXT,
  correct_answer TEXT,
  created_at    INTEGER
);

CREATE TABLE IF NOT EXISTS progress (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  section     TEXT,
  question_id TEXT,
  title       TEXT,
  correct     INTEGER,
  total       INTEGER,
  at          INTEGER
);

CREATE INDEX IF NOT EXISTS idx_questions_section ON questions(section);

-- 文章模块：原创「人民日报风格」双语文章。data 存标题与中英段落数组，category/published_at 便于筛选。
CREATE TABLE IF NOT EXISTS articles (
  id           TEXT PRIMARY KEY,
  category     TEXT NOT NULL,
  source       TEXT NOT NULL DEFAULT 'people-daily-style',
  published_at TEXT,
  data         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at);
CREATE INDEX IF NOT EXISTS idx_vocab_user ON vocab(user_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_user ON mistakes(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
`)

// 迁移：已存在的旧库可能缺少 source/band 列，补加（列已存在则忽略报错）
try { db.exec("ALTER TABLE questions ADD COLUMN source TEXT NOT NULL DEFAULT 'practice'") } catch { /* 已存在 */ }
try { db.exec('ALTER TABLE questions ADD COLUMN band REAL') } catch { /* 已存在 */ }
// source/band 就绪后再建复合索引（列不存在时这里会失败，已捕获）
try { db.exec('CREATE INDEX IF NOT EXISTS idx_questions_section_source_band ON questions(section, source, band)') } catch { /* 已存在 */ }

// 迁移：已存在的旧库可能缺少 source/band 列，补加（列已存在则忽略报错）
try { db.exec("ALTER TABLE questions ADD COLUMN source TEXT NOT NULL DEFAULT 'practice'") } catch { /* 已存在 */ }
try { db.exec('ALTER TABLE questions ADD COLUMN band REAL') } catch { /* 已存在 */ }

export default db
