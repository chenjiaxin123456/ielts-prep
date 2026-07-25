import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MistakeRecord, Section } from '@/types'
import request from '@/api/request'
import { loadJSON, saveJSON } from '@/utils/storage'

const KEY = 'ielts_mistakes'
const TOKEN_KEY = 'ielts_token'
const hasToken = () => !!localStorage.getItem(TOKEN_KEY)

export const useMistakeStore = defineStore('mistake', () => {
  const list = ref<MistakeRecord[]>(loadJSON<MistakeRecord[]>(KEY, []))

  const bySection = computed(() => {
    const map: Record<Section, MistakeRecord[]> = {
      listening: [],
      reading: [],
      writing: [],
      speaking: []
    }
    for (const m of list.value) map[m.section].push(m)
    return map
  })

  async function load() {
    if (!hasToken()) {
      list.value = loadJSON<MistakeRecord[]>(KEY, [])
      return
    }
    try {
      const { data } = await request.get<MistakeRecord[]>('/mistakes')
      list.value = data
      saveJSON(KEY, list.value)
    } catch {
      /* 保留本地缓存 */
    }
  }

  // 加入错题：按 id 去重，保留最新一次作答
  async function add(record: Omit<MistakeRecord, 'createdAt'>) {
    const idx = list.value.findIndex((m) => m.id === record.id)
    const full: MistakeRecord = { ...record, createdAt: Date.now() }
    if (idx >= 0) list.value[idx] = full
    else list.value.unshift(full)
    saveJSON(KEY, list.value)
    if (hasToken()) {
      try {
        await request.post('/mistakes', record)
      } catch {
        /* ignore */
      }
    }
  }

  async function remove(id: string) {
    list.value = list.value.filter((m) => m.id !== id)
    saveJSON(KEY, list.value)
    if (hasToken()) {
      try {
        await request.delete(`/mistakes/${id}`)
      } catch {
        /* ignore */
      }
    }
  }

  async function clear() {
    list.value = []
    saveJSON(KEY, list.value)
    if (hasToken()) {
      try {
        await request.delete('/mistakes')
      } catch {
        /* ignore */
      }
    }
  }

  return { list, bySection, load, add, remove, clear }
})
