<template>
  <div class="page-container">
    <h2 class="section-title">阅读题库</h2>
    <div class="toolbar" role="group" aria-label="筛选">
      <el-radio-group v-model="source" @change="changeSource">
        <el-radio-button label="practice">练习库</el-radio-button>
        <el-radio-button label="past">历年真题集</el-radio-button>
      </el-radio-group>
      <el-select v-model="bandMax" placeholder="目标分数" style="width: 150px" @change="changeBand">
        <el-option v-for="b in bandOptions" :key="b" :label="`目标分数 ≤ ${b}`" :value="b" />
      </el-select>
      <el-select
        v-model="typeFilter"
        placeholder="全部题型"
        clearable
        style="width: 160px"
        @change="onTypeChange"
      >
        <el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value" />
      </el-select>
      <el-select
        v-if="source === 'past'"
        v-model="year"
        placeholder="全部年份"
        clearable
        style="width: 130px"
        @change="changeYear"
      >
        <el-option v-for="y in yearOptions" :key="y" :label="y" :value="y" />
      </el-select>
      <span class="total" aria-live="polite">共 {{ total }} 题</span>
    </div>

    <el-alert
      v-if="error"
      type="error"
      show-icon
      :closable="false"
      title="题目加载失败"
      description="网络异常，请重试。"
    >
      <template #default>
        <el-button size="small" type="danger" plain @click="load">重新加载</el-button>
      </template>
    </el-alert>

    <el-row v-else-if="loading && !list.length" :gutter="16" class="cards-row">
      <el-col v-for="n in pageSize" :key="n" :xs="24" :sm="12" :md="8">
        <SkeletonCard />
      </el-col>
    </el-row>

    <el-row v-else :gutter="16" class="cards-row" v-loading="loading && list.length">
      <el-col v-for="q in list" :key="q.id" :xs="24" :sm="12" :md="8">
        <QuestionCard :item="q">
          <template #head="{ item }">
            <el-tag size="small" type="primary">{{ typeName(item.type || '') }}</el-tag>
          </template>
          <template #foot="{ item }">
            {{ item.topic }}<template v-if="item.year"> · {{ item.year }}</template>
          </template>
        </QuestionCard>
      </el-col>
    </el-row>

    <el-empty v-if="!error && !loading && !list.length" description="暂无题目，试试放宽目标分数或切换来源" />

    <nav class="pager" aria-label="分页">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[12, 24, 48, 96]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        :disabled="loading"
        @current-change="load"
        @size-change="onSizeChange"
      />
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuestionList } from '@/composables/useQuestionList'
import QuestionCard from '@/components/QuestionCard.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import type { ReadingQuestion } from '@/types'

const { list, loading, error, page, pageSize, total, source, bandMax, year, filter, load, onFilterChange, onSizeChange, changeSource, changeBand, changeYear } =
  useQuestionList<ReadingQuestion>('reading')

const typeFilter = ref<string>('')
const bandOptions = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0]
const yearOptions = Array.from({ length: 25 }, (_, i) => 2001 + i)
const typeOptions = [
  { label: 'T/F/NG', value: 'tfng' },
  { label: '摘要填空', value: 'summary' },
  { label: '标题匹配', value: 'heading' }
]

function onTypeChange() {
  filter.value = typeFilter.value ? { type: typeFilter.value } : {}
  onFilterChange()
}

function typeName(t: string) {
  return (
    {
      'fill-blank': '填空',
      choice: '单选',
      'multi-choice': '多选',
      match: '匹配',
      tfng: 'T/F/NG',
      heading: '标题匹配',
      summary: '摘要填空',
      essay: '议论文/图表',
      letter: '书信',
      part1: 'Part1',
      part2: 'Part2',
      part3: 'Part3'
    }[t] || t
  )
}
</script>

<style scoped lang="scss">
.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.total {
  color: var(--c-muted);
  font-size: 14px;
}
.pager {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
.cards-row {
  align-items: stretch;
}
</style>
