import confetti from 'canvas-confetti'

export const DEFAULT_MINUTES = 15
export const TIMER_OPTIONS = [5, 10, 15, 20, 25]
export const UNSCRAMBLE_POINTS = 50
export const CHOICE_POINTS = 100

export function hintsForMinutes(minutes) {
  return Math.max(2, Math.round(minutes / 5))
}

export function shuffle(list) {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

export function buildTokens(entry) {
  return entry.correct_definition.split(/\s+/).map((text, index) => ({
    id: `${entry.id}-${index}`,
    text,
    correctIndex: index,
  }))
}

export function scrambleTokens(tokens) {
  if (tokens.length <= 1) return [...tokens]

  let scrambled = shuffle(tokens)
  let attempts = 0
  while (
    scrambled.every((token, index) => token.id === tokens[index].id) &&
    attempts < 12
  ) {
    scrambled = shuffle(tokens)
    attempts += 1
  }
  return scrambled
}

export function getMultiplier(streak) {
  if (streak >= 8) return 3
  if (streak >= 5) return 2
  if (streak >= 3) return 1.5
  return 1
}

export function awardPoints(base, streak) {
  return Math.round(base * getMultiplier(streak))
}

export function formatTime(totalSeconds) {
  const safe = Math.max(0, totalSeconds)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function buildChoiceOptions(entry, vocabulary) {
  let wrong = [...(entry.distractors || [])]

  if (wrong.length < 2) {
    const extraPool = vocabulary
      .filter((item) => item.id !== entry.id)
      .flatMap((item) => [item.correct_definition, ...(item.distractors || [])])
      .filter((text) => text && text !== entry.correct_definition)
    wrong = [...wrong, ...shuffle(extraPool)]
  }

  const uniqueWrong = [...new Set(wrong)].filter((text) => text !== entry.correct_definition)

  return shuffle([
    { id: `${entry.id}-correct`, text: entry.correct_definition, correct: true },
    ...uniqueWrong.slice(0, 2).map((text, index) => ({
      id: `${entry.id}-wrong-${index}`,
      text,
      correct: false,
    })),
  ])
}

export function applyUnscrambleHint(slots, bank, allTokens) {
  const nextIndex = slots.findIndex((slot, index) => !slot || slot.correctIndex !== index)
  if (nextIndex === -1) return { slots, bank, applied: false }

  const correctToken = allTokens.find((token) => token.correctIndex === nextIndex)
  if (!correctToken) return { slots, bank, applied: false }

  const nextSlots = [...slots]
  const nextBank = bank.filter((token) => token.id !== correctToken.id)
  const occupant = nextSlots[nextIndex]

  const occupyingSlot = nextSlots.findIndex((token) => token?.id === correctToken.id)
  if (occupyingSlot >= 0) nextSlots[occupyingSlot] = null

  if (occupant && occupant.id !== correctToken.id) {
    nextBank.push(occupant)
  }

  nextSlots[nextIndex] = correctToken
  return { slots: nextSlots, bank: nextBank, applied: true }
}

export function isUnscrambleCorrect(slots) {
  return slots.length > 0 && slots.every((slot, index) => slot?.correctIndex === index)
}

export function moveUnscrambleToken(round, tokenId, targetSlotIndex) {
  const fromSlot = round.slots.findIndex((slot) => slot?.id === tokenId)
  const fromBank = round.bank.find((token) => token.id === tokenId)
  const token = fromSlot >= 0 ? round.slots[fromSlot] : fromBank
  if (!token) return round

  const nextSlots = [...round.slots]
  const nextBank = round.bank.filter((item) => item.id !== tokenId)

  if (fromSlot >= 0) nextSlots[fromSlot] = null

  if (targetSlotIndex == null) {
    nextBank.push(token)
  } else {
    const occupant = nextSlots[targetSlotIndex]
    if (occupant && occupant.id !== token.id) {
      if (fromSlot >= 0) nextSlots[fromSlot] = occupant
      else nextBank.push(occupant)
    }
    nextSlots[targetSlotIndex] = token
  }

  return { ...round, slots: nextSlots, bank: nextBank }
}

export function celebrate(kind = 'success') {
  const colors = ['#ec4899', '#3b82f6', '#818cf8', '#f9a8d4', '#38bdf8']

  if (kind === 'streak') {
    confetti({
      particleCount: 140,
      spread: 90,
      origin: { y: 0.62 },
      colors,
    })
    confetti({
      particleCount: 70,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    })
    confetti({
      particleCount: 70,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    })
    return
  }

  confetti({
    particleCount: kind === 'choice' ? 110 : 70,
    spread: kind === 'choice' ? 80 : 60,
    origin: { y: 0.7 },
    colors,
  })
}
