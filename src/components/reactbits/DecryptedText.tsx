import { useEffect, useState } from 'react'

interface DecryptedTextProps {
  text: string
  reducedMotion?: boolean
  duration?: number
  className?: string
}

const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

// Adapted from React Bits DecryptedText without motion: when the text changes
// it resolves left to right from scrambled glyphs, like an instrument readout.
export default function DecryptedText({ text, reducedMotion = false, duration = 360, className = '' }: DecryptedTextProps) {
  const [shown, setShown] = useState(text)
  useEffect(() => {
    if (reducedMotion || !text) { setShown(text); return }
    const started = performance.now()
    let frame = 0
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / duration)
      const resolved = Math.floor(progress * text.length)
      setShown(Array.from(text).map((character, index) => index < resolved || character === ' ' ? character : glyphs[(index * 7 + Math.floor(now / 40)) % glyphs.length]).join(''))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [duration, reducedMotion, text])
  return <span className={`decrypted-text ${className}`} aria-label={text}><span aria-hidden="true">{shown}</span></span>
}
