// ══ PDF Page Manager — visual reorder / rotate / delete ════════════════════════
// Uses PDF.js (window.pdfjsLib) for thumbnails; saving is done via pdf-lib (main process)

let _pmDoc      = null   // pdf.js document
let _pmFilepath = null
let _pmPages    = []     // [{ origIndex, rotate }]  — current order
let _pmDragIdx  = null

// ── Open overlay ────────────────────────────────────────────────────────────────
async function openPdfPageManager(filepath) {
  if (!window.pdfjsLib) { showToast('PDF renderer still loading — try again in a moment', 'error'); return }

  _pmFilepath = filepath
  _pmDoc      = null
  _pmPages    = []
  _pmDragIdx  = null

  const overlay = document.createElement('div')
  overlay.id = 'pm-overlay'
  overlay.style.cssText = 'position:fixed;inset:0;z-index:500;display:flex;flex-direction:column;background:#1e293b'
  overlay.innerHTML = _pmShell(filepath)
  document.body.appendChild(overlay)
  document.body.style.overflow = 'hidden'

  try {
    const base64 = await api.readBinaryFile(filepath)
    const binary = atob(base64)
    const bytes  = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    _pmDoc   = await window.pdfjsLib.getDocument({ data: bytes }).promise
    _pmPages = Array.from({ length: _pmDoc.numPages }, (_, i) => ({ origIndex: i, rotate: 0 }))
    await _pmRenderGrid()
  } catch(e) {
    showToast('Could not load PDF: ' + e.message, 'error')
    closePdfPageManager()
  }
}

function _pmShell(filepath) {
  const name = filepath.split('\\').pop()
  return `
  <div class="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-700/60 flex-shrink-0">
    <button onclick="closePdfPageManager()" title="Close"
      class="text-slate-400 hover:text-white text-lg leading-none px-1 flex-shrink-0 transition-colors">✕</button>
    <div class="flex-1 min-w-0">
      <span class="text-sm font-semibold text-slate-200 truncate block">🗂 Page Manager — ${esc(name)}</span>
    </div>
    <span id="pm-count" class="text-xs text-slate-500 flex-shrink-0"></span>
    <button onclick="_pmReset()"
      class="px-3 h-8 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex-shrink-0">↺ Reset</button>
    <button onclick="_pmSave()"
      class="px-3 h-8 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex-shrink-0">💾 Save As New PDF…</button>
  </div>
  <div class="flex-1 overflow-y-auto p-5">
    <p class="text-xs text-slate-400 mb-3">Drag thumbnails to reorder pages. Use the buttons on each page to rotate or delete it. Nothing is changed until you click "Save As New PDF".</p>
    <div id="pm-grid" class="flex flex-wrap gap-4"></div>
  </div>`
}

// ── Render thumbnail grid ─────────────────────────────────────────────────────
async function _pmRenderGrid() {
  const grid = document.getElementById('pm-grid')
  if (!grid) return

  const countEl = document.getElementById('pm-count')
  if (countEl) countEl.textContent = `${_pmPages.length} page${_pmPages.length!==1?'s':''}`

  if (!_pmPages.length) {
    grid.innerHTML = `<p class="text-sm text-slate-500">No pages left. Use Reset to start over.</p>`
    return
  }

  grid.innerHTML = _pmPages.map((p,i) => `
    <div class="pm-tile bg-slate-800 border-2 border-transparent rounded-lg p-2 flex flex-col items-center gap-1.5 cursor-move transition-colors"
      draggable="true" data-idx="${i}"
      ondragstart="_pmDragStart(event,${i})" ondragover="_pmDragOver(event,${i})" ondrop="_pmDrop(event,${i})" ondragend="_pmDragEnd(event)"
      style="width:140px">
      <div class="relative">
        <canvas id="pm-canvas-${i}" class="block bg-white shadow rounded"></canvas>
        ${p.rotate ? `<span class="absolute top-1 right-1 bg-slate-900/80 text-white text-[10px] px-1.5 py-0.5 rounded">↻ ${p.rotate}°</span>` : ''}
      </div>
      <div class="text-xs text-slate-300">Page ${p.origIndex+1}</div>
      <div class="flex gap-1">
        <button onclick="_pmRotate(${i})" title="Rotate 90°"
          class="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs transition-colors">↻</button>
        <button onclick="_pmDelete(${i})" title="Delete page"
          class="w-7 h-7 rounded bg-slate-700 hover:bg-red-600 text-slate-200 text-xs transition-colors">🗑</button>
      </div>
    </div>`).join('')

  // Render thumbnails after the canvases exist in the DOM
  for (let i = 0; i < _pmPages.length; i++) {
    const p = _pmPages[i]
    try {
      const page   = await _pmDoc.getPage(p.origIndex + 1)
      const vp     = page.getViewport({ scale: 0.25, rotation: p.rotate })
      const canvas = document.getElementById(`pm-canvas-${i}`)
      if (!canvas) continue
      canvas.width  = vp.width
      canvas.height = vp.height
      canvas.style.maxWidth  = '120px'
      canvas.style.maxHeight = '160px'
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
    } catch {}
  }
}

// ── Drag & drop reordering ────────────────────────────────────────────────────
function _pmDragStart(e, idx) {
  _pmDragIdx = idx
  e.dataTransfer.effectAllowed = 'move'
  e.target.closest('.pm-tile')?.classList.add('opacity-40')
}
function _pmDragOver(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
}
function _pmDrop(e, idx) {
  e.preventDefault()
  if (_pmDragIdx === null || _pmDragIdx === idx) return
  const [moved] = _pmPages.splice(_pmDragIdx, 1)
  _pmPages.splice(idx, 0, moved)
  _pmDragIdx = null
  _pmRenderGrid()
}
function _pmDragEnd() {
  document.querySelectorAll('.pm-tile').forEach(el => el.classList.remove('opacity-40'))
  _pmDragIdx = null
}

// ── Per-page actions ───────────────────────────────────────────────────────────
function _pmRotate(i) {
  _pmPages[i].rotate = (_pmPages[i].rotate + 90) % 360
  _pmRenderGrid()
}
function _pmDelete(i) {
  _pmPages.splice(i, 1)
  _pmRenderGrid()
}
function _pmReset() {
  if (!_pmDoc) return
  _pmPages = Array.from({ length: _pmDoc.numPages }, (_, i) => ({ origIndex: i, rotate: 0 }))
  _pmRenderGrid()
}

// ── Save ───────────────────────────────────────────────────────────────────────
async function _pmSave() {
  if (!_pmPages.length) { showToast('No pages to save', 'error'); return }
  const dest = await api.openSaveDialog({
    title: 'Save reorganized PDF',
    defaultPath: _pmFilepath.replace(/\.pdf$/i, '_edited.pdf'),
    filters: [{ name:'PDF', extensions:['pdf'] }],
  })
  if (!dest) return
  const pages = _pmPages.map(p => ({ index: p.origIndex, rotate: p.rotate }))
  const r = await api.rebuildPdf(_pmFilepath, dest, pages)
  if (r.success) {
    showToast(`Saved ${r.pageCount} page(s) ✓`)
    _pushToolHist('pdf', { op:'pagemgr', label:`Page Manager: ${_pmFilepath.split('\\').pop()} → ${dest.split('\\').pop()}`, file: _pmFilepath.split('\\').pop(), dest })
    closePdfPageManager()
  } else showToast('Failed: '+r.error, 'error')
}

// ── Close ─────────────────────────────────────────────────────────────────────
function closePdfPageManager() {
  _pmDoc      = null
  _pmFilepath = null
  _pmPages    = []
  document.getElementById('pm-overlay')?.remove()
  document.body.style.overflow = ''
}

document.addEventListener('keydown', e => {
  if (!document.getElementById('pm-overlay')) return
  if (e.key === 'Escape') closePdfPageManager()
})
