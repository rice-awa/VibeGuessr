import { useState, useCallback, useRef } from 'react'
import { startGame, getNextQuestion, submitGuess, getHint, revealAnswer, getResult } from '../services/api'

export function useGame() {
  const [phase, setPhase] = useState('idle')
  const [sessionId, setSessionId] = useState(null)
  const [config, setConfig] = useState(null)
  const [difficulty, setDifficulty] = useState(null)

  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(10)
  const [image, setImage] = useState(null)
  const [imageMode, setImageMode] = useState('image')
  const [imageStatus, setImageStatus] = useState('')
  const [fallbackHint, setFallbackHint] = useState('')
  const [category, setCategory] = useState('')
  const [timeLimit, setTimeLimit] = useState(60)
  const [hintsRemaining, setHintsRemaining] = useState(0)
  const [guessesRemaining, setGuessesRemaining] = useState(3)
  const [hints, setHints] = useState([])

  const [totalScore, setTotalScore] = useState(0)
  const [streak, setStreak] = useState(0)

  const [feedback, setFeedback] = useState(null)
  const [revealData, setRevealData] = useState(null)
  const [loadingText, setLoadingText] = useState('')
  const [error, setError] = useState(null)

  const sessionRef = useRef(null)

  const loadNextQuestion = useCallback(async (sid) => {
    setPhase('loading')
    setLoadingText('AI 正在出题...')
    setFeedback(null)
    setRevealData(null)
    setHints([])
    setError(null)

    try {
      const data = await getNextQuestion(sid)
      if (data.game_over) {
        setPhase('finished')
        return
      }
      if (data.error) {
        setError(data.error)
        setPhase('idle')
        return
      }
      setQuestionIndex(data.question_index)
      setTotalQuestions(data.total_questions)
      setImage(data.image)
      setImageMode(data.image_mode || (data.image ? 'image' : 'text'))
      setImageStatus(data.image_status || '')
      setFallbackHint(data.fallback_hint || '')
      setCategory(data.category || '')
      setTimeLimit(data.time_limit)
      setHintsRemaining(data.hints_remaining)
      setGuessesRemaining(3)
      if (data.session) {
        setTotalScore(data.session.total_score || 0)
        setStreak(data.session.streak || 0)
      }
      setPhase('playing')
    } catch (err) {
      console.error('[VibeGuessr Game] loadNextQuestion failed', err)
      setError(err.message || '获取题目失败，请重试')
      setPhase('idle')
    }
  }, [])

  const startNewGame = useCallback(async (diff) => {
    setPhase('starting')
    setLoadingText('正在创建游戏...')
    setDifficulty(diff)
    setTotalScore(0)
    setStreak(0)
    setError(null)
    setFeedback(null)
    setRevealData(null)
    setHints([])

    try {
      const data = await startGame(diff)
      if (data.error) {
        setError(data.error)
        setPhase('idle')
        return
      }
      const sid = data.session_id
      setSessionId(sid)
      sessionRef.current = sid
      setConfig(data.config)
      setTotalQuestions(data.config.total_questions)
      await loadNextQuestion(sid)
    } catch (err) {
      console.error('[VibeGuessr Game] startNewGame failed', err)
      setError(err.message || '创建游戏失败，请重试')
      setPhase('idle')
    }
  }, [loadNextQuestion])

  const submitAnswer = useCallback(async (answer) => {
    if (!answer.trim()) return
    const sid = sessionRef.current
    setPhase('judging')
    setLoadingText('AI 裁判分析中...')

    try {
      const data = await submitGuess(sid, answer)
      if (data.error) {
        setError(data.error)
        setPhase('playing')
        return
      }
      if (data.session) {
        setTotalScore(data.session.total_score || 0)
        setStreak(data.session.streak || 0)
      }
      setGuessesRemaining(data.guesses_remaining)

      const fb = {
        match: data.match,
        score: data.score,
        scoreRatio: data.score_ratio,
        text: data.feedback,
        keyword: data.keyword,
        guessesRemaining: data.guesses_remaining,
      }
      setFeedback(fb)
      setPhase('feedback')

      if (data.score_ratio >= 0.6) {
        try {
          const reveal = await revealAnswer(sid)
          setRevealData({
            clearImage: reveal.clear_image,
            knowledge: reveal.knowledge,
            keyword: reveal.keyword,
            gameOver: reveal.game_over,
          })
        } catch {
          // non-critical
        }
      }
    } catch (err) {
      console.error('[VibeGuessr Game] submitAnswer failed', err)
      setError(err.message || '提交失败，请重试')
      setPhase('playing')
    }
  }, [])

  const requestHint = useCallback(async () => {
    if (hintsRemaining <= 0) return
    const sid = sessionRef.current

    try {
      const data = await getHint(sid)
      if (data.error) return
      setHints(prev => [...prev, data.hint])
      setHintsRemaining(data.hints_remaining)
    } catch {
      // non-critical
    }
  }, [hintsRemaining])

  const handleTimeUp = useCallback(() => {
    setFeedback({
      match: 'timeout',
      score: 0,
      scoreRatio: 0,
      text: '时间到！这道题没有作答。',
      keyword: null,
      guessesRemaining: 0,
    })
    setPhase('feedback')
  }, [])

  const goToNext = useCallback(() => {
    const sid = sessionRef.current
    loadNextQuestion(sid)
  }, [loadNextQuestion])

  const retryGuess = useCallback(() => {
    setFeedback(null)
    setPhase('playing')
  }, [])

  const skipQuestion = useCallback(() => {
    const sid = sessionRef.current
    loadNextQuestion(sid)
  }, [loadNextQuestion])

  const fetchResult = useCallback(async () => {
    const sid = sessionRef.current
    try {
      return await getResult(sid)
    } catch {
      return null
    }
  }, [])

  return {
    phase, sessionId, config, difficulty,
    questionIndex, totalQuestions,
    image, imageMode, imageStatus, fallbackHint, category, timeLimit,
    hintsRemaining, guessesRemaining, hints,
    totalScore, streak, feedback, revealData,
    loadingText, error,
    startNewGame, submitAnswer, requestHint,
    handleTimeUp, goToNext, retryGuess, skipQuestion, fetchResult,
  }
}
