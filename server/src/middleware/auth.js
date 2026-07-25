import { verifyToken } from '../auth.js'

// 从 Authorization: Bearer <token> 解析用户 id，写入 req.userId
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  const payload = token ? verifyToken(token) : null
  if (!payload || !payload.uid) {
    return res.status(401).json({ message: '未登录或登录已过期' })
  }
  req.userId = payload.uid
  next()
}
