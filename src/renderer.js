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
  todoGroups: []
}

const VIEWS = ['dashboard','projects','library','grants','news','notes','whiteboard','utilities','discover','contacts','calendar','todos','feedback','settings','support']

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
        <button onclick="completeOnboarding()"
          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
          Get Started →
        </button>
        <p class="text-center text-xs text-slate-400">No account · No API key · Open source</p>
      </div>
    </div>
  </div>`
}

async function completeOnboarding() {
  const name  = document.getElementById('onboard-name').value.trim()
  const field = document.getElementById('onboard-field').value.trim()
  if (!name) { showToast('Please enter your name', 'error'); return }
  state.profile = { name, field, avatar: name[0].toUpperCase() }
  await window.api.storeSet('profile', state.profile)
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

let _updateListenerSet = false
function _initUpdateListener() {
  if (_updateListenerSet) return
  _updateListenerSet = true
  window.api.onUpdateStatus(({ status, version, percent }) => {
    const div = document.getElementById('login-update')
    if (status === 'checking') {
      if (div) div.innerHTML = `<span style="color:#475569;font-size:.7rem">Checking for updates…</span>`
    } else if (status === 'current') {
      if (div) { div.innerHTML = `<span style="color:#334155;font-size:.7rem">✓ Up to date</span>`; setTimeout(() => { if (div) div.innerHTML = '' }, 3000) }
    } else if (status === 'available') {
      if (div) div.innerHTML = `<span style="color:#a5b4fc;font-size:.7rem">⬇️ Downloading v${esc(version)}…</span>`
    } else if (status === 'downloading') {
      if (div) div.innerHTML = `<span style="color:#a5b4fc;font-size:.7rem">⬇️ Downloading… ${percent}%</span>`
    } else if (status === 'ready') {
      const btn = `<button onclick="window.api.installUpdate()"
        style="background:#4f46e5;color:#fff;font-size:.72rem;font-weight:600;padding:.3rem .875rem;border-radius:.5rem;border:none;cursor:pointer;margin-top:.4rem">
        Restart to install v${esc(version)} →</button>`
      if (div) div.innerHTML = `
        <div style="background:rgba(30,27,75,.8);border:1px solid #4338ca;border-radius:.75rem;padding:.7rem 1rem;text-align:center">
          <p style="color:#a5b4fc;font-size:.72rem;font-weight:600;margin:0">🎉 Update ready — v${esc(version)}</p>
          ${btn}
        </div>`
      showToast(`PhDFlow v${esc(version)} downloaded — restart to install`, 'info')
    } else if (status === 'error') {
      if (div) div.innerHTML = ''
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
                 'grants','newsFeeds','newsTopics','newsRead','calGoals','calFeeds','todoGroups']
  await Promise.all(keys.map(async k => {
    const val = await window.api.storeGet(k)
    if (val !== null) state[k] = val
  }))
  updateSidebarProfile()
  if (!state.profile) { showOnboarding(); return }
  showView('dashboard')
}

// Lock event from main process (window hidden via X, or tray "Lock & Minimise")
window.api.onAuthLocked(() => {
  renderLoginCard('login')
  document.getElementById('login-overlay').style.display = 'flex'
})

// ── Start ─────────────────────────────────────────────────────────────────────
async function init() { await checkAuthAndStart() }
init()
