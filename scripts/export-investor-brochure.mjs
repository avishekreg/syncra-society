#!/usr/bin/env node
/**
 * Export the product brochure to a high-resolution A4 PDF via Puppeteer.
 *
 * Usage:
 *   npm run brochure:pdf
 *
 * Requires a production build (`npm run build`) or will build automatically.
 */
import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'public', 'downloads')
const outFile = path.join(outDir, 'investor-brochure.pdf')
const PORT = process.env.BROCHURE_PORT || '4177'
const BASE = `http://127.0.0.1:${PORT}`

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status === 200) return
    } catch {
      // retry
    }
    await delay(500)
  }
  throw new Error(`Preview server did not become ready at ${url}`)
}

function run(command, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...opts
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))
    })
  })
}

async function main() {
  console.log('→ Building production bundle…')
  await run('npm', ['run', 'build'])

  console.log(`→ Starting vite preview on :${PORT}…`)
  const preview = spawn(
    'npx',
    ['vite', 'preview', '--host', '127.0.0.1', '--port', PORT, '--strictPort'],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' }
  )

  let previewLog = ''
  preview.stdout?.on('data', (chunk) => {
    previewLog += String(chunk)
  })
  preview.stderr?.on('data', (chunk) => {
    previewLog += String(chunk)
  })

  try {
    await waitForServer(`${BASE}/`)
    console.log('→ Launching Puppeteer…')

    const puppeteer = await import('puppeteer')
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--font-render-hinting=none', '--disable-lcd-text']
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 })
    const exportUrl = `${BASE}/investor-brochure?deck=full&lang=en&print=1&t=${Date.now()}&cb=${Date.now()}`
    await page.goto(exportUrl, {
      waitUntil: 'networkidle0',
      timeout: 120000
    })

    // Allow QR + fonts to settle
    await delay(1500)
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready
    })

    await mkdir(outDir, { recursive: true })

    await page.pdf({
      path: outFile,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      displayHeaderFooter: false
    })

    await browser.close()
    console.log(`✓ Wrote ${path.relative(root, outFile)}`)
  } finally {
    preview.kill('SIGTERM')
    // Ensure process exits even if preview ignores SIGTERM briefly
    await delay(300)
    if (!preview.killed) preview.kill('SIGKILL')
    if (previewLog && process.env.DEBUG_BROCHURE) {
      createWriteStream(path.join(root, 'brochure-preview.log')).end(previewLog)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
