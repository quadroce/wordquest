import { Clock, Lightbulb, Play, Sparkles, Swords } from 'lucide-react'
import { hintsForMinutes, TIMER_OPTIONS } from '../utils/game'

export default function HomeScreen({ minutes, onMinutesChange, onStart }) {
  const hints = hintsForMinutes(minutes)

  return (
    <div className="relative mx-auto flex min-h-svh w-full max-w-5xl flex-col justify-center px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute -left-10 top-16 h-40 w-40 rounded-full bg-pink-500/25 blur-3xl animate-float" />
      <div className="pointer-events-none absolute right-0 top-24 h-48 w-48 rounded-full bg-blue-500/25 blur-3xl animate-float" />

      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-pink-500/10 backdrop-blur sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-400/30 bg-pink-500/10 px-4 py-1 text-sm font-bold uppercase tracking-widest text-pink-300">
            <Sparkles className="h-4 w-4" />
            English vocabulary quest
          </span>
          <h1 className="font-display text-5xl font-semibold text-white sm:text-7xl">
            Word
            <span className="bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
              Quest
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-300">
            Rebuild each English definition, pick the right meaning, and stack
            champion combos before the timer runs out.
          </p>
        </div>

        <ol className="mb-8 grid gap-4 sm:grid-cols-3">
          <Step
            icon={<Swords className="h-5 w-5" />}
            title="1. Unscramble"
            text="Tap or drag the word tiles to rebuild the correct definition."
          />
          <Step
            icon={<Sparkles className="h-5 w-5" />}
            title="2. Choose"
            text="Pick the correct definition from three cards."
          />
          <Step
            icon={<Lightbulb className="h-5 w-5" />}
            title="3. Hint"
            text={`You have ${hints} hints: they reveal the next word or remove a wrong card.`}
          />
        </ol>

        <div className="rounded-3xl border border-blue-400/20 bg-slate-950/70 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-center gap-2 text-blue-200">
            <Clock className="h-5 w-5" />
            <p className="font-display text-lg">Mission length</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {TIMER_OPTIONS.map((option) => {
              const selected = option === minutes
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onMinutesChange(option)}
                  className={`min-w-20 rounded-2xl border px-4 py-3 font-display text-lg transition ${
                    selected
                      ? 'border-pink-400 bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg shadow-pink-500/30'
                      : 'border-white/10 bg-slate-800 text-slate-200 hover:border-blue-400/50 hover:bg-slate-700'
                  }`}
                >
                  {option} min
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="glow-cta mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-blue-500 px-6 py-4 font-display text-2xl text-white shadow-xl shadow-blue-500/30 transition hover:scale-[1.02]"
        >
          <Play className="h-7 w-7 fill-white" />
          Start the quest
        </button>
      </div>
    </div>
  )
}

function Step({ icon, title, text }) {
  return (
    <li className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-left">
      <div className="mb-3 inline-flex rounded-xl bg-gradient-to-br from-pink-500 to-blue-500 p-2 text-white">
        {icon}
      </div>
      <h2 className="font-display text-xl text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-300">{text}</p>
    </li>
  )
}
