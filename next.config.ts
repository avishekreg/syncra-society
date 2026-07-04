import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  /** App Router only — ignore Vite SPA files under src/pages/*.tsx */
  pageExtensions: ['page.tsx', 'page.ts', 'route.ts', 'layout.tsx', 'loading.tsx', 'error.tsx', 'not-found.tsx']
}

export default nextConfig
