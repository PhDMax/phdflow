// ══ Projects View ═════════════════════════════════════════════════════════════

// Shared CSS classes (injected globally)
document.head.insertAdjacentHTML('beforeend', `<style>
  .label{display:block;font-size:.75rem;font-weight:500;color:#475569;margin-bottom:.25rem}
  .input{width:100%;padding:.5rem .75rem;border-radius:.75rem;border:1px solid #e2e8f0;font-size:.875rem;color:#0f172a;outline:none}
  .input:focus{box-shadow:0 0 0 2px #6366f1;border-color:transparent}
  .btn-primary{padding:.6rem 1rem;background:#4f46e5;color:white;border-radius:.75rem;font-weight:600;font-size:.875rem;cursor:pointer;border:none;transition:background .15s}
  .btn-primary:hover{background:#4338ca}
  .btn-secondary{padding:.6rem 1rem;background:white;color:#374151;border-radius:.75rem;font-weight:500;font-size:.875rem;cursor:pointer;border:1px solid #e2e8f0;transition:background .15s}
  .btn-secondary:hover{background:#f8fafc}
  .btn-danger{padding:.6rem 1rem;background:white;color:#dc2626;border-radius:.75rem;font-weight:500;font-size:.875rem;cursor:pointer;border:1px solid #fecaca;transition:background .15s}
  .btn-danger:hover{background:#fef2f2}
</style>`)

// ── Attention scoring (lower = needs attention more) ─────────────────────────
function _projectAttention(p) {
  const today = new Date().toISOString().split('T')[0]
  if (p.status === 'archived')  return 95
  if (p.status === 'completed') return 90
  if (p.status === 'on-hold')   return 80
  if (p.endDate && p.endDate < today) return 0            // overdue
  if (p.endDate) {
    const d = Math.round((new Date(p.endDate) - new Date()) / 864e5)
    if (d <= 7)  return 1                                  // < 1 week
    if (d <= 14) return 2                                  // < 2 weeks
  }
  const blocked  = (p.threads||[]).filter(t => t.status === 'blocked').length
  const waiting  = (p.threads||[]).filter(t => t.status === 'waiting').length
  if (blocked)  return 3
  if (waiting)  return 4
  const daysSince = p.updatedAt
    ? Math.round((new Date() - new Date(p.updatedAt)) / 864e5) : 0
  if (daysSince > 14) return 5                             // stalled
  return 10
}

function _attentionBanner(p) {
  const today = new Date().toISOString().split('T')[0]
  const score = _projectAttention(p)
  if (score === 0) {
    const d = Math.round((new Date() - new Date(p.endDate)) / 864e5)
    return `<div class="mt-2.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">🔴 Deadline passed ${d}d ago</div>`
  }
  if (score === 1 || score === 2) {
    const d = Math.round((new Date(p.endDate) - new Date()) / 864e5)
    const col = score===1 ? 'text-red-600 bg-red-50 border-red-200' : 'text-amber-700 bg-amber-50 border-amber-200'
    return `<div class="mt-2.5 text-xs font-semibold ${col} border rounded-lg px-2.5 py-1.5">⏰ Deadline in ${d} day${d!==1?'s':''}</div>`
  }
  if (score === 3) {
    const n = (p.threads||[]).filter(t=>t.status==='blocked').length
    return `<div class="mt-2.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">🚫 ${n} thread${n>1?'s':''} blocked</div>`
  }
  if (score === 4) {
    const waiting = (p.threads||[]).filter(t=>t.status==='waiting')
    const who = waiting.map(t=>t.waitingOn).filter(Boolean).join(', ')
    return `<div class="mt-2.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">⏳ Waiting on${who ? ': '+who : ' '+waiting.length+' item'+(waiting.length>1?'s':'')}</div>`
  }
  if (score === 5) {
    const d = p.updatedAt ? Math.round((new Date()-new Date(p.updatedAt))/864e5) : '?'
    return `<div class="mt-2.5 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5">😴 No activity in ${d} days</div>`
  }
  return ''
}

// ── Thread status helpers ─────────────────────────────────────────────────────
const THREAD_STATUS = {
  active:  { label:'Active',     cls:'bg-indigo-100 text-indigo-700' },
  waiting: { label:'Waiting',    cls:'bg-amber-100 text-amber-700'   },
  blocked: { label:'Blocked',    cls:'bg-red-100 text-red-700'       },
  done:    { label:'Done',       cls:'bg-green-100 text-green-700'   },
}
function threadChip(status) {
  const s = THREAD_STATUS[status] || THREAD_STATUS.active
  return `<span class="text-xs px-2 py-0.5 rounded-full ${s.cls}">${s.label}</span>`
}

// ── Progress from threads (or manual override) ───────────────────────────────
function _calcProgress(p) {
  if (p.progressOverride != null) return p.progressOverride
  const threads = p.threads || []
  if (!threads.length) return p.progress || 0
  const done = threads.filter(t => t.status === 'done').length
  return Math.round((done / threads.length) * 100)
}

// ── Render ────────────────────────────────────────────────────────────────────
let _pFilter = 'all'

function render_projects() {
  const vc = document.getElementById('view-content')
  vc.innerHTML = `
  ${pageHeader('📋 Projects', `<div class="flex items-center gap-2">${_folderBtn('Projects')}<button onclick="openProjectModal()" class="btn-primary text-xs py-2">+ New Project</button></div>`)}
  <div class="flex-1 overflow-y-auto p-3 lg:p-6">
    <div class="flex gap-2 mb-3 items-center">
      <input id="projects-search" type="text" placeholder="Search projects…"
        oninput="renderProjectCards(_pFilter)"
        class="px-3 py-1.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 max-w-xs"/>
    </div>
    <div id="projects-filters" class="flex gap-2 mb-5 flex-wrap">
      ${['all','active','planning','on-hold','completed','archived'].map(s=>`
      <button onclick="filterProjects('${s}')" data-pf="${s}"
        class="text-xs px-3 py-1.5 rounded-full border transition-colors ${s==='all'?'bg-indigo-600 border-indigo-600 text-white':'border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'}">
        ${s==='all'?'All':s==='on-hold'?'On Hold':s[0].toUpperCase()+s.slice(1)}
      </button>`).join('')}
    </div>
    <div id="projects-grid" class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"></div>
  </div>`
  renderProjectCards('all')
}

function filterProjects(f) {
  _pFilter = f
  document.querySelectorAll('[data-pf]').forEach(b => {
    const active = b.dataset.pf === f
    b.className = `text-xs px-3 py-1.5 rounded-full border transition-colors ${active
      ? 'bg-indigo-600 border-indigo-600 text-white'
      : 'border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'}`
  })
  renderProjectCards(f)
}

function renderProjectCards(filter) {
  const grid = document.getElementById('projects-grid')
  const q    = (document.getElementById('projects-search')?.value || '').toLowerCase().trim()
  let projects = filter === 'all'
    ? state.projects.filter(p => p.status !== 'archived')
    : state.projects.filter(p => p.status === filter)
  if (q) projects = projects.filter(p =>
    p.name?.toLowerCase().includes(q) ||
    p.description?.toLowerCase().includes(q) ||
    (p.tags||[]).some(t => t.toLowerCase().includes(q))
  )

  // Sort by attention level (most urgent first)
  projects.sort((a,b) => _projectAttention(a) - _projectAttention(b))

  if (!projects.length) {
    grid.innerHTML = `<div class="col-span-3">${emptyState('📋','No projects yet','Create your first research project to get started')}</div>`
    return
  }

  grid.innerHTML = projects.map(p => {
    const prog     = _calcProgress(p)
    const threads  = p.threads || []
    const active   = threads.filter(t=>t.status==='active').length
    const waiting  = threads.filter(t=>t.status==='waiting').length
    const blocked  = threads.filter(t=>t.status==='blocked').length
    const done     = threads.filter(t=>t.status==='done').length
    const barColor = prog >= 75 ? '#22c55e' : prog >= 40 ? (p.color||'#6366f1') : '#f59e0b'
    const banner   = _attentionBanner(p)

    return `
    <div class="bg-white rounded-2xl border ${banner ? 'border-slate-300' : 'border-slate-200'} p-5 hover:shadow-md transition-shadow cursor-pointer"
         onclick="openProjectDetail('${p.id}')">

      <!-- Header -->
      <div class="flex items-start justify-between gap-2 mb-2">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style="background:${p.color||'#6366f1'}"></div>
          <h3 class="font-bold text-slate-900 text-sm leading-snug truncate">${esc(p.name)}</h3>
        </div>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          ${statusBadge(p.status)}
          <button title="Share this project"
            onclick="event.stopPropagation();openProjectShareModal('${p.id}')"
            class="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors text-xs">
            ↗
          </button>
        </div>
      </div>

      ${p.description ? `<p class="text-slate-500 text-xs mb-2.5 line-clamp-1 ml-5">${esc(p.description)}</p>` : ''}

      <!-- Progress bar -->
      ${threads.length ? `
      <div class="mb-3 ml-5">
        <div class="flex justify-between text-xs text-slate-400 mb-1">
          <span>${done}/${threads.length} threads done</span>
          <span>${prog}%</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-1.5">
          <div class="h-1.5 rounded-full transition-all" style="width:${prog}%;background:${barColor}"></div>
        </div>
      </div>` : ''}

      <!-- Thread summary chips -->
      ${threads.length ? `
      <div class="flex gap-1.5 flex-wrap ml-5 mb-1">
        ${active  ? `<span class="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">${active} active</span>`  : ''}
        ${waiting ? `<span class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">${waiting} waiting</span>` : ''}
        ${blocked ? `<span class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">${blocked} blocked</span>`     : ''}
        ${done    ? `<span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">${done} done</span>`        : ''}
      </div>` : `<p class="text-xs text-slate-400 italic ml-5 mb-1">No threads yet</p>`}

      <!-- Attention banner -->
      ${banner}

      <!-- Footer -->
      <div class="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-50">
        <div class="flex gap-3">
          ${p.vips?.length ? `<span>👤 ${p.vips.length}</span>` : ''}
          ${p.documents?.length ? `<span>📎 ${p.documents.length}</span>` : ''}
          ${p.tags?.length ? p.tags.slice(0,2).map(t=>`<span class="bg-slate-100 px-1.5 py-0.5 rounded-md">${esc(t)}</span>`).join('') : ''}
        </div>
        ${p.endDate ? `<span class="${_projectAttention(p)<=2?'text-red-500 font-semibold':''}">🗓 ${fmtDate(p.endDate)}</span>` : ''}
      </div>
    </div>`
  }).join('')
}

// ── Project modal (create / edit) ─────────────────────────────────────────────
function openProjectModal(id) {
  const p = id ? state.projects.find(x=>x.id===id) : null
  openModal(`
  <h3 class="text-base font-bold text-slate-900 mb-4">${p ? 'Edit Project' : 'New Project'}</h3>
  <div class="space-y-3">
    <div><label class="label">Project Name *</label>
      <input id="pm-name" type="text" value="${esc(p?.name)}" placeholder="e.g. NMR Protocol Study" class="input"/></div>
    <div><label class="label">Description</label>
      <textarea id="pm-desc" rows="2" placeholder="What is this project about?" class="input resize-none">${esc(p?.description)}</textarea></div>
    <div class="grid grid-cols-2 gap-3">
      <div><label class="label">Status</label>
        <select id="pm-status" class="input">
          ${['planning','active','on-hold','completed','archived'].map(s=>`<option value="${s}" ${p?.status===s?'selected':''}>${s==='on-hold'?'On Hold':s[0].toUpperCase()+s.slice(1)}</option>`).join('')}
        </select></div>
      <div><label class="label">Colour</label>
        <input id="pm-color" type="color" value="${p?.color||'#6366f1'}" class="h-9 w-full rounded-xl border border-slate-200 cursor-pointer px-1"/></div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div><label class="label">Start Date</label>
        <input id="pm-start" type="date" value="${p?.startDate||''}" class="input"/></div>
      <div><label class="label">Deadline</label>
        <input id="pm-end" type="date" value="${p?.endDate||''}" class="input"/></div>
    </div>
    <div><label class="label">Tags (comma separated)</label>
      <input id="pm-tags" type="text" value="${esc((p?.tags||[]).join(', '))}" placeholder="biology, grants, 2026" class="input"/></div>
    <div class="flex gap-3 pt-2">
      <button onclick="closeModal()" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="saveProject('${p?.id||''}')" class="flex-1 btn-primary">Save Project</button>
    </div>
  </div>`, false)
  setTimeout(()=>document.getElementById('pm-name')?.focus(),50)
}

function saveProject(id) {
  const name = document.getElementById('pm-name').value.trim()
  if (!name) { showToast('Project name required','error'); return }
  const existing = id ? state.projects.find(p=>p.id===id) : null
  const data = {
    id: id || uid(), name,
    description: document.getElementById('pm-desc').value.trim(),
    status:    document.getElementById('pm-status').value,
    color:     document.getElementById('pm-color').value,
    startDate: document.getElementById('pm-start').value,
    endDate:   document.getElementById('pm-end').value,
    tags:      document.getElementById('pm-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
    threads:   existing?.threads   || [],
    vips:      existing?.vips      || [],
    documents: existing?.documents || [],
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  if (id) { const i = state.projects.findIndex(p=>p.id===id); if(i>-1) state.projects[i]=data }
  else state.projects.push(data)
  save('projects'); closeModal(); renderProjectCards(_pFilter)
  showToast(id ? 'Project updated ✓' : 'Project created ✓')
}

// ── Project detail modal ──────────────────────────────────────────────────────
function openProjectDetail(id) {
  const p = state.projects.find(x=>x.id===id)
  if (!p) return
  const prog    = _calcProgress(p)
  const barColor = prog>=75?'#22c55e':prog>=40?(p.color||'#6366f1'):'#f59e0b'
  const banner  = _attentionBanner(p)

  openModal(`
  <div class="flex items-start justify-between gap-3 mb-1">
    <div class="flex items-center gap-2.5">
      <div class="w-4 h-4 rounded-full flex-shrink-0" style="background:${p.color||'#6366f1'}"></div>
      <h3 class="font-bold text-slate-900 text-lg leading-tight">${esc(p.name)}</h3>
    </div>
    ${statusBadge(p.status)}
  </div>
  ${p.description ? `<p class="text-slate-500 text-sm mb-3 ml-6">${esc(p.description)}</p>` : '<div class="mb-3"></div>'}

  ${banner ? banner+'<div class="mb-4"></div>' : ''}

  <!-- Dates + Progress -->
  <div class="grid grid-cols-3 gap-3 mb-4 text-sm">
    ${p.startDate ? `<div class="bg-slate-50 rounded-xl p-2.5"><div class="text-xs text-slate-400 mb-0.5">Started</div><div class="font-medium text-slate-700">${fmtDate(p.startDate)}</div></div>` : ''}
    ${p.endDate   ? `<div class="bg-slate-50 rounded-xl p-2.5"><div class="text-xs text-slate-400 mb-0.5">Deadline</div><div class="font-medium ${_projectAttention(p)<=2?'text-red-600':'text-slate-700'}">${fmtDate(p.endDate)}</div></div>` : ''}
    <div class="bg-slate-50 rounded-xl p-2.5">
    <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
      <span>Progress</span>
      ${p.progressOverride != null
        ? `<button onclick="projectClearOverride('${id}')" class="text-indigo-400 hover:text-indigo-600" title="Switch back to automatic (thread-based)">auto</button>`
        : `<button onclick="projectEnableOverride('${id}',${prog})" class="text-slate-400 hover:text-indigo-500" title="Set progress manually">manual</button>`}
    </div>
    ${p.progressOverride != null
      ? `<div class="flex items-center gap-2">
           <input type="range" min="0" max="100" value="${prog}"
             oninput="projectSetOverride('${id}',+this.value)"
             class="flex-1 accent-indigo-600" style="height:4px"/>
           <span class="text-xs font-semibold w-8 text-right">${prog}%</span>
         </div>`
      : `<div class="flex items-center gap-2">
           <div class="flex-1 bg-slate-200 rounded-full h-1.5">
             <div class="h-1.5 rounded-full" style="width:${prog}%;background:${barColor}"></div>
           </div>
           <span class="text-xs font-semibold">${prog}%</span>
         </div>`}
  </div>
  </div>

  <!-- ── Threads ─────────────────────────────────────────────────────────── -->
  <div class="mb-5">
    <div class="flex items-center justify-between mb-2.5">
      <span class="text-sm font-bold text-slate-800">🧵 Work Threads</span>
      <button onclick="addThread('${id}')" class="text-xs text-indigo-600 hover:underline font-medium">+ Add thread</button>
    </div>
    <div id="thread-list">${renderThreads(p)}</div>
  </div>

  <!-- ── VIPs ────────────────────────────────────────────────────────────── -->
  <div class="mb-5">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-bold text-slate-800">👤 Collaborators</span>
      <button onclick="addVip('${id}')" class="text-xs text-indigo-600 hover:underline font-medium">+ Add</button>
    </div>
    <div id="vip-list">${renderVips(p)}</div>
  </div>

  <!-- ── Documents ───────────────────────────────────────────────────────── -->
  <div class="mb-5">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-bold text-slate-800">📎 Documents &amp; Links</span>
      <button onclick="addDocument('${id}')" class="text-xs text-indigo-600 hover:underline font-medium">+ Add</button>
    </div>
    <div id="doc-list">${renderDocs(p)}</div>
  </div>

  <!-- ── Linked Tasks ──────────────────────────────────────────────────── -->
  <div class="mb-5">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-bold text-slate-800">✅ Tasks</span>
      <button onclick="createTaskForProject('${id}')" class="text-xs text-indigo-600 hover:underline font-medium">+ Create Task</button>
    </div>
    <div id="proj-task-list">${renderProjectTasks(id)}</div>
  </div>

  <!-- ── Linked Whiteboards ────────────────────────────────────────── -->
  ${(() => {
    const boards = (state.whiteboards||[]).filter(b => b.projectId === id)
    if (!boards.length) return ''
    return `<div class="mb-5">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-bold text-slate-800">🎨 Whiteboards</span>
        <button onclick="closeModal();showView('whiteboard')" class="text-xs text-slate-400 hover:text-indigo-600 font-medium">Open →</button>
      </div>
      <div class="space-y-1.5">
        ${boards.map(b=>`
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
          <span class="text-sm font-medium text-slate-800">🎨 ${esc(b.name)}</span>
          <button onclick="closeModal();wbLoadBoard('${b.id}');showView('whiteboard')"
            class="text-indigo-500 hover:text-indigo-700 text-xs font-medium">Open →</button>
        </div>`).join('')}
      </div>
    </div>`
  })()}

  <!-- ── Linked Notes ────────────────────────────────────────────────── -->
  <div class="mb-5">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-bold text-slate-800">📄 Notes</span>
      <div class="flex gap-3">
        <button onclick="createLinkedNote('${id}','project')" class="text-xs text-indigo-600 hover:underline font-medium">+ New</button>
        <button onclick="linkExistingNote('${id}','project')" class="text-xs text-slate-400 hover:text-slate-600 font-medium">+ Link existing</button>
      </div>
    </div>
    <div id="linked-notes-${id}">${renderLinkedNotes(id,'project')}</div>
  </div>

  ${p.tags?.length ? `<div class="flex gap-1 flex-wrap mb-4">${p.tags.map(t=>`<span class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">${esc(t)}</span>`).join('')}</div>` : ''}

  <div class="flex gap-3 border-t border-slate-100 pt-4">
    <button onclick="openProjectModal('${id}');void 0" class="flex-1 btn-secondary">✏️ Edit</button>
    <button onclick="duplicateProject('${id}')" class="btn-secondary">Duplicate</button>
    <button onclick="deleteProject('${id}')" class="btn-danger">Delete</button>
  </div>`, true)
}

// ── Threads ───────────────────────────────────────────────────────────────────
function renderThreads(p) {
  const threads = p.threads || []
  if (!threads.length) return `<p class="text-xs text-slate-400 italic py-1">No threads yet — add parallel lines of work (literature review, experiment A, writing, ...)</p>`
  return `<div class="space-y-2">` + threads.map((t,i) => {
    const sc = THREAD_STATUS[t.status] || THREAD_STATUS.active
    const waitingInfo = t.status === 'waiting' && t.waitingOn
      ? `<span class="text-xs text-amber-600 ml-1">← ${esc(t.waitingOn)}${t.waitingSince?' (since '+fmtDate(t.waitingSince)+')':''}</span>`
      : ''
    return `
    <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
      <button onclick="cycleThreadStatus('${p.id}','${t.id}')" title="Click to change status"
        class="mt-0.5 flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${sc.cls} cursor-pointer hover:opacity-80 transition-opacity">${sc.label}</button>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1 flex-wrap">
          <span class="text-sm font-medium text-slate-800">${esc(t.title)}</span>
          ${waitingInfo}
        </div>
        ${t.notes ? `<div class="text-xs text-slate-400 mt-0.5 line-clamp-1">${esc(t.notes)}</div>` : ''}
      </div>
      <div class="flex gap-1.5 flex-shrink-0">
        <button onclick="editThread('${p.id}','${t.id}')" class="text-slate-300 hover:text-indigo-500 text-xs">✏️</button>
        <button onclick="deleteThread('${p.id}','${t.id}')" class="text-slate-300 hover:text-red-500 text-xs">✕</button>
      </div>
    </div>`
  }).join('') + `</div>`
}

function addThread(projectId) {
  openModal(`
  <h3 class="text-base font-bold mb-4">Add Work Thread</h3>
  <div class="space-y-3">
    <div><label class="label">Thread name *</label>
      <input id="th-title" type="text" class="input" placeholder="e.g. Literature review, Protocol variant B, Writing introduction..."/></div>
    <div><label class="label">Status</label>
      <select id="th-status" class="input">
        <option value="active">Active — currently working on this</option>
        <option value="waiting">Waiting — blocked on someone/something external</option>
        <option value="blocked">Blocked — internal blocker, needs resolving</option>
        <option value="done">Done</option>
      </select></div>
    <div id="th-waiting-row" class="hidden">
      <label class="label">Waiting on (who / what?)</label>
      <input id="th-waitingOn" type="text" class="input" placeholder="e.g. Dr. Schmidt, Gel results, Ethics approval..."/>
      <div class="mt-2"><label class="label">Since</label>
        <input id="th-waitingSince" type="date" class="input" value="${new Date().toISOString().split('T')[0]}"/></div>
    </div>
    <div><label class="label">Notes (optional)</label>
      <textarea id="th-notes" rows="2" class="input resize-none" placeholder="Any extra context..."></textarea></div>
    <div class="flex gap-3 pt-2">
      <button onclick="openProjectDetail('${projectId}')" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="saveThread('${projectId}','')" class="flex-1 btn-primary">Add Thread</button>
    </div>
  </div>`)
  document.getElementById('th-status').addEventListener('change', function() {
    document.getElementById('th-waiting-row').classList.toggle('hidden', this.value !== 'waiting')
  })
  setTimeout(()=>document.getElementById('th-title')?.focus(),50)
}

function editThread(projectId, threadId) {
  const p = state.projects.find(x=>x.id===projectId)
  const t = (p?.threads||[]).find(x=>x.id===threadId)
  if (!t) return
  openModal(`
  <h3 class="text-base font-bold mb-4">Edit Thread</h3>
  <div class="space-y-3">
    <div><label class="label">Thread name *</label>
      <input id="th-title" type="text" value="${esc(t.title)}" class="input"/></div>
    <div><label class="label">Status</label>
      <select id="th-status" class="input">
        <option value="active"  ${t.status==='active' ?'selected':''}>Active</option>
        <option value="waiting" ${t.status==='waiting'?'selected':''}>Waiting</option>
        <option value="blocked" ${t.status==='blocked'?'selected':''}>Blocked</option>
        <option value="done"    ${t.status==='done'   ?'selected':''}>Done</option>
      </select></div>
    <div id="th-waiting-row" class="${t.status!=='waiting'?'hidden':''}">
      <label class="label">Waiting on</label>
      <input id="th-waitingOn" type="text" value="${esc(t.waitingOn||'')}" class="input" placeholder="Dr. Schmidt, Ethics approval..."/>
      <div class="mt-2"><label class="label">Since</label>
        <input id="th-waitingSince" type="date" value="${t.waitingSince||''}" class="input"/></div>
    </div>
    <div><label class="label">Notes</label>
      <textarea id="th-notes" rows="2" class="input resize-none">${esc(t.notes||'')}</textarea></div>
    <div class="flex gap-3 pt-2">
      <button onclick="openProjectDetail('${projectId}')" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="saveThread('${projectId}','${threadId}')" class="flex-1 btn-primary">Save</button>
    </div>
  </div>`)
  document.getElementById('th-status').addEventListener('change', function() {
    document.getElementById('th-waiting-row').classList.toggle('hidden', this.value !== 'waiting')
  })
}

function saveThread(projectId, threadId) {
  const title = document.getElementById('th-title').value.trim()
  if (!title) { showToast('Thread name required','error'); return }
  const p = state.projects.find(x=>x.id===projectId)
  if (!p) return
  if (!p.threads) p.threads = []
  const status = document.getElementById('th-status').value
  const thread = {
    id:           threadId || uid(),
    title,
    status,
    waitingOn:    status==='waiting' ? (document.getElementById('th-waitingOn')?.value.trim()||'') : '',
    waitingSince: status==='waiting' ? (document.getElementById('th-waitingSince')?.value||'') : '',
    notes:        document.getElementById('th-notes').value.trim()
  }
  if (threadId) {
    const i = p.threads.findIndex(t=>t.id===threadId)
    if (i>-1) p.threads[i]=thread
  } else {
    p.threads.push(thread)
  }
  p.updatedAt = new Date().toISOString()
  save('projects'); openProjectDetail(projectId)
  showToast(threadId ? 'Thread updated ✓' : 'Thread added ✓')
}

function cycleThreadStatus(projectId, threadId) {
  const p = state.projects.find(x=>x.id===projectId)
  const t = (p?.threads||[]).find(x=>x.id===threadId)
  if (!t) return
  const order = ['active','waiting','blocked','done']
  const next = order[(order.indexOf(t.status)+1) % order.length]
  if (next === 'waiting') { editThread(projectId, threadId); return } // needs waitingOn details
  t.status = next
  if (next !== 'waiting') { t.waitingOn = ''; t.waitingSince = '' }
  p.updatedAt = new Date().toISOString()
  save('projects')
  // Refresh thread list in place
  const el = document.getElementById('thread-list')
  if (el) el.innerHTML = renderThreads(p)
  renderProjectCards(_pFilter)
}

function deleteThread(projectId, threadId) {
  const p = state.projects.find(x=>x.id===projectId)
  if (!p) return
  p.threads = (p.threads||[]).filter(t=>t.id!==threadId)
  p.updatedAt = new Date().toISOString()
  save('projects')
  const el = document.getElementById('thread-list')
  if (el) el.innerHTML = renderThreads(p)
  renderProjectCards(_pFilter)
}

// ── VIPs ──────────────────────────────────────────────────────────────────────
function renderVips(p) {
  if (!p.vips?.length) return `<p class="text-xs text-slate-400 italic">No collaborators added</p>`
  return p.vips.map((v,i) => `
  <div class="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
    <div>
      <span class="text-sm font-medium text-slate-800">${esc(v.name)}</span>
      ${v.role ? `<span class="text-xs text-slate-400 ml-2">${esc(v.role)}</span>` : ''}
    </div>
    <div class="flex items-center gap-2">
      ${v.email ? `<span class="text-xs text-indigo-500 cursor-pointer hover:underline" onclick="event.stopPropagation()">${esc(v.email)}</span>` : ''}
      <button onclick="removeVip('${p.id}',${i})" class="text-red-400 hover:text-red-600 text-xs">✕</button>
    </div>
  </div>`).join('')
}

function addVip(projectId) {
  openModal(`
  <h3 class="text-base font-bold mb-4">Add Collaborator</h3>
  <div class="space-y-3">
    <div><label class="label">Name *</label><input id="vip-name" type="text" class="input" placeholder="Dr. Alice Chen"/></div>
    <div><label class="label">Role</label><input id="vip-role" type="text" class="input" placeholder="Supervisor, Co-author, Reviewer..."/></div>
    <div><label class="label">Email</label><input id="vip-email" type="email" class="input"/></div>
    <div class="flex gap-3 pt-2">
      <button onclick="openProjectDetail('${projectId}')" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="saveVip('${projectId}')" class="flex-1 btn-primary">Add</button>
    </div>
  </div>`)
  setTimeout(()=>document.getElementById('vip-name')?.focus(),50)
}

function saveVip(projectId) {
  const name = document.getElementById('vip-name').value.trim()
  if (!name) { showToast('Name required','error'); return }
  const p = state.projects.find(x=>x.id===projectId)
  if (!p) return
  if (!p.vips) p.vips = []
  p.vips.push({ name, role: document.getElementById('vip-role').value.trim(), email: document.getElementById('vip-email').value.trim() })
  p.updatedAt = new Date().toISOString()
  save('projects'); openProjectDetail(projectId)
  showToast('Collaborator added ✓')
}

function removeVip(projectId, index) {
  const p = state.projects.find(x=>x.id===projectId)
  if (!p) return
  p.vips.splice(index,1); save('projects'); openProjectDetail(projectId)
}

// ── Documents ─────────────────────────────────────────────────────────────────
function renderDocs(p) {
  if (!p.documents?.length) return `<p class="text-xs text-slate-400 italic">No documents linked</p>`
  return p.documents.map((d,i) => `
  <div class="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
    <span class="text-sm text-slate-700">${esc(d.name)}</span>
    <div class="flex gap-2 items-center">
      ${d.url ? `<button onclick="window.api.openExternal('${esc(d.url)}')" class="text-xs text-indigo-500 hover:underline">Open ↗</button>` : ''}
      <button onclick="removeDoc('${p.id}',${i})" class="text-red-400 hover:text-red-600 text-xs">✕</button>
    </div>
  </div>`).join('')
}

function addDocument(projectId) {
  openModal(`
  <h3 class="text-base font-bold mb-4">Add Document / Link</h3>
  <div class="space-y-3">
    <div><label class="label">Name *</label><input id="doc-name" type="text" class="input" placeholder="Protocol v2, Draft manuscript, Data folder..."/></div>
    <div><label class="label">URL / Link</label><input id="doc-url" type="url" class="input" placeholder="https://..."/></div>
    <div><label class="label">Local path</label><input id="doc-path" type="text" class="input" placeholder="C:\Research\..."/></div>
    <div class="flex gap-3 pt-2">
      <button onclick="openProjectDetail('${projectId}')" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="saveDoc('${projectId}')" class="flex-1 btn-primary">Add</button>
    </div>
  </div>`)
  setTimeout(()=>document.getElementById('doc-name')?.focus(),50)
}

function saveDoc(projectId) {
  const name = document.getElementById('doc-name').value.trim()
  if (!name) { showToast('Name required','error'); return }
  const p = state.projects.find(x=>x.id===projectId)
  if (!p) return
  if (!p.documents) p.documents = []
  p.documents.push({ name, url: document.getElementById('doc-url').value.trim(), folderPath: document.getElementById('doc-path').value.trim() })
  save('projects'); openProjectDetail(projectId)
  showToast('Document added ✓')
}

function removeDoc(projectId, index) {
  const p = state.projects.find(x=>x.id===projectId)
  if (!p) return
  p.documents.splice(index,1); save('projects'); openProjectDetail(projectId)
}

// ── Linked Tasks ──────────────────────────────────────────────────────────────
function renderProjectTasks(projectId) {
  const tasks = (state.todos||[]).filter(t => t.projectId === projectId && !t.completedAt)
  if (!tasks.length) return `<p class="text-xs text-slate-400 italic">No open tasks linked to this project</p>`
  return `<div class="space-y-1">` + tasks.map(t => {
    const overdue = t.dueDate && t.dueDate < new Date().toISOString().split('T')[0]
    return `<div class="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
      <input type="checkbox" onchange="todoToggle('${t.id}');setTimeout(()=>{document.getElementById('proj-task-list').innerHTML=renderProjectTasks('${projectId}')},150)"
        class="rounded accent-indigo-600 flex-shrink-0"/>
      <span class="flex-1 text-sm text-slate-700 truncate">${esc(t.title)}</span>
      ${t.dueDate ? `<span class="text-xs flex-shrink-0 ${overdue?'text-red-500 font-semibold':'text-slate-400'}">${fmtDate(t.dueDate)}</span>` : ''}
    </div>`
  }).join('') + `</div>`
}

function createTaskForProject(projectId) {
  window._pendingTaskProjectId = projectId
  openTodoModal(null)
}

// ── Duplicate ─────────────────────────────────────────────────────────────────
function duplicateProject(id) {
  const p = state.projects.find(x=>x.id===id)
  if (!p) return
  const copy = JSON.parse(JSON.stringify(p))
  copy.id        = uid()
  copy.name      = `Copy of ${p.name}`
  copy.createdAt = new Date().toISOString()
  copy.updatedAt = new Date().toISOString()
  // Give threads fresh IDs so they don't collide
  ;(copy.threads||[]).forEach(t => { t.id = uid() })
  state.projects.push(copy)
  save('projects')
  closeModal()
  renderProjectCards(_pFilter)
  showToast(`"${copy.name}" created ✓`)
}

// ── Share Modal ───────────────────────────────────────────────────────────────
async function openProjectShareModal(projectId) {
  const p = state.projects.find(x => x.id === projectId)
  if (!p) return

  const notesCount      = (state.notes       || []).filter(x => x.projectId === projectId || (x.projectIds||[]).includes(projectId)).length
  const todosCount      = (state.todos        || []).filter(x => x.projectId === projectId).length
  const papersCount     = (state.papers       || []).filter(x => (x.projectIds||[]).includes(projectId)).length
  const grantsCount     = (state.grants       || []).filter(x => x.linkedProjectId === projectId).length
  const whiteboardCount = (state.whiteboards  || []).filter(x => x.projectId === projectId).length

  const row = (id, label, count) => count > 0 ? `
  <label class="flex items-center gap-2 text-xs cursor-pointer select-none text-slate-600">
    <input type="checkbox" class="share-include accent-indigo-600" data-key="${id}" checked/>
    <span>${label} <span class="text-slate-400">(${count})</span></span>
  </label>` : ''

  openModal(`
  <h3 class="text-base font-bold text-slate-900 mb-1">📦 Share Project</h3>
  <p class="text-xs text-slate-400 mb-4">"${esc(p.name)}"</p>

  <div class="mb-4">
    <div class="text-xs font-semibold text-slate-600 mb-2">Include with the project:</div>
    <div class="space-y-2 pl-1">
      ${row('notes', '📄 Notes', notesCount)}
      ${row('todos', '✅ Tasks', todosCount)}
      ${row('papers', '📚 Papers', papersCount)}
      ${row('grants', '💰 Grants', grantsCount)}
      ${row('whiteboards', '🖊 Whiteboards', whiteboardCount)}
      ${(!notesCount && !todosCount && !papersCount && !grantsCount && !whiteboardCount)
        ? '<p class="text-xs text-slate-400 italic">No linked data found — only the project itself will be bundled.</p>' : ''}
    </div>
  </div>

  <div class="text-xs font-semibold text-slate-600 mb-2">Export as:</div>
  <div class="flex flex-col gap-2">
    <button onclick="shareProjectToFile('${projectId}')" class="btn-primary text-xs py-2.5 px-4 text-left flex items-center gap-2">
      <span class="text-base">💾</span>
      <div>
        <div class="font-semibold">Save to file (.phdflow)</div>
        <div class="font-normal text-indigo-200">Share via email, USB, or cloud storage</div>
      </div>
    </button>
    <button onclick="shareProjectToSyncFolder('${projectId}')" class="btn-secondary text-xs py-2.5 px-4 text-left flex items-center gap-2">
      <span class="text-base">☁</span>
      <div>
        <div class="font-semibold">Write to sync folder</div>
        <div class="font-normal text-slate-400">Collaborators with folder access get it automatically</div>
      </div>
    </button>
    <button onclick="shareProjectToLan('${projectId}')" class="btn-secondary text-xs py-2.5 px-4 text-left flex items-center gap-2">
      <span class="text-base">📡</span>
      <div>
        <div class="font-semibold">Send over local network</div>
        <div class="font-normal text-slate-400">Push directly to a colleague on the same Wi-Fi</div>
      </div>
    </button>
  </div>
  <div id="proj-share-status" class="mt-3 text-xs text-slate-400"></div>`)
}

function _getShareIncludes() {
  const includes = {}
  document.querySelectorAll('.share-include').forEach(cb => { includes[cb.dataset.key] = cb.checked })
  return includes
}

async function shareProjectToFile(projectId) {
  const p = state.projects.find(x => x.id === projectId)
  const dest = await api.openBundleSaveDialog(`phdflow-${(p?.name||'project').replace(/\s+/g,'-').toLowerCase()}-${new Date().toISOString().slice(0,10)}`)
  if (!dest) return
  const el = document.getElementById('proj-share-status')
  if (el) el.innerHTML = `<span class="text-slate-400">Building bundle…</span>`
  const r = await api.bundleExportProject({ projectId, include: _getShareIncludes(), dest })
  if (!el) return
  el.innerHTML = r.success
    ? `<span class="text-emerald-600 font-semibold">✓ Bundle saved — ${Object.entries(r.summary).filter(([,v])=>v>0).map(([k,v])=>`${v} ${k}`).join(', ')}</span>`
    : `<span class="text-rose-500">✕ ${esc(r.error)}</span>`
}

async function shareProjectToSyncFolder(projectId) {
  const cfg = await api.syncGetConfig()
  const el  = document.getElementById('proj-share-status')
  if (!cfg?.enabled || !cfg?.folder) {
    if (el) el.innerHTML = `<span class="text-amber-600">Sync folder not set up — go to Settings → Share & Sync → Folder Sync</span>`
    return
  }
  const p    = state.projects.find(x => x.id === projectId)
  const dest = [cfg.folder, `phdflow-project-${projectId.slice(0,8)}.phdflow`].join('\\').replace(/\\\\/g,'\\')
  if (el) el.innerHTML = `<span class="text-slate-400">Building bundle…</span>`
  const r = await api.bundleExportProject({ projectId, include: _getShareIncludes(), dest })
  if (el) el.innerHTML = r.success
    ? `<span class="text-emerald-600 font-semibold">✓ Written to sync folder — collaborators will see it shortly</span>`
    : `<span class="text-rose-500">✕ ${esc(r.error)}</span>`
}

async function shareProjectToLan(projectId) {
  const peers = await api.lanGetPeers()
  const el    = document.getElementById('proj-share-status')
  if (!peers.length) {
    if (el) el.innerHTML = `<span class="text-amber-600">No peers online — go to Settings → Share & Sync → Local Network and start discovery first</span>`
    return
  }
  const peer    = peers[0]
  const p       = state.projects.find(x => x.id === projectId)
  const dataDir = await api.getDataDir()
  if (!dataDir) { if (el) el.innerHTML = `<span class="text-rose-500">✕ Could not get data directory</span>`; return }
  const dest = `${dataDir}\\lan-project-${projectId.slice(0,8)}.phdflow`
  if (el) el.innerHTML = `<span class="text-slate-400">Sending to ${esc(peer.name)}…</span>`
  const exportResult = await api.bundleExportProject({ projectId, include: _getShareIncludes(), dest })
  if (!exportResult.success) { if (el) el.innerHTML = `<span class="text-rose-500">✕ ${esc(exportResult.error)}</span>`; return }
  const readResult = await api.bundleRead(dest)
  if (!readResult.success) { if (el) el.innerHTML = `<span class="text-rose-500">✕ ${esc(readResult.error)}</span>`; return }
  const r = await api.lanSendBundle({ targetIp: peer.ip, bundleData: readResult.bundle })
  if (el) el.innerHTML = r.success
    ? `<span class="text-emerald-600 font-semibold">✓ Project sent to ${esc(peer.name)}</span>`
    : `<span class="text-rose-500">✕ ${esc(r.error)}</span>`
}

// ── Progress override ─────────────────────────────────────────────────────────
function projectEnableOverride(id, current) {
  const p = state.projects.find(x=>x.id===id); if(!p) return
  p.progressOverride = current; save('projects'); openProjectDetail(id)
}
function projectSetOverride(id, val) {
  const p = state.projects.find(x=>x.id===id); if(!p) return
  p.progressOverride = val; save('projects')
  const bar = document.querySelector(`#modal-content .flex-1.bg-slate-200.rounded-full`)
  const lbl = document.querySelector(`#modal-content .text-xs.font-semibold.w-8`)
  if (bar?.children[0]) bar.children[0].style.width = val+'%'
  if (lbl) lbl.textContent = val+'%'
}
function projectClearOverride(id) {
  const p = state.projects.find(x=>x.id===id); if(!p) return
  delete p.progressOverride; save('projects'); openProjectDetail(id)
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function deleteProject(id) {
  const snap  = [...state.projects]
  const name  = state.projects.find(p=>p.id===id)?.name || 'Project'
  state.projects = state.projects.filter(p=>p.id!==id)
  save('projects'); closeModal(); renderProjectCards(_pFilter)
  showUndoToast(`"${name}" deleted`, () => {
    state.projects = snap
    save('projects'); renderProjectCards(_pFilter); showToast('Project restored ✓')
  })
}
