// ══ Whiteboard — Canvas Drawing with Smart Shape Recognition ══════════════════

// ── State ─────────────────────────────────────────────────────────────────────

let _wb          = null          // active board object
let _wbTool      = 'smart'       // current tool
let _wbColor     = '#1e293b'     // stroke / text color
let _wbSW        = 2             // stroke width
let _wbFill      = false         // fill shapes
let _wbFillClr   = '#e0e7ff'     // fill color (used when _wbFill true)
let _wbFontSize  = 16            // text font size
let _wbSmartOn   = true          // shape recognition toggle
let _wbUndo      = []            // undo stack (snapshots)
let _wbRedo      = []            // redo stack
let _wbDrawing   = false         // currently drawing
let _wbPts       = []            // current stroke points
let _wbDragStart = null          // {x, y, origShapes} for select-drag
let _wbSelId     = null          // selected shape ID
let _wbCanvas    = null          // <canvas> element
let _wbCtx       = null          // 2D context
let _wbBg        = 'dots'        // 'white' | 'dots' | 'grid'
let _wbResizeObs = null          // ResizeObserver instance

const WB_PALETTE = [
  '#1e293b','#ef4444','#f97316','#eab308',
  '#22c55e','#06b6d4','#6366f1','#a855f7',
  '#ec4899','#94a3b8','#78350f','#ffffff',
]

const WB_TOOLS = [
  { id:'smart',  icon:'✦', title:'Smart Pen — draw & auto-convert shapes' },
  { id:'pen',    icon:'✎', title:'Freehand Pen' },
  { id:'line',   icon:'╲', title:'Straight Line' },
  { id:'arrow',  icon:'→', title:'Arrow' },
  { id:'rect',   icon:'▭', title:'Rectangle' },
  { id:'circle', icon:'○', title:'Circle / Ellipse' },
  { id:'text',   icon:'T', title:'Text (click to place)' },
  { id:'erase',  icon:'⌫', title:'Eraser' },
  { id:'select', icon:'↖', title:'Select & move shapes' },
]

const WB_BG = {
  white: 'background:#fff',
  dots:  'background:#fff;background-image:radial-gradient(circle,#cbd5e1 1px,transparent 1px);background-size:20px 20px',
  grid:  'background:#fff;background-image:linear-gradient(#e2e8f0 1px,transparent 1px),linear-gradient(90deg,#e2e8f0 1px,transparent 1px);background-size:20px 20px',
}

// ── Render ────────────────────────────────────────────────────────────────────

function render_whiteboard() {
  const vc = document.getElementById('view-content')
  if (!vc) return

  const boards = state.whiteboards || []

  // Auto-select first board when none is active but boards exist
  if (!_wb && boards.length > 0) _wb = boards[0]

  vc.innerHTML = `
  <div class="flex flex-col h-full overflow-hidden">

    <!-- Board tabs + management -->
    <div class="bg-white border-b border-slate-200 px-4 py-1.5 flex items-center gap-1.5 flex-shrink-0 overflow-x-auto">
      ${boards.length === 0
        ? '<span class="text-xs text-slate-400 italic">No boards yet</span>'
        : boards.map(b => `
          <button onclick="wbLoadBoard('${b.id}')"
            class="px-3 py-1 rounded-lg text-xs font-medium transition-colors flex-shrink-0
              ${_wb?.id===b.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
            ${esc(b.name)}
          </button>`).join('')
      }
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
    <div class="bg-white border-b border-slate-200 px-3 py-1 flex items-center gap-px flex-shrink-0 overflow-x-auto">

      <!-- Tools -->
      ${WB_TOOLS.map(t => `
      <button data-wb-tool="${t.id}" onclick="wbSetTool('${t.id}')" title="${t.title}"
        class="px-2 py-1.5 rounded text-sm transition-colors flex-shrink-0
          ${_wbTool===t.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}">
        ${t.icon}
      </button>`).join('')}

      <div class="w-px h-5 bg-slate-200 mx-1.5 flex-shrink-0"></div>

      <!-- Color palette -->
      ${WB_PALETTE.map(c => `
      <button data-wb-color="${c}" onclick="wbSetColor('${c}')" title="${c}"
        style="background:${c};border:2px solid ${_wbColor===c ? '#6366f1' : (c==='#ffffff'?'#e2e8f0':'transparent')}"
        class="w-5 h-5 rounded-full flex-shrink-0 transition-all hover:scale-110"></button>`).join('')}

      <div class="w-px h-5 bg-slate-200 mx-1.5 flex-shrink-0"></div>

      <!-- Stroke width -->
      ${[1,2,5].map((w,i) => `
      <button data-wb-sw="${w}" onclick="wbSetSW(${w})" title="Stroke ${['thin','medium','thick'][i]}"
        class="px-2 py-1.5 rounded text-xs font-bold transition-colors flex-shrink-0
          ${_wbSW===w ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}">
        ${['—','━','▬'][i]}
      </button>`).join('')}

      <div class="w-px h-5 bg-slate-200 mx-1.5 flex-shrink-0"></div>

      <!-- Fill toggle -->
      <button id="wb-fill-btn" onclick="wbToggleFill()" title="Toggle shape fill"
        class="px-2.5 py-1 rounded text-xs font-medium transition-colors flex-shrink-0
          ${_wbFill ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}">
        ${_wbFill ? '⬛ Fill on' : '▭ Fill off'}
      </button>

      <!-- Background -->
      <select id="wb-bg-select" onchange="wbSetBg(this.value)"
        class="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none ml-1 flex-shrink-0">
        <option value="white" ${_wbBg==='white'?'selected':''}>White</option>
        <option value="dots"  ${_wbBg==='dots'?'selected':''}>Dots</option>
        <option value="grid"  ${_wbBg==='grid'?'selected':''}>Grid</option>
      </select>

      <div class="w-px h-5 bg-slate-200 mx-1.5 flex-shrink-0"></div>

      <!-- Smart shapes toggle -->
      <button id="wb-smart-btn" onclick="wbToggleSmart()" title="Smart shape recognition"
        class="px-2.5 py-1 rounded text-xs font-medium transition-colors flex-shrink-0
          ${_wbSmartOn ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:bg-slate-100'}">
        ${_wbSmartOn ? '✦ Smart' : '✦ Off'}
      </button>

      <div class="ml-auto flex items-center gap-1 flex-shrink-0 pl-2">
        <button onclick="wbUndo()" title="Undo (Ctrl+Z)" class="px-2 py-1.5 rounded text-slate-500 hover:bg-slate-100 text-sm transition-colors">↩</button>
        <button onclick="wbRedo()" title="Redo (Ctrl+Y)" class="px-2 py-1.5 rounded text-slate-500 hover:bg-slate-100 text-sm transition-colors">↪</button>
        <button onclick="wbClear()" title="Clear board" class="px-2.5 py-1 rounded text-xs text-red-400 hover:bg-red-50 transition-colors">🗑 Clear</button>
        <button onclick="wbExportPng()" title="Export as PNG image" class="px-2.5 py-1 rounded text-xs bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 font-medium transition-colors">📸 PNG</button>
      </div>
    </div>

    <!-- Canvas area -->
    <div id="wb-container" class="flex-1 relative overflow-hidden" style="${WB_BG[_wbBg]||WB_BG.dots}">
      <canvas id="wb-canvas" class="absolute inset-0" style="cursor:${_wbTool==='text'?'text':_wbTool==='select'?'default':_wbTool==='erase'?'cell':'crosshair'}"></canvas>
    </div>
    ` : `
    <div class="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div class="text-5xl mb-4">🎨</div>
      <p class="text-slate-600 font-semibold mb-2">Create a whiteboard</p>
      <p class="text-slate-400 text-sm mb-5 max-w-sm">Draw freehand or use structured shapes. Smart Pen auto-converts your sketches into perfect circles, rectangles, and lines.</p>
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

function _wbInitCanvas(retryCount) {
  const canvas = document.getElementById('wb-canvas')
  if (!canvas) return
  const container = document.getElementById('wb-container')
  if (!container) return

  const dpr = window.devicePixelRatio || 1
  const w   = container.clientWidth
  const h   = container.clientHeight

  // If layout not settled yet, retry up to 5 times at 50ms intervals
  if ((!w || !h) && (retryCount || 0) < 5) {
    setTimeout(() => _wbInitCanvas((retryCount || 0) + 1), 50)
    return
  }
  if (!w || !h) return   // give up after 5 retries

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

  // Watch for container resize so canvas stays correct size
  if (_wbResizeObs) _wbResizeObs.disconnect()
  _wbResizeObs = new ResizeObserver(() => {
    // Only re-init if this canvas is still the active one in the DOM
    if (document.getElementById('wb-canvas') === _wbCanvas) {
      _wbInitCanvas()
    }
  })
  _wbResizeObs.observe(container)
}

let _wbKeysAdded = false
function _wbBindKeys() {
  if (_wbKeysAdded) return
  _wbKeysAdded = true
  document.addEventListener('keydown', e => {
    if (!_wb) return
    if ((e.ctrlKey||e.metaKey) && e.key==='z') { e.preventDefault(); wbUndo() }
    if ((e.ctrlKey||e.metaKey) && (e.key==='y'||(e.shiftKey&&e.key==='z'))) { e.preventDefault(); wbRedo() }
    if (e.key==='Delete'||e.key==='Backspace') {
      if (_wbSelId && document.activeElement.tagName!=='TEXTAREA' && document.activeElement.tagName!=='INPUT') {
        e.preventDefault(); _wbDeleteSelected()
      }
    }
    if (e.key==='Escape') { _wbSelId=null; _wbRender() }
  })
}

function _wbPt(e) {
  const rect = _wbCanvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

// ── Canvas Events ─────────────────────────────────────────────────────────────

function _wbBindCanvas() {
  if (!_wbCanvas) return
  _wbCanvas.onmousedown = _wbDown
  _wbCanvas.onmousemove = _wbMove
  _wbCanvas.onmouseup   = _wbUp
  _wbCanvas.onmouseleave= _wbUp
}

// ── Drawing Event Handlers ────────────────────────────────────────────────────

function _wbDown(e) {
  if (e.button !== 0) return
  const pt = _wbPt(e)

  if (_wbTool === 'text') { _wbPlaceText(pt.x, pt.y); return }

  if (_wbTool === 'select') {
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

function _wbMove(e) {
  const pt = _wbPt(e)

  if (_wbTool === 'select' && _wbDragStart && _wbSelId) {
    const dx = pt.x - _wbDragStart.x
    const dy = pt.y - _wbDragStart.y
    _wbMoveShape(_wbSelId, dx, dy, _wbDragStart.shapes)
    _wbRender()
    return
  }

  if (!_wbDrawing) return
  _wbPts.push(pt)

  // Live preview
  _wbRender()
  _wbDrawActiveStroke()
}

function _wbUp(e) {
  if (_wbDragStart && _wbSelId) {
    _wbDragStart = null
    saveWb()
    return
  }
  if (!_wbDrawing) return
  _wbDrawing = false

  if (_wbPts.length < 2) { _wbPts = []; return }
  const pt = e ? _wbPt(e) : _wbPts[_wbPts.length-1]
  _wbPts.push(pt)

  _wbPushUndo()

  if (_wbTool === 'erase') {
    _wbEraseAt(_wbPts)
  } else if (_wbTool === 'pen') {
    _wbAddShape({ type:'freehand', points:[..._wbPts], color:_wbColor, sw:_wbSW })
  } else if (_wbTool === 'smart') {
    if (_wbSmartOn) {
      const rec = _recognizeShape(_wbPts)
      if (rec) { _wbAddShape({ ...rec, color:_wbColor, sw:_wbSW, fill:_wbFill, fillColor:_wbFillClr }) }
      else      { _wbAddShape({ type:'freehand', points:[..._wbPts], color:_wbColor, sw:_wbSW }) }
    } else {
      _wbAddShape({ type:'freehand', points:[..._wbPts], color:_wbColor, sw:_wbSW })
    }
  } else if (_wbTool === 'line') {
    _wbAddShape({ type:'line', x1:_wbPts[0].x, y1:_wbPts[0].y, x2:pt.x, y2:pt.y, color:_wbColor, sw:_wbSW })
  } else if (_wbTool === 'arrow') {
    _wbAddShape({ type:'arrow', x1:_wbPts[0].x, y1:_wbPts[0].y, x2:pt.x, y2:pt.y, color:_wbColor, sw:_wbSW })
  } else if (_wbTool === 'rect') {
    const x = Math.min(_wbPts[0].x, pt.x), y = Math.min(_wbPts[0].y, pt.y)
    const w = Math.abs(pt.x - _wbPts[0].x), h = Math.abs(pt.y - _wbPts[0].y)
    if (w > 4 && h > 4) _wbAddShape({ type:'rect', x, y, w, h, color:_wbColor, sw:_wbSW, fill:_wbFill, fillColor:_wbFillClr })
  } else if (_wbTool === 'circle') {
    const cx = (_wbPts[0].x + pt.x)/2, cy = (_wbPts[0].y + pt.y)/2
    const rx = Math.abs(pt.x - _wbPts[0].x)/2, ry = Math.abs(pt.y - _wbPts[0].y)/2
    if (rx > 2 && ry > 2) _wbAddShape({ type:'ellipse', cx, cy, rx, ry, color:_wbColor, sw:_wbSW, fill:_wbFill, fillColor:_wbFillClr })
  }

  _wbPts = []
  _wbRender()
  saveWb()
}

// ── Active Stroke Preview ─────────────────────────────────────────────────────

function _wbDrawActiveStroke() {
  if (!_wbCtx || _wbPts.length < 2) return
  const ctx = _wbCtx
  const p0  = _wbPts[0]
  const pN  = _wbPts[_wbPts.length-1]

  ctx.save()
  ctx.strokeStyle = _wbColor
  ctx.lineWidth   = _wbSW
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'

  if (_wbTool === 'pen' || _wbTool === 'smart' || _wbTool === 'erase') {
    ctx.globalAlpha = _wbTool === 'erase' ? 0.4 : 1
    ctx.beginPath()
    ctx.moveTo(p0.x, p0.y)
    for (let i=1; i<_wbPts.length; i++) ctx.lineTo(_wbPts[i].x, _wbPts[i].y)
    ctx.stroke()
  } else if (_wbTool === 'line') {
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(pN.x, pN.y); ctx.stroke()
  } else if (_wbTool === 'arrow') {
    _ctxArrow(ctx, p0.x, p0.y, pN.x, pN.y, _wbSW, _wbColor)
  } else if (_wbTool === 'rect') {
    const x=Math.min(p0.x,pN.x), y=Math.min(p0.y,pN.y), w=Math.abs(pN.x-p0.x), h=Math.abs(pN.y-p0.y)
    if (_wbFill) { ctx.fillStyle=_wbFillClr; ctx.fillRect(x,y,w,h) }
    ctx.strokeRect(x,y,w,h)
  } else if (_wbTool === 'circle') {
    const cx=(p0.x+pN.x)/2, cy=(p0.y+pN.y)/2, rx=Math.abs(pN.x-p0.x)/2, ry=Math.abs(pN.y-p0.y)/2
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2)
    if (_wbFill) { ctx.fillStyle=_wbFillClr; ctx.fill() }
    ctx.stroke()
  }
  ctx.restore()
}

// ── Full Render ───────────────────────────────────────────────────────────────

function _wbRender() {
  if (!_wbCtx || !_wbCanvas || !_wb) return
  const ctx = _wbCtx
  const dpr = window.devicePixelRatio || 1
  ctx.clearRect(0, 0, _wbCanvas.width/dpr, _wbCanvas.height/dpr)

  for (const s of (_wb.shapes || [])) {
    _wbDrawShape(ctx, s)
    if (s.id === _wbSelId) _wbDrawSelection(ctx, s)
  }

  if (_wbDrawing && _wbPts.length >= 2) _wbDrawActiveStroke()
}

function _wbDrawShape(ctx, s) {
  ctx.save()
  ctx.strokeStyle = s.color || '#1e293b'
  ctx.lineWidth   = s.sw    || 2
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'

  switch (s.type) {
    case 'freehand': {
      if (!s.points?.length) break
      ctx.beginPath()
      ctx.moveTo(s.points[0].x, s.points[0].y)
      for (let i=1; i<s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y)
      ctx.stroke()
      break
    }
    case 'line': {
      ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke()
      break
    }
    case 'arrow': {
      _ctxArrow(ctx, s.x1, s.y1, s.x2, s.y2, s.sw||2, s.color||'#1e293b')
      break
    }
    case 'rect': {
      ctx.beginPath(); ctx.rect(s.x, s.y, s.w, s.h)
      if (s.fill) { ctx.fillStyle=s.fillColor||'#e0e7ff'; ctx.fill() }
      ctx.stroke()
      break
    }
    case 'ellipse': {
      ctx.beginPath(); ctx.ellipse(s.cx, s.cy, s.rx, s.ry, 0, 0, Math.PI*2)
      if (s.fill) { ctx.fillStyle=s.fillColor||'#e0e7ff'; ctx.fill() }
      ctx.stroke()
      break
    }
    case 'triangle': {
      ctx.beginPath()
      ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.lineTo(s.x3, s.y3); ctx.closePath()
      if (s.fill) { ctx.fillStyle=s.fillColor||'#e0e7ff'; ctx.fill() }
      ctx.stroke()
      break
    }
    case 'text': {
      ctx.fillStyle = s.color || '#1e293b'
      ctx.font = `${s.bold?'bold ':''}${s.fontSize||16}px ${s.fontFamily||'Segoe UI, system-ui, sans-serif'}`
      const lines = (s.text||'').split('\n')
      const lh = (s.fontSize||16) * 1.4
      lines.forEach((l,i) => ctx.fillText(l, s.x, s.y + i*lh))
      break
    }
  }
  ctx.restore()
}

function _ctxArrow(ctx, x1, y1, x2, y2, sw, color) {
  const hl  = Math.max(12, sw * 4)
  const ang = Math.atan2(y2-y1, x2-x1)
  ctx.save()
  ctx.strokeStyle = color; ctx.fillStyle = color
  ctx.lineWidth = sw; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2-hl*Math.cos(ang-Math.PI/6), y2-hl*Math.sin(ang-Math.PI/6))
  ctx.lineTo(x2-hl*Math.cos(ang+Math.PI/6), y2-hl*Math.sin(ang+Math.PI/6))
  ctx.closePath(); ctx.fill()
  ctx.restore()
}

function _wbDrawSelection(ctx, s) {
  const bb = _wbBBox(s)
  const p  = 6
  ctx.save()
  ctx.strokeStyle = '#6366f1'
  ctx.lineWidth   = 1.5
  ctx.setLineDash([5, 3])
  ctx.strokeRect(bb.x-p, bb.y-p, bb.w+p*2, bb.h+p*2)
  ctx.restore()
}

// ── Shape Recognition ─────────────────────────────────────────────────────────

function _recognizeShape(pts) {
  if (pts.length < 8) return null

  const candidates = [
    _tryLine(pts), _tryCircle(pts), _tryRect(pts), _tryArrow(pts), _tryTriangle(pts),
  ]
  candidates.sort((a,b) => (b?.confidence||0) - (a?.confidence||0))
  const best = candidates[0]
  return best && best.confidence >= 0.72 ? best : null
}

function _tryLine(pts) {
  const p0 = pts[0], pN = pts[pts.length-1]
  const len = Math.hypot(pN.x-p0.x, pN.y-p0.y)
  if (len < 20) return { confidence: 0 }
  let maxDev = 0
  for (const p of pts) {
    const t = ((p.x-p0.x)*(pN.x-p0.x)+(p.y-p0.y)*(pN.y-p0.y)) / (len*len)
    const cx = p0.x+t*(pN.x-p0.x), cy = p0.y+t*(pN.y-p0.y)
    maxDev = Math.max(maxDev, Math.hypot(p.x-cx, p.y-cy))
  }
  const confidence = Math.max(0, 1 - maxDev / (len*0.15))
  return { type:'line', x1:p0.x, y1:p0.y, x2:pN.x, y2:pN.y, confidence }
}

function _tryArrow(pts) {
  const line = _tryLine(pts.slice(0, Math.floor(pts.length*0.7)))
  if (!line || line.confidence < 0.7) return { confidence: 0 }
  const tail = pts.slice(-Math.max(4, Math.floor(pts.length*0.15)))
  const pN = pts[pts.length-1]
  const spreadX = Math.max(...tail.map(p=>Math.abs(p.x - pN.x)))
  const spreadY = Math.max(...tail.map(p=>Math.abs(p.y - pN.y)))
  const spread  = Math.max(spreadX, spreadY)
  const lineLen = Math.hypot(pN.x-pts[0].x, pN.y-pts[0].y)
  const arrowConf = Math.min(1, spread / (lineLen*0.1)) * line.confidence
  return { type:'arrow', x1:pts[0].x, y1:pts[0].y, x2:pN.x, y2:pN.y, confidence: arrowConf * 0.85 }
}

function _tryCircle(pts) {
  const cx = pts.reduce((s,p)=>s+p.x,0)/pts.length
  const cy = pts.reduce((s,p)=>s+p.y,0)/pts.length
  const dists = pts.map(p => Math.hypot(p.x-cx, p.y-cy))
  const avgR  = dists.reduce((s,d)=>s+d,0)/dists.length
  const varR  = dists.reduce((s,d)=>s+(d-avgR)**2,0)/dists.length
  const stdR  = Math.sqrt(varR)
  const p0 = pts[0], pN = pts[pts.length-1]
  const closeDist = Math.hypot(p0.x-pN.x, p0.y-pN.y)
  const isClosed = closeDist < avgR * 0.5
  if (!isClosed) return { confidence: 0 }
  const confidence = Math.max(0, 1 - stdR/avgR) * 0.95
  return { type:'ellipse', cx, cy, rx: avgR, ry: avgR, confidence }
}

function _tryRect(pts) {
  const xs = pts.map(p=>p.x), ys = pts.map(p=>p.y)
  const minX=Math.min(...xs), maxX=Math.max(...xs)
  const minY=Math.min(...ys), maxY=Math.max(...ys)
  const w = maxX-minX, h = maxY-minY
  if (w<15||h<15) return { confidence:0 }
  const p0=pts[0], pN=pts[pts.length-1]
  const closeDist = Math.hypot(p0.x-pN.x, p0.y-pN.y)
  if (closeDist > Math.min(w,h)*0.5) return { confidence:0 }
  const distToEdge = p => Math.min(
    Math.abs(p.x-minX), Math.abs(p.x-maxX),
    Math.abs(p.y-minY), Math.abs(p.y-maxY)
  )
  const avgEdge = pts.reduce((s,p)=>s+distToEdge(p),0)/pts.length
  const confidence = Math.max(0, 1 - avgEdge/Math.min(w,h)) * 0.92
  return { type:'rect', x:minX, y:minY, w, h, confidence }
}

function _tryTriangle(pts) {
  const p0=pts[0], pN=pts[pts.length-1]
  const closeDist = Math.hypot(p0.x-pN.x, p0.y-pN.y)
  const span = Math.hypot(Math.max(...pts.map(p=>p.x))-Math.min(...pts.map(p=>p.x)),
                          Math.max(...pts.map(p=>p.y))-Math.min(...pts.map(p=>p.y)))
  if (closeDist > span*0.4) return { confidence:0 }

  let maxDist=0, apex=null
  for (const p of pts) {
    const len = Math.hypot(pN.x-p0.x, pN.y-p0.y)
    const d = len > 0
      ? Math.abs((pN.x-p0.x)*(p0.y-p.y)-(p0.x-p.x)*(pN.y-p0.y))/len
      : 0
    if (d > maxDist) { maxDist=d; apex=p }
  }
  if (!apex||maxDist<15) return { confidence:0 }
  const confidence = Math.min(1, maxDist/span) * 0.82
  return { type:'triangle', x1:p0.x, y1:p0.y, x2:pN.x, y2:pN.y, x3:apex.x, y3:apex.y, confidence }
}

// ── Select / Move / Hit Test ──────────────────────────────────────────────────

function _wbBBox(s) {
  switch(s.type) {
    case 'rect':    return { x:s.x,         y:s.y,         w:s.w,        h:s.h        }
    case 'ellipse': return { x:s.cx-s.rx,   y:s.cy-s.ry,   w:s.rx*2,     h:s.ry*2     }
    case 'line':
    case 'arrow':   return { x:Math.min(s.x1,s.x2), y:Math.min(s.y1,s.y2), w:Math.abs(s.x2-s.x1)||10, h:Math.abs(s.y2-s.y1)||10 }
    case 'triangle':return { x:Math.min(s.x1,s.x2,s.x3)-4, y:Math.min(s.y1,s.y2,s.y3)-4, w:Math.max(s.x1,s.x2,s.x3)-Math.min(s.x1,s.x2,s.x3)+8, h:Math.max(s.y1,s.y2,s.y3)-Math.min(s.y1,s.y2,s.y3)+8 }
    case 'text':    return { x:s.x, y:s.y-(s.fontSize||16), w:(s.text||'').length*(s.fontSize||16)*0.55, h:(s.text||'').split('\n').length*(s.fontSize||16)*1.4 }
    case 'freehand':{
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
    const p  = 10
    if (x>=bb.x-p && x<=bb.x+bb.w+p && y>=bb.y-p && y<=bb.y+bb.h+p) return s.id
  }
  return null
}

function _wbMoveShape(id, dx, dy, origShapes) {
  const orig = (origShapes||_wb.shapes).find(s=>s.id===id)
  const cur  = _wb.shapes.find(s=>s.id===id)
  if (!orig||!cur) return
  switch(orig.type) {
    case 'rect':    cur.x=orig.x+dx; cur.y=orig.y+dy; break
    case 'ellipse': cur.cx=orig.cx+dx; cur.cy=orig.cy+dy; break
    case 'line':
    case 'arrow':   cur.x1=orig.x1+dx; cur.y1=orig.y1+dy; cur.x2=orig.x2+dx; cur.y2=orig.y2+dy; break
    case 'triangle':cur.x1=orig.x1+dx;cur.y1=orig.y1+dy;cur.x2=orig.x2+dx;cur.y2=orig.y2+dy;cur.x3=orig.x3+dx;cur.y3=orig.y3+dy; break
    case 'text':    cur.x=orig.x+dx; cur.y=orig.y+dy; break
    case 'freehand':cur.points=orig.points.map(p=>({x:p.x+dx,y:p.y+dy})); break
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
  ta.style.cssText = `position:absolute;left:${x}px;top:${y-_wbFontSize}px;
    min-width:80px;background:rgba(255,255,255,0.92);border:1.5px dashed #6366f1;
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

// ── Eraser ────────────────────────────────────────────────────────────────────

function _wbEraseAt(pts) {
  const eraseR = 20
  _wb.shapes = _wb.shapes.filter(s => {
    const bb = _wbBBox(s)
    return !pts.some(p =>
      p.x > bb.x - eraseR && p.x < bb.x+bb.w+eraseR &&
      p.y > bb.y - eraseR && p.y < bb.y+bb.h+eraseR
    )
  })
  _wbRender()
}

// ── Undo / Redo ───────────────────────────────────────────────────────────────

function _wbPushUndo() {
  _wbUndo.push(JSON.parse(JSON.stringify(_wb.shapes||[])))
  _wbRedo = []
  if (_wbUndo.length > 60) _wbUndo.shift()
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

// ── Shape helpers ─────────────────────────────────────────────────────────────

function _wbAddShape(s) {
  if (!_wb) return
  if (!_wb.shapes) _wb.shapes=[]
  s.id = 'ws-' + uid()
  _wb.shapes.push(s)
}

// ── Toolbar Update (no canvas destruction) ────────────────────────────────────

function _wbUpdateToolbar() {
  // Tool buttons
  document.querySelectorAll('[data-wb-tool]').forEach(btn => {
    const active = btn.dataset.wbTool === _wbTool
    btn.className = `px-2 py-1.5 rounded text-sm transition-colors flex-shrink-0 ${active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`
  })
  // Color palette
  document.querySelectorAll('[data-wb-color]').forEach(btn => {
    const c = btn.dataset.wbColor
    btn.style.border = `2px solid ${_wbColor===c ? '#6366f1' : (c==='#ffffff' ? '#e2e8f0' : 'transparent')}`
  })
  // Stroke width buttons
  document.querySelectorAll('[data-wb-sw]').forEach(btn => {
    const w = parseInt(btn.dataset.wbSw)
    btn.className = `px-2 py-1.5 rounded text-xs font-bold transition-colors flex-shrink-0 ${_wbSW===w ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`
  })
  // Fill toggle
  const fillBtn = document.getElementById('wb-fill-btn')
  if (fillBtn) {
    fillBtn.textContent = _wbFill ? '⬛ Fill on' : '▭ Fill off'
    fillBtn.className = `px-2.5 py-1 rounded text-xs font-medium transition-colors flex-shrink-0 ${_wbFill ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`
  }
  // Smart toggle
  const smartBtn = document.getElementById('wb-smart-btn')
  if (smartBtn) {
    smartBtn.textContent = _wbSmartOn ? '✦ Smart' : '✦ Off'
    smartBtn.className = `px-2.5 py-1 rounded text-xs font-medium transition-colors flex-shrink-0 ${_wbSmartOn ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:bg-slate-100'}`
  }
  // Canvas cursor
  if (_wbCanvas) {
    _wbCanvas.style.cursor = _wbTool==='text'?'text':_wbTool==='select'?'default':_wbTool==='erase'?'cell':'crosshair'
  }
  // Container background
  const container = document.getElementById('wb-container')
  if (container) container.setAttribute('style', WB_BG[_wbBg] || WB_BG.dots)
}

// ── Board Management ──────────────────────────────────────────────────────────

function wbNewBoard() {
  openModal(`
    <div>
      <h3 class="text-base font-bold text-slate-800 mb-4">New Whiteboard</h3>
      <label class="label">Board Name</label>
      <input id="wb-new-name" type="text" value="Untitled Board" class="input mb-4"
        onkeydown="if(event.key==='Enter')wbNewBoardConfirm()"/>
      <div class="flex gap-2 justify-end">
        <button onclick="closeModal()" class="btn-secondary px-4 py-2 text-sm">Cancel</button>
        <button onclick="wbNewBoardConfirm()" class="btn-primary px-4 py-2 text-sm">Create Board</button>
      </div>
    </div>`)
  setTimeout(() => { const el = document.getElementById('wb-new-name'); if(el){el.select();el.focus()} }, 80)
}
function wbNewBoardConfirm() {
  const name = document.getElementById('wb-new-name')?.value.trim() || 'Untitled Board'
  closeModal()
  const board = { id:'wb-'+uid(), name, shapes:[], createdAt:new Date().toISOString() }
  if (!state.whiteboards) state.whiteboards=[]
  state.whiteboards.push(board)
  _wb = board
  _wbUndo=[]; _wbRedo=[]; _wbSelId=null
  save('whiteboards'); render_whiteboard()
}

function wbLoadBoard(id) {
  _wb = state.whiteboards.find(b=>b.id===id)||null
  _wbUndo=[]; _wbRedo=[]; _wbSelId=null
  render_whiteboard()
}

function wbRenameBoard() {
  if (!_wb) return
  openModal(`
    <div>
      <h3 class="text-base font-bold text-slate-800 mb-4">Rename Board</h3>
      <label class="label">Board Name</label>
      <input id="wb-ren-name" type="text" value="${esc(_wb.name)}" class="input mb-4"
        onkeydown="if(event.key==='Enter')wbRenameBoardConfirm()"/>
      <div class="flex gap-2 justify-end">
        <button onclick="closeModal()" class="btn-secondary px-4 py-2 text-sm">Cancel</button>
        <button onclick="wbRenameBoardConfirm()" class="btn-primary px-4 py-2 text-sm">Rename</button>
      </div>
    </div>`)
  setTimeout(() => { const el = document.getElementById('wb-ren-name'); if(el){el.select();el.focus()} }, 80)
}
function wbRenameBoardConfirm() {
  const name = document.getElementById('wb-ren-name')?.value.trim()
  if (!name || !_wb) { closeModal(); return }
  _wb.name = name
  closeModal()
  saveWb(); render_whiteboard()
}

async function wbDeleteBoard() {
  if (!_wb||!await confirmDlg(`Delete "${_wb.name}"? This cannot be undone.`, 'Delete Board')) return
  state.whiteboards = state.whiteboards.filter(b=>b.id!==_wb.id)
  _wb = state.whiteboards[0]||null
  save('whiteboards'); render_whiteboard()
}

async function wbClear() {
  if (!_wb||!await confirmDlg('Clear the entire board? This cannot be undone.', 'Clear Board')) return
  _wbPushUndo()
  _wb.shapes=[]
  _wbSelId=null
  saveWb(); _wbRender()
}

function saveWb() {
  const i = state.whiteboards.findIndex(b=>b.id===_wb?.id)
  if (i>-1) state.whiteboards[i]=_wb
  save('whiteboards')
}

// ── Toolbar Controls ──────────────────────────────────────────────────────────
// These update state and refresh only toolbar UI + canvas content,
// WITHOUT destroying and recreating the canvas element.

function wbSetTool(t) {
  _wbTool = t
  _wbSelId = null
  document.getElementById('wb-text-inp')?.remove()
  _wbUpdateToolbar()
  _wbRender()
}

function wbSetColor(c) {
  _wbColor = c
  _wbUpdateToolbar()
}

function wbSetSW(w) {
  _wbSW = w
  _wbUpdateToolbar()
}

function wbToggleFill() {
  _wbFill = !_wbFill
  _wbUpdateToolbar()
}

function wbSetBg(b) {
  _wbBg = b
  _wbUpdateToolbar()
}

function wbToggleSmart() {
  _wbSmartOn = !_wbSmartOn
  _wbUpdateToolbar()
}

// ── Export ────────────────────────────────────────────────────────────────────

async function wbExportPng() {
  if (!_wbCanvas || !_wb) return
  const dest = await api.openSaveDialog({
    title:       'Export Board as PNG',
    defaultPath: (_wb.name||'board').replace(/[/\\:*?"<>|]/g,'_') + '.png',
    filters:     [{ name:'PNG Image', extensions:['png'] }],
  })
  if (!dest) return

  // Render all shapes onto an off-screen canvas with a solid white background
  const dpr  = window.devicePixelRatio || 1
  const w    = _wbCanvas.width / dpr
  const h    = _wbCanvas.height / dpr
  const off  = document.createElement('canvas')
  off.width  = w * dpr
  off.height = h * dpr
  const octx = off.getContext('2d')
  octx.scale(dpr, dpr)
  octx.fillStyle = '#ffffff'
  octx.fillRect(0, 0, w, h)

  // Temporarily swap canvas refs so _wbRender draws to the off-screen canvas
  const savedCanvas = _wbCanvas, savedCtx = _wbCtx
  _wbCanvas = off; _wbCtx = octx
  _wbRender()
  _wbCanvas = savedCanvas; _wbCtx = savedCtx

  // Extract base64 and write via IPC
  const dataUrl = off.toDataURL('image/png')
  const base64  = dataUrl.split(',')[1]
  await api.writeBinaryFile(dest, base64)
  showToast('Board exported as PNG ✓')
}
