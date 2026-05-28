// ══ Setup Guide View ═══════════════════════════════════════════════════════════

function render_guide() {
  const vc = document.getElementById('view-content')
  vc.innerHTML = `
  ${pageHeader('📖 Setup Guide', '')}
  <div class="flex-1 overflow-y-auto p-6">
    <div class="max-w-2xl mx-auto space-y-6">

      <p class="text-sm text-slate-500">Get the most out of PhDFlow by connecting these optional integrations. Each one takes 2–5 minutes.</p>

      <!-- ── 1. Discord Webhook ──────────────────────────────────── -->
      ${_guideCard('💬', 'Discord Webhook', 'Used by the Feedback tab to send bug reports, feature ideas, and notes directly to your own Discord server.', [
        ['Create a Discord server', 'If you don\'t have one yet, open Discord → <strong>+</strong> (Add a Server) → Create My Own → For me and my friends.'],
        ['Open Integrations', 'Right-click your server name → <strong>Server Settings</strong> → <strong>Integrations</strong> → <strong>Webhooks</strong> → <strong>New Webhook</strong>.'],
        ['Name and channel', 'Give it a name like <em>PhDFlow</em>. Choose which channel messages should land in (e.g. #phd-notes). Click <strong>Copy Webhook URL</strong>.'],
        ['Paste into PhDFlow', 'Go to <button onclick="settingsTab(\'app\');showView(\'settings\')" class="text-indigo-600 hover:underline font-medium">Settings → App → Discord Webhook</button>. Paste the URL and click Save. Test it with the "Test" button.'],
      ])}

      <!-- ── 2. Vault Email OTP (SMTP) ──────────────────────────── -->
      ${_guideCard('🔐', 'Vault Email OTP', 'The Vault uses 3-factor authentication. The third factor is a one-time code sent to your email. This requires SMTP credentials from your email provider.', [
        ['Gmail — generate an App Password', 'Go to <strong>myaccount.google.com</strong> → Security → 2-Step Verification (must be enabled) → <strong>App Passwords</strong> → Select app: Mail → Select device: Other → type "PhDFlow" → Generate. Copy the 16-character password.'],
        ['Outlook / Microsoft 365', 'Go to <strong>account.microsoft.com</strong> → Security → Advanced security options → App passwords → Create a new app password. Copy it.'],
        ['University SMTP', 'Ask your IT department for outbound SMTP settings. Common format: smtp.youruni.edu, port 587. Use your university credentials.'],
        ['Enter in PhDFlow', 'Go to <button onclick="settingsTab(\'vault\');showView(\'settings\')" class="text-indigo-600 hover:underline font-medium">Settings → Vault → Set Up Vault</button>. During setup, enter your SMTP host, port, email address, and app password.'],
      ])}

      <!-- ── 3. Calendar Feeds (ICS) ────────────────────────────── -->
      ${_guideCard('📅', 'External Calendar Feeds', 'Connect your Google Calendar, Outlook, or any ICS-compatible calendar so events appear in the PhDFlow calendar alongside your research deadlines.', [
        ['Google Calendar', 'Open Google Calendar → click the <strong>⋮</strong> next to the calendar you want → <strong>Settings and sharing</strong> → scroll to <em>Integrate calendar</em> → copy the <strong>Secret address in iCal format</strong> (ends in .ics).'],
        ['Outlook / Microsoft 365', 'Open Outlook Calendar → right-click a calendar → <strong>Sharing and permissions</strong> → Publish → select "Can view all details" → copy the <strong>ICS link</strong>.'],
        ['Other / Generic ICS', 'Any URL ending in <code>.ics</code> works — university timetables, conference schedules, etc. The URL just needs to be publicly accessible.'],
        ['Connect in PhDFlow', 'Go to <button onclick="showView(\'calendar\')" class="text-indigo-600 hover:underline font-medium">Calendar</button> → click <strong>🔗 Connect</strong> in the top bar → paste the ICS URL → give it a name and colour → Save. PhDFlow syncs it automatically every hour.'],
      ])}

      <!-- ── 4. Literature Feed ─────────────────────────────────── -->
      ${_guideCard('📡', 'Literature Feed Topics', 'PhDFlow searches arXiv and OpenAlex automatically for new papers matching your research topics. No API key needed — just set up your keywords.', [
        ['Open topic settings', 'Go to <button onclick="settingsTab(\'app\');showView(\'settings\')" class="text-indigo-600 hover:underline font-medium">Settings → App → Literature Feed Topics</button>.'],
        ['Add a topic', 'Click <strong>+ Add Topic</strong>. Give it a label (e.g. "Machine Learning") and space-separated keywords (e.g. <code>transformer attention BERT</code>).'],
        ['Be specific', 'Broader keywords return more noise. Use field-specific jargon and combine 2–4 terms per topic for best results.'],
        ['Run the feed', 'Go to <button onclick="showView(\'news\')" class="text-indigo-600 hover:underline font-medium">Literature Feed</button> → click <strong>Refresh</strong>. PhDFlow fetches the latest matching papers from the last 7 days.'],
      ])}

      <!-- ── 5. Discover / Researcher Search ───────────────────── -->
      ${_guideCard('🔍', 'Discover Researchers', 'Search 260M+ papers and researchers across Semantic Scholar and OpenAlex — no account or API key required.', [
        ['Open Discover', 'Click <button onclick="showView(\'discover\')" class="text-indigo-600 hover:underline font-medium">Discover</button> in the sidebar.'],
        ['Search by name', 'Type a researcher\'s name. Results show their institution, h-index, and recent papers. Click a card to see their full profile.'],
        ['Save to Contacts', 'On any result card, click <strong>Save</strong> to add them to your Contacts network. Use the star to follow — PhDFlow will notify you when they publish new papers.'],
        ['Find collaborators', 'Use the Following tab to track people you\'ve saved. Their latest papers appear automatically.'],
      ])}

      <!-- Footer -->
      <div class="text-center pb-4">
        <p class="text-xs text-slate-400">Need help? Use the <button onclick="showView('feedback')" class="text-indigo-600 hover:underline">Feedback</button> tab to send a message, or open an issue on <button onclick="window.api.openExternal('https://github.com/PhDMax/phdflow')" class="text-indigo-600 hover:underline">GitHub</button>.</p>
      </div>

    </div>
  </div>`
}

function _guideCard(icon, title, desc, steps) {
  return `
  <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div class="flex items-center gap-3 p-5 border-b border-slate-100">
      <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">${icon}</div>
      <div>
        <h3 class="text-sm font-bold text-slate-900">${title}</h3>
        <p class="text-xs text-slate-500 mt-0.5">${desc}</p>
      </div>
    </div>
    <div class="p-5 space-y-3">
      ${steps.map(([label, detail], i) => `
      <div class="flex gap-3">
        <div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">${i+1}</div>
        <div>
          <p class="text-xs font-semibold text-slate-800">${label}</p>
          <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">${detail}</p>
        </div>
      </div>`).join('')}
    </div>
  </div>`
}
