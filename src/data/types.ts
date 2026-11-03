export type EntityKind = 'project' | 'technology' | 'domain' | 'experience'
export type NavigableEntityKind = Exclude<EntityKind, 'experience'>
export type Selection = { kind: NavigableEntityKind; id: string } | null

export type Verification = 'repo-verified' | 'owner-confirmed' | 'planned'
export type ProjectStatus = 'live' | 'active-development' | 'implemented' | 'prototype' | 'planned' | 'archived'
export type ProjectTier = 'flagship' | 'major' | 'secondary' | 'experimental'
export type GraphVisibility = 'primary' | 'secondary' | 'detail'
export type Proficiency = 'core' | 'strong' | 'working' | 'planned'

export interface EvidenceSource {
  project: string
  repository?: string
  path?: string
  type: 'readme' | 'package' | 'source' | 'architecture' | 'owner-confirmed'
  access: 'public' | 'private' | 'local'
  note?: string
}

export interface ProjectMediaState {
  id: string
  label: string
  eyebrow: string
  description: string
  emphasis: string[]
  palette: [string, string, string]
  src?: string
  alt: string
  sourceType: 'live-capture' | 'repo-derived' | 'architecture' | 'generated'
  fit?: 'contain' | 'cover'
  position?: string
  aspectRatio?: string
}

export interface Project {
  id: string
  title: string
  shortDescription: string
  tier: ProjectTier
  status: ProjectStatus
  verification: Verification
  role: string
  year?: string
  domains: string[]
  technologies: string[]
  features: string[]
  engineeringHighlights: string[]
  repoEvidence: EvidenceSource[]
  links: { live?: string; source?: string }
  media: ProjectMediaState[]
  graph: {
    importance: number
    visibility: GraphVisibility
    primaryTechnologies: string[]
  }
}

export interface Technology {
  id: string
  name: string
  category: string
  proficiency: Proficiency
  evidenceProjects: string[]
  description: string
  graph: {
    importance: number
    visibility: GraphVisibility
  }
}

export interface Domain {
  id: string
  name: string
  description: string
  technologies: string[]
  projects: string[]
  searchTerms: string[]
  graph: {
    importance: number
    visibility: GraphVisibility
  }
}

export interface Experience {
  id: string
  organisation: string
  role: string
  period?: string
  technologies: string[]
  shortDescription: string
  verification: Verification
}

export interface GraphRelationship {
  id: string
  from: string
  to: string
  type: 'uses' | 'implemented-with'
  strength: 'strong' | 'medium' | 'weak'
  evidenceProjects: string[]
  evidenceSummary?: string
}

export interface Profile {
  name: string
  role: string
  intro: string
  email: string
  github: string
}
