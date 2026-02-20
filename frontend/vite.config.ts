// FILEPATH: frontend/vite.config.ts
// @file: Vite Configuration
// @description: Configures the build system and path aliases.
// @updated: RESTORED lost aliases (@api, @meta-kernel) to fix resolution errors. */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // ⚡ UNIVERSAL ROOT
      '@': path.resolve(__dirname, './src'),
      '@platform': path.resolve(__dirname, './src/platform'),
      '@domains': path.resolve(__dirname, './src/domains'),
      '@kernel': path.resolve(__dirname, './src/_kernel'),
      '@meta-kernel': path.resolve(__dirname, './src/domains/meta/_kernel'),
      '@api': path.resolve(__dirname, './src/api'),
      '@components': path.resolve(__dirname, './src/components'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    host: true, // Listen on all addresses
    port: 5173,
    watch: {
        usePolling: true // Docker/Windows compat
    }
  }
})

