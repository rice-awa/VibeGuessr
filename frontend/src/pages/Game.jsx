import { useEffect, useState, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTimer } from '../hooks/useTimer'
import { useGame } from '../hooks/useGame'
import { DIFFICULTY_CONFIG } from '../store/gameStore'
import FeedbackModal from '../components/FeedbackModal'
import LoadingOverlay from '../components/LoadingOverlay'
import { getGameStatusView } from './gameStatus'
import { getQuestionPresentation } from './questionPresentation'
import './Game.css'

function GameStatusPanel({ view, onRetry, onBack }) {
  return (
    <div className="gm-status-page">
      <div className="gm-status-panel">
        {!view.canRetry && (
          <div className="gm-loading-mark" aria-hidden="true">
            <div className="gm-loading-ring" />
            <div className="gm-loading-core" />
          </div>
        )}
        <div className="gm-status-eyebrow">{view.eyebrow}</div>
        <h1 className="gm-status-title">{view.title}</h1>
        <p className="gm-status-text">{view.status}</p>

        <div className="gm-status-steps">
          {view.steps.map(step => (
            <div key={step.key} className={`gm-status-step gm-status-step-${step.state}`}>
              <span className="gm-status-step-dot" />
              <span>{step.label}</span>
            </div>
          ))}
        </div>

        {view.canRetry ? (
          <div className="gm-status-actions">
            <button className="gm-status-primary" type="button" onClick={onRetry}>
              重试生成
            </button>
            <button className="gm-status-secondary" type="button" onClick={onBack}>
              返回选择难度
            </button>
          </div>
        ) : (
          <div className="gm-status-hint">这个阶段可能需要几十秒，终端和浏览器控制台会同步输出请求状态。</div>
        )}
      </div>
    </div>
  )
}

function ImageSkeleton({ prompt }) {
  return (
    <div className="gm-image-skeleton" aria-live="polite">
      <div className="gm-image-skeleton-grid" aria-hidden="true">
        <span className="gm-skeleton-block gm-skeleton-hero" />
        <span className="gm-skeleton-block" />
        <span className="gm-skeleton-block" />
        <span className="gm-skeleton-block gm-skeleton-wide" />
      </div>
      {prompt && <p className="gm-image-skeleton-text">{prompt}</p>}
    </div>
  )
}

function Game() {
  const location = useLocation()
  const navigate = useNavigate()
  const difficulty = location.state?.difficulty || 'easy'
  const diffLabel = DIFFICULTY_CONFIG[difficulty]?.label || '简单'

  const {
    phase, questionIndex, totalQuestions,
    image, imageMode, imageStatus, fallbackHint, category, timeLimit, waitingPrompt,
    hintsRemaining, guessesRemaining, hints,
    totalScore, streak, feedback, revealData,
    loadingText, error, partialReady,
    startNewGame, submitAnswer, requestHint,
    handleTimeUp, goToNext, retryGuess, skipQuestion, fetchResult,
  } = useGame()

  const [answer, setAnswer] = useState('')
  const [loadedImageSrc, setLoadedImageSrc] = useState('')
  const [failedImageSrc, setFailedImageSrc] = useState('')
  const inputRef = useRef(null)
  const hasStarted = useRef(false)

  const onTimerExpire = useCallback(() => {
    handleTimeUp()
  }, [handleTimeUp])

  const timer = useTimer(timeLimit || 60, { onExpire: onTimerExpire })
  const {
    seconds,
    formatted,
    reset: resetTimer,
    start: startTimer,
    pause: pauseTimer,
  } = timer

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true
      startNewGame(difficulty)
    }
  }, [difficulty, startNewGame])

  useEffect(() => {
    if (phase === 'playing') {
      resetTimer(timeLimit)
      startTimer()
      queueMicrotask(() => {
        setAnswer('')
      })
      inputRef.current?.focus()
    } else if (phase === 'judging' || phase === 'feedback') {
      pauseTimer()
    } else if (phase === 'finished') {
      pauseTimer()
      fetchResult().then(data => {
        navigate('/result', { state: { result: data, difficulty } })
      })
    }
  }, [difficulty, fetchResult, navigate, pauseTimer, phase, resetTimer, startTimer, timeLimit])

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

  const handleStartRetry = () => {
    hasStarted.current = false
    setAnswer('')
    startNewGame(difficulty)
  }

  const timerPercent = timeLimit > 0 ? (seconds / timeLimit) * 100 : 100
  const timerUrgent = timerPercent <= 30
  const timerWarning = timerPercent <= 50 && !timerUrgent

  const circumference = 2 * Math.PI * 38
  const strokeOffset = circumference * (1 - timerPercent / 100)

  if ((phase === 'idle' && questionIndex === 0) || phase === 'starting' || (phase === 'loading' && questionIndex === 0)) {
    const statusView = getGameStatusView({
      phase,
      questionIndex,
      loadingText,
      error,
      difficultyLabel: diffLabel,
    })

    return (
      <GameStatusPanel
        view={statusView}
        onRetry={handleStartRetry}
        onBack={() => navigate('/difficulty')}
      />
    )
  }

  const isLastQuestion = questionIndex >= totalQuestions
  const presentation = getQuestionPresentation({
    image,
    imageMode,
    imageLoadFailed: Boolean(image && failedImageSrc === image),
    fallbackHint,
    waitingPrompt,
    category,
  })
  const imageLoaded = Boolean(presentation.src && loadedImageSrc === presentation.src)
  const showPrimer = questionIndex === 1 && (phase === 'playing' || phase === 'partial')

  return (
    <div className="gm-page">
      {phase === 'loading' && <LoadingOverlay text={loadingText || (partialReady ? '图片正在补齐...' : 'AI 正在出题...')} />}

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
          <span className="gm-timer-text">{formatted}</span>
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
        {showPrimer && (
          <section className="gm-primer" aria-label="游戏规则">
            <div className="gm-primer-item">
              <span className="gm-primer-index">1</span>
              <span>先看模糊图或文字线索，再输入最接近的答案。</span>
            </div>
            <div className="gm-primer-item">
              <span className="gm-primer-index">2</span>
              <span>倒计时内越快答对分越高，提示会扣减本题基础分。</span>
            </div>
            <div className="gm-primer-item">
              <span className="gm-primer-index">3</span>
              <span>接近答案也有分，连续命中会触发连胜加成。</span>
            </div>
          </section>
        )}

        <div className={`gm-image-wrap ${presentation.mode === 'text' ? 'gm-text-mode' : ''}`}>
          {presentation.mode === 'partial' ? (
            <ImageSkeleton prompt={presentation.primaryHint} />
          ) : presentation.src ? (
            <>
              <img
                className={`gm-image ${imageLoaded ? 'gm-image-loaded' : ''}`}
                src={presentation.src}
                alt="猜猜这是什么"
                onLoad={() => setLoadedImageSrc(presentation.src)}
                onError={() => setFailedImageSrc(presentation.src)}
              />
              {!imageLoaded && <ImageSkeleton prompt={waitingPrompt} />}
            </>
          ) : (
            <div className="gm-text-card">
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
                <rect x="9" y="8" width="34" height="36" rx="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M17 19h18M17 27h18M17 35h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="gm-text-card-label">文字线索</span>
              <p>{presentation.primaryHint}</p>
            </div>
          )}
          {presentation.badge && <div className="gm-category">{presentation.badge}</div>}
        </div>

        {presentation.notice && (
          <div className="gm-mode-notice">{imageStatus || presentation.notice}</div>
        )}

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
