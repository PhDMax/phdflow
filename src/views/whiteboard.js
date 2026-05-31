// ══ Whiteboard v2 ══════════════════════════════════════════════════════════════

// ── State ─────────────────────────────────────────────────────────────────────

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
let _wbCanvas      = null
let _wbCtx         = null
let _wbBg          = 'dots'
let _wbResizeObs   = null
let _wbResizing    = null   // { handle:0-7, startPt:{x,y}, origShape:{...} }
let _wbKeysAdded   = false

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
  { id:'erase',   icon:'⌫',  title:'Eraser  X' },
]

const WB_BG = {
  white: 'background:#fff',
  dots:  'background:#f8fafc;background-image:radial-gradient(circle,#cbd5e1 1px,transparent 1px);background-size:24px 24px',
  grid:  'background:#f8fafc;background-image:linear-gradient(#e2e8f0 1px,transparent 1px),linear-gradient(90deg,#e2e8f0 1px,transparent 1px);background-size:24px 24px',
}

const WB_RESIZABLE = ['rect','ellipse','diamond','sticky','triangle']

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

      <!-- Stroke width -->
      <div class="flex items-center gap-px flex-shrink-0">
        ${[[1,'thin','—'],[2,'medium','━'],[5,'thick','▬']].map(([w,label,icon]) => `
        <button data-wb-sw="${w}" onclick="wbSetSW(${w})" title="Stroke ${label}"
          class="px-2 h-8 rounded text-xs font-bold transition-colors flex-shrink-0
            ${_wbSW===w ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}">
          ${icon}
        </button>`).join('')}
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

      <!-- Font size -->
      <div class="flex items-center gap-px flex-shrink-0">
        ${[[11,'S'],[14,'M'],[20,'L'],[28,'XL']].map(([sz,lbl]) => `
        <button data-wb-fs="${sz}" onclick="wbSetFontSize(${sz})" title="Font size ${sz}px"
          class="px-1.5 h-8 rounded text-xs font-semibold transition-colors flex-shrink-0
            ${_wbFontSize===sz ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}">
          ${lbl}
        </button>`).join('')}
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

      <div class="ml-auto flex items-center gap-1 flex-shrink-0 pl-2">
        <button onclick="wbUndo()" title="Undo Ctrl+Z" class="w-8 h-8 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 transition-colors">↩</button>
        <button onclick="wbRedo()" title="Redo Ctrl+Y" class="w-8 h-8 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 transition-colors">↪</button>
        <button onclick="wbClear()" class="px-2.5 h-8 rounded text-xs text-red-400 hover:bg-red-50 transition-colors">Clear</button>
        <button onclick="wbExportPng()" class="px-2.5 h-8 rounded text-xs bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 font-medium transition-colors">PNG</button>
      </div>
    </div>

    <!-- Selection property bar (visible when a shape is selected) -->
    <div id="wb-sel-bar" class="hidden bg-indigo-50 border-b border-indigo-100 px-3 py-1 flex items-center gap-3 flex-shrink-0 text-xs">
      <span class="text-indigo-600 font-semibold">Selected:</span>
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
      <div class="w-px h-4 bg-indigo-200"></div>
      <label class="flex items-center gap-1 text-slate-600">Width
        ${[[1,'—'],[2,'━'],[5,'▬']].map(([w,icon])=>`
        <button onclick="wbSelSetSW(${w})" id="wb-sel-sw-${w}"
          class="px-1.5 py-0.5 rounded text-xs font-bold transition-colors
            hover:bg-indigo-100 hover:text-indigo-700 text-slate-500">${icon}</button>`).join('')}
      </label>
      <div class="w-px h-4 bg-indigo-200"></div>
      <button onclick="wbSelDuplicate()" class="text-indigo-600 hover:text-indigo-800 font-medium">⎘ Duplicate</button>
      <button onclick="_wbDeleteSelected()" class="text-rose-500 hover:text-rose-700 font-medium ml-1">✕ Delete</button>
    </div>

    <!-- Canvas area -->
    <div id="wb-container" class="flex-1 relative overflow-hidden select-none" style="${WB_BG[_wbBg]||WB_BG.dots}">
      <canvas id="wb-canvas" class="absolute inset-0"
        style="cursor:${_wbTool==='text'?'text':_wbTool==='select'?'default':_wbTool==='erase'?'crosshair':'crosshair'}"></canvas>
      <div id="wb-hint" class="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-slate-400 pointer-events-none select-none">
        Double-click a shape to label it · G=triangle · Del=delete selected
      </div>
    </div>
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
    if (!_wb) return
    const tag = document.activeElement?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.contentEditable === 'true') return

    if ((e.ctrlKey||e.metaKey) && e.key==='z') { e.preventDefault(); wbUndo(); return }
    if ((e.ctrlKey||e.metaKey) && (e.key==='y'||(e.shiftKey&&e.key==='z'))) { e.preventDefault(); wbRedo(); return }
    if (e.key==='Delete'||e.key==='Backspace') { if (_wbSelId) { e.preventDefault(); _wbDeleteSelected() }; return }
    if (e.key==='Escape') { _wbSelId=null; _wbRender(); return }

    const toolKeys = { v:'select',p:'pen',s:'smart',l:'line',a:'arrow',r:'rect',e:'circle',d:'diamond',g:'triangle',n:'sticky',t:'text',x:'erase' }
    if (toolKeys[e.key.toLowerCase()]) { wbSetTool(toolKeys[e.key.toLowerCase()]); return }
  })
}

// ── Pointer helpers ───────────────────────────────────────────────────────────

function _wbPt(e) {
  const rect = _wbCanvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

// ── Canvas Events ─────────────────────────────────────────────────────────────

function _wbBindCanvas() {
  if (!_wbCanvas) return
  _wbCanvas.onmousedown  = _wbDown
  _wbCanvas.onmousemove  = _wbMove
  _wbCanvas.onmouseup    = _wbUp
  _wbCanvas.onmouseleave = e => { if (_wbDrawing || _wbDragStart || _wbResizing) _wbUp(e) }
  _wbCanvas.ondblclick   = _wbDblClick
}

// ── Mouse Down ────────────────────────────────────────────────────────────────

function _wbDown(e) {
  if (e.button !== 0) return
  const pt = _wbPt(e)

  if (_wbTool === 'text') { _wbPlaceText(pt.x, pt.y); return }

  if (_wbTool === 'select') {
    // Check resize handles first
    if (_wbSelId) {
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
    // Hit test for move
    const hit = _wbHitTest(pt.x, pt.y)
    _wbSelId = hit
    if (hit) {
      _wbDragStart = { x: pt.x, y: pt.y, shapes: JSON.parse(JSON.stringify(_wb.shapes)) }
    }
    _wbRender()
    return
  }

  _wbDrawing = true
  _wbPts = [pt]
}

// ── Mouse Move ────────────────────────────────────────────────────────────────

function _wbMove(e) {
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

  // Move selected shape
  if (_wbTool === 'select' && _wbDragStart && _wbSelId) {
    _wbMoveShape(_wbSelId, pt.x - _wbDragStart.x, pt.y - _wbDragStart.y, _wbDragStart.shapes)
    _wbRender()
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
  if (_wbResizing) {
    _wbResizing = null
    saveWb()
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
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y)
    for (let i=1;i<_wbPts.length;i++) ctx.lineTo(_wbPts[i].x, _wbPts[i].y)
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
  ctx.clearRect(0, 0, _wbCanvas.width/dpr, _wbCanvas.height/dpr)

  for (const s of (_wb.shapes||[])) {
    _wbDrawShape(ctx, s)
    if (s.id === _wbSelId) _wbDrawSelection(ctx, s)
  }

  if (_wbDrawing && _wbPts.length >= 2) _wbDrawActiveStroke()
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
      if (!s.points?.length) break
      ctx.beginPath()
      ctx.moveTo(s.points[0].x, s.points[0].y)
      for (let i=1;i<s.points.length;i++) ctx.lineTo(s.points[i].x, s.points[i].y)
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
    case 'text': {
      ctx.fillStyle = s.color||'#1e293b'
      ctx.font = `${s.fontSize||14}px Segoe UI, system-ui, sans-serif`
      const lines = (s.text||'').split('\n')
      const lh = (s.fontSize||14)*1.4
      lines.forEach((l,i) => ctx.fillText(l, s.x, s.y + i*lh))
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
    case 'text':     cur.x=orig.x+dx; cur.y=orig.y+dy; break
    case 'freehand': cur.points=orig.points.map(p=>({x:p.x+dx, y:p.y+dy})); break
  }
}

function _wbDeleteSelected() {
  if (!_wbSelId) return
  _wbPushUndo()
  _wb.shapes = _wb.shapes.filter(s=>s.id!==_wbSelId)
  _wbSelId = null
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
  document.querySelectorAll('[data-wb-sw]').forEach(btn => {
    const w = parseInt(btn.dataset.wbSw)
    btn.className = `px-2 h-8 rounded text-xs font-bold transition-colors flex-shrink-0 ${_wbSW===w?'bg-indigo-100 text-indigo-700':'text-slate-500 hover:bg-slate-100'}`
  })
  document.querySelectorAll('[data-wb-fs]').forEach(btn => {
    const sz = parseInt(btn.dataset.wbFs)
    btn.className = `px-1.5 h-8 rounded text-xs font-semibold transition-colors flex-shrink-0 ${_wbFontSize===sz?'bg-indigo-100 text-indigo-700':'text-slate-500 hover:bg-slate-100'}`
  })
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
    _wbCanvas.style.cursor = _wbTool==='text'?'text':_wbTool==='select'?'default':_wbTool==='erase'?'crosshair':'crosshair'
  }
  const container = document.getElementById('wb-container')
  if (container) container.setAttribute('style', WB_BG[_wbBg]||WB_BG.dots)
}

// ── Board Management ──────────────────────────────────────────────────────────

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

function wbSetTool(t) {
  _wbTool=t; _wbSelId=null
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

// ── Selection Property Bar ────────────────────────────────────────────────────

function _wbUpdateSelBar() {
  const bar = document.getElementById('wb-sel-bar')
  if (!bar) return
  const sel = _wbSelId ? (_wb?.shapes||[]).find(s => s.id === _wbSelId) : null

  if (!sel) { bar.classList.add('hidden'); return }
  bar.classList.remove('hidden')

  const strokeInp = document.getElementById('wb-sel-stroke')
  if (strokeInp) strokeInp.value = sel.color || '#1e293b'

  const fillOn = document.getElementById('wb-sel-fill-on')
  if (fillOn) fillOn.checked = !!sel.fill

  const fillClr = document.getElementById('wb-sel-fill-clr')
  if (fillClr) fillClr.value = sel.fillColor || '#93c5fd'

  // Highlight active stroke width
  ;[1,2,5].forEach(w => {
    const btn = document.getElementById(`wb-sel-sw-${w}`)
    if (!btn) return
    btn.className = `px-1.5 py-0.5 rounded text-xs font-bold transition-colors ${
      (sel.sw||2) === w
        ? 'bg-indigo-200 text-indigo-800'
        : 'hover:bg-indigo-100 hover:text-indigo-700 text-slate-500'}`
  })
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
  const dest = await api.openSaveDialog({
    title:'Export Board as PNG',
    defaultPath:(_wb.name||'board').replace(/[/\\:*?"<>|]/g,'_')+'.png',
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
