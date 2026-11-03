# Project media sources

This file records where production portfolio media came from and which constellation emphasis each state drives. Local paths, credentials, private operational identifiers, and browser chrome are intentionally excluded.

## Minglr

Source repository: `DavidEkpechue/Minglr`

| Media state | Capture source | Type | Graph emphasis |
| --- | --- | --- | --- |
| Product | Current party setup and camera-check interface | Live local capture using the repository's safe E2E backend | React, TypeScript |
| Matchmaking | Current ready party queued for a match | Live local capture using anonymous fixture sessions | Redis, Socket.IO, Express |
| Video system | Current media service, signalling and room-state implementation | Repository-verified architecture diagram | WebRTC, mediasoup, Socket.IO |
| Moderation | Current moderation routes and data model | Repository-verified architecture diagram | React, Express, PostgreSQL |
| Infrastructure | Current workspace services and k3s deployment manifests | Repository-verified architecture diagram | Docker, Kubernetes, Redis |

## Agent Forge

Source repository: `agent-forge-david/agent-forge`

The local control plane requires private operational infrastructure to render meaningful persisted runs. Rather than expose those identifiers or invent dashboard data, the portfolio uses diagrams derived from the current implementation and canonical technical documents.

| Media state | Capture source | Type | Graph emphasis |
| --- | --- | --- | --- |
| Control plane | API, orchestrator, controller, database and queue service boundaries | Repository-verified architecture diagram | Agent Systems, PostgreSQL, BullMQ |
| Execution | Durable AgentRun and Kubernetes Job lifecycle | Repository-verified architecture diagram | Kubernetes, Helm, Docker |
| Delivery | Builder, reviewer, checks and pull-request state machine | Repository-verified architecture diagram | GitHub API, OpenCode, Agent Systems |
| Communication | Versioned message envelope and scoped durable targets | Repository-verified architecture diagram | TypeScript, Zod, SSE |

## 4thSpace

Source repositories: `DavidEkpechue/4thSpaceFrontEnd`, `DavidEkpechue/4thSpaceBackend`, `DavidEkpechue/4thSpaceMobile`

| Media state | Capture source | Type | Graph emphasis |
| --- | --- | --- | --- |
| Discovery | Current authenticated discovery screen | Live local capture using the repository's browser fixture | React, PostGIS, MeiliSearch |
| Groups | Current group detail screen | Live local capture using the repository's browser fixture | React, Node.js, PostgreSQL |
| Messaging | Current group conversation screen | Live local capture using the repository's browser fixture | Socket.IO, Redis, Node.js |
| Events | Current events screen | Live local capture using the repository's browser fixture | PostGIS, Mapbox, PostgreSQL |
| Mobile | Current web/mobile packages and shared backend contracts | Repository-verified architecture diagram | React Native, Expo, TanStack Query |

## IZROSH

Live source: `https://izrosh.com`

These frames were captured from the public production storefront at 1440×900. A beat licence was added to the browser-local cart solely to capture the pre-checkout state; no checkout or payment was initiated.

| Media state | Capture source | Type | Graph emphasis |
| --- | --- | --- | --- |
| Storefront | Public production homepage | Live production capture | React, TypeScript |
| Catalogue | Public production beat archive | Live production capture | React, TypeScript, PostgreSQL |
| Cart | Public production cart before checkout | Live production capture | Stripe, Express, PostgreSQL |
| Licensing | Public production beat licence comparison | Live production capture | Prisma, PostgreSQL, Stripe |
| Digital products | Public production drum-kit catalogue | Live production capture | S3/R2, Docker, Redis |

## Asset policy

- Production screenshots are exported as 1280×720 WebP at a visually reviewed quality level.
- SVG is used for architecture diagrams so text and lines remain crisp without shipping large raster files.
- Raw capture PNGs are temporary and are not part of the production bundle.
- `Project.media` is the only public source of project-media paths, alternative text, provenance type, and graph emphasis.
