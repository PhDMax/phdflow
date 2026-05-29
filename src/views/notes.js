// ══ Notes — Notion-style Research Notes ═══════════════════════════════════════

let _notesActiveId   = null
let _notesSearch     = ''
let _notesTypeFilter = 'all'
let _notesSaveTimer  = null
let _notesReadMode   = false

// ── Wiki-link autocomplete state ──────────────────────────────────────────────
let _wikiAcActive  = false
let _wikiAcIndex   = 0
let _wikiAcMatches = []
let _wikiAcStart   = -1

const NOTE_TYPES = {
  note:       { icon: '📄', label: 'Note',           cls: 'background:#f1f5f9;color:#475569'   },
  experiment: { icon: '🧪', label: 'Experiment Log', cls: 'background:#eff6ff;color:#1d4ed8'   },
  meeting:    { icon: '🤝', label: 'Meeting',        cls: 'background:#faf5ff;color:#7c3aed'   },
  writing:    { icon: '✍️',  label: 'Writing Draft',  cls: 'background:#f0fdf4;color:#15803d'   },
}

const NOTE_TEMPLATES = {
  note: '',
  experiment: `## Objective\n\n\n\n## Protocol\n\n\n\n## Observations\n\n\n\n## Results\n\n\n\n## Next Steps\n\n`,
  meeting:    `## Meeting: \n**Date:** ${new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}\n**Attendees:** \n\n## Agenda\n\n\n\n## Discussion\n\n\n\n## Action Items\n- [ ] \n- [ ] \n`,
  writing:    `## Introduction\n\n\n\n## Key Points\n\n\n\n## Notes / References\n\n`,
}

const _NOTES_TB = [
  { id:'bold',      before:'**',      after:'**',    label:'B',    title:'Bold (Ctrl+B)',        s:'font-weight:700'        },
  { id:'italic',    before:'*',       after:'*',     label:'I',    title:'Italic (Ctrl+I)',      s:'font-style:italic'      },
  { id:'strike',    before:'~~',      after:'~~',    label:'S',    title:'Strikethrough',        s:'text-decoration:line-through' },
  { id:'SEP' },
  { id:'h1',        before:'# ',      after:'',      label:'H1',   title:'Heading 1'            },
  { id:'h2',        before:'## ',     after:'',      label:'H2',   title:'Heading 2'            },
  { id:'h3',        before:'### ',    after:'',      label:'H3',   title:'Heading 3'            },
  { id:'SEP' },
  { id:'code',      before:'`',       after:'`',     label:'</>',  title:'Inline code (Ctrl+K)' },
  { id:'codeblock', before:'```\n',   after:'\n```', label:'{ }',  title:'Code block'           },
  { id:'math',      before:'$$\n',    after:'\n$$',  label:'∑',    title:'Math / LaTeX'         },
  { id:'SEP' },
  { id:'quote',     before:'> ',      after:'',      label:'❝',    title:'Blockquote'           },
  { id:'ul',        before:'- ',      after:'',      label:'•',    title:'Bullet list'          },
  { id:'ol',        before:'1. ',     after:'',      label:'1.',   title:'Numbered list'        },
  { id:'task',      before:'- [ ] ',  after:'',      label:'☑',    title:'Task / to-do'         },
  { id:'hr',        before:'\n---\n', after:'',      label:'—',    title:'Divider'              },
  { id:'SEP' },
  { id:'table',     before:'| Col 1 | Col 2 | Col 3 |\n| --- | --- | --- |\n| | | |\n', after:'', label:'⊞', title:'Table' },
  { id:'link',      before:'[',       after:'](url)',label:'🔗',   title:'Link'                 },
  { id:'wikilink',  before:'[[',      after:']]',   label:'↗',    title:'Link to another note ([[title]])'  },
  { id:'date',      before:() => `**${new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}**  \n`, after:'', label:'📅', title:"Today's date" },
]

// ── Sidebar styles (constant) ─────────────────────────────────────────────────
const _S = {
  sidebar:      'width:240px;flex-shrink:0;background:#191919;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid rgba(255,255,255,.06)',
  sideHdr:      'padding:.875rem 1rem .5rem;font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#4b5563',
  searchWrap:   'padding:.25rem .75rem .75rem',
  searchInp:    'width:100%;padding:.4rem .75rem;background:#2d2d2d;border:1px solid rgba(255,255,255,.08);border-radius:.5rem;font-size:.75rem;color:#d1d5db;outline:none;box-sizing:border-box',
  filterBar:    'padding:0 .75rem .625rem;display:flex;gap:.25rem;flex-wrap:wrap',
  noteList:     'flex:1;overflow-y:auto;padding:.25rem .5rem',
  noteFooter:   'padding:.75rem;border-top:1px solid rgba(255,255,255,.06)',
  newBtn:       'display:flex;align-items:center;gap:.5rem;width:100%;padding:.5rem .75rem;background:none;border:none;border-radius:.5rem;font-size:.75rem;color:#6b7280;cursor:pointer;transition:background .15s;text-align:left',
  quickBtns:    'display:flex;gap:.25rem;padding:.125rem .25rem',
  quickBtn:     'flex:1;padding:.35rem 0;background:none;border:none;border-radius:.375rem;font-size:1rem;cursor:pointer;text-align:center',
  noteCount:    'font-size:.7rem;color:#374151;padding:.25rem .75rem 0',
  // note items
  noteItem:     (active) => `display:block;width:100%;padding:.5rem .75rem;border-radius:.5rem;cursor:pointer;border:none;text-align:left;transition:background .12s;background:${active?'#2d2d2d':'transparent'}`,
  noteTitle:    (active) => `display:block;font-size:.8rem;font-weight:500;color:${active?'#f3f4f6':'#9ca3af'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis`,
  notePreview:  'display:block;font-size:.72rem;color:#4b5563;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:.1rem',
  noteDate:     'font-size:.68rem;color:#374151;float:right;margin-left:.25rem',
}

// ── Main Render ───────────────────────────────────────────────────────────────

function render_notes() {
  const vc = document.getElementById('view-content')
  if (!vc) return

  const filtered = _notesFiltered()
  const active   = _notesActiveId ? state.notes.find(n => n.id === _notesActiveId) : null

  // Build sidebar note list HTML
  const listHtml = filtered.length === 0
    ? `<p style="font-size:.75rem;color:#374151;text-align:center;padding:2.5rem 1rem">${state.notes.length===0?'No notes yet':'No matches'}</p>`
    : filtered.map(n => {
        const type     = NOTE_TYPES[n.type] || NOTE_TYPES.note
        const isActive = n.id === _notesActiveId
        const plainContent = (n.content||'').replace(/^#+\s*/gm,'').replace(/[*`_~>\[\]#]/g,'').trim()
        let preview = plainContent.slice(0, 55)
        if (_notesSearch) {
          const q = _notesSearch.toLowerCase()
          const idx = plainContent.toLowerCase().indexOf(q)
          if (idx > 0 && !(n.title||'').toLowerCase().includes(q)) {
            const start = Math.max(0, idx - 15)
            preview = (start > 0 ? '…' : '') + plainContent.slice(start, start + 60)
          }
        }
        const dateStr  = n.updatedAt ? new Date(n.updatedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : ''
        const wordCount = (n.content||'').trim().split(/\s+/).filter(Boolean).length
        const wcStr = wordCount > 999 ? Math.round(wordCount/1000*10)/10+'k' : String(wordCount)
        return `<button onclick="openNote('${n.id}')" style="${_S.noteItem(isActive)}">
          <span style="${_S.noteDate}">${dateStr}</span>
          <span style="${_S.noteTitle(isActive)}">${n.pinned ? '📌 ' : ''}${type.icon} ${esc(n.title||'Untitled')}</span>
          <span style="display:flex;justify-content:space-between;align-items:center;margin-top:.1rem">
            ${preview ? `<span style="${_S.notePreview};flex:1;margin-top:0">${esc(preview)}</span>` : '<span></span>'}
            <span style="font-size:.66rem;color:#374151;flex-shrink:0;margin-left:.25rem">${wordCount > 0 ? wcStr+'w' : ''}</span>
          </span>
        </button>`
      }).join('')

  // Build filter pills
  const allPill = (k) => `_notesTypeFilter='${k}';render_notes()`
  const filterPillStyle = (k) => `padding:.2rem .625rem;border-radius:1rem;font-size:.7rem;font-weight:500;border:none;cursor:pointer;transition:background .12s;background:${_notesTypeFilter===k?'#3b3b3b':'transparent'};color:${_notesTypeFilter===k?'#e5e7eb':'#6b7280'}`

  vc.innerHTML = `<div style="display:flex;height:100%;overflow:hidden">

  <!-- ── SIDEBAR ─────────────────────────────────────────────────────────── -->
  <div style="${_S.sidebar}">
    <div style="${_S.sideHdr}">Notes</div>

    <div style="${_S.searchWrap}">
      <input type="text" value="${esc(_notesSearch)}" placeholder="Search…"
        oninput="_notesSearch=this.value;render_notes()"
        style="${_S.searchInp}"
        onfocus="this.style.borderColor='rgba(255,255,255,.2)'"
        onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
    </div>

    <div style="${_S.filterBar}">
      <button onclick="${allPill('all')}" style="${filterPillStyle('all')}">All</button>
      ${Object.entries(NOTE_TYPES).map(([k,v])=>`
      <button onclick="${allPill(k)}" title="${v.label}" style="${filterPillStyle(k)}">${v.icon}</button>`).join('')}
    </div>

    <div style="${_S.noteList}">${listHtml}</div>

    <div style="${_S.noteFooter}">
      <button onclick="newNote('note')"
        style="${_S.newBtn}"
        onmouseover="this.style.background='#2d2d2d'" onmouseout="this.style.background='none'">
        <span style="color:#4b5563;font-size:1rem;line-height:1">+</span>
        <span>New page</span>
      </button>
      <div style="${_S.quickBtns}">
        ${Object.entries(NOTE_TYPES).filter(([k])=>k!=='note').map(([k,v])=>`
        <button onclick="newNote('${k}')" title="${v.label}"
          style="${_S.quickBtn}"
          onmouseover="this.style.background='#2d2d2d'" onmouseout="this.style.background='none'">${v.icon}</button>`).join('')}
      </div>
      <div style="${_S.noteCount}">${state.notes.length} note${state.notes.length!==1?'s':''}</div>
    </div>
  </div>

  <!-- ── MAIN ────────────────────────────────────────────────────────────── -->
  <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;background:#fff">
    ${active ? _notesEditorPanel(active) : `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:3rem">
      <div style="font-size:3rem;margin-bottom:1.25rem;opacity:.25">📄</div>
      <p style="font-size:.9375rem;font-weight:600;color:#6b7280;margin:0 0 .375rem">No page selected</p>
      <p style="font-size:.8rem;color:#9ca3af;margin:0 0 1.75rem">Pick a note from the sidebar or create one.</p>
      <button onclick="newNote('note')"
        style="padding:.625rem 1.5rem;background:#191919;color:#fff;border:none;border-radius:.75rem;font-size:.8rem;font-weight:600;cursor:pointer">
        + New page
      </button>
    </div>`}
  </div>

</div>`
}

// ── Editor / Reading Panel ────────────────────────────────────────────────────

function _notesEditorPanel(note) {
  const tagsStr    = (note.tags || []).join(', ')
  const type       = NOTE_TYPES[note.type] || NOTE_TYPES.note
  const updatedStr = note.updatedAt
    ? new Date(note.updatedAt).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})
    : ''

  // Toolbar HTML
  const tbHtml = _NOTES_TB.map(a => {
    if (a.id === 'SEP') return `<div style="width:1px;height:1rem;background:#e5e7eb;margin:0 .25rem;flex-shrink:0"></div>`
    return `<button data-tb="${a.id}" title="${a.title}"
      style="padding:.3rem .5rem;border:none;background:none;border-radius:.375rem;font-size:.75rem;
        color:#6b7280;cursor:pointer;flex-shrink:0;${a.s||''}"
      onmouseover="this.style.background='#f3f4f6';this.style.color='#111827'"
      onmouseout="this.style.background='none';this.style.color='#6b7280'">
      ${a.label}
    </button>`
  }).join('')

  if (_notesReadMode) {
    // ── Reading mode ──────────────────────────────────────────────────────────
    const resolved    = _resolveWikiLinks(note.content || '')
    const previewHtml = resolved
      ? marked.parse(resolved)
      : '<p style="color:#d1d5db;font-style:italic">Nothing here yet…</p>'

    const backlinks = _getBacklinks(note.id)
    const backlinksHtml = backlinks.length ? `
    <div style="margin-top:3rem;padding-top:1.5rem;border-top:1px solid #f3f4f6">
      <div style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:.875rem">
        ↩ Referenced by (${backlinks.length})
      </div>
      <div style="display:flex;flex-direction:column;gap:.5rem">
        ${backlinks.map(n => {
          const bt = NOTE_TYPES[n.type] || NOTE_TYPES.note
          return `<button onclick="openNote('${n.id}')"
            style="display:flex;align-items:center;gap:.625rem;padding:.625rem .875rem;
              border:1px solid #ede9fe;background:#faf5ff;border-radius:.75rem;
              font-size:.8rem;color:#7c3aed;cursor:pointer;text-align:left;font-family:inherit">
            <span>${bt.icon}</span>
            <span style="font-weight:500">${esc(n.title||'Untitled')}</span>
            <span style="font-size:.7rem;color:#c4b5fd;margin-left:auto">${bt.label}</span>
          </button>`
        }).join('')}
      </div>
    </div>` : ''

    return `
    <!-- Reading top bar -->
    <div style="border-bottom:1px solid #f3f4f6;padding:.5rem 1.25rem;display:flex;align-items:center;gap:.75rem;flex-shrink:0">
      <span style="${type.cls};padding:.2rem .6rem;border-radius:.375rem;font-size:.72rem;font-weight:600">${type.icon} ${type.label}</span>
      <span style="font-size:.75rem;color:#d1d5db">${updatedStr}</span>
      <div style="margin-left:auto;display:flex;gap:.5rem">
        <button onclick="toggleNotePin('${note.id}')"
          title="${note.pinned ? 'Unpin note' : 'Pin to top'}"
          style="padding:.375rem .875rem;border:1px solid ${note.pinned ? '#a5b4fc' : '#e5e7eb'};background:${note.pinned ? '#eef2ff' : '#fff'};border-radius:.5rem;font-size:.75rem;color:${note.pinned ? '#6366f1' : '#6b7280'};cursor:pointer">
          📌 ${note.pinned ? 'Pinned' : 'Pin'}
        </button>
        <button onclick="exportNote('${note.id}')"
          style="padding:.375rem .875rem;border:1px solid #e5e7eb;background:#fff;border-radius:.5rem;font-size:.75rem;color:#6b7280;cursor:pointer">
          ↓ Export
        </button>
        <button onclick="deleteNote('${note.id}')"
          style="padding:.375rem .875rem;border:1px solid #fecaca;background:#fff;border-radius:.5rem;font-size:.75rem;color:#ef4444;cursor:pointer">
          Delete
        </button>
        <button onclick="notesToggleRead()"
          style="padding:.375rem .875rem;background:#111827;color:#fff;border:none;border-radius:.5rem;font-size:.75rem;font-weight:600;cursor:pointer">
          ✏️ Edit
        </button>
      </div>
    </div>

    <!-- Reading document -->
    <div style="flex:1;overflow-y:auto">
      <div style="max-width:720px;margin:0 auto;padding:3rem 4rem 6rem">
        <div style="font-size:3rem;margin-bottom:1.25rem;line-height:1">${type.icon}</div>
        <h1 style="font-size:2.25rem;font-weight:700;color:#111827;line-height:1.15;margin:0 0 1rem;letter-spacing:-.02em">${esc(note.title||'Untitled')}</h1>
        ${note.tags?.length ? `
        <div style="display:flex;flex-wrap:wrap;gap:.375rem;margin-bottom:1.5rem">
          ${note.tags.map(t=>`<span style="font-size:.7rem;padding:.2rem .625rem;border-radius:1rem;background:#f3f4f6;color:#6b7280">#${esc(t)}</span>`).join('')}
        </div>` : ''}
        <div style="border-top:1px solid #f3f4f6;margin-bottom:2rem"></div>
        <div class="prose">${previewHtml}</div>
        ${backlinksHtml}
      </div>
    </div>`
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────
  return `
  <!-- Top bar -->
  <div style="border-bottom:1px solid #f3f4f6;padding:.4rem 1rem;display:flex;align-items:center;gap:.5rem;flex-shrink:0;min-height:38px">
    <select onchange="updateNoteType('${note.id}',this.value)"
      style="font-size:.75rem;background:none;border:none;color:#9ca3af;outline:none;cursor:pointer;padding:.2rem 0">
      ${Object.entries(NOTE_TYPES).map(([k,v])=>`<option value="${k}" ${note.type===k?'selected':''}>${v.icon} ${v.label}</option>`).join('')}
    </select>
    <div style="margin-left:auto;display:flex;align-items:center;gap:.375rem">
      <span id="notes-save-indicator" style="font-size:.7rem;color:#d1d5db;margin-right:.25rem">saved</span>
      <button onclick="toggleNotePin('${note.id}')"
        title="${note.pinned ? 'Unpin' : 'Pin to top'}"
        style="padding:.3rem .75rem;border:1px solid ${note.pinned ? '#a5b4fc' : '#e5e7eb'};background:${note.pinned ? '#eef2ff' : '#fff'};border-radius:.5rem;font-size:.72rem;color:${note.pinned ? '#6366f1' : '#6b7280'};cursor:pointer">
        📌${note.pinned ? ' Pinned' : ''}
      </button>
      <button onclick="exportNote('${note.id}')"
        style="padding:.3rem .75rem;border:1px solid #e5e7eb;background:#fff;border-radius:.5rem;font-size:.72rem;color:#6b7280;cursor:pointer">
        ↓ .md
      </button>
      <button onclick="deleteNote('${note.id}')"
        style="padding:.3rem .75rem;border:1px solid #fecaca;background:#fff;border-radius:.5rem;font-size:.72rem;color:#ef4444;cursor:pointer">
        Delete
      </button>
      <div style="width:1px;height:1rem;background:#e5e7eb;margin:0 .125rem"></div>
      <button onclick="notesToggleRead()"
        style="padding:.3rem .75rem;border:1px solid #e5e7eb;background:#fff;border-radius:.5rem;font-size:.72rem;color:#6b7280;cursor:pointer">
        👁 Read
      </button>
    </div>
  </div>

  <!-- Formatting toolbar -->
  <div style="border-bottom:1px solid #f3f4f6;padding:.2rem .75rem;display:flex;align-items:center;flex-shrink:0;overflow-x:auto;gap:.1rem;min-height:34px">
    ${tbHtml}
  </div>

  <!-- ══ THE PAGE ══════════════════════════════════════════════════════════ -->
  <!-- This div scrolls. Everything inside is the "document". -->
  <div style="flex:1;overflow-y:auto;background:#fff" id="notes-scroll-area">
    <div style="max-width:720px;margin:0 auto;padding:3.5rem 4rem 8rem;box-sizing:border-box">

      <!-- Page icon -->
      <div style="font-size:2.75rem;line-height:1;margin-bottom:1rem;user-select:none">${type.icon}</div>

      <!-- Title — big, Notion-style -->
      <input id="note-title" type="text" value="${esc(note.title||'')}"
        placeholder="Untitled"
        style="display:block;width:100%;font-size:2.25rem;font-weight:700;color:#111827;
          background:transparent;border:none;outline:none;padding:0;margin:0 0 .875rem;
          line-height:1.15;letter-spacing:-.02em;font-family:inherit;box-sizing:border-box;"
        oninput="scheduleNoteSave()"/>

      <!-- Properties row: tags + date -->
      <div style="display:flex;align-items:center;gap:.75rem;padding-bottom:1.25rem;
        border-bottom:1px solid #f3f4f6;margin-bottom:1.5rem">
        <input id="note-tags" type="text" value="${esc(tagsStr)}"
          placeholder="Add tags, comma separated…"
          style="flex:1;background:transparent;border:none;outline:none;font-size:.8rem;
            color:#9ca3af;font-family:inherit;min-width:0;"
          oninput="scheduleNoteSave()"/>
        ${updatedStr ? `<span style="font-size:.75rem;color:#d1d5db;flex-shrink:0">${updatedStr}</span>` : ''}
      </div>

      <!-- Content textarea — grows with content, fills page -->
      <textarea id="note-editor"
        placeholder="Start writing…"
        spellcheck="true"
        style="display:block;width:100%;min-height:65vh;font-size:15px;line-height:1.85;
          color:#374151;background:transparent;border:none;outline:none;resize:none;
          font-family:inherit;overflow:hidden;box-sizing:border-box;padding:0;"
        oninput="scheduleNoteSave();_notesGrow(this);_wikiCheck(this)"
        onkeydown="notesKeydown(event)">${esc(note.content||'')}</textarea>

    </div>
  </div>`
}

// ── Auto-grow textarea ────────────────────────────────────────────────────────

function _notesGrow(el) {
  // Let the textarea be as tall as its content, but never smaller than 65vh
  el.style.height = 'auto'
  el.style.height = Math.max(el.scrollHeight, Math.round(window.innerHeight * 0.65)) + 'px'
}

function _notesInitGrow() {
  const ta = document.getElementById('note-editor')
  if (ta) _notesGrow(ta)
}

// ── Filtering ─────────────────────────────────────────────────────────────────

function _notesFiltered() {
  let list = [...state.notes].sort((a,b) => {
    // Pinned first, then most-recently-updated
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return (b.updatedAt||'').localeCompare(a.updatedAt||'')
  })
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
  _notesReadMode = false
  render_notes()
  setTimeout(() => { document.getElementById('note-title')?.focus(); _notesInitGrow() }, 60)
}

async function openNote(id) {
  _wikiAcHide()
  await autoSaveNote()
  _notesActiveId = id
  _notesReadMode = false
  render_notes()
  setTimeout(_notesInitGrow, 60)
}

async function notesToggleRead() {
  await autoSaveNote()
  _notesReadMode = !_notesReadMode
  render_notes()
}

async function updateNoteType(id, type) {
  const note = state.notes.find(n => n.id === id)
  if (!note) return
  note.type      = type
  note.updatedAt = new Date().toISOString()
  await save('notes')
  render_notes()
  setTimeout(_notesInitGrow, 60)
}

async function toggleNotePin(id) {
  const n = state.notes.find(x => x.id === id)
  if (!n) return
  n.pinned = !n.pinned
  await save('notes')
  render_notes()
  showToast(n.pinned ? '📌 Note pinned to top' : 'Note unpinned')
}

async function deleteNote(id) {
  const snap     = [...state.notes]
  const title    = state.notes.find(n => n.id === id)?.title || 'Note'
  const wasActive = _notesActiveId === id
  state.notes = state.notes.filter(n => n.id !== id)
  await save('notes')
  if (wasActive) { _notesActiveId = state.notes[0]?.id || null; _notesReadMode = false }
  render_notes()
  showUndoToast(`"${title}" deleted`, async () => {
    state.notes = snap
    await save('notes')
    if (wasActive) _notesActiveId = id
    render_notes(); showToast('Note restored ✓')
  })
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
  if (ind) ind.textContent = 'saving…'
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
  if (!contentEl && !titleEl) return
  if (titleEl)   note.title   = titleEl.value.trim() || 'Untitled'
  if (contentEl) note.content = contentEl.value || ''
  if (tagsEl)    note.tags    = tagsEl.value.split(',').map(t=>t.trim()).filter(Boolean)
  note.updatedAt = new Date().toISOString()
  await save('notes')
  const ind = document.getElementById('notes-save-indicator')
  if (ind) ind.textContent = 'saved'
}

// ── Toolbar insert ────────────────────────────────────────────────────────────

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
  _notesGrow(ta)
  ta.dispatchEvent(new Event('input', { bubbles: true }))
}

function notesKeydown(e) {
  // Wiki-link autocomplete navigation takes priority
  if (_wikiAcActive) {
    if (e.key === 'ArrowDown')  { e.preventDefault(); _wikiAcIndex = Math.min(_wikiAcIndex + 1, _wikiAcMatches.length - 1); _wikiAcHighlight(); return }
    if (e.key === 'ArrowUp')    { e.preventDefault(); _wikiAcIndex = Math.max(_wikiAcIndex - 1, 0); _wikiAcHighlight(); return }
    if (e.key === 'Enter')      { e.preventDefault(); _wikiAcSelect(_wikiAcIndex); return }
    if (e.key === 'Escape')     { e.preventDefault(); _wikiAcHide(); return }
  }
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

// ── Toolbar click delegation ──────────────────────────────────────────────────

document.addEventListener('click', e => {
  // Close wiki autocomplete on outside click
  if (_wikiAcActive && !e.target.closest('#wiki-ac') && !e.target.closest('#note-editor')) {
    _wikiAcHide()
  }

  const btn = e.target.closest('[data-tb]')
  if (!btn) return
  const action = _NOTES_TB.find(a => a.id === btn.dataset.tb)
  if (!action) return
  const bef = typeof action.before === 'function' ? action.before() : action.before
  _noteInsertAt(bef, action.after || '')

  // After inserting [[, immediately trigger autocomplete
  if (action.id === 'wikilink') {
    const ta = document.getElementById('note-editor')
    if (ta) setTimeout(() => _wikiCheck(ta), 0)
  }
})

// ══ Wiki-link System ══════════════════════════════════════════════════════════

// ── Autocomplete ──────────────────────────────────────────────────────────────

function _wikiCheck(ta) {
  const cur    = ta.selectionStart
  const before = ta.value.substring(0, cur)
  const openAt = before.lastIndexOf('[[')

  if (openAt === -1 || before.substring(openAt + 2).includes(']]')) {
    _wikiAcHide(); return
  }

  const partial = before.substring(openAt + 2)
  _wikiAcStart  = openAt

  const q = partial.toLowerCase()
  _wikiAcMatches = state.notes
    .filter(n => n.id !== _notesActiveId && (n.title || 'Untitled').toLowerCase().includes(q))
    .slice(0, 7)

  if (!_wikiAcMatches.length) { _wikiAcHide(); return }

  _wikiAcActive = true
  _wikiAcIndex  = 0
  _wikiAcShow(ta, partial)
}

function _wikiAcShow(ta, partial) {
  let el = document.getElementById('wiki-ac')
  if (!el) {
    el = document.createElement('div')
    el.id = 'wiki-ac'
    document.body.appendChild(el)
  }

  // Position: top-left corner of the editor scroll area
  const area = document.getElementById('notes-scroll-area')
  const rect  = area ? area.getBoundingClientRect() : ta.getBoundingClientRect()
  const top   = Math.min(rect.top + 12, window.innerHeight - 260)
  const left  = Math.min(rect.left + 12, window.innerWidth  - 320)

  el.style.cssText = `position:fixed;top:${top}px;left:${left}px;z-index:9999;
    background:#fff;border:1px solid #e5e7eb;border-radius:.75rem;
    box-shadow:0 8px 32px rgba(0,0,0,.14);min-width:220px;max-width:320px;overflow:hidden`

  const header = `<div style="padding:.4rem .875rem;font-size:.68rem;color:#9ca3af;
    border-bottom:1px solid #f3f4f6;display:flex;align-items:center;gap:.375rem">
    <span>↗</span>
    <span>${partial ? `Link to "<strong>${esc(partial)}</strong>"` : 'Link to a note…'}</span>
    <span style="margin-left:auto;color:#d1d5db">↑↓ Enter</span>
  </div>`

  el.innerHTML = header + _wikiAcMatches.map((n, i) => {
    const t = NOTE_TYPES[n.type] || NOTE_TYPES.note
    return `<button id="wiki-ac-${i}" onclick="_wikiAcSelect(${i})"
      onmouseenter="_wikiAcIndex=${i};_wikiAcHighlight()"
      style="display:block;width:100%;text-align:left;padding:.5rem .875rem;border:none;
        font-size:.8rem;cursor:pointer;font-family:inherit;transition:background .08s;
        background:${i===0?'#f5f3ff':'#fff'};color:${i===0?'#7c3aed':'#374151'}">
      ${t.icon} <span style="font-weight:500">${esc(n.title||'Untitled')}</span>
      <span style="font-size:.7rem;color:#c4b5fd;margin-left:.375rem">${t.label}</span>
    </button>`
  }).join('')
}

function _wikiAcHighlight() {
  _wikiAcMatches.forEach((_, i) => {
    const el = document.getElementById(`wiki-ac-${i}`)
    if (!el) return
    const active = i === _wikiAcIndex
    el.style.background = active ? '#f5f3ff' : '#fff'
    el.style.color       = active ? '#7c3aed' : '#374151'
  })
}

function _wikiAcHide() {
  _wikiAcActive = false
  const el = document.getElementById('wiki-ac')
  if (el) el.remove()
}

function _wikiAcSelect(idx) {
  const match = _wikiAcMatches[idx]
  if (!match) return
  const ta = document.getElementById('note-editor')
  if (!ta) return

  const cur    = ta.selectionStart
  const before = ta.value.substring(0, _wikiAcStart)
  const after  = ta.value.substring(cur)
  const link   = `[[${match.title || 'Untitled'}]]`

  ta.value = before + link + after
  const newPos = before.length + link.length
  ta.selectionStart = newPos
  ta.selectionEnd   = newPos
  ta.focus()

  _wikiAcHide()
  _notesGrow(ta)
  scheduleNoteSave()
}

// ── Read-mode rendering ───────────────────────────────────────────────────────

function _resolveWikiLinks(content) {
  return content.replace(/\[\[([^\]\n]+)\]\]/g, (_, title) => {
    const trimmed = title.trim()
    const note    = state.notes.find(n => (n.title || 'Untitled') === trimmed)
    if (note) {
      return `<a href="#" onclick="event.preventDefault();openNote('${note.id}')"
        style="color:#7c3aed;background:#f5f3ff;padding:.1rem .4rem;border-radius:.375rem;
          text-decoration:none;font-weight:500;border:1px solid #ede9fe;
          cursor:pointer;font-size:.95em" title="Open note: ${trimmed}">${trimmed}</a>`
    }
    return `<span style="color:#9ca3af;background:#f9fafb;padding:.1rem .4rem;
      border-radius:.375rem;border:1px solid #f1f5f9;text-decoration:line-through"
      title="Note not found: ${trimmed}">${trimmed}</span>`
  })
}

// ── Backlinks ─────────────────────────────────────────────────────────────────

function _getBacklinks(noteId) {
  const title = (state.notes.find(n => n.id === noteId)?.title || '').trim()
  if (!title) return []
  const pattern = `[[${title}]]`
  return state.notes.filter(n => n.id !== noteId && (n.content || '').includes(pattern))
}
