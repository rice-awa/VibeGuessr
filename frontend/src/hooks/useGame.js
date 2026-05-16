import { useState, useCallback, useRef, useEffect } from 'react'
import {
  startGame,
  getNextQuestion,
  streamNextQuestion,
  shouldUseStreamFallback,
  submitGuess,
  getHint,
  revealAnswer,
  getResult,
} from '../services/api'
import { shouldApplyRevealResult } from './revealState'
import { getWaitingPrompt } from '../pages/loadingPrompts'

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
  const [partialReady, setPartialReady] = useState(false)
  const [waitingPromptIndex, setWaitingPromptIndex] = useState(0)

  const [totalScore, setTotalScore] = useState(0)
  const [streak, setStreak] = useState(0)

  const [feedback, setFeedback] = useState(null)
  const [revealData, setRevealData] = useState(null)
  const [loadingText, setLoadingText] = useState('')
  const [error, setError] = useState(null)

  const sessionRef = useRef(null)
  const streamCancelRef = useRef(null)
  const revealRequestIdRef = useRef(0)
  const phaseRef = useRef(phase)
  const questionIndexRef = useRef(questionIndex)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    questionIndexRef.current = questionIndex
  }, [questionIndex])

  useEffect(() => {
    if (phase !== 'partial') return undefined

    const timer = window.setInterval(() => {
      setWaitingPromptIndex(prev => prev + 1)
    }, 2400)

    return () => window.clearInterval(timer)
  }, [phase])

  const cleanupStream = useCallback(() => {
    if (streamCancelRef.current) {
      streamCancelRef.current()
      streamCancelRef.current = null
    }
  }, [])

  const loadNextQuestion = useCallback(async (sid) => {
    cleanupStream()
    revealRequestIdRef.current += 1
    setPhase('loading')
    setLoadingText('AI 正在出题...')
    setFeedback(null)
    setRevealData(null)
    setHints([])
    setError(null)
    setPartialReady(false)
    setImage(null)
    setImageMode('image')
    setImageStatus('')
    setFallbackHint('')
    setCategory('')

    try {
      const data = await getNextQuestion(sid, { preferPreloaded: true })
      if (data.game_over) {
        setPhase('finished')
        return
      }
      if (data.error) {
        setError(data.error)
        setPhase('idle')
        return
      }
      if (shouldUseStreamFallback({ preloaded: data.preloaded })) {
        setPhase('partial')
        setLoadingText('关键词已就绪，图片还在生成中...')
        setWaitingPromptIndex(0)
        const cancel = streamNextQuestion(sid, {
          onWordReady: (payload) => {
            setQuestionIndex(payload.question_index)
            setTotalQuestions(payload.total_questions || 10)
            setCategory(payload.category || '')
            setTimeLimit(payload.time_limit || 60)
            setHintsRemaining(payload.hints_remaining || 0)
            setImageMode('partial')
            setFallbackHint('')
            setPartialReady(true)
            setPhase('partial')
          },
          onImageReady: (payload) => {
            setQuestionIndex(payload.question_index)
            setTotalQuestions(payload.total_questions || 10)
            setImage(payload.image)
            setImageMode(payload.image_mode || (payload.image ? 'image' : 'text'))
            setImageStatus(payload.image_status || '')
            setFallbackHint(payload.fallback ? '图片暂时不可用，请根据题目分类和后续提示作答。' : '')
            setCategory(payload.category || '')
            setPhase('playing')
            setPartialReady(false)
          },
          onError: () => {
            setError('图片生成失败，请重试')
            setPhase('idle')
          },
        })
        streamCancelRef.current = cancel
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
  }, [cleanupStream])

  const startNewGame = useCallback(async (diff) => {
    cleanupStream()
    revealRequestIdRef.current += 1
    setPhase('starting')
    setLoadingText('正在创建游戏...')
    setDifficulty(diff)
    setTotalScore(0)
    setStreak(0)
    setError(null)
    setFeedback(null)
    setRevealData(null)
    setHints([])
    setPartialReady(false)
    setImage(null)
    setImageMode('image')
    setImageStatus('')
    setFallbackHint('')
    setCategory('')

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
      setPhase('loading')
      setLoadingText('AI 正在出题...')
      setWaitingPromptIndex(0)
      const cancel = streamNextQuestion(sid, {
        onWordReady: (payload) => {
          setQuestionIndex(payload.question_index)
          setTotalQuestions(payload.total_questions || 10)
          setCategory(payload.category || '')
          setTimeLimit(payload.time_limit || 60)
          setHintsRemaining(payload.hints_remaining || 0)
          setImageMode('partial')
          setFallbackHint('先根据分类判断，图片马上补齐。')
          setPartialReady(true)
          setPhase('partial')
        },
        onImageReady: (payload) => {
          setQuestionIndex(payload.question_index)
          setTotalQuestions(payload.total_questions || 10)
          setImage(payload.image)
          setImageMode(payload.image_mode || (payload.image ? 'image' : 'text'))
          setImageStatus(payload.image_status || '')
          setFallbackHint(payload.fallback ? '图片暂时不可用，请根据题目分类和后续提示作答。' : '')
          setCategory(payload.category || '')
          setPhase('playing')
          setPartialReady(false)
        },
        onError: () => {
          setError('图片生成失败，请重试')
          setPhase('idle')
        },
      })
      streamCancelRef.current = cancel
    } catch (err) {
      console.error('[VibeGuessr Game] startNewGame failed', err)
      setError(err.message || '创建游戏失败，请重试')
      setPhase('idle')
    }
  }, [cleanupStream])

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
        const revealRequestId = ++revealRequestIdRef.current
        const answeredQuestionIndex = questionIndex
        try {
          const reveal = await revealAnswer(sid)
          if (!shouldApplyRevealResult({
            requestId: revealRequestId,
            latestRequestId: revealRequestIdRef.current,
            answeredQuestionIndex,
            currentQuestionIndex: questionIndexRef.current,
            phase: phaseRef.current,
          })) {
            return
          }
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
  }, [questionIndex])

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
    revealRequestIdRef.current += 1
    const sid = sessionRef.current
    loadNextQuestion(sid)
  }, [loadNextQuestion])

  const retryGuess = useCallback(() => {
    revealRequestIdRef.current += 1
    setFeedback(null)
    setPhase('playing')
  }, [])

  const skipQuestion = useCallback(() => {
    revealRequestIdRef.current += 1
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
    waitingPrompt: getWaitingPrompt(waitingPromptIndex),
    hintsRemaining, guessesRemaining, hints,
    totalScore, streak, feedback, revealData,
    loadingText, error,
    partialReady,
    startNewGame, submitAnswer, requestHint,
    handleTimeUp, goToNext, retryGuess, skipQuestion, fetchResult,
  }
}
