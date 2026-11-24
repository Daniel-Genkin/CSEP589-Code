// End-to-end smoke test: the PRD's demo script against a production build served locally.
// `npm run test:e2e` builds, serves the build on port 4173 and runs e2e/demo.spec.ts in Chromium.
import { defineConfig } from '@playwright/test'

const PORT = 4173

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  // Print each step of the demo script, so a run shows which steps pass.
  reporter: [['list', { printSteps: true }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
