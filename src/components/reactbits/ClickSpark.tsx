import { useEffect, useRef } from 'react'

interface ClickSparkProps {
  /** Sparks cycle through these colours. */
  colors?: string[]
  count?: number
  radius?: number
  duration?: number
  disabled?: boolean
}

type Spark = { x: number; y: number; angle: number; born: number; color: string }

// Adapted from React Bits ClickSpark: short rays burst from the pointer on
// press. The canvas only animates while sparks are alive, then goes idle.
export default function ClickSpark({ colors = ['#e2c98f'], count = 8, radius = 22, duration = 420, disabled = false }: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    const context = canvas?.getContext('2d')
    if (!canvas || !host || !context || disabled) return
    let sparks: Spark[] = []
    let frame = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(host.clientWidth * dpr)
      canvas.height = Math.round(host.clientHeight * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const draw = (now: number) => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      sparks = sparks.filter(spark => now - spark.born < duration)
      context.lineWidth = 1.5
      context.lineCap = 'round'
      for (const spark of sparks) {
        const t = (now - spark.born) / duration
        const eased = 1 - Math.pow(1 - t, 3)
        const distance = eased * radius
        const length = 9 * (1 - eased)
        context.globalAlpha = 1 - t
        context.strokeStyle = spark.color
        context.beginPath()
        context.moveTo(spark.x + Math.cos(spark.angle) * distance, spark.y + Math.sin(spark.angle) * distance)
        context.lineTo(spark.x + Math.cos(spark.angle) * (distance + length), spark.y + Math.sin(spark.angle) * (distance + length))
        context.stroke()
      }
      context.globalAlpha = 1
      frame = sparks.length ? requestAnimationFrame(draw) : 0
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.button > 0) return
      const rect = host.getBoundingClientRect()
      const now = performance.now()
      for (let index = 0; index < count; index += 1) sparks.push({ x: event.clientX - rect.left, y: event.clientY - rect.top, angle: index / count * Math.PI * 2 + .2, born: now, color: colors[index % colors.length] })
      if (!frame) frame = requestAnimationFrame(draw)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()
    host.addEventListener('pointerdown', onPointerDown)
    return () => { observer.disconnect(); host.removeEventListener('pointerdown', onPointerDown); cancelAnimationFrame(frame) }
  }, [colors, count, disabled, duration, radius])
  return <canvas ref={canvasRef} className="click-spark" aria-hidden="true" />
}
