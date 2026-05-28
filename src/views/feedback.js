// ══ Feedback View ══════════════════════════════════════════════════════════════
// Send feedback directly to your Discord server via webhook

function render_feedback() {
  const vc = document.getElementById('view-content')
  vc.innerHTML = `
  ${pageHeader('💬 Feedback', '')}
  <div class="flex-1 overflow-y-auto p-6">
    <div class="max-w-xl mx-auto space-y-5">

      <!-- Send feedback card -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 class="text-base font-bold text-slate-900 mb-1">Send Feedback</h3>
        <p class="text-xs text-slate-400 mb-4">
          Bug report, feature idea, or just a note — it goes straight to the developer. Everything stays between you and PhDFlow.
        </p>

        <div class="space-y-3">
          <!-- Type selector -->
          <div>
            <label class="label">Type</label>
            <div class="flex gap-2 flex-wrap">
              ${[['bug','🐛 Bug Report'],['feature','💡 Feature Idea'],['praise','⭐ What Works Well'],['other','💬 Other']].map(([v,l]) =>
                `<label class="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="radio" name="fb-type" value="${v}" ${v==='bug'?'checked':''} class="accent-indigo-600"/>
                  <span class="text-xs font-medium text-slate-700">${l}</span>
                </label>`
              ).join('')}
            </div>
          </div>

          <!-- Message -->
          <div>
            <label class="label">Message *</label>
            <textarea id="fb-msg" rows="5" class="input resize-none"
              placeholder="Describe the bug, idea, or note in as much detail as you like…"></textarea>
          </div>

          <!-- App context toggle -->
          <label class="flex items-center gap-2 text-xs cursor-pointer select-none">
            <input type="checkbox" id="fb-ctx" class="accent-indigo-600" checked/>
            <span class="text-slate-600">Include app version in report</span>
          </label>

          <div id="fb-status" class="text-xs text-slate-400"></div>

          <button onclick="sendFeedback()" class="btn-primary w-full py-2.5">
            Send Feedback →
          </button>
        </div>
      </div>

      <!-- Tips card -->
      <div class="grid grid-cols-3 gap-3">
        ${[
          ['🐛','Bug Reports','Include what you did, what you expected, and what actually happened.'],
          ['💡','Feature Ideas','Be specific: "I wish I could X when Y" is more useful than "add more features."'],
          ['⭐','What Works','Positive feedback helps know what to keep. Don\'t just report problems!']
        ].map(([ic,t,d]) => `
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <div class="text-2xl mb-2">${ic}</div>
          <p class="text-xs font-semibold text-slate-700 mb-1">${t}</p>
          <p class="text-[11px] text-slate-400 leading-relaxed">${d}</p>
        </div>`).join('')}
      </div>

      <!-- Privacy note -->
      <p class="text-xs text-slate-400 text-center">
        Feedback is sent directly from your device to your own Discord server via your webhook.<br/>
        PhDFlow never sees or stores your feedback.
      </p>

      <!-- Support nudge -->
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
        <div class="text-3xl flex-shrink-0">☕</div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-slate-800">PhDFlow is free to use</p>
          <p class="text-xs text-slate-500 mt-0.5">If it saves you time, consider buying me a coffee — it keeps development going.</p>
        </div>
        <button onclick="showView('support')"
          class="flex-shrink-0 bg-amber-400 hover:bg-amber-500 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors whitespace-nowrap">
          Support ☕
        </button>
      </div>

    </div>
  </div>`
}

async function sendFeedback() {
  const msg  = document.getElementById('fb-msg')?.value.trim()
  const type = document.querySelector('input[name="fb-type"]:checked')?.value || 'other'
  const ctx  = document.getElementById('fb-ctx')?.checked
  const el   = document.getElementById('fb-status')

  if (!msg) { showToast('Write something first', 'error'); return }

  let fullMsg = msg
  if (ctx) {
    const ver = await api.getAppVersion().catch(() => '?')
    fullMsg += `\n\n*App version: ${ver} · Windows*`
  }

  if (el) el.innerHTML = `<span class="text-slate-400">Sending…</span>`
  const r = await api.sendFeedback({ message: fullMsg, type })

  if (r.success) {
    if (el) el.innerHTML = `<span class="text-emerald-600 font-semibold">✓ Feedback sent — thank you!</span>`
    document.getElementById('fb-msg').value = ''
    showToast('Feedback sent ✓')
  } else {
    if (el) el.innerHTML = `<span class="text-rose-500">✕ ${esc(r.error || 'Could not send — check your internet connection')}</span>`
  }
}
