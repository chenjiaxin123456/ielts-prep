import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'

import './db.js' // 初始化表结构
import compression from 'compression'
import { config } from './config.js'
import questions from './routes/questions.js'
import articles from './routes/articles.js'
import auth from './routes/auth.js'
import user from './routes/user.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = config.port

// 安全校验：预发/生产必须使用自定义 JWT_SECRET，禁止沿用开发默认弱密钥
if (!config.isDev && config.jwtSecret === config.devDefaultSecret) {
  console.error(
    `[server] ❌ 安全校验失败：环境 "${config.env}" 下必须通过环境变量 JWT_SECRET 设置自定义密钥，` +
      `不能使用默认开发密钥。请在 .env.${config.env} 或部署环境中配置 JWT_SECRET（可用 openssl rand -base64 48 生成）。`
  )
  process.exit(1)
}

app.use(compression()) // gzip 压缩 JSON 响应，提升并发吞吐
app.use(cors({ origin: config.corsOrigin }))
app.use(express.json())

// API 响应禁止浏览器缓存：避免数据接口被缓存成 304 后，前端 axios(XHR) 拿到空响应体
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

// 健康检查
app.get('/api/health', (req, res) => res.json({ ok: true, time: Date.now() }))

// 路由挂载
app.use('/api/auth', auth) // /api/auth/register, /api/auth/login
app.use('/api/articles', articles) // /api/articles, /api/articles/:id, /api/articles/stats（须在 /api 之前）
app.use('/api', questions) // /api/listening, /api/listening/:id ...
app.use('/api', user) // /api/me, /api/vocab, /api/mistakes, /api/progress

// 生产环境：托管已构建的前端（vite build 产物）
const dist = join(__dirname, '..', '..', 'dist')
if (existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(join(dist, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`✅ IELTS 后端已启动: http://localhost:${PORT}`)
})
