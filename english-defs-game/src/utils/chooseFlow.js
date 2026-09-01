export const BREAK_EVERY = 5
export const CHOOSE_BASE_POINTS = 100

const EXAMPLE_KEYS = ['example', 'example_sentence', 'sentence', 'exampleSentence']

export function exampleSentenceFromEntry(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null
  for (const key of EXAMPLE_KEYS) {
    const value = entry[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

export function chooseControlModel({ selectedId, result, isPaused = false }) {
  const locked = Boolean(result) || isPaused
  return {
    radiosDisabled: locked,
    checkEnabled: Boolean(selectedId) && !locked,
    nextVisible: Boolean(result) && !isPaused,
    submitAction: Boolean(selectedId) && !locked ? 'check' : null,
    checkLabel: 'Check answer',
    nextLabel: 'Next word',
  }
}

export function liveChooseMessage({ result, correctDefinition, example }) {
  if (result === 'correct') {
    return example ? `Correct. ${example}` : 'Correct'
  }
  if (result === 'wrong') {
    return `Not quite. The correct meaning is: ${correctDefinition}`
  }
  return ''
}

export function applyChooseCheck(
  { result, gameMode, streak, score, wordsSolved },
  option,
  { basePoints = CHOOSE_BASE_POINTS } = {},
) {
  if (result) {
    return {
      ignored: true,
      result,
      streak,
      score,
      wordsSolved,
      awarded: 0,
    }
  }

  if (!option) {
    return {
      ignored: true,
      result: null,
      streak,
      score,
      wordsSolved,
      awarded: 0,
    }
  }

  if (option.correct) {
    const nextStreak = streak + 1
    const awarded = gameMode === 'choose' ? basePoints * (nextStreak >= 3 ? 2 : 1) : 0
    return {
      ignored: false,
      result: 'correct',
      streak: nextStreak,
      score: score + awarded,
      wordsSolved: wordsSolved + (gameMode === 'choose' ? 1 : 0),
      awarded,
    }
  }

  return {
    ignored: false,
    result: 'wrong',
    streak: 0,
    score,
    wordsSolved,
    awarded: 0,
  }
}

export function nextStepAfterChoose(gameMode) {
  return gameMode === 'total' ? 'continue-scramble' : 'next-word'
}

export function applyNextWord({ currentIndex, total, score, breakEvery = BREAK_EVERY }) {
  const completed = currentIndex + 1
  if (completed >= total) {
    return { type: 'finish', score, completed, currentIndex }
  }
  if (completed > 0 && completed % breakEvery === 0) {
    return { type: 'break', score, completed, currentIndex, nextIndex: completed }
  }
  return { type: 'load', score, completed, currentIndex, nextIndex: completed }
}

export function shouldOfferBreak(completedCount, totalCount, breakEvery = BREAK_EVERY) {
  return applyNextWord({
    currentIndex: completedCount - 1,
    total: totalCount,
    score: 0,
    breakEvery,
  }).type === 'break'
}

export function continueFromBreak(decision) {
  if (!decision || decision.type !== 'break') return decision
  return {
    type: 'load',
    score: decision.score,
    completed: decision.completed,
    currentIndex: decision.currentIndex,
    nextIndex: decision.nextIndex,
  }
}

export function takeBreakSnapshot(progress) {
  return {
    ...progress,
    paused: true,
    showBreak: true,
  }
}

export function resumeFromBreakPause(progress) {
  return {
    ...progress,
    paused: false,
    showBreak: true,
  }
}

export const GAME_PROGRESS_STORAGE_KEY = null

export function canResumeGameAfterReload() {
  return false
}
