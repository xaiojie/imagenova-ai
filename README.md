# ImageNova AI

基于 GPT-image2 引擎的下一代 AI 文生图创作平台。支持高质量图像生成、风格化创作和云端作品管理。

## 本地启动

安装依赖：

```bash
npm i
```

启动后端 API：

```bash
npm run dev:api
```

启动前端开发服务器：

```bash
npm run dev
```

## 环境变量

复制 `.env.example` 为 `.env` 并填写：

- `OPENAI_API_KEY` 用于真实图像生成（未填则走持久化 mock，便于离线测试完整流程）
- `IMAGE_API_BASE` 图像 API 网关
- `IMAGE_MODEL` 后端实际调用的模型 ID
- `UI_MODEL_NAME` 前端展示的模型名（默认 `GPT-image2`）
- `PORT` 后端端口（默认 8787）

详见 `.env.example`。
