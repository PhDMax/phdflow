// ══ Notes — Rich Research Notes ═══════════════════════════════════════════════

let _notesActiveId   = null
let _notesSearch     = ''
let _notesTypeFilter = 'all'
let _notesSaveTimer  = null
let _notesSplitView  = true

const NOTE_TYPES = {
  note:       { icon: '📝', label: 'Quick Note',      cls: 'bg-slate-100 text-slate-700'   },
  experiment: { icon: '🧪', label: 'Experiment Log',  cls: 'bg-blue-100 text-blue-700'     },
  meeting:    { icon: '🤝', label: 'Meeting Notes',   cls: 'bg-purple-100 text-purple-700' },
  writing:    { icon: '✍️',  label: 'Writing / Draft', cls: 'bg-green-100 text-green-700'   },
}

const NOTE_TEMPLATES = {
  note: '',
  experiment: `## Objective\n\n\n\n## Protocol\n\n\n\n## Observations\n\n\n\n## Results\n\n\n\n## Next Steps\n\n`,
  meeting:    `## Meeting: \n**Date:** ${new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}\n**Attendees:** \n\n## Agenda\n\n\n\n## Discussion\n\n\n\n## Action Items\n- [ ] \n- [ ] \n`,
  writing:    `## Introduction\n\n\n\n## Key Points\n\n\n\n## Notes / References\n\n`,
}

// Toolbar definitions — used for HTML render AND keyboard shortcuts
const _NOTES_TB = [
  { id:'bold',      before:'**',     after:'**',   label:'<b>B</b>',            title:'Bold (Ctrl+B)'        },
  { id:'italic',    before:'*',      after:'*',    label:'<i>I</i>',            title:'Italic (Ctrl+I)'      },
  { id:'strike',    before:'~~',     after:'~~',   label:'<s>S</s>',            title:'Strikethrough'         },
  { id:'SEP' },
  { id:'h1',        before:'# ',     after:'',     label:'H1',                  title:'Heading 1'             },
  { id:'h2',        before:'## ',    after:'',     label:'H2',                  title:'Heading 2'             },
  { id:'h3',        before:'### ',   after:'',     label:'H3',                  title:'Heading 3'             },
  { id:'SEP' },
  { id:'code',      before:'`',      after:'`',    label:'<code>&lt;/&gt;</code>', title:'Inline code (Ctrl+K)' },
  { id:'codeblock', before:'```\n',  after:'\n```',label:'<code>{ }</code>',    title:'Code block'            },
  { id:'math',      before:'$$\n',   after:'\n$$', label:'∑',                   title:'Math block (LaTeX)'    },
  { id:'SEP' },
  { id:'quote',     before:'> ',     after:'',     label:'❝',                   title:'Blockquote'            },
  { id:'ul',        before:'- ',     after:'',     label:'•',                   title:'List item'             },
  { id:'ol',        before:'1. ',    after:'',     label:'1.',                  title:'Numbered item'         },
  { id:'task',      before:'- [ ] ', after:'',     label:'☐',                   title:'Task / checkbox'       },
  { id:'hr',        before:'\n---\n',after:'',     label:'—',                   title:'Horizontal rule'       },
  { id:'SEP' },
  { id:'table',     before:'| Col 1 | Col 2 | Col 3 |\n| --- | --- | --- |\n| | | |\n', after:'', label:'⊞', title:'Insert table' },
  { id:'link',      before:'[',      after:'](url)',label:'🔗',                  title:'Link'                  },
  { id:'date',      before:() => `**${new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}**  \n`, after:'', label:'📅', title:"Insert today's date" },
]

// ── Main Render ───────────────────────────────────────────────────────────────

function render_notes() {
  const vc = document.getElementById('view-content')
  if (!vc) return

  const filtered = _notesFiltered()
  const active   = _notesActiveId ? state.notes.find(n => n.id === _notesActiveId) : null

  vc.innerHTML = `
  <div class="flex h-full overflow-hidden">

    <!-- ── Note List Sidebar ──────────────────────────────────────────────── -->
    <div class="w-60 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">

      <!-- New + Search -->
      <div class="p-3 border-b border-slate-200 space-y-2">
        <div class="flex gap-1">
          <button onclick="newNote('note')"
            class="flex-1 px-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
            + Note
          </button>
          <button onclick="newNote('experiment')" title="New Experiment Log"
            class="px-2.5 py-2 bg-slate-100 hover:bg-blue-100 rounded-lg text-base transition-colors">🧪</button>
          <button onclick="newNote('meeting')" title="New Meeting Notes"
            class="px-2.5 py-2 bg-slate-100 hover:bg-purple-100 rounded-lg text-base transition-colors">🤝</button>
          <button onclick="newNote('writing')" title="New Writing Draft"
            class="px-2.5 py-2 bg-slate-100 hover:bg-green-100 rounded-lg text-base transition-colors">✍️</button>
        </div>
        <input type="text" value="${esc(_notesSearch)}" placeholder="Search notes…"
          oninput="_notesSearch=this.value;render_notes()"
          class="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900
            placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
      </div>

      <!-- Type filter -->
      <div class="px-3 py-2 border-b border-slate-100 flex gap-1 flex-wrap">
        <button onclick="_notesTypeFilter='all';render_notes()"
          class="px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors
            ${_notesTypeFilter==='all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          All
        </button>
        ${Object.entries(NOTE_TYPES).map(([k,v]) => `
        <button onclick="_notesTypeFilter='${k}';render_notes()" title="${v.label}"
          class="px-2 py-0.5 rounded-full text-sm transition-colors
            ${_notesTypeFilter===k ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}">
          ${v.icon}
        </button>`).join('')}
      </div>

      <!-- Note list -->
      <div class="flex-1 overflow-y-auto">
        ${filtered.length === 0
          ? `<p class="text-xs text-slate-400 text-center py-10 px-4">
              ${state.notes.length === 0 ? 'No notes yet — create one above' : 'No matches'}
             </p>`
          : filtered.map(n => {
              const type     = NOTE_TYPES[n.type] || NOTE_TYPES.note
              const isActive = n.id === _notesActiveId
              const preview  = (n.content||'').replace(/#+\s*/g,'').replace(/[*`_~>\[\]]/g,'').trim().slice(0,70)
              const dateStr  = n.updatedAt
                ? new Date(n.updatedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'})
                : ''
              return `
              <div onclick="openNote('${n.id}')"
                class="px-3 py-2.5 border-b border-slate-100 cursor-pointer transition-colors
                  ${isActive ? 'bg-indigo-50 border-l-[3px] border-l-indigo-500' : 'hover:bg-slate-50'}">
                <div class="flex items-center gap-1.5 mb-0.5">
                  <span class="text-xs">${type.icon}</span>
                  <span class="text-xs font-semibold text-slate-800 truncate flex-1 min-w-0">${esc(n.title||'Untitled')}</span>
                  <span class="text-xs text-slate-300 flex-shrink-0">${dateStr}</span>
                </div>
                <p class="text-xs text-slate-400 truncate ml-5">${esc(preview)||'—'}</p>
                ${n.tags?.length ? `<div class="flex gap-1 mt-1 ml-5 flex-wrap">
                  ${n.tags.slice(0,3).map(t=>`<span class="text-xs px-1.5 rounded-full bg-slate-100 text-slate-500">#${esc(t)}</span>`).join('')}
                </div>` : ''}
              </div>`
            }).join('')
        }
      </div>

      <div class="px-3 py-2 border-t border-slate-100">
        <p class="text-xs text-slate-400">${state.notes.length} note${state.notes.length!==1?'s':''}</p>
      </div>
    </div>

    <!-- ── Editor / Preview ───────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col overflow-hidden">
      ${active ? _notesEditorPanel(active) : `
        <div class="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div class="text-5xl mb-4">📝</div>
          <p class="text-slate-600 font-semibold mb-2">Select or create a note</p>
          <p class="text-slate-400 text-sm mb-5">Supports Markdown, tables, code blocks, task lists, and math (LaTeX).</p>
          <div class="flex gap-2 flex-wrap justify-center">
            <button onclick="newNote('note')"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">📝 Quick Note</button>
            <button onclick="newNote('experiment')"
              class="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-semibold rounded-lg transition-colors">🧪 Experiment Log</button>
            <button onclick="newNote('meeting')"
              class="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm font-semibold rounded-lg transition-colors">🤝 Meeting Notes</button>
            <button onclick="newNote('writing')"
              class="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-sm font-semibold rounded-lg transition-colors">✍️ Writing Draft</button>
          </div>
        </div>
      `}
    </div>

  </div>`
}

// ── Editor Panel ──────────────────────────────────────────────────────────────

function _notesEditorPanel(note) {
  const tagsStr  = (note.tags || []).join(', ')

  const toolbarHtml = _NOTES_TB.map(a => {
    if (a.id === 'SEP') return `<div class="w-px h-4 bg-slate-200 mx-0.5 flex-shrink-0"></div>`
    return `<button data-tb="${a.id}" title="${a.title}"
      class="px-1.5 py-1 rounded text-xs text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0">
      ${a.label}
    </button>`
  }).join('')

  const previewHtml = note.content
    ? marked.parse(note.content)
    : '<p style="color:#94a3b8;font-style:italic">Preview will appear here as you type…</p>'

  return `
  <!-- Title / meta bar -->
  <div class="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-2 flex-shrink-0">
    <select onchange="updateNoteType('${note.id}',this.value)"
      class="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700
        focus:outline-none focus:ring-2 focus:ring-indigo-400 flex-shrink-0">
      ${Object.entries(NOTE_TYPES).map(([k,v])=>
        `<option value="${k}" ${note.type===k?'selected':''}>${v.icon} ${v.label}</option>`
      ).join('')}
    </select>
    <input id="note-title" type="text" value="${esc(note.title||'')}" placeholder="Untitled note"
      class="flex-1 text-sm font-bold text-slate-900 bg-transparent border-none
        focus:outline-none placeholder-slate-300 min-w-0"
      oninput="scheduleNoteSave()"/>
    <input id="note-tags" type="text" value="${esc(tagsStr)}" placeholder="tags, comma-separated"
      class="w-44 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 flex-shrink-0
        focus:outline-none focus:ring-2 focus:ring-indigo-400"
      oninput="scheduleNoteSave()"/>
    <button onclick="exportNote('${note.id}')" title="Export as .md file"
      class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg transition-colors flex-shrink-0">
      ⬇ .md
    </button>
    <button onclick="deleteNote('${note.id}')"
      class="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs rounded-lg transition-colors flex-shrink-0">
      🗑
    </button>
  </div>

  <!-- Toolbar -->
  <div class="bg-white border-b border-slate-200 px-3 py-1 flex items-center gap-px flex-shrink-0 overflow-x-auto">
    ${toolbarHtml}
    <div class="flex items-center gap-2 ml-auto pl-2 flex-shrink-0">
      <span id="notes-save-indicator" class="text-xs text-slate-300">saved</span>
      <button onclick="_notesSplitView=!_notesSplitView;render_notes()" title="Toggle split view"
        class="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
          ${_notesSplitView ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50'}">
        ⊟ Split
      </button>
    </div>
  </div>

  <!-- Editor + Preview -->
  <div class="flex flex-1 overflow-hidden">

    <!-- Editor pane -->
    <div class="${_notesSplitView ? 'w-1/2 border-r border-slate-200' : 'flex-1'} flex flex-col">
      <textarea id="note-editor"
        class="flex-1 p-5 text-sm text-slate-800 font-mono leading-relaxed resize-none
          focus:outline-none bg-white caret-indigo-500"
        placeholder="Start writing…  Markdown supported"
        spellcheck="true"
        oninput="scheduleNoteSave()"
        onkeydown="notesKeydown(event)">${esc(note.content||'')}</textarea>
    </div>

    <!-- Preview pane (split view) -->
    ${_notesSplitView ? `
    <div class="flex-1 overflow-y-auto p-6 bg-slate-50">
      <div id="note-preview" class="prose max-w-none text-slate-800 text-sm leading-relaxed">
        ${previewHtml}
      </div>
    </div>` : ''}
  </div>`
}

// ── Filtering ─────────────────────────────────────────────────────────────────

function _notesFiltered() {
  let list = [...state.notes].sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''))
  if (_notesTypeFilter !== 'all') list = list.filter(n => n.type === _notesTypeFilter)
  if (_notesSearch) {
    const q = _notesSearch.toLowerCase()
    list = list.filter(n =>
      (n.title  ||'').toLowerCase().includes(q) ||
      (n.content||'').toLowerCase().includes(q) ||
      (n.tags   ||[]).some(t => t.toLowerCase().includes(q))
    )
  }
  return list
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

async function newNote(type = 'note') {
  const note = {
    id:        'note-' + uid(),
    title:     '',
    content:   NOTE_TEMPLATES[type] || '',
    type,
    tags:      [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  state.notes.unshift(note)
  await save('notes')
  _notesActiveId = note.id
  render_notes()
  setTimeout(() => document.getElementById('note-title')?.focus(), 60)
}

async function openNote(id) {
  await autoSaveNote()
  _notesActiveId = id
  render_notes()
}

async function updateNoteType(id, type) {
  const note = state.notes.find(n => n.id === id)
  if (!note) return
  note.type      = type
  note.updatedAt = new Date().toISOString()
  await save('notes')
  render_notes()
}

async function deleteNote(id) {
  if (!confirm('Delete this note?\n\nThis cannot be undone.')) return
  state.notes = state.notes.filter(n => n.id !== id)
  await save('notes')
  if (_notesActiveId === id) _notesActiveId = state.notes[0]?.id || null
  render_notes()
}

async function exportNote(noteId) {
  await autoSaveNote()
  const note = state.notes.find(n => n.id === noteId)
  if (!note) return
  const dest = await api.openSaveDialog({
    title:       'Export Note as Markdown',
    defaultPath: (note.title || 'note').replace(/[/\\:*?"<>|]/g,'_') + '.md',
    filters:     [{ name:'Markdown', extensions:['md'] }],
  })
  if (!dest) return
  const tagsLine = (note.tags||[]).length ? `> Tags: ${note.tags.map(t=>'#'+t).join(' ')}\n` : ''
  const full = `# ${note.title||'Untitled'}\n\n${tagsLine}> Type: ${NOTE_TYPES[note.type]?.label||note.type}\n> Updated: ${note.updatedAt ? new Date(note.updatedAt).toLocaleString() : '—'}\n\n---\n\n${note.content||''}`
  await api.writeTextFile(dest, full)
  showToast('Exported ✓')
}

// ── Auto-save ─────────────────────────────────────────────────────────────────

function scheduleNoteSave() {
  const ind = document.getElementById('notes-save-indicator')
  if (ind) ind.textContent = 'editing…'
  if (_notesSplitView) _updateNotePreview()
  if (_notesSaveTimer) clearTimeout(_notesSaveTimer)
  _notesSaveTimer = setTimeout(autoSaveNote, 700)
}

async function autoSaveNote() {
  if (!_notesActiveId) return
  const note = state.notes.find(n => n.id === _notesActiveId)
  if (!note) return
  const titleEl   = document.getElementById('note-title')
  const contentEl = document.getElementById('note-editor')
  const tagsEl    = document.getElementById('note-tags')
  if (!contentEl) return
  note.title     = (titleEl?.value  ||'').trim() || 'Untitled'
  note.content   = contentEl.value  || ''
  note.tags      = (tagsEl?.value   ||'').split(',').map(t=>t.trim()).filter(Boolean)
  note.updatedAt = new Date().toISOString()
  await save('notes')
  const ind = document.getElementById('notes-save-indicator')
  if (ind) ind.textContent = 'saved'
}

function _updateNotePreview() {
  const ta  = document.getElementById('note-editor')
  const pre = document.getElementById('note-preview')
  if (!ta || !pre) return
  pre.innerHTML = ta.value
    ? marked.parse(ta.value)
    : '<p style="color:#94a3b8;font-style:italic">Preview will appear here…</p>'
}

// ── Toolbar Insert ────────────────────────────────────────────────────────────

function _noteInsertAt(before, after) {
  const ta = document.getElementById('note-editor')
  if (!ta) return
  const s   = ta.selectionStart
  const e   = ta.selectionEnd
  const sel = ta.value.substring(s, e)
  ta.value  = ta.value.substring(0, s) + before + sel + after + ta.value.substring(e)
  ta.selectionStart = s + before.length
  ta.selectionEnd   = s + before.length + sel.length
  ta.focus()
  ta.dispatchEvent(new Event('input', { bubbles: true }))
}

function notesKeydown(e) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'b': e.preventDefault(); _noteInsertAt('**','**'); return
      case 'i': e.preventDefault(); _noteInsertAt('*', '*');  return
      case 'k': e.preventDefault(); _noteInsertAt('`', '`');  return
      case 's': e.preventDefault(); autoSaveNote(); showToast('Saved ✓','info'); return
    }
  }
  if (e.key === 'Tab') { e.preventDefault(); _noteInsertAt('  ','') }
}

// ── Click delegation (toolbar) ────────────────────────────────────────────────

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-tb]')
  if (!btn) return
  const action = _NOTES_TB.find(a => a.id === btn.dataset.tb)
  if (!action) return
  const bef = typeof action.before === 'function' ? action.before() : action.before
  _noteInsertAt(bef, action.after || '')
})
