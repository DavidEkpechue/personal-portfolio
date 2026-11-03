import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from 'd3-force'
import type { Simulation, SimulationLinkDatum, SimulationNodeDatum } from 'd3-force'
import type { Selection } from '../data/portfolio'
import { graphDistance, graphEdges, graphNodes, isGraphNodeVisible } from './model'
import type { GraphEdge, GraphNode } from './model'

export interface PhysicsSettings {
  centerStrength: number
  chargeStrength: number
  linkStrength: number
  linkDistance: number
  velocityDecay: number
  alphaDecay: number
  dragAlphaTarget: number
  collisionRadius: number
}

export const DEFAULT_PHYSICS: PhysicsSettings = {
  centerStrength: 0.045,
  chargeStrength: -162,
  linkStrength: 0.22,
  linkDistance: 144,
  velocityDecay: 0.42,
  alphaDecay: 0.068,
  dragAlphaTarget: 0.18,
  collisionRadius: 30,
}

export interface PhysicsNode extends SimulationNodeDatum, GraphNode {
  homeX: number
  homeY: number
}

export interface PhysicsLink extends SimulationLinkDatum<PhysicsNode> {
  source: string | PhysicsNode
  target: string | PhysicsNode
  kind: 'project' | 'technology' | 'domain'
}

export interface GraphDimensions { width: number; height: number }

const domainRegions: Record<string, [number, number]> = {
  frontend: [.54, .26],
  backend: [.82, .35],
  realtime: [.57, .75],
  infrastructure: [.79, .17],
  'databases-data': [.82, .79],
  'search-discovery': [.9, .62],
  'ai-automation': [.68, .14],
  mobile: [.42, .62],
  'commerce-storage': [.88, .48],
  'game-development': [.38, .82],
  'testing-quality': [.48, .12],
  'interactive-visualisation': [.42, .4],
}

function edgeKind(edge: GraphEdge): PhysicsLink['kind'] {
  return edge.kind
}

function initialPosition(node: GraphNode, index: number, dimensions: GraphDimensions, compact: boolean) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const angle = index * goldenAngle
  const radius = (compact ? 34 : 48) * Math.sqrt(index + 1)
  const graphCenterX = dimensions.width * (compact ? .5 : .69)
  const graphCenterY = dimensions.height * .5
  const region = node.kind === 'domain' ? domainRegions[node.id] : undefined
  const ring = node.kind === 'project' ? projectRingTarget(node, dimensions, compact) : null
  if (ring) return ring
  return {
    x: region ? dimensions.width * region[0] : graphCenterX + Math.cos(angle) * radius,
    y: region ? dimensions.height * region[1] : graphCenterY + Math.sin(angle) * radius * .72,
  }
}

export function createPhysicsNodes(dimensions: GraphDimensions, compact: boolean): PhysicsNode[] {
  return graphNodes.map((node, index) => {
    const position = initialPosition(node, index, dimensions, compact)
    return { ...node, ...position, vx: 0, vy: 0, homeX: position.x, homeY: position.y }
  })
}

export function createPhysicsLinks(): PhysicsLink[] {
  return graphEdges.map(edge => ({ source: edge.from, target: edge.to, kind: edgeKind(edge) }))
}

function nodeId(endpoint: string | PhysicsNode) {
  return typeof endpoint === 'string' ? endpoint : endpoint.id
}

export function linkKey(link: PhysicsLink) {
  const source = nodeId(link.source)
  const target = nodeId(link.target)
  return source < target ? `${source}:${target}` : `${target}:${source}`
}

export function linkIds(link: PhysicsLink): [string, string] {
  return [nodeId(link.source), nodeId(link.target)]
}

function isSelectionLink(link: PhysicsLink, selection: Selection) {
  if (!selection) return false
  const [source, target] = linkIds(link)
  return source === selection.id || target === selection.id
}

// Projects hold slots on an ellipse so their labels never pile up in the
// centre; the most important projects are spread evenly around it.
const projectSlots = (() => {
  const projectNodes = graphNodes.filter(node => node.kind === 'project')
  const lead = projectNodes.filter(node => node.importance >= 5)
  const rest = projectNodes.filter(node => node.importance < 5)
  const total = projectNodes.length
  const slots = new Map<string, number>()
  lead.forEach((node, index) => slots.set(node.id, Math.round(index * total / Math.max(1, lead.length))))
  let cursor = 0
  rest.forEach(node => {
    while ([...slots.values()].includes(cursor)) cursor += 1
    slots.set(node.id, cursor)
  })
  return { slots, total }
})()

function projectRingTarget(node: Pick<GraphNode, 'id'>, dimensions: GraphDimensions, compact: boolean) {
  const slot = projectSlots.slots.get(node.id)
  if (slot === undefined) return null
  const angle = slot / projectSlots.total * Math.PI * 2 - Math.PI / 2 + .3
  const centreX = dimensions.width * (compact ? .5 : .69)
  const radiusX = compact ? dimensions.width * .32 : Math.min(dimensions.width * .25, 380)
  const radiusY = dimensions.height * (compact ? .32 : .36)
  return { x: centreX + Math.cos(angle) * radiusX, y: dimensions.height * .5 + Math.sin(angle) * radiusY }
}

function homeTarget(node: PhysicsNode, dimensions: GraphDimensions, compact: boolean) {
  const region = domainRegions[node.id]
  if (region) return { x: dimensions.width * region[0], y: dimensions.height * region[1] }
  const ring = node.kind === 'project' ? projectRingTarget(node, dimensions, compact) : null
  if (ring) return ring
  return {
    x: dimensions.width * (compact ? .5 : .69),
    y: dimensions.height * .5,
  }
}

function focusDepth(node: PhysicsNode, selection: Selection) {
  return selection ? graphDistance(selection.id, node.id, 2) : Number.POSITIVE_INFINITY
}

export function configureSimulation(
  simulation: Simulation<PhysicsNode, PhysicsLink>,
  settings: PhysicsSettings,
  selection: Selection,
  dimensions: GraphDimensions,
  compact: boolean,
) {
  const focalX = dimensions.width * (compact ? .5 : .72)
  const focalY = dimensions.height * (compact ? .47 : .49)

  const link = forceLink<PhysicsNode, PhysicsLink>(createPhysicsLinks())
    .id(node => node.id)
    .iterations(1)
    .distance(item => {
      const base = settings.linkDistance * (compact ? .76 : 1)
      const hierarchy = item.kind === 'project' ? .88 : item.kind === 'domain' ? 1.28 : 1.08
      return base * hierarchy * (isSelectionLink(item, selection) ? .82 : 1)
    })
    .strength(item => {
      const [source, target] = linkIds(item)
      if (!isGraphNodeVisible(source, selection, compact) || !isGraphNodeVisible(target, selection, compact)) return 0
      const hierarchy = item.kind === 'project' ? 1 : item.kind === 'domain' ? .24 : .5
      const selectedMultiplier = isSelectionLink(item, selection) ? 1.55 : selection ? .32 : 1
      return settings.linkStrength * hierarchy * selectedMultiplier
    })

  const charge = forceManyBody<PhysicsNode>()
    .strength(node => {
      if (!isGraphNodeVisible(node.id, selection, compact)) return settings.chargeStrength * .04
      const depth = focusDepth(node, selection)
      const focusMultiplier = !selection || depth <= 1 ? 1 : depth === 2 ? .74 : .42
      const hierarchy = node.kind === 'project' ? 1.24 : node.kind === 'domain' ? .72 : .82 + node.size * .18
      return settings.chargeStrength * hierarchy * focusMultiplier
    })
    .distanceMin(20)
    .distanceMax(compact ? 280 : 440)
    .theta(.86)

  const xForce = forceX<PhysicsNode>(node => {
    if (selection) {
      const depth = focusDepth(node, selection)
      if (depth <= 1) return focalX
    }
    return homeTarget(node, dimensions, compact).x
  }).strength(node => {
    if (selection?.id === node.id) return .2
    const depth = focusDepth(node, selection)
    if (depth === 1) return .018
    if (depth === 2) return .004
    return node.kind === 'domain' ? .012 : node.kind === 'project' ? selection ? .006 : .16 : .0015
  })

  const yForce = forceY<PhysicsNode>(node => {
    if (selection) {
      const depth = focusDepth(node, selection)
      if (depth <= 1) return focalY
    }
    return homeTarget(node, dimensions, compact).y
  }).strength(node => {
    if (selection?.id === node.id) return .2
    const depth = focusDepth(node, selection)
    if (depth === 1) return .018
    if (depth === 2) return .004
    return node.kind === 'domain' ? .012 : node.kind === 'project' ? selection ? .006 : .16 : .0015
  })

  const collision = forceCollide<PhysicsNode>()
    .radius(node => settings.collisionRadius * (node.kind === 'project' ? 1.72 : node.kind === 'domain' ? 1.05 : .78 + node.size * .25))
    .strength(.78)
    .iterations(1)

  simulation
    .force('link', link)
    .force('charge', charge)
    .force('center', forceCenter<PhysicsNode>(focalX, focalY).strength(settings.centerStrength))
    .force('x', xForce)
    .force('y', yForce)
    .force('collision', collision)
    .velocityDecay(settings.velocityDecay)
    .alphaDecay(settings.alphaDecay)
    .alphaMin(.002)
}

export function createGraphSimulation(nodes: PhysicsNode[]) {
  return forceSimulation<PhysicsNode>(nodes).alpha(0).stop()
}

export function reheatSimulation(
  simulation: Simulation<PhysicsNode, PhysicsLink>,
  alpha: number,
  reducedMotion: boolean,
) {
  simulation.alphaTarget(0).alpha(Math.max(simulation.alpha(), alpha))
  if (reducedMotion) {
    simulation.stop()
    simulation.tick(48)
    return
  }
  simulation.restart()
}
