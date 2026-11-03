import type { CSSProperties } from 'react'

interface BlurTextProps {
  text: string
  delay?: number
  stagger?: number
  className?: string
}

// Adapted from React Bits BlurText without the motion dependency: each letter
// resolves from a soft blur once, on load, as the page's single entrance.
export default function BlurText({ text, delay = 0, stagger = .035, className = '' }: BlurTextProps) {
  return <span className={`blur-text ${className}`} aria-label={text} role="text">
    {Array.from(text).map((character, index) => <span key={index} className="blur-text-letter" aria-hidden="true" style={{ '--blur-delay': `${delay + index * stagger}s` } as CSSProperties}>{character === ' ' ? ' ' : character}</span>)}
  </span>
}
