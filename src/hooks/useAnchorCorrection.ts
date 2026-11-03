import { useEffect } from 'react'

// Sections far from the viewport use estimated heights (content-visibility),
// so an in-page jump can end a little off target. Once the scroll settles,
// snap the target to its resting position.
export function useAnchorCorrection() {
  useEffect(() => {
    let cleanup = () => {}
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href^="#"]')
      const id = link?.getAttribute('href')?.slice(1)
      const target = id ? document.getElementById(id) : null
      if (!target) return
      cleanup()
      const settle = () => {
        cleanup()
        const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
        const distance = target.getBoundingClientRect().top - offset
        if (Math.abs(distance) > 6) window.scrollBy({ top: distance, behavior: 'auto' })
      }
      const fallback = window.setTimeout(settle, 1600)
      window.addEventListener('scrollend', settle, { once: true })
      cleanup = () => { window.clearTimeout(fallback); window.removeEventListener('scrollend', settle) }
    }
    document.addEventListener('click', onClick)
    return () => { cleanup(); document.removeEventListener('click', onClick) }
  }, [])
}
