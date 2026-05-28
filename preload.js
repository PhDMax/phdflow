const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // ── Core store ────────────────────────────────────────────────────────────
  storeGet:          (key)               => ipcRenderer.invoke('store-get', key),
  storeSet:          (key, value)        => ipcRenderer.invoke('store-set', key, value),
  openExternal:      (url)               => ipcRenderer.invoke('open-external', url),
  getAppVersion:     ()                  => ipcRenderer.invoke('get-app-version'),

  // ── Dialogs ───────────────────────────────────────────────────────────────
  openPdfDialog:     ()                  => ipcRenderer.invoke('open-pdf-dialog'),
  openSaveDialog:    (opts)              => ipcRenderer.invoke('open-save-dialog', opts),
  openCitationDialog:()                  => ipcRenderer.invoke('open-citation-dialog'),
  openImportDialog:  ()                  => ipcRenderer.invoke('open-import-dialog'),

  // ── File I/O ──────────────────────────────────────────────────────────────
  writeTextFile:     (dest, text)        => ipcRenderer.invoke('write-text-file', dest, text),
  writeBinaryFile:   (dest, base64)      => ipcRenderer.invoke('write-binary-file', dest, base64),
  openDataFolder:    ()                  => ipcRenderer.invoke('open-data-folder'),

  // ── PDF tools ─────────────────────────────────────────────────────────────
  parsePdf:          (filepath)          => ipcRenderer.invoke('parse-pdf', filepath),
  mergePdfs:         (paths, dest)       => ipcRenderer.invoke('merge-pdfs', paths, dest),
  splitPdf:          (path, ranges)      => ipcRenderer.invoke('split-pdf', path, ranges),
  exportToPdf:       (html, dest)        => ipcRenderer.invoke('export-to-pdf', html, dest),
  rotatePdf:         (fp,dest,rot,pages) => ipcRenderer.invoke('rotate-pdf', fp, dest, rot, pages),
  addPageNumbers:    (fp, dest, opts)    => ipcRenderer.invoke('add-page-numbers', fp, dest, opts),
  removePages:       (fp, dest, pages)   => ipcRenderer.invoke('remove-pages', fp, dest, pages),

  // ── Research APIs ─────────────────────────────────────────────────────────
  searchResearchers: (query)             => ipcRenderer.invoke('search-researchers', query),
  searchPapers:      (topics, days)      => ipcRenderer.invoke('search-papers', topics, days),
  fetchNews:         (feeds)             => ipcRenderer.invoke('fetch-news', feeds),
  fetchICS:          (url)               => ipcRenderer.invoke('fetch-ics', url),

  // ── Vault (3FA secure storage) ────────────────────────────────────────────
  vaultStatus:       ()                  => ipcRenderer.invoke('vault-status'),
  vaultSetup:        (opts)              => ipcRenderer.invoke('vault-setup', opts),
  vaultStep1:        (password)          => ipcRenderer.invoke('vault-step1', password),
  vaultStep2:        (token)             => ipcRenderer.invoke('vault-step2', token),
  vaultStep3Send:    ()                  => ipcRenderer.invoke('vault-step3-send'),
  vaultStep3Verify:  (token)             => ipcRenderer.invoke('vault-step3-verify', token),
  vaultLock:         ()                  => ipcRenderer.invoke('vault-lock'),
  vaultGetEntries:   ()                  => ipcRenderer.invoke('vault-get-entries'),
  vaultSaveEntry:    (entry)             => ipcRenderer.invoke('vault-save-entry', entry),
  vaultDeleteEntry:  (id)                => ipcRenderer.invoke('vault-delete-entry', id),
  onVaultLocked:     (cb)                => ipcRenderer.on('vault-locked', cb),

  // ── Feedback & diagnostics ────────────────────────────────────────────────
  sendDiscord:       (opts)              => ipcRenderer.invoke('send-discord', opts),
  testApi:           (name)              => ipcRenderer.invoke('test-api', name),
  testDiscordWebhook:(url)               => ipcRenderer.invoke('test-discord-webhook', url),
  testSmtp:          (opts)              => ipcRenderer.invoke('test-smtp', opts),

  // ── Data backup / restore ─────────────────────────────────────────────────
  exportData:        (opts)              => ipcRenderer.invoke('export-data', opts),
  importData:        (opts)              => ipcRenderer.invoke('import-data', opts),

  // ── App Authentication ────────────────────────────────────────────────────
  authStatus:        ()                  => ipcRenderer.invoke('auth-status'),
  authSetup:         (opts)              => ipcRenderer.invoke('auth-setup', opts),
  authLogin:         (password)          => ipcRenderer.invoke('auth-login', password),
  authLock:          ()                  => ipcRenderer.invoke('auth-lock'),
  authGetName:       ()                  => ipcRenderer.invoke('auth-get-name'),
  authChangePw:      (opts)              => ipcRenderer.invoke('auth-change-password', opts),
  onAuthLocked:      (cb)                => ipcRenderer.on('auth-locked', cb),

  // ── Update & Quit ─────────────────────────────────────────────────────────
  checkForUpdates:   ()                  => ipcRenderer.invoke('check-for-updates'),
  installUpdate:     ()                  => ipcRenderer.invoke('updater-install'),
  onUpdateStatus:    (cb)                => ipcRenderer.on('update-status', (_, d) => cb(d)),
  quitApp:           ()                  => ipcRenderer.invoke('quit-app'),
})
