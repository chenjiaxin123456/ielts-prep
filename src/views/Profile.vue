<template>
  <div class="page-container">
    <h2 class="section-title">个人中心</h2>

    <el-row :gutter="20">
      <el-col :xs="24" :md="10">
        <el-card class="block" shadow="never">
          <div class="profile-head">
            <el-avatar :size="56">{{ userStore.user?.username.charAt(0).toUpperCase() }}</el-avatar>
            <div>
              <div class="uname">{{ userStore.user?.username }}</div>
              <div class="uid">ID: {{ userStore.user?.id }}</div>
            </div>
          </div>

          <el-form label-width="90px" class="form">
            <el-form-item label="目标分数">
              <el-select v-model="targetBand" @change="save">
                <el-option v-for="b in bands" :key="b" :label="`${b} 分`" :value="b" />
              </el-select>
            </el-form-item>
            <el-form-item label="考试日期">
              <el-date-picker
                v-model="examDate"
                type="date"
                placeholder="选择考试日期"
                value-format="YYYY-MM-DD"
                @change="save"
              />
            </el-form-item>
          </el-form>

          <el-button type="danger" plain @click="logout">退出登录</el-button>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="14">
        <el-card class="block" shadow="never">
          <h3 class="section-title">各科目正确率</h3>
          <div v-for="s in sections" :key="s.key" class="prog-row">
            <span class="prog-name">{{ s.name }}</span>
            <el-progress
              class="prog-bar"
              :percentage="accuracy(s.key)"
              :stroke-width="12"
              :color="s.color"
              :show-text="false"
            />
            <span class="prog-val">{{ accuracy(s.key) }}%</span>
          </div>
          <el-divider />
          <div class="stat-row">
            <div class="stat">
              <div class="stat-num">{{ progress.totalDone }}</div>
              <div class="stat-label">完成练习</div>
            </div>
            <div class="stat">
              <div class="stat-num">{{ vocab.list.length }}</div>
              <div class="stat-label">生词</div>
            </div>
            <div class="stat">
              <div class="stat-num">{{ mistake.list.length }}</div>
              <div class="stat-label">错题</div>
            </div>
          </div>
        </el-card>

        <el-card class="block" shadow="never">
          <h3 class="section-title">最近练习</h3>
          <el-empty v-if="!progress.records.length" description="还没有练习记录" :image-size="80" />
          <el-timeline v-else>
            <el-timeline-item
              v-for="r in progress.records.slice(0, 8)"
              :key="r.id"
              :timestamp="formatDate(r.at)"
              placement="top"
            >
              <span class="rec-sec" :style="{ background: secColor(r.section) }">{{ secName(r.section) }}</span>
              {{ r.title }}
              <span class="rec-score">（{{ r.correct }}/{{ r.total }}）</span>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useVocabStore } from '@/stores/vocab'
import { useMistakeStore } from '@/stores/mistake'
import { useProgressStore } from '@/stores/progress'
import { ElMessage } from 'element-plus'
import type { Section } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const vocab = useVocabStore()
const mistake = useMistakeStore()
const progress = useProgressStore()
userStore.init()

onMounted(() => {
  progress.load()
  vocab.load()
  mistake.load()
})

const bands = [5.5, 6, 6.5, 7, 7.5, 8]
const targetBand = ref(userStore.user?.targetBand ?? 6.5)
const examDate = ref(userStore.user?.examDate ?? '')

function save() {
  userStore.updateProfile({ targetBand: targetBand.value, examDate: examDate.value })
  ElMessage.success('已保存')
}
function logout() {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push({ name: 'home' })
}

const sections = [
  { key: 'listening' as Section, name: '听力', color: '#2563eb' },
  { key: 'reading' as Section, name: '阅读', color: '#16a34a' },
  { key: 'writing' as Section, name: '写作', color: '#d97706' },
  { key: 'speaking' as Section, name: '口语', color: '#db2777' }
]
function accuracy(s: Section) {
  const st = progress.accuracyBySection[s]
  if (!st || st.total === 0) return 0
  return Math.round((st.correct / st.total) * 100)
}
function secName(s: Section) {
  return { listening: '听力', reading: '阅读', writing: '写作', speaking: '口语' }[s]
}
function secColor(s: Section) {
  return { listening: '#2563eb', reading: '#16a34a', writing: '#d97706', speaking: '#db2777' }[s]
}
function formatDate(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}
</script>

<style scoped lang="scss">
.block {
  border-radius: 12px;
  margin-bottom: 16px;
}
.profile-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}
.uname {
  font-weight: 600;
  font-size: 16px;
}
.uid {
  font-size: 12px;
  color: #9ca3af;
}
.prog-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.prog-name {
  width: 64px;
  font-size: 13px;
  flex-shrink: 0;
}
.prog-bar {
  flex: 1;
}
.prog-val {
  width: 40px;
  text-align: right;
  font-size: 13px;
  color: #6b7280;
  flex-shrink: 0;
}
.stat-row {
  display: flex;
  gap: 16px;
}
.stat {
  flex: 1;
  text-align: center;
  background: var(--brand-light);
  border-radius: 10px;
  padding: 14px;
}
.stat-num {
  font-size: 22px;
  font-weight: 700;
  color: var(--brand-color);
}
.stat-label {
  font-size: 12px;
  color: #6b7280;
}
.rec-sec {
  color: #fff;
  font-size: 12px;
  padding: 1px 7px;
  border-radius: 5px;
  margin-right: 4px;
}
.rec-score {
  color: #6b7280;
}
</style>
