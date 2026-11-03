import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { sites } from '@openai/sites-vite-plugin'
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

const staticWorker: Plugin = {
  name: 'portfolio-static-worker',
  apply: 'build',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'server/index.js',
      source: `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;
    const url = new URL(request.url);
    url.pathname = '/';
    return env.ASSETS.fetch(new Request(url, request));
  }
};\n`,
    })
  },
}

// Raw captures and AI-generated mockups stay in public/ for reference but are
// not published; only reviewed media referenced by src/data ships.
const unpublishedMedia = /^(ChatGPT Image .*|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.png$/
const pruneUnpublishedMedia: Plugin = {
  name: 'portfolio-prune-unpublished-media',
  apply: 'build',
  closeBundle() {
    const walk = (directory: string): void => {
      if (!existsSync(directory)) return
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name)
        if (entry.isDirectory()) walk(path)
        else if (unpublishedMedia.test(entry.name)) rmSync(path)
      }
    }
    walk(resolve('dist/projects'))
  },
}

export default defineConfig({
  plugins: [react(), ...(existsSync('.openai/hosting.json') ? [sites()] : []), staticWorker, pruneUnpublishedMedia],
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
})
