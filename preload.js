const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // ── Core store ────────────────────────────────────────────────────────────
  storeGet:          (key)               => ipcRenderer.invoke('store-get', key),
  storeSet:          (key, value)        => ipcRenderer.invoke('store-set', key, value),
  openExternal:      (url)               => ipcRenderer.invoke('open-external', url),
  openFolder:        (p)                 => ipcRenderer.invoke('open-folder',   p),
  getWorkspaceDir:       ()         => ipcRenderer.invoke('get-workspace-dir'),
  openSpreadsheetDialog: ()         => ipcRenderer.invoke('open-spreadsheet-dialog'),
  readSpreadsheet:       (fp)       => ipcRenderer.invoke('read-spreadsheet', fp),
  readPdfTable:          (fp)       => ipcRenderer.invoke('read-pdf-table', fp),
  watchDataFile:         (fp)       => ipcRenderer.invoke('watch-data-file', fp),
  unwatchDataFile:       (fp)       => ipcRenderer.invoke('unwatch-data-file', fp),
  onDataFileChanged:     (cb)       => ipcRenderer.on('data-file-changed', (_, fp) => cb(fp)),
  getAppVersion:     ()                  => ipcRenderer.invoke('get-app-version'),

  // ── Dialogs ───────────────────────────────────────────────────────────────
  openPdfDialog:     ()                  => ipcRenderer.invoke('open-pdf-dialog'),
  openSaveDialog:    (opts)              => ipcRenderer.invoke('open-save-dialog', opts),
  openCitationDialog:()                  => ipcRenderer.invoke('open-citation-dialog'),
  openImportDialog:  ()                  => ipcRenderer.invoke('open-import-dialog'),

  // ── File I/O ──────────────────────────────────────────────────────────────
  writeTextFile:     (dest, text)        => ipcRenderer.invoke('write-text-file', dest, text),
  writeBinaryFile:   (dest, base64)      => ipcRenderer.invoke('write-binary-file', dest, base64),
  readBinaryFile:    (src)               => ipcRenderer.invoke('read-binary-file', src),
  openDataFolder:    ()                  => ipcRenderer.invoke('open-data-folder'),
  getDataDir:        ()                  => ipcRenderer.invoke('get-data-dir'),

  // ── PDF tools ─────────────────────────────────────────────────────────────
  parsePdf:          (filepath)          => ipcRenderer.invoke('parse-pdf', filepath),
  mergePdfs:         (paths, dest)       => ipcRenderer.invoke('merge-pdfs', paths, dest),
  splitPdf:          (path, ranges)      => ipcRenderer.invoke('split-pdf', path, ranges),
  exportToPdf:       (html, dest)        => ipcRenderer.invoke('export-to-pdf', html, dest),
  rotatePdf:         (fp,dest,rot,pages) => ipcRenderer.invoke('rotate-pdf', fp, dest, rot, pages),
  addPageNumbers:    (fp, dest, opts)    => ipcRenderer.invoke('add-page-numbers', fp, dest, opts),
  removePages:       (fp, dest, pages)   => ipcRenderer.invoke('remove-pages', fp, dest, pages),
  readPdfMetadata:   (fp)                => ipcRenderer.invoke('read-pdf-metadata', fp),
  editPdfMetadata:   (fp, dest, meta)    => ipcRenderer.invoke('edit-pdf-metadata', fp, dest, meta),
  addWatermark:      (fp, dest, opts)    => ipcRenderer.invoke('add-watermark', fp, dest, opts),
  insertBlankPages:  (fp, dest, opts)    => ipcRenderer.invoke('insert-blank-pages', fp, dest, opts),
  cropPdf:           (fp, dest, opts)    => ipcRenderer.invoke('crop-pdf', fp, dest, opts),
  imagesToPdf:       (paths, dest)       => ipcRenderer.invoke('images-to-pdf', paths, dest),
  rebuildPdf:        (fp, dest, pages)   => ipcRenderer.invoke('rebuild-pdf', fp, dest, pages),
  openImageDialog:   ()                  => ipcRenderer.invoke('open-image-dialog'),
  openFolderDialog:  (opts)              => ipcRenderer.invoke('open-folder-dialog', opts),
  ocrPdf:            (fp, dest, pages)   => ipcRenderer.invoke('ocr-pdf', fp, dest, pages),
  onOcrProgress:     (cb)                => ipcRenderer.on('ocr-progress', (_, d) => cb(d)),

  // ── Research APIs ─────────────────────────────────────────────────────────
  searchResearchers:     (opts)              => ipcRenderer.invoke('search-researchers', opts),
  researcherCacheGet:    (name)              => ipcRenderer.invoke('researcher-cache-get', name),
  researcherCacheSet:    (opts)              => ipcRenderer.invoke('researcher-cache-set', opts),
  researcherCacheList:   ()                  => ipcRenderer.invoke('researcher-cache-list'),
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
  sendFeedback:      (opts)              => ipcRenderer.invoke('send-feedback', opts),
  testApi:           (name)              => ipcRenderer.invoke('test-api', name),
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
  getUpdateState:    ()                  => ipcRenderer.invoke('get-update-state'),
  installUpdate:     ()                  => ipcRenderer.invoke('updater-install'),
  onUpdateStatus:    (cb)                => ipcRenderer.on('update-status', (_, d) => cb(d)),
  quitApp:           ()                  => ipcRenderer.invoke('quit-app'),

  // ── Live grant search ─────────────────────────────────────────────────────
  searchGrantsGov:   (opts) => ipcRenderer.invoke('search-grants-gov',    opts),
  searchEuCordis:    (opts) => ipcRenderer.invoke('search-eu-cordis',     opts),
  searchUkri:        (opts) => ipcRenderer.invoke('search-ukri',          opts),
  searchNihReporter: (opts) => ipcRenderer.invoke('search-nih-reporter',  opts),
  searchNsfAwards:   (opts) => ipcRenderer.invoke('search-nsf-awards',    opts),

  // ── Odysseus managed instance ─────────────────────────────────────────────
  odyFind:           ()        => ipcRenderer.invoke('odysseus-managed-find'),
  odySetDir:         (dir)     => ipcRenderer.invoke('odysseus-managed-set-dir', dir),
  odyStart:          (dir)     => ipcRenderer.invoke('odysseus-managed-start', dir),
  odyStop:           ()        => ipcRenderer.invoke('odysseus-managed-stop'),
  odyStatus:         ()        => ipcRenderer.invoke('odysseus-managed-status'),
  odySetAutoStart:   (enabled) => ipcRenderer.invoke('odysseus-managed-set-autostart', enabled),
  onOdyStatus:       (cb)      => ipcRenderer.on('odysseus-managed-status', (_, d) => cb(d)),
  onOdyLog:          (cb)      => ipcRenderer.on('odysseus-managed-log',    (_, d) => cb(d)),

  // ── Odysseus AI assistant ─────────────────────────────────────────────────
  odysseusPing:      (opts) => ipcRenderer.invoke('odysseus-ping', opts),
  odysseusChat:      (opts) => ipcRenderer.invoke('odysseus-chat', opts),

  // ── Reference manager integration ────────────────────────────────────────
  zoteroPing:          ()         => ipcRenderer.invoke('zotero-ping'),
  zoteroBbtCheck:      ()         => ipcRenderer.invoke('zotero-bbt-check'),
  zoteroFetchLibrary:  ()         => ipcRenderer.invoke('zotero-fetch-library'),
  libSetupEndnote:     ()         => ipcRenderer.invoke('lib-setup-endnote'),
  libWatchGet:         ()         => ipcRenderer.invoke('lib-watch-get'),
  libWatchSet:         (filePath) => ipcRenderer.invoke('lib-watch-set', filePath),
  libWatchRemove:      ()         => ipcRenderer.invoke('lib-watch-remove'),
  libReadFile:         (filePath) => ipcRenderer.invoke('lib-read-file', filePath),
  libOpenBibDialog:    ()         => ipcRenderer.invoke('lib-open-bib-dialog'),
  onLibFileChanged:    (cb)       => ipcRenderer.on('lib-file-changed', (_, d) => cb(d)),

  // ── Bundle sharing (Option A) ─────────────────────────────────────────────
  bundleExportProject: (opts)  => ipcRenderer.invoke('bundle-export-project', opts),
  bundleExportFull:    (opts)  => ipcRenderer.invoke('bundle-export-full', opts),
  bundleRead:          (src)   => ipcRenderer.invoke('bundle-read', src),
  bundleImport:        (opts)  => ipcRenderer.invoke('bundle-import', opts),
  openBundleDialog:    ()      => ipcRenderer.invoke('open-bundle-dialog'),
  openBundleSaveDialog:(name)  => ipcRenderer.invoke('open-bundle-save-dialog', name),

  // ── Cloud folder sync (Option B) ──────────────────────────────────────────
  syncGetConfig:        ()       => ipcRenderer.invoke('sync-get-config'),
  syncSetFolder:        (folder) => ipcRenderer.invoke('sync-set-folder', folder),
  syncDisable:          ()       => ipcRenderer.invoke('sync-disable'),
  syncOpenFolderDialog: ()       => ipcRenderer.invoke('sync-open-folder-dialog'),
  syncWriteNow:         ()       => ipcRenderer.invoke('sync-write-now'),
  syncApply:            (opts)   => ipcRenderer.invoke('sync-apply', opts),
  onSyncIncoming:       (cb)     => ipcRenderer.on('sync-incoming',  (_, d) => cb(d)),

  // ── LAN peer discovery (Option C) ────────────────────────────────────────
  lanStart:            ()      => ipcRenderer.invoke('lan-start'),
  lanStop:             ()      => ipcRenderer.invoke('lan-stop'),
  lanGetPeers:         ()      => ipcRenderer.invoke('lan-get-peers'),
  lanSendBundle:       (opts)  => ipcRenderer.invoke('lan-send-bundle', opts),
  lanAcceptBundle:     ()      => ipcRenderer.invoke('lan-accept-bundle'),
  lanRejectBundle:     ()      => ipcRenderer.invoke('lan-reject-bundle'),
  onLanPeerDiscovered: (cb)    => ipcRenderer.on('lan-peer-discovered', (_, d) => cb(d)),
  onLanPeerLost:       (cb)    => ipcRenderer.on('lan-peer-lost',       (_, d) => cb(d)),
  onLanBundleIncoming: (cb)    => ipcRenderer.on('lan-bundle-incoming', (_, d) => cb(d)),
})
