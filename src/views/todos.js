// ══ To-Do List View ════════════════════════════════════════════════════════════
// Groups · Effort levels · Priority · Today focus mode · Calendar linking · Dashboard widget

let _todoTab         = 'today'
let _todoSearch      = ''
let _todoFilterPri   = 'all'
let _todoFilterEff   = 'all'
let _todoFilterGroup = 'all'

// ── Config ────────────────────────────────────────────────────────────────────

function _todoEff() {
  return {
    quick:   { icon:'⚡', label:'Quick',   sub:'< 15 min',  bg:'bg-emerald-100', text:'text-emerald-700' },
    short:   { icon:'⏱',  label:'Short',   sub:'< 1 hour',  bg:'bg-amber-100',   text:'text-amber-700'   },
    deep:    { icon:'🧠', label:'Deep',    sub:'2–4 hours', bg:'bg-rose-100',    text:'text-rose-700'    },
    project: { icon:'🚀', label:'Project', sub:'1+ days',   bg:'bg-violet-100',  text:'text-violet-700'  },
  }
}

function _todoPri() {
  return {
    urgent: { icon:'🔥', label:'Urgent', bg:'bg-red-100',    text:'text-red-700'    },
    high:   { icon:'⬆',  label:'High',   bg:'bg-orange-100', text:'text-orange-700' },
    medium: { icon:'–',  label:'Medium', bg:'bg-slate-100',  text:'text-slate-500'  },
    low:    { icon:'⬇',  label:'Low',    bg:'bg-slate-50',   text:'text-slate-400'  },
  }
}

function _todoGrpColors() {
  return {
    indigo:  { light:'bg-indigo-50',  text:'text-indigo-700',  bar:'bg-indigo-500',  hex:'#6366f1' },
    violet:  { light:'bg-violet-50',  text:'text-violet-700',  bar:'bg-violet-500',  hex:'#8b5cf6' },
    rose:    { light:'bg-rose-50',    text:'text-rose-700',    bar:'bg-rose-500',    hex:'#f43f5e' },
    amber:   { light:'bg-amber-50',   text:'text-amber-700',   bar:'bg-amber-500',   hex:'#f59e0b' },
    emerald: { light:'bg-emerald-50', text:'text-emerald-700', bar:'bg-emerald-500', hex:'#10b981' },
    sky:     { light:'bg-sky-50',     text:'text-sky-700',     bar:'bg-sky-500',     hex:'#0ea5e9' },
    teal:    { light:'bg-teal-50',    text:'text-teal-700',    bar:'bg-teal-500',    hex:'#14b8a6' },
    orange:  { light:'bg-orange-50',  text:'text-orange-700',  bar:'bg-orange-500',  hex:'#f97316' },
  }
}

const _TODO_DEFAULT_GROUPS = [
  { id:'g-writing',  name:'Writing',  icon:'📝', color:'indigo'  },
  { id:'g-lab',      name:'Lab',      icon:'🧪', color:'violet'  },
  { id:'g-reading',  name:'Reading',  icon:'📚', color:'amber'   },
  { id:'g-meetings', name:'Meetings', icon:'🤝', color:'sky'     },
  { id:'g-admin',    name:'Admin',    icon:'📋', color:'teal'    },
]

function _ensureGroups() {
  if (!state.todoGroups || !state.todoGroups.length) {
    state.todoGroups = _TODO_DEFAULT_GROUPS.map(g => ({...g}))
    save('todoGroups')
  }
  return state.todoGroups
}

function _todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function _isOverdue(t) {
  return t.dueDate && t.status !== 'done' && t.dueDate < _todayStr()
}

function _isDueToday(t) {
  return t.dueDate === _todayStr() && t.status !== 'done'
}

// ── Main Render ───────────────────────────────────────────────────────────────

function render_todos() {
  _ensureGroups()
  const vc = document.getElementById('view-content')
  vc.innerHTML = `
  ${pageHeader('✅ To-Do', `
    <div class="flex items-center gap-2">
      <div class="flex bg-slate-100 rounded-lg p-0.5">
        ${[['today','📌 Today'],['all','All Tasks'],['groups','Groups']].map(([v,l]) =>
          `<button id="todo-tab-${v}" onclick="todoSetTab('${v}')"
            class="px-3 py-1 rounded-md text-xs font-semibold transition-colors">${l}</button>`
        ).join('')}
      </div>
      <button onclick="openTodoModal()" class="btn-primary text-xs py-1.5 px-3">+ Task</button>
    </div>
  `)}
  <div id="todo-body" class="flex-1 overflow-y-auto"></div>`
  todoSetTab(_todoTab)
}

function todoSetTab(tab) {
  _todoTab = tab
  ;['today','all','groups'].forEach(t => {
    const btn = document.getElementById(`todo-tab-${t}`)
    if (!btn) return
    btn.className = `px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
      t === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
    }`
  })
  if      (tab === 'today')  renderTodayTab()
  else if (tab === 'all')    renderAllTab()
  else                       renderGroupsTab()
}

// ── Today Tab ─────────────────────────────────────────────────────────────────

function renderTodayTab() {
  const body = document.getElementById('todo-body')
  if (!body) return
  const eff = _todoEff(), pri = _todoPri()
  const groups = _ensureGroups()
  const today = _todayStr()

  const overdue   = state.todos.filter(t => _isOverdue(t))
  const todayTasks= state.todos.filter(t => t.status !== 'done' && !_isOverdue(t) && (t.todayFlag || _isDueToday(t)))
  const doneTasks = state.todos.filter(t => t.status === 'done' && (t.todayFlag || t.dueDate === today))

  const totalPending = overdue.length + todayTasks.length
  const totalEstMins = [...overdue, ...todayTasks]
    .reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0)
  const estStr = totalEstMins >= 60
    ? `${Math.floor(totalEstMins / 60)}h ${totalEstMins % 60 ? (totalEstMins % 60) + 'm' : ''}`.trim()
    : totalEstMins > 0 ? `${totalEstMins}m` : ''
  const motiveLine = totalPending === 0
    ? `<span class="text-emerald-600 font-semibold">All clear! 🎉 Great work today.</span>`
    : `<span class="font-bold text-slate-800">${totalPending}</span> task${totalPending !== 1 ? 's' : ''} on your plate today${estStr ? ` · <span class="text-slate-400">~${estStr} estimated</span>` : ''}`

  body.innerHTML = `
  <div class="px-6 pt-4 pb-8">
    <!-- Date header -->
    <div class="flex items-start justify-between mb-4">
      <div>
        <div class="text-xs text-slate-400 font-medium">
          ${new Date().toLocaleString('en-GB',{weekday:'long',month:'long',day:'numeric'})}
        </div>
        <div class="text-sm text-slate-600 mt-0.5">${motiveLine}</div>
      </div>
      <button onclick="openTodoModal(null,null,true)" class="btn-primary text-xs py-1.5 px-3">+ Add to Today</button>
    </div>

    <!-- Quick add bar -->
    <div class="flex gap-2 mb-6">
      <input id="todo-quick" type="text"
        placeholder="Quick task… press Enter to add to Today"
        class="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        onkeydown="if(event.key==='Enter')todoQuickAdd()"/>
      <button onclick="todoQuickAdd()" class="btn-secondary text-xs py-2 px-3 flex-shrink-0">Add</button>
    </div>

    <!-- Overdue -->
    ${overdue.length ? `
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs font-bold text-rose-600 uppercase tracking-wide">⚠ Overdue</span>
        <span class="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-bold">${overdue.length}</span>
      </div>
      <div class="space-y-1.5">
        ${overdue.map(t => _todoCard(t, eff, pri, groups, true)).join('')}
      </div>
    </div>` : ''}

    <!-- Today's focus -->
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs font-bold text-slate-600 uppercase tracking-wide">📌 Today's Focus</span>
        <span class="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold">${todayTasks.length}</span>
      </div>
      ${todayTasks.length
        ? `<div class="space-y-1.5">${todayTasks.map(t => _todoCard(t, eff, pri, groups)).join('')}</div>`
        : `<div class="border-2 border-dashed border-slate-200 rounded-xl py-8 text-center text-sm text-slate-400">
            No tasks for today yet.<br/>
            <span class="text-xs">Use the quick bar above, or pin tasks from <button onclick="todoSetTab('all')" class="text-indigo-500 hover:underline">All Tasks</button>.</span>
          </div>`
      }
    </div>

    <!-- Done today -->
    ${doneTasks.length ? `
    <div>
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs font-bold text-emerald-600 uppercase tracking-wide">✓ Completed today</span>
        <span class="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">${doneTasks.length}</span>
      </div>
      <div class="space-y-1.5 opacity-55">
        ${doneTasks.map(t => _todoCard(t, eff, pri, groups)).join('')}
      </div>
    </div>` : ''}
  </div>`
}

function todoQuickAdd() {
  const input = document.getElementById('todo-quick')
  if (!input) return
  const title = input.value.trim()
  if (!title) return
  const task = {
    id: uid(), title,
    description: '', groupId: '', priority: 'medium', effort: 'short',
    status: 'pending', dueDate: _todayStr(), todayFlag: true, tags: [],
    linkedEventId: '',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  }
  state.todos.push(task)
  save('todos')
  input.value = ''
  renderTodayTab()
  showToast('Task added ✓')
}

// ── All Tasks Tab ─────────────────────────────────────────────────────────────

function renderAllTab() {
  const body = document.getElementById('todo-body')
  if (!body) return
  const eff = _todoEff(), pri = _todoPri()
  const groups = _ensureGroups()
  const gc = _todoGrpColors()

  body.innerHTML = `
  <div class="px-6 pt-4 pb-8">
    <!-- Filters -->
    <div class="flex flex-wrap gap-2 mb-4">
      <input id="todo-search" type="text" placeholder="Search…" value="${esc(_todoSearch)}"
        oninput="_todoSearch=this.value;renderAllTab()"
        class="px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 w-44"/>
      <select onchange="_todoFilterGroup=this.value;renderAllTab()" class="input text-xs py-1.5" style="width:auto">
        <option value="all"  ${_todoFilterGroup==='all' ?'selected':''}>All groups</option>
        <option value="none" ${_todoFilterGroup==='none'?'selected':''}>Ungrouped</option>
        ${groups.map(g => `<option value="${g.id}" ${_todoFilterGroup===g.id?'selected':''}>${g.icon} ${esc(g.name)}</option>`).join('')}
      </select>
      <select onchange="_todoFilterPri=this.value;renderAllTab()" class="input text-xs py-1.5" style="width:auto">
        <option value="all" ${_todoFilterPri==='all'?'selected':''}>Any priority</option>
        ${Object.entries(pri).map(([k,v]) => `<option value="${k}" ${_todoFilterPri===k?'selected':''}>${v.icon} ${v.label}</option>`).join('')}
      </select>
      <select onchange="_todoFilterEff=this.value;renderAllTab()" class="input text-xs py-1.5" style="width:auto">
        <option value="all" ${_todoFilterEff==='all'?'selected':''}>Any effort</option>
        ${Object.entries(eff).map(([k,v]) => `<option value="${k}" ${_todoFilterEff===k?'selected':''}>${v.icon} ${v.label}</option>`).join('')}
      </select>
      <label class="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
        <input type="checkbox" id="todo-show-done" class="accent-indigo-600" onchange="renderAllTab()"/> Show done
      </label>
    </div>
    <div id="todo-all-list" class="space-y-6"></div>
  </div>`

  // Apply filters
  const showDone = document.getElementById('todo-show-done')?.checked
  const priOrder = { urgent:0, high:1, medium:2, low:3 }

  let todos = state.todos.filter(t => {
    if (!showDone && t.status === 'done') return false
    if (_todoSearch) {
      const q = _todoSearch.toLowerCase()
      if (!t.title?.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false
    }
    if (_todoFilterPri   !== 'all' && t.priority !== _todoFilterPri)                          return false
    if (_todoFilterEff   !== 'all' && t.effort   !== _todoFilterEff)                          return false
    if (_todoFilterGroup !== 'all') {
      if (_todoFilterGroup === 'none') return !t.groupId
      else return t.groupId === _todoFilterGroup
    }
    return true
  })

  const listEl = document.getElementById('todo-all-list')
  if (!listEl) return

  if (!todos.length) {
    listEl.innerHTML = `<div class="text-center py-16 text-slate-400">
      <div class="text-4xl mb-3">✅</div>
      <p class="text-sm">${state.todos.length ? 'No tasks match your filters.' : 'No tasks yet — create your first one.'}</p>
    </div>`
    return
  }

  // Bucket into groups
  const byGroup = {}
  todos.forEach(t => {
    const key = t.groupId || '__none'
    if (!byGroup[key]) byGroup[key] = []
    byGroup[key].push(t)
  })

  // Sort within group: overdue → priority → due date
  Object.values(byGroup).forEach(arr => arr.sort((a, b) => {
    const ao = _isOverdue(a) ? 0 : 1, bo = _isOverdue(b) ? 0 : 1
    if (ao !== bo) return ao - bo
    const pa = priOrder[a.priority] ?? 2, pb = priOrder[b.priority] ?? 2
    if (pa !== pb) return pa - pb
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    return a.dueDate ? -1 : 1
  }))

  // Defined groups first, ungrouped last
  const orderedKeys = [
    ...groups.map(g => g.id).filter(id => byGroup[id]),
    ...(byGroup['__none'] ? ['__none'] : [])
  ]

  listEl.innerHTML = orderedKeys.map(key => {
    const grp = key === '__none' ? null : groups.find(g => g.id === key)
    const tasks = byGroup[key] || []
    const c = grp ? (gc[grp.color] || gc.indigo) : null
    const pendingCount = tasks.filter(t => t.status !== 'done').length

    return `<div>
      <div class="flex items-center gap-2 mb-2">
        ${grp
          ? `<span class="text-base">${grp.icon}</span>
             <span class="text-sm font-bold ${c.text}">${esc(grp.name)}</span>`
          : `<span class="text-sm font-bold text-slate-400">📁 Ungrouped</span>`
        }
        <span class="text-[10px] px-2 py-0.5 rounded-full font-bold
          ${grp ? c.light + ' ' + c.text : 'bg-slate-100 text-slate-500'}">
          ${pendingCount} pending
        </span>
        <button onclick="openTodoModal(null,'${key === '__none' ? '' : key}')"
          class="text-xs text-slate-400 hover:text-indigo-600 transition-colors ml-auto">+ task</button>
      </div>
      <div class="space-y-1.5" ${grp ? `style="padding-left:12px;border-left:2px solid ${c.hex}"` : ''}>
        ${tasks.map(t => _todoCard(t, eff, pri, groups)).join('')}
      </div>
    </div>`
  }).join('')
}

// ── Groups Tab ────────────────────────────────────────────────────────────────

function renderGroupsTab() {
  const body = document.getElementById('todo-body')
  if (!body) return
  const groups = _ensureGroups()
  const gc = _todoGrpColors()

  body.innerHTML = `
  <div class="px-6 pt-4 pb-8">
    <div class="flex items-center justify-between mb-4">
      <p class="text-sm text-slate-500">
        Organise tasks into groups. Each task can belong to one group.
      </p>
      <button onclick="openGroupModal()" class="btn-primary text-xs py-1.5 px-3">+ New Group</button>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      ${groups.map(g => {
        const c     = gc[g.color] || gc.indigo
        const total = state.todos.filter(t => t.groupId === g.id).length
        const done  = state.todos.filter(t => t.groupId === g.id && t.status === 'done').length
        const pct   = total > 0 ? Math.round(done / total * 100) : 0
        return `<div class="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">${g.icon}</span>
              <span class="font-bold text-slate-800">${esc(g.name)}</span>
            </div>
            <button onclick="openGroupModal('${g.id}')" class="text-slate-300 hover:text-slate-600 text-xs transition-colors">✏️</button>
          </div>
          <div class="text-xs text-slate-500 mb-2">${total} task${total !== 1 ? 's' : ''} · ${done} done</div>
          <div class="w-full bg-slate-100 rounded-full h-1.5 mb-3">
            <div class="${c.bar} h-1.5 rounded-full transition-all duration-500" style="width:${pct}%"></div>
          </div>
          <div class="flex gap-2">
            <button onclick="openTodoModal(null,'${g.id}')"
              class="flex-1 text-xs py-1.5 px-2 rounded-lg font-semibold ${c.light} ${c.text} hover:opacity-80 transition-opacity">
              + Task
            </button>
            <button onclick="_todoFilterGroup='${g.id}';todoSetTab('all')"
              class="flex-1 text-xs py-1.5 px-2 rounded-lg bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition-colors">
              View all
            </button>
          </div>
        </div>`
      }).join('')}
    </div>
  </div>`
}

// ── Task card (shared renderer) ───────────────────────────────────────────────

function _todoCard(t, eff, pri, groups, highlightOverdue = false) {
  const e   = eff[t.effort]   || eff.short
  const p   = pri[t.priority] || pri.medium
  const gc  = _todoGrpColors()
  const grp = groups.find(g => g.id === t.groupId)
  const c   = grp ? (gc[grp.color] || gc.indigo) : null

  // Due date label
  let dueHtml = ''
  if (t.status !== 'done') {
    if (_isOverdue(t)) {
      const days = Math.round((new Date(_todayStr()) - new Date(t.dueDate)) / 86400000)
      dueHtml = `<span class="text-rose-500 font-semibold">⚠ ${days}d overdue</span>`
    } else if (_isDueToday(t)) {
      dueHtml = `<span class="text-amber-600 font-medium">Due today</span>`
    } else if (t.dueDate) {
      dueHtml = `<span class="text-slate-400">${fmtDate(t.dueDate)}</span>`
    }
  } else if (t.dueDate) {
    dueHtml = `<span class="text-slate-300">${fmtDate(t.dueDate)}</span>`
  }

  // Linked event label
  const linkedEvent = t.linkedEventId ? state.events.find(ev => ev.id === t.linkedEventId) : null

  const borderStyle = highlightOverdue ? 'style="border-left:3px solid #f43f5e"' : ''

  return `<div class="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-3 hover:shadow-sm transition-shadow" ${borderStyle}>
    <input type="checkbox" ${t.status === 'done' ? 'checked' : ''} onchange="todoToggle('${t.id}')"
      class="mt-0.5 w-4 h-4 rounded accent-indigo-600 flex-shrink-0 cursor-pointer"/>
    <div class="flex-1 min-w-0 cursor-pointer" onclick="openTodoModal('${t.id}')">
      <div class="flex items-center gap-1 flex-wrap mb-0.5">
        <span class="text-sm font-semibold ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}">
          ${esc(t.title)}
        </span>
        <span class="text-[10px] px-1.5 py-0.5 rounded-full font-bold ${p.bg} ${p.text}">${p.icon} ${p.label}</span>
        <span class="text-[10px] px-1.5 py-0.5 rounded-full font-medium ${e.bg} ${e.text}">${e.icon} ${e.label}</span>
        ${grp ? `<span class="text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.light} ${c.text}">${grp.icon} ${esc(grp.name)}</span>` : ''}
      </div>
      ${t.description ? `<p class="text-xs text-slate-500 truncate mb-0.5">${esc(t.description)}</p>` : ''}
      ${(t.subtasks?.length) ? (() => {
        const done  = t.subtasks.filter(s => s.done).length
        const total = t.subtasks.length
        const pct   = Math.round(done / total * 100)
        return `<div class="flex items-center gap-2 mb-0.5">
          <div class="flex-1 bg-slate-100 rounded-full h-1 max-w-[80px]">
            <div class="h-1 rounded-full bg-indigo-400 transition-all" style="width:${pct}%"></div>
          </div>
          <span class="text-[10px] text-slate-400">${done}/${total}</span>
        </div>`
      })() : ''}
      <div class="flex items-center gap-3 text-xs flex-wrap">
        ${dueHtml}
        ${t.repeat && t.repeat !== 'none' ? `<span class="text-indigo-400">🔁 ${({daily:'Daily',weekdays:'Weekdays',weekly:'Weekly',biweekly:'Biweekly',monthly:'Monthly'})[t.repeat]||''}</span>` : ''}
        ${linkedEvent ? `<span class="text-slate-400">📅 ${esc(linkedEvent.title)}</span>` : ''}
        ${t.todayFlag && !_isDueToday(t) && t.status !== 'done' ? `<span class="text-indigo-400">📌 Today</span>` : ''}
      </div>
    </div>
    <div class="flex items-center gap-1 flex-shrink-0">
      ${_isOverdue(t) ? `
        <button onclick="event.stopPropagation();todoDefer('${t.id}',1)"
          title="Defer 1 day" class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-700 transition-colors font-semibold">+1d</button>
        <button onclick="event.stopPropagation();todoDefer('${t.id}',7)"
          title="Defer 1 week" class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-700 transition-colors font-semibold">+7d</button>` : ''}
      ${t.status !== 'done' && !t.todayFlag && !_isDueToday(t)
        ? `<button onclick="todoAddToToday('${t.id}')" title="Add to Today's focus"
            class="text-slate-300 hover:text-indigo-500 text-sm transition-colors">📌</button>` : ''}
      <button onclick="deleteTodo('${t.id}')" class="text-slate-200 hover:text-rose-400 transition-colors text-sm">✕</button>
    </div>
  </div>`
}

// ── Task actions ──────────────────────────────────────────────────────────────

function _nextRecurDate(dueDateStr, repeat) {
  const d = dueDateStr ? new Date(dueDateStr + 'T00:00:00') : new Date()
  if (repeat === 'daily') {
    d.setDate(d.getDate() + 1)
  } else if (repeat === 'weekdays') {
    d.setDate(d.getDate() + 1)
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
  } else if (repeat === 'weekly') {
    d.setDate(d.getDate() + 7)
  } else if (repeat === 'biweekly') {
    d.setDate(d.getDate() + 14)
  } else if (repeat === 'monthly') {
    d.setMonth(d.getMonth() + 1)
  }
  return d.toISOString().slice(0, 10)
}

function todoToggle(id) {
  const t = state.todos.find(x => x.id === id)
  if (!t) return
  t.status = t.status === 'done' ? 'pending' : 'done'
  if (t.status === 'done') {
    t.completedAt = new Date().toISOString()
    if (t.repeat && t.repeat !== 'none') {
      const next = {
        ...t,
        id:          uid(),
        status:      'pending',
        dueDate:     _nextRecurDate(t.dueDate, t.repeat),
        todayFlag:   false,
        completedAt: undefined,
        createdAt:   new Date().toISOString(),
        updatedAt:   new Date().toISOString(),
      }
      delete next.completedAt
      state.todos.push(next)
    }
  } else {
    delete t.completedAt
  }
  t.updatedAt = new Date().toISOString()
  save('todos')
  todoSetTab(_todoTab)
}

// Alias used by dashboard
function toggleTodo(id) { todoToggle(id) }

function todoDefer(id, days) {
  const t = state.todos.find(x => x.id === id)
  if (!t) return
  const base = t.dueDate && t.dueDate >= _todayStr() ? t.dueDate : _todayStr()
  const d = new Date(base + 'T00:00:00')
  d.setDate(d.getDate() + days)
  t.dueDate    = d.toISOString().slice(0, 10)
  t.todayFlag  = false
  t.updatedAt  = new Date().toISOString()
  save('todos')
  todoSetTab(_todoTab)
  showToast(`Deferred to ${fmtDate(t.dueDate)}`)
}

function todoAddToToday(id) {
  const t = state.todos.find(x => x.id === id)
  if (!t) return
  t.todayFlag = true
  t.updatedAt = new Date().toISOString()
  save('todos')
  todoSetTab(_todoTab)
  showToast('Pinned to Today 📌')
}

function deleteTodo(id) {
  const snap = [...state.todos]
  const title = state.todos.find(t => t.id === id)?.title || 'Task'
  state.todos = state.todos.filter(t => t.id !== id)
  save('todos')
  todoSetTab(_todoTab)
  showUndoToast(`"${title}" deleted`, () => {
    state.todos = snap
    save('todos'); todoSetTab(_todoTab); showToast('Task restored ✓')
  })
}

// ── Task modal — subtask buffer ───────────────────────────────────────────────

let _modalSubtasks = []   // [{id, title, done}] — ephemeral, reset on each modal open

function _renderSubtaskList() {
  const el = document.getElementById('td-subtask-list')
  if (!el) return
  if (!_modalSubtasks.length) {
    el.innerHTML = `<p class="text-xs text-slate-400 italic py-1">No subtasks yet.</p>`
    return
  }
  el.innerHTML = _modalSubtasks.map((s, i) => `
    <div class="flex items-center gap-2 py-1 group">
      <input type="checkbox" ${s.done ? 'checked' : ''}
        class="w-3.5 h-3.5 rounded accent-indigo-600 flex-shrink-0 cursor-pointer"
        onchange="_modalSubtasks[${i}].done=this.checked;_renderSubtaskList()"/>
      <span class="flex-1 text-xs ${s.done ? 'line-through text-slate-400' : 'text-slate-700'}">${esc(s.title)}</span>
      <button onclick="_modalSubtasks.splice(${i},1);_renderSubtaskList()"
        class="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-400 transition-all text-xs leading-none">✕</button>
    </div>`).join('')
}

function _addModalSubtask() {
  const inp = document.getElementById('td-subtask-input')
  if (!inp) return
  const title = inp.value.trim()
  if (!title) return
  _modalSubtasks.push({ id: uid(), title, done: false })
  inp.value = ''
  _renderSubtaskList()
  inp.focus()
}

// ── Task modal ────────────────────────────────────────────────────────────────

function openTodoModal(id, prefillGroupId, prefillToday) {
  const t      = id ? state.todos.find(x => x.id === id) : null
  const eff    = _todoEff(), pri = _todoPri()
  const groups = _ensureGroups()
  const today  = _todayStr()
  // Support pre-linking to a project (from project detail)
  const prefillProjectId = window._pendingTaskProjectId || t?.projectId || ''
  if (!id) window._pendingTaskProjectId = null

  // Support pre-linking to a grant (from grant detail)
  const prefillGrantId = window._pendingTaskGrantId || t?.grantId || ''
  if (!id) window._pendingTaskGrantId = null

  // Support pre-filling from a calendar event
  const _fromEvent = !id ? (window._pendingTaskFromEvent || null) : null
  if (_fromEvent) window._pendingTaskFromEvent = null
  const prefillTitle   = _fromEvent?.title || t?.title || ''
  const prefillDueDate = _fromEvent?.dueDate || t?.dueDate || ''
  const prefillEventId = _fromEvent?.linkedEventId || t?.linkedEventId || ''

  // Seed subtask buffer from existing task, or empty for new
  _modalSubtasks = (t?.subtasks || []).map(s => ({ ...s }))

  // Upcoming events for deadline linking
  const upcomingEvents = state.events
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 30)

  const modalHtml = openModal(`
  <h3 class="text-base font-bold mb-4">${t ? 'Edit Task' : 'New Task'}</h3>
  <div class="space-y-3">
    <div>
      <label class="label">Title *</label>
      <input id="td-title" type="text" value="${esc(prefillTitle)}"
        placeholder="What needs to get done?" class="input"/>
    </div>
    <div>
      <label class="label">Notes <span class="text-slate-400 font-normal">(optional)</span></label>
      <textarea id="td-desc" rows="2" class="input resize-none"
        placeholder="Details, links, context…">${esc(t?.description)}</textarea>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label">Priority</label>
        <select id="td-priority" class="input">
          ${Object.entries(pri).map(([k,v]) =>
            `<option value="${k}" ${(t?.priority||'medium')===k?'selected':''}>${v.icon} ${v.label}</option>`
          ).join('')}
        </select>
      </div>
      <div>
        <label class="label">Effort</label>
        <select id="td-effort" class="input">
          ${Object.entries(eff).map(([k,v]) =>
            `<option value="${k}" ${(t?.effort||'short')===k?'selected':''}>${v.icon} ${v.label} — ${v.sub}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label">Group</label>
        <select id="td-group" class="input">
          <option value="" ${!(t?.groupId||prefillGroupId)?'selected':''}>No group</option>
          ${groups.map(g =>
            `<option value="${g.id}" ${(t?.groupId||prefillGroupId||'')===g.id?'selected':''}>${g.icon} ${esc(g.name)}</option>`
          ).join('')}
        </select>
      </div>
      <div>
        <label class="label">Due Date</label>
        <input id="td-due" type="date" value="${prefillDueDate}" class="input"/>
      </div>
    </div>
    <div>
      <label class="label">Link to calendar deadline <span class="text-slate-400 font-normal">(auto-sets due date)</span></label>
      <select id="td-event" class="input">
        <option value="">— none —</option>
        ${upcomingEvents.map(e =>
          `<option value="${e.id}" ${prefillEventId===e.id?'selected':''}>${fmtDate(e.date)} · ${esc(e.title)}</option>`
        ).join('')}
      </select>
    </div>
    <div>
      <label class="label">Time estimate <span class="text-slate-400 font-normal">(optional)</span></label>
      <div class="flex items-center gap-2">
        <input id="td-estimate" type="number" min="1" max="999" step="1"
          value="${t?.estimatedMinutes||''}"
          placeholder="e.g. 45" class="input w-24"/>
        <span class="text-xs text-slate-500">minutes</span>
        ${t?.estimatedMinutes ? `<span class="text-xs text-slate-400">(≈ ${t.estimatedMinutes >= 60 ? Math.floor(t.estimatedMinutes/60)+'h '+(t.estimatedMinutes%60?t.estimatedMinutes%60+'m':'') : t.estimatedMinutes+'m'})</span>` : ''}
      </div>
    </div>
    <div>
      <label class="label">Repeat</label>
      <select id="td-repeat" class="input">
        <option value=""         ${!(t?.repeat) || t?.repeat==='none' ?'selected':''}>Does not repeat</option>
        <option value="daily"    ${t?.repeat==='daily'    ?'selected':''}>🔁 Daily</option>
        <option value="weekdays" ${t?.repeat==='weekdays' ?'selected':''}>🔁 Every weekday (Mon–Fri)</option>
        <option value="weekly"   ${t?.repeat==='weekly'   ?'selected':''}>🔁 Weekly</option>
        <option value="biweekly" ${t?.repeat==='biweekly' ?'selected':''}>🔁 Every 2 weeks</option>
        <option value="monthly"  ${t?.repeat==='monthly'  ?'selected':''}>🔁 Monthly</option>
      </select>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label">Link to Project</label>
        <select id="td-project" class="input">
          <option value="">— none —</option>
          ${(state.projects||[]).filter(p=>p.status!=='archived').map(p=>
            `<option value="${p.id}" ${prefillProjectId===p.id?'selected':''}>${esc(p.name)}</option>`
          ).join('')}
        </select>
      </div>
      <div>
        <label class="label">Link to Grant</label>
        <select id="td-grant" class="input">
          <option value="">— none —</option>
          ${(state.grants||[]).map(g=>
            `<option value="${g.id}" ${prefillGrantId===g.id?'selected':''}>${esc(g.title||g.funder)}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <input type="checkbox" id="td-today" ${(t?.todayFlag || prefillToday) ? 'checked' : ''}
        class="w-4 h-4 rounded accent-indigo-600"/>
      <label for="td-today" class="text-sm text-slate-700 cursor-pointer select-none">
        📌 Add to Today's focus
      </label>
    </div>
    <div>
      <label class="label">Subtasks</label>
      <div id="td-subtask-list" class="mb-1.5 pl-1 space-y-0"></div>
      <div class="flex gap-1.5">
        <input id="td-subtask-input" type="text" placeholder="Add a subtask…"
          class="input flex-1 text-xs py-1.5"
          onkeydown="if(event.key==='Enter'){event.preventDefault();_addModalSubtask()}"/>
        <button onclick="_addModalSubtask()"
          class="btn-secondary text-xs py-1.5 px-3 flex-shrink-0">Add</button>
      </div>
    </div>
    <div class="flex gap-3 pt-2">
      <button onclick="closeModal()" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="saveTodo('${t?.id||''}')" class="flex-1 btn-primary">Save Task</button>
    </div>
  </div>`)
  // Render initial subtask list after DOM is ready
  setTimeout(() => _renderSubtaskList(), 0)
}

function saveTodo(id) {
  const title = document.getElementById('td-title').value.trim()
  if (!title) { showToast('Title is required','error'); return }

  // Auto-fill due date from linked event
  const linkedId = document.getElementById('td-event').value
  let dueDate    = document.getElementById('td-due').value
  if (linkedId && !dueDate) {
    const ev = state.events.find(e => e.id === linkedId)
    if (ev?.date) dueDate = ev.date
  }

  const repeat = document.getElementById('td-repeat').value
  const data = {
    id:            id || uid(),
    title,
    description:   document.getElementById('td-desc').value.trim(),
    priority:      document.getElementById('td-priority').value,
    effort:        document.getElementById('td-effort').value,
    groupId:       document.getElementById('td-group').value,
    dueDate,
    repeat:           repeat || '',
    estimatedMinutes: parseInt(document.getElementById('td-estimate').value) || null,
    subtasks:         _modalSubtasks.map(s => ({ id: s.id, title: s.title, done: s.done })),
    linkedEventId: linkedId,
    projectId:     document.getElementById('td-project')?.value || '',
    grantId:       document.getElementById('td-grant')?.value   || '',
    todayFlag:     document.getElementById('td-today').checked,
    status:        id ? (state.todos.find(t=>t.id===id)?.status || 'pending') : 'pending',
    tags:          [],
    createdAt:     id ? (state.todos.find(t=>t.id===id)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    updatedAt:     new Date().toISOString()
  }
  if (id) { const i = state.todos.findIndex(t=>t.id===id); if (i > -1) state.todos[i] = data }
  else state.todos.push(data)
  save('todos')
  closeModal()
  todoSetTab(_todoTab)
  showToast(id ? 'Task updated' : 'Task added ✓')
}

// ── Group modal ───────────────────────────────────────────────────────────────

const _GROUP_ICONS = ['📝','🧪','📚','🤝','📋','💡','🎯','📊','🔬','✍️','🧬','📐','🗂','💬','⚗️','🖥','📧','🏛','⚙️','🌍']

function openGroupModal(id) {
  const groups = _ensureGroups()
  const g  = id ? groups.find(x => x.id === id) : null
  const gc = _todoGrpColors()

  openModal(`
  <h3 class="text-base font-bold mb-4">${g ? 'Edit Group' : 'New Group'}</h3>
  <div class="space-y-3">
    <div>
      <label class="label">Group name *</label>
      <input id="grp-name" type="text" value="${esc(g?.name)}" placeholder="e.g. Experiments" class="input"/>
    </div>
    <div>
      <label class="label">Icon</label>
      <div class="flex flex-wrap gap-1.5 mb-1">
        ${_GROUP_ICONS.map(ic =>
          `<button type="button"
            onclick="document.querySelectorAll('.grp-icon-btn').forEach(b=>b.classList.remove('ring-2','ring-indigo-500'));this.classList.add('ring-2','ring-indigo-500');document.getElementById('grp-icon-val').value='${ic}'"
            class="grp-icon-btn text-lg w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors ${g?.icon===ic?'ring-2 ring-indigo-500':''}">
            ${ic}
          </button>`
        ).join('')}
      </div>
      <input type="hidden" id="grp-icon-val" value="${g?.icon||'📝'}"/>
    </div>
    <div>
      <label class="label">Colour</label>
      <select id="grp-color" class="input">
        ${Object.entries(gc).map(([col,c]) =>
          `<option value="${col}" ${g?.color===col?'selected':''}
            style="color:${c.hex}">${col.charAt(0).toUpperCase()+col.slice(1)}</option>`
        ).join('')}
      </select>
    </div>
    <div class="flex gap-3 pt-2">
      ${g ? `<button onclick="deleteGroup('${id}')" class="btn-danger">Delete</button>` : ''}
      <button onclick="closeModal()" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="saveGroup('${g?.id||''}')" class="flex-1 btn-primary">Save</button>
    </div>
  </div>`)
}

function saveGroup(id) {
  const groups = _ensureGroups()
  const name = document.getElementById('grp-name').value.trim()
  if (!name) { showToast('Group name required','error'); return }
  const data = {
    id:    id || uid(),
    name,
    icon:  document.getElementById('grp-icon-val').value || '📝',
    color: document.getElementById('grp-color').value || 'indigo'
  }
  if (id) { const i = groups.findIndex(g => g.id === id); if (i > -1) state.todoGroups[i] = data }
  else state.todoGroups.push(data)
  save('todoGroups')
  closeModal()
  renderGroupsTab()
  showToast(id ? 'Group updated' : 'Group created ✓')
}

async function deleteGroup(id) {
  if (!await confirmDlg('Delete group? Tasks in this group will become ungrouped.', 'Delete Group')) return
  state.todoGroups = (state.todoGroups || []).filter(g => g.id !== id)
  state.todos.forEach(t => { if (t.groupId === id) t.groupId = '' })
  save('todoGroups')
  save('todos')
  closeModal()
  renderGroupsTab()
  showToast('Group deleted')
}

// ── Dashboard widget ──────────────────────────────────────────────────────────

function renderTodosWidget(containerId) {
  const el = document.getElementById(containerId)
  if (!el) return
  const today   = _todayStr()
  const eff     = _todoEff(), pri = _todoPri()
  const overdue = state.todos.filter(t => _isOverdue(t))
  const todayT  = state.todos.filter(t => t.status !== 'done' && !_isOverdue(t) && (t.todayFlag || _isDueToday(t)))
  const allTotal   = state.todos.length
  const allDone    = state.todos.filter(t => t.status === 'done').length

  el.innerHTML = `
  <div class="flex items-center justify-between mb-3">
    <h3 class="text-sm font-bold text-slate-700">✅ Tasks</h3>
    <button onclick="showView('todos')" class="text-xs text-indigo-500 hover:underline font-medium">Open →</button>
  </div>
  ${overdue.length ? `
  <div class="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 mb-2 cursor-pointer hover:bg-rose-100 transition-colors"
       onclick="todoSetTab('today');showView('todos')">
    <span class="text-xs font-bold text-rose-600">⚠ ${overdue.length} overdue task${overdue.length!==1?'s':''}</span>
  </div>` : ''}
  <div class="space-y-1">
    ${todayT.slice(0, 5).map(t => {
      const e = eff[t.effort] || eff.short
      return `<div class="flex items-center gap-2 -mx-1 px-1 py-1 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  onclick="showView('todos')">
        <input type="checkbox" onclick="event.stopPropagation();todoToggle('${t.id}')"
          class="w-3.5 h-3.5 rounded accent-indigo-600 flex-shrink-0"/>
        <span class="text-xs flex-1 truncate font-medium text-slate-700">${esc(t.title)}</span>
        <span class="text-[10px] ${e.bg} ${e.text} px-1.5 py-0.5 rounded-full flex-shrink-0">${e.icon}</span>
      </div>`
    }).join('')}
    ${todayT.length === 0 && !overdue.length
      ? `<p class="text-xs text-slate-400 py-2">No tasks for today</p>` : ''}
    ${todayT.length > 5 ? `<p class="text-xs text-slate-400 py-0.5">+${todayT.length-5} more today</p>` : ''}
  </div>
  <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
    <span class="text-xs text-slate-400">${allDone}/${allTotal} done overall</span>
    <button onclick="openTodoModal(null,null,true)" class="text-xs text-indigo-500 hover:underline font-medium">Quick add</button>
  </div>`
}
