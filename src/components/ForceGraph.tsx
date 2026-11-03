import { drag } from 'd3-drag'
import type { D3DragEvent } from 'd3-drag'
import { select as selectElement } from 'd3-selection'
import { zoom, zoomIdentity } from 'd3-zoom'
import type { D3ZoomEvent, ZoomBehavior, ZoomTransform } from 'd3-zoom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import type { Selection } from '../data/portfolio'
import {
  configureSimulation,
  createGraphSimulation,
  createPhysicsLinks,
  createPhysicsNodes,
  DEFAULT_PHYSICS,
  linkIds,
  linkKey,
  reheatSimulation,
} from '../graph/physics'
import type { GraphDimensions, PhysicsNode, PhysicsSettings } from '../graph/physics'
import { getProjectNodeColor } from '../graph/colors'
import { isConnected, isGraphNodeVisible, relatedIds } from '../graph/model'

interface ForceGraphProps {
  selection: Selection
  hoveredId: string | null
  emphasis: string[]
  compact: boolean
  reducedMotion: boolean
  interactive?: boolean
  onHover: (id: string | null) => void
  onSelect: (selection: Selection) => void
}

const initialDimensions: GraphDimensions = { width: 1200, height: 720 }

function configurationKey(selection: Selection, compact: boolean, reducedMotion: boolean, settings: PhysicsSettings) {
  return `${selection ? `${selection.kind}:${selection.id}` : 'home'}:${compact}:${reducedMotion}:${Object.values(settings).join(':')}`
}

function PhysicsControls({ settings, onChange }: { settings: PhysicsSettings; onChange: (settings: PhysicsSettings) => void }) {
  const controls: Array<{ key: keyof PhysicsSettings; label: string; min: number; max: number; step: number }> = [
    { key: 'centerStrength', label: 'Center force', min: 0, max: .08, step: .002 },
    { key: 'chargeStrength', label: 'Repel force', min: -220, max: -30, step: 2 },
    { key: 'linkStrength', label: 'Link force', min: .04, max: .5, step: .01 },
    { key: 'linkDistance', label: 'Link distance', min: 60, max: 180, step: 2 },
    { key: 'velocityDecay', label: 'Velocity decay', min: .15, max: .75, step: .01 },
    { key: 'alphaDecay', label: 'Alpha decay', min: .015, max: .15, step: .003 },
    { key: 'dragAlphaTarget', label: 'Drag energy', min: .05, max: .35, step: .01 },
    { key: 'collisionRadius', label: 'Collision radius', min: 12, max: 46, step: 1 },
  ]

  return (
    <details className="physics-controls">
      <summary>Physics</summary>
      <div>
        {controls.map(control => (
          <label key={control.key}>
            <span>{control.label}<output>{settings[control.key].toFixed(control.step < .01 ? 3 : control.step < 1 ? 2 : 0)}</output></span>
            <input
              type="range"
              min={control.min}
              max={control.max}
              step={control.step}
              value={settings[control.key]}
              onChange={event => onChange({ ...settings, [control.key]: Number(event.target.value) })}
            />
          </label>
        ))}
      </div>
    </details>
  )
}

export default function ForceGraph({ selection, hoveredId, emphasis, compact, reducedMotion, interactive = true, onHover, onSelect }: ForceGraphProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const nodeLayerRef = useRef<HTMLDivElement>(null)
  const edgeLayerRef = useRef<SVGGElement>(null)
  const statusRef = useRef<HTMLSpanElement>(null)
  const nodeElements = useRef(new Map<string, HTMLButtonElement>())
  const edgeElements = useRef(new Map<string, SVGLineElement>())
  const physicsNodes = useRef<PhysicsNode[] | null>(null)
  const simulationRef = useRef<ReturnType<typeof createGraphSimulation> | null>(null)
  const zoomBehaviorRef = useRef<ZoomBehavior<HTMLDivElement, unknown> | null>(null)
  const zoomTransformRef = useRef<ZoomTransform>(zoomIdentity)
  const clickScrollRef = useRef<number | null>(null)
  const dimensionsRef = useRef<GraphDimensions>(initialDimensions)
  const selectionRef = useRef(selection)
  const compactRef = useRef(compact)
  const reducedMotionRef = useRef(reducedMotion)
  const [settings, setSettings] = useState(DEFAULT_PHYSICS)
  const settingsRef = useRef(settings)
  const configurationKeyRef = useRef('')
  const interactiveRef = useRef(interactive)
  const projectAlignRef = useRef(new Map<string, boolean>())
  interactiveRef.current = interactive
  selectionRef.current = selection
  compactRef.current = compact
  reducedMotionRef.current = reducedMotion
  settingsRef.current = settings

  if (!physicsNodes.current) physicsNodes.current = createPhysicsNodes(initialDimensions, compact)
  const renderLinks = useMemo(() => createPhysicsLinks(), [])
  const selectedRelated = selection?.kind === 'project' && emphasis.length
    ? new Set([selection.id, ...emphasis])
    : relatedIds(selection, emphasis)
  const hasSemanticFilter = Boolean(selection) || emphasis.length > 0

  const renderPositions = useCallback(() => {
    const nodes = physicsNodes.current
    if (!nodes) return
    const byId = new Map(nodes.map(node => [node.id, node]))
    for (const node of nodes) {
      const element = nodeElements.current.get(node.id)
      if (!element) continue
      const bounds = dimensionsRef.current
      const x = Math.max(18, Math.min(bounds.width - 18, node.x ?? bounds.width / 2))
      const y = Math.max(18, Math.min(bounds.height - 18, node.y ?? bounds.height / 2))
      node.x = x
      node.y = y
      const alignRight = projectAlignRef.current.get(node.id) ?? x > dimensionsRef.current.width * .78
      const align = alignRight ? 'right' : 'left'
      if (element.dataset.align !== align) element.dataset.align = align
      element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(${alignRight ? '-100%' : '0'}, -50%)`
    }
    // Label layout only matters while the constellation is in front; in the
    // background it is faint, so skip the collision pass on every tick.
    if (!interactiveRef.current) { renderEdges(); return }
    type LabelBox = { left: number; right: number; top: number; bottom: number }
    const acceptedLabels: LabelBox[] = []
    const collides = (box: LabelBox) => acceptedLabels.some(other => box.left < other.right + 4 && box.right > other.left - 4 && box.top < other.bottom + 3 && box.bottom > other.top - 3)
    const labelBox = (x: number, y: number, width: number, height: number, rightAligned: boolean): LabelBox => ({ left: rightAligned ? x - width - 10 : x + 10, right: rightAligned ? x - 10 : x + width + 10, top: y - height / 2, bottom: y + height / 2 })
    const labelOrder = [...nodes].sort((a, b) => Number(b.kind === 'project') - Number(a.kind === 'project') || b.importance - a.importance)
    for (const node of labelOrder) {
      const element = nodeElements.current.get(node.id)
      if (!element) continue
      const tier = element.dataset.labelTier
      if (tier === 'detail') { element.classList.remove('is-label-occluded'); continue }
      const x = node.x ?? dimensionsRef.current.width / 2
      const y = node.y ?? dimensionsRef.current.height / 2
      if (node.kind === 'project') {
        // Projects always keep a label: try the other side, then drop the meta line.
        const nameWidth = node.name.length * 8.4 + 14
        const fullWidth = Math.min(240, Math.max(nameWidth, 190))
        const defaultRight = x > dimensionsRef.current.width * .78
        let rightAligned = defaultRight
        let box = labelBox(x, y, fullWidth, 32, rightAligned)
        if (collides(box)) {
          const flipped = labelBox(x, y, fullWidth, 32, !rightAligned)
          if (!collides(flipped) && flipped.left > 0 && flipped.right < dimensionsRef.current.width) { rightAligned = !rightAligned; box = flipped }
        }
        const compactLabel = collides(box)
        if (compactLabel) box = labelBox(x, y, Math.min(240, nameWidth), 16, rightAligned)
        if (rightAligned === defaultRight) projectAlignRef.current.delete(node.id)
        else projectAlignRef.current.set(node.id, rightAligned)
        const align = rightAligned ? 'right' : 'left'
        if (element.dataset.align !== align) {
          element.dataset.align = align
          element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(${rightAligned ? '-100%' : '0'}, -50%)`
        }
        element.classList.toggle('is-meta-hidden', compactLabel)
        element.classList.remove('is-label-occluded')
        acceptedLabels.push(box)
        continue
      }
      const box = labelBox(x, y, Math.min(140, Math.max(34, node.name.length * 6.8 + 14)), 16, element.dataset.align === 'right')
      const overlaps = collides(box)
      element.classList.toggle('is-label-occluded', overlaps)
      if (!overlaps) acceptedLabels.push(box)
    }
    renderEdges()

    function renderEdges() {
      for (const link of renderLinks) {
        const [sourceId, targetId] = linkIds(link)
        const source = byId.get(sourceId)
        const target = byId.get(targetId)
        const line = edgeElements.current.get(linkKey(link))
        if (!source || !target || !line) continue
        line.setAttribute('x1', String(source.x ?? 0))
        line.setAttribute('y1', String(source.y ?? 0))
        line.setAttribute('x2', String(target.x ?? 0))
        line.setAttribute('y2', String(target.y ?? 0))
      }
    }
  }, [renderLinks])

  // Refresh label layout when the constellation comes back to the front.
  useEffect(() => { if (interactive) renderPositions() }, [interactive, renderPositions])

  const applyViewTransform = useCallback((transform: ZoomTransform) => {
    zoomTransformRef.current = transform
    if (edgeLayerRef.current) edgeLayerRef.current.setAttribute('transform', transform.toString())
    if (nodeLayerRef.current) nodeLayerRef.current.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`
    const root = rootRef.current
    if (root) {
      root.dataset.zoom = transform.k < .86 ? 'far' : transform.k > 1.28 ? 'near' : 'medium'
      root.style.setProperty('--graph-scale', String(transform.k))
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    const nodes = physicsNodes.current
    if (!root || !nodes) return

    const rect = root.getBoundingClientRect()
    const dimensions = { width: Math.max(rect.width, 320), height: Math.max(rect.height, 360) }
    dimensionsRef.current = dimensions
    nodes.forEach(node => {
      node.x = (node.x ?? initialDimensions.width / 2) * dimensions.width / initialDimensions.width
      node.y = (node.y ?? initialDimensions.height / 2) * dimensions.height / initialDimensions.height
      node.homeX = node.x
      node.homeY = node.y
    })

    const simulation = createGraphSimulation(nodes)
    simulationRef.current = simulation
    configureSimulation(simulation, settingsRef.current, selectionRef.current, dimensions, compactRef.current)
    configurationKeyRef.current = configurationKey(selectionRef.current, compactRef.current, reducedMotionRef.current, settingsRef.current)
    simulation.on('tick.render', () => {
      renderPositions()
      root.dataset.simulation = simulation.alpha() > .025 ? 'active' : 'settling'
      root.dataset.alpha = simulation.alpha().toFixed(3)
      if (statusRef.current) statusRef.current.textContent = simulation.alpha() > .025 ? 'Resolving' : 'Settling'
    })
    simulation.on('end.render', () => {
      renderPositions()
      root.dataset.simulation = 'settled'
      root.dataset.alpha = '0.000'
      if (statusRef.current) statusRef.current.textContent = 'Settled'
    })

    const view = selectElement(root)
    const zoomBehavior = zoom<HTMLDivElement, unknown>()
      .scaleExtent([.7, 1.8])
      .filter(event => {
        const target = event.target as Element | null
        if (target?.closest('.force-node, .physics-controls, .graph-view-controls')) return false
        if (event.type === 'wheel') return false
        if (compactRef.current) return false
        return !event.button
      })
      .on('zoom.graph', (event: D3ZoomEvent<HTMLDivElement, unknown>) => applyViewTransform(event.transform))
    zoomBehaviorRef.current = zoomBehavior
    view.call(zoomBehavior).on('dblclick.zoom', null)
    applyViewTransform(zoomIdentity)

    const dragBehavior = drag<HTMLButtonElement, PhysicsNode>()
      .container(() => root)
      .clickDistance(5)
      .on('start.graph', (_event: D3DragEvent<HTMLButtonElement, PhysicsNode, PhysicsNode>, node) => {
        if (reducedMotionRef.current) return
        node.fx = node.x
        node.fy = node.y
        const simulationNow = simulationRef.current
        simulationNow?.alpha(Math.max(simulationNow.alpha(), .11)).alphaTarget(settingsRef.current.dragAlphaTarget).restart()
        nodeElements.current.get(node.id)?.classList.add('is-dragging')
      })
      .on('drag.graph', (event: D3DragEvent<HTMLButtonElement, PhysicsNode, PhysicsNode>, node) => {
        if (reducedMotionRef.current) return
        const source = event.sourceEvent as MouseEvent | TouchEvent
        const point = 'clientX' in source ? source : source.touches[0]
        const bounds = root.getBoundingClientRect()
        const transform = zoomTransformRef.current
        node.fx = (point.clientX - bounds.left - transform.x) / transform.k
        node.fy = (point.clientY - bounds.top - transform.y) / transform.k
      })
      .on('end.graph', (_event: D3DragEvent<HTMLButtonElement, PhysicsNode, PhysicsNode>, node) => {
        node.fx = null
        node.fy = null
        simulationRef.current?.alphaTarget(0)
        nodeElements.current.get(node.id)?.classList.remove('is-dragging')
      })

    for (const node of nodes) {
      const element = nodeElements.current.get(node.id)
      if (element) selectElement(element).datum(node).call(dragBehavior)
    }

    const resizeObserver = new ResizeObserver(entries => {
      const nextRect = entries[0]?.contentRect
      if (!nextRect || nextRect.width < 1 || nextRect.height < 1) return
      const previous = dimensionsRef.current
      if (Math.abs(previous.width - nextRect.width) < 1 && Math.abs(previous.height - nextRect.height) < 1) return
      dimensionsRef.current = { width: nextRect.width, height: nextRect.height }
      configureSimulation(simulation, settingsRef.current, selectionRef.current, dimensionsRef.current, compactRef.current)
      reheatSimulation(simulation, .1, reducedMotionRef.current)
      renderPositions()
    })
    resizeObserver.observe(root)

    if (reducedMotionRef.current) {
      simulation.alpha(.24).tick(48).alpha(0).stop()
      renderPositions()
      root.dataset.simulation = 'settled'
      root.dataset.alpha = '0.000'
      if (statusRef.current) statusRef.current.textContent = 'Settled'
    } else {
      // Nodes start on their home slots and settle on screen over the first
      // second instead of blocking first paint with a synchronous layout.
      simulation.alpha(.62).tick(8)
      renderPositions()
      simulation.alpha(.5).restart()
    }

    return () => {
      resizeObserver.disconnect()
      view.on('.zoom', null)
      simulation.stop().on('tick.render', null).on('end.render', null)
      simulationRef.current = null
    }
  }, [applyViewTransform, renderPositions])

  useEffect(() => {
    const simulation = simulationRef.current
    if (!simulation) return
    const nextKey = configurationKey(selection, compact, reducedMotion, settings)
    if (configurationKeyRef.current === nextKey) return
    configurationKeyRef.current = nextKey
    configureSimulation(simulation, settings, selection, dimensionsRef.current, compact)
    reheatSimulation(simulation, selection ? .24 : .2, reducedMotion)
    renderPositions()
  }, [compact, reducedMotion, renderPositions, selection, settings])

  const resetView = () => {
    const root = rootRef.current
    const zoomBehavior = zoomBehaviorRef.current
    if (!root || !zoomBehavior) return
    selectElement(root).call(zoomBehavior.transform, zoomIdentity)
  }

  const changeZoom = (factor: number) => {
    const root = rootRef.current
    const zoomBehavior = zoomBehaviorRef.current
    if (!root || !zoomBehavior) return
    selectElement(root).call(zoomBehavior.scaleBy, factor)
  }

  const nudgeNode = (id: string, event: KeyboardEvent<HTMLButtonElement>) => {
    const direction = event.key === 'ArrowLeft' ? [-1, 0] : event.key === 'ArrowRight' ? [1, 0] : event.key === 'ArrowUp' ? [0, -1] : event.key === 'ArrowDown' ? [0, 1] : null
    if (!direction) return
    event.preventDefault()
    const node = physicsNodes.current?.find(candidate => candidate.id === id)
    if (!node) return
    const distance = event.shiftKey ? 18 : 9
    node.x = (node.x ?? dimensionsRef.current.width / 2) + direction[0] * distance
    node.y = (node.y ?? dimensionsRef.current.height / 2) + direction[1] * distance
    node.vx = direction[0] * 1.2
    node.vy = direction[1] * 1.2
    if (reducedMotion) renderPositions()
    else {
      const simulation = simulationRef.current
      if (simulation) simulation.alpha(Math.max(simulation.alpha(), .08)).restart()
    }
  }

  return (
    <div ref={rootRef} className={`force-graph ${interactive ? 'is-interactive' : 'is-passive'}`} data-zoom="medium" data-simulation="initialising" aria-label="Interactive portfolio constellation" aria-hidden={!interactive}>
      <svg className="force-edges" aria-hidden="true">
        <g ref={edgeLayerRef}>
          {renderLinks.filter(link => {
            const [source, target] = linkIds(link)
            return isGraphNodeVisible(source, selection, compact) && isGraphNodeVisible(target, selection, compact)
          }).map(link => {
            const [source, target] = linkIds(link)
            const relatedToSelection = !hasSemanticFilter || selectedRelated.has(source) && selectedRelated.has(target)
            const relatedToHover = !hoveredId || source === hoveredId || target === hoveredId
            return (
              <line
                key={linkKey(link)}
                ref={element => { if (element) edgeElements.current.set(linkKey(link), element); else edgeElements.current.delete(linkKey(link)) }}
                className={`${link.kind}-edge ${relatedToSelection && relatedToHover ? 'is-active' : 'is-dimmed'} ${selection && (source === selection.id || target === selection.id) ? 'is-selected' : ''}`}
              />
            )
          })}
        </g>
      </svg>

      <div ref={nodeLayerRef} className="force-node-layer">
        {physicsNodes.current.map(node => {
          const relatedToSelection = !hasSemanticFilter || selectedRelated.has(node.id)
          const relatedToHover = !hoveredId || isConnected(node.id, hoveredId)
          const hidden = !isGraphNodeVisible(node.id, selection, compact)
          const projectColor = node.kind === 'project' ? getProjectNodeColor(node.id) : null
          const alignRight = (node.x ?? 0) > dimensionsRef.current.width * .78
          const importantTechnology = compact ? node.importance >= 4.8 || node.connections.length >= 8 : node.importance >= 4.2 || node.connections.length >= 6
          const labelTier = node.kind === 'project' ? 'project' : node.kind === 'technology' && importantTechnology ? 'core' : node.kind === 'domain' ? 'domain' : 'detail'
          return (
            <button
              key={node.id}
              ref={element => { if (element) nodeElements.current.set(node.id, element); else nodeElements.current.delete(node.id) }}
              type="button"
              className={`force-node is-${node.kind} ${node.size >= 1 ? 'is-core' : ''} ${selection?.id === node.id ? 'is-selected' : ''} ${hasSemanticFilter && selectedRelated.has(node.id) ? 'is-selection-related' : ''} ${!relatedToSelection || !relatedToHover ? 'is-dimmed' : ''} ${hidden ? 'is-outside' : ''}`}
              style={{ transform: `translate3d(${node.x ?? 0}px, ${node.y ?? 0}px, 0) translate(${alignRight ? '-100%' : '0'}, -50%)`, '--node-scale': node.size, '--project-node-color': projectColor?.color, '--project-node-rgb': projectColor?.rgb } as CSSProperties}
              data-align={alignRight ? 'right' : 'left'}
              data-importance={node.importance}
              data-label-tier={labelTier}
              aria-label={`${node.name}, ${node.category}, ${node.connections.length} connections`}
              aria-pressed={selection?.id === node.id}
              aria-hidden={hidden}
              tabIndex={hidden || !interactive || node.kind !== 'project' && selection?.id !== node.id ? -1 : 0}
              onPointerDown={() => { clickScrollRef.current = window.scrollY }}
              onPointerEnter={() => onHover(node.id)}
              onPointerLeave={() => onHover(null)}
              onFocus={() => onHover(node.id)}
              onBlur={() => onHover(null)}
              onKeyDown={event => nudgeNode(node.id, event)}
              onClick={event => {
                const preservedScroll = clickScrollRef.current
                clickScrollRef.current = null
                onSelect({ kind: node.kind, id: node.id })
                event.currentTarget.blur()
                if (preservedScroll !== null) {
                  window.setTimeout(() => window.scrollTo({ top: preservedScroll, behavior: 'auto' }), 0)
                  window.setTimeout(() => window.scrollTo({ top: preservedScroll, behavior: 'auto' }), 100)
                }
              }}
            >
              <span className="force-node-marker" aria-hidden="true" />
              <span className="force-node-copy">
                <span className="force-node-name">{node.name}</span>
                {(node.kind === 'project' || selection?.id === node.id) && <span className="force-node-meta">{node.category} / {node.connections.length.toString().padStart(2, '0')} links</span>}
              </span>
            </button>
          )
        })}
      </div>

      <div className="graph-view-controls" aria-label="Graph view controls">
        <button type="button" onClick={() => changeZoom(.84)} aria-label="Zoom graph out">−</button>
        <button type="button" className="graph-view-reset" onClick={resetView}>Reset</button>
        <button type="button" onClick={() => changeZoom(1.18)} aria-label="Zoom graph in">+</button>
      </div>
      <div className="simulation-status" aria-hidden="true"><span ref={statusRef}>Initialising</span><span>Drag nodes / Use + or − to zoom</span></div>
      {import.meta.env.DEV && <PhysicsControls settings={settings} onChange={setSettings} />}
    </div>
  )
}
