import { drag } from 'd3-drag'
import type { D3DragEvent } from 'd3-drag'
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force'
import type { Simulation, SimulationLinkDatum, SimulationNodeDatum } from 'd3-force'
import { select as selectElement } from 'd3-selection'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { domains, projects, relationships, statusLabel, technologies } from '../data/portfolio'
import type { Project, Selection, Technology } from '../data/portfolio'
import { getProjectNodeColor } from '../graph/colors'
import { settleWhenNear } from '../graph/settle'
import { useNearViewport } from '../hooks/useNearViewport'
import Icon from './Icon'
import { entityColor } from '../graph/palette'

type ExplorerEntity = { kind: 'project' | 'technology'; id: string } | null

interface ExplorerNode extends SimulationNodeDatum {
  id: string
  name: string
  kind: 'project' | 'technology'
  importance: number
  connections: number
  domainId?: string
}

interface ExplorerLink extends SimulationLinkDatum<ExplorerNode> {
  id: string
  source: string | ExplorerNode
  target: string | ExplorerNode
  kind: 'uses' | 'implemented-with'
}

const domainPositions: Record<string, [number, number]> = {
  frontend: [.24, .2], backend: [.55, .2], realtime: [.77, .32], 'databases-data': [.62, .64],
  'search-discovery': [.79, .72], infrastructure: [.42, .79], 'ai-automation': [.19, .68], mobile: [.15, .43],
  'commerce-storage': [.83, .52], 'game-development': [.29, .87], 'testing-quality': [.47, .43],
  'interactive-visualisation': [.37, .29], 'desktop-applications': [.7, .86],
}

const endpointId = (endpoint: string | ExplorerNode) => typeof endpoint === 'string' ? endpoint : endpoint.id
const primaryDomainFor = (technologyId: string) => domains.find(domain => domain.technologies.includes(technologyId))?.id
const connectionCount = (id: string) => new Set(relationships.flatMap(link => link.from === id ? [link.to] : link.to === id ? [link.from] : [])).size

function evidenceLine(technology: Technology, project: Project) {
  const relationship = relationships.find(link => link.from === project.id && link.to === technology.id)
  if (relationship?.evidenceSummary) return relationship.evidenceSummary
  const ignored = new Set(['across', 'application', 'applications', 'development', 'implemented', 'project', 'projects', 'systems', 'technology', 'with'])
  const terms = `${technology.name} ${technology.category} ${technology.description}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(term => term.length > 3 && !ignored.has(term))
  const ranked = project.engineeringHighlights
    .map(highlight => ({ highlight, score: terms.reduce((score, term) => score + (highlight.toLowerCase().includes(term) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score)
  return ranked[0]?.score ? ranked[0].highlight : project.engineeringHighlights[0] ?? project.shortDescription
}

function createExplorerNodes(_compact: boolean): ExplorerNode[] {
  const visibleProjects = projects
  const visibleTechnologies = technologies
  const projectNodes = visibleProjects.map((project, index) => ({
    id: project.id, name: project.title, kind: 'project' as const, importance: project.graph.importance, connections: connectionCount(project.id),
    x: 380 + Math.cos(index * 1.7) * 105, y: 310 + Math.sin(index * 1.7) * 95,
  }))
  const technologyNodes = visibleTechnologies.map((technology, index) => {
    const domainId = primaryDomainFor(technology.id)
    const anchor = domainPositions[domainId ?? 'backend'] ?? [.5, .5]
    const angle = index * Math.PI * (3 - Math.sqrt(5))
    return {
      id: technology.id, name: technology.name, kind: 'technology' as const, importance: technology.graph.importance, connections: connectionCount(technology.id), domainId,
      x: anchor[0] * 760 + Math.cos(angle) * 24, y: anchor[1] * 620 + Math.sin(angle) * 20,
    }
  })
  return [...projectNodes, ...technologyNodes]
}

function createExplorerLinks(nodes: ExplorerNode[]): ExplorerLink[] {
  const ids = new Set(nodes.map(node => node.id))
  const visible = relationships.filter(link => ids.has(link.from) && ids.has(link.to))
  const retained = visible.filter(link => link.type === 'implemented-with' || link.strength === 'strong')
  const linkedTechnologies = new Set(retained.flatMap(link => [link.from, link.to]).filter(id => technologies.some(technology => technology.id === id)))
  technologies.forEach(technology => {
    if (!ids.has(technology.id) || linkedTechnologies.has(technology.id)) return
    const evidenceLink = visible.find(link => link.type === 'uses' && link.to === technology.id)
    if (evidenceLink) retained.push(evidenceLink)
  })
  return retained.map(link => ({
    id: link.id, source: link.from, target: link.to, kind: link.type,
  }))
}

function entityConnections(entity: ExplorerEntity) {
  const connected = new Set<string>()
  if (!entity) return connected
  connected.add(entity.id)
  relationships.forEach(link => {
    if (link.from === entity.id) connected.add(link.to)
    if (link.to === entity.id) connected.add(link.from)
  })
  return connected
}

function TechnologyInspector({ entity, domainId, onEntity, onDomain, onDomainHover, onOpen }: {
  entity: ExplorerEntity
  domainId: string | null
  onEntity: (entity: ExplorerEntity) => void
  onDomain: (id: string | null) => void
  onDomainHover: (id: string | null) => void
  onOpen: (selection: Exclude<Selection, null>) => void
}) {
  const technology = entity?.kind === 'technology' ? technologies.find(item => item.id === entity.id) : undefined
  const project = entity?.kind === 'project' ? projects.find(item => item.id === entity.id) : undefined
  const domain = domainId ? domains.find(item => item.id === domainId) : undefined

  if (technology) {
    const evidence = technology.evidenceProjects.map(id => projects.find(item => item.id === id)).filter(Boolean) as Project[]
    const repositoryVerified = evidence.filter(item => item.verification === 'repo-verified').length
    return <aside className="technology-inspector" aria-live="polite">
      <header><span>Selected technology</span><button type="button" onClick={() => onEntity(null)}>Clear</button></header>
      <div className="technology-inspector-object"><i aria-hidden="true" /><div><p>{technology.category}, {technology.proficiency}</p><h3>{technology.name}</h3></div></div>
      <p className="technology-inspector-description">{technology.description}</p>
      <div className="technology-evidence"><span>Used in</span>{evidence.map(item => <button key={item.id} type="button" onClick={() => onEntity({ kind: 'project', id: item.id })}><span><strong>{item.title}</strong><small>{evidenceLine(technology, item)}</small></span><em>{statusLabel(item.status)}</em></button>)}</div>
      <dl><div><dt>Projects</dt><dd>{evidence.length}</dd></div><div><dt>Verified</dt><dd>{repositoryVerified} repositor{repositoryVerified === 1 ? 'y' : 'ies'}</dd></div><div><dt>Level</dt><dd>{technology.proficiency}</dd></div></dl>
      <button className="inspector-open" type="button" onClick={() => onOpen({ kind: 'technology', id: technology.id })}>Open on the map <Icon name="forward" /></button>
    </aside>
  }

  if (project) {
    const stack = project.graph.primaryTechnologies.map(id => technologies.find(item => item.id === id)).filter(Boolean) as Technology[]
    return <aside className="technology-inspector" aria-live="polite">
      <header><span>Selected project</span><button type="button" onClick={() => onEntity(null)}>Clear</button></header>
      <div className="technology-inspector-object is-project"><i aria-hidden="true" /><div><p>{statusLabel(project.status)}</p><h3>{project.title}</h3></div></div>
      <p className="technology-inspector-description">{project.shortDescription}</p>
      <div className="technology-stack-list"><span>Primary relationships</span>{stack.map(item => <button key={item.id} type="button" onClick={() => onEntity({ kind: 'technology', id: item.id })}>{item.name}</button>)}</div>
      <dl><div><dt>Role</dt><dd>{project.role}</dd></div><div><dt>Tier</dt><dd>{project.tier}</dd></div></dl>
      <button className="inspector-open" type="button" onClick={() => onOpen({ kind: 'project', id: project.id })}>Open on the map <Icon name="forward" /></button>
    </aside>
  }

  return <aside className="technology-inspector">
    <header><span>{domain ? 'Domain focus' : 'Map index'}</span>{domain && <button type="button" onClick={() => onDomain(null)}>Clear</button>}</header>
    <div className="technology-inspector-intro"><p>{domain ? 'Engineering domain' : 'Explore by domain'}</p><h3>{domain?.name ?? 'Technology map'}</h3><span>{domain?.description ?? 'Select a domain or object to inspect evidence from the projects that use it.'}</span></div>
    <div className="domain-filter-list" aria-label="Technology domains">{domains.map(item => <button key={item.id} type="button" className={item.id === domainId ? 'is-active' : ''} onPointerEnter={() => onDomainHover(item.id)} onPointerLeave={() => onDomainHover(null)} onFocus={() => onDomainHover(item.id)} onBlur={() => onDomainHover(null)} onClick={() => onDomain(item.id === domainId ? null : item.id)}><span>{item.name}</span><small>{item.technologies.length}</small></button>)}</div>
  </aside>
}

export default function TechnologyExplorer({ compact, reducedMotion, onOpen }: {
  compact: boolean
  reducedMotion: boolean
  onOpen: (selection: Exclude<Selection, null>) => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>())
  const edgeRefs = useRef(new Map<string, SVGLineElement>())
  const simulationRef = useRef<Simulation<ExplorerNode, ExplorerLink> | null>(null)
  const boundsRef = useRef({ width: 760, height: 620 })
  const settledRef = useRef(false)
  const near = useNearViewport(rootRef)
  const nodes = useMemo(() => createExplorerNodes(compact), [compact])
  const links = useMemo(() => createExplorerLinks(nodes), [nodes])
  const [entity, setEntity] = useState<ExplorerEntity>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const activeDomain = hoveredDomain ?? selectedDomain
  const connected = useMemo(() => entityConnections(entity), [entity])
  const highlightedIds = useMemo(() => {
    if (hoveredId) {
      const node = nodes.find(item => item.id === hoveredId)
      return entityConnections(node ? { kind: node.kind, id: hoveredId } : null)
    }
    if (entity) return connected
    if (activeDomain) {
      const domain = domains.find(item => item.id === activeDomain)
      const ids = new Set(domain?.technologies ?? [])
      domain?.projects.forEach(id => ids.add(id))
      return ids
    }
    return new Set<string>()
  }, [activeDomain, connected, entity, hoveredId, nodes])

  useEffect(() => {
    const root = rootRef.current
    // Nothing is measured or simulated until the map approaches the viewport.
    if (!root || !near) return
    const rect = root.getBoundingClientRect()
    const width = Math.max(320, rect.width)
    const height = Math.max(430, rect.height)
    boundsRef.current = { width, height }
    nodes.forEach(node => { node.x = (node.x ?? width / 2) * width / 760; node.y = (node.y ?? height / 2) * height / 620 })
    const render = () => {
      const bounds = boundsRef.current
      nodes.forEach(node => {
        node.x = Math.max(12, Math.min(bounds.width - 12, node.x ?? 0))
        node.y = Math.max(16, Math.min(bounds.height - 16, node.y ?? 0))
        const element = nodeRefs.current.get(node.id)
        if (!element) return
        const alignRight = node.x > bounds.width * .72
        const align = alignRight ? 'right' : 'left'
        if (element.dataset.align !== align) element.dataset.align = align
        element.style.transform = `translate3d(${node.x}px,${node.y}px,0) translate(${alignRight ? '-100%' : '0'},-50%)`
      })
      links.forEach(link => {
        const source = typeof link.source === 'string' ? nodes.find(node => node.id === link.source) : link.source
        const target = typeof link.target === 'string' ? nodes.find(node => node.id === link.target) : link.target
        const edge = edgeRefs.current.get(link.id)
        if (!source || !target || !edge) return
        edge.setAttribute('x1', String(source.x ?? 0)); edge.setAttribute('y1', String(source.y ?? 0)); edge.setAttribute('x2', String(target.x ?? 0)); edge.setAttribute('y2', String(target.y ?? 0))
      })
    }
    const targetX = (node: ExplorerNode, w: number) => node.kind === 'project' ? w * .5 : w * (domainPositions[node.domainId ?? 'backend']?.[0] ?? .5)
    const targetY = (node: ExplorerNode, h: number) => node.kind === 'project' ? h * .5 : h * (domainPositions[node.domainId ?? 'backend']?.[1] ?? .5)
    const simulation = forceSimulation<ExplorerNode>(nodes)
      .force('link', forceLink<ExplorerNode, ExplorerLink>(links).id(node => node.id).distance(link => link.kind === 'uses' ? 96 : 116).strength(link => link.kind === 'uses' ? .2 : .09))
      .force('charge', forceManyBody<ExplorerNode>().strength(node => node.kind === 'project' ? -155 : -88).distanceMin(18).distanceMax(300))
      .force('collision', forceCollide<ExplorerNode>().radius(node => node.kind === 'project' ? 43 : 29).strength(.72))
      .force('x', forceX<ExplorerNode>(node => targetX(node, width)).strength(node => node.kind === 'project' ? .018 : .065))
      .force('y', forceY<ExplorerNode>(node => targetY(node, height)).strength(node => node.kind === 'project' ? .018 : .065))
      .velocityDecay(.46).alphaDecay(reducedMotion ? .18 : .072).alphaMin(.003).on('tick', render).on('end', render)
    simulationRef.current = simulation
    if (!compact && !reducedMotion) {
      const dragBehaviour = drag<HTMLButtonElement, ExplorerNode>().container(() => root).clickDistance(5)
        .on('start', (_event: D3DragEvent<HTMLButtonElement, ExplorerNode, ExplorerNode>, node) => { node.fx = node.x; node.fy = node.y; simulation.alpha(Math.max(simulation.alpha(), .1)).alphaTarget(.14).restart(); nodeRefs.current.get(node.id)?.classList.add('is-dragging') })
        .on('drag', (event: D3DragEvent<HTMLButtonElement, ExplorerNode, ExplorerNode>, node) => { node.fx = event.x; node.fy = event.y })
        .on('end', (_event: D3DragEvent<HTMLButtonElement, ExplorerNode, ExplorerNode>, node) => { node.fx = null; node.fy = null; simulation.alphaTarget(0); nodeRefs.current.get(node.id)?.classList.remove('is-dragging') })
      nodes.forEach(node => { const element = nodeRefs.current.get(node.id); if (element) selectElement(element).datum(node).call(dragBehaviour) })
    }
    const resizeObserver = new ResizeObserver(entries => {
      const next = entries[0]?.contentRect
      if (!next || next.width < 1 || next.height < 1) return
      const previous = boundsRef.current
      if (Math.abs(previous.width - next.width) < 1 && Math.abs(previous.height - next.height) < 1) return
      boundsRef.current = { width: next.width, height: next.height }
      simulation.force('x', forceX<ExplorerNode>(node => targetX(node, next.width)).strength(node => node.kind === 'project' ? .018 : .065))
      simulation.force('y', forceY<ExplorerNode>(node => targetY(node, next.height)).strength(node => node.kind === 'project' ? .018 : .065))
      simulation.alpha(.12).restart()
    })
    resizeObserver.observe(root)
    simulation.stop()
    settledRef.current = false
    return () => { resizeObserver.disconnect(); simulation.stop(); simulationRef.current = null }
  }, [compact, links, near, nodes, reducedMotion])

  useEffect(() => {
    const simulation = simulationRef.current
    const root = rootRef.current
    if (!simulation || !root) return
    const rect = root.getBoundingClientRect()
    const focus = entity?.id
    const domain = selectedDomain ? domains.find(item => item.id === selectedDomain) : undefined
    const inFocusedDomain = (node: ExplorerNode) => Boolean(domain && (domain.technologies.includes(node.id) || domain.projects.includes(node.id)))
    const targetX = (node: ExplorerNode) => focus && connected.has(node.id) || inFocusedDomain(node) ? rect.width * .5 : node.kind === 'project' ? rect.width * .5 : rect.width * (domainPositions[node.domainId ?? 'backend']?.[0] ?? .5)
    const targetY = (node: ExplorerNode) => focus && connected.has(node.id) || inFocusedDomain(node) ? rect.height * .5 : node.kind === 'project' ? rect.height * .5 : rect.height * (domainPositions[node.domainId ?? 'backend']?.[1] ?? .5)
    const strength = (node: ExplorerNode) => node.id === focus ? .17 : focus && connected.has(node.id) ? .04 : inFocusedDomain(node) ? .07 : node.kind === 'project' ? .015 : .055
    simulation.force('x', forceX<ExplorerNode>(targetX).strength(strength)).force('y', forceY<ExplorerNode>(targetY).strength(strength))
    // The first layout settles across frames once the map nears the viewport
    // (tick() emits no events, so render by hand).
    const renderNow = () => (simulation.on('tick') as (() => void) | undefined)?.()
    if (!settledRef.current) { settledRef.current = true; simulation.stop(); simulation.alpha(.7); return settleWhenNear(root, simulation, reducedMotion ? 80 : 170, renderNow, 20) }
    if (reducedMotion) { simulation.stop(); simulation.alpha(.18).tick(44); renderNow(); return }
    simulation.alpha(Math.max(simulation.alpha(), .2)).restart()
  }, [connected, entity, near, reducedMotion, selectedDomain])

  const hasFilter = highlightedIds.size > 0
  const activeDomainName = domains.find(domain => domain.id === activeDomain)?.name
  const showAll = () => { setSelectedDomain(null); setHoveredDomain(null); setEntity(null) }
  return <div className={`technology-explorer ${expanded ? 'is-map-expanded' : ''}`}>
    <div className="technology-map-shell"><header><div><span className="map-status-dot" aria-hidden="true" />Evidence map</div><div className="technology-map-context">{activeDomainName && <strong>{activeDomainName}</strong>}{(selectedDomain || entity) && <button type="button" onClick={showAll}>Show all</button>}{compact && <button type="button" onClick={() => setExpanded(value => !value)}>{expanded ? 'Compact map' : 'Explore map'}</button>}<p>{compact ? 'Tap an object to inspect' : 'Drag objects to rearrange, select one to inspect it'}</p></div></header>
      <div ref={rootRef} className="technology-map" aria-label="Interactive technology evidence map">
        <svg aria-hidden="true"><g>{links.map(link => { const source = endpointId(link.source); const target = endpointId(link.target); const active = highlightedIds.has(source) && highlightedIds.has(target); return <line key={link.id} ref={element => { if (element) edgeRefs.current.set(link.id, element); else edgeRefs.current.delete(link.id) }} className={`${link.kind === 'uses' ? 'is-project-link' : 'is-technology-link'} ${hasFilter ? active ? 'is-active' : 'is-dimmed' : 'is-idle'}`} /> })}</g></svg>
        <div className="technology-map-nodes">{nodes.map(node => { const active = !hasFilter || highlightedIds.has(node.id); const selected = entity?.id === node.id; const projectColor = node.kind === 'project' ? getProjectNodeColor(node.id) : null; const size = node.kind === 'project' ? 7 + Math.sqrt(node.connections + 1) * 2.25 : 3.5 + Math.sqrt(node.connections + 1) * 1.55; const importantTechnology = compact ? node.importance >= 4.8 || node.connections >= 8 : node.importance >= 4.2 || node.connections >= 6; const labelTier = node.kind === 'project' ? 'project' : importantTechnology ? 'core' : 'detail'; return <button key={node.id} ref={element => { if (element) nodeRefs.current.set(node.id, element); else nodeRefs.current.delete(node.id) }} type="button" className={`technology-map-node is-${node.kind} ${hasFilter ? active ? 'is-related' : 'is-dimmed' : 'is-idle'} ${selected ? 'is-selected' : ''}`} data-label-tier={labelTier} tabIndex={labelTier === 'project' || labelTier === 'core' ? 0 : -1} style={{ '--map-node-size': `${size}px`, '--project-node-color': projectColor?.color, '--node-color': entityColor(node.kind, node.id), '--project-node-rgb': projectColor?.rgb } as CSSProperties} onPointerEnter={() => setHoveredId(node.id)} onPointerLeave={() => setHoveredId(null)} onFocus={() => setHoveredId(node.id)} onBlur={() => setHoveredId(null)} onClick={() => setEntity({ kind: node.kind, id: node.id })} aria-label={`${node.name}, ${node.connections} connections`} aria-pressed={selected}><i aria-hidden="true" /><span>{node.name}</span></button> })}</div>
        <div className="technology-map-regions" aria-hidden="true">{domains.filter(domain => domain.graph.visibility === 'primary').map(domain => <span key={domain.id} style={{ left: `${(domainPositions[domain.id]?.[0] ?? .5) * 100}%`, top: `${(domainPositions[domain.id]?.[1] ?? .5) * 100}%` }}>{domain.name}</span>)}</div>
      </div>
    </div>
    <TechnologyInspector entity={entity} domainId={selectedDomain} onEntity={setEntity} onDomain={setSelectedDomain} onDomainHover={setHoveredDomain} onOpen={onOpen} />
    <div className="technology-accessible-index"><header><span>Technology index</span><p>Evidence counts are derived from implemented projects.</p></header><div>{domains.map(domain => <article key={domain.id}><button type="button" onPointerEnter={() => setHoveredDomain(domain.id)} onPointerLeave={() => setHoveredDomain(null)} onFocus={() => setHoveredDomain(domain.id)} onBlur={() => setHoveredDomain(null)} onClick={() => { setSelectedDomain(domain.id); setEntity(null) }}>{domain.name}</button><p>{domain.technologies.map(id => { const technology = technologies.find(item => item.id === id); return technology ? <button key={id} type="button" onClick={() => setEntity({ kind: 'technology', id })}>{technology.name}<small>{technology.evidenceProjects.length}</small></button> : null })}</p></article>)}</div></div>
  </div>
}
