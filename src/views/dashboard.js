// ══ Dashboard View ════════════════════════════════════════════════════════════

// Dashboard background — cached at startup and on every settings change
let _dashBg = null
api.storeGet('dashBg').then(v => { _dashBg = v || null }).catch(() => {})
function _dashBgSet(v) { _dashBg = v || null }

function render_dashboard() {
  const vc = document.getElementById('view-content')
  const now   = new Date()
  const today = now.toISOString().split('T')[0]
  const in14  = new Date(now.getTime() + 14 * 864e5).toISOString().split('T')[0]
  const in30  = new Date(now.getTime() + 30 * 864e5).toISOString().split('T')[0]
  const name  = state.profile?.name?.split(' ')[0] || 'Researcher'
  const hour  = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  // ── Data slices ──────────────────────────────────────────────────────────────
  const upcoming = [...state.events]
    .filter(e => e.date >= today)
    .sort((a,b) => a.date.localeCompare(b.date))
    .slice(0,7)

  const overdueTodos = state.todos
    .filter(t => t.status !== 'done' && t.dueDate && t.dueDate < today)
    .sort((a,b) => a.dueDate.localeCompare(b.dueDate))

  const dueSoonTodos = state.todos
    .filter(t => t.status !== 'done' && t.dueDate && t.dueDate >= today && t.dueDate <= in14)
    .sort((a,b) => {
      if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate)
      const p = {high:0,medium:1,low:2}; return (p[a.priority]||2)-(p[b.priority]||2)
    })

  const activeProjects = state.projects
    .filter(p => p.status === 'active' || p.status === 'planning')
    .slice(0, 4)

  const openGrants = state.grants
    .filter(g => g.status !== 'awarded' && g.status !== 'rejected')
    .sort((a,b) => {
      if (!a.deadline && !b.deadline) return 0
      if (!a.deadline) return 1; if (!b.deadline) return -1
      return a.deadline.localeCompare(b.deadline)
    })
    .slice(0, 4)

  const recentPapers = [...state.papers]
    .sort((a,b) => (b.addedAt||'').localeCompare(a.addedAt||''))
    .slice(0, 4)

  // ── Derived counts ───────────────────────────────────────────────────────────
  const overdueCount = overdueTodos.length

  // Today's progress
  const todayFocusTasks = state.todos.filter(t =>
    t.status !== 'done' && !t.completedAt && (t.todayFlag || t.dueDate === today)
  )
  const completedTodayTasks = state.todos.filter(t =>
    t.completedAt && t.completedAt.startsWith(today)
  )
  const totalTodayCount = todayFocusTasks.length + completedTodayTasks.length
  const progressPct     = totalTodayCount ? Math.round(completedTodayTasks.length / totalTodayCount * 100) : 0
  const progressColor   = progressPct >= 80 ? '#22c55e' : progressPct >= 40 ? '#6366f1' : '#f59e0b'

  const wgt = state.profile?.dashboardWidgets || {}
  const wShow = id => wgt[id] !== false

  // ── Layout (drag-and-drop order) ────────────────────────────────────────────
  const _defaultLayout = { left:['events','projects'], right:['tasks','grants','papers'] }
  const layout = state.profile?.dashboardLayout || _defaultLayout
  const leftIds  = layout.left  || _defaultLayout.left
  const rightIds = layout.right || _defaultLayout.right

  vc.innerHTML = `
  <div class="flex-1 overflow-y-auto bg-slate-50">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div id="dash-header" class="border-b border-slate-200 px-6 py-5 relative overflow-hidden
      ${_dashBg ? '' : 'bg-white'}"
      style="${_dashBg ? `background:linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.55)),url(${_dashBg}) center/cover no-repeat;` : ''}">
      <div class="flex items-end justify-between gap-6 relative z-10">
        <div class="flex-1 min-w-0">
          <p class="text-xs ${_dashBg ? 'text-white/70' : 'text-slate-400'} mb-0.5">${dateStr}</p>
          <h1 class="text-xl font-bold ${_dashBg ? 'text-white' : 'text-slate-900'}">${greeting}, ${esc(name)} 👋</h1>
          ${overdueCount > 0
            ? `<p class="text-xs ${_dashBg?'text-red-300':'text-red-600'} mt-1 font-medium">⚠️ You have ${overdueCount} overdue task${overdueCount>1?'s':''}</p>`
            : `<p class="text-xs ${_dashBg?'text-white/60':'text-slate-400'} mt-1">Here's your research overview for today</p>`}
          ${(() => {
            const p = state.profile || {}
            if (!p.phdStart || !p.phdEnd) return ''
            const start = new Date(p.phdStart), end = new Date(p.phdEnd), now = new Date()
            const pct  = Math.round(Math.max(0, Math.min(1, (now-start)/(end-start))) * 100)
            const days = Math.round((end-now)/86400000)
            const col  = pct >= 75 ? '#f59e0b' : '#6366f1'
            return `<div class="flex items-center gap-2 mt-1.5">
              <div class="w-24 bg-slate-100/40 rounded-full h-1.5 overflow-hidden flex-shrink-0">
                <div class="h-1.5 rounded-full" style="width:${pct}%;background:${col}"></div>
              </div>
              <span class="text-xs ${_dashBg?'text-white/70':'text-slate-400'}">PhD ${pct}%${days>0?' · '+days+'d left':' · submitted!'}</span>
            </div>`
          })()}
        </div>
        ${totalTodayCount > 0 ? `
        <div class="flex-shrink-0 min-w-[160px] cursor-pointer" onclick="showView('todos')">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-semibold ${_dashBg?'text-white/90':'text-slate-700'}">Today's Tasks</span>
            <span class="text-xs font-bold" style="color:${progressColor}">${completedTodayTasks.length}/${totalTodayCount}</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2">
            <div class="h-2 rounded-full transition-all" style="width:${progressPct}%;background:${progressColor}"></div>
          </div>
          ${progressPct === 100
            ? `<p class="text-xs text-green-600 font-medium mt-1 text-right">All done! 🎉</p>`
            : `<p class="text-xs text-slate-400 mt-1 text-right">${100-progressPct}% remaining</p>`}
        </div>` : `<button onclick="showView('calendar')" class="text-xs text-indigo-600 hover:underline flex-shrink-0">Open Calendar →</button>`}
      </div>

    </div>

    <!-- ── AI Engine prompt (shown only when not set up) ─────────────────── -->
    ${!_aiAvailable() ? `
    <div id="dash-ai-banner" class="mx-6 mt-4 border rounded-2xl px-5 py-4 flex items-center gap-4">
      <div class="text-2xl flex-shrink-0">✨</div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold" id="dash-ai-banner-title">Activate AI features</p>
        <p class="text-xs mt-0.5" id="dash-ai-banner-desc">Paper summaries · Grant writing · Smart researcher search · Feed ranking — all free, runs on your machine.</p>
      </div>
      <button onclick="showView('settings');setTimeout(()=>settingsTab('app'),100)"
        class="flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors">
        Set up →
      </button>
    </div>` : ''}

    <!-- ── Main Grid ────────────────────────────────────────────────────────── -->
    <div class="p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">

      <!-- LEFT COLUMN -->
      <div id="dash-col-left" class="space-y-3"
        ondragover="dashColOver(event,'left')" ondrop="dashColDrop(event,'left')" ondragleave="dashColLeave(event,'left')">
        ${leftIds.filter(id => wShow(id)).map(id => _dashWrapWidget(id, _dashWidgetHTML(id, {now,upcoming,activeProjects,openGrants,recentPapers,todayFocusTasks,overdueTodos,dueSoonTodos}))).join('')}
      </div>

      <!-- RIGHT COLUMN -->
      <div id="dash-col-right" class="space-y-3"
        ondragover="dashColOver(event,'right')" ondrop="dashColDrop(event,'right')" ondragleave="dashColLeave(event,'right')">
        ${rightIds.filter(id => wShow(id)).map(id => _dashWrapWidget(id, _dashWidgetHTML(id, {now,upcoming,activeProjects,openGrants,recentPapers,todayFocusTasks,overdueTodos,dueSoonTodos}))).join('')}
      </div>
    </div>
  </div>`

  // Populate the task widget (todos.js must be loaded first)
  if (typeof renderTodosWidget === 'function') renderTodosWidget('dash-todos-widget')

  // Floating quick-add button
  const fab = document.createElement('div')
  fab.id = 'dash-fab'
  fab.innerHTML = `
  <div style="position:fixed;bottom:1.5rem;right:1.5rem;z-index:100">
    <div id="dash-fab-menu" style="display:none;flex-direction:column;position:absolute;bottom:3.25rem;right:0;background:#fff;border:1px solid #e2e8f0;border-radius:.875rem;box-shadow:0 10px 40px rgba(0,0,0,.14);padding:.375rem;min-width:160px">
      ${[
        ['📌 New Task',    `openTodoModal(null,null,true);document.getElementById('dash-fab-menu').style.display='none'`],
        ['📄 New Note',    `newNote('note');document.getElementById('dash-fab-menu').style.display='none'`],
        ['📋 New Project', `showView('projects');setTimeout(()=>openProjectModal&&openProjectModal(),150);document.getElementById('dash-fab-menu').style.display='none'`],
        ['📚 Add Paper',   `showView('library');document.getElementById('dash-fab-menu').style.display='none'`],
      ].map(([label, action]) => `
      <button onclick="${action}" style="display:block;width:100%;text-align:left;padding:.5rem .75rem;border:none;background:none;border-radius:.5rem;font-size:.8rem;color:#374151;cursor:pointer;transition:background .12s"
        onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">${label}</button>`).join('')}
    </div>
    <button id="dash-fab-btn" onclick="
      const m=document.getElementById('dash-fab-menu');
      m.style.display=m.style.display==='none'?'flex':'none'"
      style="height:2.75rem;background:#4f46e5;color:#fff;border:none;border-radius:9999px;cursor:pointer;
        box-shadow:0 4px 20px rgba(79,70,229,.4);display:flex;align-items:center;gap:.5rem;
        padding:0 1.125rem;transition:background .15s;white-space:nowrap"
      onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'"
      title="Quick add">
      <span style="font-size:1.25rem;line-height:1;margin-top:-1px">+</span>
      <span style="font-size:.8rem;font-weight:600;letter-spacing:.01em">Quick add</span>
    </button>
  </div>`
  vc.appendChild(fab)
  document.addEventListener('click', e => {
    if (!e.target.closest('#dash-fab')) document.getElementById('dash-fab-menu')?.style && (document.getElementById('dash-fab-menu').style.display = 'none')
  }, { once: false, capture: true })
}

// ══ Widget HTML generators ════════════════════════════════════════════════════

function _dashWrapWidget(id, inner) {
  if (!inner) return ''
  return `<div data-widget="${id}" draggable="true"
    ondragstart="dashDragStart(event,'${id}')"
    ondragover="dashDragOver(event,'${id}')"
    ondrop="dashDrop(event,'${id}')"
    ondragend="dashDragEnd(event)"
    class="relative group rounded-2xl transition-all duration-150"
    style="cursor:default">
    <!-- Drag handle -->
    <div class="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-60 transition-opacity select-none pointer-events-none
      text-slate-400 text-base leading-none" title="Drag to reorder">⠿</div>
    ${inner}
  </div>`
}

function _dashWidgetHTML(id, data) {
  const { now, upcoming, activeProjects, openGrants, recentPapers } = data

  if (id === 'events') return `
  <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800">📅 Upcoming Events &amp; Deadlines</h3>
      <button onclick="showView('calendar')" class="text-xs text-indigo-500 hover:underline">View calendar →</button>
    </div>
    ${upcoming.length === 0
      ? `<div class="px-5 py-8 text-center text-slate-400 text-sm">No upcoming events.<br/><button onclick="showView('calendar')" class="text-indigo-500 hover:underline mt-1">Add one →</button></div>`
      : `<div class="divide-y divide-slate-50">${upcoming.map(e => {
          const daysAway = Math.round((new Date(e.date) - now) / 864e5)
          const when = daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway}d`
          const urgent = daysAway <= 2
          const typeColors = {milestone:'bg-indigo-100 text-indigo-700',deadline:'bg-red-100 text-red-700',meeting:'bg-blue-100 text-blue-700',course:'bg-green-100 text-green-700',exam:'bg-orange-100 text-orange-700'}
          const chip = typeColors[e.type] || 'bg-slate-100 text-slate-600'
          return `<div class="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
            <div class="text-center min-w-[2.5rem]">
              <div class="text-xs font-bold ${urgent?'text-red-600':'text-indigo-600'}">${when}</div>
              <div class="text-xs text-slate-400">${new Date(e.date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-slate-800 truncate">${esc(e.title)}</div>
              ${e.description?`<div class="text-xs text-slate-400 truncate">${esc(e.description)}</div>`:''}
            </div>
            <span class="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${chip}">${e.type||'event'}</span>
          </div>`
        }).join('')}</div>`}
  </div>`

  if (id === 'projects') return `
  <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800">📋 Active Projects</h3>
      <button onclick="showView('projects')" class="text-xs text-indigo-500 hover:underline">All projects →</button>
    </div>
    ${activeProjects.length === 0
      ? `<div class="px-5 py-8 text-center text-slate-400 text-sm">No active projects.<br/><button onclick="showView('projects')" class="text-indigo-500 hover:underline mt-1">Create one →</button></div>`
      : `<div class="divide-y divide-slate-50">${activeProjects.map(p => {
          const prog = p.progress||0
          const barColor = prog>=75?'bg-green-500':prog>=40?'bg-indigo-500':'bg-amber-400'
          return `<div class="px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer" onclick="showView('projects')">
            <div class="flex items-center gap-2 mb-1.5">
              <div class="w-2 h-2 rounded-full flex-shrink-0" style="background:${p.color||'#6366f1'}"></div>
              <span class="text-sm font-medium text-slate-800 flex-1 truncate">${esc(p.name)}</span>
              ${statusBadge(p.status)}
            </div>
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-slate-100 rounded-full h-1.5"><div class="h-1.5 rounded-full ${barColor}" style="width:${prog}%"></div></div>
              <span class="text-xs text-slate-400 flex-shrink-0">${prog}%</span>
            </div>
          </div>`
        }).join('')}</div>`}
  </div>`

  if (id === 'tasks') return `
  <div class="bg-white rounded-2xl border border-slate-200 px-5 py-4" id="dash-todos-widget"></div>`

  if (id === 'grants') {
    const grantRows = openGrants.map(g => {
      const sc = ({researching:'bg-slate-100 text-slate-600',drafting:'bg-amber-100 text-amber-700',submitted:'bg-blue-100 text-blue-700'})[g.status]||'bg-slate-100 text-slate-600'
      let dlHtml = ''
      if (g.deadline) {
        const d = Math.round((new Date(g.deadline)-now)/864e5)
        dlHtml = `<span class="text-xs ${d<0?'text-red-500':d<=14?'text-amber-600':'text-slate-400'}">${d<0?Math.abs(d)+'d ago':d===0?'Today!':d+'d left'}</span>`
      }
      return `<div class="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer" onclick="showView('grants')">
        <div class="flex-1 min-w-0"><div class="text-sm font-medium text-slate-800 truncate">${esc(g.title)}</div><div class="text-xs text-slate-400 truncate">${esc(g.agency||'')}</div></div>
        <div class="flex items-center gap-2 flex-shrink-0">${dlHtml}<span class="text-xs px-2 py-0.5 rounded-full ${sc}">${g.status||'researching'}</span></div>
      </div>`
    }).join('')
    return `<div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="text-sm font-bold text-slate-800">✍️ Grant Pipeline</h3>
        <button onclick="showView('grants')" class="text-xs text-indigo-500 hover:underline">All grants →</button>
      </div>
      ${openGrants.length===0?`<div class="px-5 py-8 text-center text-slate-400 text-sm">No active grant applications.<br/><button onclick="showView('grants')" class="text-indigo-500 hover:underline mt-1">Track one →</button></div>`:`<div class="divide-y divide-slate-50">${grantRows}</div>`}
    </div>`
  }

  if (id === 'papers') return recentPapers.length === 0 ? '' : `
  <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800">📚 Recently Added Papers</h3>
      <button onclick="showView('library')" class="text-xs text-indigo-500 hover:underline">Library →</button>
    </div>
    <div class="divide-y divide-slate-50">${recentPapers.map(p=>`
      <div class="px-5 py-3 flex items-start gap-3 hover:bg-slate-50 cursor-pointer" onclick="showView('library')">
        <div class="flex-1 min-w-0"><div class="text-sm font-medium text-slate-800 line-clamp-1">${esc(p.title||'Untitled')}</div><div class="text-xs text-slate-400 mt-0.5">${esc(p.authors||'')}${p.year?' · '+p.year:''}</div></div>
        ${p.status?`<span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex-shrink-0">${p.status}</span>`:''}
      </div>`).join('')}
    </div>
  </div>`

  return ''
}

// ══ Dashboard drag-and-drop ═══════════════════════════════════════════════════

let _dashDragId   = null
let _dashDragCol  = null

function dashDragStart(e, id) {
  _dashDragId  = id
  _dashDragCol = e.currentTarget.closest('[id^="dash-col"]')?.id === 'dash-col-left' ? 'left' : 'right'
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', id)
  setTimeout(() => { if (e.target) e.target.style.opacity = '0.4' }, 0)
}

function dashDragEnd(e) {
  if (e.target) e.target.style.opacity = ''
  document.querySelectorAll('[data-widget]').forEach(el => {
    el.style.borderTop = ''; el.style.borderBottom = ''
  })
  document.querySelectorAll('[id^="dash-col-"]').forEach(el => el.style.outline = '')
  _dashDragId = null; _dashDragCol = null
}

function dashDragOver(e, targetId) {
  e.preventDefault()
  e.stopPropagation()
  e.dataTransfer.dropEffect = 'move'
  if (!_dashDragId || _dashDragId === targetId) return
  document.querySelectorAll('[data-widget]').forEach(el => { el.style.borderTop=''; el.style.borderBottom='' })
  const el = document.querySelector(`[data-widget="${targetId}"]`)
  if (!el) return
  const rect = el.getBoundingClientRect()
  if (e.clientY < rect.top + rect.height/2) el.style.borderTop = '2px solid #6366f1'
  else el.style.borderBottom = '2px solid #6366f1'
}

function dashColOver(e, col) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  const el = document.getElementById('dash-col-'+col)
  if (el && !el.querySelector(`[data-widget="${_dashDragId}"]`)) {
    el.style.outline = '2px dashed #6366f120'
  }
}

function dashColLeave(e, col) {
  document.getElementById('dash-col-'+col)?.style && (document.getElementById('dash-col-'+col).style.outline = '')
}

function dashDrop(e, targetId) {
  e.preventDefault(); e.stopPropagation()
  document.querySelectorAll('[data-widget]').forEach(el => { el.style.borderTop=''; el.style.borderBottom='' })
  document.querySelectorAll('[id^="dash-col-"]').forEach(el => el.style.outline = '')
  if (!_dashDragId || _dashDragId === targetId) return
  _dashMoveWidget(_dashDragId, targetId, e)
}

function dashColDrop(e, col) {
  e.preventDefault()
  document.querySelectorAll('[id^="dash-col-"]').forEach(el => el.style.outline = '')
  if (!_dashDragId) return
  const colArr = col === 'left'
    ? [...(state.profile?.dashboardLayout?.left || ['events','projects'])]
    : [...(state.profile?.dashboardLayout?.right || ['tasks','grants','papers'])]
  if (colArr.includes(_dashDragId)) return  // already in this column, handled by dashDrop
  // Move to end of this column
  const srcCol = col === 'left' ? 'right' : 'left'
  const srcArr = [...(state.profile?.dashboardLayout?.[srcCol] || (srcCol==='left'?['events','projects']:['tasks','grants','papers']))]
  const idx = srcArr.indexOf(_dashDragId)
  if (idx !== -1) srcArr.splice(idx, 1)
  colArr.push(_dashDragId)
  _dashSaveLayout(srcCol, srcArr, col, colArr)
}

function _dashMoveWidget(fromId, toId, e) {
  const layout = state.profile?.dashboardLayout || { left:['events','projects'], right:['tasks','grants','papers'] }
  let left  = [...(layout.left  || ['events','projects'])]
  let right = [...(layout.right || ['tasks','grants','papers'])]

  // Find source column
  const srcCol  = left.includes(fromId)  ? 'left'  : 'right'
  const destCol = left.includes(toId)    ? 'left'  : 'right'
  let src  = srcCol  === 'left' ? left  : right
  let dest = destCol === 'left' ? left  : right

  // Remove from source
  src = src.filter(id => id !== fromId)

  // Determine insert position in dest (before or after toId based on mouse position)
  const toEl = document.querySelector(`[data-widget="${toId}"]`)
  let toIdx  = dest.indexOf(toId)
  if (toEl) {
    const rect = toEl.getBoundingClientRect()
    if (e.clientY >= rect.top + rect.height/2) toIdx++
  }
  dest = dest.filter(id => id !== fromId)
  dest.splice(toIdx, 0, fromId)

  if (srcCol === destCol) {
    // Same column — just update that column
    if (srcCol === 'left') left = dest; else right = dest
  } else {
    // Cross-column move
    if (srcCol === 'left')  { left = src;  right = dest }
    else                    { left = dest; right = src  }
  }

  _dashSaveLayout('left', left, 'right', right)
}

async function _dashSaveLayout(col1, arr1, col2, arr2) {
  if (!state.profile) return
  state.profile.dashboardLayout = { [col1]:arr1, [col2]:arr2 }
  await save('profile')
  render_dashboard()
}
