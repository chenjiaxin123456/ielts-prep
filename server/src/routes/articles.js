import { Router } from 'express'
import db from '../db.js'
import { cacheGet, cacheSet } from '../cache.js'

const r = Router()

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100
const CATEGORIES = ['politics', 'economy', 'culture', 'technology', 'environment', 'society', 'world', 'education', 'health', 'sports']

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

// 列表：分页 + 类目筛选 + 关键词搜索（中英文皆可）+ 按发布日期倒序
function listArticles(req) {
  const { page, pageSize, offset } = parsePagination(req)
  const category = req.query.category && CATEGORIES.includes(req.query.category) ? req.query.category : null
  const keyword = req.query.keyword ? String(req.query.keyword).trim() : null

  const conds = []
  const params = []
  if (category) { conds.push('category = ?'); params.push(category) }
  if (keyword) { conds.push('data LIKE ?'); params.push(`%${keyword}%`) }
  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : ''

  const cacheKey = `articles:list:p${page}:s${pageSize}:c${category || ''}:k${keyword || ''}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const rows = db
    .prepare(`SELECT data FROM articles ${where} ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset)
  const items = rows.map((x) => {
    const a = JSON.parse(x.data)
    const excerpt = (a.body_en && a.body_en[0] ? a.body_en[0] : '').slice(0, 140)
    return {
      id: a.id,
      title_en: a.title_en,
      title_zh: a.title_zh,
      category: a.category,
      category_zh: a.category_zh,
      published_at: a.published_at,
      excerpt_en: excerpt,
    }
  })
  const total = db.prepare(`SELECT COUNT(*) AS c FROM articles ${where}`).get(...params).c
  const result = { total, count: items.length, page, pageSize, items }
  cacheSet(cacheKey, result)
  return result
}

function getById(id) {
  const cacheKey = `articles:item:${id}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached
  const row = db.prepare('SELECT data FROM articles WHERE id = ?').get(id)
  const a = row ? JSON.parse(row.data) : null
  if (a) cacheSet(cacheKey, a)
  return a
}

r.get('/', (req, res) => res.json(listArticles(req)))

// 类目统计（前端筛选条用）—— 必须在 /:id 之前，否则会被 :id 拦截
r.get('/stats', (req, res) => {
  const cached = cacheGet('articles:stats')
  if (cached) return res.json(cached)
  const out = { categories: {}, total: 0 }
  for (const c of CATEGORIES) {
    out.categories[c] = db.prepare('SELECT COUNT(*) AS c FROM articles WHERE category = ?').get(c).c
  }
  out.total = db.prepare('SELECT COUNT(*) AS c FROM articles').get().c
  cacheSet('articles:stats', out)
  res.json(out)
})

r.get('/:id', (req, res) => {
  const a = getById(req.params.id)
  if (!a) return res.status(404).json({ message: '文章不存在' })
  res.json(a)
})

export default r
