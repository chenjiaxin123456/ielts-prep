# 雅思备考网站 · 产品需求与技术架构文档

> 版本：v1.0（草案，待确认）
> 技术栈：Vue 3 + TypeScript + Element Plus（即 Vue3 版 Element-UI）+ Vite
> 日期：2026-07-19

---

## 0. 关于技术栈的一个说明（重要）

你提到的 **element-ui** 是 Vue **2** 的 UI 库。本项目使用 **Vue 3**，对应的官方 UI 库是 **Element Plus**（API 与 element-ui 基本一致，但专为 Vue3 重写）。文档与后续代码均基于 **Element Plus**，请知悉。

---

## 1. 项目背景与定位

### 1.1 背景
雅思（IELTS）是国内留学/移民人群的核心英语考试，考生对「分项练习 + 题库 + 模考 + 智能评测」有强需求。市面主流产品（雅思哥、小站雅思、IELTSplus、Engnovate 等）已验证了产品形态，但多数以 APP / 收费会员为主。本项目目标是做一个 **Web 端、可自托管、可逐步扩展** 的雅思备考平台。

### 1.2 目标用户
- 自学型考生（核心）：需要免费刷题、精听、范文、题库。
- 冲刺型考生：需要模考、错题本、学习数据追踪。
- （未来）培训机构：可部署为内部练习系统。

### 1.3 产品定位（MVP 阶段）
> **一个覆盖听/说/读/写四科、以题库练习与智能辅助为核心的 Web 备考工具，首期用本地 Mock 数据跑通完整学习闭环。**

---

## 2. 竞品调研总结（核心功能对标）

| 能力模块 | 雅思哥 | 小站雅思 | IELTSplus | Engnovate | 本项目（规划） |
|---|---|---|---|---|---|
| 四科分项练习 | ✅ | ✅ | ✅ | ✅ | ✅ 首期 |
| 题库（按试卷/题型/话题分类） | ✅ | ✅ | ✅ | ✅ | ✅ 首期 |
| 全真机考模考 | ✅ | ✅ | ⚠️ | ⚠️ | 🔜 二期 |
| 听力精听（倍速/单句循环/跟读） | ✅ | ✅ | ⚠️ | ✅ | ✅ 首期（基础版） |
| 阅读划词翻译/答案句定位 | ✅ | ✅ | ⚠️ | ⚠️ | 🔜 二期 |
| 写作批改/范文（Band 评分） | ✅(AI) | ✅(基础) | ✅ | ✅ | ✅ 首期（范文+自评） |
| 口语题库 + AI 打分 | ✅(SVIP) | ✅(AI) | ✅ | ✅ | ✅ 首期（题库+录音） |
| 生词本 / 错题集 | ⚠️ | ✅ | ⚠️ | ✅(闪卡) | ✅ 首期 |
| 能力测评 / 备考规划 | ✅ | ✅ | ✅ | ✅ | 🔜 二期 |
| 学习数据看板 | ✅ | ⚠️ | ✅ | ⚠️ | 🔜 二期 |
| 社区 / 考情（机经/考圈） | ✅ | ✅ | ⚠️ | ⚠️ | 🔜 三期 |
| 会员 / 付费体系 | ✅ | ✅ | ✅ | ✅ | 🔜 三期 |

**结论（本项目差异点）**：首期聚焦「**免费、好用、闭环完整**」——把四科练习 + 题库 + 精听 + 生词/错题 做到位，用 Mock 数据快速跑通体验；模考、AI 评测、社区作为后续阶段。

---

## 3. 核心功能模块（首期 MVP）

### 3.1 全局
- 首页 Dashboard：四科入口、今日推荐练习、学习进度概览（Mock）。
- 顶部导航 + 侧边栏（Element Plus `ElMenu`）。
- 用户体系：登录/注册（首期用本地模拟账号 + localStorage 持久化）。
- 全局搜索：按题型 / 话题 / 关键词检索题目。

### 3.2 听力 Listening
- 题目列表（按试卷、场景、难度筛选）。
- 练习页：音频播放器（倍速 0.75/1/1.25/1.5、进度条）、题目作答（填空/选择/匹配）、提交后显示答案与解析。
- 精听模式（基础版）：单句循环播放 + 听写输入框。

### 3.3 阅读 Reading
- 文章列表（Academic / General、话题、难度）。
- 练习页：左文章右题目布局；题目类型支持 T/F/NG、Heading、Matching、Summary 等。
- 提交判分 + 解析。

### 3.4 写作 Writing
- 题目库（Task1 图表 / Task2 议论文 / G 类书信）。
- 练习页：在线编辑器 + 字数统计 + 计时。
- 范文展示：按 Band 5~9 展示范文与评分点（首期静态范文，二期接入 AI 批改）。

### 3.5 口语 Speaking
- 当季口语题库（Part1 / Part2 / Part3）。
- 话题卡片（Cue Card）展示 + 思路提示 + 高分范例。
- 录音练习（浏览器 `MediaRecorder` API，本地保存，二期接 AI 打分）。

### 3.6 个人中心 / 学习工具
- 生词本：练习中收藏的单词，支持复习（闪卡）。
- 错题集：自动收集答错题目，按四科分类，支持重做。
- 练习历史与进度（Mock 统计）。

---

## 4. 用户角色与权限（首期简化）

| 角色 | 权限 |
|---|---|
| 游客 | 浏览题库、试做练习（不保存记录） |
| 注册用户 | 完整练习、生词本、错题集、历史记录（localStorage） |
| 管理员（二期） | 题库管理后台 |

首期不做真实后端，用户数据存 localStorage；二期接入后端与账号体系。

---

## 5. 信息架构（页面结构）

```
/                      首页 Dashboard
/login                 登录
/register              注册
/listening             听力列表
/listening/:id         听力练习
/reading               阅读列表
/reading/:id           阅读练习
/writing               写作列表
/writing/:id           写作练习
/speaking              口语列表
/speaking/:id          口语话题
/vocab                 生词本
/mistakes              错题集
/profile               个人中心
```
（二期）/mock /dashboard（数据看板）/community（社区）

---

## 6. 技术架构

### 6.1 技术选型
- **构建**：Vite 5
- **框架**：Vue 3（`<script setup>` + Composition API）
- **语言**：TypeScript
- **UI**：Element Plus + `@element-plus/icons-vue`
- **路由**：Vue Router 4
- **状态管理**：Pinia（用户、生词本、错题集、练习进度）
- **HTTP**：Axios（封装拦截器；首期指向本地 Mock / JSON，二期切真实 API）
- **工具**：dayjs（时间）、lodash-es（工具函数）
- **样式**：Element Plus 主题 + 少量 SCSS 变量

### 6.2 目录结构规划
```
ielts-web/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ src/
│  ├─ main.ts                 # 入口，挂载 App/Router/Pinia/ElementPlus
│  ├─ App.vue                 # 根组件（含布局）
│  ├─ router/                 # 路由配置
│  ├─ stores/                 # Pinia：user / vocab / mistake / progress
│  ├─ api/                    # axios 封装 + 各模块接口（首期 mock）
│  ├─ mock/                   # 本地 JSON 题库数据
│  ├─ types/                  # TS 类型定义（Question/User/...）
│  ├─ layouts/                # 整体布局（侧边栏+顶栏）
│  ├─ components/             # 公共组件（AudioPlayer / QuestionCard / ...）
│  ├─ views/                  # 页面（listening/reading/writing/speaking/...）
│  ├─ composables/            # 组合式函数（useAudio, useTimer...）
│  ├─ utils/                  # 工具函数
│  └─ styles/                 # 全局样式
└─ public/                    # 静态资源（音频、图片）
```

### 6.3 数据模型（TS 类型示例）
```ts
// 题目通用
interface BaseQuestion {
  id: string
  type: QuestionType      // fill-blank | choice | match | tfng | heading | summary
  section: 'listening' | 'reading' | 'writing' | 'speaking'
  difficulty: 1 | 2 | 3 | 4 | 5
  topic: string
  tags: string[]
}
interface ListeningQuestion extends BaseQuestion {
  audioUrl: string
  transcript?: string
  options?: Record<string, string>   // 选择题选项
  answer: string | string[]
  explanation?: string
}
// 用户、生词、错题、练习记录 类似定义于 src/types
```

---

## 7. 实施阶段建议

| 阶段 | 范围 | 交付 |
|---|---|---|
| **阶段一（本次构建）** | 脚手架 + 布局 + 首页 + 四科列表/练习页（基础交互）+ 生词本/错题集 + 本地 Mock 数据 | 可运行前端 Demo |
| 阶段二 | 模考套卷、阅读划词翻译、AI 写作/口语评测占位、学习数据看板 | 接近完整产品 |
| 阶段三 | 后端 API、真实账号、社区/机经、会员体系、管理后台 | 可上线运营 |

---

## 8. 待你确认的问题

1. **首期范围**：是否同意以上「阶段一」范围（先跑通四科基础练习闭环 + 生词/错题，数据用本地 Mock）？
2. **数据来源**：首期题目数据是否由我先用示例 JSON 填充（约每科 5~10 题），你后续替换为真实题库？
3. **视觉风格**：默认采用「清爽蓝白 + Element Plus 默认主题」，是否需要特定配色/品牌名？
4. **后端**：首期是否纯前端（无后端），二期再接？

---

> 确认后我将基于 Vite 脚手架初始化项目，并搭建上述目录与首页框架，给出可 `npm run dev` 运行的工程。
