import { RotateCcw } from 'lucide-react'

export default function UnscrambleBoard({
  word,
  roundNumber,
  slots,
  bank,
  wrong,
  locked,
  onMoveToken,
  onReset,
}) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-pink-300">
            Phase 1 · Unscramble · Word {roundNumber}
          </p>
          <h2 className="font-display text-4xl text-white sm:text-5xl">{word}</h2>
          <p className="mt-2 max-w-2xl text-slate-300">
            Rebuild the correct definition. Tap a tile to place it, or drag it
            into a slot.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={locked}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10 disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" />
          Reset tiles
        </button>
      </div>

      <div
        className={`rounded-[1.75rem] border p-4 sm:p-6 ${
          locked
            ? 'border-emerald-400/40 bg-emerald-500/10'
            : wrong
              ? 'animate-shake border-rose-400/40 bg-rose-500/10'
              : 'border-white/10 bg-slate-900/70'
        }`}
      >
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">
          Definition
        </p>
        <ul className="flex flex-wrap gap-2">
          {slots.map((slot, index) => (
            <li key={`slot-${index}`}>
              <Slot
                token={slot}
                locked={locked}
                wrong={Boolean(wrong && slot && slot.correctIndex !== index)}
                onClick={() => {
                  if (!locked && slot) onMoveToken(slot.id, null)
                }}
                onDropToken={(tokenId) => onMoveToken(tokenId, index)}
              />
            </li>
          ))}
        </ul>
      </div>

      <div
        className="mt-6 rounded-[1.75rem] border border-blue-400/20 bg-slate-950/70 p-4 sm:p-6"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          const tokenId = event.dataTransfer.getData('text/plain')
          if (tokenId) onMoveToken(tokenId, null)
        }}
      >
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-200">
          Word bank
        </p>
        {bank.length === 0 ? (
          <p className="text-slate-400">
            {locked ? 'Perfect! Get ready for Phase 2…' : 'All tiles are in the definition.'}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {bank.map((token) => (
              <li key={token.id}>
                <TokenChip
                  token={token}
                  disabled={locked}
                  onClick={() => onMoveToken(token.id, firstEmptyIndex(slots))}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function firstEmptyIndex(slots) {
  const index = slots.findIndex((slot) => slot == null)
  return index === -1 ? null : index
}

function Slot({ token, locked, wrong, onClick, onDropToken }) {
  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        const tokenId = event.dataTransfer.getData('text/plain')
        if (tokenId) onDropToken(tokenId)
      }}
      className={`flex min-h-12 min-w-16 items-center justify-center rounded-2xl border px-1 py-1 ${
        token
          ? wrong
            ? 'border-rose-400 bg-rose-500/20'
            : locked
              ? 'border-emerald-400 bg-emerald-500/20'
              : 'border-pink-400/40 bg-pink-500/10'
          : 'border-dashed border-white/20 bg-slate-950/80'
      }`}
    >
      {token ? (
        <TokenChip token={token} disabled={locked} onClick={onClick} />
      ) : (
        <span className="px-3 text-slate-600">•</span>
      )}
    </div>
  )
}

function TokenChip({ token, disabled, onClick }) {
  return (
    <button
      type="button"
      draggable={!disabled}
      disabled={disabled}
      onClick={onClick}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', token.id)
        event.dataTransfer.effectAllowed = 'move'
      }}
      className="select-none rounded-xl bg-gradient-to-r from-pink-500 to-blue-500 px-3 py-2 font-bold text-white shadow-md shadow-pink-500/20 transition hover:scale-105 disabled:cursor-default disabled:hover:scale-100"
    >
      {token.text}
    </button>
  )
}
