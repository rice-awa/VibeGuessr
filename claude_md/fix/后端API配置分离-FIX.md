# 后端 API 配置分离修复

## 问题

后端代码使用单一的 `API_BASE_URL` 和 `API_KEY` 同时服务 Gemini（LLM 聊天）和 OpenAI（图片生成）两个不同的 API 服务，无法独立配置不同的代理地址和密钥。

## 修改内容

### 1. `backend/config.py`
- 移除旧的 `API_BASE_URL` 和 `API_KEY`
- 新增 Gemini 配置：`GEMINI_API_BASE_URL`、`GEMINI_API_KEY`
- 新增 OpenAI 配置：`OPENAI_API_BASE_URL`、`OPENAI_API_KEY`
- `LLM_MODEL`、`IMAGE_MODEL`、`IMAGE_SIZE` 改为从环境变量读取，保留默认值

### 2. `backend/services/llm_service.py`
- 改用 `GEMINI_API_BASE_URL` 和 `GEMINI_API_KEY`
- 请求头增加 `Accept: application/json`（对齐文档规范）
- 端点路径 `/chat/completions` 与 Gemini chat 兼容格式文档一致

### 3. `backend/services/image_service.py`
- 改用 `OPENAI_API_BASE_URL` 和 `OPENAI_API_KEY`
- 请求头增加 `Accept: application/json`（对齐文档规范）
- 端点路径 `/images/generations` 与 gpt-image-2 文档一致
- 响应解析 `choices[0].message.content` 与文档返回格式一致

### 4. `backend/.env.example`
- 拆分为两组环境变量，分别标注用途
- 新增 `LLM_MODEL`、`IMAGE_MODEL`、`IMAGE_SIZE` 可配置项

## API 对齐验证

| 服务 | 端点 | 文档 | 代码 | 状态 |
|------|------|------|------|------|
| Gemini LLM | `/v1/chat/completions` | gemini-chat兼容格式.md | `{GEMINI_API_BASE_URL}/chat/completions` | 已对齐 |
| 图片生成 | `/v1/images/generations` | 创建 gpt-image-2.md | `{OPENAI_API_BASE_URL}/images/generations` | 已对齐 |
| 响应格式 | `choices[0].message.content` | 两份文档均使用此格式 | 两个 service 均使用此格式 | 已对齐 |
