<template>
  <div class="page-container">
    <header class="page-head">
      <div>
        <h2 class="section-title">文章阅读</h2>
        <p class="subtitle">人民日报风格双语文章 · 左英右中对照 · 点击喇叭朗读英文</p>
      </div>
    </header>

    <div class="toolbar" role="search" aria-label="文章筛选">
      <el-select
        v-model="category"
        placeholder="全部分类"
        clearable
        style="width: 160px"
        @change="onCategoryChange"
      >
        <el-option v-for="c in categoryOptions" :key="c.value" :label="c.label" :value="c.value" />
      </el-select>
      <el-input
        v-model="keyword"
        placeholder="搜索中英文标题 / 内容"
        clearable
        style="width: 280px"
        aria-label="搜索文章"
        @keyup.enter="onSearch"
        @clear="onSearch"
      >
        <template #append>
          <el-button :icon="Search" aria-label="搜索" @click="onSearch" />
        </template>
      </el-input>
      <span class="total" aria-live="polite">共 {{ total }} 篇</span>
    </div>

    <!-- 错误态 -->
    <el-alert
      v-if="error"
      type="error"
      show-icon
      :closable="false"
      title="文章加载失败"
      description="网络异常，请重试。"
      class="err"
    >
      <template #default>
        <el-button size="small" type="danger" plain @click="load">重新加载</el-button>
      </template>
    </el-alert>

    <!-- 骨架屏 -->
    <el-row v-else-if="loading && !list.length" :gutter="16" class="cards-row">
      <el-col v-for="n in pageSize" :key="n" :xs="24" :sm="12" :md="8">
        <div class="skeleton-card">
          <el-skeleton :rows="4" animated />
        </div>
      </el-col>
    </el-row>

    <!-- 列表 -->
    <el-row v-else :gutter="16" class="cards-row" v-loading="loading">
      <el-col v-for="a in list" :key="a.id" :xs="24" :sm="12" :md="8">
        <router-link class="article-link" :to="`/articles/${a.id}`" :aria-label="`${a.title_zh} ${a.title_en}`">
          <el-card class="item card-hover" shadow="hover">
            <article>
              <div class="item-head">
                <el-tag size="small" effect="plain">{{ a.category_zh }}</el-tag>
                <time class="date" :datetime="a.published_at">{{ a.published_at }}</time>
              </div>
              <h3 class="item-title-en">{{ a.title_en }}</h3>
              <p class="item-title-zh">{{ a.title_zh }}</p>
              <p class="item-excerpt">{{ a.excerpt_en }}…</p>
              <div class="item-foot">
                <span>阅读全文</span>
                <el-icon aria-hidden="true"><ArrowRight /></el-icon>
              </div>
            </article>
          </el-card>
        </router-link>
      </el-col>
    </el-row>

    <el-empty v-if="!loading && !list.length && !error" description="没有匹配的文章，换个关键词或分类试试" />

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
import { ref, onUnmounted } from 'vue'
import { ArrowRight, Search } from '@element-plus/icons-vue'
import { api } from '@/api'
import type { ArticleSummary, ArticleCategory } from '@/types'

const categoryOptions = [
  { value: 'politics', label: '时政' },
  { value: 'economy', label: '经济' },
  { value: 'culture', label: '文化' },
  { value: 'technology', label: '科技' },
  { value: 'environment', label: '环境' },
  { value: 'society', label: '社会' },
  { value: 'world', label: '国际' },
  { value: 'education', label: '教育' },
  { value: 'health', label: '健康' },
  { value: 'sports', label: '体育' }
]

const list = ref<ArticleSummary[]>([])
const loading = ref(false)
const error = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(24)
const category = ref<ArticleCategory | ''>('')
const keyword = ref('')

let controller: AbortController | null = null

async function load() {
  if (controller) controller.abort()
  controller = new AbortController()
  loading.value = true
  error.value = false
  try {
    const res = await api.getArticles({
      page: page.value,
      pageSize: pageSize.value,
      category: category.value || undefined,
      keyword: keyword.value.trim() || undefined,
      signal: controller.signal
    })
    list.value = res.items
    total.value = res.total
  } catch (e: any) {
    if (e?.name !== 'CanceledError' && e?.code !== 'ERR_CANCELED') {
      error.value = true
      console.error('加载文章失败', e)
    }
  } finally {
    loading.value = false
  }
}

function onCategoryChange() {
  page.value = 1
  load()
}
function onSearch() {
  page.value = 1
  load()
}
function onSizeChange() {
  page.value = 1
  load()
}

onUnmounted(() => controller?.abort())
load()
</script>

<style scoped lang="scss">
.subtitle {
  color: var(--c-muted);
  margin: -6px 0 16px;
  font-size: 14px;
}
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
.err {
  margin-bottom: 16px;
}
.pager {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
.cards-row {
  align-items: stretch;
  row-gap: 16px;
}
.article-link {
  display: block;
  height: 100%;
  color: inherit;
}
.article-link:focus-visible .item {
  outline: 2px solid var(--c-primary);
  outline-offset: 2px;
}
.item {
  height: 100%;
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
  align-items: center;
  margin-bottom: 10px;
}
.date {
  font-size: 12px;
  color: var(--c-muted);
}
.item-title-en {
  font-weight: 700;
  font-size: 15px;
  line-height: 1.4;
  color: var(--c-text);
  margin: 0;
}
.item-title-zh {
  font-size: 13px;
  color: var(--c-primary);
  margin: 4px 0 8px;
}
.item-excerpt {
  font-size: 13px;
  color: var(--c-muted);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
  background: var(--c-surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 18px 20px;
  height: 100%;
}
</style>
