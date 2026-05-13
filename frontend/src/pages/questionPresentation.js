export function getQuestionPresentation({ image, category, imageMode, fallbackHint }) {
  const hasImage = Boolean(image)
  const mode = hasImage && imageMode !== 'text' ? 'image' : imageMode === 'partial' ? 'partial' : 'text'

  if (mode === 'image') {
    return {
      mode,
      src: image,
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
      primaryHint: fallbackHint || '关键词已就绪，图片还在生成中。',
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
