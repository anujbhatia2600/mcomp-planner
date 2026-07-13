import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves from /<repo-name>/ — the workflow sets DEPLOY_TARGET=ghpages.
// If you rename the repo, change the path below to match.
export default defineConfig({
  plugins: [react()],
  base: process.env.DEPLOY_TARGET === 'ghpages' ? '/mcomp-planner/' : '/',
  server: { port: 5173, open: true, host: true },
})
