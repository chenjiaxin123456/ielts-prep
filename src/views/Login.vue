<template>
  <div class="auth-wrap">
    <el-card class="auth-card" shadow="never">
      <div class="auth-brand">
        <el-icon :size="22" color="#2563eb"><Reading /></el-icon>
        <span>雅思备考</span>
      </div>
      <h2>登录</h2>
      <p class="sub">首期使用本地账号（用户名即账号，密码任意）</p>
      <el-form :model="form" @submit.prevent="onSubmit">
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-button type="primary" size="large" class="full" native-type="submit" :loading="loading">
          登录
        </el-button>
      </el-form>
      <div class="foot">
        还没有账号？<el-link type="primary" @click="router.push({ name: 'register' })">注册</el-link>
        <el-link class="back" type="info" @click="router.push({ name: 'home' })">返回首页</el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Lock, Reading } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)
const form = reactive({ username: '', password: '' })

async function onSubmit() {
  if (!form.username.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (!form.password) {
    ElMessage.warning('请输入密码')
    return
  }
  loading.value = true
  try {
    await userStore.login(form.username.trim(), form.password)
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '登录失败')
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
  display: flex;
  gap: 8px;
  align-items: center;
}
.back {
  margin-left: auto;
}
</style>
