import { technologies } from '../data/portfolio'
import type { Project, ProjectMediaState } from '../data/portfolio'

interface ProjectVisualProps {
  project: Project
  state?: ProjectMediaState
  variant?: number
  compact?: boolean
}

const technologyName = (id: string) => technologies.find(technology => technology.id === id)?.name ?? id

export default function ProjectVisual({ project, state, variant = 0, compact = false }: ProjectVisualProps) {
  const emphasis = state?.emphasis.length ? state.emphasis : project.graph.primaryTechnologies.slice(0, 4)
  const labels = emphasis.slice(0, compact ? 3 : 5).map(technologyName)
  const image = state?.src ?? project.media.find(item => item.src)?.src

  if (image) {
    return <div className={`project-identity visual-real-media visual-${project.id}`} data-variant={variant}>
      <img src={image} alt={state?.alt ?? project.media[0]?.alt ?? `${project.title} project view`} loading="lazy" />
      <div className="visual-annotation"><strong>{state?.label ?? project.media[0]?.label}</strong><span>{state?.description ?? project.shortDescription}</span></div>
    </div>
  }

  if (project.id === 'minglr') {
    return <div className="project-identity visual-minglr" data-variant={variant}>
      <div className="minglr-party" aria-hidden="true"><span /><span /><span /><span /></div>
      <div className="visual-annotation"><strong>{state?.label ?? 'Party room'}</strong><span>{state?.description ?? 'Group-first realtime interaction'}</span></div>
    </div>
  }

  if (project.id === 'izrosh') {
    return <div className="project-identity visual-izrosh" data-variant={variant}>
      <span className="izrosh-mark">IZROSH</span>
    </div>
  }

  if (project.id === '4thspace') {
    return <div className="project-identity visual-4thspace" data-variant={variant}>
      <div className="device device-web"><span className="device-map" /><i /><i /><i /></div>
      <div className="device device-mobile"><span /><span /><span /></div>
      <div className="visual-annotation"><strong>{state?.label ?? 'Discovery'}</strong><span>{labels.join(' / ')}</span></div>
    </div>
  }

  if (project.id === 'agent-forge') {
    return <div className="project-identity visual-agent-forge" data-variant={variant}>
      <div className="agent-flow" aria-hidden="true">
        <span className="flow-node flow-request">Issue</span><i />
        <span className="flow-node flow-control">Control plane</span><i />
        <span className="flow-node flow-run">AgentRun</span><i />
        <span className="flow-node flow-pr">Pull request</span>
      </div>
      <div className="agent-stack">{labels.map(label => <span key={label}>{label}</span>)}</div>
      <div className="visual-annotation"><strong>{state?.label ?? 'Autonomous delivery'}</strong><span>{state?.description ?? 'Durable work from issue to pull request'}</span></div>
    </div>
  }

  return <div className={`project-identity visual-system visual-${project.id}`} data-variant={variant}>
    <div className="system-rings" aria-hidden="true"><span /><span /><span /></div>
    <strong>{project.title}</strong>
    <div className="system-labels">{labels.map(label => <span key={label}>{label}</span>)}</div>
  </div>
}
