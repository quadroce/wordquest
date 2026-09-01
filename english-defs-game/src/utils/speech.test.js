import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  isSpeechSupported,
  pickEnglishMaleVoice,
  speakControlLabel,
  speakText,
  stopSpeech,
} from './speech.js'

test('isSpeechSupported is false when the API is missing', () => {
  assert.equal(isSpeechSupported(undefined, class {}), false)
  assert.equal(isSpeechSupported({ speak() {}, cancel() {} }, undefined), false)
  assert.equal(isSpeechSupported({ speak() {}, cancel() {} }, class {}), true)
})

test('speakText no-ops when synthesis is unsupported', () => {
  assert.equal(speakText('castle', { speech: undefined }), false)
  assert.equal(speakText('   ', { speech: { speak() {}, cancel() {} }, Utterance: class {} }), false)
})

test('speakText cancels previous speech then speaks', () => {
  const events = []
  const speech = {
    cancel() {
      events.push('cancel')
    },
    speak(utterance) {
      events.push(utterance.text)
    },
    getVoices() {
      return [{ name: 'Daniel', lang: 'en-GB' }]
    },
  }
  class FakeUtterance {
    constructor(text) {
      this.text = text
      this.lang = ''
      this.voice = null
    }
  }
  assert.equal(
    speakText('oak', { speech, Utterance: FakeUtterance, voices: [{ name: 'Daniel', lang: 'en-GB' }] }),
    true,
  )
  assert.deepEqual(events, ['cancel', 'oak'])
})

test('pickEnglishMaleVoice prefers British male voices', () => {
  const voices = [
    { name: 'Samantha', lang: 'en-US' },
    { name: 'Google UK English Male', lang: 'en-GB' },
    { name: 'Google US English', lang: 'en-US' },
  ]
  assert.equal(pickEnglishMaleVoice(voices)?.name, 'Google UK English Male')
})

test('pickEnglishMaleVoice falls back to en-US male when no British male exists', () => {
  const voices = [
    { name: 'Samantha', lang: 'en-US' },
    { name: 'Microsoft David Desktop', lang: 'en-US' },
  ]
  assert.equal(pickEnglishMaleVoice(voices)?.name, 'Microsoft David Desktop')
})

test('stopSpeech calls cancel when available', () => {
  let cancelled = 0
  stopSpeech({
    cancel() {
      cancelled += 1
    },
  })
  stopSpeech(undefined)
  assert.equal(cancelled, 1)
})

test('speakControlLabel names word and meaning playback', () => {
  assert.equal(speakControlLabel(false, 'word'), 'Read word aloud')
  assert.equal(speakControlLabel(true, 'word'), 'Stop reading')
  assert.equal(speakControlLabel(false, 'meaning'), 'Read meaning aloud')
  assert.equal(speakControlLabel(true, 'meaning'), 'Stop reading')
})
