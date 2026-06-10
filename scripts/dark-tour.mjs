// Dark/light mode tour — launches app, bypasses login, screenshots every view
// in both themes for a readability/contrast audit. Output goes outside the repo.
import { _electron as electron } from 'playwright-core'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'

const ROOT  = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SHOTS = 'C:\\temp\\phdflow-theme-tour'
fs.mkdirSync(SHOTS, { recursive: true })

const electronBin = path.join(ROOT, 'node_modules/electron/dist/electron.exe')

const VIEWS = [
  'dashboard','pipeline','writing','projects','notes','whiteboard','library','calendar','todos','contacts',
  'pdf_tools','citations','unit_conv','r_assist',
  'news','grants','discover','feedback','settings','support'
]

async function shot(page, name) {
  const f = path.join(SHOTS, name + '.png')
  await page.screenshot({ path: f, fullPage: false, timeout: 8000 }).catch(e => console.warn('  ⚠ screenshot failed:', e.message))
  console.log('  📸', name + '.png')
}

async function waitIdle(page) {
  try {
    await page.waitForFunction(() => !document.querySelector('.spin:not(.hidden)'), { timeout: 2000 })
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

  await app.firstWindow()
  await new Promise(r => setTimeout(r, 6000))
  const page = app.windows().find(w => !w.url().startsWith('devtools://')) ?? await app.firstWindow()

  // Bypass auth
  await page.evaluate(() => {
    const overlay = document.getElementById('login-overlay')
    if (overlay) overlay.style.display = 'none'
    if (window.api && window.api.storeGet) {
      const real = window.api.storeGet
      window.api.storeGet = async (k) => { try { return await real(k) } catch { return null } }
    }
  })
  await page.evaluate(() => { try { loadAndShowApp().catch(e => console.error('lasa err', e)) } catch(e) { console.error(e) } })
  await page.waitForTimeout(3000)

  for (const theme of ['light', 'dark']) {
    console.log(`\n=== THEME: ${theme} ===`)
    await page.evaluate((t) => { applyTheme(t) }, theme)
    await page.waitForTimeout(300)

    for (const view of VIEWS) {
      console.log('Navigating to:', view)
      try {
        await page.evaluate((v) => { showView(v) }, view)
        await waitIdle(page)

        // For whiteboard, make sure there's a board with some shapes so we
        // can see canvas + toolbar + sticky/shape colours together.
        if (view === 'whiteboard') {
          await page.evaluate(() => {
            if (!(state.whiteboards||[]).length && typeof wbNewBoard === 'function') {
              wbNewBoard()
            }
          }).catch(()=>{})
          await waitIdle(page)
        }

        await shot(page, `${theme}-${String(VIEWS.indexOf(view)+1).padStart(2,'0')}-${view}`)
      } catch (e) {
        console.error('  ✕ Error on', view, ':', e.message)
      }
    }
  }

  console.log('\nDone. Shots in:', SHOTS)
  await app.close()
})().catch(e => { console.error('Fatal:', e); process.exit(1) })
