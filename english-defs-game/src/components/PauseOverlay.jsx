import { Play } from 'lucide-react'

export default function PauseOverlay({ onResume }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="animate-pop w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900 p-8 text-center shadow-2xl">
        <p className="text-sm font-bold uppercase tracking-widest text-pink-300">Paused</p>
        <h2 className="mt-2 font-display text-4xl text-white">Take a breath</h2>
        <p className="mt-3 text-slate-300">
          Your timer is frozen. Press resume when you are ready to keep playing.
        </p>
        <button
          type="button"
          onClick={onResume}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-blue-500 px-6 py-3 font-display text-xl text-white"
        >
          <Play className="h-5 w-5 fill-white" />
          Resume
        </button>
      </div>
    </div>
  )
}
