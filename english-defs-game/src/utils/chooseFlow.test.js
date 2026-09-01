import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  applyChooseCheck,
  applyNextWord,
  canResumeGameAfterReload,
  chooseControlModel,
  continueFromBreak,
  exampleSentenceFromEntry,
  GAME_PROGRESS_STORAGE_KEY,
  liveChooseMessage,
  nextStepAfterChoose,
  resumeFromBreakPause,
  shouldOfferBreak,
  assembledScrambleText,
  liveScrambleMessage,
  scrambleControlModel,
  scrambleSlotStatus,
  takeBreakSnapshot,
} from './chooseFlow.js'

const castle = {
  word: 'castle',
  correct_definition: 'a big old building; a rich person lives here',
  incorrect_definitions: ['a small wooden house'],
}

test('correct answer returns Correct and keeps scoring rules', () => {
  const outcome = applyChooseCheck(
    { result: null, gameMode: 'choose', streak: 0, score: 0, wordsSolved: 0 },
    { id: '0-correct', text: castle.correct_definition, correct: true },
  )
  assert.equal(outcome.ignored, false)
  assert.equal(outcome.result, 'correct')
  assert.equal(outcome.streak, 1)
  assert.equal(outcome.score, 100)
  assert.equal(outcome.wordsSolved, 1)
  assert.equal(liveChooseMessage({ result: 'correct' }), 'Correct')
})

test('correct answer shows an example sentence only when the dataset has one', () => {
  assert.equal(exampleSentenceFromEntry(castle), null)
  assert.equal(
    exampleSentenceFromEntry({ ...castle, example: 'The king lived in a castle.' }),
    'The king lived in a castle.',
  )
  assert.equal(
    liveChooseMessage({
      result: 'correct',
      example: 'The king lived in a castle.',
    }),
    'Correct. The king lived in a castle.',
  )
})

test('incorrect answer is calm and reveals the correct meaning', () => {
  const outcome = applyChooseCheck(
    { result: null, gameMode: 'choose', streak: 4, score: 400, wordsSolved: 3 },
    { id: '0-wrong-0', text: 'a small wooden house', correct: false },
  )
  assert.equal(outcome.result, 'wrong')
  assert.equal(outcome.streak, 0)
  assert.equal(outcome.score, 400)
  assert.equal(outcome.wordsSolved, 3)
  assert.equal(
    liveChooseMessage({
      result: 'wrong',
      correctDefinition: castle.correct_definition,
    }),
    'Not quite. The correct meaning is: a big old building; a rich person lives here',
  )
})

test('double submission is ignored and does not change score', () => {
  const first = applyChooseCheck(
    { result: null, gameMode: 'choose', streak: 2, score: 200, wordsSolved: 2 },
    { id: '0-correct', correct: true },
  )
  const second = applyChooseCheck(
    {
      result: first.result,
      gameMode: 'choose',
      streak: first.streak,
      score: first.score,
      wordsSolved: first.wordsSolved,
    },
    { id: '0-wrong-0', correct: false },
  )
  assert.equal(first.result, 'correct')
  assert.equal(first.score, 400)
  assert.equal(second.ignored, true)
  assert.equal(second.result, 'correct')
  assert.equal(second.score, 400)
  assert.equal(second.streak, 3)
})

test('keyboard operation uses Check answer submit, then a separate Next word button', () => {
  const idle = chooseControlModel({ selectedId: null, result: null })
  assert.equal(idle.checkEnabled, false)
  assert.equal(idle.submitAction, null)
  assert.equal(idle.radiosDisabled, false)

  const ready = chooseControlModel({ selectedId: '0-correct', result: null })
  assert.equal(ready.checkEnabled, true)
  assert.equal(ready.submitAction, 'check')
  assert.equal(ready.checkLabel, 'Check answer')
  assert.equal(ready.nextVisible, false)

  const done = chooseControlModel({ selectedId: '0-correct', result: 'wrong' })
  assert.equal(done.checkEnabled, false)
  assert.equal(done.submitAction, null)
  assert.equal(done.radiosDisabled, true)
  assert.equal(done.nextVisible, true)
  assert.equal(done.nextLabel, 'Next word')
})

test('next-question transition loads the following word without finishing', () => {
  const step = applyNextWord({ currentIndex: 0, total: 33, score: 100 })
  assert.equal(step.type, 'load')
  assert.equal(step.nextIndex, 1)
  assert.equal(step.completed, 1)
  assert.equal(step.currentIndex, 0)
  assert.equal(nextStepAfterChoose('choose'), 'next-word')
  assert.equal(nextStepAfterChoose('total'), 'continue-scramble')
})

test('live-region message covers both results', () => {
  assert.equal(liveChooseMessage({ result: null }), '')
  assert.equal(liveChooseMessage({ result: 'correct' }), 'Correct')
  assert.match(
    liveChooseMessage({ result: 'wrong', correctDefinition: castle.correct_definition }),
    /Not quite\. The correct meaning is:/,
  )
})

test('break after five completed questions, and not before', () => {
  assert.equal(shouldOfferBreak(4, 33), false)
  assert.equal(shouldOfferBreak(5, 33), true)
  const fifth = applyNextWord({ currentIndex: 4, total: 33, score: 500 })
  assert.equal(fifth.type, 'break')
  assert.equal(fifth.completed, 5)
  assert.equal(fifth.nextIndex, 5)
  assert.equal(fifth.currentIndex, 4)
})

test('final incomplete group finishes instead of showing a break', () => {
  assert.equal(shouldOfferBreak(33, 33), false)
  const last = applyNextWord({ currentIndex: 32, total: 33, score: 900 })
  assert.equal(last.type, 'finish')
  assert.equal(last.completed, 33)
  const leftoverBreakPoint = applyNextWord({ currentIndex: 29, total: 33, score: 800 })
  assert.equal(leftoverBreakPoint.type, 'break')
  const afterBreak = continueFromBreak(leftoverBreakPoint)
  assert.equal(afterBreak.type, 'load')
  assert.equal(afterBreak.nextIndex, 30)
})

test('take a break pauses in memory and does not claim reload resume', () => {
  const paused = takeBreakSnapshot({
    currentIndex: 4,
    score: 500,
    selectedChoiceId: '4-wrong-0',
    result: 'wrong',
    showBreak: true,
  })
  assert.equal(paused.paused, true)
  assert.equal(paused.showBreak, true)
  assert.equal(paused.currentIndex, 4)
  assert.equal(paused.selectedChoiceId, '4-wrong-0')
  assert.equal(paused.result, 'wrong')

  const resumed = resumeFromBreakPause(paused)
  assert.equal(resumed.paused, false)
  assert.equal(resumed.showBreak, true)
  assert.equal(resumed.currentIndex, 4)

  assert.equal(canResumeGameAfterReload(), false)
  assert.equal(GAME_PROGRESS_STORAGE_KEY, null)
})

test('scramble slot status uses text, not colour names', () => {
  assert.deepEqual(scrambleSlotStatus(null, 0), { kind: 'empty', label: 'Empty' })
  assert.equal(scrambleSlotStatus({ originalIndex: 2, text: 'old' }, 2).label, 'Right place')
  assert.equal(scrambleSlotStatus({ originalIndex: 2, text: 'old' }, 1).label, 'Near')
  assert.equal(scrambleSlotStatus({ originalIndex: 2, text: 'old' }, 0).label, 'Not yet')
})

test('scramble live message is calm and check is learner-controlled', () => {
  assert.equal(liveScrambleMessage({ checkStatus: 'correct', allPlaced: true }), 'Correct')
  assert.equal(
    liveScrambleMessage({ checkStatus: 'wrong', allPlaced: false }),
    'Place every word in the sentence first.',
  )
  assert.equal(liveScrambleMessage({ checkStatus: 'wrong', allPlaced: true }), 'Not quite. Try another order.')
  assert.equal(assembledScrambleText([{ text: 'a' }, null, { text: 'castle' }]), 'a castle')
  assert.equal(scrambleControlModel({ checkStatus: 'idle' }).nextVisible, false)
  assert.equal(scrambleControlModel({ checkStatus: 'correct' }).tilesLocked, true)
})
