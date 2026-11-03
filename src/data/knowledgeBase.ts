import { domains } from './domains'
import { experience } from './experience'
import { projects } from './projects'
import { domainRelationships, relationships } from './relationships'
import { technologies } from './technologies'
import type { Profile, Selection } from './types'

export const profile: Profile = { name: 'David Ekpechue', role: 'Software Engineer', intro: 'Building clear, dependable systems for people.', email: 'davidekpechue@gmail.com', github: 'https://github.com/DavidEkpechue', instagram: 'https://www.instagram.com/david_ekpec/' }

function assertUnique(label: string, ids: string[]) {
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
  if (duplicates.length) throw new Error(`${label} IDs must be unique: ${Array.from(new Set(duplicates)).join(', ')}`)
}

export function validateKnowledgeBase() {
  assertUnique('Project', projects.map(item => item.id))
  assertUnique('Technology', technologies.map(item => item.id))
  assertUnique('Domain', domains.map(item => item.id))
  assertUnique('Relationship', [...relationships, ...domainRelationships].map(item => item.id))
  const projectIds = new Set(projects.map(item => item.id))
  const technologyIds = new Set(technologies.map(item => item.id))
  const domainIds = new Set(domains.map(item => item.id))
  const entityIds = new Set([...projectIds, ...technologyIds, ...domainIds])

  for (const project of projects) {
    project.technologies.forEach(id => { if (!technologyIds.has(id)) throw new Error(`${project.id} references unknown technology ${id}`) })
    project.domains.forEach(id => { if (!domainIds.has(id)) throw new Error(`${project.id} references unknown domain ${id}`) })
    project.graph.primaryTechnologies.forEach(id => { if (!project.technologies.includes(id)) throw new Error(`${project.id} marks non-project technology ${id} as primary`) })
    project.repoEvidence.forEach(evidence => { if (evidence.project !== project.id) throw new Error(`${project.id} contains evidence for ${evidence.project}`) })
    if (project.links.source) {
      const publicRepository = project.repoEvidence.some(evidence => evidence.access === 'public' && evidence.repository && project.links.source?.includes(evidence.repository))
      if (!publicRepository) throw new Error(`${project.id} exposes a Source link without matching public repository evidence`)
    }
  }
  for (const technology of technologies) {
    technology.evidenceProjects.forEach(id => { if (!projectIds.has(id)) throw new Error(`${technology.id} references unknown evidence project ${id}`) })
    if (technology.proficiency === 'planned' && technology.graph.visibility === 'primary') throw new Error(`Planned technology ${technology.id} cannot be a primary graph node`)
  }
  for (const domain of domains) {
    domain.technologies.forEach(id => { if (!technologyIds.has(id)) throw new Error(`${domain.id} references unknown technology ${id}`) })
    domain.projects.forEach(id => { if (!projectIds.has(id)) throw new Error(`${domain.id} references unknown project ${id}`) })
  }
  for (const relationship of relationships) {
    if (!entityIds.has(relationship.from) || !entityIds.has(relationship.to)) throw new Error(`Relationship ${relationship.id} has an unknown endpoint`)
    relationship.evidenceProjects.forEach(id => { if (!projectIds.has(id)) throw new Error(`${relationship.id} references unknown evidence project ${id}`) })
  }
  if (projects.some(project => project.title.trim().length === 0 || project.shortDescription.trim().length === 0)) throw new Error('Every project requires concrete public copy')
  if (experience.some(item => item.organisation.trim().length === 0 || item.role.trim().length === 0)) throw new Error('Every experience record requires an organisation and role')
}

validateKnowledgeBase()

export const knowledgeBase = { projects, technologies, domains, relationships, domainRelationships, experience }

export const getEntity = (selection: Selection) => {
  if (!selection) return null
  const source = selection.kind === 'project' ? projects : selection.kind === 'technology' ? technologies : domains
  return source.find(item => item.id === selection.id) ?? null
}

export const entityPath = (selection: Selection) => {
  if (!selection) return '/'
  if (selection.kind === 'technology') return `/tech/${selection.id}`
  if (selection.kind === 'project') return `/projects/${selection.id}`
  return `/domain/${selection.id}`
}

export const selectionFromPath = (pathname: string): Selection => {
  const [, segment, id] = pathname.split('/')
  if (segment === 'projects' && projects.some(item => item.id === id)) return { kind: 'project', id }
  if (segment === 'tech' && technologies.some(item => item.id === id)) return { kind: 'technology', id }
  if (segment === 'domain' && domains.some(item => item.id === id)) return { kind: 'domain', id }
  return null
}

export const entityLabel = (selection: Selection) => {
  const entity = getEntity(selection)
  return entity ? ('title' in entity ? entity.title : entity.name) : 'Universe'
}

export const statusLabel = (status: string) => { const words = status.split('-'); return [words[0].charAt(0).toUpperCase() + words[0].slice(1), ...words.slice(1)].join(' ') }
export const verificationLabel = (verification: string) => { const words = verification.split('-'); return [words[0].charAt(0).toUpperCase() + words[0].slice(1), ...words.slice(1)].join(' ') }

export const searchKnowledgeBase = (query: string) => {
  const term = query.trim().toLowerCase()
  if (!term) return []
  const candidates = term.endsWith('s') && term.length > 3 ? [term, term.slice(0, -1)] : [term]
  const matches = (content: string) => {
    const normalised = content.toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ')
    const words = normalised.split(/\s+/).filter(Boolean)
    return candidates.some(candidate => candidate.length <= 3 ? words.includes(candidate) : normalised.includes(candidate))
  }
  const technologyName = (id: string) => technologies.find(item => item.id === id)?.name ?? id
  const domainName = (id: string) => domains.find(item => item.id === id)?.name ?? id
  return [
    ...projects.filter(project => matches([project.title, project.shortDescription, ...project.features, ...project.engineeringHighlights, ...project.technologies.map(technologyName), ...project.domains.map(domainName)].join(' '))).map(project => ({ id: project.id, kind: 'project' as const, label: project.title, meta: `${statusLabel(project.status)} project` })),
    ...technologies.filter(technology => matches([technology.name, technology.category, technology.description, ...technology.evidenceProjects.map(id => projects.find(project => project.id === id)?.title ?? id)].join(' '))).map(technology => ({ id: technology.id, kind: 'technology' as const, label: technology.name, meta: technology.category })),
    ...domains.filter(domain => matches([domain.name, domain.description, ...domain.searchTerms, ...domain.technologies.map(technologyName), ...domain.projects.map(id => projects.find(project => project.id === id)?.title ?? id)].join(' '))).map(domain => ({ id: domain.id, kind: 'domain' as const, label: domain.name, meta: 'Domain' })),
  ].slice(0, 8)
}
