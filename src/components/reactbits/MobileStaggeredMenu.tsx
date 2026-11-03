import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

interface MobileStaggeredMenuProps {
  email: string
  github: string
  instagram: string
  reducedMotion: boolean
}

// Staggered menu driven by CSS transitions; --i offsets each label's delay.
export default function MobileStaggeredMenu({ email, github, instagram, reducedMotion }: MobileStaggeredMenuProps) {
  const [open, setOpen] = useState(false)
  const items = [
    { label: 'Work', link: '#work' },
    { label: 'Experience', link: '#experience' },
    { label: 'Technologies', link: '#technologies' },
    { label: 'About', link: '#about' },
    { label: 'CV', link: `mailto:${email}?subject=CV%20request` },
    { label: 'GitHub', link: github, external: true },
    { label: 'Instagram', link: instagram, external: true },
    { label: 'Contact', link: '#contact' },
  ]

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', open)
  }, [open])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('mobile-menu-open')
    }
  }, [])

  return <div className={`mobile-staggered-menu ${reducedMotion ? 'is-reduced' : ''}`} data-open={open || undefined}>
    <button className="mobile-menu-toggle" type="button" aria-expanded={open} aria-controls="mobile-menu-panel" onClick={() => setOpen(value => !value)}>
      <span>{open ? 'Close' : 'Menu'}</span><i aria-hidden="true" />
    </button>
    <div className="mobile-menu-layer" aria-hidden="true" />
    <aside id="mobile-menu-panel" className="mobile-menu-panel" aria-hidden={!open} inert={!open}>
      <nav aria-label="Mobile navigation">
        <ol>{items.map((item, index) => <li key={item.label} style={{ '--i': index } as CSSProperties}>
          <a href={item.link} target={item.external ? '_blank' : undefined} rel={item.external ? 'noreferrer' : undefined} onClick={() => setOpen(false)}>
            <span className="mobile-menu-label">{item.label}</span>
          </a>
        </li>)}</ol>
      </nav>
      <p>David Ekpechue<br /><span>Software engineer. Code is magic.</span></p>
    </aside>
  </div>
}
