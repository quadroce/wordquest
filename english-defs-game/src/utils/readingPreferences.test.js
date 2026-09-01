import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  READING_DEFAULTS,
  READING_STORAGE_KEY,
  applyReadingPreferences,
  isMotionReduced,
  loadReadingPreferences,
  resetReadingPreferences,
  saveReadingPreferences,
  validateReadingPreferences,
} from './readingPreferences.js'

function memoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null
    },
    setItem(key, value) {
      data[key] = String(value)
    },
    removeItem(key) {
      delete data[key]
    },
  }
}

test('defaults are used when nothing is stored', () => {
  const prefs = loadReadingPreferences(memoryStorage())
  assert.deepEqual(prefs, READING_DEFAULTS)
})

test('validateReadingPreferences fills missing and invalid keys', () => {
  assert.deepEqual(
    validateReadingPreferences({
      textSize: 'huge',
      theme: 'neon',
      font: 12,
      motion: 'off',
    }),
    READING_DEFAULTS,
  )
  assert.equal(validateReadingPreferences(null).theme, 'warm-light')
  assert.equal(validateReadingPreferences(['nope']).font, 'standard')
  assert.equal(
    validateReadingPreferences({ textSize: 'large', theme: 'dark' }).motion,
    'standard',
  )
})

test('save and load persist valid preferences', () => {
  const storage = memoryStorage()
  const saved = saveReadingPreferences(
    { textSize: 'large', theme: 'high-contrast', font: 'clear', motion: 'reduced' },
    storage,
  )
  assert.equal(saved.textSize, 'large')
  assert.deepEqual(loadReadingPreferences(storage), saved)
  assert.match(storage.getItem(READING_STORAGE_KEY), /high-contrast/)
})

test('invalid stored JSON falls back to defaults', () => {
  const storage = memoryStorage({ [READING_STORAGE_KEY]: '{not json' })
  assert.deepEqual(loadReadingPreferences(storage), READING_DEFAULTS)
})

test('reset clears storage and returns defaults', () => {
  const storage = memoryStorage()
  saveReadingPreferences({ theme: 'dark' }, storage)
  const reset = resetReadingPreferences(storage)
  assert.deepEqual(reset, READING_DEFAULTS)
  assert.equal(storage.getItem(READING_STORAGE_KEY), null)
})

test('applyReadingPreferences writes validated data attributes', () => {
  const root = { dataset: {} }
  applyReadingPreferences({ theme: 'nope', motion: 'reduced' }, root)
  assert.equal(root.dataset.readingTheme, 'warm-light')
  assert.equal(root.dataset.readingMotion, 'reduced')
  assert.equal(root.dataset.readingSize, 'standard')
  assert.equal(root.dataset.readingFont, 'standard')
})

test('isMotionReduced reads the preference and media query', () => {
  assert.equal(isMotionReduced({ dataset: { readingMotion: 'reduced' } }), true)
  assert.equal(isMotionReduced({ dataset: { readingMotion: 'standard' } }, () => ({ matches: true })), true)
  assert.equal(isMotionReduced({ dataset: { readingMotion: 'standard' } }, () => ({ matches: false })), false)
})
