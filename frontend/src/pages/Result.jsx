import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DIFFICULTY_CONFIG, saveScore } from '../store/gameStore'
import './Result.css'

function Result() {
  const navigate = useNavigate()
  const location = useLocation()
  const data = location.state?.result
  const difficulty = location.state?.difficulty || 'easy'
  const diffLabel = DIFFICULTY_CONFIG[difficulty]?.label || '简单'

  const [animScore, setAnimScore] = useState(0)
  const [animAccuracy, setAnimAccuracy] = useState(0)
  const savedRef = useRef(false)

  useEffect(() => {
    if (!data) return

    if (!savedRef.current) {
      saveScore({
        difficulty,
        totalScore: data.total_score,
        accuracy: data.accuracy,
        avgTime: data.avg_time,
        answeredQuestions: data.answered_questions,
        totalQuestions: data.total_questions,
      })
      savedRef.current = true
    }

    const duration = 800
    const steps = 30
    const interval = duration / steps
    let step = 0

    const timer = setInterval(() => {
      step++
      const t = step / steps
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimScore(Math.round(data.total_score * eased * 10) / 10)
      setAnimAccuracy(Math.round(data.accuracy * eased * 10) / 10)
      if (step >= steps) clearInterval(timer)
    }, interval)

    return () => clearInterval(timer)
  }, [data, difficulty])

  if (!data) {
    return (
      <div className="rs-page">
        <div className="rs-empty">
          <p>没有游戏数据</p>
          <button className="rs-btn rs-btn-primary" onClick={() => navigate('/difficulty')}>
            开始新游戏
          </button>
        </div>
      </div>
    )
  }

  const scorePercent = data.max_possible_score > 0
    ? Math.round((data.total_score / data.max_possible_score) * 100)
    : 0

  const getGrade = () => {
    if (scorePercent >= 90) return { letter: 'S', color: '#f59e0b' }
    if (scorePercent >= 75) return { letter: 'A', color: '#10b981' }
    if (scorePercent >= 60) return { letter: 'B', color: '#0d9488' }
    if (scorePercent >= 40) return { letter: 'C', color: '#64748b' }
    return { letter: 'D', color: '#94a3b8' }
  }

  const grade = getGrade()
  const best = data.best_question

  return (
    <div className="rs-page">
      <div className="rs-content">
        <div className="rs-header" style={{ animationDelay: '0ms' }}>
          <div className="rs-badge">{diffLabel}模式</div>
          <h1 className="rs-title">游戏结束</h1>
        </div>

        <div className="rs-grade-area" style={{ animationDelay: '100ms' }}>
          <div className="rs-grade" style={{ '--grade-color': grade.color }}>
            {grade.letter}
          </div>
          <div className="rs-main-score">
            <span className="rs-main-score-value">{animScore}</span>
            <span className="rs-main-score-max">/ {data.max_possible_score}</span>
          </div>
        </div>

        <div className="rs-stats" style={{ animationDelay: '200ms' }}>
          <div className="rs-stat">
            <span className="rs-stat-value">{animAccuracy}%</span>
            <span className="rs-stat-label">正确率</span>
          </div>
          <div className="rs-stat-divider" />
          <div className="rs-stat">
            <span className="rs-stat-value">{data.avg_time}s</span>
            <span className="rs-stat-label">平均用时</span>
          </div>
          <div className="rs-stat-divider" />
          <div className="rs-stat">
            <span className="rs-stat-value">{data.answered_questions}/{data.total_questions}</span>
            <span className="rs-stat-label">作答题数</span>
          </div>
        </div>

        {best && best.score > 0 && (
          <div className="rs-best" style={{ animationDelay: '300ms' }}>
            <div className="rs-best-header">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1l2.47 5.01L17 6.86l-4 3.9.94 5.49L9 13.77l-4.94 2.48.94-5.49-4-3.9 5.53-.85L9 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <span>最佳答题</span>
            </div>
            <div className="rs-best-body">
              <span className="rs-best-keyword">{best.keyword}</span>
              <span className="rs-best-score">+{best.score} 分</span>
              <span className="rs-best-time">{best.time_used}s</span>
            </div>
          </div>
        )}

        {data.results && data.results.length > 0 && (
          <div className="rs-history" style={{ animationDelay: '400ms' }}>
            <h3 className="rs-history-title">答题记录</h3>
            <div className="rs-history-list">
              {data.results.map((r, i) => (
                <div key={i} className={`rs-history-item rs-match-${r.match}`}>
                  <span className="rs-history-idx">{i + 1}</span>
                  <span className="rs-history-keyword">{r.keyword}</span>
                  <span className="rs-history-match">{getMatchLabel(r.match)}</span>
                  <span className="rs-history-score">+{r.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rs-actions" style={{ animationDelay: '500ms' }}>
          <button className="rs-btn rs-btn-primary" onClick={() => navigate('/difficulty')}>
            再来一局
          </button>
          <button className="rs-btn rs-btn-secondary" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    </div>
  )
}

function getMatchLabel(match) {
  const map = { exact: '完全正确', close: '非常接近', related: '有点沾边', wrong: '错误' }
  return map[match] || match
}

export default Result
