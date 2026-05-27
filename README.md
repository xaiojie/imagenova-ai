# PapaNova AI · 爬爬文生图

> 基于 GPT-image2 引擎的下一代 AI 文生图创作平台。
> 让灵感秒变画面，专注于创意本身。

[在线访问](https://www.papaclaoud.top/) ｜ [更新日志](./guidelines/Guidelines.md) ｜ [致谢](./ATTRIBUTIONS.md)

---

## 项目简介

PapaNova AI 是一款个人开发的 AI 文生图 Web 应用，前端使用 React + Vite + Tailwind v4 构建，后端用 Express 5 提供图像生成 API。它对接 GPT-image2（`gpt-image-1`）模型，提供高质量图片生成、风格化创作和云端作品管理能力。

未配置真实 API Key 时，后端会使用持久化 mock 数据，方便离线演示和完整流程联调。

## 核心特性

- **GPT-image2 引擎**：直连图像生成 API，支持高分辨率出图
- **多比例支持**：1:1、16:9、9:16、4:3、3:4 任选
- **风格预设**：内置多种风格模板，一键切换
- **创意度调节**：滑动条精细控制随机性与稳定性
- **批量生成**：单次最多 4 张并行
- **参考图垫图**：支持上传参考图引导生成
- **作品管理**：自动入库到「我的作品」，支持详情抽屉与删除
- **Mock 模式**：未填 Key 时走持久化模拟，完整流程可演示

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + Vite 6 |
| 样式 | Tailwind CSS v4 + shadcn 风格组件 |
| 路由 | React Router 7 |
| 动画 | Motion (Framer Motion) |
| 后端 | Express 5 + Multer |
| 数据 | 本地 JSON 文件持久化（`data/db.json`） |
| 图像模型 | GPT-image2（`gpt-image-1`） |

## 目录结构

```
.
├── index.html              # SPA 入口，含完整 SEO meta
├── public/                 # 静态资源（favicon、og-image、robots、sitemap、manifest）
├── server/
│   └── index.js            # Express 后端，提供 /api/generate 等接口
├── src/
│   ├── main.tsx            # 前端入口
│   ├── app/
│   │   ├── App.tsx         # 根组件
│   │   ├── components/     # 业务组件（GeneratePanel、Gallery、MyWorks 等）
│   │   └── lib/            # store 与 API 封装
│   └── styles/             # 全局样式与字体
├── data/                   # 本地数据库与上传图（被 gitignore）
├── guidelines/             # 设计规范与组件文档
├── .env.example            # 环境变量示例
└── package.json
```

## 快速开始

### 1. 安装依赖

```bash
npm i
```

### 2. 配置环境变量

复制示例文件并填写：

```bash
cp .env.example .env
```

`.env` 关键字段：

| 字段 | 说明 |
|------|------|
| `OPENAI_API_KEY` | 图像生成密钥（留空走 mock） |
| `IMAGE_API_BASE` | 图像 API 网关，默认 `https://www.papaclaoud.top` |
| `IMAGE_MODEL` | 后端实际调用的模型 ID，默认 `gpt-image-1` |
| `UI_MODEL_NAME` | 前端展示的模型名，默认 `GPT-image2` |
| `PORT` | 后端端口，默认 `8787` |
| `REDIS_URL` | 可选 Redis 地址；配置后生成任务使用 Redis 队列 |
| `GENERATION_JOB_TTL_SECONDS` | 生成任务状态保留时间，默认 `3600` |
| `IMAGE_PROVIDER_TIMEOUT_MS` | 单次上游生图请求超时，默认 `300000` |

### 3. 启动后端 API

```bash
npm run dev:api
```

启动成功后输出：

```
PapaNova API listening on http://127.0.0.1:8787
Live image provider enabled: gpt-image-1
```

### 4. 启动前端开发服务器

```bash
npm run dev
```

默认端口 `5173`，被占用时会自动换端口；也可手动指定：

```bash
npm run dev -- --port 5180
```

打开 [http://localhost:5173/](http://localhost:5173/) 即可使用。

### 5. 生产构建

```bash
npm run build
```

产物输出到 `dist/`，可直接部署到任意静态服务器。

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/generate` | 提交 prompt 与参数，生成图像 |
| `GET` | `/api/health` | 健康检查 |
| `GET` | `/api/models` | 返回当前 UI 模型名 |
| `GET` | `/api/works` | 获取已存作品列表 |

前端 Vite 已配置 `/api` 代理到 `http://127.0.0.1:8787`，开发时无需手动跨域。

## 部署提示

- **静态托管**：构建产物 `dist/` 可部署到 Vercel、Netlify、Cloudflare Pages 等平台
- **后端**：`server/index.js` 可单独部署到任意 Node 18+ 环境，搭配反向代理把 `/api` 转到对应端口
- **环境变量**：生产环境务必通过平台变量注入 `OPENAI_API_KEY`，不要提交到仓库
- **数据持久化**：`data/` 目录下的图片与数据库需要持久化卷，否则重启会丢失作品

## 许可与声明

- 项目仅供个人学习与创意创作使用
- 使用 GPT-image2 等第三方模型生成的内容，请遵守对应平台的使用条款
- 详见 [ATTRIBUTIONS.md](./ATTRIBUTIONS.md)

---

© 2026 PapaNova AI · 爬爬文生图
