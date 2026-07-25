<template>
  <div class="page-container">
    <!-- Hero -->
    <el-card class="hero" shadow="never">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="hero-inner">
        <div class="hero-badge">🎯 系统化备考 · 四科闭环</div>
        <h1 class="hero-title">
          攻克雅思，从<span class="gradient-text">每一次练习</span>开始
        </h1>
        <p class="hero-sub">
          听力精听 · 阅读判分 · 写作范文 · 口语录音，题库、生词与错题一站式追踪你的提分曲线。
        </p>
        <div class="hero-actions">
          <el-button type="primary" size="large" round class="glow-btn" @click="go('listening')">
            开始练习
          </el-button>
          <el-button size="large" round plain @click="go('speaking')">口语题库</el-button>
        </div>
      </div>
    </el-card>

    <!-- 学科入口 -->
    <div class="grid">
      <el-card
        v-for="s in subjects"
        :key="s.key"
        class="subj hover-lift"
        shadow="hover"
        @click="go(s.key)"
      >
        <div class="subj-icon" :style="{ background: s.gradient }">
          <el-icon :size="26" color="#fff"><component :is="s.icon" /></el-icon>
        </div>
        <div class="subj-meta">
          <div class="subj-name">{{ s.name }}</div>
          <div class="subj-count">{{ s.count }} 题可练</div>
        </div>
      </el-card>
    </div>

    <!-- 进度 / 推荐 -->
    <el-row :gutter="20" class="lower">
      <el-col :xs="24" :md="14">
        <el-card shadow="never" class="panel">
          <h3 class="section-title">今日推荐</h3>
          <el-empty v-if="!recommend.length" description="暂无推荐" />
          <ul class="rec-list">
            <li v-for="r in recommend" :key="r.id" class="rec-item" @click="open(r)">
              <span class="rec-tag" :style="{ background: tagColor(r.section) }">{{ sectionName(r.section) }}</span>
              <span class="rec-title">{{ r.title }}</span>
              <el-icon class="rec-arrow"><ArrowRight /></el-icon>
            </li>
          </ul>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="10">
        <el-card shadow="never" class="panel" v-if="userStore.isLoggedIn">
          <h3 class="section-title">我的进度</h3>
          <div v-for="s in subjects" :key="s.key" class="prog-row">
            <span class="prog-name">
              <el-icon :size="15" :color="s.color"><component :is="s.icon" /></el-icon>
              {{ s.short }}
            </span>
            <el-progress
              class="prog-bar"
              :percentage="accuracy(s.key)"
              :stroke-width="10"
              :color="s.color"
              :show-text="false"
            />
            <span class="prog-val">{{ accuracy(s.key) }}%</span>
          </div>
          <div class="prog-foot">
            <el-icon><DataLine /></el-icon> 已完成练习 {{ progress.totalDone }} 次
          </div>
        </el-card>
        <el-card shadow="never" class="panel cta" v-else>
          <div class="cta-emoji">🚀</div>
          <h3 class="section-title" style="text-align: center">开启你的备考</h3>
          <p class="cta-tip">登录即可保存生词、错题与练习记录，追踪提分进度。</p>
          <el-button type="primary" round class="glow-btn" @click="router.push({ name: 'register' })">
            免费注册
          </el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Headset,
  Notebook,
  EditPen,
  Microphone,
  ArrowRight,
  DataLine
} from '@element-plus/icons-vue'
import { api } from '@/api'
import { useUserStore } from '@/stores/user'
import { useProgressStore } from '@/stores/progress'
import type { Section } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const progress = useProgressStore()
userStore.init()

const counts = ref<Record<Section, number>>({ listening: 0, reading: 0, writing: 0, speaking: 0 })
const recommend = ref<any[]>([])

const subjects = computed(() => [
  { key: 'listening' as Section, name: '听力 Listening', short: '听力', icon: Headset, color: '#4f46e5', gradient: 'linear-gradient(135deg,#4f46e5,#6366f1)', count: counts.value.listening },
  { key: 'reading' as Section, name: '阅读 Reading', short: '阅读', icon: Notebook, color: '#0ea5e9', gradient: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', count: counts.value.reading },
  { key: 'writing' as Section, name: '写作 Writing', short: '写作', icon: EditPen, color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#f97316)', count: counts.value.writing },
  { key: 'speaking' as Section, name: '口语 Speaking', short: '口语', icon: Microphone, color: '#ec4899', gradient: 'linear-gradient(135deg,#ec4899,#db2777)', count: counts.value.speaking }
])

function go(key: string) {
  router.push({ path: `/${key}` })
}
function open(r: any) {
  router.push({ path: `/${r.section}/${r.id}` })
}
function sectionName(s: Section) {
  return { listening: '听力', reading: '阅读', writing: '写作', speaking: '口语' }[s]
}
function tagColor(s: Section) {
  return { listening: '#4f46e5', reading: '#0ea5e9', writing: '#f59e0b', speaking: '#ec4899' }[s]
}
function accuracy(s: Section) {
  const st = progress.accuracyBySection[s]
  if (!st || st.total === 0) return 0
  return Math.round((st.correct / st.total) * 100)
}

onMounted(async () => {
  // 统计走 /api/stats（轻量，按源拆分 practice/past）；推荐取练习库首页少量条目
  const [stats, l, r, w, s] = await Promise.all([
    api.getStats(),
    api.getListening({ pageSize: 3, source: 'practice' }),
    api.getReading({ pageSize: 3, source: 'practice' }),
    api.getWriting({ pageSize: 2, source: 'practice' }),
    api.getSpeaking({ pageSize: 2, source: 'practice' })
  ])
  // 首页学科计数 = 练习库 + 历年真题风格库 合计
  counts.value = {
    listening: stats.practice.listening + stats.past.listening,
    reading: stats.practice.reading + stats.past.reading,
    writing: stats.practice.writing + stats.past.writing,
    speaking: stats.practice.speaking + stats.past.speaking
  }
  recommend.value = [
    ...l.items.slice(0, 2).map((x) => ({ ...x, section: 'listening' as Section })),
    ...r.items.slice(0, 2).map((x) => ({ ...x, section: 'reading' as Section })),
    ...w.items.slice(0, 1).map((x) => ({ ...x, section: 'writing' as Section })),
    ...s.items.slice(0, 1).map((x) => ({ ...x, section: 'speaking' as Section }))
  ]
  // 已登录则同步后端练习记录，用于首页正确率 / 完成次数
  if (userStore.isLoggedIn) progress.load()
})
</script>

<style scoped lang="scss">
.hero {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius) !important;
  background: linear-gradient(120deg, #4f46e5 0%, #6d28d9 55%, #7c3aed 100%);
  color: #fff;
  margin-bottom: 22px;
}
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.5;
}
.blob-1 {
  width: 240px;
  height: 240px;
  background: #a78bfa;
  top: -80px;
  right: -40px;
}
.blob-2 {
  width: 180px;
  height: 180px;
  background: #22d3ee;
  bottom: -70px;
  left: -30px;
  opacity: 0.35;
}
.hero-inner {
  position: relative;
  z-index: 1;
  padding: 14px 8px;
}
.hero-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.25);
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  margin-bottom: 14px;
}
.hero-title {
  font-size: 30px;
  font-weight: 800;
  margin: 0 0 12px;
  line-height: 1.25;
}
.hero-sub {
  font-size: 15px;
  opacity: 0.9;
  max-width: 620px;
  margin: 0 0 22px;
  line-height: 1.7;
}
.hero-actions {
  display: flex;
  gap: 12px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 22px;
}
.subj {
  display: flex;
  align-items: center;
  gap: 14px;
  border-radius: var(--radius) !important;
  cursor: pointer;
  padding: 18px !important;
}
.subj-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}
.subj-meta {
  flex: 1;
  min-width: 0;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-center;
}
.subj-name {
  font-weight: 700;
  font-size: 15px;
}
.subj-count {
  font-size: 12px;
  color: var(--c-muted);
  margin-top: 2px;
}
.subj-arrow {
  color: #cbd2e0;
}
.lower {
  margin-top: 22px;
  row-gap: 20px;
}
.panel {
  border-radius: var(--radius) !important;
  margin-bottom: 16px;
}
.rec-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.rec-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s ease;
}
.rec-item:hover {
  background: var(--el-color-primary-light-9);
}
.rec-item:hover .rec-title {
  color: var(--c-primary);
}
.rec-item:not(:last-child) {
  border-bottom: 1px solid var(--c-border);
}
.rec-tag {
  color: #fff;
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  flex-shrink: 0;
}
.rec-title {
  flex: 1;
  font-size: 14px;
  transition: color 0.18s ease;
}
.rec-arrow {
  color: #c0c4cc;
}
.prog-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.prog-name {
  width: 84px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.prog-bar {
  flex: 1;
}
.prog-val {
  width: 40px;
  text-align: right;
  font-size: 13px;
  color: var(--c-muted);
  flex-shrink: 0;
}
.prog-foot {
  font-size: 13px;
  color: var(--c-muted);
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.cta {
  text-align: center;
  padding: 24px 16px !important;
}
.cta-emoji {
  font-size: 40px;
  margin-bottom: 8px;
}
.cta-tip {
  color: var(--c-muted);
  font-size: 14px;
  margin: 0 0 18px;
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
