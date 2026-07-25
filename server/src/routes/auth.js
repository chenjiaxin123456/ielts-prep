import { Router } from 'express'
import { nanoid } from 'nanoid'
import db from '../db.js'
import { signToken, hashPassword, comparePassword } from '../auth.js'

const r = Router()

r.post('/register', async (req, res) => {
  const { username, password, targetBand } = req.body || {}
  if (!username || !username.trim()) {
    return res.status(400).json({ message: '请输入用户名' })
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ message: '密码至少 4 位' })
  }
  const exist = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim())
  if (exist) {
    return res.status(409).json({ message: '用户名已存在' })
  }
  const id = 'u_' + nanoid(8)
  const hash = await hashPassword(password)
  db.prepare(
    'INSERT INTO users (id, username, password, target_band, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, username.trim(), hash, targetBand ?? 6.5, Date.now())

  const user = { id, username: username.trim(), targetBand: targetBand ?? 6.5 }
  res.json({ token: signToken(id), user })
})

r.post('/login', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ message: '请输入用户名和密码' })
  }
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim())
  if (!row) {
    return res.status(401).json({ message: '用户不存在' })
  }
  const ok = await comparePassword(password, row.password)
  if (!ok) {
    return res.status(401).json({ message: '密码错误' })
  }
  const user = {
    id: row.id,
    username: row.username,
    targetBand: row.target_band,
    examDate: row.exam_date
  }
  res.json({ token: signToken(row.id), user })
})

export default r
