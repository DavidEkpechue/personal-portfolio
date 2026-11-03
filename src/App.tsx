import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import Astrolabe from './components/Astrolabe'
import FocusPanel from './components/FocusPanel'
import ForceGraph from './components/ForceGraph'
import Icon from './components/Icon'
import LocalProjectGraph from './components/LocalProjectGraph'
import ProjectMedia from './components/ProjectMedia'
import ProjectNodeInspector from './components/ProjectNodeInspector'
import TechnologyExplorer from './components/TechnologyExplorer'
import Starfield from './components/Starfield'
import BlurText from './components/reactbits/BlurText'
import MobileStaggeredMenu from './components/reactbits/MobileStaggeredMenu'
import StarBorder from './components/reactbits/StarBorder'
import { useSpotlight } from './components/reactbits/useSpotlight'
import { domains, experience, profile, projects, searchKnowledgeBase, statusLabel, technologies } from './data/portfolio'
import type { Project, Selection } from './data/portfolio'
import { getGraphNode } from './graph/model'
import { projectColor, rgbOf } from './graph/palette'
import { useAnchorCorrection } from './hooks/useAnchorCorrection'
import { usePreferences } from './hooks/usePreferences'
import { useSelection } from './hooks/useSelection'

type SearchResult = { id: string; kind: 'project' | 'technology' | 'domain'; label: string; meta: string }
type Chapter = string

const chapterSelection = (chapter: Chapter): Selection => projects.some(project => project.id === chapter) ? { kind: 'project', id: chapter } : null
const listOf = (items: Array<string | undefined>) => items.filter(Boolean).join(', ')

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
    <label htmlFor="universe-query"><span>Search the map</span><kbd>/</kbd></label>
    <input id="universe-query" name="q" type="search" value={query} onChange={event => setQuery(event.target.value)} aria-label="Search projects, technologies and domains" autoComplete="off" spellCheck={false} placeholder="Project or technology…" />
    {query && <div className="search-results" role="listbox" aria-label="Search results">{results.length ? results.map(result => <button key={`${result.kind}-${result.id}`} type="button" role="option" aria-selected="false" onClick={() => { onSelect({ kind: result.kind, id: result.id }); setQuery('') }}><span>{result.label}</span><small>{result.meta}</small></button>) : <p>Nothing on the map matches “{query}”. Try a technology such as React or Redis.</p>}</div>}
  </div>
}

function Header({ onHome, reducedMotion }: { onHome: () => void; reducedMotion: boolean }) {
  return <>
    <header className="topbar">
      <button className="wordmark" type="button" onClick={onHome} aria-label="David Ekpechue, back to the map"><span className="wordmark-sigil" aria-hidden="true">DE</span><span className="wordmark-title">David Ekpechue</span></button>
      <nav className="desktop-navigation" aria-label="Primary navigation"><a href="#work">Work</a><a href="#experience">Experience</a><a href="#technologies">Technologies</a><a href={`mailto:${profile.email}?subject=CV%20request`}>CV</a><a href={profile.github} target="_blank" rel="noreferrer">GitHub <Icon name="external" size={13} /></a><a href="#contact">Contact</a></nav>
    </header>
    <MobileStaggeredMenu email={profile.email} github={profile.github} instagram={profile.instagram} reducedMotion={reducedMotion} />
  </>
}

// A star chart carries a key; this one says what the marks on the map mean.
function ChartKey({ compact }: { compact: boolean }) {
  return <figure className="chart-key">
    <figcaption>Reading the star chart</figcaption>
    <ul>
      <li><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="4.5" className="key-project" /><circle cx="10" cy="10" r="8" className="key-halo" /></svg>Project</li>
      <li><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="2.4" className="key-technology" /></svg>Technology</li>
      <li><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 14 18 6" className="key-link" /></svg>Used together</li>
    </ul>
    <p>{compact ? 'Pinch to zoom, drag to pan, tap a star for details. Colour marks each domain.' : 'Hover a star to light up its links; colour marks the domain. Click to open it, drag to move it, Ctrl + scroll to zoom.'}</p>
  </figure>
}

function HomeIntroduction({ compact, onExplore }: { compact: boolean; onExplore: () => void }) {
  return <div className="hero-copy">
    <h1 id="hero-title"><BlurText text="David" /><br /><BlurText text="Ekpechue" delay={.18} /></h1>
    <p className="hero-role">Software engineer in Ireland</p>
    <p className="hero-line">{profile.intro} Each project below is a star; the lines between them are the technologies they share.</p>
    <div className="hero-actions">
      <StarBorder className="button-primary" href="#work">View selected work <Icon name="down" /></StarBorder>
      {compact ? <button type="button" className="button-ghost" onClick={onExplore}><Icon name="compass" /> Explore the star chart</button> : <a className="button-ghost" href={`mailto:${profile.email}`}>Get in touch</a>}
    </div>
    {!compact && <ChartKey compact={false} />}
  </div>
}

function SectionHeading({ title, note, id }: { title: string; note: string; id: string }) {
  return <header className="section-heading"><div><h2 id={id}>{title}</h2><p>{note}</p></div></header>
}

function ProjectShowcase({ project, active, reducedMotion, onExplore }: {
  project: Project
  active: boolean
  reducedMotion: boolean
  onExplore: (selection: Exclude<Selection, null>) => void
}) {
  const [localEmphasis, setLocalEmphasis] = useState(project.media[0]?.emphasis ?? [])
  const [selectedLocalId, setSelectedLocalId] = useState(project.id)
  const stack = project.graph.primaryTechnologies.map(id => technologies.find(item => item.id === id)?.name)
  const focus = project.domains.slice(0, 3).map(id => domains.find(domain => domain.id === id)?.name)
  useEffect(() => { setLocalEmphasis(project.media[0]?.emphasis ?? []); setSelectedLocalId(project.id) }, [project])
  const accent = projectColor(project.id)
  return <article className={`project-showcase project-${project.id} ${active ? 'is-active' : ''}`} style={{ '--project-accent': accent, '--project-accent-rgb': rgbOf(accent), '--project-soft': accent } as CSSProperties} id={`case-${project.id}`} data-chapter={project.id} data-project={project.id}>
    <div className="project-copy-block">
      <p className="project-overline">{statusLabel(project.status)}{project.year && <>, <span className="data">{project.year}</span></>}</p>
      <h3>{project.title}</h3>
      <p className="project-lede">{project.shortDescription}</p>
      <dl><div><dt>Role</dt><dd>{project.role}</dd></div><div><dt>Core stack</dt><dd>{listOf(stack.slice(0, 7)) || 'No implementation stack published'}</dd></div><div><dt>Focus</dt><dd>{listOf(focus)}</dd></div></dl>
      <div className="project-actions"><button type="button" onClick={() => onExplore({ kind: 'project', id: project.id })}>Open on the map <Icon name="forward" size={14} /></button>{project.links.source && <a href={project.links.source} target="_blank" rel="noreferrer">Source <Icon name="external" size={14} /></a>}{project.links.live && <a href={project.links.live} target="_blank" rel="noreferrer">Live <Icon name="external" size={14} /></a>}</div>
    </div>
    <div className="project-system-grid">
      <LocalProjectGraph project={project} emphasis={localEmphasis} selectedId={selectedLocalId} active={active} reducedMotion={reducedMotion} onInspect={setSelectedLocalId} />
      <ProjectNodeInspector project={project} selectedId={selectedLocalId} onOpenGlobal={onExplore} />
    </div>
    <div className="project-media-stage">
      <header><span>Plates</span><p>Captures of the product and diagrams of the system</p></header>
      <div className="project-visual-wrap"><ProjectMedia project={project} states={project.media} onEmphasis={setLocalEmphasis} reducedMotion={reducedMotion} /></div>
    </div>
  </article>
}

// On phones a tapped star is previewed here before opening, so a mis-tap on a
// crowded chart never navigates away.
function StarPreview({ selection, onOpen, onClose }: { selection: Exclude<Selection, null>; onOpen: () => void; onClose: () => void }) {
  const node = getGraphNode(selection.id)
  const project = selection.kind === 'project' ? projects.find(item => item.id === selection.id) : undefined
  const technology = selection.kind === 'technology' ? technologies.find(item => item.id === selection.id) : undefined
  const domain = selection.kind === 'domain' ? domains.find(item => item.id === selection.id) : undefined
  if (!node) return null
  const description = project?.shortDescription ?? technology?.description ?? domain?.description
  return <section className="star-preview" role="dialog" aria-modal="false" aria-labelledby="star-preview-title">
    <p className="star-preview-kind">{selection.kind === 'project' ? `Project, ${node.category.toLowerCase()}` : selection.kind === 'domain' ? 'Domain' : node.category}</p>
    <h2 id="star-preview-title">{node.name}</h2>
    {description && <p className="star-preview-copy">{description}</p>}
    <p className="star-preview-meta"><span className="data">{node.connections.length}</span> connections on the map</p>
    <div className="star-preview-actions"><button type="button" className="button-primary" onClick={onOpen}>Open details <Icon name="forward" /></button><button type="button" className="button-ghost" onClick={onClose}>Close</button></div>
  </section>
}

export default function App() {
  const { selection, select } = useSelection()
  const { reducedMotion, compact } = usePreferences()
  const chapter = useActiveChapter()
  useAnchorCorrection()
  useSpotlight('.local-project-graph, .local-node-inspector, .technology-map-shell, .technology-inspector')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mediaEmphasis, setMediaEmphasis] = useState<string[]>([])
  const [exploring, setExploring] = useState(false)
  const [preview, setPreview] = useState<Exclude<Selection, null> | null>(null)
  const hoveredNode = getGraphNode(hoveredId)
  const isExploring = exploring && compact && !selection
  const graphSelection = selection ?? preview ?? chapterSelection(chapter)
  const graphInteractive = chapter === 'hero' || Boolean(selection) || isExploring
  const flagshipProjects = useMemo(() => projects.filter(project => project.tier === 'flagship'), [])
  const supportingProjects = useMemo(() => projects.filter(project => project.tier !== 'flagship' && project.graph.visibility !== 'detail'), [])
  const ambientMode = selection
    ? selection.kind === 'project' ? 'project' : 'technologies'
    : chapter === 'technologies' ? 'technologies' : chapter === 'contact' ? 'contact' : projects.some(project => project.id === chapter) ? 'project' : chapter === 'hero' ? 'home' : 'quiet'

  useEffect(() => { setMediaEmphasis([]); setHoveredId(null) }, [selection, chapter])
  useEffect(() => { if (!compact) { setExploring(false); setPreview(null) } }, [compact])
  useEffect(() => {
    document.body.classList.toggle('constellation-open', isExploring)
    return () => document.body.classList.remove('constellation-open')
  }, [isExploring])
  const selectEntity = useCallback((next: Selection) => { setHoveredId(null); setPreview(null); if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); select(next) }, [select])
  const openInObservatory = useCallback((next: Exclude<Selection, null>) => { setHoveredId(null); setPreview(null); setExploring(false); select(next, { scrollTop: true }) }, [select])
  const onGraphSelect = useCallback((next: Selection) => { if (isExploring && next) setPreview(next); else selectEntity(next) }, [isExploring, selectEntity])
  const startExploring = useCallback(() => { window.scrollTo({ top: 0, behavior: 'auto' }); setExploring(true) }, [])
  const stopExploring = useCallback(() => { setExploring(false); setPreview(null) }, [])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') { event.preventDefault(); document.getElementById('universe-query')?.focus() }
      if (event.key !== 'Escape') return
      if (preview) setPreview(null)
      else if (isExploring) stopExploring()
      else if (selection) selectEntity(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isExploring, preview, selectEntity, selection, stopExploring])
  const backToTop = () => { selectEntity(null); window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }) }

  return <div className={`site-shell ${isExploring ? 'is-exploring' : ''}`} data-chapter-active={chapter}>
    <Starfield mode={ambientMode} compact={compact} />
    <Header onHome={backToTop} reducedMotion={reducedMotion} />
    <div className={`constellation-stage ${graphInteractive ? 'is-interactive' : 'is-passive'} ${selection ? 'has-route-focus' : ''}`}>{!selection && <Astrolabe />}<ForceGraph selection={graphSelection} hoveredId={hoveredId} emphasis={mediaEmphasis} compact={compact} reducedMotion={reducedMotion} interactive={graphInteractive} exploring={isExploring} onHover={setHoveredId} onSelect={onGraphSelect} /></div>
    {isExploring && <div className="explore-bar"><ChartKey compact /><button type="button" className="button-ghost explore-done" onClick={stopExploring}>Done</button></div>}
    {isExploring && preview && <StarPreview selection={preview} onOpen={() => openInObservatory(preview)} onClose={() => setPreview(null)} />}
    <main id="main-content">
      <section className={`hero ${selection ? 'has-focus' : 'is-home'}`} aria-labelledby={selection ? 'focus-title' : 'hero-title'} data-chapter="hero">
        {!selection ? <HomeIntroduction compact={compact} onExplore={startExploring} /> : <><button type="button" className="return-home" onClick={() => selectEntity(null)}><Icon name="back" /> Back to the map</button><FocusPanel key={`${selection.kind}-${selection.id}`} selection={selection} onSelect={selectEntity} onMediaEmphasis={setMediaEmphasis} reducedMotion={reducedMotion} /></>}
        <p className="visually-hidden" aria-live="polite">{hoveredNode ? `${hoveredNode.name}, ${hoveredNode.category}, ${hoveredNode.connections.length} connections` : ''}</p>
      </section>
      <section className="graph-toolbar" aria-label="Jump to part of the map"><div className="quick-orbits"><span>Jump to</span>{flagshipProjects.map(project => <button key={project.id} type="button" onClick={() => openInObservatory({ kind: 'project', id: project.id })}>{project.title}</button>)}{domains.slice(0, 3).map(domain => <button key={domain.id} type="button" onClick={() => openInObservatory({ kind: 'domain', id: domain.id })}>{domain.name}</button>)}</div><Search onSelect={next => { if (next) openInObservatory(next); else selectEntity(null) }} /></section>
      <section id="work" className="content-section work-section" aria-labelledby="work-heading" data-chapter="work">
        <SectionHeading title="Selected work" note="Four systems, each shown with the technologies it is built from" id="work-heading" />
        <div className="project-showcases">{flagshipProjects.map(project => <ProjectShowcase key={project.id} project={project} active={chapter === project.id} reducedMotion={reducedMotion} onExplore={openInObservatory} />)}</div>
        <div className="supporting-projects"><header><span>More systems</span><p>Supporting work and active experiments</p></header>{supportingProjects.map(project => <button key={project.id} type="button" onPointerEnter={() => setHoveredId(project.id)} onPointerLeave={() => setHoveredId(null)} onFocus={() => setHoveredId(project.id)} onBlur={() => setHoveredId(null)} style={{ '--project-accent': projectColor(project.id) } as CSSProperties} onClick={() => openInObservatory({ kind: 'project', id: project.id })}><strong>{project.title}</strong><span>{project.shortDescription}</span><small>{statusLabel(project.status)}</small></button>)}</div>
      </section>
      <section id="experience" className="content-section experience-section" aria-labelledby="experience-heading" data-chapter="experience"><SectionHeading title="Experience" note="Roles and organisations" id="experience-heading" /><div className="experience-list">{experience.map(item => <article key={item.id}>{item.period && <p className="experience-period">{item.period}</p>}<h3>{item.role}<span>{item.organisation}</span></h3><p>{item.shortDescription}</p>{item.technologies.length > 0 && <div className="experience-tech">{item.technologies.map(id => <span key={id}>{technologies.find(technology => technology.id === id)?.name ?? id}</span>)}</div>}</article>)}<a className="cv-line" href={`mailto:${profile.email}?subject=CV%20request`}><span>CV</span><strong>Ask for the full history by email</strong><Icon name="forward" /></a></div></section>
      <section id="technologies" className="content-section technology-section" aria-labelledby="technology-heading" data-chapter="technologies"><SectionHeading title="Technologies" note="Every technology here is backed by a project that uses it" id="technology-heading" /><TechnologyExplorer compact={compact} reducedMotion={reducedMotion} onOpen={openInObservatory} /></section>
      <section id="about" className="content-section about-section" aria-labelledby="about-heading" data-chapter="about"><SectionHeading title="About" note="Based in Ireland" id="about-heading" /><div className="about-copy"><p>I build software systems and interfaces that make complex work feel clear. My focus is dependable engineering, careful interaction design, and the infrastructure beneath both.</p></div></section>
      <section id="contact" className="content-section contact-section" aria-labelledby="contact-heading" data-chapter="contact"><SectionHeading title="Contact" note="Email, code, CV and Instagram" id="contact-heading" /><div className="contact-register"><a href={`mailto:${profile.email}`}><span>Email</span><strong>{profile.email}</strong><Icon name="forward" /></a><a href={profile.github} target="_blank" rel="noreferrer"><span>GitHub</span><strong translate="no">DavidEkpechue</strong><Icon name="external" /></a><a href={profile.instagram} target="_blank" rel="noreferrer"><span>Instagram</span><strong translate="no">@david_ekpec</strong><Icon name="external" /></a><a href={`mailto:${profile.email}?subject=CV%20request`}><span>CV</span><strong>Request a copy</strong><Icon name="forward" /></a></div></section>
    </main>
    <footer><span>&copy; {new Date().getFullYear()} David Ekpechue</span><span>Software engineer in Ireland</span><button type="button" onClick={backToTop}>Back to the top <Icon name="up" size={14} /></button></footer>
  </div>
}
