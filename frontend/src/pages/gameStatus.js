const INITIAL_STEPS = [
  { key: 'session', label: '创建游戏会话' },
  { key: 'question', label: '生成关键词与提示' },
  { key: 'image', label: '生成模糊图片' },
]

export function getGameStatusView({ phase, questionIndex, loadingText, error, difficultyLabel }) {
  const isInitialQuestion = questionIndex === 0
  const hasError = Boolean(error)
  const activeStep = phase === 'idle' || phase === 'starting'
    ? 0
    : phase === 'partial'
      ? 2
      : isInitialQuestion
        ? 2
        : 1

  const steps = INITIAL_STEPS.map((step, index) => ({
    ...step,
    state: hasError && index === activeStep
      ? 'error'
      : index < activeStep
        ? 'done'
        : index === activeStep
          ? 'active'
          : 'pending',
  }))

  if (hasError) {
    return {
      eyebrow: `${difficultyLabel}难度`,
      title: isInitialQuestion ? '首题生成失败' : '题目加载失败',
      status: error,
      steps,
      canRetry: true,
    }
  }

  if (phase === 'idle') {
    return {
      eyebrow: `${difficultyLabel}难度`,
      title: '正在进入游戏',
      status: '正在连接后端并创建游戏会话...',
      steps,
      canRetry: false,
    }
  }

  return {
    eyebrow: `${difficultyLabel}难度`,
    title: phase === 'starting' ? '正在创建游戏' : phase === 'partial' ? '正在生成首题' : '正在生成首题',
    status: loadingText || 'AI 正在准备题目...',
    steps,
    canRetry: false,
  }
}
