// Renders PhDFlow app icon (512x512) and Discord server icon (512x512) via Playwright
import { chromium } from 'playwright-core'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BUILD = path.join(ROOT, 'build')
fs.mkdirSync(BUILD, { recursive: true })

// ── App icon SVG — deep indigo gradient, flask + atom motif, clean & modern ──
const APP_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#312e81"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <linearGradient id="flask" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#a5b4fc"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#4f46e5" flood-opacity="0.5"/>
    </filter>
    <filter id="glow-filter">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>

  <!-- Subtle grid pattern -->
  <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(99,102,241,0.12)" stroke-width="1"/>
  </pattern>
  <rect width="512" height="512" rx="96" fill="url(#grid)"/>

  <!-- Flask body -->
  <g filter="url(#shadow)">
    <!-- Flask neck -->
    <rect x="218" y="108" width="76" height="108" rx="8" fill="url(#flask)" opacity="0.9"/>
    <!-- Flask body (trapezoid via polygon) -->
    <polygon points="218,216 294,216 350,360 162,360" fill="url(#flask)" opacity="0.85"/>
    <!-- Flask bottom cap -->
    <ellipse cx="256" cy="360" rx="94" ry="20" fill="#4f46e5" opacity="0.7"/>
  </g>

  <!-- Liquid inside flask -->
  <clipPath id="flask-clip">
    <polygon points="218,216 294,216 350,360 162,360"/>
  </clipPath>
  <g clip-path="url(#flask-clip)">
    <rect x="150" y="290" width="220" height="80" fill="#6366f1" opacity="0.6"/>
    <ellipse cx="256" cy="290" rx="110" ry="14" fill="#818cf8" opacity="0.5"/>
    <!-- Bubbles -->
    <circle cx="220" cy="320" r="8" fill="#a5b4fc" opacity="0.7"/>
    <circle cx="260" cy="310" r="5" fill="#c7d2fe" opacity="0.6"/>
    <circle cx="290" cy="330" r="6" fill="#a5b4fc" opacity="0.5"/>
  </g>

  <!-- Flask rim highlight -->
  <rect x="218" y="108" width="76" height="10" rx="4" fill="#c7d2fe" opacity="0.6"/>

  <!-- Atom orbits (top-right) -->
  <g transform="translate(378,138)" filter="url(#glow-filter)">
    <ellipse cx="0" cy="0" rx="44" ry="18" fill="none" stroke="#818cf8" stroke-width="2.5" opacity="0.8"/>
    <ellipse cx="0" cy="0" rx="44" ry="18" fill="none" stroke="#818cf8" stroke-width="2.5" opacity="0.8" transform="rotate(60)"/>
    <ellipse cx="0" cy="0" rx="44" ry="18" fill="none" stroke="#818cf8" stroke-width="2.5" opacity="0.8" transform="rotate(120)"/>
    <circle cx="0" cy="0" r="7" fill="#a5b4fc"/>
  </g>

  <!-- Stars / dots decoration -->
  <circle cx="148" cy="148" r="3" fill="#818cf8" opacity="0.6"/>
  <circle cx="120" cy="200" r="2" fill="#6366f1" opacity="0.5"/>
  <circle cx="390" cy="300" r="2.5" fill="#818cf8" opacity="0.4"/>
  <circle cx="410" cy="380" r="2" fill="#6366f1" opacity="0.4"/>
  <circle cx="130" cy="350" r="2" fill="#818cf8" opacity="0.3"/>

  <!-- PhDFlow wordmark at bottom -->
  <text x="256" y="430" font-family="'Segoe UI',system-ui,sans-serif" font-size="52" font-weight="800"
    fill="white" text-anchor="middle" letter-spacing="-2" opacity="0.95">PhDFlow</text>
  <text x="256" y="462" font-family="'Segoe UI',system-ui,sans-serif" font-size="20" font-weight="400"
    fill="#a5b4fc" text-anchor="middle" letter-spacing="1">research · organized</text>
</svg>
`

// ── Discord icon — bold, square-ish, just the mark (no wordmark) ─────────────
const DISCORD_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="dbg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4338ca"/>
      <stop offset="50%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>
    <linearGradient id="dflask" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#e0e7ff"/>
      <stop offset="100%" stop-color="#c7d2fe"/>
    </linearGradient>
    <filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#3730a3" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="120" fill="url(#dbg)"/>

  <!-- Subtle noise/texture overlay -->
  <rect width="512" height="512" rx="120" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>

  <!-- Large flask — centered, prominent -->
  <g filter="url(#ds)" transform="translate(256,256)">
    <!-- Neck -->
    <rect x="-42" y="-148" width="84" height="100" rx="10" fill="url(#dflask)"/>
    <!-- Body -->
    <polygon points="-42,-48 42,-48 105,120 -105,120" fill="url(#dflask)" opacity="0.95"/>
    <!-- Bottom -->
    <ellipse cx="0" cy="120" rx="105" ry="22" fill="#c7d2fe" opacity="0.6"/>
    <!-- Liquid -->
    <clipPath id="dc">
      <polygon points="-42,-48 42,-48 105,120 -105,120"/>
    </clipPath>
    <g clip-path="url(#dc)">
      <rect x="-115" y="48" width="230" height="80" fill="#6366f1" opacity="0.55"/>
      <ellipse cx="0" cy="48" rx="115" ry="14" fill="#818cf8" opacity="0.45"/>
      <circle cx="-28" cy="80" r="9" fill="white" opacity="0.3"/>
      <circle cx="18" cy="68" r="6" fill="white" opacity="0.25"/>
      <circle cx="48" cy="88" r="7" fill="white" opacity="0.2"/>
    </g>
    <!-- Rim highlight -->
    <rect x="-42" y="-148" width="84" height="12" rx="5" fill="white" opacity="0.4"/>
    <!-- Neck shine -->
    <rect x="-18" y="-140" width="12" height="90" rx="4" fill="white" opacity="0.15"/>
  </g>

  <!-- Atom overlay (subtle, top right) -->
  <g transform="translate(400,112)" opacity="0.55">
    <ellipse cx="0" cy="0" rx="52" ry="20" fill="none" stroke="white" stroke-width="2"/>
    <ellipse cx="0" cy="0" rx="52" ry="20" fill="none" stroke="white" stroke-width="2" transform="rotate(60)"/>
    <ellipse cx="0" cy="0" rx="52" ry="20" fill="none" stroke="white" stroke-width="2" transform="rotate(120)"/>
    <circle cx="0" cy="0" r="7" fill="white" opacity="0.9"/>
  </g>

  <!-- "Phd" small label bottom -->
  <text x="256" y="472" font-family="'Segoe UI',system-ui,sans-serif" font-size="58" font-weight="900"
    fill="white" text-anchor="middle" letter-spacing="-1" opacity="0.92">PhDFlow</text>
</svg>
`

async function renderSVG(browser, svg, outputPath, size = 512) {
  const page = await browser.newPage()
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<!DOCTYPE html>
<html><head><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${size}px;height:${size}px;overflow:hidden;background:transparent}
  svg{display:block}
</style></head>
<body>${svg}</body></html>`)
  await page.waitForTimeout(200)
  await page.screenshot({ path: outputPath, omitBackground: true, type: 'png' })
  await page.close()
  console.log('  ✓', outputPath)
}

;(async () => {
  console.log('Launching browser…')
  const browser = await chromium.launch({ headless: true })

  await renderSVG(browser, APP_SVG,     path.join(BUILD, 'icon.png'), 512)
  await renderSVG(browser, DISCORD_SVG, path.join(ROOT,  'discord-icon.png'), 512)

  await browser.close()
  console.log('\nDone.')
})().catch(e => { console.error('Fatal:', e); process.exit(1) })
