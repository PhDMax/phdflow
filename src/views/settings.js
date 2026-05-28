// ══ Settings View ══════════════════════════════════════════════════════════════
// Tabs: Profile · App · Diagnostics · Backup · 🔐 Vault

let _settingsTab = 'profile'
let _vaultState  = { initialized:false, unlocked:false, pwVerified:false, totpVerified:false }
let _vaultEntries= []

// ── Main render ────────────────────────────────────────────────────────────────

async function render_settings() {
  const vc = document.getElementById('view-content')
  vc.innerHTML = `
  ${pageHeader('⚙️ Settings', '')}
  <div class="flex border-b border-slate-200 bg-white flex-shrink-0 px-6">
    ${[['profile','👤 Profile'],['app','🔧 App'],['diagnostics','🩺 Diagnostics'],['backup','💾 Backup'],['vault','🔐 Vault']].map(([v,l]) =>
      `<button id="stab-${v}" onclick="settingsTab('${v}')"
        class="px-4 py-3 text-xs font-semibold border-b-2 transition-colors mr-1">${l}</button>`
    ).join('')}
  </div>
  <div id="settings-body" class="flex-1 overflow-y-auto"></div>`

  // Refresh vault status
  _vaultState = await api.vaultStatus()

  // Auto-lock listener
  api.onVaultLocked(() => {
    _vaultState.unlocked = false
    _vaultEntries = []
    if (_settingsTab === 'vault') settingsTab('vault')
  })

  settingsTab(_settingsTab)
}

function settingsTab(tab) {
  _settingsTab = tab
  ;['profile','app','diagnostics','backup','vault'].forEach(t => {
    const btn = document.getElementById(`stab-${t}`)
    if (!btn) return
    btn.className = `px-4 py-3 text-xs font-semibold border-b-2 transition-colors mr-1 ${
      t === tab
        ? 'border-indigo-600 text-indigo-600'
        : 'border-transparent text-slate-500 hover:text-slate-700'
    }`
  })
  const body = document.getElementById('settings-body')
  if (!body) return
  if      (tab === 'profile')     renderProfileTab(body)
  else if (tab === 'app')         renderAppTab(body)
  else if (tab === 'diagnostics') renderDiagnosticsTab(body)
  else if (tab === 'backup')      renderBackupTab(body)
  else                            renderVaultTab(body)
}

// ── Profile tab ───────────────────────────────────────────────────────────────

function renderProfileTab(body) {
  const p = state.profile || {}
  body.innerHTML = `
  <div class="p-6 max-w-2xl space-y-5">

    <!-- Identity -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-4">🪪 Research Identity</h3>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">Full name</label>
            <input id="sp-name" type="text" value="${esc(p.name)}" class="input" placeholder="Dr. Max Müller"/></div>
          <div><label class="label">Preferred name / alias</label>
            <input id="sp-alias" type="text" value="${esc(p.alias)}" class="input" placeholder="Max"/></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">Research field</label>
            <input id="sp-field" type="text" value="${esc(p.field)}" class="input" placeholder="Computational Neuroscience"/></div>
          <div><label class="label">Sub-discipline</label>
            <input id="sp-subfield" type="text" value="${esc(p.subfield)}" class="input" placeholder="Connectomics"/></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">Institution</label>
            <input id="sp-institution" type="text" value="${esc(p.institution)}" class="input" placeholder="TU Munich"/></div>
          <div><label class="label">Department</label>
            <input id="sp-dept" type="text" value="${esc(p.department)}" class="input" placeholder="School of Life Sciences"/></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">Supervisor</label>
            <input id="sp-supervisor" type="text" value="${esc(p.supervisor)}" class="input" placeholder="Prof. Dr. Anna Schmidt"/></div>
          <div><label class="label">Co-supervisor</label>
            <input id="sp-cosup" type="text" value="${esc(p.cosupervisor)}" class="input" placeholder="optional"/></div>
        </div>
      </div>
    </div>

    <!-- Dates & IDs -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-4">📅 Dates & Academic IDs</h3>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">PhD start date</label>
            <input id="sp-start" type="date" value="${p.phdStart||''}" class="input"/></div>
          <div><label class="label">Expected submission</label>
            <input id="sp-end" type="date" value="${p.phdEnd||''}" class="input"/></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">ORCID iD</label>
            <input id="sp-orcid" type="text" value="${esc(p.orcid)}" class="input" placeholder="0000-0000-0000-0000"/></div>
          <div><label class="label">Researcher ID / Scopus ID</label>
            <input id="sp-rid" type="text" value="${esc(p.researcherId)}" class="input" placeholder="optional"/></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">Email</label>
            <input id="sp-email" type="email" value="${esc(p.email)}" class="input" placeholder="max@tum.de"/></div>
          <div><label class="label">Personal website</label>
            <input id="sp-web" type="url" value="${esc(p.website)}" class="input" placeholder="https://maxmueller.de"/></div>
        </div>
      </div>
    </div>

    <!-- PhD progress -->
    ${p.phdStart && p.phdEnd ? (() => {
      const start = new Date(p.phdStart), end = new Date(p.phdEnd), now = new Date()
      const total = (end - start) / 86400000
      const elapsed = Math.max(0, Math.min(total, (now - start) / 86400000))
      const pct = Math.round(elapsed / total * 100)
      const daysLeft = Math.round((end - now) / 86400000)
      return `<div class="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 class="text-sm font-bold text-slate-700 mb-3">🎓 PhD Progress</h3>
        <div class="flex items-center justify-between text-xs mb-2">
          <span class="text-indigo-600 font-bold">${pct}% through your PhD</span>
          <span class="text-slate-400">${daysLeft > 0 ? daysLeft + ' days remaining' : Math.abs(daysLeft) + ' days past deadline'}</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div class="bg-indigo-500 h-3 rounded-full transition-all" style="width:${pct}%"></div>
        </div>
        <div class="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>${new Date(p.phdStart).toLocaleDateString('en-GB',{month:'short',year:'numeric'})}</span>
          <span>${new Date(p.phdEnd).toLocaleDateString('en-GB',{month:'short',year:'numeric'})}</span>
        </div>
      </div>`
    })() : ''}

    <!-- Stats -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-3">📊 Your Library</h3>
      <div class="grid grid-cols-4 gap-3">
        ${[['Projects',state.projects.length,'📋'],['Papers',state.papers.length,'📚'],
           ['Notes',state.notes.length,'📝'],['Events',state.events.length,'📅'],
           ['To-Dos',state.todos.length,'✅'],['Grants',state.grants.length,'✍️'],
           ['Boards',state.whiteboards.length,'🎨'],['Contacts',state.contacts.length,'👥']].map(([l,n,ic])=>
          `<div class="text-center p-3 bg-slate-50 rounded-xl">
            <div class="text-lg mb-0.5">${ic}</div>
            <div class="text-xl font-bold text-indigo-600">${n}</div>
            <div class="text-[10px] text-slate-400">${l}</div>
          </div>`
        ).join('')}
      </div>
    </div>

    <button onclick="saveProfileFull()" class="btn-primary w-full py-2.5">Save Profile</button>
  </div>`
}

function saveProfileFull() {
  const g = id => document.getElementById(id)?.value?.trim() || ''
  state.profile = {
    ...(state.profile || {}),
    name:          g('sp-name'),
    alias:         g('sp-alias'),
    field:         g('sp-field'),
    subfield:      g('sp-subfield'),
    institution:   g('sp-institution'),
    department:    g('sp-dept'),
    supervisor:    g('sp-supervisor'),
    cosupervisor:  g('sp-cosup'),
    phdStart:      g('sp-start'),
    phdEnd:        g('sp-end'),
    orcid:         g('sp-orcid'),
    researcherId:  g('sp-rid'),
    email:         g('sp-email'),
    website:       g('sp-web'),
  }
  save('profile')
  showToast('Profile saved ✓')
  updateSidebarProfile()
}

// ── App tab ───────────────────────────────────────────────────────────────────

function renderAppTab(body) {
  const topics  = (state.newsTopics || [])
  const discord = state.profile?.discordWebhook || ''
  const citStyle= state.profile?.defaultCitationStyle || 'APA'

  body.innerHTML = `
  <div class="p-6 max-w-2xl space-y-5">

    <!-- Research topics -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">📡 Literature Feed Topics</h3>
      <p class="text-xs text-slate-400 mb-3">Used by the Literature Feed to search arXiv and OpenAlex automatically.</p>
      <div id="app-topics" class="space-y-2 mb-3">
        ${topics.map((t,i) => `
        <div class="flex gap-2 items-center">
          <input type="text" value="${esc(t.label||'')}" placeholder="Topic label"
            class="input flex-1" id="topic-label-${i}"/>
          <input type="text" value="${esc(t.keywords||'')}" placeholder="Keywords (space-separated)"
            class="input flex-1" id="topic-kw-${i}"/>
          <button onclick="appRemoveTopic(${i})" class="text-slate-300 hover:text-rose-400 transition-colors text-sm flex-shrink-0">✕</button>
        </div>`).join('')}
      </div>
      <button onclick="appAddTopic()" class="btn-secondary text-xs py-1.5 px-3">+ Add Topic</button>
      <button onclick="appSaveTopics()" class="btn-primary text-xs py-1.5 px-3 ml-2">Save Topics</button>
    </div>

    <!-- Default citation style -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-3">📖 Default Citation Style</h3>
      <select id="app-cite-style" class="input" style="max-width:200px">
        ${['APA','Vancouver','Harvard','BibTeX'].map(s =>
          `<option value="${s}" ${citStyle===s?'selected':''}>${s}</option>`
        ).join('')}
      </select>
      <button onclick="appSaveCiteStyle()" class="btn-primary text-xs py-1.5 px-3 ml-3">Save</button>
    </div>

    <!-- Discord webhook -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">💬 Discord Feedback Webhook</h3>
      <p class="text-xs text-slate-400 mb-3">
        Create a webhook in your Discord server: Server Settings → Integrations → Webhooks → New Webhook → Copy URL.
      </p>
      <div class="flex gap-2">
        <input id="app-discord" type="url" value="${esc(discord)}"
          placeholder="https://discord.com/api/webhooks/..." class="input flex-1"/>
        <button onclick="appTestDiscord()" class="btn-secondary text-xs py-1.5 px-3 flex-shrink-0">Test</button>
        <button onclick="appSaveDiscord()" class="btn-primary text-xs py-1.5 px-3 flex-shrink-0">Save</button>
      </div>
      <div id="app-discord-status" class="mt-2"></div>
    </div>

    <!-- Change app password -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">🔑 Change App Password</h3>
      <p class="text-xs text-slate-400 mb-3">This is the password used to unlock the app at startup and after minimising to the system tray.</p>
      <div class="space-y-2 max-w-sm">
        <div>
          <label class="label">Current Password</label>
          <input id="app-pw-cur" type="password" placeholder="••••••••" class="input"/>
        </div>
        <div>
          <label class="label">New Password <span class="text-slate-400 font-normal">(min. 8 characters)</span></label>
          <input id="app-pw-new" type="password" placeholder="••••••••" class="input"/>
        </div>
        <div>
          <label class="label">Confirm New Password</label>
          <input id="app-pw-new2" type="password" placeholder="••••••••" class="input"
            onkeydown="if(event.key==='Enter')appChangePassword()"/>
        </div>
        <div id="app-pw-status" class="text-xs text-slate-400"></div>
        <button onclick="appChangePassword()" class="btn-primary text-xs py-1.5 px-4">Change Password</button>
      </div>
    </div>

    <!-- Privacy notice -->
    <div class="bg-slate-50 rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-2">🔒 Data & Privacy</h3>
      <p class="text-xs text-slate-500 mb-2">All data lives on your machine. No PhD Command Center server ever receives your data.</p>
      <div class="space-y-1 text-xs text-slate-500">
        ${[['arXiv','Paper discovery (open API)'],['OpenAlex','Paper & author metadata (open API)'],
           ['Semantic Scholar','Author search (open API)'],['CrossRef','Citation metadata (open API)'],
           ['Discord','Feedback you explicitly send'],['Your SMTP server','Vault OTP only']].map(([s,d])=>
          `<div>✅ <strong>${s}</strong> — ${d}</div>`
        ).join('')}
      </div>
    </div>
  </div>`
}

function appAddTopic() {
  const topics = state.newsTopics || []
  topics.push({ id: uid(), label: '', keywords: '' })
  state.newsTopics = topics
  renderAppTab(document.getElementById('settings-body'))
}

async function appRemoveTopic(i) {
  if (!await confirmDlg('Remove this topic?', 'Remove')) return
  ;(state.newsTopics || []).splice(i, 1)
  renderAppTab(document.getElementById('settings-body'))
}

function appSaveTopics() {
  const topics = (state.newsTopics || []).map((t, i) => ({
    ...t,
    label:    document.getElementById(`topic-label-${i}`)?.value.trim() || '',
    keywords: document.getElementById(`topic-kw-${i}`)?.value.trim() || '',
  })).filter(t => t.label || t.keywords)
  state.newsTopics = topics
  save('newsTopics')
  showToast('Topics saved ✓')
}

function appSaveCiteStyle() {
  state.profile = state.profile || {}
  state.profile.defaultCitationStyle = document.getElementById('app-cite-style')?.value || 'APA'
  save('profile')
  showToast('Citation style saved ✓')
}

async function appTestDiscord() {
  const url = document.getElementById('app-discord')?.value.trim()
  if (!url) { showToast('Enter a webhook URL first', 'error'); return }
  const el = document.getElementById('app-discord-status')
  el.innerHTML = `<span class="text-xs text-slate-400">Testing…</span>`
  const r = await api.testDiscordWebhook(url)
  el.innerHTML = r.success
    ? `<span class="text-xs text-emerald-600 font-semibold">✓ Connected — check your Discord channel</span>`
    : `<span class="text-xs text-rose-600">✕ Failed: ${esc(r.error || 'HTTP ' + r.status)}</span>`
}

function appSaveDiscord() {
  state.profile = state.profile || {}
  state.profile.discordWebhook = document.getElementById('app-discord')?.value.trim() || ''
  save('profile')
  showToast('Webhook saved ✓')
}

async function appChangePassword() {
  const cur  = document.getElementById('app-pw-cur')?.value
  const nw   = document.getElementById('app-pw-new')?.value
  const nw2  = document.getElementById('app-pw-new2')?.value
  const el   = document.getElementById('app-pw-status')
  if (!cur) { if (el) el.innerHTML = `<span class="text-rose-500">Enter your current password</span>`; return }
  if (!nw || nw.length < 8) { if (el) el.innerHTML = `<span class="text-rose-500">New password must be at least 8 characters</span>`; return }
  if (nw !== nw2) { if (el) el.innerHTML = `<span class="text-rose-500">Passwords don't match</span>`; return }
  if (el) el.innerHTML = `<span class="text-slate-400">Changing…</span>`
  const r = await api.authChangePw({ currentPassword: cur, newPassword: nw })
  if (r.success) {
    if (el) el.innerHTML = `<span class="text-emerald-600 font-semibold">✓ Password changed</span>`
    document.getElementById('app-pw-cur').value = ''
    document.getElementById('app-pw-new').value = ''
    document.getElementById('app-pw-new2').value = ''
    showToast('App password changed ✓')
  } else {
    if (el) el.innerHTML = `<span class="text-rose-500">✕ ${esc(r.error || 'Failed')}</span>`
  }
}

// ── Diagnostics tab ───────────────────────────────────────────────────────────

function renderDiagnosticsTab(body) {
  const APIS = [
    { id:'arxiv',    label:'arXiv',            desc:'Paper preprint search' },
    { id:'openalex', label:'OpenAlex',          desc:'Scholar graph & papers' },
    { id:'s2',       label:'Semantic Scholar',  desc:'Author search & papers' },
    { id:'crossref', label:'CrossRef',          desc:'Citation metadata & DOI' },
  ]
  body.innerHTML = `
  <div class="p-6 max-w-2xl space-y-4">
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">🩺 API Connections</h3>
      <p class="text-xs text-slate-400 mb-4">Test each external service. Click Test to ping it and measure latency.</p>
      <div class="space-y-3">
        ${APIS.map(a => `
        <div class="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
          <div class="flex-1">
            <div class="text-sm font-semibold text-slate-800">${a.label}</div>
            <div class="text-xs text-slate-400">${a.desc}</div>
          </div>
          <div id="diag-status-${a.id}" class="text-xs text-slate-400 w-32 text-right">—</div>
          <button onclick="diagTest('${a.id}')"
            class="btn-secondary text-xs py-1.5 px-3 flex-shrink-0">Test</button>
        </div>`).join('')}
      </div>
      <button onclick="diagTestAll()" class="btn-primary text-xs py-2 px-4 mt-4">Test All</button>
    </div>

    <!-- SMTP test -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">📧 SMTP (Vault Email OTP)</h3>
      <p class="text-xs text-slate-400 mb-3">
        For Gmail: use your Gmail address as user, and an
        <button onclick="api.openExternal('https://myaccount.google.com/apppasswords')" class="text-indigo-500 hover:underline">App Password</button>
        as the password (requires 2FA on your Google account).
      </p>
      <div class="space-y-2 mb-3">
        <div class="grid grid-cols-3 gap-2">
          <div class="col-span-2"><label class="label">SMTP Host</label>
            <input id="diag-smtp-host" type="text" placeholder="smtp.gmail.com" class="input"/></div>
          <div><label class="label">Port</label>
            <input id="diag-smtp-port" type="number" value="587" class="input"/></div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div><label class="label">Username</label>
            <input id="diag-smtp-user" type="email" placeholder="you@gmail.com" class="input"/></div>
          <div><label class="label">App Password</label>
            <input id="diag-smtp-pass" type="password" placeholder="xxxx xxxx xxxx xxxx" class="input"/></div>
        </div>
      </div>
      <div class="flex gap-2 items-center">
        <button onclick="diagTestSmtp()" class="btn-secondary text-xs py-1.5 px-3">Test Connection</button>
        <div id="diag-smtp-status" class="text-xs text-slate-400"></div>
      </div>
    </div>

    <!-- App info -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-3">ℹ️ App Info</h3>
      <div class="text-xs text-slate-500 space-y-1">
        <div><span class="text-slate-400 w-32 inline-block">Version</span> <span id="app-ver">…</span></div>
        <div><span class="text-slate-400 w-32 inline-block">Data folder</span>
          <button onclick="api.openDataFolder()" class="text-indigo-500 hover:underline">Open in Explorer →</button>
        </div>
        <div><span class="text-slate-400 w-32 inline-block">Platform</span> Windows</div>
      </div>
    </div>
  </div>`
  api.getAppVersion().then(v => { const el = document.getElementById('app-ver'); if(el) el.textContent = v })
}

async function diagTest(id) {
  const el = document.getElementById(`diag-status-${id}`)
  if (el) el.innerHTML = `<span class="text-slate-400">Testing…</span>`
  const r = await api.testApi(id)
  if (!el) return
  if (r.success && r.ok) {
    el.innerHTML = `<span class="text-emerald-600 font-semibold">✓ ${r.latencyMs}ms</span>`
  } else {
    el.innerHTML = `<span class="text-rose-500">✕ ${esc(r.error || 'HTTP ' + r.status)}</span>`
  }
}

function diagTestAll() {
  ['arxiv','openalex','s2','crossref'].forEach(id => diagTest(id))
}

async function diagTestSmtp() {
  const el   = document.getElementById('diag-smtp-status')
  const opts = {
    smtpHost: document.getElementById('diag-smtp-host')?.value.trim(),
    smtpPort: document.getElementById('diag-smtp-port')?.value,
    smtpUser: document.getElementById('diag-smtp-user')?.value.trim(),
    smtpPass: document.getElementById('diag-smtp-pass')?.value,
  }
  if (!opts.smtpHost || !opts.smtpUser || !opts.smtpPass) {
    showToast('Fill in all SMTP fields', 'error'); return
  }
  if (el) el.innerHTML = `<span class="text-slate-400">Connecting…</span>`
  const r = await api.testSmtp(opts)
  if (el) el.innerHTML = r.success
    ? `<span class="text-emerald-600 font-semibold">✓ SMTP connected</span>`
    : `<span class="text-rose-500">✕ ${esc(r.error)}</span>`
}

// ── Backup tab ────────────────────────────────────────────────────────────────

const _DATA_KEYS = ['profile','projects','papers','contacts','notes','whiteboards',
                    'events','todos','grants','newsFeeds','newsTopics','newsRead',
                    'calGoals','calFeeds','todoGroups']

function renderBackupTab(body) {
  body.innerHTML = `
  <div class="p-6 max-w-2xl space-y-5">

    <!-- Full export -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">📤 Export Backup</h3>
      <p class="text-xs text-slate-400 mb-4">Save all your data as a JSON file. Store it on an external drive, USB key, or cloud storage.</p>
      <div class="space-y-3">
        <div>
          <div class="text-xs font-semibold text-slate-600 mb-2">Choose what to include:</div>
          <div class="flex flex-wrap gap-2">
            ${_DATA_KEYS.map(k => `
            <label class="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
              <input type="checkbox" class="exp-key-cb accent-indigo-600" value="${k}" checked/>
              ${k}
            </label>`).join('')}
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="backupExport()" class="btn-primary text-xs py-2 px-4">Export Selected</button>
          <button onclick="backupExportAll()" class="btn-secondary text-xs py-2 px-4">Export All</button>
          <button onclick="api.openDataFolder()" class="btn-secondary text-xs py-2 px-4">📁 Open Data Folder</button>
        </div>
        <div id="backup-export-status" class="text-xs text-slate-400"></div>
      </div>
    </div>

    <!-- Import / restore -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">📥 Restore from Backup</h3>
      <p class="text-xs text-slate-400 mb-4">
        Load a JSON backup file. Choose how to handle conflicts with your existing data.
      </p>
      <div class="space-y-3">
        <div>
          <label class="label">Merge strategy</label>
          <div class="flex gap-4 mt-1">
            <label class="flex items-center gap-2 text-xs cursor-pointer select-none">
              <input type="radio" name="merge-strat" value="merge" checked class="accent-indigo-600"/>
              <div>
                <div class="font-semibold text-slate-700">Merge (keep newest)</div>
                <div class="text-slate-400">Combines data; newer updatedAt wins conflicts</div>
              </div>
            </label>
            <label class="flex items-center gap-2 text-xs cursor-pointer select-none">
              <input type="radio" name="merge-strat" value="replace" class="accent-indigo-600"/>
              <div>
                <div class="font-semibold text-slate-700">Replace</div>
                <div class="text-rose-500 font-semibold">⚠ Overwrites existing data</div>
              </div>
            </label>
          </div>
        </div>
        <div id="import-key-select" class="hidden">
          <div class="text-xs font-semibold text-slate-600 mb-2">Restore only selected tools:</div>
          <div id="import-key-list" class="flex flex-wrap gap-2"></div>
        </div>
        <div class="flex gap-2">
          <button onclick="backupImport()" class="btn-primary text-xs py-2 px-4">Choose File & Restore</button>
          <label class="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
            <input type="checkbox" id="import-per-tool" class="accent-indigo-600"
              onchange="document.getElementById('import-key-select').classList.toggle('hidden',!this.checked)"/>
            Per-tool selection
          </label>
        </div>
        <div id="backup-import-status" class="text-xs text-slate-400"></div>
      </div>
    </div>

    <!-- Danger zone -->
    <div class="bg-rose-50 rounded-2xl border border-rose-200 p-5">
      <h3 class="text-sm font-bold text-rose-700 mb-2">⚠️ Danger Zone</h3>
      <p class="text-xs text-rose-600 mb-3">These actions cannot be undone. Export a backup first.</p>
      <button onclick="backupClearAll()" class="btn-danger text-xs py-2 px-4">Erase All App Data</button>
    </div>
  </div>`
}

async function backupExport(keys) {
  const checkedKeys = keys || [...document.querySelectorAll('.exp-key-cb:checked')].map(cb => cb.value)
  if (!checkedKeys.length) { showToast('Select at least one key','error'); return }
  const dest = await api.openSaveDialog({
    defaultPath: `phd-backup-${new Date().toISOString().slice(0,10)}.json`,
    filters: [{ name:'JSON Backup', extensions:['json'] }]
  })
  if (!dest) return
  const el = document.getElementById('backup-export-status')
  if (el) el.innerHTML = `<span class="text-slate-400">Saving…</span>`
  const r = await api.exportData({ keys: checkedKeys, dest })
  if (el) el.innerHTML = r.success
    ? `<span class="text-emerald-600 font-semibold">✓ Saved ${r.keyCount} data sets to ${dest.split('\\').pop()}</span>`
    : `<span class="text-rose-500">✕ ${esc(r.error)}</span>`
}

async function backupExportAll() {
  await backupExport(_DATA_KEYS)
}

async function backupImport() {
  const src = await api.openImportDialog()
  if (!src) return
  const strategy = document.querySelector('input[name="merge-strat"]:checked')?.value || 'merge'
  const perTool  = document.getElementById('import-per-tool')?.checked

  let selectedKeys = null
  if (perTool) {
    const checks = document.querySelectorAll('.imp-key-cb:checked')
    selectedKeys = [...checks].map(c => c.value)
    if (!selectedKeys.length) { showToast('Select at least one tool','error'); return }
  }

  if (strategy === 'replace') {
    if (!await confirmDlg('⚠️ This will REPLACE your existing data with the backup file.\n\nAny data not in the backup will be lost.', 'Replace & Import')) return
  }

  const el = document.getElementById('backup-import-status')
  if (el) el.innerHTML = `<span class="text-slate-400">Importing…</span>`
  const r = await api.importData({ src, strategy, selectedKeys })
  if (r.success) {
    if (el) el.innerHTML = `<span class="text-emerald-600 font-semibold">✓ Restored ${r.mergedKeys} data sets — reload to see changes</span>`
    // Reload state from disk
    const keys2 = _DATA_KEYS
    await Promise.all(keys2.map(async k => {
      const v = await api.storeGet(k)
      if (v !== null) state[k] = v
    }))
    showToast('Restore complete ✓')
  } else {
    if (el) el.innerHTML = `<span class="text-rose-500">✕ ${esc(r.error)}</span>`
  }
}

async function backupClearAll() {
  if (!await confirmTypeDlg('⚠️ ERASE ALL APP DATA?\n\nThis permanently deletes all projects, papers, notes, contacts, events, todos, and grants. This cannot be undone.')) return
  _DATA_KEYS.forEach(k => api.storeSet(k, Array.isArray(state[k]) ? [] : null))
  showToast('All data erased — restart the app')
}

// ── Vault tab ─────────────────────────────────────────────────────────────────

const _VAULT_CATS = ['research','email','university','journal','database','vpn','cloud','other']

function renderVaultTab(body) {
  if (!_vaultState.initialized) { renderVaultSetup(body); return }
  if (!_vaultState.unlocked)    { renderVaultLock(body); return }
  renderVaultOpen(body)
}

// ── Vault: Setup wizard ────────────────────────────────────────────────────────

function renderVaultSetup(body) {
  body.innerHTML = `
  <div class="p-6 max-w-lg">
    <div class="bg-white rounded-2xl border border-slate-200 p-6">
      <div class="text-center mb-6">
        <div class="text-4xl mb-3">🔐</div>
        <h3 class="text-base font-bold text-slate-900">Set Up Your Secure Vault</h3>
        <p class="text-xs text-slate-400 mt-1">
          Three-factor authentication: master password · authenticator app · email OTP.<br/>
          All encrypted with AES-256-GCM. Nothing leaves this device.
        </p>
      </div>
      <div class="space-y-3">
        <div>
          <label class="label">Master password <span class="text-rose-500">*</span></label>
          <input id="vs-pw1" type="password" placeholder="Choose a strong master password" class="input"/>
        </div>
        <div>
          <label class="label">Confirm master password</label>
          <input id="vs-pw2" type="password" placeholder="Repeat password" class="input"/>
        </div>
        <div class="border-t border-slate-100 pt-3">
          <div class="text-xs font-bold text-slate-600 mb-2">📧 Email (for OTP delivery)</div>
          <div class="grid grid-cols-3 gap-2 mb-2">
            <div class="col-span-2"><label class="label">SMTP Host</label>
              <input id="vs-smtp-host" type="text" value="smtp.gmail.com" class="input"/></div>
            <div><label class="label">Port</label>
              <input id="vs-smtp-port" type="number" value="587" class="input"/></div>
          </div>
          <div class="grid grid-cols-2 gap-2 mb-2">
            <div><label class="label">Email address</label>
              <input id="vs-smtp-user" type="email" placeholder="you@gmail.com" class="input"/></div>
            <div><label class="label">App password</label>
              <input id="vs-smtp-pass" type="password" placeholder="xxxx xxxx xxxx xxxx" class="input"/></div>
          </div>
          <div><label class="label">Send OTP to this address</label>
            <input id="vs-smtp-to" type="email" placeholder="your email for OTP codes" class="input"/></div>
        </div>
        <div id="vs-status" class="text-xs text-slate-400"></div>
        <button onclick="vaultDoSetup()" class="btn-primary w-full py-2.5">Initialize Vault</button>
      </div>
    </div>
  </div>`
}

async function vaultDoSetup() {
  const pw1  = document.getElementById('vs-pw1')?.value  || ''
  const pw2  = document.getElementById('vs-pw2')?.value  || ''
  const host = document.getElementById('vs-smtp-host')?.value.trim()
  const port = document.getElementById('vs-smtp-port')?.value
  const user = document.getElementById('vs-smtp-user')?.value.trim()
  const pass = document.getElementById('vs-smtp-pass')?.value
  const to   = document.getElementById('vs-smtp-to')?.value.trim()
  const el   = document.getElementById('vs-status')

  if (!pw1) { showToast('Enter a master password','error'); return }
  if (pw1 !== pw2) { showToast('Passwords do not match','error'); return }
  if (pw1.length < 12) { showToast('Master password must be at least 12 characters','error'); return }
  if (!host || !user || !pass || !to) { showToast('Fill in all SMTP fields','error'); return }

  if (el) el.innerHTML = `<span class="text-slate-400">⏳ Initializing (key derivation takes a moment)…</span>`
  const r = await api.vaultSetup({ password:pw1, smtpHost:host, smtpPort:port, smtpUser:user, smtpPass:pass, smtpTo:to })
  if (!r.success) { if(el) el.innerHTML=`<span class="text-rose-500">✕ ${esc(r.error)}</span>`; return }

  // Show TOTP secret
  const body = document.getElementById('settings-body')
  body.innerHTML = `
  <div class="p-6 max-w-lg">
    <div class="bg-white rounded-2xl border border-emerald-200 p-6">
      <div class="text-center mb-5">
        <div class="text-4xl mb-2">📱</div>
        <h3 class="text-base font-bold text-slate-900">Add to Your Authenticator App</h3>
        <p class="text-xs text-slate-400 mt-1">Open Google Authenticator, Aegis, or Authy and add a new entry manually.</p>
      </div>
      <div class="bg-slate-900 rounded-xl p-4 mb-4 text-center">
        <div class="text-xs text-slate-400 mb-1">Secret key (type this into your authenticator):</div>
        <div class="text-emerald-400 font-mono text-lg font-bold tracking-widest break-all">${r.totpSecret}</div>
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-xs text-amber-700">
        ⚠️ <strong>Save this secret now.</strong> It will never be shown again. Write it down and store it safely offline.
      </div>
      <p class="text-xs text-slate-500 mb-4">Account name in your app: <strong>PhD Command Center</strong></p>
      <button onclick="vaultSetupDone()" class="btn-primary w-full py-2.5">I've saved the secret → Continue</button>
    </div>
  </div>`
}

async function vaultSetupDone() {
  _vaultState = await api.vaultStatus()
  renderVaultTab(document.getElementById('settings-body'))
}

// ── Vault: Lock screen (3FA unlock) ───────────────────────────────────────────

function renderVaultLock(body) {
  const step = _vaultState.totpVerified ? 3 : _vaultState.pwVerified ? 2 : 1
  body.innerHTML = `
  <div class="p-6 max-w-md">
    <div class="bg-white rounded-2xl border border-slate-200 p-6">
      <div class="text-center mb-5">
        <div class="text-4xl mb-2">🔐</div>
        <h3 class="text-base font-bold text-slate-900">Unlock Vault</h3>
        <p class="text-xs text-slate-400 mt-1">Three-factor authentication required</p>
      </div>

      <!-- Step indicators -->
      <div class="flex items-center gap-2 mb-6">
        ${[1,2,3].map(s => `
        <div class="flex-1 text-center">
          <div class="w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold mb-1
            ${s < step ? 'bg-emerald-500 text-white' : s === step ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}">
            ${s < step ? '✓' : s}
          </div>
          <div class="text-[10px] ${s === step ? 'text-indigo-600 font-semibold' : 'text-slate-400'}">
            ${s===1?'Password':s===2?'Authenticator':'Email OTP'}
          </div>
        </div>
        ${s < 3 ? '<div class="h-px flex-1 bg-slate-200 mt-4"></div>' : ''}`).join('')}
      </div>

      <div id="vault-lock-body"></div>
    </div>
  </div>`
  renderVaultLockStep(step)
}

function renderVaultLockStep(step) {
  const el = document.getElementById('vault-lock-body')
  if (!el) return
  if (step === 1) {
    el.innerHTML = `
    <div class="space-y-3">
      <div><label class="label">Master password</label>
        <input id="vl-pw" type="password" placeholder="Enter your master password" class="input"
          onkeydown="if(event.key==='Enter')vaultUnlockStep1()"/></div>
      <div id="vl-status" class="text-xs text-slate-400"></div>
      <button onclick="vaultUnlockStep1()" class="btn-primary w-full py-2.5">Continue →</button>
    </div>`
    setTimeout(() => document.getElementById('vl-pw')?.focus(), 50)
  } else if (step === 2) {
    el.innerHTML = `
    <div class="space-y-3">
      <div><label class="label">6-digit authenticator code</label>
        <input id="vl-totp" type="text" inputmode="numeric" maxlength="6" placeholder="000000" class="input text-center text-xl tracking-widest font-mono"
          onkeydown="if(event.key==='Enter')vaultUnlockStep2()"/></div>
      <div id="vl-status" class="text-xs text-slate-400"></div>
      <button onclick="vaultUnlockStep2()" class="btn-primary w-full py-2.5">Verify →</button>
    </div>`
    setTimeout(() => document.getElementById('vl-totp')?.focus(), 50)
  } else {
    el.innerHTML = `
    <div class="space-y-3">
      <p class="text-xs text-slate-500">A 6-digit code will be emailed to you.</p>
      <button onclick="vaultSendOtp()" id="vl-send-btn" class="btn-secondary w-full py-2">Send Email Code</button>
      <div>
        <label class="label">Email OTP code</label>
        <input id="vl-otp" type="text" inputmode="numeric" maxlength="6" placeholder="000000" class="input text-center text-xl tracking-widest font-mono"
          onkeydown="if(event.key==='Enter')vaultUnlockStep3()"/>
      </div>
      <div id="vl-status" class="text-xs text-slate-400"></div>
      <button onclick="vaultUnlockStep3()" class="btn-primary w-full py-2.5">Unlock Vault →</button>
    </div>`
  }
}

async function vaultUnlockStep1() {
  const pw = document.getElementById('vl-pw')?.value || ''
  const el = document.getElementById('vl-status')
  if (!pw) return
  if (el) el.innerHTML = `<span class="text-slate-400">Verifying…</span>`
  const r = await api.vaultStep1(pw)
  if (!r.success) { if(el) el.innerHTML=`<span class="text-rose-500">✕ ${esc(r.error)}</span>`; return }
  _vaultState.pwVerified = true
  renderVaultLockStep(2)
}

async function vaultUnlockStep2() {
  const token = document.getElementById('vl-totp')?.value?.trim() || ''
  const el    = document.getElementById('vl-status')
  if (token.length !== 6) { if(el) el.innerHTML=`<span class="text-rose-500">Enter 6 digits</span>`; return }
  if (el) el.innerHTML = `<span class="text-slate-400">Verifying…</span>`
  const r = await api.vaultStep2(token)
  if (!r.success) { if(el) el.innerHTML=`<span class="text-rose-500">✕ ${esc(r.error)}</span>`; return }
  _vaultState.totpVerified = true
  renderVaultLockStep(3)
}

async function vaultSendOtp() {
  const btn = document.getElementById('vl-send-btn')
  const el  = document.getElementById('vl-status')
  if (btn) btn.disabled = true
  if (el) el.innerHTML = `<span class="text-slate-400">Sending…</span>`
  const r = await api.vaultStep3Send()
  if (btn) btn.disabled = false
  if (!r.success) { if(el) el.innerHTML=`<span class="text-rose-500">✕ ${esc(r.error)}</span>`; return }
  if (el) el.innerHTML = `<span class="text-emerald-600">✓ Code sent to ${esc(r.sentTo)}</span>`
  setTimeout(() => document.getElementById('vl-otp')?.focus(), 100)
}

async function vaultUnlockStep3() {
  const token = document.getElementById('vl-otp')?.value?.trim() || ''
  const el    = document.getElementById('vl-status')
  if (token.length !== 6) { if(el) el.innerHTML=`<span class="text-rose-500">Enter 6 digits</span>`; return }
  if (el) el.innerHTML = `<span class="text-slate-400">Verifying…</span>`
  const r = await api.vaultStep3Verify(token)
  if (!r.success) { if(el) el.innerHTML=`<span class="text-rose-500">✕ ${esc(r.error)}</span>`; return }
  _vaultState.unlocked = true
  const entries = await api.vaultGetEntries()
  _vaultEntries = entries.success ? entries.entries : []
  renderVaultOpen(document.getElementById('settings-body'))
}

// ── Vault: Open (unlocked) ────────────────────────────────────────────────────

function renderVaultOpen(body) {
  const cats  = ['all', ..._VAULT_CATS]
  const gc    = { research:'bg-violet-100 text-violet-700', email:'bg-sky-100 text-sky-700',
    university:'bg-indigo-100 text-indigo-700', journal:'bg-emerald-100 text-emerald-700',
    database:'bg-teal-100 text-teal-700', vpn:'bg-orange-100 text-orange-700',
    cloud:'bg-amber-100 text-amber-700', other:'bg-slate-100 text-slate-500' }
  let filter  = 'all', search = ''

  const render = () => {
    const el = document.getElementById('vault-list')
    if (!el) return
    let entries = _vaultEntries
    if (filter !== 'all') entries = entries.filter(e => e.category === filter)
    if (search)  entries = entries.filter(e => e.title?.toLowerCase().includes(search.toLowerCase()) || e.username?.toLowerCase().includes(search.toLowerCase()))
    if (!entries.length) { el.innerHTML=`<div class="text-center py-12 text-slate-400 text-sm">No entries${search||filter!=='all'?' match your filter':' yet'}.</div>`; return }
    el.innerHTML = entries.map(e => {
      const catCls = gc[e.category] || gc.other
      return `<div class="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-shadow cursor-pointer" onclick="vaultOpenEntry('${e.id}')">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-slate-800 truncate">${esc(e.title||'Untitled')}</div>
          <div class="text-xs text-slate-400 truncate">${esc(e.username||'')}</div>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${catCls}">${e.category||'other'}</span>
        <button onclick="event.stopPropagation();vaultCopyPassword('${e.id}')" title="Copy password"
          class="text-slate-300 hover:text-indigo-500 transition-colors text-sm flex-shrink-0">📋</button>
      </div>`
    }).join('')
  }

  body.innerHTML = `
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-emerald-600">🔓 Vault Unlocked</span>
        <span class="text-[10px] text-slate-400">auto-locks after 15 min</span>
      </div>
      <div class="flex gap-2">
        <button onclick="vaultOpenEntry(null)" class="btn-primary text-xs py-1.5 px-3">+ New Entry</button>
        <button onclick="vaultDoLock()" class="btn-secondary text-xs py-1.5 px-3">🔒 Lock</button>
      </div>
    </div>
    <!-- Search + filter -->
    <div class="flex gap-2 mb-4">
      <input type="text" placeholder="Search…" oninput="vaultSearch(this.value)"
        class="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
      <select onchange="vaultFilter(this.value)" class="input text-xs py-1.5" style="width:auto">
        ${cats.map(c=>`<option value="${c}">${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('')}
      </select>
    </div>
    <div id="vault-list" class="space-y-1.5"></div>
  </div>`

  window._vaultFilter = v => { filter = v; render() }
  window._vaultSearch = s => { search = s; render() }
  render()
}

window.vaultFilter = v => window._vaultFilter?.(v)
window.vaultSearch = s => window._vaultSearch?.(s)

function vaultOpenEntry(id) {
  const e = id ? _vaultEntries.find(x => x.id === id) : null
  const gc = { research:'bg-violet-100 text-violet-700', email:'bg-sky-100 text-sky-700',
    university:'bg-indigo-100 text-indigo-700', journal:'bg-emerald-100 text-emerald-700',
    database:'bg-teal-100 text-teal-700', vpn:'bg-orange-100 text-orange-700',
    cloud:'bg-amber-100 text-amber-700', other:'bg-slate-100 text-slate-500' }

  openModal(`
  <h3 class="text-base font-bold mb-4">${e ? 'Edit Entry' : '🔐 New Vault Entry'}</h3>
  <div class="space-y-3">
    <div><label class="label">Title *</label>
      <input id="ve-title" type="text" value="${esc(e?.title)}" placeholder="e.g. University VPN" class="input"/></div>
    <div><label class="label">Username / Email</label>
      <input id="ve-user" type="text" value="${esc(e?.username)}" placeholder="username or email" class="input"/></div>
    <div>
      <label class="label">Password</label>
      <div class="relative">
        <input id="ve-pass" type="password" value="${esc(e?.password)}" placeholder="password" class="input pr-10"/>
        <button type="button" onclick="const i=document.getElementById('ve-pass');i.type=i.type==='password'?'text':'password'"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">👁</button>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div><label class="label">URL</label>
        <input id="ve-url" type="url" value="${esc(e?.url)}" placeholder="https://…" class="input"/></div>
      <div><label class="label">Category</label>
        <select id="ve-cat" class="input">
          ${_VAULT_CATS.map(c=>`<option value="${c}" ${e?.category===c?'selected':''}>${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('')}
        </select></div>
    </div>
    <div><label class="label">Notes</label>
      <textarea id="ve-notes" rows="2" class="input resize-none" placeholder="Additional notes…">${esc(e?.notes)}</textarea></div>
    <div class="flex gap-3 pt-2">
      ${e ? `<button onclick="vaultDeleteEntry('${e.id}')" class="btn-danger">Delete</button>` : ''}
      <button onclick="closeModal()" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="vaultSaveEntry('${e?.id||''}')" class="flex-1 btn-primary">Save</button>
    </div>
  </div>`)
}

async function vaultSaveEntry(id) {
  const title = document.getElementById('ve-title')?.value.trim()
  if (!title) { showToast('Title required','error'); return }
  const entry = {
    id:       id || undefined,
    title,
    username: document.getElementById('ve-user')?.value.trim()  || '',
    password: document.getElementById('ve-pass')?.value         || '',
    url:      document.getElementById('ve-url')?.value.trim()   || '',
    category: document.getElementById('ve-cat')?.value          || 'other',
    notes:    document.getElementById('ve-notes')?.value.trim() || '',
    createdAt: id ? (_vaultEntries.find(e=>e.id===id)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  const r = await api.vaultSaveEntry(entry)
  if (!r.success) { showToast(r.error, 'error'); return }
  entry.id = r.id
  const idx = _vaultEntries.findIndex(e => e.id === id)
  if (idx > -1) _vaultEntries[idx] = entry; else _vaultEntries.push(entry)
  closeModal()
  renderVaultOpen(document.getElementById('settings-body'))
  showToast(id ? 'Entry updated ✓' : 'Entry saved ✓')
}

async function vaultDeleteEntry(id) {
  if (!await confirmDlg('Delete this vault entry?', 'Delete Entry')) return
  const r = await api.vaultDeleteEntry(id)
  if (!r.success) { showToast(r.error,'error'); return }
  _vaultEntries = _vaultEntries.filter(e => e.id !== id)
  closeModal()
  renderVaultOpen(document.getElementById('settings-body'))
  showToast('Entry deleted')
}

async function vaultCopyPassword(id) {
  const entry = _vaultEntries.find(e => e.id === id)
  if (!entry?.password) { showToast('No password to copy','error'); return }
  await navigator.clipboard.writeText(entry.password)
  showToast('Password copied — clears in 30s ⏱')
  setTimeout(async () => {
    try { const c = await navigator.clipboard.readText(); if (c === entry.password) await navigator.clipboard.writeText('') }
    catch {}
  }, 30000)
}

async function vaultDoLock() {
  await api.vaultLock()
  _vaultState.unlocked = false
  _vaultState.pwVerified = false
  _vaultState.totpVerified = false
  _vaultEntries = []
  renderVaultTab(document.getElementById('settings-body'))
}
