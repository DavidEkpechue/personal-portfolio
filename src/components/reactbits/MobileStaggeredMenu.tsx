import { gsap } from 'gsap'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

interface MobileStaggeredMenuProps {
  email: string
  github: string
  reducedMotion: boolean
}

export default function MobileStaggeredMenu({ email, github, reducedMotion }: MobileStaggeredMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const items = [
    { label: 'Work', link: '#work' },
    { label: 'Experience', link: '#experience' },
    { label: 'Technologies', link: '#technologies' },
    { label: 'About', link: '#about' },
    { label: 'CV', link: `mailto:${email}?subject=CV%20request` },
    { label: 'GitHub', link: github, external: true },
    { label: 'Contact', link: '#contact' },
  ]

  useLayoutEffect(() => {
    if (!panelRef.current || !layerRef.current) return
    gsap.set([layerRef.current, panelRef.current], { xPercent: 104 })
  }, [])

  useEffect(() => {
    const panel = panelRef.current
    const layer = layerRef.current
    if (!panel || !layer) return
    timelineRef.current?.kill()
    const labels = panel.querySelectorAll('.mobile-menu-label')
    const duration = reducedMotion ? .01 : .55
    if (open) {
      document.body.classList.add('mobile-menu-open')
      timelineRef.current = gsap.timeline()
        .to(layer, { xPercent: 0, duration: duration * .75, ease: 'power4.out' })
        .to(panel, { xPercent: 0, duration, ease: 'power4.out' }, reducedMotion ? 0 : .06)
        .fromTo(labels, { yPercent: 120, rotate: 5 }, { yPercent: 0, rotate: 0, duration: reducedMotion ? .01 : .65, stagger: reducedMotion ? 0 : .055, ease: 'power4.out' }, reducedMotion ? 0 : .16)
    } else {
      document.body.classList.remove('mobile-menu-open')
      timelineRef.current = gsap.timeline()
        .to(panel, { xPercent: 104, duration: reducedMotion ? .01 : .32, ease: 'power3.in' })
        .to(layer, { xPercent: 104, duration: reducedMotion ? .01 : .28, ease: 'power3.in' }, reducedMotion ? 0 : .05)
    }
    return () => { timelineRef.current?.kill() }
  }, [open, reducedMotion])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('mobile-menu-open')
    }
  }, [])

  return <div ref={rootRef} className="mobile-staggered-menu" data-open={open || undefined}>
    <button className="mobile-menu-toggle" type="button" aria-expanded={open} aria-controls="mobile-menu-panel" onClick={() => setOpen(value => !value)}>
      <span>{open ? 'Close' : 'Menu'}</span><i aria-hidden="true" />
    </button>
    <div ref={layerRef} className="mobile-menu-layer" aria-hidden="true" />
    <aside ref={panelRef} id="mobile-menu-panel" className="mobile-menu-panel" aria-hidden={!open}>
      <nav aria-label="Mobile navigation">
        <ol>{items.map((item, index) => <li key={item.label}>
          <a href={item.link} target={item.external ? '_blank' : undefined} rel={item.external ? 'noreferrer' : undefined} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
            <span className="mobile-menu-number">{String(index + 1).padStart(2, '0')}</span>
            <span className="mobile-menu-label">{item.label}</span>
          </a>
        </li>)}</ol>
      </nav>
      <p>David Ekpechue<br /><span>Software Engineer</span></p>
    </aside>
  </div>
}
