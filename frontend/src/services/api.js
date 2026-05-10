const API_BASE = '/api/game'

async function parseJsonResponse(res) {
  try {
    return await res.json()
  } catch {
    return { error: `Invalid JSON response (${res.status})` }
  }
}

async function requestJson(path, options = {}) {
  const label = `${options.method || 'GET'} ${path}`
  console.info(`[VibeGuessr API] ${label} started`, options.body ? JSON.parse(options.body) : undefined)

  const res = await fetch(`${API_BASE}${path}`, options)
  const data = await parseJsonResponse(res)

  if (!res.ok) {
    const message = data?.error || `${res.status} ${res.statusText}`
    console.error(`[VibeGuessr API] ${label} failed`, {
      status: res.status,
      statusText: res.statusText,
      data,
    })
    throw new Error(message)
  }

  console.info(`[VibeGuessr API] ${label} completed`, data)
  return data
}

export async function startGame(difficulty) {
  return requestJson('/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ difficulty }),
  })
}

export async function getNextQuestion(sessionId) {
  return requestJson('/next', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  })
}

export async function submitGuess(sessionId, answer) {
  return requestJson('/guess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, answer }),
  })
}

export async function getHint(sessionId) {
  return requestJson('/hint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  })
}

export async function revealAnswer(sessionId) {
  return requestJson('/reveal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  })
}

export async function getResult(sessionId) {
  return requestJson(`/result?session_id=${sessionId}`)
}
