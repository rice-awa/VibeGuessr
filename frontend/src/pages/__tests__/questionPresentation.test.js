import test from 'node:test'
import assert from 'node:assert/strict'

import { getQuestionPresentation } from '../questionPresentation.js'

test('uses image mode when a generated image is available', () => {
  const presentation = getQuestionPresentation({
    image: 'data:image/png;base64,abc123',
    category: '动物',
    imageMode: 'image',
    fallbackHint: '有四条腿',
  })

  assert.equal(presentation.mode, 'image')
  assert.equal(presentation.src, 'data:image/png;base64,abc123')
  assert.equal(presentation.badge, '动物')
  assert.equal(presentation.primaryHint, '')
})

test('falls back to text mode when image generation fails', () => {
  const presentation = getQuestionPresentation({
    image: null,
    category: '动物',
    imageMode: 'text',
    fallbackHint: '它常见于家中，行动很轻。',
  })

  assert.equal(presentation.mode, 'text')
  assert.equal(presentation.src, null)
  assert.equal(presentation.badge, '文字模式')
  assert.equal(presentation.primaryHint, '它常见于家中，行动很轻。')
  assert.equal(presentation.notice, '图片生成超时，先用文字提示继续作答')
})
