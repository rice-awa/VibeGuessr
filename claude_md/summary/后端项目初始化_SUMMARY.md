# 后端项目初始化 - 完成总结

## 完成内容

### 阶段一：项目初始化（全部完成）

#### 1. Flask 后端搭建
- 创建虚拟环境 `backend/venv/`
- 安装依赖：Flask 3.1.3、Flask-CORS 6.0.2、Requests 2.33.1、python-dotenv 1.2.2
- 验证 Flask 应用正常导入，6 个 API 路由全部注册成功

#### 2. 后端代码结构
```
backend/
├── venv/               # Python 虚拟环境
├── app.py              # Flask 应用入口，6 个 API 路由
├── config.py           # 配置管理（API 密钥、难度参数表、游戏常量）
├── requirements.txt    # Python 依赖
├── .env.example        # 环境变量模板
├── prompts/
│   ├── word_gen.py     # 出词 Prompt 模板
│   └── judge.py        # 判分 + 知识卡片 Prompt 模板
├── services/
│   ├── llm_service.py  # Gemini Chat API 调用封装
│   ├── image_service.py # GPT-image-2 图片生成封装
│   └── game_service.py # 游戏会话管理 + 得分计算
└── models/             # 数据模型（预留）
```

#### 3. 前后端联调配置
- Vite 开发代理：`/api` → `http://localhost:5000`（vite.config.js）
- Flask 启用 CORS（flask-cors）

## API 路由一览

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/game/start` | 开始新游戏 |
| POST | `/api/game/next` | 获取下一题 |
| POST | `/api/game/guess` | 提交答案 |
| POST | `/api/game/hint` | 获取提示 |
| POST | `/api/game/reveal` | 揭晓答案 + 清晰图 + 知识卡片 |
| GET  | `/api/game/result` | 获取结算数据 |

## 启动方式

```bash
# 后端
cd backend
source venv/Scripts/activate  # Windows
cp .env.example .env           # 填入 API_BASE_URL 和 API_KEY
python app.py                  # http://localhost:5000

# 前端
cd frontend
npm run dev                    # http://localhost:3000
```

## 下一步

- 进入阶段二：实现后端核心 API 逻辑（代码已编写，需联调测试）
- 进入阶段三：前端页面交互开发
