import { domains, projects, statusLabel, technologies, verificationLabel } from '../data/portfolio'
import type { Selection } from '../data/portfolio'
import ProjectMedia from './ProjectMedia'

interface FocusPanelProps {
  selection: Exclude<Selection, null>
  onSelect: (selection: Selection) => void
  onMediaEmphasis: (ids: string[]) => void
  reducedMotion: boolean
}

function TechButton({ id, onSelect }: { id: string; onSelect: (selection: Selection) => void }) {
  const technology = technologies.find(item => item.id === id)
  if (!technology) return null
  return <button type="button" onClick={() => onSelect({ kind: 'technology', id })}>{technology.name}</button>
}

function ProjectFocus({ id, onSelect, onMediaEmphasis, reducedMotion }: Omit<FocusPanelProps, 'selection'> & { id: string }) {
  const project = projects.find(item => item.id === id)
  if (!project) return null
  return (
    <aside className="focus-panel focus-project" aria-live="polite">
      <div className="focus-copy">
        <p className="catalogue">{statusLabel(project.status)}{project.year ? ` / ${project.year}` : ''} / {verificationLabel(project.verification)}</p>
        <h1 id="focus-title">{project.title}</h1>
        <p className="focus-intro">{project.shortDescription}</p>
        <dl>
          <div><dt>Role</dt><dd>{project.role}</dd></div>
          <div><dt>Stack</dt><dd className="inline-entities">{project.technologies.map(id => <TechButton key={id} id={id} onSelect={onSelect} />)}</dd></div>
        </dl>
        <div className="focus-links">
          {project.links.live && <a href={project.links.live} target="_blank" rel="noreferrer">Live <span aria-hidden="true">↗</span></a>}
          {project.links.source && <a href={project.links.source} target="_blank" rel="noreferrer">Source <span aria-hidden="true">↗</span></a>}
          <a href={`#case-${project.id}`}>Case study <span aria-hidden="true">↓</span></a>
        </div>
      </div>
      <ProjectMedia project={project} states={project.media} onEmphasis={onMediaEmphasis} reducedMotion={reducedMotion} />
    </aside>
  )
}

function TechnologyFocus({ id, onSelect }: Omit<FocusPanelProps, 'selection' | 'onMediaEmphasis' | 'reducedMotion'> & { id: string }) {
  const technology = technologies.find(item => item.id === id)
  if (!technology) return null
  return (
    <aside className="focus-panel focus-technology" aria-live="polite">
      <p className="catalogue">{technology.category} / {technology.proficiency.toUpperCase()}</p>
      <h1 id="focus-title">{technology.name}</h1>
      <p className="focus-intro">{technology.description}</p>
      <dl>
        <div><dt>Evidence</dt><dd>{technology.evidenceProjects.length} related {technology.evidenceProjects.length === 1 ? 'project' : 'projects'}</dd></div>
      </dl>
      <div className="evidence-list">
        <p>Used in</p>
        {technology.evidenceProjects.map(projectId => {
          const project = projects.find(item => item.id === projectId)
          return project ? <button key={project.id} onClick={() => onSelect({ kind: 'project', id: project.id })}><span>{project.title}</span><small>{project.shortDescription}</small></button> : null
        })}
      </div>
    </aside>
  )
}

function DomainFocus({ id, onSelect }: Omit<FocusPanelProps, 'selection' | 'onMediaEmphasis' | 'reducedMotion'> & { id: string }) {
  const domain = domains.find(item => item.id === id)
  if (!domain) return null
  const projectIds = domain.projects
  return (
    <aside className="focus-panel focus-domain" aria-live="polite">
      <p className="catalogue">Domain cluster / {domain.technologies.length.toString().padStart(2, '0')} objects</p>
      <h1 id="focus-title">{domain.name}</h1>
      <p className="focus-intro">{domain.description}</p>
      <div className="focus-domain-grid">
        <div><p>Technologies</p>{domain.technologies.map(techId => <TechButton key={techId} id={techId} onSelect={onSelect} />)}</div>
        <div><p>Projects</p>{projectIds.map(projectId => {
          const project = projects.find(item => item.id === projectId)
          return project ? <button key={project.id} onClick={() => onSelect({ kind: 'project', id: project.id })}>{project.title}</button> : null
        })}</div>
      </div>
    </aside>
  )
}

export default function FocusPanel({ selection, onSelect, onMediaEmphasis, reducedMotion }: FocusPanelProps) {
  if (selection.kind === 'project') return <ProjectFocus id={selection.id} onSelect={onSelect} onMediaEmphasis={onMediaEmphasis} reducedMotion={reducedMotion} />
  if (selection.kind === 'technology') return <TechnologyFocus id={selection.id} onSelect={onSelect} />
  return <DomainFocus id={selection.id} onSelect={onSelect} />
}
