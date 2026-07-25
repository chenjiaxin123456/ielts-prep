import request from './request'
import type {
  ListeningQuestion,
  ReadingQuestion,
  WritingQuestion,
  SpeakingQuestion,
  ArticleSummary,
  Article,
  ArticleStats,
  ArticleCategory
} from '@/types'

// 分页响应结构（后端默认分页，不再一次性返回全量）
export interface Paged<T> {
  total: number
  count: number
  page: number
  pageSize: number
  items: T[]
}

// 统计响应：按来源拆分 practice（练习库）/ past（历年真题风格库）
export interface StatsResp {
  practice: { listening: number; reading: number; writing: number; speaking: number; total: number }
  past: { listening: number; reading: number; writing: number; speaking: number; total: number }
  total: number
}

// 列表查询参数；signal 用于取消上一未完成请求（避免快速翻页乱序）
export interface ListParams {
  page?: number
  pageSize?: number
  type?: string
  task?: number
  part?: number
  source?: 'practice' | 'past' // 练习库 | 历年真题风格库
  bandMax?: number // 目标分数上限（雅思 5.0-9.0），只显示 <= 该 band 的题目（从易到难）
  bandMin?: number
  year?: number // 真题年份筛选（仅 past 库）
  signal?: AbortSignal
}

// 全部走真实后端接口；函数直接返回解析后的数据（与页面 await 用法一致）
export const api = {
  getStats: () => request.get<StatsResp>('/stats').then((r) => r.data),

  getListening: (p?: ListParams) => {
    const { signal, ...params } = p || {}
    return request.get<Paged<ListeningQuestion>>('/listening', { params, signal }).then((r) => r.data)
  },
  getListeningById: (id: string) => request.get<ListeningQuestion>(`/listening/${id}`).then((r) => r.data),

  getReading: (p?: ListParams) => {
    const { signal, ...params } = p || {}
    return request.get<Paged<ReadingQuestion>>('/reading', { params, signal }).then((r) => r.data)
  },
  getReadingById: (id: string) => request.get<ReadingQuestion>(`/reading/${id}`).then((r) => r.data),

  getWriting: (p?: ListParams) => {
    const { signal, ...params } = p || {}
    return request.get<Paged<WritingQuestion>>('/writing', { params, signal }).then((r) => r.data)
  },
  getWritingById: (id: string) => request.get<WritingQuestion>(`/writing/${id}`).then((r) => r.data),

  getSpeaking: (p?: ListParams) => {
    const { signal, ...params } = p || {}
    return request.get<Paged<SpeakingQuestion>>('/speaking', { params, signal }).then((r) => r.data)
  },
  getSpeakingById: (id: string) => request.get<SpeakingQuestion>(`/speaking/${id}`).then((r) => r.data),

  // 文章模块
  getArticles: (p?: { page?: number; pageSize?: number; category?: ArticleCategory; keyword?: string; signal?: AbortSignal }) => {
    const { signal, ...params } = p || {}
    return request.get<Paged<ArticleSummary>>('/articles', { params, signal }).then((r) => r.data)
  },
  getArticleById: (id: string) => request.get<Article>(`/articles/${id}`).then((r) => r.data),
  getArticleStats: () => request.get<ArticleStats>('/articles/stats').then((r) => r.data)
}

export type { ListeningQuestion, ReadingQuestion, WritingQuestion, SpeakingQuestion }
