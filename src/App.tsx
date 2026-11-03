import { useCallback, useEffect, useMemo, useState } from 'react'
import FocusPanel from './components/FocusPanel'
import ForceGraph from './components/ForceGraph'
import LocalProjectGraph from './components/LocalProjectGraph'
import ProjectMedia from './components/ProjectMedia'
import ProjectNodeInspector from './components/ProjectNodeInspector'
import TechnologyExplorer from './components/TechnologyExplorer'
import Starfield from './components/Starfield'
import MobileStaggeredMenu from './components/reactbits/MobileStaggeredMenu'
import { domains, experience, profile, projects, searchKnowledgeBase, statusLabel, technologies } from './data/portfolio'
import type { Project, Selection } from './data/portfolio'
import { getGraphNode } from './graph/model'
import { useAnchorCorrection } from './hooks/useAnchorCorrection'
import { usePreferences } from './hooks/usePreferences'
import { useSelection } from './hooks/useSelection'

type SearchResult = { id: string; kind: 'project' | 'technology' | 'domain'; label: string; meta: string }
type Chapter = string

const chapterSelection = (chapter: Chapter): Selection => projects.some(project => project.id === chapter) ? { kind: 'project', id: chapter } : null

function useActiveChapter() {
  const [chapter, setChapter] = useState<Chapter>('hero')
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]'))
    const visibility = new Map<Element, number>()
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => visibility.set(entry.target, entry.intersectionRatio))
      const active = elements.reduce<{ name: Chapter; ratio: number }>((best, element) => {
        const ratio = visibility.get(element) ?? 0
        return ratio > best.ratio ? { name: element.dataset.chapter ?? 'hero', ratio } : best
      }, { name: 'hero', ratio: 0 })
      if (active.ratio > .12) setChapter(active.name)
    }, { threshold: [0, .12, .25, .42, .62], rootMargin: '-15% 0px -20%' })
    elements.forEach(element => observer.observe(element))
    return () => observer.disconnect()
  }, [])
  return chapter
}

function Search({ onSelect }: { onSelect: (selection: Selection) => void }) {
  const [query, setQuery] = useState('')
  const results = useMemo<SearchResult[]>(() => searchKnowledgeBase(query), [query])
  return <div className="universe-search">
    <label htmlFor="universe-query"><span>Search the universe</span><kbd>/</kbd></label>
    <input id="universe-query" value={query} onChange={event => setQuery(event.target.value)} aria-label="Search projects, technologies and domains" autoComplete="off" />
    {query && <div className="search-results" role="listbox" aria-label="Search results">{results.length ? results.map(result => <button key={`${result.kind}-${result.id}`} type="button" role="option" aria-selected="false" onClick={() => { onSelect({ kind: result.kind, id: result.id }); setQuery('') }}><span>{result.label}</span><small>{result.meta}</small></button>) : <p>No matching objects</p>}</div>}
  </div>
}

function Header({ onHome, reducedMotion }: { onHome: () => void; reducedMotion: boolean }) {
  return <>
    <header className="topbar">
      <button className="wordmark" type="button" onClick={onHome} aria-label="Return to the portfolio universe"><span className="wordmark-sigil">DE</span><span className="wordmark-title">David Ekpechue</span></button>
      <nav className="desktop-navigation" aria-label="Primary navigation"><a href="#work">Work</a><a href="#experience">Experience</a><a href="#technologies">Technologies</a><a href={`mailto:${profile.email}?subject=CV%20request`}>CV</a><a href={profile.github} target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a><a href="#contact">Contact</a></nav>
    </header>
    <MobileStaggeredMenu email={profile.email} github={profile.github} reducedMotion={reducedMotion} />
  </>
}

function HomeIntroduction() {
  const flagshipCount = projects.filter(project => project.tier === 'flagship').length
  return <div className="hero-copy">
    <p className="eyebrow"><span className="eyebrow-pulse" aria-hidden="true" />Software Engineer · Ireland</p>
    <h1 id="hero-title">David<br /><span>Ekpechue</span></h1>
    <p className="hero-line">{profile.intro}</p>
    <div className="hero-actions"><a className="button-primary" href="#work">View selected work <span aria-hidden="true">↓</span></a><a className="button-ghost" href={`mailto:${profile.email}`}>Get in touch</a></div>
    <dl className="hero-stats"><div><dt>Flagship systems</dt><dd>{String(flagshipCount).padStart(2, '0')}</dd></div><div><dt>Projects mapped</dt><dd>{String(projects.length).padStart(2, '0')}</dd></div><div><dt>Technologies</dt><dd>{technologies.length}</dd></div></dl>
  </div>
}

function SectionHeading({ number, title, note, id }: { number: string; title: string; note: string; id: string }) {
  return <header className="section-heading"><span className="section-number">{number}</span><div><h2 id={id}>{title}</h2><p>{note}</p></div></header>
}

function ProjectShowcase({ project, index, active, reducedMotion, onExplore }: {
  project: Project
  index: number
  active: boolean
  reducedMotion: boolean
  onExplore: (selection: Exclude<Selection, null>) => void
}) {
  const [localEmphasis, setLocalEmphasis] = useState(project.media[0]?.emphasis ?? [])
  const [selectedLocalId, setSelectedLocalId] = useState(project.id)
  const stack = project.graph.primaryTechnologies.map(id => technologies.find(item => item.id === id)?.name).filter(Boolean)
  const focus = project.domains.slice(0, 3).map(id => domains.find(domain => domain.id === id)?.name).filter(Boolean)
  useEffect(() => { setLocalEmphasis(project.media[0]?.emphasis ?? []); setSelectedLocalId(project.id) }, [project])
  return <article className={`project-showcase project-${project.id} ${active ? 'is-active' : ''}`} id={`case-${project.id}`} data-chapter={project.id} data-project={project.id}>
    <div className="project-copy-block"><p className="project-overline"><span>{String(index + 1).padStart(2, '0')}</span>{project.year ? `${project.year} · ` : ''}{statusLabel(project.status)}</p><h3>{project.title}</h3><p className="project-lede">{project.shortDescription}</p><dl><div><dt>Role</dt><dd>{project.role}</dd></div><div><dt>Core stack</dt><dd>{stack.slice(0, 7).join(' · ') || 'No implementation stack published'}</dd></div><div><dt>Focus</dt><dd>{focus.join(' · ')}</dd></div></dl><div className="project-actions"><button type="button" onClick={() => onExplore({ kind: 'project', id: project.id })}>Open observatory <span aria-hidden="true">↗</span></button>{project.links.source && <a href={project.links.source} target="_blank" rel="noreferrer">Source <span aria-hidden="true">↗</span></a>}{project.links.live && <a href={project.links.live} target="_blank" rel="noreferrer">Live <span aria-hidden="true">↗</span></a>}</div></div>
    <div className="project-system-grid">
      <LocalProjectGraph project={project} emphasis={localEmphasis} selectedId={selectedLocalId} active={active} reducedMotion={reducedMotion} onInspect={setSelectedLocalId} />
      <ProjectNodeInspector project={project} selectedId={selectedLocalId} onOpenGlobal={onExplore} />
    </div>
    <div className="project-media-stage">
      <header><span>Project views</span><p>Inspect product and system states</p></header>
      <div className="project-visual-wrap"><ProjectMedia project={project} states={project.media} onEmphasis={setLocalEmphasis} reducedMotion={reducedMotion} /></div>
    </div>
  </article>
}

export default function App() {
  const { selection, select } = useSelection()
  const { reducedMotion, compact } = usePreferences()
  const chapter = useActiveChapter()
  useAnchorCorrection()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mediaEmphasis, setMediaEmphasis] = useState<string[]>([])
  const hoveredNode = getGraphNode(hoveredId)
  const graphSelection = selection ?? chapterSelection(chapter)
  const graphInteractive = chapter === 'hero' || Boolean(selection)
  const flagshipProjects = useMemo(() => projects.filter(project => project.tier === 'flagship'), [])
  const supportingProjects = useMemo(() => projects.filter(project => project.tier !== 'flagship' && project.graph.visibility !== 'detail'), [])
  const ambientMode = selection
    ? selection.kind === 'project' ? 'project' : 'technologies'
    : chapter === 'technologies' ? 'technologies' : chapter === 'contact' ? 'contact' : projects.some(project => project.id === chapter) ? 'project' : chapter === 'hero' ? 'home' : 'quiet'

  useEffect(() => { setMediaEmphasis([]); setHoveredId(null) }, [selection, chapter])
  const selectEntity = useCallback((next: Selection) => { setHoveredId(null); if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); select(next) }, [select])
  const openInObservatory = useCallback((next: Exclude<Selection, null>) => { setHoveredId(null); select(next, { scrollTop: true }) }, [select])
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') { event.preventDefault(); document.getElementById('universe-query')?.focus() }; if (event.key === 'Escape' && selection) selectEntity(null) }; window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown) }, [selectEntity, selection])

  return <div className="site-shell" data-chapter-active={chapter}>
    <Starfield mode={ambientMode} compact={compact} />
    <Header onHome={() => { selectEntity(null); window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }) }} reducedMotion={reducedMotion} />
    <div className={`constellation-stage ${graphInteractive ? 'is-interactive' : 'is-passive'} ${selection ? 'has-route-focus' : ''}`}><ForceGraph selection={graphSelection} hoveredId={hoveredId} emphasis={mediaEmphasis} compact={compact} reducedMotion={reducedMotion} interactive={graphInteractive} onHover={setHoveredId} onSelect={selectEntity} /></div>
    <main id="main-content">
      <section className={`hero ${selection ? 'has-focus' : 'is-home'}`} aria-labelledby={selection ? 'focus-title' : 'hero-title'} data-chapter="hero">
        {!selection ? <HomeIntroduction /> : <><button type="button" className="return-home" onClick={() => selectEntity(null)}><span aria-hidden="true">←</span> Universe</button><FocusPanel key={`${selection.kind}-${selection.id}`} selection={selection} onSelect={selectEntity} onMediaEmphasis={setMediaEmphasis} reducedMotion={reducedMotion} /></>}
        <div className="graph-readout" aria-live="polite"><span className="readout-marker" aria-hidden="true" />{hoveredNode ? <><strong>{hoveredNode.name}</strong><span>{hoveredNode.category} · {hoveredNode.connections.length} connections</span></> : <><strong>Constellation</strong><span>Drag a star · Click to focus</span></>}</div><div className="hero-scroll" aria-hidden="true"><span /> Selected work</div>
      </section>
      <section className="graph-toolbar" aria-label="Constellation navigation"><div className="quick-orbits"><span>Focus</span>{flagshipProjects.map(project => <button key={project.id} type="button" onClick={() => openInObservatory({ kind: 'project', id: project.id })}>{project.title}</button>)}{domains.slice(0, 3).map(domain => <button key={domain.id} type="button" onClick={() => openInObservatory({ kind: 'domain', id: domain.id })}>{domain.name}</button>)}</div><Search onSelect={next => { if (next) openInObservatory(next); else selectEntity(null) }} /></section>
      <section id="work" className="content-section work-section" aria-labelledby="work-heading" data-chapter="work">
        <SectionHeading number="01" title="Selected Work" note="Four systems, inspected through their connected technologies" id="work-heading" />
        <div className="project-showcases">{flagshipProjects.map((project, index) => <ProjectShowcase key={project.id} project={project} index={index} active={chapter === project.id} reducedMotion={reducedMotion} onExplore={openInObservatory} />)}</div>
        <div className="supporting-projects"><header><span>More systems</span><p>Supporting work and active experiments</p></header>{supportingProjects.map(project => <button key={project.id} type="button" onPointerEnter={() => setHoveredId(project.id)} onPointerLeave={() => setHoveredId(null)} onFocus={() => setHoveredId(project.id)} onBlur={() => setHoveredId(null)} onClick={() => openInObservatory({ kind: 'project', id: project.id })}><strong>{project.title}</strong><span>{project.shortDescription}</span><small>{statusLabel(project.status)}</small></button>)}</div>
      </section>
      <section id="experience" className="content-section experience-section" aria-labelledby="experience-heading" data-chapter="experience"><SectionHeading number="02" title="Experience" note="Professional context" id="experience-heading" /><div className="experience-list">{experience.map(item => <article key={item.id}>{item.period && <p className="experience-period">{item.period}</p>}<h3>{item.role}<span>{item.organisation}</span></h3><p>{item.shortDescription}</p>{item.technologies.length > 0 && <div className="experience-tech">{item.technologies.map(id => <span key={id}>{technologies.find(technology => technology.id === id)?.name ?? id}</span>)}</div>}</article>)}<a className="cv-line" href={`mailto:${profile.email}?subject=CV%20request`}><span>CV</span><strong>Request full chronology</strong><span aria-hidden="true">↗</span></a></div></section>
      <section id="technologies" className="content-section technology-section" aria-labelledby="technology-heading" data-chapter="technologies"><SectionHeading number="03" title="Technologies" note="Evidence through projects and connected systems" id="technology-heading" /><TechnologyExplorer compact={compact} reducedMotion={reducedMotion} onOpen={openInObservatory} /></section>
      <section id="about" className="content-section about-section" aria-labelledby="about-heading" data-chapter="about"><SectionHeading number="04" title="About" note="Software engineering · Ireland" id="about-heading" /><div className="about-copy"><p>I build software systems and interfaces that make complex work feel clear. My focus is dependable engineering, careful interaction design, and the infrastructure beneath both.</p></div></section>
      <section id="contact" className="content-section contact-section" aria-labelledby="contact-heading" data-chapter="contact"><SectionHeading number="05" title="Contact" note="Direct links" id="contact-heading" /><div className="contact-register"><a href={`mailto:${profile.email}`}><span>Email</span><strong>{profile.email}</strong><span aria-hidden="true">↗</span></a><a href={profile.github} target="_blank" rel="noreferrer"><span>GitHub</span><strong>DavidEkpechue</strong><span aria-hidden="true">↗</span></a><a href={`mailto:${profile.email}?subject=CV%20request`}><span>CV</span><strong>Request a copy</strong><span aria-hidden="true">↗</span></a></div></section>
    </main>
    <footer><span>&copy; {new Date().getFullYear()} David Ekpechue</span><span>Software Engineer · Ireland</span><button type="button" onClick={() => { selectEntity(null); window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }) }}>Universe ↑</button></footer>
  </div>
}
