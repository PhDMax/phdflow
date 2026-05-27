// ══ Calendar View ══════════════════════════════════════════════════════════════
// THE command centre: Month / Week / Agenda views + deadline countdowns + goals

let _calDate = new Date()
let _calView  = 'month' // 'month' | 'week' | 'agenda'

// ── Type & colour config ──────────────────────────────────────────────────────

function _calTypeConf() {
  return {
    deadline:   { bg:'bg-rose-100',    text:'text-rose-700',    dot:'#f43f5e', label:'Deadline'    },
    milestone:  { bg:'bg-violet-100',  text:'text-violet-700',  dot:'#7c3aed', label:'Milestone'   },
    meeting:    { bg:'bg-sky-100',     text:'text-sky-700',     dot:'#0284c7', label:'Meeting'     },
    seminar:    { bg:'bg-teal-100',    text:'text-teal-700',    dot:'#0d9488', label:'Seminar'     },
    course:     { bg:'bg-amber-100',   text:'text-amber-700',   dot:'#d97706', label:'Course'      },
    exam:       { bg:'bg-orange-100',  text:'text-orange-700',  dot:'#ea580c', label:'Exam'        },
    conference: { bg:'bg-emerald-100', text:'text-emerald-700', dot:'#059669', label:'Conference'  },
    personal:   { bg:'bg-slate-100',   text:'text-slate-600',   dot:'#64748b', label:'Personal'    },
  }
}

function _calGoalColors() {
  return {
    indigo:  { bg:'bg-indigo-500',  light:'bg-indigo-100',  text:'text-indigo-700'  },
    violet:  { bg:'bg-violet-500',  light:'bg-violet-100',  text:'text-violet-700'  },
    rose:    { bg:'bg-rose-500',    light:'bg-rose-100',    text:'text-rose-700'    },
    amber:   { bg:'bg-amber-500',   light:'bg-amber-100',   text:'text-amber-700'   },
    emerald: { bg:'bg-emerald-500', light:'bg-emerald-100', text:'text-emerald-700' },
    sky:     { bg:'bg-sky-500',     light:'bg-sky-100',     text:'text-sky-700'     },
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _calDaysUntil(dateStr) {
  const now = new Date(); now.setHours(0,0,0,0)
  const d   = new Date(dateStr); d.setHours(0,0,0,0)
  return Math.round((d - now) / 86400000)
}

// Expand recurrence so every view just calls this
function _eventsForDate(dateStr) {
  return state.events.filter(e => {
    if (!e.date) return false
    if (e.date === dateStr) return true
    if (!e.recurrence || e.recurrence === 'none') return false
    const orig   = new Date(e.date)
    const target = new Date(dateStr)
    if (target <= orig) return false
    if (e.recurrence === 'daily')    return true
    if (e.recurrence === 'weekly')   return orig.getDay() === target.getDay()
    if (e.recurrence === 'biweekly') {
      const diff = Math.round((target - orig) / 86400000)
      return orig.getDay() === target.getDay() && diff % 14 === 0
    }
    if (e.recurrence === 'monthly')  return orig.getDate() === target.getDate()
    if (e.recurrence === 'yearly')   return orig.getMonth() === target.getMonth() && orig.getDate() === target.getDate()
    return false
  })
}

// ── Main Render ───────────────────────────────────────────────────────────────

function render_calendar() {
  if (!state.calGoals) state.calGoals = []
  const vc = document.getElementById('view-content')
  vc.innerHTML = `
  ${pageHeader('📅 Calendar', `
    <div class="flex items-center gap-2">
      <div class="flex bg-slate-100 rounded-lg p-0.5">
        ${['month','week','agenda'].map(v =>
          `<button id="cal-tab-${v}" onclick="calSetView('${v}')"
            class="px-3 py-1 rounded-md text-xs font-semibold transition-colors">
            ${v.charAt(0).toUpperCase()+v.slice(1)}
          </button>`
        ).join('')}
      </div>
      <button onclick="openGoalModal()" class="btn-secondary text-xs py-1.5 px-3">🎯 New Goal</button>
      <button onclick="openEventModal()"  class="btn-primary  text-xs py-1.5 px-3">+ Event</button>
    </div>
  `)}
  <div class="flex-1 overflow-y-auto">
    <!-- Countdown strip -->
    <div id="cal-countdown" class="px-6 pt-4"></div>
    <!-- Nav bar + calendar body -->
    <div class="px-6 pb-4">
      <div class="flex items-center justify-between mb-3">
        <button onclick="calNav(-1)"
          class="text-slate-500 hover:text-slate-900 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-xl">
          ‹
        </button>
        <h3 id="cal-period-label" class="font-bold text-slate-900 text-base"></h3>
        <div class="flex items-center gap-1">
          <button onclick="calGoToday()" class="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 transition-colors font-medium">Today</button>
          <button onclick="calNav(1)"
            class="text-slate-500 hover:text-slate-900 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-xl">
            ›
          </button>
        </div>
      </div>
      <div id="cal-main"></div>
    </div>
    <!-- Goals section -->
    <div class="px-6 pb-8">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-slate-700">🎯 Goals & Milestones</h3>
        <button onclick="openGoalModal()" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">+ Add goal</button>
      </div>
      <div id="cal-goals"></div>
    </div>
  </div>`

  calSetView(_calView)
  renderCountdown()
  renderGoals()
}

// ── View switcher & navigation ────────────────────────────────────────────────

function calSetView(v) {
  _calView = v
  ;['month','week','agenda'].forEach(t => {
    const btn = document.getElementById(`cal-tab-${t}`)
    if (!btn) return
    btn.className = `px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
      t === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
    }`
  })
  if      (v === 'month')  renderMonthView()
  else if (v === 'week')   renderWeekView()
  else                     renderAgendaView()
}

function calNav(dir) {
  if (_calView === 'week') _calDate.setDate(_calDate.getDate() + dir * 7)
  else                     _calDate.setMonth(_calDate.getMonth() + dir)
  calSetView(_calView)
}

function calGoToday() {
  _calDate = new Date()
  calSetView(_calView)
}

// ── Countdown strip ───────────────────────────────────────────────────────────

function renderCountdown() {
  const el = document.getElementById('cal-countdown')
  if (!el) return
  const now = new Date(); now.setHours(0,0,0,0)
  const important = ['deadline','exam','conference','milestone']
  const upcoming  = state.events
    .filter(e => e.date && important.includes(e.type) && new Date(e.date) >= now)
    .sort((a,b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5)

  if (!upcoming.length) { el.innerHTML = ''; return }

  const tc = _calTypeConf()
  el.innerHTML = `<div class="flex gap-2 overflow-x-auto pb-3">
    ${upcoming.map(e => {
      const days = _calDaysUntil(e.date)
      const conf  = tc[e.type] || tc.deadline
      const ring  = days <= 3 ? 'ring-2 ring-rose-400' : days <= 7 ? 'ring-1 ring-amber-300' : ''
      const numCls= days <= 3 ? 'text-rose-600' : days <= 7 ? 'text-amber-600' : 'text-indigo-600'
      const numTxt= days === 0 ? '🔴 Today' : days === 1 ? '🟡 Tmrw' : `${days}d`
      return `<div class="flex-shrink-0 bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3
                          cursor-pointer hover:shadow-md transition-shadow ${ring}" onclick="openEventDetail('${e.id}')">
        <div class="text-center min-w-[38px]">
          <div class="text-base font-black ${numCls}">${numTxt}</div>
        </div>
        <div>
          <div class="text-xs font-semibold text-slate-800 max-w-[160px] truncate">${esc(e.title)}</div>
          <div class="text-[10px] ${conf.text} mt-0.5">${conf.label} · ${fmtDate(e.date)}</div>
        </div>
      </div>`
    }).join('')}
  </div>`
}

// ── Month view ────────────────────────────────────────────────────────────────

function renderMonthView() {
  const y = _calDate.getFullYear(), m = _calDate.getMonth()
  const label = document.getElementById('cal-period-label')
  if (label) label.textContent = _calDate.toLocaleString('en-GB', { month:'long', year:'numeric' })

  const firstDay = new Date(y, m, 1)
  const lastDay  = new Date(y, m+1, 0)
  let   startDow = firstDay.getDay() - 1; if (startDow < 0) startDow = 6
  const today    = new Date(); today.setHours(0,0,0,0)
  const tc       = _calTypeConf()

  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const el = document.getElementById('cal-main')
  if (!el) return
  el.innerHTML = `
  <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div class="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
      ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d =>
        `<div class="text-center text-xs font-semibold text-slate-400 py-2">${d}</div>`
      ).join('')}
    </div>
    <div class="grid grid-cols-7">
      ${cells.map(d => {
        if (!d) return `<div class="min-h-[88px] border-b border-r border-slate-100 bg-slate-50/30"></div>`
        const cellDate = new Date(y, m, d); cellDate.setHours(0,0,0,0)
        const isToday  = cellDate.getTime() === today.getTime()
        const dateStr  = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
        const events   = _eventsForDate(dateStr)
        return `<div class="min-h-[88px] border-b border-r border-slate-100 p-1 cursor-pointer hover:bg-indigo-50/30 transition-colors group"
                     onclick="openEventModal(null,'${dateStr}')">
          <div class="flex justify-end mb-0.5">
            <span class="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors
              ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-700'}">
              ${d}
            </span>
          </div>
          <div class="space-y-0.5">
            ${events.slice(0,3).map(e => {
              const conf = tc[e.type] || tc.personal
              return `<div class="text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer ${conf.bg} ${conf.text} font-medium"
                          onclick="event.stopPropagation();openEventDetail('${e.id}')"
                          title="${esc(e.title)}">${esc(e.title)}</div>`
            }).join('')}
            ${events.length > 3 ? `<div class="text-[10px] text-slate-400 px-1">+${events.length-3} more</div>` : ''}
          </div>
        </div>`
      }).join('')}
    </div>
  </div>`
}

// ── Week view ─────────────────────────────────────────────────────────────────

function renderWeekView() {
  // Anchor to Monday of _calDate's week
  const ref = new Date(_calDate)
  const dow = ref.getDay() === 0 ? 6 : ref.getDay() - 1
  ref.setDate(ref.getDate() - dow)

  const label   = document.getElementById('cal-period-label')
  const weekEnd = new Date(ref); weekEnd.setDate(weekEnd.getDate() + 6)
  if (label) label.textContent =
    `${ref.toLocaleString('en-GB',{month:'short',day:'numeric'})} – ${weekEnd.toLocaleString('en-GB',{month:'short',day:'numeric',year:'numeric'})}`

  const today = new Date(); today.setHours(0,0,0,0)
  const tc    = _calTypeConf()
  const hours = Array.from({length:16},(_,i)=>i+7) // 07–22

  const days = Array.from({length:7},(_,i)=>{ const d=new Date(ref); d.setDate(d.getDate()+i); return d })

  // Split events per day into all-day vs timed
  const allDay = days.map(d => {
    const ds = d.toISOString().slice(0,10)
    return _eventsForDate(ds).filter(e => !e.startTime)
  })
  const timed  = days.map(d => {
    const ds = d.toISOString().slice(0,10)
    return _eventsForDate(ds).filter(e => e.startTime)
  })

  const el = document.getElementById('cal-main')
  if (!el) return
  el.innerHTML = `
  <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <!-- Day headers -->
    <div class="grid border-b border-slate-200 bg-slate-50" style="grid-template-columns:52px repeat(7,1fr)">
      <div class="border-r border-slate-200"></div>
      ${days.map((d,i) => {
        const isToday = new Date(d).setHours(0,0,0,0) === today.getTime()
        return `<div class="text-center py-2 border-r border-slate-100 ${isToday?'bg-indigo-50':''}">
          <div class="text-[10px] text-slate-400 font-semibold">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</div>
          <div class="text-base font-bold ${isToday?'text-indigo-600':'text-slate-700'}">${d.getDate()}</div>
        </div>`
      }).join('')}
    </div>
    <!-- All-day row -->
    <div class="grid border-b border-slate-200 min-h-[28px]" style="grid-template-columns:52px repeat(7,1fr)">
      <div class="border-r border-slate-200 px-1 py-1 flex items-center justify-end">
        <span class="text-[9px] text-slate-400">all‑day</span>
      </div>
      ${days.map((d,i) => {
        const ds = d.toISOString().slice(0,10)
        return `<div class="border-r border-slate-100 px-0.5 py-0.5">
          ${allDay[i].map(e => {
            const c = tc[e.type]||tc.personal
            return `<div class="text-[10px] px-1 py-0.5 rounded truncate ${c.bg} ${c.text} cursor-pointer mb-0.5"
                        onclick="openEventDetail('${e.id}')">${esc(e.title)}</div>`
          }).join('')}
        </div>`
      }).join('')}
    </div>
    <!-- Time grid -->
    <div class="overflow-y-auto" style="max-height:480px">
      ${hours.map(h => `
      <div class="grid border-b border-slate-100" style="grid-template-columns:52px repeat(7,1fr)">
        <div class="border-r border-slate-200 px-1.5 py-1 text-[10px] text-slate-400 text-right leading-none pt-1">${String(h).padStart(2,'0')}:00</div>
        ${days.map((d,i) => {
          const ds   = d.toISOString().slice(0,10)
          const slot = timed[i].filter(e => parseInt((e.startTime||'00:00').split(':')[0]) === h)
          return `<div class="border-r border-slate-100 px-0.5 py-0.5 min-h-[40px] cursor-pointer hover:bg-indigo-50/20 transition-colors"
                      onclick="openEventModal(null,'${ds}')">
            ${slot.map(e => {
              const c = tc[e.type]||tc.personal
              return `<div class="text-[10px] px-1 py-0.5 rounded truncate ${c.bg} ${c.text} cursor-pointer mb-0.5 font-medium"
                          onclick="event.stopPropagation();openEventDetail('${e.id}')">${esc(e.title)}</div>`
            }).join('')}
          </div>`
        }).join('')}
      </div>`).join('')}
    </div>
  </div>`
}

// ── Agenda view ───────────────────────────────────────────────────────────────

function renderAgendaView() {
  const label = document.getElementById('cal-period-label')
  if (label) label.textContent = 'Agenda — next 60 days'

  const now = new Date(); now.setHours(0,0,0,0)
  const tc  = _calTypeConf()

  const groups = {}
  for (let i = 0; i < 60; i++) {
    const d  = new Date(now); d.setDate(d.getDate() + i)
    const ds = d.toISOString().slice(0,10)
    const ev = _eventsForDate(ds)
    if (ev.length) groups[ds] = ev
  }

  const el = document.getElementById('cal-main')
  if (!el) return

  const keys = Object.keys(groups).sort()
  if (!keys.length) {
    el.innerHTML = `<div class="text-center py-16 text-slate-400">
      <div class="text-4xl mb-3">🗓️</div>
      <p class="text-sm font-medium">No events in the next 60 days</p>
      <button onclick="openEventModal()" class="mt-4 btn-primary text-xs">Add your first event</button>
    </div>`
    return
  }

  el.innerHTML = `<div class="space-y-5">
    ${keys.map(ds => {
      const d    = new Date(ds)
      const days = _calDaysUntil(ds)
      const dLbl = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days} days`
      return `<div>
        <div class="flex items-center gap-3 mb-2">
          <span class="text-sm font-bold text-slate-700">
            ${d.toLocaleString('en-GB',{weekday:'long',month:'long',day:'numeric'})}
          </span>
          <span class="text-xs text-slate-400">${dLbl}</span>
        </div>
        <div class="space-y-1.5 ml-3 pl-4 border-l-2 border-slate-200">
          ${groups[ds].map(e => {
            const conf = tc[e.type] || tc.personal
            return `<div class="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5
                               cursor-pointer hover:shadow-sm transition-shadow" onclick="openEventDetail('${e.id}')">
              <span class="w-2 h-2 rounded-full flex-shrink-0" style="background:${conf.dot}"></span>
              <span class="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${conf.bg} ${conf.text}">${conf.label}</span>
              <span class="text-sm font-medium text-slate-800 flex-1 truncate">${esc(e.title)}</span>
              ${e.startTime ? `<span class="text-xs text-slate-400 flex-shrink-0">${e.startTime}${e.endTime?' – '+e.endTime:''}</span>` : ''}
              ${priorityBadge(e.priority)}
            </div>`
          }).join('')}
        </div>
      </div>`
    }).join('')}
  </div>`
}

// ── Goals section ─────────────────────────────────────────────────────────────

function renderGoals() {
  if (!state.calGoals) state.calGoals = []
  const el = document.getElementById('cal-goals')
  if (!el) return

  if (!state.calGoals.length) {
    el.innerHTML = `<div class="text-sm text-slate-400 py-2">
      No goals yet — track thesis chapters, grant milestones, or any big objective.
      <button onclick="openGoalModal()" class="text-indigo-600 hover:underline ml-1">Add one →</button>
    </div>`
    return
  }

  const gc = _calGoalColors()
  el.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
    ${state.calGoals.map(g => {
      const pct    = g.totalSteps > 0 ? Math.round((g.doneSteps / g.totalSteps) * 100) : 0
      const c      = gc[g.color] || gc.indigo
      const done   = g.doneSteps >= g.totalSteps
      const days   = g.deadline ? _calDaysUntil(g.deadline) : null
      const dlHtml = days === null ? ''
        : days < 0   ? `<span class="text-rose-500 font-semibold text-[10px]">⚠ Overdue ${Math.abs(days)}d</span>`
        : days === 0 ? `<span class="text-rose-600 font-bold text-[10px]">Due today!</span>`
        :              `<span class="text-slate-400 text-[10px]">${days}d left</span>`

      return `<div class="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition-shadow">
        <div class="flex items-start justify-between gap-2 mb-1">
          <h4 class="text-sm font-bold text-slate-800 leading-snug">${esc(g.title)}</h4>
          <button onclick="openGoalModal('${g.id}')" class="text-slate-300 hover:text-slate-600 flex-shrink-0 text-xs mt-0.5 transition-colors">✏️</button>
        </div>
        ${g.description ? `<p class="text-[11px] text-slate-500 mb-2 line-clamp-1">${esc(g.description)}</p>` : ''}
        <div class="flex items-center justify-between text-xs mb-1">
          <span class="${c.text} font-bold">${pct}%</span>
          ${dlHtml}
        </div>
        <div class="w-full bg-slate-100 rounded-full h-2.5 mb-3 overflow-hidden">
          <div class="${c.bg} h-2.5 rounded-full transition-all duration-500" style="width:${pct}%"></div>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-[11px] text-slate-400">${g.doneSteps} / ${g.totalSteps} steps</span>
          <div class="flex items-center gap-2">
            ${done
              ? `<span class="text-[11px] text-emerald-600 font-bold">🎉 Complete!</span>`
              : `<button onclick="goalStep('${g.id}',-1)" class="text-[11px] text-slate-400 hover:text-slate-700 transition-colors font-semibold">−1</button>
                 <button onclick="goalStep('${g.id}',1)"  class="${c.text} text-[11px] hover:opacity-70 transition-opacity font-bold">+1 ✓</button>`
            }
            <button onclick="deleteGoal('${g.id}')" class="text-[11px] text-slate-300 hover:text-rose-500 transition-colors ml-1">✕</button>
          </div>
        </div>
      </div>`
    }).join('')}
  </div>`
}

function goalStep(id, delta) {
  if (!state.calGoals) return
  const g = state.calGoals.find(x => x.id === id)
  if (!g) return
  g.doneSteps = Math.max(0, Math.min(g.totalSteps, (g.doneSteps || 0) + delta))
  save('calGoals')
  renderGoals()
  if (g.doneSteps === g.totalSteps) showToast(`🎉 Goal complete: ${g.title}`)
}

function deleteGoal(id) {
  if (!confirm('Delete this goal?')) return
  state.calGoals = (state.calGoals || []).filter(g => g.id !== id)
  save('calGoals')
  renderGoals()
  showToast('Goal deleted')
}

// ── Goal modal ────────────────────────────────────────────────────────────────

function openGoalModal(id) {
  const g  = id ? (state.calGoals || []).find(x => x.id === id) : null
  const gc = _calGoalColors()
  openModal(`
  <h3 class="text-base font-bold mb-4">${g ? 'Edit Goal' : '🎯 New Goal'}</h3>
  <div class="space-y-3">
    <div>
      <label class="label">Goal title *</label>
      <input id="goal-title" type="text" value="${esc(g?.title)}"
        placeholder="e.g. Submit Chapter 3 draft" class="input"/>
    </div>
    <div>
      <label class="label">Description <span class="text-slate-400 font-normal">(optional)</span></label>
      <textarea id="goal-desc" rows="2" class="input resize-none"
        placeholder="What does completing this goal look like?">${esc(g?.description)}</textarea>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label">Total steps</label>
        <input id="goal-total" type="number" min="1" max="200" value="${g?.totalSteps||5}" class="input"/>
      </div>
      <div>
        <label class="label">Steps done so far</label>
        <input id="goal-done"  type="number" min="0" max="200" value="${g?.doneSteps||0}"  class="input"/>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label">Deadline <span class="text-slate-400 font-normal">(optional)</span></label>
        <input id="goal-deadline" type="date" value="${g?.deadline||''}" class="input"/>
      </div>
      <div>
        <label class="label">Colour</label>
        <select id="goal-color" class="input">
          ${Object.keys(gc).map(col =>
            `<option value="${col}" ${g?.color===col?'selected':''}>
              ${col.charAt(0).toUpperCase()+col.slice(1)}
            </option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="flex gap-3 pt-2">
      <button onclick="closeModal()" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="saveGoal('${g?.id||''}')" class="flex-1 btn-primary">Save Goal</button>
    </div>
  </div>`)
}

function saveGoal(id) {
  if (!state.calGoals) state.calGoals = []
  const title = document.getElementById('goal-title').value.trim()
  const total = Math.max(1, parseInt(document.getElementById('goal-total').value) || 1)
  const done  = Math.min(Math.max(0, parseInt(document.getElementById('goal-done').value) || 0), total)
  if (!title) { showToast('Goal title is required','error'); return }
  const data = {
    id:          id || uid(),
    title,
    description: document.getElementById('goal-desc').value.trim(),
    totalSteps:  total,
    doneSteps:   done,
    deadline:    document.getElementById('goal-deadline').value || '',
    color:       document.getElementById('goal-color').value || 'indigo',
    createdAt:   id ? (state.calGoals.find(g=>g.id===id)?.createdAt || new Date().toISOString()) : new Date().toISOString()
  }
  if (id) { const i = state.calGoals.findIndex(g=>g.id===id); if (i > -1) state.calGoals[i] = data }
  else state.calGoals.push(data)
  save('calGoals')
  closeModal()
  renderGoals()
  showToast(id ? 'Goal updated' : 'Goal added ✓')
}

// ── Event modal ───────────────────────────────────────────────────────────────

function openEventModal(id, prefillDate) {
  const e  = id ? state.events.find(x=>x.id===id) : null
  const tc = _calTypeConf()
  openModal(`
  <h3 class="text-base font-bold mb-4">${e ? 'Edit Event' : 'New Event'}</h3>
  <div class="space-y-3">
    <div>
      <label class="label">Title *</label>
      <input id="ev-title" type="text" value="${esc(e?.title)}"
        placeholder="e.g. Grant submission — DFG" class="input"/>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label">Type</label>
        <select id="ev-type" class="input">
          ${Object.entries(tc).map(([k,v]) =>
            `<option value="${k}" ${e?.type===k?'selected':''}>${v.label}</option>`
          ).join('')}
        </select>
      </div>
      <div>
        <label class="label">Priority</label>
        <select id="ev-priority" class="input">
          ${['low','medium','high'].map(p =>
            `<option value="${p}" ${e?.priority===p?'selected':''}>${p.charAt(0).toUpperCase()+p.slice(1)}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div>
        <label class="label">Date *</label>
        <input id="ev-date" type="date" value="${e?.date||prefillDate||''}" class="input"/>
      </div>
      <div>
        <label class="label">Start</label>
        <input id="ev-start" type="time" value="${e?.startTime||''}" class="input"/>
      </div>
      <div>
        <label class="label">End</label>
        <input id="ev-end" type="time" value="${e?.endTime||''}" class="input"/>
      </div>
    </div>
    <div>
      <label class="label">Location <span class="text-slate-400 font-normal">(optional)</span></label>
      <input id="ev-location" type="text" value="${esc(e?.location)}"
        placeholder="Room, Zoom link, city…" class="input"/>
    </div>
    <div>
      <label class="label">Notes</label>
      <textarea id="ev-desc" rows="2" class="input resize-none"
        placeholder="Details, links, reminders…">${esc(e?.description)}</textarea>
    </div>
    <div>
      <label class="label">Recurrence</label>
      <select id="ev-recurrence" class="input">
        ${['none','daily','weekly','biweekly','monthly','yearly'].map(r =>
          `<option value="${r}" ${e?.recurrence===r?'selected':''}>${r.charAt(0).toUpperCase()+r.slice(1)}</option>`
        ).join('')}
      </select>
    </div>
    <div class="flex gap-3 pt-2">
      <button onclick="closeModal()" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="saveEvent('${e?.id||''}')" class="flex-1 btn-primary">Save</button>
    </div>
  </div>`)
}

function saveEvent(id) {
  const title = document.getElementById('ev-title').value.trim()
  const date  = document.getElementById('ev-date').value
  if (!title || !date) { showToast('Title and date are required','error'); return }
  const data = {
    id:          id || uid(),
    title, date,
    type:        document.getElementById('ev-type').value,
    priority:    document.getElementById('ev-priority').value,
    startTime:   document.getElementById('ev-start').value,
    endTime:     document.getElementById('ev-end').value,
    location:    document.getElementById('ev-location').value.trim(),
    description: document.getElementById('ev-desc').value.trim(),
    recurrence:  document.getElementById('ev-recurrence').value,
    createdAt:   id ? (state.events.find(e=>e.id===id)?.createdAt || new Date().toISOString()) : new Date().toISOString()
  }
  if (id) { const i = state.events.findIndex(e=>e.id===id); if (i > -1) state.events[i] = data }
  else state.events.push(data)
  save('events')
  closeModal()
  calSetView(_calView)
  renderCountdown()
  showToast(id ? 'Event updated' : 'Event added ✓')
}

// ── Event detail ──────────────────────────────────────────────────────────────

function openEventDetail(id) {
  const e = state.events.find(x=>x.id===id)
  if (!e) return
  const tc   = _calTypeConf()
  const conf = tc[e.type] || tc.personal
  const days = _calDaysUntil(e.date)
  const showCountdown = days >= 0 && ['deadline','exam','conference','milestone'].includes(e.type)
  const ctCls = days <= 3 ? 'bg-rose-50 text-rose-700' : days <= 7 ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'

  openModal(`
  <div class="flex items-start justify-between gap-3 mb-3">
    <h3 class="font-bold text-slate-900 text-lg leading-snug">${esc(e.title)}</h3>
    <span class="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${conf.bg} ${conf.text}">${conf.label}</span>
  </div>
  ${showCountdown ? `
  <div class="text-center py-3 mb-3 rounded-xl ${ctCls}">
    <div class="text-3xl font-black">${days === 0 ? 'Today!' : days + (days===1?' day':' days')}</div>
    ${days > 0 ? `<div class="text-xs font-medium mt-0.5">until this ${conf.label.toLowerCase()}</div>` : ''}
  </div>` : ''}
  <div class="space-y-2 text-sm mb-4">
    <div class="flex gap-2"><span class="text-slate-400 w-20 flex-shrink-0">Date</span>
      <span class="font-medium text-slate-800">${fmtDate(e.date)}</span></div>
    ${e.startTime ? `<div class="flex gap-2"><span class="text-slate-400 w-20 flex-shrink-0">Time</span>
      <span>${e.startTime}${e.endTime?' – '+e.endTime:''}</span></div>` : ''}
    ${e.location ? `<div class="flex gap-2"><span class="text-slate-400 w-20 flex-shrink-0">Location</span>
      <span class="text-slate-700">${esc(e.location)}</span></div>` : ''}
    <div class="flex gap-2"><span class="text-slate-400 w-20 flex-shrink-0">Priority</span>
      ${priorityBadge(e.priority)}</div>
    ${e.recurrence && e.recurrence !== 'none' ? `<div class="flex gap-2">
      <span class="text-slate-400 w-20 flex-shrink-0">Repeats</span>
      <span class="text-slate-600 capitalize">${e.recurrence}</span></div>` : ''}
    ${e.description ? `<div class="flex gap-2"><span class="text-slate-400 w-20 flex-shrink-0">Notes</span>
      <span class="text-slate-700 leading-relaxed">${esc(e.description)}</span></div>` : ''}
  </div>
  <div class="flex gap-3 border-t border-slate-100 pt-4">
    <button onclick="closeModal();openEventModal('${id}')" class="flex-1 btn-secondary">✏️ Edit</button>
    <button onclick="deleteEvent('${id}')" class="btn-danger">Delete</button>
  </div>`)
}

function deleteEvent(id) {
  if (!confirm('Delete this event?')) return
  state.events = state.events.filter(e => e.id !== id)
  save('events')
  closeModal()
  calSetView(_calView)
  renderCountdown()
  showToast('Event deleted')
}
