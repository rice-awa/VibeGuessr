export function isDisplayableImageSource(image) {
  if (typeof image !== 'string') return false
  const src = image.trim()
  return src.startsWith('data:image/') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')
}

export function getQuestionPresentation({
  image,
  category,
  imageMode,
  fallbackHint,
  waitingPrompt,
  imageLoadFailed = false,
}) {
  const hasImage = isDisplayableImageSource(image) && !imageLoadFailed
  const mode = hasImage && imageMode !== 'text' ? 'image' : imageMode === 'partial' ? 'partial' : 'text'

  if (mode === 'image') {
    return {
      mode,
      src: image.trim(),
      badge: category || '',
      primaryHint: '',
      notice: '',
    }
  }

  if (mode === 'partial') {
    return {
      mode,
      src: null,
      badge: category || '题目已就绪',
      primaryHint: waitingPrompt || '关键词已就绪，图片还在生成中。',
      notice: '关键词已就绪，图片还在生成中',
    }
  }

  return {
    mode,
    src: null,
    badge: '文字模式',
    primaryHint: fallbackHint || '图片暂时不可用，请根据题目分类和后续提示作答。',
    notice: '图片生成超时，先用文字提示继续作答',
  }
}
