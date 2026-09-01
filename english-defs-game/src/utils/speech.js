export const SPEECH_LANG = 'en-GB'

const FEMALE_VOICE_PATTERN =
  /female|woman|samantha|victoria|zira|susan|karen|fiona|moira|kate|serena|hazel|heather|linda|lisa|emma|amy|joanna|ivy|nicole|olivia|sara|jenny|lucy|alice|martha|aria/i

const MALE_VOICE_PATTERN =
  /male|daniel|david|james|ryan|mark|george|arthur|thomas|fred|oliver|aaron|guy|malcolm|alex|tom|lee|gordon|nathan|simon|microsoft david|google uk english male|google us english male|microsoft mark|microsoft guy|microsoft ryan|microsoft george|paul|stephen|john|michael|richard|william|harry|sam|brian|christopher|matthew|andrew|peter|robert|steven|tony|eric|bruce|charles|don|frank|henry|jack|jason|kevin|larry|patrick|ron|tim|walter|will|microsoft david desktop|microsoft mark desktop/i

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

export function getSpeechVoices(speech = globalThis.speechSynthesis) {
  if (!speech || typeof speech.getVoices !== 'function') return []
  return speech.getVoices()
}

export function isLikelyMaleVoice(voice) {
  const name = String(voice?.name || '')
  if (FEMALE_VOICE_PATTERN.test(name)) return false
  return MALE_VOICE_PATTERN.test(name)
}

export function pickEnglishMaleVoice(voices) {
  const english = (voices || []).filter((voice) => /^en/i.test(String(voice.lang || '')))
  if (english.length === 0) return null

  const matchesLang = (lang) =>
    english.filter((voice) => voice.lang === lang || String(voice.lang || '').startsWith(`${lang}-`))

  for (const lang of ['en-GB', 'en-US']) {
    const male = matchesLang(lang).find(isLikelyMaleVoice)
    if (male) return male
  }

  const anyMale = english.find(isLikelyMaleVoice)
  if (anyMale) return anyMale

  return matchesLang('en-GB')[0] || matchesLang('en-US')[0] || english[0] || null
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
  const voices = options.voices ?? getSpeechVoices(speech)
  const voice = options.voice ?? pickEnglishMaleVoice(voices)

  if (voice) {
    utterance.voice = voice
    utterance.lang = voice.lang || options.lang || SPEECH_LANG
  } else {
    utterance.lang = options.lang || SPEECH_LANG
  }

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
