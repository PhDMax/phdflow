// Auto-commit all changes and push to GitHub.
// Usage:  node scripts/push.mjs
//
// Generates a commit message by categorising which files changed.
// Commits everything, then pushes to origin/master.

import { execSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function run(cmd, opts = {}) {
  const out = execSync(cmd, { cwd: ROOT, encoding: 'utf-8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts })
  return out ? out.trim() : ''
}

// ── Check status ──────────────────────────────────────────────────────────────

const rawStatus = run('git status --porcelain', { silent: true })
const hasUnpushed = (() => {
  try { return run('git log origin/master..HEAD --oneline', { silent: true }).length > 0 }
  catch { return false }
})()

if (!rawStatus && !hasUnpushed) {
  console.log('✓ Nothing to commit or push — already up to date')
  process.exit(0)
}

// ── Generate commit message ───────────────────────────────────────────────────

if (rawStatus) {
  const lines = rawStatus.split('\n').filter(Boolean)
  const files  = lines.map(l => l.slice(3).trim())

  // Categorise by file path
  const viewFiles = files
    .filter(f => /^src[\\/]views[\\/].+\.js$/.test(f))
    .map(f => f.replace(/^src[\\/]views[\\/]/, '').replace(/\.js$/, ''))

  const scriptFiles  = files.filter(f => /^scripts[\\/]/.test(f))
  const docFiles     = files.filter(f => /^docs[\\/]/.test(f))
  const cssFiles     = files.filter(f => /\.css$/.test(f))
  const htmlChanged  = files.some(f => f === 'src/index.html' || f === 'src\\index.html')
  const rendChanged  = files.some(f => f === 'src/renderer.js' || f === 'src\\renderer.js')
  const pkgChanged   = files.some(f => f === 'package.json')
  const readmeChanged= files.some(f => /README/i.test(f))
  const claudeChanged= files.some(f => /CLAUDE/i.test(f))

  // Build a human-readable message
  const parts = []
  if (viewFiles.length > 0) parts.push(
    viewFiles.length === 1 ? viewFiles[0] : `${viewFiles[0]} +${viewFiles.length - 1} views`
  )
  if (htmlChanged || rendChanged)  parts.push('app shell')
  if (scriptFiles.length > 0)      parts.push('scripts')
  if (cssFiles.length > 0)         parts.push('styles')
  if (docFiles.length > 0)         parts.push('docs')
  if (pkgChanged)                  parts.push('config')
  if (readmeChanged)               parts.push('README')
  if (claudeChanged)               parts.push('session notes')

  // Pick conventional-commit prefix
  const prefix = viewFiles.length > 0 ? 'feat'
    : docFiles.length > 0 || readmeChanged ? 'docs'
    : cssFiles.length > 0 ? 'style'
    : 'chore'

  const summary = parts.length > 0 ? parts.join(', ') : 'session updates'
  const message = `${prefix}: ${summary}`

  console.log(`\n📝  Committing: ${message}`)
  run('git add -A')
  run(`git commit -m "${message}"`)
} else {
  console.log('✓  Nothing new to commit — pushing existing commits')
}

// ── Push ─────────────────────────────────────────────────────────────────────

console.log('\n🚀  Pushing to GitHub…')
run('git push origin master')
console.log('\n✅  Push complete\n')
