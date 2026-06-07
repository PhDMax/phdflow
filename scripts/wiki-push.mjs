// Commit and push all wiki changes to GitHub.
// Usage:  node scripts/wiki-push.mjs
//
// Reads GITHUB_TOKEN from .env in the main repo.
// Operates on the wiki repo at C:\phdflow-wiki\.

import { readFileSync, existsSync } from 'fs'
import { execSync }                 from 'child_process'
import { resolve, dirname, join }   from 'path'
import { fileURLToPath }            from 'url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const ROOT       = resolve(SCRIPT_DIR, '..')
const WIKI_DIR   = 'C:\\phdflow-wiki'
const WIKI_REMOTE = 'https://github.com/PhDMax/phdflow.wiki.git'

function run(cmd, opts = {}) {
  const out = execSync(cmd, {
    cwd:      opts.cwd || ROOT,
    encoding: 'utf-8',
    stdio:    opts.silent ? 'pipe' : 'inherit',
    ...opts,
  })
  return out ? out.trim() : ''
}

function loadToken() {
  if (process.env.GITHUB_TOKEN) {
    const t = process.env.GITHUB_TOKEN.trim()
    if (t.length < 10) throw new Error('GITHUB_TOKEN env var looks truncated.')
    return t
  }
  const envPath = join(ROOT, '.env')
  if (existsSync(envPath)) {
    let raw = readFileSync(envPath)
    let text
    if (raw[0] === 0xFF && raw[1] === 0xFE) text = raw.slice(2).toString('utf16le')
    else if (raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF) text = raw.slice(3).toString('utf8')
    else text = raw.toString('utf8')
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^GITHUB_TOKEN\s*=\s*(.+)/)
      if (m) {
        const t = m[1].trim()
        if (t.length < 10) throw new Error(`.env GITHUB_TOKEN looks truncated.`)
        return t
      }
    }
  }
  throw new Error('No GITHUB_TOKEN found in .env')
}

;(async () => {
  if (!existsSync(WIKI_DIR)) {
    console.error(`✗ Wiki directory not found: ${WIKI_DIR}`); process.exit(1)
  }

  const token = loadToken()
  console.log('✓ GitHub token loaded')

  // Check for changes in wiki
  const status = run('git status --porcelain', { silent: true, cwd: WIKI_DIR })
  const hasUnpushed = (() => {
    try { return run('git log origin/master..HEAD --oneline', { silent: true, cwd: WIKI_DIR }).length > 0 }
    catch { return false }
  })()

  if (!status && !hasUnpushed) {
    console.log('✓ Wiki is up to date — nothing to commit or push')
    process.exit(0)
  }

  // Get current app version for the commit message
  const pkg     = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
  const version = pkg.version

  if (status) {
    // Count changed files
    const lines    = status.split('\n').filter(Boolean)
    const newFiles = lines.filter(l => l.startsWith('?')).length
    const modFiles = lines.filter(l => !l.startsWith('?')).length

    const parts = []
    if (modFiles > 0) parts.push(`${modFiles} updated`)
    if (newFiles > 0) parts.push(`${newFiles} new`)
    const summary = parts.join(', ')

    const msg = `docs: sync wiki with v${version} (${summary})`
    console.log(`\n📝  Committing: ${msg}`)
    run('git add -A', { cwd: WIKI_DIR })
    run(`git commit -m "${msg}"`, { cwd: WIKI_DIR })
  } else {
    console.log('✓  No new changes — pushing existing commits')
  }

  // Push with token auth, then restore clean URL
  console.log('\n🚀  Pushing wiki to GitHub…')
  const authedUrl = `https://PhDMax:${token}@github.com/PhDMax/phdflow.wiki.git`
  run(`git remote set-url origin "${authedUrl}"`, { cwd: WIKI_DIR })
  try {
    run('git push origin master', { cwd: WIKI_DIR })
  } finally {
    run(`git remote set-url origin "${WIKI_REMOTE}"`, { cwd: WIKI_DIR })
  }

  console.log('\n✅  Wiki pushed successfully\n')
})().catch(e => { console.error('\n✗', e.message); process.exit(1) })
