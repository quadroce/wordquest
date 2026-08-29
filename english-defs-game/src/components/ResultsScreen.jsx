import { Home, RotateCcw, Star, Trophy, Zap } from 'lucide-react'
import { formatTime } from '../utils/game'

export default function ResultsScreen({ stats, onReplay, onHome }) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col justify-center px-4 py-10 sm:px-6">
      <div className="animate-pop rounded-[2rem] border border-white/10 bg-slate-900/85 p-6 text-center shadow-2xl shadow-blue-500/10 sm:p-10">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-pink-400/30 bg-pink-500/10 px-4 py-1 text-sm font-bold uppercase tracking-widest text-pink-300">
          <Star className="h-4 w-4" />
          Quest complete
        </p>
        <h1 className="font-display text-4xl text-white sm:text-5xl">What an adventure!</h1>
        <p className="mt-3 text-slate-300">
          You lasted {formatTime(stats.durationSeconds)}. Here is your treasure.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <StatCard icon={<Trophy className="h-5 w-5 text-yellow-300" />} label="Score" value={stats.score} />
          <StatCard icon={<Zap className="h-5 w-5 text-pink-300" />} label="Best streak" value={stats.bestStreak} />
          <StatCard
            icon={<Star className="h-5 w-5 text-blue-300" />}
            label="Words completed"
            value={stats.completed}
          />
          <StatCard
            icon={<RotateCcw className="h-5 w-5 text-emerald-300" />}
            label="Correct answers"
            value={`${stats.correctChoices}/${stats.completed || 0}`}
          />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onReplay}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-blue-500 px-5 py-3 font-display text-xl text-white shadow-lg shadow-pink-500/30"
          >
            <RotateCcw className="h-5 w-5" />
            Play again
          </button>
          <button
            type="button"
            onClick={onHome}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-display text-xl text-slate-100 hover:bg-white/10"
          >
            <Home className="h-5 w-5" />
            Home
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
      <div className="mb-2 inline-flex rounded-lg bg-white/5 p-2">{icon}</div>
      <p className="text-sm uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-display text-3xl text-white">{value}</p>
    </div>
  )
}
