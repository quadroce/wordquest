import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import {
  Check,
  Flame,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Timer,
  Trophy,
} from 'lucide-react'
import questions from './assets/data/definizionisbagliate.json'

const TIMER_CHOICES = [5, 10, 15, 20]
const DEFAULT_SECONDS = 900
const HINTS_PER_GAME = 3
const BASE_POINTS = 100
const HIGH_SCORE_KEY = 'wordquest-high-score'
const LETTERS = ['A', 'B', 'C']

function shuffle(list) {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function formatTime(totalSeconds) {
  const safe = Math.max(0, totalSeconds)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function readHighScore() {
  try {
    const stored = Number(window.localStorage.getItem(HIGH_SCORE_KEY))
    return Number.isFinite(stored) && stored > 0 ? stored : 0
  } catch {
    return 0
  }
}

function buildTokens(entry, wordIndex) {
  return entry.correct_definition.split(/\s+/).map((text, originalIndex) => ({
    id: `${wordIndex}-${originalIndex}-${text}`,
    text,
    originalIndex,
  }))
}

function scrambleTokens(tokens) {
  if (tokens.length <= 1) return [...tokens]
  let scrambled = shuffle(tokens)
  let attempts = 0
  while (
    scrambled.every((token, index) => token.originalIndex === index) &&
    attempts < 10
  ) {
    scrambled = shuffle(tokens)
    attempts += 1
  }
  return scrambled
}

function buildChoices(entry, wordIndex) {
  return shuffle([
    {
      id: `${wordIndex}-correct`,
      text: entry.correct_definition,
      correct: true,
    },
    ...(entry.incorrect_definitions || []).slice(0, 2).map((text, index) => ({
      id: `${wordIndex}-wrong-${index}`,
      text,
      correct: false,
    })),
  ])
}

function celebrate() {
  const colors = ['#ec4899', '#3b82f6', '#818cf8', '#f9a8d4', '#38bdf8']
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.65 }, colors })
  confetti({
    particleCount: 60,
    angle: 60,
    spread: 50,
    origin: { x: 0, y: 0.7 },
    colors,
  })
  confetti({
    particleCount: 60,
    angle: 120,
    spread: 50,
    origin: { x: 1, y: 0.7 },
    colors,
  })
}

export default function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedMinutes, setSelectedMinutes] = useState(15)
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_SECONDS)

  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [highScore, setHighScore] = useState(readHighScore)
  const [wordsSolved, setWordsSolved] = useState(0)
  const [hintsLeft, setHintsLeft] = useState(HINTS_PER_GAME)

  const [deck, setDeck] = useState([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentPhase, setCurrentPhase] = useState(1)
  const [isGameOver, setIsGameOver] = useState(false)

  const [availableWords, setAvailableWords] = useState([])
  const [yourDefinition, setYourDefinition] = useState([])
  const [hintedSlots, setHintedSlots] = useState([])
  const [checkStatus, setCheckStatus] = useState('idle')
  const [feedback, setFeedback] = useState('')

  const [choiceOptions, setChoiceOptions] = useState([])
  const [hiddenChoiceId, setHiddenChoiceId] = useState(null)
  const [selectedChoiceId, setSelectedChoiceId] = useState(null)
  const [choiceResult, setChoiceResult] = useState(null)

  const finishedRef = useRef(false)
  const advanceTimeout = useRef(null)

  const currentEntry = deck[currentWordIndex]
  const multiplier = streak >= 3 ? 2 : 1
  const timerDanger = timeRemaining > 0 && timeRemaining < 120

  const loadRound = useCallback((nextDeck, index) => {
    const entry = nextDeck[index]
    if (!entry) return
    const tokens = buildTokens(entry, index)
    setAvailableWords(scrambleTokens(tokens))
    setYourDefinition(Array(tokens.length).fill(null))
    setHintedSlots([])
    setCheckStatus('idle')
    setFeedback('Tap words to build the definition, then check your answer.')
    setChoiceOptions(buildChoices(entry, index))
    setHiddenChoiceId(null)
    setSelectedChoiceId(null)
    setChoiceResult(null)
    setCurrentPhase(1)
  }, [])

  const finishGame = useCallback((finalScore) => {
    if (finishedRef.current) return
    finishedRef.current = true
    setIsGameOver(true)
    setIsPaused(false)
    setHighScore((current) => {
      const next = Math.max(current, finalScore)
      try {
        window.localStorage.setItem(HIGH_SCORE_KEY, String(next))
      } catch {
        /* ignore storage errors */
      }
      return next
    })
  }, [])

  const startGame = useCallback(() => {
    const nextDeck = shuffle(questions.filter((item) => item.word && item.correct_definition))
    finishedRef.current = false
    window.clearTimeout(advanceTimeout.current)
    setDeck(nextDeck)
    setCurrentWordIndex(0)
    setCurrentPhase(1)
    setScore(0)
    setStreak(0)
    setMaxStreak(0)
    setWordsSolved(0)
    setHintsLeft(HINTS_PER_GAME)
    setTimeRemaining(selectedMinutes * 60)
    setIsGameOver(false)
    setIsPaused(false)
    setGameStarted(true)
    loadRound(nextDeck, 0)
  }, [loadRound, selectedMinutes])

  const restartToSetup = useCallback(() => {
    window.clearTimeout(advanceTimeout.current)
    finishedRef.current = false
    setGameStarted(false)
    setIsPaused(false)
    setIsGameOver(false)
    setScore(0)
    setStreak(0)
    setCurrentPhase(1)
    setCurrentWordIndex(0)
    setTimeRemaining(selectedMinutes * 60)
  }, [selectedMinutes])

  useEffect(() => {
    if (!gameStarted || isPaused || isGameOver) return undefined
    const id = window.setInterval(() => {
      setTimeRemaining((value) => (value <= 0 ? 0 : value - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [gameStarted, isGameOver, isPaused])

  useEffect(() => {
    if (gameStarted && !isGameOver && timeRemaining === 0) {
      finishGame(score)
    }
  }, [finishGame, gameStarted, isGameOver, score, timeRemaining])

  useEffect(() => () => window.clearTimeout(advanceTimeout.current), [])

  const goToNextWord = useCallback(
    (latestScore) => {
      const nextIndex = currentWordIndex + 1
      if (nextIndex >= deck.length) {
        finishGame(latestScore)
        return
      }
      setCurrentWordIndex(nextIndex)
      loadRound(deck, nextIndex)
    },
    [currentWordIndex, deck, finishGame, loadRound],
  )

  const moveTokenToDefinition = (tokenId) => {
    if (currentPhase !== 1 || checkStatus === 'correct' || isPaused) return
    const token = availableWords.find((item) => item.id === tokenId)
    const emptyIndex = yourDefinition.findIndex((slot) => slot == null)
    if (!token || emptyIndex === -1) return
    setAvailableWords((list) => list.filter((item) => item.id !== tokenId))
    setYourDefinition((slots) => slots.map((slot, index) => (index === emptyIndex ? token : slot)))
    setCheckStatus('idle')
    setFeedback('Keep going — fill every slot, then press Check Answer.')
  }

  const returnTokenToAvailable = (slotIndex) => {
    if (currentPhase !== 1 || checkStatus === 'correct' || isPaused) return
    if (hintedSlots.includes(slotIndex)) return
    const token = yourDefinition[slotIndex]
    if (!token) return
    setYourDefinition((slots) => slots.map((slot, index) => (index === slotIndex ? null : slot)))
    setAvailableWords((list) => [...list, token])
    setCheckStatus('idle')
  }

  const checkAnswer = () => {
    if (!currentEntry || currentPhase !== 1 || checkStatus === 'correct' || isPaused) return
    if (yourDefinition.some((slot) => slot == null)) {
      setCheckStatus('wrong')
      setFeedback('Place every word in Your Definition first.')
      return
    }
    const built = yourDefinition.map((slot) => slot.text).join(' ')
    const perfect = yourDefinition.every((slot, index) => slot.originalIndex === index)
    if (built === currentEntry.correct_definition && perfect) {
      setCheckStatus('correct')
      setFeedback('Great job! Get ready to pick the meaning.')
      window.setTimeout(() => setCurrentPhase(2), 900)
      return
    }
    setCheckStatus('wrong')
    setFeedback('Not quite. Try a different order!')
  }

  const handleHint = () => {
    if (hintsLeft <= 0 || isPaused || isGameOver || checkStatus === 'correct' || choiceResult) return

    if (currentPhase === 1) {
      const nextIndex = yourDefinition.findIndex(
        (slot, index) => !slot || slot.originalIndex !== index,
      )
      if (nextIndex === -1) return

      const correctToken =
        availableWords.find((token) => token.originalIndex === nextIndex) ||
        yourDefinition.find((slot) => slot?.originalIndex === nextIndex)
      if (!correctToken) return

      let nextAvailable = availableWords.filter((token) => token.id !== correctToken.id)
      const nextSlots = yourDefinition.map((slot) =>
        slot?.id === correctToken.id ? null : slot,
      )
      const occupant = nextSlots[nextIndex]
      if (occupant && occupant.id !== correctToken.id) {
        nextAvailable = [...nextAvailable, occupant]
      }
      nextSlots[nextIndex] = correctToken

      setAvailableWords(nextAvailable)
      setYourDefinition(nextSlots)
      setHintedSlots((slots) => (slots.includes(nextIndex) ? slots : [...slots, nextIndex]))
      setHintsLeft((value) => value - 1)
      setCheckStatus('idle')
      setFeedback('Hint used: the next word is in the right place.')
      return
    }

    const distractor = choiceOptions.find(
      (option) => !option.correct && option.id !== hiddenChoiceId,
    )
    if (!distractor) return
    setHiddenChoiceId(distractor.id)
    setHintsLeft((value) => value - 1)
  }

  const hintDisabled = useMemo(() => {
    if (!gameStarted || isPaused || isGameOver || hintsLeft <= 0) return true
    if (currentPhase === 1) {
      return (
        checkStatus === 'correct' ||
        yourDefinition.every((slot, index) => slot?.originalIndex === index)
      )
    }
    return Boolean(choiceResult || hiddenChoiceId)
  }, [
    checkStatus,
    choiceResult,
    currentPhase,
    gameStarted,
    hiddenChoiceId,
    hintsLeft,
    isGameOver,
    isPaused,
    yourDefinition,
  ])

  const selectChoice = (option) => {
    if (currentPhase !== 2 || choiceResult || isPaused || option.id === hiddenChoiceId) return
    setSelectedChoiceId(option.id)

    if (option.correct) {
      const nextStreak = streak + 1
      const awarded = BASE_POINTS * (nextStreak >= 3 ? 2 : 1)
      const nextScore = score + awarded
      setStreak(nextStreak)
      setMaxStreak((value) => Math.max(value, nextStreak))
      setScore(nextScore)
      setWordsSolved((value) => value + 1)
      setChoiceResult('correct')
      setFeedback(
        nextStreak >= 3
          ? `Correct! ${awarded} points with a ${nextStreak}-word streak (2x).`
          : `Correct! +${awarded} points.`,
      )
      celebrate()
      advanceTimeout.current = window.setTimeout(() => goToNextWord(nextScore), 1500)
      return
    }

    setStreak(0)
    setChoiceResult('wrong')
    setFeedback('That was not the right meaning. Look at the green card.')
    advanceTimeout.current = window.setTimeout(() => goToNextWord(score), 1500)
  }

  if (!gameStarted) {
    return (
      <Shell>
        <SetupScreen
          selectedMinutes={selectedMinutes}
          onMinutesChange={setSelectedMinutes}
          highScore={highScore}
          onStart={startGame}
        />
      </Shell>
    )
  }

  return (
    <Shell>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <p className="font-display text-2xl text-white">
            Word<span className="bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">Quest</span>
          </p>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <StatChip icon={<Trophy className="h-4 w-4 text-yellow-300" />} label={`${score} pts`} />
            <StatChip
              icon={<Flame className="h-4 w-4 text-pink-400" />}
              label={`${streak} streak${multiplier > 1 ? ' · 2x' : ''}`}
            />
            <div
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 font-display text-lg ${
                timerDanger
                  ? 'border-rose-400/50 bg-rose-500/20'
                  : 'border-white/10 bg-slate-900'
              }`}
            >
              <Timer className={`h-4 w-4 ${timerDanger ? 'text-rose-300' : 'text-sky-300'}`} />
              <span className={timerDanger ? 'timer-danger' : 'text-white'}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleHint}
              disabled={hintDisabled}
              title="Phase 1: place the next correct word. Phase 2: hide one wrong card."
              className="inline-flex items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-400/15 px-3 py-2 text-sm font-bold text-amber-200 transition hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Lightbulb className="h-4 w-4" />
              HINT · {hintsLeft}
            </button>
            <button
              type="button"
              onClick={() => setIsPaused((value) => !value)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-bold text-slate-100 hover:bg-white/10"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              type="button"
              onClick={restartToSetup}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-bold text-slate-100 hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
              Restart
            </button>
          </div>
        </div>
      </header>

      {isPaused && !isGameOver ? (
        <Overlay>
          <p className="text-sm font-bold uppercase tracking-widest text-pink-300">Paused</p>
          <h2 className="mt-2 font-display text-4xl text-white">Take a short break</h2>
          <p className="mt-3 text-slate-300">The timer is frozen until you resume the quest.</p>
          <button
            type="button"
            onClick={() => setIsPaused(false)}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-blue-600 px-6 py-3 font-display text-xl text-white"
          >
            <Play className="h-5 w-5 fill-white" />
            Resume
          </button>
        </Overlay>
      ) : null}

      {isGameOver ? (
        <Overlay>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-pink-400/30 bg-pink-500/10 px-4 py-1 text-sm font-bold uppercase tracking-widest text-pink-300">
            <Star className="h-4 w-4" />
            {timeRemaining === 0 ? "Time's up!" : 'Quest complete!'}
          </p>
          <h2 className="font-display text-4xl text-white sm:text-5xl">Game Over</h2>
          <p className="mt-3 text-slate-300">Here is your WordQuest summary.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <SummaryCard label="Final Score" value={score} />
            <SummaryCard label="High Score" value={Math.max(highScore, score)} />
            <SummaryCard label="Words Solved" value={wordsSolved} />
            <SummaryCard label="Max Streak" value={maxStreak} />
          </div>
          <button
            type="button"
            onClick={restartToSetup}
            className="glow-cta mt-8 w-full rounded-2xl bg-gradient-to-r from-pink-500 to-blue-600 px-6 py-4 font-display text-2xl text-white"
          >
            Play Again
          </button>
        </Overlay>
      ) : null}

      {currentEntry && !isGameOver ? (
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
          <p className="text-center text-sm font-bold uppercase tracking-widest text-blue-300">
            Phase {currentPhase} · {currentPhase === 1 ? 'Word Unscramble' : 'Multiple Choice'} · Word{' '}
            {currentWordIndex + 1} / {deck.length}
          </p>
          <h1 className="mt-3 text-center font-display text-5xl font-bold uppercase tracking-wide sm:text-7xl">
            <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-blue-500 bg-clip-text text-transparent">
              {currentEntry.word}
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-300">{feedback}</p>

          {currentPhase === 1 ? (
            <section className="mt-8 space-y-6">
              <Board
                title="Your Definition"
                hint="Build the sentence here"
                shake={checkStatus === 'wrong'}
                success={checkStatus === 'correct'}
              >
                <div className="flex min-h-24 flex-wrap gap-2">
                  {yourDefinition.map((slot, index) => (
                    <button
                      key={`slot-${index}`}
                      type="button"
                      onClick={() => returnTokenToAvailable(index)}
                      className={`min-h-12 min-w-20 rounded-2xl border px-3 py-2 text-sm font-bold transition ${
                        slot
                          ? hintedSlots.includes(index) || checkStatus === 'correct'
                            ? 'border-emerald-400 bg-emerald-500/20 text-white'
                            : 'border-pink-400/50 bg-gradient-to-r from-pink-500 to-blue-600 text-white'
                          : 'border-dashed border-white/20 bg-slate-950/70 text-slate-600'
                      }`}
                    >
                      {slot ? slot.text : '•'}
                    </button>
                  ))}
                </div>
              </Board>

              <Board title="Available Words" hint="Tap a word to move it up">
                <div className="flex min-h-20 flex-wrap gap-2">
                  {availableWords.length === 0 ? (
                    <p className="text-slate-400">All words are in Your Definition.</p>
                  ) : (
                    availableWords.map((token) => (
                      <button
                        key={token.id}
                        type="button"
                        onClick={() => moveTokenToDefinition(token.id)}
                        className="rounded-2xl bg-gradient-to-r from-pink-500 to-blue-600 px-4 py-2 font-bold text-white shadow-lg shadow-pink-500/20 transition hover:scale-105"
                      >
                        {token.text}
                      </button>
                    ))
                  )}
                </div>
              </Board>

              <button
                type="button"
                onClick={checkAnswer}
                disabled={checkStatus === 'correct'}
                className="glow-cta flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-blue-600 px-6 py-4 font-display text-2xl text-white disabled:opacity-50"
              >
                <Check className="h-7 w-7" />
                Check Answer
              </button>
            </section>
          ) : (
            <ul className={`mt-8 grid gap-4 ${choiceResult === 'wrong' ? 'animate-shake' : ''}`}>
              {choiceOptions.map((option, index) => {
                const hidden = option.id === hiddenChoiceId
                const selected = selectedChoiceId === option.id
                const showCorrect = choiceResult && option.correct
                const showWrong = choiceResult === 'wrong' && selected && !option.correct
                return (
                  <li key={option.id} className={hidden ? 'hidden' : ''}>
                    <button
                      type="button"
                      disabled={Boolean(choiceResult)}
                      onClick={() => selectChoice(option)}
                      className={`flex w-full items-start gap-4 rounded-3xl border px-5 py-5 text-left transition ${
                        showCorrect
                          ? 'border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/20'
                          : showWrong
                            ? 'border-rose-400 bg-rose-500/20'
                            : 'border-white/10 bg-slate-900/80 hover:border-blue-400/70 hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-blue-600 font-display text-lg text-white">
                        {LETTERS[index]}
                      </span>
                      <span className="pt-1 text-lg text-slate-100">{option.text}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </main>
      ) : null}
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <div className="relative min-h-svh overflow-hidden">
      <div className="pointer-events-none absolute -left-16 top-10 h-48 w-48 rounded-full bg-pink-500/20 blur-3xl animate-float" />
      <div className="pointer-events-none absolute right-0 top-24 h-56 w-56 rounded-full bg-blue-600/20 blur-3xl animate-float" />
      <div className="relative">{children}</div>
    </div>
  )
}

function SetupScreen({ selectedMinutes, onMinutesChange, highScore, onStart }) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-4xl flex-col justify-center px-4 py-10 sm:px-6">
      <div className="animate-pop rounded-[2rem] border border-white/10 bg-slate-900/85 p-6 shadow-2xl shadow-pink-500/10 sm:p-10">
        <div className="text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-400/30 bg-pink-500/10 px-4 py-1 text-sm font-bold uppercase tracking-widest text-pink-300">
            <Sparkles className="h-4 w-4" />
            English vocabulary quest
          </span>
          <h1 className="font-display text-5xl text-white sm:text-7xl">
            Word
            <span className="bg-gradient-to-r from-pink-400 to-blue-500 bg-clip-text text-transparent">
              Quest
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
            Unscramble each definition, then choose the right meaning. Build streaks, spend hints
            wisely, and beat the clock.
          </p>
          {highScore > 0 ? (
            <p className="mt-3 font-bold text-blue-300">Best score: {highScore}</p>
          ) : null}
        </div>

        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          <HelpCard step="1" title="Unscramble" text="Move word tiles into Your Definition, then press Check Answer." />
          <HelpCard step="2" title="Choose" text="Pick the correct definition from three big cards." />
          <HelpCard step="3" title="Hint" text="You get 3 hints: they place the next word or hide one wrong card." />
        </ol>

        <div className="mt-8 rounded-3xl border border-blue-400/20 bg-blue-950/50 p-5">
          <p className="mb-4 text-center font-display text-lg text-blue-100">Mission length</p>
          <div className="flex flex-wrap justify-center gap-3">
            {TIMER_CHOICES.map((minutes) => {
              const selected = minutes === selectedMinutes
              return (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => onMinutesChange(minutes)}
                  className={`min-w-20 rounded-2xl border px-4 py-3 font-display text-lg ${
                    selected
                      ? 'border-pink-400 bg-gradient-to-r from-pink-500 to-blue-600 text-white shadow-lg shadow-pink-500/30'
                      : 'border-white/10 bg-slate-800 text-slate-200 hover:border-blue-400/50'
                  }`}
                >
                  {minutes} min
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="glow-cta mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-pink-500 to-blue-600 px-6 py-4 font-display text-2xl text-white"
        >
          <Play className="h-7 w-7 fill-white" />
          Start the quest
        </button>
      </div>
    </div>
  )
}

function HelpCard({ step, title, text }) {
  return (
    <li className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <p className="mb-2 inline-flex rounded-xl bg-gradient-to-br from-pink-500 to-blue-600 px-2 py-1 text-xs font-bold text-white">
        {step}
      </p>
      <h2 className="font-display text-xl text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-300">{text}</p>
    </li>
  )
}

function Board({ title, hint, children, shake = false, success = false }) {
  return (
    <div
      className={`rounded-[1.75rem] border p-5 ${
        success
          ? 'border-emerald-400/50 bg-emerald-500/10'
          : shake
            ? 'animate-shake border-rose-400/50 bg-rose-500/10'
            : 'border-white/10 bg-slate-900/80'
      }`}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl text-white">{title}</h2>
        <p className="text-sm text-slate-400">{hint}</p>
      </div>
      {children}
    </div>
  )
}

function StatChip({ icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm font-bold text-white">
      {icon}
      <span>{label}</span>
    </div>
  )
}

function Overlay({ children }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="animate-pop w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-900 p-6 text-center shadow-2xl sm:p-8">
        {children}
      </div>
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-blue-950/60 p-4">
      <p className="text-sm uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-display text-3xl text-white">{value}</p>
    </div>
  )
}
