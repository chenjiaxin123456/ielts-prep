<template>
  <div class="page-container">
    <button class="back" type="button" aria-label="返回文章列表" @click="goBack">
      <el-icon aria-hidden="true"><ArrowLeft /></el-icon><span>返回文章列表</span>
    </button>

    <!-- 错误态 -->
    <el-alert
      v-if="error"
      type="error"
      show-icon
      :closable="false"
      title="文章加载失败"
      description="网络异常，请重试。"
    >
      <template #default>
        <el-button size="small" type="danger" plain @click="load">重新加载</el-button>
      </template>
    </el-alert>

    <!-- 骨架屏 -->
    <div v-else-if="loading && !article" class="detail-skeleton" aria-busy="true" aria-label="加载中">
      <el-skeleton :rows="3" animated style="margin-bottom: 24px" />
      <el-row :gutter="20">
        <el-col :xs="24" :md="12"><el-skeleton :rows="8" animated /></el-col>
        <el-col :xs="24" :md="12"><el-skeleton :rows="8" animated /></el-col>
      </el-row>
    </div>

    <template v-else-if="article">
      <div class="detail-head">
        <div class="meta">
          <el-tag size="small" effect="plain" class="cat">{{ article.category_zh }}</el-tag>
          <time class="date" :datetime="article.published_at">{{ article.published_at }}</time>
          <span class="source-note">人民日报风格原创生成 · 仅供学习</span>
        </div>

        <div class="toolbar" role="toolbar" aria-label="阅读工具">
          <label class="zh-toggle">
            <el-switch v-model="showZh" aria-label="显示中文翻译" />
            <span>中文翻译</span>
          </label>
          <div class="fs-group" role="group" aria-label="字号">
            <el-button :icon="Minus" size="small" aria-label="减小字号" @click="changeFs(-1)" />
            <span class="fs-label" aria-live="polite">{{ readFs }}px</span>
            <el-button :icon="Plus" size="small" aria-label="增大字号" @click="changeFs(1)" />
          </div>
          <label class="voice-select" v-if="englishVoices.length">
            <span class="vs-label">语音</span>
            <el-select
              v-model="voiceName"
              size="small"
              class="vs-select"
              placeholder="默认女声"
              aria-label="选择朗读语音"
            >
              <el-option
                v-for="v in englishVoices"
                :key="v.name"
                :label="v.name"
                :value="v.name"
              />
            </el-select>
          </label>
          <el-button
            :type="speech.speaking.value ? 'danger' : 'primary'"
            :icon="speech.speaking.value ? VideoPause : Microphone"
            round
            class="glow-btn"
            @click="toggleReadAll"
          >
            {{ speech.speaking.value ? '停止朗读' : '朗读英文全文' }}
          </el-button>
        </div>
      </div>

      <div class="bilingual" :style="{ '--read-fs': readFs + 'px' }">
        <!-- 列头：英文 / 中文 并排 -->
        <div class="col-heads">
          <div class="col-head en" lang="en">
            <span class="col-title">English</span>
            <el-icon class="col-icon" aria-hidden="true" v-if="speech.supported"><Microphone /></el-icon>
          </div>
          <div class="col-head zh" v-if="showZh" lang="zh-CN">
            <span class="col-title">中文翻译</span>
          </div>
        </div>

        <!-- 标题：英文 / 中文 并排对齐 -->
        <div class="title-row">
          <h1 class="title-en" lang="en">{{ article.title_en }}</h1>
          <h1 class="title-zh" v-if="showZh" lang="zh-CN">{{ article.title_zh }}</h1>
        </div>

        <!-- 正文：逐段左右并排，每段严格对应 -->
        <div class="para-list">
          <div
            v-for="(p, i) in article.body_en"
            :key="'row' + i"
            class="para-row"
          >
            <div
              class="para en"
              :class="{ active: currentIdx === i }"
              lang="en"
            >
              <p>{{ p }}</p>
              <el-button
                v-if="speech.supported"
                class="para-speak"
                text
                :icon="Microphone"
                circle
                :aria-label="`朗读第 ${i + 1} 段英文`"
                @click="readPara(p, i)"
              />
            </div>
            <div
              v-if="showZh"
              class="para zh"
              :class="{ active: currentIdx === i }"
              lang="zh-CN"
            >
              <p>{{ article.body_zh[i] }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <el-empty v-else description="文章不存在或已下架" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Microphone, VideoPause, Plus, Minus } from '@element-plus/icons-vue'
import { api } from '@/api'
import { useSpeech } from '@/composables/useSpeech'
import type { Article } from '@/types'

const route = useRoute()
const router = useRouter()
const speech = useSpeech()
const { voices, voiceName } = speech
const englishVoices = computed(() =>
  (voices.value || []).filter((v) => v.lang.toLowerCase().startsWith('en'))
)

const article = ref<Article | null>(null)
const loading = ref(true)
const error = ref(false)
const currentIdx = ref<number>(-1)
const queue = ref<string[]>([])

const showZh = ref(true)
const readFs = ref(16)
function changeFs(delta: number) {
  readFs.value = Math.min(22, Math.max(14, readFs.value + delta))
}

async function load() {
  loading.value = true
  error.value = false
  try {
    article.value = await api.getArticleById(String(route.params.id))
  } catch (e) {
    error.value = true
    console.error('加载文章失败', e)
    article.value = null
  } finally {
    loading.value = false
  }
}

function speakQueue(idx: number) {
  if (idx >= queue.value.length) {
    currentIdx.value = -1
    speech.stop()
    return
  }
  currentIdx.value = idx
  speech.speak(queue.value[idx], {
    lang: 'en-US',
    onEnd: () => speakQueue(idx + 1)
  })
}
function toggleReadAll() {
  if (speech.speaking.value) {
    speech.stop()
    currentIdx.value = -1
    return
  }
  queue.value = article.value?.body_en || []
  speakQueue(0)
}
function readPara(text: string, i: number) {
  currentIdx.value = i
  speech.speak(text, { lang: 'en-US', onEnd: () => (currentIdx.value = -1) })
}

function goBack() {
  router.push({ name: 'articles' })
}

onUnmounted(() => speech.stop())
load()
</script>

<style scoped lang="scss">
.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--c-muted);
  cursor: pointer;
  margin-bottom: 14px;
  font-size: 14px;
  padding: 4px 6px;
  border-radius: 8px;
  &:hover {
    color: var(--c-primary);
    background: var(--el-color-primary-light-9);
  }
  &:focus-visible {
    outline: 2px solid var(--c-primary);
    outline-offset: 2px;
  }
}
.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.cat {
  margin-right: 2px;
}
.date {
  font-size: 13px;
  color: var(--c-muted);
}
.source-note {
  font-size: 12px;
  color: var(--c-muted);
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.fs-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--c-border);
  border-radius: 999px;
  padding: 2px 6px;
}
.fs-label {
  font-size: 12px;
  color: var(--c-muted);
  min-width: 34px;
  text-align: center;
}
.zh-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--c-text);
  cursor: pointer;
  user-select: none;
}
.voice-select {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--c-text);
}
.vs-label {
  white-space: nowrap;
}
.vs-select {
  width: 190px;
}
@media (max-width: 768px) {
  .vs-select {
    width: 150px;
  }
}
.bilingual {
  width: 100%;
}
/* 列头：英文 / 中文 两个面板各占一半，左右对齐 */
.col-heads {
  display: flex;
  gap: 20px;
  margin-bottom: 0;
}
.col-head {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px 10px 0 0;
  font-weight: 700;
}
.col-head.en {
  background: linear-gradient(135deg, #4f46e5, #6d28d9);
  color: #fff;
}
.col-head.zh {
  background: #eef2f7;
  color: var(--c-text);
}
.col-title {
  font-size: 14px;
}
.col-icon {
  opacity: 0.9;
}
/* 标题行：左右并排对齐 */
.title-row {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.title-en {
  flex: 1 1 0;
  min-width: 0;
  font-size: 22px;
  line-height: 1.4;
  margin: 16px 0 8px;
  color: var(--c-text);
}
.title-zh {
  flex: 1 1 0;
  min-width: 0;
  font-size: 20px;
  line-height: 1.4;
  margin: 16px 0 8px;
  color: var(--c-primary);
}
/* 正文：每段是一个左右并排的 row，英左中右严格对应 */
.para-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.para-row {
  display: flex;
  gap: 20px;
  align-items: stretch;
}
.para {
  flex: 1 1 0;
  min-width: 0;
  position: relative;
  border-radius: 10px;
  padding: 14px 16px;
  line-height: 1.75;
  transition: all 0.2s ease;
  p {
    margin: 0;
    font-size: var(--read-fs, 16px);
  }
}
.para.en {
  background: rgba(79, 70, 229, 0.05);
  border: 1px solid rgba(79, 70, 229, 0.12);
  padding-right: 44px;
}
.para.zh {
  background: #f8fafc;
  border: 1px solid var(--c-border);
  color: #334155;
}
.para.active {
  box-shadow: 0 0 0 2px var(--c-primary);
}
.para-speak {
  position: absolute;
  top: 10px;
  right: 8px;
  color: var(--c-primary);
}
.detail-skeleton {
  padding-top: 8px;
}
/* 窄屏：改为上下堆叠，但同一段落的英文仍在中文正上方，保持对应 */
@media (max-width: 768px) {
  .col-heads,
  .title-row,
  .para-row {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
