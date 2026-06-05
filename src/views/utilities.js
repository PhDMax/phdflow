// ══ Tools — persistent workspaces ════════════════════════════════════════════

let _utilPdfOp    = 'merge'
let _utilCitPaper = null
let _utilUnitCat  = 'length'
let _rStep        = []
let _rResult      = null

// ── Shared history engine ─────────────────────────────────────────────────────
const _toolHist = { pdf: null, cit: null, units: null, r: null }

async function _loadToolHist(key) {
  if (_toolHist[key] === null)
    _toolHist[key] = (await api.storeGet('toolHist_' + key)) || []
  return _toolHist[key]
}

async function _pushToolHist(key, entry) {
  const hist = await _loadToolHist(key)
  hist.unshift({ id: uid(), date: new Date().toISOString(), ...entry })
  if (hist.length > 60) hist.splice(60)
  await api.storeSet('toolHist_' + key, hist)
  _refreshHistPanel(key)
}

function _refreshHistPanel(key) {
  const el = document.getElementById('tool-hist-list-' + key)
  if (el && _toolHist[key]) el.innerHTML = _histListHTML(key, _toolHist[key])
}

function _histListHTML(key, items) {
  if (!items.length) return `<p class="text-xs text-slate-500 px-3 py-4 text-center">No history yet</p>`
  return items.map(e => {
    const d  = new Date(e.date)
    const ds = d.toLocaleDateString('en-GB',{day:'numeric',month:'short'}) + ' ' + d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})
    return `<button onclick="_loadHistEntry('${key}','${e.id}')"
      class="w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors border-b border-slate-700/40 group">
      <div class="text-xs font-medium text-slate-200 truncate">${esc(e.label||'Session')}</div>
      <div class="text-[10px] text-slate-500 mt-0.5">${ds}</div>
    </button>`
  }).join('')
}

function _loadHistEntry(key, id) {
  const hist  = _toolHist[key] || []
  const entry = hist.find(e => e.id === id)
  if (!entry) return
  if (key === 'pdf')   { _utilPdfOp = entry.op || 'merge'; _refreshHistPanel('pdf') }
  if (key === 'cit')   { _utilCitPaper = entry.paper || null; _refreshHistPanel('cit'); _rerenderCitTool() }
  if (key === 'units') { _utilUnitCat = entry.cat || 'length'; _unitFrom = entry.from||''; _unitTo = entry.to||''; _unitVal = entry.val||''; _refreshHistPanel('units'); _rerenderUnitTool() }
  if (key === 'r')     { _rStep = []; _rResult = null; _refreshHistPanel('r'); _rerenderRTool() }
  showToast('Session loaded')
}

async function _utilAiSearch(key) {
  const q = document.getElementById('hist-search-' + key)?.value?.trim()
  if (!q) return
  if (!window._aiAvailable || !_aiAvailable()) { showToast('Start Odysseus in Settings to use AI search', 'error'); return }
  const hist = _toolHist[key] || []
  const ctx  = hist.slice(0,20).map(e => `[${e.date?.slice(0,10)||'?'}] ${e.label||'Session'}`).join('\n')
  const prompt = `The user is searching their tool history for: "${q}"\n\nHistory entries:\n${ctx}\n\nWhich entries are most relevant? Reply with a short list of entry labels only.`
  try {
    const res = await api.odysseusChat({ messages:[{ role:'user', content: prompt }] })
    showToast(res?.content || 'No match found')
  } catch { showToast('AI search failed','error') }
}

// ── Shared history sidebar panel ──────────────────────────────────────────────
function _histSidebar(key, folderSub) {
  return `
  <div class="w-52 flex-shrink-0 bg-slate-900 flex flex-col overflow-hidden border-r border-slate-700/60">
    <div class="px-3 py-2.5 border-b border-slate-700/60 flex items-center justify-between flex-shrink-0">
      <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">History</span>
      <button onclick="openPhDFlowFolder('${folderSub}')" title="Open folder" class="text-slate-500 hover:text-slate-200 text-sm">📁</button>
    </div>
    <div class="px-2 py-1.5 border-b border-slate-700/60 flex-shrink-0 flex gap-1">
      <input id="hist-search-${key}" type="text" placeholder="Filter…"
        class="flex-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 px-2 py-1 outline-none focus:border-indigo-500"
        oninput="this.value ? _filterHistPanel('${key}',this.value) : _refreshHistPanel('${key}')"/>
      <button onclick="_utilAiSearch('${key}')" title="AI search (requires Odysseus)"
        class="text-slate-500 hover:text-indigo-400 text-sm px-1">✦</button>
    </div>
    <div id="tool-hist-list-${key}" class="flex-1 overflow-y-auto">
      <p class="text-xs text-slate-500 px-3 py-4 text-center">Loading…</p>
    </div>
    <div class="px-3 py-2 border-t border-slate-700/60 flex-shrink-0">
      <button onclick="_clearToolHist('${key}')"
        class="w-full text-xs text-slate-600 hover:text-red-400 transition-colors text-center">Clear history</button>
    </div>
  </div>`
}

function _filterHistPanel(key, q) {
  const el = document.getElementById('tool-hist-list-' + key)
  if (!el) return
  const lq   = q.toLowerCase()
  const items = (_toolHist[key] || []).filter(e => (e.label||'').toLowerCase().includes(lq))
  el.innerHTML = _histListHTML(key, items)
}

async function _clearToolHist(key) {
  if (!confirm('Clear all history for this tool?')) return
  _toolHist[key] = []
  await api.storeSet('toolHist_' + key, [])
  _refreshHistPanel(key)
}

// ── 1. PDF Tools ─────────────────────────────────────────────────────────────
async function render_pdf_tools() {
  const vc = document.getElementById('view-content')
  if (!vc) return
  await _loadToolHist('pdf')
  vc.innerHTML = `<div class="flex h-full overflow-hidden">
    ${_histSidebar('pdf','PDF Tools')}
    <div class="flex-1 flex flex-col overflow-hidden">
      ${pageHeader('📄 PDF Tools', _folderBtn('PDF Tools'))}
      <div id="pdf-tool-area" class="flex-1 overflow-y-auto p-3 lg:p-5">${_utilRenderPdf()}</div>
    </div>
  </div>`
  _refreshHistPanel('pdf')
}

// ── 2. Citations ──────────────────────────────────────────────────────────────
function _rerenderCitTool() {
  const el = document.getElementById('cit-tool-area')
  if (el) el.innerHTML = _utilRenderText()
}
async function render_citations() {
  const vc = document.getElementById('view-content')
  if (!vc) return
  await _loadToolHist('cit')
  vc.innerHTML = `<div class="flex h-full overflow-hidden">
    ${_histSidebar('cit','Citations')}
    <div class="flex-1 flex flex-col overflow-hidden">
      ${pageHeader('✏️ Citations', _folderBtn('Citations'))}
      <div id="cit-tool-area" class="flex-1 overflow-y-auto p-3 lg:p-5">${_utilRenderText()}</div>
    </div>
  </div>`
  _refreshHistPanel('cit')
}

// ── 3. Unit Converter ─────────────────────────────────────────────────────────
function _rerenderUnitTool() {
  const el = document.getElementById('unit-tool-area')
  if (el) el.innerHTML = _utilRenderUnits()
}
async function render_unit_conv() {
  const vc = document.getElementById('view-content')
  if (!vc) return
  await _loadToolHist('units')
  vc.innerHTML = `<div class="flex h-full overflow-hidden">
    ${_histSidebar('units','Unit Converter')}
    <div class="flex-1 flex flex-col overflow-hidden">
      ${pageHeader('⚗️ Unit Converter', _folderBtn('Unit Converter'))}
      <div id="unit-tool-area" class="flex-1 overflow-y-auto p-3 lg:p-5">${_utilRenderUnits()}</div>
    </div>
  </div>`
  _refreshHistPanel('units')
}

// ── 4. R Assistant ────────────────────────────────────────────────────────────
function _rerenderRTool() {
  const el = document.getElementById('r-tool-area')
  if (el) el.innerHTML = _utilRenderR()
}
async function render_r_assist() {
  const vc = document.getElementById('view-content')
  if (!vc) return
  await _loadToolHist('r')
  vc.innerHTML = `<div class="flex h-full overflow-hidden">
    ${_histSidebar('r','R Assistant')}
    <div class="flex-1 flex flex-col overflow-hidden">
      ${pageHeader('📊 R Assistant', _folderBtn('R Assistant'))}
      <div id="r-tool-area" class="flex-1 overflow-y-auto p-3 lg:p-5">${_utilRenderR()}</div>
    </div>
  </div>`
  _refreshHistPanel('r')
}

// ══ PDF TOOLS ═════════════════════════════════════════════════════════════════

const PDF_OPS = [
  { id:'merge',    icon:'🔗', label:'Merge',       desc:'Combine multiple PDFs into one'             },
  { id:'split',    icon:'✂️',  label:'Split',       desc:'Extract page ranges into separate files'   },
  { id:'extract',  icon:'📤', label:'Extract',     desc:'Save specific pages to a new PDF'           },
  { id:'remove',   icon:'🗑',  label:'Remove Pages',desc:'Delete pages from a PDF'                   },
  { id:'rotate',   icon:'🔄', label:'Rotate',      desc:'Rotate pages 90° / 180° / 270°'            },
  { id:'pagenums', icon:'🔢', label:'Page Numbers',desc:'Stamp page numbers onto every page'         },
]

function _utilRenderPdf() {
  return `
  <div class="max-w-2xl mx-auto">
    <h3 class="text-sm font-bold text-slate-700 mb-4">PDF Operations</h3>

    <!-- Op selector -->
    <div class="flex gap-2 flex-wrap mb-6">
      ${PDF_OPS.map(op => `
      <button onclick="_utilPdfOp='${op.id}';document.getElementById('pdf-tool-area').innerHTML=_utilRenderPdf()"
        class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors
          ${_utilPdfOp===op.id
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}">
        ${op.icon} ${op.label}
      </button>`).join('')}
    </div>

    <!-- Operation form -->
    <div class="bg-white border border-slate-200 rounded-xl p-5">
      ${_utilPdfOpForm()}
    </div>
  </div>`
}

function _utilPdfOpForm() {
  switch(_utilPdfOp) {
    case 'merge': return `
      <h4 class="font-semibold text-slate-800 mb-1">🔗 Merge PDFs</h4>
      <p class="text-xs text-slate-500 mb-4">Select multiple PDF files. They will be merged in the order you select them.</p>
      <div class="space-y-3">
        <button onclick="utilMergePdfs()"
          class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
          📂 Select PDFs & Merge…
        </button>
      </div>`

    case 'split': return `
      <h4 class="font-semibold text-slate-800 mb-1">✂️ Split PDF by Page Ranges</h4>
      <p class="text-xs text-slate-500 mb-4">Define ranges and each will become a separate PDF.</p>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Source PDF</label>
          <button onclick="utilPickPdf('split-src')" class="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-indigo-300 transition-colors">
            <span id="split-src-lbl">Click to select PDF…</span>
          </button>
          <input type="hidden" id="split-src"/>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Page ranges  <span class="text-slate-400 font-normal">(e.g. 1-3, 4-7, 8-end)</span></label>
          <input id="split-ranges" type="text" placeholder="1-3, 4-7, 8-end"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
        </div>
        <button onclick="utilSplitPdf()"
          class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
          ✂️ Split PDF…
        </button>
      </div>`

    case 'extract': return `
      <h4 class="font-semibold text-slate-800 mb-1">📤 Extract Pages</h4>
      <p class="text-xs text-slate-500 mb-4">Save specific pages to a new single PDF.</p>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Source PDF</label>
          <button onclick="utilPickPdf('extract-src')" class="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-indigo-300 transition-colors">
            <span id="extract-src-lbl">Click to select PDF…</span>
          </button>
          <input type="hidden" id="extract-src"/>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Pages to extract  <span class="text-slate-400">(e.g. 2, 5, 8-11)</span></label>
          <input id="extract-pages" type="text" placeholder="2, 5, 8-11"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
        </div>
        <button onclick="utilExtractPages()"
          class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
          📤 Extract & Save…
        </button>
      </div>`

    case 'remove': return `
      <h4 class="font-semibold text-slate-800 mb-1">🗑 Remove Pages</h4>
      <p class="text-xs text-slate-500 mb-4">Permanently remove specific pages from a PDF.</p>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Source PDF</label>
          <button onclick="utilPickPdf('remove-src')" class="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-indigo-300 transition-colors">
            <span id="remove-src-lbl">Click to select PDF…</span>
          </button>
          <input type="hidden" id="remove-src"/>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Pages to remove  <span class="text-slate-400">(e.g. 3, 7, 12-15)</span></label>
          <input id="remove-pages-inp" type="text" placeholder="3, 7, 12-15"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
        </div>
        <button onclick="utilRemovePages()"
          class="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors">
          🗑 Remove & Save…
        </button>
      </div>`

    case 'rotate': return `
      <h4 class="font-semibold text-slate-800 mb-1">🔄 Rotate Pages</h4>
      <p class="text-xs text-slate-500 mb-4">Rotate all or specific pages clockwise.</p>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Source PDF</label>
          <button onclick="utilPickPdf('rotate-src')" class="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-indigo-300 transition-colors">
            <span id="rotate-src-lbl">Click to select PDF…</span>
          </button>
          <input type="hidden" id="rotate-src"/>
        </div>
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="block text-xs font-medium text-slate-600 mb-1">Pages</label>
            <input id="rotate-pages" type="text" placeholder="all  or  1, 3, 5-8"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          </div>
          <div class="flex-1">
            <label class="block text-xs font-medium text-slate-600 mb-1">Rotation</label>
            <select id="rotate-deg" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="90">90° clockwise</option>
              <option value="180">180°</option>
              <option value="270">270° (90° counter-clockwise)</option>
            </select>
          </div>
        </div>
        <button onclick="utilRotatePdf()"
          class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
          🔄 Rotate & Save…
        </button>
      </div>`

    case 'pagenums': return `
      <h4 class="font-semibold text-slate-800 mb-1">🔢 Add Page Numbers</h4>
      <p class="text-xs text-slate-500 mb-4">Stamp page numbers onto every page of a PDF.</p>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Source PDF</label>
          <button onclick="utilPickPdf('pn-src')" class="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-indigo-300 transition-colors">
            <span id="pn-src-lbl">Click to select PDF…</span>
          </button>
          <input type="hidden" id="pn-src"/>
        </div>
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="block text-xs font-medium text-slate-600 mb-1">Position</label>
            <select id="pn-pos" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="bottom-center">Bottom centre</option>
              <option value="bottom-right">Bottom right</option>
              <option value="bottom-left">Bottom left</option>
              <option value="top-center">Top centre</option>
              <option value="top-right">Top right</option>
            </select>
          </div>
          <div style="width:90px">
            <label class="block text-xs font-medium text-slate-600 mb-1">Start at</label>
            <input id="pn-start" type="number" value="1" min="0"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          </div>
          <div class="flex items-end pb-0.5">
            <label class="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer pb-2">
              <input type="checkbox" id="pn-total" checked class="accent-indigo-600"/> Show total
            </label>
          </div>
        </div>
        <button onclick="utilAddPageNumbers()"
          class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
          🔢 Add Page Numbers & Save…
        </button>
      </div>`

    default: return ''
  }
}

// ── PDF operation handlers ────────────────────────────────────────────────────

async function utilPickPdf(fieldId) {
  const paths = await api.openPdfDialog()
  if (!paths?.length) return
  const fp = paths[0]
  document.getElementById(fieldId).value = fp
  const lbl = document.getElementById(fieldId + '-lbl')
  if (lbl) lbl.textContent = fp.split('\\').pop()
}

async function utilMergePdfs() {
  const paths = await api.openPdfDialog()
  if (!paths || paths.length < 2) { showToast('Select at least 2 PDFs', 'error'); return }
  const dest = await api.openSaveDialog({ title:'Save merged PDF', defaultPath:'merged.pdf', filters:[{name:'PDF',extensions:['pdf']}] })
  if (!dest) return
  const r = await api.mergePdfs(paths, dest)
  if (r.success) {
    showToast(`Merged ${paths.length} PDFs ✓`)
    _pushToolHist('pdf', { op:'merge', label:`Merged ${paths.length} PDFs → ${dest.split('\\').pop()}`, files: paths.map(p=>p.split('\\').pop()), dest })
  } else showToast('Merge failed: '+r.error,'error')
}

function _parsePageList(str, total) {
  const pages = new Set()
  const parts = str.split(',').map(s=>s.trim()).filter(Boolean)
  for (const p of parts) {
    if (/^\d+$/.test(p)) {
      pages.add(parseInt(p))
    } else if (/^(\d+)\s*-\s*(\d+|end)$/i.test(p)) {
      const [,a,b] = p.match(/^(\d+)\s*-\s*(\d+|end)$/i)
      const end = b.toLowerCase()==='end' ? (total||999) : parseInt(b)
      for (let i=parseInt(a); i<=end; i++) pages.add(i)
    }
  }
  return [...pages].sort((a,b)=>a-b)
}

async function utilSplitPdf() {
  const fp = document.getElementById('split-src')?.value
  const rs = document.getElementById('split-ranges')?.value?.trim()
  if (!fp) { showToast('Select a source PDF first', 'error'); return }
  if (!rs) { showToast('Enter page ranges', 'error'); return }
  // Parse ranges
  const rangeParts = rs.split(',').map(s=>s.trim()).filter(Boolean)
  const ranges = rangeParts.map(p => {
    const pages = _parsePageList(p, 9999)
    return pages
  })
  if (!ranges.length) { showToast('Invalid ranges', 'error'); return }
  const destDir = await api.openSaveDialog({ title:'Save split files (base name)', defaultPath:'split_part.pdf', filters:[{name:'PDF',extensions:['pdf']}] })
  if (!destDir) return
  const base = destDir.replace(/\.pdf$/i,'')
  const rangeObjs = ranges.map((pages,i) => ({ pages, dest:`${base}_part${i+1}.pdf` }))
  const r = await api.splitPdf(fp, rangeObjs)
  if (r.success) {
    showToast(`Split into ${r.results.length} files ✓`)
    _pushToolHist('pdf', { op:'split', label:`Split ${fp.split('\\').pop()} → ${r.results.length} parts`, file: fp.split('\\').pop(), ranges: rs })
  } else showToast('Split failed: '+r.error,'error')
}

async function utilExtractPages() {
  const fp = document.getElementById('extract-src')?.value
  const pg = document.getElementById('extract-pages')?.value?.trim()
  if (!fp) { showToast('Select a source PDF first', 'error'); return }
  const pages = _parsePageList(pg, 9999)
  if (!pages.length) { showToast('Enter valid page numbers', 'error'); return }
  const dest = await api.openSaveDialog({ title:'Save extracted pages', defaultPath:'extracted.pdf', filters:[{name:'PDF',extensions:['pdf']}] })
  if (!dest) return
  const r = await api.splitPdf(fp, [{ pages, dest }])
  r.success ? showToast(`Extracted ${pages.length} pages ✓`) : showToast('Extract failed: '+r.error,'error')
}

async function utilRemovePages() {
  const fp = document.getElementById('remove-src')?.value
  const pg = document.getElementById('remove-pages-inp')?.value?.trim()
  if (!fp) { showToast('Select a source PDF first', 'error'); return }
  const pages = _parsePageList(pg, 9999)
  if (!pages.length) { showToast('Enter valid page numbers', 'error'); return }
  const dest = await api.openSaveDialog({ title:'Save modified PDF', defaultPath:'modified.pdf', filters:[{name:'PDF',extensions:['pdf']}] })
  if (!dest) return
  const r = await api.removePages(fp, dest, pages)
  if (r.success) {
    showToast(`Removed ${r.removed} pages → ${r.remaining} remaining ✓`)
    _pushToolHist('pdf', { op:'remove', label:`Removed pages ${pg} from ${fp.split('\\').pop()}`, file: fp.split('\\').pop(), pages: pg })
  } else showToast('Failed: '+r.error,'error')
}

async function utilRotatePdf() {
  const fp   = document.getElementById('rotate-src')?.value
  const pg   = document.getElementById('rotate-pages')?.value?.trim()
  const deg  = parseInt(document.getElementById('rotate-deg')?.value || '90')
  if (!fp) { showToast('Select a source PDF first', 'error'); return }
  const dest = await api.openSaveDialog({ title:'Save rotated PDF', defaultPath:'rotated.pdf', filters:[{name:'PDF',extensions:['pdf']}] })
  if (!dest) return
  const pages = (!pg || pg.toLowerCase()==='all') ? 'all' : _parsePageList(pg, 9999)
  const r = await api.rotatePdf(fp, dest, deg, pages)
  if (r.success) {
    showToast(`Rotated ${r.rotatedCount} pages ✓`)
    _pushToolHist('pdf', { op:'rotate', label:`Rotated ${fp.split('\\').pop()} ${deg}°`, file: fp.split('\\').pop(), deg })
  } else showToast('Failed: '+r.error,'error')
}

async function utilAddPageNumbers() {
  const fp    = document.getElementById('pn-src')?.value
  const pos   = document.getElementById('pn-pos')?.value || 'bottom-center'
  const start = parseInt(document.getElementById('pn-start')?.value || '1')
  const total = document.getElementById('pn-total')?.checked ?? true
  if (!fp) { showToast('Select a source PDF first', 'error'); return }
  const dest = await api.openSaveDialog({ title:'Save numbered PDF', defaultPath:'numbered.pdf', filters:[{name:'PDF',extensions:['pdf']}] })
  if (!dest) return
  const r = await api.addPageNumbers(fp, dest, { position:pos, startNum:start, showTotal:total, fontSize:11 })
  r.success ? showToast(`Added page numbers to ${r.pageCount} pages ✓`) : showToast('Failed: '+r.error,'error')
}

// ══ TEXT & CITATIONS ══════════════════════════════════════════════════════════

function _utilRenderText() {
  const citFormatted = _utilCitPaper ? _formatCitation(_utilCitPaper, document.getElementById('cit-style')?.value || 'apa') : ''

  return `
  <div class="grid grid-cols-2 gap-6 max-w-5xl mx-auto">

    <!-- Word counter -->
    <div>
      <h3 class="text-sm font-bold text-slate-700 mb-3">📏 Word Counter</h3>
      <div class="bg-white border border-slate-200 rounded-xl p-4">
        <textarea id="wc-text" placeholder="Paste your text here…" rows="8"
          class="w-full text-sm text-slate-700 border border-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
          oninput="utilCountWords()"></textarea>
        <div id="wc-stats" class="mt-3 grid grid-cols-3 gap-2 text-center">
          ${_wcStat('Words','0','wc-words')}
          ${_wcStat('Characters','0','wc-chars')}
          ${_wcStat('Sentences','0','wc-sents')}
          ${_wcStat('Paragraphs','0','wc-paras')}
          ${_wcStat('Reading time','—','wc-read')}
          ${_wcStat('Unique words','0','wc-uniq')}
        </div>
        <button onclick="utilCopyWordStats()" class="mt-3 w-full px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg transition-colors">📋 Copy stats</button>
      </div>
    </div>

    <!-- Citation formatter -->
    <div>
      <h3 class="text-sm font-bold text-slate-700 mb-3">📖 Citation Formatter</h3>
      <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div class="flex gap-2">
          <input id="cit-doi" type="text" placeholder="Enter DOI (e.g. 10.1038/s41586-023-06792-0)"
            class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            onkeydown="if(event.key==='Enter')utilLookupDoi()"/>
          <button onclick="utilLookupDoi()"
            class="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
            Look up
          </button>
        </div>
        <div id="cit-paper-info" class="text-xs text-slate-500 min-h-[24px]">
          ${_utilCitPaper ? `<strong>${esc(_utilCitPaper.title)}</strong> · ${esc((_utilCitPaper.authors||[]).slice(0,2).join(', '))}` : 'Enter a DOI and click Look up'}
        </div>
        <div class="flex items-center gap-2">
          <select id="cit-style" onchange="utilRefreshCitation()"
            class="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="apa">APA 7th</option>
            <option value="vancouver">Vancouver</option>
            <option value="harvard">Harvard</option>
            <option value="bibtex">BibTeX</option>
          </select>
          <button onclick="utilCopyCitation()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg transition-colors">
            Copy ✓
          </button>
        </div>
        <div id="cit-output"
          class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 min-h-[80px] leading-relaxed font-mono whitespace-pre-wrap select-all">
          ${esc(citFormatted) || '<span class="text-slate-400 italic not-italic">Formatted citation will appear here…</span>'}
        </div>
      </div>
    </div>

  </div>`
}

function _wcStat(label, val, id) {
  return `<div class="bg-slate-50 rounded-lg p-2">
    <div id="${id}" class="text-lg font-bold text-indigo-600">${val}</div>
    <div class="text-xs text-slate-500">${label}</div>
  </div>`
}

function utilCopyWordStats() {
  const get = id => document.getElementById(id)?.textContent || '—'
  const txt = `Words: ${get('wc-words')} | Characters: ${get('wc-chars')} | Sentences: ${get('wc-sents')} | Paragraphs: ${get('wc-paras')} | Reading time: ${get('wc-read')} | Unique words: ${get('wc-uniq')}`
  navigator.clipboard.writeText(txt).then(() => showToast('Stats copied ✓'))
}

function utilCountWords() {
  const text = document.getElementById('wc-text')?.value || ''
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const chars = text.length
  const sents = text.split(/[.!?]+/).filter(s=>s.trim().length>2).length
  const paras = text.split(/\n\s*\n/).filter(p=>p.trim().length>0).length || (text.trim() ? 1 : 0)
  const readMins = Math.ceil(words / 200)
  const unique = new Set(text.toLowerCase().match(/\b[a-z]+\b/g)||[]).size
  const set = (id, v) => { const el=document.getElementById(id); if(el) el.textContent=v }
  set('wc-words', words.toLocaleString())
  set('wc-chars', chars.toLocaleString())
  set('wc-sents', sents.toLocaleString())
  set('wc-paras', paras.toLocaleString())
  set('wc-read',  words < 200 ? `< 1 min` : `~${readMins} min`)
  set('wc-uniq',  unique.toLocaleString())
}

async function utilLookupDoi() {
  const doi = document.getElementById('cit-doi')?.value.trim().replace(/^https?:\/\/doi\.org\//,'')
  if (!doi) { showToast('Enter a DOI first', 'error'); return }
  const info = document.getElementById('cit-paper-info')
  if (info) info.textContent = 'Looking up…'
  try {
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`,
      { headers: { 'User-Agent':'PhD-Command-Center/0.2' } })
    if (!res.ok) throw new Error('Not found')
    const w = (await res.json()).message
    _utilCitPaper = {
      title:   w.title?.[0] || '',
      authors: (w.author||[]).map(a=>[a.family,a.given].filter(Boolean).join(', ')),
      year:    w.published?.['date-parts']?.[0]?.[0] || '',
      journal: w['container-title']?.[0] || '',
      volume:  w.volume || '', issue: w.issue || '', pages: w.page || '',
      doi:     w.DOI || doi, publisher: w.publisher || '',
      type:    w.type || 'article'
    }
    utilRefreshCitation()
  } catch(e) {
    if (info) info.textContent = 'DOI not found. Check format.'
    showToast('DOI lookup failed', 'error')
  }
}

function utilRefreshCitation() {
  if (!_utilCitPaper) return
  const style = document.getElementById('cit-style')?.value || 'apa'
  const out   = document.getElementById('cit-output')
  const info  = document.getElementById('cit-paper-info')
  if (out) out.textContent  = _formatCitation(_utilCitPaper, style)
  if (info) info.innerHTML  = `<strong>${esc(_utilCitPaper.title)}</strong> · ${esc((_utilCitPaper.authors||[]).slice(0,2).join(', '))}${_utilCitPaper.authors?.length>2?' et al.':''}`
  _pushToolHist('cit', {
    label: `${style.toUpperCase()} · ${_utilCitPaper.title?.slice(0,50)||'Untitled'}`,
    paper: _utilCitPaper,
    style,
    formatted: _formatCitation(_utilCitPaper, style)
  })
}

function _formatCitation(p, style) {
  const a  = p.authors || []
  const yr = p.year || 'n.d.'
  const j  = p.journal || ''
  const v  = p.volume || ''
  const n  = p.issue || ''
  const pg = p.pages || ''
  const d  = p.doi ? `https://doi.org/${p.doi}` : ''
  const t  = p.title || ''

  if (style === 'apa') {
    const aStr = a.length === 0 ? '' : a.length > 20
      ? a.slice(0,19).join(', ') + ', ... ' + a[a.length-1]
      : a.length > 1 ? a.slice(0,-1).join(', ') + ', & ' + a[a.length-1]
      : a[0]
    return `${aStr} (${yr}). ${t}. ${j}${v?`, ${v}`:''}${n?`(${n})`:''}, ${pg}. ${d}`
  }

  if (style === 'vancouver') {
    const aStr = a.slice(0,6).map(x=>{
      const pts=x.split(', '); return pts[0]+' '+(pts[1]||'').split(' ').map(s=>s[0]||'').join('')
    }).join(', ') + (a.length>6?' et al':'')
    return `${aStr}. ${t}. ${j}. ${yr};${v}${n?`(${n})`:''}:${pg}. doi:${p.doi||''}`
  }

  if (style === 'harvard') {
    const aStr = a.length === 0 ? '' : a.length > 2
      ? a[0].split(', ')[0] + ' et al.'
      : a.map(x=>{const pts=x.split(', ');return pts[0]+(pts[1]?`, ${pts[1].split(' ').map(s=>s[0]).join('.')}`:'')} ).join(' and ')
    return `${aStr} (${yr}). '${t}', ${j}, vol. ${v}${n?`, no. ${n}`:''}, pp. ${pg}. doi:${p.doi||''}`
  }

  if (style === 'bibtex') {
    const key = (a[0]?.split(', ')[0]||'Author') + (yr||'0')
    return `@article{${key},\n  author    = {${a.join(' and ')}},\n  title     = {${t}},\n  journal   = {${j}},\n  year      = {${yr}},\n  volume    = {${v}},\n  number    = {${n}},\n  pages     = {${pg}},\n  doi       = {${p.doi||''}},\n}`
  }
  return ''
}

function utilCopyCitation() {
  const txt = document.getElementById('cit-output')?.textContent
  if (!txt || txt.includes('will appear here')) return
  navigator.clipboard.writeText(txt).then(()=>showToast('Copied ✓'))
}

// ══ UNIT CONVERTER ════════════════════════════════════════════════════════════

const UNIT_CATS = {
  length:  { label:'Length',          base:'m',  units:{'m':1,'km':1e3,'cm':1e-2,'mm':1e-3,'µm':1e-6,'nm':1e-9,'Å':1e-10,'in':0.0254,'ft':0.3048,'mi':1609.34} },
  mass:    { label:'Mass',            base:'g',  units:{'kg':1e3,'g':1,'mg':1e-3,'µg':1e-6,'ng':1e-9,'pg':1e-12,'lb':453.592,'oz':28.3495} },
  volume:  { label:'Volume',          base:'L',  units:{'L':1,'mL':1e-3,'µL':1e-6,'nL':1e-9,'m³':1e3,'cm³':1e-3,'mm³':1e-6,'fl oz':0.0295735} },
  temp:    { label:'Temperature',     special:true, units:['°C','°F','K'] },
  pressure:{ label:'Pressure',        base:'Pa', units:{'Pa':1,'kPa':1e3,'MPa':1e6,'bar':1e5,'atm':101325,'mmHg':133.322,'psi':6894.76,'mbar':100} },
  energy:  { label:'Energy',          base:'J',  units:{'J':1,'kJ':1e3,'MJ':1e6,'cal':4.184,'kcal':4184,'eV':1.602e-19,'kWh':3.6e6} },
  conc:    { label:'Concentration',   base:'M',  units:{'M':1,'mM':1e-3,'µM':1e-6,'nM':1e-9,'pM':1e-12} },
  data:    { label:'Data Size',       base:'B',  units:{'B':1,'KB':1024,'MB':1048576,'GB':1073741824,'TB':1099511627776} },
}

let _unitFrom = '', _unitTo = '', _unitVal = ''

function _utilRenderUnits() {
  const cat  = UNIT_CATS[_utilUnitCat]
  const keys = cat.special ? cat.units : Object.keys(cat.units)
  if (!_unitFrom || !keys.includes(_unitFrom)) _unitFrom = keys[0]
  if (!_unitTo   || !keys.includes(_unitTo)  ) _unitTo   = keys[1] || keys[0]
  const result = _unitConvert(_unitVal, _unitFrom, _unitTo, _utilUnitCat)

  return `
  <div class="max-w-lg mx-auto">
    <h3 class="text-sm font-bold text-slate-700 mb-4">⚗️ Unit Converter</h3>
    <div class="bg-white border border-slate-200 rounded-xl p-5 space-y-4">

      <!-- Category -->
      <div class="flex gap-2 flex-wrap">
        ${Object.entries(UNIT_CATS).map(([k,v])=>`
        <button onclick="_utilUnitCat='${k}';_unitFrom='';_unitTo='';_rerenderUnitTool()"
          class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
            ${_utilUnitCat===k ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}">
          ${v.label}
        </button>`).join('')}
      </div>

      <!-- Conversion row -->
      <div class="flex items-center gap-3">
        <div class="flex-1 space-y-1">
          <label class="text-xs font-medium text-slate-500">From</label>
          <div class="flex gap-2">
            <input type="number" id="unit-val" value="${esc(_unitVal)}" placeholder="0"
              oninput="_unitVal=this.value;utilUpdateConversion()"
              class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
            <select id="unit-from" onchange="_unitFrom=this.value;utilUpdateConversion()"
              class="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
              ${keys.map(k=>`<option value="${k}" ${_unitFrom===k?'selected':''}>${k}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="text-slate-400 mt-5 text-lg">→</div>

        <div class="flex-1 space-y-1">
          <label class="text-xs font-medium text-slate-500">To</label>
          <div class="flex gap-2">
            <div id="unit-result" class="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-indigo-700">
              ${esc(result)}
            </div>
            <select id="unit-to" onchange="_unitTo=this.value;utilUpdateConversion()"
              class="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
              ${keys.map(k=>`<option value="${k}" ${_unitTo===k?'selected':''}>${k}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- Quick reference -->
      <div id="unit-quick" class="text-xs text-slate-400 mt-1 min-h-[18px]">${_unitQuickRef(_utilUnitCat)}</div>

    </div>
  </div>`
}

function utilUpdateConversion() {
  _unitVal  = document.getElementById('unit-val')?.value  || ''
  _unitFrom = document.getElementById('unit-from')?.value || _unitFrom
  _unitTo   = document.getElementById('unit-to')?.value   || _unitTo
  const result = _unitConvert(_unitVal, _unitFrom, _unitTo, _utilUnitCat)
  const el  = document.getElementById('unit-result')
  if (el) el.textContent = result
  if (_unitVal && result !== '—') {
    _pushToolHist('units', {
      label: `${_unitVal} ${_unitFrom} → ${result} ${_unitTo}`,
      cat: _utilUnitCat, from: _unitFrom, to: _unitTo, val: _unitVal, result
    })
  }
}

function _unitConvert(val, from, to, catKey) {
  if (val === '' || val === undefined || val === null) return '—'
  const n = parseFloat(val)
  if (isNaN(n)) return '—'
  const cat = UNIT_CATS[catKey]
  if (cat.special) {
    // temperature
    let c
    if (from==='°C') c=n; else if (from==='°F') c=(n-32)*5/9; else c=n-273.15
    let r
    if (to==='°C') r=c; else if (to==='°F') r=c*9/5+32; else r=c+273.15
    return _niceNum(r)
  }
  const base = n * (cat.units[from] || 1)
  const result = base / (cat.units[to] || 1)
  return _niceNum(result)
}

function _niceNum(n) {
  if (Math.abs(n) >= 1e-3 && Math.abs(n) < 1e7) return parseFloat(n.toPrecision(6)).toString()
  return n.toExponential(4)
}

function _unitQuickRef(cat) {
  const refs = {
    length:   '1 m = 100 cm = 1000 mm = 1 × 10⁶ µm = 1 × 10⁹ nm = 39.37 in',
    mass:     '1 g = 1000 mg = 1 × 10⁶ µg = 1 × 10⁹ ng | 1 kg = 2.205 lb',
    volume:   '1 L = 1000 mL = 1 × 10⁶ µL | 1 mL = 1 cm³',
    temp:     '0 °C = 32 °F = 273.15 K | 100 °C = 212 °F = 373.15 K',
    pressure: '1 atm = 101.325 kPa = 760 mmHg = 14.7 psi',
    energy:   '1 kcal = 4.184 kJ | 1 eV = 1.602 × 10⁻¹⁹ J',
    conc:     '1 M = 1 mol/L = 1000 mM = 10⁶ µM = 10⁹ nM',
    data:     '1 KB = 1024 B | 1 MB = 1024 KB | 1 GB = 1024 MB',
  }
  return refs[cat] || ''
}

// ══ R ASSISTANT ═══════════════════════════════════════════════════════════════

const R_TREE = {
  start: { q:'What type of statistical analysis do you need?', opts:[
    { label:'Compare groups / test for differences',   next:'compare'  },
    { label:'Explore relationships / regression',      next:'relate'   },
    { label:'Categorical data / proportions / counts', next:'cat'      },
    { label:'Check if data is normally distributed',   next:'normality'},
    { label:'Survival / time-to-event analysis',       next:'survival' },
    { label:'Reduce dimensions / find structure',      next:'dimred'   },
    { label:'Repeated measures / nested data (lme4)',  next:'mixed'    },
  ]},
  compare: { q:'How many groups are you comparing?', opts:[
    { label:'One group vs. a known / expected value',  next:'c_one'   },
    { label:'Two groups',                              next:'c_two'   },
    { label:'Three or more groups',                    next:'c_multi' },
  ]},
  c_one: { q:'Is the data roughly normally distributed?', opts:[
    { label:'Yes (or n ≥ 30)',  result:'one_t'   },
    { label:'No / small sample',result:'wilcox1' },
  ]},
  c_two: { q:'Are the two groups paired or matched? (e.g. before/after, same subjects)', opts:[
    { label:'Yes — paired / matched',   next:'c_two_p' },
    { label:'No  — independent samples',next:'c_two_i' },
  ]},
  c_two_p: { q:'Is the difference between pairs normally distributed?', opts:[
    { label:'Yes', result:'paired_t'  },
    { label:'No',  result:'wilcox_sr' },
  ]},
  c_two_i: { q:'Is the data roughly normally distributed (per group)?', opts:[
    { label:'Yes (n ≥ 30 or Shapiro–Wilk p > 0.05)', result:'welch_t'   },
    { label:'No / non-normal / small samples',        result:'mwu'      },
  ]},
  c_multi: { q:'Are the measurements independent, or are there repeated measures?', opts:[
    { label:'Independent groups',                       next:'c_multi_i' },
    { label:'Repeated measures (same subjects / time)', result:'rm_anova' },
  ]},
  c_multi_i: { q:'Is the data roughly normally distributed?', opts:[
    { label:'Yes', next:'c_multi_anova' },
    { label:'No',  result:'kruskal'     },
  ]},
  c_multi_anova: { q:'How many independent factors do you have?', opts:[
    { label:'One factor (one categorical variable)',      result:'one_anova' },
    { label:'Two or more factors',                       result:'two_anova' },
  ]},
  relate: { q:'What type of relationship are you investigating?', opts:[
    { label:'Association / correlation between two variables', next:'r_cor' },
    { label:'Predict one variable from another (regression)',  next:'r_reg' },
    { label:'Multiple predictors',                            result:'multi_reg' },
  ]},
  r_cor: { q:'Is the relationship expected to be linear, and is the data normally distributed?', opts:[
    { label:'Yes — linear & normal',        result:'pearson'  },
    { label:'No  — monotonic or non-normal',result:'spearman' },
  ]},
  r_reg: { q:'What type of outcome (dependent) variable do you have?', opts:[
    { label:'Continuous (e.g. weight, score, concentration)', result:'linear_reg' },
    { label:'Binary (yes/no, success/failure)',               result:'logistic'   },
    { label:'Count data (whole numbers ≥ 0)',                  result:'poisson'    },
  ]},
  cat: { q:'What do you want to test with your categorical data?', opts:[
    { label:'Association between two categorical variables',  next:'cat_assoc'  },
    { label:'Observed counts vs. expected distribution',      result:'chisq_gof' },
    { label:'Agreement between two raters / methods',         result:'kappa'     },
  ]},
  cat_assoc: { q:'Are all expected cell frequencies ≥ 5?', opts:[
    { label:'Yes (or n is large)',  result:'chisq' },
    { label:'No — small sample',   result:'fisher' },
  ]},
  normality: { result:'shapiro' },
  survival:  { result:'cox'     },
  dimred:    { result:'pca'     },
  mixed:     { result:'lmer'    },
}

const R_RESULTS = {
  one_t:    { name:'One-sample t-test',              pkg:'Base R',
    code:`# One-sample t-test
# Tests whether your data mean differs from a known value

data <- c(2.3, 2.7, 2.5, 2.8, 2.4)   # replace with your values
mu0  <- 2.5                            # the known / hypothesised value

shapiro.test(data)                     # check normality (p > 0.05 → OK)

result <- t.test(data, mu = mu0, alternative = "two.sided")
print(result)                          # t, df, p-value, 95% CI

# Effect size
library(effectsize)
cohens_d(data, mu = mu0)` },

  paired_t: { name:'Paired t-test',                 pkg:'Base R',
    code:`# Paired t-test (e.g., before vs. after treatment, same subjects)

before <- c(5.2, 4.8, 6.1, 5.5, 4.9)
after  <- c(5.8, 5.3, 6.7, 5.9, 5.5)

diff <- after - before
shapiro.test(diff)            # normality of differences

result <- t.test(after, before, paired = TRUE)
print(result)

library(effectsize)
cohens_d(diff)                # Cohen's d effect size` },

  welch_t:  { name:"Welch's independent t-test",    pkg:'Base R',
    code:`# Independent samples t-test (Welch's — handles unequal variances)

group1 <- c(2.3, 2.7, 2.5, 2.8, 2.4, 2.6)
group2 <- c(2.9, 3.1, 2.8, 3.3, 3.0, 2.7)

shapiro.test(group1)
shapiro.test(group2)

result <- t.test(group1, group2, var.equal = FALSE)
print(result)

# As data frame (long format)
df <- data.frame(
  value = c(group1, group2),
  group = rep(c("G1","G2"), c(length(group1), length(group2)))
)
library(effectsize)
cohens_d(value ~ group, data = df)` },

  wilcox1:  { name:'Wilcoxon signed-rank (one-sample)', pkg:'Base R',
    code:`# Wilcoxon signed-rank test (one-sample, non-parametric)

data <- c(2.1, 2.5, 1.9, 2.8, 2.3)
mu0  <- 2.0      # hypothesised median

result <- wilcox.test(data, mu = mu0, exact = FALSE)
print(result)` },

  wilcox_sr:{ name:'Wilcoxon signed-rank (paired)',  pkg:'Base R',
    code:`# Wilcoxon signed-rank test — non-parametric paired test

before <- c(5, 4, 6, 5, 4, 7, 5)
after  <- c(6, 5, 7, 6, 5, 8, 6)

result <- wilcox.test(after, before, paired = TRUE, exact = FALSE)
print(result)

# Effect size r = |Z| / sqrt(N)
Z <- qnorm(result$p.value / 2)
r <- abs(Z) / sqrt(length(before))
cat("Effect size r:", round(r, 3))` },

  mwu:      { name:'Mann–Whitney U (Wilcoxon rank-sum)', pkg:'Base R',
    code:`# Mann-Whitney U test — 2 independent groups, non-parametric

group1 <- c(2.1, 2.5, 1.9, 2.8, 2.3)
group2 <- c(3.0, 2.7, 3.4, 2.9, 3.2)

result <- wilcox.test(group1, group2, exact = FALSE, conf.int = TRUE)
print(result)

boxplot(list(Group1 = group1, Group2 = group2),
        main = "Group Comparison", ylab = "Value")` },

  one_anova:{ name:'One-way ANOVA + Tukey HSD',     pkg:'Base R',
    code:`# One-way ANOVA — 3+ independent groups

df <- data.frame(
  group  = factor(rep(c("A","B","C"), each = 5)),
  values = c(2.3,2.7,2.5,2.8,2.4,  3.1,2.9,3.3,2.8,3.2,  2.0,1.8,2.2,1.9,2.1)
)

# Check assumptions
library(dplyr)
df %>% group_by(group) %>% summarise(p_shapiro = shapiro.test(values)$p.value)
bartlett.test(values ~ group, data = df)  # homogeneity of variances

# ANOVA
model <- aov(values ~ group, data = df)
summary(model)

TukeyHSD(model)   # which pairs differ?

library(effectsize)
eta_squared(model)` },

  two_anova:{ name:'Two-way ANOVA',                 pkg:'Base R',
    code:`# Two-way ANOVA — two independent factors

df <- data.frame(
  treatment = factor(rep(c("A","B"), each = 6)),
  sex       = factor(rep(c("M","F","M"), times = 4)),
  values    = c(3.2,2.8,3.0, 4.1,3.9,4.0, 2.9,2.6,2.8, 3.8,4.2,3.9)
)

# With interaction term
model <- aov(values ~ treatment * sex, data = df)
summary(model)

# Post-hoc
library(emmeans)
emmeans(model, pairwise ~ treatment | sex)

# Interaction plot
interaction.plot(df$treatment, df$sex, df$values,
                 xlab="Treatment", ylab="Mean", legend=TRUE)` },

  kruskal:  { name:'Kruskal–Wallis + Dunn post-hoc', pkg:'Base R + dunn.test',
    code:`# Kruskal-Wallis — non-parametric one-way ANOVA

df <- data.frame(
  group  = factor(rep(c("A","B","C"), each = 5)),
  values = c(2.3,2.7,2.5,2.8,2.4,  3.1,2.9,3.3,2.8,3.2,  2.0,1.8,2.2,1.9,2.1)
)

result <- kruskal.test(values ~ group, data = df)
print(result)

# Post-hoc (Dunn's test with Bonferroni correction)
# install.packages("dunn.test")
library(dunn.test)
dunn.test(df$values, df$group, method = "bonferroni")

# Alternative: pairwise Mann-Whitney
pairwise.wilcox.test(df$values, df$group, p.adjust.method = "bonferroni")` },

  rm_anova: { name:'Repeated measures ANOVA (lmer)',  pkg:'lme4 + lmerTest',
    code:`# Repeated measures / mixed ANOVA via linear mixed effects

# install.packages(c("lme4","lmerTest","emmeans"))
library(lme4); library(lmerTest); library(emmeans)

df <- data.frame(
  subject   = factor(rep(1:6, each = 3)),
  timepoint = factor(rep(1:3, times = 6)),
  treatment = factor(rep(c("A","B"), each = 9)),
  response  = c(2.1,2.5,2.8, 1.9,2.2,2.6,
                3.2,3.8,4.1, 3.0,3.5,3.9,
                2.4,2.7,3.0, 2.2,2.6,2.9)
)

model <- lmer(response ~ timepoint * treatment + (1 | subject), data = df)
anova(model)

emmeans(model, pairwise ~ treatment | timepoint, adjust = "tukey")` },

  pearson:  { name:'Pearson correlation',            pkg:'Base R',
    code:`# Pearson correlation — linear association between two continuous variables

x <- c(1.2, 2.4, 3.1, 4.5, 5.2, 6.0, 7.3)
y <- c(2.1, 4.2, 6.0, 8.9, 10.1, 12.2, 14.5)

shapiro.test(x); shapiro.test(y)   # check normality

result <- cor.test(x, y, method = "pearson")
print(result)      # r, 95% CI, p-value

# Scatter plot
plot(x, y, pch = 16,
     main = paste0("r = ", round(result$estimate,3), ", p = ", round(result$p.value,4)))
abline(lm(y ~ x), col = "blue")` },

  spearman: { name:'Spearman correlation',           pkg:'Base R',
    code:`# Spearman correlation — monotonic association, no normality required

x <- c(1, 3, 2, 5, 4, 7, 6)
y <- c(2, 5, 3, 8, 7, 11, 9)

result <- cor.test(x, y, method = "spearman", exact = FALSE)
print(result)      # rho, p-value` },

  linear_reg:{ name:'Simple linear regression',      pkg:'Base R',
    code:`# Simple linear regression — predict continuous Y from one predictor X

x <- c(1.2, 2.4, 3.1, 4.5, 5.2, 6.0, 7.3)
y <- c(2.1, 4.2, 6.0, 8.9, 10.1, 12.2, 14.5)

model <- lm(y ~ x)
summary(model)      # R², coefficients, p-values

# Diagnostic plots (check residuals, Q-Q, leverage)
par(mfrow = c(2,2)); plot(model)

# Prediction + confidence interval
new_x <- data.frame(x = seq(min(x), max(x), length.out = 50))
pred  <- predict(model, newdata = new_x, interval = "confidence")
plot(x, y, pch = 16); abline(model, col = "blue")` },

  multi_reg:{ name:'Multiple linear regression',     pkg:'Base R',
    code:`# Multiple linear regression — predict Y from several predictors

df <- data.frame(
  y  = c(3.2, 4.5, 2.1, 5.8, 3.9, 6.2, 4.8, 3.5),
  x1 = c(1.1, 2.3, 0.8, 3.5, 2.0, 4.1, 2.8, 1.6),
  x2 = c(0.5, 1.2, 0.3, 1.8, 0.9, 2.2, 1.5, 0.7),
  grp= factor(c("A","B","A","B","A","B","A","B"))
)

model <- lm(y ~ x1 + x2 + grp, data = df)
summary(model)

# Multicollinearity check
library(car); vif(model)

# Stepwise selection
library(MASS); stepwise <- stepAIC(model, direction = "both")` },

  logistic: { name:'Logistic regression',             pkg:'Base R',
    code:`# Logistic regression — binary outcome (0/1)

df <- data.frame(
  outcome   = c(0,1,0,1,1,0,1,0,1,1),
  age       = c(25,45,30,55,50,28,48,32,42,60),
  treatment = factor(c("A","B","A","B","B","A","B","A","B","B"))
)

model <- glm(outcome ~ age + treatment, data = df, family = binomial)
summary(model)

# Odds ratios with 95% CI
exp(cbind(OR = coef(model), confint(model)))

# ROC / AUC
library(pROC)
roc_obj <- roc(df$outcome, fitted(model))
auc(roc_obj); plot(roc_obj)` },

  poisson:  { name:'Poisson regression (count data)', pkg:'Base R',
    code:`# Poisson regression — count data (non-negative integers)

df <- data.frame(
  count   = c(2,5,1,8,4,11,3,7,9,6),
  dose    = c(1,2,1,3,2,4,1,3,3,2),
  group   = factor(c("A","A","B","B","A","B","A","B","A","B"))
)

model <- glm(count ~ dose + group, data = df, family = poisson)
summary(model)

# Check for overdispersion (ratio of residual deviance / df should be ≈ 1)
model$deviance / model$df.residual

# If overdispersed → use quasipoisson or negative binomial:
# model_nb <- MASS::glm.nb(count ~ dose + group, data = df)` },

  chisq:    { name:'Chi-squared test of independence', pkg:'Base R',
    code:`# Chi-squared test — association between two categorical variables

# As a contingency table
tbl <- matrix(c(45, 35, 25, 55), nrow = 2, byrow = TRUE,
              dimnames = list(c("Male","Female"), c("Yes","No")))
print(tbl)

chisq.test(tbl)$expected   # all should be ≥ 5

result <- chisq.test(tbl)
print(result)

# Effect size (Cramér's V)
library(effectsize)
cramers_v(tbl)` },

  chisq_gof:{ name:'Chi-squared goodness-of-fit',    pkg:'Base R',
    code:`# Chi-squared goodness-of-fit — compare observed to expected

observed <- c(A = 30, B = 45, C = 25)
expected  <- c(A = 1/3, B = 1/3, C = 1/3)  # equal expected proportions

result <- chisq.test(observed, p = expected)
print(result)` },

  fisher:   { name:"Fisher's exact test",             pkg:'Base R',
    code:`# Fisher's exact test — small sample categorical (any expected cell < 5)

tbl <- matrix(c(3, 8, 12, 5), nrow = 2,
              dimnames = list(c("Control","Treatment"), c("Success","Failure")))

result <- fisher.test(tbl)
print(result)      # p-value, odds ratio, 95% CI` },

  kappa:    { name:"Cohen's Kappa (rater agreement)", pkg:'irr',
    code:`# Cohen's Kappa — agreement between two raters
# install.packages("irr")
library(irr)

# Each row is one item; each column is one rater
ratings <- data.frame(
  rater1 = c("Yes","No","Yes","Yes","No","No","Yes","No"),
  rater2 = c("Yes","No","Yes","No","No","Yes","Yes","No")
)

kappa2(ratings)        # simple kappa
# kappa2(ratings, weight = "equal")   # weighted kappa for ordinal scales` },

  shapiro:  { name:'Normality testing (Shapiro–Wilk)', pkg:'Base R',
    code:`# Normality tests — always run BEFORE parametric tests

data <- c(2.3, 2.7, 2.5, 2.8, 2.4, 2.6, 2.9, 2.2, 2.5, 2.7)

# Shapiro-Wilk (best for n < 50)
shapiro.test(data)
# p > 0.05 → no significant deviation from normality → OK for parametric tests

# Visual checks
par(mfrow = c(1,2))
hist(data, main = "Histogram", freq = FALSE)
lines(density(data), col = "blue")
qqnorm(data); qqline(data, col = "red")  # points on the line → normal

# For larger samples (n > 50):
# library(nortest)
# lillie.test(data)   # Lilliefors (Kolmogorov-Smirnov)
# ad.test(data)       # Anderson-Darling` },

  cox:      { name:'Cox proportional hazards (survival)', pkg:'survival + survminer',
    code:`# Cox proportional hazards — time-to-event analysis
# install.packages(c("survival","survminer"))
library(survival); library(survminer)

df <- data.frame(
  time   = c(5,12,8,3,15,9,2,11,6,14),
  event  = c(1,0,1,1,0,1,1,0,1,0),   # 1=event, 0=censored
  group  = factor(c("A","A","B","B","A","B","A","B","A","B")),
  age    = c(45,52,38,61,49,55,43,58,47,53)
)

# Kaplan-Meier curves
km <- survfit(Surv(time, event) ~ group, data = df)
ggsurvplot(km, data = df, conf.int = TRUE, pval = TRUE, risk.table = TRUE)

# Log-rank test
survdiff(Surv(time, event) ~ group, data = df)

# Cox model
cox <- coxph(Surv(time, event) ~ group + age, data = df)
summary(cox)
cox.zph(cox)   # test proportional hazards assumption` },

  pca:      { name:'Principal Component Analysis (PCA)', pkg:'Base R',
    code:`# PCA — dimensionality reduction and structure discovery

df <- data.frame(
  var1 = c(2.3,1.5,3.1,2.8,1.9,3.5,2.1,1.7,3.3,2.6),
  var2 = c(1.1,0.9,1.8,1.5,1.0,2.0,1.2,0.8,1.7,1.4),
  var3 = c(5.2,3.8,6.9,5.8,4.1,7.2,4.9,3.5,6.5,5.5),
  var4 = c(0.8,0.5,1.3,1.0,0.6,1.5,0.9,0.4,1.2,1.0)
)

pca <- prcomp(df, scale. = TRUE, center = TRUE)
summary(pca)           # % variance explained per PC

# Scree plot
plot(pca, type = "l", main = "Scree Plot")

# Biplot
biplot(pca, scale = 0)

# Scores for downstream analysis
scores <- as.data.frame(pca$x)
head(scores)

# Loadings (contribution of each variable)
pca$rotation[, 1:2]` },

  lmer:     { name:'Linear mixed effects model (lme4)', pkg:'lme4 + lmerTest',
    code:`# Linear mixed effects — repeated measures, nested, or longitudinal data
# install.packages(c("lme4","lmerTest","emmeans"))
library(lme4); library(lmerTest); library(emmeans)

df <- data.frame(
  subject   = factor(rep(1:6, each = 4)),
  timepoint = factor(rep(1:4, times = 6)),
  treatment = factor(rep(c("A","B"), each = 12)),
  response  = c(2.1,2.5,2.8,3.1, 1.9,2.2,2.6,3.0,
                3.2,3.8,4.1,4.5, 3.0,3.5,3.9,4.2,
                2.4,2.7,3.0,3.3, 2.2,2.6,2.9,3.2)
)

# Random intercept per subject
model <- lmer(response ~ timepoint * treatment + (1 | subject), data = df)
summary(model)
anova(model)           # F-tests for fixed effects

# Pairwise comparisons
emmeans(model, pairwise ~ treatment | timepoint, adjust = "tukey")

# Residual diagnostics
plot(model)` },
}

function _utilRenderR() {
  const node     = _rGetCurrentNode()
  const isResult = _rResult !== null
  const result   = isResult ? R_RESULTS[_rResult] : null

  return `
  <div class="grid grid-cols-5 gap-6 max-w-5xl mx-auto h-full">

    <!-- Decision tree (left) -->
    <div class="col-span-2">
      <h3 class="text-sm font-bold text-slate-700 mb-3">📊 Statistical Test Selector</h3>

      <!-- Breadcrumb -->
      ${_rStep.length > 0 ? `
      <div class="mb-3 space-y-1">
        ${_rStep.map((s,i)=>`
        <div class="text-xs text-slate-400">
          <span class="text-slate-500">${esc(s.q.length>48?s.q.slice(0,45)+'…':s.q)}</span><br/>
          <span class="font-medium text-indigo-600">→ ${esc(s.a)}</span>
        </div>`).join('')}
      </div>
      <button onclick="_rStep=[];_rResult=null;_rerenderRTool()"
        class="text-xs text-slate-400 hover:text-slate-600 mb-3">↩ Start over</button>
      ` : ''}

      <!-- Current question or result -->
      ${isResult && result ? `
      <div class="bg-green-50 border border-green-200 rounded-xl p-4">
        <p class="text-xs font-semibold text-green-700 mb-1">✓ Recommended test:</p>
        <p class="text-sm font-bold text-green-900">${result.name}</p>
        <p class="text-xs text-green-600 mt-1">Package: ${result.pkg}</p>
        <button onclick="_rStep=[];_rResult=null;_rerenderRTool()"
          class="mt-3 text-xs text-slate-500 hover:text-slate-700">↩ Start over</button>
      </div>
      ` : node ? `
      <div class="bg-white border border-slate-200 rounded-xl p-4">
        <p class="text-sm font-semibold text-slate-800 mb-3">${esc(node.q)}</p>
        <div class="space-y-2">
          ${node.opts.map(o=>`
          <button onclick="rChoose(${JSON.stringify(node.q)}, ${JSON.stringify(o.label)}, ${JSON.stringify(o.next||'')}, ${JSON.stringify(o.result||'')})"
            class="w-full text-left px-3 py-2.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-xs text-slate-700 transition-colors">
            ${esc(o.label)}
          </button>`).join('')}
        </div>
      </div>` : ''}
    </div>

    <!-- R code panel (right) -->
    <div class="col-span-3">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-slate-700">R Code</h3>
        ${result ? `<button onclick="rCopyCode()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg transition-colors">📋 Copy code</button>` : ''}
      </div>
      <div class="bg-slate-900 rounded-xl p-4 overflow-auto" style="max-height:420px">
        <pre id="r-code-block" class="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre">${
          result
            ? esc(result.code)
            : `<span class="text-slate-500"># Answer the questions on the left to generate\n# the appropriate R code for your analysis.\n\n# The selector covers:\n# t-tests, ANOVA, Kruskal-Wallis, regression,\n# correlation, chi-squared, Fisher, PCA,\n# survival analysis, mixed effects models, and more.</span>`
        }</pre>
      </div>
    </div>

  </div>`
}

function _rGetCurrentNode() {
  if (_rResult) return null
  if (_rStep.length === 0) return R_TREE.start
  const lastStep = _rStep[_rStep.length-1]
  const nodeKey  = lastStep.next
  const node     = nodeKey ? R_TREE[nodeKey] : null
  if (!node) return null
  if (node.result) { _rResult = node.result; return null }
  return node
}

function rChoose(question, answer, next, result) {
  _rStep.push({ q: question, a: answer, next })
  if (result) {
    _rResult = result
    _pushToolHist('r', {
      label: result.name || result.code?.split('\n')[0]?.slice(0,50) || 'R analysis',
      path:  _rStep.map(s => s.a).join(' → '),
      result
    })
  }
  _rerenderRTool()
}

function rCopyCode() {
  const el = document.getElementById('r-code-block')
  if (!el) return
  navigator.clipboard.writeText(el.textContent)
    .then(() => showToast('R code copied ✓'))
}
