const API_BASE = '/api/game'

export async function startGame(difficulty) {
  const res = await fetch(`${API_BASE}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ difficulty }),
  })
  return res.json()
}

export async function getNextQuestion(sessionId) {
  const res = await fetch(`${API_BASE}/next`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  })
  return res.json()
}

export async function submitGuess(sessionId, answer) {
  const res = await fetch(`${API_BASE}/guess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, answer }),
  })
  return res.json()
}

export async function getHint(sessionId) {
  const res = await fetch(`${API_BASE}/hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  })
  return res.json()
}

export async function revealAnswer(sessionId) {
  const res = await fetch(`${API_BASE}/reveal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  })
  return res.json()
}

export async function getResult(sessionId) {
  const res = await fetch(`${API_BASE}/result?session_id=${sessionId}`)
  return res.json()
}
