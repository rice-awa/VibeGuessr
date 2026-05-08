import { useNavigate } from 'react-router-dom'
import './Home.css'

function Home() {
  const navigate = useNavigate()

  return (
    <div className="home">
      <div className="home-content">
        <h1 className="home-title">AI默契猜词大挑战</h1>
        <p className="home-subtitle">看模糊图片，猜隐藏关键词，考验你的联想能力！</p>
        <button className="btn-start" onClick={() => navigate('/difficulty')}>
          开始游戏
        </button>
      </div>
    </div>
  )
}

export default Home
