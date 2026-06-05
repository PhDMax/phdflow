// ══ Discover View ══════════════════════════════════════════════════════════════
// Search researchers by name across Semantic Scholar + OpenAlex

let _discoverResults = []
let _discoverQuery   = ''
let _discoverLoading = false

function render_discover() {
  const vc = document.getElementById('view-content')
  vc.innerHTML = `
  ${pageHeader('🔍 Discover Researchers', '')}
  <div class="flex-1 overflow-y-auto p-3 lg:p-6">
    <div class="max-w-3xl mx-auto space-y-5">

      <!-- Search bar -->
      <div class="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 class="text-sm font-bold text-slate-700 mb-1">Find a Researcher</h3>
        <p class="text-xs text-slate-400 mb-3">
          Search by name across Semantic Scholar &amp; OpenAlex simultaneously.
          Great for finding someone you only know by name or affiliation.
        </p>
        <div class="flex gap-2">
          <input id="disc-query" type="text" placeholder="e.g. Geoffrey Hinton, Yann LeCun…"
            value="${esc(_discoverQuery)}"
            class="input flex-1"
            onkeydown="if(event.key==='Enter')discoverSearch()"/>
          <button onclick="discoverSearch()" id="disc-btn"
            class="btn-primary px-5 flex-shrink-0">Search</button>
        </div>
        <p class="text-xs text-slate-400 mt-2">
          Sources: <span class="font-medium text-slate-500">Semantic Scholar</span>,
          <span class="font-medium text-slate-500">OpenAlex</span>,
          <span class="font-medium text-slate-500">DBLP</span>,
          <span class="font-medium text-slate-500">PubMed</span> &amp;
          <span class="font-medium text-slate-500">🌐 Web</span> — free, no API key needed
        </p>
      </div>

      <!-- Results -->
      <div id="disc-results">
        ${_discoverResults.length === 0 && !_discoverQuery
          ? `<div class="text-center py-16 text-slate-400">
              <div class="text-5xl mb-3">🔍</div>
              <p class="font-semibold text-slate-500">Search for any researcher</p>
              <p class="text-sm mt-1">Enter a name above and press Enter or Search</p>
             </div>`
          : _renderDiscoverResults()
        }
      </div>
    </div>
  </div>`

  if (_discoverLoading) _setDiscoverLoading(true)
  setTimeout(() => document.getElementById('disc-query')?.focus(), 80)
}

function _renderDiscoverResults() {
  if (_discoverLoading) return `
    <div class="flex items-center justify-center py-16 gap-3 text-slate-500">
      <div style="width:1.25rem;height:1.25rem;border:2px solid #6366f1;border-top-color:transparent;border-radius:9999px;animation:spin .7s linear infinite"></div>
      <span class="text-sm">Searching Semantic Scholar, OpenAlex &amp; the web…</span>
    </div>`

  if (_discoverQuery && _discoverResults.length === 0) return `
    <div class="text-center py-16 text-slate-400">
      <div class="text-4xl mb-3">😶</div>
      <p class="font-semibold text-slate-500">No results for "${esc(_discoverQuery)}"</p>
      <p class="text-sm mt-1">Try a different spelling or just the last name</p>
    </div>`

  return `
    <div class="space-y-3">
      <p class="text-xs text-slate-400">${_discoverResults.length} researcher${_discoverResults.length!==1?'s':''} found for <strong>"${esc(_discoverQuery)}"</strong></p>
      ${_discoverResults.map((r, i) => _discoverCard(r, i)).join('')}
    </div>`
}

function _discoverCard(r, i) {
  const h      = r.hIndex || 0
  const pubs   = r.paperCount || 0
  const cits   = r.citationCount || 0
  const insts  = (r.affiliations || []).slice(0,2).join(' · ')
  const topics = (r.topics || []).slice(0,4)
  const isWebOnly = r.webSource && !r.s2Url && !r.oaUrl && !r.dblpUrl

  // Source chips
  const sources = [
    r.s2Url   && `<span class="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 rounded px-1.5 py-0.5">S2</span>`,
    r.oaUrl   && `<span class="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 rounded px-1.5 py-0.5">OA</span>`,
    r.dblpUrl && `<span class="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 rounded px-1.5 py-0.5">DBLP</span>`,
    r.orcid   && `<span class="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5 font-mono">ORCID ✓</span>`,
    isWebOnly && `<span class="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5">🌐 Web</span>`,
  ].filter(Boolean)

  return `
  <div class="bg-white rounded-2xl border ${isWebOnly ? 'border-amber-200' : 'border-slate-200'} p-5 hover:border-indigo-200 transition-colors">
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 min-w-0">
        <!-- Name + badges -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <h3 class="text-sm font-bold text-slate-900">${esc(r.name)}</h3>
          ${sources.join('')}
        </div>
        ${insts ? `<p class="text-xs text-slate-500 mt-0.5 truncate">${esc(insts)}</p>` : ''}

        <!-- Metrics (hide if web-only with no data) -->
        ${!isWebOnly ? `
        <div class="flex gap-3 mt-2 flex-wrap">
          ${h    ? `<span class="text-xs text-slate-600"><span class="font-semibold text-slate-800">h=${h}</span> index</span>` : ''}
          ${pubs ? `<span class="text-xs text-slate-600"><span class="font-semibold text-slate-800">${pubs.toLocaleString()}</span> papers</span>` : ''}
          ${cits ? `<span class="text-xs text-slate-600"><span class="font-semibold text-slate-800">${cits.toLocaleString()}</span> citations</span>` : ''}
        </div>` : `
        <p class="text-xs text-amber-600 mt-1.5">Found via web search — no publication database match yet</p>`}

        <!-- Topics -->
        ${topics.length ? `
        <div class="flex gap-1.5 mt-2 flex-wrap">
          ${topics.map(t => `<span class="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2 py-0.5">${esc(t)}</span>`).join('')}
        </div>` : ''}

        <!-- Inferred email -->
        ${r.email && r.emailConfidence > 0 ? `
        <p class="text-xs text-slate-400 mt-2">
          📧 <span class="font-mono">${esc(r.email)}</span>
          <span class="text-slate-300 ml-1">(inferred ~${r.emailConfidence}%)</span>
        </p>` : ''}
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-1.5 flex-shrink-0">
        <button onclick="discoverAddContact(${i})"
          class="btn-primary text-xs py-1.5 px-3 whitespace-nowrap">+ Add to Contacts</button>
        ${r.homepage ? `<button onclick="api.openExternal('${esc(r.homepage)}')"
          class="btn-secondary text-xs py-1.5 px-3 whitespace-nowrap">Homepage ↗</button>` : ''}
        ${r.s2Url ? `<button onclick="api.openExternal('${esc(r.s2Url)}')"
          class="btn-secondary text-xs py-1.5 px-3 whitespace-nowrap">Semantic Scholar ↗</button>` : ''}
        ${r.oaUrl ? `<button onclick="api.openExternal('${esc(r.oaUrl)}')"
          class="btn-secondary text-xs py-1.5 px-3 whitespace-nowrap">OpenAlex ↗</button>` : ''}
        ${r.dblpUrl ? `<button onclick="api.openExternal('${esc(r.dblpUrl)}')"
          class="btn-secondary text-xs py-1.5 px-3 whitespace-nowrap">DBLP ↗</button>` : ''}
      </div>
    </div>
  </div>`
}

function _setDiscoverLoading(on) {
  _discoverLoading = on
  const btn = document.getElementById('disc-btn')
  if (btn) { btn.textContent = on ? 'Searching…' : 'Search'; btn.disabled = on }
  if (on) {
    const res = document.getElementById('disc-results')
    if (res) res.innerHTML = _renderDiscoverResults()
  }
}

async function discoverSearch() {
  const q = document.getElementById('disc-query')?.value.trim()
  if (!q) return
  _discoverQuery   = q
  _discoverResults = []
  _setDiscoverLoading(true)

  const r = await api.searchResearchers(q)

  _discoverLoading = false
  if (r.success) {
    _discoverResults = r.results || []
  } else {
    showToast(`Search failed: ${r.error || 'Unknown error'}`, 'error')
  }

  const res = document.getElementById('disc-results')
  if (res) res.innerHTML = _renderDiscoverResults()
  _setDiscoverLoading(false)
}

function discoverAddContact(i) {
  const r = _discoverResults[i]
  if (!r) return

  const existing = (state.contacts || []).find(c =>
    c.name?.toLowerCase() === r.name?.toLowerCase()
  )
  if (existing) { showToast(`${r.name} is already in Contacts`, 'info'); return }

  const contact = {
    id: uid(), name: r.name,
    institution: r.institution || '',
    email: r.emailConfidence > 50 ? (r.email || '') : '',
    orcid: r.orcid || '',
    website: r.homepage || r.s2Url || r.oaUrl || '',
    notes: [
      r.affiliations?.length > 1 ? `Affiliations: ${r.affiliations.join(', ')}` : '',
      r.topics?.length ? `Research areas: ${r.topics.join(', ')}` : '',
      r.hIndex ? `h-index: ${r.hIndex}` : '',
    ].filter(Boolean).join('\n'),
    tags: r.topics?.slice(0,3) || [],
    status: 'prospect',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  state.contacts = state.contacts || []
  state.contacts.push(contact)
  save('contacts')
  showToast(`${r.name} added to Contacts ✓`)
}
