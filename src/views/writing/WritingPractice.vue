<template>
  <div class="page-container" v-loading="loading">
    <el-page-header @back="router.back()" class="mb" />

    <template v-if="q">
      <div class="q-head">
        <h2 class="q-title">{{ q.title }}</h2>
        <div class="q-meta">
          <el-tag size="small" :type="q.task === 1 ? 'warning' : 'danger'">Task {{ q.task }}</el-tag>
          <el-tag size="small" effect="plain">{{ q.topic }}</el-tag>
          <el-tag size="small" effect="plain">建议字数 ≥ {{ q.wordLimit }}</el-tag>
        </div>
      </div>

      <el-card class="block" shadow="never">
        <h3 class="section-title">题目</h3>
        <p class="prompt">{{ q.prompt }}</p>
        <div v-if="q.tips?.length" class="tips">
          <div class="tips-title">写作提示：</div>
          <ul>
            <li v-for="t in q.tips" :key="t">{{ t }}</li>
          </ul>
        </div>
      </el-card>

      <el-card class="block" shadow="never">
        <div class="editor-head">
          <h3 class="section-title" style="margin: 0">我的作答</h3>
          <div class="stats">
            <el-tag :type="wordCount >= q.wordLimit ? 'success' : 'info'">字数：{{ wordCount }}</el-tag>
            <el-tag type="info">用时：{{ fmtTime }}</el-tag>
          </div>
        </div>
        <el-input
          v-model="draft"
          type="textarea"
          :rows="12"
          placeholder="在此输入你的作文…"
          :disabled="submitted"
        />
        <div class="btn-row">
          <el-button v-if="!submitted" type="primary" size="large" @click="onSubmit">
            提交并查看范文
          </el-button>
        </div>
      </el-card>

      <el-card v-if="submitted" class="block" shadow="never">
        <h3 class="section-title">参考范文（按分数段）</h3>
        <el-radio-group v-model="band" class="band-sel">
          <el-radio-button v-for="s in q.samples" :key="s.band" :value="s.band">Band {{ s.band }}</el-radio-button>
        </el-radio-group>
        <div v-for="s in q.samples.filter((x) => x.band === band)" :key="s.band">
          <el-alert
            v-if="s.comments"
            :title="'评分点：' + s.comments"
            type="success"
            :closable="false"
            class="sample-comment"
          />
          <pre class="sample">{{ s.content }}</pre>
        </div>
        <el-alert
          type="info"
          :closable="false"
          title="提示：当前为范文对照与自评，AI 智能批改将在二期上线。"
        />
        <div class="btn-row">
          <el-button @click="router.push('/writing')">返回列表</el-button>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'
import { api } from '@/api'
import type { WritingQuestion } from '@/types'
import { useProgressStore } from '@/stores/progress'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const progress = useProgressStore()

const q = ref<WritingQuestion | null>(null)
const loading = ref(true)
const draft = ref('')
const submitted = ref(false)
const band = ref<number>(9)

const wordCount = computed(() => (draft.value.trim() ? draft.value.trim().split(/\s+/).length : 0))

// 计时
const seconds = ref(0)
let timer: number | undefined
const fmtTime = computed(() => {
  const m = Math.floor(seconds.value / 60)
  const s = seconds.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})
onMounted(() => {
  timer = window.setInterval(() => seconds.value++, 1000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function onSubmit() {
  if (!draft.value.trim()) {
    ElMessage.warning('请先输入作文内容')
    return
  }
  submitted.value = true
  const item = q.value!
  // 写作：记录完成（自评，正确计 1 次完成）
  progress.addRecord({ section: 'writing', questionId: item.id, title: item.title, correct: 1, total: 1 })
  if (item.samples.length) band.value = item.samples[0].band
  ElMessage.success('已提交，查看下方范文对照')
}

onMounted(async () => {
  q.value = await api.getWritingById(route.params.id as string)
  loading.value = false
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
.prompt {
  line-height: 1.8;
  color: #374151;
}
.tips {
  margin-top: 12px;
  background: #fffbeb;
  border-radius: 8px;
  padding: 10px 14px;
}
.tips-title {
  font-weight: 600;
  margin-bottom: 6px;
}
.tips ul {
  margin: 0;
  padding-left: 18px;
  color: #4b5563;
}
.editor-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.stats {
  display: flex;
  gap: 8px;
}
.band-sel {
  margin-bottom: 12px;
}
.sample-comment {
  margin-bottom: 10px;
}
.sample {
  white-space: pre-wrap;
  line-height: 1.8;
  background: #f8fafc;
  border-radius: 8px;
  padding: 14px;
  font-family: inherit;
  color: #1f2937;
}
</style>
