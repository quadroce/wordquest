import { useEffect, useState } from 'react'

export function useCountdown(totalSeconds, running, resetKey = 0) {
  const [state, setState] = useState({
    remaining: totalSeconds,
    totalSeconds,
    resetKey,
  })

  if (state.resetKey !== resetKey || state.totalSeconds !== totalSeconds) {
    setState({ remaining: totalSeconds, totalSeconds, resetKey })
  }

  useEffect(() => {
    if (!running) return undefined

    const id = window.setInterval(() => {
      setState((current) => ({
        ...current,
        remaining: current.remaining <= 0 ? 0 : current.remaining - 1,
      }))
    }, 1000)

    return () => window.clearInterval(id)
  }, [running])

  return state.remaining
}
