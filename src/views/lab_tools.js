// ══ PhDFlow — Lab Tools (specialty pack) ═══════════════════════════════════════
// Quick wet-lab calculators: dilution, molar mass, and solution prep.
// Only shown in the sidebar when the "Lab Tools" specialty pack is enabled
// (Settings → Personalize → Specialty Tool Packs).

const LAB_TOOLS = [
  { id:'dilution', icon:'🧪', label:'Dilution',      desc:'C₁V₁ = C₂V₂' },
  { id:'molar',    icon:'⚖️', label:'Molar Mass',    desc:'Molecular weight from a formula' },
  { id:'solution', icon:'🧂', label:'Solution Prep', desc:'Mass needed for a target molarity' },
]

let _labMode = 'dilution'

const ATOMIC_WEIGHTS = {
  H:1.008, He:4.0026, Li:6.94, Be:9.0122, B:10.81, C:12.011, N:14.007, O:15.999, F:18.998, Ne:20.180,
  Na:22.990, Mg:24.305, Al:26.982, Si:28.085, P:30.974, S:32.06, Cl:35.45, Ar:39.948, K:39.098, Ca:40.078,
  Sc:44.956, Ti:47.867, V:50.942, Cr:51.996, Mn:54.938, Fe:55.845, Co:58.933, Ni:58.693, Cu:63.546, Zn:65.38,
  Ga:69.723, Ge:72.630, As:74.922, Se:78.971, Br:79.904, Kr:83.798, Rb:85.468, Sr:87.62, Y:88.906, Zr:91.224,
  Nb:92.906, Mo:95.95, Tc:98, Ru:101.07, Rh:102.91, Pd:106.42, Ag:107.87, Cd:112.41, In:114.82, Sn:118.71,
  Sb:121.76, Te:127.60, I:126.90, Xe:131.29, Cs:132.91, Ba:137.33, La:138.91, Ce:140.12, Pr:140.91, Nd:144.24,
  Sm:150.36, Eu:151.96, Gd:157.25, Tb:158.93, Dy:162.50, Ho:164.93, Er:167.26, Tm:168.93, Yb:173.05, Lu:174.97,
  Hf:178.49, Ta:180.95, W:183.84, Re:186.21, Os:190.23, Ir:192.22, Pt:195.08, Au:196.97, Hg:200.59, Tl:204.38,
  Pb:207.2, Bi:208.98, Th:232.04, U:238.03,
}

function render_lab_tools() {
  const vc = document.getElementById('view-content')
  if (!vc) return
  vc.innerHTML = `<div class="flex-1 flex flex-col overflow-hidden">
    ${pageHeader('🧫 Lab Tools')}
    <div id="lab-tool-area" class="flex-1 overflow-y-auto p-3 lg:p-5">${_labRender()}</div>
  </div>`
}

function _labRender() {
  return `
  <div class="max-w-2xl mx-auto">
    <div class="flex gap-2 flex-wrap mb-6">
      ${LAB_TOOLS.map(t => `
      <button onclick="_labMode='${t.id}';document.getElementById('lab-tool-area').innerHTML=_labRender()"
        class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors
          ${_labMode === t.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}">
        <span>${t.icon}</span><span>${t.label}</span>
      </button>`).join('')}
    </div>
    ${_labMode === 'dilution' ? _labRenderDilution() : _labMode === 'molar' ? _labRenderMolar() : _labRenderSolution()}
  </div>`
}

// ── Dilution calculator ─────────────────────────────────────────────────────────
function _labRenderDilution() {
  return `
  <div class="bg-white rounded-2xl border border-slate-200 p-5">
    <h3 class="text-sm font-bold text-slate-700 mb-1">🧪 Dilution Calculator</h3>
    <p class="text-xs text-slate-400 mb-4">C₁V₁ = C₂V₂ — leave exactly one field empty to solve for it. Use any consistent units across all four fields.</p>
    <div class="grid grid-cols-2 gap-3 mb-3">
      <div><label class="label">Stock concentration (C₁)</label>
        <input id="lab-c1" type="number" class="input" oninput="_labCalcDilution()" placeholder="e.g. 10"/></div>
      <div><label class="label">Stock volume (V₁)</label>
        <input id="lab-v1" type="number" class="input" oninput="_labCalcDilution()" placeholder="e.g. 5"/></div>
      <div><label class="label">Final concentration (C₂)</label>
        <input id="lab-c2" type="number" class="input" oninput="_labCalcDilution()" placeholder="e.g. 1"/></div>
      <div><label class="label">Final volume (V₂)</label>
        <input id="lab-v2" type="number" class="input" oninput="_labCalcDilution()" placeholder="e.g. 50"/></div>
    </div>
    <div id="lab-dilution-result" class="text-sm font-semibold text-indigo-700 min-h-[20px]"></div>
  </div>`
}

function _labCalcDilution() {
  const ids = ['c1','v1','c2','v2']
  const labels = { c1:'C₁', v1:'V₁', c2:'C₂', v2:'V₂' }
  const out = document.getElementById('lab-dilution-result')
  if (!out) return
  const vals = {}
  let emptyKey = null, multiEmpty = false
  for (const id of ids) {
    const raw = document.getElementById('lab-'+id).value.trim()
    if (raw === '') { if (emptyKey) multiEmpty = true; else emptyKey = id }
    else vals[id] = parseFloat(raw)
  }
  if (multiEmpty) {
    out.className = 'text-sm font-semibold text-slate-400 min-h-[20px]'
    out.textContent = 'Leave exactly one field empty to solve for it.'
    return
  }
  if (!emptyKey) {
    const lhs = vals.c1 * vals.v1, rhs = vals.c2 * vals.v2
    const close = Math.abs(lhs - rhs) < 1e-9 * Math.max(1, Math.abs(lhs))
    out.className = `text-sm font-semibold min-h-[20px] ${close ? 'text-green-600' : 'text-amber-600'}`
    out.textContent = `C₁V₁ = ${lhs.toPrecision(4)}   ·   C₂V₂ = ${rhs.toPrecision(4)}${close ? ' ✓' : ' (does not balance)'}`
    return
  }
  let result
  if (emptyKey === 'c1')      result = (vals.c2 * vals.v2) / vals.v1
  else if (emptyKey === 'v1') result = (vals.c2 * vals.v2) / vals.c1
  else if (emptyKey === 'c2') result = (vals.c1 * vals.v1) / vals.v2
  else                        result = (vals.c1 * vals.v1) / vals.c2
  if (!isFinite(result)) {
    out.className = 'text-sm font-semibold text-red-500 min-h-[20px]'
    out.textContent = 'Enter valid, non-zero numbers.'
    return
  }
  out.className = 'text-sm font-semibold text-indigo-700 min-h-[20px]'
  out.innerHTML = `${labels[emptyKey]} = <strong>${result.toPrecision(5)}</strong>`
}

// ── Molar mass calculator ───────────────────────────────────────────────────────
function _labRenderMolar() {
  return `
  <div class="bg-white rounded-2xl border border-slate-200 p-5">
    <h3 class="text-sm font-bold text-slate-700 mb-1">⚖️ Molar Mass Calculator</h3>
    <p class="text-xs text-slate-400 mb-4">Enter a chemical formula, e.g. <code>H2O</code>, <code>C6H12O6</code>, <code>Ca(OH)2</code>, or a hydrate like <code>CuSO4·5H2O</code>.</p>
    <input id="lab-formula" type="text" class="input" placeholder="e.g. NaCl" oninput="_labCalcMolar(this.value)"/>
    <div id="lab-molar-result" class="mt-3"></div>
  </div>`
}

function _labCalcMolar(formula) {
  const out = document.getElementById('lab-molar-result')
  if (!out) return
  formula = formula.trim()
  if (!formula) { out.innerHTML = ''; window._labMolarMass = null; return }
  try {
    const { mass, breakdown } = _calcMolarMass(formula)
    window._labMolarMass = mass
    out.innerHTML = `<div class="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
      <div class="text-sm font-bold text-indigo-700 mb-1.5">Molar mass: ${mass.toFixed(3)} g/mol</div>
      <div class="text-xs text-slate-500 space-y-0.5">
        ${breakdown.map(b => `<div>${b.el} × ${b.count} = ${b.subtotal.toFixed(3)} g/mol</div>`).join('')}
      </div>
    </div>`
  } catch (e) {
    window._labMolarMass = null
    out.innerHTML = `<div class="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600">${esc(e.message)}</div>`
  }
}

function _calcMolarMass(formula) {
  const counts = _parseFormula(formula)
  if (!Object.keys(counts).length) throw new Error('Could not parse formula — check the syntax')
  let mass = 0
  const breakdown = []
  for (const [el, count] of Object.entries(counts)) {
    const w = ATOMIC_WEIGHTS[el]
    if (w == null) throw new Error(`Unknown element symbol: "${el}"`)
    const subtotal = w * count
    mass += subtotal
    breakdown.push({ el, count, subtotal })
  }
  return { mass, breakdown }
}

// Splits on hydrate separators (·, *, .) with an optional leading multiplier,
// e.g. "CuSO4·5H2O" → CuSO4 + 5×H2O
function _parseFormula(formula) {
  const total = {}
  const parts = formula.split(/[·*]/).map(s => s.trim()).filter(Boolean)
  for (let part of parts) {
    let mult = 1
    const m = part.match(/^(\d+)(.+)/)
    if (m) { mult = parseInt(m[1], 10); part = m[2] }
    const counts = _parseFormulaGroup(part)
    for (const [el, n] of Object.entries(counts)) total[el] = (total[el] || 0) + n * mult
  }
  return total
}

// Recursive-descent parser for element groups & parentheses, e.g. "Ca(OH)2"
function _parseFormulaGroup(str) {
  let i = 0
  function parse() {
    const counts = {}
    while (i < str.length) {
      const c = str[i]
      if (c === '(' || c === '[') {
        i++
        const inner = parse()
        i++ // skip closing bracket
        let numStr = ''
        while (i < str.length && /\d/.test(str[i])) { numStr += str[i]; i++ }
        const mult = numStr ? parseInt(numStr, 10) : 1
        for (const [el, n] of Object.entries(inner)) counts[el] = (counts[el] || 0) + n * mult
      } else if (c === ')' || c === ']') {
        return counts
      } else if (/[A-Z]/.test(c)) {
        let el = c; i++
        while (i < str.length && /[a-z]/.test(str[i])) { el += str[i]; i++ }
        let numStr = ''
        while (i < str.length && /\d/.test(str[i])) { numStr += str[i]; i++ }
        const n = numStr ? parseInt(numStr, 10) : 1
        counts[el] = (counts[el] || 0) + n
      } else {
        i++ // skip whitespace / unrecognised characters
      }
    }
    return counts
  }
  return parse()
}

// ── Solution prep calculator ────────────────────────────────────────────────────
function _labRenderSolution() {
  const mw = window._labMolarMass
  return `
  <div class="bg-white rounded-2xl border border-slate-200 p-5">
    <h3 class="text-sm font-bold text-slate-700 mb-1">🧂 Solution Prep</h3>
    <p class="text-xs text-slate-400 mb-4">Calculates the mass of solute needed to make a solution of a given molarity and volume.</p>
    <div class="grid grid-cols-2 gap-3 mb-3">
      <div><label class="label">Molar mass (g/mol)</label>
        <input id="lab-sol-mw" type="number" class="input" value="${mw != null ? mw.toFixed(3) : ''}" oninput="_labCalcSolution()" placeholder="e.g. 58.44"/>
        ${mw != null ? `<p class="text-[10px] text-slate-400 mt-1">Pulled from the Molar Mass tab</p>` : ''}
      </div>
      <div><label class="label">Target concentration (M, mol/L)</label>
        <input id="lab-sol-conc" type="number" class="input" oninput="_labCalcSolution()" placeholder="e.g. 0.1"/></div>
      <div class="col-span-2"><label class="label">Target volume (mL)</label>
        <input id="lab-sol-vol" type="number" class="input" oninput="_labCalcSolution()" placeholder="e.g. 500"/></div>
    </div>
    <div id="lab-sol-result" class="text-sm font-semibold text-indigo-700 min-h-[20px]"></div>
  </div>`
}

function _labCalcSolution() {
  const out = document.getElementById('lab-sol-result')
  if (!out) return
  const mw    = parseFloat(document.getElementById('lab-sol-mw').value)
  const conc  = parseFloat(document.getElementById('lab-sol-conc').value)
  const volMl = parseFloat(document.getElementById('lab-sol-vol').value)
  if (!isFinite(mw) || !isFinite(conc) || !isFinite(volMl)) {
    out.className = 'text-sm font-semibold text-slate-400 min-h-[20px]'
    out.textContent = 'Fill in all three fields.'
    return
  }
  const mass = mw * conc * (volMl / 1000)
  out.className = 'text-sm font-semibold text-indigo-700 min-h-[20px]'
  out.innerHTML = `Weigh out <strong>${mass.toFixed(3)} g</strong> and dissolve in ${volMl} mL to make a ${conc} M solution.`
}
