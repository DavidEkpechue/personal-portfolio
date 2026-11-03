import { drag } from 'd3-drag'
import type { D3DragEvent } from 'd3-drag'
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from 'd3-force'
import type { SimulationLinkDatum, SimulationNodeDatum } from 'd3-force'
import { select } from 'd3-selection'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { domains, technologies } from '../data/portfolio'
import type { Project } from '../data/portfolio'

type LocalKind = 'project' | 'technology' | 'domain'

interface LocalNode extends SimulationNodeDatum {
  id: string
  label: string
  kind: LocalKind
  importance: number
  connections: number
  domainId?: string
  clusterIndex?: number
  primary?: boolean
}

interface LocalLink extends SimulationLinkDatum<LocalNode> {
  source: string | LocalNode
  target: string | LocalNode
  kind: 'system' | 'region'
  primary?: boolean
}

interface LocalProjectGraphProps {
  project: Project
  emphasis: string[]
  selectedId: string
  active: boolean
  reducedMotion: boolean
  onInspect: (id: string) => void
}

const domainPriority: Record<string, string[]> = {
  minglr: ['realtime'],
  'agent-forge': ['ai-automation', 'infrastructure'],
  '4thspace': ['mobile', 'search-discovery'],
  izrosh: ['commerce-storage'],
}

const hash = (value: string) => Array.from(value).reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 2166136261)

function endpointId(endpoint: string | LocalNode) {
  return typeof endpoint === 'string' ? endpoint : endpoint.id
}

function graphData(project: Project) {
  const technologyIds = Array.from(new Set([
    ...project.technologies,
    ...project.graph.primaryTechnologies,
    ...project.media.flatMap(state => state.emphasis),
  ]))
  const projectDomains = Array.from(new Set([...(domainPriority[project.id] ?? []), ...project.domains]))
  const primaryDomain = (technologyId: string) => projectDomains.find(domainId => domains.find(domain => domain.id === domainId)?.technologies.includes(technologyId))
  const links: LocalLink[] = technologyIds.map(id => ({ source: project.id, target: id, kind: 'system' as const, primary: project.graph.primaryTechnologies.includes(id) }))
  for (const domainId of projectDomains) {
    links.push({ source: project.id, target: domainId, kind: 'region' })
    const domain = domains.find(candidate => candidate.id === domainId)
    technologyIds.filter(id => domain?.technologies.includes(id)).forEach(id => links.push({ source: domainId, target: id, kind: 'region' }))
  }
  const counts = new Map<string, number>()
  links.forEach(link => { const source = endpointId(link.source); const target = endpointId(link.target); counts.set(source, (counts.get(source) ?? 0) + 1); counts.set(target, (counts.get(target) ?? 0) + 1) })
  const nodes: LocalNode[] = [
    { id: project.id, label: project.title, kind: 'project', importance: 5, connections: counts.get(project.id) ?? 0 },
    ...technologyIds.map(id => {
      const technology = technologies.find(candidate => candidate.id === id)
      const domainId = primaryDomain(id)
      return { id, label: technology?.name ?? id, kind: 'technology' as const, importance: technology?.graph.importance ?? 2, connections: counts.get(id) ?? 0, domainId, clusterIndex: domainId ? projectDomains.indexOf(domainId) : undefined, primary: project.graph.primaryTechnologies.includes(id) }
    }),
    ...projectDomains.map(id => {
      const domain = domains.find(candidate => candidate.id === id)
      return { id, label: domain?.name ?? id, kind: 'domain' as const, importance: 2, connections: counts.get(id) ?? 0, domainId: id, clusterIndex: projectDomains.indexOf(id), primary: (domainPriority[project.id] ?? []).includes(id) }
    }),
  ]
  return { nodes, links, projectDomains }
}

export default function LocalProjectGraph({ project, emphasis, selectedId, active, reducedMotion, onInspect }: LocalProjectGraphProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const nodeLayerRef = useRef<HTMLDivElement>(null)
  const edgeLayerRef = useRef<SVGGElement>(null)
  const nodeElements = useRef(new Map<string, HTMLButtonElement>())
  const edgeElements = useRef(new Map<string, SVGLineElement>())
  const simulationRef = useRef<ReturnType<typeof forceSimulation<LocalNode>> | null>(null)
  const clickScrollRef = useRef<number | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const data = useMemo(() => graphData(project), [project])
  const related = useMemo(() => {
    if (!hoveredId) return null
    const ids = new Set([hoveredId])
    data.links.forEach(link => {
      const source = endpointId(link.source)
      const target = endpointId(link.target)
      if (source === hoveredId) ids.add(target)
      if (target === hoveredId) ids.add(source)
    })
    return ids
  }, [data.links, hoveredId])

  const nudgeNode = (id: string, event: KeyboardEvent<HTMLButtonElement>) => {
    const direction = event.key === 'ArrowLeft' ? [-1, 0] : event.key === 'ArrowRight' ? [1, 0] : event.key === 'ArrowUp' ? [0, -1] : event.key === 'ArrowDown' ? [0, 1] : null
    if (!direction) return
    event.preventDefault()
    const simulation = simulationRef.current
    const node = simulation?.nodes().find(candidate => candidate.id === id)
    if (!simulation || !node) return
    const distance = event.shiftKey ? 18 : 9
    node.x = (node.x ?? 0) + direction[0] * distance
    node.y = (node.y ?? 0) + direction[1] * distance
    node.vx = direction[0]
    node.vy = direction[1]
    if (!reducedMotion) simulation.alpha(Math.max(simulation.alpha(), .08)).restart()
  }

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const rect = root.getBoundingClientRect()
    let width = Math.max(320, rect.width)
    let height = Math.max(320, rect.height)
    let centreX = width * .5
    let centreY = height * .5
    const clusterPoint = (node: LocalNode) => {
      if (node.kind === 'project' || node.clusterIndex === undefined) return [centreX, centreY] as const
      const angle = (node.clusterIndex / Math.max(1, data.projectDomains.length)) * Math.PI * 2 - Math.PI / 2
      return [centreX + Math.cos(angle) * Math.min(width, height) * .3, centreY + Math.sin(angle) * Math.min(width, height) * .235] as const
    }
    const nodes: LocalNode[] = data.nodes.map((node): LocalNode => {
      if (node.kind === 'project') return { ...node, x: centreX, y: centreY, fx: reducedMotion ? centreX : undefined, fy: reducedMotion ? centreY : undefined }
      const [anchorX, anchorY] = clusterPoint(node)
      const angle = (hash(`${project.id}:${node.id}`) % 628) / 100
      const radius = node.kind === 'domain' ? 0 : 30 + (hash(node.id) % 28)
      return { ...node, x: anchorX + Math.cos(angle) * radius, y: anchorY + Math.sin(angle) * radius * .72 }
    })
    const links = data.links.map(link => ({ ...link }))
    const centreForce = forceCenter(centreX, centreY).strength(.025)
    const horizontalForce = forceX<LocalNode>(node => clusterPoint(node)[0]).strength(node => node.kind === 'project' ? .18 : node.kind === 'domain' ? .12 : .045)
    const verticalForce = forceY<LocalNode>(node => clusterPoint(node)[1]).strength(node => node.kind === 'project' ? .18 : node.kind === 'domain' ? .12 : .045)
    const simulation = forceSimulation<LocalNode>(nodes)
      .force('charge', forceManyBody<LocalNode>().strength(node => node.kind === 'project' ? -138 : node.kind === 'domain' ? -92 : -72).distanceMin(28).distanceMax(230))
      .force('link', forceLink<LocalNode, LocalLink>(links).id(node => node.id).distance(link => link.kind === 'region' ? 76 : link.primary ? 108 : 154).strength(link => link.kind === 'region' ? .25 : link.primary ? .24 : .055))
      .force('collision', forceCollide<LocalNode>().radius(node => node.kind === 'project' ? 48 : node.kind === 'domain' ? 36 : 27).strength(.68))
      .force('center', centreForce)
      .force('x', horizontalForce)
      .force('y', verticalForce)
      .alphaDecay(reducedMotion ? .16 : .065)
      .velocityDecay(.52)

    simulationRef.current = simulation
    const render = () => {
      nodes.forEach(node => {
        const horizontalInset = node.kind === 'project' ? 88 : node.kind === 'domain' ? 94 : 84
        node.x = Math.max(horizontalInset, Math.min(width - horizontalInset, node.x ?? centreX))
        node.y = Math.max(48, Math.min(height - 46, node.y ?? centreY))
        const element = nodeElements.current.get(node.id)
        if (element) {
          const alignRight = (node.x ?? 0) > width * .7
          element.dataset.align = alignRight ? 'right' : 'left'
          element.style.transform = `translate3d(${node.x ?? 0}px, ${node.y ?? 0}px, 0) translate(${alignRight ? '-100%' : '0'}, -50%)`
        }
      })
      const acceptedLabels: Array<{ left: number; right: number; top: number; bottom: number }> = []
      const labelOrder = [...nodes].sort((a, b) => Number(b.kind === 'project') - Number(a.kind === 'project') || Number(Boolean(b.primary)) - Number(Boolean(a.primary)) || b.importance - a.importance)
      labelOrder.forEach(node => {
        const element = nodeElements.current.get(node.id)
        if (!element) return
        const tier = element.dataset.labelTier
        if (tier === 'detail') { element.classList.remove('is-label-occluded'); return }
        const x = node.x ?? centreX
        const y = node.y ?? centreY
        const labelWidth = Math.min(node.kind === 'project' ? 154 : 126, Math.max(34, node.label.length * (node.kind === 'project' ? 6.5 : 5.4) + 14))
        const labelHeight = node.kind === 'project' ? 22 : 14
        const rightAligned = element.dataset.align === 'right'
        const box = { left: rightAligned ? x - labelWidth - 10 : x + 10, right: rightAligned ? x - 10 : x + labelWidth + 10, top: y - labelHeight / 2, bottom: y + labelHeight / 2 }
        const overlaps = node.kind !== 'project' && acceptedLabels.some(other => box.left < other.right + 3 && box.right > other.left - 3 && box.top < other.bottom + 2 && box.bottom > other.top - 2)
        element.classList.toggle('is-label-occluded', overlaps)
        if (!overlaps || node.kind === 'project') acceptedLabels.push(box)
      })
      links.forEach(link => {
        const source = link.source as LocalNode
        const target = link.target as LocalNode
        const line = edgeElements.current.get(`${source.id}:${target.id}`)
        if (!line) return
        line.setAttribute('x1', String(source.x ?? 0))
        line.setAttribute('y1', String(source.y ?? 0))
        line.setAttribute('x2', String(target.x ?? 0))
        line.setAttribute('y2', String(target.y ?? 0))
      })
    }
    simulation.on('tick.render', render)

    const dragBehaviour = drag<HTMLButtonElement, LocalNode>()
      .container(() => root)
      .clickDistance(6)
      .on('start.local', (_event: D3DragEvent<HTMLButtonElement, LocalNode, LocalNode>, node) => {
        if (reducedMotion) return
        node.fx = node.x
        node.fy = node.y
        simulation.alpha(Math.max(simulation.alpha(), .12)).alphaTarget(.14).restart()
      })
      .on('drag.local', (event: D3DragEvent<HTMLButtonElement, LocalNode, LocalNode>, node) => {
        if (reducedMotion) return
        node.fx = Math.max(28, Math.min(width - 28, event.x))
        node.fy = Math.max(28, Math.min(height - 28, event.y))
      })
      .on('end.local', (_event: D3DragEvent<HTMLButtonElement, LocalNode, LocalNode>, node) => {
        if (reducedMotion) return
        node.fx = null
        node.fy = null
        simulation.alphaTarget(0)
      })

    nodes.forEach(node => {
      const element = nodeElements.current.get(node.id)
      if (element) select(element).datum(node).call(dragBehaviour)
    })
    const resizeObserver = new ResizeObserver(entries => {
      const next = entries[0]?.contentRect
      if (!next || next.width < 1 || next.height < 1 || Math.abs(next.width - width) < 1 && Math.abs(next.height - height) < 1) return
      width = Math.max(320, next.width)
      height = Math.max(320, next.height)
      centreX = width * .5
      centreY = height * .5
      centreForce.x(centreX).y(centreY)
      horizontalForce.x(node => clusterPoint(node)[0])
      verticalForce.y(node => clusterPoint(node)[1])
      if (!reducedMotion) simulation.alpha(Math.max(simulation.alpha(), .12)).restart()
      else render()
    })
    resizeObserver.observe(root)
    simulation.alpha(reducedMotion ? .18 : .72).restart()
    if (reducedMotion) {
      simulation.tick(60).stop()
      render()
    }
    return () => {
      resizeObserver.disconnect()
      simulation.stop().on('tick.render', null)
      simulationRef.current = null
    }
  }, [data, project.id, reducedMotion])

  useEffect(() => {
    const simulation = simulationRef.current
    if (!simulation || reducedMotion) return
    if (active) simulation.alpha(Math.max(simulation.alpha(), .18)).restart()
    else simulation.alphaTarget(0)
  }, [active, reducedMotion])

  const highlighted = new Set(emphasis)
  const selectedRelated = new Set([selectedId])
  data.links.forEach(link => {
    const source = endpointId(link.source)
    const target = endpointId(link.target)
    if (source === selectedId) selectedRelated.add(target)
    if (target === selectedId) selectedRelated.add(source)
  })
  return <div ref={rootRef} className={`local-project-graph ${active ? 'is-active' : ''}`} aria-label={`${project.title} connected systems`}>
    <div className="local-graph-heading"><span>System constellation</span><span>{data.nodes.length} objects</span></div>
    <svg className="local-graph-edges" aria-hidden="true"><g ref={edgeLayerRef}>{data.links.map(link => {
      const source = endpointId(link.source)
      const target = endpointId(link.target)
      const isEmphasised = highlighted.has(source) || highlighted.has(target)
      const isRelated = !related || related.has(source) && related.has(target)
      const isSelected = source === selectedId || target === selectedId
      return <line key={`${source}:${target}`} ref={element => { if (element) edgeElements.current.set(`${source}:${target}`, element); else edgeElements.current.delete(`${source}:${target}`) }} className={`${link.kind === 'region' ? 'is-region' : 'is-system'} ${link.primary ? 'is-primary' : ''} ${isEmphasised ? 'is-emphasised' : ''} ${isSelected ? 'is-selected' : ''} ${isRelated ? '' : 'is-dimmed'}`} />
    })}</g></svg>
    <div ref={nodeLayerRef} className="local-graph-nodes">{data.nodes.map(node => {
      const dimmed = related && !related.has(node.id)
      const emphasised = highlighted.has(node.id)
      const selected = node.id === selectedId
      const labelTier = node.kind === 'project' ? 'project' : node.kind === 'technology' && node.primary ? 'core' : node.kind === 'domain' && node.primary ? 'domain' : 'detail'
      return <button
        key={node.id}
        ref={element => { if (element) nodeElements.current.set(node.id, element); else nodeElements.current.delete(node.id) }}
        type="button"
        className={`local-graph-node is-${node.kind} ${emphasised ? 'is-emphasised' : ''} ${selected ? 'is-selected' : ''} ${selectedId !== project.id && selectedRelated.has(node.id) ? 'is-selected-related' : ''} ${dimmed ? 'is-dimmed' : ''}`}
        style={{ '--local-node-size': `${node.kind === 'project' ? 7 + Math.sqrt(node.connections + 1) * 1.5 : 3 + Math.sqrt(node.connections + 1) * 1.2}px` } as CSSProperties}
        data-label-tier={labelTier}
        onPointerDown={() => { clickScrollRef.current = window.scrollY }}
        onPointerEnter={() => setHoveredId(node.id)}
        onPointerLeave={() => setHoveredId(null)}
        onFocus={() => setHoveredId(node.id)}
        onBlur={() => setHoveredId(null)}
        onKeyDown={event => nudgeNode(node.id, event)}
        onClick={event => {
          const preservedScroll = clickScrollRef.current
          clickScrollRef.current = null
          onInspect(node.id)
          event.currentTarget.blur()
          if (preservedScroll !== null) {
            window.setTimeout(() => window.scrollTo({ top: preservedScroll, behavior: 'auto' }), 0)
            window.setTimeout(() => window.scrollTo({ top: preservedScroll, behavior: 'auto' }), 100)
          }
        }}
        aria-label={`${node.label}, ${node.kind}`}
        aria-pressed={selected}
        tabIndex={labelTier === 'project' || labelTier === 'core' ? 0 : -1}
      ><span aria-hidden="true" /><strong>{node.label}</strong></button>
    })}</div>
    <p className="local-graph-instruction">Drag to inspect · select a node to reframe</p>
  </div>
}
