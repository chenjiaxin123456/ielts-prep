// 轻量进程内内存缓存：用于题库列表 / 详情 / stats 等「读多写少」的数据。
// 目的：降低并发请求下 SQLite 同步查询 + JSON.parse 的开销，提升吞吐。
// 注意：缓存存在于后端进程内；seed:reset 在独立进程执行，故用 TTL 自动失效（默认 5 分钟），
// 重灌库后最多 5 分钟（或重启后端）即可看到最新数据。
const store = new Map()
const DEFAULT_TTL = 5 * 60 * 1000

export function cacheGet(key) {
  const hit = store.get(key)
  if (!hit) return null
  if (Date.now() > hit.exp) {
    store.delete(key)
    return null
  }
  return hit.val
}

export function cacheSet(key, val, ttl = DEFAULT_TTL) {
  store.set(key, { val, exp: Date.now() + ttl })
}

export function cacheClear() {
  store.clear()
}
