import { useCallback, useEffect, useState } from 'react'
import { entityPath, selectionFromPath } from '../data/portfolio'
import type { Selection } from '../data/portfolio'
export function useSelection() {
  const [selection, setSelection] = useState<Selection>(() => selectionFromPath(window.location.pathname))
  useEffect(() => { const onPop = () => setSelection(selectionFromPath(window.location.pathname)); addEventListener('popstate', onPop); return () => removeEventListener('popstate', onPop) }, [])
  const select = useCallback((next: Selection, replace = false) => { const path = entityPath(next); if (window.location.pathname !== path) window.history[replace ? 'replaceState' : 'pushState']({}, '', path); setSelection(next) }, [])
  return { selection, select }
}
