# 部署指南（IELTS 备考网站）

本项目是**前后端一体**架构：生产环境下由 Node/Express 后端直接托管前端构建产物 `dist/`（含 SPA history fallback），**只需启动一个 Node 进程、占用一个端口**即可对外提供服务，无需单独的 Nginx 托管前端或静态资源服务器。

```
浏览器 ──► 你的服务器 :PORT ──► Express
                         ├── /api/*      后端接口（鉴权 / 题库 / 用户数据）
                         └── /*          静态前端（dist/index.html + assets）
```

---

## 一、前置条件

| 项目 | 要求 |
| --- | --- |
| Node.js | **≥ 22**（用了 ESM、`better-sqlite3@11`） |
| 操作系统 | Linux / macOS / Windows Server 均可 |
| 端口 | 一个对外端口（默认 3001，建议在 `.env.production` 或启动命令里改掉） |
| 构建工具 | `better-sqlite3` 是原生模块，需在**部署机上 `npm install`** 以编译匹配当前环境的二进制；直接拷贝旧机器的 `node_modules` 可能不兼容 |

> ⚠️ 数据库是 **SQLite 单文件**（`server/data/ielts.production.db`）。它依赖本地磁盘持久化，**不适合部署到会定期清空临时文件的平台**（如某些纯函数计算/静态托管）。请部署到普通虚拟机/容器并确保该目录可写、已备份。

---

## 二、部署步骤（三步走）

### 1. 构建前端

在项目根目录：

```bash
npm install
npm run build                # 类型检查 + vite build，产物在 dist/
```

生产构建读取 `根/.env.production`：`VITE_APP_ENV=production` + `VITE_API_BASE=/api`（前端以同源相对路径 `/api` 调用接口，由同一 Node 进程处理）。

不同环境的构建命令：

```bash
npm run build               # 生产
npm run build:staging       # 预发布（走 .env.staging 的 VITE_API_BASE 完整地址）
```

### 2. 配置后端环境变量

**方式 A（推荐，文件）**：复制模板并按环境填写：

```bash
cd server
cp .env.example .env.production      # 生产
# 或 cp .env.example .env.staging    # 预发布
```

`server/.env.production` 至少包含：

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=<用 openssl rand -base64 48 生成的强随机串>
TOKEN_EXPIRE_DAYS=7
CORS_ORIGIN=https://你的域名.com
# DATABASE_PATH 可不填，默认 server/data/ielts.production.db
```

> 安全校验：预发/生产若 `JWT_SECRET` 仍是默认弱密钥，服务会**直接退出**（已在 `index.js` 内置）。

**方式 B（Shell / 部署平台环境变量）**：直接 export，优先级高于 `.env` 文件：

```bash
export NODE_ENV=production
export JWT_SECRET="$(openssl rand -base64 48)"
export PORT=3001
export CORS_ORIGIN="https://你的域名.com"
```

### 3. 灌库并启动

```bash
cd server
npm install                 # 编译 better-sqlite3 等原生依赖
npm run seed:reset          # 清空并按当前 NODE_ENV 灌入 10200 题（生产写 ielts.production.db）

# 启动（使用方式 B 的 export 变量时，直接 node src/index.js 即可）
NODE_ENV=production node src/index.js
```

启动后访问 `http://服务器IP:PORT/` 即可。

---

## 三、三种部署形态

### A. 直接运行（最简，适合内网 / 临时演示）

```bash
NODE_ENV=production JWT_SECRET="$(openssl rand -base64 48)" \
  PORT=3001 node server/src/index.js
```

- 优点：零额外依赖。
- 缺点：终端关闭即停；异常崩溃不自动拉起。

### B. PM2 进程守护（推荐生产单机）

```bash
npm install -g pm2
cd server
pm2 start "NODE_ENV=production node src/index.js" \
  --name ielts \
  --env production \
  -x
pm2 save
pm2 startup                  # 注册开机自启（按提示执行生成的命令）
```

常用：`pm2 logs ielts` / `pm2 restart ielts` / `pm2 stop ielts`。

### C. 云服务器 + Nginx 反代（推荐对外公网 + HTTPS）

Node 进程监听内网端口（如 3001），Nginx 对外暴露 443/80 并反代：

```nginx
server {
    listen 443 ssl;
    server_name ielts.example.com;

    ssl_certificate     /path/fullchain.pem;
    ssl_certificate_key /path/privkey.pem;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://127.0.0.1:3001;   # 由后端托管 dist + SPA fallback
        proxy_set_header Host $host;
    }
}
```

- 此形态下 `CORS_ORIGIN` 可设为你域名（同源访问时其实用不到，但保留无妨）。
- 若用 Docker：把 `server/` + 根 `dist/` 一并打进镜像，`CMD` 执行上面的启动命令，挂载 `server/data/` 为卷以持久化数据库。

---

## 四、三环境速查

| 环境 | 前端构建 | 后端启动 | 数据库 | 端口示例 |
| --- | --- | --- | --- | --- |
| 开发 development | `npm run dev`（Vite 5173，代理 /api→3001） | `npm run dev`（server） | `ielts.db` | 前端 5173 / 后端 3001 |
| 预发 staging | `npm run build:staging` | `NODE_ENV=staging node src/index.js` | `ielts.staging.db` | 如 3098 |
| 生产 production | `npm run build` | `NODE_ENV=production node src/index.js` | `ielts.production.db` | 如 3001 |

各类启动脚本（在 `server/` 下）：

```bash
npm run start:staging      # NODE_ENV=staging
npm run start:prod         # NODE_ENV=production
npm run seed:staging       # 灌预发库
npm run seed:prod          # 灌生产库
npm run generate           # 重新生成 1 万+ 题库到 src/mock/generated/
```

---

## 五、注意事项与排错

1. **必须 `npm run build` 后再启动后端**：后端只有在检测到 `dist/` 时才会托管前端；没有 `dist` 则只提供 `/api`，访问根路径会得到 404。
2. **改了前端要重新 build**：只改 `src/` 不会自动生效，需重新 `npm run build` 并（如需）重启后端。
3. **数据库备份**：定期备份 `server/data/*.db`。SQLite 不支持多进程写，单进程 Node 服务没问题；不要用多个 Node 实例同时写同一个 db 文件。
4. **端口被占用**：`EADDRINUSE` 说明端口已被占，改 `PORT` 或释放端口。
5. **CORS 报错**：生产跨域被拒，通常是 `CORS_ORIGIN` 没配或前后端不同源且域名不在白名单。同源（Nginx 反代同一域名）场景不会有此问题。
6. **better-sqlite3 安装失败**：确保部署机有 Python 3 + 编译工具（Linux：`build-essential` + `python3`；macOS：Xcode CLT）。
7. **安全**：生产 `JWT_SECRET` 务必用强随机串；`.env*` 已被 gitignore，切勿提交真实密钥。

---

## 六、本地一键验证生产形态

```bash
# 根目录
npm run build

# server 目录
cd server
npm install
npm run seed:reset
NODE_ENV=production JWT_SECRET="$(openssl rand -base64 48)" PORT=3001 node src/index.js
# 浏览器打开 http://localhost:3001/
```

---

## 七、接口约定（列表分页）

题库列表接口**默认分页**，不会一次性返回全部数据（1 万+ 题）：

- `GET /api/:section`（`listening`/`reading`/`writing`/`speaking`）
  - 默认返回 `{ total, count, page, pageSize, items }`，每页 24 条，最大 100。
  - 分页参数：`page`（从 1 开始）、`pageSize`，兼容旧的 `limit`/`offset`。
  - 筛选参数：
    - `type`：通用题型（`fill-blank`/`choice`/`match`/`tfng`/`summary`/`heading` 等）
    - `task`：写作专用，`1` 或 `2`
    - `part`：口语专用，`1`/`2`/`3`
- `GET /api/:section/:id`：单题详情（对象，不变）。
- `GET /api/stats`：返回四科题目总数 `{ listening, reading, writing, speaking }`，供首页统计使用。

并发优化已内置：
- **内存缓存**（`server/src/cache.js`，TTL 5 分钟）：列表/详情/stats 命中即返回，降低 SQLite 同步查询与 JSON 解析开销。重灌库（`seed:reset`）在独立进程，最多 5 分钟（或重启后端）后生效。
- **gzip 压缩**（`compression` 中间件）：JSON 响应自动压缩，提升高并发吞吐。
- **前端防乱序**：列表页翻页/筛选时用 `AbortController` 取消上一未完成请求，避免快速操作导致数据错乱。
