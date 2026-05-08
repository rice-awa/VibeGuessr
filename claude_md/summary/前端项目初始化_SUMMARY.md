# 前端项目初始化 - 任务总结

## 完成内容

### 1. TODO.md 创建
基于 PRD 文档，将 MVP 开发任务拆分为 5 个阶段：
- 阶段一：项目初始化（前端/后端/联调配置）
- 阶段二：后端核心 API（LLM服务、图片服务、游戏逻辑、7个API端点）
- 阶段三：前端页面与交互（5个页面、7个组件、Hooks、服务层、状态管理）
- 阶段四：体验优化（预加载、并行请求、等待动画、降级方案）
- 阶段五：测试与部署
- 后续迭代清单（双人模式、奖品场、排行榜等）

### 2. 前端项目初始化（React + Vite）

**技术栈**：React 19 + Vite 8 + react-router-dom

**目录结构**：
```
frontend/
├── src/
│   ├── components/          # 通用组件（待开发）
│   ├── pages/
│   │   ├── Home.jsx         # 首页 - Logo + 开始按钮
│   │   ├── DifficultySelect.jsx  # 难度选择 - 三张卡片
│   │   ├── Game.jsx         # 游戏主页 - 图片/输入/计时器布局
│   │   └── Result.jsx       # 结算页 - 得分/正确率/平均用时
│   ├── services/
│   │   └── api.js           # 后端 API 调用封装（6个接口）
│   ├── hooks/
│   │   └── useTimer.js      # 倒计时 Hook
│   ├── store/
│   │   └── gameStore.js     # 难度配置 + localStorage 积分持久化
│   ├── App.jsx              # 路由配置
│   ├── main.jsx             # 入口（BrowserRouter）
│   └── index.css            # 全局基础样式
└── vite.config.js           # 开发代理指向 Flask :5000
```

**已配置**：
- Vite 开发服务器端口 3000，`/api` 代理到 Flask 后端 5000
- 4 个页面路由：`/` → `/difficulty` → `/game` → `/result`
- 页面间导航逻辑（难度通过 location.state 传递）
- 构建验证通过

**当前状态**：前端原型骨架就绪，页面布局和导航可用，功能逻辑待后端 API 接入后实现。
