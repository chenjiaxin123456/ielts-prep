// ============ 通用类型 ============

export type Section = 'listening' | 'reading' | 'writing' | 'speaking'

export type QuestionType =
  | 'fill-blank' // 填空
  | 'choice' // 单选
  | 'multi-choice' // 多选
  | 'match' // 匹配
  | 'tfng' // True/False/Not Given
  | 'heading' // 段落标题匹配
  | 'summary' // 摘要填空
  | 'essay' // 写作议论文/图表
  | 'letter' // 写作书信
  | 'part1' // 口语 Part1
  | 'part2' // 口语 Part2
  | 'part3' // 口语 Part3

export type Source = 'practice' | 'past'
export type Difficulty = 1 | 2 | 3 | 4 | 5

// 题目公共字段
export interface BaseQuestion {
  id: string
  section: Section
  type: QuestionType
  title: string
  difficulty: Difficulty // 1-5 星级（由 band 映射，仅用于展示）
  topic: string
  tags: string[]
  explanation?: string
  band?: number // 雅思真实难度档 5.0-9.0（筛选/排序依据）
  source?: Source // practice=练习库 / past=历年真题风格库
  year?: number // 真题风格库的年份（2001-2025）
}

// ============ 听力 ============
export interface ListeningQuestion extends BaseQuestion {
  section: 'listening'
  audioUrl: string
  transcript?: string
  options?: Record<string, string> // 选择题选项，如 { A: '...', B: '...' }
  questionList?: { no: number; text: string }[] // 匹配题等含多个子题时
  answer: string | string[]
}

// ============ 阅读 ============
export interface ReadingPassage {
  paragraph: string
}
export interface ReadingQuestion extends BaseQuestion {
  section: 'reading'
  passage: string // 文章正文（可含多段，用 \n\n 分隔）
  options?: Record<string, string>
  answer: string | string[] // 多题时可传数组，与 questions 顺序对应
  questionList?: { no: number; text: string }[] // 当一道题含多个子题时
}

// ============ 写作 ============
export interface WritingSample {
  band: number
  content: string
  comments?: string
}
export interface WritingQuestion extends BaseQuestion {
  section: 'writing'
  task: 1 | 2 // Task1 图表 / Task2 议论文（G类书信归为 task1 变体）
  prompt: string // 题目说明
  wordLimit: number
  samples: WritingSample[]
  tips?: string[]
}

// ============ 口语 ============
export interface SpeakingQuestion extends BaseQuestion {
  section: 'speaking'
  part: 1 | 2 | 3
  cueCard?: string // Part2 题卡
  prompts?: string[] // 追问/思路提示
  sampleAnswer?: string
  durationSec?: number // 建议作答时长
}

// ============ 用户 / 学习数据 ============
export interface User {
  id: string
  username: string
  avatar?: string
  targetBand?: number
  examDate?: string
}

export interface VocabWord {
  id: string
  word: string
  meaning: string
  note?: string
  createdAt: number
}

export interface MistakeRecord {
  id: string // 题目 id
  section: Section
  title: string
  type: QuestionType
  topic: string
  yourAnswer: string | string[]
  correctAnswer: string | string[]
  createdAt: number
}

export interface PracticeRecord {
  id: string
  section: Section
  questionId: string
  title: string
  correct: number
  total: number
  at: number
}

// ============ 文章模块（人民日报风格双语阅读） ============
export type ArticleCategory =
  | 'politics' | 'economy' | 'culture' | 'technology' | 'environment'
  | 'society' | 'world' | 'education' | 'health' | 'sports'

// 列表项（轻量，不含正文）
export interface ArticleSummary {
  id: string
  title_en: string
  title_zh: string
  category: ArticleCategory
  category_zh: string
  published_at: string
  excerpt_en: string
}

// 文章详情（含中英段落数组，逐段对应）
export interface Article {
  id: string
  title_en: string
  title_zh: string
  body_en: string[]
  body_zh: string[]
  category: ArticleCategory
  category_zh: string
  source: string
  published_at: string
}

export interface ArticleStats {
  categories: Record<ArticleCategory, number>
  total: number
}
