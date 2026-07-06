// ══ Tools — persistent workspaces ════════════════════════════════════════════

let _utilPdfOp    = 'merge'
let _utilCitPaper = null
let _utilUnitCat  = 'length'
let _rStep        = []
let _rResult      = null
let _rLang        = 'r'        // 'r' | 'python' | 'spss'
let _rTab         = 'chat'     // 'chat' | 'selector' | 'power'
let _statsChatHistory = []
let _statsChatLoading = false
let _statsChatLang    = 'r'    // 'r' | 'python' | 'spss'
let _pwTest       = 'ttest_ind'
let _pwSolveFor   = 'n'
let _pwAlpha      = 0.05
let _pwPower      = 0.80
let _pwD          = 0.50
let _pwF          = 0.25
let _pwR          = 0.30
let _pwW          = 0.30
let _pwF2         = 0.15
let _pwN          = 0
let _pwK          = 3
let _pwDF         = 1
let _utilSignCertPath = ''

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
function render_pdf_tools() {
  const vc = document.getElementById('view-content')
  if (!vc) return
  vc.innerHTML = `<div class="flex h-full overflow-hidden">
    ${_histSidebar('pdf','PDF Tools')}
    <div class="flex-1 flex flex-col overflow-hidden">
      ${pageHeader('📄 PDF Tools', _folderBtn('PDF Tools'))}
      <div id="pdf-tool-area" class="flex-1 overflow-y-auto p-3 lg:p-5">${_utilRenderPdf()}</div>
    </div>
  </div>`
  _loadToolHist('pdf').then(() => _refreshHistPanel('pdf'))
  api.storeGet('pdfSignCertPath').then(p => {
    _utilSignCertPath = p || ''
    if (_utilPdfOp === 'sign') {
      const el = document.getElementById('pdf-tool-area')
      if (el) el.innerHTML = _utilRenderPdf()
    }
  })
}

// ── 2. Citations ──────────────────────────────────────────────────────────────
function _rerenderCitTool() {
  const el = document.getElementById('cit-tool-area')
  if (el) el.innerHTML = _utilRenderText()
}
function render_citations() {
  const vc = document.getElementById('view-content')
  if (!vc) return
  vc.innerHTML = `<div class="flex h-full overflow-hidden">
    ${_histSidebar('cit','Citations')}
    <div class="flex-1 flex flex-col overflow-hidden">
      ${pageHeader('✏️ Citations', _folderBtn('Citations'))}
      <div id="cit-tool-area" class="flex-1 overflow-y-auto p-3 lg:p-5">${_utilRenderText()}</div>
    </div>
  </div>`
  _loadToolHist('cit').then(() => _refreshHistPanel('cit'))
}

// ── 3. Unit Converter ─────────────────────────────────────────────────────────
function _rerenderUnitTool() {
  const el = document.getElementById('unit-tool-area')
  if (el) el.innerHTML = _utilRenderUnits()
}
function render_unit_conv() {
  const vc = document.getElementById('view-content')
  if (!vc) return
  vc.innerHTML = `<div class="flex h-full overflow-hidden">
    ${_histSidebar('units','Unit Converter')}
    <div class="flex-1 flex flex-col overflow-hidden">
      ${pageHeader('⚗️ Unit Converter', _folderBtn('Unit Converter'))}
      <div id="unit-tool-area" class="flex-1 overflow-y-auto p-3 lg:p-5">${_utilRenderUnits()}</div>
    </div>
  </div>`
  _loadToolHist('units').then(() => _refreshHistPanel('units'))
}

// ── 4. R Assistant ────────────────────────────────────────────────────────────
function _rerenderRTool() {
  const el = document.getElementById('r-tool-area')
  if (el) el.innerHTML = _utilRenderR()
}
function render_r_assist() {
  const vc = document.getElementById('view-content')
  if (!vc) return
  vc.innerHTML = `<div class="flex h-full overflow-hidden">
    ${_histSidebar('r','Stats Assistant')}
    <div class="flex-1 flex flex-col overflow-hidden">
      ${pageHeader('📊 Stats Assistant', _folderBtn('Stats Assistant'))}
      <div id="r-tool-area" class="flex-1 overflow-y-auto p-3 lg:p-5">${_utilRenderR()}</div>
    </div>
  </div>`
  _loadToolHist('r').then(() => _refreshHistPanel('r'))
}

// ══ PDF TOOLS ═════════════════════════════════════════════════════════════════

const PDF_OPS = [
  { id:'merge',     icon:'🔗', label:'Merge',        desc:'Combine multiple PDFs into one'                },
  { id:'split',     icon:'✂️',  label:'Split',        desc:'Extract page ranges into separate files'      },
  { id:'extract',   icon:'📤', label:'Extract',      desc:'Save specific pages to a new PDF'              },
  { id:'remove',    icon:'🗑',  label:'Remove Pages', desc:'Delete pages from a PDF'                       },
  { id:'rotate',    icon:'🔄', label:'Rotate',       desc:'Rotate pages 90° / 180° / 270°'               },
  { id:'pagenums',  icon:'🔢', label:'Page Numbers', desc:'Stamp page numbers onto every page'            },
  { id:'pagemgr',   icon:'🗂', label:'Page Manager', desc:'Reorder, rotate & delete pages visually'       },
  { id:'watermark', icon:'💧', label:'Watermark',    desc:'Stamp text or an image across every page'      },
  { id:'metadata',  icon:'🏷', label:'Metadata',     desc:'Edit title, author, subject & keywords'        },
  { id:'insert',    icon:'➕', label:'Insert Blank', desc:'Insert blank pages'                            },
  { id:'crop',      icon:'🔲', label:'Crop',         desc:'Trim margins from pages'                       },
  { id:'images',    icon:'🖼', label:'PDF ⇄ Images', desc:'Export pages as PNGs or build a PDF from images' },
  { id:'ocr',       icon:'🔍', label:'OCR',          desc:'Make a scanned PDF searchable'                  },
  { id:'sign',      icon:'🖊', label:'Sign',         desc:'Apply a digital signature with your certificate' },
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

    case 'pagemgr': return `
      <h4 class="font-semibold text-slate-800 mb-1">🗂 Page Manager</h4>
      <p class="text-xs text-slate-500 mb-4">Visually drag to reorder pages, rotate or delete individual pages, then save as a new PDF.</p>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Source PDF</label>
          <button onclick="utilPickPdf('pagemgr-src')" class="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-indigo-300 transition-colors">
            <span id="pagemgr-src-lbl">Click to select PDF…</span>
          </button>
          <input type="hidden" id="pagemgr-src"/>
        </div>
        <button onclick="utilOpenPageManager()"
          class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
          🗂 Open Page Manager…
        </button>
      </div>`

    case 'watermark': return `
      <h4 class="font-semibold text-slate-800 mb-1">💧 Watermark / Stamp</h4>
      <p class="text-xs text-slate-500 mb-4">Overlay text or an image across every page.</p>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Source PDF</label>
          <button onclick="utilPickPdf('wm-src')" class="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-indigo-300 transition-colors">
            <span id="wm-src-lbl">Click to select PDF…</span>
          </button>
          <input type="hidden" id="wm-src"/>
        </div>
        <div class="flex gap-2">
          <button id="wm-type-text" onclick="_utilWmSetType('text')"
            class="flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors bg-indigo-600 text-white border-indigo-600">📝 Text</button>
          <button id="wm-type-image" onclick="_utilWmSetType('image')"
            class="flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors bg-white text-slate-600 border-slate-200 hover:border-indigo-300">🖼 Image</button>
        </div>
        <div id="wm-text-fields" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Text</label>
            <input id="wm-text" type="text" value="DRAFT"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          </div>
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="block text-xs font-medium text-slate-600 mb-1">Font size</label>
              <input id="wm-fontsize" type="number" value="48" min="6" max="200"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
            </div>
            <div class="flex-1">
              <label class="block text-xs font-medium text-slate-600 mb-1">Rotation°</label>
              <input id="wm-rotation" type="number" value="45" min="-180" max="180"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
            </div>
            <div class="flex-1">
              <label class="block text-xs font-medium text-slate-600 mb-1">Colour</label>
              <input id="wm-color" type="color" value="#888888" class="w-full h-[38px] px-1 py-1 border border-slate-200 rounded-lg"/>
            </div>
          </div>
          <label class="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
            <input type="checkbox" id="wm-tile" class="accent-indigo-600"/> Tile across page
          </label>
        </div>
        <div id="wm-image-fields" class="space-y-3 hidden">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Image (PNG/JPG)</label>
            <button onclick="_utilWmPickImage()" class="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-indigo-300 transition-colors">
              <span id="wm-image-lbl">Click to select image…</span>
            </button>
            <input type="hidden" id="wm-image"/>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Scale  <span class="text-slate-400 font-normal">(1 = original size)</span></label>
            <input id="wm-imgscale" type="number" value="0.5" min="0.05" max="3" step="0.05"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Opacity  <span class="text-slate-400 font-normal" id="wm-opacity-lbl">0.30</span></label>
          <input id="wm-opacity" type="range" min="0.05" max="1" step="0.05" value="0.3" class="w-full accent-indigo-600"
            oninput="document.getElementById('wm-opacity-lbl').textContent=this.value"/>
        </div>
        <button onclick="utilAddWatermark()"
          class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
          💧 Apply Watermark & Save…
        </button>
      </div>`

    case 'metadata': return `
      <h4 class="font-semibold text-slate-800 mb-1">🏷 Edit Metadata</h4>
      <p class="text-xs text-slate-500 mb-4">View and edit a PDF's title, author, subject & keywords.</p>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Source PDF</label>
          <button onclick="utilPickPdfMeta()" class="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-indigo-300 transition-colors">
            <span id="meta-src-lbl">Click to select PDF…</span>
          </button>
          <input type="hidden" id="meta-src"/>
        </div>
        <div id="meta-fields" class="space-y-3 hidden">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Title</label>
            <input id="meta-title" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Author</label>
            <input id="meta-author" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Subject</label>
            <input id="meta-subject" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Keywords  <span class="text-slate-400 font-normal">(comma-separated)</span></label>
            <input id="meta-keywords" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          </div>
          <button onclick="utilSaveMetadata()"
            class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
            🏷 Save Metadata As…
          </button>
        </div>
      </div>`

    case 'insert': return `
      <h4 class="font-semibold text-slate-800 mb-1">➕ Insert Blank Pages</h4>
      <p class="text-xs text-slate-500 mb-4">Add one or more blank pages at a chosen position.</p>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Source PDF</label>
          <button onclick="utilPickPdf('insert-src')" class="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-indigo-300 transition-colors">
            <span id="insert-src-lbl">Click to select PDF…</span>
          </button>
          <input type="hidden" id="insert-src"/>
        </div>
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="block text-xs font-medium text-slate-600 mb-1">Position</label>
            <select id="insert-pos" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="start">Before page 1</option>
              <option value="end" selected>At the end</option>
              <option value="after">After page…</option>
            </select>
          </div>
          <div style="width:90px">
            <label class="block text-xs font-medium text-slate-600 mb-1">After page</label>
            <input id="insert-after" type="number" value="1" min="1"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          </div>
          <div style="width:90px">
            <label class="block text-xs font-medium text-slate-600 mb-1">Count</label>
            <input id="insert-count" type="number" value="1" min="1" max="50"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Page size</label>
          <select id="insert-size" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="match">Match adjacent page</option>
            <option value="a4">A4</option>
            <option value="letter">US Letter</option>
          </select>
        </div>
        <button onclick="utilInsertBlankPages()"
          class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
          ➕ Insert & Save…
        </button>
      </div>`

    case 'crop': return `
      <h4 class="font-semibold text-slate-800 mb-1">🔲 Crop Pages</h4>
      <p class="text-xs text-slate-500 mb-4">Trim margins from all or selected pages (in points, 72pt = 1 inch).</p>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Source PDF</label>
          <button onclick="utilPickPdf('crop-src')" class="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-indigo-300 transition-colors">
            <span id="crop-src-lbl">Click to select PDF…</span>
          </button>
          <input type="hidden" id="crop-src"/>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Pages  <span class="text-slate-400 font-normal">(blank = all)</span></label>
          <input id="crop-pages" type="text" placeholder="all  or  1, 3, 5-8"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
        </div>
        <div class="grid grid-cols-4 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Top</label>
            <input id="crop-top" type="number" value="0" min="0"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Bottom</label>
            <input id="crop-bottom" type="number" value="0" min="0"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Left</label>
            <input id="crop-left" type="number" value="0" min="0"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Right</label>
            <input id="crop-right" type="number" value="0" min="0"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          </div>
        </div>
        <button onclick="utilCropPdf()"
          class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
          🔲 Crop & Save…
        </button>
      </div>`

    case 'images': return `
      <h4 class="font-semibold text-slate-800 mb-1">🖼 PDF ⇄ Images</h4>
      <p class="text-xs text-slate-500 mb-4">Export PDF pages as PNG images, or build a new PDF from images.</p>
      <div class="space-y-5">
        <div class="border border-slate-200 rounded-lg p-4">
          <h5 class="text-sm font-semibold text-slate-700 mb-1">PDF → Images</h5>
          <p class="text-xs text-slate-500 mb-3">Render every page (or a range) to a PNG file.</p>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Source PDF</label>
              <button onclick="utilPickPdf('img-src')" class="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-indigo-300 transition-colors">
                <span id="img-src-lbl">Click to select PDF…</span>
              </button>
              <input type="hidden" id="img-src"/>
            </div>
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="block text-xs font-medium text-slate-600 mb-1">Pages  <span class="text-slate-400 font-normal">(blank = all)</span></label>
                <input id="img-pages" type="text" placeholder="all  or  1, 3, 5-8"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
              </div>
              <div style="width:110px">
                <label class="block text-xs font-medium text-slate-600 mb-1">Scale</label>
                <select id="img-scale" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="1">1×</option>
                  <option value="2" selected>2×</option>
                  <option value="3">3×</option>
                </select>
              </div>
            </div>
            <button onclick="utilExportPdfToImages()"
              class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
              🖼 Export Pages as PNGs…
            </button>
          </div>
        </div>
        <div class="border border-slate-200 rounded-lg p-4">
          <h5 class="text-sm font-semibold text-slate-700 mb-1">Images → PDF</h5>
          <p class="text-xs text-slate-500 mb-3">Combine PNG/JPG images into a single PDF, one image per page, in the order selected.</p>
          <button onclick="utilImagesToPdf()"
            class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
            📂 Select Images & Build PDF…
          </button>
        </div>
      </div>`

    case 'ocr': return `
      <h4 class="font-semibold text-slate-800 mb-1">🔍 OCR — Make Searchable</h4>
      <p class="text-xs text-slate-500 mb-4">Recognizes text on each page and adds an invisible, selectable text layer on top — the page images themselves are unchanged.</p>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Source PDF</label>
          <button onclick="utilPickPdf('ocr-src')" class="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-indigo-300 transition-colors">
            <span id="ocr-src-lbl">Click to select PDF…</span>
          </button>
          <input type="hidden" id="ocr-src"/>
        </div>
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="block text-xs font-medium text-slate-600 mb-1">Pages  <span class="text-slate-400 font-normal">(blank = all)</span></label>
            <input id="ocr-pages" type="text" placeholder="all  or  1, 3, 5-8"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          </div>
          <div style="width:130px">
            <label class="block text-xs font-medium text-slate-600 mb-1">Quality</label>
            <select id="ocr-scale" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="2" selected>Normal (2×)</option>
              <option value="3">High (3×)</option>
            </select>
          </div>
        </div>
        <p class="text-xs text-slate-400">English only for now. Larger documents take longer — keep PhDFlow open while it runs.</p>
        <button id="ocr-run-btn" onclick="utilRunOcr()"
          class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
          🔍 Run OCR & Save…
        </button>
        <div id="ocr-progress-wrap" class="hidden">
          <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div id="ocr-progress-bar" class="bg-indigo-600 h-2 rounded-full transition-all" style="width:0%"></div>
          </div>
          <p id="ocr-progress-text" class="text-xs text-slate-500 mt-1.5"></p>
        </div>
      </div>`

    case 'sign': return `
      <h4 class="font-semibold text-slate-800 mb-1">🖊 Sign PDF</h4>
      <p class="text-xs text-slate-500 mb-4">Embeds a real cryptographic signature (PAdES) using your own certificate — verifiable in any PDF reader, and legally meaningful if your certificate was issued by a trusted authority (e.g. your university or national eID).</p>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Source PDF</label>
          <button onclick="utilPickPdf('sign-src')" class="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-indigo-300 transition-colors">
            <span id="sign-src-lbl">Click to select PDF…</span>
          </button>
          <input type="hidden" id="sign-src"/>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Your certificate  <span class="text-slate-400 font-normal">(.p12 / .pfx)</span></label>
          <button onclick="utilPickCert()" class="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-indigo-300 transition-colors">
            <span id="sign-cert-lbl">${_utilSignCertPath ? esc(_utilSignCertPath.split('\\').pop()) : 'Click to select certificate…'}</span>
          </button>
          <input type="hidden" id="sign-cert" value="${esc(_utilSignCertPath)}"/>
          <p class="text-xs text-slate-400 mt-1">Remembered for next time — only the file path is stored, never the password.</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Certificate password</label>
          <div class="flex gap-2">
            <input id="sign-pw" type="password" placeholder="Password for the certificate file"
              class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
            <button onclick="utilVerifyCert()" class="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-indigo-300 transition-colors whitespace-nowrap">Verify</button>
          </div>
        </div>
        <div id="sign-cert-info"></div>
        <details class="group">
          <summary class="text-xs font-medium text-slate-600 cursor-pointer select-none">Signature details (optional)</summary>
          <div class="space-y-3 mt-3">
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="block text-xs font-medium text-slate-600 mb-1">Reason</label>
                <input id="sign-reason" type="text" placeholder="e.g. I approve this document"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
              </div>
              <div class="flex-1">
                <label class="block text-xs font-medium text-slate-600 mb-1">Location</label>
                <input id="sign-location" type="text" placeholder="e.g. Munich, Germany"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Contact info</label>
              <input id="sign-contact" type="text" placeholder="e.g. your email address"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
            </div>
          </div>
        </details>
        <label class="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" id="sign-stamp" class="accent-indigo-600" onchange="document.getElementById('sign-stamp-opts').classList.toggle('hidden', !this.checked)"/>
          Also add a visible "Digitally signed by…" stamp on the page
        </label>
        <div id="sign-stamp-opts" class="hidden">
          <label class="block text-xs font-medium text-slate-600 mb-1">Stamp position</label>
          <select id="sign-stamp-page" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="last" selected>Bottom-right of last page</option>
            <option value="first">Bottom-right of first page</option>
          </select>
        </div>
        <button id="sign-run-btn" onclick="utilSignPdf()"
          class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
          🖊 Sign & Save…
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

// ── Page Manager launcher ─────────────────────────────────────────────────────
function utilOpenPageManager() {
  const fp = document.getElementById('pagemgr-src')?.value
  if (!fp) { showToast('Select a source PDF first', 'error'); return }
  openPdfPageManager(fp)
}

// ── Watermark / Stamp ──────────────────────────────────────────────────────────
function _utilWmSetType(type) {
  window._wmType = type
  const tBtn = document.getElementById('wm-type-text')
  const iBtn = document.getElementById('wm-type-image')
  const active   = 'flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors bg-indigo-600 text-white border-indigo-600'
  const inactive = 'flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
  if (tBtn) tBtn.className = type==='text'  ? active : inactive
  if (iBtn) iBtn.className = type==='image' ? active : inactive
  document.getElementById('wm-text-fields')?.classList.toggle('hidden', type!=='text')
  document.getElementById('wm-image-fields')?.classList.toggle('hidden', type!=='image')
}

async function _utilWmPickImage() {
  const paths = await api.openImageDialog()
  if (!paths?.length) return
  document.getElementById('wm-image').value = paths[0]
  document.getElementById('wm-image-lbl').textContent = paths[0].split('\\').pop()
}

async function utilAddWatermark() {
  const fp = document.getElementById('wm-src')?.value
  if (!fp) { showToast('Select a source PDF first', 'error'); return }
  const type    = window._wmType || 'text'
  const opacity = parseFloat(document.getElementById('wm-opacity')?.value || '0.3')
  const opts = { type, opacity }
  if (type === 'text') {
    opts.text     = document.getElementById('wm-text')?.value?.trim() || 'DRAFT'
    opts.fontSize = parseFloat(document.getElementById('wm-fontsize')?.value || '48')
    opts.rotation = parseFloat(document.getElementById('wm-rotation')?.value || '45')
    opts.color    = document.getElementById('wm-color')?.value || '#888888'
    opts.tile     = document.getElementById('wm-tile')?.checked || false
  } else {
    const imagePath = document.getElementById('wm-image')?.value
    if (!imagePath) { showToast('Select an image first', 'error'); return }
    opts.imagePath  = imagePath
    opts.imageScale = parseFloat(document.getElementById('wm-imgscale')?.value || '0.5')
  }
  const dest = await api.openSaveDialog({ title:'Save watermarked PDF', defaultPath: fp.replace(/\.pdf$/i,'_watermarked.pdf'), filters:[{name:'PDF',extensions:['pdf']}] })
  if (!dest) return
  const r = await api.addWatermark(fp, dest, opts)
  if (r.success) {
    showToast(`Watermark applied to ${r.pageCount} page(s) ✓`)
    _pushToolHist('pdf', { op:'watermark', label:`Watermarked ${fp.split('\\').pop()}`, file: fp.split('\\').pop(), dest })
  } else showToast('Failed: '+r.error,'error')
}

// ── Edit Metadata ──────────────────────────────────────────────────────────────
async function utilPickPdfMeta() {
  const paths = await api.openPdfDialog()
  if (!paths?.length) return
  const fp = paths[0]
  document.getElementById('meta-src').value = fp
  document.getElementById('meta-src-lbl').textContent = fp.split('\\').pop()
  const r = await api.readPdfMetadata(fp)
  if (!r.success) { showToast('Could not read metadata: '+r.error, 'error'); return }
  document.getElementById('meta-title').value    = r.metadata.title    || ''
  document.getElementById('meta-author').value   = r.metadata.author   || ''
  document.getElementById('meta-subject').value  = r.metadata.subject  || ''
  document.getElementById('meta-keywords').value = r.metadata.keywords || ''
  document.getElementById('meta-fields').classList.remove('hidden')
}

async function utilSaveMetadata() {
  const fp = document.getElementById('meta-src')?.value
  if (!fp) { showToast('Select a source PDF first', 'error'); return }
  const meta = {
    title:    document.getElementById('meta-title')?.value    || '',
    author:   document.getElementById('meta-author')?.value   || '',
    subject:  document.getElementById('meta-subject')?.value  || '',
    keywords: document.getElementById('meta-keywords')?.value || '',
  }
  const dest = await api.openSaveDialog({ title:'Save PDF with new metadata', defaultPath: fp.replace(/\.pdf$/i,'_edited.pdf'), filters:[{name:'PDF',extensions:['pdf']}] })
  if (!dest) return
  const r = await api.editPdfMetadata(fp, dest, meta)
  if (r.success) {
    showToast('Metadata updated ✓')
    _pushToolHist('pdf', { op:'metadata', label:`Edited metadata of ${fp.split('\\').pop()}`, file: fp.split('\\').pop(), dest })
  } else showToast('Failed: '+r.error,'error')
}

// ── Insert Blank Pages ─────────────────────────────────────────────────────────
async function utilInsertBlankPages() {
  const fp = document.getElementById('insert-src')?.value
  if (!fp) { showToast('Select a source PDF first', 'error'); return }
  const posSel = document.getElementById('insert-pos')?.value || 'end'
  const after  = parseInt(document.getElementById('insert-after')?.value || '1')
  const count  = parseInt(document.getElementById('insert-count')?.value || '1')
  const size   = document.getElementById('insert-size')?.value || 'match'
  const position = posSel==='after' ? after : posSel
  const dest = await api.openSaveDialog({ title:'Save PDF with inserted pages', defaultPath: fp.replace(/\.pdf$/i,'_inserted.pdf'), filters:[{name:'PDF',extensions:['pdf']}] })
  if (!dest) return
  const r = await api.insertBlankPages(fp, dest, { position, count, size })
  if (r.success) {
    showToast(`Inserted ${r.inserted} blank page(s) ✓`)
    _pushToolHist('pdf', { op:'insert', label:`Inserted ${r.inserted} blank page(s) into ${fp.split('\\').pop()}`, file: fp.split('\\').pop(), dest })
  } else showToast('Failed: '+r.error,'error')
}

// ── Crop Pages ─────────────────────────────────────────────────────────────────
async function utilCropPdf() {
  const fp = document.getElementById('crop-src')?.value
  if (!fp) { showToast('Select a source PDF first', 'error'); return }
  const pg    = document.getElementById('crop-pages')?.value?.trim()
  const pages = (!pg || pg.toLowerCase()==='all') ? 'all' : _parsePageList(pg, 9999)
  const margins = {
    top:    parseFloat(document.getElementById('crop-top')?.value    || '0'),
    bottom: parseFloat(document.getElementById('crop-bottom')?.value || '0'),
    left:   parseFloat(document.getElementById('crop-left')?.value   || '0'),
    right:  parseFloat(document.getElementById('crop-right')?.value  || '0'),
  }
  const dest = await api.openSaveDialog({ title:'Save cropped PDF', defaultPath: fp.replace(/\.pdf$/i,'_cropped.pdf'), filters:[{name:'PDF',extensions:['pdf']}] })
  if (!dest) return
  const r = await api.cropPdf(fp, dest, { pages, margins })
  if (r.success) {
    showToast(`Cropped ${r.cropped} page(s) ✓`)
    _pushToolHist('pdf', { op:'crop', label:`Cropped ${fp.split('\\').pop()}`, file: fp.split('\\').pop(), dest })
  } else showToast('Failed: '+r.error,'error')
}

// ── PDF ⇄ Images ───────────────────────────────────────────────────────────────
async function utilImagesToPdf() {
  const paths = await api.openImageDialog()
  if (!paths || !paths.length) return
  const dest = await api.openSaveDialog({ title:'Save PDF from images', defaultPath:'images.pdf', filters:[{name:'PDF',extensions:['pdf']}] })
  if (!dest) return
  const r = await api.imagesToPdf(paths, dest)
  if (r.success) {
    showToast(`Built PDF from ${r.pageCount} image(s) ✓`)
    _pushToolHist('pdf', { op:'images-to-pdf', label:`Built PDF from ${r.pageCount} images → ${dest.split('\\').pop()}`, dest })
  } else showToast('Failed: '+r.error,'error')
}

async function utilExportPdfToImages() {
  const fp = document.getElementById('img-src')?.value
  if (!fp) { showToast('Select a source PDF first', 'error'); return }
  if (!window.pdfjsLib) { showToast('PDF renderer still loading — try again in a moment', 'error'); return }
  const pgStr = document.getElementById('img-pages')?.value?.trim()
  const scale = parseFloat(document.getElementById('img-scale')?.value || '2')
  const outDir = await api.openFolderDialog({ title:'Choose output folder for images' })
  if (!outDir) return
  showToast('Rendering pages…', 'info')
  try {
    const base64 = await api.readBinaryFile(fp)
    const binary = atob(base64)
    const bytes  = new Uint8Array(binary.length)
    for (let i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i)
    const doc   = await window.pdfjsLib.getDocument({ data: bytes }).promise
    const total = doc.numPages
    const pages = (!pgStr || pgStr.toLowerCase()==='all') ? Array.from({length:total},(_,i)=>i+1) : _parsePageList(pgStr, total)
    const baseName = fp.split('\\').pop().replace(/\.pdf$/i,'')
    let count = 0
    for (const n of pages) {
      if (n<1 || n>total) continue
      const page   = await doc.getPage(n)
      const vp     = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = vp.width; canvas.height = vp.height
      const ctx = canvas.getContext('2d')
      await page.render({ canvasContext: ctx, viewport: vp }).promise
      const b64  = canvas.toDataURL('image/png').split(',')[1]
      const dest = `${outDir}\\${baseName}_page${String(n).padStart(3,'0')}.png`
      await api.writeBinaryFile(dest, b64)
      count++
    }
    showToast(`Exported ${count} page(s) as PNG ✓`)
    _pushToolHist('pdf', { op:'pdf-to-images', label:`Exported ${count} pages from ${fp.split('\\').pop()} as PNG`, file: fp.split('\\').pop(), dest: outDir })
  } catch(e) { showToast('Export failed: '+e.message, 'error') }
}

async function utilRunOcr() {
  const fp = document.getElementById('ocr-src')?.value
  if (!fp) { showToast('Select a source PDF first', 'error'); return }
  if (!window.pdfjsLib) { showToast('PDF renderer still loading — try again in a moment', 'error'); return }
  const pgStr = document.getElementById('ocr-pages')?.value?.trim()
  const scale = parseFloat(document.getElementById('ocr-scale')?.value || '2')

  const dest = await api.openSaveDialog({ title:'Save searchable PDF', defaultPath: fp.replace(/\.pdf$/i,'_ocr.pdf'), filters:[{name:'PDF',extensions:['pdf']}] })
  if (!dest) return

  const btn  = document.getElementById('ocr-run-btn')
  const wrap = document.getElementById('ocr-progress-wrap')
  const bar  = document.getElementById('ocr-progress-bar')
  const text = document.getElementById('ocr-progress-text')
  if (btn)  btn.disabled = true
  if (wrap) wrap.classList.remove('hidden')
  if (bar)  bar.style.width = '0%'
  if (text) text.textContent = 'Rendering pages…'

  try {
    const base64 = await api.readBinaryFile(fp)
    const binary = atob(base64)
    const bytes  = new Uint8Array(binary.length)
    for (let i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i)
    const doc   = await window.pdfjsLib.getDocument({ data: bytes }).promise
    const total = doc.numPages
    const pageNums = (!pgStr || pgStr.toLowerCase()==='all') ? Array.from({length:total},(_,i)=>i+1) : _parsePageList(pgStr, total)

    const pages = []
    for (const n of pageNums) {
      if (n<1 || n>total) continue
      const page   = await doc.getPage(n)
      const vp     = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = vp.width; canvas.height = vp.height
      const ctx = canvas.getContext('2d')
      await page.render({ canvasContext: ctx, viewport: vp }).promise
      const png = canvas.toDataURL('image/png').split(',')[1]
      pages.push({ pageNum: n, scale, png })
    }
    if (!pages.length) { showToast('No pages to OCR', 'error'); return }

    window._ocrProgressUpdate = ({ current, total: t, page }) => {
      const pct = Math.round((current / t) * 100)
      if (bar)  bar.style.width = pct + '%'
      if (text) text.textContent = `Recognizing text on page ${page} (${current}/${t})…`
    }
    if (!window._ocrListenerSet) {
      api.onOcrProgress(d => window._ocrProgressUpdate?.(d))
      window._ocrListenerSet = true
    }

    const r = await api.ocrPdf(fp, dest, pages)
    if (r.success) {
      showToast(`OCR complete — ${r.pages} page(s) made searchable ✓`)
      _pushToolHist('pdf', { op:'ocr', label:`OCR: ${fp.split('\\').pop()} → ${dest.split('\\').pop()}`, file: fp.split('\\').pop(), dest })
    } else showToast('OCR failed: '+r.error, 'error')
  } catch(e) {
    showToast('OCR failed: '+e.message, 'error')
  } finally {
    if (btn)  btn.disabled = false
    if (wrap) wrap.classList.add('hidden')
    window._ocrProgressUpdate = null
  }
}

async function utilPickCert() {
  const paths = await api.openCertDialog()
  if (!paths?.length) return
  _utilSignCertPath = paths[0]
  await api.storeSet('pdfSignCertPath', _utilSignCertPath)
  document.getElementById('sign-cert').value = _utilSignCertPath
  document.getElementById('sign-cert-lbl').textContent = _utilSignCertPath.split('\\').pop()
  document.getElementById('sign-cert-info').innerHTML = ''
}

async function utilVerifyCert() {
  const certPath = document.getElementById('sign-cert')?.value
  const info = document.getElementById('sign-cert-info')
  if (!certPath) { showToast('Select your certificate file first', 'error'); return }
  const password = document.getElementById('sign-pw')?.value || ''
  info.innerHTML = `<p class="text-xs text-slate-400">Checking certificate…</p>`
  const r = await api.readP12Info(certPath, password)
  if (!r.success) {
    info.innerHTML = `<div class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">⚠ ${esc(r.error)}</div>`
    return
  }
  const validTo = new Date(r.validTo).toLocaleDateString()
  const cls = r.expired ? 'text-red-600 bg-red-50 border-red-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
  info.innerHTML = `<div class="text-xs ${cls} border rounded-lg p-2.5 space-y-0.5">
    <div>${r.expired ? '⚠ This certificate has expired' : '✓ Certificate read successfully'}</div>
    <div class="text-slate-600">Signer: <strong>${esc(r.commonName)}</strong></div>
    <div class="text-slate-600">Issued by: ${esc(r.issuer)}</div>
    <div class="text-slate-600">Valid until: ${validTo}</div>
  </div>`
}

async function utilSignPdf() {
  const fp = document.getElementById('sign-src')?.value
  if (!fp) { showToast('Select a source PDF first', 'error'); return }
  const certPath = document.getElementById('sign-cert')?.value
  if (!certPath) { showToast('Select your certificate (.p12/.pfx) first', 'error'); return }
  const password = document.getElementById('sign-pw')?.value || ''

  const opts = {
    certPath, password,
    reason:      document.getElementById('sign-reason')?.value?.trim()   || '',
    location:    document.getElementById('sign-location')?.value?.trim() || '',
    contactInfo: document.getElementById('sign-contact')?.value?.trim()  || '',
    stamp:       document.getElementById('sign-stamp')?.checked || false,
    stampPage:   document.getElementById('sign-stamp-page')?.value || 'last',
  }

  const dest = await api.openSaveDialog({ title:'Save signed PDF', defaultPath: fp.replace(/\.pdf$/i,'_signed.pdf'), filters:[{name:'PDF',extensions:['pdf']}] })
  if (!dest) return

  const btn = document.getElementById('sign-run-btn')
  if (btn) { btn.disabled = true; btn.textContent = '🖊 Signing…' }
  const r = await api.signPdf(fp, dest, opts)
  if (btn) { btn.disabled = false; btn.textContent = '🖊 Sign & Save…' }

  if (r.success) {
    showToast(`Signed by ${r.signedBy} ✓`)
    _pushToolHist('pdf', { op:'sign', label:`Signed ${fp.split('\\').pop()} as ${r.signedBy}`, file: fp.split('\\').pop(), dest })
    const pw = document.getElementById('sign-pw')
    if (pw) pw.value = ''
  } else showToast('Signing failed: '+r.error, 'error')
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

// ── Python code (scipy / pingouin / statsmodels / sklearn) ───────────────────
const PYTHON_RESULTS = {
  one_t: { pkg:'scipy.stats · numpy', code:
`from scipy import stats
import numpy as np

data = np.array([2.3, 2.7, 2.5, 2.8, 2.4])
mu0  = 2.5                          # hypothesised value

print(stats.shapiro(data))          # normality (p > 0.05 → OK)

t, p = stats.ttest_1samp(data, mu0, alternative='two-sided')
ci   = stats.t.interval(0.95, df=len(data)-1,
                         loc=np.mean(data), scale=stats.sem(data))
print(f"t = {t:.3f},  p = {p:.4f},  95% CI = [{ci[0]:.3f}, {ci[1]:.3f}]")

# Cohen's d
d = (np.mean(data) - mu0) / np.std(data, ddof=1)
print(f"Cohen's d = {d:.3f}")` },

  paired_t: { pkg:'scipy.stats · numpy', code:
`from scipy import stats
import numpy as np

before = np.array([5.2, 4.8, 6.1, 5.5, 4.9])
after  = np.array([5.8, 5.3, 6.7, 5.9, 5.5])
diff   = after - before

print(stats.shapiro(diff))          # normality of differences

t, p = stats.ttest_rel(after, before, alternative='two-sided')
print(f"t = {t:.3f},  p = {p:.4f}")

d = np.mean(diff) / np.std(diff, ddof=1)
print(f"Cohen's d = {d:.3f}")` },

  welch_t: { pkg:'scipy.stats · numpy', code:
`from scipy import stats
import numpy as np

group1 = np.array([2.3, 2.7, 2.5, 2.8, 2.4, 2.6])
group2 = np.array([2.9, 3.1, 2.8, 3.3, 3.0, 2.7])

print(stats.shapiro(group1)); print(stats.shapiro(group2))

t, p = stats.ttest_ind(group1, group2, equal_var=False)
print(f"t = {t:.3f},  p = {p:.4f}")

n1, n2 = len(group1), len(group2)
sp = np.sqrt(((n1-1)*group1.std(ddof=1)**2 +
              (n2-1)*group2.std(ddof=1)**2) / (n1+n2-2))
d  = (group1.mean() - group2.mean()) / sp
print(f"Cohen's d = {d:.3f}")` },

  wilcox1: { pkg:'scipy.stats', code:
`from scipy import stats

data = [2.1, 2.5, 1.9, 2.8, 2.3]
mu0  = 2.0

result = stats.wilcoxon([x - mu0 for x in data], alternative='two-sided')
print(f"W = {result.statistic:.3f},  p = {result.pvalue:.4f}")` },

  wilcox_sr: { pkg:'scipy.stats · numpy', code:
`from scipy import stats
import numpy as np

before = [5, 4, 6, 5, 4, 7, 5]
after  = [6, 5, 7, 6, 5, 8, 6]

result = stats.wilcoxon(after, before, alternative='two-sided')
print(f"W = {result.statistic:.3f},  p = {result.pvalue:.4f}")

z = stats.norm.ppf(result.pvalue / 2)
r = abs(z) / np.sqrt(len(before))
print(f"Effect size r = {r:.3f}")` },

  mwu: { pkg:'scipy.stats', code:
`from scipy import stats

group1 = [2.1, 2.5, 1.9, 2.8, 2.3]
group2 = [3.0, 2.7, 3.4, 2.9, 3.2]

result = stats.mannwhitneyu(group1, group2, alternative='two-sided')
print(f"U = {result.statistic:.3f},  p = {result.pvalue:.4f}")` },

  one_anova: { pkg:'scipy.stats · statsmodels', code:
`from scipy import stats
from statsmodels.stats.multicomp import pairwise_tukeyhsd
import statsmodels.formula.api as smf
import statsmodels.api as sm
import pandas as pd

df = pd.DataFrame({
    'group':  ['A']*5 + ['B']*5 + ['C']*5,
    'values': [2.3,2.7,2.5,2.8,2.4, 3.1,2.9,3.3,2.8,3.2, 2.0,1.8,2.2,1.9,2.1]
})

for g, sub in df.groupby('group'):
    print(g, stats.shapiro(sub['values']))
print(stats.levene(*[g['values'].values for _, g in df.groupby('group')]))

F, p = stats.f_oneway(*[g['values'].values for _, g in df.groupby('group')])
print(f"F = {F:.3f},  p = {p:.4f}")

print(pairwise_tukeyhsd(df['values'], df['group']))

model = smf.ols('values ~ C(group)', data=df).fit()
aov = sm.stats.anova_lm(model, typ=1)
eta2 = aov['sum_sq'].iloc[0] / aov['sum_sq'].sum()
print(f"η² = {eta2:.3f}")` },

  two_anova: { pkg:'statsmodels', code:
`import statsmodels.formula.api as smf
import statsmodels.api as sm
import pandas as pd

df = pd.DataFrame({
    'treatment': ['A','A','A','B','B','B']*2,
    'sex':       ['M','F','M','F','M','F']*2,
    'values':    [3.2,2.8,3.0,4.1,3.9,4.0, 2.9,2.6,2.8,3.8,4.2,3.9]
})

model = smf.ols('values ~ C(treatment) * C(sex)', data=df).fit()
print(sm.stats.anova_lm(model, typ=2))

from statsmodels.stats.multicomp import pairwise_tukeyhsd
print(pairwise_tukeyhsd(df['values'], df['treatment']))` },

  kruskal: { pkg:'scipy.stats · scikit-posthocs', code:
`from scipy import stats
import pandas as pd

df = pd.DataFrame({
    'group':  ['A']*5 + ['B']*5 + ['C']*5,
    'values': [2.3,2.7,2.5,2.8,2.4, 3.1,2.9,3.3,2.8,3.2, 2.0,1.8,2.2,1.9,2.1]
})

H, p = stats.kruskal(*[g['values'].values for _, g in df.groupby('group')])
print(f"H = {H:.3f},  p = {p:.4f}")

# Post-hoc Dunn's test: pip install scikit-posthocs
import scikit_posthocs as sp
print(sp.posthoc_dunn(df, val_col='values', group_col='group', p_adjust='bonferroni'))` },

  rm_anova: { pkg:'pingouin', code:
`import pingouin as pg
import pandas as pd

df = pd.DataFrame({
    'subject':   [1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6],
    'timepoint': [1,2,3]*6,
    'treatment': ['A','A','A','A','A','A','B','B','B','B','B','B','A','A','A','B','B','B'],
    'response':  [2.1,2.5,2.8, 1.9,2.2,2.6, 3.2,3.8,4.1,
                  3.0,3.5,3.9, 2.4,2.7,3.0, 2.2,2.6,2.9]
})

aov = pg.rm_anova(data=df, dv='response', within='timepoint', subject='subject')
print(aov)

posthoc = pg.pairwise_tests(data=df, dv='response', within='timepoint',
                             subject='subject', padjust='bonf')
print(posthoc)` },

  pearson: { pkg:'scipy.stats · numpy', code:
`from scipy import stats
import numpy as np

x = [1.2, 2.4, 3.1, 4.5, 5.2, 6.0, 7.3]
y = [2.1, 4.2, 6.0, 8.9, 10.1, 12.2, 14.5]

print(stats.shapiro(x)); print(stats.shapiro(y))

r, p = stats.pearsonr(x, y)
z  = np.arctanh(r)
se = 1 / np.sqrt(len(x) - 3)
ci = np.tanh([z - 1.96*se, z + 1.96*se])
print(f"r = {r:.3f},  p = {p:.4f},  95% CI = [{ci[0]:.3f}, {ci[1]:.3f}]")` },

  spearman: { pkg:'scipy.stats', code:
`from scipy import stats

x = [1, 3, 2, 5, 4, 7, 6]
y = [2, 5, 3, 8, 7, 11, 9]

rho, p = stats.spearmanr(x, y)
print(f"ρ = {rho:.3f},  p = {p:.4f}")` },

  linear_reg: { pkg:'statsmodels', code:
`import statsmodels.api as sm
import numpy as np, matplotlib.pyplot as plt

x = [1.2, 2.4, 3.1, 4.5, 5.2, 6.0, 7.3]
y = [2.1, 4.2, 6.0, 8.9, 10.1, 12.2, 14.5]

model = sm.OLS(y, sm.add_constant(x)).fit()
print(model.summary())

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))
ax1.scatter(model.fittedvalues, model.resid)
ax1.axhline(0, color='r'); ax1.set_title('Residuals vs Fitted')
sm.qqplot(model.resid, line='s', ax=ax2); ax2.set_title('Q-Q Plot')
plt.tight_layout(); plt.show()` },

  multi_reg: { pkg:'statsmodels', code:
`import statsmodels.formula.api as smf
import pandas as pd
from statsmodels.stats.outliers_influence import variance_inflation_factor
import numpy as np

df = pd.DataFrame({
    'y':   [3.2,4.5,2.1,5.8,3.9,6.2,4.8,3.5],
    'x1':  [1.1,2.3,0.8,3.5,2.0,4.1,2.8,1.6],
    'x2':  [0.5,1.2,0.3,1.8,0.9,2.2,1.5,0.7],
    'grp': ['A','B','A','B','A','B','A','B']
})

model = smf.ols('y ~ x1 + x2 + C(grp)', data=df).fit()
print(model.summary())

X = df[['x1','x2']].assign(const=1)
vif = {col: variance_inflation_factor(X.values, i) for i, col in enumerate(X.columns)}
print("VIF:", vif)` },

  logistic: { pkg:'statsmodels · sklearn', code:
`import statsmodels.formula.api as smf
import pandas as pd, numpy as np
from sklearn.metrics import roc_auc_score

df = pd.DataFrame({
    'outcome':   [0,1,0,1,1,0,1,0,1,1],
    'age':       [25,45,30,55,50,28,48,32,42,60],
    'treatment': ['A','B','A','B','B','A','B','A','B','B']
})

model = smf.logit('outcome ~ age + C(treatment)', data=df).fit()
print(model.summary())

odds = np.exp(pd.concat([model.params, model.conf_int()], axis=1))
odds.columns = ['OR', 'CI_low', 'CI_high']
print(odds)

print(f"AUC = {roc_auc_score(df['outcome'], model.predict()):.3f}")` },

  poisson: { pkg:'statsmodels', code:
`import statsmodels.formula.api as smf
import pandas as pd

df = pd.DataFrame({
    'count': [2,5,1,8,4,11,3,7,9,6],
    'dose':  [1,2,1,3,2,4,1,3,3,2],
    'group': ['A','A','B','B','A','B','A','B','A','B']
})

model = smf.poisson('count ~ dose + C(group)', data=df).fit()
print(model.summary())

print(f"Deviance/df = {model.deviance/model.df_resid:.2f}  (≈1 → no overdispersion)")
# If overdispersed: smf.negativebinomial(...)` },

  chisq: { pkg:'scipy.stats · numpy', code:
`from scipy import stats
import numpy as np

table = np.array([[45, 35], [25, 55]])

chi2, p, dof, expected = stats.chi2_contingency(table)
print(f"χ² = {chi2:.3f},  df = {dof},  p = {p:.4f}")
print("Expected frequencies:\\n", expected.round(1))

v = np.sqrt(chi2 / (table.sum() * (min(table.shape)-1)))
print(f"Cramér's V = {v:.3f}")` },

  chisq_gof: { pkg:'scipy.stats · numpy', code:
`from scipy import stats
import numpy as np

observed = np.array([30, 45, 25])
expected  = np.array([1/3, 1/3, 1/3])   # equal proportions

chi2, p = stats.chisquare(observed, f_exp=observed.sum()*expected)
print(f"χ² = {chi2:.3f},  p = {p:.4f}")` },

  fisher: { pkg:'scipy.stats', code:
`from scipy import stats
import numpy as np

table = np.array([[3, 8], [12, 5]])

odds_ratio, p = stats.fisher_exact(table, alternative='two-sided')
print(f"Odds ratio = {odds_ratio:.3f},  p = {p:.4f}")` },

  kappa: { pkg:'sklearn.metrics', code:
`from sklearn.metrics import cohen_kappa_score

rater1 = ['Yes','No','Yes','Yes','No','No','Yes','No']
rater2 = ['Yes','No','Yes','No','No','Yes','Yes','No']

kappa = cohen_kappa_score(rater1, rater2)
print(f"κ = {kappa:.3f}")

# Weighted kappa for ordinal ratings:
# kappa_w = cohen_kappa_score(rater1_num, rater2_num, weights='linear')` },

  shapiro: { pkg:'scipy.stats · matplotlib', code:
`from scipy import stats
import numpy as np, matplotlib.pyplot as plt

data = [2.3,2.7,2.5,2.8,2.4,2.6,2.9,2.2,2.5,2.7]

stat, p = stats.shapiro(data)
print(f"Shapiro-Wilk: W = {stat:.3f},  p = {p:.4f}")
print("→", "Normal (p > 0.05)" if p > 0.05 else "Non-normal (p ≤ 0.05)")

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))
ax1.hist(data, edgecolor='black'); ax1.set_title('Histogram')
stats.probplot(data, plot=ax2); ax2.set_title('Q-Q Plot')
plt.tight_layout(); plt.show()

# For n > 50: stats.kstest(data, 'norm', args=(np.mean(data), np.std(data)))` },

  cox: { pkg:'lifelines', code:
`from lifelines import KaplanMeierFitter, CoxPHFitter
from lifelines.statistics import logrank_test
import pandas as pd

df = pd.DataFrame({
    'time':  [5,12,8,3,15,9,2,11,6,14],
    'event': [1,0,1,1,0,1,1,0,1,0],
    'group': ['A','A','B','B','A','B','A','B','A','B'],
    'age':   [45,52,38,61,49,55,43,58,47,53]
})

for g, sub in df.groupby('group'):
    kmf = KaplanMeierFitter()
    kmf.fit(sub['time'], sub['event'], label=g)
    kmf.plot_survival_function()

A, B = df[df.group=='A'], df[df.group=='B']
r = logrank_test(A['time'], B['time'], A['event'], B['event'])
print(f"Log-rank p = {r.p_value:.4f}")

df['group_num'] = (df['group']=='B').astype(int)
cph = CoxPHFitter()
cph.fit(df[['time','event','group_num','age']], duration_col='time', event_col='event')
cph.print_summary()` },

  pca: { pkg:'sklearn · matplotlib', code:
`from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import pandas as pd, numpy as np, matplotlib.pyplot as plt

df = pd.DataFrame({
    'var1': [2.3,1.5,3.1,2.8,1.9,3.5,2.1,1.7,3.3,2.6],
    'var2': [1.1,0.9,1.8,1.5,1.0,2.0,1.2,0.8,1.7,1.4],
    'var3': [5.2,3.8,6.9,5.8,4.1,7.2,4.9,3.5,6.5,5.5],
    'var4': [0.8,0.5,1.3,1.0,0.6,1.5,0.9,0.4,1.2,1.0]
})

X   = StandardScaler().fit_transform(df)
pca = PCA().fit(X)

print("Explained variance ratio:", pca.explained_variance_ratio_.round(3))
print("Cumulative:", pca.explained_variance_ratio_.cumsum().round(3))

plt.plot(range(1, len(pca.explained_variance_)+1), pca.explained_variance_, 'o-')
plt.xlabel('Component'); plt.ylabel('Eigenvalue'); plt.title('Scree Plot'); plt.show()

scores = pd.DataFrame(pca.transform(X), columns=[f'PC{i+1}' for i in range(df.shape[1])])
print(scores.head())` },

  lmer: { pkg:'statsmodels (or pingouin)', code:
`import statsmodels.formula.api as smf
import pandas as pd

df = pd.DataFrame({
    'subject':   [1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6],
    'timepoint': [1,2,3,4]*6,
    'treatment': ['A']*8 + ['B']*8 + ['A']*4 + ['B']*4,
    'response':  [2.1,2.5,2.8,3.1, 1.9,2.2,2.6,3.0,
                  3.2,3.8,4.1,4.5, 3.0,3.5,3.9,4.2,
                  2.4,2.7,3.0,3.3, 2.2,2.6,2.9,3.2]
})

model = smf.mixedlm('response ~ C(timepoint) * C(treatment)',
                    data=df, groups=df['subject']).fit()
print(model.summary())` },
}

// ── SPSS syntax ───────────────────────────────────────────────────────────────
const SPSS_RESULTS = {
  one_t: { pkg:'SPSS Statistics', code:
`* One-sample t-test
T-TEST
  /TESTVAL = 2.5
  /MISSING = ANALYSIS
  /VARIABLES = data
  /CRITERIA = CI(0.95).` },

  paired_t: { pkg:'SPSS Statistics', code:
`* Paired-samples t-test
T-TEST PAIRS = before WITH after (PAIRED)
  /CRITERIA = CI(0.95)
  /MISSING = ANALYSIS.` },

  welch_t: { pkg:'SPSS Statistics', code:
`* Independent-samples t-test (Welch's)
T-TEST GROUPS = group(1 2)
  /MISSING = ANALYSIS
  /VARIABLES = value
  /CRITERIA = CI(0.95).
* Use the "Equal variances not assumed" row (Welch)` },

  wilcox1: { pkg:'SPSS Statistics', code:
`* One-sample Wilcoxon (create difference variable first)
COMPUTE diff = data - 2.0.  /* hypothesised median */
EXECUTE.

NPAR TESTS
  /WILCOXON = diff
  /MISSING ANALYSIS.` },

  wilcox_sr: { pkg:'SPSS Statistics', code:
`* Paired Wilcoxon signed-rank test
NPAR TESTS
  /WILCOXON = before WITH after (PAIRED)
  /STATISTICS = DESCRIPTIVES
  /MISSING ANALYSIS.` },

  mwu: { pkg:'SPSS Statistics', code:
`* Mann-Whitney U test
NPAR TESTS
  /M-W = value BY group(1 2)
  /STATISTICS = DESCRIPTIVES
  /MISSING ANALYSIS.` },

  one_anova: { pkg:'SPSS Statistics', code:
`* One-way ANOVA with Tukey post-hoc
ONEWAY values BY group
  /STATISTICS DESCRIPTIVES HOMOGENEITY
  /POSTHOC TUKEY ALPHA(0.05)
  /MISSING ANALYSIS.` },

  two_anova: { pkg:'SPSS Statistics', code:
`* Two-way ANOVA (factorial)
UNIANOVA values BY treatment sex
  /METHOD = SSTYPE(3)
  /INTERCEPT = INCLUDE
  /EMMEANS = TABLES(treatment*sex)
  /PRINT = DESCRIPTIVE HOMOGENEITY
  /CRITERIA = ALPHA(0.05)
  /DESIGN = treatment sex treatment*sex.` },

  kruskal: { pkg:'SPSS Statistics', code:
`* Kruskal-Wallis test
NPAR TESTS
  /K-W = values BY group(1 3)
  /STATISTICS = DESCRIPTIVES
  /MISSING ANALYSIS.` },

  rm_anova: { pkg:'SPSS Statistics', code:
`* Repeated-measures ANOVA (within-subjects)
GLM response_t1 response_t2 response_t3
  /WSFACTOR = timepoint 3 Polynomial
  /METHOD = SSTYPE(3)
  /PRINT = DESCRIPTIVE
  /WSDESIGN = timepoint.` },

  pearson: { pkg:'SPSS Statistics', code:
`* Pearson correlation
CORRELATIONS
  /VARIABLES = x y
  /PRINT = TWOTAIL SIG FULL
  /MISSING = PAIRWISE.` },

  spearman: { pkg:'SPSS Statistics', code:
`* Spearman rank correlation
NONPAR CORR
  /VARIABLES = x y
  /PRINT = SPEARMAN TWOTAIL SIG
  /MISSING = PAIRWISE.` },

  linear_reg: { pkg:'SPSS Statistics', code:
`* Simple linear regression
REGRESSION
  /MISSING LISTWISE
  /STATISTICS COEFF OUTS R ANOVA
  /CRITERIA = PIN(.05) POUT(.10)
  /NOORIGIN
  /DEPENDENT y
  /METHOD = ENTER x.` },

  multi_reg: { pkg:'SPSS Statistics', code:
`* Multiple linear regression
REGRESSION
  /MISSING LISTWISE
  /STATISTICS COEFF OUTS R ANOVA COLLIN TOL
  /CRITERIA = PIN(.05) POUT(.10)
  /NOORIGIN
  /DEPENDENT y
  /METHOD = ENTER x1 x2 grp.` },

  logistic: { pkg:'SPSS Statistics', code:
`* Binary logistic regression
LOGISTIC REGRESSION VARIABLES outcome
  /METHOD = ENTER age treatment
  /CONTRAST (treatment) = Indicator(1)
  /PRINT = GOODFIT CI(95)
  /CRITERIA = PIN(0.05) POUT(0.10) ITERATE(20) CUT(0.5).` },

  poisson: { pkg:'SPSS Statistics', code:
`* Poisson regression (Generalized Linear Model)
GENLIN count BY group WITH dose
  /MODEL group dose INTERCEPT = YES
    DISTRIBUTION = POISSON LINK = LOG
  /PRINT CPS DESCRIPTIVES MODELINFO FIT SUMMARY SOLUTION.` },

  chisq: { pkg:'SPSS Statistics', code:
`* Chi-squared test of independence
CROSSTABS
  /TABLES = row BY col
  /STATISTICS = CHISQ PHI CC
  /CELLS = COUNT EXPECTED ROW COLUMN TOTAL
  /COUNT ROUND CELL.` },

  chisq_gof: { pkg:'SPSS Statistics', code:
`* Chi-squared goodness-of-fit
NPAR TESTS
  /CHISQUARE = category
  /EXPECTED = EQUAL
  /* Replace EQUAL with custom weights if needed: 1 2 1 */
  /STATISTICS DESCRIPTIVES.` },

  fisher: { pkg:'SPSS Statistics', code:
`* Fisher's exact test (SPSS reports it automatically for 2×2 tables)
CROSSTABS
  /TABLES = row BY col
  /STATISTICS = CHISQ
  /CELLS = COUNT EXPECTED
  /COUNT ROUND CELL.` },

  kappa: { pkg:'SPSS Statistics', code:
`* Cohen's Kappa — inter-rater agreement
CROSSTABS
  /TABLES = rater1 BY rater2
  /STATISTICS = KAPPA
  /CELLS = COUNT
  /COUNT ROUND CELL.` },

  shapiro: { pkg:'SPSS Statistics', code:
`* Normality tests (Shapiro-Wilk + K-S + plots)
EXAMINE VARIABLES = data
  /PLOT NPPLOT HISTOGRAM
  /STATISTICS DESCRIPTIVES
  /CINTERVAL 95
  /MISSING LISTWISE
  /NOTOTAL.
* Shapiro-Wilk reported for n ≤ 50
* Kolmogorov-Smirnov (Lilliefors) for larger samples` },

  cox: { pkg:'SPSS Statistics', code:
`* Kaplan-Meier survival curves + log-rank test
KM time BY group
  /STATUS = event(1)
  /PRINT TABLE MEAN
  /TEST LOGRANK
  /PLOT SURVIVAL.

* Cox proportional hazards model
COXREG time
  /STATUS = event(1)
  /METHOD = ENTER group age
  /PRINT = CI(95)
  /CRITERIA = PIN(.05) POUT(.10) ITERATE(20).` },

  pca: { pkg:'SPSS Statistics', code:
`* Principal Component Analysis
FACTOR
  /VARIABLES var1 var2 var3 var4
  /MISSING LISTWISE
  /ANALYSIS var1 var2 var3 var4
  /PRINT INITIAL KMO EXTRACTION ROTATION
  /PLOT EIGEN
  /EXTRACTION PC
  /CRITERIA MINEIGEN(1) ITERATE(25)
  /ROTATION VARIMAX
  /METHOD = CORRELATION.` },

  lmer: { pkg:'SPSS Statistics', code:
`* Linear mixed model (random intercept per subject)
MIXED response BY timepoint treatment
  /CRITERIA = DFMETHOD(SATTERTHWAITE) CIN(95) MXITER(100)
  /FIXED = timepoint treatment timepoint*treatment | SSTYPE(3)
  /METHOD = REML
  /RANDOM = INTERCEPT | SUBJECT(subject) COVTYPE(VC)
  /EMMEANS TABLES(treatment*timepoint) COMPARE(treatment)
  /PRINT = SOLUTION TESTCOV.` },
}

// ── Power calculator — math primitives ───────────────────────────────────────
// Normal CDF (Zelen & Severo, error < 7.5e-8)
function _phi(x) {
  const b = [0.319381530,-0.356563782,1.781477937,-1.821255978,1.330274429]
  const t = 1/(1+0.2316419*Math.abs(x))
  let p = t*(b[0]+t*(b[1]+t*(b[2]+t*(b[3]+t*b[4]))))
  p = 1 - 0.3989422803*Math.exp(-x*x/2)*p
  return x >= 0 ? p : 1-p
}
// Inverse normal CDF (Peter Acklam's rational approximation)
function _phiInv(p) {
  if (p<=0) return -Infinity; if (p>=1) return Infinity
  const sign = p>0.5?1:-1, q=Math.min(p,1-p)
  const r = Math.sqrt(-2*Math.log(q))
  return sign*(r-(2.515517+0.802853*r+0.010328*r*r)/
                  (1+1.432788*r+0.189269*r*r+0.001308*r*r*r))
}
// Log-gamma (Lanczos, 6 terms)
function _lgam(x) {
  const c=[76.18009172947146,-86.50532032941677,24.01409824083091,
           -1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5]
  let y=x, tmp=x+5.5, ser=1.000000000190015
  tmp-=(x+0.5)*Math.log(tmp)
  for(let i=0;i<6;i++){y++;ser+=c[i]/y}
  return -tmp+Math.log(2.5066282746310005*ser/x)
}
// Lower regularised incomplete gamma P(a,x) = gammainc(a,x)
function _gamP(a, x) {
  if (x<=0) return 0
  if (x<a+1) {                          // series
    let ap=a, d=1/a, s=d
    for(let i=0;i<300;i++){ap++;d*=x/ap;s+=d;if(d<s*3e-12)break}
    return s*Math.exp(-x+a*Math.log(x)-_lgam(a))
  }
  // continued fraction for upper gamma
  let b=x+1-a, c=1e30, d=1/b, h=d
  for(let i=1;i<=300;i++){
    const an=-i*(i-a);b+=2
    d=an*d+b;if(Math.abs(d)<1e-30)d=1e-30
    c=b+an/c;if(Math.abs(c)<1e-30)c=1e-30
    d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<1e-11)break
  }
  return 1-Math.exp(-x+a*Math.log(x)-_lgam(a))*h
}
// Chi-squared CDF
function _pchisq(x, df) { return _gamP(df/2, x/2) }
// Regularised incomplete beta I_x(a,b)
function _ibeta(x, a, b) {
  if (x<=0) return 0; if (x>=1) return 1
  const lb=_lgam(a)+_lgam(b)-_lgam(a+b)
  const bt=Math.exp(a*Math.log(x)+b*Math.log(1-x)-lb)
  const cf=(x,a,b)=>{
    const EPS=1e-10,qab=a+b,qap=a+1,qam=a-1
    let c=1,d=1-qab*x/qap;if(Math.abs(d)<1e-30)d=1e-30;d=1/d;let h=d
    for(let m=1;m<=300;m++){
      const m2=2*m
      let aa=m*(b-m)*x/((qam+m2)*(a+m2))
      d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;h*=d*c
      aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2))
      d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;const del=d*c;h*=del
      if(Math.abs(del-1)<EPS)break
    }
    return h
  }
  return x<(a+1)/(a+b+2)?bt*cf(x,a,b)/a:1-bt*cf(1-x,b,a)/b
}
// t-distribution CDF
function _ptCDF(t, df) {
  const x=df/(df+t*t),p=0.5*_ibeta(x,df/2,0.5)
  return t>=0?1-p:p
}
// F-distribution CDF
function _pfCDF(f, df1, df2) {
  return f<=0?0:_ibeta(df1*f/(df1*f+df2),df1/2,df2/2)
}
// Quantile of t (bisection)
function _qt(p, df) {
  if(p<0.5) return -_qt(1-p,df)
  let lo=0,hi=500
  for(let i=0;i<100;i++){const m=(lo+hi)/2;(_ptCDF(m,df)<p?lo:hi)=m}
  return (lo+hi)/2
}
// Quantile of chi-squared (bisection)
function _qchisq(p, df) {
  let lo=0,hi=Math.max(df*5,500)
  for(let i=0;i<100;i++){const m=(lo+hi)/2;(_pchisq(m,df)<p?lo:hi)=m}
  return (lo+hi)/2
}
// Non-central chi-squared upper tail P(X>=x|df,ncp) via Poisson mixture
function _pncChisqU(x, df, ncp) {
  if (x<=0) return 1; if (ncp<=0) return 1-_pchisq(x,df)
  const l2=ncp/2; let logW=-l2,j=0,s=0
  while(j<600){
    const w=Math.exp(logW)
    if(w<1e-15&&j>l2+5)break
    s+=w*(1-_pchisq(x,df+2*j))
    logW+=Math.log(l2)-Math.log(j+1); j++
  }
  return s
}
// Power formulas
function _pwrT(d, n, alpha, type) {       // type: 'ind'=two-sample, 'one'=one-sample/paired
  const df=type==='ind'?2*(n-1):n-1, ncp=type==='ind'?d*Math.sqrt(n/2):d*Math.sqrt(n)
  const tc=_qt(1-alpha/2,df)
  return _phi(ncp-tc)+_phi(-ncp-tc)
}
function _pwrAnova(f, n, k, alpha) {       // n per group, k groups
  const N=n*k, df1=k-1, lambda=f*f*N
  const crit=_qchisq(1-alpha,df1)         // chi-sq approximation (exact for large df2)
  return _pncChisqU(crit,df1,lambda)
}
function _pwrCorr(r, n, alpha) {
  const z=0.5*Math.log((1+r)/(1-r)), se=1/Math.sqrt(n-3), zc=_phiInv(1-alpha/2)
  return _phi(Math.abs(z)/se-zc)+_phi(-Math.abs(z)/se-zc)
}
function _pwrChisq(w, n, df, alpha) {
  const lambda=w*w*n, crit=_qchisq(1-alpha,df)
  return _pncChisqU(crit,df,lambda)
}
function _pwrReg(f2, n, u, alpha) {        // u = number of predictors
  const v=n-u-1, lambda=f2*n
  const crit=_qchisq(1-alpha,u)
  return _pncChisqU(crit,u,lambda)
}
// Bisection solver: find smallest n where power >= target
function _pwSolveN(fn, target, max=10000) {
  if(fn(max)<target) return null
  let lo=2,hi=max
  for(let i=0;i<40;i++){const m=Math.ceil((lo+hi)/2);fn(m)>=target?hi=m:lo=m;if(hi-lo<=1)break}
  return hi
}
// Bisection solver: find effect size
function _pwSolveES(fn, target, lo=0.001, hi=5) {
  if(fn(hi)<target) return null
  for(let i=0;i<60;i++){const m=(lo+hi)/2;fn(m)>=target?hi=m:lo=m;if(hi-lo<1e-5)break}
  return (lo+hi)/2
}

// ── Power calculator state helpers ───────────────────────────────────────────
function _pwGetES(key) {
  return key==='d'?_pwD:key==='f'?_pwF:key==='r'?_pwR:key==='w'?_pwW:_pwF2
}
function _pwSetES(key,v) {
  if(key==='d')_pwD=v;else if(key==='f')_pwF=v;else if(key==='r')_pwR=v;else if(key==='w')_pwW=v;else _pwF2=v
}

function _pwCalculate() {
  // Read inputs
  const alpha = parseFloat(document.getElementById('pw-alpha')?.value||'0.05')
  const power = parseFloat(document.getElementById('pw-power')?.value||'0.80')
  const n     = parseFloat(document.getElementById('pw-n')?.value||'20')
  const es    = parseFloat(document.getElementById('pw-es')?.value||'0.5')
  const k     = parseInt(document.getElementById('pw-k')?.value||'3')
  const df    = parseInt(document.getElementById('pw-df')?.value||'1')
  _pwAlpha=alpha; _pwPower=power; _pwN=n; _pwK=k; _pwDF=df

  const tests = {
    ttest_ind: { esKey:'d', type:'ind' },
    ttest_one: { esKey:'d', type:'one' },
    anova:     { esKey:'f' },
    corr:      { esKey:'r' },
    chisq:     { esKey:'w' },
    reg:       { esKey:'f2' },
  }
  const tc = tests[_pwTest]
  if (!tc) return

  let resultHTML = ''
  const fmt = v => v == null ? '> 10 000' : Number.isFinite(v) ? v.toFixed(3) : '—'

  if (_pwSolveFor === 'n') {
    _pwSetES(tc.esKey, es)
    let result, label, note=''
    if (_pwTest==='ttest_ind') {
      result = _pwSolveN(nn=>_pwrT(_pwD,nn,alpha,'ind'), power)
      label  = `<b>${result ?? '> 10 000'}</b> per group (${result?result*2:'> 20 000'} total)`
      note   = 'Two-tailed Welch\'s / independent t-test'
    } else if (_pwTest==='ttest_one') {
      result = _pwSolveN(nn=>_pwrT(_pwD,nn,alpha,'one'), power)
      label  = `<b>${result ?? '> 10 000'}</b> subjects`
      note   = 'Two-tailed one-sample or paired t-test'
    } else if (_pwTest==='anova') {
      result = _pwSolveN(nn=>_pwrAnova(_pwF,nn,_pwK,alpha), power)
      label  = `<b>${result ?? '> 10 000'}</b> per group (${result?result*_pwK:'> 10 000'} total, ${_pwK} groups)`
    } else if (_pwTest==='corr') {
      result = _pwSolveN(nn=>_pwrCorr(_pwR,nn,alpha), power)
      label  = `<b>${result ?? '> 10 000'}</b> pairs`
    } else if (_pwTest==='chisq') {
      result = _pwSolveN(nn=>_pwrChisq(_pwW,nn,_pwDF,alpha), power)
      label  = `<b>${result ?? '> 10 000'}</b> subjects (df = ${_pwDF})`
    } else if (_pwTest==='reg') {
      result = _pwSolveN(nn=>_pwrReg(_pwF2,nn,_pwK,alpha), power)
      label  = `<b>${result ?? '> 10 000'}</b> subjects (${_pwK} predictors)`
    }
    resultHTML = `<p class="text-sm text-slate-800 mb-1">Required sample size: ${label}</p>${note?`<p class="text-xs text-slate-400">${note}</p>`:''}`

  } else if (_pwSolveFor === 'power') {
    _pwSetES(tc.esKey, es); _pwN = n
    let pwr
    if (_pwTest==='ttest_ind')      pwr = _pwrT(_pwD,n,alpha,'ind')
    else if (_pwTest==='ttest_one') pwr = _pwrT(_pwD,n,alpha,'one')
    else if (_pwTest==='anova')     pwr = _pwrAnova(_pwF,n,_pwK,alpha)
    else if (_pwTest==='corr')      pwr = _pwrCorr(_pwR,n,alpha)
    else if (_pwTest==='chisq')     pwr = _pwrChisq(_pwW,n,_pwDF,alpha)
    else if (_pwTest==='reg')       pwr = _pwrReg(_pwF2,n,_pwK,alpha)
    const pct = (pwr*100).toFixed(1)
    const col = pwr>=0.8?'text-green-700':pwr>=0.6?'text-amber-600':'text-red-600'
    resultHTML = `<p class="text-sm text-slate-800">Achieved power: <b class="${col}">${pct}%</b> (β = ${(1-pwr).toFixed(3)})</p>`

  } else { // es
    let result, label
    if (_pwTest==='ttest_ind') {
      result = _pwSolveES(es=>_pwrT(es,n,alpha,'ind'), power)
      label  = result != null ? `Cohen's d = <b>${fmt(result)}</b>` : '> 5 (not feasible)'
    } else if (_pwTest==='ttest_one') {
      result = _pwSolveES(es=>_pwrT(es,n,alpha,'one'), power)
      label  = result != null ? `Cohen's d = <b>${fmt(result)}</b>` : '> 5 (not feasible)'
    } else if (_pwTest==='anova') {
      result = _pwSolveES(es=>_pwrAnova(es,n,_pwK,alpha), power)
      label  = result != null ? `Cohen's f = <b>${fmt(result)}</b>` : '> 5 (not feasible)'
    } else if (_pwTest==='corr') {
      result = _pwSolveES(es=>_pwrCorr(es,n,alpha), power, 0.001, 0.999)
      label  = result != null ? `Pearson r = <b>${fmt(result)}</b>` : '> 0.999 (not feasible)'
    } else if (_pwTest==='chisq') {
      result = _pwSolveES(es=>_pwrChisq(es,n,_pwDF,alpha), power)
      label  = result != null ? `Cohen's w = <b>${fmt(result)}</b>` : '> 5 (not feasible)'
    } else if (_pwTest==='reg') {
      result = _pwSolveES(es=>_pwrReg(es,n,_pwK,alpha), power)
      label  = result != null ? `Cohen's f² = <b>${fmt(result)}</b>` : '> 5 (not feasible)'
    }
    resultHTML = `<p class="text-sm text-slate-800">Minimum detectable effect: ${label}</p>`
  }

  const el = document.getElementById('pw-result')
  if (el) el.innerHTML = `
    <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
      <p class="text-xs font-semibold text-indigo-600 mb-2">Result  (α = ${alpha}, ${_pwSolveFor!=='power'?`target power = ${(power*100).toFixed(0)}%`:`n = ${n}`})</p>
      ${resultHTML}
    </div>`
}

// ── Power calculator UI ───────────────────────────────────────────────────────
function _utilRenderPower() {
  const TESTS = [
    { id:'ttest_ind', label:'t-test — 2 independent groups', esKey:'d', esLabel:"Cohen's d", bench:'0.2 small · 0.5 medium · 0.8 large' },
    { id:'ttest_one', label:'t-test — 1 sample or paired',   esKey:'d', esLabel:"Cohen's d", bench:'0.2 small · 0.5 medium · 0.8 large' },
    { id:'anova',     label:'One-way ANOVA',                  esKey:'f', esLabel:"Cohen's f", bench:'0.10 small · 0.25 medium · 0.40 large' },
    { id:'corr',      label:'Pearson r correlation',          esKey:'r', esLabel:'Pearson r',  bench:'0.10 small · 0.30 medium · 0.50 large' },
    { id:'chisq',     label:'Chi-squared test',               esKey:'w', esLabel:"Cohen's w", bench:'0.10 small · 0.30 medium · 0.50 large' },
    { id:'reg',       label:'Linear regression (F-test)',     esKey:'f2',esLabel:"Cohen's f²",bench:'0.02 small · 0.15 medium · 0.35 large' },
  ]
  const t = TESTS.find(t=>t.id===_pwTest)||TESTS[0]
  const nLabel = _pwTest==='ttest_ind' ? 'N per group' : 'N (total)'

  return `
  <div class="max-w-2xl mx-auto">
    <h3 class="text-sm font-bold text-slate-700 mb-0.5">⚡ Power Analysis (G*Power)</h3>
    <p class="text-xs text-slate-400 mb-4">Compute required N, achievable power, or minimum detectable effect.</p>

    <div class="mb-4">
      <label class="block text-xs font-medium text-slate-600 mb-1.5">Statistical test</label>
      <select onchange="_pwTest=this.value;_rerenderRTool()"
        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
        ${TESTS.map(tt=>`<option value="${tt.id}"${_pwTest===tt.id?' selected':''}>${tt.label}</option>`).join('')}
      </select>
    </div>

    <div class="mb-4">
      <label class="block text-xs font-medium text-slate-600 mb-1.5">Solve for</label>
      <div class="flex gap-2">
        ${[['n','Sample size (N)'],['power','Power (1−β)'],['es','Effect size']].map(([s,lbl])=>`
        <button onclick="_pwSolveFor='${s}';_rerenderRTool()"
          class="flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors
            ${_pwSolveFor===s?'bg-indigo-600 text-white border-indigo-600':'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}">
          ${lbl}
        </button>`).join('')}
      </div>
    </div>

    <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-3 mb-4">
      ${_pwSolveFor!=='es'?`
      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">${t.esLabel}
          <span class="text-slate-400 font-normal">(${t.bench})</span></label>
        <input id="pw-es" type="number" step="0.01" min="0.001" value="${_pwGetES(t.esKey)}"
          class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
      </div>`:''}

      <div class="flex gap-3 flex-wrap">
        <div class="flex-1" style="min-width:100px">
          <label class="block text-xs font-medium text-slate-600 mb-1">α (significance)</label>
          <select id="pw-alpha"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            ${[0.001,0.01,0.05,0.1].map(a=>`<option value="${a}"${Math.abs(_pwAlpha-a)<0.0001?' selected':''}>${a}</option>`).join('')}
          </select>
        </div>
        ${_pwSolveFor!=='power'?`
        <div class="flex-1" style="min-width:100px">
          <label class="block text-xs font-medium text-slate-600 mb-1">Power (1−β)</label>
          <select id="pw-power"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            ${[0.70,0.80,0.85,0.90,0.95,0.99].map(p=>`<option value="${p}"${Math.abs(_pwPower-p)<0.001?' selected':''}>${p}</option>`).join('')}
          </select>
        </div>`:''}
        ${_pwSolveFor!=='n'?`
        <div class="flex-1" style="min-width:100px">
          <label class="block text-xs font-medium text-slate-600 mb-1">${nLabel}</label>
          <input id="pw-n" type="number" min="2" step="1" value="${_pwN||20}"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
        </div>`:''}
        ${_pwTest==='anova'||_pwTest==='reg'?`
        <div style="width:110px">
          <label class="block text-xs font-medium text-slate-600 mb-1">${_pwTest==='anova'?'Groups (k)':'Predictors (u)'}</label>
          <input id="pw-k" type="number" min="${_pwTest==='anova'?3:1}" max="20" step="1" value="${_pwK}"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
        </div>`:''}
        ${_pwTest==='chisq'?`
        <div style="width:120px">
          <label class="block text-xs font-medium text-slate-600 mb-1">df = (r−1)(c−1)</label>
          <input id="pw-df" type="number" min="1" max="20" step="1" value="${_pwDF}"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
        </div>`:''}
      </div>
    </div>

    <button onclick="_pwCalculate()"
      class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors mb-4">
      ⚡ Calculate
    </button>

    <div id="pw-result"></div>
  </div>`
}

function _utilRenderR() {
  const TABS = [['chat','💬 Chat'],['selector','📊 Test Selector'],['power','⚡ Power']]
  const tabBar = `<div class="flex gap-1 mb-4 border-b border-slate-200 pb-0">
    ${TABS.map(([id,lbl])=>`
    <button onclick="_rTab='${id}';_rerenderRTool()"
      class="px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px
        ${_rTab===id?'border-indigo-500 text-indigo-600':'border-transparent text-slate-500 hover:text-slate-700'}">
      ${lbl}
    </button>`).join('')}
  </div>`

  if (_rTab === 'power')    return tabBar + _utilRenderPower()
  if (_rTab !== 'selector') return tabBar + _utilRenderChat()

  const node     = _rGetCurrentNode()
  const isResult = _rResult !== null
  const rResult  = isResult ? R_RESULTS[_rResult] : null
  const langRes  = isResult
    ? (_rLang==='python' ? PYTHON_RESULTS[_rResult] : _rLang==='spss' ? SPSS_RESULTS[_rResult] : rResult)
    : null
  const langPkg  = langRes?.pkg || rResult?.pkg || ''
  const codeText = langRes?.code || ''

  const LANGS = [['r','R'],['python','Python'],['spss','SPSS']]
  const langBar = `<div class="flex gap-1">
    ${LANGS.map(([id,lbl])=>`
    <button onclick="_rLang='${id}';_rerenderRTool()"
      class="px-2.5 py-1 rounded text-xs font-medium transition-colors
        ${_rLang===id?'bg-indigo-600 text-white':'bg-slate-100 text-slate-500 hover:bg-slate-200'}">
      ${lbl}
    </button>`).join('')}
  </div>`

  const placeholder = `<span class="text-slate-500"># Answer the questions on the left to get the code.\n\n# Covers: t-tests · ANOVA · Kruskal-Wallis · regression\n# correlation · chi-squared · Fisher · PCA\n# survival analysis · mixed effects · and more.</span>`

  return tabBar + `
  <div class="max-w-5xl mx-auto">
    <div class="grid grid-cols-5 gap-6">

      <!-- Decision tree (left) -->
      <div class="col-span-2">
        <!-- Breadcrumb -->
        ${_rStep.length > 0 ? `
        <div class="mb-3 space-y-1">
          ${_rStep.map(s=>`
          <div class="text-xs text-slate-400">
            <span class="text-slate-500">${esc(s.q.length>48?s.q.slice(0,45)+'…':s.q)}</span><br/>
            <span class="font-medium text-indigo-600">→ ${esc(s.a)}</span>
          </div>`).join('')}
        </div>
        <button onclick="_rStep=[];_rResult=null;_rerenderRTool()"
          class="text-xs text-slate-400 hover:text-slate-600 mb-3">↩ Start over</button>
        ` : ''}

        <!-- Current question or result -->
        ${isResult && rResult ? `
        <div class="bg-green-50 border border-green-200 rounded-xl p-4">
          <p class="text-xs font-semibold text-green-700 mb-1">✓ Recommended test:</p>
          <p class="text-sm font-bold text-green-900">${rResult.name}</p>
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

      <!-- Code panel (right) -->
      <div class="col-span-3">
        <div class="flex items-center justify-between mb-2">
          ${langBar}
          ${rResult ? `<button onclick="rCopyCode()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg transition-colors">📋 Copy</button>` : '<div></div>'}
        </div>
        ${langPkg ? `<p class="text-xs text-slate-400 mb-1.5">Package: ${esc(langPkg)}</p>` : ''}
        <div class="bg-slate-900 rounded-xl p-4 overflow-auto" style="max-height:440px">
          <pre id="r-code-block" class="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre">${
            rResult ? esc(codeText) : placeholder
          }</pre>
        </div>
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

// ══ Stats Chat Assistant ══════════════════════════════════════════════════════

function _STATS_SYS(lang) {
  const L = lang==='python' ? 'Python (scipy, statsmodels, pingouin, matplotlib)'
          : lang==='spss'   ? 'SPSS syntax'
          : 'R (base R + tidyverse/ggplot2 where appropriate)'
  return `You are Dr. Stats, an expert biostatistician with broad experience across medicine, psychology, social sciences, biology, and engineering. You help researchers choose the right statistical test and plan well-powered studies.

## Your approach
- Ask ONE OR TWO targeted clarifying questions at a time — never fire a long list at once
- Be conversational but precise; explain your reasoning in plain language
- Once you have enough information, commit to a specific recommendation

## Information you need to gather
1. Research question + outcome variable type (continuous, binary, ordinal, count, time-to-event)
2. Number of groups / conditions and whether they are independent or paired / repeated-measures
3. Any covariates or confounders to adjust for
4. Expected or minimum meaningful effect size — or use "medium" if unknown
5. Desired significance level α (default 0.05) and power 1−β (default 80%)

## When you have enough information, provide
1. **Recommended test** — name it and give 1–2 sentences justifying the choice
2. **Required sample size** — give a concrete number with brief reasoning, e.g. "d = 0.5, α = 0.05, 80% power → 64 per group"
3. **Key assumptions** to verify before running the analysis
4. **Ready-to-run code** in ${L} — always in a fenced code block with the language tag

## Reference sample sizes (two-tailed, α = 0.05, 80% power)
| Test | Effect | N per group or total |
|---|---|---|
| Independent t-test | d = 0.2 / 0.5 / 0.8 | 394 / 64 / 26 per group |
| Paired t-test | d = 0.2 / 0.5 / 0.8 | 198 / 34 / 15 pairs |
| One-way ANOVA (3 groups) | f = 0.1 / 0.25 / 0.4 | 322 / 52 / 21 per group |
| Pearson r | r = 0.1 / 0.3 / 0.5 | 781 / 84 / 28 total |
| Chi-squared (df = 1) | w = 0.1 / 0.3 / 0.5 | 785 / 88 / 32 total |

If the researcher does not know the expected effect size, help them estimate from the literature, from the minimum clinically / practically meaningful difference in their field, or default to "medium."

Use **bold** for key terms, \`backticks\` for variable names, and fenced code blocks for runnable code. Be concise — bullet points and short paragraphs over walls of text.`
}

function _statsGreeting() {
  const L = _statsChatLang==='python'?'Python':_statsChatLang==='spss'?'SPSS':'R'
  return `Hello! I'm **Dr. Stats**, your personal statistician.\n\nTell me about your study and I'll help you:\n- Choose the right statistical test for your design\n- Plan your sample size with proper power analysis\n- Identify assumptions to verify before the analysis\n- Write ready-to-run **${L}** code\n\nWhat's your research question?`
}

function _statsRenderMD(text) {
  if (!text) return ''
  try {
    if (typeof marked !== 'undefined') {
      const r = new marked.Renderer()
      r.code      = (code, lang) => `<pre class="bg-slate-900 text-slate-200 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono leading-relaxed"><code>${code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></pre>`
      r.codespan  = c => `<code class="bg-slate-100 text-indigo-700 rounded px-1 py-0.5 text-xs font-mono">${c}</code>`
      r.heading   = (t) => `<p class="font-semibold text-slate-800 mt-3 mb-1">${t}</p>`
      r.paragraph = t => `<p class="mb-2 last:mb-0 leading-relaxed">${t}</p>`
      r.list      = (body, ordered) => ordered
        ? `<ol class="list-decimal ml-5 mb-2 space-y-0.5">${body}</ol>`
        : `<ul class="list-disc ml-5 mb-2 space-y-0.5">${body}</ul>`
      r.listitem  = t => `<li>${t}</li>`
      r.strong    = t => `<strong class="font-semibold text-slate-800">${t}</strong>`
      r.em        = t => `<em class="italic">${t}</em>`
      r.blockquote= t => `<blockquote class="border-l-2 border-indigo-300 pl-3 text-slate-500 italic my-2">${t}</blockquote>`
      r.hr        = () => `<hr class="border-slate-200 my-3"/>`
      r.table     = (header, body) => `<div class="overflow-x-auto my-2"><table class="text-xs border-collapse w-full">${header}${body}</table></div>`
      r.tablerow  = c => `<tr class="border-b border-slate-200">${c}</tr>`
      r.tablecell = (c, {header}) => header
        ? `<th class="text-left px-2 py-1 font-semibold bg-slate-50">${c}</th>`
        : `<td class="px-2 py-1">${c}</td>`
      const parseFn = typeof marked.parse === 'function' ? marked.parse.bind(marked) : marked
      return parseFn(text, { renderer: r })
    }
  } catch(e) {}
  return esc(text).replace(/\n/g,'<br/>')
}

function _statsRenderMsgs() {
  const msgs = [{ role:'assistant', content: _statsGreeting() }, ..._statsChatHistory]
  if (_statsChatLoading) msgs.push({ role:'assistant', loading: true })
  return msgs.map(m => {
    if (m.role === 'user') return `
      <div class="flex justify-end">
        <div class="max-w-sm bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed" style="white-space:pre-wrap">${esc(m.content)}</div>
      </div>`
    return `
      <div class="flex gap-2.5 items-start">
        <div class="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-xs mt-0.5">🎓</div>
        <div class="flex-1 bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-700 min-w-0" style="overflow-wrap:break-word">
          ${m.loading
            ? `<span class="text-slate-400 italic text-xs">Dr. Stats is thinking…</span>`
            : _statsRenderMD(m.content)}
        </div>
      </div>`
  }).join('')
}

function _utilRenderChat() {
  const hasAI = typeof _aiAvailable === 'function' ? _aiAvailable() : false
  return `
  <div class="max-w-3xl mx-auto flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-400">Code:</span>
        ${[['r','R'],['python','Python'],['spss','SPSS']].map(([id,lbl])=>`
        <button onclick="_statsChatLang='${id}';_rerenderRTool()"
          class="px-2.5 py-1 rounded text-xs font-medium transition-colors
            ${_statsChatLang===id?'bg-indigo-600 text-white':'bg-slate-100 text-slate-500 hover:bg-slate-200'}">
          ${lbl}
        </button>`).join('')}
      </div>
      <button onclick="_statsNewConv()"
        class="text-xs text-slate-400 hover:text-slate-600 transition-colors">
        ↺ New conversation
      </button>
    </div>

    <div id="stats-chat-msgs" class="space-y-3 overflow-y-auto pr-1"
         style="height:min(calc(100vh - 340px),500px);min-height:280px">
      ${_statsRenderMsgs()}
    </div>

    ${hasAI ? `
    <div class="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
      <textarea id="stats-chat-inp" rows="3"
        placeholder="Describe your study design, research question, or ask anything about statistics…"
        onkeydown="if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){_statsSend();event.preventDefault()}"
        class="w-full px-4 pt-3 pb-1 text-sm text-slate-700 resize-none focus:outline-none placeholder:text-slate-300"></textarea>
      <div class="flex items-center justify-between px-3 pb-2.5 pt-1">
        <span class="text-xs text-slate-300">Ctrl+Enter to send</span>
        <button id="stats-send-btn" onclick="_statsSend()"
          class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
          Send →
        </button>
      </div>
    </div>
    ` : `
    <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
      <strong>Odysseus AI required.</strong> Start Odysseus in Settings → AI to enable the chat assistant.
    </div>
    `}
  </div>`
}

async function _statsSend() {
  const inp  = document.getElementById('stats-chat-inp')
  const text = inp?.value?.trim()
  if (!text || _statsChatLoading) return
  if (typeof _aiAvailable === 'function' && !_aiAvailable()) {
    showToast('Start Odysseus in Settings to use AI chat', 'error'); return
  }

  _statsChatHistory.push({ role: 'user', content: text })
  if (inp) inp.value = ''
  _statsChatLoading = true

  // Partial update — refresh messages only, preserves the textarea
  const msgEl = document.getElementById('stats-chat-msgs')
  if (msgEl) { msgEl.innerHTML = _statsRenderMsgs(); _statsScrollEnd() }
  const btn = document.getElementById('stats-send-btn')
  if (btn) { btn.disabled = true; btn.textContent = '…' }

  try {
    const messages = [
      { role: 'system', content: _STATS_SYS(_statsChatLang) },
      ..._statsChatHistory
    ]
    const res = await api.odysseusChat({ messages })
    const reply = res?.response || res?.content || res?.message || '⚠️ No response received.'
    _statsChatHistory.push({ role: 'assistant', content: reply })
  } catch(e) {
    _statsChatHistory.push({ role: 'assistant', content: '⚠️ Connection error — please try again.' })
  }

  _statsChatLoading = false

  const msgEl2 = document.getElementById('stats-chat-msgs')
  if (msgEl2) { msgEl2.innerHTML = _statsRenderMsgs(); _statsScrollEnd() }
  const btn2 = document.getElementById('stats-send-btn')
  if (btn2) { btn2.disabled = false; btn2.textContent = 'Send →' }
}

function _statsScrollEnd() {
  setTimeout(() => {
    const el = document.getElementById('stats-chat-msgs')
    if (el) el.scrollTop = el.scrollHeight
  }, 30)
}

function _statsNewConv() {
  _statsChatHistory = []
  _statsChatLoading = false
  _rerenderRTool()
}
