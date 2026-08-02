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
    },
    {
      /**
       * Capacitor packages `dist` into the APK. Hosted download APKs under
       * public/downloads must never be embedded — that nested the previous
       * ~100MB installer inside every new build.
       */
      name: 'strip-apks-for-capacitor',
      closeBundle() {
        if (process.env.CAPACITOR_BUILD !== '1') return
        const downloadsDir = path.resolve(__dirname, 'dist/downloads')
        if (!fs.existsSync(downloadsDir)) return
        for (const entry of fs.readdirSync(downloadsDir)) {
          if (entry.endsWith('.apk')) {
            fs.unlinkSync(path.join(downloadsDir, entry))
          }
        }
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
