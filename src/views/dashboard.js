// ══ Dashboard View ════════════════════════════════════════════════════════════

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

  vc.innerHTML = `
  <div class="flex-1 overflow-y-auto bg-slate-50">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="bg-white border-b border-slate-200 px-6 py-5">
      <div class="flex items-end justify-between gap-6">
        <div class="flex-1 min-w-0">
          <p class="text-xs text-slate-400 mb-0.5">${dateStr}</p>
          <h1 class="text-xl font-bold text-slate-900">${greeting}, ${esc(name)} 👋</h1>
          ${overdueCount > 0
            ? `<p class="text-xs text-red-600 mt-1 font-medium">⚠️ You have ${overdueCount} overdue task${overdueCount>1?'s':''}</p>`
            : `<p class="text-xs text-slate-400 mt-1">Here's your research overview for today</p>`}
        </div>
        ${totalTodayCount > 0 ? `
        <div class="flex-shrink-0 min-w-[160px] cursor-pointer" onclick="showView('todos')">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-semibold text-slate-700">Today's Tasks</span>
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
    <div class="mx-6 mt-4 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl px-5 py-4 flex items-center gap-4">
      <div class="text-2xl flex-shrink-0">✨</div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-slate-900">Activate AI features</p>
        <p class="text-xs text-slate-500 mt-0.5">Paper summaries · Grant writing · Smart researcher search · Feed ranking — all free, runs on your machine.</p>
      </div>
      <button onclick="showView('settings');setTimeout(()=>settingsTab('app'),100)"
        class="flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors">
        Set up →
      </button>
    </div>` : ''}

    <!-- ── Main Grid ────────────────────────────────────────────────────────── -->
    <div class="p-6 grid grid-cols-2 gap-5">

      <!-- LEFT COLUMN -->
      <div class="space-y-5">

        <!-- Upcoming events & deadlines -->
        ${wShow('events') ? `
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-800">📅 Upcoming Events &amp; Deadlines</h3>
            <button onclick="showView('calendar')" class="text-xs text-indigo-500 hover:underline">View calendar →</button>
          </div>
          ${upcoming.length === 0
            ? `<div class="px-5 py-8 text-center text-slate-400 text-sm">No upcoming events.<br/><button onclick="showView('calendar')" class="text-indigo-500 hover:underline mt-1">Add one →</button></div>`
            : `<div class="divide-y divide-slate-50">
              ${upcoming.map(e => {
                const daysAway = Math.round((new Date(e.date) - now) / 864e5)
                const when = daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway}d`
                const urgent = daysAway <= 2
                const typeColors = {
                  milestone:'bg-indigo-100 text-indigo-700',
                  deadline:'bg-red-100 text-red-700',
                  meeting:'bg-blue-100 text-blue-700',
                  course:'bg-green-100 text-green-700',
                  exam:'bg-orange-100 text-orange-700',
                }
                const chip = typeColors[e.type] || 'bg-slate-100 text-slate-600'
                return `
                <div class="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                  <div class="text-center min-w-[2.5rem]">
                    <div class="text-xs font-bold ${urgent ? 'text-red-600' : 'text-indigo-600'}">${when}</div>
                    <div class="text-xs text-slate-400">${new Date(e.date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-slate-800 truncate">${esc(e.title)}</div>
                    ${e.description ? `<div class="text-xs text-slate-400 truncate">${esc(e.description)}</div>` : ''}
                  </div>
                  <span class="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${chip}">${e.type||'event'}</span>
                </div>`
              }).join('')}
            </div>`}
        </div>` : ''}

        <!-- Active projects -->
        ${wShow('projects') ? `
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-800">📋 Active Projects</h3>
            <button onclick="showView('projects')" class="text-xs text-indigo-500 hover:underline">All projects →</button>
          </div>
          ${activeProjects.length === 0
            ? `<div class="px-5 py-8 text-center text-slate-400 text-sm">No active projects.<br/><button onclick="showView('projects')" class="text-indigo-500 hover:underline mt-1">Create one →</button></div>`
            : `<div class="divide-y divide-slate-50">
              ${activeProjects.map(p => {
                const prog = p.progress || 0
                const barColor = prog >= 75 ? 'bg-green-500' : prog >= 40 ? 'bg-indigo-500' : 'bg-amber-400'
                const dot = p.color || '#6366f1'
                return `
                <div class="px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer" onclick="showView('projects')">
                  <div class="flex items-center gap-2 mb-1.5">
                    <div class="w-2 h-2 rounded-full flex-shrink-0" style="background:${dot}"></div>
                    <span class="text-sm font-medium text-slate-800 flex-1 truncate">${esc(p.name)}</span>
                    ${statusBadge(p.status)}
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div class="h-1.5 rounded-full ${barColor} transition-all" style="width:${prog}%"></div>
                    </div>
                    <span class="text-xs text-slate-400 flex-shrink-0">${prog}%</span>
                  </div>
                </div>`
              }).join('')}
            </div>`}
        </div>` : ''}

      </div>

      <!-- RIGHT COLUMN -->
      <div class="space-y-5">

        <!-- Task widget (Today focus + overdue) -->
        ${wShow('tasks') ? `
        <div class="bg-white rounded-2xl border border-slate-200 px-5 py-4" id="dash-todos-widget">
          <!-- populated by renderTodosWidget() after render -->
        </div>` : ''}

        <!-- Grants pipeline -->
        ${wShow('grants') ? (() => {
          const grantRows = openGrants.map(g => {
            const grantStatusColors = {
              researching:'bg-slate-100 text-slate-600',
              drafting:'bg-amber-100 text-amber-700',
              submitted:'bg-blue-100 text-blue-700',
            }
            const sc = grantStatusColors[g.status] || 'bg-slate-100 text-slate-600'
            let dlHtml = ''
            if (g.deadline) {
              const daysLeft = Math.round((new Date(g.deadline) - now) / 864e5)
              const urgent = daysLeft >= 0 && daysLeft <= 14
              const past   = daysLeft < 0
              dlHtml = `<span class="text-xs ${past ? 'text-red-500' : urgent ? 'text-amber-600' : 'text-slate-400'}">${past ? `${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? 'Today!' : `${daysLeft}d left`}</span>`
            }
            return `<div class="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer" onclick="showView('grants')">
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-slate-800 truncate">${esc(g.title)}</div>
                <div class="text-xs text-slate-400 truncate">${esc(g.agency||'No agency')}</div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                ${dlHtml}
                <span class="text-xs px-2 py-0.5 rounded-full ${sc}">${g.status||'researching'}</span>
              </div>
            </div>`
          }).join('')
          return `<div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate-800">✍️ Grant Pipeline</h3>
              <button onclick="showView('grants')" class="text-xs text-indigo-500 hover:underline">All grants →</button>
            </div>
            ${openGrants.length === 0
              ? `<div class="px-5 py-8 text-center text-slate-400 text-sm">No active grant applications.<br/><button onclick="showView('grants')" class="text-indigo-500 hover:underline mt-1">Track one →</button></div>`
              : `<div class="divide-y divide-slate-50">${grantRows}</div>`}
          </div>`
        })() : ''}

        <!-- Recent papers -->
        ${wShow('papers') && recentPapers.length > 0 ? `
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-800">📚 Recently Added Papers</h3>
            <button onclick="showView('library')" class="text-xs text-indigo-500 hover:underline">Library →</button>
          </div>
          <div class="divide-y divide-slate-50">
            ${recentPapers.map(p => `
            <div class="px-5 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer" onclick="showView('library')">
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-slate-800 line-clamp-1 leading-snug">${esc(p.title||'Untitled')}</div>
                <div class="text-xs text-slate-400 mt-0.5">${esc(p.authors||'')} ${p.year ? '· '+p.year : ''}</div>
              </div>
              ${p.status ? `<span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex-shrink-0">${p.status}</span>` : ''}
            </div>`).join('')}
          </div>
        </div>` : ''}

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
    <div id="dash-fab-menu" style="display:none;position:absolute;bottom:3.5rem;right:0;background:#fff;border:1px solid #e2e8f0;border-radius:.875rem;box-shadow:0 10px 40px rgba(0,0,0,.12);padding:.375rem;width:160px">
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
      m.style.display=m.style.display==='none'?'block':'none'"
      style="width:3rem;height:3rem;background:#4f46e5;color:#fff;border:none;border-radius:9999px;font-size:1.375rem;cursor:pointer;box-shadow:0 4px 20px rgba(79,70,229,.4);display:flex;align-items:center;justify-content:center;transition:background .15s"
      onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'"
      title="Quick add">⊕</button>
  </div>`
  vc.appendChild(fab)
  document.addEventListener('click', e => {
    if (!e.target.closest('#dash-fab')) document.getElementById('dash-fab-menu')?.style && (document.getElementById('dash-fab-menu').style.display = 'none')
  }, { once: false, capture: true })
}
