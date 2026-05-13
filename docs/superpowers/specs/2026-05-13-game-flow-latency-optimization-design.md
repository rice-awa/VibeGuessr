# VibeGuessr 游戏流程延迟优化设计

**日期**: 2026-05-13
**主题**: 通过后台预加载 + SSE 渐进推送 + Loading 体验优化，消除 ~50s 图片生成等待

## 背景

当前 `POST /api/game/next` 同步执行 LLM 生词（~3s）+ GPT-image-2 生图（~45s）= **~50s 阻塞**。用户每题都要硬等 50s 才能开始作答，严重影响体验。

### 现状关键事实

- **后端**：单 Flask 进程，session 存内存（`game_service.py`）
- **生图耗时**：经实测约 50s（2.6MB PNG，1024×1024）
- **图片超时**：已从 20s 提升至 60s（`config.py:34`）
- **前端**：`Game.jsx` 已有 `GameStatusPanel`、`LoadingOverlay`、`gm-image-skeleton`，但都是纯等待样式
- **没有任何预加载或缓存**：`loadNextQuestion` 在 `useGame.js:32` 直接调用 `/next` 等响应
- **TODO.md Phase 4**：明确列出"预加载下一题"为待办

## 目标

1. **消除感知等待**（主路径）：第 2 题起，用户点"下一题"时图片立即就绪
2. **首题体验提升**（兜底路径）：首题和预加载未命中时，通过 SSE 分阶段推送内容 + 优质 Loading 动画，让等待"有事发生"
3. **保持部署简洁**：不引入 Redis/Celery，仅依赖 Flask + gevent

## 架构：方案 C

### 核心机制

**三层递进**：

```
┌─────────────────────────────────────────────────────────┐
│  1. 后台预加载（threading）                              │
│     → 第 N 题开始作答时，后端自动开始生成第 N+1 题       │
│     → 命中率 > 80%（用户答题 + 结果页耗时通常 > 50s）    │
├─────────────────────────────────────────────────────────┤
│  2. SSE 渐进推送（首题 + 预加载未命中兜底）              │
│     → /api/game/next/stream 返回事件流                   │
│     → 事件 1: word_ready   (关键词+分类+提示已生成, ~3s)│
│     → 事件 2: image_ready  (模糊图已生成, ~50s)         │
│     → 前端先展示分类占位 UI，图片就位后淡入              │
├─────────────────────────────────────────────────────────┤
│  3. Loading 体验兜底                                     │
│     → 分阶段进度文案（"AI构思关键词→绘制图像→添加模糊"） │
│     → 骨架屏 + 呼吸动画                                 │
│     → 趣味小贴士轮播（游戏规则/难度特性）                │
└─────────────────────────────────────────────────────────┘
```

### 数据模型变更

Session（`game_service.py`）新增字段：

```python
session = {
    # 现有字段...
    "questions": [...],          # 已出题的列表
    "current_index": int,

    # 新增
    "preloaded_question": dict | None,  # 已预加载好的下一题
    "preload_status": "idle" | "loading" | "ready" | "error",
    "preload_lock": threading.Lock(),   # 避免并发覆盖
    "preload_future": Future | None,    # 后台任务句柄
}
```

### 端点变更

| 端点 | 变更 | 说明 |
|------|------|------|
| `POST /api/game/start` | 新增逻辑 | 创建 session 后立即触发首题预加载（后台线程） |
| `POST /api/game/next` | 改造 | 优先返回 `preloaded_question`；命中时 0 延迟 |
| `POST /api/game/guess` | 新增触发 | 判定正确 / 用完机会后，触发 `N+2` 预加载 |
| **`GET /api/game/next/stream`** | **新增** | SSE 端点，用于首题和预加载未命中时的渐进推送 |

### SSE 事件格式

```
event: word_ready
data: {"category": "动物", "hints": ["...", "..."], "question_index": 0}

event: image_ready
data: {"image": "data:image/png;base64,...", "question_index": 0}

event: done
data: {"ok": true}

event: error
data: {"message": "图片生成失败，已降级为文字模式"}
```

### 前端改造

- `useGame.js`：`loadNextQuestion` 先尝试 REST 拿 `preloaded`，未命中则走 SSE（`EventSource`）
- `Game.jsx`：新增 `phase: "partial"` 状态——关键词已到、图片未到，展示分类 + 骨架屏
- `GameStatusPanel`：改造为真·分阶段进度（关键词 → 图像 → 就绪），配合 SSE 事件更新

### 降级策略

- SSE 不可用（浏览器/代理问题）：回落到现有 `POST /next`
- 图片生成失败（60s 超时）：SSE 推送 `image_ready` 时带 `fallback: true` + 文字描述
- 预加载失败：标记 `preload_status = "error"`，下次 `/next` 走实时生成

## 部署要求

- Flask 启用 gevent worker（gunicorn `-k gevent`）以支持 SSE 长连接
- 保持现有 dev 流程 `python app.py` 可用（Flask 开发服务器原生支持 SSE）
- Vite proxy 需放开 SSE 长连接（`changeOrigin: true, ws: false` 已够，需验证 `/api/game/next/stream`）

## 验收标准

1. 第 2 题起，`/next` 响应时间 < 500ms（预加载命中场景）
2. 首题用户可在 ~3s 看到分类+提示（关键词就绪），~50s 看到图片
3. 预加载失败或 SSE 中断时自动降级，不阻塞游戏
4. 后端单进程并发 10 个 session 稳定运行

## 非目标（明确不做）

- ❌ 预生成静态题库（保留未来可做，本次不做）
- ❌ Redis / Celery（保持依赖简洁）
- ❌ WebSocket 双向通信（SSE 单向足够）
- ❌ 图片尺寸降级（1024 是模型质量保证线）
- ❌ 并行 reveal/judge（独立优化点，本次不合并）

## 开放问题

无。需求已明确。
