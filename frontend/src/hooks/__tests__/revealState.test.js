import test from 'node:test'
import assert from 'node:assert/strict'

import { shouldApplyRevealResult } from '../revealState.js'

test('applies reveal results only for the active feedback state of the same question', () => {
  assert.equal(shouldApplyRevealResult({
    requestId: 2,
    latestRequestId: 2,
    answeredQuestionIndex: 1,
    currentQuestionIndex: 1,
    phase: 'feedback',
  }), true)
})

test('ignores reveal results after the player has moved to the next question', () => {
  assert.equal(shouldApplyRevealResult({
    requestId: 2,
    latestRequestId: 3,
    answeredQuestionIndex: 1,
    currentQuestionIndex: 2,
    phase: 'loading',
  }), false)
})
