import { useLocation, useNavigate } from 'react-router-dom'
import './Game.css'

function Game() {
  const location = useLocation()
  const navigate = useNavigate()
  const difficulty = location.state?.difficulty || 'easy'

  return (
    <div className="game-page">
      <div className="game-header">
        <span className="game-progress">第 1/10 题</span>
        <span className="game-timer">--:--</span>
        <span className="game-hints">提示 x-</span>
      </div>

      <div className="game-image-area">
        <div className="game-image-placeholder">
          等待出题...
        </div>
      </div>

      <div className="game-score">当前得分：0</div>

      <div className="game-input-area">
        <input
          className="game-input"
          type="text"
          placeholder="输入你的答案..."
          disabled
        />
        <div className="game-actions">
          <button className="btn-hint" disabled>获取提示</button>
          <button className="btn-submit" disabled>提交</button>
        </div>
        <button className="btn-skip" disabled>跳过本题</button>
      </div>

      <p className="game-placeholder-msg">
        难度：{difficulty} — 等待后端 API 接入
      </p>
    </div>
  )
}

export default Game
