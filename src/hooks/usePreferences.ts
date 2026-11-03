import { useEffect, useState } from 'react'

export function usePreferences() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const viewport = window.matchMedia('(max-width: 760px)')
    const update = () => {
      setReducedMotion(motion.matches)
      setCompact(viewport.matches)
    }
    update()
    motion.addEventListener('change', update)
    viewport.addEventListener('change', update)
    return () => {
      motion.removeEventListener('change', update)
      viewport.removeEventListener('change', update)
    }
  }, [])

  return { reducedMotion, compact }
}
