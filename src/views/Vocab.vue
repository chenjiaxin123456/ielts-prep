<template>
  <div class="page-container">
    <h2 class="section-title">生词本</h2>

    <el-card class="block" shadow="never">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="单词">
          <el-input v-model="word" placeholder="如：sustainable" />
        </el-form-item>
        <el-form-item label="释义">
          <el-input v-model="meaning" placeholder="如：可持续的" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="add">添加</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="block" shadow="never">
      <div class="list-head">
        <span>共 {{ vocab.list.length }} 个单词</span>
        <el-button v-if="vocab.list.length" text type="danger" @click="clear">清空</el-button>
      </div>
      <el-table :data="vocab.list" empty-text="还没有收藏单词，去阅读/练习时添加吧">
        <el-table-column prop="word" label="单词" width="180" />
        <el-table-column prop="meaning" label="释义" />
        <el-table-column prop="createdAt" label="添加时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button text type="danger" @click="vocab.remove(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useVocabStore } from '@/stores/vocab'
import { ElMessage, ElMessageBox } from 'element-plus'

const vocab = useVocabStore()
const word = ref('')
const meaning = ref('')

async function add() {
  if (!word.value.trim()) {
    ElMessage.warning('请输入单词')
    return
  }
  if (await vocab.add(word.value, meaning.value)) ElMessage.success('已添加')
  else ElMessage.info('该词已在生词本中')
  word.value = ''
  meaning.value = ''
}

function clear() {
  ElMessageBox.confirm('确定清空生词本？', '提示', { type: 'warning' }).then(() => {
    vocab.clear()
    ElMessage.success('已清空')
  }).catch(() => {})
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

onMounted(() => vocab.load())
</script>

<style scoped lang="scss">
.block {
  border-radius: 12px;
  margin-bottom: 16px;
}
.list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: #6b7280;
}
</style>
