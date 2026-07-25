<template>
  <div class="page-container" v-loading="loading">
    <el-page-header @back="router.back()" class="mb" />

    <template v-if="q">
      <div class="q-head">
        <div>
          <h2 class="q-title">{{ q.title }}</h2>
          <div class="q-meta">
            <el-tag size="small" type="primary">{{ typeName(q.type) }}</el-tag>
            <el-rate :model-value="q.difficulty" disabled size="small" />
            <el-tag size="small" effect="plain">{{ q.topic }}</el-tag>
          </div>
        </div>
      </div>

      <!-- 音频播放器 -->
      <AudioPlayer :src="q.audioUrl" :transcript="q.transcript" />

      <!-- 答题区 -->
      <el-card class="block" shadow="never">
        <h3 class="section-title">作答</h3>

        <!-- 填空 -->
        <template v-if="q.type === 'fill-blank'">
          <p class="stem">请听录音并填写答案：</p>
          <el-input
            v-model="fillText"
            :disabled="submitted"
            placeholder="输入你的答案"
            size="large"
            class="answer-input"
          />
        </template>

        <!-- 单选 -->
        <template v-else-if="q.type === 'choice'">
          <el-radio-group v-model="choice" :disabled="submitted" class="opts">
            <el-radio v-for="(val, key) in q.options" :key="key" :value="key" border>
              <b>{{ key }}.</b> {{ val }}
            </el-radio>
          </el-radio-group>
        </template>

        <!-- 匹配 -->
        <template v-else-if="q.type === 'match'">
          <div v-for="(qq, i) in q.questionList" :key="i" class="match-row">
            <span class="match-q">{{ qq.no }}. {{ qq.text }}</span>
            <el-select
              v-model="matchAnswers[i]"
              :disabled="submitted"
              placeholder="选择"
              class="match-sel"
            >
              <el-option v-for="(val, key) in q.options" :key="key" :label="`${key}. ${val}`" :value="key" />
            </el-select>
          </div>
        </template>

        <div class="btn-row">
          <el-button v-if="!submitted" type="primary" size="large" @click="onSubmit">
            提交答案
          </el-button>
        </div>
      </el-card>

      <!-- 结果 -->
      <el-card v-if="submitted" class="block" shadow="never">
        <h3 class="section-title">
          结果
          <el-tag :type="allCorrect ? 'success' : 'danger'" class="res-tag">
            {{ correctCount }} / {{ totalCount }} 正确
          </el-tag>
        </h3>
        <div v-for="(r, i) in resultRows" :key="i" class="res-row" :class="r.ok ? 'ok' : 'no'">
          <el-icon><component :is="r.ok ? CircleCheck : CircleClose" /></el-icon>
          <div class="res-detail">
            <div class="res-line"><b>题目：</b>{{ r.text }}</div>
            <div class="res-line"><b>你的答案：</b>{{ r.your || '（空）' }}</div>
            <div class="res-line"><b>正确答案：</b>{{ r.correct }}</div>
          </div>
        </div>
        <el-alert
          v-if="q.explanation"
          :title="'解析：' + q.explanation"
          type="info"
          :closable="false"
          class="explain"
        />
        <div class="btn-row">
          <el-button @click="router.push('/listening')">返回列表</el-button>
        </div>
      </el-card>

      <!-- 精听模式 -->
      <el-card v-if="q.transcript" class="block" shadow="never">
        <div class="dictate-head">
          <h3 class="section-title" style="margin: 0">精听模式（单句朗读）</h3>
          <el-switch v-model="loopMode" active-text="单句循环 x3" />
        </div>
        <div v-for="(s, i) in sentences" :key="i" class="sentence">
          <span class="s-no">{{ i + 1 }}</span>
          <span class="s-text">{{ s }}</span>
          <el-button size="small" :icon="Microphone" circle @click="playSentence(i)" />
        </div>
        <el-button text type="info" @click="speech.stop()" v-if="speech.speaking.value">停止朗读</el-button>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleCheck, CircleClose, Microphone, ArrowRight } from '@element-plus/icons-vue'
import { api } from '@/api'
import type { ListeningQuestion } from '@/types'
import { isCorrect } from '@/utils/grade'
import { useMistakeStore } from '@/stores/mistake'
import { useProgressStore } from '@/stores/progress'
import { ElMessage } from 'element-plus'
import AudioPlayer from '@/components/AudioPlayer.vue'
import { useSpeech } from '@/composables/useSpeech'

const route = useRoute()
const router = useRouter()
const mistake = useMistakeStore()
const progress = useProgressStore()
const speech = useSpeech()

const q = ref<ListeningQuestion | null>(null)
const loading = ref(true)
const fillText = ref('')
const choice = ref('')
const matchAnswers = ref<string[]>([])
const submitted = ref(false)
const loopMode = ref(false)

const sentences = computed(() =>
  q.value?.transcript ? q.value.transcript.split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter(Boolean) : []
)

const totalCount = computed(() => {
  if (!q.value) return 0
  if (q.value.type === 'match') return q.value.questionList?.length || 0
  return 1
})
const correctCount = computed(() => {
  const item = q.value
  if (!item) return 0
  if (item.type === 'match')
    return item.questionList!.reduce(
      (acc, _, i) => acc + (isCorrect(matchAnswers.value[i], (item.answer as string[])[i]) ? 1 : 0),
      0
    )
  if (item.type === 'choice') return isCorrect(choice.value, item.answer) ? 1 : 0
  return isCorrect(fillText.value, item.answer) ? 1 : 0
})
const allCorrect = computed(() => correctCount.value === totalCount.value)

const resultRows = computed(() => {
  const item = q.value
  if (!item || !submitted.value) return []
  if (item.type === 'match') {
    return item.questionList!.map((qq, i) => ({
      text: qq.text,
      your: matchAnswers.value[i],
      correct: String((item.answer as string[])[i]),
      ok: isCorrect(matchAnswers.value[i], (item.answer as string[])[i])
    }))
  }
  if (item.type === 'choice')
    return [{ text: item.title, your: choice.value, correct: String(item.answer), ok: isCorrect(choice.value, item.answer) }]
  return [{ text: item.title, your: fillText.value, correct: String(item.answer), ok: isCorrect(fillText.value, item.answer) }]
})

function typeName(t: string) {
  return (
    { 'fill-blank': '填空', choice: '单选', match: '匹配', tfng: 'T/F/NG', heading: '标题匹配', summary: '摘要填空' }[t] || t
  )
}

function playSentence(idx: number) {
  const text = sentences.value[idx]
  if (loopMode.value) {
    let count = 0
    const speakOnce = () => {
      speech.speak(text, {
        rate: 0.9,
        onEnd: () => {
          count++
          if (count < 3) speakOnce()
        }
      })
    }
    speakOnce()
  } else {
    speech.speak(text, { rate: 0.9 })
  }
}

function onSubmit() {
  const item = q.value!
  const total = totalCount.value
  const correct = correctCount.value
  submitted.value = true

  progress.addRecord({
    section: 'listening',
    questionId: item.id,
    title: item.title,
    correct,
    total
  })

  if (correct < total) {
    let your = ''
    if (item.type === 'fill-blank') your = fillText.value || '（空）'
    else if (item.type === 'choice') your = choice.value || '（空）'
    else your = matchAnswers.value.join(', ')
    mistake.add({
      id: item.id,
      section: 'listening',
      title: item.title,
      type: item.type,
      topic: item.topic,
      yourAnswer: your,
      correctAnswer: Array.isArray(item.answer) ? item.answer.join(', ') : item.answer
    })
    ElMessage.warning(`答错 ${total - correct} 题，已加入错题集`)
  } else {
    ElMessage.success('全部答对！')
  }
}

onMounted(async () => {
  q.value = await api.getListeningById(route.params.id as string)
  if (q.value && q.value.type === 'match') {
    const n = q.value.questionList?.length || 0
    matchAnswers.value = Array(n).fill('')
  }
  loading.value = false
})
</script>

<style scoped lang="scss">
.mb {
  margin-bottom: 16px;
}
.q-head {
  margin-bottom: 16px;
}
.q-title {
  margin: 0 0 8px;
}
.q-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}
.block {
  margin-top: 16px;
  border-radius: 12px;
}
.stem {
  margin: 0 0 12px;
  color: #4b5563;
}
.answer-input {
  max-width: 360px;
}
.opts {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}
.match-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.match-q {
  flex: 1;
}
.match-sel {
  width: 240px;
}
.res-tag {
  margin-left: 8px;
}
.res-row {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 8px;
  &.ok {
    background: #ecfdf3;
  }
  &.no {
    background: #fef2f2;
  }
}
.res-detail {
  flex: 1;
}
.res-line {
  font-size: 14px;
  margin: 2px 0;
}
.explain {
  margin-top: 12px;
}
.dictate-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.sentence {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}
.s-no {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--brand-light);
  color: var(--brand-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}
.s-text {
  flex: 1;
  font-size: 14px;
}
</style>
