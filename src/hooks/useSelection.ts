import { useCallback, useEffect, useState } from 'react'
import { entityLabel, entityPath, selectionFromPath } from '../data/portfolio'
import type { Selection } from '../data/portfolio'

export function useSelection() {
  const [selection, setSelection] = useState<Selection>(() => selectionFromPath(window.location.pathname))

  useEffect(() => {
    const onPopState = () => setSelection(selectionFromPath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    document.title = selection ? `${entityLabel(selection)} — David Ekpechue` : 'David Ekpechue — Software Engineer'
  }, [selection])

  const select = useCallback((next: Selection, options?: { replace?: boolean; scrollTop?: boolean }) => {
    const path = entityPath(next)
    if (window.location.pathname !== path) {
      window.history[options?.replace ? 'replaceState' : 'pushState']({}, '', path)
    }
    setSelection(next)
    if (options?.scrollTop && window.scrollY > 16) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }))
    }
  }, [])

  return { selection, select }
}
