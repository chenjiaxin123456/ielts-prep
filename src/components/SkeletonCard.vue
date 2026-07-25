<template>
  <div class="q-link" aria-hidden="true">
    <div class="item skeleton-card">
      <el-skeleton :rows="3" animated />
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.q-link {
  display: block;
  color: inherit;
}
.skeleton-card {
  background: var(--c-surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 18px 20px;
  height: 100%;
}
</style>
