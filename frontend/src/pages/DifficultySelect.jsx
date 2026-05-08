import { useNavigate } from 'react-router-dom'
import { DIFFICULTY_CONFIG } from '../store/gameStore'
import './DifficultySelect.css'

const difficulties = [
  {
    level: 'easy',
    emoji: '',
    label: DIFFICULTY_CONFIG.easy.label,
    desc: '常见动物、食物、日用品',
    details: [
      { label: '时限', value: `${DIFFICULTY_CONFIG.easy.time}秒` },
      { label: '提示', value: `${DIFFICULTY_CONFIG.easy.hints}次` },
      { label: '基础分', value: `${DIFFICULTY_CONFIG.easy.baseScore}分` },
    ],
    accentColor: '#10b981',
    bgColor: '#ecfdf5',
  },
  {
    level: 'medium',
    emoji: '',
    label: DIFFICULTY_CONFIG.medium.label,
    desc: '职业、运动、地标建筑',
    details: [
      { label: '时限', value: `${DIFFICULTY_CONFIG.medium.time}秒` },
      { label: '提示', value: `${DIFFICULTY_CONFIG.medium.hints}次` },
      { label: '基础分', value: `${DIFFICULTY_CONFIG.medium.baseScore}分` },
    ],
    accentColor: '#f59e0b',
    bgColor: '#fffbeb',
  },
  {
    level: 'hard',
    emoji: '',
    label: DIFFICULTY_CONFIG.hard.label,
    desc: '抽象概念、成语、复合词汇',
    details: [
      { label: '时限', value: `${DIFFICULTY_CONFIG.hard.time}秒` },
      { label: '提示', value: `${DIFFICULTY_CONFIG.hard.hints}次` },
      { label: '基础分', value: `${DIFFICULTY_CONFIG.hard.baseScore}分` },
    ],
    accentColor: '#f43f5e',
    bgColor: '#fff1f2',
  },
]

function DifficultySelect() {
  const navigate = useNavigate()

  return (
    <div className="ds-page">
      <button className="ds-back" onClick={() => navigate('/')}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        返回
      </button>

      <div className="ds-header">
        <h1 className="ds-title">选择难度</h1>
        <p className="ds-subtitle">每局 10 题，选择适合你的挑战等级</p>
      </div>

      <div className="ds-cards">
        {difficulties.map((d, i) => (
          <button
            key={d.level}
            className="ds-card"
            style={{
              '--card-accent': d.accentColor,
              '--card-bg': d.bgColor,
              animationDelay: `${i * 80}ms`,
            }}
            onClick={() => navigate('/game', { state: { difficulty: d.level } })}
          >
            <div className="ds-card-dot" />
            <h2 className="ds-card-title">{d.label}</h2>
            <p className="ds-card-desc">{d.desc}</p>
            <div className="ds-card-details">
              {d.details.map(det => (
                <div key={det.label} className="ds-card-detail">
                  <span className="ds-detail-value">{det.value}</span>
                  <span className="ds-detail-label">{det.label}</span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default DifficultySelect
