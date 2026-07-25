<template>
  <div class="page-container" v-loading="loading">
    <el-page-header @back="router.back()" class="mb" />

    <template v-if="q">
      <div class="q-head">
        <h2 class="q-title">{{ q.title }}</h2>
        <div class="q-meta">
          <el-tag size="small" type="success">{{ typeName(q.type) }}</el-tag>
          <el-rate :model-value="q.difficulty" disabled size="small" />
          <el-tag size="small" effect="plain">{{ q.topic }}</el-tag>
        </div>
      </div>

      <el-row :gutter="20">
        <!-- 文章 -->
        <el-col :xs="24" :md="13">
          <el-card class="block" shadow="never">
            <h3 class="section-title">文章</h3>
            <div class="passage">
              <p v-for="(p, i) in paragraphs" :key="i">{{ p }}</p>
            </div>
          </el-card>
        </el-col>

        <!-- 题目 -->
        <el-col :xs="24" :md="11">
          <el-card class="block" shadow="never">
            <h3 class="section-title">题目</h3>
            <div v-for="(qq, i) in q.questionList" :key="i" class="q-item">
              <div class="q-stem">{{ qq.no }}. {{ qq.text }}</div>

              <!-- T/F/NG -->
              <el-radio-group v-if="q.type === 'tfng'" v-model="userAnswers[i]" :disabled="submitted" class="tfng">
                <el-radio value="TRUE" border>TRUE</el-radio>
                <el-radio value="FALSE" border>FALSE</el-radio>
                <el-radio value="NOT GIVEN" border>NOT GIVEN</el-radio>
              </el-radio-group>

              <!-- 单选（阅读选择题） -->
              <el-radio-group v-else-if="q.type === 'choice'" v-model="userAnswers[i]" :disabled="submitted" class="tfng">
                <el-radio v-for="(val, key) in q.options" :key="key" :value="key" border>{{ key }}. {{ val }}</el-radio>
              </el-radio-group>

              <!-- heading / match -> 选择 -->
              <el-select
                v-else-if="q.type === 'heading' || q.type === 'match'"
                v-model="userAnswers[i]"
                :disabled="submitted"
                placeholder="选择"
                class="sel"
              >
                <el-option v-for="(val, key) in q.options" :key="key" :label="`${key}. ${val}`" :value="key" />
              </el-select>

              <!-- summary -> 填空 -->
              <el-input v-else v-model="userAnswers[i]" :disabled="submitted" placeholder="填写答案" class="fill" />

              <div v-if="submitted" class="sub-result" :class="okList[i] ? 'ok' : 'no'">
                <el-icon><component :is="okList[i] ? CircleCheck : CircleClose" /></el-icon>
                正确答案：<b>{{ q.answer[i] }}</b>
              </div>
            </div>

            <div class="btn-row">
              <el-button v-if="!submitted" type="primary" size="large" @click="onSubmit">
                提交答案
              </el-button>
            </div>
            <el-alert
              v-if="submitted && q.explanation"
              :title="'解析：' + q.explanation"
              type="info"
              :closable="false"
              class="explain"
            />
            <div class="btn-row">
              <el-button v-if="submitted" @click="router.push('/reading')">返回列表</el-button>
            </div>
          </el-card>

          <!-- 生词快加 -->
          <el-card class="block" shadow="never">
            <h3 class="section-title">收藏生词</h3>
            <div class="vocab-row">
              <el-input v-model="vocabWord" placeholder="单词" class="va" />
              <el-input v-model="vocabMean" placeholder="释义" class="va" />
              <el-button type="primary" plain @click="addVocab">加入生词本</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleCheck, CircleClose, ArrowRight } from '@element-plus/icons-vue'
import { api } from '@/api'
import type { ReadingQuestion } from '@/types'
import { isCorrect } from '@/utils/grade'
import { useMistakeStore } from '@/stores/mistake'
import { useProgressStore } from '@/stores/progress'
import { useVocabStore } from '@/stores/vocab'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const mistake = useMistakeStore()
const progress = useProgressStore()
const vocab = useVocabStore()

const q = ref<ReadingQuestion | null>(null)
const loading = ref(true)
const userAnswers = ref<string[]>([])
const submitted = ref(false)
const vocabWord = ref('')
const vocabMean = ref('')

const paragraphs = computed(() => (q.value?.passage ? q.value.passage.split('\n').map((s) => s.trim()).filter(Boolean) : []))

const okList = computed(() =>
  (q.value?.questionList || []).map((_, i) => isCorrect(userAnswers.value[i], (q.value!.answer as string[])[i]))
)
const correctCount = computed(() => okList.value.filter(Boolean).length)
const totalCount = computed(() => q.value?.questionList?.length || 0)

function typeName(t: string) {
  return { tfng: 'T/F/NG', heading: '标题匹配', summary: '摘要填空', match: '信息匹配' }[t] || t
}

async function addVocab() {
  if (!vocabWord.value.trim()) {
    ElMessage.warning('请输入单词')
    return
  }
  if (await vocab.add(vocabWord.value, vocabMean.value)) ElMessage.success('已加入生词本')
  else ElMessage.info('该词已在生词本中')
  vocabWord.value = ''
  vocabMean.value = ''
}

function onSubmit() {
  const item = q.value!
  const total = totalCount.value
  const correct = correctCount.value
  submitted.value = true

  progress.addRecord({ section: 'reading', questionId: item.id, title: item.title, correct, total })

  if (correct < total) {
    mistake.add({
      id: item.id,
      section: 'reading',
      title: item.title,
      type: item.type,
      topic: item.topic,
      yourAnswer: userAnswers.value.join(' | '),
      correctAnswer: (item.answer as string[]).join(' | ')
    })
    ElMessage.warning(`答错 ${total - correct} 题，已加入错题集`)
  } else {
    ElMessage.success('全部答对！')
  }
}

onMounted(async () => {
  q.value = await api.getReadingById(route.params.id as string)
  if (q.value) userAnswers.value = Array(q.value.questionList?.length || 0).fill('')
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
.passage p {
  line-height: 1.8;
  color: #374151;
  margin: 0 0 12px;
}
.q-item {
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}
.q-stem {
  font-weight: 500;
  margin-bottom: 8px;
}
.tfng {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.sel,
.fill {
  max-width: 100%;
  margin-top: 4px;
}
.sub-result {
  margin-top: 6px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  &.ok {
    color: #16a34a;
  }
  &.no {
    color: #dc2626;
  }
}
.explain {
  margin-top: 12px;
}
.vocab-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.va {
  flex: 1;
  min-width: 150px;
}
</style>
