/**
 * =========================================================================================
 * CRITICAL DEPLOYMENT & WIKI INTEGRITY REMINDER:
 * - NEVER DELETE `.github/workflows/deploy.yml`.
 * - This wiki is deployed to GitHub Pages via GitHub Actions.
 * - Base path MUST remain `process.env.GITHUB_ACTIONS === 'true' ? '/Super-Bonemeal-Wiki/' : '/'`
 *   to ensure all scripts, stylesheets, and assets load properly on GitHub Pages.
 * =========================================================================================
 */
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: process.env.GITHUB_ACTIONS === 'true' ? '/Super-Bonemeal-Wiki/' : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

