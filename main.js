const { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, nativeImage } = require('electron')
const { autoUpdater } = require('electron-updater')
const path  = require('path')
const fs    = require('fs')
const dgram = require('dgram')
const http  = require('http')
const os    = require('os')

// ─── Auto-updater setup ───────────────────────────────────────────────────────
autoUpdater.autoDownload         = true
autoUpdater.autoInstallOnAppQuit = true
autoUpdater.logger               = null  // suppress noisy default logging

let _lastUpdateState = null  // cached so renderer can query it after the fact

function _sendUpdate(status, extra = {}) {
  _lastUpdateState = { status, ...extra }
  if (mainWindow?.webContents && !mainWindow.webContents.isDestroyed())
    mainWindow.webContents.send('update-status', _lastUpdateState)
}

autoUpdater.on('checking-for-update',  ()    => _sendUpdate('checking'))
autoUpdater.on('update-not-available', ()    => _sendUpdate('current'))
autoUpdater.on('update-available',     (i)   => _sendUpdate('available',   { version: i.version }))
autoUpdater.on('download-progress',    (p)   => _sendUpdate('downloading', { percent: Math.round(p.percent) }))
autoUpdater.on('update-downloaded',    (i)   => _sendUpdate('ready',       { version: i.version }))
autoUpdater.on('error',                (err) => _sendUpdate('error',       { message: err.message }))

// Single-instance lock — if a second instance launches, focus the existing window
if (!app.requestSingleInstanceLock()) { app.quit() }

let mainWindow
let tray = null
let _quitting = false
const _auth = { loggedIn: false }

// ─── University Email Inference ───────────────────────────────────────────────

const UNI_DOMAINS = {
  'mit':'mit.edu','massachusetts institute':'mit.edu','stanford':'stanford.edu',
  'harvard':'harvard.edu','princeton':'princeton.edu','yale':'yale.edu',
  'columbia':'columbia.edu','uc berkeley':'berkeley.edu','university of california berkeley':'berkeley.edu',
  'ucla':'ucla.edu','uc san diego':'ucsd.edu','ucsd':'ucsd.edu',
  'university of michigan':'umich.edu','cornell':'cornell.edu',
  'carnegie mellon':'cmu.edu','university of chicago':'uchicago.edu',
  'johns hopkins':'jhu.edu','duke':'duke.edu','northwestern':'northwestern.edu',
  'university of pennsylvania':'upenn.edu','caltech':'caltech.edu',
  'california institute of technology':'caltech.edu','university of washington':'uw.edu',
  'university of wisconsin':'wisc.edu','university of texas':'utexas.edu',
  'georgia tech':'gatech.edu','georgia institute':'gatech.edu',
  'university of illinois':'illinois.edu','uiuc':'illinois.edu','purdue':'purdue.edu',
  'ohio state':'osu.edu','penn state':'psu.edu','nyu':'nyu.edu',
  'new york university':'nyu.edu','boston university':'bu.edu',
  'university of florida':'ufl.edu','university of minnesota':'umn.edu',
  'vanderbilt':'vanderbilt.edu','rice university':'rice.edu',
  'tufts':'tufts.edu','brown university':'brown.edu','dartmouth':'dartmouth.edu',
  'oxford':'ox.ac.uk','university of oxford':'ox.ac.uk',
  'cambridge':'cam.ac.uk','university of cambridge':'cam.ac.uk',
  'imperial college':'imperial.ac.uk','ucl':'ucl.ac.uk',
  'university college london':'ucl.ac.uk','lse':'lse.ac.uk',
  "king's college london":'kcl.ac.uk','university of edinburgh':'ed.ac.uk',
  'university of manchester':'manchester.ac.uk','university of bristol':'bristol.ac.uk',
  'university of warwick':'warwick.ac.uk','university of birmingham':'bham.ac.uk',
  'durham university':'durham.ac.uk','technical university of munich':'tum.de',
  'tu munich':'tum.de','tum':'tum.de','lmu munich':'lmu.de',
  'heidelberg university':'uni-heidelberg.de','humboldt':'hu-berlin.de',
  'rwth aachen':'rwth-aachen.de','karlsruhe institute':'kit.edu','kit':'kit.edu',
  'tu berlin':'tu-berlin.de','max planck':'mpg.de',
  'eth zurich':'ethz.ch','eth zürich':'ethz.ch','epfl':'epfl.ch',
  'university of zurich':'uzh.ch','tu delft':'tudelft.nl','delft university':'tudelft.nl',
  'university of amsterdam':'uva.nl','utrecht university':'uu.nl',
  'leiden university':'leidenuniv.nl','university of toronto':'utoronto.ca',
  'mcgill':'mcgill.ca','university of british columbia':'ubc.ca','ubc':'ubc.ca',
  'waterloo':'uwaterloo.ca','university of waterloo':'uwaterloo.ca',
  'university of melbourne':'unimelb.edu.au','australian national university':'anu.edu.au',
  'anu':'anu.edu.au','university of sydney':'sydney.edu.au',
  'unsw':'unsw.edu.au','monash university':'monash.edu',
  'university of tokyo':'u-tokyo.ac.jp','kyoto university':'kyoto-u.ac.jp',
  'national university of singapore':'nus.edu.sg','nus':'nus.edu.sg',
  'tsinghua':'tsinghua.edu.cn','peking university':'pku.edu.cn',
  'iit bombay':'iitb.ac.in','iit delhi':'iitd.ac.in',
}

function inferEmail(name, affiliations = []) {
  let domain = null
  const affsLower = affiliations.map(a => a.toLowerCase())
  for (const [key, d] of Object.entries(UNI_DOMAINS)) {
    if (affsLower.some(a => a.includes(key))) { domain = d; break }
  }
  if (!domain) return { email: null, emailConfidence: 0, emailSource: 'unknown', emailNote: 'Institution not in database' }
  const clean = name.replace(/^(dr|prof|professor|mr|ms|mrs|assoc|assist)\.?\s+/i,'').trim()
  const parts = clean.split(/\s+/)
  const first = (parts[0]||'').toLowerCase().replace(/[^a-z]/g,'')
  const last  = (parts[parts.length-1]||'').toLowerCase().replace(/[^a-z]/g,'')
  if (!first || !last) return { email: null, emailConfidence: 0, emailSource: 'unknown', emailNote: '' }
  return { email: `${first}.${last}@${domain}`, emailConfidence: 68, emailSource: 'inferred', emailNote: `Pattern: ${first}.${last}@${domain}` }
}

// ─── Storage ──────────────────────────────────────────────────────────────────

function getDataDir() {
  const dir = path.join(app.getPath('userData'), 'data')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}
function readStore() {
  const fp = path.join(getDataDir(), 'app-data.json')
  if (!fs.existsSync(fp)) return {}
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8')) } catch { return {} }
}
function writeStore(data) {
  fs.writeFileSync(path.join(getDataDir(), 'app-data.json'), JSON.stringify(data, null, 2), 'utf-8')
}

// ─── Window ───────────────────────────────────────────────────────────────────

function createWindow() {
  const iconPath = path.join(__dirname, 'build', 'icon.png')
  const appIcon  = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty()

  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1100, minHeight: 700,
    backgroundColor: '#0f172a',
    icon: appIcon,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
    title: 'PhDFlow',
    show: false
  })
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'))
  mainWindow.once('ready-to-show', () => mainWindow.show())

  mainWindow.on('close', () => {
    _quitting = true
    app.quit()
  })
}

function setupTray() {
  try {
    const iconPath = path.join(__dirname, 'build', 'icon.png')
    const rawIcon  = fs.existsSync(iconPath)
      ? nativeImage.createFromPath(iconPath)
      : nativeImage.createEmpty()
    tray = new Tray(rawIcon)
    tray.setToolTip('PhDFlow')
    const menu = Menu.buildFromTemplate([
      { label: '📖  Open PhDFlow', click: () => { mainWindow.show(); mainWindow.focus() } },
      { type: 'separator' },
      { label: '🔒  Lock & Minimise to Tray', click: () => {
          _auth.loggedIn = false
          mainWindow.webContents.send('auth-locked')
          mainWindow.hide()
      }},
      { type: 'separator' },
      { label: '✕  Quit PhDFlow', click: () => { _quitting = true; app.quit() } }
    ])
    tray.setContextMenu(menu)
    tray.on('double-click', () => { mainWindow.show(); mainWindow.focus() })
  } catch(e) { console.error('Tray setup failed:', e.message) }
}

app.whenReady().then(() => {
  createWindow()
  setupTray()
  // Delay first check until renderer is shown so IPC events aren't lost
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => autoUpdater.checkForUpdates().catch(() => null), 3000)
  })
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  }
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

// ─── IPC: Core ────────────────────────────────────────────────────────────────

ipcMain.handle('store-get', (_, key) => readStore()[key] ?? null)
ipcMain.handle('store-set', (_, key, value) => { const d = readStore(); d[key]=value; writeStore(d); return true })
ipcMain.handle('open-external', (_, url) => shell.openExternal(url))
ipcMain.handle('open-folder',   (_, p)   => shell.openPath(p))
ipcMain.handle('get-app-version', () => app.getVersion())

ipcMain.handle('open-pdf-dialog', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile','multiSelections'], filters: [{ name:'PDF Files', extensions:['pdf'] }]
  })
  return r.canceled ? [] : r.filePaths
})

ipcMain.handle('open-save-dialog', async (_, opts) => {
  const r = await dialog.showSaveDialog(mainWindow, opts || {})
  return r.canceled ? null : r.filePath
})

ipcMain.handle('open-citation-dialog', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile','multiSelections'],
    filters: [
      { name: 'Citation Files', extensions: ['bib','ris'] },
      { name: 'BibTeX (.bib)',  extensions: ['bib'] },
      { name: 'RIS / Endnote (.ris)', extensions: ['ris'] },
    ]
  })
  if (r.canceled || !r.filePaths.length) return []
  return r.filePaths.map(fp => ({
    path: fp,
    ext:  path.extname(fp).slice(1).toLowerCase(),
    content: fs.readFileSync(fp, 'utf-8')
  }))
})

ipcMain.handle('write-text-file', async (_, dest, text) => {
  fs.writeFileSync(dest, text, 'utf-8')
  return true
})

ipcMain.handle('write-binary-file', async (_, dest, base64) => {
  const buf = Buffer.from(base64, 'base64')
  fs.writeFileSync(dest, buf)
  return true
})

// ─── IPC: Extended PDF Tools ──────────────────────────────────────────────────

ipcMain.handle('rotate-pdf', async (_, filepath, dest, rotation, pageNums) => {
  try {
    const { PDFDocument, degrees } = require('pdf-lib')
    const src   = await PDFDocument.load(fs.readFileSync(filepath))
    const total = src.getPageCount()
    const pages = pageNums === 'all'
      ? Array.from({ length: total }, (_, i) => i + 1)
      : (Array.isArray(pageNums) ? pageNums : [])
    for (const n of pages) {
      if (n >= 1 && n <= total) src.getPage(n - 1).setRotation(degrees(rotation))
    }
    fs.writeFileSync(dest, await src.save())
    return { success: true, dest, rotatedCount: pages.length }
  } catch(e) { return { success: false, error: e.message } }
})

ipcMain.handle('add-page-numbers', async (_, filepath, dest, opts = {}) => {
  try {
    const { PDFDocument, StandardFonts, rgb } = require('pdf-lib')
    const src   = await PDFDocument.load(fs.readFileSync(filepath))
    const font  = await src.embedFont(StandardFonts.Helvetica)
    const total = src.getPageCount()
    const { position = 'bottom-center', fontSize = 11, startNum = 1, showTotal = true } = opts
    for (let i = 0; i < total; i++) {
      const page = src.getPage(i)
      const { width, height } = page.getSize()
      const num  = i + startNum
      const text = showTotal ? `${num} / ${total + startNum - 1}` : `${num}`
      const tw   = font.widthOfTextAtSize(text, fontSize)
      let x = width / 2 - tw / 2, y = 20
      if (position === 'bottom-right') { x = width - tw - 20 }
      if (position === 'bottom-left')  { x = 20 }
      if (position === 'top-center')   { y = height - 30 }
      if (position === 'top-right')    { x = width - tw - 20; y = height - 30 }
      page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) })
    }
    fs.writeFileSync(dest, await src.save())
    return { success: true, dest, pageCount: total }
  } catch(e) { return { success: false, error: e.message } }
})

ipcMain.handle('remove-pages', async (_, filepath, dest, pageNums) => {
  try {
    const { PDFDocument } = require('pdf-lib')
    const src      = await PDFDocument.load(fs.readFileSync(filepath))
    const total    = src.getPageCount()
    const toRemove = new Set(pageNums.map(Number))
    const keep     = Array.from({ length: total }, (_, i) => i).filter(i => !toRemove.has(i + 1))
    const out      = await PDFDocument.create()
    const copied   = await out.copyPages(src, keep)
    copied.forEach(p => out.addPage(p))
    fs.writeFileSync(dest, await out.save())
    return { success: true, dest, removed: toRemove.size, remaining: keep.length }
  } catch(e) { return { success: false, error: e.message } }
})

ipcMain.handle('export-to-pdf', async (_, html, dest) => {
  try {
    const data = await mainWindow.webContents.printToPDF({ printBackground: true })
    fs.writeFileSync(dest, data)
    return { success: true }
  } catch(e) { return { success: false, error: e.message } }
})

// ─── IPC: Researcher Search ───────────────────────────────────────────────────

// Normalise a name for fuzzy matching: lowercase, strip punctuation, sort words
function _normName(n) {
  return (n||'').toLowerCase().replace(/[^a-z\s]/g,'').trim().split(/\s+/).sort().join(' ')
}

ipcMain.handle('search-researchers', async (_, query) => {
  try {
    const nameOnly = query.split(' ').slice(0, 3).join(' ')  // first 3 words = name
    const sig = AbortSignal.timeout(12000)

    // S2: include externalIds to get ORCID directly
    const s2Fields = 'name,affiliations,homepage,paperCount,citationCount,hIndex,externalIds'
    // OA: use `topics` (not deprecated x_concepts), request summary_stats, affiliations, ids
    const oaSelect = 'id,display_name,works_count,cited_by_count,summary_stats,affiliations,last_known_institutions,ids,topics,works_api_url'

    const [s2Res, oaRes] = await Promise.allSettled([
      fetch(
        `https://api.semanticscholar.org/graph/v1/author/search?query=${encodeURIComponent(nameOnly)}&fields=${s2Fields}&limit=8`,
        { headers: { 'User-Agent': 'PhDFlow/0.10 (open-source)' }, signal: sig }
      ).then(r => r.json()),
      fetch(
        `https://api.openalex.org/authors?search=${encodeURIComponent(nameOnly)}&select=${oaSelect}&per-page=8`,
        { headers: { 'User-Agent': 'PhDFlow/0.10 (mailto:phd-cc@example.com)' }, signal: sig }
      ).then(r => r.json()),
    ])

    const s2Authors = s2Res.status === 'fulfilled' ? (s2Res.value.data || []) : []
    const oaAuthors = oaRes.status === 'fulfilled' ? (oaRes.value.results || []) : []

    const usedOaIds = new Set()
    const merged = []

    for (const s2 of s2Authors) {
      const s2Orcid   = s2.externalIds?.ORCID?.replace('https://orcid.org/','') || null
      const s2Affiliations = (s2.affiliations||[]).map(a => a.name)

      // Match OA author: prefer exact ORCID match, then normalised name match
      let oa = null
      if (s2Orcid) {
        oa = oaAuthors.find(o => o.ids?.orcid?.replace('https://orcid.org/','') === s2Orcid)
      }
      if (!oa) {
        const ns2 = _normName(s2.name)
        oa = oaAuthors.find(o => _normName(o.display_name) === ns2)
      }
      if (oa) usedOaIds.add(oa.id)

      const oaInsts = oa?.last_known_institutions?.map(i => i.display_name) || []
      const allAffs = [...new Set([...s2Affiliations, ...oaInsts])]
      const orcid   = s2Orcid || oa?.ids?.orcid?.replace('https://orcid.org/','') || null
      // OA `topics` field (current) — NOT the deprecated `x_concepts`
      const topics  = (oa?.topics || []).slice(0, 6).map(t => t.display_name).filter(Boolean)

      merged.push({
        id:           s2.authorId,
        name:         s2.name,
        institution:  allAffs[0] || null,
        affiliations: allAffs,
        topics,
        homepage:     s2.homepage || null,
        hIndex:       s2.hIndex || oa?.summary_stats?.h_index || 0,
        i10Index:     oa?.summary_stats?.i10 || null,
        paperCount:   s2.paperCount || oa?.works_count || 0,
        citationCount:s2.citationCount || oa?.cited_by_count || 0,
        orcid,
        s2Url:        `https://www.semanticscholar.org/author/${s2.authorId}`,
        oaUrl:        oa?.id ? `https://openalex.org/authors/${oa.id.split('/').pop()}` : null,
        worksApiUrl:  oa?.works_api_url || null,
        email: null, emailSource: 'none',
      })
    }

    // OA-only authors (not matched to any S2 result)
    for (const oa of oaAuthors) {
      if (usedOaIds.has(oa.id)) continue
      const insts  = oa.last_known_institutions?.map(i => i.display_name) || []
      const orcid  = oa.ids?.orcid?.replace('https://orcid.org/','') || null
      const topics = (oa.topics || []).slice(0, 6).map(t => t.display_name).filter(Boolean)
      merged.push({
        id:           `oa-${oa.id?.split('/').pop()}`,
        name:         oa.display_name,
        institution:  insts[0] || null,
        affiliations: insts,
        topics,
        homepage:     null,
        hIndex:       oa.summary_stats?.h_index || 0,
        i10Index:     oa.summary_stats?.i10 || null,
        paperCount:   oa.works_count || 0,
        citationCount:oa.cited_by_count || 0,
        orcid,
        s2Url:        null,
        oaUrl:        oa.id ? `https://openalex.org/authors/${oa.id.split('/').pop()}` : null,
        worksApiUrl:  oa.works_api_url || null,
        email: null, emailSource: 'none',
      })
    }

    // Sort by h-index descending — most prominent person with this name floats up
    merged.sort((a, b) => (b.hIndex || 0) - (a.hIndex || 0))

    const top = merged.slice(0, 8)

    // Fetch top 5 recent papers for S2-based results (parallel, non-blocking)
    await Promise.allSettled(
      top
        .filter(r => !String(r.id).startsWith('oa-'))
        .slice(0, 5)
        .map(async author => {
          try {
            const r = await fetch(
              `https://api.semanticscholar.org/graph/v1/author/${author.id}/papers` +
              `?fields=title,year,citationCount,externalIds,venue&limit=5&sort=citationCount`,
              { headers: { 'User-Agent': 'PhDFlow/0.10' }, signal: AbortSignal.timeout(6000) }
            )
            if (!r.ok) return
            const data = await r.json()
            author.recentPapers = (data.data || []).slice(0, 5).map(p => ({
              title:     p.title || '',
              year:      p.year || null,
              citations: p.citationCount || 0,
              venue:     p.venue || null,
              doi:       p.externalIds?.DOI || null,
            }))
          } catch {}
        })
    )

    return { success: true, results: top }
  } catch(e) { return { success: false, error: e.message } }
})

// ─── IPC: PDF Import ──────────────────────────────────────────────────────────

ipcMain.handle('parse-pdf', async (_, filepath) => {
  try {
    const pdfParse = require('pdf-parse/lib/pdf-parse.js')
    const data = await pdfParse(fs.readFileSync(filepath))
    const text = data.text || ''
    const filename = path.basename(filepath, '.pdf')
    const doiMatch = text.match(/\b(10\.\d{4,9}\/[^\s"'<>]+)/i)
    let doi = doiMatch ? doiMatch[1].replace(/[.,;:)\]]+$/,'') : null

    if (doi) {
      try {
        const cr = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`,
          { headers: { 'User-Agent':'PhD-Command-Center/0.2 (mailto:phd-cc@example.com)' } })
        if (cr.ok) {
          const w = (await cr.json()).message
          return { success: true, metadata: {
            title: w.title?.[0]||filename,
            authors: (w.author||[]).map(a=>[a.family,a.given].filter(Boolean).join(', ')),
            year: w.published?.['date-parts']?.[0]?.[0]||null,
            journal: w['container-title']?.[0]||null, doi: w.DOI||doi,
            abstract: w.abstract?.replace(/<[^>]+>/g,'').trim().substring(0,500)||null,
            pageCount: data.numpages, filepath, source: 'CrossRef'
          }}
        }
      } catch(_) {}
    }

    const lines = text.split('\n').map(l=>l.trim()).filter(l=>l.length>3)
    const title = lines.slice(0,8).find(l=>l.length>20&&l.length<220&&!/^(abstract|introduction|keywords|received|doi|vol\.?|issn)/i.test(l))||filename
    const yearMatch = text.substring(0,2000).match(/\b(19[89]\d|20[0-2]\d)\b/)
    const abstractMatch = text.match(/abstract[:\s\n]+([^]*?)(?=\n(?:introduction|keywords?|1[\.\s]|\d+[\.\s])|$)/i)
    return { success: true, metadata: {
      title, authors: [], year: yearMatch ? parseInt(yearMatch[1]) : null,
      journal: null, doi, pageCount: data.numpages, filepath, source: 'PDF',
      abstract: abstractMatch ? abstractMatch[1].replace(/\s+/g,' ').trim().substring(0,500) : null
    }}
  } catch(e) { return { success: false, error: e.message } }
})

// ─── IPC: PDF Tools ───────────────────────────────────────────────────────────

ipcMain.handle('merge-pdfs', async (_, paths, dest) => {
  try {
    const { PDFDocument } = require('pdf-lib')
    const merged = await PDFDocument.create()
    for (const fp of paths) {
      const doc = await PDFDocument.load(fs.readFileSync(fp))
      const pages = await merged.copyPages(doc, doc.getPageIndices())
      pages.forEach(p => merged.addPage(p))
    }
    fs.writeFileSync(dest, await merged.save())
    return { success: true, dest }
  } catch(e) { return { success: false, error: e.message } }
})

ipcMain.handle('split-pdf', async (_, filepath, ranges) => {
  try {
    const { PDFDocument } = require('pdf-lib')
    const src = await PDFDocument.load(fs.readFileSync(filepath))
    const results = []
    for (const { pages, dest } of ranges) {
      const out = await PDFDocument.create()
      const copied = await out.copyPages(src, pages.map(p=>p-1))
      copied.forEach(p => out.addPage(p))
      fs.writeFileSync(dest, await out.save())
      results.push(dest)
    }
    return { success: true, results }
  } catch(e) { return { success: false, error: e.message } }
})

// ─── IPC: RSS News ────────────────────────────────────────────────────────────

ipcMain.handle('fetch-news', async (_, feeds) => {
  try {
    const Parser = require('rss-parser')
    const parser = new Parser({ timeout: 8000, headers: { 'User-Agent': 'PhD-Command-Center/0.2' } })
    const results = []
    await Promise.allSettled(feeds.map(async feed => {
      try {
        const parsed = await parser.parseURL(feed.url)
        const items = (parsed.items || []).slice(0, 15).map(item => ({
          id: item.guid || item.link || item.title,
          title: item.title || 'Untitled',
          summary: item.contentSnippet || item.summary || '',
          link: item.link || '',
          date: item.pubDate || item.isoDate || '',
          feedName: feed.name,
          category: feed.category
        }))
        results.push(...items)
      } catch(_) {}
    }))
    results.sort((a,b) => new Date(b.date) - new Date(a.date))
    return { success: true, items: results }
  } catch(e) { return { success: false, error: e.message } }
})

// ─── IPC: Paper Search (Literature Feed) ─────────────────────────────────────

ipcMain.handle('search-papers', async (_, topics, daysBack) => {
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - (daysBack || 30))
    const cutoffDate = cutoff.toISOString().split('T')[0]   // "YYYY-MM-DD"

    const allPapers = []
    const _uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7)

    await Promise.allSettled(topics.map(async topic => {
      const kw = (topic.keywords || '').trim()
      if (!kw) return

      // ── arXiv Atom API ────────────────────────────────────────────────────
      try {
        // Build focused query: each comma/semicolon-separated concept becomes a
        // phrase search in title+abstract. Single concepts with spaces are
        // treated as exact phrases (far more precise than splitting into AND terms).
        const concepts = kw.split(/[,;]+/).map(s => s.trim()).filter(Boolean)
        const queryParts = concepts.map(concept => {
          const words = concept.split(/\s+/).filter(w => w.length > 1)
          if (!words.length) return null
          if (words.length === 1) {
            const w = encodeURIComponent(words[0])
            return `(ti:${w}+OR+abs:${w})`
          }
          // Multi-word → exact phrase search in title or abstract
          const phrase = encodeURIComponent(`"${concept.replace(/"/g, '')}"`)
          return `(ti:${phrase}+OR+abs:${phrase})`
        }).filter(Boolean)
        if (!queryParts.length) return

        // Include submittedDate filter directly in the query for reliability
        const arxivFrom = cutoffDate.replace(/-/g, '') + '000000'
        const innerQ = queryParts.length > 1 ? `(${queryParts.join('+OR+')})` : queryParts[0]
        const fullQuery = `${innerQ}+AND+submittedDate:[${arxivFrom}+TO+*]`

        const r = await fetch(
          `https://export.arxiv.org/api/query?search_query=${fullQuery}&max_results=25&sortBy=submittedDate&sortOrder=descending`,
          { headers: { 'User-Agent': 'PhD-Command-Center/0.3' },
            signal: AbortSignal.timeout(15000) }
        )
        if (r.ok) {
          const xml     = await r.text()
          const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
          for (const m of entries) {
            const e         = m[1]
            const title     = (/<title>([\s\S]*?)<\/title>/.exec(e) || [])[1]?.replace(/\s+/g,' ').trim()
            const published = (/<published>(.*?)<\/published>/.exec(e) || [])[1]?.split('T')[0]
            const link      = (/<id>(.*?)<\/id>/.exec(e) || [])[1]?.trim()
            const summary   = (/<summary>([\s\S]*?)<\/summary>/.exec(e) || [])[1]?.replace(/\s+/g,' ').trim()
            const authors   = [...e.matchAll(/<author>[\s\S]*?<name>(.*?)<\/name>/g)].map(a => a[1])
            if (!title || !published || published < cutoffDate) continue
            // Strip version suffix from arXiv ID (v1, v2…) to avoid duplicates across versions
            const rawId = link?.split('/').pop() || ''
            const normId = rawId.replace(/v\d+$/, '')
            allPapers.push({
              id: `arxiv-${normId || _uid()}`,
              title, authors,
              abstract: (summary || '').slice(0, 500),
              url: (link || '').replace('http://arxiv.org/abs/', 'https://arxiv.org/abs/').replace(/v\d+$/, ''),
              doi: null, date: published,
              journal: 'arXiv preprint',
              source: 'arXiv',
              topicId: topic.id, topicLabel: topic.label
            })
          }
        }
      } catch(_) {}

      // ── OpenAlex API ──────────────────────────────────────────────────────
      try {
        // Use title+abstract search for precision, fall back to full-text search
        const searchParam = encodeURIComponent(kw)
        const r = await fetch(
          `https://api.openalex.org/works?search=${searchParam}&filter=from_publication_date:${cutoffDate},type:article|preprint&sort=publication_date:desc&per-page=15`,
          { headers: { 'User-Agent': 'PhD-Command-Center/0.3 (mailto:phd-cc@example.com)' },
            signal: AbortSignal.timeout(15000) }
        )
        if (r.ok) {
          const data = await r.json()
          for (const w of (data.results || [])) {
            const authors = (w.authorships || []).slice(0, 5)
              .map(a => a.author?.display_name || '').filter(Boolean)
            const doi = w.doi?.replace('https://doi.org/', '') || null
            // Reconstruct abstract from inverted index
            let abstract = ''
            if (w.abstract_inverted_index) {
              const pos = {}
              for (const [word, positions] of Object.entries(w.abstract_inverted_index)) {
                for (const p of positions) pos[p] = word
              }
              abstract = Object.keys(pos).sort((a,b)=>a-b).map(k=>pos[k]).join(' ').slice(0, 500)
            }
            allPapers.push({
              id: `oa-${w.id?.split('/').pop() || _uid()}`,
              title: w.title || 'Untitled',
              authors, abstract,
              url: w.doi ? `https://doi.org/${doi}` : (w.id || ''),
              doi, date: w.publication_date || '',
              journal: w.primary_location?.source?.display_name || null,
              source: 'OpenAlex',
              topicId: topic.id, topicLabel: topic.label
            })
          }
        }
      } catch(_) {}
    }))

    // Deduplicate by normalised title
    const seen   = new Set()
    const unique = allPapers.filter(p => {
      const key = (p.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    unique.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    return { success: true, papers: unique.slice(0, 300) }
  } catch(e) { return { success: false, error: e.message } }
})

// ─── IPC: Vault — Secure Password Storage ─────────────────────────────────────
const crypto = require('crypto')

const _vault = {
  unlocked: false, vaultKey: null, pendingKeys: null,
  pwVerified: false, totpVerified: false, emailVerified: false,
  otpCode: null, otpExpiry: null, lockTimer: null,
}
const VAULT_LOCK_MS = 15 * 60 * 1000

function vaultConfigPath() { return path.join(getDataDir(), 'vault-config.json') }
function vaultDataPath()   { return path.join(getDataDir(), 'vault-data.json')   }
function readVaultCfg()    {
  try { return JSON.parse(fs.readFileSync(vaultConfigPath(), 'utf-8')) } catch { return null }
}
function readVaultData()   {
  try { return JSON.parse(fs.readFileSync(vaultDataPath(), 'utf-8')) } catch { return { entries: [] } }
}

// AES-256-GCM helpers
function vEnc(key, plaintext) {
  const iv  = crypto.randomBytes(12)
  const c   = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ct  = Buffer.concat([c.update(Buffer.from(String(plaintext), 'utf8')), c.final()])
  return { ct: ct.toString('hex'), iv: iv.toString('hex'), tag: c.getAuthTag().toString('hex') }
}
function vDec(key, ct, iv, tag) {
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'))
  d.setAuthTag(Buffer.from(tag, 'hex'))
  return Buffer.concat([d.update(Buffer.from(ct, 'hex')), d.final()]).toString('utf8')
}

// Key derivation: scrypt + HMAC sub-keys
function deriveKey(password, saltHex) {
  return crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 32, { N: 16384, r: 8, p: 1 })
}
function subKey(masterKey, label) {
  return crypto.createHmac('sha256', masterKey).update(label).digest()
}

// TOTP — RFC 6238, pure Node.js crypto
const _B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function _b32dec(s) {
  const str = s.toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = 0, val = 0; const out = []
  for (const ch of str) {
    const i = _B32.indexOf(ch); if (i < 0) continue
    val = (val << 5) | i; bits += 5
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 0xff); bits -= 8 }
  }
  return Buffer.from(out)
}
function totpCode(secret, offset = 0) {
  const ctr = Math.floor(Date.now() / 30000) + offset
  const buf = Buffer.alloc(8)
  let tmp = ctr
  for (let i = 7; i >= 0; i--) { buf[i] = tmp & 0xff; tmp = Math.floor(tmp / 256) }
  const h = crypto.createHmac('sha1', _b32dec(secret)).update(buf).digest()
  const o = h[h.length - 1] & 0x0f
  const n = ((h[o]&0x7f)<<24)|(h[o+1]<<16)|(h[o+2]<<8)|h[o+3]
  return String(n % 1000000).padStart(6, '0')
}
function totpVerify(secret, token) {
  return [-1, 0, 1].some(w => totpCode(secret, w) === token.trim())
}
function totpGenSecret() {
  // Properly base32-encode 20 random bytes → exactly 32 chars (20×8/5=32, no padding needed)
  const bytes = crypto.randomBytes(20)
  let bits = 0, val = 0, result = ''
  for (const byte of bytes) {
    val = (val << 8) | byte
    bits += 8
    while (bits >= 5) { result += _B32[(val >>> (bits - 5)) & 0x1f]; bits -= 5 }
  }
  return result
}

// Auto-lock
function vaultResetTimer() {
  if (_vault.lockTimer) clearTimeout(_vault.lockTimer)
  _vault.lockTimer = setTimeout(() => {
    Object.assign(_vault, { unlocked:false, vaultKey:null, pendingKeys:null,
      pwVerified:false, totpVerified:false, emailVerified:false,
      otpCode:null, otpExpiry:null, lockTimer:null })
    if (mainWindow) mainWindow.webContents.send('vault-locked')
  }, VAULT_LOCK_MS)
}

// ── Vault IPC ──────────────────────────────────────────────────────────────────

ipcMain.handle('vault-status', () => {
  const cfg = readVaultCfg()
  return { initialized: !!(cfg?.initialized), unlocked: _vault.unlocked,
           pwVerified: _vault.pwVerified, totpVerified: _vault.totpVerified }
})

ipcMain.handle('vault-setup', async (_, { password, smtpHost, smtpPort, smtpUser, smtpPass, smtpTo }) => {
  try {
    const masterSalt = crypto.randomBytes(32).toString('hex')
    const masterKey  = deriveKey(password, masterSalt)
    const totpKey    = subKey(masterKey, 'totp')
    const smtpKey    = subKey(masterKey, 'smtp')
    const vKey       = subKey(masterKey, 'vault')

    const verify   = vEnc(masterKey, 'PhD-CC-Vault-v1')
    const totpSec  = totpGenSecret()
    const totpEnc  = vEnc(totpKey, totpSec)
    const hostEnc  = vEnc(smtpKey, smtpHost || '')
    const userEnc  = vEnc(smtpKey, smtpUser || '')
    const passEnc  = vEnc(smtpKey, smtpPass || '')
    const toEnc    = vEnc(smtpKey, smtpTo   || '')

    const cfg = {
      version:1, initialized:true, masterSalt,
      verifyCt:verify.ct,  verifyIv:verify.iv,   verifyTag:verify.tag,
      totpCt:totpEnc.ct,   totpIv:totpEnc.iv,    totpTag:totpEnc.tag,
      smtpPort: smtpPort || 587,
      smtpHostCt:hostEnc.ct, smtpHostIv:hostEnc.iv, smtpHostTag:hostEnc.tag,
      smtpUserCt:userEnc.ct, smtpUserIv:userEnc.iv, smtpUserTag:userEnc.tag,
      smtpPassCt:passEnc.ct, smtpPassIv:passEnc.iv, smtpPassTag:passEnc.tag,
      smtpToCt:toEnc.ct,     smtpToIv:toEnc.iv,     smtpToTag:toEnc.tag,
    }
    fs.writeFileSync(vaultConfigPath(), JSON.stringify(cfg), 'utf-8')
    if (!fs.existsSync(vaultDataPath())) fs.writeFileSync(vaultDataPath(), JSON.stringify({entries:[]}), 'utf-8')
    return { success:true, totpSecret:totpSec,
             otpauthUri:`otpauth://totp/PhD%20Command%20Center?secret=${totpSec}&issuer=PhD-Command-Center` }
  } catch(e) { return { success:false, error:e.message } }
})

ipcMain.handle('vault-step1', async (_, password) => {
  try {
    const cfg = readVaultCfg()
    if (!cfg?.initialized) return { success:false, error:'Vault not initialized' }
    const masterKey = deriveKey(password, cfg.masterSalt)
    try { vDec(masterKey, cfg.verifyCt, cfg.verifyIv, cfg.verifyTag) }
    catch { return { success:false, error:'Incorrect master password' } }
    _vault.pendingKeys = { totp:subKey(masterKey,'totp'), smtp:subKey(masterKey,'smtp'), vault:subKey(masterKey,'vault') }
    _vault.pwVerified = true
    return { success:true }
  } catch(e) { return { success:false, error:e.message } }
})

ipcMain.handle('vault-step2', async (_, token) => {
  try {
    if (!_vault.pwVerified || !_vault.pendingKeys) return { success:false, error:'Complete step 1 first' }
    const cfg = readVaultCfg()
    const sec = vDec(_vault.pendingKeys.totp, cfg.totpCt, cfg.totpIv, cfg.totpTag)
    if (!totpVerify(sec, token)) return { success:false, error:'Invalid authenticator code' }
    _vault.totpVerified = true
    return { success:true }
  } catch(e) { return { success:false, error:e.message } }
})

ipcMain.handle('vault-step3-send', async () => {
  try {
    if (!_vault.totpVerified || !_vault.pendingKeys) return { success:false, error:'Complete step 2 first' }
    const cfg  = readVaultCfg()
    const k    = _vault.pendingKeys.smtp
    const host = vDec(k, cfg.smtpHostCt, cfg.smtpHostIv, cfg.smtpHostTag)
    const user = vDec(k, cfg.smtpUserCt, cfg.smtpUserIv, cfg.smtpUserTag)
    const pass = vDec(k, cfg.smtpPassCt, cfg.smtpPassIv, cfg.smtpPassTag)
    const to   = vDec(k, cfg.smtpToCt,   cfg.smtpToIv,   cfg.smtpToTag)

    const otp = String(Math.floor(100000 + Math.random() * 900000))
    _vault.otpCode   = otp
    _vault.otpExpiry = Date.now() + 5 * 60 * 1000

    const nm = require('nodemailer')
    const tr = nm.createTransport({ host, port:parseInt(cfg.smtpPort)||587,
      secure:parseInt(cfg.smtpPort)===465, auth:{user,pass} })
    await tr.sendMail({
      from:`"PhDFlow" <${user}>`, to,
      subject:`Vault access code: ${otp}`,
      html:`<div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#1e293b;margin:0 0 8px">🔐 PhDFlow</h2>
        <p style="color:#64748b;margin:0 0 24px">Your one-time vault access code:</p>
        <div style="background:#4f46e5;color:#fff;font-size:36px;font-weight:700;letter-spacing:10px;text-align:center;padding:24px;border-radius:8px">${otp}</div>
        <p style="color:#94a3b8;font-size:12px;margin-top:16px">Expires in 5 minutes. Never share this code.</p>
      </div>`
    })
    return { success:true, sentTo: to.replace(/(.{2}).+(@.+)/, '$1***$2') }
  } catch(e) { return { success:false, error:e.message } }
})

ipcMain.handle('vault-step3-verify', async (_, token) => {
  try {
    if (!_vault.totpVerified || !_vault.otpCode) return { success:false, error:'No code pending — resend first' }
    if (Date.now() > _vault.otpExpiry) return { success:false, error:'Code expired — click Resend' }
    if (token.trim() !== _vault.otpCode) return { success:false, error:'Incorrect code' }
    _vault.unlocked = true
    _vault.vaultKey = _vault.pendingKeys.vault
    _vault.emailVerified = true
    _vault.otpCode = null; _vault.otpExpiry = null
    _vault.pendingKeys = null
    vaultResetTimer()
    return { success:true }
  } catch(e) { return { success:false, error:e.message } }
})

ipcMain.handle('vault-lock', () => {
  Object.assign(_vault, { unlocked:false, vaultKey:null, pendingKeys:null,
    pwVerified:false, totpVerified:false, emailVerified:false,
    otpCode:null, otpExpiry:null })
  if (_vault.lockTimer) { clearTimeout(_vault.lockTimer); _vault.lockTimer = null }
  return true
})

ipcMain.handle('vault-get-entries', () => {
  if (!_vault.unlocked) return { success:false, error:'Vault locked' }
  vaultResetTimer()
  try {
    const { entries } = readVaultData()
    const decrypted = entries.map(e => {
      try { return { id:e.id, updatedAt:e.updatedAt, ...JSON.parse(vDec(_vault.vaultKey, e.ct, e.iv, e.tag)) } }
      catch { return null }
    }).filter(Boolean)
    return { success:true, entries:decrypted }
  } catch(e) { return { success:false, error:e.message } }
})

ipcMain.handle('vault-save-entry', (_, entry) => {
  if (!_vault.unlocked) return { success:false, error:'Vault locked' }
  vaultResetTimer()
  try {
    const { id, updatedAt, ...payload } = entry
    const enc  = vEnc(_vault.vaultKey, JSON.stringify(payload))
    const data = readVaultData()
    const now  = new Date().toISOString()
    const rec  = { id: id || crypto.randomUUID(), ct:enc.ct, iv:enc.iv, tag:enc.tag, updatedAt:now }
    const idx  = data.entries.findIndex(e => e.id === id)
    if (idx > -1) data.entries[idx] = rec; else data.entries.push(rec)
    fs.writeFileSync(vaultDataPath(), JSON.stringify(data), 'utf-8')
    return { success:true, id:rec.id }
  } catch(e) { return { success:false, error:e.message } }
})

ipcMain.handle('vault-delete-entry', (_, id) => {
  if (!_vault.unlocked) return { success:false, error:'Vault locked' }
  vaultResetTimer()
  try {
    const data = readVaultData()
    data.entries = data.entries.filter(e => e.id !== id)
    fs.writeFileSync(vaultDataPath(), JSON.stringify(data), 'utf-8')
    return { success:true }
  } catch(e) { return { success:false, error:e.message } }
})

// ─── IPC: Discord Feedback ────────────────────────────────────────────────────

// Webhook URL lives only in the main process — never exposed to renderer
const _fwh = Buffer.from('aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTUwOTYxNjcxMTkyODY0MzcwNi9OZjZWQ3dydGIxTDZZbmRhNU5Bc3hkTm5ORzk4QkFhY1N5UE1rX2hsUGdpUmkyR3Z0WmtZVThSRUdqVmpjSDZQWkNOdA==', 'base64').toString()

ipcMain.handle('send-feedback', async (_, { message, type }) => {
  if (!_fwh || _fwh.startsWith('__')) return { success:false, error:'Feedback not configured' }
  try {
    const colors = { bug:0xe74c3c, feature:0x3498db, praise:0x2ecc71, other:0x95a5a6 }
    const icons  = { bug:'🐛', feature:'💡', praise:'⭐', other:'💬' }
    const r = await fetch(_fwh, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username:'PhDFlow Feedback', embeds:[{
        title:`${icons[type]||'💬'} ${(type||'Feedback').charAt(0).toUpperCase()+(type||'').slice(1)}`,
        description: message, color: colors[type]||colors.other,
        timestamp: new Date().toISOString(),
        footer: { text:`PhDFlow v${app.getVersion()} · Windows` }
      }]}),
      signal: AbortSignal.timeout(10000)
    })
    return { success:r.ok, status:r.status }
  } catch(e) { return { success:false, error:e.message } }
})

// ─── IPC: API Diagnostics ─────────────────────────────────────────────────────

ipcMain.handle('test-api', async (_, name) => {
  const APIS = {
    arxiv:    'https://export.arxiv.org/api/query?search_query=all:test&max_results=1',
    openalex: 'https://api.openalex.org/works?search=test&per-page=1',
    s2:       'https://api.semanticscholar.org/graph/v1/author/search?query=test&limit=1',
    crossref: 'https://api.crossref.org/works?query=test&rows=1',
  }
  const url = APIS[name]
  if (!url) return { success:false, error:'Unknown API' }
  const t0 = Date.now()
  try {
    const r = await fetch(url, { headers:{'User-Agent':'PhD-Command-Center/0.2'}, signal:AbortSignal.timeout(10000) })
    return { success:true, ok:r.ok, status:r.status, latencyMs:Date.now()-t0 }
  } catch(e) { return { success:false, ok:false, latencyMs:Date.now()-t0, error:e.message } }
})


ipcMain.handle('test-smtp', async (_, { smtpHost, smtpPort, smtpUser, smtpPass }) => {
  try {
    const nm = require('nodemailer')
    const tr = nm.createTransport({ host:smtpHost, port:parseInt(smtpPort)||587,
      secure:parseInt(smtpPort)===465, auth:{user:smtpUser,pass:smtpPass} })
    await tr.verify()
    return { success:true }
  } catch(e) { return { success:false, error:e.message } }
})

// ─── IPC: Data Export / Import ────────────────────────────────────────────────

ipcMain.handle('export-data', async (_, { keys, dest }) => {
  try {
    const store = readStore()
    const data  = keys ? Object.fromEntries(keys.map(k=>[k,store[k]??[]])) : store
    const json  = JSON.stringify({ _version:app.getVersion(), _exportedAt:new Date().toISOString(), ...data }, null, 2)
    fs.writeFileSync(dest, json, 'utf-8')
    return { success:true, dest, keyCount:Object.keys(data).length }
  } catch(e) { return { success:false, error:e.message } }
})

ipcMain.handle('import-data', async (_, { src, strategy, selectedKeys }) => {
  try {
    const { _version, _exportedAt, ...payload } = JSON.parse(fs.readFileSync(src, 'utf-8'))
    const current = readStore()
    const keys    = selectedKeys || Object.keys(payload)
    if (strategy === 'replace') {
      keys.forEach(k => { if (k in payload) current[k] = payload[k] })
    } else {
      keys.forEach(k => {
        if (!(k in payload)) return
        const inc = payload[k]
        if (!Array.isArray(inc)) { current[k] = inc; return }
        const cur    = Array.isArray(current[k]) ? current[k] : []
        const merged = [...cur]
        inc.forEach(item => {
          const idx = merged.findIndex(c => c.id && c.id === item.id)
          if (idx === -1) { merged.push(item); return }
          const cd = merged[idx].updatedAt || merged[idx].createdAt || ''
          const id = item.updatedAt || item.createdAt || ''
          if (id > cd) merged[idx] = item
        })
        current[k] = merged
      })
    }
    writeStore(current)
    return { success:true, mergedKeys:keys.length }
  } catch(e) { return { success:false, error:e.message } }
})

ipcMain.handle('open-data-folder', () => { shell.openPath(getDataDir()); return true })
ipcMain.handle('get-data-dir',     () => getDataDir())

ipcMain.handle('open-import-dialog', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    properties:['openFile'], filters:[{name:'JSON Backup',extensions:['json']}]
  })
  return r.canceled ? null : r.filePaths[0]
})

// ─── IPC: App Authentication ──────────────────────────────────────────────────

function authConfigPath() { return path.join(app.getPath('userData'), 'auth.json') }
function readAuthCfg() {
  try { return JSON.parse(fs.readFileSync(authConfigPath(), 'utf-8')) } catch { return null }
}

ipcMain.handle('auth-status', () => {
  const cfg = readAuthCfg()
  return { initialized: !!(cfg?.initialized), loggedIn: _auth.loggedIn }
})

ipcMain.handle('auth-setup', async (_, { name, password }) => {
  try {
    if (!name?.trim()) return { success: false, error: 'Name required' }
    if (!password || password.length < 8) return { success: false, error: 'Password must be at least 8 characters' }
    const salt = crypto.randomBytes(32).toString('hex')
    const hash = crypto.scryptSync(password, Buffer.from(salt, 'hex'), 32, { N: 16384, r: 8, p: 1 }).toString('hex')
    const cfg  = { version: 1, initialized: true, name: name.trim(), passwordHash: hash, passwordSalt: salt, createdAt: new Date().toISOString() }
    fs.writeFileSync(authConfigPath(), JSON.stringify(cfg), 'utf-8')
    _auth.loggedIn = true
    return { success: true }
  } catch(e) { return { success: false, error: e.message } }
})

ipcMain.handle('auth-login', async (_, password) => {
  try {
    const cfg = readAuthCfg()
    if (!cfg?.initialized) return { success: false, error: 'App not set up' }
    const hash = crypto.scryptSync(password, Buffer.from(cfg.passwordSalt, 'hex'), 32, { N: 16384, r: 8, p: 1 }).toString('hex')
    const match = crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(cfg.passwordHash, 'hex'))
    if (!match) return { success: false, error: 'Incorrect password' }
    _auth.loggedIn = true
    return { success: true, name: cfg.name }
  } catch(e) { return { success: false, error: e.message } }
})

ipcMain.handle('auth-lock', () => { _auth.loggedIn = false; return true })

ipcMain.handle('auth-get-name', () => readAuthCfg()?.name || null)

ipcMain.handle('auth-change-password', async (_, { currentPassword, newPassword }) => {
  try {
    const cfg = readAuthCfg()
    if (!cfg?.initialized) return { success: false, error: 'App not set up' }
    const hash = crypto.scryptSync(currentPassword, Buffer.from(cfg.passwordSalt, 'hex'), 32, { N: 16384, r: 8, p: 1 }).toString('hex')
    if (!crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(cfg.passwordHash, 'hex'))) {
      return { success: false, error: 'Current password is incorrect' }
    }
    if (!newPassword || newPassword.length < 8) return { success: false, error: 'New password must be at least 8 characters' }
    const newSalt = crypto.randomBytes(32).toString('hex')
    const newHash = crypto.scryptSync(newPassword, Buffer.from(newSalt, 'hex'), 32, { N: 16384, r: 8, p: 1 }).toString('hex')
    cfg.passwordHash = newHash; cfg.passwordSalt = newSalt
    fs.writeFileSync(authConfigPath(), JSON.stringify(cfg), 'utf-8')
    return { success: true }
  } catch(e) { return { success: false, error: e.message } }
})

// ─── IPC: Auto-updater ───────────────────────────────────────────────────────

ipcMain.handle('get-update-state',  () => _lastUpdateState)
ipcMain.handle('check-for-updates', async () => {
  try { await autoUpdater.checkForUpdates() }
  catch (err) { _sendUpdate('error', { message: err.message }) }
})
ipcMain.handle('updater-install', () => {
  autoUpdater.quitAndInstall(true, true)
})

// ─── IPC: Calendar ICS Fetch ─────────────────────────────────────────────────
ipcMain.handle('fetch-ics', async (_, url) => {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'PhD-Command-Center/0.3', 'Accept': 'text/calendar,text/plain,*/*' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000)
    })
    if (!r.ok) return { success: false, error: `HTTP ${r.status} — check the URL is correct and publicly accessible` }
    const text = await r.text()
    if (!text.includes('BEGIN:VCALENDAR'))
      return { success: false, error: 'URL did not return a valid ICS calendar file (no BEGIN:VCALENDAR found)' }
    return { success: true, text }
  } catch(e) { return { success: false, error: e.message } }
})

// ─── Live Grant Search ────────────────────────────────────────────────────────

// NIH Reporter — search funded US projects by field + career stage mechanism
ipcMain.handle('search-nih-reporter', async (_, { keywords, activityCodes, rows = 25 }) => {
  try {
    const body = {
      criteria: {
        advanced_text_search: { operator: 'And', search_field: 'all', search_text: keywords },
        ...(activityCodes?.length ? { activity_codes: activityCodes } : {}),
      },
      offset: 0, limit: rows,
      sort_field: 'fiscal_year', sort_order: 'desc',
      include_fields: ['ProjectTitle','AgencyCode','FiscalYear','AwardAmount',
        'PrincipalInvestigators','Organization','AbstractText','ActivityCode',
        'CoreProjectNum','OpportunityNumber'],
    }
    const r = await fetch('https://api.reporter.nih.gov/v2/projects/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'PhDFlow/0.10' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) return { success: false, error: `NIH Reporter HTTP ${r.status}` }
    const data = await r.json()
    const results = (data.results || []).map(p => ({
      id:        `nih-${p.core_project_num || p.appl_id || Math.random().toString(36).slice(2)}`,
      name:      p.project_title || 'NIH Project',
      funder:    `NIH${p.agency_code ? ' · ' + p.agency_code : ''}`,
      mechanism: p.activity_code || '',
      amount:    p.award_amount ? `$${Number(p.award_amount).toLocaleString()}` : '',
      pi:        (p.principal_investigators || []).slice(0,2).map(pi=>`${pi.first_name} ${pi.last_name}`).join(', '),
      org:       p.organization?.org_name || '',
      year:      p.fiscal_year || '',
      abstract:  (p.abstract_text || '').replace(/<[^>]+>/g,'').trim().slice(0, 300),
      url:       p.core_project_num
        ? `https://reporter.nih.gov/project-details/${p.core_project_num}`
        : 'https://reporter.nih.gov/',
      source:    'NIH Reporter',
    }))
    return { success: true, results, total: data.meta?.total || results.length }
  } catch(e) { return { success: false, error: e.message } }
})

// NSF Awards — funded US STEM awards by field keywords
ipcMain.handle('search-nsf-awards', async (_, { keywords, rows = 20 }) => {
  try {
    const q = encodeURIComponent(keywords)
    const fields = 'id,title,agency,awardeeName,date,abstractText,fundProgramName,piFirstName,piLastName,estimatedTotalAmt,pdPIName'
    const r = await fetch(
      `https://api.nsf.gov/services/v1/awards.json?keyword=${q}&rows=${rows}&printFields=${fields}`,
      { headers: { 'User-Agent': 'PhDFlow/0.10' }, signal: AbortSignal.timeout(12000) }
    )
    if (!r.ok) return { success: false, error: `NSF HTTP ${r.status}` }
    const data = await r.json()
    const awards = data.response?.award || []
    const results = awards.map(a => ({
      id:       `nsf-${a.id}`,
      name:     a.title || 'NSF Award',
      funder:   `NSF${a.fundProgramName ? ' · ' + a.fundProgramName : ''}`,
      amount:   a.estimatedTotalAmt ? `$${Number(a.estimatedTotalAmt).toLocaleString()}` : '',
      pi:       `${a.piFirstName || ''} ${a.piLastName || ''}`.trim() || a.pdPIName || '',
      org:      a.awardeeName || '',
      year:     a.date ? a.date.split('/')[2] : '',
      abstract: (a.abstractText || '').replace(/<[^>]+>/g,'').trim().slice(0, 300),
      url:      `https://www.nsf.gov/awardsearch/showAward?AWD_ID=${a.id}`,
      source:   'NSF Awards',
    }))
    return { success: true, results, total: results.length }
  } catch(e) { return { success: false, error: e.message } }
})

// Grants.gov — US federal open opportunities (no API key needed)
ipcMain.handle('search-grants-gov', async (_, { keywords, rows = 25, start = 0 }) => {
  try {
    const r = await fetch('https://apply07.grants.gov/grantsws/rest/opportunities/search/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'PhDFlow/0.10 (open-source)' },
      body:    JSON.stringify({ keyword: keywords, oppStatuses: 'forecasted|posted', rows, start, sortBy: 'closeDate|asc' }),
      signal:  AbortSignal.timeout(14000),
    })
    if (!r.ok) return { success: false, error: `Grants.gov HTTP ${r.status}` }
    const data = await r.json()
    if (data.errorcode !== 0 && data.errorcode != null) return { success: false, error: `Grants.gov error ${data.errorcode}` }
    const results = (data.oppHits || []).map(h => ({
      id:       `ggov-${h.id}`,
      name:     h.title || h.oppTitle || 'Untitled',
      funder:   h.agencyName || 'US Federal',
      amount:   h.awardCeiling ? `Up to $${Number(h.awardCeiling).toLocaleString()}` : '',
      deadline: h.closeDate ? h.closeDate.split('T')[0] : '',
      url:      h.opportunityLink || `https://grants.gov/search-results-detail/${h.id}`,
      desc:     (h.synopsis || '').slice(0, 300),
      source:   'Grants.gov',
      number:   h.number || '',
    }))
    return { success: true, results, total: data.totalCount || results.length }
  } catch(e) { return { success: false, error: e.message } }
})

// EU CORDIS — Horizon Europe programme topics (no API key)
ipcMain.handle('search-eu-cordis', async (_, { keywords, rows = 20 }) => {
  try {
    const q = encodeURIComponent(keywords)
    const r = await fetch(
      `https://cordis.europa.eu/api/topic?page=0&pageSize=${rows}&language=en&q=${q}&status=OPEN,FORTHCOMING`,
      { headers: { 'User-Agent': 'PhDFlow/0.10', Accept: 'application/json' }, signal: AbortSignal.timeout(12000) }
    )
    if (!r.ok) return { success: false, error: `CORDIS HTTP ${r.status}` }
    const data = await r.json()
    const items = data.payload || data.results || []
    const results = items.slice(0, rows).map(t => ({
      id:       `eu-${t.id || t.identifier}`,
      name:     t.title || t.identifier || 'Horizon Europe Call',
      funder:   `European Commission${t.programmePeriod ? ' (' + t.programmePeriod + ')' : ''}`,
      amount:   t.budgetOverviewEur ? `€${Number(t.budgetOverviewEur).toLocaleString()}` : '',
      deadline: t.deadlineDate ? t.deadlineDate.split('T')[0] : '',
      url:      t.identifier
        ? `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${t.identifier}`
        : 'https://ec.europa.eu/info/funding-tenders/opportunities/portal/',
      desc:     (t.objective || t.description || '').replace(/<[^>]+>/g, ' ').trim().slice(0, 300),
      source:   'EU Horizon',
    }))
    return { success: true, results, total: data.totalElements || results.length }
  } catch(e) { return { success: false, error: e.message } }
})

// UKRI Gateway — UK Research & Innovation funded projects (no API key)
ipcMain.handle('search-ukri', async (_, { keywords, rows = 20 }) => {
  try {
    const q = encodeURIComponent(keywords)
    const r = await fetch(
      `https://gtr.ukri.org/gtr/api/funds?q=${q}&p=1&fetchSize=${rows}&sf=START_DATE&so=DESC`,
      { headers: { 'User-Agent': 'PhDFlow/0.10', Accept: 'application/vnd.rcuk.gtr.json-v7' }, signal: AbortSignal.timeout(12000) }
    )
    if (!r.ok) return { success: false, error: `UKRI HTTP ${r.status}` }
    const data = await r.json()
    const funds = data.fund || []
    const results = funds.slice(0, rows).map(f => ({
      id:       `ukri-${f.id}`,
      name:     f.valuePounds ? `${f.category || 'Research Grant'} — UKRI` : (f.category || 'UKRI Funding'),
      funder:   f.funder?.name || 'UKRI',
      amount:   f.valuePounds ? `£${Number(f.valuePounds).toLocaleString()}` : '',
      deadline: f.end ? f.end.split('T')[0] : '',
      url:      `https://gtr.ukri.org/funds/FUND:${f.id}`,
      desc:     (f.overview || f.abstractText || '').slice(0, 300),
      source:   'UKRI',
    }))
    return { success: true, results, total: data.totalSize || results.length }
  } catch(e) { return { success: false, error: e.message } }
})

// ─── Reference Manager Integration ───────────────────────────────────────────

const ZOTERO_CONNECTOR = 'http://localhost:23119'

// Step 1 — check if Zotero is open via the connector ping endpoint
ipcMain.handle('zotero-ping', async () => {
  try {
    const r = await fetch(`${ZOTERO_CONNECTOR}/connector/ping`, {
      headers: { 'Zotero-Allowed-Request': '1' },
      signal: AbortSignal.timeout(3000),
    })
    if (!r.ok) return { running: false }
    const text = await r.text()
    // Response is plain text or JSON — extract version if present
    const version = text.match(/"version"\s*:\s*"([^"]+)"/)?.[1]
      || text.match(/Zotero[^\d]*(\d+\.\d+[\.\d]*)/)?.[1]
      || ''
    return { running: true, version }
  } catch { return { running: false } }
})

// Step 2 — check whether Better BibTeX plugin is installed
ipcMain.handle('zotero-bbt-check', async () => {
  try {
    const r = await fetch(`${ZOTERO_CONNECTOR}/better-bibtex/json-rpc`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Zotero-Allowed-Request': '1' },
      body:    JSON.stringify({ jsonrpc: '2.0', method: 'library', params: [], id: 1 }),
      signal:  AbortSignal.timeout(4000),
    })
    // BBT is installed if the endpoint responds (even with an error method)
    return { installed: r.status !== 404 }
  } catch { return { installed: false } }
})

// Step 3 — export library via Better BibTeX pull-export URL
// Format: /better-bibtex/library?/[libraryID]/[filename].bib
// Step 3a: get library ID from user.groups, then fetch BibTeX
ipcMain.handle('zotero-fetch-library', async () => {
  try {
    // Get the personal library ID (always 1 in Zotero, but confirm via API)
    let libraryID = 1
    try {
      const gr = await fetch(`${ZOTERO_CONNECTOR}/better-bibtex/json-rpc`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Zotero-Allowed-Request': '1' },
        body:    JSON.stringify({ jsonrpc: '2.0', method: 'user.groups', params: {}, id: 1 }),
        signal:  AbortSignal.timeout(5000),
      })
      if (gr.ok) {
        const gd = await gr.json()
        const groups = gd.result || []
        const personal = groups.find(g => g.name === 'My Library') || groups[0]
        if (personal?.id) libraryID = personal.id
      }
    } catch {}

    // Pull the BibTeX using the path-based URL format
    const r = await fetch(
      `${ZOTERO_CONNECTOR}/better-bibtex/library?/${libraryID}/library.bib`,
      { headers: { 'Zotero-Allowed-Request': '1' }, signal: AbortSignal.timeout(30000) }
    )
    if (!r.ok) return { success: false, error: `Better BibTeX pull export HTTP ${r.status}` }
    const bibtex = await r.text()
    if (!bibtex?.includes('@')) return { success: false, error: 'Response does not look like BibTeX' }
    return { success: true, bibtex }
  } catch(e) { return { success: false, error: e.message } }
})

// ── Watched .bib / .ris file ──────────────────────────────────────────────────

let _libWatchPath     = null
let _libWatchDebounce = null

function _libWatchConfigPath() { return path.join(getDataDir(), 'lib-watch.json') }
function _readLibWatchCfg()    { try { return JSON.parse(fs.readFileSync(_libWatchConfigPath(), 'utf-8')) } catch { return {} } }
function _saveLibWatchCfg(cfg) { fs.writeFileSync(_libWatchConfigPath(), JSON.stringify(cfg), 'utf-8') }

function _startLibWatch(filePath) {
  if (_libWatchPath) { try { fs.unwatchFile(_libWatchPath) } catch {} }
  if (!filePath || !fs.existsSync(filePath)) return
  _libWatchPath = filePath
  fs.watchFile(filePath, { interval: 2000 }, () => {
    if (_libWatchDebounce) clearTimeout(_libWatchDebounce)
    _libWatchDebounce = setTimeout(() => {
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const ext     = path.extname(filePath).slice(1).toLowerCase()
        mainWindow?.webContents?.send('lib-file-changed', { filePath, content, ext })
      } catch {}
    }, 1500)
  })
}

ipcMain.handle('lib-watch-get',    ()          => ({ path: _libWatchPath, ..._readLibWatchCfg() }))

ipcMain.handle('lib-watch-set',    (_, filePath) => {
  _saveLibWatchCfg({ path: filePath, enabled: true })
  _startLibWatch(filePath)
  return { success: true }
})

ipcMain.handle('lib-watch-remove', () => {
  if (_libWatchPath) { try { fs.unwatchFile(_libWatchPath) } catch {} ; _libWatchPath = null }
  _saveLibWatchCfg({})
  return { success: true }
})

ipcMain.handle('lib-read-file',    async (_, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const ext     = path.extname(filePath).slice(1).toLowerCase()
    return { success: true, content, ext }
  } catch(e) { return { success: false, error: e.message } }
})

// ── Endnote sync folder + export script setup ─────────────────────────────────
ipcMain.handle('lib-setup-endnote', async () => {
  try {
    const syncDir  = path.join(app.getPath('documents'), 'PhDFlow', 'Endnote Sync')
    const risFile  = path.join(syncDir, 'library.ris')
    const ps1File  = path.join(syncDir, 'export-to-phdflow.ps1')
    const readFile = path.join(syncDir, 'README.txt')

    fs.mkdirSync(syncDir, { recursive: true })

    // PowerShell export script
    const script = `# PhDFlow — Endnote Export Script
# Double-click this file (or right-click → Run with PowerShell) to export your library.
# PhDFlow watches this folder and imports new papers automatically.

$ErrorActionPreference = "SilentlyContinue"
$outputFile = Join-Path $PSScriptRoot "library.ris"

Write-Host ""
Write-Host "PhDFlow - Endnote Export" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# ── Try COM automation (works if Endnote is already open) ─────────────────────
$endnote = $null
try {
    $endnote = [System.Runtime.InteropServices.Marshal]::GetActiveObject("EndNote.Application")
} catch {}

if ($endnote) {
    Write-Host "Endnote is running — exporting library..." -ForegroundColor Green
    try {
        $lib = $endnote.Libraries.Item(1)

        # Locate the RIS export style (search common install paths across versions)
        $styleCandidates = @(
            "$env:APPDATA\\EndNote\\Styles\\RefMan (RIS) Export.ens",
            "C:\\Program Files\\EndNote 21\\Styles\\RefMan (RIS) Export.ens",
            "C:\\Program Files\\EndNote 20\\Styles\\RefMan (RIS) Export.ens",
            "C:\\Program Files\\EndNote X9\\Styles\\RefMan (RIS) Export.ens",
            "C:\\Program Files\\EndNote X8\\Styles\\RefMan (RIS) Export.ens",
            "C:\\Program Files (x86)\\EndNote X9\\Styles\\RefMan (RIS) Export.ens"
        )
        $stylePath = $styleCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

        if (-not $stylePath) {
            # Fall back: ask Endnote where its styles folder is
            $endnoteDir = Split-Path (Get-Process EndNote -ErrorAction SilentlyContinue | Select-Object -First 1).Path
            if ($endnoteDir) { $stylePath = Join-Path $endnoteDir "Styles\\RefMan (RIS) Export.ens" }
        }

        if ($stylePath -and (Test-Path $stylePath)) {
            $lib.AllReferences.ExportToFile($outputFile, $stylePath)
            $count = $lib.AllReferences.Count
            Write-Host "SUCCESS — exported $count references to:" -ForegroundColor Green
            Write-Host "  $outputFile" -ForegroundColor White
            Write-Host ""
            Write-Host "PhDFlow will import the new papers automatically." -ForegroundColor Cyan
        } else {
            Write-Host "Could not locate the RIS export style. Falling back to manual steps." -ForegroundColor Yellow
            $endnote = $null
        }
    } catch {
        Write-Host "Auto-export failed: $_" -ForegroundColor Yellow
        $endnote = $null
    }
}

if (-not $endnote) {
    Write-Host "MANUAL EXPORT STEPS" -ForegroundColor Cyan
    Write-Host "-------------------" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Open Endnote and load your library"
    Write-Host "2. Go to  File → Export..."
    Write-Host "3. Output style:   RefMan RIS  (or 'RefMan RIS Export')"
    Write-Host "4. Export what:    All References in Library"
    Write-Host "5. File name:      library.ris"
    Write-Host "6. Save location:  $PSScriptRoot"
    Write-Host ""
    Write-Host "Full path to save: $outputFile" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "PhDFlow will detect the file and import automatically." -ForegroundColor Cyan
    Write-Host ""

    # Open the export folder in Explorer so the user can see where to save
    Start-Process explorer.exe $PSScriptRoot
}

Write-Host ""
Read-Host "Press Enter to close"
`

    fs.writeFileSync(ps1File,  script,                            'utf-8')
    fs.writeFileSync(readFile, [
      'PhDFlow — Endnote Sync Folder',
      '==============================',
      '',
      'How to sync your Endnote library with PhDFlow:',
      '',
      'OPTION A — Auto-export (recommended):',
      '  1. Make sure Endnote is open with your library loaded',
      '  2. Double-click  export-to-phdflow.ps1  (or right-click → Run with PowerShell)',
      '  3. PhDFlow will import all new papers automatically',
      '',
      'OPTION B — Manual export:',
      '  1. In Endnote: File → Export...',
      '  2. Output style: RefMan RIS',
      '  3. Save as: library.ris   in this folder',
      '',
      'Run the script any time you add new papers to Endnote.',
      'PhDFlow deduplicates — existing papers are never duplicated.',
      '',
      `Sync folder: ${syncDir}`,
    ].join('\r\n'),            'utf-8')

    // Start watching for library.ris in this folder
    _startLibWatch(risFile)
    _saveLibWatchCfg({ path: risFile, enabled: true })

    return { success: true, syncDir, ps1File, risFile }
  } catch(e) { return { success: false, error: e.message } }
})

ipcMain.handle('lib-open-bib-dialog', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'], title: 'Choose a .bib or .ris file to watch',
    filters: [{ name: 'Citation files', extensions: ['bib','ris'] }],
  })
  return r.canceled ? null : r.filePaths[0]
})

// Resume watch on startup
app.whenReady().then(() => {
  const cfg = _readLibWatchCfg()
  if (cfg.enabled && cfg.path && fs.existsSync(cfg.path)) _startLibWatch(cfg.path)
})

// ─── Share: Helpers ───────────────────────────────────────────────────────────

const BUNDLE_VERSION = 1

function _getDeviceId() {
  const p = path.join(app.getPath('userData'), 'device-id.txt')
  if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8').trim()
  const id = require('crypto').randomUUID()
  fs.writeFileSync(p, id, 'utf-8')
  return id
}

// ─── Share: Bundle Export / Import (Option A) ────────────────────────────────

ipcMain.handle('bundle-export-project', async (_, { projectId, include, dest }) => {
  try {
    const store   = readStore()
    const project = (store.projects || []).find(p => p.id === projectId)
    if (!project) return { success: false, error: 'Project not found' }

    const data = { projects: [project] }
    if (include.notes !== false)
      data.notes       = (store.notes       || []).filter(x => x.projectId === projectId || (x.projectIds||[]).includes(projectId))
    if (include.todos !== false)
      data.todos       = (store.todos        || []).filter(x => x.projectId === projectId)
    if (include.papers !== false)
      data.papers      = (store.papers       || []).filter(x => (x.projectIds||[]).includes(projectId))
    if (include.grants !== false)
      data.grants      = (store.grants       || []).filter(x => x.linkedProjectId === projectId)
    if (include.whiteboards !== false)
      data.whiteboards = (store.whiteboards  || []).filter(x => x.projectId === projectId)
    if (include.events !== false)
      data.events      = (store.events       || []).filter(x => x.projectId === projectId)

    const bundle = {
      _type: 'phdflow-bundle', _bundleVersion: BUNDLE_VERSION,
      _appVersion: app.getVersion(), _exportedAt: new Date().toISOString(),
      _exportedBy: readAuthCfg()?.name || 'PhDFlow User',
      _deviceId: _getDeviceId(), title: project.name,
      summary: Object.fromEntries(Object.entries(data).map(([k,v]) => [k, v.length])),
      data,
    }
    fs.writeFileSync(dest, JSON.stringify(bundle, null, 2), 'utf-8')
    return { success: true, dest, summary: bundle.summary }
  } catch(e) { return { success: false, error: e.message } }
})

ipcMain.handle('bundle-export-full', async (_, { dest }) => {
  try {
    const store = readStore()
    const countKeys = ['projects','notes','todos','papers','grants','whiteboards','events','contacts']
    const bundle = {
      _type: 'phdflow-bundle', _bundleVersion: BUNDLE_VERSION,
      _appVersion: app.getVersion(), _exportedAt: new Date().toISOString(),
      _exportedBy: readAuthCfg()?.name || 'PhDFlow User',
      _deviceId: _getDeviceId(), title: 'Full Workspace',
      summary: Object.fromEntries(countKeys.map(k => [k, (store[k]||[]).length])),
      data: store,
    }
    fs.writeFileSync(dest, JSON.stringify(bundle, null, 2), 'utf-8')
    return { success: true, dest, summary: bundle.summary }
  } catch(e) { return { success: false, error: e.message } }
})

ipcMain.handle('open-bundle-dialog', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'PhDFlow Bundle', extensions: ['phdflow'] }]
  })
  return r.canceled ? null : r.filePaths[0]
})

ipcMain.handle('open-bundle-save-dialog', async (_, defaultName) => {
  const r = await dialog.showSaveDialog(mainWindow, {
    defaultPath: (defaultName || 'phdflow-bundle').replace(/[/\\:*?"<>|]/g, '-'),
    filters: [{ name: 'PhDFlow Bundle', extensions: ['phdflow'] }]
  })
  return r.canceled ? null : r.filePath
})

ipcMain.handle('bundle-read', async (_, src) => {
  try {
    const bundle = JSON.parse(fs.readFileSync(src, 'utf-8'))
    if (bundle._type !== 'phdflow-bundle') return { success: false, error: 'Not a valid PhDFlow bundle' }
    return { success: true, bundle }
  } catch(e) { return { success: false, error: e.message } }
})

function _mergeBundle(current, bundleData, strategy) {
  const keys = Object.keys(bundleData).filter(k => !k.startsWith('_'))
  if (strategy === 'replace') {
    keys.forEach(k => { current[k] = bundleData[k] })
  } else {
    keys.forEach(k => {
      const inc = bundleData[k]
      if (!Array.isArray(inc)) { current[k] = inc; return }
      const cur    = Array.isArray(current[k]) ? current[k] : []
      const merged = [...cur]
      inc.forEach(item => {
        if (!item?.id) return
        const idx = merged.findIndex(c => c.id === item.id)
        if (idx === -1) { merged.push(item); return }
        const cd = merged[idx].updatedAt || merged[idx].createdAt || ''
        const id = item.updatedAt       || item.createdAt        || ''
        if (id > cd) merged[idx] = item
      })
      current[k] = merged
    })
  }
}

ipcMain.handle('bundle-import', async (_, { bundle, strategy }) => {
  try {
    const current = readStore()
    _mergeBundle(current, bundle.data, strategy || 'merge')
    writeStore(current)
    return { success: true }
  } catch(e) { return { success: false, error: e.message } }
})

// ─── Share: Cloud Folder Sync (Option B) ─────────────────────────────────────

let _syncWatcher  = null
let _syncDebounce = null

function _syncConfigPath() { return path.join(getDataDir(), 'sync-config.json') }
function _readSyncCfg()    { try { return JSON.parse(fs.readFileSync(_syncConfigPath(), 'utf-8')) } catch { return {} } }
function _saveSyncCfg(cfg) { fs.writeFileSync(_syncConfigPath(), JSON.stringify(cfg), 'utf-8') }

function _writeSyncFile(folderPath) {
  try {
    const deviceId = _getDeviceId()
    const name     = readAuthCfg()?.name || 'PhDFlow User'
    const ts       = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `phdflow-${deviceId.slice(0, 8)}-${ts}.sync`
    // Remove our own previous sync files in that folder
    fs.readdirSync(folderPath)
      .filter(f => f.startsWith(`phdflow-${deviceId.slice(0, 8)}`) && f.endsWith('.sync'))
      .forEach(f => { try { fs.unlinkSync(path.join(folderPath, f)) } catch {} })
    const payload = {
      _type: 'phdflow-sync', _syncVersion: 1,
      _appVersion: app.getVersion(), _syncedAt: new Date().toISOString(),
      _syncedBy: name, _deviceId: deviceId,
      data: readStore(),
    }
    fs.writeFileSync(path.join(folderPath, filename), JSON.stringify(payload, null, 2), 'utf-8')
    return { success: true, filename }
  } catch(e) { return { success: false, error: e.message } }
}

function _startFolderWatch(folderPath) {
  if (_syncWatcher) { try { _syncWatcher.close() } catch {} ; _syncWatcher = null }
  if (!folderPath || !fs.existsSync(folderPath)) return
  _writeSyncFile(folderPath)
  _syncWatcher = fs.watch(folderPath, (_, filename) => {
    if (!filename?.endsWith('.sync') || !filename.startsWith('phdflow-')) return
    const myPrefix = `phdflow-${_getDeviceId().slice(0, 8)}`
    if (filename.startsWith(myPrefix)) return
    if (_syncDebounce) clearTimeout(_syncDebounce)
    _syncDebounce = setTimeout(() => {
      try {
        const fp = path.join(folderPath, filename)
        if (!fs.existsSync(fp)) return
        const payload = JSON.parse(fs.readFileSync(fp, 'utf-8'))
        if (payload._type !== 'phdflow-sync') return
        mainWindow?.webContents?.send('sync-incoming', {
          syncedBy: payload._syncedBy, syncedAt: payload._syncedAt,
          deviceId: payload._deviceId, data: payload.data,
        })
      } catch {}
    }, 1200)
  })
}

ipcMain.handle('sync-get-config', () => _readSyncCfg())

ipcMain.handle('sync-set-folder', async (_, folderPath) => {
  try {
    const cfg = _readSyncCfg()
    cfg.folder = folderPath; cfg.enabled = true
    _saveSyncCfg(cfg)
    _startFolderWatch(folderPath)
    return { success: true }
  } catch(e) { return { success: false, error: e.message } }
})

ipcMain.handle('sync-disable', () => {
  const cfg = _readSyncCfg()
  cfg.enabled = false; _saveSyncCfg(cfg)
  if (_syncWatcher) { try { _syncWatcher.close() } catch {} ; _syncWatcher = null }
  return { success: true }
})

ipcMain.handle('sync-open-folder-dialog', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select sync folder (shared drive, Dropbox, OneDrive, etc.)'
  })
  return r.canceled ? null : r.filePaths[0]
})

ipcMain.handle('sync-write-now', () => {
  const cfg = _readSyncCfg()
  if (!cfg.enabled || !cfg.folder) return { success: false, error: 'Sync folder not set' }
  return _writeSyncFile(cfg.folder)
})

ipcMain.handle('sync-apply', async (_, { data, strategy }) => {
  try {
    const current = readStore()
    _mergeBundle(current, data, strategy || 'merge')
    writeStore(current)
    return { success: true }
  } catch(e) { return { success: false, error: e.message } }
})

// ─── Share: LAN Peer Discovery (Option C) ────────────────────────────────────

const LAN_UDP_PORT  = 41234
const LAN_HTTP_PORT = 41235
const LAN_MULTICAST = '239.255.41.23'

let _lanUdp    = null
let _lanHttp   = null
let _lanPeers  = new Map()
let _lanPendingBundle = null

function _localIp() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const addr of ifaces) {
      if (addr.family === 'IPv4' && !addr.internal) return addr.address
    }
  }
  return '127.0.0.1'
}

function _lanBroadcast() {
  if (!_lanUdp) return
  const msg = Buffer.from(JSON.stringify({
    _type: 'PHDFLOW_HELLO', deviceId: _getDeviceId(),
    name: readAuthCfg()?.name || 'PhDFlow User',
  }))
  try { _lanUdp.send(msg, LAN_UDP_PORT, LAN_MULTICAST) }   catch {}
  try { _lanUdp.send(msg, LAN_UDP_PORT, '255.255.255.255') } catch {}
}

function _startLanUdp() {
  if (_lanUdp) return
  const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true })
  sock.on('error', () => { _lanUdp = null })
  sock.on('message', (msg, rinfo) => {
    try {
      const p = JSON.parse(msg.toString())
      if (p._type !== 'PHDFLOW_HELLO' || p.deviceId === _getDeviceId()) return
      _lanPeers.set(p.deviceId, { name: p.name, ip: rinfo.address, port: LAN_HTTP_PORT, deviceId: p.deviceId, lastSeen: Date.now() })
      mainWindow?.webContents?.send('lan-peer-discovered', { deviceId: p.deviceId, name: p.name, ip: rinfo.address })
      // Reply directly so they add us too
      const reply = Buffer.from(JSON.stringify({ _type: 'PHDFLOW_HELLO', deviceId: _getDeviceId(), name: readAuthCfg()?.name || 'PhDFlow User' }))
      sock.send(reply, LAN_UDP_PORT, rinfo.address)
    } catch {}
  })
  sock.bind(LAN_UDP_PORT, () => {
    try { sock.addMembership(LAN_MULTICAST) } catch {}
    sock.setBroadcast(true)
    _lanUdp = sock
    _lanBroadcast()
    const iv = setInterval(() => {
      if (!_lanUdp) { clearInterval(iv); return }
      _lanBroadcast()
      const now = Date.now()
      for (const [id, peer] of _lanPeers) {
        if (now - peer.lastSeen > 25000) { _lanPeers.delete(id); mainWindow?.webContents?.send('lan-peer-lost', { deviceId: id }) }
      }
    }, 8000)
  })
}

function _startLanHttp() {
  if (_lanHttp) return
  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/ping') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ name: readAuthCfg()?.name || 'PhDFlow', deviceId: _getDeviceId() }))
      return
    }
    if (req.method === 'POST' && req.url === '/receive') {
      let body = ''
      req.on('data', c => { if (body.length < 50_000_000) body += c })
      req.on('end', () => {
        try {
          const bundle = JSON.parse(body)
          if (bundle._type !== 'phdflow-bundle') { res.writeHead(400); res.end(); return }
          _lanPendingBundle = bundle
          mainWindow?.webContents?.send('lan-bundle-incoming', {
            sentBy: bundle._exportedBy, title: bundle.title, summary: bundle.summary,
          })
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true }))
        } catch { res.writeHead(400); res.end() }
      })
      return
    }
    res.writeHead(404); res.end()
  })
  server.on('error', () => { _lanHttp = null })
  server.listen(LAN_HTTP_PORT, '0.0.0.0')
  _lanHttp = server
}

ipcMain.handle('lan-start', () => {
  try { _startLanUdp(); _startLanHttp(); return { success: true, ip: _localIp() } }
  catch(e) { return { success: false, error: e.message } }
})

ipcMain.handle('lan-stop', () => {
  if (_lanUdp)  { try { _lanUdp.close()  } catch {} ; _lanUdp  = null }
  if (_lanHttp) { try { _lanHttp.close() } catch {} ; _lanHttp = null }
  _lanPeers.clear()
  return { success: true }
})

ipcMain.handle('lan-get-peers', () => Array.from(_lanPeers.values()))

ipcMain.handle('lan-send-bundle', (_, { targetIp, bundleData }) => {
  return new Promise(resolve => {
    try {
      const body = JSON.stringify(bundleData)
      const req  = http.request({
        hostname: targetIp, port: LAN_HTTP_PORT, path: '/receive', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: 12000,
      }, res => {
        let data = ''
        res.on('data', c => data += c)
        res.on('end', () => {
          try { resolve({ success: res.statusCode === 200, response: JSON.parse(data) }) }
          catch { resolve({ success: res.statusCode === 200 }) }
        })
      })
      req.on('error',   e  => resolve({ success: false, error: e.message }))
      req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Connection timed out' }) })
      req.write(body); req.end()
    } catch(e) { resolve({ success: false, error: e.message }) }
  })
})

ipcMain.handle('lan-accept-bundle', async () => {
  if (!_lanPendingBundle) return { success: false, error: 'No pending bundle' }
  const bundle = _lanPendingBundle; _lanPendingBundle = null
  try {
    const current = readStore()
    _mergeBundle(current, bundle.data, 'merge')
    writeStore(current)
    return { success: true }
  } catch(e) { return { success: false, error: e.message } }
})

ipcMain.handle('lan-reject-bundle', () => { _lanPendingBundle = null; return { success: true } })

// Resume sync folder on startup
app.whenReady().then(() => {
  const cfg = _readSyncCfg()
  if (cfg.enabled && cfg.folder && fs.existsSync(cfg.folder)) _startFolderWatch(cfg.folder)
})

// Clean up on quit
app.on('before-quit', () => {
  if (_lanUdp)      { try { _lanUdp.close()      } catch {} }
  if (_lanHttp)     { try { _lanHttp.close()      } catch {} }
  if (_syncWatcher) { try { _syncWatcher.close()  } catch {} }
})

// ─── IPC: Quit App ─────────────────────────────────────────────────────────────
ipcMain.handle('quit-app', () => { _quitting = true; app.quit() })
