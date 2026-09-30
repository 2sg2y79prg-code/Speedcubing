/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' makes the build work from any sub-path (GitHub Pages) as well as a root domain (Vercel).
export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    // Vercel sets this at build time to the project's main domain (e.g. my-site.vercel.app).
    __PROD_HOST__: JSON.stringify(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? ''),
  },
  test: { environment: 'node' },
});
