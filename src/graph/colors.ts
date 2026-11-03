import { projectColor, rgbOf } from './palette'

export interface ProjectNodeColor {
  color: string
  rgb: string
}

// Each project glows in the colour of the domain that defines it.
export function getProjectNodeColor(projectId: string): ProjectNodeColor {
  const color = projectColor(projectId)
  return { color, rgb: rgbOf(color) }
}
