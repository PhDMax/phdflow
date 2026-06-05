// ══ Whiteboard v2 ══════════════════════════════════════════════════════════════

// ── State ─────────────────────────────────────────────────────────────────────

let _wbTplPanel    = false
let _wbTplTab      = 'graph'   // 'graph' | 'figure' | 'saved'
let _wb            = null
let _wbTool        = 'select'
let _wbColor       = '#1e293b'
let _wbSW          = 2
let _wbFill        = false
let _wbFillClr     = '#93c5fd'
let _wbFontSize    = 14
let _wbSmartOn     = true
let _wbUndo        = []
let _wbRedo        = []
let _wbDrawing     = false
let _wbPts         = []
let _wbDragStart   = null
let _wbSelId       = null
let _wbSelIds      = []         // multi-select set
let _wbSelRect     = null       // { x,y,w,h } drag-selection in progress (world coords)
let _wbCanvas      = null
let _wbCtx         = null
let _wbBg          = 'dots'
let _wbResizeObs   = null
let _wbResizing    = null   // { handle:0-7, startPt:{x,y}, origShape:{...} }
let _wbKeysAdded   = false
let _wbPasteAdded  = false
let _wbSpaceHeld   = false

// ── Viewport (zoom + pan) ─────────────────────────────────────────────────────
let _wbZoom        = 1          // scale factor
let _wbPanX        = 0          // canvas-space offset X
let _wbPanY        = 0          // canvas-space offset Y
let _wbPanning     = false      // space+drag pan in progress
let _wbPanStart    = null       // { x, y, panX, panY }

const WB_ZOOM_MIN  = 0.15
const WB_ZOOM_MAX  = 8

const WB_HR = 6   // handle hit radius px

const WB_PALETTE = [
  '#1e293b','#ef4444','#f97316','#eab308',
  '#22c55e','#06b6d4','#6366f1','#a855f7',
  '#ec4899','#94a3b8','#78350f','#ffffff',
]

const WB_TOOLS = [
  { id:'select',  icon:'↖',  title:'Select & Move  V' },
  { id:'pen',     icon:'✎',  title:'Freehand Pen  P' },
  { id:'smart',   icon:'✦',  title:'Smart Pen (auto-shapes)  S' },
  { id:'line',    icon:'╲',  title:'Straight Line  L' },
  { id:'arrow',   icon:'→',  title:'Arrow  A' },
  { id:'rect',    icon:'▭',  title:'Rectangle  R' },
  { id:'circle',  icon:'○',  title:'Ellipse  E' },
  { id:'diamond', icon:'◇',  title:'Diamond  D' },
  { id:'triangle',icon:'△',  title:'Triangle  G' },
  { id:'sticky',  icon:'🗒', title:'Sticky Note  N' },
  { id:'text',    icon:'T',  title:'Text  T' },
  { id:'erase',   icon:'◯',  title:'Rubber / Eraser  X' },
]

const WB_STICKY_COLORS = [
  '#fef08a', // yellow
  '#86efac', // green
  '#93c5fd', // blue
  '#fca5a5', // red/pink
  '#c4b5fd', // purple
  '#fdba74', // orange
  '#f9a8d4', // pink
  '#e2e8f0', // grey
]

const WB_BG = {
  white: 'background:#fff',
  dots:  'background:#f8fafc;background-image:radial-gradient(circle,#cbd5e1 1px,transparent 1px);background-size:24px 24px',
  grid:  'background:#f8fafc;background-image:linear-gradient(#e2e8f0 1px,transparent 1px),linear-gradient(90deg,#e2e8f0 1px,transparent 1px);background-size:24px 24px',
}

const WB_RESIZABLE = ['rect','ellipse','diamond','sticky','triangle','image']

// ── Render ────────────────────────────────────────────────────────────────────

function render_whiteboard() {
  const vc = document.getElementById('view-content')
  if (!vc) return

  const boards = state.whiteboards || []
  if (!_wb && boards.length > 0) _wb = boards[0]

  vc.innerHTML = `
  <div class="flex flex-col h-full overflow-hidden">

    <!-- Board tabs -->
    <div class="bg-white border-b border-slate-200 px-4 py-1.5 flex items-center gap-1.5 flex-shrink-0 overflow-x-auto">
      ${boards.length === 0
        ? '<span class="text-xs text-slate-400 italic">No boards yet</span>'
        : boards.map(b => `
          <button onclick="wbLoadBoard('${b.id}')"
            class="px-3 py-1 rounded-lg text-xs font-medium transition-colors flex-shrink-0
              ${_wb?.id===b.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
            ${esc(b.name)}
          </button>`).join('')}
      <button onclick="wbNewBoard()"
        class="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 transition-colors flex-shrink-0 ml-1">
        + Board
      </button>
      ${_wb ? `
      <div class="ml-auto flex items-center gap-2 flex-shrink-0">
        ${(() => {
          const proj = _wb.projectId ? (state.projects||[]).find(p => p.id === _wb.projectId) : null
          return proj
            ? `<span class="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                📋 ${esc(proj.name)}
                <button onclick="wbUnlinkProject()" class="ml-0.5 hover:text-rose-500 leading-none" title="Unlink">✕</button>
               </span>`
            : `<button onclick="wbLinkProject()" class="text-xs text-slate-400 hover:text-indigo-600 transition-colors" title="Link to project">📋 Link</button>`
        })()}
        <button onclick="wbRenameBoard()" class="text-xs text-slate-400 hover:text-slate-600">Rename</button>
        <button onclick="wbDeleteBoard()" class="text-xs text-red-400 hover:text-red-600">Delete</button>
      </div>` : ''}
    </div>

    ${_wb ? `
    <!-- Drawing Toolbar -->
    <div class="bg-white border-b border-slate-200 px-2 py-1 flex items-center gap-px flex-shrink-0 overflow-x-auto">

      <!-- Tools -->
      ${WB_TOOLS.map(t => `
      <button data-wb-tool="${t.id}" onclick="wbSetTool('${t.id}')" title="${t.title}"
        class="w-8 h-8 flex items-center justify-center rounded text-sm transition-colors flex-shrink-0
          ${_wbTool===t.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}">
        ${t.icon}
      </button>`).join('')}

      <div class="w-px h-5 bg-slate-200 mx-1.5 flex-shrink-0"></div>

      <!-- Stroke colours (palette + custom picker) -->
      <div class="flex items-center gap-0.5 flex-shrink-0">
        ${WB_PALETTE.map(c => `
        <button data-wb-color="${c}" onclick="wbSetColor('${c}')" title="${c}"
          style="background:${c};outline:${_wbColor===c ? '2px solid #6366f1' : (c==='#ffffff'?'1px solid #e2e8f0':'none')};outline-offset:1px"
          class="w-5 h-5 rounded-full flex-shrink-0 transition-transform hover:scale-110"></button>`).join('')}
        <input type="color" id="wb-stroke-clr-inp" value="${_wbColor}"
          oninput="wbSetColor(this.value)"
          title="Custom stroke colour"
          style="width:20px;height:20px;border-radius:50%;border:1px solid #e2e8f0;
            padding:1px;appearance:none;-webkit-appearance:none;margin-left:2px">
      </div>

      <div class="w-px h-5 bg-slate-200 mx-1.5 flex-shrink-0"></div>

      <!-- Stroke width — numerical input -->
      <div class="flex items-center gap-1 flex-shrink-0">
        <span class="text-[10px] text-slate-400">px</span>
        <input type="number" min="1" max="40" step="1" value="${_wbSW}"
          oninput="wbSetSW(Math.max(1,Math.min(40,+this.value||1)))"
          title="Stroke width in pixels"
          class="w-12 h-7 text-xs text-center rounded-lg border border-slate-200
            focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-slate-700"/>
      </div>

      <div class="w-px h-5 bg-slate-200 mx-1.5 flex-shrink-0"></div>

      <!-- Fill toggle + fill colour picker -->
      <button id="wb-fill-btn" onclick="wbToggleFill()" title="Toggle fill (shapes only)"
        class="px-2 h-8 rounded text-xs font-medium transition-colors flex-shrink-0
          ${_wbFill ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}">
        ${_wbFill ? '◼ Fill' : '◻ Fill'}
      </button>
      <input type="color" id="wb-fill-clr-inp" value="${_wbFillClr}"
        oninput="wbSetFillColor(this.value)"
        title="Fill colour"
        style="width:24px;height:24px;border-radius:6px;border:2px solid #e2e8f0;
          padding:1px;appearance:none;-webkit-appearance:none;margin-left:2px;flex-shrink:0">

      <div class="w-px h-5 bg-slate-200 mx-1.5 flex-shrink-0"></div>

      <!-- Font size — numerical input -->
      <div class="flex items-center gap-1 flex-shrink-0">
        <span class="text-[10px] text-slate-400">T</span>
        <input type="number" min="8" max="96" step="1" value="${_wbFontSize}"
          oninput="wbSetFontSize(Math.max(8,Math.min(96,+this.value||14)))"
          title="Font size in pixels"
          class="w-12 h-7 text-xs text-center rounded-lg border border-slate-200
            focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-slate-700"/>
      </div>

      <div class="w-px h-5 bg-slate-200 mx-1.5 flex-shrink-0"></div>

      <!-- Background -->
      <select id="wb-bg-select" onchange="wbSetBg(this.value)"
        class="text-xs border border-slate-200 rounded-lg px-2 h-8 bg-white text-slate-600 focus:outline-none flex-shrink-0">
        <option value="white" ${_wbBg==='white'?'selected':''}>White</option>
        <option value="dots"  ${_wbBg==='dots' ?'selected':''}>Dots</option>
        <option value="grid"  ${_wbBg==='grid' ?'selected':''}>Grid</option>
      </select>

      <!-- Smart toggle -->
      <button id="wb-smart-btn" onclick="wbToggleSmart()" title="Smart shape recognition"
        class="px-2 h-8 rounded text-xs font-medium transition-colors flex-shrink-0 ml-1
          ${_wbSmartOn ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:bg-slate-100'}">
        ✦ Smart
      </button>

      <!-- Templates button -->
      <button onclick="wbToggleTplPanel()" title="Insert a graph or figure template"
        class="px-2 h-8 rounded text-xs font-medium transition-colors flex-shrink-0 ml-1
          ${_wbTplPanel ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-100'}">
        📐 Templates
      </button>
      <!-- Quick chart insert -->
      <button onclick="wbInsertChart('bar')"   title="Insert data bar chart"  class="w-8 h-8 flex items-center justify-center rounded text-sm text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0">📊</button>
      <button onclick="wbInsertChart('line')"  title="Insert data line chart" class="w-8 h-8 flex items-center justify-center rounded text-sm text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0">📈</button>
      <button onclick="wbInsertChart('pie')"   title="Insert data pie chart"  class="w-8 h-8 flex items-center justify-center rounded text-sm text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0">🥧</button>

      <div class="ml-auto flex items-center gap-1 flex-shrink-0 pl-2">
        <button onclick="wbUndo()" title="Undo Ctrl+Z" class="w-8 h-8 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 transition-colors">↩</button>
        <button onclick="wbRedo()" title="Redo Ctrl+Y" class="w-8 h-8 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 transition-colors">↪</button>
        <div class="w-px h-5 bg-slate-200 mx-0.5"></div>
        <button onclick="wbZoomOut()" title="Zoom out  -" class="w-8 h-8 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 transition-colors text-base font-bold">−</button>
        <button id="wb-zoom-label" onclick="wbZoomReset()" title="Reset zoom  0"
          class="px-2 h-8 rounded text-xs text-slate-500 hover:bg-slate-100 transition-colors tabular-nums min-w-[44px] text-center">
          ${Math.round(_wbZoom*100)}%
        </button>
        <button onclick="wbZoomIn()" title="Zoom in  +" class="w-8 h-8 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 transition-colors text-base font-bold">+</button>
        <div class="w-px h-5 bg-slate-200 mx-0.5"></div>
        <button onclick="wbClear()" class="px-2.5 h-8 rounded text-xs text-red-400 hover:bg-red-50 transition-colors">Clear</button>
        <button onclick="wbExportPng()" class="px-2.5 h-8 rounded text-xs bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 font-medium transition-colors">PNG</button>
        <button onclick="openPhDFlowFolder('Whiteboard')" title="Open Whiteboard folder" class="px-2 h-8 rounded text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">📁</button>
      </div>
    </div>

    <!-- Selection property bar (visible when a shape is selected) -->
    <div id="wb-sel-bar" class="hidden bg-indigo-50 border-b border-indigo-100 px-3 py-1 flex items-center gap-3 flex-shrink-0 text-xs">
      <span class="text-indigo-600 font-semibold">Selected:</span>
      <!-- Sticky colour swatches (only for sticky type) -->
      <div id="wb-sel-sticky-colors" class="hidden flex items-center gap-0.5">
        ${WB_STICKY_COLORS.map(c=>`
        <button onclick="wbSelSetFill('${c}')"
          style="background:${c};width:18px;height:18px;border-radius:4px;border:1px solid rgba(0,0,0,.1);cursor:pointer;flex-shrink:0"
          title="${c}"></button>`).join('')}
      </div>
      <!-- Stroke + fill for other shapes -->
      <div id="wb-sel-shape-props" class="flex items-center gap-3">
        <label class="flex items-center gap-1 text-slate-600">Stroke
          <input type="color" id="wb-sel-stroke" oninput="wbSelSetStroke(this.value)"
            style="width:20px;height:20px;border-radius:4px;border:1px solid #c7d2fe;padding:1px;
              appearance:none;-webkit-appearance:none;cursor:pointer;margin-left:2px">
        </label>
        <label class="flex items-center gap-1 text-slate-600">
          <input type="checkbox" id="wb-sel-fill-on" onchange="wbSelToggleFill(this.checked)"
            class="accent-indigo-600"> Fill
          <input type="color" id="wb-sel-fill-clr" oninput="wbSelSetFill(this.value)"
            style="width:20px;height:20px;border-radius:4px;border:1px solid #c7d2fe;padding:1px;
              appearance:none;-webkit-appearance:none;cursor:pointer;margin-left:2px">
        </label>
        <label class="flex items-center gap-1 text-slate-600">Width
          ${[[1,'—'],[2,'━'],[5,'▬']].map(([w,icon])=>`
          <button onclick="wbSelSetSW(${w})" id="wb-sel-sw-${w}"
            class="px-1.5 py-0.5 rounded text-xs font-bold transition-colors
              hover:bg-indigo-100 hover:text-indigo-700 text-slate-500">${icon}</button>`).join('')}
        </label>
      </div>
      <div class="w-px h-4 bg-indigo-200"></div>
      <button onclick="wbSelZOrder('front')" title="Bring to front" class="text-slate-500 hover:text-indigo-700 font-medium">↑ Front</button>
      <button onclick="wbSelZOrder('back')"  title="Send to back"  class="text-slate-500 hover:text-indigo-700 font-medium">↓ Back</button>
      <button onclick="wbSelDuplicate()" class="text-indigo-600 hover:text-indigo-800 font-medium">⎘ Duplicate</button>
      <button onclick="_wbDeleteSelected()" class="text-rose-500 hover:text-rose-700 font-medium ml-1">✕ Delete</button>
      <!-- Chart-specific controls -->
      <div id="wb-sel-chart-btns" class="hidden items-center gap-2 ml-1">
        <div class="w-px h-4 bg-indigo-200"></div>
        <button onclick="wbEditChartData(_wbSelId)" class="px-2 py-0.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors">📊 Edit Data</button>
        <button onclick="wbImportChartFile(_wbSelId)" class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs hover:bg-slate-200 transition-colors">📂 Import File</button>
        <span id="wb-sel-chart-source" class="text-[10px] text-slate-400 truncate max-w-[140px]"></span>
      </div>
    </div>

    <!-- Canvas row: template panel + canvas -->
    <div class="flex flex-1 overflow-hidden">
    <!-- Template panel (side drawer) -->
    <div id="wb-tpl-panel" class="${_wbTplPanel ? 'flex' : 'hidden'} flex-col border-r border-slate-200 bg-white flex-shrink-0 overflow-hidden" style="width:260px">
      <div class="flex items-center gap-px border-b border-slate-100 px-2 py-1.5 flex-shrink-0">
        ${['graph','figure','saved'].map(t=>`
        <button onclick="wbTplTab('${t}')" class="px-2.5 py-1 rounded text-xs font-semibold transition-colors flex-shrink-0
          ${_wbTplTab===t?'bg-indigo-100 text-indigo-700':'text-slate-400 hover:bg-slate-100'}">
          ${t==='graph'?'📊 Graphs':t==='figure'?'🔷 Figures':'💾 Saved'}
        </button>`).join('')}
        ${_wbTplTab==='saved'?`<button onclick="wbSaveAsTemplate()" title="Save selected shapes as template"
          class="ml-auto text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex-shrink-0">
          + Save selection
        </button>`:''}
      </div>
      <div id="wb-tpl-list" class="flex-1 overflow-y-auto p-2">
        <div class="grid grid-cols-2 gap-1.5">
          ${_wbTplItems().map(t=>`
          <button onclick="wbInsertTemplate('${t.id}')" title="Insert ${t.name}"
            class="flex flex-col items-center gap-1 p-2 rounded-xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-center">
            <span style="font-size:1.5rem;line-height:1">${t.icon}</span>
            <span class="text-[10px] text-slate-600 leading-tight font-medium">${t.name}</span>
          </button>`).join('')}
          ${_wbTplTab==='saved' && !_wbTplItems().length?`
          <div class="col-span-2 py-6 text-center text-slate-400 text-xs">
            No saved templates yet.<br/>Select shapes, then click "+ Save selection".
          </div>`:'' }
        </div>
      </div>
    </div>

    <!-- Canvas area -->
    <div id="wb-container" class="flex-1 relative overflow-hidden select-none" style="${WB_BG[_wbBg]||WB_BG.dots}">
      <canvas id="wb-canvas" class="absolute inset-0"
        style="cursor:${_wbTool==='text'?'text':_wbTool==='select'?'default':_wbTool==='erase'?'none':'crosshair'}"></canvas>
      <div id="wb-hint" class="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-slate-400 pointer-events-none select-none">
        Double-click a shape to label it · G=triangle · Del=delete · press <kbd style="background:#1e293b;border:1px solid #334155;padding:0 3px;border-radius:3px">?</kbd> for all shortcuts
      </div>
    </div>
    </div><!-- end canvas row -->
    ` : `
    <div class="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div class="text-5xl mb-4">🎨</div>
      <p class="text-slate-600 font-semibold mb-2">Create a whiteboard</p>
      <p class="text-slate-400 text-sm mb-5 max-w-sm">Draw shapes and add labels by double-clicking. Smart Pen auto-converts sketches to clean shapes.</p>
      <button onclick="wbNewBoard()" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">+ New Board</button>
    </div>
    `}

  </div>`

  if (_wb) {
    requestAnimationFrame(() => {
      _wbInitCanvas()
      _wbBindKeys()
    })
  }
}

// Image shape renderer (cached so we don't reload the data URL on every frame)
const _wbImgCache = {}

function _wbGetImg(dataUrl) {
  if (_wbImgCache[dataUrl]) return _wbImgCache[dataUrl]
  const img = new Image()
  img.src = dataUrl
  _wbImgCache[dataUrl] = img
  return img
}

// ── Canvas Initialisation ─────────────────────────────────────────────────────

function _wbInitCanvas(retry) {
  const canvas = document.getElementById('wb-canvas')
  const container = document.getElementById('wb-container')
  if (!canvas || !container) return

  const dpr = window.devicePixelRatio || 1
  const w = container.clientWidth
  const h = container.clientHeight

  if ((!w || !h) && (retry||0) < 6) { setTimeout(() => _wbInitCanvas((retry||0)+1), 50); return }
  if (!w || !h) return

  canvas.width  = w * dpr
  canvas.height = h * dpr
  canvas.style.width  = w + 'px'
  canvas.style.height = h + 'px'
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  _wbCanvas = canvas
  _wbCtx    = ctx
  _wbRender()
  _wbBindCanvas()

  if (_wbResizeObs) _wbResizeObs.disconnect()
  _wbResizeObs = new ResizeObserver(() => {
    if (document.getElementById('wb-canvas') === _wbCanvas) _wbInitCanvas()
  })
  _wbResizeObs.observe(container)
}

// ── Keyboard ──────────────────────────────────────────────────────────────────

function _wbBindKeys() {
  if (_wbKeysAdded) return
  _wbKeysAdded = true

  document.addEventListener('keydown', e => {
    if (!_wb || state.currentView !== 'whiteboard') return
    const tag = document.activeElement?.tagName
    const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.contentEditable === 'true'

    // Space pan — only active when whiteboard is the current view
    if (e.key === ' ' && !inInput) {
      e.preventDefault()
      if (!_wbSpaceHeld) {
        _wbSpaceHeld = true
        if (_wbCanvas && !_wbDrawing) _wbCanvas.style.cursor = 'grab'
      }
      return
    }

    if (inInput) return

    if ((e.ctrlKey||e.metaKey) && e.key==='z') { e.preventDefault(); wbUndo(); return }
    if ((e.ctrlKey||e.metaKey) && (e.key==='y'||(e.shiftKey&&e.key==='z'))) { e.preventDefault(); wbRedo(); return }
    if ((e.ctrlKey||e.metaKey) && e.key==='d') { e.preventDefault(); wbSelDuplicate(); return }
    if ((e.ctrlKey||e.metaKey) && e.key==='a') {
      e.preventDefault()
      _wbSelIds = (_wb.shapes||[]).map(s=>s.id)
      _wbSelId  = _wbSelIds[_wbSelIds.length-1] || null
      _wbRender(); return
    }
    if (e.key==='Delete'||e.key==='Backspace') { if (_wbSelId) { e.preventDefault(); _wbDeleteSelected() }; return }
    if (e.key==='Escape') { _wbSelId=null; _wbRender(); return }
    if (e.key==='+' || e.key==='=') { e.preventDefault(); wbZoomIn(); return }
    if (e.key==='-') { e.preventDefault(); wbZoomOut(); return }
    if (e.key==='0') { e.preventDefault(); wbZoomReset(); return }

    const toolKeys = { v:'select',p:'pen',s:'smart',l:'line',a:'arrow',r:'rect',e:'circle',d:'diamond',g:'triangle',n:'sticky',t:'text',x:'erase' }
    if (toolKeys[e.key.toLowerCase()]) { wbSetTool(toolKeys[e.key.toLowerCase()]); return }
  })

  document.addEventListener('keyup', e => {
    if (e.key === ' ') {
      _wbSpaceHeld = false
      if (state.currentView === 'whiteboard' && _wbCanvas && !_wbDrawing && !_wbPanning)
        _wbCanvas.style.cursor = _wbTool === 'select' ? 'default' : 'crosshair'
    }
  })
}

// ── Pointer helpers — maps screen coords to canvas-world coords ───────────────

function _wbPt(e) {
  const rect = _wbCanvas.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  return { x: (sx - _wbPanX) / _wbZoom, y: (sy - _wbPanY) / _wbZoom }
}

// Screen coords (no world transform) — used for pan drag tracking
function _wbPtScreen(e) {
  const rect = _wbCanvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

// ── Canvas Events ─────────────────────────────────────────────────────────────

function _wbBindCanvas() {
  if (!_wbCanvas) return
  _wbCanvas.onmousedown  = _wbDown
  _wbCanvas.onmousemove  = _wbMove
  _wbCanvas.onmouseup    = _wbUp
  _wbCanvas.onmouseleave = e => {
    if (_wbPanning) { _wbPanning = false; _wbPanStart = null; _wbCanvas.style.cursor = _wbTool === 'select' ? 'default' : 'crosshair' }
    if (_wbDrawing || _wbDragStart || _wbResizing) _wbUp(e)
  }
  _wbCanvas.ondblclick   = _wbDblClick

  // Image drag-drop
  const container = document.getElementById('wb-container')
  if (container) {
    container.ondragover = e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }
    container.ondrop     = e => {
      e.preventDefault()
      const file = [...e.dataTransfer.files].find(f => f.type.startsWith('image/'))
      if (file) {
        const rect = _wbCanvas.getBoundingClientRect()
        const sx = e.clientX - rect.left
        const sy = e.clientY - rect.top
        _wbInsertImageFile(file, sx, sy)
      }
    }
  }

  // Paste image from clipboard — registered once only to prevent escalation
  if (!_wbPasteAdded) {
    _wbPasteAdded = true
    document.addEventListener('paste', e => {
      if (!_wb || state.currentView !== 'whiteboard') return
      const item = [...(e.clipboardData?.items||[])].find(i => i.type.startsWith('image/'))
      if (item) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) _wbInsertImageFile(file, 80, 80)
      }
    })
  }

  // Scroll-wheel zoom
  _wbCanvas.onwheel = e => {
    e.preventDefault()
    const rect  = _wbCanvas.getBoundingClientRect()
    const sx    = e.clientX - rect.left   // screen pivot
    const sy    = e.clientY - rect.top
    const delta = e.deltaY > 0 ? 0.9 : 1 / 0.9
    const newZ  = Math.min(WB_ZOOM_MAX, Math.max(WB_ZOOM_MIN, _wbZoom * delta))
    // Keep the point under the cursor fixed in world space
    _wbPanX = sx - (sx - _wbPanX) * (newZ / _wbZoom)
    _wbPanY = sy - (sy - _wbPanY) * (newZ / _wbZoom)
    _wbZoom = newZ
    _wbRender()
    _wbUpdateZoomLabel()
  }
}

// ── Mouse Down ────────────────────────────────────────────────────────────────

function _wbDown(e) {
  // Allow middle-mouse (button 1) through for panning; block right-click (button 2+)
  if (e.button > 1) return

  // Middle-mouse drag or Space+drag → pan
  if (_wbSpaceHeld || e.button === 1) {
    _wbPanning  = true
    _wbPanStart = { x: e.clientX, y: e.clientY, panX: _wbPanX, panY: _wbPanY }
    _wbCanvas.style.cursor = 'grabbing'
    return
  }

  const pt = _wbPt(e)

  if (_wbTool === 'text') { _wbPlaceText(pt.x, pt.y); return }

  if (_wbTool === 'select') {
    // Check resize handles on single-selected resizable shape
    if (_wbSelId && _wbSelIds.length <= 1) {
      const sel = (_wb.shapes||[]).find(s => s.id === _wbSelId)
      if (sel && WB_RESIZABLE.includes(sel.type)) {
        const handles = _wbGetHandles(sel)
        for (let i = 0; i < handles.length; i++) {
          if (Math.hypot(pt.x - handles[i].x, pt.y - handles[i].y) <= WB_HR + 4) {
            _wbPushUndo()
            _wbResizing = { handle: i, startPt: { ...pt }, origShape: JSON.parse(JSON.stringify(sel)) }
            return
          }
        }
      }
    }
    const hit = _wbHitTest(pt.x, pt.y)
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+click toggles shape in/out of multi-selection
      if (hit) {
        const idx = _wbSelIds.indexOf(hit)
        if (idx === -1) _wbSelIds.push(hit)
        else            _wbSelIds.splice(idx, 1)
        _wbSelId = _wbSelIds[_wbSelIds.length - 1] || null
      }
    } else if (hit) {
      // Click on shape — select it (keep multi-sel if clicking inside it)
      if (!_wbSelIds.includes(hit)) { _wbSelIds = [hit] }
      _wbSelId = hit
      _wbDragStart = { x: pt.x, y: pt.y, shapes: JSON.parse(JSON.stringify(_wb.shapes)) }
    } else {
      // Click on empty space — start drag-selection rect
      _wbSelId  = null
      _wbSelIds = []
      _wbSelRect = { x: pt.x, y: pt.y, w: 0, h: 0 }
    }
    _wbRender()
    return
  }

  _wbDrawing = true
  _wbPts = [pt]
}

// ── Mouse Move ────────────────────────────────────────────────────────────────

function _wbMove(e) {
  // Pan
  if (_wbPanning && _wbPanStart) {
    _wbPanX = _wbPanStart.panX + (e.clientX - _wbPanStart.x)
    _wbPanY = _wbPanStart.panY + (e.clientY - _wbPanStart.y)
    _wbRender()
    return
  }

  const pt = _wbPt(e)

  // Resize
  if (_wbResizing && _wbSelId) {
    const s = (_wb.shapes||[]).find(sh => sh.id === _wbSelId)
    if (s) {
      _wbApplyResize(s, _wbResizing.origShape, _wbResizing.handle, pt.x - _wbResizing.startPt.x, pt.y - _wbResizing.startPt.y)
      _wbRender()
    }
    return
  }

  // Grow drag-selection rect
  if (_wbTool === 'select' && _wbSelRect && !_wbDragStart) {
    _wbSelRect.w = pt.x - _wbSelRect.x
    _wbSelRect.h = pt.y - _wbSelRect.y
    _wbRender()
    return
  }

  // Move selected shape(s)
  if (_wbTool === 'select' && _wbDragStart && _wbSelId) {
    const dx = pt.x - _wbDragStart.x
    const dy = pt.y - _wbDragStart.y
    const ids = _wbSelIds.length > 1 ? _wbSelIds : [_wbSelId]
    for (const id of ids) _wbMoveShape(id, dx, dy, _wbDragStart.shapes)
    _wbRender()
    return
  }

  // Eraser: show live rubber circle cursor
  if (_wbTool === 'erase' && !_wbDrawing) {
    _wbRender()
    const ctx = _wbCtx
    ctx.save()
    ctx.translate(_wbPanX, _wbPanY)
    ctx.scale(_wbZoom, _wbZoom)
    const R = 18
    ctx.beginPath(); ctx.arc(pt.x, pt.y, R, 0, Math.PI*2)
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5 / _wbZoom; ctx.setLineDash([3/  _wbZoom, 3/_wbZoom])
    ctx.stroke()
    ctx.restore()
    return
  }

  // Hover cursor in select mode
  if (_wbTool === 'select' && !_wbDrawing && !_wbDragStart && !_wbResizing) {
    if (_wbSelId) {
      const sel = (_wb.shapes||[]).find(s => s.id === _wbSelId)
      if (sel && WB_RESIZABLE.includes(sel.type)) {
        const handles = _wbGetHandles(sel)
        const CURSORS = ['nw-resize','n-resize','ne-resize','e-resize','se-resize','s-resize','sw-resize','w-resize']
        for (let i = 0; i < handles.length; i++) {
          if (Math.hypot(pt.x - handles[i].x, pt.y - handles[i].y) <= WB_HR + 4) {
            _wbCanvas.style.cursor = CURSORS[i]
            return
          }
        }
      }
    }
    const hit = _wbHitTest(pt.x, pt.y)
    _wbCanvas.style.cursor = hit ? 'move' : 'default'
    return
  }

  if (!_wbDrawing) return
  _wbPts.push(pt)
  _wbRender()
  _wbDrawActiveStroke()
}

// ── Mouse Up ──────────────────────────────────────────────────────────────────

function _wbUp(e) {
  if (_wbPanning) {
    _wbPanning  = false
    _wbPanStart = null
    _wbCanvas.style.cursor = _wbSpaceHeld ? 'grab' : (_wbTool === 'select' ? 'default' : 'crosshair')
    return
  }
  if (_wbResizing) {
    _wbResizing = null
    saveWb()
    return
  }
  // Finalise drag-selection rect
  if (_wbSelRect) {
    const rx = Math.min(_wbSelRect.x, _wbSelRect.x + _wbSelRect.w)
    const ry = Math.min(_wbSelRect.y, _wbSelRect.y + _wbSelRect.h)
    const rw = Math.abs(_wbSelRect.w)
    const rh = Math.abs(_wbSelRect.h)
    if (rw > 5 && rh > 5) {
      _wbSelIds = (_wb.shapes||[])
        .filter(s => {
          const bb = _wbBBox(s)
          return bb.x >= rx && bb.y >= ry && bb.x+bb.w <= rx+rw && bb.y+bb.h <= ry+rh
        })
        .map(s => s.id)
      _wbSelId = _wbSelIds[_wbSelIds.length - 1] || null
    }
    _wbSelRect = null
    _wbRender()
    return
  }

  if (_wbDragStart && _wbSelId) {
    _wbPushUndo()
    _wbDragStart = null
    saveWb()
    return
  }
  if (!_wbDrawing) return
  _wbDrawing = false
  if (_wbPts.length < 2) { _wbPts = []; return }

  const p0 = _wbPts[0]
  const pN = e ? _wbPt(e) : _wbPts[_wbPts.length-1]
  _wbPts.push(pN)
  _wbPushUndo()

  switch (_wbTool) {
    case 'erase': _wbEraseAt(_wbPts); break
    case 'pen':   _wbAddShape({ type:'freehand', points:[..._wbPts], color:_wbColor, sw:_wbSW }); break
    case 'smart': {
      if (_wbSmartOn) {
        const rec = _recognizeShape(_wbPts)
        if (rec) _wbAddShape({ ...rec, color:_wbColor, sw:_wbSW, fill:_wbFill, fillColor:_wbFillClr })
        else     _wbAddShape({ type:'freehand', points:[..._wbPts], color:_wbColor, sw:_wbSW })
      } else {
        _wbAddShape({ type:'freehand', points:[..._wbPts], color:_wbColor, sw:_wbSW })
      }
      break
    }
    case 'line': _wbAddShape({ type:'line', x1:p0.x, y1:p0.y, x2:pN.x, y2:pN.y, color:_wbColor, sw:_wbSW }); break
    case 'arrow': _wbAddShape({ type:'arrow', x1:p0.x, y1:p0.y, x2:pN.x, y2:pN.y, color:_wbColor, sw:_wbSW }); break
    case 'rect': {
      const x=Math.min(p0.x,pN.x), y=Math.min(p0.y,pN.y), w=Math.abs(pN.x-p0.x), h=Math.abs(pN.y-p0.y)
      if (w>8&&h>8) _wbAddShape({ type:'rect', x, y, w, h, color:_wbColor, sw:_wbSW, fill:_wbFill, fillColor:_wbFillClr })
      break
    }
    case 'circle': {
      const cx=(p0.x+pN.x)/2, cy=(p0.y+pN.y)/2, rx=Math.abs(pN.x-p0.x)/2, ry=Math.abs(pN.y-p0.y)/2
      if (rx>4&&ry>4) _wbAddShape({ type:'ellipse', cx, cy, rx, ry, color:_wbColor, sw:_wbSW, fill:_wbFill, fillColor:_wbFillClr })
      break
    }
    case 'diamond': {
      const x=Math.min(p0.x,pN.x), y=Math.min(p0.y,pN.y), w=Math.abs(pN.x-p0.x), h=Math.abs(pN.y-p0.y)
      if (w>8&&h>8) _wbAddShape({ type:'diamond', x, y, w, h, color:_wbColor, sw:_wbSW, fill:_wbFill, fillColor:_wbFillClr })
      break
    }
    case 'triangle': {
      const x=Math.min(p0.x,pN.x), y=Math.min(p0.y,pN.y), w=Math.abs(pN.x-p0.x), h=Math.abs(pN.y-p0.y)
      if (w>8&&h>8) _wbAddShape({ type:'triangle',
        x1:x+w/2, y1:y,    // apex (top centre)
        x2:x+w,   y2:y+h,  // bottom right
        x3:x,     y3:y+h,  // bottom left
        color:_wbColor, sw:_wbSW, fill:_wbFill, fillColor:_wbFillClr })
      break
    }
    case 'sticky': {
      const x=Math.min(p0.x,pN.x), y=Math.min(p0.y,pN.y)
      const w=Math.max(Math.abs(pN.x-p0.x),80), h=Math.max(Math.abs(pN.y-p0.y),60)
      _wbAddShape({ type:'sticky', x, y, w, h, fillColor:_wbFillClr, sw:0 })
      break
    }
  }

  _wbPts = []
  _wbRender()
  saveWb()
}

// ── Double-click: edit label ──────────────────────────────────────────────────

function _wbDblClick(e) {
  const pt = _wbPt(e)
  const hitId = _wbHitTest(pt.x, pt.y)
  if (hitId) {
    const shape = (_wb.shapes||[]).find(s => s.id === hitId)
    if (shape && WB_RESIZABLE.includes(shape.type)) {
      _wbEditLabel(shape)
      return
    }
  }
  _wbPlaceText(pt.x, pt.y)
}

// ── Active Stroke Preview ─────────────────────────────────────────────────────

function _wbDrawActiveStroke() {
  if (!_wbCtx || _wbPts.length < 2) return
  const ctx = _wbCtx
  const p0 = _wbPts[0], pN = _wbPts[_wbPts.length-1]

  ctx.save()
  ctx.strokeStyle = _wbColor
  ctx.lineWidth   = _wbSW
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'

  if (['pen','smart','erase'].includes(_wbTool)) {
    ctx.globalAlpha = _wbTool==='erase' ? 0.3 : 1
    const pts = _wbPts
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y)
    if (pts.length < 3) {
      for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y)
    } else {
      for (let i=1;i<pts.length-1;i++) {
        const mx=(pts[i].x+pts[i+1].x)/2, my=(pts[i].y+pts[i+1].y)/2
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my)
      }
      ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y)
    }
    ctx.stroke()
  } else if (_wbTool==='line') {
    ctx.beginPath(); ctx.moveTo(p0.x,p0.y); ctx.lineTo(pN.x,pN.y); ctx.stroke()
  } else if (_wbTool==='arrow') {
    _ctxArrow(ctx, p0.x, p0.y, pN.x, pN.y, _wbSW, _wbColor)
  } else if (_wbTool==='rect') {
    const x=Math.min(p0.x,pN.x), y=Math.min(p0.y,pN.y), w=Math.abs(pN.x-p0.x), h=Math.abs(pN.y-p0.y)
    if (_wbFill) { ctx.fillStyle=_wbFillClr; ctx.fillRect(x,y,w,h) }
    ctx.strokeRect(x,y,w,h)
  } else if (_wbTool==='circle') {
    const cx=(p0.x+pN.x)/2, cy=(p0.y+pN.y)/2, rx=Math.abs(pN.x-p0.x)/2, ry=Math.abs(pN.y-p0.y)/2
    ctx.beginPath(); ctx.ellipse(cx,cy,rx||1,ry||1,0,0,Math.PI*2)
    if (_wbFill) { ctx.fillStyle=_wbFillClr; ctx.fill() }
    ctx.stroke()
  } else if (_wbTool==='diamond') {
    const x=Math.min(p0.x,pN.x), y=Math.min(p0.y,pN.y), w=Math.abs(pN.x-p0.x), h=Math.abs(pN.y-p0.y)
    ctx.beginPath()
    ctx.moveTo(x+w/2,y); ctx.lineTo(x+w,y+h/2); ctx.lineTo(x+w/2,y+h); ctx.lineTo(x,y+h/2); ctx.closePath()
    if (_wbFill) { ctx.fillStyle=_wbFillClr; ctx.fill() }
    ctx.stroke()
  } else if (_wbTool==='triangle') {
    const x=Math.min(p0.x,pN.x), y=Math.min(p0.y,pN.y), w=Math.abs(pN.x-p0.x), h=Math.abs(pN.y-p0.y)
    ctx.beginPath()
    ctx.moveTo(x+w/2, y); ctx.lineTo(x+w, y+h); ctx.lineTo(x, y+h); ctx.closePath()
    if (_wbFill) { ctx.fillStyle=_wbFillClr; ctx.fill() }
    ctx.stroke()
  } else if (_wbTool==='sticky') {
    const x=Math.min(p0.x,pN.x), y=Math.min(p0.y,pN.y), w=Math.max(Math.abs(pN.x-p0.x),80), h=Math.max(Math.abs(pN.y-p0.y),60)
    ctx.globalAlpha = 0.85
    ctx.fillStyle = _wbFillClr
    ctx.shadowColor='rgba(0,0,0,0.12)'; ctx.shadowBlur=8; ctx.shadowOffsetY=2
    _ctxRoundRect(ctx, x, y, w, h, 6); ctx.fill()
    ctx.shadowColor='transparent'
    ctx.strokeStyle='rgba(0,0,0,0.1)'; ctx.lineWidth=1; ctx.stroke()
  }
  ctx.restore()
}

// ── Full Render ───────────────────────────────────────────────────────────────

function _wbRender() {
  if (!_wbCtx || !_wbCanvas || !_wb) return
  const ctx = _wbCtx
  const dpr = window.devicePixelRatio || 1
  const w   = _wbCanvas.width / dpr
  const h   = _wbCanvas.height / dpr

  ctx.clearRect(0, 0, w, h)

  // Apply viewport transform
  ctx.save()
  ctx.translate(_wbPanX, _wbPanY)
  ctx.scale(_wbZoom, _wbZoom)

  for (const s of (_wb.shapes||[])) {
    _wbDrawShape(ctx, s)
    if (s.id === _wbSelId || _wbSelIds.includes(s.id)) _wbDrawSelection(ctx, s)
  }

  if (_wbDrawing && _wbPts.length >= 2) _wbDrawActiveStroke()

  // Drag-selection rubber band
  if (_wbSelRect) {
    ctx.save()
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 1 / _wbZoom; ctx.setLineDash([5 / _wbZoom, 3 / _wbZoom])
    ctx.fillStyle = 'rgba(99,102,241,0.06)'
    const rx = Math.min(_wbSelRect.x, _wbSelRect.x + _wbSelRect.w)
    const ry = Math.min(_wbSelRect.y, _wbSelRect.y + _wbSelRect.h)
    ctx.fillRect(rx, ry, Math.abs(_wbSelRect.w), Math.abs(_wbSelRect.h))
    ctx.strokeRect(rx, ry, Math.abs(_wbSelRect.w), Math.abs(_wbSelRect.h))
    ctx.restore()
  }

  ctx.restore()
  _wbUpdateSelBar()
}

function _wbDrawShape(ctx, s) {
  ctx.save()
  ctx.strokeStyle = s.color || '#1e293b'
  ctx.lineWidth   = s.sw ?? 2
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'

  switch (s.type) {
    case 'freehand': {
      const pts = s.points
      if (!pts?.length) break
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      if (pts.length < 3) {
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
      } else {
        // Midpoint Bezier smoothing — eliminates jagged polyline angles
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i+1].x) / 2
          const my = (pts[i].y + pts[i+1].y) / 2
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my)
        }
        ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y)
      }
      ctx.stroke()
      break
    }
    case 'line': {
      ctx.beginPath(); ctx.moveTo(s.x1,s.y1); ctx.lineTo(s.x2,s.y2); ctx.stroke()
      break
    }
    case 'arrow': {
      _ctxArrow(ctx, s.x1, s.y1, s.x2, s.y2, s.sw||2, s.color||'#1e293b')
      break
    }
    case 'rect': {
      if (s.fill) { ctx.fillStyle=s.fillColor||'#dbeafe'; ctx.fillRect(s.x,s.y,s.w,s.h) }
      ctx.strokeRect(s.x, s.y, s.w, s.h)
      break
    }
    case 'ellipse': {
      ctx.beginPath(); ctx.ellipse(s.cx,s.cy,s.rx||1,s.ry||1,0,0,Math.PI*2)
      if (s.fill) { ctx.fillStyle=s.fillColor||'#dbeafe'; ctx.fill() }
      ctx.stroke()
      break
    }
    case 'diamond': {
      ctx.beginPath()
      ctx.moveTo(s.x+s.w/2, s.y)
      ctx.lineTo(s.x+s.w,   s.y+s.h/2)
      ctx.lineTo(s.x+s.w/2, s.y+s.h)
      ctx.lineTo(s.x,       s.y+s.h/2)
      ctx.closePath()
      if (s.fill) { ctx.fillStyle=s.fillColor||'#dbeafe'; ctx.fill() }
      ctx.stroke()
      break
    }
    case 'triangle': {
      ctx.beginPath()
      ctx.moveTo(s.x1,s.y1); ctx.lineTo(s.x2,s.y2); ctx.lineTo(s.x3,s.y3); ctx.closePath()
      if (s.fill) { ctx.fillStyle=s.fillColor||'#dbeafe'; ctx.fill() }
      ctx.stroke()
      break
    }
    case 'sticky': {
      ctx.shadowColor='rgba(0,0,0,0.12)'; ctx.shadowBlur=8; ctx.shadowOffsetY=2
      ctx.fillStyle = s.fillColor || '#fef08a'
      _ctxRoundRect(ctx, s.x, s.y, s.w, s.h, 6); ctx.fill()
      ctx.shadowColor='transparent'
      ctx.strokeStyle='rgba(0,0,0,0.08)'; ctx.lineWidth=1; ctx.stroke()
      break
    }
    case 'image': {
      const img = _wbGetImg(s.dataUrl)
      if (img.complete && img.naturalWidth) {
        ctx.drawImage(img, s.x, s.y, s.w, s.h)
      } else {
        img.onload = () => _wbRender()
        // Placeholder while loading
        ctx.fillStyle = '#f1f5f9'; ctx.fillRect(s.x, s.y, s.w, s.h)
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.strokeRect(s.x, s.y, s.w, s.h)
        ctx.fillStyle = '#94a3b8'; ctx.font = '12px system-ui'; ctx.textAlign='center'
        ctx.fillText('Loading…', s.x + s.w/2, s.y + s.h/2)
        ctx.textAlign = 'left'
      }
      break
    }
    case 'text': {
      ctx.fillStyle = s.color||'#1e293b'
      ctx.font = `${s.fontSize||14}px Segoe UI, system-ui, sans-serif`
      const lines = (s.text||'').split('\n')
      const lh = (s.fontSize||14)*1.4
      lines.forEach((l,i) => ctx.fillText(l, s.x, s.y + i*lh))
      break
    }
    case 'chart': {
      _wbDrawChart(ctx, s)
      break
    }
  }

  ctx.restore()

  // Draw embedded label (for shapes that support it)
  if (s.label?.text) _wbDrawLabel(ctx, s)
}

function _wbDrawLabel(ctx, s) {
  const lbl = s.label
  if (!lbl?.text?.trim()) return
  const bb  = _wbBBox(s)
  const cx  = bb.x + bb.w / 2
  const cy  = bb.y + bb.h / 2
  const fs  = lbl.fontSize || 14
  const lines = lbl.text.split('\n')
  const lh  = fs * 1.35
  const totalH = lines.length * lh

  ctx.save()
  // Clip inside shape
  ctx.beginPath()
  if (s.type === 'ellipse') {
    ctx.ellipse(s.cx, s.cy, Math.max(s.rx-4,1), Math.max(s.ry-4,1), 0, 0, Math.PI*2)
  } else if (s.type === 'diamond') {
    ctx.moveTo(s.x+s.w/2, s.y+6); ctx.lineTo(s.x+s.w-6, s.y+s.h/2)
    ctx.lineTo(s.x+s.w/2, s.y+s.h-6); ctx.lineTo(s.x+6, s.y+s.h/2); ctx.closePath()
  } else {
    ctx.rect(bb.x+6, bb.y+6, bb.w-12, bb.h-12)
  }
  ctx.clip()

  ctx.fillStyle   = lbl.color || (s.type==='sticky' ? '#1e293b' : (s.color||'#1e293b'))
  ctx.font        = `${fs}px Segoe UI, system-ui, sans-serif`
  ctx.textAlign   = 'center'
  ctx.textBaseline= 'top'
  lines.forEach((line, i) => {
    ctx.fillText(line, cx, cy - totalH/2 + i*lh)
  })
  ctx.restore()
}

function _ctxArrow(ctx, x1, y1, x2, y2, sw, color) {
  const hl  = Math.max(14, sw * 5)
  const ang = Math.atan2(y2-y1, x2-x1)
  ctx.save()
  ctx.strokeStyle=color; ctx.fillStyle=color; ctx.lineWidth=sw; ctx.lineCap='round'
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2-hl*Math.cos(ang-Math.PI/6), y2-hl*Math.sin(ang-Math.PI/6))
  ctx.lineTo(x2-hl*Math.cos(ang+Math.PI/6), y2-hl*Math.sin(ang+Math.PI/6))
  ctx.closePath(); ctx.fill()
  ctx.restore()
}

function _ctxRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x+r, y)
  ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r)
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r)
  ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r)
  ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r)
  ctx.closePath()
}

// ── Selection + Resize Handles ────────────────────────────────────────────────

function _wbGetHandles(s) {
  const bb = _wbBBox(s)
  const p  = 5  // padding so handles sit just outside shape bounds
  const bx=bb.x-p, by=bb.y-p, bw=bb.w+p*2, bh=bb.h+p*2
  return [
    {x:bx,       y:by      }, // 0 TL
    {x:bx+bw/2,  y:by      }, // 1 TC
    {x:bx+bw,    y:by      }, // 2 TR
    {x:bx+bw,    y:by+bh/2 }, // 3 RC
    {x:bx+bw,    y:by+bh   }, // 4 BR
    {x:bx+bw/2,  y:by+bh   }, // 5 BC
    {x:bx,       y:by+bh   }, // 6 BL
    {x:bx,       y:by+bh/2 }, // 7 LC
  ]
}

function _wbDrawSelection(ctx, s) {
  const bb = _wbBBox(s)
  const p  = 5
  const bx=bb.x-p, by=bb.y-p, bw=bb.w+p*2, bh=bb.h+p*2
  ctx.save()
  ctx.strokeStyle='#6366f1'; ctx.lineWidth=1.5; ctx.setLineDash([5,3])
  ctx.strokeRect(bx, by, bw, bh)
  ctx.setLineDash([])

  if (WB_RESIZABLE.includes(s.type)) {
    const handles = _wbGetHandles(s)
    for (const h of handles) {
      ctx.beginPath(); ctx.arc(h.x, h.y, WB_HR, 0, Math.PI*2)
      ctx.fillStyle='#fff'; ctx.fill()
      ctx.strokeStyle='#6366f1'; ctx.lineWidth=1.5; ctx.stroke()
    }
  }
  ctx.restore()
}

// ── Resize Logic ──────────────────────────────────────────────────────────────

function _wbApplyResize(s, orig, handle, dx, dy) {
  const MIN = 20
  let x, y, w, h

  if (s.type === 'ellipse') {
    x=orig.cx-orig.rx; y=orig.cy-orig.ry; w=orig.rx*2; h=orig.ry*2
  } else {
    x=orig.x; y=orig.y; w=orig.w; h=orig.h
  }

  // Apply delta per handle: 0=TL,1=TC,2=TR,3=RC,4=BR,5=BC,6=BL,7=LC
  const moveL = [0,6,7], moveT = [0,1,2]
  if ([0,6,7].includes(handle)) { x+=dx; w-=dx }
  if ([2,3,4].includes(handle)) { w+=dx }
  if ([0,1,2].includes(handle)) { y+=dy; h-=dy }
  if ([4,5,6].includes(handle)) { h+=dy }

  // Clamp minimum size
  if (w < MIN) { if ([0,6,7].includes(handle)) x -= (MIN-w); w = MIN }
  if (h < MIN) { if ([0,1,2].includes(handle)) y -= (MIN-h); h = MIN }

  if (s.type === 'ellipse') {
    s.cx=x+w/2; s.cy=y+h/2; s.rx=w/2; s.ry=h/2
  } else {
    s.x=x; s.y=y; s.w=w; s.h=h
  }
}

// ── BBox + Hit Test + Move ────────────────────────────────────────────────────

function _wbBBox(s) {
  switch(s.type) {
    case 'rect':
    case 'diamond':
    case 'sticky':   return { x:s.x,       y:s.y,       w:s.w,        h:s.h        }
    case 'ellipse':  return { x:s.cx-s.rx, y:s.cy-s.ry, w:s.rx*2,     h:s.ry*2     }
    case 'line':
    case 'arrow':    return { x:Math.min(s.x1,s.x2), y:Math.min(s.y1,s.y2), w:Math.abs(s.x2-s.x1)||10, h:Math.abs(s.y2-s.y1)||10 }
    case 'triangle': return { x:Math.min(s.x1,s.x2,s.x3)-4, y:Math.min(s.y1,s.y2,s.y3)-4,
                              w:Math.max(s.x1,s.x2,s.x3)-Math.min(s.x1,s.x2,s.x3)+8,
                              h:Math.max(s.y1,s.y2,s.y3)-Math.min(s.y1,s.y2,s.y3)+8 }
    case 'image':
    case 'chart':    return { x:s.x, y:s.y, w:s.w, h:s.h }
    case 'text':     return { x:s.x, y:s.y-(s.fontSize||14),
                              w:(s.text||'').split('\n').reduce((m,l)=>Math.max(m,l.length),0)*(s.fontSize||14)*0.55,
                              h:(s.text||'').split('\n').length*(s.fontSize||14)*1.4 }
    case 'freehand': {
      const xs=s.points.map(p=>p.x), ys=s.points.map(p=>p.y)
      return { x:Math.min(...xs), y:Math.min(...ys), w:Math.max(...xs)-Math.min(...xs)||10, h:Math.max(...ys)-Math.min(...ys)||10 }
    }
    default: return { x:0, y:0, w:10, h:10 }
  }
}

function _wbHitTest(x, y) {
  for (let i=(_wb.shapes||[]).length-1; i>=0; i--) {
    const s  = _wb.shapes[i]
    const bb = _wbBBox(s)
    const p  = 8
    if (x>=bb.x-p && x<=bb.x+bb.w+p && y>=bb.y-p && y<=bb.y+bb.h+p) return s.id
  }
  return null
}

function _wbMoveShape(id, dx, dy, origShapes) {
  const orig = (origShapes||_wb.shapes).find(s=>s.id===id)
  const cur  = _wb.shapes.find(s=>s.id===id)
  if (!orig||!cur) return
  switch(orig.type) {
    case 'rect':
    case 'diamond':
    case 'sticky':   cur.x=orig.x+dx; cur.y=orig.y+dy; break
    case 'ellipse':  cur.cx=orig.cx+dx; cur.cy=orig.cy+dy; break
    case 'line':
    case 'arrow':    cur.x1=orig.x1+dx; cur.y1=orig.y1+dy; cur.x2=orig.x2+dx; cur.y2=orig.y2+dy; break
    case 'triangle': cur.x1=orig.x1+dx; cur.y1=orig.y1+dy; cur.x2=orig.x2+dx; cur.y2=orig.y2+dy; cur.x3=orig.x3+dx; cur.y3=orig.y3+dy; break
    case 'image':
    case 'chart':
    case 'text':     cur.x=orig.x+dx; cur.y=orig.y+dy; break
    case 'freehand': cur.points=orig.points.map(p=>({x:p.x+dx, y:p.y+dy})); break
  }
}

function _wbDeleteSelected() {
  const toDelete = _wbSelIds.length > 1 ? new Set(_wbSelIds) : (_wbSelId ? new Set([_wbSelId]) : null)
  if (!toDelete) return
  _wbPushUndo()
  _wb.shapes = _wb.shapes.filter(s => !toDelete.has(s.id))
  _wbSelId = null; _wbSelIds = []
  saveWb(); _wbRender()
}

// ── Text Tool ─────────────────────────────────────────────────────────────────

function _wbPlaceText(x, y) {
  const container = document.getElementById('wb-container')
  if (!container) return
  document.getElementById('wb-text-inp')?.remove()

  const ta = document.createElement('textarea')
  ta.id = 'wb-text-inp'
  ta.rows = 1
  ta.placeholder = 'Type…'
  ta.style.cssText = `position:absolute;left:${x}px;top:${y - _wbFontSize}px;
    min-width:100px;background:rgba(255,255,255,0.95);border:1.5px dashed #6366f1;
    border-radius:4px;padding:4px 8px;font-size:${_wbFontSize}px;
    font-family:Segoe UI,system-ui,sans-serif;color:${_wbColor};
    resize:none;outline:none;z-index:50;line-height:1.5;overflow:hidden;`
  container.appendChild(ta)
  ta.focus()

  ta.addEventListener('input', () => { ta.style.height='auto'; ta.style.height=ta.scrollHeight+'px' })

  const commit = () => {
    const txt = ta.value.trim()
    ta.remove()
    if (txt) {
      _wbPushUndo()
      _wbAddShape({ type:'text', x, y, text:txt, color:_wbColor, fontSize:_wbFontSize })
      saveWb(); _wbRender()
    }
  }
  ta.addEventListener('blur', commit)
  ta.addEventListener('keydown', e => {
    if (e.key==='Escape') { ta.remove() }
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); commit() }
  })
}

// ── Shape Label Editor ────────────────────────────────────────────────────────

function _wbEditLabel(shape) {
  const container = document.getElementById('wb-container')
  if (!container) return
  document.getElementById('wb-text-inp')?.remove()

  const bb = _wbBBox(shape)
  const pad = 10
  const fs  = shape.label?.fontSize || _wbFontSize
  const existingText = shape.label?.text || ''

  // Wrapper div for centering
  const wrap = document.createElement('div')
  wrap.id = 'wb-text-inp'
  wrap.style.cssText = `
    position:absolute;
    left:${bb.x+pad}px; top:${bb.y+pad}px;
    width:${bb.w-pad*2}px; height:${bb.h-pad*2}px;
    display:flex; align-items:center; justify-content:center;
    z-index:50; pointer-events:none;`

  const ta = document.createElement('textarea')
  ta.value = existingText
  ta.placeholder = 'Label…'
  ta.style.cssText = `
    width:100%; height:100%; min-height:${fs*2}px;
    background:transparent; border:none; outline:none; resize:none;
    font-size:${fs}px; font-family:Segoe UI,system-ui,sans-serif;
    color:${shape.label?.color || (shape.type==='sticky' ? '#1e293b' : shape.color||'#1e293b')};
    text-align:center; line-height:1.4;
    pointer-events:all; caret-color:#6366f1;`

  wrap.appendChild(ta)
  container.appendChild(wrap)
  ta.focus()
  ta.select()

  // Draw selection indicator
  _wbSelId = shape.id
  _wbRender()

  const commit = () => {
    const txt = ta.value
    wrap.remove()
    _wbPushUndo()
    if (txt.trim()) {
      shape.label = { text: txt, fontSize: fs, color: shape.label?.color || (shape.type==='sticky'?'#1e293b':shape.color||'#1e293b') }
    } else {
      shape.label = null
    }
    saveWb()
    _wbRender()
  }

  ta.addEventListener('blur', commit)
  ta.addEventListener('keydown', e => {
    if (e.key==='Escape') { wrap.remove(); _wbRender() }
  })
}

// ── Eraser ────────────────────────────────────────────────────────────────────

function _wbEraseAt(pts) {
  const R = 18
  _wb.shapes = _wb.shapes.filter(s => {
    if (s.type === 'freehand') {
      // For freehand, erase if any eraser point is close to any stroke point
      return !pts.some(ep => s.points.some(sp => Math.hypot(ep.x-sp.x, ep.y-sp.y) < R))
    }
    const bb = _wbBBox(s)
    return !pts.some(p =>
      p.x > bb.x-R && p.x < bb.x+bb.w+R && p.y > bb.y-R && p.y < bb.y+bb.h+R
    )
  })
  _wbRender()
}

// ── Undo / Redo ───────────────────────────────────────────────────────────────

function _wbPushUndo() {
  _wbUndo.push(JSON.parse(JSON.stringify(_wb.shapes||[])))
  _wbRedo = []
  if (_wbUndo.length > 80) _wbUndo.shift()
}

function wbUndo() {
  if (!_wbUndo.length||!_wb) return
  _wbRedo.push(JSON.parse(JSON.stringify(_wb.shapes||[])))
  _wb.shapes = _wbUndo.pop()
  _wbSelId = null
  saveWb(); _wbRender()
}

function wbRedo() {
  if (!_wbRedo.length||!_wb) return
  _wbUndo.push(JSON.parse(JSON.stringify(_wb.shapes||[])))
  _wb.shapes = _wbRedo.pop()
  saveWb(); _wbRender()
}

// ── Shape Recognition ─────────────────────────────────────────────────────────

function _recognizeShape(pts) {
  if (pts.length < 8) return null
  const candidates = [_tryLine(pts), _tryCircle(pts), _tryRect(pts), _tryArrow(pts), _tryTriangle(pts)]
  candidates.sort((a,b) => (b?.confidence||0)-(a?.confidence||0))
  const best = candidates[0]
  return best?.confidence >= 0.70 ? best : null
}

function _tryLine(pts) {
  const p0=pts[0], pN=pts[pts.length-1]
  const len=Math.hypot(pN.x-p0.x, pN.y-p0.y)
  if (len<20) return {confidence:0}
  let maxDev=0
  for (const p of pts) {
    const t=((p.x-p0.x)*(pN.x-p0.x)+(p.y-p0.y)*(pN.y-p0.y))/(len*len)
    const cx=p0.x+t*(pN.x-p0.x), cy=p0.y+t*(pN.y-p0.y)
    maxDev=Math.max(maxDev, Math.hypot(p.x-cx, p.y-cy))
  }
  return { type:'line', x1:p0.x, y1:p0.y, x2:pN.x, y2:pN.y, confidence: Math.max(0,1-maxDev/(len*0.15)) }
}

function _tryArrow(pts) {
  const line=_tryLine(pts.slice(0,Math.floor(pts.length*0.7)))
  if (!line||line.confidence<0.7) return {confidence:0}
  const tail=pts.slice(-Math.max(4,Math.floor(pts.length*0.15)))
  const pN=pts[pts.length-1]
  const spread=Math.max(...tail.map(p=>Math.max(Math.abs(p.x-pN.x),Math.abs(p.y-pN.y))))
  const lineLen=Math.hypot(pN.x-pts[0].x, pN.y-pts[0].y)
  return { type:'arrow', x1:pts[0].x, y1:pts[0].y, x2:pN.x, y2:pN.y, confidence: Math.min(1,spread/(lineLen*0.1))*line.confidence*0.85 }
}

function _tryCircle(pts) {
  const cx=pts.reduce((s,p)=>s+p.x,0)/pts.length
  const cy=pts.reduce((s,p)=>s+p.y,0)/pts.length
  const dists=pts.map(p=>Math.hypot(p.x-cx,p.y-cy))
  const avgR=dists.reduce((s,d)=>s+d,0)/dists.length
  const stdR=Math.sqrt(dists.reduce((s,d)=>s+(d-avgR)**2,0)/dists.length)
  const p0=pts[0], pN=pts[pts.length-1]
  if (Math.hypot(p0.x-pN.x,p0.y-pN.y) > avgR*0.5) return {confidence:0}
  return { type:'ellipse', cx, cy, rx:avgR, ry:avgR, confidence: Math.max(0,1-stdR/avgR)*0.95 }
}

function _tryRect(pts) {
  const xs=pts.map(p=>p.x), ys=pts.map(p=>p.y)
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys)
  const w=maxX-minX, h=maxY-minY
  if (w<15||h<15) return {confidence:0}
  const p0=pts[0], pN=pts[pts.length-1]
  if (Math.hypot(p0.x-pN.x,p0.y-pN.y)>Math.min(w,h)*0.5) return {confidence:0}
  const avgEdge=pts.reduce((s,p)=>s+Math.min(Math.abs(p.x-minX),Math.abs(p.x-maxX),Math.abs(p.y-minY),Math.abs(p.y-maxY)),0)/pts.length
  return { type:'rect', x:minX, y:minY, w, h, confidence: Math.max(0,1-avgEdge/Math.min(w,h))*0.92 }
}

function _tryTriangle(pts) {
  const p0=pts[0], pN=pts[pts.length-1]
  const span=Math.hypot(Math.max(...pts.map(p=>p.x))-Math.min(...pts.map(p=>p.x)), Math.max(...pts.map(p=>p.y))-Math.min(...pts.map(p=>p.y)))
  if (Math.hypot(p0.x-pN.x,p0.y-pN.y)>span*0.4) return {confidence:0}
  let maxDist=0, apex=null
  for (const p of pts) {
    const len=Math.hypot(pN.x-p0.x,pN.y-p0.y)
    const d=len>0?Math.abs((pN.x-p0.x)*(p0.y-p.y)-(p0.x-p.x)*(pN.y-p0.y))/len:0
    if(d>maxDist){maxDist=d;apex=p}
  }
  if (!apex||maxDist<15) return {confidence:0}
  return { type:'triangle', x1:p0.x,y1:p0.y,x2:pN.x,y2:pN.y,x3:apex.x,y3:apex.y, confidence:Math.min(1,maxDist/span)*0.82 }
}

// ── Shape helpers ─────────────────────────────────────────────────────────────

function _wbAddShape(s) {
  if (!_wb) return
  if (!_wb.shapes) _wb.shapes=[]
  s.id = 'ws-' + uid()
  _wb.shapes.push(s)
}

// ── Toolbar Update ────────────────────────────────────────────────────────────

function _wbUpdateToolbar() {
  document.querySelectorAll('[data-wb-tool]').forEach(btn => {
    const active = btn.dataset.wbTool === _wbTool
    btn.className = `w-8 h-8 flex items-center justify-center rounded text-sm transition-colors flex-shrink-0 ${active?'bg-indigo-600 text-white':'text-slate-600 hover:bg-slate-100'}`
  })
  document.querySelectorAll('[data-wb-color]').forEach(btn => {
    const c = btn.dataset.wbColor
    btn.style.outline = _wbColor===c ? '2px solid #6366f1' : (c==='#ffffff'?'1px solid #e2e8f0':'none')
    btn.style.outlineOffset = '1px'
  })
  // Sync numerical inputs (stroke width + font size)
  document.querySelectorAll('input[title="Stroke width in pixels"]').forEach(inp => { inp.value = _wbSW })
  document.querySelectorAll('input[title="Font size in pixels"]').forEach(inp  => { inp.value = _wbFontSize })
  const fillBtn = document.getElementById('wb-fill-btn')
  if (fillBtn) {
    fillBtn.textContent = _wbFill ? 'Fill ✓' : 'Fill'
    fillBtn.className = `px-2 h-8 rounded text-xs font-medium transition-colors flex-shrink-0 ${_wbFill?'bg-indigo-100 text-indigo-700':'text-slate-500 hover:bg-slate-100'}`
  }
  const fillClrInp   = document.getElementById('wb-fill-clr-inp')
  if (fillClrInp)   fillClrInp.value = _wbFillClr
  const strokeClrInp = document.getElementById('wb-stroke-clr-inp')
  if (strokeClrInp) strokeClrInp.value = _wbColor
  const smartBtn = document.getElementById('wb-smart-btn')
  if (smartBtn) {
    smartBtn.textContent = '✦ Smart'
    smartBtn.className = `px-2 h-8 rounded text-xs font-medium transition-colors flex-shrink-0 ml-1 ${_wbSmartOn?'bg-amber-100 text-amber-700':'text-slate-400 hover:bg-slate-100'}`
  }
  if (_wbCanvas) {
    _wbCanvas.style.cursor = _wbTool==='text'?'text':_wbTool==='select'?'default':_wbTool==='erase'?'none':'crosshair'
  }
  const container = document.getElementById('wb-container')
  if (container) container.setAttribute('style', WB_BG[_wbBg]||WB_BG.dots)
}

// ── Board Management ──────────────────────────────────────────────────────────

function wbLinkProject() {
  if (!_wb) return
  if (!(state.projects||[]).length) { showToast('No projects to link to yet', 'info'); return }
  openModal(`
  <h3 class="text-base font-bold text-slate-900 mb-3">Link board to project</h3>
  <div class="space-y-1.5 max-h-64 overflow-y-auto">
    ${(state.projects||[]).filter(p=>p.status!=='archived').map(p=>`
    <button onclick="_wbDoLinkProject('${p.id}')"
      class="w-full text-left flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200
        hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm">
      <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:${p.color||'#6366f1'}"></div>
      <span class="font-medium text-slate-800 truncate">${esc(p.name)}</span>
    </button>`).join('')}
  </div>
  <button onclick="closeModal()" class="w-full btn-secondary text-xs mt-3">Cancel</button>`)
}

function _wbDoLinkProject(projectId) {
  if (!_wb) return
  _wb.projectId = projectId
  saveWb(); closeModal(); render_whiteboard()
  showToast('Board linked to project ✓')
}

function wbUnlinkProject() {
  if (!_wb) return
  delete _wb.projectId
  saveWb(); render_whiteboard()
}

function wbNewBoard() {
  openModal(`<div>
    <h3 class="text-base font-bold text-slate-800 mb-4">New Whiteboard</h3>
    <label class="label">Board Name</label>
    <input id="wb-new-name" type="text" value="Untitled Board" class="input mb-4"
      onkeydown="if(event.key==='Enter')wbNewBoardConfirm()"/>
    <div class="flex gap-2 justify-end">
      <button onclick="closeModal()" class="btn-secondary px-4 py-2 text-sm">Cancel</button>
      <button onclick="wbNewBoardConfirm()" class="btn-primary px-4 py-2 text-sm">Create</button>
    </div>
  </div>`)
  setTimeout(() => { const el=document.getElementById('wb-new-name'); if(el){el.select();el.focus()} }, 80)
}
function wbNewBoardConfirm() {
  const name = document.getElementById('wb-new-name')?.value.trim() || 'Untitled Board'
  closeModal()
  const board = { id:'wb-'+uid(), name, shapes:[], createdAt:new Date().toISOString() }
  if (!state.whiteboards) state.whiteboards=[]
  state.whiteboards.push(board)
  _wb=board; _wbUndo=[]; _wbRedo=[]; _wbSelId=null
  save('whiteboards'); render_whiteboard()
}
function wbLoadBoard(id) {
  _wb = state.whiteboards.find(b=>b.id===id)||null
  _wbUndo=[]; _wbRedo=[]; _wbSelId=null
  _wbZoom=1; _wbPanX=0; _wbPanY=0
  render_whiteboard()
}
function wbRenameBoard() {
  if (!_wb) return
  openModal(`<div>
    <h3 class="text-base font-bold text-slate-800 mb-4">Rename Board</h3>
    <label class="label">Board Name</label>
    <input id="wb-ren-name" type="text" value="${esc(_wb.name)}" class="input mb-4"
      onkeydown="if(event.key==='Enter')wbRenameBoardConfirm()"/>
    <div class="flex gap-2 justify-end">
      <button onclick="closeModal()" class="btn-secondary px-4 py-2 text-sm">Cancel</button>
      <button onclick="wbRenameBoardConfirm()" class="btn-primary px-4 py-2 text-sm">Rename</button>
    </div>
  </div>`)
  setTimeout(() => { const el=document.getElementById('wb-ren-name'); if(el){el.select();el.focus()} }, 80)
}
function wbRenameBoardConfirm() {
  const name=document.getElementById('wb-ren-name')?.value.trim()
  if (!name||!_wb) { closeModal(); return }
  _wb.name=name; closeModal(); saveWb(); render_whiteboard()
}
async function wbDeleteBoard() {
  if (!_wb||!await confirmDlg(`Delete "${_wb.name}"? This cannot be undone.`,'Delete Board')) return
  state.whiteboards=state.whiteboards.filter(b=>b.id!==_wb.id)
  _wb=state.whiteboards[0]||null
  save('whiteboards'); render_whiteboard()
}
async function wbClear() {
  if (!_wb||!await confirmDlg('Clear the entire board?','Clear Board')) return
  _wbPushUndo(); _wb.shapes=[]; _wbSelId=null; saveWb(); _wbRender()
}
function saveWb() {
  const i=state.whiteboards.findIndex(b=>b.id===_wb?.id)
  if (i>-1) state.whiteboards[i]=_wb
  save('whiteboards')
}

// ── Toolbar Controls ──────────────────────────────────────────────────────────

function _wbUpdateZoomLabel() {
  const el = document.getElementById('wb-zoom-label')
  if (el) el.textContent = Math.round(_wbZoom * 100) + '%'
}

function wbZoomIn()    { _wbSetZoomCentre(_wbZoom * (1/0.9)) }
function wbZoomOut()   { _wbSetZoomCentre(_wbZoom * 0.9) }
function wbZoomReset() {
  _wbZoom = 1; _wbPanX = 0; _wbPanY = 0
  _wbRender(); _wbUpdateZoomLabel()
}

function _wbSetZoomCentre(newZ) {
  if (!_wbCanvas) return
  newZ = Math.min(WB_ZOOM_MAX, Math.max(WB_ZOOM_MIN, newZ))
  // Zoom towards canvas centre
  const cx = _wbCanvas.offsetWidth / 2
  const cy = _wbCanvas.offsetHeight / 2
  _wbPanX = cx - (cx - _wbPanX) * (newZ / _wbZoom)
  _wbPanY = cy - (cy - _wbPanY) * (newZ / _wbZoom)
  _wbZoom = newZ
  _wbRender(); _wbUpdateZoomLabel()
}

function wbSetTool(t) {
  _wbTool=t; _wbSelId=null; _wbSelIds=[]; _wbSelRect=null
  document.getElementById('wb-text-inp')?.remove()
  _wbUpdateToolbar(); _wbRender()
}
function wbSetColor(c)      { _wbColor=c; _wbUpdateToolbar() }
function wbSetSW(w)         { _wbSW=w; _wbUpdateToolbar() }
function wbToggleFill()     { _wbFill=!_wbFill; _wbUpdateToolbar() }
function wbSetFillColor(c)  { _wbFillClr=c; _wbUpdateToolbar() }
function wbSetFontSize(sz)  { _wbFontSize=sz; _wbUpdateToolbar() }
function wbSetBg(b)         { _wbBg=b; _wbUpdateToolbar() }
function wbToggleSmart()    { _wbSmartOn=!_wbSmartOn; _wbUpdateToolbar() }

// ══ Template Library ══════════════════════════════════════════════════════════

async function wbToggleTplPanel() {
  _wbTplPanel = !_wbTplPanel
  if (_wbTplPanel) await _wbLoadCustomTemplates()
  render_whiteboard()
}
function wbTplTab(t) { _wbTplTab = t; render_whiteboard() }

// Shape factory — gives each shape a fresh ID at insert time
const _tS = (type, fields) => ({ id: 'ws-' + uid(), type, color:'#1e293b', sw:1.5, ...fields })
const _tR = (x,y,w,h,f={}) => _tS('rect',   {x,y,w,h,...f})
const _tE = (cx,cy,rx,ry,f={}) => _tS('ellipse',{cx,cy,rx,ry,...f})
const _tD = (x,y,w,h,f={}) => _tS('diamond', {x,y,w,h,...f})
const _tL = (x1,y1,x2,y2,f={}) => _tS('line',  {x1,y1,x2,y2,color:'#94a3b8',sw:1,...f})
const _tA = (x1,y1,x2,y2,f={}) => _tS('arrow', {x1,y1,x2,y2,color:'#6366f1',sw:2,...f})
const _tT = (x,y,text,f={}) => _tS('text',  {x,y,text,color:'#475569',fontSize:12,...f})
const _tLbl = (text,sz=11) => ({ label:{text,fontSize:sz,color:'#1e293b'} })

// Palette
const C = { indigo:'#818cf8', blue:'#60a5fa', teal:'#34d399', amber:'#fbbf24',
            rose:'#f87171',   slate:'#cbd5e1', white:'#ffffff', light:'#f8fafc' }

const _WB_GRAPHS = [
  { id:'bar-chart', name:'Bar Chart', icon:'📊', gen(cx,cy) {
    const bars = [0.5,0.75,0.45,0.9,0.6], bw=36, gap=10
    const totalW = bars.length*(bw+gap)-gap, h=160, x0=cx-totalW/2-20, y0=cy-h/2+20
    return [
      _tL(x0,y0-h-10,x0,y0+5),                              // y axis
      _tL(x0-5,y0,x0+totalW+30,y0),                          // x axis
      ...bars.map((v,i)=>_tR(x0+5+i*(bw+gap), y0-h*v, bw, h*v,
        {fill:true,fillColor:[C.indigo,C.blue,C.teal,C.amber,C.rose][i],sw:0})),
      ...bars.map((v,i)=>_tT(x0+5+i*(bw+gap)+bw/2-12, y0+14, `Cat ${i+1}`,{fontSize:10,color:'#64748b'})),
      _tT(cx-30,cy-h/2-30,'Bar Chart',{fontSize:14,color:'#0f172a'}),
    ]
  }},
  { id:'line-graph', name:'Line Graph', icon:'📈', gen(cx,cy) {
    const pts=[{x:-120,y:30},{x:-60,y:-10},{x:0,y:20},{x:60,y:-50},{x:120,y:-30}]
    const shapes=[
      _tL(cx-130,cy+60,cx+130,cy+60), _tL(cx-130,cy-80,cx-130,cy+60),
      _tT(cx-30,cy-110,'Line Graph',{fontSize:14,color:'#0f172a'}),
    ]
    pts.forEach((p,i)=>{ if(i<pts.length-1) shapes.push(_tS('line',{x1:cx+p.x,y1:cy+p.y,x2:cx+pts[i+1].x,y2:cy+pts[i+1].y,color:'#6366f1',sw:2.5})) })
    pts.forEach(p=>shapes.push(_tE(cx+p.x,cy+p.y,5,5,{fill:true,fillColor:'#6366f1',sw:0})))
    return shapes
  }},
  { id:'scatter', name:'Scatter Plot', icon:'⋯', gen(cx,cy) {
    const dots=[[-90,40],[-60,-20],[-30,50],[0,-40],[30,20],[60,-60],[90,30],[-70,60],[70,-10]]
    return [
      _tL(cx-130,cy+70,cx+130,cy+70), _tL(cx-130,cy-80,cx-130,cy+70),
      _tT(cx-35,cy-110,'Scatter Plot',{fontSize:14,color:'#0f172a'}),
      _tT(cx-15,cy+85,'X Axis',{fontSize:10,color:'#64748b'}),
      ...dots.map(([dx,dy])=>_tE(cx+dx,cy+dy,6,6,{fill:true,fillColor:'#6366f1',sw:0})),
    ]
  }},
  { id:'pie-chart', name:'Pie Chart', icon:'🥧', gen(cx,cy) {
    const slices=[{label:'A',pct:'32%',col:C.indigo},{label:'B',pct:'28%',col:C.blue},{label:'C',pct:'24%',col:C.teal},{label:'D',pct:'16%',col:C.amber}]
    const bars=slices.map((s,i)=>_tR(cx+90,cy-50+i*30,50,22,{fill:true,fillColor:s.col,sw:0,..._lbl(`${s.label}: ${s.pct}`,10)}))
    return [
      _tE(cx-30,cy,80,80,{fill:true,fillColor:'#e0e7ff',sw:1.5,color:'#6366f1'}),
      _tL(cx-30,cy,cx-30,cy-80), _tL(cx-30,cy,cx+30,cy-10), _tL(cx-30,cy,cx+40,cy+50), _tL(cx-30,cy,cx-110,cy+30),
      _tT(cx-65,cy-110,'Pie Chart',{fontSize:14,color:'#0f172a'}),
      ...bars,
    ]
  }},
  { id:'2x2-matrix', name:'2×2 Matrix', icon:'⊞', gen(cx,cy) {
    const labels=[{x:-100,y:-90,t:'High Impact\nLow Effort'},{x:20,y:-90,t:'High Impact\nHigh Effort'},{x:-100,y:10,t:'Low Impact\nLow Effort'},{x:20,y:10,t:'Low Impact\nHigh Effort'}]
    return [
      _tR(cx-120,cy-100,220,200,{sw:0.5,color:'#e2e8f0'}),
      _tL(cx-10,cy-100,cx-10,cy+100), _tL(cx-120,cy,cx+100,cy),
      _tT(cx-60,cy-120,'Impact',{fontSize:11,color:'#64748b'}),
      _tT(cx-175,cy,'Effort',{fontSize:11,color:'#64748b'}),
      _tT(cx-75,cy-115,'2×2 Matrix',{fontSize:14,color:'#0f172a'}),
      ...labels.map(l=>_tT(cx+l.x,cy+l.y,l.t,{fontSize:10,color:'#475569'})),
    ]
  }},
  { id:'timeline', name:'Timeline', icon:'→', gen(cx,cy) {
    const pts=[-140,-70,0,70,140], years=['Year 1','Year 2','Year 3','Year 4','Year 5']
    return [
      _tA(cx-160,cy,cx+160,cy,{color:'#6366f1',sw:2}),
      ...pts.map((x,i)=>[
        _tD(cx+x-12,cy-12,24,24,{fill:true,fillColor:C.indigo,sw:0}),
        _tT(cx+x-20,cy-35,years[i],{fontSize:10,color:'#475569'}),
        _tT(cx+x-25,cy+20,`Milestone ${i+1}`,{fontSize:10,color:'#64748b'}),
      ]).flat(),
      _tT(cx-30,cy-80,'Timeline',{fontSize:14,color:'#0f172a'}),
    ]
  }},
  { id:'comparison', name:'Comparison Table', icon:'⊡', gen(cx,cy) {
    const cols=['Criteria','Option A','Option B'], rows=['Cost','Time','Quality','Complexity','Risk']
    const cw=80, rh=28, shapes=[]
    cols.forEach((c,i)=>shapes.push(_tR(cx-130+i*cw,cy-100,cw,rh,{fill:true,fillColor:i===0?C.slate:i===1?C.indigo:C.blue,sw:0,..._tLbl(c,11)})))
    rows.forEach((r,i)=>{ shapes.push(_tT(cx-125,cy-65+i*rh,r,{fontSize:10})); cols.slice(1).forEach((_,j)=>shapes.push(_tR(cx-50+j*cw,cy-72+i*rh,cw,rh,{color:'#e2e8f0',sw:0.5}))) })
    shapes.push(_tT(cx-60,cy-120,'Comparison Table',{fontSize:14,color:'#0f172a'}))
    return shapes
  }},
  { id:'decision-tree', name:'Decision Tree', icon:'◇', gen(cx,cy) {
    return [
      _tT(cx-50,cy-150,'Decision Tree',{fontSize:14,color:'#0f172a'}),
      _tD(cx-30,cy-100,60,40,{fill:true,fillColor:'#e0e7ff',..._lbl('Decision?',10)}),
      _tA(cx-20,cy-80,cx-70,cy-20), _tA(cx+20,cy-80,cx+70,cy-20),
      _tT(cx-105,cy-55,'Yes',{fontSize:10,color:'#22c55e'}), _tT(cx+75,cy-55,'No',{fontSize:10,color:'#ef4444'}),
      _tD(cx-100,cy-20,60,40,{fill:true,fillColor:'#dcfce7',..._lbl('Option A',10)}),
      _tD(cx+40,cy-20,60,40,{fill:true,fillColor:'#fee2e2',..._lbl('Option B',10)}),
      _tA(cx-70,cy+20,cx-70,cy+60), _tA(cx+70,cy+20,cx+70,cy+60),
      _tR(cx-100,cy+60,60,30,{fill:true,fillColor:'#22c55e',sw:0,..._lbl('Outcome 1',10)}),
      _tR(cx+40,cy+60,60,30,{fill:true,fillColor:'#ef4444',sw:0,..._lbl('Outcome 2',10)}),
    ]
  }},
  { id:'flowchart', name:'Flowchart', icon:'◇', gen(cx,cy) {
    return [
      _tT(cx-30,cy-155,'Flowchart',{fontSize:14,color:'#0f172a'}),
      _tE(cx,cy-110,50,22,{fill:true,fillColor:'#22c55e',sw:0,..._lbl('Start',11)}),
      _tA(cx,cy-88,cx,cy-58),
      _tR(cx-45,cy-58,90,30,{fill:true,fillColor:'#e0e7ff',sw:0,..._lbl('Process',11)}),
      _tA(cx,cy-28,cx,cy+2),
      _tD(cx-45,cy+2,90,36,{fill:true,fillColor:'#fef9c3',sw:0,..._lbl('Decision?',11)}),
      _tA(cx,cy+38,cx,cy+60), _tA(cx+45,cy+20,cx+100,cy+20),
      _tT(cx+108,cy+16,'No',{fontSize:10,color:'#ef4444'}),
      _tT(cx+5,cy+44,'Yes',{fontSize:10,color:'#22c55e'}),
      _tR(cx-45,cy+60,90,30,{fill:true,fillColor:'#e0e7ff',sw:0,..._lbl('Process 2',11)}),
      _tA(cx,cy+90,cx,cy+115),
      _tE(cx,cy+115,50,22,{fill:true,fillColor:'#ef4444',sw:0,..._lbl('End',11)}),
    ]
  }},
  { id:'swot', name:'SWOT Analysis', icon:'⊕', gen(cx,cy) {
    const quads=[{dx:-65,dy:-55,col:'#dcfce7',label:'Strengths\n+ list here'},{dx:65,dy:-55,col:'#fee2e2',label:'Weaknesses\n– list here'},{dx:-65,dy:55,col:'#dbeafe',label:'Opportunities\n+ list here'},{dx:65,dy:55,col:'#fef9c3',label:'Threats\n– list here'}]
    return [
      _tR(cx-135,cy-110,270,220,{color:'#e2e8f0',sw:0.5}),
      _tL(cx,cy-110,cx,cy+110), _tL(cx-135,cy,cx+135,cy),
      _tT(cx-115,cy-120,'SWOT Analysis',{fontSize:14,color:'#0f172a'}),
      ...quads.map(q=>_tR(cx+q.dx-65,cy+q.dy-50,130,100,{fill:true,fillColor:q.col,sw:0.5,..._tLbl(q.label,10)})),
    ]
  }},
]

const _WB_FIGURES = [
  { id:'venn2', name:'Venn (2)', icon:'◎', gen(cx,cy) {
    return [
      _tT(cx-35,cy-130,'Venn Diagram',{fontSize:14,color:'#0f172a'}),
      _tE(cx-40,cy,70,70,{fill:true,fillColor:'#818cf870',sw:1.5,color:'#6366f1'}),
      _tE(cx+40,cy,70,70,{fill:true,fillColor:'#34d39970',sw:1.5,color:'#059669'}),
      _tT(cx-75,cy-5,'Set A',{fontSize:11,color:'#4f46e5'}), _tT(cx+55,cy-5,'Set B',{fontSize:11,color:'#059669'}),
      _tT(cx-20,cy-5,'Both',{fontSize:10,color:'#475569'}),
    ]
  }},
  { id:'venn3', name:'Venn (3)', icon:'⊛', gen(cx,cy) {
    return [
      _tT(cx-35,cy-145,'Venn (3 Sets)',{fontSize:14,color:'#0f172a'}),
      _tE(cx,cy-55,65,65,{fill:true,fillColor:'#818cf860',sw:1.5,color:'#6366f1'}),
      _tE(cx-55,cy+30,65,65,{fill:true,fillColor:'#34d39960',sw:1.5,color:'#059669'}),
      _tE(cx+55,cy+30,65,65,{fill:true,fillColor:'#fbbf2460',sw:1.5,color:'#d97706'}),
      _tT(cx-15,cy-120,'A',{fontSize:12,color:'#4f46e5'}), _tT(cx-100,cy+55,'B',{fontSize:12,color:'#059669'}), _tT(cx+85,cy+55,'C',{fontSize:12,color:'#d97706'}),
    ]
  }},
  { id:'fishbone', name:'Fishbone', icon:'⊸', gen(cx,cy) {
    const branches=[[-130,-40,cx-60,cy,'Cause 1'],[130,-40,cx+60,cy,'Cause 2'],[-130,40,cx-60,cy,'Cause 3'],[130,40,cx+60,cy,'Cause 4'],[-60,-40,cx-20,cy,'Cause 5'],[60,-40,cx+20,cy,'Cause 6']]
    return [
      _tT(cx-55,cy-130,'Fishbone Diagram',{fontSize:14,color:'#0f172a'}),
      _tA(cx-160,cy,cx+130,cy,{color:'#1e293b',sw:2}),
      _tD(cx+100,cy-20,70,40,{fill:true,fillColor:'#fee2e2',..._lbl('Effect',11)}),
      ...branches.map(([dx,dy,tx,ty,lbl])=>[
        _tL(cx+dx,cy+dy,tx,ty,{color:'#94a3b8',sw:1}),
        _tT(cx+dx-25,cy+dy+(dy<0?-18:8),lbl,{fontSize:10}),
      ]).flat(),
    ]
  }},
  { id:'mind-map', name:'Mind Map', icon:'✦', gen(cx,cy) {
    const branches=[[-130,-60,'Branch A'],[-140,0,'Branch B'],[-130,60,'Branch C'],[130,-60,'Branch D'],[140,0,'Branch E'],[130,60,'Branch F']]
    return [
      _tE(cx,cy,55,30,{fill:true,fillColor:'#e0e7ff',sw:1.5,..._lbl('Central\nIdea',11)}),
      ...branches.map(([dx,dy,lbl])=>[
        _tL(cx+(dx>0?55:-55),cy,cx+dx,cy+dy,{color:'#94a3b8',sw:1.5}),
        _tR(cx+dx+(dx>0?0:-80),cy+dy-15,80,30,{fill:true,fillColor:'#f8fafc',sw:1,..._tLbl(lbl,11)}),
      ]).flat(),
      _tT(cx-30,cy-120,'Mind Map',{fontSize:14,color:'#0f172a'}),
    ]
  }},
  { id:'kanban', name:'Kanban', icon:'▦', gen(cx,cy) {
    const cols=[{x:-130,label:'To Do',col:'#fee2e2'},{x:0,label:'In Progress',col:'#fef9c3'},{x:130,label:'Done',col:'#dcfce7'}]
    const tasks=[{col:0,y:-30,t:'Task 1'},{col:0,y:10,t:'Task 2'},{col:1,y:-30,t:'Task 3'},{col:2,y:-30,t:'Task 4'},{col:2,y:10,t:'Task 5'}]
    return [
      _tT(cx-30,cy-135,'Kanban Board',{fontSize:14,color:'#0f172a'}),
      ...cols.map(c=>[
        _tR(cx+c.x-55,cy-110,110,210,{color:'#e2e8f0',sw:0.5,fill:true,fillColor:'#f8fafc'}),
        _tR(cx+c.x-50,cy-105,100,28,{fill:true,fillColor:c.col,sw:0,..._tLbl(c.label,11)}),
      ]).flat(),
      ...tasks.map(t=>_tR(cx+cols[t.col].x-48,cy+t.y-10,96,28,{fill:true,fillColor:'#fff',sw:1,color:'#e2e8f0',..._tLbl(t.t,10)})),
    ]
  }},
  { id:'research-flow', name:'Research Flow', icon:'⟶', gen(cx,cy) {
    const boxes=[{y:-90,t:'Research\nQuestion',col:'#e0e7ff'},{y:-30,t:'Hypothesis',col:'#fef9c3'},{y:30,t:'Methodology',col:'#dcfce7'},{y:90,t:'Results &\nAnalysis',col:'#fce7f3'}]
    return [
      _tT(cx-55,cy-135,'Research Framework',{fontSize:14,color:'#0f172a'}),
      ...boxes.map((b,i)=>[
        _tR(cx-65,cy+b.y-20,130,40,{fill:true,fillColor:b.col,sw:0,..._tLbl(b.t,11)}),
        ...(i<boxes.length-1?[_tA(cx,cy+b.y+20,cx,cy+boxes[i+1].y-20,{color:'#6366f1',sw:2})]:[] ),
      ]).flat(),
    ]
  }},
  { id:'funnel', name:'Funnel', icon:'▽', gen(cx,cy) {
    const layers=[{w:220,label:'Awareness',col:'#dbeafe'},{w:170,label:'Interest',col:'#bfdbfe'},{w:120,label:'Decision',col:'#93c5fd'},{w:70,label:'Action',col:'#60a5fa'}]
    return [
      _tT(cx-25,cy-130,'Funnel',{fontSize:14,color:'#0f172a'}),
      ...layers.map((l,i)=>_tS('triangle',{x1:cx,y1:cy-80+i*50,x2:cx-l.w/2,y2:cy-80+i*50+50,x3:cx+l.w/2,y3:cy-80+i*50+50,color:'#6366f1',sw:1,fill:true,fillColor:l.col,..._tLbl(l.label,11)})),
    ]
  }},
  { id:'cycle', name:'Cycle Diagram', icon:'↻', gen(cx,cy) {
    const items=[{a:-90,t:'Plan'},{a:0,t:'Do'},{a:90,t:'Check'},{a:180,t:'Act'}]
    const r=75
    return [
      _tT(cx-35,cy-130,'Cycle Diagram',{fontSize:14,color:'#0f172a'}),
      ...items.map(({a,t})=>{
        const rad=a*Math.PI/180, rx=cx+Math.cos(rad)*r, ry=cy+Math.sin(rad)*r
        return [
          _tR(rx-35,ry-18,70,36,{fill:true,fillColor:'#e0e7ff',sw:1,..._tLbl(t,12)}),
          _tA(rx+Math.cos((a+15)*Math.PI/180)*50,ry+Math.sin((a+15)*Math.PI/180)*50,
             rx+Math.cos((a+75)*Math.PI/180)*50,ry+Math.sin((a+75)*Math.PI/180)*50,
             {color:'#6366f1',sw:1.5}),
        ]
      }).flat(),
    ]
  }},
  { id:'t-chart', name:'T-Chart', icon:'⊢', gen(cx,cy) {
    return [
      _tT(cx-30,cy-130,'T-Chart',{fontSize:14,color:'#0f172a'}),
      _tR(cx-140,cy-100,280,200,{color:'#e2e8f0',sw:0.5}),
      _tL(cx,cy-100,cx,cy+100), _tL(cx-140,cy-70,cx+140,cy-70),
      _tR(cx-135,cy-95,130,30,{fill:true,fillColor:'#e0e7ff',sw:0,..._lbl('Pros / For',11)}),
      _tR(cx+5,cy-95,130,30,{fill:true,fillColor:'#fee2e2',sw:0,..._lbl('Cons / Against',11)}),
      ...[0,1,2,3].map(i=>[
        _tT(cx-130,cy-55+i*35,`•`,{fontSize:16,color:'#22c55e'}),
        _tT(cx+10,cy-55+i*35,`•`,{fontSize:16,color:'#ef4444'}),
      ]).flat(),
    ]
  }},
  { id:'pyramid', name:'Pyramid', icon:'△', gen(cx,cy) {
    const layers=[{w:240,h:40,label:'Base Level',col:'#dbeafe'},{w:180,h:40,label:'Level 2',col:'#93c5fd'},{w:120,h:40,label:'Level 3',col:'#3b82f6'},{w:60,h:40,label:'Top',col:'#1d4ed8'}]
    return [
      _tT(cx-25,cy-135,'Pyramid',{fontSize:14,color:'#0f172a'}),
      ...layers.map((l,i)=>_tR(cx-l.w/2,cy-80+i*l.h,l.w,l.h,{fill:true,fillColor:l.col,sw:0.5,..._tLbl(l.label,11)})),
    ]
  }},
]

// Returns the template items for the current tab (including saved)
let _wbCustomTemplates = []
async function _wbLoadCustomTemplates() {
  _wbCustomTemplates = (await api.storeGet('wbCustomTemplates')) || []
}

function _wbTplItems() {
  if (_wbTplTab === 'graph')  return _WB_GRAPHS
  if (_wbTplTab === 'figure') return _WB_FIGURES
  return _wbCustomTemplates.map((t,i) => ({ id:`custom-${i}`, name:t.name, icon:'💾', gen:null }))
}

// Insert a template centered on the current view
function wbInsertTemplate(id) {
  if (!_wb) return
  const customIdx = id.startsWith('custom-') ? parseInt(id.slice(7)) : -1
  let shapes
  if (customIdx >= 0) {
    const saved = _wbCustomTemplates[customIdx]
    if (!saved) return
    // Offset saved shapes to current view center
    const cx = (_wbCanvas.offsetWidth  / 2 - _wbPanX) / _wbZoom
    const cy = (_wbCanvas.offsetHeight / 2 - _wbPanY) / _wbZoom
    const bbox = saved.shapes.reduce((b,s) => {
      const bb = _wbBBox(s)
      return { x:Math.min(b.x,bb.x), y:Math.min(b.y,bb.y), x2:Math.max(b.x2,bb.x+bb.w), y2:Math.max(b.y2,bb.y+bb.h) }
    }, { x:Infinity, y:Infinity, x2:-Infinity, y2:-Infinity })
    const ox = cx - (bbox.x + bbox.x2) / 2
    const oy = cy - (bbox.y + bbox.y2) / 2
    shapes = saved.shapes.map(s => {
      const n = JSON.parse(JSON.stringify(s))
      n.id = 'ws-' + uid()
      ;['x','x1','x2','x3','cx'].forEach(k => { if (n[k] != null) n[k] += ox })
      ;['y','y1','y2','y3','cy'].forEach(k => { if (n[k] != null) n[k] += oy })
      if (n.points) n.points = n.points.map(p => ({ x:p.x+ox, y:p.y+oy }))
      return n
    })
  } else {
    const tpl = [..._WB_GRAPHS, ..._WB_FIGURES].find(t => t.id === id)
    if (!tpl) return
    const cx = (_wbCanvas.offsetWidth  / 2 - _wbPanX) / _wbZoom
    const cy = (_wbCanvas.offsetHeight / 2 - _wbPanY) / _wbZoom
    shapes = tpl.gen(cx, cy)
  }
  _wbPushUndo()
  if (!_wb.shapes) _wb.shapes = []
  shapes.forEach(s => _wb.shapes.push(s))
  saveWb(); _wbRender()
  showToast('Template inserted ✓')
}

// Save current selection (or all shapes) as a custom template
async function wbSaveAsTemplate() {
  const ids   = _wbSelIds.length > 1 ? _wbSelIds : (_wbSelId ? [_wbSelId] : null)
  const source = ids
    ? (_wb.shapes||[]).filter(s => ids.includes(s.id))
    : (_wb.shapes||[])
  if (!source.length) { showToast('Select shapes first, or draw something', 'error'); return }

  openModal(`
  <h3 class="text-base font-bold text-slate-900 mb-3">💾 Save as template</h3>
  <label class="label">Template name</label>
  <input id="wb-tpl-name" type="text" class="input mb-4" placeholder="e.g. My Experiment Flow"
    onkeydown="if(event.key==='Enter')wbSaveTemplateConfirm()"/>
  <div class="flex gap-2 justify-end">
    <button onclick="closeModal()" class="btn-secondary text-xs py-2 px-4">Cancel</button>
    <button onclick="wbSaveTemplateConfirm()" class="btn-primary text-xs py-2 px-4">Save</button>
  </div>`)
  setTimeout(() => document.getElementById('wb-tpl-name')?.focus(), 60)
  window._wbSaveTplShapes = source
}

async function wbSaveTemplateConfirm() {
  const name = document.getElementById('wb-tpl-name')?.value.trim()
  if (!name) { showToast('Enter a name', 'error'); return }
  const shapes = window._wbSaveTplShapes || []
  const saved  = [..._wbCustomTemplates, { name, shapes: JSON.parse(JSON.stringify(shapes)), savedAt: new Date().toISOString() }]
  _wbCustomTemplates = saved
  await api.storeSet('wbCustomTemplates', saved)
  closeModal()
  _wbTplTab = 'saved'
  render_whiteboard()
  showToast(`"${name}" saved as template ✓`)
}

// ══ Chart Shape — Data-driven charts ══════════════════════════════════════════

const _WB_CHART_PALETTE = ['#6366f1','#22d3ee','#a3e635','#fb923c','#f472b6','#34d399','#fbbf24','#f87171']

function _wbNiceTicks(min, max, n) {
  if (max === 0) return [0, 1, 2, 3, 4, 5]
  const raw = (max - min) / (n - 1)
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1,2,2.5,5,10].map(f=>f*mag).find(s=>s>=raw) || mag*10
  const lo = Math.floor(min/step)*step
  const ticks = []
  for (let t=lo; t<=max+step*0.01; t+=step) ticks.push(Math.round(t*1e9)/1e9)
  return ticks
}

function _wbFmtN(n) {
  if (Math.abs(n) >= 1e6) return (n/1e6).toFixed(1).replace(/\.0$/,'')+'M'
  if (Math.abs(n) >= 1e3) return (n/1e3).toFixed(1).replace(/\.0$/,'')+'k'
  return String(Number.isInteger(n) ? n : n.toFixed(2).replace(/\.?0+$/,''))
}

function _wbChartNums(data) {
  const rows = data?.rows || []
  const headers = data?.headers || []
  const seriesCols = headers.slice(1).map((_,i) => rows.map(r => parseFloat(r[i+1]) || 0))
  return seriesCols
}

function _wbDrawChart(ctx, s) {
  const { x, y, w, h, chartType = 'bar', data, title } = s
  ctx.save()
  // White background + border
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h)

  if (!data?.rows?.length || !data?.headers?.length) {
    // Empty state
    ctx.fillStyle = '#94a3b8'; ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('No data — click "Edit Data"', x+w/2, y+h/2)
    ctx.restore(); return
  }

  if (title) {
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 11px system-ui, sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    ctx.fillText(title.slice(0,50), x+w/2, y+6)
  }

  try {
    switch(chartType) {
      case 'bar':     _wbRenderBar(ctx, s);     break
      case 'line':    _wbRenderLine(ctx, s);    break
      case 'scatter': _wbRenderScatter(ctx, s); break
      case 'pie':     _wbRenderPie(ctx, s);     break
      default:        _wbRenderBar(ctx, s)
    }
  } catch {}
  ctx.restore()
}

function _wbChartMargins(s) {
  const MT = (s.title ? 26 : 10), MB = 32, ML = 46, MR = 14
  const cw = s.w - ML - MR, ch = s.h - MT - MB
  return { MT, MB, ML, MR, cw, ch, ox: s.x+ML, oy: s.y+MT+ch }
}

function _wbRenderBar(ctx, s) {
  const { MT, ML, cw, ch, ox, oy } = _wbChartMargins(s)
  const { data } = s
  const headers = data.headers || []
  const rows = data.rows || []
  const sc = Math.max(1, headers.length - 1)
  const allVals = rows.flatMap(r => Array.from({length:sc},(_,i)=>parseFloat(r[i+1])||0))
  const maxV = Math.max(...allVals, 0) || 1
  const ticks = _wbNiceTicks(0, maxV, 5)
  const axMax = ticks[ticks.length-1]

  // Grid + Y axis labels
  ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 0.5
  ctx.fillStyle = '#64748b'; ctx.font = '9px system-ui'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
  ticks.forEach(t => {
    const ty = oy - (t/axMax)*ch
    ctx.beginPath(); ctx.moveTo(ox,ty); ctx.lineTo(ox+cw,ty); ctx.stroke()
    ctx.fillText(_wbFmtN(t), ox-3, ty)
  })
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(ox,s.y+MT); ctx.lineTo(ox,oy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+cw,oy); ctx.stroke()

  // Bars
  const gw = cw / rows.length
  const pad = Math.max(2, gw*0.12), bw = (gw - pad*2) / sc
  rows.forEach((row, gi) => {
    for (let si=0; si<sc; si++) {
      const v = parseFloat(row[si+1])||0
      const bh = (v/axMax)*ch
      const bx = ox + gi*gw + pad + si*bw
      ctx.fillStyle = _WB_CHART_PALETTE[si % _WB_CHART_PALETTE.length]
      ctx.fillRect(bx, oy-bh, Math.max(1,bw-1), bh)
    }
    ctx.fillStyle = '#64748b'; ctx.font = '9px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    ctx.fillText(String(row[0]||'').slice(0,8), ox+gi*gw+gw/2, oy+4)
  })
  _wbChartLegend(ctx, s, headers.slice(1), { x:s.x+ML, y:s.y+MT-12 })
}

function _wbRenderLine(ctx, s) {
  const { MT, ML, cw, ch, ox, oy } = _wbChartMargins(s)
  const { data } = s
  const headers = data.headers || []
  const rows = data.rows || []
  const sc = Math.max(1, headers.length - 1)
  const allVals = rows.flatMap(r => Array.from({length:sc},(_,i)=>parseFloat(r[i+1])||0))
  const maxV = Math.max(...allVals, 0) || 1; const minV = Math.min(0, ...allVals)
  const ticks = _wbNiceTicks(minV, maxV, 5)
  const axMax = ticks[ticks.length-1]; const axMin = ticks[0]
  const range = axMax - axMin || 1

  ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 0.5
  ctx.fillStyle = '#64748b'; ctx.font = '9px system-ui'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
  ticks.forEach(t => {
    const ty = oy - ((t-axMin)/range)*ch
    ctx.beginPath(); ctx.moveTo(ox,ty); ctx.lineTo(ox+cw,ty); ctx.stroke()
    ctx.fillText(_wbFmtN(t), ox-3, ty)
  })
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(ox,s.y+MT); ctx.lineTo(ox,oy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+cw,oy); ctx.stroke()

  const xStep = rows.length > 1 ? cw/(rows.length-1) : cw
  for (let si=0; si<sc; si++) {
    const col = _WB_CHART_PALETTE[si % _WB_CHART_PALETTE.length]
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath()
    rows.forEach((row,ri) => {
      const v = parseFloat(row[si+1])||0
      const px = ox + ri*xStep, py = oy - ((v-axMin)/range)*ch
      ri===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py)
    })
    ctx.stroke()
    rows.forEach((row,ri) => {
      const v = parseFloat(row[si+1])||0
      const px = ox + ri*xStep, py = oy - ((v-axMin)/range)*ch
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2); ctx.fill()
    })
  }
  rows.forEach((row,ri) => {
    ctx.fillStyle = '#64748b'; ctx.font = '9px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    ctx.fillText(String(row[0]||'').slice(0,8), ox+ri*xStep, oy+4)
  })
  _wbChartLegend(ctx, s, headers.slice(1), { x:s.x+ML, y:s.y+MT-12 })
}

function _wbRenderScatter(ctx, s) {
  const { MT, ML, cw, ch, ox, oy } = _wbChartMargins(s)
  const { data } = s
  const rows = (data?.rows||[]).map(r=>[parseFloat(r[0])||0, parseFloat(r[1])||0])
  if (!rows.length) return
  const xs = rows.map(r=>r[0]), ys = rows.map(r=>r[1])
  const xMax=Math.max(...xs)||1, yMax=Math.max(...ys)||1
  const xMin=Math.min(...xs), yMin=Math.min(0,...ys)
  const xRange=xMax-xMin||1, yRange=yMax-yMin||1

  ctx.strokeStyle='#cbd5e1'; ctx.lineWidth=1
  ctx.beginPath(); ctx.moveTo(ox,s.y+MT); ctx.lineTo(ox,oy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+cw,oy); ctx.stroke()

  ctx.fillStyle = _WB_CHART_PALETTE[0]
  rows.forEach(([x0,y0]) => {
    const px = ox+(x0-xMin)/xRange*cw, py = oy-(y0-yMin)/yRange*ch
    ctx.beginPath(); ctx.arc(px,py,4,0,Math.PI*2); ctx.fill()
  })
  ctx.fillStyle='#64748b'; ctx.font='9px system-ui'; ctx.textAlign='center'; ctx.textBaseline='top'
  const xLabel=(data?.headers||[])[0]||'X'
  const yLabel=(data?.headers||[])[1]||'Y'
  ctx.fillText(xLabel, ox+cw/2, oy+4)
  ctx.save(); ctx.translate(ox-30, s.y+MT+ch/2); ctx.rotate(-Math.PI/2)
  ctx.fillText(yLabel, 0, 0); ctx.restore()
}

function _wbRenderPie(ctx, s) {
  const { data } = s
  const rows = data?.rows || []
  if (!rows.length) return
  const labels = rows.map(r=>String(r[0]||''))
  const vals   = rows.map(r=>Math.abs(parseFloat(r[1])||0))
  const total  = vals.reduce((a,b)=>a+b,0) || 1

  const legW = Math.min(90, s.w*0.28)
  const cx = s.x + (s.w - legW)/2, cy = s.y + s.h/2
  const r  = Math.min((s.w - legW)/2 - 16, s.h/2 - 20)
  if (r < 10) return

  let angle = -Math.PI/2
  vals.forEach((v,i) => {
    const slice = (v/total) * Math.PI*2
    const col = _WB_CHART_PALETTE[i % _WB_CHART_PALETTE.length]
    ctx.fillStyle = col; ctx.beginPath()
    ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,angle,angle+slice); ctx.closePath(); ctx.fill()
    ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke()
    // Percentage label inside slice
    const mid = angle + slice/2
    if (slice > 0.3) {
      ctx.fillStyle='#fff'; ctx.font='bold 9px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle'
      ctx.fillText(Math.round(v/total*100)+'%', cx+Math.cos(mid)*r*0.65, cy+Math.sin(mid)*r*0.65)
    }
    angle += slice
  })

  // Legend
  const lx = s.x + s.w - legW + 4, ly0 = s.y + s.h/2 - (labels.length*14)/2
  labels.forEach((lbl,i) => {
    const col = _WB_CHART_PALETTE[i % _WB_CHART_PALETTE.length]
    ctx.fillStyle=col; ctx.fillRect(lx, ly0+i*14, 8, 8)
    ctx.fillStyle='#475569'; ctx.font='9px system-ui'; ctx.textAlign='left'; ctx.textBaseline='top'
    ctx.fillText(lbl.slice(0,12), lx+10, ly0+i*14)
  })
}

function _wbChartLegend(ctx, s, labels, pos) {
  if (labels.length <= 1) return
  let lx = pos.x
  ctx.font = '9px system-ui'; ctx.textBaseline = 'top'
  labels.forEach((lbl,i) => {
    const col = _WB_CHART_PALETTE[i % _WB_CHART_PALETTE.length]
    ctx.fillStyle=col; ctx.fillRect(lx, pos.y, 7, 7)
    ctx.fillStyle='#475569'; ctx.textAlign='left'
    ctx.fillText((lbl||'').slice(0,12), lx+9, pos.y)
    lx += 9 + Math.min(80, (lbl||'').length*5.5) + 8
    if (lx > s.x + s.w - 20) return
  })
}

// ── Chart insertion ──────────────────────────────────────────────────────────
function wbInsertChart(chartType) {
  if (!_wb) return
  const cx = (_wbCanvas.offsetWidth  / 2 - _wbPanX) / _wbZoom
  const cy = (_wbCanvas.offsetHeight / 2 - _wbPanY) / _wbZoom
  const w = 380, h = 260
  _wbPushUndo()
  const shape = {
    id: 'ws-' + uid(), type:'chart', chartType,
    x: cx-w/2, y: cy-h/2, w, h,
    title: chartType.charAt(0).toUpperCase()+chartType.slice(1)+' Chart',
    data: { headers:['Category','Value'], rows:[['A',10],['B',20],['C',15],['D',25]] },
    sourceFile: null, sourceSheet: 0,
  }
  _wb.shapes.push(shape)
  _wbSelId = shape.id
  saveWb(); _wbRender()
  // Open data editor immediately
  wbEditChartData(shape.id)
}

// ── Data editor (modal spreadsheet) ──────────────────────────────────────────
function wbEditChartData(id) {
  const shape = (_wb?.shapes||[]).find(s=>s.id===id)
  if (!shape || shape.type !== 'chart') return

  const renderGrid = (data) => {
    const h = data.headers || []
    const r = data.rows || []
    const colCount = Math.max(h.length, r.reduce((m,rr)=>Math.max(m,rr.length),0))
    const extCols = Math.max(colCount, 3)  // always show at least 3 columns

    const headerRow = Array.from({length:extCols},(_,i)=>`
      <td class="p-0"><input type="text" value="${esc(String(h[i]||''))}"
        oninput="wbChartHeaderEdit('${id}',${i},this.value)"
        class="w-full h-7 px-1.5 text-xs font-semibold bg-slate-50 border-b border-r border-slate-200 outline-none focus:bg-indigo-50 text-slate-700"/></td>`).join('')

    const dataRows = [...r, ...Array(Math.max(0, 5-r.length)).fill(null)].map((row,ri)=>{
      const cells = Array.from({length:extCols},(_,ci)=>`
        <td class="p-0"><input type="text" value="${esc(String(row?.[ci]??''))}"
          oninput="wbChartCellEdit('${id}',${ri},${ci},this.value)"
          class="w-full h-7 px-1.5 text-xs border-b border-r border-slate-200 outline-none focus:bg-indigo-50 text-slate-700"/></td>`).join('')
      return `<tr>${cells}</tr>`
    }).join('')

    return `<table class="border-collapse w-full text-xs" style="min-width:320px">
      <thead><tr>${headerRow}</tr></thead>
      <tbody>${dataRows}</tbody>
    </table>`
  }

  const d = shape.data || { headers:['Category','Value'], rows:[] }
  openModal(`
  <div class="flex items-center justify-between mb-3">
    <h3 class="text-sm font-bold text-slate-900">📊 Chart Data — ${esc(shape.title||'')}</h3>
    <div class="flex gap-2">
      <select id="wbed-type" onchange="wbChartChangeType('${id}',this.value)" class="text-xs border border-slate-200 rounded px-2 py-1 bg-white">
        ${['bar','line','scatter','pie'].map(t=>`<option value="${t}" ${shape.chartType===t?'selected':''}>${t.charAt(0).toUpperCase()+t.slice(1)}</option>`).join('')}
      </select>
      <input id="wbed-title" type="text" value="${esc(shape.title||'')}" placeholder="Chart title"
        oninput="wbChartChangeTitle('${id}',this.value)"
        class="text-xs border border-slate-200 rounded px-2 py-1 w-36"/>
    </div>
  </div>

  <div class="overflow-auto mb-3" style="max-height:260px" id="wbed-grid">
    ${renderGrid(d)}
  </div>

  <div class="flex items-center gap-2 mb-3">
    <button onclick="wbChartAddRow('${id}')" class="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded">+ Row</button>
    <button onclick="wbChartAddCol('${id}')" class="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded">+ Column</button>
    <button onclick="wbChartRemoveLastRow('${id}')" class="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-rose-500">− Row</button>
    <div class="flex-1"></div>
    <button onclick="wbImportChartFile('${id}')" class="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium">📂 Import Excel / CSV / PDF</button>
  </div>

  ${shape.sourceFile ? `
  <div class="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded p-2 mb-2">
    <span>🔗 Linked: <strong>${esc(shape.sourceFile.split(/[\\/]/).pop())}</strong></span>
    <button onclick="wbUnlinkChartFile('${id}')" class="ml-auto text-rose-400 hover:text-rose-600">Unlink</button>
  </div>` : ''}

  <div class="flex justify-end gap-2">
    <button onclick="closeModal()" class="btn-secondary text-xs py-2 px-4">Close</button>
  </div>`)
}

// Chart data edit helpers — live-update while modal is open
function wbChartHeaderEdit(id, col, val) {
  const s = (_wb?.shapes||[]).find(s=>s.id===id); if(!s) return
  if (!s.data) s.data = { headers:[], rows:[] }
  while (s.data.headers.length <= col) s.data.headers.push('')
  s.data.headers[col] = val
  saveWb(); _wbRender()
}

function wbChartCellEdit(id, row, col, val) {
  const s = (_wb?.shapes||[]).find(s=>s.id===id); if(!s) return
  if (!s.data) s.data = { headers:[], rows:[] }
  while (s.data.rows.length <= row) s.data.rows.push([])
  while (s.data.rows[row].length <= col) s.data.rows[row].push('')
  s.data.rows[row][col] = val.trim() === '' ? '' : (isNaN(parseFloat(val)) ? val : parseFloat(val))
  // Strip trailing empty rows
  while (s.data.rows.length && s.data.rows[s.data.rows.length-1].every(c=>c===''||c===undefined)) s.data.rows.pop()
  saveWb(); _wbRender()
}

function wbChartChangeType(id, type) {
  const s = (_wb?.shapes||[]).find(s=>s.id===id); if(!s) return
  s.chartType = type; saveWb(); _wbRender()
}

function wbChartChangeTitle(id, val) {
  const s = (_wb?.shapes||[]).find(s=>s.id===id); if(!s) return
  s.title = val; saveWb(); _wbRender()
}

function wbChartAddRow(id) {
  const s = (_wb?.shapes||[]).find(s=>s.id===id); if(!s) return
  const cols = (s.data?.headers||[]).length || 2
  s.data.rows.push(Array(cols).fill(''))
  saveWb(); _wbRender()
  // Refresh modal grid
  const gridEl = document.getElementById('wbed-grid')
  if (gridEl) {
    const d = s.data || { headers:[], rows:[] }
    const cols2 = Math.max((d.headers||[]).length, d.rows.reduce((m,r)=>Math.max(m,r.length),0), 3)
    const extCols = cols2
    const headerRow = Array.from({length:extCols},(_,i)=>`<td class="p-0"><input type="text" value="${esc(String((d.headers||[])[i]||''))}" oninput="wbChartHeaderEdit('${id}',${i},this.value)" class="w-full h-7 px-1.5 text-xs font-semibold bg-slate-50 border-b border-r border-slate-200 outline-none focus:bg-indigo-50 text-slate-700"/></td>`).join('')
    const dataRows = [...(d.rows||[]),...Array(Math.max(0,5-(d.rows||[]).length)).fill(null)].map((row,ri)=>{
      const cells = Array.from({length:extCols},(_,ci)=>`<td class="p-0"><input type="text" value="${esc(String(row?.[ci]??''))}" oninput="wbChartCellEdit('${id}',${ri},${ci},this.value)" class="w-full h-7 px-1.5 text-xs border-b border-r border-slate-200 outline-none focus:bg-indigo-50 text-slate-700"/></td>`).join('')
      return `<tr>${cells}</tr>`
    }).join('')
    gridEl.innerHTML = `<table class="border-collapse w-full text-xs" style="min-width:320px"><thead><tr>${headerRow}</tr></thead><tbody>${dataRows}</tbody></table>`
  }
}

function wbChartAddCol(id) {
  const s = (_wb?.shapes||[]).find(s=>s.id===id); if(!s) return
  s.data.headers.push(`Col ${s.data.headers.length+1}`)
  s.data.rows.forEach(r=>r.push(''))
  saveWb(); _wbRender(); wbEditChartData(id)
}

function wbChartRemoveLastRow(id) {
  const s = (_wb?.shapes||[]).find(s=>s.id===id); if(!s||!s.data?.rows?.length) return
  s.data.rows.pop(); saveWb(); _wbRender(); wbEditChartData(id)
}

// ── File import for charts ─────────────────────────────────────────────────────
async function wbImportChartFile(id) {
  const shape = (_wb?.shapes||[]).find(s=>s.id===id)
  if (!shape) return
  const fp = await api.openSpreadsheetDialog()
  if (!fp) return

  const ext = fp.split('.').pop().toLowerCase()
  let res
  if (ext === 'pdf') {
    res = await api.readPdfTable(fp)
  } else {
    res = await api.readSpreadsheet(fp)
  }

  if (!res?.ok) { showToast('Could not read file: '+(res?.error||'unknown error'), 'error'); return }

  // If multiple sheets, pick the first; show sheet picker if multiple
  const sheets = res.sheets || []
  if (!sheets.length) { showToast('No data found in file', 'error'); return }

  if (sheets.length > 1) {
    // Show sheet selector
    openModal(`
    <h3 class="text-sm font-bold text-slate-900 mb-3">Choose Sheet</h3>
    <div class="space-y-2">
      ${sheets.map((sh,i)=>`
      <button onclick="wbApplyChartSheet('${id}','${fp}',${i});closeModal()"
        class="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-sm transition-colors">
        ${esc(sh.name)} <span class="text-xs text-slate-400 ml-2">${sh.rows?.length||0} rows × ${sh.headers?.length||0} cols</span>
      </button>`).join('')}
    </div>`)
    window._wbPendingSheets = { id, fp, sheets }
  } else {
    _wbApplySheet(id, fp, sheets[0])
    showToast(`Loaded ${sheets[0].rows.length} rows from ${fp.split(/[\\/]/).pop()} ✓`)
  }
}

function wbApplyChartSheet(id, fp, sheetIdx) {
  const pending = window._wbPendingSheets
  if (!pending) return
  _wbApplySheet(id, fp, pending.sheets[sheetIdx])
  showToast(`Loaded ${pending.sheets[sheetIdx].rows.length} rows ✓`)
}

function _wbApplySheet(id, fp, sheet) {
  const shape = (_wb?.shapes||[]).find(s=>s.id===id)
  if (!shape) return
  shape.data = { headers: sheet.headers, rows: sheet.rows }
  shape.sourceFile = fp
  shape.sourceSheet = 0
  saveWb(); _wbRender()
  // Start file watcher
  api.watchDataFile(fp)
  // Refresh modal if open
  if (document.getElementById('wbed-grid')) wbEditChartData(id)
  // Update selection bar
  _wbUpdateSelBar()
}

function wbUnlinkChartFile(id) {
  const shape = (_wb?.shapes||[]).find(s=>s.id===id)
  if (!shape) return
  if (shape.sourceFile) api.unwatchDataFile(shape.sourceFile)
  shape.sourceFile = null; shape.sourceSheet = null
  saveWb(); _wbRender(); _wbUpdateSelBar()
  if (document.getElementById('wbed-grid')) wbEditChartData(id)
  showToast('File link removed')
}

// ── Live file watcher — update charts when linked file changes ───────────────
;(function _wbInitDataWatcher() {
  if (window._wbDataWatcherInited) return
  window._wbDataWatcherInited = true
  api.onDataFileChanged && api.onDataFileChanged(async (fp) => {
    const charts = (_wb?.shapes||[]).filter(s=>s.type==='chart' && s.sourceFile===fp)
    if (!charts.length) return
    const ext = fp.split('.').pop().toLowerCase()
    const res = ext==='pdf' ? await api.readPdfTable(fp) : await api.readSpreadsheet(fp)
    if (!res?.ok) return
    const sheet = res.sheets?.[0]
    if (!sheet) return
    charts.forEach(s => { s.data = { headers:sheet.headers, rows:sheet.rows } })
    saveWb(); _wbRender()
    showToast('Chart data updated from file ✓')
  })
})()

// ── Image insertion ───────────────────────────────────────────────────────────

function _wbInsertImageFile(file, screenX, screenY) {
  const reader = new FileReader()
  reader.onload = ev => {
    const dataUrl = ev.target.result
    const img = new Image()
    img.onload = () => {
      // Convert screen drop point to world coords
      const wx = (screenX - _wbPanX) / _wbZoom
      const wy = (screenY - _wbPanY) / _wbZoom
      // Scale so longest side is 400px in world space max
      const maxSide = 400
      let w = img.naturalWidth, h = img.naturalHeight
      if (w > maxSide || h > maxSide) {
        const r = Math.min(maxSide / w, maxSide / h)
        w = Math.round(w * r); h = Math.round(h * r)
      }
      _wbPushUndo()
      _wbAddShape({ type:'image', dataUrl, x: wx - w/2, y: wy - h/2, w, h })
      saveWb(); _wbRender()
      showToast('Image added to board ✓')
    }
    img.src = dataUrl
  }
  reader.readAsDataURL(file)
}

// ── Selection Property Bar ────────────────────────────────────────────────────

function _wbUpdateSelBar() {
  const bar = document.getElementById('wb-sel-bar')
  if (!bar) return
  const sel = _wbSelId ? (_wb?.shapes||[]).find(s => s.id === _wbSelId) : null

  if (!sel) { bar.classList.add('hidden'); return }
  bar.classList.remove('hidden')

  const isSticky = sel.type === 'sticky'
  document.getElementById('wb-sel-sticky-colors')?.classList.toggle('hidden', !isSticky)
  document.getElementById('wb-sel-shape-props')?.classList.toggle('hidden',   isSticky)

  const isChart = sel.type === 'chart'
  const chartBtns = document.getElementById('wb-sel-chart-btns')
  if (chartBtns) {
    chartBtns.classList.toggle('hidden', !isChart)
    chartBtns.style.display = isChart ? 'flex' : 'none'
    if (isChart) {
      const srcEl = document.getElementById('wb-sel-chart-source')
      if (srcEl) srcEl.textContent = sel.sourceFile ? '🔗 ' + sel.sourceFile.split(/[\\/]/).pop() : ''
    }
  }

  if (!isSticky && !isChart) {
    const strokeInp = document.getElementById('wb-sel-stroke')
    if (strokeInp) strokeInp.value = sel.color || '#1e293b'

    const fillOn = document.getElementById('wb-sel-fill-on')
    if (fillOn) fillOn.checked = !!sel.fill

    const fillClr = document.getElementById('wb-sel-fill-clr')
    if (fillClr) fillClr.value = sel.fillColor || '#93c5fd'

    ;[1,2,5].forEach(w => {
      const btn = document.getElementById(`wb-sel-sw-${w}`)
      if (!btn) return
      btn.className = `px-1.5 py-0.5 rounded text-xs font-bold transition-colors ${
        (sel.sw||2) === w
          ? 'bg-indigo-200 text-indigo-800'
          : 'hover:bg-indigo-100 hover:text-indigo-700 text-slate-500'}`
    })
  }
}

function wbSelSetStroke(c) {
  const sel = _wbSelId ? (_wb?.shapes||[]).find(s => s.id === _wbSelId) : null
  if (!sel) return
  sel.color = c; saveWb(); _wbRender()
}

function wbSelToggleFill(on) {
  const sel = _wbSelId ? (_wb?.shapes||[]).find(s => s.id === _wbSelId) : null
  if (!sel) return
  sel.fill = on
  if (on && !sel.fillColor) sel.fillColor = _wbFillClr
  saveWb(); _wbRender()
}

function wbSelSetFill(c) {
  const sel = _wbSelId ? (_wb?.shapes||[]).find(s => s.id === _wbSelId) : null
  if (!sel) return
  sel.fillColor = c; sel.fill = true; saveWb(); _wbRender()
}

function wbSelSetSW(w) {
  const sel = _wbSelId ? (_wb?.shapes||[]).find(s => s.id === _wbSelId) : null
  if (!sel) return
  sel.sw = w; saveWb(); _wbRender()
}

function wbSelZOrder(dir) {
  const ids = _wbSelIds.length > 1 ? _wbSelIds : (_wbSelId ? [_wbSelId] : [])
  if (!ids.length || !_wb) return
  _wbPushUndo()
  const shapes = _wb.shapes
  if (dir === 'front') {
    const moving = shapes.filter(s => ids.includes(s.id))
    _wb.shapes   = [...shapes.filter(s => !ids.includes(s.id)), ...moving]
  } else {
    const moving = shapes.filter(s => ids.includes(s.id))
    _wb.shapes   = [...moving, ...shapes.filter(s => !ids.includes(s.id))]
  }
  saveWb(); _wbRender()
}

function wbSelDuplicate() {
  const sel = _wbSelId ? (_wb?.shapes||[]).find(s => s.id === _wbSelId) : null
  if (!sel) return
  _wbPushUndo()
  const copy = JSON.parse(JSON.stringify(sel))
  copy.id = 'ws-' + uid()
  // Offset the copy so it's visible
  const OFFSET = 20
  ;['x','x1','x2','x3','cx'].forEach(k => { if (copy[k] != null) copy[k] += OFFSET })
  ;['y','y1','y2','y3','cy'].forEach(k => { if (copy[k] != null) copy[k] += OFFSET })
  _wb.shapes.push(copy)
  _wbSelId = copy.id
  saveWb(); _wbRender()
  showToast('Shape duplicated ✓')
}

// ── Export ────────────────────────────────────────────────────────────────────

async function wbExportPng() {
  if (!_wbCanvas||!_wb) return
  const wsDir = await api.getWorkspaceDir().catch(()=>null)
  const fname  = (_wb.name||'board').replace(/[/\\:*?"<>|]/g,'_')+'.png'
  const dest = await api.openSaveDialog({
    title:'Export Board as PNG',
    defaultPath: wsDir ? wsDir+'\\Whiteboard\\'+fname : fname,
    filters:[{name:'PNG Image',extensions:['png']}],
  })
  if (!dest) return
  const dpr=window.devicePixelRatio||1
  const w=_wbCanvas.width/dpr, h=_wbCanvas.height/dpr
  const off=document.createElement('canvas')
  off.width=w*dpr; off.height=h*dpr
  const octx=off.getContext('2d')
  octx.scale(dpr,dpr)
  octx.fillStyle='#ffffff'; octx.fillRect(0,0,w,h)
  const sv=_wbCanvas, sc=_wbCtx
  _wbCanvas=off; _wbCtx=octx; _wbRender()
  _wbCanvas=sv; _wbCtx=sc
  const base64=off.toDataURL('image/png').split(',')[1]
  await api.writeBinaryFile(dest, base64)
  showToast('Board exported as PNG ✓')
}
