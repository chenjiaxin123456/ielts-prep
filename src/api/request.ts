import axios from 'axios'

// 后端基地址：默认同源 /api（开发由 Vite 代理转发到 :3001，生产由后端直接托管）
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000
})

const TOKEN_KEY = 'ielts_token'

// 请求拦截：自动附加 JWT
request.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：401 时清理本地登录态（不自动跳转，跳转交由路由守卫处理）
request.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('ielts_user')
    }
    return Promise.reject(err)
  }
)

export default request
