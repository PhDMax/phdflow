// Debug tour — launches app, bypasses login in dev, screenshots every view
import { _electron as electron } from 'playwright-core'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'

const ROOT   = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SHOTS  = path.join(ROOT, 'debug-shots')
fs.mkdirSync(SHOTS, { recursive: true })

const electronBin = path.join(ROOT, 'node_modules/electron/dist/electron.exe')

const VIEWS = [
  'dashboard','projects','library','grants','news',
  'notes','whiteboard','utilities','discover','contacts',
  'calendar','todos','feedback','settings','support','guide'
]

async function shot(page, name) {
  const f = path.join(SHOTS, name + '.png')
  await page.screenshot({ path: f, fullPage: false, timeout: 8000 }).catch(e => console.warn('  ⚠ screenshot failed:', e.message))
  console.log('  📸', name + '.png')
}

async function waitIdle(page) {
  // Wait for any loading spinners to disappear or 1s max
  try {
    await page.waitForFunction(
      () => !document.querySelector('.spin:not(.hidden)'),
      { timeout: 2000 }
    )
  } catch {}
  await page.waitForTimeout(400)
}

;(async () => {
  console.log('Launching…')
  const app = await electron.launch({
    executablePath: electronBin,
    args: [ROOT],
    timeout: 30_000,
    env: { ...process.env, ELECTRON_ENABLE_LOGGING: '0' }
  })

  // Find the main window
  await app.firstWindow()
  await new Promise(r => setTimeout(r, 6000))
  const page = app.windows().find(w => !w.url().startsWith('devtools://'))
           ?? await app.firstWindow()

  console.log('Windows:', app.windows().map(w => w.url()))
  await shot(page, '00-login')

  // ── Bypass auth: hide overlay + inject stub api + call loadAndShowApp ─────────
  const bypassed = await page.evaluate(() => {
    // Hide the login overlay immediately
    const overlay = document.getElementById('login-overlay')
    if (overlay) overlay.style.display = 'none'
    // Stub out any storeGet calls that might hang on locked state
    if (window.api && window.api.storeGet) {
      const real = window.api.storeGet
      window.api.storeGet = async (k) => { try { return await real(k) } catch { return null } }
    }
    return typeof loadAndShowApp
  })
  console.log('loadAndShowApp type:', bypassed)

  // Call loadAndShowApp in a fire-and-forget (don't await, it might hang on IPC)
  await page.evaluate(() => {
    try { loadAndShowApp().catch(e => console.error('lasa err', e)) } catch(e) { console.error(e) }
  })
  await page.waitForTimeout(3000)

  // Check what's visible now
  const visible = await page.evaluate(() => {
    return {
      loginVisible: document.getElementById('login-overlay')?.style.display !== 'none',
      viewContent:  document.getElementById('view-content')?.innerHTML?.slice(0,100),
      bodyText:     document.body?.innerText?.slice(0,200),
    }
  })
  console.log('Page state after bypass:', JSON.stringify(visible, null, 2))
  await shot(page, '01-post-bypass')

  // ── Navigate every view ──────────────────────────────────────────────────────
  for (const view of VIEWS) {
    console.log('\nNavigating to:', view)
    try {
      const result = await page.evaluate(async (v) => {
        if (typeof showView === 'function') {
          showView(v)
          return 'ok'
        }
        return 'showView not found'
      }, view)
      console.log('  showView result:', result)
      await waitIdle(page)
      await shot(page, `${String(VIEWS.indexOf(view)+2).padStart(2,'0')}-${view}`)

      // Grab any console errors
      const errors = await page.evaluate(() => window.__debugErrors || [])
      if (errors.length) console.warn('  ⚠ JS errors:', errors)
    } catch (e) {
      console.error('  ✕ Error on', view, ':', e.message)
    }
  }

  // ── Check for JS errors logged to console ───────────────────────────────────
  console.log('\nDone. Shots in:', SHOTS)
  await app.close()
})().catch(e => { console.error('Fatal:', e); process.exit(1) })
