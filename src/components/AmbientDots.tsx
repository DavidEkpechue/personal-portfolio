import { useEffect, useRef } from 'react'

export default function AmbientDots({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const context = canvas.getContext('2d'); if (!context) return
    let frame = 0; let pointer = { x: .5, y: .5 }; let visible = true
    const dots = Array.from({ length: innerWidth < 700 ? 58 : 120 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * .75 + .25, phase: Math.random() * Math.PI * 2, depth: Math.random() }))
    const resize = () => { const ratio = Math.min(devicePixelRatio, 1.5); canvas.width = innerWidth * ratio; canvas.height = innerHeight * ratio; canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`; context.setTransform(ratio, 0, 0, ratio, 0, 0) }
    const move = (event: PointerEvent) => { pointer = { x: event.clientX / innerWidth, y: event.clientY / innerHeight } }
    const visibility = () => { visible = !document.hidden }
    const draw = (time: number) => { context.clearRect(0, 0, innerWidth, innerHeight); dots.forEach((dot) => { const shift = reduced ? 0 : (pointer.x - .5) * dot.depth * 16; const alpha = .08 + ((Math.sin(time / 1600 + dot.phase) + 1) / 2) * .22; context.fillStyle = `rgba(224,235,241,${alpha})`; context.beginPath(); context.arc(dot.x * innerWidth + shift, dot.y * innerHeight + (reduced ? 0 : (pointer.y - .5) * dot.depth * 10), dot.r, 0, Math.PI * 2); context.fill() }); if (!reduced && visible) frame = requestAnimationFrame(draw) }
    resize(); addEventListener('resize', resize); addEventListener('pointermove', move, { passive: true }); document.addEventListener('visibilitychange', visibility); frame = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(frame); removeEventListener('resize', resize); removeEventListener('pointermove', move); document.removeEventListener('visibilitychange', visibility) }
  }, [reduced])
  return <canvas ref={ref} className="ambient-dots" aria-hidden="true" />
}
