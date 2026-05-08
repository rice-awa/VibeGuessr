import { useNavigate } from 'react-router-dom'
import './DifficultySelect.css'

const difficulties = [
  {
    level: 'easy',
    label: '简单',
    desc: '常见动物、食物、日用品',
    hints: 3,
    time: 60,
    baseScore: 10,
  },
  {
    level: 'medium',
    label: '中等',
    desc: '职业、运动、地标建筑',
    hints: 2,
    time: 45,
    baseScore: 20,
  },
  {
    level: 'hard',
    label: '困难',
    desc: '抽象概念、成语、复合词汇',
    hints: 1,
    time: 30,
    baseScore: 40,
  },
]

function DifficultySelect() {
  const navigate = useNavigate()

  const handleSelect = (level) => {
    navigate('/game', { state: { difficulty: level } })
  }

  return (
    <div className="difficulty-page">
      <h1>选择难度</h1>
      <div className="difficulty-cards">
        {difficulties.map((d) => (
          <div
            key={d.level}
            className={`difficulty-card difficulty-${d.level}`}
            onClick={() => handleSelect(d.level)}
          >
            <h2>{d.label}</h2>
            <p className="difficulty-desc">{d.desc}</p>
            <ul className="difficulty-info">
              <li>提示次数：{d.hints}</li>
              <li>单题时限：{d.time}秒</li>
              <li>基础分值：{d.baseScore}分</li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DifficultySelect
