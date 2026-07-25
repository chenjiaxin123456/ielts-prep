import { Router } from 'express'
import db from '../db.js'
import { cacheGet, cacheSet } from '../cache.js'

const r = Router()

const DEFAULT_PAGE_SIZE = 24
const MAX_PAGE_SIZE = 100
const SECTIONS = ['listening', 'reading', 'writing', 'speaking']

// 解析分页参数：优先 page/pageSize；兼容旧调用方的 limit/offset
function parsePagination(req) {
  let page = parseInt(req.query.page, 10)
  let pageSize = parseInt(req.query.pageSize, 10)
  if (req.query.limit !== undefined) {
    pageSize = Math.max(1, Math.min(parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE))
    const offset = parseInt(req.query.offset, 10) || 0
    page = Math.floor(offset / pageSize) + 1
  } else {
    if (!Number.isFinite(page) || page < 1) page = 1
    if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = DEFAULT_PAGE_SIZE
    pageSize = Math.min(pageSize, MAX_PAGE_SIZE)
  }
  return { page, pageSize, offset: (page - 1) * pageSize }
}

// 列表：默认分页，始终返回 { total, count, page, pageSize, items }
// 筛选：type（通用题型）/ task（写作 1|2）/ part（口语 1|2|3）
//       bandMax / bandMin（雅思难度档 5.0-9.0，目标分数筛选，从易到难）/ source（practice|past）/ year（真题年份）
function listBySection(section, req) {
  const { page, pageSize, offset } = parsePagination(req)
  const type = req.query.type ? String(req.query.type) : null
  const task = req.query.task !== undefined && req.query.task !== '' ? Number(req.query.task) : null
  const part = req.query.part !== undefined && req.query.part !== '' ? Number(req.query.part) : null
  const source = req.query.source ? String(req.query.source) : null
  const year = req.query.year !== undefined && req.query.year !== '' ? Number(req.query.year) : null
  const bandMax = req.query.bandMax !== undefined && req.query.bandMax !== '' ? Number(req.query.bandMax) : null
  const bandMin = req.query.bandMin !== undefined && req.query.bandMin !== '' ? Number(req.query.bandMin) : null

  const conds = ['section = ?']
  const params = [section]
  if (type) { conds.push("json_extract(data, '$.type') = ?"); params.push(type) }
  if (task) { conds.push("json_extract(data, '$.task') = ?"); params.push(task) }
  if (part) { conds.push("json_extract(data, '$.part') = ?"); params.push(part) }
  if (source) { conds.push('source = ?'); params.push(source) }
  if (year) { conds.push("json_extract(data, '$.year') = ?"); params.push(year) }
  if (bandMax !== null) { conds.push('band <= ?'); params.push(bandMax) }
  if (bandMin !== null) { conds.push('band >= ?'); params.push(bandMin) }
  const where = 'WHERE ' + conds.join(' AND ')

  // 缓存键包含全部筛选参数
  const cacheKey = `list:${section}:p${page}:s${pageSize}:t${type || ''}:tk${task ?? ''}:pt${part ?? ''}:src${source || ''}:y${year ?? ''}:bmax${bandMax ?? ''}:bmin${bandMin ?? ''}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  // 默认按 band 升序（易→难）；无 band 的落在最前
  const rows = db
    .prepare(`SELECT data FROM questions ${where} ORDER BY band IS NULL, band ASC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset)
    .map((x) => JSON.parse(x.data))
  const total = db.prepare(`SELECT COUNT(*) AS c FROM questions ${where}`).get(...params).c
  const result = { total, count: rows.length, page, pageSize, items: rows }
  cacheSet(cacheKey, result)
  return result
}

function getById(section, id) {
  const cacheKey = `item:${section}:${id}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached
  const row = db.prepare('SELECT data FROM questions WHERE section = ? AND id = ?').get(section, id)
  const q = row ? JSON.parse(row.data) : null
  if (q) cacheSet(cacheKey, q)
  return q
}

for (const s of SECTIONS) {
  r.get(`/${s}`, (req, res) => res.json(listBySection(s, req)))
  r.get(`/${s}/:id`, (req, res) => {
    const q = getById(s, req.params.id)
    if (!q) return res.status(404).json({ message: '题目不存在' })
    res.json(q)
  })
}

// 四科题目总数（首页统计用）；按 source 拆分 practice / past
r.get('/stats', (req, res) => {
  const cached = cacheGet('stats')
  if (cached) return res.json(cached)
  const out = { practice: {}, past: {} }
  for (const s of SECTIONS) {
    out.practice[s] = db.prepare("SELECT COUNT(*) AS c FROM questions WHERE section = ? AND source = 'practice'").get(s).c
    out.past[s] = db.prepare("SELECT COUNT(*) AS c FROM questions WHERE section = ? AND source = 'past'").get(s).c
  }
  out.practice.total = SECTIONS.reduce((a, s) => a + out.practice[s], 0)
  out.past.total = SECTIONS.reduce((a, s) => a + out.past[s], 0)
  out.total = out.practice.total + out.past.total
  cacheSet('stats', out)
  res.json(out)
})

export default r
