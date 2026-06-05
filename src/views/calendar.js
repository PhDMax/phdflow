// ══ Calendar View ══════════════════════════════════════════════════════════════
// THE command centre: Month / Week / Agenda views + deadline countdowns + goals

function _isoWeekNum(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 864e5) + 1) / 7)
}

let _calDate        = new Date()
let _calView        = 'month'  // 'month' | 'week' | 'agenda'
let _calFeedEvents  = {}       // { feedId: [{uid,title,date,startTime,endTime,location,description}] }
let _calFeedSyncing = {}       // { feedId: bool }

// ── External calendar service presets ─────────────────────────────────────────
const CAL_SERVICES = {
  google:    { label:'Google Calendar',      icon:'🔵', hint:'Google Calendar → ⚙ Settings next to your calendar → scroll to "Secret address in iCal format" → copy that link.' },
  apple:     { label:'Apple iCloud',         icon:'🍎', hint:'iCloud.com → Calendar → Share icon (📤) next to a calendar → enable "Public Calendar" → copy the URL.' },
  outlook:   { label:'Outlook / Office 365', icon:'📘', hint:'Outlook on the web → Calendar → Settings → Shared calendars → Publish a calendar → copy the ICS link.' },
  yahoo:     { label:'Yahoo Calendar',       icon:'🟣', hint:'Yahoo Calendar → click the calendar name → Actions → Export Calendar → copy the .ics link.' },
  nextcloud: { label:'Nextcloud / ownCloud', icon:'☁️',  hint:'Nextcloud Calendar → Share (chain icon) → copy the link, then add ?export at the end of the URL.' },
  other:     { label:'Other (.ics URL)',     icon:'📅', hint:'Any calendar service that provides a public or "secret" iCal subscription link (ends in .ics or contains /ical/).' },
}

// ── ICS / iCal parser — RFC 5545, zero external dependencies ─────────────────
function _parseICS(raw) {
  // Unfold continuation lines and normalise line endings (RFC 5545 §3.1)
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
                  .replace(/\n[ \t]/g, '')

  // Extract VEVENT blocks line-by-line
  const vevents = []; let inEvent = false; let cur = []
  for (const line of text.split('\n')) {
    if (/^BEGIN:VEVENT/i.test(line))  { inEvent = true;  cur = []; continue }
    if (/^END:VEVENT/i.test(line))    { if (inEvent) vevents.push(cur.join('\n')); inEvent = false; continue }
    if (inEvent) cur.push(line)
  }

  const unescape = s => (s || '').replace(/\\n/g,'\n').replace(/\\N/g,'\n')
                                 .replace(/\\,/g,',').replace(/\\;/g,';')
                                 .replace(/\\\\/g,'\\').trim()

  const parseDT = dt => {
    if (!dt) return null
    const s    = dt.replace(/Z$/,'').replace(/\s/g,'')
    const date = `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`
    let time   = null
    if (s.length > 8) {
      const tp = s.slice(9)  // chars after 'T'
      if (tp.length >= 4) time = `${tp.slice(0,2)}:${tp.slice(2,4)}`
    }
    return { date, time }
  }

  return vevents.map(block => {
    const props = {}
    block.split('\n').forEach(line => {
      const ci = line.indexOf(':')
      if (ci < 1) return
      const baseKey = line.slice(0, ci).toUpperCase().split(';')[0]
      if (!(baseKey in props)) props[baseKey] = line.slice(ci + 1)
    })
    if (!props.SUMMARY || !props.DTSTART) return null
    const start = parseDT(props.DTSTART)
    const end   = props.DTEND ? parseDT(props.DTEND) : null
    if (!start?.date) return null
    return {
      uid:         unescape(props.UID) || `${props.DTSTART}~${props.SUMMARY}`,
      title:       unescape(props.SUMMARY),
      date:        start.date,
      startTime:   start.time,
      endTime:     end?.time || null,
      location:    unescape(props.LOCATION || ''),
      description: unescape(props.DESCRIPTION || ''),
    }
  }).filter(e => e && e.date && e.title)
}

// ── Combined local + external events for a given date ────────────────────────
function _allEventsForDate(dateStr) {
  const local = _eventsForDate(dateStr)
  const ext   = []
  for (const feed of (state.calFeeds || [])) {
    if (!feed.enabled) continue
    for (const ev of (_calFeedEvents[feed.id] || [])) {
      if (ev.date !== dateStr) continue
      ext.push({ ...ev,
        id:        `feed-${feed.id}-${ev.uid}`,
        type:      'external',
        external:  true,
        feedId:    feed.id,
        feedName:  feed.name,
        feedColor: feed.color || '#6366f1',
      })
    }
  }
  return [...local, ...ext]
}

// ── Unified event chip — handles both local and external events ───────────────
function _calEventChip(e, extra = '') {
  const sp = "event.stopPropagation();"
  if (e.external) {
    const c = e.feedColor || '#6366f1'
    const initials = (e.feedName || '').slice(0, 2).toUpperCase()
    return `<div class="text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer font-medium flex items-center gap-1 ${extra}"
      style="background:${c}20;color:${c};border-left:2px solid ${c}"
      onclick="${sp}calShowExternal('${esc(e.feedId)}','${esc(e.uid)}')"
      title="${esc(e.feedName)}: ${esc(e.title)}">
      <span class="flex-shrink-0 text-[8px] font-bold opacity-60">${initials}</span>
      <span class="truncate">${esc(e.title)}</span>
    </div>`
  }
  const conf    = (_calTypeConf()[e.type] || _calTypeConf().personal)
  const recurPfx = (e.recurrence && e.recurrence !== 'none') ? '🔁 ' : ''
  return `<div class="text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer ${conf.bg} ${conf.text} font-medium ${extra}"
    onclick="${sp}openEventDetail('${e.id}')"
    title="${e.recurrence && e.recurrence !== 'none' ? '🔁 Repeats ' + e.recurrence + ' — ' : ''}${esc(e.title)}"
    >${recurPfx}${esc(e.title)}</div>`
}

// ── Type & colour config ──────────────────────────────────────────────────────

function _calTypeConf() {
  return {
    deadline:   { bg:'bg-rose-100',    text:'text-rose-700',    dot:'#f43f5e', label:'Deadline'       },
    milestone:  { bg:'bg-violet-100',  text:'text-violet-700',  dot:'#7c3aed', label:'Milestone'      },
    meeting:    { bg:'bg-sky-100',     text:'text-sky-700',     dot:'#0284c7', label:'Meeting'        },
    seminar:    { bg:'bg-teal-100',    text:'text-teal-700',    dot:'#0d9488', label:'Seminar'        },
    course:     { bg:'bg-amber-100',   text:'text-amber-700',   dot:'#d97706', label:'Course'         },
    exam:       { bg:'bg-orange-100',  text:'text-orange-700',  dot:'#ea580c', label:'Exam'           },
    conference: { bg:'bg-emerald-100', text:'text-emerald-700', dot:'#059669', label:'Conference'     },
    focus:      { bg:'bg-indigo-100',  text:'text-indigo-700',  dot:'#6366f1', label:'Focus Block'    },
    busy:       { bg:'bg-slate-200',   text:'text-slate-700',   dot:'#94a3b8', label:'Busy'           },
    personal:   { bg:'bg-slate-100',   text:'text-slate-600',   dot:'#64748b', label:'Personal'       },
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
    // Respect end date
    if (e.recurrenceEnd && dateStr > e.recurrenceEnd) return false
    if (e.recurrence === 'daily')    return true
    if (e.recurrence === 'weekdays') return target.getDay() >= 1 && target.getDay() <= 5
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
  if (!state.calFeeds) state.calFeeds = []
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
      <button onclick="openFeedModal()"  class="btn-secondary text-xs py-1.5 px-3">🔗 Connect</button>
      <button onclick="openGoalModal()"  class="btn-secondary text-xs py-1.5 px-3">🎯 Goal</button>
      <button onclick="openEventModal()" class="btn-primary   text-xs py-1.5 px-3">+ Event</button>
    </div>
  `)}
  <div class="flex-1 overflow-y-auto">
    <!-- Event type legend (compact, always visible) -->
    <div class="px-6 pt-2 flex gap-1.5 flex-wrap">
      ${Object.entries(_calTypeConf()).map(([k,v]) => `
      <span class="text-[10px] px-2 py-0.5 rounded-full font-medium ${v.bg} ${v.text}">${v.label}</span>`).join('')}
    </div>
    <!-- Connected feeds strip -->
    <div id="cal-feeds-strip" class="px-6 pt-2"></div>
    <!-- Countdown strip -->
    <div id="cal-countdown" class="px-6 pt-2"></div>
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
  renderFeedsStrip()
  _calAutoSync()   // fire-and-forget background sync
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

  const showWkNums = state.profile?.showWeekNumbers
  const rows = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
  const gridCols = showWkNums ? 'grid-cols-8' : 'grid-cols-7'

  const el = document.getElementById('cal-main')
  if (!el) return
  el.innerHTML = `
  <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div class="grid ${gridCols} border-b border-slate-200 bg-slate-50">
      ${showWkNums ? `<div class="text-center text-xs font-semibold text-slate-300 py-2">Wk</div>` : ''}
      ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d =>
        `<div class="text-center text-xs font-semibold text-slate-400 py-2">${d}</div>`
      ).join('')}
    </div>
    <div class="grid ${gridCols}">
      ${rows.map(row => {
        const firstDay = row.find(d => d !== null)
        const wkNum = showWkNums && firstDay ? _isoWeekNum(new Date(y, m, firstDay)) : null
        return (showWkNums
          ? `<div class="min-h-[88px] border-b border-r border-slate-100 bg-slate-50/60 flex items-start justify-center pt-2">
               <span class="text-[10px] font-semibold text-slate-300">W${wkNum}</span>
             </div>`
          : '') +
        row.map(d => {
          if (!d) return `<div class="min-h-[88px] border-b border-r border-slate-100 bg-slate-50/30"></div>`
          const cellDate = new Date(y, m, d); cellDate.setHours(0,0,0,0)
          const isToday  = cellDate.getTime() === today.getTime()
          const dateStr  = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
          const events   = _allEventsForDate(dateStr)
          return `<div class="min-h-[88px] border-b border-r border-slate-100 p-1 cursor-pointer hover:bg-indigo-50/30 transition-colors group"
                       onclick="window._calClickEvt=event;quickAddEvent('${dateStr}')">
            <div class="flex justify-end mb-0.5">
              <span class="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors
                ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-700'}">
                ${d}
              </span>
            </div>
            <div class="space-y-0.5">
              ${events.slice(0,3).map(e => _calEventChip(e)).join('')}
              ${events.length > 3 ? `<div class="text-[10px] text-slate-400 px-1">+${events.length-3} more</div>` : ''}
            </div>
          </div>`
        }).join('')
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

  // Split events per day into all-day vs timed (includes external calendar events)
  const allDay = days.map(d => {
    const ds = d.toISOString().slice(0,10)
    return _allEventsForDate(ds).filter(e => !e.startTime)
  })
  const timed  = days.map(d => {
    const ds = d.toISOString().slice(0,10)
    return _allEventsForDate(ds).filter(e => e.startTime)
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
          ${allDay[i].map(e => _calEventChip(e, 'mb-0.5')).join('')}
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
                      onclick="window._calClickEvt=event;quickAddEvent('${ds}')">
            ${slot.map(e => _calEventChip(e, 'mb-0.5')).join('')}
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
    const ev = _allEventsForDate(ds)
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
            if (e.external) {
              const c = e.feedColor || '#6366f1'
              return `<div class="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5
                                 cursor-pointer hover:shadow-sm transition-shadow"
                           onclick="calShowExternal('${esc(e.feedId)}','${esc(e.uid)}')">
                <span class="w-2 h-2 rounded-full flex-shrink-0" style="background:${c}"></span>
                <span class="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                      style="background:${c}20;color:${c}">${esc(e.feedName)}</span>
                <span class="text-sm font-medium text-slate-800 flex-1 truncate">${esc(e.title)}</span>
                ${e.startTime ? `<span class="text-xs text-slate-400 flex-shrink-0">${e.startTime}${e.endTime?' – '+e.endTime:''}</span>` : ''}
              </div>`
            }
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

async function deleteGoal(id) {
  if (!await confirmDlg('Delete this goal?', 'Delete Goal')) return
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

// ── Quick event creation (mini inline form on date click) ────────────────────

function quickAddEvent(dateStr) {
  // Close any other open quick-add
  document.getElementById('cal-quick-add')?.remove()
  const tc = _calTypeConf()
  const div = document.createElement('div')
  div.id = 'cal-quick-add'
  div.style.cssText = 'position:fixed;z-index:300;background:#fff;border:1px solid #e2e8f0;border-radius:.875rem;box-shadow:0 8px 32px rgba(0,0,0,.14);padding:1rem;width:260px'
  div.innerHTML = `
  <p class="text-xs font-semibold text-slate-600 mb-2">New event — ${new Date(dateStr+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</p>
  <input id="cal-qa-title" type="text" placeholder="Event title…"
    class="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"/>
  <div class="flex gap-1 flex-wrap mb-2">
    ${['deadline','milestone','meeting','course','exam','focus'].map(t => `
    <button id="cal-qa-type-${t}" onclick="calQaSetType('${t}')"
      class="text-xs px-2 py-0.5 rounded-full border transition-colors border-slate-200 text-slate-500 hover:border-indigo-300">
      ${tc[t]?.label||t}
    </button>`).join('')}
  </div>
  <div class="flex gap-2">
    <button onclick="calQaSubmit('${dateStr}')" class="flex-1 btn-primary text-xs py-1.5">Add</button>
    <button onclick="document.getElementById('cal-quick-add')?.remove()" class="btn-secondary text-xs py-1.5 px-3">✕</button>
  </div>
  <button onclick="document.getElementById('cal-quick-add')?.remove();openEventModal(null,'${dateStr}')"
    class="mt-2 text-xs text-slate-400 hover:text-indigo-600 w-full text-center">More options →</button>`
  document.body.appendChild(div)
  // Position near the clicked cell
  const evt = window._calClickEvt
  if (evt) {
    const x = Math.min(evt.clientX, window.innerWidth  - 280)
    const y = Math.min(evt.clientY + 8, window.innerHeight - 200)
    div.style.left = x + 'px'
    div.style.top  = y + 'px'
  }
  setTimeout(() => document.getElementById('cal-qa-title')?.focus(), 40)
  // Close on outside click
  setTimeout(() => document.addEventListener('click', e => {
    if (!e.target.closest('#cal-quick-add')) document.getElementById('cal-quick-add')?.remove()
  }, { once: true }), 100)
}

window._calQaType = 'meeting'
function calQaSetType(t) {
  window._calQaType = t
  document.querySelectorAll('[id^="cal-qa-type-"]').forEach(b => {
    b.className = `text-xs px-2 py-0.5 rounded-full border transition-colors ${
      b.id === `cal-qa-type-${t}`
        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
        : 'border-slate-200 text-slate-500 hover:border-indigo-300'}`
  })
}

function calQaSubmit(dateStr) {
  const title = document.getElementById('cal-qa-title')?.value.trim()
  if (!title) { document.getElementById('cal-qa-title')?.focus(); return }
  state.events.push({
    id:          uid(),
    title,
    date:        dateStr,
    type:        window._calQaType || 'meeting',
    priority:    'medium',
    startTime:   '', endTime: '', location: '', description: '',
    recurrence:  'none', reminder: '',
    createdAt:   new Date().toISOString(),
  })
  save('events')
  document.getElementById('cal-quick-add')?.remove()
  calSetView(_calView)
  renderCountdown()
  if (typeof scheduleEventReminders === 'function') scheduleEventReminders()
  showToast(`"${title}" added to calendar ✓`)
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
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label">Recurrence</label>
        <select id="ev-recurrence" class="input"
          onchange="document.getElementById('ev-recur-end-row').style.display=this.value&&this.value!=='none'?'':'none'">
          ${[['none','Does not repeat'],['daily','Daily'],['weekdays','Every weekday'],['weekly','Weekly'],['biweekly','Every 2 weeks'],['monthly','Monthly'],['yearly','Yearly']].map(([v,l]) =>
            `<option value="${v}" ${(e?.recurrence||'none')===v?'selected':''}>${l}</option>`
          ).join('')}
        </select>
      </div>
      <div id="ev-recur-end-row" style="display:${e?.recurrence&&e.recurrence!=='none'?'':'none'}">
        <label class="label">Ends on <span class="font-normal text-slate-400">(optional)</span></label>
        <input id="ev-recurrence-end" type="date" value="${e?.recurrenceEnd||''}" class="input"/>
      </div>
      <div>
        <label class="label">Reminder</label>
        <select id="ev-reminder" class="input">
          <option value=""        ${!e?.reminder?'selected':''}>No reminder</option>
          <option value="15min"   ${e?.reminder==='15min'  ?'selected':''}>15 min before</option>
          <option value="30min"   ${e?.reminder==='30min'  ?'selected':''}>30 min before</option>
          <option value="1hour"   ${e?.reminder==='1hour'  ?'selected':''}>1 hour before</option>
          <option value="3hours"  ${e?.reminder==='3hours' ?'selected':''}>3 hours before</option>
          <option value="1day"    ${e?.reminder==='1day'   ?'selected':''}>1 day before</option>
        </select>
      </div>
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
  const existing = id ? state.events.find(e=>e.id===id) : null
  const data = {
    id:          id || uid(),
    title, date,
    type:        document.getElementById('ev-type').value,
    priority:    document.getElementById('ev-priority').value,
    startTime:   document.getElementById('ev-start').value,
    endTime:     document.getElementById('ev-end').value,
    location:    document.getElementById('ev-location').value.trim(),
    description: document.getElementById('ev-desc').value.trim(),
    recurrence:    document.getElementById('ev-recurrence').value,
    recurrenceEnd: document.getElementById('ev-recurrence-end')?.value || null,
    reminder:      document.getElementById('ev-reminder').value || '',
    createdAt:     existing?.createdAt || new Date().toISOString(),
    grantId:       existing?.grantId   || null,
  }
  if (id) { const i = state.events.findIndex(e=>e.id===id); if (i > -1) state.events[i] = data }
  else state.events.push(data)
  save('events')
  closeModal()
  calSetView(_calView)
  renderCountdown()
  if (typeof scheduleEventReminders === 'function') scheduleEventReminders()
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

  const linkedGrant = e.grantId ? (state.grants||[]).find(g => g.id === e.grantId) : null

  openModal(`
  <div class="flex items-start justify-between gap-3 mb-3">
    <h3 class="font-bold text-slate-900 text-lg leading-snug">${esc(e.title)}</h3>
    <span class="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${conf.bg} ${conf.text}">${conf.label}</span>
  </div>
  ${linkedGrant ? `
  <div class="flex items-center gap-2 mb-3 p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs">
    <span>💰</span>
    <span class="flex-1 text-indigo-700 font-medium">${esc(linkedGrant.title)}</span>
    <button onclick="closeModal();showView('grants')" class="text-indigo-500 hover:underline">View grant →</button>
  </div>` : ''}
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
      <span class="text-slate-600">🔁 ${({daily:'Daily',weekdays:'Every weekday',weekly:'Weekly',biweekly:'Every 2 weeks',monthly:'Monthly',yearly:'Yearly'})[e.recurrence]||e.recurrence}${e.recurrenceEnd?' · ends '+fmtDate(e.recurrenceEnd):''}</span></div>` : ''}
    ${e.reminder ? `<div class="flex gap-2">
      <span class="text-slate-400 w-20 flex-shrink-0">Reminder</span>
      <span class="text-slate-600">⏰ ${{
        '15min':'15 minutes before','30min':'30 minutes before',
        '1hour':'1 hour before','3hours':'3 hours before','1day':'1 day before'
      }[e.reminder]||e.reminder}</span></div>` : ''}
    ${e.description ? `<div class="flex gap-2"><span class="text-slate-400 w-20 flex-shrink-0">Notes</span>
      <span class="text-slate-700 leading-relaxed">${esc(e.description)}</span></div>` : ''}
  </div>
  <div class="flex gap-3 border-t border-slate-100 pt-4">
    <button onclick="closeModal();openEventModal('${id}')" class="flex-1 btn-secondary">✏️ Edit</button>
    <button onclick="createTaskFromEvent('${id}')" class="btn-secondary text-xs">✅ Task</button>
    <button onclick="deleteEvent('${id}')" class="btn-danger">Delete</button>
  </div>`)
}

async function deleteEvent(id) {
  const snap  = [...state.events]
  const title = state.events.find(e=>e.id===id)?.title || 'Event'
  state.events = state.events.filter(e => e.id !== id)
  save('events'); closeModal(); calSetView(_calView); renderCountdown()
  if (typeof scheduleEventReminders === 'function') scheduleEventReminders()
  showUndoToast(`"${title}" deleted`, () => {
    state.events = snap
    save('events'); calSetView(_calView); renderCountdown()
    if (typeof scheduleEventReminders === 'function') scheduleEventReminders()
    showToast('Event restored ✓')
  })
}

function createTaskFromEvent(eventId) {
  const e = state.events.find(x => x.id === eventId)
  if (!e) return
  window._pendingTaskFromEvent = { dueDate: e.date, linkedEventId: eventId, title: `Prepare for: ${e.title}` }
  closeModal()
  navigateTo('todos')
  openTodoModal(null)
}

// ══ Connected Calendar Feeds ══════════════════════════════════════════════════

// ── Feeds strip (pill row below header) ──────────────────────────────────────
function renderFeedsStrip() {
  const el = document.getElementById('cal-feeds-strip')
  if (!el) return
  const feeds = state.calFeeds || []
  if (!feeds.length) { el.innerHTML = ''; return }

  el.innerHTML = `<div class="flex flex-wrap gap-2 pb-1">
    ${feeds.map(f => {
      const syncing = !!_calFeedSyncing[f.id]
      const count   = (_calFeedEvents[f.id] || []).length
      const ago     = f.lastSync
        ? (() => { const m = Math.round((Date.now()-new Date(f.lastSync).getTime())/60000);
                   return m < 2 ? 'just now' : m < 60 ? m+'m ago' : Math.round(m/60)+'h ago' })()
        : 'not synced'
      return `<div class="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs shadow-sm">
        <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:${f.color||'#6366f1'}"></span>
        <span class="font-semibold ${f.enabled?'text-slate-700':'text-slate-400 line-through'}">${esc(f.name)}</span>
        <span class="text-slate-400 text-[10px]">${count?count+' events·':''} ${ago}</span>
        <button onclick="calToggleFeed('${f.id}')" title="${f.enabled?'Hide feed':'Show feed'}"
          class="text-slate-400 hover:text-slate-700 transition-colors leading-none">${f.enabled?'👁':'🚫'}</button>
        <button onclick="calSyncFeed('${f.id}')" title="Sync now"
          class="text-slate-400 hover:text-indigo-600 transition-colors leading-none ${syncing?'spin':''}">⟳</button>
        <button onclick="openFeedModal('${f.id}')" title="Edit feed"
          class="text-slate-400 hover:text-slate-700 transition-colors leading-none text-[10px]">⚙</button>
      </div>`
    }).join('')}
    <button onclick="openFeedModal()"
      class="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors border border-dashed border-indigo-200">
      + Connect
    </button>
  </div>`
}

// ── "Connect calendar" modal ──────────────────────────────────────────────────
function openFeedModal(feedId) {
  const f   = feedId ? (state.calFeeds||[]).find(x=>x.id===feedId) : null
  const svc = f?.service || 'google'
  const palette = ['#4285f4','#34a853','#ea4335','#fbbc04','#6366f1','#0ea5e9','#f97316','#8b5cf6','#10b981','#64748b']
  const selColor = f?.color || '#4285f4'

  openModal(`
  <h3 class="text-base font-bold mb-1">${f ? 'Edit Calendar Feed' : '🔗 Connect External Calendar'}</h3>
  <p class="text-xs text-slate-500 mb-4 leading-relaxed">
    Connect any calendar via its <strong>ICS / iCal subscription URL</strong> — works with
    Google Calendar, Apple iCloud, Outlook, Yahoo, Nextcloud, and any service that publishes .ics links.
    Events are fetched and cached locally — nothing leaves your machine.
  </p>

  <div class="space-y-3">
    <div>
      <label class="label">Service</label>
      <div class="grid grid-cols-3 gap-1.5">
        ${Object.entries(CAL_SERVICES).map(([k,v]) =>
          `<button id="feed-svc-${k}" onclick="calSelectSvc('${k}')"
            class="text-[11px] px-2 py-1.5 rounded-lg border transition-colors text-left leading-snug
              ${svc===k ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'}">
            ${v.icon} ${v.label}
          </button>`
        ).join('')}
      </div>
    </div>

    <div id="feed-hint-box" class="text-xs text-slate-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 leading-relaxed"></div>

    <div>
      <label class="label">Calendar name *</label>
      <input id="feed-name" type="text" value="${esc(f?.name||'')}"
        placeholder="e.g. My Work Calendar" class="input"/>
    </div>

    <div>
      <label class="label">ICS / iCal URL *</label>
      <textarea id="feed-url" rows="2" class="input resize-none text-xs"
        placeholder="https://calendar.google.com/calendar/ical/…/basic.ics">${esc(f?.url||'')}</textarea>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label">Colour</label>
        <div class="flex gap-1.5 flex-wrap mt-1">
          ${palette.map(c =>
            `<button onclick="calPickFeedColor('${c}')" id="fclr-${c.slice(1)}"
              style="width:22px;height:22px;border-radius:50%;background:${c};flex-shrink:0;
                     border:2px solid ${selColor===c?'#1e293b':'transparent'};transition:border .1s"
              title="${c}"></button>`
          ).join('')}
        </div>
        <input type="hidden" id="feed-color-val" value="${selColor}"/>
      </div>
      <div>
        <label class="label">Auto-sync</label>
        <select id="feed-freq" class="input">
          <option value="startup" ${(f?.freq||'startup')==='startup'?'selected':''}>On app start</option>
          <option value="hourly"  ${(f?.freq)==='hourly' ?'selected':''}>Every hour</option>
          <option value="manual"  ${(f?.freq)==='manual' ?'selected':''}>Manual only</option>
        </select>
      </div>
    </div>

    <div id="feed-test-result"></div>

    <div class="flex gap-2 pt-1">
      <button onclick="closeModal()" class="btn-secondary">Cancel</button>
      <button onclick="calTestFeed()" class="btn-secondary px-3 text-xs">🧪 Test URL</button>
      ${f ? `<button onclick="deleteFeed('${f.id}')" class="btn-danger px-3">✕ Remove</button>` : ''}
      <button onclick="saveFeed('${f?.id||''}',true)" class="btn-primary flex-1">
        ${f ? '💾 Save & Sync' : '➕ Add & Sync'}
      </button>
    </div>
  </div>`)

  // Set initial hint text
  setTimeout(() => calSelectSvc(svc), 0)
}

function calSelectSvc(k) {
  Object.keys(CAL_SERVICES).forEach(key => {
    const btn = document.getElementById(`feed-svc-${key}`)
    if (!btn) return
    btn.className = `text-[11px] px-2 py-1.5 rounded-lg border transition-colors text-left leading-snug ${
      key === k
        ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold'
        : 'border-slate-200 text-slate-600 hover:border-slate-300'}`
  })
  const hint = document.getElementById('feed-hint-box')
  if (hint && CAL_SERVICES[k]) {
    hint.innerHTML = `<strong>${CAL_SERVICES[k].icon} ${CAL_SERVICES[k].label}:</strong> ${CAL_SERVICES[k].hint}`
  }
}

function calPickFeedColor(c) {
  document.querySelectorAll('[id^="fclr-"]').forEach(b => { b.style.border = '2px solid transparent' })
  const btn = document.getElementById(`fclr-${c.slice(1)}`)
  if (btn) btn.style.border = '2px solid #1e293b'
  const inp = document.getElementById('feed-color-val')
  if (inp) inp.value = c
}

async function calTestFeed() {
  const url = (document.getElementById('feed-url')?.value || '').trim()
  const box = document.getElementById('feed-test-result')
  if (!box) return
  if (!url) { box.innerHTML = `<div class="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">⚠ Enter a URL first</div>`; return }
  box.innerHTML = `<div class="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 flex items-center gap-2">
    <span class="spin inline-block w-3 h-3 border border-indigo-400 border-t-transparent rounded-full"></span> Fetching…</div>`
  try {
    const res = await window.api.fetchICS(url)
    if (!res.success) {
      box.innerHTML = `<div class="text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2">❌ ${esc(res.error)}</div>`
      return
    }
    const events = _parseICS(res.text)
    box.innerHTML = `<div class="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
      ✅ Valid calendar — <strong>${events.length} events</strong> found. Ready to connect!
    </div>`
  } catch(e) {
    box.innerHTML = `<div class="text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2">❌ ${esc(e.message)}</div>`
  }
}

async function saveFeed(id, syncNow) {
  const name  = (document.getElementById('feed-name')?.value || '').trim()
  const url   = (document.getElementById('feed-url')?.value  || '').trim()
  const color = document.getElementById('feed-color-val')?.value || '#4285f4'
  const freq  = document.getElementById('feed-freq')?.value || 'startup'

  if (!name) { showToast('Calendar name is required', 'error'); return }
  if (!url)  { showToast('ICS URL is required', 'error');        return }

  if (!state.calFeeds) state.calFeeds = []

  // Detect selected service from button states
  const service = Object.keys(CAL_SERVICES).find(k => {
    const btn = document.getElementById(`feed-svc-${k}`)
    return btn?.className.includes('bg-indigo-50')
  }) || 'other'

  const existing = id ? state.calFeeds.find(f => f.id === id) : null
  const feed = {
    id:        id || uid(),
    name, url, color, freq, service,
    enabled:   existing ? (existing.enabled ?? true) : true,
    lastSync:  existing?.lastSync || null,
    createdAt: existing?.createdAt || new Date().toISOString(),
  }

  if (id) {
    const i = state.calFeeds.findIndex(f => f.id === id)
    if (i > -1) state.calFeeds[i] = feed; else state.calFeeds.push(feed)
  } else {
    state.calFeeds.push(feed)
  }
  save('calFeeds')
  closeModal()
  renderFeedsStrip()

  if (syncNow) {
    showToast(`Syncing "${name}"…`)
    await calSyncFeed(feed.id)
  } else {
    showToast(id ? 'Calendar updated' : 'Calendar feed added ✓')
  }
}

async function deleteFeed(feedId) {
  if (!await confirmDlg('Remove this calendar feed? Events from it will no longer appear.', 'Remove Feed')) return
  state.calFeeds = (state.calFeeds || []).filter(f => f.id !== feedId)
  delete _calFeedEvents[feedId]
  save('calFeeds')
  closeModal()
  renderFeedsStrip()
  calSetView(_calView)
  showToast('Calendar feed removed')
}

function calToggleFeed(feedId) {
  const f = (state.calFeeds || []).find(f => f.id === feedId)
  if (!f) return
  f.enabled = !f.enabled
  save('calFeeds')
  renderFeedsStrip()
  calSetView(_calView)
}

async function calSyncFeed(feedId, quiet = false) {
  const f = (state.calFeeds || []).find(f => f.id === feedId)
  if (!f) return
  _calFeedSyncing[feedId] = true
  renderFeedsStrip()
  try {
    const res = await window.api.fetchICS(f.url)
    if (!res.success) {
      if (!quiet) showToast(`Sync failed: ${res.error}`, 'error')
      return
    }
    const events = _parseICS(res.text)
    _calFeedEvents[feedId] = events
    f.lastSync = new Date().toISOString()
    save('calFeeds')
    if (!quiet) showToast(`✓ "${f.name}": ${events.length} events synced`)
    calSetView(_calView)
  } catch(e) {
    if (!quiet) showToast(`Sync error: ${e.message}`, 'error')
  } finally {
    _calFeedSyncing[feedId] = false
    renderFeedsStrip()
  }
}

async function _calAutoSync() {
  const feeds = (state.calFeeds || []).filter(f => f.enabled && f.freq !== 'manual')
  const toSync = feeds.filter(f => {
    if (!f.lastSync) return true                                        // never synced
    const mins = (Date.now() - new Date(f.lastSync).getTime()) / 60000
    return f.freq === 'hourly' ? mins >= 55 : mins >= 25               // startup = every 25 min
  })
  if (!toSync.length) return
  // Parallel fetch, quiet (no individual toasts)
  await Promise.all(toSync.map(f => calSyncFeed(f.id, true)))
  if (toSync.length > 0) calSetView(_calView)
}

// ── External event detail modal ───────────────────────────────────────────────
function calShowExternal(feedId, uid) {
  const feed = (state.calFeeds || []).find(f => f.id === feedId)
  const ev   = (_calFeedEvents[feedId] || []).find(e => e.uid === uid)
  if (!ev || !feed) return
  const c = feed.color || '#6366f1'

  openModal(`
  <div class="flex items-start justify-between gap-3 mb-3">
    <h3 class="font-bold text-slate-900 text-lg leading-snug">${esc(ev.title)}</h3>
    <span class="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
          style="background:${c}20;color:${c}">${esc(feed.name)}</span>
  </div>
  <div class="space-y-2 text-sm mb-4">
    <div class="flex gap-2">
      <span class="text-slate-400 w-20 flex-shrink-0">Date</span>
      <span class="font-medium text-slate-800">${fmtDate(ev.date)}</span>
    </div>
    ${ev.startTime ? `<div class="flex gap-2">
      <span class="text-slate-400 w-20 flex-shrink-0">Time</span>
      <span class="text-slate-700">${ev.startTime}${ev.endTime ? ' – ' + ev.endTime : ''}</span>
    </div>` : ''}
    ${ev.location ? `<div class="flex gap-2">
      <span class="text-slate-400 w-20 flex-shrink-0">Location</span>
      <span class="text-slate-700">${esc(ev.location)}</span>
    </div>` : ''}
    ${ev.description ? `<div class="flex gap-2">
      <span class="text-slate-400 w-20 flex-shrink-0">Notes</span>
      <span class="text-slate-700 leading-relaxed whitespace-pre-line">${esc(ev.description)}</span>
    </div>` : ''}
    <div class="flex gap-2">
      <span class="text-slate-400 w-20 flex-shrink-0">Calendar</span>
      <span class="text-slate-600 flex items-center gap-1">
        <span class="w-2 h-2 rounded-full inline-block" style="background:${c}"></span>
        ${esc(feed.name)}
      </span>
    </div>
  </div>
  <div class="border-t border-slate-100 pt-4">
    <button onclick="closeModal()" class="w-full btn-secondary">Close</button>
  </div>`)
}
