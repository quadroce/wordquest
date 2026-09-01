export function isSpeechSupported(
  speech = globalThis.speechSynthesis,
  Utterance = globalThis.SpeechSynthesisUtterance,
) {
  return Boolean(
    speech &&
      typeof speech.speak === 'function' &&
      typeof speech.cancel === 'function' &&
      typeof Utterance === 'function',
  )
}

export function stopSpeech(speech = globalThis.speechSynthesis) {
  if (speech && typeof speech.cancel === 'function') {
    speech.cancel()
  }
}

export function speakText(text, options = {}) {
  const speech = options.speech ?? globalThis.speechSynthesis
  const Utterance = options.Utterance ?? globalThis.SpeechSynthesisUtterance
  const onEnd = options.onend
  const onError = options.onerror
  const value = String(text || '').trim()

  if (!value || !speech || typeof speech.speak !== 'function' || typeof Utterance !== 'function') {
    return false
  }

  stopSpeech(speech)

  const utterance = new Utterance(value)
  utterance.lang = options.lang || 'en-GB'
  if (typeof onEnd === 'function') utterance.onend = onEnd
  if (typeof onError === 'function') utterance.onerror = onError

  speech.speak(utterance)
  return true
}

export function speakControlLabel(speaking, kind = 'word') {
  if (speaking) return 'Stop reading'
  if (kind === 'meaning') return 'Read meaning aloud'
  return 'Read word aloud'
}
