<template>
  <div class="auth-wrap">
    <el-card class="auth-card" shadow="never">
      <div class="auth-brand">
        <el-icon :size="22" color="#2563eb"><Reading /></el-icon>
        <span>雅思备考</span>
      </div>
      <h2>注册</h2>
      <p class="sub">创建本地账号，立即开始备考</p>
      <el-form :model="form" @submit.prevent="onSubmit">
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码（至少 4 位）"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-select v-model="form.targetBand" placeholder="目标分数" size="large" class="full">
            <el-option v-for="b in bands" :key="b" :label="`${b} 分`" :value="b" />
          </el-select>
        </el-form-item>
        <el-button type="primary" size="large" class="full" native-type="submit" :loading="loading">
          注册并进入
        </el-button>
      </el-form>
      <div class="foot">
        已有账号？<el-link type="primary" @click="router.push({ name: 'login' })">登录</el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Reading, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const bands = [5.5, 6, 6.5, 7, 7.5, 8]
const form = reactive({ username: '', password: '', targetBand: 6.5 })

async function onSubmit() {
  if (!form.username.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (!form.password || form.password.length < 4) {
    ElMessage.warning('密码至少 4 位')
    return
  }
  loading.value = true
  try {
    await userStore.register(form.username.trim(), form.password, form.targetBand)
    ElMessage.success('注册成功，欢迎！')
    router.push({ name: 'home' })
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.auth-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 20% 20%, #eef2ff 0%, #f5f3ff 45%, #eef2ff 100%);
}
.auth-card {
  width: 380px;
  border-radius: 18px !important;
  padding: 8px 12px;
  box-shadow: var(--shadow-lg) !important;
}
.auth-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  margin-bottom: 12px;
}
h2 {
  margin: 4px 0;
}
.sub {
  color: #909399;
  font-size: 13px;
  margin: 0 0 18px;
}
.full {
  width: 100%;
}
.foot {
  margin-top: 14px;
  font-size: 13px;
}
</style>
