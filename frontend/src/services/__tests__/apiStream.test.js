import test from 'node:test'
import assert from 'node:assert/strict'

import { buildNextQuestionStreamUrl, shouldUseStreamFallback } from '../api.js'

test('builds the next-question SSE URL with an encoded session id', () => {
  assert.equal(
    buildNextQuestionStreamUrl('session with spaces'),
    '/api/game/next/stream?session_id=session%20with%20spaces',
  )
})

test('uses SSE when REST next misses a preloaded question', () => {
  assert.equal(shouldUseStreamFallback({ preloaded: false }), true)
  assert.equal(shouldUseStreamFallback({ preloaded: true }), false)
})
