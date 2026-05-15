export function shouldApplyRevealResult({
  requestId,
  latestRequestId,
  answeredQuestionIndex,
  currentQuestionIndex,
  phase,
}) {
  return requestId === latestRequestId
    && answeredQuestionIndex === currentQuestionIndex
    && phase === 'feedback'
}
