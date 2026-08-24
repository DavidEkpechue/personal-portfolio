# David Ekpechue — Portfolio Universe

A data-driven React portfolio that uses a restrained WebGL constellation as a second navigation layer. Recruiters can use the standard page structure; visitors can select a project, technology, or domain to reframe the graph and update the URL.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## Update portfolio content

All editable content lives in [`src/data/portfolio.ts`](src/data/portfolio.ts): projects, technologies, domains, and experience. Add a CV PDF to `public/` and update the CV link in `src/App.tsx` when it is ready.

## Routes

- `/projects/minglr`
- `/tech/typescript`
- `/domain/backend`

The app uses the browser history API, so Back and Forward preserve constellation focus.
