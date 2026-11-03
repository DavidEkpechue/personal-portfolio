// Settles a stopped simulation once its element nears the viewport, a few
// ticks per frame so layout never blocks the main thread. Returns a cancel.
export function settleWhenNear(
  element: Element,
  simulation: { tick: (iterations?: number) => unknown },
  ticks: number,
  onSettled: () => void,
  ticksPerFrame = 12,
) {
  let frame = 0
  let remaining = ticks
  const step = () => {
    const batch = Math.min(ticksPerFrame, remaining)
    simulation.tick(batch)
    remaining -= batch
    if (remaining > 0) frame = requestAnimationFrame(step)
    else onSettled()
  }
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return
    observer.disconnect()
    frame = requestAnimationFrame(step)
  }, { rootMargin: '900px 0px' })
  observer.observe(element)
  return () => {
    observer.disconnect()
    cancelAnimationFrame(frame)
  }
}
