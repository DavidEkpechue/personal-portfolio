import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { sites } from '@openai/sites-vite-plugin'
import { existsSync } from 'node:fs'

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

export default defineConfig({
  plugins: [react(), ...(existsSync('.openai/hosting.json') ? [sites()] : []), staticWorker],
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
})
