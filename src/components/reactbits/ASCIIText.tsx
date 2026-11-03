import { useEffect, useMemo, useRef, useState } from 'react'

interface ASCIITextProps {
  text: string
  active: boolean
  reducedMotion: boolean
}

const glyphs = ' .:;+=*#%@[]{}<>01'

// React Bits ASCII Text is intentionally reduced to a short DOM-based resolve
// here, avoiding another permanent WebGL context for a one-second transition.
export default function ASCIIText({ text, active, reducedMotion }: ASCIITextProps) {
  const target = useMemo(() => text.toUpperCase(), [text])
  const [value, setValue] = useState(target)
  const runRef = useRef(0)

  useEffect(() => {
    window.clearInterval(runRef.current)
    if (!active || reducedMotion) {
      setValue(target)
      return
    }
    let frame = 0
    const total = 18
    runRef.current = window.setInterval(() => {
      frame += 1
      const resolved = Math.floor((frame / total) * target.length)
      setValue(Array.from(target).map((character, index) => {
        if (character === ' ') return ' '
        if (index < resolved) return character
        return glyphs[(index * 11 + frame * 7) % glyphs.length]
      }).join(''))
      if (frame >= total) {
        window.clearInterval(runRef.current)
        setValue(target)
      }
    }, 48)
    return () => window.clearInterval(runRef.current)
  }, [active, reducedMotion, target])

  return <span className="ascii-resolve" aria-hidden="true">{value}</span>
}
