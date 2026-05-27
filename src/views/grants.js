// ══ Grant Writing View ════════════════════════════════════════════════════════

// ── Built-in grant database ───────────────────────────────────────────────────
const GRANT_DB = [
  // PhD Students
  { id:'gdb1',  name:'Marie Curie Doctoral Networks',          funder:'European Commission',    stage:['phd'],            region:['EU','International'],  fields:['All'],                  amount:'~€3,500/mo',    duration:'3 years',   url:'https://marie-sklodowska-curie-actions.ec.europa.eu/', desc:'EU-funded doctoral training. Apply through host universities.' },
  { id:'gdb2',  name:'NSF Graduate Research Fellowship (GRFP)',funder:'NSF (USA)',              stage:['phd'],            region:['USA'],                 fields:['STEM','Social Sciences'],amount:'$37k/year',     duration:'3 years',   url:'https://www.nsfgrfp.org/',                            desc:'Prestigious US fellowship for early-stage PhD students in STEM & social sciences.' },
  { id:'gdb3',  name:'NIH NRSA Predoctoral Fellowship (F31)',  funder:'NIH (USA)',              stage:['phd'],            region:['USA'],                 fields:['Biomedical','Life Sciences'], amount:'~$26k/year + fees', duration:'Up to 5 years', url:'https://researchtraining.nih.gov/programs/fellowships/F31', desc:'Predoctoral fellowship for US PhD students in biomedical & behavioral sciences.' },
  { id:'gdb4',  name:'Gates Cambridge Scholarship',            funder:'Gates Cambridge Trust',  stage:['phd'],            region:['International'],       fields:['All'],                  amount:'Full + stipend',duration:'PhD length', url:'https://www.gatescambridge.org/',                     desc:'Full scholarships for outstanding PhD students at Cambridge. Non-UK only.' },
  { id:'gdb5',  name:'Rhodes Scholarship',                     funder:'Rhodes Trust (Oxford)',  stage:['phd'],            region:['International'],       fields:['All'],                  amount:'Full + stipend',duration:'2+ years',  url:'https://www.rhodeshouse.ox.ac.uk/',                   desc:'Prestigious scholarship for study at Oxford. Country quotas apply.' },
  { id:'gdb6',  name:'Fulbright U.S. Student Program',         funder:'U.S. Dept. of State',   stage:['phd','masters'],  region:['USA','International'], fields:['All'],                  amount:'Varies',        duration:'1 year',    url:'https://foreign.fulbrightonline.org/',                desc:'Study, research or teaching abroad. Highly competitive.' },
  { id:'gdb7',  name:'EPSRC Doctoral Training Partnership',    funder:'EPSRC (UK)',             stage:['phd'],            region:['UK'],                  fields:['Engineering','Physical Sciences'], amount:'Fees + stipend', duration:'3.5 years', url:'https://www.ukri.org/councils/epsrc/', desc:'UK engineering & physical sciences doctoral training. Apply via UK universities.' },
  { id:'gdb8',  name:'Wellcome Trust PhD Studentship',         funder:'Wellcome Trust (UK)',    stage:['phd'],            region:['UK'],                  fields:['Biomedical','Life Sciences'], amount:'Full costs',  duration:'4 years',   url:'https://wellcome.org/',                               desc:'Prestigious biomedical PhD funding for UK institutions.' },
  { id:'gdb9',  name:'L\'Oréal-UNESCO For Women in Science',   funder:'L\'Oréal / UNESCO',     stage:['phd','postdoc'],  region:['International'],       fields:['STEM'],                 amount:'Varies',        duration:'1 year',    url:'https://www.forwomeninscience.com/',                  desc:'National & international fellowships for women researchers in STEM.' },
  { id:'gdb10', name:'Swiss Govt Excellence Scholarship',      funder:'SBFI (Switzerland)',     stage:['phd','postdoc'],  region:['Switzerland'],         fields:['All'],                  amount:'CHF 1,920/mo',  duration:'1–3 years', url:'https://www.sbfi.admin.ch/',                          desc:'Scholarships for foreign researchers to study or research in Switzerland.' },
  // Postdocs
  { id:'gdb11', name:'Marie Curie Postdoctoral Fellowship',    funder:'European Commission',    stage:['postdoc'],        region:['EU','International'],  fields:['All'],                  amount:'~€4,500/mo',    duration:'1–2 years', url:'https://marie-sklodowska-curie-actions.ec.europa.eu/', desc:'Postdoctoral fellowships in any field. Two calls per year.' },
  { id:'gdb12', name:'Alexander von Humboldt Fellowship',      funder:'Humboldt Foundation',    stage:['postdoc'],        region:['Germany','International'], fields:['All'],              amount:'~€2,670/mo',    duration:'6–24 months',url:'https://www.humboldt-foundation.de/',                desc:'Research stays in Germany for highly qualified international scientists.' },
  { id:'gdb13', name:'NIH Postdoctoral Fellowship (F32)',      funder:'NIH (USA)',              stage:['postdoc'],        region:['USA'],                 fields:['Biomedical','Life Sciences'], amount:'$60–70k/year', duration:'1–3 years', url:'https://researchtraining.nih.gov/programs/fellowships/F32', desc:'Individual postdoctoral fellowship for biomedical research at US institutions.' },
  { id:'gdb14', name:'EMBO Long-Term Fellowship',              funder:'EMBO',                   stage:['postdoc'],        region:['Europe'],              fields:['Life Sciences','Chemistry'], amount:'Scales with family', duration:'2 years', url:'https://www.embo.org/', desc:'For life scientists moving to a new European country for postdoc research.' },
  { id:'gdb15', name:'EMBO Short-Term Fellowship',             funder:'EMBO',                   stage:['phd','postdoc'],  region:['Europe'],              fields:['Life Sciences'],        amount:'Living expenses',duration:'1–3 months',url:'https://www.embo.org/',                               desc:'Short research visits in the life sciences within Europe.' },
  { id:'gdb16', name:'Newton International Fellowship',        funder:'Royal Society / Brit. Academy', stage:['postdoc'], region:['UK'],                 fields:['All'],                  amount:'£33k/year',     duration:'2 years',   url:'https://royalsociety.org/',                           desc:'Brings outstanding early-career researchers to the UK. Non-UK applicants only.' },
  { id:'gdb17', name:'HFSP Long-Term Fellowship',              funder:'HFSP',                   stage:['postdoc'],        region:['International'],       fields:['Life Sciences','Biology'], amount:'~$55k/year',  duration:'3 years',   url:'https://www.hfsp.org/',                               desc:'International postdoctoral fellowships for life scientists changing research area or country.' },
  { id:'gdb18', name:'SNSF Early Postdoc.Mobility',            funder:'SNSF (Switzerland)',     stage:['postdoc'],        region:['Switzerland','International'], fields:['All'],          amount:'~CHF 80k',      duration:'18 months', url:'https://www.snf.ch/',                                 desc:'Swiss NSF mobility grants for early postdocs going abroad.' },
  { id:'gdb19', name:'DAAD Research Grants',                   funder:'DAAD (Germany)',         stage:['phd','postdoc'],  region:['Germany','International'], fields:['All'],              amount:'Varies',        duration:'1–24 months',url:'https://www.daad.de/en/',                            desc:'German Academic Exchange Service. Supports research stays in Germany and abroad.' },
  // PIs / Early-career
  { id:'gdb20', name:'ERC Starting Grant',                     funder:'European Research Council', stage:['pi'],          region:['EU'],                  fields:['All'],                  amount:'Up to €1.5M',   duration:'5 years',   url:'https://erc.europa.eu/',                              desc:'For early-career researchers 2–7 years post-PhD with a European host institution.' },
  { id:'gdb21', name:'ERC Consolidator Grant',                 funder:'European Research Council', stage:['pi'],          region:['EU'],                  fields:['All'],                  amount:'Up to €2M',     duration:'5 years',   url:'https://erc.europa.eu/',                              desc:'For researchers 7–12 years post-PhD with a European host institution.' },
  { id:'gdb22', name:'DFG Research Grant',                     funder:'DFG (Germany)',          stage:['postdoc','pi'],   region:['Germany'],             fields:['All'],                  amount:'Project-based',  duration:'1–3 years', url:'https://www.dfg.de/',                                 desc:'German Research Foundation grants for individual research projects.' },
  { id:'gdb23', name:'ANR Young Researcher (JCJC)',             funder:'ANR (France)',           stage:['pi'],             region:['France'],              fields:['All'],                  amount:'~€300k',        duration:'4 years',   url:'https://anr.fr/',                                     desc:'French ANR grants for early-career PIs. Excellent track record required.' },
  { id:'gdb24', name:'FWF Individual Project',                  funder:'FWF (Austria)',          stage:['pi'],             region:['Austria'],             fields:['All'],                  amount:'Project-based',  duration:'1–4 years', url:'https://www.fwf.ac.at/',                              desc:'Austrian Science Fund standalone grants for research projects.' },
  { id:'gdb25', name:'Volkswagen Foundation Freigeist',         funder:'Volkswagen Foundation',  stage:['postdoc','pi'],   region:['Germany'],             fields:['All'],                  amount:'Up to €1M',     duration:'5 years',   url:'https://www.volkswagenstiftung.de/',                  desc:'For bold, unconventional research ideas. Exceptional track record required.' },
]

const STAGES  = ['phd','postdoc','pi']
const REGIONS = ['EU','International','USA','UK','Germany','France','Austria','Switzerland','Europe']
const FIELDS  = ['All','STEM','Life Sciences','Biomedical','Chemistry','Physics','Engineering','Social Sciences','Humanities','Biology']

// ── Active tab ────────────────────────────────────────────────────────────────
let _grantTab = 'mine'

function render_grants() {
  const vc = document.getElementById('view-content')
  const myCount = state.grants.length
  vc.innerHTML = `
  ${pageHeader('✍️ Grants', `
    <div class="flex gap-2">
      ${_grantTab==='mine' ? `<button onclick="openGrantModal()" class="btn-primary text-xs py-2">+ Add Grant</button>` : ''}
    </div>`)}

  <!-- Tabs -->
  <div class="bg-white border-b border-slate-200 px-5 flex gap-1 flex-shrink-0">
    <button onclick="switchGrantTab('mine')" data-gtab="mine"
      class="px-4 py-3 text-sm font-medium border-b-2 transition-colors ${_grantTab==='mine'?'border-indigo-600 text-indigo-700':'border-transparent text-slate-500 hover:text-slate-700'}">
      📊 My Grants${myCount ? ` <span class="ml-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">${myCount}</span>` : ''}
    </button>
    <button onclick="switchGrantTab('discover')" data-gtab="discover"
      class="px-4 py-3 text-sm font-medium border-b-2 transition-colors ${_grantTab==='discover'?'border-indigo-600 text-indigo-700':'border-transparent text-slate-500 hover:text-slate-700'}">
      🔍 Discover
    </button>
  </div>

  <div class="flex-1 overflow-y-auto">
    <div id="grant-tab-content" class="h-full"></div>
  </div>`

  renderGrantTab()
}

function switchGrantTab(tab) {
  _grantTab = tab
  document.querySelectorAll('[data-gtab]').forEach(b => {
    const active = b.dataset.gtab === tab
    b.className = `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${active
      ? 'border-indigo-600 text-indigo-700'
      : 'border-transparent text-slate-500 hover:text-slate-700'}`
  })
  // Update the "+ Add Grant" button
  const hdr = document.querySelector('[data-gtab]')?.closest('div')?.previousElementSibling
  const btn = document.querySelector('[onclick="openGrantModal()"]')
  if (btn) btn.style.display = tab === 'mine' ? '' : 'none'
  renderGrantTab()
}

function renderGrantTab() {
  const el = document.getElementById('grant-tab-content')
  if (!el) return
  if (_grantTab === 'mine') el.innerHTML = buildMyGrantsHTML()
  else                       el.innerHTML = buildDiscoverHTML()
}

// ── MY GRANTS ─────────────────────────────────────────────────────────────────
function buildMyGrantsHTML() {
  if (!state.grants.length) return `
  <div class="p-6 flex flex-col items-center justify-center h-full text-center">
    ${emptyState('✍️','No grants tracked yet','Add a grant you found, or discover opportunities in the Discover tab')}
    <button onclick="switchGrantTab('discover')" class="mt-4 btn-primary text-sm">🔍 Browse grant opportunities</button>
  </div>`

  const now   = new Date()
  const today = now.toISOString().split('T')[0]

  // Pipeline counts
  const counts = {}
  const STATUSES = ['researching','drafting','submitted','awarded','rejected']
  STATUSES.forEach(s => counts[s] = state.grants.filter(g=>g.status===s).length)

  const statusColors = {
    researching:'bg-purple-100 text-purple-700 border-purple-200',
    drafting:   'bg-amber-100 text-amber-700 border-amber-200',
    submitted:  'bg-blue-100 text-blue-700 border-blue-200',
    awarded:    'bg-green-100 text-green-700 border-green-200',
    rejected:   'bg-slate-100 text-slate-500 border-slate-200'
  }

  // Sort: active (researching/drafting) by deadline first, then submitted, then awarded/rejected
  const sorted = [...state.grants].sort((a,b) => {
    const order = {researching:0,drafting:1,submitted:2,awarded:3,rejected:4}
    if ((order[a.status]||0) !== (order[b.status]||0)) return (order[a.status]||0)-(order[b.status]||0)
    if (!a.deadline && !b.deadline) return 0
    if (!a.deadline) return 1; if (!b.deadline) return -1
    return a.deadline.localeCompare(b.deadline)
  })

  return `
  <!-- Pipeline strip -->
  <div class="bg-white border-b border-slate-100 px-5 py-3 flex gap-2 flex-wrap">
    ${STATUSES.map(s => counts[s] ? `
    <span class="text-xs px-2.5 py-1 rounded-full border font-medium ${statusColors[s]}">
      ${s[0].toUpperCase()+s.slice(1)}: ${counts[s]}
    </span>` : '').join('')}
  </div>

  <!-- Grant cards -->
  <div class="p-5 space-y-3 max-w-3xl">
    ${sorted.map(g => {
      let deadlineBanner = ''
      if (g.deadline) {
        const daysLeft = Math.round((new Date(g.deadline) - now) / 864e5)
        if (g.status !== 'awarded' && g.status !== 'rejected') {
          if      (daysLeft < 0)    deadlineBanner = `<div class="mt-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1">🔴 Deadline passed ${Math.abs(daysLeft)}d ago</div>`
          else if (daysLeft === 0)  deadlineBanner = `<div class="mt-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1">🔴 Deadline is TODAY</div>`
          else if (daysLeft <= 7)   deadlineBanner = `<div class="mt-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1">⏰ Deadline in ${daysLeft} day${daysLeft>1?'s':''}!</div>`
          else if (daysLeft <= 30)  deadlineBanner = `<div class="mt-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">📅 ${daysLeft} days until deadline</div>`
        }
      }
      const reqsDone = (g.requirements||[]).filter(r=>r.done).length
      const reqsTotal = (g.requirements||[]).length

      return `
      <div class="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow cursor-pointer" onclick="openGrantDetail('${g.id}')">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-slate-900 text-sm">${esc(g.title||g.funder)}</h3>
            <p class="text-xs text-slate-500 mt-0.5">${esc(g.funder)}</p>
          </div>
          <span class="text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0 border ${statusColors[g.status]||'bg-slate-100 text-slate-500 border-slate-200'}">${g.status||'researching'}</span>
        </div>
        <div class="flex gap-4 mt-2.5 text-xs text-slate-400 flex-wrap">
          ${g.deadline ? `<span>🗓 ${fmtDate(g.deadline)}</span>` : '<span class="italic">No deadline set</span>'}
          ${g.amount   ? `<span>💰 ${esc(g.amount)}</span>` : ''}
          ${g.duration ? `<span>⏱ ${esc(g.duration)}</span>` : ''}
          ${reqsTotal  ? `<span>📋 ${reqsDone}/${reqsTotal} requirements</span>` : ''}
        </div>
        ${deadlineBanner}
      </div>`
    }).join('')}
  </div>`
}

// ── DISCOVER ──────────────────────────────────────────────────────────────────
let _dStage = 'all', _dRegion = 'all', _dField = 'all', _dSearch = ''

function buildDiscoverHTML() {
  let grants = GRANT_DB

  if (_dStage  !== 'all') grants = grants.filter(g => g.stage.includes(_dStage))
  if (_dRegion !== 'all') grants = grants.filter(g => g.region.some(r => r === _dRegion || r === 'International'))
  if (_dField  !== 'all') grants = grants.filter(g => g.fields.includes('All') || g.fields.includes(_dField))
  if (_dSearch)           grants = grants.filter(g =>
    g.name.toLowerCase().includes(_dSearch) || g.funder.toLowerCase().includes(_dSearch) || g.desc.toLowerCase().includes(_dSearch))

  const alreadyTracked = new Set(state.grants.map(g => g.sourceId).filter(Boolean))

  return `
  <!-- Discover filters -->
  <div class="bg-white border-b border-slate-100 px-5 py-3 flex gap-2 flex-wrap items-center">
    <input type="text" placeholder="Search grants..." value="${esc(_dSearch)}"
      oninput="_dSearch=this.value;document.getElementById('grant-tab-content').innerHTML=buildDiscoverHTML()"
      class="flex-1 min-w-40 px-3 py-1.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
    <select onchange="_dStage=this.value;document.getElementById('grant-tab-content').innerHTML=buildDiscoverHTML()" class="input" style="width:auto;padding:.3rem .7rem;font-size:.8rem">
      <option value="all" ${_dStage==='all'?'selected':''}>All career stages</option>
      <option value="phd"     ${_dStage==='phd'    ?'selected':''}>PhD Student</option>
      <option value="postdoc" ${_dStage==='postdoc'?'selected':''}>Postdoc</option>
      <option value="pi"      ${_dStage==='pi'     ?'selected':''}>PI / Group Leader</option>
    </select>
    <select onchange="_dRegion=this.value;document.getElementById('grant-tab-content').innerHTML=buildDiscoverHTML()" class="input" style="width:auto;padding:.3rem .7rem;font-size:.8rem">
      <option value="all" ${_dRegion==='all'?'selected':''}>All regions</option>
      ${REGIONS.map(r=>`<option value="${r}" ${_dRegion===r?'selected':''}>${r}</option>`).join('')}
    </select>
    <select onchange="_dField=this.value;document.getElementById('grant-tab-content').innerHTML=buildDiscoverHTML()" class="input" style="width:auto;padding:.3rem .7rem;font-size:.8rem">
      <option value="all" ${_dField==='all'?'selected':''}>All fields</option>
      ${FIELDS.filter(f=>f!=='All').map(f=>`<option value="${f}" ${_dField===f?'selected':''}>${f}</option>`).join('')}
    </select>
    <span class="text-xs text-slate-400">${grants.length} found</span>
  </div>

  <!-- Grant cards -->
  <div class="p-5 grid grid-cols-1 gap-3 max-w-4xl lg:grid-cols-2">
    ${grants.length === 0
      ? `<div class="col-span-2 py-16 text-center text-slate-400">No grants match your filters.<br/><button onclick="_dStage='all';_dRegion='all';_dField='all';_dSearch='';document.getElementById('grant-tab-content').innerHTML=buildDiscoverHTML()" class="mt-2 text-indigo-500 hover:underline text-sm">Clear filters</button></div>`
      : grants.map(g => {
        const tracked = alreadyTracked.has(g.id)
        const stageChips = g.stage.map(s => {
          const sc = {phd:'bg-indigo-100 text-indigo-700',postdoc:'bg-purple-100 text-purple-700',pi:'bg-teal-100 text-teal-700',masters:'bg-slate-100 text-slate-600'}
          return `<span class="text-xs px-2 py-0.5 rounded-full ${sc[s]||'bg-slate-100 text-slate-600'}">${s==='phd'?'PhD':s==='pi'?'PI':s}</span>`
        }).join('')
        return `
        <div class="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow flex flex-col gap-3">
          <div>
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-bold text-slate-900 text-sm leading-snug">${esc(g.name)}</h3>
              ${tracked ? `<span class="text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0">✓ Tracking</span>` : ''}
            </div>
            <p class="text-xs text-slate-500 mt-0.5">${esc(g.funder)}</p>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed">${esc(g.desc)}</p>
          <div class="flex gap-1.5 flex-wrap">
            ${stageChips}
            ${g.region.slice(0,2).map(r=>`<span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">${r}</span>`).join('')}
            ${g.fields[0]!=='All'?`<span class="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">${g.fields[0]}</span>`:''}
          </div>
          <div class="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-50">
            <span>${g.amount}${g.duration?' · '+g.duration:''}</span>
            <div class="flex gap-2">
              <button onclick="window.api.openExternal('${g.url}')" class="text-indigo-500 hover:underline">Website ↗</button>
              ${!tracked ? `<button onclick="trackDiscoveredGrant('${g.id}')" class="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">+ Track</button>` : ''}
            </div>
          </div>
        </div>`
      }).join('')}
  </div>`
}

function trackDiscoveredGrant(dbId) {
  const g = GRANT_DB.find(x=>x.id===dbId)
  if (!g) return
  state.grants.push({
    id: uid(), sourceId: dbId,
    title: g.name, funder: g.funder,
    amount: g.amount, duration: g.duration,
    status: 'researching', deadline: '',
    eligibility: g.desc, tags: [...g.stage, ...g.fields.filter(f=>f!=='All')],
    requirements: [], sections: [], coApplicants: [],
    notes: `Website: ${g.url}`,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  })
  save('grants')
  showToast(`"${g.name}" added to My Grants ✓`)
  document.getElementById('grant-tab-content').innerHTML = buildDiscoverHTML()
}

// ── Grant modal (create / edit) ───────────────────────────────────────────────
function openGrantModal(id) {
  const g = id ? state.grants.find(x=>x.id===id) : null
  openModal(`
  <h3 class="text-base font-bold mb-4">${g ? 'Edit Grant' : 'Add Grant'}</h3>
  <div class="space-y-3">
    <div><label class="label">Grant Name *</label>
      <input id="gr-title" type="text" value="${esc(g?.title)}" placeholder="e.g. ERC Starting Grant 2026" class="input"/></div>
    <div><label class="label">Funder / Agency *</label>
      <input id="gr-funder" type="text" value="${esc(g?.funder)}" placeholder="ERC, NIH, DFG, EPSRC..." class="input"/></div>
    <div class="grid grid-cols-2 gap-3">
      <div><label class="label">Deadline</label>
        <input id="gr-deadline" type="date" value="${g?.deadline||''}" class="input"/></div>
      <div><label class="label">Status</label>
        <select id="gr-status" class="input">
          ${['researching','drafting','submitted','awarded','rejected'].map(s=>`<option value="${s}" ${g?.status===s?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}
        </select></div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div><label class="label">Amount</label>
        <input id="gr-amount" type="text" value="${esc(g?.amount)}" placeholder="€1,500,000" class="input"/></div>
      <div><label class="label">Duration</label>
        <input id="gr-duration" type="text" value="${esc(g?.duration)}" placeholder="5 years" class="input"/></div>
    </div>
    <div><label class="label">Eligibility / Notes</label>
      <textarea id="gr-eligibility" rows="2" class="input resize-none" placeholder="Career stage, institution requirements...">${esc(g?.eligibility||g?.notes)}</textarea></div>
    <div class="flex gap-3 pt-2">
      <button onclick="closeModal()" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="saveGrant('${g?.id||''}')" class="flex-1 btn-primary">Save Grant</button>
    </div>
  </div>`)
  setTimeout(()=>document.getElementById('gr-title')?.focus(),50)
}

function saveGrant(id) {
  const title  = document.getElementById('gr-title').value.trim()
  const funder = document.getElementById('gr-funder').value.trim()
  if (!title || !funder) { showToast('Name and funder required','error'); return }
  const existing = id ? state.grants.find(g=>g.id===id) : null
  const data = {
    id: id||uid(), title, funder,
    deadline:    document.getElementById('gr-deadline').value,
    status:      document.getElementById('gr-status').value,
    amount:      document.getElementById('gr-amount').value.trim(),
    duration:    document.getElementById('gr-duration').value.trim(),
    eligibility: document.getElementById('gr-eligibility').value.trim(),
    requirements: existing?.requirements||[],
    sections:     existing?.sections||[],
    coApplicants: existing?.coApplicants||[],
    notes:        existing?.notes||'',
    sourceId:     existing?.sourceId||null,
    createdAt:    existing?.createdAt||new Date().toISOString(),
    updatedAt:    new Date().toISOString()
  }
  if (id) { const i=state.grants.findIndex(g=>g.id===id); if(i>-1) state.grants[i]=data }
  else state.grants.push(data)
  save('grants'); closeModal()
  renderGrantTab()
  showToast(id ? 'Grant updated ✓' : 'Grant added ✓')
}

// ── Grant detail ──────────────────────────────────────────────────────────────
function openGrantDetail(id) {
  const g = state.grants.find(x=>x.id===id)
  if (!g) return
  const now = new Date()
  const statusColors = {researching:'bg-purple-100 text-purple-700',drafting:'bg-amber-100 text-amber-700',submitted:'bg-blue-100 text-blue-700',awarded:'bg-green-100 text-green-700',rejected:'bg-slate-100 text-slate-500'}

  let deadlineBanner = ''
  if (g.deadline && g.status !== 'awarded' && g.status !== 'rejected') {
    const daysLeft = Math.round((new Date(g.deadline) - now) / 864e5)
    if (daysLeft < 0)    deadlineBanner = `<div class="mb-4 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">🔴 Deadline passed ${Math.abs(daysLeft)} days ago</div>`
    else if (daysLeft<=7)deadlineBanner = `<div class="mb-4 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">⏰ Deadline in ${daysLeft} day${daysLeft>1?'s':''}!</div>`
    else if (daysLeft<=30)deadlineBanner= `<div class="mb-4 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">📅 Deadline in ${daysLeft} days — ${fmtDate(g.deadline)}</div>`
  }

  openModal(`
  <div class="flex items-start justify-between gap-3 mb-1">
    <div>
      <h3 class="font-bold text-slate-900 text-lg leading-tight">${esc(g.title||g.funder)}</h3>
      <p class="text-slate-500 text-sm mt-0.5">${esc(g.funder)}</p>
    </div>
    <span class="text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[g.status]||'bg-slate-100 text-slate-500'}">${g.status}</span>
  </div>

  <div class="grid grid-cols-3 gap-2 my-4 text-sm">
    ${g.deadline?`<div class="bg-slate-50 rounded-xl p-2.5"><div class="text-xs text-slate-400">Deadline</div><div class="font-semibold">${fmtDate(g.deadline)}</div></div>`:''}
    ${g.amount  ?`<div class="bg-slate-50 rounded-xl p-2.5"><div class="text-xs text-slate-400">Amount</div><div class="font-semibold">${esc(g.amount)}</div></div>`:''}
    ${g.duration?`<div class="bg-slate-50 rounded-xl p-2.5"><div class="text-xs text-slate-400">Duration</div><div class="font-semibold">${esc(g.duration)}</div></div>`:''}
  </div>

  ${deadlineBanner}
  ${g.eligibility?`<div class="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 mb-4 leading-relaxed">${esc(g.eligibility)}</div>`:''}

  <!-- Requirements checklist -->
  <div class="mb-4">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-bold text-slate-800">📋 Requirements Checklist</span>
      <button onclick="addRequirement('${id}')" class="text-xs text-indigo-600 hover:underline font-medium">+ Add</button>
    </div>
    <div id="req-list">${renderRequirements(g)}</div>
  </div>

  <!-- Co-applicants -->
  <div class="mb-4">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-bold text-slate-800">👥 Co-Applicants</span>
      <button onclick="addCoApplicant('${id}')" class="text-xs text-indigo-600 hover:underline font-medium">+ Add</button>
    </div>
    <div id="coapplicant-list">${renderCoApplicants(g)}</div>
  </div>

  <!-- Notes -->
  <div class="mb-4">
    <label class="label">Notes</label>
    <textarea rows="3" class="input resize-none" placeholder="Internal notes, links, contacts..."
      onchange="updateGrantField('${id}','notes',this.value)">${esc(g.notes||'')}</textarea>
  </div>

  <div class="flex gap-3 border-t border-slate-100 pt-4">
    <button onclick="openGrantModal('${id}')" class="flex-1 btn-secondary">✏️ Edit</button>
    <button onclick="deleteGrant('${id}')" class="btn-danger">Delete</button>
  </div>`, true)
}

// ── Requirements checklist ────────────────────────────────────────────────────
function renderRequirements(g) {
  const reqs = g.requirements||[]
  if (!reqs.length) return `<p class="text-xs text-slate-400 italic">No requirements added — e.g. CV, Reference letters, Research proposal, Budget...</p>`
  const done = reqs.filter(r=>r.done).length
  return `
  <div class="mb-2 flex items-center gap-2">
    <div class="flex-1 bg-slate-100 rounded-full h-1.5">
      <div class="h-1.5 rounded-full bg-indigo-500 transition-all" style="width:${reqs.length?Math.round(done/reqs.length*100):0}%"></div>
    </div>
    <span class="text-xs text-slate-400">${done}/${reqs.length}</span>
  </div>
  <div class="space-y-1.5">
  ${reqs.map((r,i) => `
    <div class="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors">
      <input type="checkbox" ${r.done?'checked':''} onchange="toggleRequirement('${g.id}',${i})"
        class="rounded border-slate-300 text-indigo-600 flex-shrink-0"/>
      <span class="text-sm flex-1 ${r.done?'line-through text-slate-400':'text-slate-800'}">${esc(r.text)}</span>
      <button onclick="removeRequirement('${g.id}',${i})" class="text-slate-300 hover:text-red-400 text-xs flex-shrink-0">✕</button>
    </div>`).join('')}
  </div>`
}

function addRequirement(grantId) {
  openModal(`
  <h3 class="text-base font-bold mb-4">Add Requirement</h3>
  <div class="space-y-3">
    <div><label class="label">Requirement *</label>
      <input id="req-text" type="text" class="input" placeholder="e.g. CV (max 2 pages), Research proposal, Reference letters..."/></div>
    <div class="flex gap-3 pt-2">
      <button onclick="openGrantDetail('${grantId}')" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="saveRequirement('${grantId}')" class="flex-1 btn-primary">Add</button>
    </div>
  </div>`)
  setTimeout(()=>document.getElementById('req-text')?.focus(),50)
}

function saveRequirement(grantId) {
  const text = document.getElementById('req-text').value.trim()
  if (!text) { showToast('Requirement text required','error'); return }
  const g = state.grants.find(x=>x.id===grantId)
  if (!g) return
  if (!g.requirements) g.requirements=[]
  g.requirements.push({text, done:false})
  save('grants'); openGrantDetail(grantId)
}

function toggleRequirement(grantId, index) {
  const g = state.grants.find(x=>x.id===grantId)
  if (!g?.requirements?.[index]) return
  g.requirements[index].done = !g.requirements[index].done
  save('grants')
  const el = document.getElementById('req-list')
  if (el) el.innerHTML = renderRequirements(g)
  renderGrantTab()
}

function removeRequirement(grantId, index) {
  const g = state.grants.find(x=>x.id===grantId)
  if (!g) return
  g.requirements.splice(index,1); save('grants')
  const el = document.getElementById('req-list')
  if (el) el.innerHTML = renderRequirements(g)
}

// ── Co-applicants ─────────────────────────────────────────────────────────────
function renderCoApplicants(g) {
  if (!g.coApplicants?.length) return `<p class="text-xs text-slate-400 italic">None added</p>`
  return g.coApplicants.map((c,i)=>`
  <div class="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 text-sm">
    <span class="font-medium text-slate-800">${esc(c.name)}</span>
    <div class="flex items-center gap-2">
      <span class="text-slate-400 text-xs">${esc(c.role)}${c.institution?' · '+esc(c.institution):''}</span>
      <button onclick="removeCoapplicant('${g.id}',${i})" class="text-red-400 hover:text-red-600 text-xs">✕</button>
    </div>
  </div>`).join('')
}

function addCoApplicant(grantId) {
  openModal(`
  <h3 class="text-base font-bold mb-4">Add Co-Applicant</h3>
  <div class="space-y-3">
    <div><label class="label">Name *</label><input id="ca-name" type="text" class="input"/></div>
    <div><label class="label">Role</label><input id="ca-role" type="text" class="input" placeholder="Co-PI, Collaborator..."/></div>
    <div><label class="label">Institution</label><input id="ca-inst" type="text" class="input"/></div>
    <div class="flex gap-3 pt-2">
      <button onclick="openGrantDetail('${grantId}')" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="saveCoapplicant('${grantId}')" class="flex-1 btn-primary">Add</button>
    </div>
  </div>`)
  setTimeout(()=>document.getElementById('ca-name')?.focus(),50)
}

function saveCoapplicant(grantId) {
  const name = document.getElementById('ca-name').value.trim()
  if (!name) { showToast('Name required','error'); return }
  const g = state.grants.find(x=>x.id===grantId)
  if (!g) return
  if (!g.coApplicants) g.coApplicants=[]
  g.coApplicants.push({name, role: document.getElementById('ca-role').value.trim(), institution: document.getElementById('ca-inst').value.trim()})
  save('grants'); openGrantDetail(grantId)
}

function removeCoapplicant(grantId, index) {
  const g = state.grants.find(x=>x.id===grantId)
  if (g) { g.coApplicants.splice(index,1); save('grants'); openGrantDetail(grantId) }
}

function updateGrantField(id, field, value) {
  const g = state.grants.find(x=>x.id===id)
  if (g) { g[field]=value; save('grants') }
}

function deleteGrant(id) {
  if (!confirm('Delete this grant?')) return
  state.grants = state.grants.filter(g=>g.id!==id)
  save('grants'); closeModal(); renderGrantTab()
  showToast('Grant deleted')
}
