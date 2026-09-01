import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isSpeechSupported, speakText, stopSpeech } from './speech.js'

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
  }
  class FakeUtterance {
    constructor(text) {
      this.text = text
    }
  }
  assert.equal(speakText('oak', { speech, Utterance: FakeUtterance }), true)
  assert.deepEqual(events, ['cancel', 'oak'])
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
