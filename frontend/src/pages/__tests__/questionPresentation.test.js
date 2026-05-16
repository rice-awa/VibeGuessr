import test from 'node:test'
import assert from 'node:assert/strict'

import { getQuestionPresentation, isDisplayableImageSource } from '../questionPresentation.js'
import { getWaitingPrompt, IMAGE_WAITING_PROMPTS } from '../loadingPrompts.js'

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

test('shows a partial state when the word is ready but the image is not', () => {
  const presentation = getQuestionPresentation({
    image: null,
    category: '动物',
    imageMode: 'partial',
    fallbackHint: '先根据分类和提示作答',
    waitingPrompt: 'AI 正在把答案藏进雾里...',
  })

  assert.equal(presentation.mode, 'partial')
  assert.equal(presentation.src, null)
  assert.equal(presentation.badge, '动物')
  assert.equal(presentation.primaryHint, 'AI 正在把答案藏进雾里...')
  assert.equal(presentation.notice, '关键词已就绪，图片还在生成中')
})

test('rotates waiting prompts by index', () => {
  assert.equal(getWaitingPrompt(0), IMAGE_WAITING_PROMPTS[0])
  assert.equal(getWaitingPrompt(IMAGE_WAITING_PROMPTS.length), IMAGE_WAITING_PROMPTS[0])
})

test('treats non-image strings as text mode instead of image mode', () => {
  const presentation = getQuestionPresentation({
    image: 'I could not generate an image for this prompt.',
    category: '动物',
    imageMode: 'image',
    fallbackHint: '它常见于家中，行动很轻。',
  })

  assert.equal(presentation.mode, 'text')
  assert.equal(presentation.src, null)
  assert.equal(presentation.primaryHint, '它常见于家中，行动很轻。')
})

test('falls back to text mode after browser image loading fails', () => {
  const presentation = getQuestionPresentation({
    image: 'https://example.com/broken.png',
    category: '动物',
    imageMode: 'image',
    fallbackHint: '它常见于家中，行动很轻。',
    imageLoadFailed: true,
  })

  assert.equal(presentation.mode, 'text')
  assert.equal(presentation.src, null)
})

test('identifies displayable image source formats', () => {
  assert.equal(isDisplayableImageSource('data:image/png;base64,abc123'), true)
  assert.equal(isDisplayableImageSource('https://example.com/image.png'), true)
  assert.equal(isDisplayableImageSource('/assets/image.png'), true)
  assert.equal(isDisplayableImageSource('plain text'), false)
})
