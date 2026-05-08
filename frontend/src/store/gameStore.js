const SCORE_KEY = 'vibeguessr_scores'

export function loadScores() {
  try {
    const raw = localStorage.getItem(SCORE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveScore(record) {
  const scores = loadScores()
  scores.push({ ...record, timestamp: Date.now() })
  localStorage.setItem(SCORE_KEY, JSON.stringify(scores))
}

export const DIFFICULTY_CONFIG = {
  easy: { label: '简单', hints: 3, time: 60, baseScore: 10 },
  medium: { label: '中等', hints: 2, time: 45, baseScore: 20 },
  hard: { label: '困难', hints: 1, time: 30, baseScore: 40 },
}
