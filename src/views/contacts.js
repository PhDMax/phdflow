// ══ Contacts & Discover ═══════════════════════════════════════════════════════

// ── Discover state ────────────────────────────────────────────────────────────

let _discTab      = 'find'     // 'find' | 'following'
let _discFollowed = new Set()  // S2 IDs being followed
let _discFollowData = []       // [{id, name, institution, s2Id, s2Url, lastChecked, ...}]
let _discInited   = false
let _discMode        = 'name'  // 'name' | 'describe'
let _discAiQuery     = ''      // last natural-language query for context
let _discActiveOnly  = false   // filter: only show recently active researchers

// ── Akinator state ────────────────────────────────────────────────────────────
const _ak = {
  step:      'idle',  // idle | searching | asking | found | exhausted
  name:      '',
  all:       [],      // all candidates from initial search
  remaining: [],      // candidates still in play after answers
  history:   [],      // [{q, a}] — trail of answered questions
  question:  null,    // {text, options:[{label, fn}]}
}

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
        <button onclick="_discTab='find';render_discover()"
          class="px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors
            ${_discTab==='find' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}">
          🧞 Find a Researcher
        </button>
        <button onclick="_discTab='following';render_discover()"
          class="px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors
            ${_discTab==='following' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}">
          ⭐ Following ${followCount > 0 ? `<span class="ml-1 bg-indigo-100 text-indigo-700 px-1.5 py-px rounded-full">${followCount}</span>` : ''}
        </button>
      </div>

    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-3 lg:p-6">
      ${_discTab === 'find' ? _discAkinatorPanel() : _discFollowingPanel()}
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

async function doDescribeSearch() {
  const description = (document.getElementById('disc-describe')?.value || '').trim()
  if (!description) return
  _discAiQuery = description
  _discSetState('loading')

  // Step 1: Ask Odysseus to extract structured search terms
  const extractR = await _aiCall(
    `Extract search terms from this researcher description:\n"${description}"\n\nReturn ONLY valid JSON (no other text):\n{"name":"...", "institution":"...", "keywords":["...","..."]}\nIf no name is mentioned, set name to null.`,
    'You extract structured search terms from natural language descriptions. Return only valid JSON.'
  )

  let searchName = description
  let searchInst = ''
  let aiKeywords = []

  if (extractR.success) {
    try {
      const stripped = extractR.response.replace(/```(?:json)?\n?/g,'').replace(/```/g,'').trim()
      const start    = stripped.search(/[\[{]/)
      const parsed   = start >= 0 ? JSON.parse(stripped.slice(start)) : null
      if (parsed) {
        searchName = parsed.name || description
        searchInst = parsed.institution || ''
        aiKeywords = parsed.keywords || []
      }
    } catch {}
  }

  // Step 2: Search using extracted terms
  const result = await window.api.searchResearchers({
    query:       searchName || description,
    institution: searchInst,
    activeOnly:  _discActiveOnly,
  })

  if (!result.success || !result.results?.length) {
    _discSetState('error', 'No researchers found for that description. Try rephrasing.')
    return
  }

  state.searchResults = result.results

  // Step 3: Ask Odysseus to rank results against the original description
  const resultList = result.results.map((r, i) =>
    `${i}. ${r.name}${r.institution ? ' at ' + r.institution : ''}${(r.topics||[]).length ? ' — topics: ' + r.topics.slice(0,3).join(', ') : ''}`
  ).join('\n')

  const rankR = await _aiCall(
    `I'm looking for: "${description}"\n\nRank these researchers by how well they match (1-10):\n${resultList}\n\nReturn ONLY JSON array (no other text):\n[{"index":0,"score":9,"match":"brief match reason"}, ...]`,
    'You rank researcher search results by relevance. Return only valid JSON. Keep match reasons under 8 words.'
  )

  if (rankR.success) {
    try {
      const stripped = rankR.response.replace(/```(?:json)?\n?/g,'').replace(/```/g,'').trim()
      const start    = stripped.search(/[\[{]/)
      const scores   = start >= 0 ? JSON.parse(stripped.slice(start)) : null
      if (Array.isArray(scores)) {
        // Attach AI scores to results for display
        scores.forEach(s => {
          if (s.index != null && state.searchResults[s.index]) {
            state.searchResults[s.index]._aiScore = Math.round(Number(s.score)||0)
            state.searchResults[s.index]._aiMatch = s.match || ''
          }
        })
        // Sort by AI score
        state.searchResults.sort((a,b) => (b._aiScore||0) - (a._aiScore||0))
      }
    } catch {}
  }

  _discSetState('results')
  const container = document.getElementById('disc-results')
  if (container) container.innerHTML = _buildResultCards(state.searchResults)
}

async function doResearcherSearch() {
  const query = (document.getElementById('disc-query')?.value || '').trim()
  const inst  = (document.getElementById('disc-inst')?.value  || '').trim()
  if (!query) return
  _discSetState('loading')
  const result = await window.api.searchResearchers({
    query,
    institution: inst,
    activeOnly:  _discActiveOnly,
  })
  if (!result.success) { _discSetState('error', result.error); return }
  state.searchResults = result.results || []
  if (!state.searchResults.length) {
    _discSetState('error', inst
      ? `No researchers named "${query}" found at "${inst}". Try a broader institution name.`
      : 'No researchers found. Try a different name.')
    return
  }
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
          <div class="flex items-center gap-1.5 flex-wrap">
          <p class="font-bold text-slate-900">${esc(r.name)}</p>
          ${r.isActive === true  ? `<span class="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-px rounded-full font-medium">● Active</span>` : ''}
          ${r.isActive === false ? `<span class="text-xs bg-slate-100 text-slate-400 px-1.5 py-px rounded-full">inactive?</span>` : ''}
          ${r._aiScore ? `<span class="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">✨ ${r._aiScore}/10${r._aiMatch ? ' · ' + esc(r._aiMatch) : ''}</span>` : ''}
        </div>
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

        <!-- Email — only show if sourced directly from ORCID/profile, never from inference -->
        <div class="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
          <span class="text-slate-400 text-sm flex-shrink-0">📧</span>
          ${r.email && r.emailSource !== 'inferred'
            ? `<button onclick="navigator.clipboard.writeText('${esc(r.email)}').then(()=>showToast('Copied ✓'))"
                class="font-mono text-xs text-slate-700 hover:text-indigo-600 truncate block w-full text-left">
                ${esc(r.email)}
               </button>`
            : `<span class="text-xs text-slate-400 italic">Search LinkedIn or Google Scholar for contact details</span>`}
        </div>

        <!-- LinkedIn -->
        <button onclick="api.openExternal('${liSearch}')"
          class="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-2 transition-colors text-left">
          <span class="text-blue-600 text-sm flex-shrink-0">in</span>
          <span class="text-xs text-blue-700 font-medium">Search on LinkedIn →</span>
        </button>

      </div>

      <!-- Stats -->
      <div class="flex flex-wrap items-center gap-2 mb-3">
        ${r.hIndex       ? `<span class="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">h-index <strong>${r.hIndex}</strong></span>` : ''}
        ${r.i10Index     ? `<span class="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">i10 <strong>${r.i10Index}</strong></span>` : ''}
        ${r.paperCount   ? `<span class="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full"><strong>${r.paperCount.toLocaleString()}</strong> papers</span>` : ''}
        ${r.citationCount? `<span class="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">${r.citationCount.toLocaleString()} citations</span>` : ''}
        ${r.orcid        ? `<span class="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">ORCID ✓</span>` : ''}
      </div>

      <!-- Research topics -->
      ${(r.topics||[]).length ? `
      <div class="flex flex-wrap gap-1.5 mb-3">
        ${(r.topics||[]).slice(0,6).map(t=>`<span class="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">${esc(t)}</span>`).join('')}
      </div>` : ''}

      <!-- Recent papers (pre-loaded from S2) -->
      ${(r.recentPapers||[]).length ? `
      <div class="mb-3 border-t border-slate-50 pt-3">
        <div class="text-xs font-semibold text-slate-500 mb-1.5">Top cited papers</div>
        <div class="space-y-1">
          ${(r.recentPapers||[]).slice(0,4).map(p=>`
          <div class="text-xs flex items-start gap-1.5">
            <span class="text-slate-300 flex-shrink-0 mt-0.5">▸</span>
            <div class="min-w-0">
              ${p.doi
                ? `<button onclick="api.openExternal('https://doi.org/${esc(p.doi)}')" class="text-slate-700 hover:text-indigo-600 hover:underline text-left leading-snug line-clamp-1">${esc(p.title)}</button>`
                : `<span class="text-slate-700 leading-snug line-clamp-1">${esc(p.title)}</span>`}
              <span class="text-slate-400">${p.year||''}${p.citations?` · ${p.citations.toLocaleString()} citations`:''}</span>
            </div>
          </div>`).join('')}
        </div>
      </div>` : ''}

      <!-- ORCID-enriched position / bio -->
      ${r.position || r.department ? `
      <div class="text-xs text-slate-600 mb-2">
        ${r.position ? `<span class="font-medium">${esc(r.position)}</span>` : ''}
        ${r.department ? `<span class="text-slate-400">${r.position?' · ':''}${esc(r.department)}</span>` : ''}
      </div>` : ''}
      ${r.bio ? `<p class="text-xs text-slate-500 italic mb-2 line-clamp-2">${esc(r.bio)}</p>` : ''}

      <!-- Profile links + source badges -->
      <div class="flex flex-wrap gap-3 text-xs border-t border-slate-100 pt-3">
        ${r.s2Url     ? `<button onclick="api.openExternal('${esc(r.s2Url)}')"    class="text-indigo-500 hover:underline">📚 Semantic Scholar</button>` : ''}
        <button onclick="api.openExternal('${gSearch}')" class="text-indigo-500 hover:underline">🎓 Google Scholar</button>
        ${r.oaUrl     ? `<button onclick="api.openExternal('${esc(r.oaUrl)}')"    class="text-indigo-500 hover:underline">OpenAlex</button>` : ''}
        ${r.orcid     ? `<button onclick="api.openExternal('https://orcid.org/${esc(r.orcid)}')" class="text-indigo-500 hover:underline">ORCID ✓</button>` : ''}
        ${r.dblpUrl   ? `<button onclick="api.openExternal('${esc(r.dblpUrl)}')"  class="text-indigo-500 hover:underline">DBLP</button>` : ''}
        ${r.pubmedCount>0 ? `<button onclick="api.openExternal('https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(r.name)}[AUTH]')" class="text-indigo-500 hover:underline">PubMed (${r.pubmedCount})</button>` : ''}
        ${r.homepage  ? `<button onclick="api.openExternal('${esc(r.homepage)}')" class="text-indigo-500 hover:underline">🔗 Homepage</button>` : ''}
      </div>
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

// discRecentPapers removed — papers now pre-loaded in main.js search-researchers handler

// ══ Akinator — step-by-step researcher finder ═════════════════════════════════

function _discAkinatorPanel() {
  if (_ak.step === 'idle') return `
  <div class="max-w-xl mx-auto py-8">
    <div class="text-center mb-8">
      <div class="text-5xl mb-3">🧞</div>
      <h2 class="text-xl font-bold text-slate-900 mb-2">Researcher Finder</h2>
      <p class="text-sm text-slate-500 leading-relaxed">
        Think of a researcher. I'll ask a few questions to find them — starting from their name.
      </p>
    </div>
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <label class="block text-sm font-semibold text-slate-700 mb-2">What's their name?</label>
      <div class="flex gap-2">
        <input id="ak-name" type="text" placeholder="e.g. Jennifer Doudna"
          class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onkeydown="if(event.key==='Enter')akinatorStart()"/>
        <button onclick="akinatorStart()"
          class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
          Start →
        </button>
      </div>
      <p class="text-xs text-slate-400 mt-2">Don't know the exact name? Type a partial name or just their institution and field — I'll narrow it down from there.</p>
    </div>
  </div>`

  if (_ak.step === 'searching') return `
  <div class="max-w-xl mx-auto py-16 text-center">
    <div class="text-4xl mb-4">🧞</div>
    <div class="flex items-center justify-center gap-2 text-slate-500">
      <div class="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
      <span class="text-sm">Searching for "${esc(_ak.name)}"…</span>
    </div>
  </div>`

  // History trail
  const trail = _ak.history.length ? `
  <div class="flex flex-wrap gap-1.5 mb-5">
    ${_ak.history.map(h => `
    <span class="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
      ${esc(h.q)}: <strong>${esc(h.a)}</strong>
    </span>`).join('')}
  </div>` : ''

  if (_ak.step === 'found') {
    const r = _ak.remaining[0]
    if (!r) return ''
    // Auto-save confirmed profile to cache, including rejected candidates for future penalisation
    if (!_ak.fromCache) {
      const normName   = _ak.name.toLowerCase().replace(/[^a-z\s]/g,'').trim().split(/\s+/).sort().join(' ')
      const rejectedIds = _ak.all.filter(c => c.id !== r.id).map(c => c.id)
      api.researcherCacheSet({ normalizedName: normName, profile: r, questionsUsed: _ak.history, rejectedIds }).catch(() => {})
    }
    const cacheNote = _ak.fromCache
      ? `<span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">⚡ Instant — previously found</span>`
      : `<span class="text-xs text-slate-400">from ${_ak.all.length} candidates → ${_ak.history.length} question${_ak.history.length!==1?'s':''}</span>`
    return `
    <div class="max-w-xl mx-auto">
      <div class="flex items-center gap-2 mb-4">
        <div class="text-2xl">🧞</div>
        <div class="flex-1 flex items-center gap-2 flex-wrap">
          <p class="font-bold text-slate-900">Found them!</p>
          ${cacheNote}
        </div>
        <div class="flex gap-2 flex-shrink-0">
          ${_ak.fromCache ? `<button onclick="akinatorForceRefresh()" class="text-xs text-slate-400 hover:text-indigo-600 hover:underline">🔄 Refresh</button>` : ''}
          <button onclick="akinatorReset()" class="text-xs text-slate-400 hover:text-slate-600 hover:underline">Start over</button>
        </div>
      </div>
      ${trail}
      ${_buildResultCards([r])}
      ${_ak.fromCache ? '' : `<p class="text-xs text-slate-400 text-center mt-3">Profile saved — next search will be instant. <button onclick="akinatorWrongPerson()" class="text-indigo-500 hover:underline">Not the right person?</button></p>`}
    </div>`
  }

  if (_ak.step === 'exhausted') return `
  <div class="max-w-xl mx-auto">
    <div class="flex items-center gap-2 mb-4">
      <div class="text-2xl">🧞</div>
      <div>
        <p class="font-bold text-slate-900">I'm not sure — are any of these them?</p>
        <p class="text-xs text-slate-400">${_ak.remaining.length} candidate${_ak.remaining.length!==1?'s':''} remain after ${_ak.history.length} question${_ak.history.length!==1?'s':''}</p>
      </div>
      <button onclick="akinatorReset()" class="ml-auto text-xs text-slate-400 hover:text-slate-600 hover:underline">Start over</button>
    </div>
    ${trail}
    ${_buildResultCards(_ak.remaining.slice(0,5))}
  </div>`

  // step === 'asking'
  const q = _ak.question
  return `
  <div class="max-w-xl mx-auto">
    <div class="flex items-center gap-2 mb-5">
      <div class="text-2xl">🧞</div>
      <div>
        <p class="text-xs text-slate-500">Thinking of <strong>${esc(_ak.name)}</strong> · ${_ak.remaining.length} candidate${_ak.remaining.length!==1?'s':''} · question ${_ak.history.length+1}</p>
      </div>
      <button onclick="akinatorReset()" class="ml-auto text-xs text-slate-400 hover:text-slate-600 hover:underline">Start over</button>
    </div>
    ${trail}

    <div class="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6">
      <p class="text-base font-semibold text-slate-900 mb-5">${esc(q.text)}</p>
      <div class="grid gap-2 ${q.options.length <= 2 ? 'grid-cols-2' : 'grid-cols-1'}">
        ${q.options.map((o, i) => `
        <button onclick="akinatorAnswer(${i})"
          class="w-full text-left px-4 py-3 rounded-xl border-2 border-slate-200
            hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-800
            text-sm font-medium text-slate-700 transition-all">
          ${esc(o.label)}
        </button>`).join('')}
      </div>
      <button onclick="akinatorSkip()" class="mt-3 text-xs text-slate-400 hover:text-slate-600 hover:underline w-full text-center">
        Not sure / skip this question
      </button>
    </div>
  </div>`
}

// ── Akinator actions ──────────────────────────────────────────────────────────

async function akinatorStart() {
  const name = (document.getElementById('ak-name')?.value || '').trim()
  if (!name) return
  _ak.name      = name
  _ak.step      = 'searching'
  _ak.history   = []
  _ak.question  = null
  render_discover()

  // Check local cache first — confirmed profiles load instantly
  const normName   = name.toLowerCase().replace(/[^a-z\s]/g,'').trim().split(/\s+/).sort().join(' ')
  const cached     = await api.researcherCacheGet(normName)
  if (cached?.profile) {
    _ak.all         = [cached.profile]
    _ak.remaining   = [cached.profile]
    _ak.step        = 'found'
    _ak.fromCache   = true
    _ak.cacheEntry  = cached   // keep for learning data
    render_discover()
    return
  }
  _ak.fromCache  = false
  _ak.cacheEntry = null

  const result = await window.api.searchResearchers({ query: name, institution: '', activeOnly: false })

  if (!result.success || !result.results?.length) {
    _ak.step = 'exhausted'
    _ak.remaining = []
    _ak.all = []
    render_discover()
    return
  }

  // Load past session data for this name — used for learning
  const entry = await api.researcherCacheGet(normName).catch(() => null)
  _ak.cacheEntry = entry

  let candidates = result.results
  // Demote previously-rejected candidates (move to end, not remove — they might be right today)
  if (entry?.rejectedIds?.length) {
    const rejSet    = new Set(entry.rejectedIds)
    const confirmed = candidates.filter(c => !rejSet.has(c.id))
    const rejected  = candidates.filter(c =>  rejSet.has(c.id))
    candidates = [...confirmed, ...rejected]
  }

  _ak.all       = candidates
  _ak.remaining = [...candidates]

  if (_ak.remaining.length === 1) {
    _ak.step = 'found'
    render_discover()
    return
  }

  await _akinatorNextStep()
}

async function akinatorAnswer(optionIndex) {
  const opt = _ak.question?.options?.[optionIndex]
  if (!opt) return

  _ak.history.push({ q: _ak.question.shortText || _ak.question.text, a: opt.label })
  _ak.remaining = opt.fn(_ak.remaining)

  if (_ak.remaining.length === 0) {
    // Filtered too aggressively — restore to last known good set and exhaust
    _ak.remaining = _ak.all.slice(0, 5)
    _ak.step = 'exhausted'
    render_discover()
    return
  }
  if (_ak.remaining.length === 1) {
    _ak.step = 'found'
    render_discover()
    return
  }

  await _akinatorNextStep()
}

function akinatorSkip() {
  // Don't filter, just try next question
  _ak.history.push({ q: _ak.question.shortText || _ak.question.text, a: 'Skipped' })
  _akinatorNextStep()
}

function akinatorReset() {
  _ak.step = 'idle'
  _ak.name = ''
  _ak.all = _ak.remaining = _ak.history = []
  _ak.question = null
  _ak.fromCache = false
  render_discover()
}

async function akinatorWrongPerson() {
  // Remove this cached result and restart the question flow with the full candidate list
  const normName = _ak.name.toLowerCase().replace(/[^a-z\s]/g,'').trim().split(/\s+/).sort().join(' ')
  // Bust cache by setting savedAt far in the past
  const entry = await api.researcherCacheGet(normName)
  if (entry) api.researcherCacheSet({ normalizedName: normName, profile: {...entry.profile, _invalid: true}, questionsUsed: [] })
  _ak.remaining = [..._ak.all]
  _ak.history   = []
  _ak.fromCache = false
  await _akinatorNextStep()
}

async function akinatorForceRefresh() {
  // Re-run the full search ignoring cache
  _ak.fromCache = false
  _ak.step      = 'searching'
  render_discover()
  const result = await window.api.searchResearchers({ query: _ak.name, institution: '', activeOnly: false })
  if (!result.success || !result.results?.length) { _ak.step = 'exhausted'; _ak.remaining = []; render_discover(); return }
  _ak.all = _ak.remaining = result.results
  if (_ak.remaining.length === 1) { _ak.step = 'found'; render_discover(); return }
  await _akinatorNextStep()
}

async function _akinatorNextStep() {
  // Try Odysseus for smarter questions when available
  if (_aiAvailable() && _ak.remaining.length <= 8) {
    const odysseusQ = await _akinatorOdysseyQuestion(_ak.remaining)
    if (odysseusQ) {
      _ak.question = odysseusQ
      _ak.step     = 'asking'
      render_discover()
      return
    }
  }
  // Fallback: rule-based, informed by past question history
  const pastTypes = (_ak.cacheEntry?.questionHistory || [])
    .flatMap(h => h.questionsUsed || [])
    .map(q => q.q)  // the short label of each question used
  const q = _akinatorRuleQuestion(_ak.remaining, pastTypes)
  if (!q) {
    _ak.step = 'exhausted'
    render_discover()
    return
  }
  _ak.question = q
  _ak.step     = 'asking'
  render_discover()
}

// ── Odysseus-powered question generation ──────────────────────────────────────

async function _akinatorOdysseyQuestion(candidates) {
  const list = candidates.map((c,i) =>
    `${i+1}. ${c.name}${c.institution?' at '+c.institution:''}${(c.topics||[]).length?' — '+c.topics.slice(0,3).join(', '):''} (h-index: ${c.hIndex||0})`
  ).join('\n')

  const r = await _aiCall(
    `I'm trying to identify a specific researcher from this list:\n${list}\n\nAsk the single most discriminating yes/no or multiple-choice question to narrow it down. The question should be answerable by anyone who knows this researcher.\n\nReturn ONLY JSON:\n{"question":"full question text","short":"3-5 word label","options":["option1","option2"...],"split":[[0,2],[1,3]]}
\nwhere split is an array of arrays of candidate indices (0-based) for each option.`,
    'You are helping identify a researcher with yes/no questions like the game Akinator. Return only valid JSON.'
  )

  if (!r.success) return null
  try {
    const txt  = r.response.replace(/```(?:json)?\n?/g,'').replace(/```/g,'').trim()
    const data = JSON.parse(txt.slice(txt.search(/[{[]/)))
    if (!data.question || !Array.isArray(data.options) || !Array.isArray(data.split)) return null

    return {
      text:      data.question,
      shortText: data.short || data.question.slice(0, 40),
      options:   data.options.map((label, i) => ({
        label,
        fn: (cs) => {
          const idxSet = new Set(data.split[i] || [])
          // Map split indices back to the current candidates list by position
          return cs.filter((_, pos) => idxSet.has(pos))
        },
      })),
    }
  } catch { return null }
}

// ── Rule-based question generation (no Odysseus) ──────────────────────────────

function _akinatorRuleQuestion(candidates, pastTypes = []) {
  // Build a type → success count from past sessions to reorder questions
  // A type that has appeared many times in successful sessions is asked first
  const typeScore = {}
  pastTypes.forEach(t => { typeScore[t] = (typeScore[t]||0) + 1 })
  // We'll try question types in this dynamic order:
  // base order + boost for types that historically worked for this name
  const tryOrder = ['topic', 'region', 'prominence', 'institution', 'activity']
    .sort((a, b) => (typeScore[b]||0) - (typeScore[a]||0))

  for (const type of tryOrder) {
    const q = _akinatorTryType(type, candidates)
    if (q) return q
  }
  return null
}

function _akinatorTryType(type, candidates) {
  switch (type) {

    case 'topic': {
      const topicFreq = {}
      candidates.forEach(c => (c.topics||[]).forEach(t => { topicFreq[t] = (topicFreq[t]||0) + 1 }))
      const half = candidates.length / 2
      const best = Object.entries(topicFreq)
        .filter(([,n]) => n >= 1 && n < candidates.length)
        .sort((a,b) => Math.abs(a[1]-half) - Math.abs(b[1]-half))
      if (!best.length) return null
      const topic      = best[0][0]
      const inTopic    = candidates.filter(c => (c.topics||[]).includes(topic))
      const notInTopic = candidates.filter(c => !(c.topics||[]).includes(topic))
      if (!inTopic.length || !notInTopic.length) return null
      return {
        text:      `Does their research involve "${topic}"?`,
        shortText: `Topic: ${topic}`,
        options: [
          { label: `✓ Yes — ${topic}`, fn: () => inTopic    },
          { label: '✗ No',             fn: () => notInTopic },
        ],
      }
    }

    case 'region': {
      const regionMap = {}
      candidates.forEach(c => {
        const reg = _discRegionOf(c.affiliations)
        if (reg) regionMap[reg] = [...(regionMap[reg]||[]), c]
      })
      const regions = Object.keys(regionMap).filter(r => regionMap[r].length < candidates.length)
      if (regions.length < 2) return null
      return {
        text:      'Which region are they based in?',
        shortText: 'Region',
        options: regions.slice(0,4).map(r => ({ label: r, fn: () => regionMap[r] || [] })).concat(
          regions.length > 4 ? [{ label: 'Somewhere else', fn: () => candidates.filter(c => !regions.slice(0,4).includes(_discRegionOf(c.affiliations))) }] : []
        ),
      }
    }

    case 'prominence': {
      const maxH = Math.max(...candidates.map(c => c.hIndex||0))
      const minH = Math.min(...candidates.map(c => c.hIndex||0))
      if (maxH - minH <= 15) return null
      const mid    = Math.round((maxH + minH) / 2)
      const senior = candidates.filter(c => (c.hIndex||0) >= mid)
      const junior = candidates.filter(c => (c.hIndex||0) <  mid)
      if (!senior.length || !junior.length) return null
      return {
        text:      'Are they a senior / well-established researcher?',
        shortText: 'Seniority',
        options: [
          { label: 'Yes, senior & well-cited', fn: () => senior },
          { label: 'No, earlier career stage',  fn: () => junior },
        ],
      }
    }

    case 'institution': {
      const instGroups = {}
      candidates.forEach(c => {
        if (c.institution) instGroups[c.institution] = [...(instGroups[c.institution]||[]), c]
      })
      const insts = Object.keys(instGroups).filter(i => instGroups[i].length < candidates.length)
      if (insts.length < 2) return null
      return {
        text:      'Which institution are they at?',
        shortText: 'Institution',
        options: insts.slice(0,4).map(inst => ({ label: inst, fn: () => instGroups[inst] })),
      }
    }

    case 'activity': {
      const active   = candidates.filter(c => c.isActive === true)
      const inactive = candidates.filter(c => c.isActive === false)
      if (!active.length || !inactive.length) return null
      return {
        text:      'Have they published recently (last few years)?',
        shortText: 'Active?',
        options: [
          { label: 'Yes, still active',       fn: () => active   },
          { label: 'Not sure / older career', fn: () => inactive },
        ],
      }
    }

    default: return null
  }
}

// Map affiliation strings to a broad region label
function _discRegionOf(affiliations) {
  const s = (affiliations||[]).join(' ').toLowerCase()
  if (/harvard|mit\b|stanford|berkeley|caltech|columbia|yale|princeton|cornell|nyu|ucla|uc\s|johns hopkins|carnegie mellon|chicago|michigan|wisconsin|texas|duke|vanderbilt|rice|tufts|brown|dartmouth|university of.*usa|american university/.test(s)) return 'USA'
  if (/oxford|cambridge|imperial college|ucl|king's college|manchester|edinburgh|bristol|warwick|birmingham|durham|nottingham/.test(s)) return 'UK'
  if (/max planck|helmholtz|eth zürich|eth zurich|epfl|heidelberg|humboldt|tu berlin|tu münchen|rwth|lmu munich|charité|bonn|freiburg|göttingen|tübingen/.test(s)) return 'Germany / DACH'
  if (/paris|sorbonne|école normale|inria|inserm|cnrs|pasteur|montpellier|lyon|strasbourg/.test(s)) return 'France'
  if (/tu delft|amsterdam|leiden|utrecht|erasmus|radboud|groningen|eindhoven/.test(s)) return 'Netherlands'
  if (/karolinska|stockholm|umeå|chalmers|linköping|oslo|bergen|aarhus|copenhagen|helsinki|aalto/.test(s)) return 'Scandinavia'
  if (/toronto|mcgill|ubc|waterloo|alberta|montreal|queens|dalhousie/.test(s)) return 'Canada'
  if (/melbourne|sydney|queensland|monash|anu|adelaide|unsw/.test(s)) return 'Australia'
  if (/tokyo|kyoto|osaka|tohoku|nagoya|riken|waseda|keio/.test(s)) return 'Japan'
  if (/tsinghua|peking|fudan|shanghai jiao tong|zhejiang|chinese academy/.test(s)) return 'China'
  if (/nus|nanyang|ntu\b|singapore/.test(s)) return 'Singapore'
  if (/weizmann|technion|hebrew university|tel aviv|bar-ilan/.test(s)) return 'Israel'
  if (/iit\b|iim\b|delhi|mumbai|bangalore|hyderabad|indian/.test(s)) return 'India'
  return null
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

const _RELATIONSHIP_TYPES = [
  '', 'Supervisor', 'PhD Colleague', 'Postdoc Colleague', 'Co-author',
  'Collaborator', 'Reviewer', 'Mentor', 'Conference Contact',
  'Industry Contact', 'Friend', 'Other'
]

function _lastContactedDate(c) {
  if (!c.interactionLog?.length) return null
  return c.interactionLog.map(i => i.date).filter(Boolean).sort().pop() || null
}

function _lastContactedStr(c) {
  const last = _lastContactedDate(c)
  if (!last) return null
  const days = Math.round((new Date() - new Date(last)) / 864e5)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30)  return `${days}d ago`
  if (days < 365) return `${Math.round(days/30)}mo ago`
  return `${Math.round(days/365)}yr ago`
}

function render_contacts() {
  const vc = document.getElementById('view-content')
  vc.innerHTML = `
  ${pageHeader('👥 Contacts', `
    <div class="flex gap-2">
      <button onclick="openLinkedInImport()" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5">
        <span class="font-bold">in</span> Import LinkedIn
      </button>
      <button onclick="openContactModal()" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">+ Add Contact</button>
    </div>`)}
  <div class="bg-white border-b border-slate-200 px-6 py-3 flex-shrink-0">
    <input id="contacts-search" type="text" placeholder="Search by name, institution, field…"
      oninput="renderContacts()"
      class="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
  </div>
  <div class="flex-1 overflow-y-auto p-3 lg:p-6">
    <div id="contacts-grid" class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-5xl"></div>
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
    c.researchAreas?.toLowerCase().includes(q) ||
    c.relationship?.toLowerCase().includes(q)
  )
  if (!list.length) {
    grid.innerHTML = emptyState('🤝','No contacts yet','Discover researchers and save them here, or add manually')
    return
  }
  grid.innerHTML = list.map(c => {
    const lastStr = _lastContactedStr(c)
    const lastDays = _lastContactedDate(c)
      ? Math.round((new Date() - new Date(_lastContactedDate(c))) / 864e5) : null
    const staleContact = lastDays !== null && lastDays > 90
    return `
  <div class="bg-white border ${staleContact?'border-amber-200':'border-slate-200'} rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer" onclick="openContactDetail('${c.id}')">
    <div class="flex items-center gap-3 mb-3">
      <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
        ${initials(c.name)}
      </div>
      <div class="min-w-0">
        <div class="font-semibold text-slate-900 text-sm truncate">${esc(c.name)}</div>
        ${c.institution ? `<div class="text-slate-400 text-xs truncate">${esc(c.institution)}</div>` : ''}
      </div>
    </div>
    ${c.relationship ? `<div class="mb-1"><span class="text-xs px-2 py-px rounded-full bg-indigo-50 text-indigo-600 font-medium">${esc(c.relationship)}</span></div>` : ''}
    ${c.role && c.role !== c.relationship ? `<div class="text-xs text-slate-500 mb-1">${esc(c.role)}</div>` : ''}
    ${c.researchAreas ? `<div class="text-xs text-slate-400 mb-2 line-clamp-2">${esc(c.researchAreas)}</div>` : ''}
    <div class="flex gap-1.5 flex-wrap items-center">
      ${c.hIndex    ? `<span class="text-xs bg-slate-100 text-slate-600 px-2 py-px rounded-full">h ${c.hIndex}</span>` : ''}
      ${c.email     ? `<span class="text-xs bg-green-100 text-green-700 px-2 py-px rounded-full">📧</span>` : ''}
      ${c.linkedIn  ? `<span class="text-xs bg-blue-100 text-blue-700 px-2 py-px rounded-full font-semibold">in</span>` : ''}
      ${c.orcid     ? `<span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-px rounded-full">ORCID</span>` : ''}
      ${lastStr ? `<span class="text-xs ${staleContact?'text-amber-600 font-medium':'text-slate-400'} ml-auto">${staleContact?'⚠ ':''}${lastStr}</span>` : ''}
    </div>
  </div>`}).join('')
}

function openContactDetail(id) {
  const c = state.contacts.find(x => x.id===id)
  if (!c) return
  const conf = c.emailConfidence || 0
  const bc   = conf>=70?'bg-green-100 text-green-700':conf>=40?'bg-amber-100 text-amber-700':conf>0?'bg-slate-100 text-slate-500':''
  const li   = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent((c.name||'')+' '+(c.institution||''))}`
  const lastStr  = _lastContactedStr(c)
  const lastDays = _lastContactedDate(c)
    ? Math.round((new Date() - new Date(_lastContactedDate(c))) / 864e5) : null
  openModal(`
  <div class="flex items-center gap-4 mb-5">
    <div class="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl flex-shrink-0">
      ${initials(c.name)}
    </div>
    <div>
      <h3 class="font-bold text-slate-900 text-lg">${esc(c.name)}</h3>
      ${c.role ? `<p class="text-slate-500 text-sm">${esc(c.role)}${c.institution?' · '+esc(c.institution):''}</p>` : ''}
      ${c.department ? `<p class="text-slate-400 text-xs">${esc(c.department)}</p>` : ''}
      <div class="flex gap-2 flex-wrap mt-1">
        ${c.relationship ? `<span class="text-xs px-2 py-px rounded-full bg-indigo-50 text-indigo-600 font-medium">${esc(c.relationship)}</span>` : ''}
        ${lastStr ? `<span class="text-xs px-2 py-px rounded-full ${lastDays>90?'bg-amber-50 text-amber-600':'bg-slate-100 text-slate-500'}">Last: ${lastStr}</span>` : ''}
      </div>
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
    <div><label class="block text-xs font-medium text-slate-600 mb-1">Role / Title</label>
      <input id="cm-role" type="text" value="${v('role')}" placeholder="Professor, PhD student…"
        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/></div>
    <div><label class="block text-xs font-medium text-slate-600 mb-1">Relationship to you</label>
      <select id="cm-relationship" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
        ${_RELATIONSHIP_TYPES.map(r=>`<option value="${r}" ${(c?.relationship||''===r)?'selected':''}>${r||'— select —'}</option>`).join('')}
      </select></div>
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
    role:         document.getElementById('cm-role').value.trim(),
    relationship: document.getElementById('cm-relationship')?.value || '',
    email:        document.getElementById('cm-email').value.trim(),
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

async function deleteContact(id) {
  const snap = [...state.contacts]
  const name = state.contacts.find(c=>c.id===id)?.name || 'Contact'
  state.contacts = state.contacts.filter(c=>c.id!==id)
  save('contacts'); closeModal(); renderContacts()
  showUndoToast(`"${name}" removed`, () => {
    state.contacts = snap
    save('contacts'); renderContacts(); showToast('Contact restored ✓')
  })
}

// ── LinkedIn CSV import ────────────────────────────────────────────────────────
function openLinkedInImport() {
  openModal(`
  <h3 class="text-base font-bold mb-1">Import LinkedIn Connections</h3>
  <p class="text-xs text-slate-500 mb-4">LinkedIn lets you export your connections as a CSV — no API key or login needed inside PhDFlow.</p>

  <div class="bg-slate-50 rounded-xl p-4 mb-4">
    <p class="text-xs font-semibold text-slate-700 mb-2">How to export from LinkedIn:</p>
    <ol class="text-xs text-slate-600 space-y-1.5 list-decimal pl-4 leading-relaxed">
      <li>Open <button onclick="window.api.openExternal('https://www.linkedin.com/mypreferences/d/categories/data')" class="text-blue-600 hover:underline">LinkedIn → Settings → Data privacy</button></li>
      <li>Click <strong>Get a copy of your data</strong></li>
      <li>Tick <strong>Connections</strong> only, then click <strong>Request archive</strong></li>
      <li>LinkedIn emails you a download link — usually arrives within minutes</li>
      <li>Unzip the archive and select <strong>Connections.csv</strong> below</li>
    </ol>
  </div>

  <div class="mb-4">
    <label class="block text-xs font-semibold text-slate-700 mb-2">Select Connections.csv</label>
    <input type="file" id="li-csv-file" accept=".csv"
      onchange="previewLinkedInCSV(this)"
      class="block w-full text-sm text-slate-600
        file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0
        file:bg-blue-600 file:text-white file:text-xs file:font-semibold
        hover:file:bg-blue-700 cursor-pointer"/>
  </div>

  <div id="li-preview" class="hidden mb-3"></div>

  <div class="flex gap-3" id="li-import-actions">
    <button onclick="closeModal()" class="flex-1 btn-secondary">Cancel</button>
  </div>`)
}

function _parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  return lines.map(line => {
    const fields = []
    let field = '', inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i+1] === '"') { field += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        fields.push(field.trim()); field = ''
      } else {
        field += ch
      }
    }
    fields.push(field.trim())
    return fields
  }).filter(row => row.some(f => f))
}

function previewLinkedInCSV(input) {
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = e => {
    const rows = _parseCSV(e.target.result)
    if (!rows.length) { showToast('Could not read CSV','error'); return }

    const header = rows[0].map(h => h.toLowerCase().replace(/[\s_-]/g,''))
    const col = key => header.findIndex(h => h.includes(key))
    const idx = {
      firstName:  col('firstname'),
      lastName:   col('lastname'),
      url:        header.findIndex(h => h === 'url' || h.includes('linkedin')),
      email:      col('email'),
      company:    header.findIndex(h => h.includes('company') || h.includes('organization')),
      position:   header.findIndex(h => h.includes('position') || h.includes('title') || h.includes('role')),
    }

    if (idx.firstName === -1 && idx.lastName === -1) {
      document.getElementById('li-preview').innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 mb-2">
          ⚠ This doesn't look like a LinkedIn connections CSV. Expected columns: First Name, Last Name, URL…
        </div>`
      document.getElementById('li-preview').classList.remove('hidden')
      return
    }

    const parsed = rows.slice(1).filter(r => r.length > 1).map(r => ({
      name:        [idx.firstName>=0?r[idx.firstName]:'', idx.lastName>=0?r[idx.lastName]:''].filter(Boolean).join(' ').trim(),
      linkedIn:    idx.url      >= 0 ? r[idx.url]      : '',
      email:       idx.email    >= 0 ? r[idx.email]    : '',
      institution: idx.company  >= 0 ? r[idx.company]  : '',
      role:        idx.position >= 0 ? r[idx.position] : '',
    })).filter(c => c.name)

    const existingNames = new Set(state.contacts.map(c => c.name.toLowerCase()))
    const newOnes = parsed.filter(c => !existingNames.has(c.name.toLowerCase()))
    const dupes   = parsed.length - newOnes.length

    window._liImportQueue = newOnes

    document.getElementById('li-preview').classList.remove('hidden')
    document.getElementById('li-preview').innerHTML = `
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3 text-xs space-y-1">
        <div class="flex justify-between text-slate-600"><span>Total in file</span><strong>${parsed.length}</strong></div>
        <div class="flex justify-between text-green-700"><span>New — will be imported</span><strong>${newOnes.length}</strong></div>
        ${dupes ? `<div class="flex justify-between text-amber-600"><span>Already in Contacts (skipped)</span><strong>${dupes}</strong></div>` : ''}
      </div>
      ${newOnes.length ? `
      <div class="max-h-44 overflow-y-auto space-y-1 mb-1">
        ${newOnes.slice(0,25).map(c=>`
        <div class="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-xs">
          <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-[10px] flex-shrink-0">
            ${c.name.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-slate-800 truncate">${esc(c.name)}</div>
            ${c.institution||c.role ? `<div class="text-slate-400 truncate">${esc([c.role,c.institution].filter(Boolean).join(' · '))}</div>` : ''}
          </div>
          ${c.email    ? `<span class="text-green-600 flex-shrink-0 text-[10px]">📧</span>` : ''}
          ${c.linkedIn ? `<span class="text-blue-600 font-bold flex-shrink-0 text-[10px]">in</span>` : ''}
        </div>`).join('')}
        ${newOnes.length > 25 ? `<p class="text-xs text-slate-400 text-center py-1">…and ${newOnes.length-25} more</p>` : ''}
      </div>` :
      `<p class="text-xs text-amber-600 text-center py-2">All contacts in this file are already in your list.</p>`}`

    document.getElementById('li-import-actions').innerHTML = `
      <button onclick="closeModal()" class="flex-1 btn-secondary">Cancel</button>
      ${newOnes.length ? `<button onclick="confirmLinkedInImport()" class="flex-1 btn-primary">Import ${newOnes.length} contact${newOnes.length>1?'s':''}</button>` : ''}`
  }
  reader.readAsText(file)
}

function confirmLinkedInImport() {
  const queue = window._liImportQueue || []
  if (!queue.length) return
  for (const c of queue) {
    state.contacts.push({
      id: uid(), name: c.name,
      institution: c.institution||'', department:'', role: c.role||'',
      relationship:'', email: c.email||'', phone:'',
      linkedIn: c.linkedIn||'', googleScholar:'', website:'',
      researchAreas:'', emailConfidence:0, emailSource:'linkedin-import',
      hIndex:0, paperCount:0, orcid:null, s2Id:null, s2Url:null, oaUrl:null,
      interactionLog:[], notes:'', addedAt: new Date().toISOString()
    })
  }
  window._liImportQueue = []
  save('contacts')
  closeModal()
  renderContacts()
  showToast(`${queue.length} LinkedIn contact${queue.length>1?'s':''} imported ✓`)
}
