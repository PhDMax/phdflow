// ══ Research Pipeline View ═════════════════════════════════════════════════════
// Visualises each project as a research thread: Papers → Notes → Boards

let _plFilter = 'active'   // 'active' | 'all'

function render_pipeline() {
  const vc = document.getElementById('view-content')
  if (!vc) return

  const projects = (state.projects||[]).filter(p =>
    _plFilter === 'all' ? true : p.status === 'active' || p.status === 'planning'
  )

  vc.innerHTML = `
  ${pageHeader('🔗 Research Pipeline', `
    <div class="flex items-center gap-2">
      <div class="flex bg-slate-100 rounded-lg p-0.5">
        ${[['active','Active'],['all','All']].map(([v,l])=>`
        <button onclick="_plFilter='${v}';render_pipeline()" id="pl-tab-${v}"
          class="px-3 py-1 rounded-md text-xs font-semibold transition-colors ${_plFilter===v?'bg-white text-slate-900 shadow-sm':'text-slate-500 hover:text-slate-700'}">${l}</button>`
        ).join('')}
      </div>
    </div>`)}

  <div class="flex-1 overflow-y-auto">
    <div class="p-4 lg:p-6 space-y-5 max-w-7xl">

      ${projects.length === 0 ? `
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <div class="text-5xl mb-4">🔗</div>
        <p class="text-slate-600 font-semibold text-lg">No active projects</p>
        <p class="text-slate-400 text-sm mt-1 mb-5">Create a project in the Projects view and link papers, notes and boards to see them here.</p>
        <button onclick="showView('projects')" class="btn-primary text-sm px-5">Go to Projects →</button>
      </div>` : projects.map(proj => _plProjectLane(proj)).join('')}

      ${_plUnlinkedSection()}

    </div>
  </div>`
}

// ── Single project lane ────────────────────────────────────────────────────────
function _plProjectLane(proj) {
  const papers  = (state.papers||[]).filter(p => (p.projectIds||[]).includes(proj.id))
  const notes   = (state.notes||[]).filter(n => n.projectId === proj.id)
  const boards  = (state.whiteboards||[]).filter(w => w.projectId === proj.id)

  const stages  = [papers.length > 0, notes.length > 0, boards.length > 0]
  const done    = stages.filter(Boolean).length
  const pct     = Math.round((done / 3) * 100)
  const color   = proj.color || '#6366f1'

  const statusColors = {
    active:   'bg-green-100 text-green-700',
    planning: 'bg-purple-100 text-purple-700',
    'on-hold':'bg-amber-100 text-amber-700',
    completed:'bg-blue-100 text-blue-700',
    archived: 'bg-slate-100 text-slate-500',
  }

  return `
  <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">

    <!-- Lane header -->
    <div class="px-5 py-3.5 flex items-center gap-3 border-b border-slate-100"
      style="border-left:4px solid ${color}">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <button onclick="showView('projects')" class="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate text-left">
            ${esc(proj.name)}
          </button>
          <span class="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[proj.status]||'bg-slate-100 text-slate-500'}">
            ${proj.status||'active'}
          </span>
        </div>
        ${proj.description ? `<p class="text-xs text-slate-400 mt-0.5 truncate">${esc(proj.description)}</p>` : ''}
      </div>
      <!-- Pipeline completeness -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <div class="flex gap-1">
          ${['📚','📝','🎨'].map((icon,i)=>`
          <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs
            ${stages[i] ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}"
            title="${['Papers linked','Notes written','Board created'][i]}">
            ${stages[i] ? '✓' : '○'}
          </span>`).join('')}
        </div>
        <div class="text-xs text-slate-400 w-8 text-right">${pct}%</div>
      </div>
    </div>

    <!-- Three-column pipeline -->
    <div class="grid grid-cols-3 divide-x divide-slate-100">
      ${_plColumn('📚 Papers', papers, 'paper', proj.id)}
      ${_plColumn('📝 Notes',  notes,  'note',  proj.id)}
      ${_plColumn('🎨 Boards', boards, 'board', proj.id)}
    </div>

  </div>`
}

// ── Single column inside a lane ───────────────────────────────────────────────
function _plColumn(heading, items, type, projId) {
  const renderItem = item => {
    if (type === 'paper') return `
    <div class="flex items-start gap-2 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
      onclick="showView('library')">
      <span class="text-base flex-shrink-0 mt-0.5">📄</span>
      <div class="flex-1 min-w-0">
        <div class="text-xs font-medium text-slate-800 leading-snug line-clamp-2">${esc(item.title||'Untitled')}</div>
        ${item.authors ? `<div class="text-[10px] text-slate-400 mt-0.5 truncate">${esc(_plFirstAuthor(item.authors))}</div>` : ''}
      </div>
      <button onclick="event.stopPropagation();plUnlinkPaper('${item.id}','${projId}')"
        class="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-400 transition-all flex-shrink-0 text-xs leading-none">✕</button>
    </div>`

    if (type === 'note') return `
    <div class="flex items-start gap-2 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
      onclick="openNote('${item.id}');showView('notes')">
      <span class="text-base flex-shrink-0 mt-0.5">📝</span>
      <div class="flex-1 min-w-0">
        <div class="text-xs font-medium text-slate-800 leading-snug line-clamp-2">${esc(item.title||'Untitled')}</div>
        <div class="text-[10px] text-slate-400 mt-0.5">${item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : ''}</div>
      </div>
      <button onclick="event.stopPropagation();plUnlinkNote('${item.id}')"
        class="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-400 transition-all flex-shrink-0 text-xs leading-none">✕</button>
    </div>`

    if (type === 'board') return `
    <div class="flex items-start gap-2 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
      onclick="wbLoadBoard('${item.id}');showView('whiteboard')">
      <span class="text-base flex-shrink-0 mt-0.5">🎨</span>
      <div class="flex-1 min-w-0">
        <div class="text-xs font-medium text-slate-800 leading-snug line-clamp-2">${esc(item.name||'Untitled Board')}</div>
        <div class="text-[10px] text-slate-400 mt-0.5">${(item.shapes||[]).length} shapes</div>
      </div>
      <button onclick="event.stopPropagation();plUnlinkBoard('${item.id}')"
        class="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-400 transition-all flex-shrink-0 text-xs leading-none">✕</button>
    </div>`

    return ''
  }

  const addBtn = {
    paper: `<button onclick="plLinkPaperModal('${projId}')"
      class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
      + Link paper
    </button>`,
    note:  `<button onclick="plNewNote('${projId}')"
      class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
      + New note
    </button>`,
    board: `<button onclick="plLinkBoardModal('${projId}')"
      class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
      + Link board
    </button>`,
  }

  return `
  <div class="p-3 min-h-[120px]">
    <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
      ${heading} <span class="text-slate-300 font-normal normal-case tracking-normal">${items.length ? '('+items.length+')' : ''}</span>
    </div>
    <div class="space-y-0.5">
      ${items.map(renderItem).join('')}
      ${addBtn[type]}
    </div>
  </div>`
}

// ── Unlinked resources tray ────────────────────────────────────────────────────
function _plUnlinkedSection() {
  const linkedPaperIds = new Set((state.papers||[]).flatMap(p => p.projectIds||[]).map(()=>'').concat(
    (state.papers||[]).filter(p=>(p.projectIds||[]).length>0).map(p=>p.id)
  ))
  // Correct approach:
  const projectIds = new Set((state.projects||[]).map(p=>p.id))
  const unlinkedPapers  = (state.papers||[]).filter(p => !(p.projectIds||[]).some(id=>projectIds.has(id)))
  const unlinkedNotes   = (state.notes||[]).filter(n => !n.projectId || !projectIds.has(n.projectId))
  const unlinkedBoards  = (state.whiteboards||[]).filter(w => !w.projectId || !projectIds.has(w.projectId))

  const total = unlinkedPapers.length + unlinkedNotes.length + unlinkedBoards.length
  if (total === 0) return ''

  return `
  <div class="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
    <div class="px-5 py-3 border-b border-amber-100 flex items-center gap-2">
      <span class="text-amber-600 text-sm">⚠️</span>
      <h3 class="text-sm font-bold text-amber-800">Unlinked Resources</h3>
      <span class="text-xs text-amber-600 ml-1">${total} item${total!==1?'s':''} not connected to any project</span>
    </div>
    <div class="grid grid-cols-3 divide-x divide-amber-100 px-0">
      ${_plUnlinkedCol('📚 Papers', unlinkedPapers.slice(0,5), 'paper')}
      ${_plUnlinkedCol('📝 Notes',  unlinkedNotes.slice(0,5),  'note')}
      ${_plUnlinkedCol('🎨 Boards', unlinkedBoards.slice(0,5), 'board')}
    </div>
    ${total > 5 ? `<div class="px-5 py-2 text-xs text-amber-500 border-t border-amber-100">Showing 5 per type. Link items to projects to clear this section.</div>` : ''}
  </div>`
}

function _plUnlinkedCol(heading, items, type) {
  const clickFn = { paper:`showView('library')`, note:`showView('notes')`, board:`showView('whiteboard')` }[type]
  return `
  <div class="p-3">
    <div class="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
      ${heading} ${items.length ? '('+items.length+')' : ''}
    </div>
    ${items.length === 0
      ? `<p class="text-xs text-amber-400 italic">All linked ✓</p>`
      : items.map(item=>`
    <div class="text-xs text-amber-800 py-1 px-2 rounded hover:bg-amber-100 cursor-pointer truncate transition-colors"
      onclick="${clickFn}">
      ${esc(item.title||item.name||'Untitled')}
    </div>`).join('')}
  </div>`
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function _plFirstAuthor(authors) {
  if (!authors) return ''
  if (Array.isArray(authors)) return authors[0] || ''
  return authors.split(',')[0].trim()
}

// ── Quick-link actions ────────────────────────────────────────────────────────
function plLinkPaperModal(projId) {
  const proj  = (state.projects||[]).find(p=>p.id===projId)
  const linked = new Set((state.papers||[]).filter(p=>(p.projectIds||[]).includes(projId)).map(p=>p.id))
  const avail  = (state.papers||[]).filter(p=>!linked.has(p.id))

  openModal(`
  <h3 class="text-sm font-bold text-slate-900 mb-3">📚 Link paper to <em>${esc(proj?.name||'project')}</em></h3>
  ${avail.length === 0
    ? `<p class="text-sm text-slate-500">All papers in your library are already linked to this project.</p>`
    : `<div class="space-y-1 max-h-64 overflow-y-auto mb-3">
      ${avail.map(p=>`
      <label class="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
        <input type="checkbox" value="${p.id}" class="pl-paper-cb mt-0.5 accent-indigo-600 flex-shrink-0"/>
        <div class="min-w-0">
          <div class="text-xs font-medium text-slate-800 leading-snug">${esc(p.title||'Untitled')}</div>
          ${p.authors ? `<div class="text-[10px] text-slate-400 truncate">${esc(_plFirstAuthor(p.authors))}</div>` : ''}
        </div>
      </label>`).join('')}
    </div>`}
  <div class="flex gap-2 justify-end">
    <button onclick="closeModal()" class="btn-secondary text-xs py-2 px-4">Cancel</button>
    ${avail.length ? `<button onclick="plDoLinkPapers('${projId}')" class="btn-primary text-xs py-2 px-4">Link selected</button>` : ''}
  </div>`)
}

function plDoLinkPapers(projId) {
  const cbs = document.querySelectorAll('.pl-paper-cb:checked')
  cbs.forEach(cb => {
    const p = (state.papers||[]).find(x=>x.id===cb.value)
    if (p) { if (!p.projectIds) p.projectIds=[]; if (!p.projectIds.includes(projId)) p.projectIds.push(projId) }
  })
  save('papers')
  closeModal()
  render_pipeline()
  showToast(`${cbs.length} paper${cbs.length!==1?'s':''} linked ✓`)
}

function plUnlinkPaper(paperId, projId) {
  const p = (state.papers||[]).find(x=>x.id===paperId)
  if (p) { p.projectIds = (p.projectIds||[]).filter(id=>id!==projId); save('papers') }
  render_pipeline()
}

function plNewNote(projId) {
  const proj = (state.projects||[]).find(p=>p.id===projId)
  showView('notes')
  setTimeout(() => {
    newNote('note')
    setTimeout(() => {
      const note = state.notes[state.notes.length-1]
      if (note && proj) {
        note.projectId = projId
        save('notes')
        showToast(`Note linked to "${proj.name}" ✓`)
      }
    }, 300)
  }, 100)
}

function plUnlinkNote(noteId) {
  const n = (state.notes||[]).find(x=>x.id===noteId)
  if (n) { n.projectId = null; save('notes') }
  render_pipeline()
}

function plLinkBoardModal(projId) {
  const proj  = (state.projects||[]).find(p=>p.id===projId)
  const linked = new Set((state.whiteboards||[]).filter(w=>w.projectId===projId).map(w=>w.id))
  const avail  = (state.whiteboards||[]).filter(w=>!linked.has(w.id))

  openModal(`
  <h3 class="text-sm font-bold text-slate-900 mb-3">🎨 Link board to <em>${esc(proj?.name||'project')}</em></h3>
  ${avail.length === 0
    ? `<p class="text-sm text-slate-500 mb-3">No unlinked boards. Create one on the Whiteboard first.</p>`
    : `<div class="space-y-1 max-h-64 overflow-y-auto mb-3">
      ${avail.map(w=>`
      <label class="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
        <input type="radio" name="pl-board" value="${w.id}" class="accent-indigo-600 flex-shrink-0"/>
        <div class="min-w-0">
          <div class="text-xs font-medium text-slate-800">${esc(w.name||'Untitled Board')}</div>
          <div class="text-[10px] text-slate-400">${(w.shapes||[]).length} shapes</div>
        </div>
      </label>`).join('')}
    </div>`}
  <div class="flex gap-2 justify-end">
    <button onclick="closeModal()" class="btn-secondary text-xs py-2 px-4">Cancel</button>
    ${avail.length ? `<button onclick="plDoLinkBoard('${projId}')" class="btn-primary text-xs py-2 px-4">Link board</button>` : ''}
    <button onclick="closeModal();showView('whiteboard')" class="btn-secondary text-xs py-2 px-4">New board ↗</button>
  </div>`)
}

function plDoLinkBoard(projId) {
  const sel = document.querySelector('input[name="pl-board"]:checked')
  if (!sel) { showToast('Select a board first', 'error'); return }
  const w = (state.whiteboards||[]).find(x=>x.id===sel.value)
  if (w) { w.projectId = projId; save('whiteboards') }
  closeModal()
  render_pipeline()
  showToast('Board linked ✓')
}

function plUnlinkBoard(boardId) {
  const w = (state.whiteboards||[]).find(x=>x.id===boardId)
  if (w) { delete w.projectId; save('whiteboards') }
  render_pipeline()
}
