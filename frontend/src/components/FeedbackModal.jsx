import './FeedbackModal.css'

const MATCH_CONFIG = {
  exact: { label: '完全正确', className: 'fb-exact', icon: '✓' },
  close: { label: '非常接近', className: 'fb-close', icon: '≈' },
  related: { label: '有点沾边', className: 'fb-related', icon: '~' },
  wrong: { label: '答错了', className: 'fb-wrong', icon: '✗' },
  timeout: { label: '时间到', className: 'fb-timeout', icon: '⏱' },
}

function FeedbackModal({ feedback, revealData, onNext, onRetry, isLastQuestion }) {
  if (!feedback) return null

  const matchCfg = MATCH_CONFIG[feedback.match] || MATCH_CONFIG.wrong
  const canRetry = feedback.match !== 'timeout'
    && feedback.scoreRatio < 0.6
    && feedback.guessesRemaining > 0
  const showReveal = feedback.scoreRatio >= 0.6 && revealData

  return (
    <div className="fb-overlay">
      <div className={`fb-modal ${matchCfg.className}`}>
        <div className="fb-icon-ring">
          <span className="fb-icon">{matchCfg.icon}</span>
        </div>

        <h2 className="fb-title">{matchCfg.label}</h2>

        {feedback.score > 0 && (
          <div className="fb-score">+{feedback.score} 分</div>
        )}

        <p className="fb-text">{feedback.text}</p>

        {feedback.keyword && (
          <div className="fb-answer">
            <span className="fb-answer-label">正确答案</span>
            <span className="fb-answer-word">{feedback.keyword}</span>
          </div>
        )}

        {showReveal && (
          <div className="fb-reveal">
            {revealData.clearImage && (
              <img
                className="fb-reveal-img"
                src={revealData.clearImage}
                alt={revealData.keyword}
              />
            )}
            {revealData.knowledge && (
              <p className="fb-knowledge">{revealData.knowledge}</p>
            )}
          </div>
        )}

        {feedback.scoreRatio >= 0.6 && !revealData && (
          <div className="fb-loading-reveal">
            <div className="fb-spinner" />
            <span>正在生成清晰图片...</span>
          </div>
        )}

        <div className="fb-actions">
          {canRetry && (
            <button className="fb-btn fb-btn-retry" onClick={onRetry}>
              再试一次（剩余 {feedback.guessesRemaining} 次）
            </button>
          )}
          <button className="fb-btn fb-btn-next" onClick={onNext}>
            {isLastQuestion ? '查看结果' : '下一题'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default FeedbackModal
