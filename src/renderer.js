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
}

const VIEWS = ['dashboard','projects','library','grants','news','notes','whiteboard','utilities','discover','contacts','calendar','todos','feedback','settings','support','guide']

// ── Theme ─────────────────────────────────────────────────────────────────────
function applyTheme(t) {
  document.documentElement.dataset.theme = (t === 'dark') ? 'dark' : 'light'
}

// ── Onboarding + view init are called after login via loadAndShowApp() ─────────

// ── Onboarding ────────────────────────────────────────────────────────────────
function showOnboarding() {
  document.getElementById('view-content').innerHTML = `
  <div class="flex-1 flex items-center justify-center p-8 h-full">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div class="text-5xl mb-4">⚗️</div>
        <h1 class="text-2xl font-bold text-slate-900">PhDFlow</h1>
        <p class="text-slate-500 mt-2 text-sm">Your all-in-one research workspace.<br/>Open source. All data stays on your device.</p>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">What's your name?</label>
          <input id="onboard-name" type="text" placeholder="e.g. Anya Sharma"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onkeydown="if(event.key==='Enter')completeOnboarding()"/>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Your research field <span class="text-slate-400 font-normal">(optional)</span></label>
          <input id="onboard-field" type="text" placeholder="e.g. Computational Materials Science"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Choose your theme</label>
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
        <button onclick="completeOnboarding()"
          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
          Get Started →
        </button>
        <p class="text-center text-xs text-slate-400">No account · No API key · Open source</p>
      </div>
    </div>
  </div>`
  window._onboardTheme = 'light'
}

function onboardPickTheme(t) {
  window._onboardTheme = t
  applyTheme(t)
  document.getElementById('onboard-theme-light').className =
    `flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${t==='light' ? 'border-indigo-500 bg-slate-50' : 'border-transparent bg-slate-100'}`
  document.getElementById('onboard-theme-dark').className =
    `flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${t==='dark' ? 'border-indigo-500 bg-slate-800' : 'border-transparent bg-slate-100'}`
}

async function completeOnboarding() {
  const name  = document.getElementById('onboard-name').value.trim()
  const field = document.getElementById('onboard-field').value.trim()
  if (!name) { showToast('Please enter your name', 'error'); return }
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
  VIEWS.forEach(v => document.getElementById(`nav-${v}`)?.classList.toggle('active', v === name))
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

function renderLoginCard(mode) {
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
      <div style="margin-top:1.1rem;padding-top:.875rem;border-top:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between">
        <button onclick="checkForUpdates()"
          style="color:#475569;font-size:.7rem;background:none;border:none;cursor:pointer;padding:0;transition:color .15s"
          onmouseover="this.style.color='#94a3b8'" onmouseout="this.style.color='#475569'">
          🔄 Check for updates
        </button>
        <button onclick="window.api.quitApp()"
          style="color:#475569;font-size:.7rem;background:none;border:none;cursor:pointer;padding:0;transition:color .15s"
          onmouseover="this.style.color='#f87171'" onmouseout="this.style.color='#475569'">
          ✕ Quit
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
  _s: `background:#1e293b;border:1px solid rgba(148,163,184,.12);border-radius:.875rem;padding:.875rem 1rem`,
  _row: `display:flex;align-items:center;gap:.625rem`,
  _label: `color:#94a3b8;font-size:.72rem`,
  _spinner: `<div class="spin" style="width:.875rem;height:.875rem;border:2px solid #6366f1;border-top-color:transparent;border-radius:9999px;flex-shrink:0"></div>`,
  show(html) { const d = document.getElementById('login-update'); if (d) d.innerHTML = html },
  clear()    { const d = document.getElementById('login-update'); if (d) d.innerHTML = '' },
}

let _updateListenerSet = false
function _initUpdateListener() {
  if (_updateListenerSet) return
  _updateListenerSet = true
  window.api.onUpdateStatus(({ status, version, percent }) => {
    if (status === 'checking') {
      _updCard.show(`
        <div style="${_updCard._s}">
          <div style="${_updCard._row}">
            ${_updCard._spinner}
            <span style="${_updCard._label}">Checking for updates…</span>
          </div>
        </div>`)
    } else if (status === 'current') {
      _updCard.show(`
        <div style="${_updCard._s}">
          <div style="${_updCard._row}">
            <span style="color:#4ade80;font-size:.875rem;flex-shrink:0">✓</span>
            <span style="color:#4ade80;font-size:.72rem;font-weight:600">You're on the latest version</span>
          </div>
        </div>`)
      setTimeout(() => _updCard.clear(), 4000)
    } else if (status === 'available') {
      _updCard.show(`
        <div style="${_updCard._s}">
          <div style="${_updCard._row};margin-bottom:.5rem">
            ${_updCard._spinner}
            <span style="color:#a5b4fc;font-size:.72rem;font-weight:600">Update found — downloading v${esc(version)}</span>
          </div>
          <div style="background:#0f172a;border-radius:9999px;height:.3rem;overflow:hidden">
            <div style="background:#4f46e5;height:100%;border-radius:9999px;width:5%;transition:width .4s ease"></div>
          </div>
        </div>`)
    } else if (status === 'downloading') {
      const pct = percent ?? 0
      _updCard.show(`
        <div style="${_updCard._s}">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">
            <div style="${_updCard._row}">
              ${_updCard._spinner}
              <span style="color:#a5b4fc;font-size:.72rem;font-weight:600">Downloading v${esc(version)}</span>
            </div>
            <span style="color:#475569;font-size:.68rem;font-weight:600;flex-shrink:0">${pct}%</span>
          </div>
          <div style="background:#0f172a;border-radius:9999px;height:.3rem;overflow:hidden">
            <div style="background:linear-gradient(90deg,#4f46e5,#818cf8);height:100%;border-radius:9999px;width:${pct}%;transition:width .4s ease"></div>
          </div>
        </div>`)
    } else if (status === 'ready') {
      _updCard.show(`
        <div style="background:#1e293b;border:1px solid #3730a3;border-radius:.875rem;padding:1rem">
          <div style="${_updCard._row};margin-bottom:.75rem">
            <span style="font-size:1.1rem">🎉</span>
            <div>
              <p style="color:#a5b4fc;font-size:.75rem;font-weight:700;margin:0">v${esc(version)} is ready to install</p>
              <p style="color:#475569;font-size:.67rem;margin:.15rem 0 0">Restart the app to apply the update</p>
            </div>
          </div>
          <button onclick="window.api.installUpdate()"
            style="width:100%;background:#4f46e5;color:#fff;font-weight:600;padding:.55rem;border-radius:.625rem;font-size:.78rem;border:none;cursor:pointer;transition:background .15s"
            onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'">
            Restart &amp; Install →
          </button>
        </div>`)
      showToast(`v${esc(version)} downloaded — restart to install`, 'info')
    } else if (status === 'error') {
      _updCard.clear()
    }
  })
}

async function checkForUpdates() {
  _initUpdateListener()
  window.api.checkForUpdates().catch(() => null)
}

async function lockApp() {
  await window.api.authLock()
  renderLoginCard('login')
  document.getElementById('login-overlay').style.display = 'flex'
}

async function loadAndShowApp() {
  const keys = ['profile','projects','papers','contacts','notes','whiteboards','events','todos',
                 'grants','newsFeeds','newsTopics','newsRead','calGoals','calFeeds','todoGroups','darkModeSchedule']
  const [, ...vals] = await Promise.all([
    window.api.storeGet('theme').then(t => applyTheme(t || 'light')),
    ...keys.map(async k => { const val = await window.api.storeGet(k); if (val !== null) state[k] = val })
  ])
  updateSidebarProfile()
  if (!state.profile) { showOnboarding(); return }
  showView('dashboard')
  scheduleEventReminders()
  startDarkSchedule()
  if (typeof _checkAutoBackup === 'function') _checkAutoBackup()
}

// Lock event from main process (window hidden via X, or tray "Lock & Minimise")
window.api.onAuthLocked(() => {
  renderLoginCard('login')
  document.getElementById('login-overlay').style.display = 'flex'
})

// ── Global Search ─────────────────────────────────────────────────────────────
let _gsearchIdx = -1

function openGlobalSearch() {
  const ol = document.getElementById('gsearch-overlay')
  if (!ol) return
  ol.style.display = 'flex'
  const inp = document.getElementById('gsearch-input')
  if (inp) { inp.value = ''; inp.focus() }
  document.getElementById('gsearch-results').innerHTML = `<div style="padding:2rem;text-align:center;color:#94a3b8;font-size:.85rem">Start typing to search across your research workspace…</div>`
  _gsearchIdx = -1
}

function closeGlobalSearch() {
  const ol = document.getElementById('gsearch-overlay')
  if (ol) ol.style.display = 'none'
  _gsearchIdx = -1
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
  if (e.key === 'ArrowDown' || e.key === 'j') {
    e.preventDefault()
    _gsearchIdx = Math.min(_gsearchIdx + 1, items.length - 1)
  } else if (e.key === 'ArrowUp' || e.key === 'k') {
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

  // Ctrl+K / Cmd+K — global search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    const ol = document.getElementById('gsearch-overlay')
    if (ol?.style.display !== 'none') closeGlobalSearch()
    else openGlobalSearch()
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
