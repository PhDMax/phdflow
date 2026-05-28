// ══ Support View ═══════════════════════════════════════════════════════════════

const BMAC_URL        = 'https://buymeacoffee.com/phdmax'
const BMAC_MONTHLY    = 'https://buymeacoffee.com/phdmax/membership'

function render_support() {
  const vc = document.getElementById('view-content')
  vc.innerHTML = `
  ${pageHeader('☕ Support PhDFlow', '')}
  <div class="flex-1 overflow-y-auto p-6">
    <div class="max-w-xl mx-auto space-y-5">

      <!-- Hero card -->
      <div class="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 text-center">
        <div class="text-4xl mb-3">☕</div>
        <h2 class="text-xl font-bold text-slate-900 mb-2">Keep PhDFlow going</h2>
        <p class="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
          PhDFlow is built and maintained by a single PhD student in spare time.
          It's free to use and open source — but your support helps fund development,
          server costs, and keeps new features coming.
        </p>
      </div>

      <!-- Donation options -->
      <div class="grid grid-cols-2 gap-4">

        <!-- One-time tip -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3">
          <div class="text-2xl">🎁</div>
          <div>
            <h3 class="font-bold text-slate-900 text-sm">One-time Tip</h3>
            <p class="text-xs text-slate-500 mt-1">Buy me a coffee whenever PhDFlow saves you time. Any amount helps.</p>
          </div>
          <button onclick="window.api.openExternal('${BMAC_URL}')"
            class="mt-auto w-full bg-amber-400 hover:bg-amber-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
            ☕ Buy me a coffee
          </button>
        </div>

        <!-- Monthly support -->
        <div class="bg-white border border-indigo-200 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden">
          <div class="absolute top-3 right-3 text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">Best</div>
          <div class="text-2xl">⭐</div>
          <div>
            <h3 class="font-bold text-slate-900 text-sm">Monthly Supporter</h3>
            <p class="text-xs text-slate-500 mt-1">Join as a recurring supporter and get your name in the credits + early access to new features.</p>
          </div>
          <button onclick="window.api.openExternal('${BMAC_MONTHLY}')"
            class="mt-auto w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
            ⭐ Become a supporter
          </button>
        </div>
      </div>

      <!-- What it funds -->
      <div class="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 class="text-sm font-bold text-slate-900 mb-3">What your support funds</h3>
        <div class="space-y-2">
          ${[
            ['🛠️','Continued development & new features'],
            ['🐛','Bug fixes and stability improvements'],
            ['📚','Research API costs (arXiv, OpenAlex integrations)'],
            ['🔒','Security audits and safe updates'],
          ].map(([icon, text]) => `
          <div class="flex items-start gap-2.5 text-sm text-slate-600">
            <span class="text-base leading-none mt-0.5">${icon}</span>
            <span>${text}</span>
          </div>`).join('')}
        </div>
      </div>

      <!-- Other ways to help -->
      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <h3 class="text-sm font-bold text-slate-900 mb-3">Other ways to help (free!)</h3>
        <div class="space-y-2 text-sm text-slate-600">
          <div class="flex items-center gap-2.5">
            <span>⭐</span>
            <span>Star the project on <button onclick="window.api.openExternal('https://github.com/PhDMax/phdflow')" class="text-indigo-600 hover:underline font-medium">GitHub</button></span>
          </div>
          <div class="flex items-center gap-2.5">
            <span>💬</span>
            <span>Share PhDFlow with fellow PhD students</span>
          </div>
          <div class="flex items-center gap-2.5">
            <span>🐛</span>
            <span>Report bugs via the <button onclick="showView('feedback')" class="text-indigo-600 hover:underline font-medium">Feedback</button> tab</span>
          </div>
        </div>
      </div>

    </div>
  </div>`
}
