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

export async function getNextQuestion(sessionId, options = {}) {
  return requestJson('/next', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, prefer_preloaded: Boolean(options.preferPreloaded) }),
  })
}

export function buildNextQuestionStreamUrl(sessionId) {
  return `${API_BASE}/next/stream?session_id=${encodeURIComponent(sessionId)}`
}

export function shouldUseStreamFallback({ preloaded }) {
  return preloaded === false
}

export function streamNextQuestion(sessionId, handlers = {}) {
  const source = new EventSource(buildNextQuestionStreamUrl(sessionId))

  const close = () => source.close()

  source.addEventListener('word_ready', (event) => {
    handlers.onWordReady?.(JSON.parse(event.data))
  })
  source.addEventListener('image_ready', (event) => {
    handlers.onImageReady?.(JSON.parse(event.data))
  })
  source.addEventListener('done', (event) => {
    handlers.onDone?.(JSON.parse(event.data))
    close()
  })
  source.addEventListener('error', (event) => {
    handlers.onError?.(event)
    close()
  })

  return close
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
