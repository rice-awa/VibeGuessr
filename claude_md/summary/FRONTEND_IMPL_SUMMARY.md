# 前端完整实现 - 任务总结

## 任务概述

基于 PRD.md 和 TODO.md，将前端从脚手架占位状态升级为生产级别的完整实现，对接后端全部 6 个 API 端点，建立统一的 Design System，完成阶段三所有任务项。

## Design System

| 维度 | 方案 |
|------|------|
| 主色 | Teal (#0d9488 / #14b8a6 / #0f766e) |
| 强调色 | Amber (#f59e0b / #fbbf24 / #d97706) |
| 字体 | Plus Jakarta Sans + system fallback |
| 间距 | 4px 基础单位（4/8/12/16/20/24/32/40/48/64） |
| 圆角 | 4 级层次（6/10/16/24px） |
| 阴影 | 3 级（sm/md/lg） |
| 动效 | ease-out (cubic-bezier 0.33,1,0.68,1)，150/250/400ms |

所有 token 通过 CSS 自定义属性统一管理，定义在 `index.css` 的 `:root` 中。

## 修改/新增文件清单

### 修改的文件

| 文件 | 变更 |
|------|------|
| `frontend/index.html` | 添加 Google Fonts (Plus Jakarta Sans) preconnect 和样式链接 |
| `frontend/src/index.css` | 全面重写为 Design System token + 全局基础样式 + 关键帧动画 |
| `frontend/src/pages/Home.jsx` | 重构首页：装饰性背景形状、badge、CTA 按钮、特性展示 |
| `frontend/src/pages/Home.css` | 全新样式，响应式布局 |
| `frontend/src/pages/DifficultySelect.jsx` | 重构：返回按钮、CSS 变量驱动的难度卡片、详细参数展示 |
| `frontend/src/pages/DifficultySelect.css` | 全新样式，grid 布局，hover 交互 |
| `frontend/src/pages/Game.jsx` | 完全重写：对接 useGame hook，SVG 圆环计时器，图片加载态，提示系统，表单提交，FeedbackModal 集成 |
| `frontend/src/pages/Game.css` | 全新样式，完整的状态视觉反馈 |
| `frontend/src/pages/Result.jsx` | 完全重写：评级系统(S/A/B/C/D)，动画计分，答题记录列表，最佳答题高亮 |
| `frontend/src/pages/Result.css` | 全新样式 |

### 新增的文件

| 文件 | 说明 |
|------|------|
| `frontend/src/hooks/useGame.js` | 游戏状态机 hook，管理完整游戏生命周期（idle→starting→loading→playing→judging→feedback→finished），对接 start/next/guess/hint/reveal/result 六个 API |
| `frontend/src/components/FeedbackModal.jsx` | 答题反馈弹窗组件，支持 5 种判定状态（exact/close/related/wrong/timeout），清晰图展示，知识卡片，重试/下一题操作 |
| `frontend/src/components/FeedbackModal.css` | 弹窗样式，遮罩层，弹性动画 |
| `frontend/src/components/LoadingOverlay.jsx` | 加载状态组件，支持全屏/内联模式，点阵跳动动画 |
| `frontend/src/components/LoadingOverlay.css` | 加载动画样式 |

### 未修改的文件

| 文件 | 原因 |
|------|------|
| `frontend/src/App.jsx` | 路由结构无需变动 |
| `frontend/src/main.jsx` | 入口无需变动 |
| `frontend/src/services/api.js` | API 层已完备，直接复用 |
| `frontend/src/hooks/useTimer.js` | 计时器 hook 已完备，直接复用 |
| `frontend/src/store/gameStore.js` | localStorage 存储和难度配置已完备，直接复用 |

## 核心架构决策

### useGame 状态机

```
idle → [startNewGame] → starting → loading → playing
playing → [submitAnswer] → judging → feedback
feedback (correct/无次数) → [goToNext] → loading → playing | finished
feedback (wrong/有次数) → [retryGuess] → playing
playing → [timeout] → feedback → [goToNext] → loading
playing → [skip] → loading → playing | finished
```

- 所有 API 调用集中在 useGame hook 中，页面组件只负责 UI 渲染
- sessionId 使用 useRef 额外保存，避免闭包中 state 滞后问题
- 错误统一通过 error state 处理，非关键操作（hint/reveal）失败静默降级

### 计时器

- SVG 圆环进度条，strokeDasharray/strokeDashoffset 驱动
- 三段颜色：>50% 绿（primary），30-50% 黄（warning），<30% 红（danger）
- 倒计时归零触发 onExpire 回调，进入超时反馈状态
- judging/feedback 阶段自动暂停，retry 后恢复（重新启动）

### 反馈弹窗

- 5 种视觉状态独立样式（exact/close/related/wrong/timeout）
- 正确答题时异步加载清晰图+知识卡片，加载中显示 spinner
- 错误但有剩余次数时显示"再试一次"按钮
- 最后一题自动切换按钮文案为"查看结果"

## 构建验证

- `npm run build` 通过，0 错误，产物：
  - CSS: 18.89 kB (gzip 3.98 kB)
  - JS: 252.66 kB (gzip 80.15 kB)

## 待办项（阶段四：体验优化）

- [ ] 预加载机制：当前题作答时后台预加载下一题的关键词和模糊图片
- [ ] 判分与清晰图生成并行请求（当前已在 useGame 中实现了 reveal 的异步调用）
- [ ] 首题加载时展示游戏规则/教程作为缓冲
- [ ] 图片生成超时降级（>20s 使用纯文字提示模式）
- [ ] 提示按钮过半高亮提醒

## 待办项（阶段五：测试 & 部署）

- [ ] 前后端联调完整流程测试
- [ ] 后端 API 单元测试
- [ ] 前端组件测试
- [ ] API 调用上限兜底
- [ ] 部署配置
