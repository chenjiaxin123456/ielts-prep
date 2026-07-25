<template>
  <div class="page-container">
    <h2 class="section-title">错题集</h2>
    <el-card class="block" shadow="never">
      <div class="list-head">
        <span>共 {{ mistake.list.length }} 道错题</span>
        <el-button v-if="mistake.list.length" text type="danger" @click="clear">清空</el-button>
      </div>

      <el-tabs v-model="active" class="tabs">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="听力" name="listening" />
        <el-tab-pane label="阅读" name="reading" />
      </el-tabs>

      <el-empty v-if="!filtered.length" description="暂无错题，继续加油！" />
      <el-timeline v-else>
        <el-timeline-item
          v-for="m in filtered"
          :key="m.id"
          :timestamp="formatDate(m.createdAt)"
          placement="top"
        >
          <el-card shadow="never" class="m-card">
            <div class="m-head">
              <el-tag size="small" :type="tagType(m.section)">{{ sectionName(m.section) }}</el-tag>
              <span class="m-title">{{ m.title }}</span>
            </div>
            <div class="m-body">
              <div class="m-line no">你的答案：{{ Array.isArray(m.yourAnswer) ? m.yourAnswer.join(', ') : m.yourAnswer }}</div>
              <div class="m-line ok">正确答案：{{ Array.isArray(m.correctAnswer) ? m.correctAnswer.join(', ') : m.correctAnswer }}</div>
            </div>
            <div class="m-actions">
              <el-button size="small" type="primary" plain @click="redo(m)">重做</el-button>
              <el-button size="small" text type="danger" @click="mistake.remove(m.id)">移除</el-button>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMistakeStore } from '@/stores/mistake'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Section } from '@/types'

const router = useRouter()
const mistake = useMistakeStore()
const active = ref<'all' | Section>('all')

const filtered = computed(() =>
  active.value === 'all' ? mistake.list : mistake.list.filter((m) => m.section === active.value)
)

function tagType(s: Section) {
  return { listening: 'primary', reading: 'success', writing: 'warning', speaking: 'danger' }[s]
}
function sectionName(s: Section) {
  return { listening: '听力', reading: '阅读', writing: '写作', speaking: '口语' }[s]
}
function redo(m: { id: string; section: Section }) {
  router.push({ path: `/${m.section}/${m.id}` })
}
function clear() {
  ElMessageBox.confirm('确定清空错题集？', '提示', { type: 'warning' }).then(() => {
    mistake.clear()
    ElMessage.success('已清空')
  }).catch(() => {})
}
function formatDate(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

onMounted(() => mistake.load())
</script>

<style scoped lang="scss">
.block {
  border-radius: 12px;
}
.list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  color: #6b7280;
}
.m-card {
  border-radius: 10px;
}
.m-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.m-title {
  font-weight: 600;
}
.m-line {
  font-size: 14px;
  margin: 2px 0;
  &.no {
    color: #dc2626;
  }
  &.ok {
    color: #16a34a;
  }
}
.m-actions {
  margin-top: 8px;
}
</style>
