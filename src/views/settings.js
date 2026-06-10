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
    ${[['profile','👤 Profile'],['app','🔧 App'],['personalize','🎨 Personalize'],['diagnostics','🩺 Diagnostics'],['backup','💾 Backup'],['share','🤝 Share & Sync'],['vault','🔐 Vault']].map(([v,l]) =>
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
  ;['profile','app','personalize','diagnostics','backup','share','vault'].forEach(t => {
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
  else if (tab === 'personalize') renderPersonalizeTab(body)
  else if (tab === 'diagnostics') renderDiagnosticsTab(body)
  else if (tab === 'backup')      renderBackupTab(body)
  else if (tab === 'share')       renderShareTab(body)
  else                            renderVaultTab(body)
}

// ── Profile tab ───────────────────────────────────────────────────────────────

function renderProfileTab(body) {
  const p = state.profile || {}
  body.innerHTML = `
  <div class="p-3 lg:p-6 max-w-2xl space-y-5">

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

// ── Personalize tab ───────────────────────────────────────────────────────────

async function renderPersonalizeTab(body) {
  const currentAccent  = (await api.storeGet('accentColor')) || 'indigo'
  const currentFont    = (await api.storeGet('fontFamily'))  || 'system'
  const currentPaper   = (await api.storeGet('paperMode'))   || 'off'
  const currentDensity = (await api.storeGet('uiDensity'))   || 'comfortable'
  const currentArea    = state.researchArea || (await api.storeGet('researchArea')) || null
  const currentPacks   = state.enabledPacks || (await api.storeGet('enabledPacks')) || []
  const widgets       = state.profile?.dashboardWidgets || {}

  const ACCENTS = [
    { id:'indigo',  label:'Indigo',  hex:'#4f46e5' },
    { id:'violet',  label:'Violet',  hex:'#7c3aed' },
    { id:'teal',    label:'Teal',    hex:'#0d9488' },
    { id:'rose',    label:'Rose',    hex:'#e11d48' },
    { id:'amber',   label:'Amber',   hex:'#d97706' },
    { id:'emerald', label:'Emerald', hex:'#059669' },
  ]

  const FONTS = [
    { id:'system',  label:'System',   sub:'Segoe UI · Default',       style:"font-family:'Segoe UI',system-ui,sans-serif" },
    { id:'serif',   label:'Serif',    sub:'Georgia · Academic',        style:"font-family:Georgia,serif" },
    { id:'mono',    label:'Monospace',sub:'Cascadia Code · Technical', style:"font-family:'Cascadia Code',Consolas,monospace" },
    { id:'rounded', label:'Rounded',  sub:'Trebuchet MS · Friendly',   style:"font-family:'Trebuchet MS',Verdana,sans-serif" },
  ]

  const WIDGET_LIST = [
    { id:'events',   label:'📅 Upcoming Events',    desc:'Calendar events in the next 14 days' },
    { id:'projects', label:'📋 Active Projects',    desc:'Projects with active or planning status' },
    { id:'tasks',    label:'✅ Task Widget',         desc:'Today\'s focus tasks and overdue items' },
    { id:'grants',   label:'✍️ Grant Pipeline',     desc:'Open grant applications and deadlines' },
    { id:'papers',   label:'📚 Recent Papers',      desc:'Papers most recently added to your library' },
  ]

  body.innerHTML = `
  <div class="p-3 lg:p-6 max-w-2xl space-y-5">

    <!-- Accent colour -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">🎨 Accent Colour</h3>
      <p class="text-xs text-slate-400 mb-4">Sets the primary colour used for buttons, links, and highlights throughout the app.</p>
      <div class="flex gap-3 flex-wrap items-start" id="accent-swatches">
        ${ACCENTS.map(a => `
        <button onclick="personSetAccent('${a.id}')" id="accent-swatch-${a.id}"
          title="${a.label}"
          class="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${a.id === currentAccent ? 'border-slate-700 shadow-md scale-105' : 'border-transparent hover:border-slate-300'}">
          <div class="w-9 h-9 rounded-full shadow-sm" style="background:${a.hex}"></div>
          <span class="text-[10px] font-semibold text-slate-600">${a.label}</span>
        </button>`).join('')}
        <!-- Custom colour picker -->
        <label title="Custom colour" id="accent-swatch-custom"
          class="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${currentAccent[0]==='#' ? 'border-slate-700 shadow-md scale-105' : 'border-transparent hover:border-slate-300'}">
          <div class="w-9 h-9 rounded-full shadow-sm relative overflow-hidden" style="background:${currentAccent[0]==='#' ? currentAccent : 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)'}">
            <input type="color" value="${currentAccent[0]==='#' ? currentAccent : '#4f46e5'}"
              oninput="personSetAccent(this.value)"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
          </div>
          <span class="text-[10px] font-semibold text-slate-600">Custom</span>
        </label>
      </div>
    </div>

    <!-- Font family -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">🔤 Font Family</h3>
      <p class="text-xs text-slate-400 mb-4">Changes the typeface used across the app. All fonts are built into Windows.</p>
      <div class="grid grid-cols-2 gap-3" id="font-cards">
        ${FONTS.map(f => `
        <button onclick="personSetFont('${f.id}')" id="font-card-${f.id}"
          class="text-left p-3.5 rounded-xl border-2 transition-all ${f.id === currentFont ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}">
          <div class="text-base font-semibold text-slate-800 mb-0.5" style="${f.style}">Aa 123</div>
          <div class="text-xs font-bold text-slate-700" style="${f.style}">${f.label}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">${f.sub}</div>
        </button>`).join('')}
      </div>
    </div>

    <!-- Paper View Mode -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">📄 Page Style</h3>
      <p class="text-xs text-slate-400 mb-4">Makes the app look like physical paper. Applies to all content views — notes, tasks, library, and more.</p>
      <div class="grid grid-cols-3 gap-3">
        ${[
          { id:'off',     label:'Digital',  sub:'Default',         bg:'#f8fafc', card:'#ffffff', line:false,  preview:'clean digital' },
          { id:'paper',   label:'Paper',    sub:'Warm cream',      bg:'#f0ebe0', card:'#fdfaf3', line:false,  preview:'warm paper feel' },
          { id:'ruled',   label:'Ruled',    sub:'Lined notebook',  bg:'#f0ebe0', card:'#fdfaf3', line:true,   preview:'lined notebook' },
          { id:'vintage', label:'Vintage',  sub:'Aged parchment',  bg:'#e8d8b4', card:'#f9edd8', line:false,  preview:'aged parchment' },
        ].map(p => `
        <button onclick="personSetPaper('${p.id}')" id="paper-btn-${p.id}"
          class="flex flex-col gap-2 p-3 rounded-xl border-2 text-left transition-all ${p.id === currentPaper ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'}">
          <!-- Mini preview -->
          <div class="w-full h-14 rounded-lg overflow-hidden flex-shrink-0 relative" style="background:${p.bg}">
            <div class="absolute inset-2 rounded-md" style="background:${p.card};box-shadow:0 1px 4px rgba(0,0,0,.1)">
              ${p.line ? `
              <div style="height:100%;background:repeating-linear-gradient(transparent,transparent 8px,#b8c8d8 8px,#b8c8d8 9px);opacity:.8;border-radius:4px"></div>
              ` : `
              <div class="p-1.5 space-y-1">
                <div class="h-1.5 rounded-full w-3/4" style="background:${p.bg}"></div>
                <div class="h-1.5 rounded-full w-full" style="background:${p.bg}"></div>
                <div class="h-1.5 rounded-full w-5/6" style="background:${p.bg}"></div>
              </div>`}
            </div>
          </div>
          <div>
            <div class="text-xs font-bold text-slate-800">${p.label}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">${p.sub}</div>
          </div>
        </button>`).join('')}
      </div>
    </div>

    <!-- Interface Density -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">📐 Interface Density</h3>
      <p class="text-xs text-slate-400 mb-4">Adjust spacing and padding across the app — fit more on screen or give content room to breathe.</p>
      <div class="grid grid-cols-3 gap-3">
        ${[
          { id:'compact',    label:'Compact',    sub:'Fit more on screen', rows:5, h:3 },
          { id:'comfortable',label:'Comfortable',sub:'Default',            rows:3, h:4 },
          { id:'spacious',   label:'Spacious',   sub:'Roomier layout',     rows:2, h:6 },
        ].map(d => `
        <button onclick="personSetDensity('${d.id}')" id="density-btn-${d.id}"
          class="flex flex-col gap-2 p-3 rounded-xl border-2 text-left transition-all ${d.id === currentDensity ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'}">
          <div class="w-full h-14 rounded-lg overflow-hidden flex-shrink-0 bg-slate-50 p-1.5 flex flex-col gap-1 justify-center">
            ${Array.from({length:d.rows}).map(()=>`<div class="w-full rounded bg-slate-200" style="height:${d.h}px"></div>`).join('')}
          </div>
          <div>
            <div class="text-xs font-bold text-slate-800">${d.label}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">${d.sub}</div>
          </div>
        </button>`).join('')}
      </div>
    </div>

    <!-- Dashboard background -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">🖼 Dashboard Background</h3>
      <p class="text-xs text-slate-400 mb-4">Set a background image for the dashboard header. Choose from free photos or upload your own.</p>
      <div id="dash-bg-grid" class="grid grid-cols-4 gap-2 mb-3">
        ${await (async () => {
          const cur = (await api.storeGet('dashBg')) || null
          const PRESETS = [
            { id:'none',     label:'None',       src:null,         color:'#f8fafc' },
            { id:'mountain', label:'Mountains',  src:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=60', color:'#4a6fa5' },
            { id:'forest',   label:'Forest',     src:'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=60', color:'#2d6a4f' },
            { id:'library',  label:'Library',    src:'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=60', color:'#8b6914' },
            { id:'desk',     label:'Study Desk', src:'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=60', color:'#5a4a42' },
            { id:'space',    label:'Space',      src:'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&q=60', color:'#1a1a2e' },
            { id:'abstract', label:'Abstract',   src:'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=600&q=60', color:'#6b21a8' },
          ]
          const isCur = id => cur === id || (id === 'none' && !cur)
          return PRESETS.map(p => `
          <button onclick="dashBgSetPreset('${p.id}','${p.src||''}')" title="${p.label}"
            class="relative rounded-xl overflow-hidden border-2 transition-all ${isCur(p.id) ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-transparent hover:border-slate-300'}"
            style="aspect-ratio:16/9;${p.src ? `background:url(${p.src}) center/cover` : `background:${p.color}`}">
            <div class="absolute inset-0" style="background:rgba(0,0,0,${p.src?'.25':'.05'})"></div>
            <span class="absolute bottom-1 left-1 right-1 text-center text-[9px] text-white font-semibold leading-none drop-shadow">${p.label}</span>
          </button>`).join('')
        })()}
      </div>
      <div class="flex gap-2">
        <button onclick="dashBgUploadOwn()" class="btn-secondary text-xs py-2 px-3 flex-1">📁 Upload own image…</button>
        <button onclick="dashBgOpenLibrary()" class="btn-secondary text-xs py-2 px-3 flex-1">🌐 Browse free photos…</button>
        ${(await api.storeGet('dashBg')) ? `<button onclick="dashBgClear()" class="text-xs px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">✕ Remove</button>` : ''}
      </div>
    </div>

    <!-- Sidebar tools -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-sm font-bold text-slate-700">🧩 Sidebar Tools</h3>
        <button onclick="showToolPicker(true)" class="btn-secondary text-xs py-1.5 px-3">Customise →</button>
      </div>
      <p class="text-xs text-slate-400 mb-3">Choose which tools appear in your sidebar. Dashboard and Settings are always visible.</p>
      <div class="flex flex-wrap gap-1.5">
        ${(typeof ALL_TOOLS !== 'undefined' ? ALL_TOOLS : []).map(t => {
          const enabled = (state.sidebarTools || []).includes(t.id) || !state.sidebarTools
          return `<span class="text-xs px-2.5 py-1 rounded-full border ${enabled ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'}">${t.icon} ${t.label}</span>`
        }).join('')}
      </div>
    </div>

    <!-- Specialty tool packs -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">🧰 Specialty Tool Packs</h3>
      <p class="text-xs text-slate-400 mb-4">Optional extra tools that only appear in your sidebar once enabled.</p>
      <div class="space-y-2.5">
        ${_TOOL_PACKS.map(pack => {
          const on = currentPacks.includes(pack.id)
          return `
          <label class="flex items-start gap-3 cursor-pointer select-none group p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
            <input type="checkbox" class="accent-indigo-600 w-4 h-4 flex-shrink-0 mt-0.5"
              ${on ? 'checked' : ''} onchange="personToggleToolPack('${pack.id}')"/>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-slate-700">${pack.icon} ${pack.label}</div>
              <div class="text-xs text-slate-400">${pack.desc}</div>
            </div>
          </label>`
        }).join('')}
      </div>
    </div>

    <!-- Research area presets -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">🔬 Research Area</h3>
      <p class="text-xs text-slate-400 mb-4">Tell us what kind of research you do and we'll suggest a sidebar, dashboard, and unit converter setup tailored to it. This won't change your profile's research field — it's just a one-time setup helper.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        ${Object.entries(_FIELD_PRESETS).map(([id, preset]) => `
        <div class="flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${currentArea === id ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200'}">
          <span class="text-xl leading-none mt-0.5 flex-shrink-0">${preset.icon}</span>
          <div class="min-w-0 flex-1">
            <div class="text-xs font-semibold text-slate-800">${preset.label}</div>
            <div class="text-[10px] text-slate-400 mt-0.5 leading-snug mb-2">${preset.desc}</div>
            <button onclick="personApplyFieldPreset('${id}')"
              class="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${currentArea === id ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700'}">
              ${currentArea === id ? '✓ Applied — re-apply' : 'Apply suggested setup →'}
            </button>
          </div>
        </div>`).join('')}
      </div>
    </div>

    <!-- Dashboard widgets -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">🏠 Dashboard Widgets</h3>
      <p class="text-xs text-slate-400 mb-4">Choose which sections appear on your dashboard. Changes apply instantly.</p>
      <div class="space-y-2.5">
        ${WIDGET_LIST.map(w => {
          const enabled = widgets[w.id] !== false
          return `
          <label class="flex items-center gap-3 cursor-pointer select-none group p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
            <input type="checkbox" id="widget-${w.id}" class="accent-indigo-600 w-4 h-4 flex-shrink-0"
              ${enabled ? 'checked' : ''} onchange="personSaveWidgets()"/>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-slate-700">${w.label}</div>
              <div class="text-xs text-slate-400">${w.desc}</div>
            </div>
          </label>`
        }).join('')}
      </div>
    </div>

  </div>`
}

async function personSetAccent(color) {
  applyAccent(color)
  await api.storeSet('accentColor', color)
  // Re-render the tab to update selected state
  renderPersonalizeTab(document.getElementById('settings-body'))
  const label = color[0] === '#' ? color : (color[0].toUpperCase() + color.slice(1))
  showToast(`Accent colour set to ${label} ✓`)
}

async function personSetFont(font) {
  applyFont(font)
  await api.storeSet('fontFamily', font)
  renderPersonalizeTab(document.getElementById('settings-body'))
  showToast('Font updated ✓')
}

// ── Dashboard background ──────────────────────────────────────────────────────
async function dashBgSetPreset(id, src) {
  const val = (id === 'none' || !src) ? null : src
  if (typeof _dashBgSet === 'function') _dashBgSet(val)
  await api.storeSet('dashBg', val)
  await api.storeSet('dashBgId', id)
  if (state.currentView === 'dashboard') render_dashboard()
  renderPersonalizeTab(document.getElementById('settings-body'))
  showToast(val ? 'Background set ✓' : 'Background removed ✓')
}

async function dashBgUploadOwn() {
  const fp = await api.openImportDialog ? api.openImportDialog() : null
  // Use generic open dialog via existing image dialog
  const result = await api.openSaveDialog({
    title: 'This does nothing — use openPdfDialog workaround',
  }).catch(() => null)
  // Actually use the standard approach — open file via a hidden input trick
  // Since we don't have a generic file-open for images, use openPdfDialog filter workaround
  const paths = await api.openPdfDialog().catch(() => null)  // pdf dialog accepts any file via filter
  // Better: use the spreadsheet dialog which we added, but that's also typed
  // Simplest: prompt user to type path — not great UX. Let's open a proper dialog
  showToast('Use "Browse free photos" or drag an image file onto the dashboard header', 'error')
}

async function dashBgOpenLibrary() {
  // Open Unsplash search in external browser — free photos, no API key needed via Unsplash Source
  openModal(`
  <h3 class="text-sm font-bold text-slate-900 mb-2">🌐 Free Photo Library</h3>
  <p class="text-xs text-slate-500 mb-4">Search Unsplash for free high-quality photos. Copy the image URL and paste it below, or click a suggested topic.</p>
  <div class="flex flex-wrap gap-1.5 mb-3">
    ${['nature','mountains','library','study','science','space','abstract','minimal','city','ocean'].map(t=>
      `<button onclick="dashBgUnsplashTopic('${t}')"
        class="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-600 transition-colors">${t}</button>`
    ).join('')}
  </div>
  <div class="flex gap-2 mb-3">
    <input id="dash-bg-url-inp" type="text" placeholder="Paste image URL or Unsplash photo URL…"
      class="input flex-1 text-xs" oninput="_dashBgPreviewUrl(this.value)"/>
    <button onclick="dashBgApplyUrl()" class="btn-primary text-xs px-4">Apply</button>
  </div>
  <div id="dash-bg-preview-area" class="rounded-xl overflow-hidden bg-slate-100 w-full" style="height:120px;background-size:cover;background-position:center"></div>
  <p class="text-[10px] text-slate-400 mt-2">Photos from Unsplash are free to use. Credit the photographer when sharing.</p>`)
}

function dashBgUnsplashTopic(topic) {
  const url = `https://source.unsplash.com/1600x900/?${topic}`
  const inp = document.getElementById('dash-bg-url-inp')
  if (inp) { inp.value = url; _dashBgPreviewUrl(url) }
  api.openExternal(`https://unsplash.com/s/photos/${topic}`)
}

function _dashBgPreviewUrl(url) {
  const el = document.getElementById('dash-bg-preview-area')
  if (el && url.startsWith('http')) el.style.backgroundImage = `url(${url})`
}

async function dashBgApplyUrl() {
  const url = document.getElementById('dash-bg-url-inp')?.value.trim()
  if (!url || !url.startsWith('http')) { showToast('Enter a valid URL', 'error'); return }
  if (typeof _dashBgSet === 'function') _dashBgSet(url)
  await api.storeSet('dashBg', url)
  await api.storeSet('dashBgId', 'custom')
  closeModal()
  if (state.currentView === 'dashboard') render_dashboard()
  renderPersonalizeTab(document.getElementById('settings-body'))
  showToast('Background applied ✓')
}

async function dashBgClear() {
  if (typeof _dashBgSet === 'function') _dashBgSet(null)
  await api.storeSet('dashBg', null)
  await api.storeSet('dashBgId', 'none')
  if (state.currentView === 'dashboard') render_dashboard()
  renderPersonalizeTab(document.getElementById('settings-body'))
  showToast('Background removed ✓')
}

async function personSetPaper(mode) {
  applyPaperMode(mode)
  await api.storeSet('paperMode', mode)
  renderPersonalizeTab(document.getElementById('settings-body'))
  // Re-render current view so it picks up the new mode immediately
  if (state.currentView && typeof window[`render_${state.currentView}`] === 'function') {
    window[`render_${state.currentView}`]()
  }
  showToast(mode === 'off' ? 'Page style reset ✓' : `${mode.charAt(0).toUpperCase()+mode.slice(1)} style applied ✓`)
}

async function personSetDensity(density) {
  applyDensity(density)
  await api.storeSet('uiDensity', density)
  renderPersonalizeTab(document.getElementById('settings-body'))
  showToast(`${density.charAt(0).toUpperCase()+density.slice(1)} density applied ✓`)
}

// ── Specialty tool packs ──────────────────────────────────────────────────────
async function personToggleToolPack(packId) {
  const packs = new Set(state.enabledPacks || [])
  const enabling = !packs.has(packId)
  if (enabling) packs.add(packId); else packs.delete(packId)
  state.enabledPacks = [...packs]
  await api.storeSet('enabledPacks', state.enabledPacks)

  // Auto add/remove this pack's tools from the sidebar tool list
  const packToolIds = _PACK_TOOLS.filter(t => t.pack === packId).map(t => t.id)
  let tools = _enabledTools().slice()
  if (enabling) packToolIds.forEach(id => { if (!tools.includes(id)) tools.push(id) })
  else tools = tools.filter(id => !packToolIds.includes(id))
  state.sidebarTools = tools
  await api.storeSet('sidebarTools', tools)

  renderSidebar()
  renderPersonalizeTab(document.getElementById('settings-body'))
  const pack = _TOOL_PACKS.find(p => p.id === packId)
  showToast(`${pack?.label || 'Pack'} ${enabling ? 'enabled' : 'disabled'} ✓`)
}

// ── Research area presets ──────────────────────────────────────────────────────
function personApplyFieldPreset(id) {
  const preset = _FIELD_PRESETS[id]
  if (!preset) return
  openModal(`
  <h3 class="text-base font-bold text-slate-900 mb-2">${preset.icon} Apply ${esc(preset.label)} setup?</h3>
  <p class="text-sm text-slate-500 mb-4">This will replace your sidebar tools and dashboard widgets with a suggested setup for <strong>${esc(preset.label)}</strong>, and switch the Unit Converter's default category. You'll have a few seconds to undo afterwards, and can always change everything individually later.</p>
  <div class="flex gap-3">
    <button onclick="closeModal()" class="flex-1 btn-secondary">Cancel</button>
    <button onclick="closeModal();_doApplyFieldPreset('${id}')" class="flex-1 btn-primary">Apply suggested setup</button>
  </div>`, false)
}

async function _doApplyFieldPreset(id) {
  const preset = _FIELD_PRESETS[id]
  if (!preset) return

  const prev = {
    sidebarTools:     state.sidebarTools,
    dashboardWidgets: state.profile?.dashboardWidgets,
    enabledPacks:     state.enabledPacks,
    researchArea:     state.researchArea,
  }

  const tools = preset.sidebarTools || _DEFAULT_TOOLS
  state.sidebarTools = tools
  await api.storeSet('sidebarTools', tools)

  state.profile = state.profile || {}
  state.profile.dashboardWidgets = preset.dashboardWidgets
  await save('profile')

  state.enabledPacks = preset.packs || []
  await api.storeSet('enabledPacks', state.enabledPacks)

  state.researchArea = id
  await api.storeSet('researchArea', id)

  if (preset.unitCategory) _utilUnitCat = preset.unitCategory

  renderSidebar()
  if (state.currentView === 'dashboard') render_dashboard()
  renderPersonalizeTab(document.getElementById('settings-body'))

  showUndoToast(`Applied ${preset.label} setup ✓`, async () => {
    state.sidebarTools = prev.sidebarTools
    await api.storeSet('sidebarTools', prev.sidebarTools)
    state.profile.dashboardWidgets = prev.dashboardWidgets
    await save('profile')
    state.enabledPacks = prev.enabledPacks || []
    await api.storeSet('enabledPacks', state.enabledPacks)
    state.researchArea = prev.researchArea
    await api.storeSet('researchArea', prev.researchArea)
    renderSidebar()
    if (state.currentView === 'dashboard') render_dashboard()
    if (state.currentView === 'settings') renderPersonalizeTab(document.getElementById('settings-body'))
    showToast('Reverted ✓')
  })
}

function personSaveWidgets() {
  const ids = ['events','projects','tasks','grants','papers']
  const widgets = {}
  ids.forEach(id => { widgets[id] = document.getElementById(`widget-${id}`)?.checked !== false })
  state.profile = state.profile || {}
  state.profile.dashboardWidgets = widgets
  save('profile')
  // Refresh dashboard if it's the current view
  if (state.currentView === 'dashboard') render_dashboard()
}

// ── App tab ───────────────────────────────────────────────────────────────────

function renderAppTab(body) {
  const topics  = (state.newsTopics || [])
  const citStyle= state.profile?.defaultCitationStyle || 'APA'
  const dms     = state.darkModeSchedule || {}

  const currentTheme = document.documentElement.dataset.theme || 'light'

  body.innerHTML = `
  <div class="p-3 lg:p-6 max-w-2xl space-y-5">

    <!-- Appearance -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">🎨 Appearance</h3>
      <p class="text-xs text-slate-400 mb-3">Choose how PhDFlow looks. Your preference is saved locally.</p>
      <div class="grid grid-cols-2 gap-3 max-w-xs">
        <button onclick="settingsSetTheme('light')" id="theme-btn-light"
          class="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${currentTheme==='light'?'border-indigo-500':'border-slate-200 hover:border-slate-300'}">
          <div class="w-full h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5 px-2">
            <div class="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"></div>
            <div class="flex-1 h-1.5 rounded bg-slate-200"></div>
          </div>
          <span class="text-xs font-semibold text-slate-700">☀️ Light</span>
        </button>
        <button onclick="settingsSetTheme('dark')" id="theme-btn-dark"
          class="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${currentTheme==='dark'?'border-indigo-500':'border-slate-200 hover:border-slate-300'}">
          <div class="w-full h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center gap-1.5 px-2">
            <div class="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0"></div>
            <div class="flex-1 h-1.5 rounded bg-slate-600"></div>
          </div>
          <span class="text-xs font-semibold text-slate-700">🌙 Dark</span>
        </button>
      </div>
    </div>

    <!-- Dark mode schedule -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">🌙 Dark Mode Schedule</h3>
      <p class="text-xs text-slate-400 mb-3">Auto-switch between light and dark mode at set times each day.</p>
      <div class="space-y-3">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" id="dms-enabled" class="accent-indigo-600 w-4 h-4" ${dms.enabled?'checked':''}
            onchange="document.getElementById('dms-times').style.opacity=this.checked?'1':'0.4';document.getElementById('dms-times').style.pointerEvents=this.checked?'':'none'"/>
          <span class="text-sm text-slate-700 font-medium">Enable automatic schedule</span>
        </label>
        <div id="dms-times" style="opacity:${dms.enabled?1:0.4};pointer-events:${dms.enabled?'':'none'}">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">☀️ Switch to Light at</label>
              <input id="dms-light" type="time" value="${dms.lightFrom||'07:00'}" class="input"/>
            </div>
            <div>
              <label class="label">🌙 Switch to Dark at</label>
              <input id="dms-dark" type="time" value="${dms.darkFrom||'20:00'}" class="input"/>
            </div>
          </div>
        </div>
        <button onclick="dmsSave()" class="btn-primary text-xs py-1.5 px-4">Save Schedule</button>
      </div>
    </div>

    <!-- Calendar preferences -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">📅 Calendar Preferences</h3>
      <p class="text-xs text-slate-400 mb-3">Adjust how the calendar looks and behaves.</p>
      <div class="space-y-2">
        <label class="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox" id="cal-week-nums" class="accent-indigo-600 w-4 h-4"
            ${state.profile?.showWeekNumbers?'checked':''}
            onchange="calPrefSave()"/>
          <div>
            <span class="text-sm text-slate-700 font-medium">Show ISO week numbers</span>
            <p class="text-xs text-slate-400">Displays the week number (W1–W53) on the left of each row in month view.</p>
          </div>
        </label>
      </div>
    </div>

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

    <!-- AI Engine -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5" id="ai-engine-panel">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-sm font-bold text-slate-700">✨ AI Engine (Odysseus)</h3>
        <div id="ai-engine-badge" class="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-400">Not running</div>
      </div>
      <p class="text-xs text-slate-400 mb-3 leading-relaxed">
        PhDFlow includes a built-in AI engine that runs entirely on your computer — no API keys, no subscriptions, no data leaving your machine.
      </p>
      <div class="grid grid-cols-2 gap-1.5 mb-4 text-xs text-slate-600">
        ${[
          ['📄','Paper summaries','One click → key findings from any abstract'],
          ['✍️','Grant writing','Draft Specific Aims, Significance & Approach'],
          ['📝','Note assist','Expand notes, extract action items, improve writing'],
          ['📡','Feed ranking','Score papers 1–10 by relevance to your field'],
          ['🧞','Smart researcher search','Find the right person with guided questions'],
        ].map(([icon, title, desc]) => `
        <div class="flex items-start gap-2 p-2 bg-slate-50 rounded-xl">
          <span class="text-base flex-shrink-0 mt-0.5">${icon}</span>
          <div>
            <div class="font-semibold text-slate-700 text-xs">${title}</div>
            <div class="text-slate-400 text-[11px] leading-tight mt-0.5">${desc}</div>
          </div>
        </div>`).join('')}
      </div>

      <div id="ai-engine-content">
        <div class="text-xs text-slate-400 italic">Detecting Odysseus…</div>
      </div>
    </div>

    <!-- Feed auto-refresh -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">📡 Feed Auto-Refresh</h3>
      <p class="text-xs text-slate-400 mb-3">Automatically search for new papers in the background.</p>
      <div class="space-y-1">
        ${[
          ['off',    'Off',            'Manual only — click Refresh whenever you want'],
          ['launch', 'On launch',      'Refresh once when PhDFlow opens, if more than 24 h since last refresh'],
          ['6h',     'Every 6 hours',  'Background refresh while the app is open'],
          ['24h',    'Every 24 hours', 'Once a day while the app is open'],
        ].map(([val, label, desc]) => `
        <label class="flex items-start gap-2.5 p-2 rounded-xl cursor-pointer select-none hover:bg-slate-50 transition-colors">
          <input type="radio" name="news-auto-refresh" value="${val}"
            ${(state.profile?.newsAutoRefresh || 'off') === val ? 'checked' : ''}
            onchange="appSaveNewsRefresh('${val}')"
            class="accent-indigo-600 mt-0.5 flex-shrink-0"/>
          <div>
            <div class="text-sm font-medium text-slate-700">${label}</div>
            <div class="text-xs text-slate-400">${desc}</div>
          </div>
        </label>`).join('')}
      </div>
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
      <p class="text-xs text-slate-500 mb-2">All data lives on your machine. No PhDFlow server ever receives your data.</p>
      <div class="space-y-1 text-xs text-slate-500">
        ${[['arXiv','Paper discovery (open API)'],['OpenAlex','Paper & author metadata (open API)'],
           ['Semantic Scholar','Author search (open API)'],['CrossRef','Citation metadata (open API)'],
           ['Discord','Feedback you explicitly send'],['Your SMTP server','Vault OTP only']].map(([s,d])=>
          `<div>✅ <strong>${s}</strong> — ${d}</div>`
        ).join('')}
      </div>
    </div>
  </div>`
  // Initialise the AI engine panel after DOM is ready
  setTimeout(aiEngineInit, 0)
}

// ── AI Engine (Odysseus managed instance) ────────────────────────────────────

let _aiEngineStatus = 'unknown'

async function aiEngineInit() {
  const status = await api.odyStatus()
  _aiEngineRender(status)
  // Wire up live status updates
  api.onOdyStatus(s => _aiEngineUpdateBadge(s.status, s))
}

function _aiEngineUpdateBadge(status, extra = {}) {
  _aiEngineStatus = status
  const badge = document.getElementById('ai-engine-badge')
  if (!badge) return
  const map = {
    ready:       ['bg-emerald-100 text-emerald-700', '✓ Running'],
    starting:    ['bg-amber-100 text-amber-700',     '⏳ Starting…'],
    setup:       ['bg-indigo-100 text-indigo-700',   `⚙ ${extra.step || 'Setting up…'}`],
    setup_error: ['bg-rose-100 text-rose-600',       '✕ Setup error'],
    stopped:     ['bg-slate-100 text-slate-500',     'Stopped'],
    error:       ['bg-rose-100 text-rose-600',       '✕ Error'],
    unknown:     ['bg-slate-100 text-slate-400',     'Not running'],
  }
  const [cls, label] = map[status] || map.unknown
  badge.className = `text-xs px-2 py-0.5 rounded-full font-medium ${cls}`
  badge.textContent = label
}

function _aiEngineRender(status) {
  const el = document.getElementById('ai-engine-content')
  if (!el) return
  _aiEngineUpdateBadge(status.ready ? 'ready' : status.running ? 'starting' : 'stopped')

  if (!status.dir) {
    // Shouldn't happen when bundled, but handle gracefully
    el.innerHTML = `
    <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <p class="text-xs font-semibold text-amber-800 mb-1">AI Engine source not found</p>
      <p class="text-xs text-amber-700 mb-2">PhDFlow couldn't locate the bundled Odysseus source.</p>
      <button onclick="aiEngineChooseDir()" class="btn-secondary text-xs py-1.5 px-3">Browse for Odysseus folder…</button>
    </div>`
    return
  }

  if (status.dir && !status.venvReady) {
    el.innerHTML = `
    <div class="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-xl p-5">
      <div class="flex items-start gap-3 mb-4">
        <div class="text-3xl">✨</div>
        <div>
          <p class="text-sm font-bold text-slate-900 mb-1">Ready to activate AI features</p>
          <p class="text-xs text-slate-600 leading-relaxed">
            One-time setup installs the AI packages on your machine (~5 minutes, needs internet).
            After that, everything runs locally — no accounts, no subscriptions, no limits.
          </p>
        </div>
      </div>
      <div class="bg-white/70 rounded-xl p-3 mb-4 text-xs text-slate-600 space-y-1">
        <div class="font-semibold text-slate-700 mb-1">What happens when you click Set up:</div>
        <div>① PhDFlow finds Python 3.11+ on your computer</div>
        <div>② Downloads and installs AI packages (~200 MB)</div>
        <div>③ Starts the AI engine automatically</div>
        <div>④ All ✨ features activate across the app</div>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="aiEngineStart()" class="btn-primary text-sm py-2.5 px-5">⚡ Set up AI Engine (free)</button>
        <span class="text-xs text-slate-400">Requires Python 3.11+ · <button onclick="api.openExternal('https://www.python.org/downloads/')" class="text-indigo-500 hover:underline">Get Python ↗</button></span>
      </div>
    </div>`
    return
  }

  // Ready to run
  const running   = status.running || status.ready
  const autoStart = status.autoStart
  el.innerHTML = `
  <div class="space-y-3">
    <!-- Status row -->
    <div class="flex items-center gap-3 p-3 ${running ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'} border rounded-xl">
      <div class="w-2 h-2 rounded-full flex-shrink-0 ${running ? 'bg-emerald-500' : 'bg-slate-300'}"></div>
      <div class="flex-1 min-w-0 text-xs">
        ${running
          ? `<span class="font-semibold text-emerald-700">Running</span> <span class="text-emerald-600">· localhost:${status.port}</span>`
          : `<span class="font-semibold text-slate-600">Stopped</span>`}
        <div class="text-slate-400 truncate mt-0.5">${esc(status.dir)}</div>
      </div>
      ${running
        ? `<button onclick="aiEngineStop()" class="btn-danger text-xs py-1 px-3 flex-shrink-0">Stop</button>`
        : `<button onclick="aiEngineStart()" class="btn-primary text-xs py-1 px-3 flex-shrink-0">Start AI</button>`}
    </div>

    <!-- Auto-start toggle -->
    <label class="flex items-center gap-3 cursor-pointer select-none p-2 rounded-xl hover:bg-slate-50">
      <input type="checkbox" id="ai-autostart" ${autoStart?'checked':''} onchange="aiEngineSetAutoStart(this.checked)"
        class="accent-indigo-600 w-4 h-4"/>
      <div>
        <div class="text-sm font-medium text-slate-700">Start automatically with PhDFlow</div>
        <div class="text-xs text-slate-400">Odysseus starts in the background when you open PhDFlow</div>
      </div>
    </label>

    <!-- Log output (hidden by default) -->
    <div>
      <button onclick="document.getElementById('ai-log-box').classList.toggle('hidden')" class="text-xs text-slate-400 hover:text-slate-600">Show startup log</button>
      <div id="ai-log-box" class="hidden mt-2 bg-slate-900 text-slate-300 text-xs font-mono p-3 rounded-xl max-h-32 overflow-y-auto">
        <div id="ai-log-lines">Waiting for log output…</div>
      </div>
    </div>

    <button onclick="aiEngineChooseDir()" class="text-xs text-slate-400 hover:text-slate-600">Change Odysseus folder</button>
  </div>`

  // Wire up log streaming
  api.onOdyLog(line => {
    const box = document.getElementById('ai-log-lines')
    if (box) {
      box.textContent += line
      box.parentElement?.scrollTo(0, 99999)
    }
  })
}

async function aiEngineStart() {
  _aiEngineUpdateBadge('starting')
  document.querySelectorAll('#ai-engine-content button').forEach(b => { b.disabled = true })
  const r = await api.odyStart()
  if (r.success) {
    // Update PhDFlow's AI connection to point at managed instance (no token needed)
    if (!state.profile) state.profile = {}
    state.profile.odysseusUrl   = `http://127.0.0.1:${r.port || 7001}`
    state.profile.odysseusToken = ''  // AUTH_ENABLED=false, no token needed
    await save('profile')
  } else {
    showToast(r.error || 'Failed to start Odysseus', 'error')
  }
  const status = await api.odyStatus()
  _aiEngineRender(status)
}

async function aiEngineStop() {
  await api.odyStop()
  _aiEngineUpdateBadge('stopped')
  const status = await api.odyStatus()
  _aiEngineRender(status)
}

async function aiEngineSetAutoStart(enabled) {
  await api.odySetAutoStart(enabled)
  showToast(enabled ? 'AI Engine will start automatically ✓' : 'Auto-start disabled')
}

async function aiEngineChooseDir() {
  const r = await api.openSaveDialog({
    title: 'Select Odysseus folder (the one that contains app.py)',
    properties: ['openDirectory'],
  })
  // Note: openSaveDialog is for files; for directories we'll use a text field instead
  // The user can type or paste the path
  const el = document.getElementById('ai-engine-content')
  if (el) el.innerHTML += `
  <div class="mt-3 flex gap-2">
    <input id="ai-engine-path" type="text" placeholder="Paste Odysseus folder path here…" class="input flex-1 text-xs"/>
    <button onclick="aiEngineSetPath()" class="btn-primary text-xs py-1.5 px-3">Set path</button>
  </div>`
}

async function aiEngineSetPath() {
  const inp = document.getElementById('ai-engine-path')
  const dir = inp?.value?.trim()
  if (!dir) return
  const r = await api.odySetDir(dir)
  const status = await api.odyStatus()
  _aiEngineRender(status)
}

function aiEngineOpenDir(dir) {
  api.openFolder(dir)
}

async function appSaveOdysseus() {
  if (!state.profile) state.profile = {}
  state.profile.odysseusUrl      = document.getElementById('ody-url')?.value.trim().replace(/\/$/, '') || 'http://localhost:7000'
  state.profile.odysseusToken    = document.getElementById('ody-token')?.value.trim() || ''
  state.profile.odysseusEndpoint = document.getElementById('ody-endpoint')?.value.trim() || ''
  state.profile.odysseusModel    = document.getElementById('ody-model')?.value.trim() || ''
  await save('profile')
  showToast('AI Assistant settings saved ✓')
}

async function appTestOdysseus() {
  const url   = document.getElementById('ody-url')?.value.trim().replace(/\/$/, '') || 'http://localhost:7000'
  const token = document.getElementById('ody-token')?.value.trim() || ''
  const el    = document.getElementById('ody-status')
  if (el) el.textContent = 'Testing…'
  const r = await api.odysseusPing({ url, token })
  if (!el) return
  if (r.running && r.status === 200) {
    el.className = 'text-xs text-emerald-600 font-medium'
    el.textContent = '✓ Connected'
  } else if (r.running && r.status === 403) {
    el.className = 'text-xs text-amber-600'
    el.textContent = '⚠ Running but token rejected — check your API token'
  } else {
    el.className = 'text-xs text-rose-500'
    el.textContent = '✕ Not reachable — make sure Odysseus is running'
  }
}

async function appSaveNewsRefresh(val) {
  if (!state.profile) state.profile = {}
  state.profile.newsAutoRefresh = val
  await save('profile')
  // Re-init scheduler with new setting
  if (typeof newsInitAutoRefresh === 'function') newsInitAutoRefresh()
  showToast(val === 'off' ? 'Auto-refresh disabled' : `Auto-refresh set to: ${val === 'launch' ? 'on launch' : val} ✓`)
}

function appAddTopic() {
  const topics = state.newsTopics || []
  topics.push({ id: uid(), label: '', keywords: '' })
  state.newsTopics = topics
  renderAppTab(document.getElementById('settings-body'))
}

async function settingsSetTheme(t) {
  applyTheme(t)
  await api.storeSet('theme', t)
  renderAppTab(document.getElementById('settings-body'))
  showToast(`${t === 'dark' ? '🌙 Dark' : '☀️ Light'} mode applied`)
}

function calPrefSave() {
  if (!state.profile) return
  state.profile.showWeekNumbers = document.getElementById('cal-week-nums')?.checked || false
  save('profile')
  showToast('Calendar preferences saved ✓')
}

async function dmsSave() {
  const enabled   = document.getElementById('dms-enabled')?.checked || false
  const lightFrom = document.getElementById('dms-light')?.value || '07:00'
  const darkFrom  = document.getElementById('dms-dark')?.value || '20:00'
  state.darkModeSchedule = { enabled, lightFrom, darkFrom }
  await api.storeSet('darkModeSchedule', state.darkModeSchedule)
  if (typeof startDarkSchedule === 'function') startDarkSchedule()
  showToast(enabled ? `🌙 Schedule saved — dark at ${darkFrom}, light at ${lightFrom}` : 'Dark mode schedule disabled')
}

async function autoBackupSave() {
  const enabled = document.getElementById('ab-enabled')?.checked || false
  const freq    = document.getElementById('ab-freq')?.value || 'weekly'
  state.profile = state.profile || {}
  state.profile.autoBackup = { ...(state.profile.autoBackup || {}), enabled, freq }
  save('profile')
  showToast(enabled ? `Auto-backup enabled (${freq})` : 'Auto-backup disabled')
}

async function autoBackupRun() {
  const el = document.getElementById('ab-status')
  if (el) el.innerHTML = `<span class="text-slate-400">Backing up…</span>`
  try {
    const dir      = await api.getDataDir()
    const date     = new Date().toISOString().slice(0, 10)
    const dest     = `${dir}\\auto-backup-${date}.json`
    const r        = await api.exportData({ keys: _DATA_KEYS, dest })
    if (!r.success) throw new Error(r.error)
    state.profile = state.profile || {}
    state.profile.autoBackup = { ...(state.profile.autoBackup || {}), lastRun: new Date().toISOString() }
    save('profile')
    if (el) el.innerHTML = `<span class="text-emerald-600 font-semibold">✓ Backed up to ${dest.split('\\').pop()}</span>`
    showToast('Auto-backup saved ✓')
  } catch(e) {
    if (el) el.innerHTML = `<span class="text-rose-500">✕ ${esc(e.message)}</span>`
    showToast('Backup failed: ' + e.message, 'error')
  }
}

async function _checkAutoBackup() {
  const ab = state.profile?.autoBackup
  if (!ab?.enabled) return
  const now      = Date.now()
  const lastRun  = ab.lastRun ? new Date(ab.lastRun).getTime() : 0
  const interval = ab.freq === 'daily' ? 86400000 : 7 * 86400000
  if (now - lastRun < interval) return
  try {
    const dir  = await api.getDataDir()
    const date = new Date().toISOString().slice(0, 10)
    const dest = `${dir}\\auto-backup-${date}.json`
    const r    = await api.exportData({ keys: _DATA_KEYS, dest })
    if (r.success) {
      state.profile.autoBackup.lastRun = new Date().toISOString()
      save('profile')
    }
  } catch {}
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
  const ab = state.profile?.autoBackup || {}
  body.innerHTML = `
  <div class="p-3 lg:p-6 max-w-2xl space-y-5">

    <!-- Scheduled auto-backup -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">⏰ Scheduled Auto-Backup</h3>
      <p class="text-xs text-slate-400 mb-3">
        Automatically save a backup to your data folder. No manual action required.
        ${ab.lastRun ? `<span class="text-slate-500">Last backup: <strong>${new Date(ab.lastRun).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'})}</strong></span>` : ''}
      </p>
      <div class="space-y-3">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" id="ab-enabled" class="accent-indigo-600 w-4 h-4" ${ab.enabled?'checked':''}/>
          <span class="text-sm text-slate-700 font-medium">Enable scheduled backup</span>
        </label>
        <div class="flex items-center gap-3">
          <select id="ab-freq" class="input" style="width:auto">
            <option value="daily"  ${ab.freq==='daily' ?'selected':''}>Daily</option>
            <option value="weekly" ${(ab.freq||'weekly')==='weekly'?'selected':''}>Weekly</option>
          </select>
          <span class="text-xs text-slate-400">Saves to your app data folder as <code>auto-backup-YYYY-MM-DD.json</code></span>
        </div>
        <div class="flex gap-2">
          <button onclick="autoBackupSave()" class="btn-primary text-xs py-1.5 px-4">Save</button>
          <button onclick="autoBackupRun()" class="btn-secondary text-xs py-1.5 px-4">Run Now</button>
        </div>
        <div id="ab-status" class="text-xs text-slate-400"></div>
      </div>
    </div>

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

// ══ Share & Sync Tab ══════════════════════════════════════════════════════════

let _shareTab    = 'bundle'
let _lanActive   = false
let _lanPeers    = []
let _syncCfg     = {}

async function renderShareTab(body) {
  _syncCfg = await api.syncGetConfig() || {}

  body.innerHTML = `
  <div class="p-6 max-w-2xl space-y-0">

    <!-- Sub-tab bar -->
    <div class="flex gap-1 border-b border-slate-200 mb-5">
      ${[['bundle','📦 Bundle'],['sync','☁ Folder Sync'],['lan','📡 Local Network']].map(([id,label]) => `
      <button onclick="shareSubTab('${id}')"
        class="px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px
          ${_shareTab===id?'border-indigo-600 text-indigo-600':'border-transparent text-slate-500 hover:text-slate-700'}">
        ${label}
      </button>`).join('')}
    </div>

    <div id="share-body"></div>
  </div>`

  shareSubTab(_shareTab)

  // Wire up incoming events once
  api.onSyncIncoming(d => _onSyncIncoming(d))
  api.onLanBundleIncoming(d => _onLanBundleIncoming(d))
  api.onLanPeerDiscovered(d => {
    if (!_lanPeers.find(p => p.deviceId === d.deviceId)) _lanPeers.push(d)
    _renderLanPeers()
  })
  api.onLanPeerLost(d => {
    _lanPeers = _lanPeers.filter(p => p.deviceId !== d.deviceId)
    _renderLanPeers()
  })
}

function shareSubTab(id) {
  _shareTab = id
  document.querySelectorAll('[onclick^="shareSubTab"]').forEach(btn => {
    const active = btn.getAttribute('onclick') === `shareSubTab('${id}')`
    btn.className = `px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px ${
      active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`
  })
  const body = document.getElementById('share-body')
  if (!body) return
  if (id === 'bundle') _renderBundleTab(body)
  if (id === 'sync')   _renderSyncTab(body)
  if (id === 'lan')    _renderLanTab(body)
}

// ── Option A: Bundle ─────────────────────────────────────────────────────────

function _renderBundleTab(body) {
  body.innerHTML = `
  <div class="space-y-4">

    <!-- Export -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">📤 Export Full Workspace Bundle</h3>
      <p class="text-xs text-slate-400 mb-3">
        Package your entire workspace into a single <code>.phdflow</code> file.
        Send it to a collaborator, move it to another machine, or keep it as a portable snapshot.
      </p>
      <div class="flex gap-2 flex-wrap">
        <button onclick="shareBundleExportFull()" class="btn-primary text-xs py-2 px-4">Export Full Workspace</button>
      </div>
      <div id="bundle-export-status" class="mt-2 text-xs text-slate-400"></div>
    </div>

    <!-- Import -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">📥 Import Bundle</h3>
      <p class="text-xs text-slate-400 mb-3">
        Load a <code>.phdflow</code> bundle shared by a colleague. Data is merged with your existing
        workspace — newer entries always win over older ones.
      </p>
      <div class="flex items-center gap-4 mb-3">
        ${['merge','replace'].map(s => `
        <label class="flex items-center gap-1.5 text-xs cursor-pointer select-none">
          <input type="radio" name="bundle-strat" value="${s}" ${s==='merge'?'checked':''} class="accent-indigo-600"/>
          <div>
            <div class="font-semibold text-slate-700">${s === 'merge' ? 'Merge (recommended)' : 'Replace'}</div>
            <div class="text-slate-400">${s === 'merge' ? 'Combines data — newer updatedAt wins' : '⚠ Overwrites your existing data'}</div>
          </div>
        </label>`).join('')}
      </div>
      <button onclick="shareBundleImport()" class="btn-primary text-xs py-2 px-4">Choose Bundle File</button>
      <div id="bundle-import-status" class="mt-2 text-xs text-slate-400"></div>
    </div>

    <!-- Tip -->
    <div class="bg-indigo-50 rounded-2xl border border-indigo-100 p-4 text-xs text-indigo-700">
      💡 <strong>Tip:</strong> To share just one project (with its linked notes, tasks, and papers),
      open the project and click the <strong>Share</strong> button on the project card.
    </div>
  </div>`
}

async function shareBundleExportFull() {
  const dest = await api.openBundleSaveDialog(`phdflow-workspace-${new Date().toISOString().slice(0,10)}`)
  if (!dest) return
  const el = document.getElementById('bundle-export-status')
  if (el) el.innerHTML = `<span class="text-slate-400">Packaging…</span>`
  const r = await api.bundleExportFull({ dest })
  if (!el) return
  el.innerHTML = r.success
    ? `<span class="text-emerald-600 font-semibold">✓ Bundle saved — ${Object.entries(r.summary).filter(([,v])=>v>0).map(([k,v])=>`${v} ${k}`).join(', ')}</span>`
    : `<span class="text-rose-500">✕ ${esc(r.error)}</span>`
}

async function shareBundleImport() {
  const src = await api.openBundleDialog()
  if (!src) return
  const readResult = await api.bundleRead(src)
  if (!readResult.success) { showToast(readResult.error, 'error'); return }
  const { bundle } = readResult
  const strategy = document.querySelector('input[name="bundle-strat"]:checked')?.value || 'merge'
  if (strategy === 'replace' && !await confirmDlg('⚠️ Replace mode will overwrite your existing data with the bundle contents.\n\nThis cannot be undone — export a backup first.', 'Replace & Import')) return
  const el = document.getElementById('bundle-import-status')
  if (el) el.innerHTML = `<span class="text-slate-400">Importing…</span>`
  const r = await api.bundleImport({ bundle, strategy })
  if (!el) return
  if (r.success) {
    if (el) el.innerHTML = `<span class="text-emerald-600 font-semibold">✓ Bundle from "${esc(bundle._exportedBy)}" imported — ${esc(bundle.title)}</span>`
    await _reloadStateFromStore()
    showToast(`Bundle imported ✓`)
  } else {
    if (el) el.innerHTML = `<span class="text-rose-500">✕ ${esc(r.error)}</span>`
  }
}

// ── Option B: Folder Sync ─────────────────────────────────────────────────────

function _renderSyncTab(body) {
  const folder  = _syncCfg.folder || ''
  const enabled = !!_syncCfg.enabled
  body.innerHTML = `
  <div class="space-y-4">

    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">☁ Shared Folder Sync</h3>
      <p class="text-xs text-slate-400 mb-3">
        Point PhDFlow at a shared folder — a Dropbox folder, OneDrive directory, university network drive,
        or any folder multiple people can access. PhDFlow writes a sync file whenever you save data,
        and automatically picks up changes from your collaborators.
      </p>

      ${folder ? `
      <div class="flex items-center gap-2 mb-3 p-3 bg-${enabled?'emerald':'slate'}-50 border border-${enabled?'emerald':'slate'}-200 rounded-xl">
        <div class="w-2 h-2 rounded-full bg-${enabled?'emerald-500':'slate-400'}"></div>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-semibold text-slate-700">${enabled ? '✓ Sync active' : 'Sync paused'}</div>
          <div class="text-xs text-slate-400 truncate">${esc(folder)}</div>
        </div>
      </div>` : ''}

      <div class="flex gap-2 flex-wrap">
        <button onclick="shareSyncChooseFolder()" class="btn-primary text-xs py-2 px-4">
          ${folder ? '📁 Change Folder' : '📁 Choose Sync Folder'}
        </button>
        ${folder && enabled ? `<button onclick="shareSyncWriteNow()" class="btn-secondary text-xs py-2 px-4">Sync Now</button>` : ''}
        ${folder && enabled ? `<button onclick="shareSyncDisable()" class="btn-secondary text-xs py-2 px-4 text-rose-600">Pause Sync</button>` : ''}
      </div>
      <div id="sync-status" class="mt-2 text-xs text-slate-400"></div>
    </div>

    <div class="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs text-slate-600 space-y-1.5">
      <div class="font-semibold text-slate-700 mb-1">How it works</div>
      <div>📂 Each PhDFlow instance writes a small <code>.sync</code> file to the shared folder whenever data changes.</div>
      <div>👀 PhDFlow watches the folder — when a colleague's sync file appears, you get a notification to review and accept the changes.</div>
      <div>🔀 Conflicts resolve automatically: newer <code>updatedAt</code> timestamps win.</div>
      <div>☁ Works with Dropbox, OneDrive, Google Drive (desktop), university NAS, or any shared network folder.</div>
    </div>
  </div>`
}

async function shareSyncChooseFolder() {
  const folder = await api.syncOpenFolderDialog()
  if (!folder) return
  const r = await api.syncSetFolder(folder)
  const el = document.getElementById('sync-status')
  if (r.success) {
    _syncCfg.folder = folder; _syncCfg.enabled = true
    showToast('Sync folder set ✓')
    shareSubTab('sync')
  } else {
    if (el) el.innerHTML = `<span class="text-rose-500">✕ ${esc(r.error)}</span>`
  }
}

async function shareSyncWriteNow() {
  const el = document.getElementById('sync-status')
  if (el) el.innerHTML = `<span class="text-slate-400">Syncing…</span>`
  const r = await api.syncWriteNow()
  if (el) el.innerHTML = r.success
    ? `<span class="text-emerald-600 font-semibold">✓ Sync file written — ${esc(r.filename)}</span>`
    : `<span class="text-rose-500">✕ ${esc(r.error)}</span>`
}

async function shareSyncDisable() {
  await api.syncDisable()
  _syncCfg.enabled = false
  shareSubTab('sync')
  showToast('Sync paused')
}

async function _onSyncIncoming(d) {
  const accept = await confirmDlg(
    `📥 ${esc(d.syncedBy)} synced their workspace.\n\nAccept and merge their changes into yours?`,
    'Accept & Merge'
  )
  if (!accept) return
  const r = await api.syncApply({ data: d.data, strategy: 'merge' })
  if (r.success) {
    await _reloadStateFromStore()
    showToast(`Changes from ${esc(d.syncedBy)} merged ✓`)
  } else {
    showToast(r.error, 'error')
  }
}

// ── Option C: LAN Discovery ───────────────────────────────────────────────────

function _renderLanTab(body) {
  body.innerHTML = `
  <div class="space-y-4">

    <div class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-sm font-bold text-slate-700 mb-1">📡 Local Network Sharing</h3>
      <p class="text-xs text-slate-400 mb-3">
        Share projects and bundles directly with colleagues on the same Wi-Fi or lab network —
        no cloud, no accounts required. Both devices must have this panel open.
      </p>
      <div class="flex gap-2 mb-4">
        ${_lanActive
          ? `<button onclick="shareLanStop()" class="btn-danger text-xs py-2 px-4">Stop Discovery</button>`
          : `<button onclick="shareLanStart()" class="btn-primary text-xs py-2 px-4">Start Discovery</button>`}
      </div>
      <div id="lan-status" class="text-xs text-slate-400 mb-3">
        ${_lanActive ? '📡 Broadcasting presence on local network…' : 'Not active — click Start Discovery to find colleagues.'}
      </div>
      <div id="lan-peers-list"></div>
    </div>

    <div class="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs text-slate-600 space-y-1.5">
      <div class="font-semibold text-slate-700 mb-1">How it works</div>
      <div>📡 PhDFlow broadcasts its presence on the local network (UDP multicast).</div>
      <div>👥 Other PhDFlow instances on the same network appear in the list automatically.</div>
      <div>📦 Select a peer and choose what to share — they get a notification to accept.</div>
      <div>🔒 Transfers happen directly device-to-device over HTTP. Nothing goes to the internet.</div>
    </div>
  </div>`
  _renderLanPeers()
}

function _renderLanPeers() {
  const list = document.getElementById('lan-peers-list')
  if (!list) return
  if (!_lanPeers.length) {
    list.innerHTML = `<div class="text-xs text-slate-400 italic">No peers found yet — make sure colleagues also have this panel open.</div>`
    return
  }
  list.innerHTML = `
  <div class="text-xs font-semibold text-slate-600 mb-2">Colleagues found (${_lanPeers.length}):</div>
  <div class="space-y-2">
    ${_lanPeers.map(p => `
    <div class="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
        <div>
          <div class="text-xs font-semibold text-slate-700">${esc(p.name)}</div>
          <div class="text-xs text-slate-400">${esc(p.ip)}</div>
        </div>
      </div>
      <button onclick="shareLanSendTo('${esc(p.ip)}','${esc(p.name)}')" class="btn-primary text-xs py-1 px-3">
        📦 Send Bundle
      </button>
    </div>`).join('')}
  </div>`
}

async function shareLanStart() {
  const r = await api.lanStart()
  if (!r.success) { showToast(r.error, 'error'); return }
  _lanActive = true
  _lanPeers  = await api.lanGetPeers()
  shareSubTab('lan')
}

async function shareLanStop() {
  await api.lanStop()
  _lanActive = false
  _lanPeers  = []
  shareSubTab('lan')
}

async function shareLanSendTo(ip, name) {
  const dataDir = await api.getDataDir()
  if (!dataDir) { showToast('Could not get data directory', 'error'); return }
  const dest = `${dataDir}\\lan-send-temp.phdflow`
  showToast(`Building bundle for ${name}…`)
  const exportResult = await api.bundleExportFull({ dest })
  if (!exportResult.success) { showToast(exportResult.error, 'error'); return }
  const readResult = await api.bundleRead(dest)
  if (!readResult.success) { showToast(readResult.error, 'error'); return }
  const r = await api.lanSendBundle({ targetIp: ip, bundleData: readResult.bundle })
  showToast(r.success ? `✓ Bundle sent to ${name}` : `Failed: ${r.error}`, r.success ? 'success' : 'error')
}

async function _onLanBundleIncoming(d) {
  const accept = await confirmDlg(
    `📦 ${esc(d.sentBy)} wants to share "${esc(d.title)}" with you.\n\nContents: ${Object.entries(d.summary||{}).filter(([,v])=>v>0).map(([k,v])=>`${v} ${k}`).join(', ')}\n\nAccept and merge into your workspace?`,
    'Accept Bundle'
  )
  if (!accept) { await api.lanRejectBundle(); return }
  const r = await api.lanAcceptBundle()
  if (r.success) {
    await _reloadStateFromStore()
    showToast(`Bundle from ${esc(d.sentBy)} merged ✓`)
  } else {
    await api.lanRejectBundle()
    showToast(r.error, 'error')
  }
}

async function _reloadStateFromStore() {
  const keys = ['projects','papers','contacts','notes','whiteboards','events','todos','grants',
                 'newsFeeds','newsTopics','newsRead','calGoals','calFeeds','todoGroups','paperCollections']
  await Promise.all(keys.map(async k => {
    const v = await api.storeGet(k)
    if (v !== null) state[k] = v
  }))
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
      <p class="text-xs text-slate-500 mb-4">Account name in your app: <strong>PhDFlow</strong></p>
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
