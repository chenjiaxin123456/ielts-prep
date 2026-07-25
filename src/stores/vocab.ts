import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { VocabWord } from '@/types'
import request from '@/api/request'
import { loadJSON, saveJSON } from '@/utils/storage'

const KEY = 'ielts_vocab'
const TOKEN_KEY = 'ielts_token'
const hasToken = () => !!localStorage.getItem(TOKEN_KEY)

export const useVocabStore = defineStore('vocab', () => {
  const list = ref<VocabWord[]>(loadJSON<VocabWord[]>(KEY, []))

  async function load() {
    if (!hasToken()) {
      list.value = loadJSON<VocabWord[]>(KEY, [])
      return
    }
    try {
      const { data } = await request.get<VocabWord[]>('/vocab')
      list.value = data
      saveJSON(KEY, list.value)
    } catch {
      /* 保留本地缓存 */
    }
  }

  async function add(word: string, meaning: string, note = '') {
    const w = word.trim()
    if (!w) return false
    if (list.value.some((v) => v.word.toLowerCase() === w.toLowerCase())) return false
    const item: VocabWord = {
      id: 'v_' + Date.now(),
      word: w,
      meaning: meaning.trim(),
      note,
      createdAt: Date.now()
    }
    list.value.unshift(item)
    saveJSON(KEY, list.value)
    if (hasToken()) {
      try {
        const { data } = await request.post<VocabWord>('/vocab', {
          word: w,
          meaning: item.meaning,
          note
        })
        Object.assign(item, data)
      } catch {
        /* 本地已更新，后台失败忽略 */
      }
    }
    return true
  }

  async function remove(id: string) {
    list.value = list.value.filter((v) => v.id !== id)
    saveJSON(KEY, list.value)
    if (hasToken()) {
      try {
        await request.delete(`/vocab/${id}`)
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
        await request.delete('/vocab')
      } catch {
        /* ignore */
      }
    }
  }

  return { list, load, add, remove, clear }
})
