import { domains } from './domains'
import { projects } from './projects'
import type { GraphRelationship } from './types'

const relationshipEvidence: Record<string, string> = {
  'minglr:react': 'Web application and administration interfaces.',
  'agent-forge:react': 'Control-plane web interface for inspecting and coordinating agent work.',
  '4thspace:react': 'Web discovery, group and messaging experiences.',
  'izrosh:react': 'Storefront and catalogue administration interfaces.',
  'eze-travels:react': 'Travel catalogue and administration interfaces.',
  'constellation-portfolio:react': 'Accessible DOM interface surrounding the interactive graph.',
  'minglr:postgresql': 'Durable application state for users, parties and moderation workflows.',
  'agent-forge:postgresql': 'Canonical orchestration and AgentRun state.',
  '4thspace:postgresql': 'Relational social data with PostGIS-backed geospatial discovery.',
  'izrosh:postgresql': 'Commerce, reservation and fulfilment records.',
  'minglr:redis': 'Presence, matchmaking and realtime platform state.',
  'agent-forge:redis': 'BullMQ-backed asynchronous orchestration and durable work queues.',
  '4thspace:redis': 'Realtime messaging and shared platform state.',
  'izrosh:redis': 'Reservation state and background application work.',
  'minglr:kubernetes': 'k3s deployment work for the containerised platform.',
  'agent-forge:kubernetes': 'Isolated AgentRun workload execution with narrow privilege boundaries.',
  '4thspace:kubernetes': 'Backend deployment manifests for the product stack.',
  'minglr:socket-io': 'Realtime presence, signalling and party-room state.',
  '4thspace:socket-io': 'Realtime messaging and live platform updates across clients.',
}

const projectRelationships: GraphRelationship[] = projects.flatMap(project => project.technologies.map(technologyId => ({
  id: `${project.id}:uses:${technologyId}`,
  from: project.id,
  to: technologyId,
  type: 'uses' as const,
  strength: project.graph.primaryTechnologies.includes(technologyId) ? 'strong' as const : 'medium' as const,
  evidenceProjects: [project.id],
  evidenceSummary: relationshipEvidence[`${project.id}:${technologyId}`],
})))

const implementedTogether: GraphRelationship[] = [
  { id: 'typescript:react', from: 'typescript', to: 'react', type: 'implemented-with', strength: 'medium', evidenceProjects: ['minglr', 'agent-forge', '4thspace', 'izrosh', 'constellation-portfolio'] },
  { id: 'node:express', from: 'node', to: 'express', type: 'implemented-with', strength: 'strong', evidenceProjects: ['minglr', 'agent-forge', '4thspace', 'izrosh', 'eze-travels'] },
  { id: 'prisma:postgresql', from: 'prisma', to: 'postgresql', type: 'implemented-with', strength: 'strong', evidenceProjects: ['minglr', 'agent-forge', '4thspace', 'izrosh'] },
  { id: 'redis:bullmq', from: 'redis', to: 'bullmq', type: 'implemented-with', strength: 'strong', evidenceProjects: ['minglr', 'agent-forge'] },
  { id: 'redis:socket-io', from: 'redis', to: 'socket-io', type: 'implemented-with', strength: 'medium', evidenceProjects: ['minglr', '4thspace'] },
  { id: 'webrtc:mediasoup', from: 'webrtc', to: 'mediasoup', type: 'implemented-with', strength: 'strong', evidenceProjects: ['minglr'] },
  { id: 'react-native:expo', from: 'react-native', to: 'expo', type: 'implemented-with', strength: 'strong', evidenceProjects: ['4thspace'] },
  { id: 'postgresql:postgis', from: 'postgresql', to: 'postgis', type: 'implemented-with', strength: 'strong', evidenceProjects: ['4thspace'] },
  { id: 'postgis:mapbox', from: 'postgis', to: 'mapbox', type: 'implemented-with', strength: 'medium', evidenceProjects: ['4thspace'] },
  { id: 'docker:kubernetes', from: 'docker', to: 'kubernetes', type: 'implemented-with', strength: 'medium', evidenceProjects: ['minglr', 'agent-forge', '4thspace'] },
  { id: 'kubernetes:helm', from: 'kubernetes', to: 'helm', type: 'implemented-with', strength: 'strong', evidenceProjects: ['agent-forge'] },
  { id: 'agent-systems:opencode', from: 'agent-systems', to: 'opencode', type: 'implemented-with', strength: 'strong', evidenceProjects: ['agent-forge'] },
  { id: 'agent-systems:github-api', from: 'agent-systems', to: 'github-api', type: 'implemented-with', strength: 'strong', evidenceProjects: ['agent-forge'] },
  { id: 'stripe:s3-r2', from: 'stripe', to: 's3-r2', type: 'implemented-with', strength: 'medium', evidenceProjects: ['izrosh'] },
  { id: 'mongodb:mongoose', from: 'mongodb', to: 'mongoose', type: 'implemented-with', strength: 'strong', evidenceProjects: ['eze-travels'] },
  { id: 'd3-force:svg', from: 'd3-force', to: 'svg', type: 'implemented-with', strength: 'strong', evidenceProjects: ['constellation-portfolio'] },
  { id: 'godot:gdscript', from: 'godot', to: 'gdscript', type: 'implemented-with', strength: 'strong', evidenceProjects: ['untitled-mech-game'] },
  { id: 'python:pygame', from: 'python', to: 'pygame', type: 'implemented-with', strength: 'strong', evidenceProjects: ['dino-game'] },
  { id: 'java:javafx', from: 'java', to: 'javafx', type: 'implemented-with', strength: 'strong', evidenceProjects: ['library-management-system'] },
  { id: 'java:maven', from: 'java', to: 'maven', type: 'implemented-with', strength: 'medium', evidenceProjects: ['library-management-system'] },
  { id: 'java:jdbc', from: 'java', to: 'jdbc', type: 'implemented-with', strength: 'strong', evidenceProjects: ['library-management-system'] },
  { id: 'jdbc:mariadb', from: 'jdbc', to: 'mariadb', type: 'implemented-with', strength: 'strong', evidenceProjects: ['library-management-system'] },
]

export const relationships: GraphRelationship[] = [...projectRelationships, ...implementedTogether]
export const domainRelationships = domains.flatMap(domain => domain.technologies.map(technologyId => ({ id: `${domain.id}:groups:${technologyId}`, from: domain.id, to: technologyId, strength: 'weak' as const })))
