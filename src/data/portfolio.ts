export type EntityKind = 'project' | 'technology' | 'domain'
export type Selection = { kind: EntityKind; id: string } | null

export type Technology = { id: string; name: string; category: string; proficiency: 'Core' | 'Strong' | 'Working'; professionalUsage: string; relatedTechnologies: string[]; projects: string[]; description: string }
export type Project = { id: string; title: string; shortDescription: string; role: string; year: string; technologies: string[]; status: string; links: { live?: string; source?: string }; featured: boolean; technicalHighlights: string[]; media: string[] }
export type Experience = { organisation: string; role: string; period: string; technologies: string[]; shortDescription: string }
export type Domain = { id: string; name: string; description: string; technologies: string[] }

export const technologies: Technology[] = [
  { id: 'typescript', name: 'TypeScript', category: 'Language', proficiency: 'Core', professionalUsage: 'Professional + personal', relatedTechnologies: ['react', 'node', 'express'], projects: ['minglr', 'atlas', 'signal'], description: 'Primary language for typed application systems.' },
  { id: 'react', name: 'React', category: 'Frontend', proficiency: 'Core', professionalUsage: 'Professional + personal', relatedTechnologies: ['typescript', 'node'], projects: ['minglr', 'atlas'], description: 'Component-driven interfaces and client architecture.' },
  { id: 'node', name: 'Node.js', category: 'Backend', proficiency: 'Core', professionalUsage: 'Professional + personal', relatedTechnologies: ['typescript', 'express', 'postgres'], projects: ['minglr', 'signal'], description: 'Server-side services and integration layers.' },
  { id: 'express', name: 'Express', category: 'Backend', proficiency: 'Strong', professionalUsage: 'Professional + personal', relatedTechnologies: ['node', 'typescript', 'redis'], projects: ['minglr'], description: 'Lean HTTP services and APIs.' },
  { id: 'postgres', name: 'PostgreSQL', category: 'Databases', proficiency: 'Strong', professionalUsage: 'Professional + personal', relatedTechnologies: ['node', 'redis'], projects: ['atlas', 'signal'], description: 'Relational data modelling and query design.' },
  { id: 'redis', name: 'Redis', category: 'Databases', proficiency: 'Strong', professionalUsage: 'Personal', relatedTechnologies: ['express', 'node'], projects: ['minglr'], description: 'Fast state, queues, and presence data.' },
  { id: 'docker', name: 'Docker', category: 'Infrastructure', proficiency: 'Strong', professionalUsage: 'Professional + personal', relatedTechnologies: ['linux', 'node'], projects: ['minglr', 'signal'], description: 'Repeatable local and deployment environments.' },
  { id: 'linux', name: 'Linux', category: 'Infrastructure', proficiency: 'Strong', professionalUsage: 'Professional + personal', relatedTechnologies: ['docker'], projects: ['minglr', 'signal'], description: 'The operating environment behind production systems.' },
  { id: 'livekit', name: 'LiveKit', category: 'Realtime', proficiency: 'Working', professionalUsage: 'Personal', relatedTechnologies: ['webrtc', 'react'], projects: ['minglr'], description: 'Realtime audio and video infrastructure.' },
  { id: 'webrtc', name: 'WebRTC', category: 'Realtime', proficiency: 'Working', professionalUsage: 'Personal', relatedTechnologies: ['livekit'], projects: ['minglr'], description: 'Low-latency peer media and signalling.' },
  { id: 'github', name: 'GitHub', category: 'Infrastructure', proficiency: 'Core', professionalUsage: 'Professional + personal', relatedTechnologies: ['docker'], projects: ['minglr', 'atlas', 'signal'], description: 'Version control and collaborative delivery.' },
]
export const domains: Domain[] = [
  { id: 'frontend', name: 'Frontend', description: 'Interfaces that make complex systems feel clear.', technologies: ['react', 'typescript'] },
  { id: 'backend', name: 'Backend', description: 'Services, APIs, and durable application logic.', technologies: ['node', 'express', 'typescript'] },
  { id: 'realtime', name: 'Realtime', description: 'Systems designed for live human connection.', technologies: ['livekit', 'webrtc', 'redis'] },
  { id: 'infrastructure', name: 'Infrastructure', description: 'The quiet foundations that make a system dependable.', technologies: ['docker', 'linux', 'github'] },
  { id: 'databases', name: 'Databases', description: 'Structured data with a long memory.', technologies: ['postgres', 'redis'] },
]
export const projects: Project[] = [
  { id: 'minglr', title: 'Minglr', shortDescription: 'A group-first realtime video platform.', role: 'Creator / Full-stack engineer', year: '2026', technologies: ['react', 'typescript', 'express', 'redis', 'livekit', 'docker'], status: 'In development', links: { source: 'https://github.com/DavidEkpechue' }, featured: true, technicalHighlights: ['Realtime rooms and presence', 'Video infrastructure exploration', 'Containerised service environment'], media: ['Product', 'Matchmaking', 'Video', 'Infrastructure'] },
  { id: 'atlas', title: 'Atlas', shortDescription: 'A placeholder project ready for your real case study.', role: 'Software engineer', year: '—', technologies: ['react', 'typescript', 'postgres'], status: 'Placeholder', links: {}, featured: true, technicalHighlights: ['Replace this project with real work', 'Add outcomes and links when available'], media: ['Product', 'Data model'] },
  { id: 'signal', title: 'Signal', shortDescription: 'A placeholder system for backend and delivery work.', role: 'Software engineer', year: '—', technologies: ['node', 'typescript', 'postgres', 'docker'], status: 'Placeholder', links: {}, featured: false, technicalHighlights: ['Replace with a genuine project', 'Keep evidence close to the stack'], media: ['System', 'Infrastructure'] },
]
export const experience: Experience[] = [{ organisation: 'Experience to add', role: 'Software Engineer', period: '—', technologies: ['TypeScript', 'React', 'Node.js'], shortDescription: 'Add your real role, organisation, and concise contribution here.' }]
export const getEntity = (selection: Selection) => { if (!selection) return null; const source = selection.kind === 'project' ? projects : selection.kind === 'technology' ? technologies : domains; return source.find((item) => item.id === selection.id) ?? null }
export const entityPath = (selection: Selection) => !selection ? '/' : selection.kind === 'technology' ? `/tech/${selection.id}` : selection.kind === 'project' ? `/projects/${selection.id}` : `/domain/${selection.id}`
export const selectionFromPath = (pathname: string): Selection => { const [, segment, id] = pathname.split('/'); if (segment === 'projects' && projects.some((p) => p.id === id)) return { kind: 'project', id }; if (segment === 'tech' && technologies.some((t) => t.id === id)) return { kind: 'technology', id }; if (segment === 'domain' && domains.some((d) => d.id === id)) return { kind: 'domain', id }; return null }
