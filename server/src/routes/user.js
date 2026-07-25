import { Router } from 'express'
import { nanoid } from 'nanoid'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const r = Router()
r.use(requireAuth)

function publicUser(row) {
  return { id: row.id, username: row.username, targetBand: row.target_band, examDate: row.exam_date }
}

// 当前用户信息
r.get('/me', (req, res) => {
  const row = db.prepare('SELECT id, username, target_band, exam_date FROM users WHERE id = ?').get(req.userId)
  if (!row) return res.status(404).json({ message: '用户不存在' })
  res.json(publicUser(row))
})

r.put('/me', (req, res) => {
  const { targetBand, examDate } = req.body || {}
  db.prepare('UPDATE users SET target_band = ?, exam_date = ? WHERE id = ?').run(
    targetBand ?? null,
    examDate ?? null,
    req.userId
  )
  const row = db.prepare('SELECT id, username, target_band, exam_date FROM users WHERE id = ?').get(req.userId)
  res.json(publicUser(row))
})

// ===== 生词本 =====
r.get('/vocab', (req, res) => {
  const rows = db
    .prepare('SELECT id, word, meaning, note, created_at AS createdAt FROM vocab WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.userId)
  res.json(rows)
})

r.post('/vocab', (req, res) => {
  const { word, meaning, note } = req.body || {}
  const w = (word || '').trim()
  const m = (meaning || '').trim()
  if (!w) return res.status(400).json({ message: '请输入单词' })
  const exist = db.prepare('SELECT id FROM vocab WHERE user_id = ? AND lower(word) = lower(?)').get(req.userId, w)
  if (exist) return res.status(409).json({ message: '该词已在生词本中' })
  const id = 'v_' + nanoid(8)
  const at = Date.now()
  db.prepare(
    'INSERT INTO vocab (id, user_id, word, meaning, note, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, req.userId, w, m, note || '', at)
  res.json({ id, word: w, meaning: m, note: note || '', createdAt: at })
})

r.delete('/vocab/:id', (req, res) => {
  db.prepare('DELETE FROM vocab WHERE id = ? AND user_id = ?').run(req.params.id, req.userId)
  res.json({ ok: true })
})

r.delete('/vocab', (req, res) => {
  db.prepare('DELETE FROM vocab WHERE user_id = ?').run(req.userId)
  res.json({ ok: true })
})

// ===== 错题集 =====
r.get('/mistakes', (req, res) => {
  const rows = db.prepare('SELECT * FROM mistakes WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
  res.json(rows)
})

r.post('/mistakes', (req, res) => {
  const { id, section, title, type, topic, yourAnswer, correctAnswer } = req.body || {}
  if (!id) return res.status(400).json({ message: '缺少题目 id' })
  const at = Date.now()
  const exist = db.prepare('SELECT id FROM mistakes WHERE user_id = ? AND id = ?').get(req.userId, id)
  if (exist) {
    db.prepare(
      `UPDATE mistakes SET section=?, title=?, type=?, topic=?, your_answer=?, correct_answer=?, created_at=?
       WHERE user_id=? AND id=?`
    ).run(section, title, type, topic, yourAnswer, correctAnswer, at, req.userId, id)
  } else {
    db.prepare(
      `INSERT INTO mistakes (id, user_id, section, title, type, topic, your_answer, correct_answer, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, req.userId, section, title, type, topic, yourAnswer, correctAnswer, at)
  }
  res.json({ ok: true })
})

r.delete('/mistakes/:id', (req, res) => {
  db.prepare('DELETE FROM mistakes WHERE id = ? AND user_id = ?').run(req.params.id, req.userId)
  res.json({ ok: true })
})

r.delete('/mistakes', (req, res) => {
  db.prepare('DELETE FROM mistakes WHERE user_id = ?').run(req.userId)
  res.json({ ok: true })
})

// ===== 练习记录 =====
r.get('/progress', (req, res) => {
  const rows = db.prepare('SELECT * FROM progress WHERE user_id = ? ORDER BY at DESC').all(req.userId)
  res.json(rows)
})

r.post('/progress', (req, res) => {
  const { section, questionId, title, correct, total } = req.body || {}
  if (!section) return res.status(400).json({ message: '缺少 section' })
  const id = 'p_' + nanoid(8)
  db.prepare(
    'INSERT INTO progress (id, user_id, section, question_id, title, correct, total, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.userId, section, questionId, title, correct ?? 0, total ?? 0, Date.now())
  res.json({ ok: true })
})

export default r
