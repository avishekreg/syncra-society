import path from 'node:path'
import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [
    react(),
    {
      name: 'spa-fallback-404',
      closeBundle() {
        const distDir = path.resolve(__dirname, 'dist')
        const indexPath = path.join(distDir, 'index.html')
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, path.join(distDir, '404.html'))
        }
      }
    },
    {
      name: 'emit-app-version',
      closeBundle() {
        const distDir = path.resolve(__dirname, 'dist')
        const buildSha =
          process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'local-dev'
        const builtAt = new Date().toISOString()
        const appVersion = process.env.VITE_APP_VERSION || 'v1.0.0'
        fs.writeFileSync(
          path.join(distDir, 'app-version.json'),
          `${JSON.stringify({ appVersion, buildSha, builtAt }, null, 2)}\n`
        )
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 5173,
    strictPort: true
  }
})
