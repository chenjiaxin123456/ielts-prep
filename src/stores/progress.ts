import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PracticeRecord, Section } from '@/types'
import request from '@/api/request'
import { loadJSON, saveJSON } from '@/utils/storage'

const KEY = 'ielts_progress'
const TOKEN_KEY = 'ielts_token'
const hasToken = () => !!localStorage.getItem(TOKEN_KEY)

export const useProgressStore = defineStore('progress', () => {
  const records = ref<PracticeRecord[]>(loadJSON<PracticeRecord[]>(KEY, []))

  const accuracyBySection = computed(() => {
    const stat: Record<Section, { correct: number; total: number }> = {
      listening: { correct: 0, total: 0 },
      reading: { correct: 0, total: 0 },
      writing: { correct: 0, total: 0 },
      speaking: { correct: 0, total: 0 }
    }
    for (const r of records.value) {
      stat[r.section].correct += r.correct
      stat[r.section].total += r.total
    }
    return stat
  })

  const totalDone = computed(() => records.value.length)

  async function load() {
    if (!hasToken()) {
      records.value = loadJSON<PracticeRecord[]>(KEY, [])
      return
    }
    try {
      const { data } = await request.get<PracticeRecord[]>('/progress')
      records.value = data
      saveJSON(KEY, records.value)
    } catch {
      /* 保留本地缓存 */
    }
  }

  // 乐观更新本地 + 同步后端
  async function addRecord(rec: Omit<PracticeRecord, 'id' | 'at'>) {
    records.value.unshift({ ...rec, id: 'p_' + Date.now(), at: Date.now() })
    if (records.value.length > 200) records.value = records.value.slice(0, 200)
    saveJSON(KEY, records.value)
    if (hasToken()) {
      try {
        await request.post('/progress', rec)
      } catch {
        /* ignore */
      }
    }
  }

  return { records, accuracyBySection, totalDone, load, addRecord }
})
