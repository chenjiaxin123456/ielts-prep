<template>
  <el-container class="layout">
    <el-aside width="240px" class="aside">
      <div class="brand">
        <div class="logo">雅</div>
        <div class="brand-text">
          <span class="brand-name">IELTS Prep</span>
          <span class="brand-sub">雅思备考</span>
        </div>
      </div>

      <el-menu :default-active="activeMenu" router class="menu">
        <el-menu-item v-for="m in menus" :key="m.index" :index="m.index">
          <el-icon><component :is="m.icon" /></el-icon>
          <span>{{ m.label }}</span>
        </el-menu-item>
      </el-menu>

      <div class="aside-foot">
        <div class="tip-card">
          <div class="tip-title">每日一练</div>
          <div class="tip-desc">坚持打卡，稳步提分 🚀</div>
        </div>
      </div>
    </el-aside>

    <el-container>
      <el-header class="header">
        <el-breadcrumb :separator-icon="ArrowRight" class="crumb">
          <el-breadcrumb-item>雅思备考</el-breadcrumb-item>
          <el-breadcrumb-item>{{ pageTitle }}</el-breadcrumb-item>
        </el-breadcrumb>

        <div class="header-right">
          <el-dropdown v-if="userStore.isLoggedIn" @command="onCommand">
            <span class="user-trigger">
              <el-avatar :size="32" class="user-avatar">{{ userStore.user?.username.charAt(0).toUpperCase() }}</el-avatar>
              <span class="username">{{ userStore.user?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <template v-else>
            <el-button text @click="goLogin">登录</el-button>
            <el-button type="primary" class="glow-btn" round @click="goRegister">注册</el-button>
          </template>
        </div>
      </el-header>

      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  HomeFilled,
  Headset,
  Notebook,
  EditPen,
  Microphone,
  Collection,
  CircleClose,
  Document,
  User,
  ArrowRight,
  ArrowDown
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
userStore.init()

const menus = [
  { index: '/', label: '首页', icon: HomeFilled },
  { index: '/listening', label: '听力 Listening', icon: Headset },
  { index: '/reading', label: '阅读 Reading', icon: Notebook },
  { index: '/writing', label: '写作 Writing', icon: EditPen },
  { index: '/speaking', label: '口语 Speaking', icon: Microphone },
  { index: '/articles', label: '文章 Articles', icon: Document },
  { index: '/vocab', label: '生词本', icon: Collection },
  { index: '/mistakes', label: '错题集', icon: CircleClose },
  { index: '/profile', label: '个人中心', icon: User }
]

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/listening')) return '/listening'
  if (path.startsWith('/reading')) return '/reading'
  if (path.startsWith('/writing')) return '/writing'
  if (path.startsWith('/speaking')) return '/speaking'
  if (path.startsWith('/articles')) return '/articles'
  if (path.startsWith('/vocab')) return '/vocab'
  if (path.startsWith('/mistakes')) return '/mistakes'
  if (path.startsWith('/profile')) return '/profile'
  return '/'
})

const titles: Record<string, string> = {
  '/': '首页',
  '/listening': '听力练习',
  '/reading': '阅读练习',
  '/writing': '写作练习',
  '/speaking': '口语练习',
  '/articles': '文章阅读',
  '/vocab': '生词本',
  '/mistakes': '错题集',
  '/profile': '个人中心'
}
const pageTitle = computed(() => titles[activeMenu.value] || '雅思备考')

function goLogin() {
  router.push({ name: 'login', query: { redirect: route.fullPath } })
}
function goRegister() {
  router.push({ name: 'register' })
}
function onCommand(cmd: string) {
  if (cmd === 'profile') router.push({ name: 'profile' })
  if (cmd === 'logout') {
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push({ name: 'home' })
  }
}
</script>

<style scoped lang="scss">
.layout {
  height: 100vh;
}
.aside {
  background: linear-gradient(180deg, #4f46e5 0%, #6d28d9 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 20px;
}
.logo {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-weight: 800;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.brand-name {
  color: #fff;
  font-weight: 800;
  font-size: 17px;
  letter-spacing: 0.4px;
}
.brand-sub {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}
.menu {
  flex: 1;
  background: transparent !important;
  border-right: none;
  padding: 6px 12px;
}
.menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.78);
  border-radius: 10px;
  margin-bottom: 6px;
  height: 46px;
  transition: all 0.2s ease;
}
.menu :deep(.el-menu-item .el-icon) {
  color: rgba(255, 255, 255, 0.78);
}
.menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}
.menu :deep(.el-menu-item.is-active) {
  background: #fff;
  color: var(--c-primary);
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
}
.menu :deep(.el-menu-item.is-active .el-icon) {
  color: var(--c-primary);
}
.aside-foot {
  padding: 16px;
}
.tip-card {
  background: rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  padding: 14px;
  color: #fff;
}
.tip-title {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 4px;
}
.tip-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.82);
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--c-border);
  height: 60px;
}
.crumb :deep(.el-breadcrumb__inner) {
  font-weight: 600;
  color: var(--c-text);
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  outline: none;
}
.user-avatar {
  background: linear-gradient(135deg, var(--c-primary), var(--c-violet));
  color: #fff;
  font-weight: 700;
}
.username {
  font-size: 14px;
  font-weight: 500;
}
.main {
  background: var(--c-bg);
  padding: 0;
  overflow-y: auto;
}
</style>
