import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dataDir = join(root, 'data')

// 轻量 .env 解析（不依赖 dotenv 的合并语义，避免运行环境预注入 .env 造成变量被默认值覆盖）
function readEnvFile(p) {
  const out = {}
  if (!existsSync(p)) return out
  const text = readFileSync(p, 'utf8')
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

// 解析顺序（高 -> 低）：环境专属 .env.<env> > 进程环境变量(CLI/部署) > 基础 .env > 代码默认值
// 这样 CLI 指定的 PORT 不会被子项目 .env 覆盖，而预发/生产专属的 JWT_SECRET/CORS_ORIGIN 也必定胜过运行环境预注入的 .env 默认值。
const env = (process.env.NODE_ENV || 'development').toLowerCase()
const base = readEnvFile(join(root, '.env'))
const specific = readEnvFile(join(root, `.env.${env}`))

function resolve(key, def) {
  if (specific[key]) return specific[key]
  if (process.env[key]) return process.env[key]
  if (base[key]) return base[key]
  return def
}

const DEV_DEFAULT_SECRET = 'ielts_dev_secret_change_me'
const isDev = env === 'development'

const port = Number(resolve('PORT', '3001')) || 3001
const jwtSecret = resolve('JWT_SECRET', DEV_DEFAULT_SECRET)
const tokenExpireDays = Number(resolve('TOKEN_EXPIRE_DAYS', '7')) || 7
const corsOrigin = isDev
  ? true
  : (resolve('CORS_ORIGIN', '') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
const dbPath =
  resolve('DATABASE_PATH', '') ||
  (isDev ? join(dataDir, 'ielts.db') : join(dataDir, `ielts.${env}.db`))

export const config = {
  env,
  isDev,
  isStaging: env === 'staging',
  isProd: env === 'production',
  port,
  jwtSecret,
  tokenExpireDays,
  dbPath,
  corsOrigin,
  devDefaultSecret: DEV_DEFAULT_SECRET
}

if (!isDev && corsOrigin.length === 0) {
  console.warn(
    `[config] ⚠️ 环境 "${env}" 未配置 CORS_ORIGIN，将拒绝所有跨域请求。` +
      `如需前端跨域访问，请在 .env.${env} 或部署环境中设置 CORS_ORIGIN（逗号分隔的源列表）。`
  )
}

console.log(
  `[config] 环境=${env} | 端口=${port} | 数据库=${dbPath} | ` +
    `CORS=${corsOrigin === true ? 'allow-all(dev)' : corsOrigin.join(',') || '(none)'}`
)
