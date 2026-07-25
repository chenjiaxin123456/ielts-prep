import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/Login.vue') },
    { path: '/register', name: 'register', component: () => import('@/views/Register.vue') },
    {
      path: '/',
      component: DefaultLayout,
      children: [
        { path: '', name: 'home', component: () => import('@/views/Home.vue') },
        { path: 'listening', name: 'listening', component: () => import('@/views/listening/ListeningList.vue'), meta: { requiresAuth: true } },
        { path: 'listening/:id', name: 'listening-practice', component: () => import('@/views/listening/ListeningPractice.vue'), meta: { requiresAuth: true } },
        { path: 'reading', name: 'reading', component: () => import('@/views/reading/ReadingList.vue'), meta: { requiresAuth: true } },
        { path: 'reading/:id', name: 'reading-practice', component: () => import('@/views/reading/ReadingPractice.vue'), meta: { requiresAuth: true } },
        { path: 'writing', name: 'writing', component: () => import('@/views/writing/WritingList.vue'), meta: { requiresAuth: true } },
        { path: 'writing/:id', name: 'writing-practice', component: () => import('@/views/writing/WritingPractice.vue'), meta: { requiresAuth: true } },
        { path: 'speaking', name: 'speaking', component: () => import('@/views/speaking/SpeakingList.vue'), meta: { requiresAuth: true } },
        { path: 'speaking/:id', name: 'speaking-practice', component: () => import('@/views/speaking/SpeakingPractice.vue'), meta: { requiresAuth: true } },
        { path: 'articles', name: 'articles', component: () => import('@/views/articles/ArticleList.vue'), meta: { requiresAuth: true } },
        { path: 'articles/:id', name: 'article-detail', component: () => import('@/views/articles/ArticleDetail.vue'), meta: { requiresAuth: true } },
        { path: 'vocab', name: 'vocab', component: () => import('@/views/Vocab.vue'), meta: { requiresAuth: true } },
        { path: 'mistakes', name: 'mistakes', component: () => import('@/views/Mistakes.vue'), meta: { requiresAuth: true } },
        { path: 'profile', name: 'profile', component: () => import('@/views/Profile.vue'), meta: { requiresAuth: true } }
      ]
    }
  ]
})

// 简单的登录守卫：受保护页未登录则跳转登录
router.beforeEach((to) => {
  const userStore = useUserStore()
  userStore.init()
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
