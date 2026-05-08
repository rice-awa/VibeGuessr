import { useNavigate } from 'react-router-dom'
import './Home.css'

function Home() {
  const navigate = useNavigate()

  return (
    <div className="home">
      <div className="home-bg">
        <div className="home-shape home-shape-1" />
        <div className="home-shape home-shape-2" />
        <div className="home-shape home-shape-3" />
      </div>

      <div className="home-content">
        <div className="home-badge">AI 驱动</div>
        <h1 className="home-title">默契猜词大挑战</h1>
        <p className="home-desc">
          AI 生成模糊图片，你来猜隐藏的关键词。<br />
          考验你的联想力和观察力！
        </p>

        <button className="home-cta" onClick={() => navigate('/difficulty')}>
          开始游戏
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M6 10h8m0 0l-3-3m3 3l-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="home-features">
          <div className="home-feature">
            <div className="home-feature-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <span>AI 生图</span>
          </div>
          <div className="home-feature">
            <div className="home-feature-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span>智能判分</span>
          </div>
          <div className="home-feature">
            <div className="home-feature-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 16l3-8 3 5 3-10 3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span>三级难度</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
