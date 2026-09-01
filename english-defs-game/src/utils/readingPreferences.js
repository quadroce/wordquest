export const READING_STORAGE_KEY = 'wordquest-reading-settings'

export const READING_DEFAULTS = {
  textSize: 'standard',
  theme: 'warm-light',
  font: 'standard',
  motion: 'standard',
}

export const READING_OPTIONS = {
  textSize: ['standard', 'large'],
  theme: ['warm-light', 'dark', 'high-contrast'],
  font: ['standard', 'clear'],
  motion: ['standard', 'reduced'],
}

export function pickAllowed(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback
}

export function validateReadingPreferences(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  return {
    textSize: pickAllowed(source.textSize, READING_OPTIONS.textSize, READING_DEFAULTS.textSize),
    theme: pickAllowed(source.theme, READING_OPTIONS.theme, READING_DEFAULTS.theme),
    font: pickAllowed(source.font, READING_OPTIONS.font, READING_DEFAULTS.font),
    motion: pickAllowed(source.motion, READING_OPTIONS.motion, READING_DEFAULTS.motion),
  }
}

export function loadReadingPreferences(storage) {
  const store = storage ?? globalThis.localStorage
  if (!store || typeof store.getItem !== 'function') {
    return { ...READING_DEFAULTS }
  }

  try {
    const raw = store.getItem(READING_STORAGE_KEY)
    if (!raw) return { ...READING_DEFAULTS }
    return validateReadingPreferences(JSON.parse(raw))
  } catch {
    return { ...READING_DEFAULTS }
  }
}

export function saveReadingPreferences(prefs, storage) {
  const store = storage ?? globalThis.localStorage
  if (!store || typeof store.setItem !== 'function') return validateReadingPreferences(prefs)
  const next = validateReadingPreferences(prefs)
  try {
    store.setItem(READING_STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore quota or private-mode errors */
  }
  return next
}

export function resetReadingPreferences(storage) {
  const store = storage ?? globalThis.localStorage
  if (store && typeof store.removeItem === 'function') {
    try {
      store.removeItem(READING_STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
  return { ...READING_DEFAULTS }
}

export function applyReadingPreferences(prefs, root) {
  const next = validateReadingPreferences(prefs)
  const el = root ?? (typeof document !== 'undefined' ? document.documentElement : null)
  if (!el || !el.dataset) return next
  el.dataset.readingSize = next.textSize
  el.dataset.readingTheme = next.theme
  el.dataset.readingFont = next.font
  el.dataset.readingMotion = next.motion
  return next
}

export function isMotionReduced(root, media) {
  const el = root ?? (typeof document !== 'undefined' ? document.documentElement : null)
  if (el?.dataset?.readingMotion === 'reduced') return true
  const query = media ?? globalThis.matchMedia
  if (typeof query === 'function') {
    try {
      return Boolean(query('(prefers-reduced-motion: reduce)').matches)
    } catch {
      return false
    }
  }
  return false
}
