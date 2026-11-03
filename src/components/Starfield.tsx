import { useEffect, useRef } from 'react'

type StarfieldMode = 'home' | 'project' | 'technologies' | 'contact' | 'quiet'

interface StarfieldProps {
  mode: StarfieldMode
  compact: boolean
}

// Deterministic so the sky is identical across reloads and resizes.
function random(seed: number) {
  let value = seed >>> 0
  return () => {
    value = (value + 0x6d2b79f5) >>> 0
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function paint(canvas: HTMLCanvasElement, width: number, height: number, seed: number, density: number, bright: boolean) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const context = canvas.getContext('2d')
  if (!context) return
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, width, height)
  const next = random(seed)
  const count = Math.round(width * height * density)
  for (let index = 0; index < count; index += 1) {
    const x = next() * width
    const y = next() * height
    const depth = next()
    const radius = bright ? .7 + depth * 1.1 : .35 + depth * .6
    const alpha = bright ? .55 + depth * .45 : .16 + depth * .42
    const tint = next()
    const colour = tint > .82 ? '198,212,255' : tint > .7 ? '242,222,176' : '238,236,230'
    if (bright) {
      const glow = context.createRadialGradient(x, y, 0, x, y, radius * 5)
      glow.addColorStop(0, `rgba(${colour},${alpha * .45})`)
      glow.addColorStop(1, `rgba(${colour},0)`)
      context.fillStyle = glow
      context.fillRect(x - radius * 5, y - radius * 5, radius * 10, radius * 10)
    }
    context.fillStyle = `rgba(${colour},${alpha})`
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()
  }
}

// Painted once per viewport size. Twinkle and mode changes are opacity-only
// CSS, so the background costs nothing per frame.
export default function Starfield({ mode, compact }: StarfieldProps) {
  const farRef = useRef<HTMLCanvasElement>(null)
  const nearRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const far = farRef.current
    const near = nearRef.current
    if (!far || !near) return
    let lastWidth = 0
    let lastHeight = 0
    let timer = 0
    const draw = () => {
      const width = window.innerWidth
      const height = window.screen.height > window.innerHeight ? Math.max(window.innerHeight, Math.min(window.screen.height, 1400)) : window.innerHeight
      // Mobile browser chrome resizes the viewport on scroll; ignore small height changes.
      if (width === lastWidth && Math.abs(height - lastHeight) < 160) return
      lastWidth = width
      lastHeight = height
      paint(far, width, height, 17, compact ? .00034 : .00042, false)
      paint(near, width, height, 911, compact ? .000032 : .000042, true)
    }
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(draw, 160) }
    draw()
    window.addEventListener('resize', onResize)
    return () => { window.clearTimeout(timer); window.removeEventListener('resize', onResize) }
  }, [compact])

  return <div className="starfield" data-mode={mode} aria-hidden="true">
    <div className="starfield-nebula" />
    <canvas ref={farRef} className="starfield-far" />
    <canvas ref={nearRef} className="starfield-near" />
  </div>
}
