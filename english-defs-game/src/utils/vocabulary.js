import definizioniSbagliate from '../assets/data/definizionisbagliate.json'
import parole from '../assets/data/parole.json'

export function loadVocabulary() {
  const paroleByWord = new Map(
    parole.map((item) => [String(item.word).toLowerCase(), item.definition]),
  )

  return definizioniSbagliate
    .map((entry, index) => {
      const fromParole = paroleByWord.get(String(entry.word).toLowerCase()) || ''
      const raw = String(entry.correct_definition || '').trim()
      const truncated = raw.endsWith('...') || raw.length < 8
      const correctDefinition = truncated && fromParole ? fromParole : raw || fromParole

      return {
        id: `${entry.word}-${index}`,
        word: entry.word,
        correct_definition: correctDefinition,
        distractors: (entry.incorrect_definitions || []).filter(Boolean).slice(0, 2),
      }
    })
    .filter((item) => item.word && item.correct_definition)
}
