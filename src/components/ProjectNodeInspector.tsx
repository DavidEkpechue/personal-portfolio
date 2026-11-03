import { domains, projects, relationships, statusLabel, technologies } from '../data/portfolio'
import type { Project, Selection } from '../data/portfolio'
import Icon from './Icon'

interface ProjectNodeInspectorProps {
  project: Project
  selectedId: string
  onOpenGlobal: (selection: Exclude<Selection, null>) => void
}

const proficiencyLabel: Record<string, string> = {
  core: 'Core',
  strong: 'Strong',
  working: 'Working',
  planned: 'Planned',
}

export default function ProjectNodeInspector({ project, selectedId, onOpenGlobal }: ProjectNodeInspectorProps) {
  const selectedProject = projects.find(candidate => candidate.id === selectedId)
  const technology = technologies.find(candidate => candidate.id === selectedId)
  const domain = domains.find(candidate => candidate.id === selectedId)

  if (selectedProject) {
    return <aside className="local-node-inspector" aria-live="polite">
      <header><span>Selected object</span><span>Project</span></header>
      <div className="inspector-object"><i aria-hidden="true" /><div><p>{statusLabel(selectedProject.status)}</p><h4>{selectedProject.title}</h4></div></div>
      <p className="inspector-description">{selectedProject.shortDescription}</p>
      <dl><div><dt>Role</dt><dd>{selectedProject.role}</dd></div><div><dt>System</dt><dd>{selectedProject.domains.slice(0, 2).map(id => domains.find(item => item.id === id)?.name).filter(Boolean).join(', ')}</dd></div></dl>
      <ul>{selectedProject.engineeringHighlights.slice(0, 3).map(highlight => <li key={highlight}>{highlight}</li>)}</ul>
      <button type="button" onClick={() => onOpenGlobal({ kind: 'project', id: selectedProject.id })}>Open on the map <Icon name="forward" /></button>
    </aside>
  }

  if (technology) {
    const otherEvidence = technology.evidenceProjects.filter(id => id !== project.id).length
    const relationshipEvidence = relationships.find(link => link.from === project.id && link.to === technology.id)?.evidenceSummary
    return <aside className="local-node-inspector" aria-live="polite">
      <header><span>Selected object</span><span>Technology</span></header>
      <div className="inspector-object"><i aria-hidden="true" /><div><p>{technology.category}</p><h4>{technology.name}</h4></div></div>
      <p className="inspector-description">{relationshipEvidence ?? technology.description}</p>
      <dl><div><dt>Evidence</dt><dd>Implemented in {project.title}</dd></div><div><dt>Usage</dt><dd>{proficiencyLabel[technology.proficiency]}, {otherEvidence ? `${otherEvidence} other project${otherEvidence === 1 ? '' : 's'}` : 'this project'}</dd></div></dl>
      <div className="inspector-connection"><span>Connection</span><strong>{project.title}</strong><i aria-hidden="true" /><strong>{technology.name}</strong></div>
      <button type="button" onClick={() => onOpenGlobal({ kind: 'technology', id: technology.id })}>Open on the map <Icon name="forward" /></button>
    </aside>
  }

  if (domain) {
    const connected = domain.technologies.filter(id => project.technologies.includes(id)).slice(0, 6)
    return <aside className="local-node-inspector" aria-live="polite">
      <header><span>Selected object</span><span>Domain</span></header>
      <div className="inspector-object"><i aria-hidden="true" /><div><p>Engineering domain</p><h4>{domain.name}</h4></div></div>
      <p className="inspector-description">{domain.description}</p>
      <div className="inspector-linked-list"><span>Connected in this project</span>{connected.map(id => <strong key={id}>{technologies.find(item => item.id === id)?.name ?? id}</strong>)}</div>
      <button type="button" onClick={() => onOpenGlobal({ kind: 'domain', id: domain.id })}>Open on the map <Icon name="forward" /></button>
    </aside>
  }

  return null
}
