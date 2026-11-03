import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

// Becomes true once the element first comes within `margin` of the viewport
// and stays true, so heavy setup (measuring, simulations) can wait for it.
export function useNearViewport(ref: RefObject<Element | null>, margin = '900px 0px') {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element || near) return
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return
      observer.disconnect()
      setNear(true)
    }, { rootMargin: margin })
    observer.observe(element)
    return () => observer.disconnect()
  }, [margin, near, ref])
  return near
}
