// PhDFlow — Rigorous first-time PhD student test
// Uses exact field IDs from the source code for every form.
// Screenshots → C:\temp\phdflow-test\
// Run: node scripts/phd-rigorous-test.mjs

import { _electron as electron } from 'playwright-core'
import * as fs   from 'node:fs'
import * as path from 'node:path'

const APP_DIR  = path.resolve(import.meta.dirname, '..')
const SHOT_DIR = 'C:\\temp\\phdflow-test'
const DATA_DIR = 'C:\\temp\\phdflow-test-data'

// Always start with a clean slate so we hit setup mode, not login mode
if (fs.existsSync(DATA_DIR)) {
  fs.rmSync(DATA_DIR, { recursive: true, force: true })
  console.log('  Wiped old data dir:', DATA_DIR)
}
fs.mkdirSync(SHOT_DIR, { recursive: true })
fs.mkdirSync(DATA_DIR, { recursive: true })

const ELECTRON_BIN = path.join(APP_DIR, 'node_modules', 'electron', 'dist', 'electron.exe')

let step = 0

async function ss(page, name) {
  step++
  const label = String(step).padStart(2, '0') + '-' + name
  const f = path.join(SHOT_DIR, label + '.png')
  try { await page.screenshot({ path: f }) } catch {}
  console.log(`  [📸 ${step}] ${label}.png`)
  return f
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Fill an input by its exact element ID, clearing first
async function fill(page, id, value) {
  const ok = await page.evaluate(({ id, val }) => {
    const el = document.getElementById(id)
    if (!el) return false
    el.focus()
    el.value = val
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  }, { id, val: value })
  if (!ok) console.log(`    ⚠ fill: #${id} not found`)
  return ok
}

// Set a <select> by ID and value
async function select(page, id, value) {
  const ok = await page.evaluate(({ id, val }) => {
    const el = document.getElementById(id)
    if (!el) return false
    el.value = val
    el.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  }, { id, val: value })
  if (!ok) console.log(`    ⚠ select: #${id} not found`)
  return ok
}

// Click a button/element by its onclick attribute content or exact text
async function clickOnclick(page, onclickSnippet) {
  const ok = await page.evaluate(({ snippet }) => {
    const el = [...document.querySelectorAll('[onclick]')]
      .find(e => e.getAttribute('onclick')?.includes(snippet))
    if (el) { el.click(); return true }
    return false
  }, { snippet: onclickSnippet })
  if (!ok) console.log(`    ⚠ clickOnclick: "${onclickSnippet}" not found`)
  return ok
}

// Click any button whose visible text contains the string (case-insensitive)
async function clickText(page, text, timeout = 800) {
  const ok = await page.evaluate(({ t }) => {
    const els = [...document.querySelectorAll('button, a, [role="button"]')]
    const el = els.find(e => e.textContent?.trim().toLowerCase().includes(t.toLowerCase()))
    if (el) { el.click(); return el.textContent.trim().slice(0, 60) }
    return null
  }, { t: text })
  if (!ok) console.log(`    ⚠ clickText: "${text}" not found`)
  else     console.log(`    ✓ clicked: "${ok}"`)
  if (timeout) await sleep(timeout)
  return !!ok
}

// Navigate the sidebar
async function navTo(page, label) {
  const ok = await page.evaluate(({ l }) => {
    const sel = 'nav li, nav a, nav button, aside li, aside a, [data-page], .nav-item, [onclick^="showView"]'
    const el = [...document.querySelectorAll(sel)]
      .find(n => n.textContent?.trim().toLowerCase().includes(l.toLowerCase()))
    if (el) { el.click(); return true }
    return false
  }, { l: label })
  if (!ok) console.log(`    ⚠ navTo: "${label}" not found`)
  await sleep(1200)
  return ok
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════════')
console.log('  PhDFlow — Rigorous First-Time User Test')
console.log('══════════════════════════════════════════════════════════════\n')

const app = await electron.launch({
  executablePath: ELECTRON_BIN,
  args: ['--user-data-dir=' + DATA_DIR, APP_DIR],
  timeout: 40_000,
})

await sleep(5000)
let page = app.windows().find(w => !w.url().startsWith('devtools://')) ?? await app.firstWindow()
await sleep(2000)
page = app.windows().find(w => !w.url().startsWith('devtools://')) ?? page

// ══════════════════════════════════════════════════════════════════════════════
// 1 — FIRST LAUNCH: ACCOUNT CREATION (setup mode — exact IDs from renderer.js)
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n── 1. Account Setup ──')
await ss(page, 'launch')

// Wait for the login overlay / setup card to render
await sleep(1000)

// Check which mode we're in: setup (has ln-name) or login (only ln-pw)
const mode = await page.evaluate(() => {
  if (document.getElementById('ln-name')) return 'setup'
  if (document.getElementById('ln-pw'))   return 'login'
  return 'unknown'
})
console.log('  Auth mode:', mode)

if (mode === 'setup') {
  // Setup mode — IDs: ln-name, ln-pw, ln-pw2 | button: doAuthSetup()
  await fill(page, 'ln-name', 'Max Fischer')
  await fill(page, 'ln-pw',   'PhD2025!secure')
  await fill(page, 'ln-pw2',  'PhD2025!secure')
  await ss(page, 'setup-form-filled')
  await clickOnclick(page, 'doAuthSetup()')
  await sleep(3500)
} else if (mode === 'login') {
  // Login mode — ID: ln-pw | button: doAuthLogin()
  console.log('  → Login mode (unexpected — data dir not clean?)')
  await fill(page, 'ln-pw', 'PhD2025!secure')
  await clickOnclick(page, 'doAuthLogin()')
  await sleep(3000)
} else {
  console.log('  → Unknown mode, raw inputs:', await page.evaluate(() =>
    [...document.querySelectorAll('input')].map(i => i.id || i.type).join(', ')
  ))
}

await ss(page, 'dashboard-initial')

// Dismiss any onboarding modal / AI banner
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const x = btns.find(b => /close|skip|later|dismiss/i.test(b.textContent) || b.textContent.trim() === '×')
  if (x) x.click()
})
await sleep(500)
await ss(page, 'dashboard-clean')

// ══════════════════════════════════════════════════════════════════════════════
// 2 — SETTINGS → PROFILE (using exact IDs from settings.js)
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n── 2. Settings — Profile ──')
await navTo(page, 'Settings')
await ss(page, 'settings-profile-tab')

// Identity section — all IDs from renderProfileTab()
await fill(page, 'sp-name',       'Max Fischer')
await fill(page, 'sp-alias',      'Max')
await fill(page, 'sp-field',      'Computational Neuroscience')
await fill(page, 'sp-subfield',   'Synaptic Plasticity & Neural Circuits')
await fill(page, 'sp-institution','University of Heidelberg')
await fill(page, 'sp-dept',       'Institute of Neuroscience')
await fill(page, 'sp-supervisor', 'Prof. Dr. Elena Hartmann')
await fill(page, 'sp-cosup',      'Dr. Tobias Klink')

await ss(page, 'settings-identity-filled')

// Dates & IDs section
await fill(page, 'sp-start', '2026-04-01')   // PhD start
await fill(page, 'sp-end',   '2030-03-31')   // Expected submission
await fill(page, 'sp-orcid', '0000-0002-9876-5432')
await fill(page, 'sp-email', 'max.fischer@uni-heidelberg.de')
await fill(page, 'sp-web',   'https://maxfischer-neuro.de')

await ss(page, 'settings-dates-filled')

// Save via the Save Profile button (onclick="saveProfileFull()")
await clickOnclick(page, 'saveProfileFull()')
await sleep(1000)
await ss(page, 'settings-profile-saved')

// ── Personalize tab (accent colour, font)
console.log('  → Personalize tab')
await clickOnclick(page, "settingsTab('personalize')")
await sleep(700)
await ss(page, 'settings-personalize')

// Pick Teal accent
await clickOnclick(page, "personSetAccent('teal')")
await sleep(400)
await ss(page, 'settings-accent-teal')

// Pick Serif font
await clickOnclick(page, "personSetFont('serif')")
await sleep(400)
await ss(page, 'settings-font-serif')

// ── App tab
console.log('  → App tab')
await clickOnclick(page, "settingsTab('app')")
await sleep(700)
await ss(page, 'settings-app-tab')

// ── Diagnostics tab
console.log('  → Diagnostics tab')
await clickOnclick(page, "settingsTab('diagnostics')")
await sleep(700)
await ss(page, 'settings-diagnostics-tab')

// ══════════════════════════════════════════════════════════════════════════════
// 3 — PROJECTS
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n── 3. Projects ──')
await navTo(page, 'Projects')
await ss(page, 'projects-empty')

// Open new project modal via openProjectModal()
await clickOnclick(page, 'openProjectModal()')
await sleep(800)
await ss(page, 'project-modal-open')

// Fill exact IDs from openProjectModal() in projects.js
await fill(page, 'pm-name',  'Synaptic Plasticity & Memory Consolidation in CA1')
await fill(page, 'pm-desc',  'Investigating AMPA receptor subunit trafficking (GluA1/GluA2) during LTP and LTD in hippocampal CA1 neurons. Primary method: surface biotinylation + confocal imaging.')
await select(page, 'pm-status', 'active')
await fill(page, 'pm-start', '2026-04-01')
await fill(page, 'pm-end',   '2027-06-30')
await fill(page, 'pm-tags',  'neuroscience, synaptic plasticity, hippocampus, LTP')

await ss(page, 'project-form-filled')

// Save via saveProject('')
await clickOnclick(page, "saveProject('')")
await sleep(1200)
await ss(page, 'project-1-created')

// Create second project
await clickOnclick(page, 'openProjectModal()')
await sleep(700)
await fill(page, 'pm-name',   'EPSRC PhD Fellowship Application 2026')
await fill(page, 'pm-desc',   'Application for EPSRC Doctoral Training Partnership. Deadline November 2026.')
await select(page, 'pm-status', 'planning')
await fill(page, 'pm-end',    '2026-11-15')
await fill(page, 'pm-tags',   'funding, fellowship, application')

await ss(page, 'project-2-form')
await clickOnclick(page, "saveProject('')")
await sleep(1200)
await ss(page, 'project-2-created')

// ══════════════════════════════════════════════════════════════════════════════
// 4 — GRANTS: FOR YOU + SEARCH
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n── 4. Grants ──')
await navTo(page, 'Grant Scan')
await sleep(500)
await ss(page, 'grants-for-you')

// "For You" tab is default — set career stage via grantSetStage('phd')
await sleep(500)
await clickOnclick(page, "grantSetStage('phd')")
await sleep(600)
await ss(page, 'grants-stage-phd-set')

// Profile pill & ranked grants should appear
const grantsText = await page.evaluate(() => document.body.innerText.slice(0, 600))
console.log('  Grants "For You":', grantsText.slice(0, 300))

// Look for "track" / "save" buttons on the first matching grant
const grantCards = await page.evaluate(() => {
  // Save the first grant that has a Track / Save button
  const btns = [...document.querySelectorAll('button')]
  const trackBtn = btns.find(b => /track|save|add to my/i.test(b.textContent))
  if (trackBtn) { trackBtn.click(); return 'tracked first grant: ' + trackBtn.textContent.trim() }
  return 'no track button found'
})
console.log('  Track grant:', grantCards)
await sleep(600)
await ss(page, 'grants-first-tracked')

// ── Switch to Search tab — use [data-gtab] button
console.log('  → Grants Search tab')
await page.evaluate(() => {
  const btn = document.querySelector('[data-gtab="search"]')
  if (btn) btn.click()
})
await sleep(800)
await ss(page, 'grants-search-tab')

// Fill the search box: #grant-search-q from grants.js
await fill(page, 'grant-search-q', 'neuroscience doctoral fellowship Germany DFG')
await sleep(200)
// Run search via runLiveGrantSearch()
await clickOnclick(page, 'runLiveGrantSearch()')
await sleep(3000)
await ss(page, 'grants-search-results')

// ── Resources tab
console.log('  → Grants Databases tab')
await page.evaluate(() => { document.querySelector('[data-gtab="resources"]')?.click() })
await sleep(700)
await ss(page, 'grants-resources-tab')

// ── My Grants tab (should have the one we tracked)
console.log('  → My Grants tab')
await page.evaluate(() => { document.querySelector('[data-gtab="mine"]')?.click() })
await sleep(700)
await ss(page, 'grants-my-grants')

// ══════════════════════════════════════════════════════════════════════════════
// 5 — NOTES (sidebar-based editor)
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n── 5. Notes ──')
await navTo(page, 'Notes')
await sleep(800)
await ss(page, 'notes-sidebar-empty')

// Create a Meeting note via newNote('meeting')
await clickOnclick(page, "newNote('meeting')")
await sleep(700)
await ss(page, 'notes-meeting-created')

// Title: #note-title  |  Content: #note-editor (from notes.js renderNoteEditor)
await fill(page, 'note-title',
  'Week 1 — Supervisor Meeting with Prof. Hartmann')
await sleep(200)

// Click into the editor area and type
await page.evaluate(() => {
  const ta = document.getElementById('note-editor')
  if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length) }
})
await sleep(200)

// The meeting template is pre-filled; scroll to end and append our text
await page.keyboard.press('Control+End')
await sleep(100)
await page.keyboard.type(
  '\n## Key Decisions\n' +
  '- Start with Malenka & Bear (2004) Neuron review\n' +
  '- Order anti-GluA1 and anti-GluA2 antibodies this week\n' +
  '- Book confocal induction training (contact Dr. Meyer, Imaging Core)\n\n' +
  '## Action Items\n' +
  '- [ ] Draft 6-month research plan for next meeting\n' +
  '- [ ] Register for departmental seminar series\n' +
  '- [ ] Set up PhDFlow with all current deadlines\n\n' +
  '## Scientific Background\n' +
  'LTP induction requires coincident pre/post-synaptic activity.\n' +
  'NMDA receptor = "coincidence detector" → Ca²⁺ influx → CaMKII activation\n' +
  '→ GluA1 Ser831 phosphorylation → AMPA receptor insertion at synapse.',
  { delay: 12 }
)
await sleep(400)
await ss(page, 'note-meeting-filled')

// Create an Experiment Log note
await clickOnclick(page, "newNote('experiment')")
await sleep(600)
await fill(page, 'note-title', 'Pilot: Surface Biotinylation Protocol #1')
await sleep(150)
await page.evaluate(() => {
  const ta = document.getElementById('note-editor')
  if (ta) { ta.focus(); ta.value = '' }
})
await sleep(100)
await page.keyboard.type(
  '## Objective\n' +
  'Quantify surface AMPA receptor (GluA1/GluA2) levels in acute hippocampal slices ' +
  'after chem-LTP induction (NMDA 20 µM, 3 min).\n\n' +
  '## Protocol\n' +
  '1. Prepare 400 µm hippocampal slices (Vibratome)\n' +
  '2. Recover in ACSF 1 h at 32°C\n' +
  '3. Apply NHS-SS-biotin (1 mg/ml) in ice-cold ACSF for 30 min\n' +
  '4. Quench with glycine (100 mM)\n' +
  '5. Lyse slices, pull-down with streptavidin beads\n' +
  '6. Western blot: anti-GluA1 (1:2000), anti-GluA2 (1:2000)\n\n' +
  '## Observations\n' +
  'Baseline signal strong. LTP condition: ~140% GluA1 surface increase vs. control.\n' +
  'GluA2 unchanged. Consistent with AMPA receptor remodelling.\n\n' +
  '## Results\n' +
  'GluA1 surface: control 100% ± 8, LTP 142% ± 11 (p < 0.05, n=6 slices)\n\n' +
  '## Next Steps\n' +
  '- Replicate with CaMKII inhibitor (KN-93) pre-treatment\n' +
  '- Confirm by confocal surface staining',
  { delay: 10 }
)
await sleep(400)
await ss(page, 'note-experiment-filled')

// Create a plain Research Note
await clickOnclick(page, "newNote('note')")
await sleep(600)
await fill(page, 'note-title', 'Hypothesis — GluA2-Lack Model in Stress')
await sleep(150)
await page.evaluate(() => {
  const ta = document.getElementById('note-editor')
  if (ta) { ta.focus(); ta.value = '' }
})
await sleep(100)
await page.keyboard.type(
  '**Hypothesis**: Stress-induced corticosterone preferentially removes GluA2-containing\n' +
  'AMPA receptors from CA1 synapses, creating a transient Ca²⁺-permeable AMPA receptor window\n' +
  'that enables pathological LTP underlying stress-related memory disorders.\n\n' +
  '**Prediction**: Blocking corticosterone synthesis during stress prevents the GluA2-lack\n' +
  'and protects against stress-induced memory disturbances.\n\n' +
  '**Experiment**: Compare GluA1/GluA2 surface ratios in acute vs chronic stress models\n' +
  'using surface biotinylation + western blot + confocal imaging.\n\n' +
  '**Related**: [[Pilot: Surface Biotinylation Protocol #1]]',
  { delay: 12 }
)
await sleep(400)
await ss(page, 'note-hypothesis-filled')

// ══════════════════════════════════════════════════════════════════════════════
// 6 — CALENDAR: ADD EVENTS
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n── 6. Calendar ──')
await navTo(page, 'Calendar')
await ss(page, 'calendar-view')

// Open new event modal via openEventModal()  (no id → new event)
await clickOnclick(page, 'openEventModal()')
await sleep(800)
await ss(page, 'calendar-event-modal-open')

// Exact IDs from openEventModal() in calendar.js
await fill(page, 'ev-title',    'Supervisor Meeting — Week 3 Progress Review')
await select(page, 'ev-type',   'meeting')       // event type select
await select(page, 'ev-priority', 'high')
await fill(page, 'ev-date',     '2026-06-17')
await fill(page, 'ev-start',    '10:00')
await fill(page, 'ev-end',      '11:00')
await fill(page, 'ev-location', 'Institute of Neuroscience, Room 304')
await fill(page, 'ev-desc',     'Bring: reading list, 6-month plan draft, biotinylation pilot results')

await ss(page, 'calendar-event-filled')
await clickOnclick(page, 'saveEvent(')   // saveEvent() call
await sleep(1200)
await ss(page, 'calendar-event-1-saved')

// Add a deadline event: grant application
await clickOnclick(page, 'openEventModal()')
await sleep(700)
await fill(page, 'ev-title',    'EPSRC DTP Application Deadline')
await select(page, 'ev-type',   'deadline')
await select(page, 'ev-priority', 'high')
await fill(page, 'ev-date',     '2026-11-15')
await fill(page, 'ev-desc',     'Submit full application package via Je-S portal. Need: research proposal, 2 references, CV.')

await ss(page, 'calendar-deadline-filled')
await clickOnclick(page, 'saveEvent(')
await sleep(1200)
await ss(page, 'calendar-deadline-saved')

// Add a conference event
await clickOnclick(page, 'openEventModal()')
await sleep(700)
await fill(page, 'ev-title',    'Society for Neuroscience Annual Meeting 2026')
await select(page, 'ev-type',   'conference')
await select(page, 'ev-priority', 'medium')
await fill(page, 'ev-date',     '2026-11-08')
await fill(page, 'ev-end',      '')
await fill(page, 'ev-location', 'San Diego Convention Center, CA, USA')
await fill(page, 'ev-desc',     'Abstract submission deadline: July 15 2026. Poster or talk on GluA1 surface expression data.')

await clickOnclick(page, 'saveEvent(')
await sleep(1200)
await ss(page, 'calendar-with-3-events')

// ══════════════════════════════════════════════════════════════════════════════
// 7 — TO-DOS (exact IDs from openTodoModal() in todos.js)
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n── 7. To-Dos ──')
await navTo(page, 'To-Do')
await sleep(500)
await ss(page, 'todos-view')

const tasks = [
  { title: 'Read: Malenka & Bear (2004) — LTP/LTD Neuron review',
    desc: 'Chapter on AMPA receptor trafficking. Take notes in PhDFlow.',
    priority: 'urgent', effort: 'deep', group: 'g-reading', due: '2026-06-10', mins: 180 },
  { title: 'Order antibodies: anti-GluA1 (Millipore AB1504) + anti-GluA2 (MAB397)',
    desc: 'Contact lab supplier. Budget code: INS-2026-LAB.',
    priority: 'high', effort: 'quick', group: 'g-lab', due: '2026-06-07', mins: 20 },
  { title: 'Book confocal microscopy induction training with Dr. Meyer',
    desc: 'Email imaging core: imaging@uni-heidelberg.de. Mention supervisor name.',
    priority: 'high', effort: 'quick', group: 'g-admin', due: '2026-06-08', mins: 15 },
  { title: 'Draft 6-month research timeline for supervisor review',
    desc: 'Cover: literature review, pilot experiments, preliminary results, conference abstract.',
    priority: 'high', effort: 'deep', group: 'g-writing', due: '2026-06-14', mins: 240 },
  { title: 'Register for departmental PhD seminar series',
    desc: 'Check institute website for registration link.',
    priority: 'medium', effort: 'quick', group: 'g-admin', due: '2026-06-12', mins: 10 },
  { title: 'SfN 2026 abstract — first draft',
    desc: 'Title: "Stress-induced GluA2-lack in CA1: a mechanism for maladaptive memory". 250 words.',
    priority: 'medium', effort: 'deep', group: 'g-writing', due: '2026-07-10', mins: 120 },
]

for (const t of tasks) {
  // Open new task modal via openTodoModal()
  await clickOnclick(page, 'openTodoModal()')
  await sleep(700)

  // Use exact IDs from openTodoModal()
  await fill(page, 'td-title',    t.title)
  await fill(page, 'td-desc',     t.desc)
  await select(page, 'td-priority', t.priority)
  await select(page, 'td-effort',   t.effort)
  await select(page, 'td-group',    t.group)
  await fill(page, 'td-due',      t.due)
  await fill(page, 'td-estimate', String(t.mins))

  await ss(page, `todo-task-${tasks.indexOf(t) + 1}-filled`)

  // Save: click the "Save Task" button
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')]
      .find(b => /save task|add task|save/i.test(b.textContent) && !b.disabled)
    if (btn) btn.click()
  })
  await sleep(800)
}

await ss(page, 'todos-all-tasks-added')

// Mark the first task done (checkbox)
await page.evaluate(() => {
  const cb = document.querySelector('input[type="checkbox"]')
  if (cb) cb.click()
})
await sleep(400)
await ss(page, 'todos-first-task-done')

// ══════════════════════════════════════════════════════════════════════════════
// 8 — PAPER LIBRARY (DOI fetch via #lib-doi-input + libFetchMeta())
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n── 8. Paper Library ──')
await navTo(page, 'Library')
await sleep(800)
await ss(page, 'library-empty')

// The library has a DOI fetch bar: #lib-doi-input, button "Fetch →" (libFetchMeta())
await fill(page, 'lib-doi-input', '10.1016/j.neuron.2004.09.012')
await sleep(200)
await clickOnclick(page, 'libFetchMeta()')
await sleep(4000)   // wait for CrossRef API response
await ss(page, 'library-doi-fetched')

// Confirm / save the paper in the preview modal
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const btn = btns.find(b => /add to library|save|confirm|import/i.test(b.textContent) && !b.disabled)
  if (btn) btn.click()
})
await sleep(1000)
await ss(page, 'library-paper-1-saved')

// Fetch second paper by DOI
await fill(page, 'lib-doi-input', '10.1038/nrn1970')
await sleep(200)
await clickOnclick(page, 'libFetchMeta()')
await sleep(4000)
await ss(page, 'library-doi-2-fetched')

await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const btn = btns.find(b => /add to library|save|confirm|import/i.test(b.textContent) && !b.disabled)
  if (btn) btn.click()
})
await sleep(1000)
await ss(page, 'library-paper-2-saved')

// Fetch third paper
await fill(page, 'lib-doi-input', '10.1073/pnas.2322025121')
await sleep(200)
await clickOnclick(page, 'libFetchMeta()')
await sleep(4000)
await ss(page, 'library-doi-3-fetched')

await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const btn = btns.find(b => /add to library|save|confirm|import/i.test(b.textContent) && !b.disabled)
  if (btn) btn.click()
})
await sleep(1000)
await ss(page, 'library-paper-3-saved')

// Test library search filter
await fill(page, 'lib-search', 'synaptic')
await sleep(600)
await ss(page, 'library-filtered-by-keyword')

// Clear search
await fill(page, 'lib-search', '')
await sleep(400)

// Test status filter
await select(page, 'lib-status', 'unread')
await sleep(400)
await ss(page, 'library-filtered-unread')

await select(page, 'lib-status', 'all')
await sleep(300)

// ══════════════════════════════════════════════════════════════════════════════
// 9 — NEWS / LITERATURE FEED (render_news, refreshNewsFeed)
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n── 9. News / Literature Feed ──')
await navTo(page, 'Literature')
await sleep(1200)
await ss(page, 'news-initial')

// Add a topic keyword — "Add topic" opens news-topic-form
await clickOnclick(page, 'newsShowTopicForm()')
await sleep(500)
await fill(page, 'news-topic-label', 'Synaptic Plasticity')
await fill(page, 'news-topic-kw',    'synaptic plasticity AMPA receptor LTP hippocampus')
await ss(page, 'news-topic-form-filled')

// Save the topic
await clickOnclick(page, 'newsSaveTopic()')
await sleep(600)

// Trigger a feed refresh (calls Semantic Scholar / arXiv)
await clickOnclick(page, 'refreshNewsFeed()')
await sleep(5000)   // wait for API responses
await ss(page, 'news-feed-refreshed')

// ══════════════════════════════════════════════════════════════════════════════
// 10 — DISCOVER / RESEARCHER NETWORK (id="disc-query", discoverSearch())
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n── 10. Discover ──')
await navTo(page, 'Discover')
await sleep(800)
await ss(page, 'discover-initial')

// Exact ID from render_discover(): disc-query, button discoverSearch()
await fill(page, 'disc-query', 'Roberto Malinow')
await sleep(200)
await clickOnclick(page, 'discoverSearch()')
await sleep(4000)   // Semantic Scholar + OpenAlex API calls
await ss(page, 'discover-malinow-results')

// Second search: supervisor name
await fill(page, 'disc-query', 'Elena Hartmann neuroscience')
await sleep(200)
await clickOnclick(page, 'discoverSearch()')
await sleep(4000)
await ss(page, 'discover-hartmann-results')

// ══════════════════════════════════════════════════════════════════════════════
// 11 — CONTACTS (exact IDs from openContactModal() in contacts.js)
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n── 11. Contacts ──')
await navTo(page, 'Contacts')
await sleep(700)
await ss(page, 'contacts-empty')

// Open contact modal via openContactModal()
await clickOnclick(page, 'openContactModal()')
await sleep(800)
await ss(page, 'contacts-modal-open')

// Exact IDs from openContactModal() in contacts.js
await fill(page, 'cm-name', 'Prof. Dr. Elena Hartmann')
await fill(page, 'cm-inst', 'University of Heidelberg')
await fill(page, 'cm-dept', 'Institute of Neuroscience')
await fill(page, 'cm-role', 'Principal Investigator / PhD Supervisor')
await select(page, 'cm-relationship', 'Supervisor')
await fill(page, 'cm-email', 'e.hartmann@uni-heidelberg.de')

await ss(page, 'contacts-supervisor-filled')
await clickOnclick(page, "saveContact('')")
await sleep(1200)
await ss(page, 'contacts-supervisor-saved')

// Add second contact: collaborator
await clickOnclick(page, 'openContactModal()')
await sleep(700)
await fill(page, 'cm-name', 'Dr. Tobias Klink')
await fill(page, 'cm-inst', 'University of Heidelberg')
await fill(page, 'cm-dept', 'Institute of Neuroscience')
await fill(page, 'cm-role', 'Co-Supervisor / Postdoctoral Researcher')
await select(page, 'cm-relationship', 'Co-Supervisor')
await fill(page, 'cm-email', 't.klink@uni-heidelberg.de')

await ss(page, 'contacts-cosup-filled')
await clickOnclick(page, "saveContact('')")
await sleep(1200)
await ss(page, 'contacts-cosup-saved')

// Add third contact: external collaborator
await clickOnclick(page, 'openContactModal()')
await sleep(700)
await fill(page, 'cm-name', 'Prof. Dr. Roberto Malinow')
await fill(page, 'cm-inst', 'UC San Diego')
await fill(page, 'cm-dept', 'Department of Neurosciences')
await fill(page, 'cm-role', 'AMPA receptor expert — potential collaborator')
await select(page, 'cm-relationship', 'Collaborator')

await ss(page, 'contacts-collaborator-filled')
await clickOnclick(page, "saveContact('')")
await sleep(1200)
await ss(page, 'contacts-all-saved')

// ══════════════════════════════════════════════════════════════════════════════
// 12 — WHITEBOARD
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n── 12. Whiteboard ──')
await navTo(page, 'Whiteboard')
await sleep(1500)
await ss(page, 'whiteboard-initial')

// Try to create a new board if needed
const newBoard = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const btn = btns.find(b => /new board|create board|new whiteboard|\+ board/i.test(b.textContent))
  if (btn) { btn.click(); return btn.textContent.trim() }
  return null
})
if (newBoard) {
  console.log('  Created board:', newBoard)
  await sleep(800)
  await ss(page, 'whiteboard-new-board')
}

// Try to add a sticky note
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const btn = btns.find(b =>
    /sticky|note|add.*text|text.*add|post.?it/i.test(b.textContent) ||
    b.title?.toLowerCase().includes('sticky')
  )
  if (btn) btn.click()
})
await sleep(600)
await ss(page, 'whiteboard-after-add')

// ══════════════════════════════════════════════════════════════════════════════
// 13 — UTILITIES
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n── 13. Utilities ──')
await navTo(page, 'Utilities')
await sleep(700)
await ss(page, 'utilities-initial')

const utilText = await page.evaluate(() => document.body.innerText.slice(0, 600))
console.log('  Utilities:', utilText.slice(0, 300))

// Click through available utility sections
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const btn = btns.find(b => /pdf|compress|merge|split/i.test(b.textContent))
  if (btn) btn.click()
})
await sleep(500)
await ss(page, 'utilities-pdf-tool')

// ══════════════════════════════════════════════════════════════════════════════
// 14 — AI SETUP: DASHBOARD BANNER → SETTINGS
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n── 14. AI Setup ──')
await navTo(page, 'Dashboard')
await sleep(1500)
await ss(page, 'dashboard-ai-banner')

// Click the AI banner setup button
const aiBannerClick = await page.evaluate(() => {
  // The banner is div#dash-ai-banner; look for a button inside it or near it
  const banner = document.getElementById('dash-ai-banner')
  if (banner) {
    const btn = banner.querySelector('button, a')
    if (btn) { btn.click(); return 'clicked banner button: ' + btn.textContent.trim() }
    banner.click()
    return 'clicked banner itself'
  }
  // Fallback: any button with AI/Activate text
  const btns = [...document.querySelectorAll('button')]
  const btn = btns.find(b => /activate|set up ai|enable ai|open settings/i.test(b.textContent))
  if (btn) { btn.click(); return 'fallback: ' + btn.textContent.trim() }
  return 'no AI banner button found'
})
console.log('  AI banner click:', aiBannerClick)
await sleep(1500)
await ss(page, 'ai-setup-screen')

// ══════════════════════════════════════════════════════════════════════════════
// 15 — SETTINGS: VAULT + BACKUP
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n── 15. Settings Vault & Backup ──')
await navTo(page, 'Settings')
await sleep(600)

// Vault tab
await clickOnclick(page, "settingsTab('vault')")
await sleep(800)
await ss(page, 'settings-vault')

const vaultText = await page.evaluate(() => document.body.innerText.slice(0, 400))
console.log('  Vault:', vaultText.slice(0, 200))

// Try initializing vault if button available
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const btn = btns.find(b => /create vault|initialize|set up vault/i.test(b.textContent))
  if (btn) btn.click()
})
await sleep(600)
await ss(page, 'vault-setup-form')

// Backup tab
await clickOnclick(page, "settingsTab('backup')")
await sleep(700)
await ss(page, 'settings-backup')

// ══════════════════════════════════════════════════════════════════════════════
// 16 — DASHBOARD FINAL STATE
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n── 16. Dashboard final state ──')
await navTo(page, 'Dashboard')
await sleep(2000)
await ss(page, 'dashboard-final')

const finalText = await page.evaluate(() => document.body.innerText.slice(0, 800))
console.log('  Final dashboard:', finalText.slice(0, 400))

// ══════════════════════════════════════════════════════════════════════════════
// REPORT
// ══════════════════════════════════════════════════════════════════════════════
console.log(`\n══════════════════════════════════════════════════════════════`)
console.log(`  Test complete. ${step} screenshots → ${SHOT_DIR}`)
console.log(`  Phases: Setup · Profile · Projects(2) · Grants · Notes(3)`)
console.log(`          Calendar(3 events) · Todos(6 tasks) · Library(3 DOIs)`)
console.log(`          News · Discover · Contacts(3) · Whiteboard · AI Setup`)
console.log(`══════════════════════════════════════════════════════════════\n`)

console.log('App left open 25 s for visual inspection...')
await sleep(25000)
await app.close()
