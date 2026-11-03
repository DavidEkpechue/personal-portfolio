import { useEffect, useRef } from 'react'

interface LetterGlitchProps {
  active: boolean
  reducedMotion: boolean
  className?: string
}

const characters = 'AGENTFORGEK8SGITHUBNODE01<>[]{}+=/\\'
const colors = ['#24423b', '#315f55', '#59d3be', '#91bcb3']

// A bounded, low-frequency adaptation of React Bits Letter Glitch. It only
// runs while the Agent Forge media is visible and active.
export default function LetterGlitch({ active, reducedMotion, className = '' }: LetterGlitchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return
    const context = canvas.getContext('2d')
    if (!context) return

    let visible = false
    let interval = 0
    let columns = 0
    let rows = 0
    let cells: Array<{ char: string; color: string }> = []
    const choose = <T,>(items: T[], seed = Math.random()) => items[Math.floor(seed * items.length) % items.length]
    const initialise = () => {
      const rect = parent.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25)
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      columns = Math.ceil(rect.width / 13)
      rows = Math.ceil(rect.height / 20)
      cells = Array.from({ length: columns * rows }, (_, index) => ({
        char: characters[(index * 17 + 5) % characters.length],
        color: colors[(index * 7 + 2) % colors.length],
      }))
      draw()
    }
    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      context.clearRect(0, 0, rect.width, rect.height)
      context.font = '10px SFMono-Regular, Consolas, monospace'
      context.textBaseline = 'top'
      cells.forEach((cell, index) => {
        context.fillStyle = cell.color
        context.fillText(cell.char, (index % columns) * 13, Math.floor(index / columns) * 20)
      })
    }
    const update = () => {
      if (!active || reducedMotion || !visible || document.hidden) return
      const count = Math.max(1, Math.floor(cells.length * .035))
      for (let index = 0; index < count; index += 1) {
        const cellIndex = Math.floor(Math.random() * cells.length)
        if (cells[cellIndex]) cells[cellIndex] = { char: choose(Array.from(characters)), color: choose(colors) }
      }
      draw()
    }
    const start = () => {
      window.clearInterval(interval)
      if (active && !reducedMotion && visible) interval = window.setInterval(update, 105)
      else draw()
    }
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting)
      start()
    }, { rootMargin: '100px' })
    const resizeObserver = new ResizeObserver(initialise)
    intersectionObserver.observe(parent)
    resizeObserver.observe(parent)
    initialise()
    start()
    return () => {
      window.clearInterval(interval)
      intersectionObserver.disconnect()
      resizeObserver.disconnect()
    }
  }, [active, reducedMotion])

  return <canvas ref={canvasRef} className={`letter-glitch ${className}`} aria-hidden="true" />
}
