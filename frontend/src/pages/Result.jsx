import { useNavigate } from 'react-router-dom'
import './Result.css'

function Result() {
  const navigate = useNavigate()

  return (
    <div className="result-page">
      <h1>游戏结束</h1>

      <div className="result-stats">
        <div className="stat-item">
          <span className="stat-value">0</span>
          <span className="stat-label">总得分</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">0%</span>
          <span className="stat-label">正确率</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">--</span>
          <span className="stat-label">平均用时</span>
        </div>
      </div>

      <p className="result-placeholder">等待后端 API 接入后展示完整数据</p>

      <div className="result-actions">
        <button className="btn-replay" onClick={() => navigate('/difficulty')}>
          再来一局
        </button>
        <button className="btn-home" onClick={() => navigate('/')}>
          返回首页
        </button>
      </div>
    </div>
  )
}

export default Result
