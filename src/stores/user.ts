import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import request from '@/api/request'
import { loadJSON } from '@/utils/storage'

const USER_KEY = 'ielts_user'
const TOKEN_KEY = 'ielts_token'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<User | null>(token.value ? loadJSON<User | null>(USER_KEY, null) : null)
  const isLoggedIn = computed(() => !!token.value)

  function setSession(t: string, u: User) {
    token.value = t
    user.value = u
    localStorage.setItem(TOKEN_KEY, t)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  }
  function clearSession() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  // 应用启动 / 路由守卫时调用：恢复本地会话并同步最新资料
  function init() {
    if (!token.value) {
      token.value = localStorage.getItem(TOKEN_KEY)
      if (token.value) user.value = loadJSON<User | null>(USER_KEY, null)
    }
    if (token.value && !user.value) user.value = loadJSON<User | null>(USER_KEY, null)
    if (token.value) refresh().catch(() => {})
  }

  async function refresh() {
    const { data } = await request.get<User>('/me')
    user.value = data
    localStorage.setItem(USER_KEY, JSON.stringify(data))
    return data
  }

  async function login(username: string, password: string) {
    const { data } = await request.post<{ token: string; user: User }>('/auth/login', {
      username,
      password
    })
    setSession(data.token, data.user)
    return data.user
  }

  async function register(username: string, password: string, targetBand?: number) {
    const { data } = await request.post<{ token: string; user: User }>('/auth/register', {
      username,
      password,
      targetBand
    })
    setSession(data.token, data.user)
    return data.user
  }

  function logout() {
    clearSession()
  }

  async function updateProfile(patch: Partial<User>) {
    if (!user.value) return
    const { data } = await request.put<User>('/me', patch)
    user.value = data
    localStorage.setItem(USER_KEY, JSON.stringify(data))
    return data
  }

  return { user, token, isLoggedIn, init, login, register, logout, updateProfile }
})
