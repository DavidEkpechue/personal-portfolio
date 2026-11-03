import { useEffect } from 'react'

// Adapted from React Bits SpotlightCard as one delegated listener. Each panel
// gets a lamp child that is moved with a transform; changing a CSS variable
// on the panel would recalculate styles for every node inside it.
export function useSpotlight(selector: string) {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let frame = 0
    let pending: { panel: HTMLElement; x: number; y: number } | null = null
    let lit: HTMLElement | null = null
    const lampFor = (panel: HTMLElement) => {
      let lamp = panel.querySelector<HTMLElement>(':scope > .spotlight-lamp')
      if (!lamp) {
        lamp = document.createElement('span')
        lamp.className = 'spotlight-lamp'
        lamp.setAttribute('aria-hidden', 'true')
        panel.prepend(lamp)
      }
      return lamp
    }
    const flush = () => {
      frame = 0
      if (!pending) return
      const { panel, x, y } = pending
      if (lit && lit !== panel) lit.classList.remove('is-lit')
      lampFor(panel).style.transform = `translate3d(${x}px, ${y}px, 0)`
      panel.classList.add('is-lit')
      lit = panel
    }
    const onMove = (event: PointerEvent) => {
      const panel = (event.target as Element | null)?.closest?.(selector) as HTMLElement | null
      if (!panel) { if (lit) { lit.classList.remove('is-lit'); lit = null } return }
      const rect = panel.getBoundingClientRect()
      pending = { panel, x: event.clientX - rect.left, y: event.clientY - rect.top }
      if (!frame) frame = requestAnimationFrame(flush)
    }
    document.addEventListener('pointermove', onMove, { passive: true })
    return () => { document.removeEventListener('pointermove', onMove); cancelAnimationFrame(frame) }
  }, [selector])
}
