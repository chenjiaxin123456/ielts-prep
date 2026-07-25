# 雅思备考网站（IELTS Prep · 全栈）

基于 **Vue 3 + TypeScript + Element Plus + Vite** 的前端，配合 **Node + Express + SQLite** 后端，构成可端到端运行的雅思在线备考应用。

## 功能范围

- 首页 Dashboard：四科入口、今日推荐、学习进度概览
- 听力：音频播放（倍速）、填空/单选/匹配题、提交判分、错题收集、**精听模式（单句离线 TTS 朗读）**
- 阅读：文章 + T/F/NG、标题匹配、信息匹配、摘要填空，提交判分、生词快加
- 写作：在线编辑器（字数统计 + 计时）、按 Band 分数段范文对照
- 口语：当季口语题库（Part1/2/3）、题卡与思路、浏览器录音练习、高分范例
- 生词本 / 错题集 / 练习进度：登录后存后端，**匿名用户自动降级到 localStorage**
- 登录 / 注册：**真实账号体系（JWT + bcrypt 密码哈希）**

> 说明：你提到的 element-ui 是 Vue2 的库；本项目前端使用 **Element Plus**（Vue3 版）。

## 目录结构

```
.
├─ src/                  前端（Vue3 + TS）
│  ├─ api/               接口封装（axios，自动附加 Bearer Token）
│  ├─ components/        公共组件（AudioPlayer 等）
│  ├─ composables/       组合式函数（useSpeech 离线朗读）
│  ├─ layouts/           整体布局（侧边栏 + 顶栏）
│  ├─ mock/              四科示例题库（seed 数据源）
│  ├─ router/            路由
│  ├─ stores/            Pinia：user / vocab / mistake / progress（异步 + 后端同步）
│  ├─ styles/            全局样式
│  ├─ types/             TS 类型
│  ├─ utils/             工具（storage / grade 判分）
│  └─ views/             页面（首页/四科/生词/错题/个人中心/登录注册）
└─ server/               后端（Express + SQLite）
   ├─ src/db.js          建表 + 连接（WAL）
   ├─ src/seed.js        把 mock 题库写入数据库
   ├─ src/auth.js        JWT 签发校验 / 密码哈希
   ├─ src/middleware/    requireAuth（Bearer 解析）
   ├─ src/routes/        questions / auth / user
   └─ src/index.js       入口（挂载路由；生产环境托管 dist + SPA fallback）
```

## 题库（双源共 140,000 题，每模块 ≥1 万）

题库全部由 `server/scripts/generateQuestions.js` **原创生成**（非抓取版权真题），覆盖雅思四大项题型，共 **140,000 题**，**每个模块（含 practice+past）均 ≥1 万题**，分两个来源：

### 1. 练习库（practice，每科 10,000，共 40,000 题）
| 科目 | 题量 | 题型 |
| --- | --- | --- |
| 听力 | 10000 | 填空 / 单选 / 匹配（答案全部嵌入录音文稿，可判分） |
| 阅读 | 10000 | T/F/NG、段落标题匹配、摘要填空（事实同源，答案可靠） |
| 写作 | 10000 | Task1 图表(6 型) / Task2 议论文 / G 类书信，含 band6+8 范文 |
| 口语 | 10000 | Part1 日常 / Part2 题卡 / Part3 讨论，含提示与范例回答 |

### 2. 历年真题风格库（past，共 100,000 题）
以 2001–2025 真实考过的话题 / 题型 / 难度分布为蓝本、**逐题原创生成**（雅思真题受版权保护，不能逐字存储，界面统一标注「真题风格模拟」）。听力 30000 / 阅读 20000 / 写作 25000 / 口语 25000，每题带 `year` 字段（2001–2025 均匀分布），可按年份筛选。

> 每模块合计：听力 40000 / 阅读 30000 / 写作 35000 / 口语 35000 —— 均 ≥1 万题。

### 真实难度分层（band 9 档均衡）
所有题目带 `band`（5.0 / 5.5 / 6.0 / 6.5 / 7.0 / 7.5 / 8.0 / 8.5 / 9.0 共 9 档）与 `difficulty`（1–5 星，由 band 映射）。**每档题量相近、内容随 band 严格递增**：
- 听力：低分多 Section 1/2 生活场景、短词汇；高分多 Section 3/4 学术场景、长难词与更多干扰项。
- 阅读：passage 长度随 band 显著加长（低 band ≈200 词 → 高 band ≈700–900 词，接近真实雅思阅读篇幅）；`k` 值更高、NOT GIVEN 比例更大、摘要填空 gap 更多。
- 写作：提示抽象度随 band 升级（EASY→MID→HARD 题库）。
- 口语：低分多 Part1 短答，高分多 Part3 深度讨论。

列表默认按 `band ASC`（易→难）排序，支持 `source`（practice/past）、`bandMin`/`bandMax`（按目标分数筛选）、`year`（真题库）参数。**目标分数越高，刷到的题越多且越难。**

### 答案自检
`npm run verify` 会重建事实并比对全部 140,000 题的答案（阅读 T/F/NG、听力填空/选择/匹配、阅读标题/摘要），校验通过即代表答案正确。

重新生成：`cd server && npm run generate`（练习库输出到 `src/mock/generated/`，真题库输出到 `src/mock/past/`）。重灌数据库：`npm run seed:reset`。

## 文章模块（双语阅读，10 万篇）

原创生成 **10 万篇**「人民日报风格」双语**长文**（`server/scripts/generateArticles.js`，非抓取版权新闻），覆盖 10 个版面：时政 / 经济 / 文化 / 科技 / 环境 / 社会 / 国际 / 教育 / 健康 / 体育，每类目 1 万篇。**每篇中文翻译 ≥5000 字、英文对应**，为雅思泛读/精读长文训练素材。

- **左英右中对照**：详情页左侧英文、右侧中文翻译，逐段对齐（英文与中文由同一套双语语块同步产出，保证左右对应）。
- **喇叭朗读英文**：左侧每段落与顶部「朗读英文全文」按钮调用浏览器原生语音合成（Web Speech API，免费、可离线），与题目朗读复用 `useSpeech`。
- 列表支持**类目筛选 + 中英文关键词搜索 + 分页**，按发布日期倒序；`GET /api/articles` 返回 `{total,count,page,pageSize,items}`，`GET /api/articles/:id` 取详情，`GET /api/articles/stats` 取类目统计。
- 重新生成文章：`cd server && npm run generate:articles`（输出到 `src/mock/articles/`），随后 `npm run seed:reset` 重灌。

## 运行（开发模式）

需要两个终端：先起后端，再起前端（Vite 会把 `/api` 代理到 3001）。

```bash
# 终端 1 —— 后端
cd server
npm install            # 安装后端依赖（better-sqlite3 / express / jsonwebtoken ...）
npm run seed:reset     # 首次/重置：把 140,000 题库（练习 40,000 + 真题风格 100,000）写入 SQLite
npm run dev            # 启动后端，默认 http://localhost:3001
# 或 npm start

# 终端 2 —— 前端
npm install            # 安装前端依赖（若尚未安装）
npm run dev            # 启动 Vite，http://localhost:5173
```

前端访问 http://localhost:5173 ，所有 `/api/*` 请求经 Vite 代理转发到后端 3001。

> 题目列表接口**默认分页**：`GET /api/listening?page=1&pageSize=20` 返回 `{ total, count, page, pageSize, items }`，支持 `source` / `bandMin` / `bandMax` / `year` / 题型筛选；不传 `page`/`pageSize` 时兼容返回该科目全部数组。前端列表页已接入分页 + 目标分数 + 真题/练习库切换，未登录会被路由守卫拦截到登录页（详见下方接口速览的「鉴权」列）。

## 运行（生产单端口）

构建前端后，用后端直接托管静态产物（含 SPA history fallback）：

```bash
npm run build                       # 类型检查 + 生产构建到 dist/（VITE_APP_ENV=production）
cd server && npm install
NODE_ENV=production npm run seed    # 若生产库尚未初始化（写入 ielts.production.db）
NODE_ENV=production JWT_SECRET=<强密钥> node src/index.js   # 自动托管 dist/
```

## 三环境（本地 / 预发布 / 生产）

通过 `NODE_ENV` 区分后端三套环境，前端通过 Vite 的 `--mode` 区分。

| 环境 | `NODE_ENV` | 后端端口 | 数据库 | CORS | 前端 `VITE_API_BASE` |
| --- | --- | --- | --- | --- | --- |
| 本地开发 | `development` | `3001` | `ielts.db` | 放行所有 (`*`) | `/api`（走 Vite 代理 → 3001） |
| 预发布 | `staging` | `3098` | `ielts.staging.db` | 白名单（见 `.env.staging`） | `https://staging-api.ielts.example.com/api` |
| 生产 | `production` | `3001` | `ielts.production.db` | 白名单（部署时设 `CORS_ORIGIN`） | `/api`（同源，后端托管） |

### 后端环境变量（`server/.env.<env>`，已被 gitignore，模板见 `server/.env.example`）

| 变量 | 说明 | 默认 |
| --- | --- | --- |
| `NODE_ENV` | 环境标识 | `development` |
| `PORT` | 后端监听端口 | `3001` |
| `JWT_SECRET` | JWT 签名密钥（dev 有默认值；**staging/prod 必须用强密钥，否则拒绝启动**） | dev 默认弱密钥 |
| `TOKEN_EXPIRE_DAYS` | Token 有效期（天） | `7` |
| `CORS_ORIGIN` | 允许跨域的源（逗号分隔，dev 无需设） | 空（dev 放行所有） |
| `DATABASE_PATH` | 数据库文件路径（不填则按环境自动选） | 按环境 |

### 前端环境变量（`根/.env.<mode>`）

| 变量 | 说明 |
| --- | --- |
| `VITE_APP_ENV` | 当前环境标识 |
| `VITE_API_BASE` | 前端请求的基础路径（staging 指向预发后端完整地址；dev/prod 用 `/api`） |

### 常用脚本

```bash
# 后端
npm run dev              # NODE_ENV=development（默认）
NODE_ENV=staging npm run dev          # 预发（端口 3098）
NODE_ENV=staging npm run seed         # 初始化预发库
NODE_ENV=production npm run seed      # 初始化生产库
NODE_ENV=production JWT_SECRET=<强密钥> node src/index.js   # 生产单端口

# 前端
npm run dev              # 开发（代理 /api → 3001）
npm run dev:staging      # 预发模式（直连预发后端地址）
npm run build            # 生产构建
npm run build:staging    # 预发构建（注入预发后端地址）
npm run preview:staging  # 预览预发构建
```

## 接口速览

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| GET | `/api/health` | 健康检查 | 否 |
| GET | `/api/listening` `/reading` `/writing` `/speaking` | 题库列表（支持 `source`/`bandMin`/`bandMax`/`year`/题型 + 分页） | 前端需登录（路由守卫） |
| GET | `/api/listening/:id` … | 题目详情 | 前端需登录（路由守卫） |
| GET | `/api/articles` | 文章列表（类目筛选 + 关键词 + 分页） | 前端需登录（路由守卫） |
| GET | `/api/articles/:id` | 文章详情（中英段落） | 前端需登录（路由守卫） |
| GET | `/api/articles/stats` | 文章类目统计 | 前端需登录（路由守卫） |
| POST | `/api/auth/register` | 注册 `{username,password,targetBand}` | 否 |
| POST | `/api/auth/login` | 登录 `{username,password}` | 否 |
| GET/PUT | `/api/me` | 当前用户 | 是 |
| GET/POST/DELETE | `/api/vocab` `(/:id)` | 生词本 | 是 |
| GET/POST/DELETE | `/api/mistakes` `(/:id)` | 错题集 | 是 |
| GET/POST | `/api/progress` | 练习进度 | 是 |

## 后续阶段（见 docs/ 需求文档）

- 阶段二：全真机考模考、阅读划词翻译、AI 写作/口语评测、学习数据看板
- 阶段三：社区/机经、会员与后台管理
