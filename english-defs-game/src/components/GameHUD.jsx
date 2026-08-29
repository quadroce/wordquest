import { Flame, Lightbulb, Pause, Play, Timer, Trophy } from 'lucide-react'
import { formatTime, getMultiplier } from '../utils/game'

export default function GameHUD({
  remaining,
  totalSeconds,
  score,
  streak,
  hintsLeft,
  paused,
  onTogglePause,
  onHint,
  hintDisabled,
}) {
  const multiplier = getMultiplier(streak)
  const danger = remaining <= 60
  const progress = totalSeconds === 0 ? 0 : (remaining / totalSeconds) * 100

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <p className="font-display text-xl text-white">
          Word<span className="text-pink-400">Quest</span>
        </p>

        <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-3">
          <HudChip
            icon={<Trophy className="h-4 w-4 text-yellow-300" />}
            label={`${score} pts`}
          />
          <HudChip
            icon={<Flame className="h-4 w-4 text-orange-400" />}
            label={`${streak} streak${multiplier > 1 ? ` · x${multiplier}` : ''}`}
          />
          <HudChip
            danger={danger}
            icon={<Timer className={`h-4 w-4 ${danger ? 'text-rose-300' : 'text-sky-300'}`} />}
            label={formatTime(remaining)}
          />
          <button
            type="button"
            onClick={onHint}
            disabled={hintDisabled}
            title="Reveal the next word in Phase 1, or remove one wrong card in Phase 2"
            className="inline-flex items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-400/15 px-3 py-2 text-sm font-bold text-amber-200 transition hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Lightbulb className="h-4 w-4" />
            HINT × {hintsLeft}
          </button>
          <button
            type="button"
            onClick={onTogglePause}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10"
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {paused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>
      <div className="h-1.5 bg-slate-800">
        <div
          className={`h-full transition-all duration-1000 ${
            danger ? 'bg-rose-500' : 'bg-gradient-to-r from-pink-500 to-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </header>
  )
}

function HudChip({ icon, label, danger = false }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${
        danger
          ? 'border-rose-400/40 bg-rose-500/15 text-rose-100'
          : 'border-white/10 bg-slate-900 text-slate-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </div>
  )
}
