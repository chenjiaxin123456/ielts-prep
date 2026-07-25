<template>
  <router-link :to="to" class="q-link" :aria-label="item.title">
    <el-card class="item card-hover" shadow="hover">
      <article>
        <div class="item-head">
          <div class="head-left">
            <slot name="head" :item="item" />
          </div>
          <div class="head-right">
            <el-rate :model-value="item.difficulty" disabled size="small" />
            <span v-if="item.band != null" class="band">Band {{ item.band }}</span>
          </div>
        </div>
        <h3 class="item-title">{{ item.title }}</h3>
        <div class="item-tags">
          <el-tag v-if="item.source === 'past'" size="small" type="warning" effect="plain" class="past-tag">真题</el-tag>
          <el-tag v-for="t in item.tags" :key="t" size="small" effect="plain">{{ t }}</el-tag>
          <slot name="extra-tags" :item="item" />
        </div>
        <div class="item-foot">
          <span><slot name="foot" :item="item" /></span>
          <el-icon aria-hidden="true"><ArrowRight /></el-icon>
        </div>
      </article>
    </el-card>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'

export interface QuestionCardItem {
  id: string
  section: 'listening' | 'reading' | 'writing' | 'speaking'
  title: string
  difficulty: number
  band?: number
  source?: string
  tags?: string[]
  year?: number
  topic?: string
  type?: string
  task?: number
  part?: number
  wordLimit?: number
  durationSec?: number
}

const props = defineProps<{ item: QuestionCardItem; skeleton?: boolean }>()

const to = computed(() => `/${props.item.section}/${props.item.id}`)
</script>

<style scoped lang="scss">
.q-link {
  display: block;
  color: inherit;
}
.q-link:focus-visible .item {
  outline: 2px solid var(--c-primary);
  outline-offset: 2px;
}
.item {
  height: 100%;
  margin-bottom: 16px;
  border-radius: var(--radius);
  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 18px 20px;
  }
}
.item-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}
.head-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.band {
  font-size: 12px;
  color: #2563eb;
  font-weight: 600;
}
.item-title {
  font-weight: 600;
  font-size: 15px;
  margin: 0 0 8px;
  min-height: 44px;
}
.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.past-tag {
  margin-right: 2px;
}
.item-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 12px;
  color: #909399;
  font-size: 13px;
  border-top: 1px solid var(--c-border);
}
.skeleton-card {
  display: none;
}
</style>
