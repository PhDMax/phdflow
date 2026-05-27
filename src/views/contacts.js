// ══ Contacts & Discover ═══════════════════════════════════════════════════════

// ── Discover state ────────────────────────────────────────────────────────────

let _discTab      = 'search'   // 'search' | 'following'
let _discFollowed = new Set()  // S2 IDs being followed
let _discFollowData = []       // [{id, name, institution, s2Id, s2Url, lastChecked, ...}]
let _discInited   = false

async function _initDiscover() {
  if (_discInited) return
  _discInited   = true
  const ids     = (await api.storeGet('followedIds'))   || []
  const data    = (await api.storeGet('followedData'))  || []
  _discFollowed = new Set(ids)
  _discFollowData = data
}

// ── DISCOVER ──────────────────────────────────────────────────────────────────

function render_discover() {
  const vc = document.getElementById('view-content')
  if (!vc) return

  if (!_discInited) {
    vc.innerHTML = `<div class="flex-1 flex items-center justify-center"><p class="text-slate-400 text-sm">Loading…</p></div>`
    _initDiscover().then(() => render_discover())
    return
  }

  const followCount = _discFollowData.length

  vc.innerHTML = `
  <div class="flex flex-col h-full overflow-hidden">
    ${pageHeader('🔍 Discover Researchers', '')}

    <!-- Tabs + search bar -->
    <div class="bg-white border-b border-slate-200 px-6 pt-0 flex-shrink-0">
      <div class="flex gap-1 border-b border-slate-200 -mb-px">
        <button onclick="_discTab='search';render_discover()"
          class="px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors
            ${_discTab==='search' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}">
          🔍 Search
        </button>
        <button onclick="_discTab='following';render_discover()"
          class="px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors
            ${_discTab==='following' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}">
          ⭐ Following ${followCount > 0 ? `<span class="ml-1 bg-indigo-100 text-indigo-700 px-1.5 py-px rounded-full">${followCount}</span>` : ''}
        </button>
      </div>

      ${_discTab === 'search' ? `
      <div class="py-3 flex gap-2">
        <input id="disc-query" type="text" placeholder="Researcher name (e.g. Jennifer Doudna)"
          class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onkeydown="if(event.key==='Enter')doResearcherSearch()"/>
        <input id="disc-inst" type="text" placeholder="Institution (optional)"
          class="w-44 px-3 py-2.5 rounded-xl border border-slate-200 text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
        <button onclick="doResearcherSearch()"
          class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
          Search
        </button>
      </div>
      <p class="text-xs text-slate-400 pb-3">Free · Semantic Scholar + OpenAlex · 260M+ papers · No API key</p>
      ` : ''}
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      ${_discTab === 'search' ? _discSearchPanel() : _discFollowingPanel()}
    </div>
  </div>`
}

function _discSearchPanel() {
  return `
    <div id="disc-state-empty" class="${state.searchResults?.length ? 'hidden' : ''} flex flex-col items-center justify-center h-full text-center">
      ${emptyState('🔬','Find any academic researcher','Enter a name above — we\'ll find their institution, email, LinkedIn, and recent work')}
    </div>
    <div id="disc-state-loading" class="hidden flex flex-col items-center justify-center h-full">
      <div class="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p class="text-slate-500 text-sm">Searching…</p>
    </div>
    <div id="disc-state-error" class="hidden flex flex-col items-center justify-center h-full text-center">
      <div class="text-4xl mb-3">⚠️</div>
      <p id="disc-error-msg" class="text-slate-600 text-sm"></p>
    </div>
    <div id="disc-results" class="${state.searchResults?.length ? '' : 'hidden'} space-y-3 max-w-3xl">
      ${state.searchResults?.length ? _buildResultCards(state.searchResults) : ''}
    </div>`
}

function _discFollowingPanel() {
  if (!_discFollowData.length) {
    return `<div class="flex flex-col items-center justify-center h-full text-center">
      <div class="text-5xl mb-4">⭐</div>
      <p class="text-slate-600 font-semibold mb-2">No researchers followed yet</p>
      <p class="text-slate-400 text-sm max-w-xs">Search for researchers and click ⭐ Follow to track their new publications here.</p>
    </div>`
  }
  return `
  <div class="max-w-3xl space-y-3">
    ${_discFollowData.map((r, i) => `
    <div class="bg-white border border-slate-200 rounded-xl p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <div class="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
            ${initials(r.name)}
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-slate-900 text-sm">${esc(r.name)}</p>
            <p class="text-xs text-slate-500 truncate">${esc(r.institution || 'Unknown institution')}</p>
            ${r.lastChecked ? `<p class="text-xs text-slate-400">Last checked: ${fmtDate(r.lastChecked)}</p>` : ''}
          </div>
        </div>
        <div class="flex gap-2 flex-shrink-0">
          <button onclick="discCheckPapers('${r.id}', ${i})"
            class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg transition-colors">
            📚 Check papers
          </button>
          <button onclick="discUnfollow('${r.id}')"
            class="px-2 py-1.5 text-slate-400 hover:text-red-500 text-xs rounded-lg transition-colors">✕</button>
        </div>
      </div>
      <div id="follow-papers-${i}" class="hidden mt-3 pt-3 border-t border-slate-100 space-y-1.5"></div>
    </div>`).join('')}
  </div>`
}

// ── Search ────────────────────────────────────────────────────────────────────

async function doResearcherSearch() {
  const query = (document.getElementById('disc-query')?.value || '').trim()
  const inst  = (document.getElementById('disc-inst')?.value  || '').trim()
  if (!query) return
  const combined = inst ? `${query} ${inst}` : query
  _discSetState('loading')
  const result = await window.api.searchResearchers(combined)
  if (!result.success) { _discSetState('error', result.error); return }
  state.searchResults = result.results || []
  if (!state.searchResults.length) { _discSetState('error','No researchers found. Try a different name.'); return }
  _discSetState('results')
  const container = document.getElementById('disc-results')
  if (container) container.innerHTML = _buildResultCards(state.searchResults)
}

function _discSetState(s, msg) {
  ;['disc-state-empty','disc-state-loading','disc-state-error','disc-results']
    .forEach(id => document.getElementById(id)?.classList.add('hidden'))
  if (s==='loading') {
    document.getElementById('disc-state-loading')?.classList.remove('hidden')
  } else if (s==='error') {
    document.getElementById('disc-state-error')?.classList.remove('hidden')
    const el = document.getElementById('disc-error-msg')
    if (el) el.textContent = msg || 'Error'
  } else if (s==='results') {
    document.getElementById('disc-results')?.classList.remove('hidden')
  } else {
    document.getElementById('disc-state-empty')?.classList.remove('hidden')
  }
}

function _buildResultCards(results) {
  return results.map((r, i) => {
    const saved    = state.contacts.some(c => c.s2Id===r.id || c.name===r.name)
    const followed = _discFollowed.has(r.id)
    const conf     = r.emailConfidence || 0
    const confCls  = conf>=70 ? 'bg-green-100 text-green-700' : conf>=40 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
    const liSearch = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent((r.name||'') + ' ' + (r.institution||''))}`
    const gSearch  = `https://scholar.google.com/scholar?q=${encodeURIComponent(r.name||'')}`

    return `
    <div class="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-shadow">

      <!-- Header row -->
      <div class="flex items-start gap-3 mb-3">
        <div class="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
          ${initials(r.name)}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-bold text-slate-900">${esc(r.name)}</p>
          <p class="text-sm text-slate-500 truncate">🏛️ ${esc(r.institution || 'Unknown institution')}</p>
          ${(r.affiliations||[]).length > 1
            ? `<p class="text-xs text-slate-400 truncate">${r.affiliations.slice(1,3).map(a=>esc(a)).join(' · ')}</p>`
            : ''}
        </div>
        <div class="flex gap-2 flex-shrink-0">
          <button onclick="discFollow(${i})" title="${followed?'Unfollow':'Follow new papers'}"
            class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
              ${followed ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:bg-amber-50'}">
            ${followed ? '⭐ Following' : '⭐ Follow'}
          </button>
          <button onclick="discSave(${i})" ${saved?'disabled':''} title="Save to Contacts"
            class="${saved ? 'bg-slate-100 text-slate-400 cursor-default' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'} px-3 py-1.5 rounded-lg text-xs font-medium border border-transparent transition-colors">
            ${saved ? '✓ Saved' : '+ Contacts'}
          </button>
        </div>
      </div>

      <!-- Key contact info -->
      <div class="grid grid-cols-2 gap-2 mb-3">

        <!-- Email -->
        <div class="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
          <span class="text-slate-400 text-sm flex-shrink-0">📧</span>
          ${r.email
            ? `<div class="min-w-0">
                <button onclick="navigator.clipboard.writeText('${esc(r.email)}').then(()=>showToast('Copied ✓'))"
                  class="font-mono text-xs text-slate-700 hover:text-indigo-600 truncate block w-full text-left">
                  ${esc(r.email)}
                </button>
                <span class="text-xs ${confCls} px-1.5 py-px rounded-full inline-block mt-0.5">${conf}% inferred</span>
               </div>`
            : `<span class="text-xs text-slate-400 italic">Email not available</span>`}
        </div>

        <!-- LinkedIn -->
        <button onclick="api.openExternal('${liSearch}')"
          class="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-2 transition-colors text-left">
          <span class="text-blue-600 text-sm flex-shrink-0">in</span>
          <span class="text-xs text-blue-700 font-medium">Search on LinkedIn →</span>
        </button>

      </div>

      <!-- Stats + links row -->
      <div class="flex flex-wrap items-center gap-2 mb-3">
        ${r.hIndex       ? `<span class="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">h-index <strong>${r.hIndex}</strong></span>` : ''}
        ${r.paperCount   ? `<span class="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full"><strong>${r.paperCount}</strong> papers</span>` : ''}
        ${r.citationCount? `<span class="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">${r.citationCount.toLocaleString()} citations</span>` : ''}
        ${r.orcid        ? `<span class="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">ORCID ✓</span>` : ''}
        ${(r.topics||[]).slice(0,3).map(t=>`<span class="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">${esc(t)}</span>`).join('')}
      </div>

      <!-- Profile links -->
      <div class="flex flex-wrap gap-3 text-xs border-t border-slate-100 pt-3">
        ${r.s2Url    ? `<button onclick="api.openExternal('${esc(r.s2Url)}')"    class="text-indigo-500 hover:underline">📚 Publications (S2)</button>` : ''}
        <button onclick="api.openExternal('${gSearch}')" class="text-indigo-500 hover:underline">🎓 Google Scholar</button>
        ${r.oaUrl    ? `<button onclick="api.openExternal('${esc(r.oaUrl)}')"    class="text-indigo-500 hover:underline">OpenAlex</button>` : ''}
        ${r.orcid    ? `<button onclick="api.openExternal('https://orcid.org/${esc(r.orcid)}')" class="text-indigo-500 hover:underline">ORCID</button>` : ''}
        ${r.homepage ? `<button onclick="api.openExternal('${esc(r.homepage)}')" class="text-indigo-500 hover:underline">🔗 Homepage</button>` : ''}
        ${r.id && r.id.startsWith && !r.id.startsWith('oa-')
          ? `<button onclick="discRecentPapers('${esc(r.id)}', ${i})" id="rpbtn-${i}"
              class="ml-auto text-slate-500 hover:text-indigo-600 transition-colors">
              ▾ Recent papers
            </button>` : ''}
      </div>

      <!-- Recent papers (lazy) -->
      <div id="rp-${i}" class="hidden mt-3 pt-3 border-t border-slate-100 space-y-1.5"></div>
    </div>`
  }).join('')
}

// ── Per-card actions ──────────────────────────────────────────────────────────

async function discSave(index) {
  const r = state.searchResults[index]
  if (!r || state.contacts.some(c=>c.s2Id===r.id||c.name===r.name)) {
    showToast('Already in Contacts','info'); return
  }
  state.contacts.push({
    id:uid(), name:r.name, email:r.email||'', institution:r.institution||'', department:'',
    role:'Researcher', researchAreas:(r.topics||[]).join(', '), phone:'',
    linkedIn:'', googleScholar:'', website:r.homepage||'',
    emailConfidence:r.emailConfidence||0, emailSource:r.emailSource||'unknown',
    hIndex:r.hIndex||0, paperCount:r.paperCount||0, orcid:r.orcid||null,
    s2Id:r.id, s2Url:r.s2Url||null, oaUrl:r.oaUrl||null,
    interactionLog:[], notes:'', addedAt:new Date().toISOString()
  })
  await save('contacts')
  showToast(`${r.name} saved to Contacts ✓`)
  const container = document.getElementById('disc-results')
  if (container) container.innerHTML = _buildResultCards(state.searchResults)
}

async function discFollow(index) {
  const r = state.searchResults[index]
  if (!r) return
  if (_discFollowed.has(r.id)) {
    await discUnfollow(r.id)
    return
  }
  _discFollowed.add(r.id)
  _discFollowData.push({
    id: r.id, name: r.name, institution: r.institution||'', s2Id: r.id,
    s2Url: r.s2Url||null, addedAt: new Date().toISOString(), lastChecked: null
  })
  await api.storeSet('followedIds',   [..._discFollowed])
  await api.storeSet('followedData',  _discFollowData)
  showToast(`Following ${r.name} ✓`)
  const container = document.getElementById('disc-results')
  if (container) container.innerHTML = _buildResultCards(state.searchResults)
}

async function discUnfollow(id) {
  _discFollowed.delete(id)
  _discFollowData = _discFollowData.filter(r => r.id !== id)
  await api.storeSet('followedIds',  [..._discFollowed])
  await api.storeSet('followedData', _discFollowData)
  showToast('Unfollowed')
  render_discover()
}

async function discRecentPapers(s2Id, cardIndex) {
  const btn = document.getElementById(`rpbtn-${cardIndex}`)
  const box = document.getElementById(`rp-${cardIndex}`)
  if (!box) return
  if (!box.classList.contains('hidden')) { box.classList.add('hidden'); return }
  if (btn) btn.textContent = 'Loading…'
  try {
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/author/${s2Id}/papers?fields=title,year,publicationDate,url,externalIds&limit=5&offset=0`,
      { headers: { 'User-Agent':'PhD-Command-Center/0.2' } }
    )
    if (!res.ok) throw new Error('API error')
    const data  = await res.json()
    const papers = (data.data || []).sort((a,b) => (b.year||0)-(a.year||0))
    box.innerHTML = papers.length
      ? papers.map(p => {
          const doi = p.externalIds?.DOI
          const url = p.url || (doi ? `https://doi.org/${doi}` : '')
          return `<div class="flex items-start gap-2 text-xs py-1.5 border-b border-slate-50 last:border-0">
            <span class="text-slate-400 flex-shrink-0 w-9">${p.year||'—'}</span>
            ${url
              ? `<button onclick="api.openExternal('${esc(url)}')" class="text-slate-700 hover:text-indigo-600 text-left hover:underline leading-snug">${esc(p.title)}</button>`
              : `<span class="text-slate-700 leading-snug">${esc(p.title)}</span>`}
          </div>`
        }).join('')
      : '<p class="text-xs text-slate-400">No papers found in database</p>'
    box.classList.remove('hidden')
    if (btn) btn.textContent = '▴ Recent papers'
  } catch(e) {
    if (btn) btn.textContent = '▾ Recent papers'
    showToast('Could not load papers','error')
  }
}

async function discCheckPapers(followId, listIndex) {
  const r   = _discFollowData.find(x => x.id === followId)
  const box = document.getElementById(`follow-papers-${listIndex}`)
  if (!r?.id || !box) return
  box.innerHTML = '<p class="text-xs text-slate-400">Loading…</p>'
  box.classList.remove('hidden')
  try {
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/author/${r.id}/papers?fields=title,year,publicationDate,url&limit=8&offset=0`,
      { headers: { 'User-Agent':'PhD-Command-Center/0.2' } }
    )
    if (!res.ok) throw new Error()
    const papers = ((await res.json()).data || []).sort((a,b)=>(b.year||0)-(a.year||0))
    box.innerHTML = papers.length
      ? `<p class="text-xs font-semibold text-slate-600 mb-2">Recent publications:</p>`
        + papers.map(p => `
          <div class="flex gap-2 text-xs py-1 border-b border-slate-50 last:border-0">
            <span class="text-slate-400 w-9 flex-shrink-0">${p.year||'—'}</span>
            ${p.url ? `<button onclick="api.openExternal('${esc(p.url)}')" class="text-left text-slate-700 hover:text-indigo-600 hover:underline leading-snug">${esc(p.title)}</button>`
                    : `<span class="text-slate-700 leading-snug">${esc(p.title)}</span>`}
          </div>`).join('')
      : '<p class="text-xs text-slate-400">No papers found</p>'
    // Update last-checked timestamp
    r.lastChecked = new Date().toISOString().split('T')[0]
    await api.storeSet('followedData', _discFollowData)
  } catch(e) {
    box.innerHTML = '<p class="text-xs text-red-500">Failed to load papers</p>'
  }
}

// ── CONTACTS ──────────────────────────────────────────────────────────────────

function render_contacts() {
  const vc = document.getElementById('view-content')
  vc.innerHTML = `
  ${pageHeader('👥 Contacts', `<button onclick="openContactModal()" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">+ Add Contact</button>`)}
  <div class="bg-white border-b border-slate-200 px-6 py-3 flex-shrink-0">
    <input id="contacts-search" type="text" placeholder="Search by name, institution, field…"
      oninput="renderContacts()"
      class="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
  </div>
  <div class="flex-1 overflow-y-auto p-6">
    <div id="contacts-grid" class="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 max-w-5xl"></div>
  </div>`
  renderContacts()
}

function renderContacts() {
  const q    = document.getElementById('contacts-search')?.value.toLowerCase() || ''
  const grid = document.getElementById('contacts-grid')
  if (!grid) return
  let list = state.contacts
  if (q) list = list.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.institution?.toLowerCase().includes(q) ||
    c.researchAreas?.toLowerCase().includes(q)
  )
  if (!list.length) {
    grid.innerHTML = emptyState('🤝','No contacts yet','Discover researchers and save them here, or add manually')
    return
  }
  grid.innerHTML = list.map(c => `
  <div class="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer" onclick="openContactDetail('${c.id}')">
    <div class="flex items-center gap-3 mb-3">
      <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
        ${initials(c.name)}
      </div>
      <div class="min-w-0">
        <div class="font-semibold text-slate-900 text-sm truncate">${esc(c.name)}</div>
        ${c.institution ? `<div class="text-slate-400 text-xs truncate">${esc(c.institution)}</div>` : ''}
      </div>
    </div>
    ${c.role ? `<div class="text-xs text-slate-500 mb-1">${esc(c.role)}</div>` : ''}
    ${c.researchAreas ? `<div class="text-xs text-slate-400 mb-2 line-clamp-2">${esc(c.researchAreas)}</div>` : ''}
    <div class="flex gap-1.5 flex-wrap">
      ${c.hIndex    ? `<span class="text-xs bg-slate-100 text-slate-600 px-2 py-px rounded-full">h ${c.hIndex}</span>` : ''}
      ${c.email     ? `<span class="text-xs bg-green-100 text-green-700 px-2 py-px rounded-full">📧</span>` : ''}
      ${c.linkedIn  ? `<span class="text-xs bg-blue-100 text-blue-700 px-2 py-px rounded-full font-semibold">in</span>` : ''}
      ${c.orcid     ? `<span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-px rounded-full">ORCID</span>` : ''}
      ${c.interactionLog?.length ? `<span class="text-xs bg-slate-100 text-slate-500 px-2 py-px rounded-full">💬 ${c.interactionLog.length}</span>` : ''}
    </div>
  </div>`).join('')
}

function openContactDetail(id) {
  const c = state.contacts.find(x => x.id===id)
  if (!c) return
  const conf = c.emailConfidence || 0
  const bc   = conf>=70?'bg-green-100 text-green-700':conf>=40?'bg-amber-100 text-amber-700':conf>0?'bg-slate-100 text-slate-500':''
  const li   = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent((c.name||'')+' '+(c.institution||''))}`
  openModal(`
  <div class="flex items-center gap-4 mb-5">
    <div class="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl flex-shrink-0">
      ${initials(c.name)}
    </div>
    <div>
      <h3 class="font-bold text-slate-900 text-lg">${esc(c.name)}</h3>
      ${c.role ? `<p class="text-slate-500 text-sm">${esc(c.role)}${c.institution?' · '+esc(c.institution):''}</p>` : ''}
      ${c.department ? `<p class="text-slate-400 text-xs">${esc(c.department)}</p>` : ''}
    </div>
  </div>

  <div class="space-y-2 text-sm mb-5">
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-slate-400 w-28 flex-shrink-0">📧 Email</span>
      ${c.email
        ? `<button onclick="navigator.clipboard.writeText('${esc(c.email)}').then(()=>showToast('Copied ✓'))"
            class="font-mono text-slate-700 hover:text-indigo-600 hover:underline">${esc(c.email)}</button>
           ${conf>0 ? `<span class="text-xs px-2 py-px rounded-full ${bc}">${conf}% inferred</span>` : ''}`
        : '<span class="text-slate-400 italic text-sm">Not available</span>'}
    </div>
    <div class="flex items-center gap-2">
      <span class="text-slate-400 w-28 flex-shrink-0">💼 LinkedIn</span>
      ${c.linkedIn
        ? `<button onclick="api.openExternal('${esc(c.linkedIn)}')" class="text-blue-600 hover:underline text-sm">Open profile →</button>`
        : `<button onclick="api.openExternal('${li}')" class="text-blue-600 hover:underline text-sm">Search LinkedIn →</button>`}
    </div>
    ${c.institution ? `<div class="flex gap-2"><span class="text-slate-400 w-28">🏛️ Institution</span><span class="text-slate-700">${esc(c.institution)}</span></div>` : ''}
    ${c.phone       ? `<div class="flex gap-2"><span class="text-slate-400 w-28">📞 Phone</span><span>${esc(c.phone)}</span></div>` : ''}
    ${c.website     ? `<div class="flex gap-2"><span class="text-slate-400 w-28">🔗 Website</span><button onclick="api.openExternal('${esc(c.website)}')" class="text-indigo-500 hover:underline">Open →</button></div>` : ''}
    ${c.orcid       ? `<div class="flex gap-2"><span class="text-slate-400 w-28">ORCID</span><button onclick="api.openExternal('https://orcid.org/${esc(c.orcid)}')" class="text-indigo-500 hover:underline">${esc(c.orcid)}</button></div>` : ''}
    ${c.hIndex      ? `<div class="flex gap-2"><span class="text-slate-400 w-28">h-index</span><span>${c.hIndex}${c.paperCount?` · ${c.paperCount} papers`:''}</span></div>` : ''}
    ${c.s2Url       ? `<div class="flex gap-2"><span class="text-slate-400 w-28">📚 Publications</span><button onclick="api.openExternal('${esc(c.s2Url)}')" class="text-indigo-500 hover:underline">Semantic Scholar →</button></div>` : ''}
    ${c.researchAreas ? `<div class="flex gap-2"><span class="text-slate-400 w-28">Research</span><span class="text-slate-700">${esc(c.researchAreas)}</span></div>` : ''}
  </div>

  <div class="mb-4">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-semibold text-slate-700">💬 Interaction Log</span>
      <button onclick="addInteraction('${id}')" class="text-xs text-indigo-600 hover:underline">+ Log interaction</button>
    </div>
    <div id="interaction-log" class="space-y-1.5 max-h-32 overflow-y-auto">${_renderInteractions(c)}</div>
  </div>

  <div class="mb-4">
    <label class="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
    <textarea rows="2" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
      placeholder="Notes about this contact…"
      onchange="updateContactNotes('${id}',this.value)">${esc(c.notes||'')}</textarea>
  </div>

  <div class="flex gap-3 border-t border-slate-100 pt-4">
    <button onclick="openContactModal('${id}')" class="flex-1 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">✏️ Edit</button>
    <button onclick="deleteContact('${id}')" class="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors">Delete</button>
  </div>`, true)
}

function _renderInteractions(c) {
  if (!c.interactionLog?.length) return `<p class="text-xs text-slate-400 italic">No interactions logged yet</p>`
  return c.interactionLog.slice().reverse().slice(0,5).map(i => `
  <div class="flex items-start gap-2 text-xs py-1.5 border-b border-slate-50 last:border-0">
    <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex-shrink-0">${esc(i.type)}</span>
    <span class="text-slate-500 flex-shrink-0">${fmtDate(i.date)}</span>
    <span class="text-slate-700">${esc(i.notes)}</span>
  </div>`).join('')
}

function addInteraction(contactId) {
  openModal(`
  <h3 class="text-base font-bold mb-4">Log Interaction</h3>
  <div class="space-y-3">
    <div><label class="block text-xs font-medium text-slate-600 mb-1">Type</label>
      <select id="int-type" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
        ${['email','meeting','call','conference','collaboration','other'].map(t=>`<option>${t}</option>`).join('')}
      </select></div>
    <div><label class="block text-xs font-medium text-slate-600 mb-1">Date</label>
      <input id="int-date" type="date" value="${new Date().toISOString().split('T')[0]}"
        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/></div>
    <div><label class="block text-xs font-medium text-slate-600 mb-1">Notes</label>
      <textarea id="int-notes" rows="3" placeholder="What happened?"
        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"></textarea></div>
    <div class="flex gap-3 pt-2">
      <button onclick="closeModal()" class="flex-1 px-4 py-2 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
      <button onclick="saveInteraction('${contactId}')" class="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700">Log</button>
    </div>
  </div>`)
}

function saveInteraction(contactId) {
  const c = state.contacts.find(x => x.id===contactId)
  if (!c) return
  if (!c.interactionLog) c.interactionLog = []
  c.interactionLog.push({
    type:  document.getElementById('int-type').value,
    date:  document.getElementById('int-date').value,
    notes: document.getElementById('int-notes').value.trim()
  })
  save('contacts'); closeModal(); openContactDetail(contactId)
  showToast('Interaction logged ✓')
}

function updateContactNotes(id, notes) {
  const c = state.contacts.find(x => x.id===id)
  if (c) { c.notes = notes; save('contacts') }
}

function openContactModal(id) {
  const c = id ? state.contacts.find(x=>x.id===id) : null
  const v = (field) => esc(c?.[field] || '')
  openModal(`
  <h3 class="text-base font-bold mb-4">${c ? 'Edit Contact' : 'Add Contact'}</h3>
  <div class="grid grid-cols-2 gap-3">
    <div class="col-span-2"><label class="block text-xs font-medium text-slate-600 mb-1">Name *</label>
      <input id="cm-name" type="text" value="${v('name')}"
        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/></div>
    <div><label class="block text-xs font-medium text-slate-600 mb-1">Institution</label>
      <input id="cm-inst" type="text" value="${v('institution')}"
        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/></div>
    <div><label class="block text-xs font-medium text-slate-600 mb-1">Department</label>
      <input id="cm-dept" type="text" value="${v('department')}"
        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/></div>
    <div><label class="block text-xs font-medium text-slate-600 mb-1">Role</label>
      <input id="cm-role" type="text" value="${v('role')}" placeholder="Professor, PhD student…"
        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/></div>
    <div><label class="block text-xs font-medium text-slate-600 mb-1">Email</label>
      <input id="cm-email" type="email" value="${v('email')}"
        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/></div>
    <div><label class="block text-xs font-medium text-slate-600 mb-1">Phone</label>
      <input id="cm-phone" type="tel" value="${v('phone')}"
        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/></div>
    <div><label class="block text-xs font-medium text-slate-600 mb-1">LinkedIn URL</label>
      <input id="cm-linkedin" type="url" value="${v('linkedIn')}"
        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/></div>
    <div><label class="block text-xs font-medium text-slate-600 mb-1">Google Scholar URL</label>
      <input id="cm-scholar" type="url" value="${v('googleScholar')}"
        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/></div>
    <div class="col-span-2"><label class="block text-xs font-medium text-slate-600 mb-1">Website</label>
      <input id="cm-website" type="url" value="${v('website')}"
        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/></div>
    <div class="col-span-2"><label class="block text-xs font-medium text-slate-600 mb-1">Research Areas</label>
      <input id="cm-areas" type="text" value="${v('researchAreas')}" placeholder="machine learning, protein folding…"
        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/></div>
  </div>
  <div class="flex gap-3 pt-4">
    <button onclick="closeModal()" class="flex-1 px-4 py-2 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
    <button onclick="saveContact('${c?.id||''}')" class="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">Save</button>
  </div>`, true)
}

function saveContact(id) {
  const name = document.getElementById('cm-name').value.trim()
  if (!name) { showToast('Name required','error'); return }
  const existing = id ? state.contacts.find(c=>c.id===id) : null
  const data = {
    id: id||uid(), name,
    institution: document.getElementById('cm-inst').value.trim(),
    department:  document.getElementById('cm-dept').value.trim(),
    role:        document.getElementById('cm-role').value.trim(),
    email:       document.getElementById('cm-email').value.trim(),
    phone:       document.getElementById('cm-phone').value.trim(),
    linkedIn:    document.getElementById('cm-linkedin').value.trim(),
    googleScholar:document.getElementById('cm-scholar').value.trim(),
    website:     document.getElementById('cm-website').value.trim(),
    researchAreas:document.getElementById('cm-areas').value.trim(),
    emailConfidence: existing?.emailConfidence||0,
    emailSource:     existing?.emailSource||'manual',
    hIndex:    existing?.hIndex||0, paperCount:existing?.paperCount||0,
    orcid:     existing?.orcid||null, s2Id:existing?.s2Id||null,
    s2Url:     existing?.s2Url||null, oaUrl:existing?.oaUrl||null,
    interactionLog: existing?.interactionLog||[],
    notes:     existing?.notes||'',
    addedAt:   existing?.addedAt||new Date().toISOString()
  }
  if (id) { const i=state.contacts.findIndex(c=>c.id===id); if(i>-1)state.contacts[i]=data }
  else state.contacts.push(data)
  save('contacts'); closeModal(); renderContacts()
  showToast(id ? 'Contact updated ✓' : 'Contact added ✓')
}

function deleteContact(id) {
  if (!confirm('Remove this contact?')) return
  state.contacts = state.contacts.filter(c=>c.id!==id)
  save('contacts'); closeModal(); renderContacts()
  showToast('Contact removed')
}
