// ══ PDF Reader — annotation-aware in-app PDF viewer ════════════════════════════
// Uses PDF.js (window.pdfjsLib, loaded as ES module in index.html)

let _pdfDoc        = null   // loaded PDF document
let _pdfPaperId    = null   // paper ID currently open
let _pdfPage       = 1      // current page number
let _pdfZoom       = 1.0    // current zoom level
let _pdfTool       = 'read' // 'read' | 'highlight' | 'note'
let _pdfHlColor    = '#fde68a'
let _pdfRendering  = false
let _pdfAnnDirty   = false

const PDF_HL_COLORS = ['#fde68a','#bbf7d0','#bfdbfe','#fecaca','#e9d5ff']

// ── Open reader overlay ────────────────────────────────────────────────────────
async function openPdfReader(paperId) {
  const paper = (state.papers||[]).find(p => p.id === paperId)
  if (!paper?.filepath) { showToast('No PDF file linked to this paper', 'error'); return }

  if (!window.pdfjsLib) {
    showToast('PDF viewer still loading — try again in a moment', 'error'); return
  }

  _pdfPaperId   = paperId
  _pdfPage      = 1
  _pdfZoom      = 1.0
  _pdfTool      = 'read'
  _pdfDoc       = null
  _pdfAnnDirty  = false

  // Build overlay
  const overlay = document.createElement('div')
  overlay.id = 'pdf-reader-overlay'
  overlay.style.cssText = 'position:fixed;inset:0;z-index:500;display:flex;flex-direction:column;background:#1e293b'
  overlay.innerHTML = _pdfReaderShell(paper)
  document.body.appendChild(overlay)

  // Prevent body scroll
  document.body.style.overflow = 'hidden'

  // Load PDF
  try {
    const base64 = await window.api.readBinaryFile(paper.filepath)
    const binary = atob(base64)
    const bytes  = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const loadingTask = window.pdfjsLib.getDocument({ data: bytes })
    _pdfDoc = await loadingTask.promise
    document.getElementById('pdf-total-pages').textContent = _pdfDoc.numPages
    _pdfSetPage(1)
  } catch(e) {
    showToast('Could not load PDF: ' + e.message, 'error')
    closePdfReader()
  }
}

function _pdfReaderShell(paper) {
  const anns = paper.annotations || []
  return `
  <!-- ── Toolbar ──────────────────────────────────────────────────────────── -->
  <div class="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-700/60 flex-shrink-0">
    <button onclick="closePdfReader()" title="Close reader"
      class="text-slate-400 hover:text-white text-lg leading-none px-1 flex-shrink-0 transition-colors">✕</button>
    <div class="flex-1 min-w-0">
      <span class="text-sm font-semibold text-slate-200 truncate block">${esc(paper.title||'Untitled')}</span>
    </div>

    <!-- Page nav -->
    <div class="flex items-center gap-1 flex-shrink-0">
      <button onclick="_pdfNavPage(-1)" class="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">‹</button>
      <span class="text-slate-400 text-xs">
        <input id="pdf-page-inp" type="number" min="1" value="1"
          onchange="_pdfSetPage(+this.value)"
          class="w-8 text-center bg-slate-800 border border-slate-600 rounded text-xs text-white outline-none focus:border-indigo-500 py-0.5"/>
        / <span id="pdf-total-pages">…</span>
      </span>
      <button onclick="_pdfNavPage(1)" class="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">›</button>
    </div>

    <div class="w-px h-5 bg-slate-700 flex-shrink-0"></div>

    <!-- Zoom -->
    <div class="flex items-center gap-1 flex-shrink-0">
      <button onclick="_pdfZoomBy(-0.25)" class="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 text-base font-bold transition-colors">−</button>
      <span id="pdf-zoom-label" class="text-xs text-slate-400 w-10 text-center tabular-nums">100%</span>
      <button onclick="_pdfZoomBy(0.25)" class="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 text-base font-bold transition-colors">+</button>
    </div>

    <div class="w-px h-5 bg-slate-700 flex-shrink-0"></div>

    <!-- Annotation tools -->
    <div class="flex items-center gap-1 flex-shrink-0">
      <button id="pdf-tool-read" onclick="pdfSetTool('read')" title="Read mode"
        class="px-2 h-7 rounded text-xs font-medium transition-colors text-slate-400 hover:text-white hover:bg-slate-700">
        ↖ Read
      </button>
      <button id="pdf-tool-highlight" onclick="pdfSetTool('highlight')" title="Highlight selected text"
        class="px-2 h-7 rounded text-xs font-medium transition-colors text-slate-400 hover:text-white hover:bg-slate-700">
        🖊 Highlight
      </button>
      <div class="flex gap-0.5">
        ${PDF_HL_COLORS.map(c=>`
        <button onclick="_pdfPickHlColor('${c}')" id="phl-${c.slice(1)}"
          style="width:14px;height:14px;border-radius:3px;background:${c};border:2px solid ${c===_pdfHlColor?'#fff':'transparent'};flex-shrink:0"
          title="${c}"></button>`).join('')}
      </div>
      <button id="pdf-tool-note" onclick="pdfSetTool('note')" title="Add a note at cursor position"
        class="px-2 h-7 rounded text-xs font-medium transition-colors text-slate-400 hover:text-white hover:bg-slate-700">
        📝 Note
      </button>
    </div>

    <div class="w-px h-5 bg-slate-700 flex-shrink-0"></div>

    <button onclick="pdfExportAnnotations()" title="Export annotations as Markdown"
      class="px-2 h-7 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex-shrink-0">
      ↓ Export
    </button>
    <span class="text-[10px] text-slate-600 flex-shrink-0">${anns.length} annotation${anns.length!==1?'s':''}</span>
  </div>

  <!-- ── Main area ──────────────────────────────────────────────────────────── -->
  <div class="flex flex-1 overflow-hidden">

    <!-- PDF viewport -->
    <div id="pdf-viewport" class="flex-1 overflow-auto flex flex-col items-center py-6 gap-6 relative"
      onmouseup="_pdfHandleSelection(event)"
      onclick="_pdfHandleClick(event)">
      <div id="pdf-page-container" class="relative shadow-2xl">
        <canvas id="pdf-canvas" class="block"></canvas>
        <!-- Text layer for selectable text -->
        <div id="pdf-text-layer" class="absolute inset-0 overflow-hidden select-text"
          style="line-height:1;font-family:sans-serif"></div>
        <!-- Annotation overlay -->
        <div id="pdf-ann-overlay" class="absolute inset-0 pointer-events-none overflow-hidden"></div>
      </div>
    </div>

    <!-- Annotations panel -->
    <div id="pdf-ann-panel" class="w-64 bg-slate-800 border-l border-slate-700/60 flex flex-col overflow-hidden flex-shrink-0">
      <div class="px-3 py-2.5 border-b border-slate-700/60 flex items-center justify-between flex-shrink-0">
        <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Annotations</span>
        <span id="pdf-ann-count" class="text-xs text-slate-500">${anns.length}</span>
      </div>
      <div id="pdf-ann-list" class="flex-1 overflow-y-auto">
        ${_pdfAnnListHTML(paper.annotations||[])}
      </div>
    </div>

  </div>`
}

function _pdfAnnListHTML(anns) {
  if (!anns.length) return `
  <div class="px-3 py-8 text-center">
    <div class="text-3xl mb-2 opacity-30">📝</div>
    <p class="text-xs text-slate-500">No annotations yet.</p>
    <p class="text-xs text-slate-600 mt-1">Select text and click Highlight,<br/>or use Note mode to add notes.</p>
  </div>`
  return anns.map((a,i) => `
  <div class="border-b border-slate-700/40 px-3 py-2.5 hover:bg-slate-700/40 transition-colors group cursor-pointer"
    onclick="_pdfJumpToAnn(${i})">
    <div class="flex items-start gap-2">
      <div class="flex-shrink-0 mt-0.5">
        ${a.type==='highlight'
          ? `<div style="width:10px;height:10px;border-radius:2px;background:${a.color||'#fde68a'}"></div>`
          : `<span class="text-base leading-none">📝</span>`}
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-[10px] text-slate-500 mb-0.5">p.${a.page} · ${a.type}</div>
        ${a.text ? `<div class="text-xs text-slate-300 leading-snug line-clamp-2">"${esc(a.text)}"</div>` : ''}
        ${a.note ? `<div class="text-xs text-slate-400 mt-1 italic">${esc(a.note)}</div>` : ''}
      </div>
      <button onclick="event.stopPropagation();_pdfDeleteAnn(${i})"
        class="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-sm leading-none flex-shrink-0">✕</button>
    </div>
  </div>`).join('')
}

// ── Rendering ────────────────────────────────────────────────────────────────
async function _pdfSetPage(n) {
  if (!_pdfDoc) return
  n = Math.max(1, Math.min(n, _pdfDoc.numPages))
  _pdfPage = n

  const inp = document.getElementById('pdf-page-inp')
  if (inp) inp.value = n

  if (_pdfRendering) return
  _pdfRendering = true

  try {
    const page    = await _pdfDoc.getPage(n)
    const vp      = page.getViewport({ scale: _pdfZoom })
    const canvas  = document.getElementById('pdf-canvas')
    const ctx     = canvas.getContext('2d')
    canvas.width  = vp.width
    canvas.height = vp.height
    const container = document.getElementById('pdf-page-container')
    if (container) { container.style.width = vp.width+'px'; container.style.height = vp.height+'px' }

    await page.render({ canvasContext: ctx, viewport: vp }).promise

    // Text layer
    const textLayer = document.getElementById('pdf-text-layer')
    if (textLayer) {
      textLayer.innerHTML = ''
      textLayer.style.width  = vp.width+'px'
      textLayer.style.height = vp.height+'px'
      const textContent = await page.getTextContent()
      await new window.pdfjsLib.TextLayer({
        textContentSource: textContent,
        container: textLayer,
        viewport: vp,
      }).render()
    }

    // Re-draw annotation overlays for this page
    _pdfDrawAnnotationOverlays(n, vp)

    // Store viewport for hit-testing
    window._pdfCurrentVp = vp
    window._pdfCurrentPage = n
  } catch(e) {
    console.error('PDF render error:', e)
  }

  _pdfRendering = false
}

function _pdfDrawAnnotationOverlays(pageNum, vp) {
  const overlay = document.getElementById('pdf-ann-overlay')
  if (!overlay) return
  overlay.innerHTML = ''
  const paper = (state.papers||[]).find(p=>p.id===_pdfPaperId)
  if (!paper?.annotations) return
  paper.annotations.filter(a=>a.page===pageNum && a.rects?.length).forEach(a => {
    a.rects.forEach(r => {
      const div = document.createElement('div')
      div.style.cssText = `position:absolute;left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;background:${a.color||'#fde68a'};opacity:0.4;pointer-events:none;mix-blend-mode:multiply`
      overlay.appendChild(div)
    })
  })
}

function _pdfNavPage(delta) { _pdfSetPage(_pdfPage + delta) }

function _pdfZoomBy(delta) {
  _pdfZoom = Math.max(0.5, Math.min(3.0, _pdfZoom + delta))
  const label = document.getElementById('pdf-zoom-label')
  if (label) label.textContent = Math.round(_pdfZoom*100)+'%'
  _pdfSetPage(_pdfPage)
}

// ── Annotation tools ─────────────────────────────────────────────────────────
function pdfSetTool(tool) {
  _pdfTool = tool
  ;['read','highlight','note'].forEach(t => {
    const btn = document.getElementById('pdf-tool-'+t)
    if (!btn) return
    btn.className = btn.className.replace('bg-indigo-600 text-white','text-slate-400 hover:text-white hover:bg-slate-700')
    if (t === tool) btn.className = btn.className.replace('text-slate-400 hover:text-white hover:bg-slate-700','bg-indigo-600 text-white')
  })
  const vp = document.getElementById('pdf-viewport')
  if (vp) vp.style.cursor = tool==='note' ? 'crosshair' : tool==='highlight' ? 'text' : 'default'
}

function _pdfPickHlColor(color) {
  _pdfHlColor = color
  PDF_HL_COLORS.forEach(c => {
    const btn = document.getElementById('phl-'+c.slice(1))
    if (btn) btn.style.border = `2px solid ${c===color?'#fff':'transparent'}`
  })
}

function _pdfHandleSelection(e) {
  if (_pdfTool !== 'highlight') return
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed) return
  const text = sel.toString().trim()
  if (!text) return

  // Get rects in canvas coordinate space
  const container = document.getElementById('pdf-page-container')
  if (!container) return
  const bounds = container.getBoundingClientRect()
  const rects = []
  for (let i=0; i<sel.rangeCount; i++) {
    const range = sel.getRangeAt(i)
    for (const r of range.getClientRects()) {
      rects.push({
        x: r.left - bounds.left,
        y: r.top  - bounds.top,
        w: r.width,
        h: r.height,
      })
    }
  }
  if (!rects.length) return

  sel.removeAllRanges()
  _pdfSaveAnnotation({
    type: 'highlight',
    page: _pdfPage,
    text,
    color: _pdfHlColor,
    rects,
    note: '',
  })
}

function _pdfHandleClick(e) {
  if (_pdfTool !== 'note') return
  const container = document.getElementById('pdf-page-container')
  if (!container) return
  const bounds = container.getBoundingClientRect()
  const x = e.clientX - bounds.left
  const y = e.clientY - bounds.top
  const note = prompt('Note text:')
  if (note === null || note.trim() === '') return
  _pdfSaveAnnotation({ type: 'note', page: _pdfPage, x, y, note: note.trim(), text: '' })
}

function _pdfSaveAnnotation(ann) {
  const paper = (state.papers||[]).find(p=>p.id===_pdfPaperId)
  if (!paper) return
  if (!paper.annotations) paper.annotations = []
  paper.annotations.unshift({ id: 'ann-'+uid(), createdAt: new Date().toISOString(), ...ann })
  save('papers')
  _pdfRefreshAnnotations()
  _pdfDrawAnnotationOverlays(_pdfPage, window._pdfCurrentVp)
  showToast(ann.type==='highlight' ? 'Highlight saved ✓' : 'Note saved ✓')
}

function _pdfDeleteAnn(idx) {
  const paper = (state.papers||[]).find(p=>p.id===_pdfPaperId)
  if (!paper?.annotations) return
  paper.annotations.splice(idx, 1)
  save('papers')
  _pdfRefreshAnnotations()
  _pdfDrawAnnotationOverlays(_pdfPage, window._pdfCurrentVp)
}

function _pdfJumpToAnn(idx) {
  const paper = (state.papers||[]).find(p=>p.id===_pdfPaperId)
  if (!paper?.annotations?.[idx]) return
  _pdfSetPage(paper.annotations[idx].page)
}

function _pdfRefreshAnnotations() {
  const paper = (state.papers||[]).find(p=>p.id===_pdfPaperId)
  const anns  = paper?.annotations || []
  const list  = document.getElementById('pdf-ann-list')
  const count = document.getElementById('pdf-ann-count')
  if (list)  list.innerHTML  = _pdfAnnListHTML(anns)
  if (count) count.textContent = anns.length
}

// ── Export annotations ────────────────────────────────────────────────────────
async function pdfExportAnnotations() {
  const paper = (state.papers||[]).find(p=>p.id===_pdfPaperId)
  if (!paper) return
  const anns  = paper.annotations || []
  const lines = [`# Annotations — ${paper.title||'Untitled'}`, `Exported: ${new Date().toLocaleDateString()}`, '']
  const byPage = {}
  anns.forEach(a => { ;(byPage[a.page]||(byPage[a.page]=[])).push(a) })
  Object.keys(byPage).sort((a,b)=>+a-+b).forEach(p => {
    lines.push(`## Page ${p}`)
    byPage[p].forEach(a => {
      if (a.type==='highlight') {
        lines.push(`> **[Highlight]** ${a.text}`)
        if (a.note) lines.push(`> *Note:* ${a.note}`)
      } else {
        lines.push(`> **[Note]** ${a.note}`)
      }
      lines.push('')
    })
  })
  if (!anns.length) lines.push('_No annotations yet._')

  const wsDir  = await api.getWorkspaceDir().catch(()=>null)
  const fname  = (paper.title||'annotations').replace(/[/\\:*?"<>|]/g,'_').slice(0,60)+'_annotations.md'
  const dest   = await api.openSaveDialog({
    title: 'Export annotations',
    defaultPath: wsDir ? wsDir+'\\Notes\\'+fname : fname,
    filters: [{ name:'Markdown', extensions:['md'] }],
  })
  if (!dest) return
  await api.writeTextFile(dest, lines.join('\n'))
  showToast('Annotations exported ✓')
}

// ── Close ─────────────────────────────────────────────────────────────────────
function closePdfReader() {
  _pdfDoc = null
  document.getElementById('pdf-reader-overlay')?.remove()
  document.body.style.overflow = ''
  window._pdfCurrentVp   = null
  window._pdfCurrentPage = null
}

// Keyboard navigation while reader is open
document.addEventListener('keydown', e => {
  if (!document.getElementById('pdf-reader-overlay')) return
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown')  { e.preventDefault(); _pdfNavPage(1) }
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')    { e.preventDefault(); _pdfNavPage(-1) }
  if (e.key === 'Escape')                               { e.preventDefault(); closePdfReader() }
  if ((e.ctrlKey||e.metaKey) && e.key==='=')            { e.preventDefault(); _pdfZoomBy(0.25) }
  if ((e.ctrlKey||e.metaKey) && e.key==='-')            { e.preventDefault(); _pdfZoomBy(-0.25) }
})
