<template>
  <div class="page-container" v-loading="loading">
    <el-page-header @back="router.back()" class="mb" />

    <template v-if="q">
      <div class="q-head">
        <h2 class="q-title">{{ q.title }}</h2>
        <div class="q-meta">
          <el-tag size="small" type="danger">Part {{ q.part }}</el-tag>
          <el-tag size="small" effect="plain">{{ q.topic }}</el-tag>
          <el-tag size="small" effect="plain">建议时长 {{ q.durationSec }}s</el-tag>
        </div>
      </div>

      <el-card class="block" shadow="never">
        <h3 class="section-title">{{ q.part === 2 ? '题卡 Cue Card' : '话题与思路' }}</h3>
        <pre v-if="q.cueCard" class="cue">{{ q.cueCard }}</pre>
        <ul v-if="q.prompts?.length" class="prompts">
          <li v-for="p in q.prompts" :key="p">{{ p }}</li>
        </ul>
      </el-card>

      <!-- 录音练习 -->
      <el-card class="block" shadow="never">
        <h3 class="section-title">录音练习</h3>
        <div class="rec-row">
          <el-button
            :type="recording ? 'danger' : 'primary'"
            :icon="recording ? VideoPause : Microphone"
            @click="recording ? stopRec() : startRec()"
          >
            {{ recording ? '停止录音' : '开始录音' }}
          </el-button>
          <el-tag type="info" v-if="recording">录制中 {{ recTime }}</el-tag>
          <span v-if="!recSupported" class="hint">当前浏览器不支持录音</span>
        </div>
        <audio v-if="audioUrl" :src="audioUrl" controls class="playback" />
        <div class="btn-row">
          <el-button v-if="!done" type="success" plain @click="markDone">标记完成本次练习</el-button>
        </div>
      </el-card>

      <!-- 范例 -->
      <el-card class="block" shadow="never">
        <div class="sample-head">
          <h3 class="section-title" style="margin: 0">高分范例</h3>
          <el-switch v-model="showSample" active-text="显示" />
        </div>
        <pre v-if="showSample && q.sampleAnswer" class="sample">{{ q.sampleAnswer }}</pre>
        <el-empty v-else description="点击右上角显示范例" :image-size="80" />
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Microphone, VideoPause, ArrowRight } from '@element-plus/icons-vue'
import { api } from '@/api'
import type { SpeakingQuestion } from '@/types'
import { useProgressStore } from '@/stores/progress'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const progress = useProgressStore()

const q = ref<SpeakingQuestion | null>(null)
const loading = ref(true)
const showSample = ref(false)
const done = ref(false)

// 录音
const recording = ref(false)
const recSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
const recSeconds = ref(0)
const audioUrl = ref('')
let mediaRecorder: MediaRecorder | null = null
let stream: MediaStream | null = null
let chunks: Blob[] = []
let recTimer: number | undefined

const recTime = computed(() => {
  const m = Math.floor(recSeconds.value / 60)
  const s = recSeconds.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

async function startRec() {
  if (!recSupported) return
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    chunks = []
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' })
      audioUrl.value = URL.createObjectURL(blob)
      stream?.getTracks().forEach((t) => t.stop())
    }
    mediaRecorder.start()
    recording.value = true
    recSeconds.value = 0
    recTimer = window.setInterval(() => recSeconds.value++, 1000)
  } catch {
    ElMessage.error('无法访问麦克风，请检查浏览器权限')
  }
}
function stopRec() {
  mediaRecorder?.stop()
  recording.value = false
  if (recTimer) clearInterval(recTimer)
}
function markDone() {
  const item = q.value!
  progress.addRecord({ section: 'speaking', questionId: item.id, title: item.title, correct: 1, total: 1 })
  done.value = true
  ElMessage.success('已记录本次练习')
}

onMounted(async () => {
  q.value = await api.getSpeakingById(route.params.id as string)
  loading.value = false
})
onUnmounted(() => {
  if (recTimer) clearInterval(recTimer)
  stream?.getTracks().forEach((t) => t.stop())
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
})
</script>

<style scoped lang="scss">
.mb {
  margin-bottom: 16px;
}
.q-title {
  margin: 0 0 8px;
}
.q-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.block {
  border-radius: 12px;
  margin-bottom: 16px;
}
.cue {
  white-space: pre-wrap;
  line-height: 1.8;
  background: #fdf2f8;
  border-radius: 8px;
  padding: 14px;
  color: #831843;
}
.prompts {
  margin: 12px 0 0;
  padding-left: 18px;
  color: #4b5563;
  line-height: 1.9;
}
.rec-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.playback {
  display: block;
  width: 100%;
  margin-top: 12px;
}
.hint {
  color: #f59e0b;
  font-size: 13px;
}
.sample-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.sample {
  white-space: pre-wrap;
  line-height: 1.8;
  background: #f8fafc;
  border-radius: 8px;
  padding: 14px;
  color: #1f2937;
}
</style>
