// ══ Literature Feed — Automated Paper Discovery ═══════════════════════════════

let _newsFeed        = []       // cached papers loaded from disk
let _newsFeedMap     = {}       // id → paper  (safe reference for click handlers)
let _newsSavedIds    = new Set()// paper IDs already saved to library
let _newsLastRefresh = null     // ISO timestamp of last search
let _newsLoading     = false
let _newsInited      = false
let _newsFilter      = { topicId: 'all', source: 'all', days: 30 }
let _newsAutoTimer   = null     // setInterval handle for background refresh

const _NEWS_COLORS = [
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-300' },
  { bg: 'bg-sky-100',    text: 'text-sky-700',    border: 'border-sky-300'    },
  { bg: 'bg-teal-100',   text: 'text-teal-700',   border: 'border-teal-300'   },
  { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300'  },
  { bg: 'bg-rose-100',   text: 'text-rose-700',   border: 'border-rose-300'   },
]

// ── Lazy Initialisation ───────────────────────────────────────────────────────

async function _initNews() {
  if (_newsInited) return
  _newsInited      = true
  _newsFeed        = (await api.storeGet('newsFeed'))       || []
  _newsLastRefresh = (await api.storeGet('newsLastRefresh')) || null
  const saved      = (await api.storeGet('newsSavedIds'))   || []
  _newsSavedIds    = new Set(saved)
  _newsFeed.forEach(p => { _newsFeedMap[p.id] = p })
}

// ── Main Render ───────────────────────────────────────────────────────────────

async function render_news() {
  const vc = document.getElementById('view-content')
  if (!vc) return

  if (!_newsInited) {
    vc.innerHTML = `<div class="flex-1 flex items-center justify-center">
      <p class="text-slate-400 text-sm">Loading feed…</p></div>`
    await _initNews()
  }

  const filtered = _newsFeedFiltered()
  const arSetting = state.profile?.newsAutoRefresh || 'off'
  const arLabel   = { off: '', launch: '· auto on launch', '6h': '· auto every 6h', '24h': '· auto daily' }[arSetting] || ''
  const lastStr   = _newsLastRefresh
    ? `Last refreshed ${_newsAgo(_newsLastRefresh)} ${arLabel}`
    : `Never refreshed ${arLabel}`

  vc.innerHTML = `
  <div class="flex flex-col h-full overflow-hidden">

    ${pageHeader('📡 Literature Feed',
      `<div class="flex items-center gap-3">
        <span class="text-xs text-slate-400">${lastStr}</span>
        <button onclick="newsClearFeed()" title="Clear all cached papers and start fresh"
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors
            text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-slate-200">
          🗑 Clear
        </button>
        <button onclick="refreshNewsFeed()" id="news-refresh-btn"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
            ${_newsLoading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}">
          ${_newsLoading ? '⏳ Searching…' : '⟳ Refresh Feed'}
        </button>
      </div>`
    )}

    <!-- ── Topics Bar ─────────────────────────────────────────────────────── -->
    <div class="bg-white border-b border-slate-200 px-6 py-3 flex-shrink-0">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Topics:</span>

        ${state.newsTopics.length === 0
          ? '<span class="text-xs text-slate-400 italic">No topics yet — add one to start tracking papers</span>'
          : state.newsTopics.map((t, i) => {
              const c = _NEWS_COLORS[i % _NEWS_COLORS.length]
              return `
              <span class="group inline-flex items-center gap-1 px-2.5 py-1 rounded-full border cursor-pointer
                ${c.bg} ${c.text} ${c.border} text-xs font-medium select-none"
                onclick="newsFilterByTopic('${t.id}')" title="Keywords: ${esc(t.keywords)}">
                ${esc(t.label)}
                <button onclick="event.stopPropagation();editNewsTopic('${t.id}')"
                  class="opacity-0 group-hover:opacity-100 ml-0.5 leading-none hover:opacity-70 transition-opacity text-[10px]">✏️</button>
                <button onclick="event.stopPropagation();removeNewsTopic('${t.id}')"
                  class="opacity-0 group-hover:opacity-100 leading-none hover:text-red-600 transition-opacity">✕</button>
              </span>`
            }).join('')
        }

        <button onclick="showNewsTopicForm()"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200
            text-slate-600 text-xs font-medium border border-slate-200 transition-colors">
          + Add Topic
        </button>
      </div>

      <!-- Add Topic Form -->
      <div id="news-topic-form" class="hidden mt-3 pt-3 border-t border-slate-100">
        <div class="flex gap-3 items-start">
          <div class="flex-1 space-y-2">
            <input id="news-topic-label" type="text" placeholder="Label  (e.g. RNA Splicing)"
              class="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-900
                placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              onkeydown="if(event.key==='Enter')saveNewsTopic()"/>
            <input id="news-topic-kw" type="text"
              placeholder="Search keywords  (e.g. RNA splicing spliceosome pre-mRNA)"
              class="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-900
                placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              onkeydown="if(event.key==='Enter')saveNewsTopic()"/>
            <p class="text-xs text-slate-400">
              Tip: separate distinct concepts with commas — e.g. <em>"protein folding, AlphaFold"</em>.
              Multi-word phrases are searched exactly in titles &amp; abstracts.
            </p>
          </div>
          <div class="flex flex-col gap-2 pt-0.5">
            <button onclick="saveNewsTopic()"
              class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
              Save
            </button>
            <button onclick="hideNewsTopicForm()"
              class="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Filter Bar ──────────────────────────────────────────────────────── -->
    <div class="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center gap-3 flex-shrink-0">
      <select onchange="_newsFilter.source=this.value;render_news()"
        class="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700
          focus:outline-none focus:ring-2 focus:ring-indigo-400">
        <option value="all"       ${_newsFilter.source==='all'?'selected':''}>All Sources</option>
        <option value="arXiv"     ${_newsFilter.source==='arXiv'?'selected':''}>arXiv</option>
        <option value="OpenAlex"  ${_newsFilter.source==='OpenAlex'?'selected':''}>OpenAlex</option>
      </select>

      <select onchange="_newsFilter.days=+this.value;render_news()"
        class="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700
          focus:outline-none focus:ring-2 focus:ring-indigo-400">
        <option value="7"  ${_newsFilter.days===7?'selected':''}>Last 7 days</option>
        <option value="14" ${_newsFilter.days===14?'selected':''}>Last 14 days</option>
        <option value="30" ${_newsFilter.days===30?'selected':''}>Last 30 days</option>
        <option value="90" ${_newsFilter.days===90?'selected':''}>Last 90 days</option>
        <option value="0"  ${_newsFilter.days===0?'selected':''}>All time</option>
      </select>

      <select onchange="_newsFilter.topicId=this.value;render_news()"
        class="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700
          focus:outline-none focus:ring-2 focus:ring-indigo-400">
        <option value="all">All Topics</option>
        ${state.newsTopics.map(t =>
          `<option value="${t.id}" ${_newsFilter.topicId===t.id?'selected':''}>${esc(t.label)}</option>`
        ).join('')}
      </select>

      <span class="text-xs text-slate-400 ml-auto">
        ${filtered.length} paper${filtered.length !== 1 ? 's' : ''}
        ${_newsFeed.length > filtered.length ? ` (${_newsFeed.length} total)` : ''}
      </span>
    </div>

    <!-- ── Papers Feed ─────────────────────────────────────────────────────── -->
    <div class="flex-1 overflow-y-auto p-6">
      ${state.newsTopics.length === 0 ? `
        <div class="flex flex-col items-center justify-center h-full text-center py-16">
          <div class="text-5xl mb-4">📡</div>
          <p class="text-slate-700 font-semibold text-lg mb-2">Set up your research topics</p>
          <p class="text-slate-400 text-sm mb-5 max-w-sm">
            Tell the feed what you're researching. It will automatically search arXiv and OpenAlex
            for new papers every time you hit Refresh.
          </p>
          <button onclick="showNewsTopicForm()"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
            + Add First Topic
          </button>
        </div>
      ` : filtered.length === 0 ? `
        <div class="flex flex-col items-center justify-center h-full text-center py-16">
          <div class="text-4xl mb-4">${_newsFeed.length === 0 ? '🔍' : '🗂️'}</div>
          <p class="text-slate-700 font-semibold mb-2">
            ${_newsFeed.length === 0 ? 'No papers fetched yet' : 'No papers match this filter'}
          </p>
          <p class="text-slate-400 text-sm mb-4">
            ${_newsFeed.length === 0
              ? 'Click Refresh to search for papers matching your topics.'
              : 'Try broadening the time range or selecting All Topics.'}
          </p>
          ${_newsFeed.length === 0
            ? `<button onclick="refreshNewsFeed()"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
                ⟳ Refresh Feed
              </button>`
            : ''}
        </div>
      ` : `<div class="space-y-3">${filtered.map(_newsPaperCard).join('')}</div>`}
    </div>

  </div>`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _newsFeedFiltered() {
  return _newsFeed.filter(p => {
    if (_newsFilter.topicId !== 'all' && p.topicId !== _newsFilter.topicId) return false
    if (_newsFilter.source  !== 'all' && p.source  !== _newsFilter.source)  return false
    if (_newsFilter.days) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - _newsFilter.days)
      if (!p.date || new Date(p.date) < cutoff) return false
    }
    return true
  })
}

function _newsPaperCard(p) {
  const topicIdx = state.newsTopics.findIndex(t => t.id === p.topicId)
  const color    = _NEWS_COLORS[Math.max(0, topicIdx) % _NEWS_COLORS.length]
  const saved    = _newsSavedIds.has(p.id)
  const authors  = (Array.isArray(p.authors) ? p.authors : [p.authors]).filter(Boolean)
  const aStr     = authors.length > 3
    ? authors.slice(0, 3).map(a => esc(a)).join(', ') + ' <span class="text-slate-400 italic">et al.</span>'
    : authors.map(a => esc(a)).join(', ')
  const dateStr  = p.date
    ? new Date(p.date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
    : ''

  return `
  <div class="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
    <div class="flex items-start gap-3">
      <div class="flex-1 min-w-0">

        <!-- badges + date -->
        <div class="flex items-center gap-1.5 flex-wrap mb-1.5">
          ${p.topicLabel
            ? `<span class="text-xs px-2 py-0.5 rounded-full border font-medium ${color.bg} ${color.text} ${color.border}">${esc(p.topicLabel)}</span>`
            : ''}
          <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">${esc(p.source)}</span>
          ${p.journal && p.journal !== 'arXiv preprint'
            ? `<span class="text-xs text-slate-400 italic truncate max-w-[200px]">${esc(p.journal)}</span>`
            : ''}
          <span class="text-xs text-slate-400 ml-auto flex-shrink-0">${dateStr}</span>
        </div>

        <!-- title -->
        <h4 class="text-sm font-semibold text-slate-900 leading-snug mb-1 cursor-pointer
          hover:text-indigo-600 transition-colors"
          data-open-paper="${esc(p.id)}">${esc(p.title)}</h4>

        <!-- authors -->
        ${aStr ? `<p class="text-xs text-slate-500 mb-1.5">${aStr}</p>` : ''}

        <!-- abstract -->
        ${p.abstract ? `
        <div>
          <p class="text-xs text-slate-400 leading-relaxed line-clamp-2" id="abs-${esc(p.id)}">${esc(p.abstract)}</p>
          <button onclick="newsToggleAbstract('${esc(p.id)}')" id="abs-btn-${esc(p.id)}"
            class="text-[10px] text-indigo-400 hover:text-indigo-600 mt-0.5 transition-colors">Show more</button>
        </div>` : ''}
      </div>

      <!-- action buttons -->
      <div class="flex flex-col gap-1.5 flex-shrink-0 ml-2 min-w-[72px]">
        <button data-save-paper="${esc(p.id)}"
          class="px-2.5 py-1 rounded-lg text-xs font-medium text-center transition-colors
            ${saved
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600'}">
          ${saved ? '✓ Saved' : '+ Library'}
        </button>
        ${p.url
          ? `<button data-open-paper="${esc(p.id)}"
              class="px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors text-center">
              Open →
            </button>`
          : ''}
      </div>
    </div>
  </div>`
}

function _newsAgo(iso) {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Topic Management ──────────────────────────────────────────────────────────

function showNewsTopicForm() {
  document.getElementById('news-topic-form')?.classList.remove('hidden')
  setTimeout(() => document.getElementById('news-topic-label')?.focus(), 50)
}

function hideNewsTopicForm() {
  document.getElementById('news-topic-form')?.classList.add('hidden')
  const lbl = document.getElementById('news-topic-label')
  const kw  = document.getElementById('news-topic-kw')
  if (lbl) lbl.value = ''
  if (kw)  kw.value  = ''
}

async function saveNewsTopic() {
  const label    = (document.getElementById('news-topic-label')?.value || '').trim()
  const keywords = (document.getElementById('news-topic-kw')?.value    || '').trim()
  if (!label)    { showToast('Please enter a topic label', 'error'); return }
  if (!keywords) { showToast('Please enter search keywords', 'error'); return }
  state.newsTopics.push({ id: 'nt-' + uid(), label, keywords })
  await save('newsTopics')
  hideNewsTopicForm()
  render_news()
}

function newsToggleAbstract(paperId) {
  const el  = document.getElementById(`abs-${paperId}`)
  const btn = document.getElementById(`abs-btn-${paperId}`)
  if (!el || !btn) return
  const expanded = el.classList.toggle('line-clamp-2')
  btn.textContent = expanded ? 'Show more' : 'Show less'
}

function editNewsTopic(id) {
  const t = state.newsTopics.find(x => x.id === id)
  if (!t) return
  openModal(`
  <h3 class="text-base font-bold mb-4">Edit Topic</h3>
  <div class="space-y-3">
    <div>
      <label class="label">Label</label>
      <input id="ent-label" type="text" value="${esc(t.label)}" class="input"/>
    </div>
    <div>
      <label class="label">Search keywords</label>
      <input id="ent-kw" type="text" value="${esc(t.keywords)}" class="input"/>
      <p class="text-xs text-slate-400 mt-1">Separate distinct concepts with commas.</p>
    </div>
    <div class="flex gap-3 pt-2">
      <button onclick="closeModal()" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="saveEditedTopic('${id}')" class="flex-1 btn-primary">Save</button>
    </div>
  </div>`)
  setTimeout(() => document.getElementById('ent-label')?.focus(), 80)
}

async function saveEditedTopic(id) {
  const label    = document.getElementById('ent-label')?.value.trim()
  const keywords = document.getElementById('ent-kw')?.value.trim()
  if (!label || !keywords) { showToast('Both fields required', 'error'); return }
  const t = state.newsTopics.find(x => x.id === id)
  if (t) { t.label = label; t.keywords = keywords }
  await save('newsTopics')
  closeModal()
  render_news()
  showToast('Topic updated ✓')
}

async function removeNewsTopic(id) {
  if (!await confirmDlg('Remove this topic?\n\nPapers already fetched stay in your feed.', 'Remove Topic')) return
  state.newsTopics = state.newsTopics.filter(t => t.id !== id)
  await save('newsTopics')
  if (_newsFilter.topicId === id) _newsFilter.topicId = 'all'
  render_news()
}

function newsFilterByTopic(id) {
  _newsFilter.topicId = (_newsFilter.topicId === id) ? 'all' : id
  render_news()
}

// ── Clear Feed ────────────────────────────────────────────────────────────────

async function newsClearFeed() {
  if (!await confirmDlg(
    'Clear all cached papers from the feed?\n\nYour saved library papers are not affected. Click "Refresh Feed" after clearing to re-fetch.',
    'Clear Feed'
  )) return
  _newsFeed = []; _newsFeedMap = {}; _newsLastRefresh = null
  await api.storeSet('newsFeed',        [])
  await api.storeSet('newsLastRefresh', null)
  showToast('Feed cleared — click Refresh to re-fetch ✓')
  render_news()
}

// ── Refresh Feed ──────────────────────────────────────────────────────────────

async function refreshNewsFeed() {
  if (_newsLoading) return
  if (!state.newsTopics.length) {
    showToast('Add at least one research topic first', 'error')
    return
  }
  _newsLoading = true
  render_news()

  try {
    const days   = _newsFilter.days || 30
    const result = await api.searchPapers(state.newsTopics, days)

    if (result.success) {
      const existingIds = new Set(_newsFeed.map(p => p.id))
      const fresh       = (result.papers || []).filter(p => !existingIds.has(p.id))
      _newsFeed         = [...fresh, ..._newsFeed].slice(0, 500)
      _newsFeed.forEach(p => { _newsFeedMap[p.id] = p })
      _newsLastRefresh  = new Date().toISOString()
      await api.storeSet('newsFeed',        _newsFeed)
      await api.storeSet('newsLastRefresh', _newsLastRefresh)
      showToast(fresh.length > 0
        ? `Found ${fresh.length} new paper${fresh.length !== 1 ? 's' : ''} ✓`
        : 'Feed is up to date')
    } else {
      showToast('Search failed: ' + (result.error || 'Unknown error'), 'error')
    }
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  }

  _newsLoading = false
  render_news()
}

// ── Save Paper to Library ─────────────────────────────────────────────────────

function newsSaveToLibrary(paperId) {
  if (_newsSavedIds.has(paperId)) return
  const p = _newsFeedMap[paperId]
  if (!p) return

  const dup = state.papers.some(e =>
    (p.doi && e.doi && e.doi === p.doi) ||
    (e.title?.toLowerCase().trim() === (p.title || '').toLowerCase().trim())
  )
  if (dup) { showToast('Already in your library', 'info'); return }

  openModal(`
  <h3 class="text-base font-bold mb-1">Save to Library</h3>
  <p class="text-xs text-slate-500 mb-4 truncate">${esc(p.title)}</p>
  <div class="space-y-3">
    <div>
      <label class="label">Reading status</label>
      <select id="nsl-status" class="input">
        <option value="unread">Unread</option>
        <option value="reading">Reading</option>
        <option value="read">Read</option>
      </select>
    </div>
    <div>
      <label class="label">Link to project <span class="text-slate-400 font-normal">(optional)</span></label>
      <select id="nsl-project" class="input">
        <option value="">— none —</option>
        ${state.projects.map(pr => `<option value="${pr.id}">${esc(pr.name)}</option>`).join('')}
      </select>
    </div>
    <div>
      <label class="label">Tags <span class="text-slate-400 font-normal">(comma-separated)</span></label>
      <input id="nsl-tags" type="text" class="input" value="${esc(p.topicLabel || '')}" placeholder="e.g. ML, NLP, review"/>
    </div>
    <div class="flex gap-3 pt-2">
      <button onclick="closeModal()" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="_newsSaveConfirm('${paperId}')" class="flex-1 btn-primary">Save to Library</button>
    </div>
  </div>`)
}

async function _newsSaveConfirm(paperId) {
  const p       = _newsFeedMap[paperId]
  if (!p) return
  const status  = document.getElementById('nsl-status')?.value  || 'unread'
  const projId  = document.getElementById('nsl-project')?.value || null
  const tagStr  = document.getElementById('nsl-tags')?.value    || ''
  const tags    = tagStr.split(',').map(t => t.trim()).filter(Boolean)
  const authors = (Array.isArray(p.authors) ? p.authors : [p.authors]).filter(Boolean)

  const entry = {
    id:         'lib-' + uid(),
    title:      p.title || '',
    authors,
    year:       p.date ? new Date(p.date).getFullYear() : null,
    journal:    p.journal || p.source || '',
    doi:        p.doi  || null,
    url:        p.url  || null,
    abstract:   p.abstract || null,
    topics:     tags,
    status,
    projectIds: projId ? [projId] : [],
    relevance:  'medium',
    addedDate:  new Date().toISOString().split('T')[0],
    addedAt:    new Date().toISOString(),
    source:     p.source,
  }
  state.papers.unshift(entry)
  await save('papers')
  _newsSavedIds.add(paperId)
  await api.storeSet('newsSavedIds', [..._newsSavedIds])
  closeModal()
  render_news()
  showToast('Saved to Library ✓')
}

// ── Auto-refresh ──────────────────────────────────────────────────────────────

async function newsInitAutoRefresh() {
  const setting = state.profile?.newsAutoRefresh || 'off'
  if (setting === 'off') return
  if (!state.newsTopics?.length) return

  // Ensure feed meta is loaded before we can check staleness
  if (!_newsInited) {
    _newsLastRefresh = (await api.storeGet('newsLastRefresh')) || null
  }

  const INTERVALS = { launch: 24 * 3600000, '6h': 6 * 3600000, '24h': 24 * 3600000 }
  const intervalMs = INTERVALS[setting] || 24 * 3600000
  const staleSince = _newsLastRefresh
    ? Date.now() - new Date(_newsLastRefresh).getTime()
    : Infinity

  // Trigger an initial refresh 8 s after launch if stale
  if (staleSince > intervalMs) {
    setTimeout(() => _newsBackgroundRefresh(), 8000)
  }

  // Recurring refresh (not for 'launch' mode — that's one-shot)
  if (setting === '6h' || setting === '24h') {
    if (_newsAutoTimer) clearInterval(_newsAutoTimer)
    _newsAutoTimer = setInterval(() => _newsBackgroundRefresh(), intervalMs)
  }
}

async function _newsBackgroundRefresh() {
  if (_newsLoading || !state.newsTopics?.length) return
  _newsLoading = true

  // Make sure local state is hydrated
  if (!_newsInited) {
    _newsFeed        = (await api.storeGet('newsFeed'))      || []
    _newsLastRefresh = (await api.storeGet('newsLastRefresh')) || null
    const saved      = (await api.storeGet('newsSavedIds'))  || []
    _newsSavedIds    = new Set(saved)
    _newsFeed.forEach(p => { _newsFeedMap[p.id] = p })
    _newsInited = true
  }

  try {
    const days   = _newsFilter.days || 30
    const result = await api.searchPapers(state.newsTopics, days)

    if (result.success) {
      const existingIds = new Set(_newsFeed.map(p => p.id))
      const fresh       = (result.papers || []).filter(p => !existingIds.has(p.id))

      if (fresh.length > 0) {
        _newsFeed = [...fresh, ..._newsFeed].slice(0, 500)
        _newsFeed.forEach(p => { _newsFeedMap[p.id] = p })
        _newsLastRefresh = new Date().toISOString()
        await api.storeSet('newsFeed',        _newsFeed)
        await api.storeSet('newsLastRefresh', _newsLastRefresh)

        if (state.currentView === 'news') {
          render_news()
        } else {
          // Badge on the sidebar nav item
          window._newsNavBadge = (window._newsNavBadge || 0) + fresh.length
          renderSidebar()
          showToast(`📡 ${fresh.length} new paper${fresh.length > 1 ? 's' : ''} in your feed`)
        }
      }
    }
  } catch {}

  _newsLoading = false
  if (state.currentView === 'news') render_news()
}

// ── Click Delegation ──────────────────────────────────────────────────────────

document.addEventListener('click', e => {
  // Open paper in browser (title click or "Open →" button)
  const opener = e.target.closest('[data-open-paper]')
  if (opener) {
    const p = _newsFeedMap[opener.dataset.openPaper]
    if (p?.url) api.openExternal(p.url)
    return
  }
  // Save to Library
  const saver = e.target.closest('[data-save-paper]')
  if (saver) {
    newsSaveToLibrary(saver.dataset.savePaper)
    return
  }
})
