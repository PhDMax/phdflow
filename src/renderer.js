// ══ PhDFlow — Core State & Router ══════════════════════════════════════════════

const state = {
  currentView: null,
  profile: null,
  projects: [],
  papers: [],
  contacts: [],
  notes: [],
  whiteboards: [],
  events: [],
  todos: [],
  grants: [],
  newsFeeds: [],
  newsTopics: [],
  newsRead: [],
  searchResults: [],
  calGoals: [],
  calFeeds: [],
  todoGroups: [],
  darkModeSchedule: null,
  paperCollections: [],
  sidebarTools: null,
}

const VIEWS = ['dashboard','projects','library','grants','news','notes','whiteboard','utilities','discover','contacts','calendar','todos','feedback','settings','support']

// ── Tool registry — single source of truth for sidebar & picker ───────────────
const ALL_TOOLS = [
  { id:'projects',   label:'Projects',        icon:'📋', section:'Research',  desc:'Manage research projects and work threads' },
  { id:'library',    label:'Paper Library',   icon:'📚', section:'Research',  desc:'Store, annotate and cite your papers' },
  { id:'grants',     label:'Grant Scan',      icon:'💰', section:'Research',  desc:'Discover and track funding opportunities' },
  { id:'news',       label:'Literature Feed', icon:'📡', section:'Research',  desc:'Daily paper feed from arXiv & OpenAlex' },
  { id:'notes',      label:'Notes',           icon:'📝', section:'Workspace', desc:'Linked markdown notes and lab logs' },
  { id:'whiteboard', label:'Whiteboard',      icon:'🎨', section:'Workspace', desc:'Visual brainstorming canvas with smart pen' },
  { id:'utilities',  label:'Utilities',       icon:'🔧', section:'Workspace', desc:'PDF tools, citations, unit converter, R assistant' },
  { id:'discover',   label:'Discover',        icon:'🔍', section:'Network',   desc:'Find researchers by name or research area' },
  { id:'contacts',   label:'Contacts',        icon:'👥', section:'Network',   desc:'Your academic network and collaborators' },
  { id:'calendar',   label:'Calendar',        icon:'📅', section:'Planning',  desc:'Deadlines, milestones and iCal sync' },
  { id:'todos',      label:'To-Do List',      icon:'✅', section:'Planning',  desc:'Tasks with time estimates and daily focus mode' },
]
const _ALWAYS_SHOWN = ['dashboard','settings','feedback','support']
const _DEFAULT_TOOLS = ALL_TOOLS.map(t => t.id)  // all on by default

window._newsNavBadge = 0  // unread new-paper count; set by news.js background refresh

function _enabledTools() {
  const stored = state.sidebarTools
  if (!stored || !Array.isArray(stored) || stored.length === 0) return _DEFAULT_TOOLS
  return stored
}

// ── Dynamic sidebar renderer ──────────────────────────────────────────────────
function renderSidebar() {
  const nav     = document.getElementById('sidebar-nav')
  if (!nav) return
  const enabled = _enabledTools()
  const current = state.currentView

  const btn = (id, label, icon) => {
    const badge = id === 'news' && window._newsNavBadge > 0
      ? `<span class="ml-auto bg-indigo-500 text-white text-[9px] font-bold rounded-full px-1 min-w-[16px] text-center leading-4">
           ${window._newsNavBadge > 99 ? '99+' : window._newsNavBadge}
         </span>`
      : ''
    return `<button id="nav-${id}" onclick="showView('${id}')"
      class="nav-btn w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 text-xs font-medium transition-colors text-left ${id === current ? 'active' : ''}">
      ${icon} <span class="flex-1">${label}</span>${badge}
    </button>`
  }

  // Always-visible top item
  let html = btn('dashboard', 'Dashboard', '🏠') + '<div class="mb-1"></div>'

  // Grouped sections
  const sections = ['Research','Workspace','Network','Planning']
  for (const section of sections) {
    const tools = ALL_TOOLS.filter(t => t.section === section && enabled.includes(t.id))
    if (!tools.length) continue
    html += `<div class="nav-section mt-2">${section}</div>`
    html += tools.map(t => btn(t.id, t.label, t.icon)).join('')
  }

  // Always-visible bottom items
  html += `<div class="nav-section mt-2">Other</div>`
  html += btn('feedback', 'Feedback', '💬')
  html += btn('settings', 'Settings', '⚙️')

  nav.innerHTML = html
}

// ── Theme ─────────────────────────────────────────────────────────────────────
function applyTheme(t) {
  document.documentElement.dataset.theme = (t === 'dark') ? 'dark' : 'light'
}

// ── Accent color ──────────────────────────────────────────────────────────────
const _ACCENT_PALETTES = {
  indigo:  { 50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3' },
  violet:  { 50:'#f5f3ff',100:'#ede9fe',200:'#ddd6fe',400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed',700:'#6d28d9',800:'#5b21b6' },
  teal:    { 50:'#f0fdfa',100:'#ccfbf1',200:'#99f6e4',400:'#2dd4bf',500:'#14b8a6',600:'#0d9488',700:'#0f766e',800:'#115e59' },
  rose:    { 50:'#fff1f2',100:'#ffe4e6',200:'#fecdd3',400:'#fb7185',500:'#f43f5e',600:'#e11d48',700:'#be123c',800:'#9f1239' },
  amber:   { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e' },
  emerald: { 50:'#ecfdf5',100:'#d1fae5',200:'#a7f3d0',400:'#34d399',500:'#10b981',600:'#059669',700:'#047857',800:'#065f46' },
}

function applyAccent(color) {
  const c = _ACCENT_PALETTES[color] || _ACCENT_PALETTES.indigo
  let el = document.getElementById('ph-accent-style')
  if (!el) { el = document.createElement('style'); el.id = 'ph-accent-style'; document.head.appendChild(el) }
  if (!color || color === 'indigo') { el.textContent = ''; return }
  el.textContent = [
    `.bg-indigo-600{background-color:${c[600]}!important}`,
    `.bg-indigo-500{background-color:${c[500]}!important}`,
    `.bg-indigo-400{background-color:${c[400]}!important}`,
    `.bg-indigo-100{background-color:${c[100]}!important}`,
    `.bg-indigo-50{background-color:${c[50]}!important}`,
    `.text-indigo-600{color:${c[600]}!important}`,
    `.text-indigo-700{color:${c[700]}!important}`,
    `.text-indigo-500{color:${c[500]}!important}`,
    `.text-indigo-400{color:${c[400]}!important}`,
    `.border-indigo-500{border-color:${c[500]}!important}`,
    `.border-indigo-600{border-color:${c[600]}!important}`,
    `.border-indigo-300{border-color:${c[200]}!important}`,
    `.nav-btn.active{background:${c[800]}!important}`,
    `.accent-indigo-600{accent-color:${c[600]}!important}`,
    `#dash-fab-btn{background:${c[600]}!important}`,
  ].join('\n')
}

// ── Font family ───────────────────────────────────────────────────────────────
const _FONT_STACKS = {
  system:  "'Segoe UI', system-ui, sans-serif",
  serif:   "Georgia, 'Times New Roman', serif",
  mono:    "'Cascadia Code', Consolas, 'Courier New', monospace",
  rounded: "'Trebuchet MS', Verdana, sans-serif",
}

function applyFont(font) {
  document.body.style.fontFamily = _FONT_STACKS[font] || _FONT_STACKS.system
}

// ── Onboarding + view init are called after login via loadAndShowApp() ─────────

// ── Onboarding — Step 1: Identity & Theme ────────────────────────────────────
function showOnboarding(prefillName = '') {
  window._onboardTheme = 'light'
  document.getElementById('view-content').innerHTML = `
  <div class="flex-1 flex items-center justify-center p-8 h-full overflow-y-auto">
    <div class="w-full max-w-sm py-8">
      <div class="text-center mb-8">
        <div class="text-5xl mb-4">⚗️</div>
        <h1 class="text-2xl font-bold text-slate-900">Welcome to PhDFlow</h1>
        <p class="text-slate-500 mt-2 text-sm">Your all-in-one research workspace.<br/>Free forever · No account · All data stays on your device.</p>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tell us about yourself</span>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">What's your name?</label>
          <input id="onboard-name" type="text" placeholder="e.g. Anya Sharma"
            value="${esc(prefillName)}"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onkeydown="if(event.key==='Enter')onboardNext()"/>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Research field <span class="text-slate-400 font-normal">(optional)</span></label>
          <input id="onboard-field" type="text" placeholder="e.g. Computational Neuroscience"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Theme</label>
          <div class="grid grid-cols-2 gap-2">
            <button id="onboard-theme-light" onclick="onboardPickTheme('light')"
              class="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-indigo-500 bg-slate-50 transition-all">
              <div class="w-full h-8 rounded-lg bg-white border border-slate-200 flex items-center gap-1 px-2">
                <div class="w-2 h-2 rounded-full bg-indigo-500"></div>
                <div class="flex-1 h-1 rounded bg-slate-200"></div>
              </div>
              <span class="text-xs font-semibold text-slate-700">☀️ Light</span>
            </button>
            <button id="onboard-theme-dark" onclick="onboardPickTheme('dark')"
              class="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-transparent bg-slate-100 transition-all">
              <div class="w-full h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center gap-1 px-2">
                <div class="w-2 h-2 rounded-full bg-indigo-400"></div>
                <div class="flex-1 h-1 rounded bg-slate-600"></div>
              </div>
              <span class="text-xs font-semibold text-slate-700">🌙 Dark</span>
            </button>
          </div>
        </div>
        <button onclick="onboardNext()"
          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
          Choose your tools →
        </button>
        <p class="text-center text-xs text-slate-400">No account · No API key · Open source</p>
      </div>
    </div>
  </div>`
  setTimeout(() => document.getElementById('onboard-name')?.focus(), 80)
}

function onboardPickTheme(t) {
  window._onboardTheme = t
  applyTheme(t)
  document.getElementById('onboard-theme-light').className =
    `flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${t==='light' ? 'border-indigo-500 bg-slate-50' : 'border-transparent bg-slate-100'}`
  document.getElementById('onboard-theme-dark').className =
    `flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${t==='dark' ? 'border-indigo-500 bg-slate-800' : 'border-transparent bg-slate-100'}`
}

function onboardNext() {
  const name = document.getElementById('onboard-name')?.value.trim()
  if (!name) { showToast('Please enter your name', 'error'); return }
  window._onboardName  = name
  window._onboardField = document.getElementById('onboard-field')?.value.trim() || ''
  showToolPicker()
}

// ── Onboarding — Step 2: Tool Picker ─────────────────────────────────────────
function showToolPicker(fromSettings = false) {
  const enabled = fromSettings ? _enabledTools() : _DEFAULT_TOOLS
  const sections = ['Research','Workspace','Network','Planning']

  const toolCard = (t) => {
    const on = enabled.includes(t.id)
    return `<label class="tool-picker-card flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none
      ${on ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}"
      onclick="toggleToolCard('${t.id}',this)">
      <span class="text-xl leading-none mt-0.5 flex-shrink-0">${t.icon}</span>
      <div class="min-w-0 flex-1">
        <div class="text-xs font-semibold text-slate-800">${t.label}</div>
        <div class="text-xs text-slate-400 mt-0.5 leading-snug">${t.desc}</div>
      </div>
      <input type="checkbox" class="tool-cb accent-indigo-600 mt-1 flex-shrink-0" data-id="${t.id}" ${on?'checked':''}
        onclick="event.stopPropagation()"/>
    </label>`
  }

  const body = sections.map(s => {
    const tools = ALL_TOOLS.filter(t => t.section === s)
    return `
    <div>
      <div class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">${s}</div>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        ${tools.map(toolCard).join('')}
      </div>
    </div>`
  }).join('')

  if (fromSettings) {
    openModal(`
    <h3 class="text-base font-bold text-slate-900 mb-1">🧩 Sidebar Tools</h3>
    <p class="text-xs text-slate-400 mb-4">Choose which tools appear in your sidebar. You can change this any time.</p>
    <div class="space-y-4">${body}</div>
    <div class="flex gap-2 mt-5 justify-end">
      <button onclick="closeModal()" class="btn-secondary text-xs py-2 px-4">Cancel</button>
      <button onclick="saveToolSelection(true)" class="btn-primary text-xs py-2 px-4">Save</button>
    </div>`, true)
    return
  }

  document.getElementById('view-content').innerHTML = `
  <div class="flex-1 flex items-center justify-center p-8 h-full overflow-y-auto">
    <div class="w-full max-w-2xl py-8">
      <div class="text-center mb-6">
        <div class="text-4xl mb-3">🧩</div>
        <h2 class="text-xl font-bold text-slate-900">Choose your tools</h2>
        <p class="text-slate-500 text-sm mt-1">Pick what appears in your sidebar. You can add or remove tools any time in Settings.</p>
      </div>
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</div>
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Select your tools</span>
        </div>
        <div class="flex gap-2">
          <button onclick="onboardSelectAll(true)"  class="text-xs text-indigo-600 hover:underline">Select all</button>
          <span class="text-slate-300 text-xs">·</span>
          <button onclick="onboardSelectAll(false)" class="text-xs text-slate-400 hover:underline">Clear all</button>
        </div>
      </div>
      <div class="space-y-4">${body}</div>
      <div class="mt-6 flex gap-3">
        <button onclick="showOnboarding()"
          class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
          ← Back
        </button>
        <button onclick="saveToolSelection(false)"
          class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
          Enter PhDFlow →
        </button>
      </div>
    </div>
  </div>`
}

function toggleToolCard(id, label) {
  const cb = label.querySelector('input[type=checkbox]')
  if (!cb) return
  cb.checked = !cb.checked
  label.className = label.className
    .replace(/border-indigo-500 bg-indigo-50|border-slate-200 bg-white hover:border-slate-300/g, '')
    .trim()
  label.className += cb.checked
    ? ' border-indigo-500 bg-indigo-50'
    : ' border-slate-200 bg-white hover:border-slate-300'
}

function onboardSelectAll(on) {
  document.querySelectorAll('.tool-cb').forEach(cb => {
    cb.checked = on
    const card = cb.closest('.tool-picker-card')
    if (!card) return
    card.className = card.className
      .replace(/border-indigo-500 bg-indigo-50|border-slate-200 bg-white hover:border-slate-300/g, '')
      .trim()
    card.className += on ? ' border-indigo-500 bg-indigo-50' : ' border-slate-200 bg-white hover:border-slate-300'
  })
}

async function saveToolSelection(fromSettings) {
  const checked = [...document.querySelectorAll('.tool-cb:checked')].map(cb => cb.dataset.id)
  // Ensure at least 1 tool is selected
  const selected = checked.length ? checked : _DEFAULT_TOOLS
  state.sidebarTools = selected
  await window.api.storeSet('sidebarTools', selected)
  renderSidebar()
  if (fromSettings) { closeModal(); showToast('Sidebar updated ✓'); return }
  // Complete onboarding
  const name  = window._onboardName  || 'Researcher'
  const field = window._onboardField || ''
  state.profile = { name, field, avatar: name[0].toUpperCase() }
  await window.api.storeSet('profile', state.profile)
  const theme = window._onboardTheme || 'light'
  await window.api.storeSet('theme', theme)
  applyTheme(theme)
  updateSidebarProfile()
  showView('dashboard')
  showToast(`Welcome, ${name}! 🎉`)
}

// ── View Router ───────────────────────────────────────────────────────────────
function showView(name) {
  state.currentView = name
  if (name === 'news') window._newsNavBadge = 0  // clear badge on visit
  renderSidebar()
  const vc = document.getElementById('view-content')
  vc.className = 'flex-1 overflow-hidden bg-slate-50 flex flex-col'

  const fn = window[`render_${name}`]
  if (fn) fn()
  else vc.innerHTML = `<div class="flex-1 flex items-center justify-center"><p class="text-slate-400">View "${name}" not loaded</p></div>`
}

function updateSidebarProfile() {
  document.getElementById('profile-avatar').textContent = state.profile?.avatar || '?'
  document.getElementById('profile-name').textContent   = state.profile?.name   || 'Not set up'
}

// ── Save helper ───────────────────────────────────────────────────────────────
function save(key) { return window.api.storeSet(key, state[key]) }

// ── Keyboard shortcuts cheatsheet ────────────────────────────────────────────
function openShortcutsModal() {
  const sections = [
    ['Global', [
      ['Ctrl+K / ⌘K', 'Open search'],
      ['?', 'Show this cheatsheet'],
      ['Escape', 'Close modal / search'],
    ]],
    ['Notes editor', [
      ['Ctrl+B', 'Bold'],
      ['Ctrl+I', 'Italic'],
      ['Ctrl+K', 'Inline code'],
      ['Ctrl+S', 'Save note'],
      ['[[', 'Link to another note'],
      ['Tab', 'Indent'],
    ]],
    ['Whiteboard', [
      ['V', 'Select tool'],
      ['P', 'Pen'],
      ['S', 'Smart pen'],
      ['L', 'Line'],
      ['A', 'Arrow'],
      ['R', 'Rectangle'],
      ['E', 'Ellipse'],
      ['D', 'Diamond'],
      ['G', 'Triangle'],
      ['N', 'Sticky note'],
      ['T', 'Text'],
      ['X', 'Eraser'],
      ['Space+drag', 'Pan canvas'],
      ['Scroll', 'Zoom in/out'],
      ['+/−/0', 'Zoom in/out/reset'],
      ['Ctrl+Z', 'Undo'],
      ['Ctrl+Y', 'Redo'],
      ['Ctrl+D', 'Duplicate selected'],
      ['Delete', 'Delete selected'],
    ]],
    ['To-Do list', [
      ['Enter', 'Quick-add task to Today'],
    ]],
  ]
  openModal(`
  <h3 class="text-base font-bold text-slate-900 mb-4">⌨ Keyboard shortcuts</h3>
  <div class="space-y-4 max-h-[60vh] overflow-y-auto">
    ${sections.map(([title, keys]) => `
    <div>
      <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">${title}</div>
      <div class="space-y-1">
        ${keys.map(([k, d]) => `
        <div class="flex items-center justify-between gap-4 py-1 border-b border-slate-50">
          <kbd class="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200 flex-shrink-0">${k}</kbd>
          <span class="text-xs text-slate-600 text-right">${d}</span>
        </div>`).join('')}
      </div>
    </div>`).join('')}
  </div>
  <p class="text-xs text-slate-400 mt-4">Press <kbd class="bg-slate-100 px-1 rounded">?</kbd> anytime to show this.</p>`)
}

// ── Odysseus AI helper — call from anywhere in the app ────────────────────────
// Returns { success, response } or { success: false, error }
// Shows a loading toast while running; caller handles result display.
async function _aiCall(prompt, systemPrompt) {
  const p = state.profile || {}
  const url      = p.odysseusUrl      || 'http://localhost:7000'
  const token    = p.odysseusToken    || ''
  const endpoint = p.odysseusEndpoint || ''
  const model    = p.odysseusModel    || ''
  const isManaged = url.includes('127.0.0.1:7001')
  if (!token && !isManaged) {
    showToast('Set up the AI Engine in Settings → App → AI Engine first', 'error')
    return { success: false, error: 'not configured' }
  }
  return api.odysseusChat({ url, token, endpointUrl: endpoint, model, prompt, systemPrompt })
}

// Check if AI is configured — works for both manually configured and auto-managed instances
function _aiAvailable() {
  // Managed instance (no token needed, AUTH_ENABLED=false on localhost:7001)
  if (state.profile?.odysseusUrl?.includes('127.0.0.1:7001')) return true
  // Manually configured instance
  return !!(state.profile?.odysseusToken)
}

// ── Global Modal ──────────────────────────────────────────────────────────────
function openModal(html, wide) {
  document.getElementById('modal-content').innerHTML = html
  const box = document.getElementById('modal-box')
  box.className = `bg-white rounded-2xl shadow-xl w-full p-6 max-h-[90vh] overflow-y-auto relative ${wide ? 'max-w-2xl' : 'max-w-lg'}`
  document.getElementById('modal-overlay').classList.remove('hidden')
}
function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden')
  document.getElementById('modal-content').innerHTML = ''
  // Resolve any pending confirmDlg/confirmTypeDlg with false (user dismissed)
  if (typeof window._cdlgResolve === 'function') {
    const res = window._cdlgResolve; window._cdlgResolve = null; res(false)
  }
}

// ── Confirm Dialog — replaces window.confirm() which breaks focus in Electron ──
function confirmDlg(msg, label = 'Delete') {
  return new Promise(resolve => {
    window._cdlgResolve = resolve
    openModal(`
      <div>
        <p class="text-slate-700 text-sm leading-relaxed mb-5">${esc(msg).replace(/\n/g,'<br/>')}</p>
        <div class="flex gap-2 justify-end">
          <button onclick="closeModal()" class="btn-secondary px-4 py-2 text-sm">Cancel</button>
          <button id="cdlg-ok"
            class="px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors">
            ${label}
          </button>
        </div>
      </div>`)
    document.getElementById('cdlg-ok').onclick = () => {
      window._cdlgResolve = null; closeModal(); resolve(true)
    }
  })
}

// ── Confirm-by-typing dialog — for destructive irreversible actions ─────────────
function confirmTypeDlg(msg, expected = 'YES') {
  return new Promise(resolve => {
    window._cdlgResolve = resolve
    openModal(`
      <div>
        <p class="text-slate-700 text-sm leading-relaxed mb-4">${esc(msg).replace(/\n/g,'<br/>')}</p>
        <div class="mb-4">
          <label class="block text-xs font-medium text-slate-600 mb-1">
            Type <span class="font-mono font-bold text-red-600">${expected}</span> to confirm:
          </label>
          <input id="cdlg-type" type="text" class="input" placeholder="${expected}"
            onkeydown="if(event.key==='Enter')document.getElementById('cdlg-type-ok').click()"/>
        </div>
        <div class="flex gap-2 justify-end">
          <button onclick="closeModal()" class="btn-secondary px-4 py-2 text-sm">Cancel</button>
          <button id="cdlg-type-ok"
            class="px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors">
            Erase Everything
          </button>
        </div>
      </div>`)
    document.getElementById('cdlg-type-ok').onclick = () => {
      const val = document.getElementById('cdlg-type')?.value.trim()
      if (val !== expected) {
        const el = document.getElementById('cdlg-type')
        if (el) { el.style.borderColor='#ef4444'; el.focus() }
        return
      }
      window._cdlgResolve = null; closeModal(); resolve(true)
    }
    setTimeout(() => document.getElementById('cdlg-type')?.focus(), 80)
  })
}
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal()
})
document.addEventListener('keydown', e => { if (e.key==='Escape') closeModal() })

// ── Toast ─────────────────────────────────────────────────────────────────────
let _toastTimer = null
function showToast(msg, type='success') {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.className = `fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-[200] max-w-sm ${
    type==='error' ? 'bg-red-600 text-white' : type==='info' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`
  t.style.opacity = '1'
  if (_toastTimer) clearTimeout(_toastTimer)
  _toastTimer = setTimeout(() => t.style.opacity='0', 2800)
}

// ── Undo Toast ────────────────────────────────────────────────────────────────
let _undoToastTimer = null

function showUndoToast(msg, undoFn, duration = 5000) {
  const el = document.getElementById('undo-toast')
  if (!el) return
  if (_undoToastTimer) { clearTimeout(_undoToastTimer); _undoToastTimer = null }
  window._pendingUndo = undoFn
  el.style.opacity  = '1'
  el.style.transition = 'opacity .25s'
  el.classList.remove('hidden')
  el.innerHTML = `
    <span class="flex-1 text-sm">${esc(msg)}</span>
    <div class="flex items-center gap-3 ml-3 flex-shrink-0">
      <div class="w-14 h-1 bg-white/20 rounded-full overflow-hidden">
        <div id="undo-bar" class="h-full bg-white/70 rounded-full" style="width:100%;transition:width ${duration}ms linear"></div>
      </div>
      <button onclick="_doUndo()" class="text-yellow-300 font-bold text-sm hover:text-yellow-200 transition-colors">Undo</button>
    </div>`
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const bar = document.getElementById('undo-bar')
    if (bar) bar.style.width = '0%'
  }))
  _undoToastTimer = setTimeout(() => {
    el.style.opacity = '0'
    setTimeout(() => { el.classList.add('hidden'); window._pendingUndo = null }, 280)
  }, duration)
}

function _doUndo() {
  if (_undoToastTimer) { clearTimeout(_undoToastTimer); _undoToastTimer = null }
  const el = document.getElementById('undo-toast')
  if (el) { el.style.opacity = '0'; setTimeout(() => el.classList.add('hidden'), 280) }
  if (typeof window._pendingUndo === 'function') {
    window._pendingUndo()
    window._pendingUndo = null
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7) }
function initials(n='') { return n.split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()||'').join('') }
function esc(s) {
  if (s==null) return ''
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
}
function fmtDate(d) { if (!d) return ''; try { return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) } catch { return d } }
function priorityBadge(p) {
  const m = {high:'bg-red-100 text-red-700',medium:'bg-amber-100 text-amber-700',low:'bg-green-100 text-green-700'}
  return `<span class="text-xs px-2 py-0.5 rounded-full ${m[p]||'bg-slate-100 text-slate-600'}">${esc(p||'none')}</span>`
}
function statusBadge(s, map) {
  const colors = map || {active:'bg-green-100 text-green-700','on-hold':'bg-amber-100 text-amber-700',completed:'bg-blue-100 text-blue-700',planning:'bg-purple-100 text-purple-700',archived:'bg-slate-100 text-slate-600'}
  const cls = colors[s] || 'bg-slate-100 text-slate-600'
  return `<span class="text-xs px-2.5 py-0.5 rounded-full font-medium ${cls}">${esc(s||'—')}</span>`
}
function pageHeader(title, btn='') {
  return `<div class="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
    <h2 class="text-base font-bold text-slate-900">${title}</h2>${btn}</div>`
}
function emptyState(icon, title, sub) {
  return `<div class="flex flex-col items-center justify-center h-full text-center py-20">
    <div class="text-5xl mb-4">${icon}</div>
    <p class="text-slate-600 font-semibold">${title}</p>
    <p class="text-slate-400 text-sm mt-1">${sub}</p></div>`
}

// ── Auth / Login ──────────────────────────────────────────────────────────────
async function checkAuthAndStart() {
  const ver   = await window.api.getAppVersion().catch(() => '0.3')
  const verEl = document.getElementById('login-version')
  if (verEl) verEl.textContent = `v${ver} · open source`

  const status = await window.api.authStatus()
  renderLoginCard(status.initialized ? 'login' : 'setup')
  checkForUpdates()
}

// ── Login tab switching ───────────────────────────────────────────────────────
let _loginMode = 'login' // 'login' | 'setup' — remembered for tab switching

function loginShowTab(tab) {
  const btnLogin   = document.getElementById('ltab-login')
  const btnUpdates = document.getElementById('ltab-updates')
  if (btnLogin) {
    btnLogin.style.background   = tab === 'login'   ? '#4f46e5' : 'transparent'
    btnLogin.style.color        = tab === 'login'   ? '#fff'    : '#64748b'
  }
  if (btnUpdates) {
    btnUpdates.style.background = tab === 'updates' ? '#1e3a5f' : 'transparent'
    btnUpdates.style.color      = tab === 'updates' ? '#93c5fd' : '#64748b'
  }
  if (tab === 'login') {
    renderLoginCard(_loginMode)
  } else {
    _renderUpdateTab()
  }
}

async function _renderUpdateTab() {
  const card = document.getElementById('login-card')
  if (!card) return
  const ver = await window.api.getAppVersion().catch(() => '?')
  card.innerHTML = `
  <div style="display:flex;flex-direction:column;gap:.875rem">
    <!-- Current version block -->
    <div style="display:flex;align-items:center;justify-content:space-between;background:#0f172a;border-radius:.625rem;padding:.75rem 1rem">
      <div>
        <div style="color:#475569;font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:.2rem">Installed Version</div>
        <div style="color:#f1f5f9;font-size:1rem;font-weight:700">v${esc(ver)}</div>
      </div>
      <div id="upd-installed-badge" style="background:#164e3b;color:#4ade80;font-size:.65rem;font-weight:700;padding:.25rem .75rem;border-radius:9999px">Up to date</div>
    </div>

    <!-- Status area -->
    <div id="upd-status-area" style="min-height:3.5rem">
      <div style="display:flex;align-items:center;gap:.5rem;color:#475569;font-size:.75rem">
        <div class="spin" style="width:.8rem;height:.8rem;border:2px solid #6366f1;border-top-color:transparent;border-radius:9999px;flex-shrink:0"></div>
        Checking for updates…
      </div>
    </div>

    <!-- Check again button -->
    <button onclick="checkForUpdates()"
      style="width:100%;background:#0f172a;color:#475569;font-size:.72rem;font-weight:600;padding:.5rem;border-radius:.625rem;border:1px solid #1e293b;cursor:pointer;transition:all .15s"
      onmouseover="this.style.background='#1e293b';this.style.color='#94a3b8'" onmouseout="this.style.background='#0f172a';this.style.color='#475569'">
      🔄 Check Again
    </button>
  </div>`

  _initUpdateListener()

  // Restore any result already cached in the main process (e.g. from the startup check)
  const cached = await window.api.getUpdateState().catch(() => null)
  if (cached && cached.status && cached.status !== 'checking') {
    _handleUpdateStatus(cached)
  } else {
    // Nothing cached yet — trigger a fresh check
    checkForUpdates()
  }
}

function renderLoginCard(mode) {
  _loginMode = mode || _loginMode
  // Keep Login tab visually active
  const btnLogin   = document.getElementById('ltab-login')
  const btnUpdates = document.getElementById('ltab-updates')
  if (btnLogin)   { btnLogin.style.background = '#4f46e5'; btnLogin.style.color = '#fff' }
  if (btnUpdates) { btnUpdates.style.background = 'transparent'; btnUpdates.style.color = '#64748b' }

  const card = document.getElementById('login-card')
  if (!card) return
  const inp = 'width:100%;padding:.625rem .875rem;border-radius:.75rem;border:1px solid #334155;background:rgba(51,65,85,.6);color:#f1f5f9;font-size:.8rem;outline:none;box-sizing:border-box'
  if (mode === 'setup') {
    card.innerHTML = `
      <h2 style="color:#f1f5f9;font-weight:700;font-size:1.05rem;margin:0 0 .2rem">Welcome!</h2>
      <p style="color:#64748b;font-size:.72rem;margin:0 0 1.1rem">Create your account to get started. Everything stays on this device.</p>
      <div style="display:flex;flex-direction:column;gap:.75rem">
        <div>
          <label style="display:block;color:#94a3b8;font-size:.72rem;font-weight:600;margin-bottom:.35rem">Your Name</label>
          <input id="ln-name" type="text" placeholder="Dr. Jane Smith" style="${inp}"
            onfocus="this.style.borderColor='#6366f1'" onblur="this.style.borderColor='#334155'"
            onkeydown="if(event.key==='Enter')document.getElementById('ln-pw').focus()"/>
        </div>
        <div>
          <label style="display:block;color:#94a3b8;font-size:.72rem;font-weight:600;margin-bottom:.35rem">Create Password <span style="color:#475569;font-weight:400">(min. 8 characters)</span></label>
          <input id="ln-pw" type="password" placeholder="••••••••" style="${inp}"
            onfocus="this.style.borderColor='#6366f1'" onblur="this.style.borderColor='#334155'"
            onkeydown="if(event.key==='Enter')document.getElementById('ln-pw2').focus()"/>
        </div>
        <div>
          <label style="display:block;color:#94a3b8;font-size:.72rem;font-weight:600;margin-bottom:.35rem">Confirm Password</label>
          <input id="ln-pw2" type="password" placeholder="••••••••" style="${inp}"
            onfocus="this.style.borderColor='#6366f1'" onblur="this.style.borderColor='#334155'"
            onkeydown="if(event.key==='Enter')doAuthSetup()"/>
        </div>
        <p id="ln-err" style="color:#f87171;font-size:.72rem;display:none;margin:0"></p>
        <button onclick="doAuthSetup()"
          style="width:100%;background:#4f46e5;color:#fff;font-weight:600;padding:.625rem;border-radius:.75rem;font-size:.825rem;border:none;cursor:pointer;transition:background .15s"
          onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'">
          Create Account &amp; Enter →
        </button>
      </div>`
    setTimeout(() => document.getElementById('ln-name')?.focus(), 80)
  } else {
    card.innerHTML = `
      <h2 style="color:#f1f5f9;font-weight:700;font-size:1.05rem;margin:0 0 .2rem">Welcome back!</h2>
      <p style="color:#64748b;font-size:.72rem;margin:0 0 1.1rem">Enter your password to unlock the Command Center.</p>
      <div style="display:flex;flex-direction:column;gap:.75rem">
        <div>
          <label style="display:block;color:#94a3b8;font-size:.72rem;font-weight:600;margin-bottom:.35rem">Password</label>
          <input id="ln-pw" type="password" placeholder="••••••••" style="${inp}"
            onfocus="this.style.borderColor='#6366f1'" onblur="this.style.borderColor='#334155'"
            onkeydown="if(event.key==='Enter')doAuthLogin()"/>
        </div>
        <p id="ln-err" style="color:#f87171;font-size:.72rem;display:none;margin:0"></p>
        <button onclick="doAuthLogin()"
          style="width:100%;background:#4f46e5;color:#fff;font-weight:600;padding:.625rem;border-radius:.75rem;font-size:.825rem;border:none;cursor:pointer;transition:background .15s"
          onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'">
          Unlock →
        </button>
      </div>
      <div style="margin-top:1rem;padding-top:.75rem;border-top:1px solid #1e293b;text-align:center">
        <button onclick="loginShowTab('updates')"
          style="color:#475569;font-size:.7rem;background:none;border:none;cursor:pointer;padding:0;transition:color .15s"
          onmouseover="this.style.color='#818cf8'" onmouseout="this.style.color='#475569'">
          🔄 Check for updates →
        </button>
      </div>`
    setTimeout(() => document.getElementById('ln-pw')?.focus(), 80)
  }
}

function _loginErr(msg) {
  const el = document.getElementById('ln-err')
  if (el) { el.textContent = msg; el.style.display = 'block' }
}

async function doAuthSetup() {
  const name = document.getElementById('ln-name')?.value.trim()
  const pw   = document.getElementById('ln-pw')?.value
  const pw2  = document.getElementById('ln-pw2')?.value
  if (!name)                { _loginErr('Enter your name'); return }
  if (!pw || pw.length < 8) { _loginErr('Password must be at least 8 characters'); return }
  if (pw !== pw2)           { _loginErr("Passwords don't match"); return }
  const btn = document.querySelector('#login-card button[onclick="doAuthSetup()"]')
  if (btn) { btn.textContent = 'Creating…'; btn.disabled = true }
  const r = await window.api.authSetup({ name, password: pw })
  if (r.success) {
    document.getElementById('login-overlay').style.display = 'none'
    await loadAndShowApp()
  } else {
    if (btn) { btn.innerHTML = 'Create Account &amp; Enter →'; btn.disabled = false }
    _loginErr(r.error || 'Setup failed')
  }
}

async function doAuthLogin() {
  const pw = document.getElementById('ln-pw')?.value
  if (!pw) { _loginErr('Enter your password'); return }
  const btn = document.querySelector('#login-card button[onclick="doAuthLogin()"]')
  if (btn) { btn.textContent = 'Unlocking…'; btn.disabled = true }
  const r = await window.api.authLogin(pw)
  if (r.success) {
    document.getElementById('login-overlay').style.display = 'none'
    await loadAndShowApp()
  } else {
    if (btn) { btn.textContent = 'Unlock →'; btn.disabled = false }
    const pwEl = document.getElementById('ln-pw')
    if (pwEl) { pwEl.value = ''; pwEl.focus() }
    _loginErr(r.error || 'Incorrect password')
  }
}

const _updCard = {
  _spinner: `<div class="spin" style="width:.8rem;height:.8rem;border:2px solid #6366f1;border-top-color:transparent;border-radius:9999px;flex-shrink:0"></div>`,
  _row: `display:flex;align-items:center;gap:.5rem`,
  show(html) {
    const d = document.getElementById('upd-status-area')
    if (d) d.innerHTML = html
  },
  clear() {
    const d = document.getElementById('upd-status-area')
    if (d) d.innerHTML = ''
  },
  _setBadge(text, color) {
    const b = document.getElementById('upd-installed-badge')
    if (b) { b.textContent = text; b.style.background = color.bg; b.style.color = color.text }
  },
  _setTabDot(show) {
    const btn = document.getElementById('ltab-updates')
    if (!btn) return
    btn.innerHTML = show ? '🔄 Updates <span style="display:inline-block;width:.45rem;height:.45rem;background:#f87171;border-radius:9999px;margin-left:.2rem;vertical-align:middle"></span>' : '🔄 Updates'
  },
}

function _handleUpdateStatus({ status, version, percent, message } = {}) {
  if (status === 'checking') {
    _updCard.show(`
      <div style="${_updCard._row};color:#475569;font-size:.75rem">
        ${_updCard._spinner} Checking for updates…
      </div>`)
    _updCard._setBadge('Checking…', { bg:'#1e293b', text:'#475569' })
  } else if (status === 'current') {
    _updCard.show(`
      <div style="${_updCard._row}">
        <span style="color:#4ade80;font-size:1rem">✓</span>
        <span style="color:#4ade80;font-size:.8rem;font-weight:600">You're on the latest version</span>
      </div>`)
    _updCard._setBadge('Up to date', { bg:'#164e3b', text:'#4ade80' })
    _updCard._setTabDot(false)
  } else if (status === 'available') {
    _updCard.show(`
      <div>
        <div style="${_updCard._row};margin-bottom:.625rem">
          ${_updCard._spinner}
          <span style="color:#a5b4fc;font-size:.8rem;font-weight:600">Update found — downloading…</span>
        </div>
        <div style="background:#0f172a;border-radius:9999px;height:.35rem;overflow:hidden">
          <div style="background:#4f46e5;height:100%;border-radius:9999px;width:3%;transition:width .4s ease"></div>
        </div>
        <div style="color:#475569;font-size:.68rem;margin-top:.4rem">v${esc(version||'')} will install on restart</div>
      </div>`)
    _updCard._setBadge('Downloading', { bg:'#1e3a5f', text:'#93c5fd' })
    _updCard._setTabDot(true)
  } else if (status === 'downloading') {
    const pct = Math.round(percent ?? 0)
    _updCard.show(`
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.625rem">
          <div style="${_updCard._row}">
            ${_updCard._spinner}
            <span style="color:#a5b4fc;font-size:.8rem;font-weight:600">Downloading v${esc(version||'')}</span>
          </div>
          <span style="color:#818cf8;font-size:.75rem;font-weight:700">${pct}%</span>
        </div>
        <div style="background:#0f172a;border-radius:9999px;height:.45rem;overflow:hidden">
          <div style="background:linear-gradient(90deg,#4f46e5,#818cf8);height:100%;border-radius:9999px;width:${pct}%;transition:width .4s ease"></div>
        </div>
        <div style="color:#475569;font-size:.68rem;margin-top:.4rem">${100-pct}% remaining…</div>
      </div>`)
    _updCard._setBadge(`${pct}%`, { bg:'#1e3a5f', text:'#93c5fd' })
  } else if (status === 'ready') {
    _updCard.show(`
      <div style="background:#1a1f3a;border:1px solid #3730a3;border-radius:.75rem;padding:1rem">
        <div style="${_updCard._row};margin-bottom:.875rem">
          <span style="font-size:1.25rem">🎉</span>
          <div>
            <p style="color:#a5b4fc;font-size:.825rem;font-weight:700;margin:0">v${esc(version||'')} ready to install</p>
            <p style="color:#475569;font-size:.7rem;margin:.2rem 0 0">The app will restart to apply the update</p>
          </div>
        </div>
        <button onclick="window.api.installUpdate()"
          style="width:100%;background:#4f46e5;color:#fff;font-weight:700;padding:.65rem;border-radius:.625rem;font-size:.8rem;border:none;cursor:pointer;transition:background .15s"
          onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'">
          ↻ Restart &amp; Install Now
        </button>
      </div>`)
    _updCard._setBadge('Ready!', { bg:'#3730a3', text:'#a5b4fc' })
    _updCard._setTabDot(true)
  } else if (status === 'error') {
    const detail = message ? `: ${message}` : ''
    _updCard.show(`<div style="color:#f87171;font-size:.75rem">⚠ Update check failed${esc(detail)}</div>`)
    _updCard._setBadge('Error', { bg:'#3b1a1a', text:'#f87171' })
    _updCard._setTabDot(false)
  }
}

let _updateListenerSet = false
function _initUpdateListener() {
  if (_updateListenerSet) return
  _updateListenerSet = true
  window.api.onUpdateStatus(_handleUpdateStatus)
}

async function checkForUpdates() {
  _initUpdateListener()
  _handleUpdateStatus({ status: 'checking' })
  await window.api.checkForUpdates()
}

async function lockApp() {
  await window.api.authLock()
  renderLoginCard('login')
  document.getElementById('login-overlay').style.display = 'flex'
}

// ── Odysseus managed instance — sidebar status ────────────────────────────────

function _initOdyStatusListener() {
  api.onOdyStatus(d => {
    const dot = document.getElementById('ody-status-dot')
    if (!dot) return
    if (d.status === 'ready') {
      dot.style.cssText = 'width:7px;height:7px;border-radius:50%;background:#22c55e;flex-shrink:0'
      dot.title = '✓ AI Engine running'
      // Auto-configure connection to managed instance
      if (state.profile && !state.profile.odysseusToken) {
        state.profile.odysseusUrl   = `http://127.0.0.1:7001`
        state.profile.odysseusToken = ''
        save('profile')
      }
    } else if (d.status === 'starting') {
      dot.style.cssText = 'width:7px;height:7px;border-radius:50%;background:#f59e0b;flex-shrink:0'
      dot.title = '⏳ AI Engine starting…'
    } else {
      dot.style.cssText = 'width:7px;height:7px;border-radius:50%;background:#475569;flex-shrink:0'
      dot.title = 'AI Engine stopped — Settings → App → AI Engine'
    }
  })
}

async function loadAndShowApp() {
  const keys = ['profile','projects','papers','contacts','notes','whiteboards','events','todos',
                 'grants','newsFeeds','newsTopics','newsRead','calGoals','calFeeds','todoGroups',
                 'darkModeSchedule','paperCollections','sidebarTools']
  await Promise.all([
    window.api.storeGet('theme').then(t => applyTheme(t || 'light')),
    window.api.storeGet('accentColor').then(c => applyAccent(c || 'indigo')),
    window.api.storeGet('fontFamily').then(f => applyFont(f || 'system')),
    ...keys.map(async k => { const val = await window.api.storeGet(k); if (val !== null) state[k] = val })
  ])
  updateSidebarProfile()
  renderSidebar()
  if (!state.profile) {
    // Pre-fill name from auth so users don't have to type it twice
    const authName = await window.api.authGetName().catch(() => null)
    showOnboarding(authName || '')
    return
  }
  // If profile exists but name is empty, recover it from the auth record
  if (!state.profile.name) {
    const authName = await window.api.authGetName().catch(() => null)
    if (authName) {
      state.profile.name   = authName
      state.profile.avatar = authName[0].toUpperCase()
      await save('profile')
    }
  }
  showView('dashboard')
  scheduleEventReminders()
  startDarkSchedule()
  if (typeof _checkAutoBackup === 'function') _checkAutoBackup()
  if (typeof newsInitAutoRefresh === 'function') newsInitAutoRefresh()
  _initOdyStatusListener()
}

// Lock event from main process (window hidden via X, or tray "Lock & Minimise")
window.api.onAuthLocked(() => {
  renderLoginCard('login')
  document.getElementById('login-overlay').style.display = 'flex'
})

// ── Global Search ─────────────────────────────────────────────────────────────
let _gsearchIdx       = -1
let _gsearchPrevFocus = null  // restore focus on close

function openGlobalSearch() {
  const ol = document.getElementById('gsearch-overlay')
  if (!ol) return
  // Remember what had focus so we can restore it on close
  _gsearchPrevFocus = document.activeElement
  ol.style.display  = 'flex'
  ol.style.opacity  = '0'
  requestAnimationFrame(() => { ol.style.transition = 'opacity .12s'; ol.style.opacity = '1' })
  const inp = document.getElementById('gsearch-input')
  if (inp) { inp.value = ''; inp.focus() }
  document.getElementById('gsearch-results').innerHTML = `<div style="padding:2rem;text-align:center;color:#94a3b8;font-size:.85rem">Start typing to search across your research workspace…</div>`
  _gsearchIdx = -1
}

function closeGlobalSearch() {
  const ol = document.getElementById('gsearch-overlay')
  if (ol) { ol.style.display = 'none'; ol.style.opacity = '' }
  _gsearchIdx = -1
  // Restore focus to whatever the user was doing before the search opened
  try { _gsearchPrevFocus?.focus() } catch {}
  _gsearchPrevFocus = null
}

function _runGlobalSearch(q) {
  _gsearchIdx = -1
  const el = document.getElementById('gsearch-results')
  if (!el) return
  const query = (q || '').toLowerCase().trim()
  if (!query) {
    el.innerHTML = `<div style="padding:2rem;text-align:center;color:#94a3b8;font-size:.85rem">Start typing…</div>`
    return
  }
  const results = []
  const match = (str) => (str || '').toLowerCase().includes(query)
  const excerpt = (str, len = 80) => {
    const s = (str || '').replace(/\s+/g, ' ')
    const i = s.toLowerCase().indexOf(query)
    if (i < 0) return s.slice(0, len)
    const start = Math.max(0, i - 20)
    return (start > 0 ? '…' : '') + s.slice(start, start + len)
  }

  state.notes.forEach(n => {
    if (match(n.title) || match(n.content)) {
      results.push({ type:'note', icon:'📝', label:'Note', title: n.title || 'Untitled Note',
        sub: excerpt(n.content), action: `closeGlobalSearch();showView('notes');setTimeout(()=>openNote&&openNote('${n.id}'),150)` })
    }
  })
  state.papers.forEach(p => {
    if (match(p.title) || match(p.authors) || match(p.abstract)) {
      results.push({ type:'paper', icon:'📚', label:'Paper', title: p.title || 'Untitled',
        sub: (p.authors || '') + (p.year ? ' · ' + p.year : ''), action: `closeGlobalSearch();showView('library')` })
    }
  })
  state.projects.forEach(p => {
    if (match(p.name) || match(p.description)) {
      results.push({ type:'project', icon:'📋', label:'Project', title: p.name || 'Untitled',
        sub: p.description || '', action: `closeGlobalSearch();showView('projects')` })
    }
  })
  state.contacts.forEach(c => {
    if (match(c.name) || match(c.email) || match(c.institution)) {
      results.push({ type:'contact', icon:'👤', label:'Contact', title: c.name || 'Unknown',
        sub: [c.institution, c.email].filter(Boolean).join(' · '), action: `closeGlobalSearch();showView('contacts')` })
    }
  })
  state.todos.forEach(t => {
    if (match(t.title) || match(t.description)) {
      results.push({ type:'todo', icon:'✅', label:'Task', title: t.title,
        sub: t.dueDate ? 'Due: ' + t.dueDate : '', action: `closeGlobalSearch();showView('todos')` })
    }
  })
  state.events.forEach(e => {
    if (match(e.title) || match(e.description)) {
      results.push({ type:'event', icon:'📅', label:'Event', title: e.title,
        sub: e.date || '', action: `closeGlobalSearch();showView('calendar')` })
    }
  })

  if (!results.length) {
    el.innerHTML = `<div style="padding:2rem;text-align:center;color:#94a3b8;font-size:.85rem">No results for "<strong style="color:#475569">${esc(q)}</strong>"</div>`
    return
  }

  const typeColors = { note:'#6366f1', paper:'#0ea5e9', project:'#10b981', contact:'#f59e0b', todo:'#f43f5e', event:'#8b5cf6' }
  el.innerHTML = results.slice(0, 20).map((r, i) =>
    `<div class="gsearch-item" id="gsi-${i}" onclick="${r.action}"
      style="display:flex;align-items:flex-start;gap:.75rem;padding:.625rem .875rem;border-radius:.625rem;cursor:pointer;transition:background .1s"
      onmouseover="this.style.background='#f8fafc';_gsearchIdx=${i}"
      onmouseout="if(_gsearchIdx!==${i})this.style.background=''">
      <span style="font-size:1rem;flex-shrink:0;margin-top:.1rem">${r.icon}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:.875rem;font-weight:600;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.title)}</div>
        ${r.sub ? `<div style="font-size:.75rem;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.sub)}</div>` : ''}
      </div>
      <span style="font-size:.7rem;padding:.2rem .5rem;border-radius:.375rem;flex-shrink:0;margin-top:.1rem;background:${typeColors[r.type]}20;color:${typeColors[r.type]}">${r.label}</span>
    </div>`
  ).join('')
  if (results.length > 20) {
    el.innerHTML += `<div style="padding:.5rem .875rem 1rem;text-align:center;font-size:.75rem;color:#94a3b8">+${results.length-20} more — refine your search</div>`
  }
}

function _gsearchKey(e) {
  const items = document.querySelectorAll('.gsearch-item')
  if (e.key === 'Escape') { closeGlobalSearch(); return }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    _gsearchIdx = Math.min(_gsearchIdx + 1, items.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    _gsearchIdx = Math.max(_gsearchIdx - 1, 0)
  } else if (e.key === 'Enter' && _gsearchIdx >= 0) {
    items[_gsearchIdx]?.click()
    return
  } else {
    return
  }
  items.forEach((it, i) => {
    it.style.background = i === _gsearchIdx ? '#f1f5f9' : ''
  })
  items[_gsearchIdx]?.scrollIntoView({ block: 'nearest' })
}

// ── Dark mode schedule ────────────────────────────────────────────────────────
let _darkScheduleInterval = null

function _applyDarkSchedule() {
  const s = state.darkModeSchedule
  if (!s?.enabled || !s.lightFrom || !s.darkFrom) return
  const now  = new Date()
  const mins = now.getHours() * 60 + now.getMinutes()
  const toM  = t => { const [h,m] = t.split(':').map(Number); return h * 60 + m }
  const lightM = toM(s.lightFrom), darkM = toM(s.darkFrom)
  let isDark
  if (darkM > lightM) {
    isDark = mins >= darkM || mins < lightM
  } else {
    isDark = mins >= darkM && mins < lightM
  }
  applyTheme(isDark ? 'dark' : 'light')
}

function startDarkSchedule() {
  if (_darkScheduleInterval) clearInterval(_darkScheduleInterval)
  _applyDarkSchedule()
  _darkScheduleInterval = setInterval(_applyDarkSchedule, 60000)
}

// ── Event reminder scheduler ──────────────────────────────────────────────────
const _reminderTimers = {}
const _REMINDER_OFFSETS = { '15min':15*60000,'30min':30*60000,'1hour':3600000,'3hours':3*3600000,'1day':86400000 }
const _REMINDER_LABELS  = { '15min':'15 min before','30min':'30 min before','1hour':'1 hour before','3hours':'3 hours before','1day':'1 day before' }

function scheduleEventReminders() {
  if (typeof Notification === 'undefined') return
  if (Notification.permission === 'default') Notification.requestPermission()
  const now = Date.now()
  state.events.forEach(e => {
    if (!e.reminder || !e.date) return
    const offset = _REMINDER_OFFSETS[e.reminder]
    if (!offset) return
    const timeStr  = e.startTime || '09:00'
    const eventMs  = new Date(`${e.date}T${timeStr}`).getTime()
    const fireAt   = eventMs - offset
    const delay    = fireAt - now
    if (delay < 0 || delay > 7 * 86400000) return
    if (_reminderTimers[e.id]) { clearTimeout(_reminderTimers[e.id]); delete _reminderTimers[e.id] }
    _reminderTimers[e.id] = setTimeout(() => {
      delete _reminderTimers[e.id]
      if (Notification.permission !== 'granted') return
      new Notification(`⏰ ${e.title}`, {
        body: `${_REMINDER_LABELS[e.reminder] || 'Reminder'} · ${e.date}`,
        silent: false,
      })
    }, delay)
  })
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  // Don't fire when typing in inputs
  const tag = document.activeElement?.tagName
  const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    || document.activeElement?.contentEditable === 'true'

  // Ctrl+K / Cmd+K — global search (always fires even in inputs so it works universally)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    const ol = document.getElementById('gsearch-overlay')
    if (ol?.style.display !== 'none') closeGlobalSearch()
    else openGlobalSearch()
    return
  }

  // ? — keyboard shortcuts cheatsheet (when not in input)
  if (e.key === '?' && !inInput) {
    e.preventDefault()
    openShortcutsModal()
    return
  }

  // Escape — close modal or search overlay
  if (e.key === 'Escape') {
    const modal = document.getElementById('modal-overlay')
    if (!modal?.classList.contains('hidden')) { closeModal(); return }
    const gsearch = document.getElementById('gsearch-overlay')
    if (gsearch?.style.display !== 'none') { closeGlobalSearch(); return }
    return
  }

  if (inInput) return

  // View shortcuts
  const viewMap = { '1':'dashboard','2':'projects','3':'library','4':'notes','5':'calendar','6':'todos' }
  if (viewMap[e.key]) { showView(viewMap[e.key]); return }

  // N — new note (if in notes view)
  if (e.key === 'n' && state.currentView === 'notes') {
    if (typeof newNote === 'function') { newNote('note'); return }
  }

  // T — new task
  if (e.key === 't' && state.currentView === 'todos') {
    if (typeof openTodoModal === 'function') { openTodoModal(); return }
  }
})

// ── Start ─────────────────────────────────────────────────────────────────────
async function init() { await checkAuthAndStart() }
init()
