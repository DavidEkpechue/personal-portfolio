import type { Experience } from './types'

// From the 2026 CV supplied by the owner. Technologies list only ids the map knows.
export const experience: Experience[] = [
  {
    id: 'ibm-software-developer',
    organisation: 'IBM, Dublin',
    role: 'Software Developer',
    period: 'Jun 2026 – present',
    technologies: ['openapi', 'kubernetes', 'docker', 'linux'],
    shortDescription: 'Product features for IBM DataPower Interact Gateway across API engineering, CI/CD and automated testing, deployed to Kubernetes and OpenShift. Jenkins pipeline stages from build through cluster deployment and cleanup, and AI-assisted API generation in IBM API Connect that turns natural-language input into validated OpenAPI specifications.',
    verification: 'owner-confirmed',
  },
  {
    id: 'ibm-software-development-intern',
    organisation: 'IBM, Dublin',
    role: 'Software Development Intern',
    period: 'Jan 2025 – Sep 2025',
    technologies: [],
    shortDescription: 'Backend API services in a large production codebase, moving from onboarding to regular development work in an Agile team, with changes delivered through Git review.',
    verification: 'owner-confirmed',
  },
  {
    id: 'tu-dublin-computer-science',
    organisation: 'Technological University Dublin',
    role: 'B.Sc. (Hons) Computer Science',
    period: 'Graduated May 2026',
    technologies: [],
    shortDescription: 'Second Class Honours, Grade 1 (2:1).',
    verification: 'owner-confirmed',
  },
]
