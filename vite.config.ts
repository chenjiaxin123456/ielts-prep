import { defineConfig, type ProxyOptions } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 仅开发环境把前端 /api 请求转发到本地 Express 后端（端口 3001）；
  // 预发/生产由对应 .env.<mode> 里的 VITE_API_BASE 决定真实后端地址，无需代理
  const proxy: Record<string, ProxyOptions> =
    mode === 'development'
      ? {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true
          }
        }
      : {}

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      host: true,
      port: 5173,
      proxy
    }
  }
})
