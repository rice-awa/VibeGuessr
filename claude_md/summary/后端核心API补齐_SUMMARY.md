# 后端核心 API 补齐总结

## 完成概览

阶段二所有 TODO 项（共 18 项）已全部完成并打勾。

## 新增/重构的内容

### 1. SQLite 数据库持久化 — `models/game.py`（新建）
- `init_db()` — 创建 game_sessions 表
- `GameSession` 类 — 从 game_service.py 迁移过来的数据模型
- `save_session()` / `load_session()` / `delete_session()` — CRUD 操作
- 复杂字段（used_words, current_question, results）使用 JSON 序列化存储

### 2. 游戏服务重构 — `services/game_service.py`
- 移除内存字典 `_sessions = {}`，改用 SQLite 持久化
- 新增 `use_guess(session)` — 消耗猜测次数并持久化
- 新增 `use_hint(session)` — 消耗提示次数、返回提示文本并持久化
- 所有状态变更操作（set_current_question, record_result 等）均自动 save 到数据库

### 3. LLM 服务增强 — `services/llm_service.py`
- `_chat()` 内置网络级重试（Timeout / ConnectionError），最多重试 1 次
- 超时调整为 15 秒（符合 TODO 规格）

### 4. 图片服务增强 — `services/image_service.py`
- 提取公共 `_request_image(prompt)` 方法，消除代码重复
- 新增 `_normalize_image_response(content)` — 自动识别并规范化三种图片格式：
  - URL（`https://...`）→ 直接返回
  - data URI（`data:image/png;base64,...`）→ 直接返回
  - 原始 base64 字符串 → 包装为 `data:image/png;base64,{content}`
- 内置网络级重试，图片超时独立配置为 60 秒

### 5. 错误降级 — `app.py`
- 初始化时自动创建数据库
- 图片生成失败 → 降级为 `image: null`，游戏继续
- 判分失败 → 降级为 `match: "wrong"`（而非返回 502 阻断游戏）
- 知识卡片 / 清晰图生成失败 → 静默跳过

### 6. 配置管理 — `config.py`
- 新增 `IMAGE_REQUEST_TIMEOUT = 60`（图片生成独立超时）
- 新增 `DB_PATH`（数据库文件路径）
- `REQUEST_TIMEOUT` 从 30 调整为 15（符合 TODO "15 秒超时"）
