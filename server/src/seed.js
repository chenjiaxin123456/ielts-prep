import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import db from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
// server/src -> 项目根/src/mock
const mockDir = join(__dirname, '..', '..', 'src', 'mock')
const generatedDir = join(mockDir, 'generated')
const pastDir = join(mockDir, 'past')

const shouldReset = process.argv.includes('--reset') || process.env.RESEED === '1'

// 优先用生成的大题库；practice 来自 generated/，past 来自 past/
const sections = ['listening', 'reading', 'writing', 'speaking']
const articlesDir = join(mockDir, 'articles')

function loadSection(file, dir) {
  const p = join(dir, `${file}.json`)
  if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'))
  return []
}

if (shouldReset) {
  db.prepare('DELETE FROM questions').run()
  db.prepare('DELETE FROM articles').run()
  console.log('已清空 questions / articles 表，准备重灌。')
}

const existing = db.prepare('SELECT COUNT(*) AS c FROM questions').get().c
if (existing > 0 && !shouldReset) {
  console.log(`题目已存在 ${existing} 条，跳过 seed（如需重灌：npm run seed -- --reset）。`)
  process.exit(0)
}

const insert = db.prepare(
  'INSERT OR REPLACE INTO questions (id, section, source, band, data) VALUES (?, ?, ?, ?, ?)'
)
const insertArticle = db.prepare(
  'INSERT OR REPLACE INTO articles (id, category, source, published_at, data) VALUES (?, ?, ?, ?, ?)'
)

const tx = db.transaction(() => {
  // practice
  for (const s of sections) {
    const arr = loadSection(s, generatedDir)
    let n = 0
    for (const q of arr) {
      insert.run(q.id, s, q.source || 'practice', q.band ?? null, JSON.stringify(q))
      n++
    }
    console.log(`seeded ${n} ${s} (practice)`)
  }
  // past（历年真题风格库）
  for (const s of sections) {
    const arr = loadSection(s, pastDir)
    if (!arr.length) continue
    let n = 0
    for (const q of arr) {
      insert.run(q.id, s, q.source || 'past', q.band ?? null, JSON.stringify(q))
      n++
    }
    console.log(`seeded ${n} ${s} (past)`)
  }
  // articles（人民日报风格双语文章库）
  const catKeys = ['politics', 'economy', 'culture', 'technology', 'environment', 'society', 'world', 'education', 'health', 'sports']
  let na = 0
  for (const ck of catKeys) {
    const arr = loadSection(ck, articlesDir)
    if (!arr.length) continue
    for (const a of arr) {
      insertArticle.run(a.id, a.category, a.source || 'people-daily-style', a.published_at, JSON.stringify(a))
      na++
    }
    console.log(`seeded ${arr.length} articles (${ck})`)
  }
  if (na) console.log(`articles 合计 ${na}`)
})
tx()
const total = db.prepare('SELECT COUNT(*) AS c FROM questions').get().c
const bySource = {}
for (const src of ['practice', 'past']) {
  bySource[src] = db.prepare('SELECT COUNT(*) AS c FROM questions WHERE source = ?').get(src).c
}
const articleTotal = db.prepare('SELECT COUNT(*) AS c FROM articles').get().c
console.log(`seed 完成。题目总计 ${total}（practice=${bySource.practice} past=${bySource.past}），文章总计 ${articleTotal}`)
