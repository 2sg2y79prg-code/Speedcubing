/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' makes the build work from any sub-path (GitHub Pages) as well as a root domain (Vercel).
export default defineConfig({
  base: './',
  plugins: [react()],
  test: { environment: 'node' },
});
