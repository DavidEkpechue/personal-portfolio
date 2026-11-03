import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'
import { technologies } from '../data/portfolio'
import type { Project, ProjectMediaState } from '../data/portfolio'
import { projectColor } from '../graph/palette'
import ASCIIText from './reactbits/ASCIIText'

const technologyName = (id: string) => technologies.find(technology => technology.id === id)?.name ?? id

const projectPalettes: Record<string, [string, string, string]> = {
  minglr: ['#070b16', '#d9b56e', '#f2ead8'],
  'agent-forge': ['#060a14', '#cfa65c', '#efe7d4'],
  '4thspace': ['#080c18', '#e3c486', '#f4ecdb'],
  izrosh: ['#090c16', '#c8995a', '#f1e6d2'],
}

const sourceLabels: Record<ProjectMediaState['sourceType'], string> = {
  'live-capture': 'Live capture',
  'repo-derived': 'From repository',
  architecture: 'Architecture diagram',
  generated: 'System diagram',
}

function makeArchitectureFrame(project: Project, state: ProjectMediaState, index: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 1280
  canvas.height = 720
  const context = canvas.getContext('2d')!
  const [background, line, foreground] = projectPalettes[project.id] ?? state.palette
  const systems = [project.title, ...state.emphasis.map(technologyName)]
  const positions = [
    { x: 640, y: 330 },
    { x: 250, y: 180 },
    { x: 1010, y: 180 },
    { x: 260, y: 520 },
    { x: 1020, y: 520 },
  ]

  context.fillStyle = background
  context.fillRect(0, 0, canvas.width, canvas.height)
  const field = context.createRadialGradient(640, 340, 30, 640, 340, 620)
  field.addColorStop(0, `${line}26`)
  field.addColorStop(.48, `${line}0a`)
  field.addColorStop(1, `${background}00`)
  context.fillStyle = field
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.fillStyle = `${line}30`
  for (let x = 40; x < 1280; x += 40) for (let y = 40; y < 720; y += 40) context.fillRect(x, y, 1.5, 1.5)

  const centre = positions[0]
  positions.slice(1, systems.length).forEach(position => {
    context.strokeStyle = `${line}8c`
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(centre.x, centre.y)
    context.lineTo(position.x, position.y)
    context.stroke()
  })

  systems.slice(0, positions.length).forEach((label, systemIndex) => {
    const position = positions[systemIndex]
    const width = systemIndex === 0 ? 300 : 210
    const height = systemIndex === 0 ? 96 : 66
    context.fillStyle = systemIndex === 0 ? `${line}24` : `${background}e6`
    context.strokeStyle = systemIndex === 0 ? `${foreground}c0` : `${line}90`
    context.lineWidth = systemIndex === 0 ? 2 : 1.25
    context.beginPath()
    context.roundRect(position.x - width / 2, position.y - height / 2, width, height, 14)
    context.fill()
    context.stroke()
    context.fillStyle = systemIndex === 0 ? foreground : `${foreground}dd`
    context.font = `${systemIndex === 0 ? '600 26px' : '500 18px'} "Inter Variable", system-ui, sans-serif`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(label, position.x, position.y)
  })

  context.textAlign = 'left'
  context.textBaseline = 'alphabetic'
  context.fillStyle = `${line}e0`
  context.font = '500 15px "JetBrains Mono Variable", ui-monospace, monospace'
  context.fillText(state.eyebrow.toUpperCase(), 54, 66)
  context.fillStyle = foreground
  context.font = '600 40px "Inter Variable", system-ui, sans-serif'
  context.fillText(state.label, 54, 668)
  context.textAlign = 'right'
  context.fillStyle = `${foreground}99`
  context.font = '17px "Inter Variable", system-ui, sans-serif'
  context.fillText(state.description, 1226, 666)
  context.fillStyle = `${line}a0`
  context.font = '14px "JetBrains Mono Variable", ui-monospace, monospace'
  context.fillText(`${String(index + 1).padStart(2, '0')} / ${String(project.media.length).padStart(2, '0')}`, 1226, 66)
  return canvas.toDataURL('image/webp', .9)
}

interface ProjectMediaProps {
  project: Project
  states: ProjectMediaState[]
  onEmphasis: (ids: string[]) => void
  reducedMotion?: boolean
}

export default function ProjectMedia({ project, states, onEmphasis, reducedMotion = false }: ProjectMediaProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const [near, setNear] = useState(false)
  // Keyboard changes are instant: animating a repeated key press only adds lag.
  const [instant, setInstant] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const swipeRef = useRef<{ x: number; y: number } | null>(null)
  // Generated frames are only drawn once the viewer approaches the viewport.
  const images = useMemo(() => near ? states.map((state, index) => state.src ?? makeArchitectureFrame(project, state, index)) : [], [near, project, states])
  const count = states.length
  const activeState = states[activeIndex]

  const show = useCallback((index: number) => {
    const next = (index + count) % count
    setActiveIndex(next)
    onEmphasis(states[next]?.emphasis ?? [])
  }, [count, onEmphasis, states])

  useEffect(() => { setActiveIndex(0) }, [project.id])

  useEffect(() => {
    const element = rootRef.current
    if (!element) return
    const nearObserver = new IntersectionObserver(entries => { if (entries[0]?.isIntersecting) { setNear(true); nearObserver.disconnect() } }, { rootMargin: '600px 0px' })
    const visibleObserver = new IntersectionObserver(entries => setVisible(Boolean(entries[0]?.isIntersecting)), { threshold: .2 })
    nearObserver.observe(element)
    visibleObserver.observe(element)
    return () => { nearObserver.disconnect(); visibleObserver.disconnect() }
  }, [])

  useEffect(() => {
    if (visible) onEmphasis(states[activeIndex]?.emphasis ?? [])
  }, [activeIndex, onEmphasis, states, visible])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); setInstant(true); show(activeIndex + 1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); setInstant(true); show(activeIndex - 1) }
  }
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => { setInstant(false); if (event.pointerType !== 'mouse') swipeRef.current = { x: event.clientX, y: event.clientY } }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeRef.current
    swipeRef.current = null
    if (!start) return
    const dx = event.clientX - start.x
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(event.clientY - start.y)) show(activeIndex + (dx < 0 ? 1 : -1))
  }

  const accent = projectColor(project.id)
  return <figure className={`media-viewer media-${project.id} ${reducedMotion ? 'is-reduced' : ''} ${instant ? 'is-instant' : ''}`} onPointerDownCapture={() => setInstant(false)} style={{ '--media-accent': accent } as CSSProperties} data-state={activeState?.id}>
    <div className="media-chrome">
      
      <span className="media-chrome-title">{project.title} <span aria-hidden="true">/</span> {activeState?.label}</span>
      <span className="media-chrome-count">Plate <span className="data">{activeIndex + 1}</span> of <span className="data">{count}</span></span>
    </div>
    <div
      ref={rootRef}
      className="media-stage"
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label={`${project.title} views. Use the arrow keys to change view.`}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { swipeRef.current = null }}
    >
      {states.map((state, index) => {
        const source = images[index]
        const isActive = index === activeIndex
        return source
          ? <img key={state.id} className={`media-frame ${isActive ? 'is-active' : ''} ${state.src ? '' : 'is-generated'} ${state.sourceType === 'architecture' ? 'is-diagram' : ''}`} src={source} alt={isActive ? state.alt : ''} aria-hidden={!isActive} width={1280} height={720} decoding="async" loading={index === 0 ? 'eager' : 'lazy'} draggable={false} style={{ objectFit: state.fit ?? 'contain', objectPosition: state.position ?? 'center' }} />
          : index === 0 ? <div key={state.id} className="media-frame media-placeholder is-active" aria-hidden="true" /> : null
      })}
      {project.id === 'agent-forge' && visible && <ASCIIText text="Agent Forge" active={visible && activeIndex === 0} reducedMotion={reducedMotion} />}
      {count > 1 && <>
        <button type="button" className="media-nav media-nav-prev" onClick={() => show(activeIndex - 1)} aria-label="Previous view"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg></button>
        <button type="button" className="media-nav media-nav-next" onClick={() => show(activeIndex + 1)} aria-label="Next view"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg></button>
      </>}
    </div>
    <figcaption className="media-caption">
      <div className="media-caption-copy"><span className="media-source">{activeState ? sourceLabels[activeState.sourceType] : ''}</span><p>{activeState?.description}</p></div>
      {count > 1 && <div className="media-tabs" role="tablist" aria-label={`${project.title} views`}>
        {states.map((state, index) => <button type="button" role="tab" key={state.id} className={index === activeIndex ? 'is-active' : ''} aria-selected={index === activeIndex} onClick={() => show(index)}>{state.label}</button>)}
      </div>}
    </figcaption>
  </figure>
}
