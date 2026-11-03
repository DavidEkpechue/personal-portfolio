import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { technologies } from '../data/portfolio'
import type { Project, ProjectMediaState } from '../data/portfolio'
import ASCIIText from './reactbits/ASCIIText'
import LetterGlitch from './reactbits/LetterGlitch'

const MorphSlider = lazy(() => import('./reactbits/MorphSlider'))

const technologyName = (id: string) => technologies.find(technology => technology.id === id)?.name ?? id

function mediaPosition(value = 'center center'): [number, number] {
  const token = (part: string | undefined, axis: 'x' | 'y') => {
    if (!part || part === 'center') return .5
    if (part === 'left' || part === 'top') return 0
    if (part === 'right' || part === 'bottom') return 1
    const percentage = Number.parseFloat(part)
    return Number.isFinite(percentage) ? Math.max(0, Math.min(1, percentage / 100)) : axis === 'x' ? .5 : .5
  }
  const [x, y] = value.trim().split(/\s+/)
  return [token(x, 'x'), token(y ?? x, 'y')]
}

const projectPalettes: Record<string, [string, string, string]> = {
  minglr: ['#07040d', '#8f55ff', '#f4edff'],
  'agent-forge': ['#05040b', '#7058e8', '#eeebff'],
  '4thspace': ['#09040d', '#bd5eff', '#faedff'],
  izrosh: ['#0a050b', '#a64f85', '#fff0fa'],
}

function makeArchitectureFrame(project: Project, state: ProjectMediaState, index: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 1280
  canvas.height = 760
  const context = canvas.getContext('2d')!
  const [background, line, foreground] = projectPalettes[project.id] ?? state.palette
  const systems = [project.title, ...state.emphasis.map(technologyName)]
  const positions = [
    { x: 640, y: 345 },
    { x: 250, y: 190 },
    { x: 1010, y: 190 },
    { x: 260, y: 555 },
    { x: 1020, y: 555 },
  ]

  context.fillStyle = background
  context.fillRect(0, 0, canvas.width, canvas.height)
  const field = context.createRadialGradient(640, 360, 30, 640, 360, 620)
  field.addColorStop(0, `${line}20`)
  field.addColorStop(.48, `${line}08`)
  field.addColorStop(1, `${background}00`)
  context.fillStyle = field
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.strokeStyle = `${line}24`
  context.lineWidth = 1
  for (let x = 80; x < 1280; x += 80) {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 760); context.stroke()
  }
  for (let y = 80; y < 760; y += 80) {
    context.beginPath(); context.moveTo(0, y); context.lineTo(1280, y); context.stroke()
  }

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
    const width = systemIndex === 0 ? 280 : 196
    const height = systemIndex === 0 ? 92 : 64
    context.fillStyle = systemIndex === 0 ? `${line}20` : `${background}d9`
    context.strokeStyle = systemIndex === 0 ? `${foreground}bd` : `${line}82`
    context.lineWidth = systemIndex === 0 ? 2 : 1
    context.fillRect(position.x - width / 2, position.y - height / 2, width, height)
    context.strokeRect(position.x - width / 2, position.y - height / 2, width, height)
    context.fillStyle = systemIndex === 0 ? foreground : `${foreground}d6`
    context.font = `${systemIndex === 0 ? '600 24px' : '500 17px'} Arial`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(label.toUpperCase(), position.x, position.y)
  })

  context.textAlign = 'left'
  context.textBaseline = 'alphabetic'
  context.fillStyle = `${line}d9`
  context.font = '13px monospace'
  context.fillText(state.eyebrow.toUpperCase(), 54, 55)
  context.fillStyle = foreground
  context.font = '600 44px Arial'
  context.fillText(state.label.toUpperCase(), 54, 710)
  context.textAlign = 'right'
  context.fillStyle = `${foreground}93`
  context.font = '15px Arial'
  context.fillText(state.description, 1226, 708)
  context.fillStyle = `${line}92`
  context.font = '12px monospace'
  context.fillText(`${String(index + 1).padStart(2, '0')} / ${String(project.media.length).padStart(2, '0')}`, 1226, 55)
  return canvas.toDataURL('image/png')
}

function mediaImage(project: Project, state: ProjectMediaState, index: number) {
  if (state.src) return state.src
  return makeArchitectureFrame(project, state, index)
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
  const [mediaReady, setMediaReady] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const items = useMemo(() => states.map((state, index) => ({ image: mediaImage(project, state, index), caption: state.label, fit: state.fit, position: mediaPosition(state.position) })), [project, states])
  const poster = items[0]
  const handleIndexChange = useCallback((index: number) => {
    setActiveIndex(index)
    onEmphasis(states[index]?.emphasis ?? [])
  }, [onEmphasis, states])

  useEffect(() => { setActiveIndex(0); setMediaReady(false) }, [project.id])

  useEffect(() => {
    const element = rootRef.current
    if (!element) return
    const observer = new IntersectionObserver(entries => setVisible(Boolean(entries[0]?.isIntersecting)), { rootMargin: '180px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (visible) onEmphasis(states[activeIndex]?.emphasis ?? [])
  }, [activeIndex, onEmphasis, states, visible])

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    const preload = (source: string) => new Promise<void>(resolve => {
      const image = new Image()
      image.onload = () => resolve()
      image.onerror = () => resolve()
      image.src = source
    })
    Promise.all(items.map(item => preload(item.image))).then(() => { if (!cancelled) setMediaReady(true) })
    return () => { cancelled = true }
  }, [items, visible])

  const activeState = states[activeIndex]
  return <div className={`project-media media-${project.id}`} ref={rootRef} data-state={activeState?.id} aria-label={activeState?.alt} style={{ aspectRatio: activeState?.aspectRatio ?? '16 / 9' }}>
    {project.id === 'agent-forge' && visible && <>
      <LetterGlitch active={visible} reducedMotion={reducedMotion} className="agent-letter-field" />
      <ASCIIText text="Agent Forge" active={visible && activeIndex === 0} reducedMotion={reducedMotion} />
    </>}
    <div className="media-heading"><span>{states[activeIndex]?.eyebrow}</span><span>{String(activeIndex + 1).padStart(2, '0')} / {String(states.length).padStart(2, '0')}</span></div>
    {visible && mediaReady ? <Suspense fallback={<img className="project-media-poster" src={poster.image} alt={states[0]?.alt ?? `${project.title} project view`} style={{ objectFit: states[0]?.fit ?? 'contain', objectPosition: states[0]?.position ?? 'center' }} />}>
      <MorphSlider
        items={items}
        activeIndex={activeIndex}
        transition={project.id === 'agent-forge' ? 'shear' : 'melt'}
        duration={reducedMotion ? .22 : .84}
        intensity={reducedMotion ? 0 : .3}
        aberration={reducedMotion ? 0 : .035}
        drift={reducedMotion ? 0 : .025}
        radius={0}
        overlayColor={projectPalettes[project.id]?.[0] ?? '#07050b'}
        showCaptions={false}
        showIndicators={false}
        showControls
        onIndexChange={handleIndexChange}
      />
    </Suspense> : <img className="project-media-poster" src={poster.image} alt={states[0]?.alt ?? `${project.title} project view`} loading="lazy" style={{ objectFit: states[0]?.fit ?? 'contain', objectPosition: states[0]?.position ?? 'center' }} />}
    <div className="media-state-list" aria-label={`${project.title} media states`}>
      {states.map((state, index) => <button type="button" className={index === activeIndex ? 'is-active' : ''} key={state.id} onClick={() => handleIndexChange(index)} aria-pressed={index === activeIndex}>{state.label}</button>)}
    </div>
  </div>
}
