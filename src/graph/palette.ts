import { domains } from '../data/portfolio'

// Jewel tones from the wizard's star chart, one per domain, loosely following
// stellar spectral colours (sapphire blue through citrine to ruby). Colour on
// the map always means "this domain"; brass is reserved for interaction.
export const domainColors: Record<string, string> = {
  frontend: '#6ea8ff',
  backend: '#f0b956',
  realtime: '#ff8a5c',
  'databases-data': '#ff7fa8',
  'search-discovery': '#6fdc9a',
  infrastructure: '#5fd6c4',
  'ai-automation': '#b69bff',
  mobile: '#5ad4f0',
  'commerce-storage': '#f7d46a',
  'game-development': '#ff6b6b',
  'desktop-applications': '#e2b48a',
  'testing-quality': '#aeb8cc',
  'interactive-visualisation': '#e69bff',
}

const fallback = '#cfc8b6'

// The domain that defines each project, by what it is rather than list order.
export const projectSignatureDomain: Record<string, string> = {
  minglr: 'realtime',
  'agent-forge': 'ai-automation',
  '4thspace': 'mobile',
  izrosh: 'commerce-storage',
  'eze-travels': 'frontend',
  'constellation-portfolio': 'interactive-visualisation',
  'untitled-mech-game': 'game-development',
  'dino-game': 'game-development',
  'library-management-system': 'desktop-applications',
  'home-server': 'infrastructure',
}

const technologyDomain = new Map<string, string>()
for (const domain of domains) for (const technology of domain.technologies) if (!technologyDomain.has(technology)) technologyDomain.set(technology, domain.id)

export const rgbOf = (hex: string) => [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16)).join(',')
export const domainColor = (domainId: string | undefined) => (domainId && domainColors[domainId]) || fallback
export const projectColor = (projectId: string) => domainColor(projectSignatureDomain[projectId])
export const technologyColor = (technologyId: string) => domainColor(technologyDomain.get(technologyId))

/** Colour for any node on the map, whatever its kind. */
export function entityColor(kind: 'project' | 'technology' | 'domain', id: string) {
  if (kind === 'project') return projectColor(id)
  if (kind === 'domain') return domainColor(id)
  return technologyColor(id)
}


/** Spell sparks: brass and white light, so colour stays reserved for domains. */
export const sparkColors = ['#e6c98b', '#ffffff', '#cfa65c', '#f1e3c5']
