import { domainRelationships, domains, projects, relationships, statusLabel, technologies } from '../data/portfolio'
import type { EntityKind, GraphVisibility, NavigableEntityKind, Selection } from '../data/portfolio'

export interface GraphNode {
  id: string
  name: string
  kind: NavigableEntityKind
  category: string
  size: number
  importance: number
  visibility: GraphVisibility
  connections: string[]
}

export interface GraphEdge {
  from: string
  to: string
  kind: 'project' | 'technology' | 'domain'
  strength: 'strong' | 'medium' | 'weak'
}

const rawEdges: GraphEdge[] = [
  ...relationships.map(relationship => ({ from: relationship.from, to: relationship.to, kind: relationship.type === 'uses' ? 'project' as const : 'technology' as const, strength: relationship.strength })),
  ...domainRelationships.map(relationship => ({ from: relationship.from, to: relationship.to, kind: 'domain' as const, strength: relationship.strength })),
]

function canonicalEdge(edge: GraphEdge): GraphEdge {
  return edge.from < edge.to ? edge : { ...edge, from: edge.to, to: edge.from }
}

export const graphEdges: GraphEdge[] = Array.from(new Map(rawEdges.map(canonicalEdge).map(edge => [`${edge.from}:${edge.to}`, edge])).values())
const connectionMap = new Map<string, Set<string>>()
for (const edge of graphEdges) {
  if (!connectionMap.has(edge.from)) connectionMap.set(edge.from, new Set())
  if (!connectionMap.has(edge.to)) connectionMap.set(edge.to, new Set())
  connectionMap.get(edge.from)?.add(edge.to)
  connectionMap.get(edge.to)?.add(edge.from)
}

const connectionCount = (id: string) => connectionMap.get(id)?.size ?? 0
const projectSize = (id: string) => .88 + Math.sqrt(connectionCount(id)) * .22
const technologySize = (id: string) => .52 + Math.sqrt(connectionCount(id)) * .18
const domainSize = (id: string) => .38 + Math.sqrt(connectionCount(id)) * .13

export const graphNodes: GraphNode[] = [
  ...projects.map(project => ({ id: project.id, name: project.title, kind: 'project' as const, category: statusLabel(project.status), size: projectSize(project.id), importance: project.graph.importance, visibility: project.graph.visibility, connections: Array.from(connectionMap.get(project.id) ?? []) })),
  ...technologies.map(technology => ({ id: technology.id, name: technology.name, kind: 'technology' as const, category: technology.category, size: technologySize(technology.id), importance: technology.graph.importance, visibility: technology.graph.visibility, connections: Array.from(connectionMap.get(technology.id) ?? []) })),
  ...domains.map(domain => ({ id: domain.id, name: domain.name, kind: 'domain' as const, category: 'Domain', size: domainSize(domain.id), importance: domain.graph.importance, visibility: domain.graph.visibility, connections: Array.from(connectionMap.get(domain.id) ?? []) })),
]

const nodeMap = new Map(graphNodes.map(node => [node.id, node]))
export function getGraphNode(id: string | null) {
  return id ? nodeMap.get(id) ?? null : null
}

export function isConnected(first: string, second: string) {
  if (first === second) return true
  return connectionMap.get(first)?.has(second) ?? false
}

export function isGraphNodeVisible(nodeId: string, _selection: Selection, _compact = false) {
  return nodeMap.has(nodeId)
}

export function relatedIds(selection: Selection, emphasis: string[] = []) {
  if (!selection) return new Set(emphasis)
  const related = new Set<string>([selection.id, ...emphasis])
  graphNodes.forEach(node => { if (isConnected(node.id, selection.id)) related.add(node.id) })
  return related
}

export function graphDistance(originId: string, targetId: string, maxDepth = 2) {
  if (originId === targetId) return 0
  const visited = new Set([originId])
  let frontier = [originId]
  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const next: string[] = []
    for (const id of frontier) {
      for (const candidate of connectionMap.get(id) ?? []) {
        if (visited.has(candidate)) continue
        if (candidate === targetId) return depth
        visited.add(candidate)
        next.push(candidate)
      }
    }
    frontier = next
  }
  return Number.POSITIVE_INFINITY
}

export function kindLabel(kind: EntityKind) {
  if (kind === 'technology') return 'Technology'
  return kind.charAt(0).toUpperCase() + kind.slice(1)
}
