import { useEffect, useState, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTimer } from '../hooks/useTimer'
import { useGame } from '../hooks/useGame'
import { DIFFICULTY_CONFIG } from '../store/gameStore'
import FeedbackModal from '../components/FeedbackModal'
import LoadingOverlay from '../components/LoadingOverlay'
import './Game.css'

function Game() {
  const location = useLocation()
  const navigate = useNavigate()
  const difficulty = location.state?.difficulty || 'easy'
  const diffLabel = DIFFICULTY_CONFIG[difficulty]?.label || '简单'

  const {
    phase, questionIndex, totalQuestions,
    image, category, timeLimit,
    hintsRemaining, guessesRemaining, hints,
    totalScore, streak, feedback, revealData,
    loadingText, error,
    startNewGame, submitAnswer, requestHint,
    handleTimeUp, goToNext, retryGuess, skipQuestion, fetchResult,
  } = useGame()

  const [answer, setAnswer] = useState('')
  const [imageLoaded, setImageLoaded] = useState(false)
  const inputRef = useRef(null)
  const hasStarted = useRef(false)

  const onTimerExpire = useCallback(() => {
    handleTimeUp()
  }, [handleTimeUp])

  const timer = useTimer(timeLimit || 60, { onExpire: onTimerExpire })

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true
      startNewGame(difficulty)
    }
  }, [difficulty, startNewGame])

  useEffect(() => {
    if (phase === 'playing') {
      timer.reset(timeLimit)
      timer.start()
      setAnswer('')
      setImageLoaded(false)
      inputRef.current?.focus()
    } else if (phase === 'judging' || phase === 'feedback') {
      timer.pause()
    } else if (phase === 'finished') {
      timer.pause()
      fetchResult().then(data => {
        navigate('/result', { state: { result: data, difficulty } })
      })
    }
  }, [phase, timeLimit])

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!answer.trim() || phase !== 'playing') return
    submitAnswer(answer)
  }

  const handleNext = () => {
    const isLast = questionIndex >= totalQuestions
    if (isLast || (revealData && revealData.gameOver)) {
      fetchResult().then(data => {
        navigate('/result', { state: { result: data, difficulty } })
      })
    } else {
      goToNext()
    }
  }

  const handleSkip = () => {
    skipQuestion()
  }

  const handleRetry = () => {
    setAnswer('')
    retryGuess()
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const timerPercent = timeLimit > 0 ? (timer.seconds / timeLimit) * 100 : 100
  const timerUrgent = timerPercent <= 30
  const timerWarning = timerPercent <= 50 && !timerUrgent

  const circumference = 2 * Math.PI * 38
  const strokeOffset = circumference * (1 - timerPercent / 100)

  if (phase === 'idle' && error) {
    return (
      <div className="game-error-page">
        <p className="game-error-text">{error}</p>
        <button className="game-error-btn" onClick={() => navigate('/difficulty')}>
          返回选择难度
        </button>
      </div>
    )
  }

  if (phase === 'starting' || (phase === 'loading' && questionIndex === 0)) {
    return <LoadingOverlay text={loadingText} />
  }

  const isLastQuestion = questionIndex >= totalQuestions

  return (
    <div className="gm-page">
      {phase === 'loading' && <LoadingOverlay text={loadingText} />}

      <div className="gm-topbar">
        <div className="gm-progress">
          <span className="gm-progress-current">{questionIndex}</span>
          <span className="gm-progress-sep">/</span>
          <span className="gm-progress-total">{totalQuestions}</span>
        </div>

        <div className={`gm-timer ${timerUrgent ? 'gm-timer-urgent' : timerWarning ? 'gm-timer-warning' : ''}`}>
          <svg className="gm-timer-ring" viewBox="0 0 84 84">
            <circle cx="42" cy="42" r="38" fill="none" stroke="#e2e8f0" strokeWidth="4" />
            <circle
              cx="42" cy="42" r="38"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              transform="rotate(-90 42 42)"
              className="gm-timer-progress"
            />
          </svg>
          <span className="gm-timer-text">{timer.formatted}</span>
        </div>

        <div className="gm-score-pill">
          <span className="gm-score-value">{Math.round(totalScore)}</span>
          <span className="gm-score-label">分</span>
        </div>
      </div>

      {streak >= 3 && phase === 'playing' && (
        <div className="gm-streak">
          连续答对 {streak} 题
        </div>
      )}

      <div className="gm-main">
        <div className="gm-image-wrap">
          {image ? (
            <>
              <img
                className={`gm-image ${imageLoaded ? 'gm-image-loaded' : ''}`}
                src={image}
                alt="猜猜这是什么"
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="gm-image-skeleton">
                  <div className="gm-image-skeleton-pulse" />
                </div>
              )}
            </>
          ) : (
            <div className="gm-image-empty">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2"/>
                <circle cx="18" cy="22" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M6 32l10-8 6 5 8-10 12 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>等待图片加载</span>
            </div>
          )}
          {category && <div className="gm-category">{category}</div>}
        </div>

        {hints.length > 0 && (
          <div className="gm-hints">
            {hints.map((h, i) => (
              <div key={i} className="gm-hint" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="gm-hint-label">提示 {i + 1}</span>
                <span className="gm-hint-text">{h}</span>
              </div>
            ))}
          </div>
        )}

        <form className="gm-input-area" onSubmit={handleSubmit}>
          <div className="gm-input-row">
            <input
              ref={inputRef}
              className="gm-input"
              type="text"
              placeholder="输入你的答案..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={phase !== 'playing'}
              autoComplete="off"
            />
            <button
              className="gm-btn-submit"
              type="submit"
              disabled={phase !== 'playing' || !answer.trim()}
            >
              提交
            </button>
          </div>

          <div className="gm-actions">
            <button
              className="gm-btn-hint"
              type="button"
              onClick={requestHint}
              disabled={phase !== 'playing' || hintsRemaining <= 0}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5a5.25 5.25 0 013.15 9.45c-.45.35-.9.75-1.15 1.3v.5H7v-.5c-.25-.55-.7-.95-1.15-1.3A5.25 5.25 0 019 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 15.25h4M8 16.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              提示（剩余 {hintsRemaining}）
            </button>

            <button
              className="gm-btn-skip"
              type="button"
              onClick={handleSkip}
              disabled={phase !== 'playing'}
            >
              跳过本题
            </button>
          </div>

          {guessesRemaining < 3 && phase === 'playing' && (
            <div className="gm-guesses-info">
              还有 {guessesRemaining} 次作答机会
            </div>
          )}
        </form>
      </div>

      {phase === 'feedback' && feedback && (
        <FeedbackModal
          feedback={feedback}
          revealData={revealData}
          onNext={handleNext}
          onRetry={handleRetry}
          isLastQuestion={isLastQuestion}
        />
      )}

      {error && phase === 'playing' && (
        <div className="gm-toast">{error}</div>
      )}
    </div>
  )
}

export default Game
