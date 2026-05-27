const { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, nativeImage } = require('electron')
const path = require('path')
const fs   = require('fs')

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
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1100, minHeight: 700,
    backgroundColor: '#0f172a',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
    title: 'PhD Command Center',
    show: false
  })
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'))
  mainWindow.once('ready-to-show', () => mainWindow.show())

  // ✕ button → hide to tray + lock session (does NOT quit the app)
  mainWindow.on('close', e => {
    if (!_quitting) {
      e.preventDefault()
      _auth.loggedIn = false
      mainWindow.webContents.send('auth-locked')
      mainWindow.hide()
    }
  })
}

function setupTray() {
  try {
    const iconPath = path.join(__dirname, 'build', 'icon.png')
    const rawIcon  = fs.existsSync(iconPath)
      ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
      : nativeImage.createEmpty()
    tray = new Tray(rawIcon)
    tray.setToolTip('PhD Command Center')
    const menu = Menu.buildFromTemplate([
      { label: '📖  Open PhD Command Center', click: () => { mainWindow.show(); mainWindow.focus() } },
      { type: 'separator' },
      { label: '🔒  Lock & Minimise to Tray', click: () => {
          _auth.loggedIn = false
          mainWindow.webContents.send('auth-locked')
          mainWindow.hide()
      }},
      { type: 'separator' },
      { label: '✕  Quit PhD Command Center', click: () => { _quitting = true; app.quit() } }
    ])
    tray.setContextMenu(menu)
    tray.on('double-click', () => { mainWindow.show(); mainWindow.focus() })
  } catch(e) { console.error('Tray setup failed:', e.message) }
}

app.whenReady().then(() => {
  createWindow()
  setupTray()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

// Keep app alive in tray — only exit when _quitting = true
app.on('window-all-closed', () => { /* intentionally empty — tray keeps app running */ })

// ─── IPC: Core ────────────────────────────────────────────────────────────────

ipcMain.handle('store-get', (_, key) => readStore()[key] ?? null)
ipcMain.handle('store-set', (_, key, value) => { const d = readStore(); d[key]=value; writeStore(d); return true })
ipcMain.handle('open-external', (_, url) => shell.openExternal(url))
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

ipcMain.handle('search-researchers', async (_, query) => {
  try {
    const [s2Res, oaRes] = await Promise.allSettled([
      fetch(`https://api.semanticscholar.org/graph/v1/author/search?query=${encodeURIComponent(query)}&fields=name,affiliations,homepage,paperCount,citationCount,hIndex&limit=10`,
        { headers: { 'User-Agent': 'PhD-Command-Center/0.2 (open-source)' } }).then(r => r.json()),
      fetch(`https://api.openalex.org/authors?search=${encodeURIComponent(query)}&per-page=10`,
        { headers: { 'User-Agent': 'PhD-Command-Center/0.2 (mailto:phd-cc@example.com)' } }).then(r => r.json())
    ])

    const s2Authors = s2Res.status === 'fulfilled' ? (s2Res.value.data || []) : []
    const oaAuthors = oaRes.status === 'fulfilled' ? (oaRes.value.results || []) : []

    const results = s2Authors.map(s2 => {
      const affiliations = (s2.affiliations||[]).map(a => a.name)
      const oa = oaAuthors.find(o => o.display_name?.toLowerCase() === s2.name?.toLowerCase())
      const oaInstitutions = oa?.last_known_institutions?.map(i => i.display_name) || []
      const allAffs = [...new Set([...affiliations,...oaInstitutions])]
      const topics = oa?.x_concepts?.slice(0,4).map(c => c.display_name) || []
      const orcid = oa?.ids?.orcid?.replace('https://orcid.org/','') || null
      return {
        id: s2.authorId, name: s2.name,
        institution: allAffs[0]||null, affiliations: allAffs, topics,
        homepage: s2.homepage||null,
        hIndex: s2.hIndex || oa?.summary_stats?.h_index || 0,
        paperCount: s2.paperCount || oa?.works_count || 0,
        citationCount: s2.citationCount || oa?.cited_by_count || 0,
        orcid, s2Url: `https://www.semanticscholar.org/author/${s2.authorId}`,
        oaUrl: oa?.id ? `https://openalex.org/authors/${oa.id.split('/').pop()}` : null,
        ...inferEmail(s2.name, allAffs)
      }
    })

    // add OpenAlex-only
    for (const oa of oaAuthors) {
      if (!results.some(r => r.name?.toLowerCase() === oa.display_name?.toLowerCase())) {
        const insts = oa.last_known_institutions?.map(i => i.display_name) || []
        results.push({
          id: `oa-${oa.id?.split('/').pop()}`, name: oa.display_name,
          institution: insts[0]||null, affiliations: insts,
          topics: oa.x_concepts?.slice(0,4).map(c=>c.display_name)||[],
          homepage: null, hIndex: oa.summary_stats?.h_index||0,
          paperCount: oa.works_count||0, citationCount: oa.cited_by_count||0,
          orcid: oa.ids?.orcid?.replace('https://orcid.org/','')||null,
          s2Url: null, oaUrl: oa.id ? `https://openalex.org/authors/${oa.id.split('/').pop()}` : null,
          ...inferEmail(oa.display_name, insts)
        })
      }
    }
    return { success: true, results: results.slice(0,10) }
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
        const terms    = kw.split(/\s+/).filter(t => t.length > 1).slice(0, 5)
        const queryStr = terms.map(t => `all:${encodeURIComponent(t)}`).join('+AND+')
        const r = await fetch(
          `https://export.arxiv.org/api/query?search_query=${queryStr}&max_results=15&sortBy=submittedDate&sortOrder=descending`,
          { headers: { 'User-Agent': 'PhD-Command-Center/0.2' },
            signal: AbortSignal.timeout(12000) }
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
            allPapers.push({
              id: `arxiv-${link?.split('/').pop() || _uid()}`,
              title, authors,
              abstract: (summary || '').slice(0, 400),
              url: link?.replace('http://arxiv.org/abs/', 'https://arxiv.org/abs/') || link,
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
        const r = await fetch(
          `https://api.openalex.org/works?search=${encodeURIComponent(kw)}&filter=from_publication_date:${cutoffDate}&sort=publication_date:desc&per-page=10`,
          { headers: { 'User-Agent': 'PhD-Command-Center/0.2 (mailto:phd-cc@example.com)' },
            signal: AbortSignal.timeout(12000) }
        )
        if (r.ok) {
          const data = await r.json()
          for (const w of (data.results || [])) {
            const authors = (w.authorships || []).slice(0, 5)
              .map(a => a.author?.display_name || '').filter(Boolean)
            const doi = w.doi?.replace('https://doi.org/', '') || null
            allPapers.push({
              id: `oa-${w.id?.split('/').pop() || _uid()}`,
              title: w.title || 'Untitled',
              authors,
              abstract: (w.abstract_inverted_index
                ? Object.keys(w.abstract_inverted_index).join(' ').slice(0, 400)
                : ''
              ),
              url: w.doi || w.id || '',
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
      from:`"PhD Command Center" <${user}>`, to,
      subject:`Vault access code: ${otp}`,
      html:`<div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#1e293b;margin:0 0 8px">🔐 PhD Command Center</h2>
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

ipcMain.handle('send-discord', async (_, { webhookUrl, message, type }) => {
  try {
    const colors = { bug:0xe74c3c, feature:0x3498db, praise:0x2ecc71, other:0x95a5a6 }
    const icons  = { bug:'🐛', feature:'💡', praise:'⭐', other:'💬' }
    const r = await fetch(webhookUrl, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username:'PhD Command Center', embeds:[{
        title:`${icons[type]||'💬'} ${(type||'Feedback').charAt(0).toUpperCase()+(type||'').slice(1)}`,
        description: message, color: colors[type]||colors.other,
        timestamp: new Date().toISOString(),
        footer: { text:`PhD Command Center v${app.getVersion()}` }
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

ipcMain.handle('test-discord-webhook', async (_, url) => {
  try {
    const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({content:'✅ PhD Command Center webhook test — connected!'}),
      signal:AbortSignal.timeout(10000) })
    return { success:r.ok, status:r.status }
  } catch(e) { return { success:false, error:e.message } }
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

// ─── IPC: Update Check (GitHub Releases) ─────────────────────────────────────

function _semverGt(a, b) {
  const pa = (a || '').split('.').map(Number)
  const pb = (b || '').split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0, nb = pb[i] || 0
    if (na > nb) return true
    if (na < nb) return false
  }
  return false
}

ipcMain.handle('check-for-updates', async () => {
  try {
    const r = await fetch('https://api.github.com/repos/PhDMax/phd-command-center/releases/latest', {
      headers: { 'User-Agent': 'PhD-Command-Center', 'Accept': 'application/vnd.github.v3+json' },
      signal: AbortSignal.timeout(10000)
    })
    if (!r.ok) return { success: false, error: `GitHub API returned ${r.status}` }
    const data    = await r.json()
    const latest  = (data.tag_name || '').replace(/^v/, '')
    const current = app.getVersion()
    return {
      success: true, currentVersion: current, latestVersion: latest,
      hasUpdate: _semverGt(latest, current),
      releaseUrl: data.html_url || 'https://github.com/PhDMax/phd-command-center/releases/latest',
      releaseNotes: (data.body || '').slice(0, 600)
    }
  } catch(e) { return { success: false, error: e.message } }
})

// ─── IPC: Quit App ─────────────────────────────────────────────────────────────
ipcMain.handle('quit-app', () => { _quitting = true; app.quit() })
