// PhDFlow — PhD student onboarding demo driver
// Launches with a clean user-data dir, walks through the app like a first-year PhD student.
// Screenshots land in C:\temp\phdflow-shots\

import { _electron as electron } from 'playwright-core'
import * as fs   from 'node:fs'
import * as path from 'node:path'

const APP_DIR  = path.resolve(import.meta.dirname, '..')
const SHOT_DIR = 'C:\\temp\\phdflow-shots'
const DATA_DIR = 'C:\\temp\\phdflow-fresh'

fs.mkdirSync(SHOT_DIR, { recursive: true })
fs.mkdirSync(DATA_DIR, { recursive: true })

const ELECTRON_BIN = path.join(APP_DIR, 'node_modules', 'electron', 'dist', 'electron.exe')

let step = 0
async function ss(page, name) {
  step++
  const label = String(step).padStart(2, '0') + '-' + name
  const f = path.join(SHOT_DIR, label + '.png')
  await page.screenshot({ path: f, fullPage: false })
  console.log(`[SHOT] ${f}`)
  return f
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function clickText(page, text) {
  return page.evaluate(t => {
    const els = [...document.querySelectorAll('button, a, [role="button"], li, div[onclick]')]
    const el  = els.find(e => e.textContent?.trim() === t)
             ?? els.find(e => e.textContent?.includes(t))
    if (!el) return 'NOT_FOUND: ' + t
    el.click(); return 'OK: ' + el.tagName + ' "' + el.textContent.trim().slice(0, 40) + '"'
  }, text)
}

async function clickSel(page, sel) {
  return page.evaluate(s => {
    const el = document.querySelector(s)
    if (!el) return 'NOT_FOUND: ' + s
    el.click(); return 'OK'
  }, sel)
}

async function fillInput(page, sel, value) {
  await page.evaluate(s => { const el = document.querySelector(s); if (el) el.focus() }, sel)
  await sleep(100)
  // clear existing
  await page.keyboard.press('Control+A')
  await page.keyboard.press('Delete')
  await page.keyboard.type(value, { delay: 40 })
}

// ─────────────────────────────────────────────────────────────────────────────

console.log('Launching PhDFlow with clean data dir...')
const app = await electron.launch({
  executablePath: ELECTRON_BIN,
  args: ['--user-data-dir=' + DATA_DIR, APP_DIR],
  timeout: 40_000,
})

await sleep(4000)

let page = app.windows().find(w => !w.url().startsWith('devtools://'))
        ?? await app.firstWindow()

console.log('Windows:', app.windows().length)
for (const w of app.windows()) console.log(' ', w.url())

await sleep(3000)
page = app.windows().find(w => !w.url().startsWith('devtools://')) ?? page
await ss(page, 'launch-screen')

// ─── STEP 1: Setup / Create Account ──────────────────────────────────────────
console.log('\n=== STEP 1: Account Setup ===')
await sleep(500)

// Check what screen we see
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300))
console.log('Screen text:', bodyText)
await ss(page, 'setup-screen')

// Fill in name
const nameInput = await page.evaluate(() => {
  const inputs = [...document.querySelectorAll('input')]
  const nameEl = inputs.find(i => i.placeholder?.toLowerCase().includes('name') || i.id?.includes('name') || i.name?.includes('name'))
  if (nameEl) { nameEl.focus(); return nameEl.placeholder || nameEl.id || nameEl.name }
  return 'not found: ' + inputs.map(i => i.placeholder || i.id || i.type).join(', ')
})
console.log('Name input:', nameInput)

if (!nameInput.startsWith('not found')) {
  await page.keyboard.type('Max Fischer', { delay: 50 })
  await sleep(300)
}

// Move to password fields
await page.keyboard.press('Tab')
await sleep(200)
await page.keyboard.type('PhD2024!secure', { delay: 50 })
await sleep(200)
await page.keyboard.press('Tab')
await sleep(200)
await page.keyboard.type('PhD2024!secure', { delay: 50 })
await sleep(400)
await ss(page, 'account-filled')

// Submit
const submitResult = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const btn  = btns.find(b => /create|setup|start|continue|get started/i.test(b.textContent))
  if (btn) { btn.click(); return 'clicked: ' + btn.textContent.trim() }
  return 'not found: ' + btns.map(b => b.textContent.trim()).join(' | ')
})
console.log('Submit:', submitResult)
await sleep(2500)
await ss(page, 'after-setup')

// ─── STEP 2: Login if needed ──────────────────────────────────────────────────
console.log('\n=== STEP 2: Login screen? ===')
const screen2 = await page.evaluate(() => document.body.innerText.slice(0, 200))
console.log('Screen:', screen2)

// Check if we're on a login screen
const isLogin = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  return btns.some(b => /login|sign in|unlock/i.test(b.textContent))
})
if (isLogin) {
  console.log('On login screen — filling password...')
  const pwInputs = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input[type="password"], input')]
    const pw = inputs.find(i => i.type === 'password' || i.placeholder?.toLowerCase().includes('password'))
    if (pw) { pw.focus(); return 'found' }
    return 'not found'
  })
  await sleep(200)
  await page.keyboard.type('PhD2024!secure', { delay: 50 })
  await sleep(300)
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')]
    const btn  = btns.find(b => /login|sign in|unlock|enter/i.test(b.textContent))
    if (btn) btn.click()
  })
  await sleep(2500)
}
await ss(page, 'dashboard')

// ─── STEP 3: Dismiss any modals / AI banner ───────────────────────────────────
console.log('\n=== STEP 3: Dismiss modals ===')
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const dismiss = btns.find(b => /close|skip|later|dismiss|×|✕/i.test(b.textContent) || b.getAttribute('aria-label')?.includes('close'))
  if (dismiss) { dismiss.click(); return 'dismissed' }
  return 'no modal'
})
await sleep(800)
await ss(page, 'dashboard-clean')

// ─── STEP 4: Create first Project ────────────────────────────────────────────
console.log('\n=== STEP 4: Navigate to Projects ===')
const navResult = await page.evaluate(() => {
  const navItems = [...document.querySelectorAll('nav li, nav a, nav button, [data-page], .nav-item, aside li')]
  const proj = navItems.find(n => /project/i.test(n.textContent))
  if (proj) { proj.click(); return 'clicked projects nav' }
  // try sidebar links
  const links = [...document.querySelectorAll('a, button')]
  const plink = links.find(l => /projects/i.test(l.textContent) && !l.textContent.includes('No projects'))
  if (plink) { plink.click(); return 'clicked projects link' }
  return 'not found — visible: ' + navItems.slice(0, 5).map(n => n.textContent.trim()).join(' | ')
})
console.log('Nav:', navResult)
await sleep(1000)
await ss(page, 'projects-page')

// Add new project
const addProjectResult = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const btn  = btns.find(b => /new project|add project|\+ project|create/i.test(b.textContent))
  if (btn) { btn.click(); return 'clicked: ' + btn.textContent.trim() }
  return 'not found: ' + btns.slice(0, 8).map(b => b.textContent.trim()).join(' | ')
})
console.log('Add project:', addProjectResult)
await sleep(800)
await ss(page, 'new-project-modal')

// Fill project name
await page.evaluate(() => {
  const inputs = [...document.querySelectorAll('input, textarea')]
  const el = inputs.find(i => i.placeholder?.toLowerCase().includes('name') || i.placeholder?.toLowerCase().includes('title') || i.type === 'text')
  if (el) el.focus()
})
await sleep(200)
await page.keyboard.type('Synaptic Plasticity & Memory Consolidation', { delay: 40 })
await sleep(300)

// Tab to description / notes field
await page.keyboard.press('Tab')
await sleep(200)
const descField = await page.evaluate(() => {
  const active = document.activeElement
  return active ? active.tagName + ' ' + (active.placeholder || active.id || '') : 'nothing focused'
})
console.log('Focused after Tab:', descField)

if (/textarea|input/i.test(descField) && !descField.includes('name') && !descField.includes('title')) {
  await page.keyboard.type('Investigating the molecular mechanisms of LTP and LTD in hippocampal CA1 neurons. Focus on AMPA receptor trafficking during memory encoding.', { delay: 30 })
}
await sleep(400)
await ss(page, 'project-form-filled')

// Save project
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const btn  = btns.find(b => /save|create|add|confirm/i.test(b.textContent) && !b.disabled)
  if (btn) btn.click()
})
await sleep(1200)
await ss(page, 'project-created')

// ─── STEP 5: Notes ───────────────────────────────────────────────────────────
console.log('\n=== STEP 5: Navigate to Notes ===')
await page.evaluate(() => {
  const links = [...document.querySelectorAll('nav li, nav a, nav button, aside li, aside a, [data-page]')]
  const el    = links.find(l => /notes/i.test(l.textContent))
  if (el) el.click()
})
await sleep(1000)
await ss(page, 'notes-page')

await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const btn  = btns.find(b => /new note|add note|\+ note|create/i.test(b.textContent))
  if (btn) btn.click()
})
await sleep(800)
await ss(page, 'new-note')

// Title
await page.evaluate(() => {
  const inputs = [...document.querySelectorAll('input')]
  const el = inputs.find(i => i.placeholder?.toLowerCase().includes('title') || i.id?.includes('title'))
  if (el) el.focus()
})
await sleep(200)
await page.keyboard.type('Week 1 — Meeting notes with Dr. Harrison', { delay: 35 })
await sleep(200)

// Body
await page.keyboard.press('Tab')
await sleep(300)
await page.keyboard.type(
  `Supervisor meeting summary:\n\n` +
  `- Start with literature review on AMPA receptor subunit composition\n` +
  `- Read Malenka & Bear (2004) Neuron review as starting point\n` +
  `- Set up lab notebook system ASAP\n` +
  `- Next meeting in 2 weeks — bring 5-paper reading list\n\n` +
  `Key insight: LTP induction requires coincident pre- and post-synaptic activity (Hebbian learning). Need to understand the NMDA receptor's role as a "coincidence detector".`,
  { delay: 20 }
)
await sleep(400)
await ss(page, 'note-filled')

await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const btn  = btns.find(b => /save|done|add/i.test(b.textContent) && !b.disabled)
  if (btn) btn.click()
})
await sleep(1000)
await ss(page, 'note-saved')

// ─── STEP 6: Calendar / Milestones ───────────────────────────────────────────
console.log('\n=== STEP 6: Calendar ===')
await page.evaluate(() => {
  const links = [...document.querySelectorAll('nav li, nav a, nav button, aside li, aside a, [data-page]')]
  const el    = links.find(l => /calendar|schedule|planner/i.test(l.textContent))
  if (el) el.click()
})
await sleep(1200)
await ss(page, 'calendar-page')

// ─── STEP 7: To-Do List ───────────────────────────────────────────────────────
console.log('\n=== STEP 7: To-Do ===')
await page.evaluate(() => {
  const links = [...document.querySelectorAll('nav li, nav a, nav button, aside li, aside a, [data-page]')]
  const el    = links.find(l => /to.do|task|todo/i.test(l.textContent))
  if (el) el.click()
})
await sleep(1000)
await ss(page, 'todo-page')

// Add a task
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const btn  = btns.find(b => /add|new|create|\+/i.test(b.textContent))
  if (btn) btn.click()
})
await sleep(600)

const todoInput = await page.evaluate(() => {
  const inputs = [...document.querySelectorAll('input')]
  const el = inputs.find(i => i.placeholder?.toLowerCase().includes('task') || i.placeholder?.toLowerCase().includes('add') || i.type === 'text')
  if (el) { el.focus(); return 'found: ' + el.placeholder }
  return 'not found'
})
console.log('Todo input:', todoInput)

if (!todoInput.startsWith('not found')) {
  await page.keyboard.type('Read Malenka & Bear (2004) — LTP/LTD review', { delay: 35 })
  await page.keyboard.press('Enter')
  await sleep(400)
}

await ss(page, 'todo-task-added')

// ─── STEP 8: Paper Library ────────────────────────────────────────────────────
console.log('\n=== STEP 8: Paper Library ===')
await page.evaluate(() => {
  const links = [...document.querySelectorAll('nav li, nav a, nav button, aside li, aside a, [data-page]')]
  const el    = links.find(l => /paper|library|literature|bib/i.test(l.textContent))
  if (el) el.click()
})
await sleep(1200)
await ss(page, 'paper-library')

// ─── STEP 9: Literature Feed ──────────────────────────────────────────────────
console.log('\n=== STEP 9: Literature Feed ===')
await page.evaluate(() => {
  const links = [...document.querySelectorAll('nav li, nav a, nav button, aside li, aside a, [data-page]')]
  const el    = links.find(l => /feed|discover|arxiv|search/i.test(l.textContent))
  if (el) el.click()
})
await sleep(1200)
await ss(page, 'literature-feed')

// ─── STEP 10: Researcher Discover ────────────────────────────────────────────
console.log('\n=== STEP 10: Researcher Network ===')
await page.evaluate(() => {
  const links = [...document.querySelectorAll('nav li, nav a, nav button, aside li, aside a, [data-page]')]
  const el    = links.find(l => /discover|network|contact|researcher/i.test(l.textContent))
  if (el) el.click()
})
await sleep(1200)
await ss(page, 'researcher-page')

// ─── STEP 11: Whiteboard ─────────────────────────────────────────────────────
console.log('\n=== STEP 11: Whiteboard ===')
await page.evaluate(() => {
  const links = [...document.querySelectorAll('nav li, nav a, nav button, aside li, aside a, [data-page]')]
  const el    = links.find(l => /whiteboard|canvas|draw|brainstorm/i.test(l.textContent))
  if (el) el.click()
})
await sleep(1500)
await ss(page, 'whiteboard')

// ─── STEP 12: Back to Dashboard ───────────────────────────────────────────────
console.log('\n=== STEP 12: Dashboard overview ===')
await page.evaluate(() => {
  const links = [...document.querySelectorAll('nav li, nav a, nav button, aside li, aside a, [data-page]')]
  const el    = links.find(l => /dashboard|home|overview/i.test(l.textContent))
  if (el) el.click()
})
await sleep(1500)
await ss(page, 'dashboard-final')

console.log('\n=== All steps complete ===')
console.log('Screenshots in:', SHOT_DIR)
console.log('Leaving app open for inspection...')
// Keep app open for 30 seconds so user can interact
await sleep(30000)
await app.close()
