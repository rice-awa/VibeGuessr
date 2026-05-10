import test from 'node:test'
import assert from 'node:assert/strict'

import { getGameStatusView } from '../gameStatus.js'

test('shows the first-question generation step while the game is loading', () => {
  const view = getGameStatusView({
    phase: 'loading',
    questionIndex: 0,
    loadingText: 'AI 正在出题...',
    error: null,
    difficultyLabel: '简单',
  })

  assert.equal(view.title, '正在生成首题')
  assert.equal(view.status, 'AI 正在出题...')
  assert.equal(view.steps.at(-1).state, 'active')
  assert.equal(view.canRetry, false)
})

test('keeps /game useful when first-question generation fails', () => {
  const view = getGameStatusView({
    phase: 'idle',
    questionIndex: 0,
    loadingText: '',
    error: 'Failed to generate word after retries',
    difficultyLabel: '简单',
  })

  assert.equal(view.title, '首题生成失败')
  assert.match(view.status, /Failed to generate word/)
  assert.equal(view.canRetry, true)
})

test('shows a loading page before startNewGame updates phase', () => {
  const view = getGameStatusView({
    phase: 'idle',
    questionIndex: 0,
    loadingText: '',
    error: null,
    difficultyLabel: '简单',
  })

  assert.equal(view.title, '正在进入游戏')
  assert.equal(view.status, '正在连接后端并创建游戏会话...')
  assert.equal(view.steps[0].state, 'active')
  assert.equal(view.canRetry, false)
})
