// ══ Paper Library View ════════════════════════════════════════════════════════

// ── Helpers ───────────────────────────────────────────────────────────────────
function _authorStr(p) {
  if (!p.authors) return ''
  return Array.isArray(p.authors) ? p.authors.join(', ') : p.authors
}
function _authorArr(p) {
  if (!p.authors) return []
  return Array.isArray(p.authors) ? p.authors : p.authors.split(/\s*[;]\s*/).map(a=>a.trim()).filter(Boolean)
}

// ── Render ────────────────────────────────────────────────────────────────────
function render_library() {
  const vc = document.getElementById('view-content')
  vc.innerHTML = `
  ${pageHeader('📚 Paper Library', `
    <div class="flex gap-2">
      <div class="relative">
        <button onclick="toggleLibMenu('import')" class="btn-secondary text-xs py-2">⬇ Import ▾</button>
        <div id="lib-import-menu" class="hidden absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 w-52 py-1">
          <button onclick="openLibraryPicker();closeLibMenus()" class="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50">📄 Import PDF(s)</button>
          <div class="border-t border-slate-100 my-1"></div>
          <button onclick="importCitation();closeLibMenus()" class="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50">🔗 Import .bib <span class="text-xs text-slate-400">(Zotero)</span></button>
          <button onclick="importCitation();closeLibMenus()" class="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50">🔗 Import .ris <span class="text-xs text-slate-400">(Endnote)</span></button>
        </div>
      </div>
      <div class="relative">
        <button onclick="toggleLibMenu('export')" class="btn-secondary text-xs py-2">⬆ Export ▾</button>
        <div id="lib-export-menu" class="hidden absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 w-52 py-1">
          <button onclick="exportLibrary('bib','all');closeLibMenus()" class="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50">📋 Export all as .bib</button>
          <button onclick="exportLibrary('ris','all');closeLibMenus()" class="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50">📋 Export all as .ris</button>
          <div class="border-t border-slate-100 my-1"></div>
          <button onclick="exportLibrary('bib','filtered');closeLibMenus()" class="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-500">📋 Export filtered as .bib</button>
          <button onclick="exportLibrary('ris','filtered');closeLibMenus()" class="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-500">📋 Export filtered as .ris</button>
        </div>
      </div>
    </div>`)}

  <!-- Filter bar -->
  <div class="bg-white border-b border-slate-200 px-5 py-3 flex gap-2 flex-shrink-0 flex-wrap">
    <input id="lib-search" type="text" placeholder="Search title or author..."
      oninput="renderLibrary()"
      class="flex-1 min-w-48 px-3 py-1.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
    <select id="lib-project" onchange="renderLibrary()" class="input" style="width:auto;padding:.35rem .75rem;font-size:.8rem">
      <option value="all">All projects</option>
      ${state.projects.map(pr=>`<option value="${pr.id}">${esc(pr.name)}</option>`).join('')}
      <option value="none">— Unlinked —</option>
    </select>
    <select id="lib-status" onchange="renderLibrary()" class="input" style="width:auto;padding:.35rem .75rem;font-size:.8rem">
      <option value="all">All status</option>
      <option value="unread">Unread</option>
      <option value="reading">Reading</option>
      <option value="read">Read</option>
    </select>
  </div>

  <!-- DOI / arXiv fetch bar -->
  <div class="mx-5 mt-3 flex gap-2 flex-shrink-0">
    <input id="lib-doi-input" type="text" placeholder="Paste DOI or arXiv URL to auto-import metadata…"
      class="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
      onkeydown="if(event.key==='Enter')libFetchMeta()"/>
    <button onclick="libFetchMeta()" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors flex-shrink-0">Fetch →</button>
  </div>

  <!-- Drop zone -->
  <div id="lib-drop-zone"
    class="drop-zone mx-5 mt-2 border-2 border-dashed border-slate-200 rounded-xl px-4 py-2 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors flex-shrink-0"
    onclick="openLibraryPicker()">
    <p class="text-slate-400 text-xs">📄 Drop PDFs here · or drag a .bib / .ris file to import citations</p>
  </div>
  <div id="lib-import-progress" class="hidden mx-5 mt-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2 flex items-center gap-3 flex-shrink-0">
    <div class="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
    <p id="lib-import-msg" class="text-indigo-700 text-xs"></p>
  </div>

  <!-- Paper list -->
  <div class="flex-1 overflow-y-auto px-5 py-3">
    <div id="papers-list" class="space-y-1.5 max-w-4xl"></div>
  </div>`

  setupLibraryDropZone()
  renderLibrary()
  document.addEventListener('click', _closeLibMenusOutside, { once: false })
}

function toggleLibMenu(which) {
  const imp = document.getElementById('lib-import-menu')
  const exp = document.getElementById('lib-export-menu')
  if (which === 'import') { imp.classList.toggle('hidden'); exp.classList.add('hidden') }
  else                    { exp.classList.toggle('hidden'); imp.classList.add('hidden') }
}
function closeLibMenus() {
  document.getElementById('lib-import-menu')?.classList.add('hidden')
  document.getElementById('lib-export-menu')?.classList.add('hidden')
}
function _closeLibMenusOutside(e) {
  if (!e.target.closest('#lib-import-menu') && !e.target.closest('#lib-export-menu') &&
      !e.target.closest('[onclick*="toggleLibMenu"]')) closeLibMenus()
}

// ── Rendering ─────────────────────────────────────────────────────────────────
function renderLibrary() {
  const q    = document.getElementById('lib-search')?.value.toLowerCase()  || ''
  const proj = document.getElementById('lib-project')?.value  || 'all'
  const sta  = document.getElementById('lib-status')?.value   || 'all'

  let papers = [...state.papers].reverse()

  if (q) papers = papers.filter(p =>
    p.title?.toLowerCase().includes(q) ||
    _authorStr(p).toLowerCase().includes(q) ||
    p.journal?.toLowerCase().includes(q))

  if (proj === 'none')      papers = papers.filter(p => !p.projectIds?.length)
  else if (proj !== 'all')  papers = papers.filter(p => p.projectIds?.includes(proj))

  if (sta !== 'all') papers = papers.filter(p => p.status === sta)

  const list = document.getElementById('papers-list')
  if (!papers.length) {
    list.innerHTML = emptyState('📖', 'No papers found', q || proj !== 'all' || sta !== 'all'
      ? 'No papers match your filters'
      : 'Import PDFs or a .bib / .ris file to start your library')
    return
  }

  // show total count
  const total = document.getElementById('lib-count')
  if (total) total.textContent = `${papers.length} paper${papers.length !== 1 ? 's' : ''}`

  const staColors = {
    unread:  'bg-amber-100 text-amber-700',
    reading: 'bg-blue-100 text-blue-700',
    read:    'bg-green-100 text-green-700',
    archived:'bg-slate-100 text-slate-400'
  }
  const srcIcons = { bib:'🔗', ris:'🔗', pdf:'📄', 'pdf-import':'📄' }

  list.innerHTML = `
  <div class="flex items-center justify-between text-xs text-slate-400 px-1 mb-2">
    <span>${papers.length} paper${papers.length!==1?'s':''}</span>
  </div>` +
  papers.map(p => {
    const authors = _authorStr(p)
    const srcIcon = srcIcons[p.source] || '📄'
    const linkedProj = state.projects.find(pr => p.projectIds?.includes(pr.id))
    return `
    <div class="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-3 hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer"
         onclick="openPaperDetail('${p.id}')">
      <div class="text-lg flex-shrink-0 mt-0.5 select-none">${srcIcon}</div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-slate-900 text-sm leading-snug">${esc(p.title || 'Untitled')}</div>
        <div class="flex items-center gap-1.5 mt-0.5 flex-wrap text-xs text-slate-400">
          ${authors ? `<span class="truncate max-w-xs">${esc(authors)}</span>` : ''}
          ${p.year   ? `<span>· ${p.year}</span>` : ''}
          ${p.journal? `<span class="truncate max-w-xs">· ${esc(p.journal)}</span>` : ''}
          ${p.doi    ? `<button onclick="event.stopPropagation();window.api.openExternal('https://doi.org/${esc(p.doi)}')"
              class="text-indigo-400 hover:text-indigo-600 hover:underline ml-1">DOI ↗</button>` : ''}
        </div>
        ${linkedProj ? `<div class="mt-1"><span class="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">${esc(linkedProj.name)}</span></div>` : ''}
      </div>
      <span class="text-xs px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${staColors[p.status] || 'bg-slate-100 text-slate-500'}">${p.status || 'unread'}</span>
    </div>`
  }).join('')
}

// ── PDF import ────────────────────────────────────────────────────────────────
function setupLibraryDropZone() {
  const zone = document.getElementById('lib-drop-zone')
  if (!zone) return
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('dragover') })
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'))
  zone.addEventListener('drop', async e => {
    e.preventDefault(); zone.classList.remove('dragover')
    const files = [...e.dataTransfer.files]
    const pdfs  = files.filter(f => f.name.toLowerCase().endsWith('.pdf'))
    const bibs  = files.filter(f => f.name.toLowerCase().endsWith('.bib') || f.name.toLowerCase().endsWith('.ris'))
    if (pdfs.length)  await importPapers(pdfs.map(f=>f.path))
    if (bibs.length)  await importDroppedCitationFiles(bibs)
    if (!pdfs.length && !bibs.length) showToast('Drop PDFs or .bib/.ris files', 'error')
  })
}

async function openLibraryPicker() {
  const paths = await window.api.openPdfDialog()
  if (paths.length) await importPapers(paths)
}

async function importPapers(filepaths) {
  const prog = document.getElementById('lib-import-progress')
  const msg  = document.getElementById('lib-import-msg')
  prog.classList.remove('hidden')
  let added = 0
  for (let i = 0; i < filepaths.length; i++) {
    const fp = filepaths[i]
    if (state.papers.some(p => p.filepath === fp)) { showToast('Already in library','info'); continue }
    msg.textContent = `Reading ${i+1}/${filepaths.length}: ${fp.split(/[\\/]/).pop()}`
    const r = await window.api.parsePdf(fp)
    if (!r.success) { showToast(`Failed: ${r.error}`, 'error'); continue }
    state.papers.push({
      id: uid(), ...r.metadata,
      topics: [], relevance: 'medium', status: 'unread',
      projectIds: [], notes: '', source: 'pdf',
      addedAt: new Date().toISOString()
    })
    added++
    save('papers')
  }
  prog.classList.add('hidden')
  if (added) { renderLibrary(); showToast(`${added} paper${added>1?'s':''} imported ✓`) }
}

// ── Citation file import (.bib / .ris) ────────────────────────────────────────
async function importCitation() {
  const files = await window.api.openCitationDialog()
  if (!files.length) return
  await importDroppedCitationFiles(files)
}

async function importDroppedCitationFiles(files) {
  // files can be from IPC ({path,ext,content}) or from drag-drop (File objects)
  let total = 0
  for (const f of files) {
    let content, ext
    if (f.content !== undefined) { content = f.content; ext = f.ext }
    else { content = await f.text(); ext = f.name.split('.').pop().toLowerCase() }

    const parsed = ext === 'bib' ? parseBib(content) : parseRis(content)
    const added  = []
    for (const p of parsed) {
      const dup = state.papers.some(x =>
        x.doi && p.doi && x.doi === p.doi ||
        x.title?.toLowerCase() === p.title?.toLowerCase())
      if (!dup) { state.papers.push(p); added.push(p) }
    }
    total += added.length
    if (added.length) save('papers')
  }
  renderLibrary()
  showToast(total > 0 ? `${total} paper${total>1?'s':''} imported ✓` : 'No new papers found (duplicates skipped)')
}

// ── BibTeX parser ─────────────────────────────────────────────────────────────
function parseBib(text) {
  const papers = []
  const entryRe = /@(\w+)\s*\{\s*[^,\s]*\s*,([\s\S]*?)(?=\n\s*@|\s*$)/gm
  let m
  while ((m = entryRe.exec(text)) !== null) {
    const type = m[1].toLowerCase()
    if (['string','preamble','comment'].includes(type)) continue
    const f = {}
    const fieldRe = /(\w+)\s*=\s*(?:\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}|"([^"]*)"|([\w\d.-]+))/g
    let fm
    while ((fm = fieldRe.exec(m[2])) !== null)
      f[fm[1].toLowerCase()] = (fm[2]??fm[3]??fm[4]??'').replace(/\s+/g,' ').replace(/[{}]/g,'').trim()
    if (!f.title) continue
    const authors = (f.author||f.editor||'')
      .split(/ and /i).map(a=>a.trim()).filter(Boolean)
    papers.push({
      id: uid(), title: f.title,
      authors,
      year:     parseInt(f.year)||null,
      journal:  f.journal||f.booktitle||f.publisher||'',
      doi:      f.doi||'', url: f.url||f.link||'',
      abstract: f.abstract||'',
      topics:   f.keywords ? f.keywords.split(/[,;]/).map(k=>k.trim()).filter(Boolean) : [],
      relevance:'medium', status:'unread', source:'bib',
      addedAt:  new Date().toISOString()
    })
  }
  return papers
}

// ── RIS parser ────────────────────────────────────────────────────────────────
function parseRis(text) {
  const papers = []
  const entries = text.split(/^ER\s*-?\s*\r?$/m)
  for (const entry of entries) {
    if (!entry.trim()) continue
    const f = {}; const authors = []; const kw = []
    for (const line of entry.split('\n')) {
      const lm = line.match(/^([A-Z][A-Z0-9])\s{2}-\s*(.+)$/)
      if (!lm) continue
      const [,tag,val] = lm; const v = val.trim()
      if      (tag==='TI'||tag==='T1')            f.title   = v
      else if (tag==='AU'||tag==='A1'||tag==='A2') authors.push(v)
      else if (tag==='PY'||tag==='Y1')             f.year    = parseInt(v)||null
      else if (tag==='JO'||tag==='JF'||tag==='T2'||tag==='J2') f.journal = v
      else if (tag==='DO')                         f.doi     = v
      else if (tag==='UR')                         f.url     = v
      else if (tag==='AB'||tag==='N2')             f.abstract= v
      else if (tag==='KW')                         kw.push(v)
    }
    if (!f.title) continue
    papers.push({
      id: uid(), title: f.title, authors,
      year: f.year, journal: f.journal||'',
      doi: f.doi||'', url: f.url||'',
      abstract: f.abstract||'', topics: kw,
      relevance:'medium', status:'unread', source:'ris',
      addedAt: new Date().toISOString()
    })
  }
  return papers
}

// ── Export (.bib / .ris) ──────────────────────────────────────────────────────
async function exportLibrary(fmt, scope) {
  let papers = scope === 'filtered' ? _getFilteredPapers() : state.papers
  if (!papers.length) { showToast('No papers to export','error'); return }

  const content = fmt === 'bib' ? _toBib(papers) : _toRis(papers)
  const ext     = fmt === 'bib' ? 'bib' : 'ris'
  const dest    = await window.api.openSaveDialog({
    title: `Export as .${ext}`,
    defaultPath: `phd-library.${ext}`,
    filters: [{ name: ext.toUpperCase(), extensions: [ext] }]
  })
  if (!dest) return
  await window.api.writeTextFile(dest, content)
  showToast(`Exported ${papers.length} papers as .${ext} ✓`)
}

function _getFilteredPapers() {
  const q    = document.getElementById('lib-search')?.value.toLowerCase() || ''
  const proj = document.getElementById('lib-project')?.value || 'all'
  const sta  = document.getElementById('lib-status')?.value  || 'all'
  let papers = [...state.papers]
  if (q)           papers = papers.filter(p => p.title?.toLowerCase().includes(q) || _authorStr(p).toLowerCase().includes(q))
  if (proj==='none')     papers = papers.filter(p => !p.projectIds?.length)
  else if (proj!=='all') papers = papers.filter(p => p.projectIds?.includes(proj))
  if (sta !== 'all') papers = papers.filter(p => p.status === sta)
  return papers
}

function _toBib(papers) {
  return papers.map((p, i) => {
    const firstAuthorLast = (_authorArr(p)[0]||'Author').split(/[\s,]+/).filter(Boolean).slice(-1)[0]
    const key  = firstAuthorLast.replace(/[^a-zA-Z]/g,'') + (p.year||'') + i
    const auth = _authorArr(p).join(' and ')
    return `@article{${key},\n  title    = {${(p.title||'').replace(/[{}]/g,'')}},\n  author   = {${auth}},\n  year     = {${p.year||''}},\n  journal  = {${(p.journal||'').replace(/[{}]/g,'')}},\n  doi      = {${p.doi||''}},\n  url      = {${p.url||''}},\n  abstract = {${(p.abstract||'').replace(/[{}]/g,'').slice(0,500)}}\n}`
  }).join('\n\n')
}

function _toRis(papers) {
  return papers.map(p => {
    const lines = ['TY  - JOUR']
    if (p.title)   lines.push(`TI  - ${p.title}`)
    _authorArr(p).forEach(a => lines.push(`AU  - ${a}`))
    if (p.year)    lines.push(`PY  - ${p.year}`)
    if (p.journal) lines.push(`JO  - ${p.journal}`)
    if (p.doi)     lines.push(`DO  - ${p.doi}`)
    if (p.url)     lines.push(`UR  - ${p.url}`)
    if (p.abstract)lines.push(`AB  - ${p.abstract.slice(0,2000)}`)
    p.topics?.forEach(k => lines.push(`KW  - ${k}`))
    lines.push('ER  - ')
    return lines.join('\r\n')
  }).join('\r\n\r\n')
}

// ── Paper detail modal ────────────────────────────────────────────────────────
function openPaperDetail(id) {
  const p = state.papers.find(x=>x.id===id)
  if (!p) return
  const authors = _authorStr(p)
  const staColors = {unread:'bg-amber-100 text-amber-700',reading:'bg-blue-100 text-blue-700',read:'bg-green-100 text-green-700'}

  openModal(`
  <div class="mb-4">
    <h3 class="font-bold text-slate-900 text-base leading-snug mb-1">${esc(p.title||'Untitled')}</h3>
    ${authors ? `<p class="text-slate-500 text-sm">${esc(authors)}</p>` : ''}
    <div class="flex gap-2 mt-2 flex-wrap text-xs text-slate-400">
      ${p.year    ? `<span>${p.year}</span>` : ''}
      ${p.journal ? `<span>· ${esc(p.journal)}</span>` : ''}
      ${p.doi     ? `<button onclick="window.api.openExternal('https://doi.org/${esc(p.doi)}')" class="text-indigo-500 hover:underline">DOI ↗</button>` : ''}
      ${p.url && !p.doi ? `<button onclick="window.api.openExternal('${esc(p.url)}')" class="text-indigo-500 hover:underline">Open ↗</button>` : ''}
    </div>
  </div>

  ${p.abstract ? `<div class="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 mb-4 max-h-24 overflow-y-auto leading-relaxed">${esc(p.abstract)}</div>` : ''}

  <div class="grid grid-cols-2 gap-3 mb-3">
    <div><label class="label">Reading status</label>
      <select onchange="updatePaperField('${id}','status',this.value)" class="input">
        ${['unread','reading','read'].map(s=>`<option value="${s}" ${p.status===s?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}
      </select></div>
    <div><label class="label">Relevance</label>
      <select onchange="updatePaperField('${id}','relevance',this.value)" class="input">
        ${['low','medium','high','essential'].map(r=>`<option value="${r}" ${p.relevance===r?'selected':''}>${r[0].toUpperCase()+r.slice(1)}</option>`).join('')}
      </select></div>
  </div>

  <div class="mb-3"><label class="label">Link to Project</label>
    <select onchange="linkPaperToProject('${id}',this.value)" class="input">
      <option value="">— none —</option>
      ${state.projects.map(pr=>`<option value="${pr.id}" ${p.projectIds?.includes(pr.id)?'selected':''}>${esc(pr.name)}</option>`).join('')}
    </select></div>

  <div class="mb-3"><label class="label">Topics / Keywords</label>
    <input type="text" value="${esc((p.topics||[]).join(', '))}" placeholder="e.g. NMR, polymer, kinetics..."
      class="input" onchange="updatePaperTopics('${id}',this.value)"/></div>

  <div class="mb-3"><label class="label">Notes</label>
    <textarea rows="3" class="input resize-none" placeholder="Key findings, how it relates to your work..."
      onchange="updatePaperField('${id}','notes',this.value)">${esc(p.notes||'')}</textarea></div>

  <div class="flex gap-3 border-t border-slate-100 pt-4">
    <button onclick="closeModal()" class="flex-1 btn-secondary">Close</button>
    <button onclick="deletePaper('${id}')" class="btn-danger">Remove</button>
  </div>`, true)
}

function updatePaperField(id, field, value) {
  const p = state.papers.find(x=>x.id===id)
  if (p) { p[field]=value; save('papers'); renderLibrary() }
}
function updatePaperTopics(id, value) {
  const p = state.papers.find(x=>x.id===id)
  if (p) { p.topics=value.split(',').map(t=>t.trim()).filter(Boolean); save('papers') }
}
function linkPaperToProject(id, projectId) {
  const p = state.papers.find(x=>x.id===id)
  if (p) { p.projectIds = projectId ? [projectId] : []; save('papers'); renderLibrary() }
}
async function deletePaper(id) {
  if (!await confirmDlg('Remove this paper from your library?', 'Remove Paper')) return
  state.papers = state.papers.filter(p=>p.id!==id)
  save('papers'); closeModal(); renderLibrary(); showToast('Paper removed')
}

// ── DOI / arXiv metadata fetch ────────────────────────────────────────────────
async function libFetchMeta() {
  const raw = (document.getElementById('lib-doi-input')?.value || '').trim()
  if (!raw) { showToast('Enter a DOI or arXiv URL first', 'error'); return }

  const btn = document.querySelector('[onclick="libFetchMeta()"]')
  if (btn) { btn.textContent = '…'; btn.disabled = true }

  try {
    // Detect arXiv
    const arxivMatch = raw.match(/arxiv\.org\/abs\/([\d.]+)|^arxiv:([\d.]+)|^([\d]{4}\.[\d]{4,5})/)
    let meta = null

    if (arxivMatch) {
      const arxivId = arxivMatch[1] || arxivMatch[2] || arxivMatch[3]
      const r = await fetch(`https://export.arxiv.org/api/query?id_list=${arxivId}`, { signal: AbortSignal.timeout(10000) })
      const xml = await r.text()
      const title   = (/<title>([\s\S]*?)<\/title>/.exec(xml)||[])[1]?.replace(/\s+/g,' ').trim()
      const summary = (/<summary>([\s\S]*?)<\/summary>/.exec(xml)||[])[1]?.replace(/\s+/g,' ').trim()
      const authors = [...xml.matchAll(/<author>[\s\S]*?<name>(.*?)<\/name>/g)].map(a => a[1])
      const published = (/<published>(.*?)<\/published>/.exec(xml)||[])[1]?.split('T')[0]
      if (title && title !== 'ArXiv Query') {
        meta = { title, authors, year: published ? new Date(published).getFullYear() : null,
          journal: 'arXiv preprint', doi: null, url: `https://arxiv.org/abs/${arxivId}`, abstract: summary || '' }
      }
    } else {
      // DOI via CrossRef
      const doi = raw.replace(/^https?:\/\/doi\.org\//,'').replace(/^doi:/,'')
      const r = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`,
        { headers: { 'User-Agent': 'PhDFlow/0.4 (mailto:support@phdflow.app)' }, signal: AbortSignal.timeout(10000) })
      if (r.ok) {
        const w = (await r.json()).message
        meta = {
          title:   w.title?.[0] || '',
          authors: (w.author||[]).map(a => [a.family, a.given].filter(Boolean).join(', ')),
          year:    w.published?.['date-parts']?.[0]?.[0] || null,
          journal: w['container-title']?.[0] || '',
          doi:     w.DOI || doi,
          url:     w.DOI ? `https://doi.org/${w.DOI}` : '',
          abstract: w.abstract?.replace(/<[^>]+>/g,'').trim().slice(0,500) || '',
        }
      }
    }

    if (!meta || !meta.title) { showToast('Could not find paper — check the DOI or URL', 'error'); return }

    // Duplicate check
    const dup = state.papers.find(p =>
      (meta.doi && p.doi && p.doi === meta.doi) ||
      (p.title?.toLowerCase().trim() === meta.title.toLowerCase().trim())
    )
    if (dup) {
      showToast('Already in your library', 'info')
      const inp = document.getElementById('lib-doi-input')
      if (inp) inp.value = ''
      return
    }

    // Open detail modal pre-filled for confirmation
    openModal(`
    <h3 class="text-base font-bold mb-1">Add to Library</h3>
    <p class="text-xs text-slate-500 mb-4">Review metadata before saving.</p>
    <div class="space-y-3">
      <div><label class="label">Title</label>
        <input id="fm-title" type="text" value="${esc(meta.title)}" class="input"/></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="label">Year</label>
          <input id="fm-year" type="number" value="${meta.year||''}" class="input"/></div>
        <div><label class="label">Journal / Source</label>
          <input id="fm-journal" type="text" value="${esc(meta.journal||'')}" class="input"/></div>
      </div>
      <div><label class="label">Status</label>
        <select id="fm-status" class="input">
          <option value="unread">Unread</option><option value="reading">Reading</option><option value="read">Read</option>
        </select></div>
      <div class="flex gap-3 pt-2">
        <button onclick="closeModal()" class="flex-1 btn-secondary">Cancel</button>
        <button onclick="_libConfirmFetch(${JSON.stringify(meta).replace(/"/g,'&quot;')})" class="flex-1 btn-primary">Add to Library</button>
      </div>
    </div>`, false)

    // Store meta for confirm
    window._libFetchMeta = meta
    document.querySelector('[onclick^="_libConfirmFetch"]')?.setAttribute('onclick', '_libConfirmFetch()')

  } catch(e) {
    showToast('Fetch failed: ' + e.message, 'error')
  } finally {
    if (btn) { btn.textContent = 'Fetch →'; btn.disabled = false }
  }
}

async function _libConfirmFetch() {
  const meta    = window._libFetchMeta
  if (!meta) return
  const title   = document.getElementById('fm-title')?.value.trim()   || meta.title
  const year    = parseInt(document.getElementById('fm-year')?.value)  || meta.year
  const journal = document.getElementById('fm-journal')?.value.trim() || meta.journal
  const status  = document.getElementById('fm-status')?.value         || 'unread'

  state.papers.unshift({
    id: uid(), title, authors: meta.authors || [], year, journal,
    doi: meta.doi || null, url: meta.url || null, abstract: meta.abstract || null,
    topics: [], relevance: 'medium', status,
    projectIds: [], notes: '', source: 'doi',
    addedAt: new Date().toISOString()
  })
  await save('papers')
  closeModal()
  const inp = document.getElementById('lib-doi-input')
  if (inp) inp.value = ''
  renderLibrary()
  showToast('Paper added ✓')
  window._libFetchMeta = null
}
