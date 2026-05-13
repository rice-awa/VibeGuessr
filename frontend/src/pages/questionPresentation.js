export function getQuestionPresentation({ image, category, imageMode, fallbackHint }) {
  const hasImage = Boolean(image)
  const mode = hasImage && imageMode !== 'text' ? 'image' : 'text'

  if (mode === 'image') {
    return {
      mode,
      src: image,
      badge: category || '',
      primaryHint: '',
      notice: '',
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
