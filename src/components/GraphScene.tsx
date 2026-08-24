import { Canvas, useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { domains, projects, technologies } from '../data/portfolio'
import type { EntityKind, Selection } from '../data/portfolio'

type GraphNode = { id: string; name: string; kind: EntityKind; x: number; y: number; z: number; size: number; connections: string[] }
const base: Record<string, [number, number, number]> = {
  minglr: [-2.1, -0.7, 0], atlas: [2.3, 1.1, -0.4], signal: [1.8, -1.6, 0.5],
  typescript: [-0.1, 1.55, 0.1], react: [-2.9, 1.6, -.3], node: [2.85, .1, .25], express: [3.95, -1.05, .2], postgres: [1.05, -2.35, -.3], redis: [-3.2, -2.0, .4], docker: [-4.15, .1, -.1], linux: [3.85, 2.05, .2], livekit: [-1.1, -2.55, .25], webrtc: [-4.35, -1.05, -.2], github: [.8, 2.8, -.15],
  frontend: [-3.3, 2.9, -.8], backend: [3.65, 1.25, -.8], realtime: [-3.7, -3.1, -.8], infrastructure: [3.6, 3.25, -.8], databases: [1.9, -3.3, -.8],
}
const colour: Record<EntityKind, string> = { project: '#f0ede4', technology: '#b9c7d3', domain: '#8f9cab' }

function makeNodes(): GraphNode[] {
  const nodes: GraphNode[] = [
    ...projects.map((p) => ({ id: p.id, name: p.title, kind: 'project' as const, x: base[p.id][0], y: base[p.id][1], z: base[p.id][2], size: p.featured ? .22 : .17, connections: p.technologies })),
    ...technologies.map((t) => ({ id: t.id, name: t.name, kind: 'technology' as const, x: base[t.id][0], y: base[t.id][1], z: base[t.id][2], size: t.proficiency === 'Core' ? .145 : .105, connections: [...t.projects, ...t.relatedTechnologies] })),
    ...domains.map((d) => ({ id: d.id, name: d.name, kind: 'domain' as const, x: base[d.id][0], y: base[d.id][1], z: base[d.id][2], size: .07, connections: d.technologies })),
  ]
  return nodes
}
const graphNodes = makeNodes()
const related = (node: GraphNode, selected: Selection) => !selected || node.id === selected.id || node.connections.includes(selected.id)
const focusedPosition = (node: GraphNode, selected: Selection): [number, number, number] => {
  if (!selected) return [node.x, node.y, node.z]
  if (node.id === selected.id) return [0, 0, 0]
  if (related(node, selected)) { const relatives = graphNodes.filter((n) => n.id !== selected.id && related(n, selected)); const i = relatives.findIndex((n) => n.id === node.id); const angle = (i / Math.max(relatives.length, 1)) * Math.PI * 2 - Math.PI / 2; const r = 2.25 + (i % 2) * .35; return [Math.cos(angle) * r, Math.sin(angle) * r, node.z] }
  return [node.x * 1.38, node.y * 1.38, node.z - 1.2]
}
function Node({ node, selection, emphasis, onSelect, onHover, reduced }: { node: GraphNode; selection: Selection; emphasis: string[]; onSelect: (s: Selection) => void; onHover: (id: string | null) => void; reduced: boolean }) {
  const ref = useRef<THREE.Mesh>(null); const current = useRef(new THREE.Vector3(node.x, node.y, node.z)); const target = focusedPosition(node, selection); const isSelected = selection?.id === node.id; const isRelated = related(node, selection) || emphasis.includes(node.id)
  useFrame((_, delta) => { const speed = reduced ? 1 : Math.min(1, delta * 3.6); current.current.lerp(new THREE.Vector3(...target), speed); ref.current?.position.copy(current.current) })
  const click = (event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); onSelect({ kind: node.kind, id: node.id }) }
  return <mesh ref={ref} onClick={click} onPointerOver={(e) => { e.stopPropagation(); onHover(node.id); document.body.style.cursor = 'pointer' }} onPointerOut={() => { onHover(null); document.body.style.cursor = 'auto' }}>
    <sphereGeometry args={[node.size * (isSelected ? 1.6 : 1), 24, 24]} />
    <meshBasicMaterial color={colour[node.kind]} transparent opacity={!selection || isRelated ? (isSelected ? 1 : .74) : .12} />
  </mesh>
}
function Edge({ from, to, selection, emphasis, reduced }: { from: GraphNode; to: GraphNode; selection: Selection; emphasis: string[]; reduced: boolean }) {
  const ref = useRef<THREE.Line>(null); const positions = useMemo(() => new Float32Array(6), []); const line = useMemo(() => { const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#8d9eaa', transparent: true })) }, [positions]); const currentA = useRef(new THREE.Vector3(from.x, from.y, from.z)); const currentB = useRef(new THREE.Vector3(to.x, to.y, to.z)); const active = !selection || selection.id === from.id || selection.id === to.id || emphasis.includes(from.id) || emphasis.includes(to.id) || (from.connections.includes(selection.id) && to.connections.includes(selection.id))
  useFrame((_, delta) => { const s = reduced ? 1 : Math.min(1, delta * 3.6); currentA.current.lerp(new THREE.Vector3(...focusedPosition(from, selection)), s); currentB.current.lerp(new THREE.Vector3(...focusedPosition(to, selection)), s); positions.set([...currentA.current.toArray(), ...currentB.current.toArray()]); const attribute = ref.current?.geometry.getAttribute('position') as THREE.BufferAttribute | undefined; if (attribute) attribute.needsUpdate = true; (line.material as THREE.LineBasicMaterial).opacity = active ? .3 : .035 })
  return <primitive object={line} ref={ref} />
}
function Scene({ selection, emphasis, onSelect, onHover, reduced }: Omit<Props, 'className'>) {
  const edges = useMemo(() => graphNodes.flatMap((node) => node.connections.filter((id) => id > node.id).map((id) => [node, graphNodes.find((n) => n.id === id)!] as const)).filter(([, to]) => Boolean(to)), [])
  return <><ambientLight intensity={.4} /><group position={[0, 0, 0]}>{edges.map(([from, to]) => <Edge key={`${from.id}-${to.id}`} from={from} to={to} selection={selection} emphasis={emphasis} reduced={reduced} />)}{graphNodes.map((node) => <Node key={node.id} node={node} selection={selection} emphasis={emphasis} onSelect={onSelect} onHover={onHover} reduced={reduced} />)}</group></>
}
type Props = { selection: Selection; emphasis: string[]; onSelect: (selection: Selection) => void; onHover: (id: string | null) => void; reduced: boolean; className?: string }
export const findGraphNode = (id: string | null) => graphNodes.find((node) => node.id === id) ?? null
export default function GraphScene({ selection, emphasis, onSelect, onHover, reduced, className }: Props) {
  return <div className={className} aria-hidden="true"><Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 8.3], fov: 48 }} gl={{ antialias: true, powerPreference: 'high-performance' }} onPointerMissed={() => onSelect(null)}><color attach="background" args={['#0b0d10']} /><Scene selection={selection} emphasis={emphasis} onSelect={onSelect} onHover={onHover} reduced={reduced} /></Canvas></div>
}
