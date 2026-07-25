import { ref, onMounted } from 'vue'
import { api, type ListParams, type Paged } from '@/api'
import { useUserStore } from '@/stores/user'

type Section = 'listening' | 'reading' | 'writing' | 'speaking'
const getFns = {
  listening: api.getListening,
  reading: api.getReading,
  writing: api.getWriting,
  speaking: api.getSpeaking
} as const

// 共享：来源切换(练习库/真题风格) + 目标分数(bandMax, 从易到难) + 年份(past) + 分页 + 取消上一请求
export function useQuestionList<T>(section: Section) {
  const userStore = useUserStore()
  const list = ref<T[]>([])
  const loading = ref(false)
  const error = ref(false)
  const page = ref(1)
  const pageSize = ref(24)
  const total = ref(0)
  const source = ref<'practice' | 'past'>('practice')
  // 目标分数：默认取用户档案里的 targetBand，未设置则展示全部(9.0)
  const bandMax = ref<number>(userStore.user?.targetBand ?? 9)
  const year = ref<number | ''>('')
  // 题型/任务/part 筛选（listening/reading 用 type，writing 用 task，speaking 用 part）
  const filter = ref<Record<string, unknown>>({})

  let controller: AbortController | null = null

  async function load() {
    if (controller) controller.abort()
    controller = new AbortController()
    loading.value = true
    error.value = false
    const params: ListParams = {
      page: page.value,
      pageSize: pageSize.value,
      source: source.value,
      bandMax: bandMax.value,
      signal: controller.signal,
      ...filter.value
    }
    if (year.value !== '') params.year = Number(year.value)
    try {
      const res = (await getFns[section](params)) as Paged<T>
      list.value = res.items
      total.value = res.total
    } catch (e: any) {
      // 忽略主动取消的请求
      if (e?.name !== 'CanceledError' && e?.code !== 'ERR_CANCELED') {
        error.value = true
        console.error('加载题目失败', e)
      }
    } finally {
      loading.value = false
    }
  }

  function resetPage() {
    page.value = 1
    load()
  }
  function onFilterChange() {
    resetPage()
  }
  function onSizeChange() {
    resetPage()
  }
  function changeSource() {
    resetPage()
  }
  function changeBand() {
    resetPage()
  }
  function changeYear() {
    resetPage()
  }

  onMounted(load)
  return {
    list, loading, error, page, pageSize, total,
    source, bandMax, year, filter,
    load, onFilterChange, onSizeChange, changeSource, changeBand, changeYear
  }
}
