const LETTERS = ['A', 'B', 'C']

export default function ChoiceBoard({
  word,
  roundNumber,
  options,
  eliminatedIds,
  result,
  selectedId,
  onChoose,
  onContinue,
}) {
  const locked = Boolean(result)

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
        Phase 2 · Multiple choice · Word {roundNumber}
      </p>
      <h2 className="font-display text-4xl text-white sm:text-5xl">{word}</h2>
      <p className="mt-2 max-w-2xl text-slate-300">
        Which definition matches this word? Tap the correct card.
      </p>

      <ul className="mt-8 grid gap-4">
        {options.map((option, index) => {
          const eliminated = eliminatedIds.includes(option.id)
          const selected = selectedId === option.id
          const showCorrect = locked && option.correct
          const showWrong = locked && selected && !option.correct

          return (
            <li key={option.id}>
              <button
                type="button"
                disabled={locked || eliminated}
                onClick={() => onChoose(option)}
                className={`flex w-full items-start gap-4 rounded-3xl border px-4 py-4 text-left transition sm:px-6 sm:py-5 ${cardClass({
                  eliminated,
                  showCorrect,
                  showWrong,
                  selected,
                })}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 font-display text-lg text-white">
                  {LETTERS[index] || index + 1}
                </span>
                <span className="pt-1 text-base text-slate-100 sm:text-lg">{option.text}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {result ? (
        <div className="animate-pop mt-6 rounded-3xl border border-white/10 bg-slate-950/80 p-5 text-center">
          <p className="font-display text-2xl text-white">
            {result === 'correct' ? 'Yes! That is the right meaning.' : 'Not this time.'}
          </p>
          <p className="mt-2 text-slate-300">
            {result === 'correct'
              ? 'Streak boosted. Ready for the next word?'
              : 'Look at the green card, then keep going.'}
          </p>
          <button
            type="button"
            onClick={onContinue}
            className="mt-4 rounded-2xl bg-gradient-to-r from-pink-500 to-blue-500 px-6 py-3 font-display text-xl text-white shadow-lg shadow-blue-500/30"
          >
            Next word
          </button>
        </div>
      ) : null}
    </section>
  )
}

function cardClass({ eliminated, showCorrect, showWrong, selected }) {
  if (eliminated) {
    return 'cursor-not-allowed border-white/5 bg-slate-900/40 text-slate-500 line-through opacity-50'
  }
  if (showCorrect) {
    return 'border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/20'
  }
  if (showWrong) {
    return 'border-rose-400 bg-rose-500/20'
  }
  if (selected) {
    return 'border-pink-400 bg-pink-500/15'
  }
  return 'border-white/10 bg-slate-900/80 hover:border-blue-400/60 hover:bg-slate-800'
}
