export interface ProjectNodeColor {
  color: string
  rgb: string
}

const projectNodeColors: Record<string, ProjectNodeColor> = {
  minglr: { color: '#876eff', rgb: '135,110,255' },
  'agent-forge': { color: '#7476dd', rgb: '116,118,221' },
  '4thspace': { color: '#9d70d7', rgb: '157,112,215' },
  izrosh: { color: '#92647f', rgb: '146,100,127' },
  'eze-travels': { color: '#8f7bc6', rgb: '143,123,198' },
  'constellation-portfolio': { color: '#8278b7', rgb: '130,120,183' },
  'untitled-mech-game': { color: '#80719e', rgb: '128,113,158' },
  'dino-game': { color: '#8b79ab', rgb: '139,121,171' },
  'library-management-system': { color: '#7881ad', rgb: '120,129,173' },
  'home-server': { color: '#74758f', rgb: '116,117,143' },
}

const fallbackProjectColor: ProjectNodeColor = { color: '#8b70ff', rgb: '139,112,255' }

export function getProjectNodeColor(projectId: string) {
  return projectNodeColors[projectId] ?? fallbackProjectColor
}
